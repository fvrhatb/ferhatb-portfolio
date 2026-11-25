// Sitedeki sabit dosya görsellerini (assets/images/*, /ferhatbayram.png, favicon, og-image...) ve dışarıdan bağlı görselleri
// Appwrite Storage'a taşır; içerikteki yolları /media/<kimlik> ile değiştirir. Birden çok kez çalıştırmak güvenlidir.
// Kullanım: npm run migrate:media            (önce ne yapacağını gösterir, "--yes" ile uygular)
const fs = require("fs");
const path = require("path");
const store = require("../server/store");
const media = require("../server/media");

const PUBLIC = path.join(__dirname, "..", "public");
const APPLY = process.argv.includes("--yes");
const LOCAL_RE = /^\/?(assets\/images\/[^?#]+|uploads\/[^?#]+|[\w.-]+\.(png|jpe?g|webp|gif|pdf))$/i;
const REMOTE_IMG = /^https?:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$|^https?:\/\/images\.unsplash\.com\//i;
const done = new Map(); // eski yol -> yeni adres

const localFile = (p) => path.join(PUBLIC, p.replace(/^\/+/, ""));

async function moveLocal(p) {
  if (done.has(p)) return done.get(p);
  const file = localFile(p);
  if (!fs.existsSync(file)) return null;
  const url = APPLY ? (await media.put(fs.readFileSync(file), path.basename(file))).url : `/media/(yeni)`;
  console.log(`  ${APPLY ? "↑" : "·"} ${p}  →  ${url}`);
  done.set(p, url);
  return url;
}

async function moveRemote(u) {
  if (done.has(u)) return done.get(u);
  try {
    const res = await fetch(u, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") || "";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("gif") ? "gif" : "jpg";
    const buf = Buffer.from(await res.arrayBuffer());
    const url = APPLY ? (await media.put(buf, `dis-gorsel.${ext}`)).url : `/media/(yeni)`;
    console.log(`  ${APPLY ? "↑" : "·"} ${u.slice(0, 70)}…  →  ${url}`);
    done.set(u, url);
    return url;
  } catch (err) {
    console.log(`  ! ${u.slice(0, 70)} alınamadı (${err.message}); olduğu gibi bırakıldı`);
    return null;
  }
}

async function walk(node, changed, key = "") {
  if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) node[i] = await walkValue(node[i], changed, key); return node; }
  if (node && typeof node === "object") { for (const k of Object.keys(node)) node[k] = await walkValue(node[k], changed, k); return node; }
  return node;
}

async function walkValue(v, changed, key) {
  if (typeof v === "string") {
    if (v.startsWith("/media/") || !v) return v;
    if (key === "link" || key === "url" || key === "web" || key === "linkedin") return v; // bağlantılar görsel değil
    let next = null;
    if (LOCAL_RE.test(v)) next = await moveLocal(v);
    else if (["avatar", "spotifyFallbackArt"].includes(key) && REMOTE_IMG.test(v)) next = await moveRemote(v);
    if (next) { changed.n += 1; return next; }
    return v;
  }
  return walk(v, changed, key);
}

(async () => {
  if (store.status().mode !== "appwrite") { console.error("\n[!] Appwrite bağlı değil (.env). Önce APPWRITE_* ayarlarını gir.\n"); process.exit(1); }
  console.log(`\nGörseller Appwrite Storage'a taşınıyor ${APPLY ? "" : "(ÖNİZLEME — uygulamak için: npm run migrate:media -- --yes)"}\n`);
  const content = await store.getAll({ fresh: true });

  if (APPLY) {
    fs.mkdirSync(path.join(__dirname, "..", "data"), { recursive: true });
    const backup = path.join(__dirname, "..", "data", `backup-before-media-${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(backup, JSON.stringify(content, null, 2));
    console.log(`  Yedek: ${backup}\n`);
  }

  // Dosyası olmayan çalışma alanı fotoğrafı: yedek görseli asıl görsel yap
  const about = content.about;
  if (about.workspaceImage && !about.workspaceImage.startsWith("/media/") && !fs.existsSync(localFile(about.workspaceImage)) && about.workspaceFallback) {
    about.workspaceImage = about.workspaceFallback;
  }

  let total = 0;
  for (const section of store.SECTIONS) {
    const changed = { n: 0 };
    const copy = structuredClone(content[section]);
    await walk(copy, changed);
    if (changed.n) {
      total += changed.n;
      if (APPLY) await store.setSection(section, copy);
      console.log(`  ✓ "${section}" bölümünde ${changed.n} yol güncellendi\n`);
    }
  }
  console.log(total ? `Toplam ${total} yol ${APPLY ? "güncellendi" : "güncellenecek"}.\n` : "Taşınacak bir şey kalmadı: her şey zaten veritabanında.\n");
})().catch((err) => { console.error("\n[!]", err.message); process.exit(1); });
