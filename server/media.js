// Görsel ve PDF depolama.
// - Appwrite bağlıysa: dosyalar Appwrite Storage'daki "ferbmedia" kovasında tutulur; site /media/<kimlik> adresinden sunar.
//   (Sunucu dosyaları silinse, hosting değişse bile görseller kaybolmaz.)
// - Appwrite yoksa: public/uploads klasörü kullanılır (yerelde denemek için).
// Sunulan dosyalar data/media-cache altında önbelleğe alınır; her istek Appwrite'a gitmez.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./env");
const store = require("./store");

const aw = config.appwrite;
const BUCKET = process.env.APPWRITE_BUCKET_ID || "ferbmedia";
const useStorage = store.status().mode === "appwrite";
const CACHE = path.join(__dirname, "..", "data", "media-cache");
const LOCAL = path.join(__dirname, "..", "public", "uploads");
const ALLOWED = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", pdf: "application/pdf" };
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/;

let bucketReady = null;

async function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      try { await store.appwrite("GET", `/storage/buckets/${BUCKET}`); }
      catch (err) {
        if (err.status !== 404) throw err;
        await store.appwrite("POST", "/storage/buckets", {
          bucketId: BUCKET, name: "Site görselleri", permissions: [], fileSecurity: false, enabled: true,
          maximumFileSize: 20 * 1024 * 1024, allowedFileExtensions: Object.keys(ALLOWED), compression: "none", encryption: false, antivirus: false
        });
      }
    })().catch((err) => { bucketReady = null; throw err; });
  }
  return bucketReady;
}

async function rawFetch(method, route, body) {
  const res = await fetch(`${aw.endpoint}${route}`, { method, headers: { "X-Appwrite-Project": aw.projectId, "X-Appwrite-Key": aw.apiKey }, body });
  return res;
}

const slug = (name) => path.basename(name, path.extname(name)).toLocaleLowerCase("tr").normalize("NFKD").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 18) || "dosya";

function extOf(name) { return path.extname(String(name || "")).slice(1).toLowerCase(); }

async function put(buffer, originalName) {
  const ext = extOf(originalName);
  if (!ALLOWED[ext]) throw Object.assign(new Error("Yalnızca PNG, JPG, WEBP, GIF veya PDF yüklenebilir."), { status: 400 });
  if (!buffer || !buffer.length) throw Object.assign(new Error("Dosya boş."), { status: 400 });
  const base = `${Date.now().toString(36)}-${slug(originalName)}`;

  if (!useStorage) {
    fs.mkdirSync(LOCAL, { recursive: true });
    const name = `${base}.${ext}`;
    fs.writeFileSync(path.join(LOCAL, name), buffer);
    return { id: name, url: `/uploads/${name}` };
  }
  await ensureBucket();
  const id = `${base}-${crypto.randomBytes(2).toString("hex")}`.slice(0, 36).replace(/[^A-Za-z0-9._-]/g, "-");
  const form = new FormData();
  form.append("fileId", id);
  form.append("file", new Blob([buffer], { type: ALLOWED[ext] }), `${slug(originalName)}.${ext}`);
  const res = await rawFetch("POST", `/storage/buckets/${BUCKET}/files`, form);
  const text = await res.text();
  if (!res.ok) {
    let msg = text; try { msg = JSON.parse(text).message; } catch { /* düz metin */ }
    throw Object.assign(new Error(`Dosya yüklenemedi: ${msg}`), { status: 502 });
  }
  return { id, url: `/media/${id}` };
}

// Sunulacak dosyayı yerel önbelleğe indirir; { file, mime } döner (yoksa null)
async function resolve(id) {
  if (!useStorage || !ID_RE.test(id)) return null;
  const bin = path.join(CACHE, id);
  const metaFile = `${bin}.json`;
  if (fs.existsSync(bin) && fs.existsSync(metaFile)) {
    try { return { file: bin, mime: JSON.parse(fs.readFileSync(metaFile, "utf8")).mime }; } catch { /* bozuk önbellek: yeniden indir */ }
  }
  const metaRes = await rawFetch("GET", `/storage/buckets/${BUCKET}/files/${id}`);
  if (metaRes.status === 404) return null;
  if (!metaRes.ok) throw new Error(`Appwrite ${metaRes.status}`);
  const meta = await metaRes.json();
  const dl = await rawFetch("GET", `/storage/buckets/${BUCKET}/files/${id}/view`);
  if (!dl.ok) throw new Error(`Appwrite ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  const ext = extOf(meta.name);
  const mime = ALLOWED[ext] || meta.mimeType || "application/octet-stream";
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(bin, buf);
  fs.writeFileSync(metaFile, JSON.stringify({ mime }));
  return { file: bin, mime };
}

async function list() {
  const out = [];
  if (useStorage) {
    try {
      await ensureBucket();
      const res = await store.appwrite("GET", `/storage/buckets/${BUCKET}/files?queries[]=${encodeURIComponent(JSON.stringify({ method: "limit", values: [100] }))}&queries[]=${encodeURIComponent(JSON.stringify({ method: "orderDesc", attribute: "$createdAt" }))}`);
      for (const f of res.files || []) out.push({ id: f.$id, name: f.name, url: `/media/${f.$id}`, size: f.sizeOriginal, mime: f.mimeType });
    } catch (err) { console.error("[media] liste alınamadı:", err.message); }
  } else if (fs.existsSync(LOCAL)) {
    for (const f of fs.readdirSync(LOCAL).filter((x) => !x.startsWith(".")).sort().reverse()) out.push({ id: f, name: f, url: `/uploads/${f}` });
  }
  return out;
}

async function remove(id) {
  if (!useStorage || !ID_RE.test(id)) return;
  await store.appwrite("DELETE", `/storage/buckets/${BUCKET}/files/${id}`);
  for (const f of [path.join(CACHE, id), path.join(CACHE, `${id}.json`)]) fs.rmSync(f, { force: true });
}

module.exports = { put, resolve, list, remove, ALLOWED, useStorage, BUCKET };
