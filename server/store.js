// İçerik deposu.
// - Appwrite bilgileri .env'de varsa: her bölüm (profile, about, education...) Appwrite'ta ayrı bir satır olarak tutulur.
// - Yoksa: data/content.json dosyası kullanılır (yerelde Appwrite'sız çalışmak için).
// Her iki durumda da son başarılı veri data/content.json'a yazılır; Appwrite geçici olarak erişilemezse site bu kopyayla açılır.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./env");
const defaults = require("./defaults.json");
const portfolioProject = require("./portfolio-project");

const SECTIONS = Object.keys(defaults);
const SNAPSHOT = path.join(__dirname, "..", "data", "content.json");
const CACHE_TTL_MS = 60 * 1000;

const aw = config.appwrite;
const useAppwrite = Boolean(aw.endpoint && aw.projectId && aw.apiKey);

let cache = null;
let cacheAt = 0;
let lastError = null;

// ---- Appwrite REST yardımcıları (SDK yerine fetch: sürüm uyumsuzluğu derdi yok) ----
async function appwrite(method, route, body) {
  const res = await fetch(`${aw.endpoint}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": aw.projectId,
      "X-Appwrite-Key": aw.apiKey
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(data.message || `Appwrite ${res.status}`);
    err.status = res.status;
    err.type = data.type;
    throw err;
  }
  return data;
}

// Appwrite TablesDB API (yeni sürüm): veritabanı > tablo > satır
const docsRoute = () => `/tablesdb/${aw.databaseId}/tables/${aw.collectionId}/rows`;

async function loadFromAppwrite() {
  const list = await appwrite("GET", docsRoute());
  const out = {};
  for (const doc of list.rows || []) {
    try { out[doc.$id] = JSON.parse(doc.data); } catch { /* bozuk belge: varsayılan kullanılır */ }
  }
  return out;
}

async function saveToAppwrite(section, value) {
  const data = { data: JSON.stringify(value) };
  try {
    await appwrite("PATCH", `${docsRoute()}/${section}`, { data });
  } catch (err) {
    if (err.status !== 404) throw err;
    await appwrite("POST", docsRoute(), { rowId: section, data, permissions: [] });
  }
}

// ---- Dosya yedeği ----
function readSnapshot() {
  try { return JSON.parse(fs.readFileSync(SNAPSHOT, "utf8")); } catch { return {}; }
}
function writeSnapshot(content) {
  fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
  fs.writeFileSync(SNAPSHOT, JSON.stringify(content, null, 2));
}

// Kayıtlı öğelerin (deneyim, eğitim, sertifika, proje) kalıcı kimliği olur; CV sürümleri hangi kaydı gösterip gizlediğini bu kimlikle tutar.
const STAMPED = ["cv", "education", "experience", "certificates", "projects", "settings", "profile", "about"];
const ID_SECTIONS = { education: "school", experience: "company", certificates: "title", projects: "title" };

// Eski Appwrite kayitlari veya yedekler geri yuklense bile tek kalici domaini koru.
function canonicalizeDomains(value) {
  if (typeof value === "string") return value.replace(/ferhatb\.(?:me|com\.tr)/gi, "ferhatb.com");
  if (Array.isArray(value)) return value.map(canonicalizeDomains);
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) value[key] = canonicalizeDomains(value[key]);
  }
  return value;
}

function ensureIds(section, value, { stable = false } = {}) {
  const nameKey = ID_SECTIONS[section];
  if (!nameKey || !Array.isArray(value.items)) return value;
  const seen = new Set(value.items.map((it) => it && it.id).filter(Boolean));
  value.items.forEach((it, i) => {
    if (!it || typeof it !== "object" || it.id) return;
    // stable: okuma sırasında her seferinde aynı kimlik üretilsin (deterministik); kayıt sırasında rastgele
    // Varsayılan kayıtlarla eşleşiyorsa onların kimliğini al (hazır CV sürümleri bu kimliklere bağlı)
    const second = (x) => x.period || x.issuer || x.year || "";
    const known = ((defaults[section] || {}).items || []).filter((x) => x.id && !seen.has(x.id) && x[nameKey] === it[nameKey]);
    const match = known.find((x) => second(x) === second(it)) || known[0];
    if (match) { seen.add(match.id); it.id = match.id; return; }
    let id = stable
      ? "k" + crypto.createHash("sha1").update(`${section}|${i}|${it[nameKey] || ""}`).digest("hex").slice(0, 8)
      : "k" + crypto.randomBytes(4).toString("hex");
    while (seen.has(id)) id += "x";
    seen.add(id);
    it.id = id;
  });
  return value;
}

// Eksik bölümleri/alanları varsayılanlarla tamamla (yeni alan eklendiğinde eski veri bozulmasın).
function withDefaults(stored) {
  const out = {};
  for (const key of SECTIONS) {
    const d = defaults[key];
    const s = stored[key];
    out[key] = ensureIds(key, s && typeof s === "object" && !Array.isArray(s) ? { ...d, ...s } : structuredClone(d), { stable: true });
  }
  if (Array.isArray(out.cv?.versions)) {
    out.cv.versions = out.cv.versions.map((version) => {
      const copy = { ...version };
      for (const key of ["languages", "interests", "references"]) {
        if (!Array.isArray(copy[key])) copy[key] = structuredClone(Array.isArray(out.cv[key]) ? out.cv[key] : []);
      }
      return copy;
    });
  }
  if (!out.projects.portfolioProjectInitialized) {
    out.projects.items = Array.isArray(out.projects.items) ? [...out.projects.items] : [];
    if (!out.projects.items.some((project) => project.id === portfolioProject.id)) out.projects.items.push(structuredClone(portfolioProject));
    out.projects.portfolioProjectInitialized = true;
  }
  out.projects.items = (out.projects.items || []).map((item) => {
    if (!item || item.id !== portfolioProject.id) return item;
    const project = { ...item };
    if (!Array.isArray(project.detailSections)) project.detailSections = structuredClone(portfolioProject.detailSections);
    if (!project.portfolioGalleryExpanded) {
      const gallery = Array.isArray(project.gallery) ? [...project.gallery] : [];
      for (const image of portfolioProject.gallery) if (!gallery.some((entry) => entry.url === image.url)) gallery.push(structuredClone(image));
      project.gallery = gallery;
      project.portfolioGalleryExpanded = true;
    }
    return project;
  });
  return canonicalizeDomains(out);
}

async function getAll({ fresh = false } = {}) {
  if (cache && !fresh && Date.now() - cacheAt < CACHE_TTL_MS) return cache;
  let stored;
  if (useAppwrite) {
    try {
      stored = await loadFromAppwrite();
      lastError = null;
    } catch (err) {
      lastError = err.message;
      console.error("[store] Appwrite okunamadı, yerel kopya kullanılıyor:", err.message);
      if (cache) return cache;
      stored = readSnapshot();
    }
  } else {
    stored = readSnapshot();
  }
  cache = withDefaults(stored);
  cacheAt = Date.now();
  if (useAppwrite && !lastError) writeSnapshot(cache);
  return cache;
}

async function setSection(section, value) {
  if (!SECTIONS.includes(section)) throw Object.assign(new Error("Bilinmeyen bölüm"), { status: 400 });
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("Geçersiz veri"), { status: 400 });
  value = canonicalizeDomains(value);
  ensureIds(section, value);
  if (STAMPED.includes(section)) value._updatedAt = new Date().toISOString(); // CV doğrulama sayfası "güncel mi" kontrolü için
  const current = await getAll();
  if (useAppwrite) await saveToAppwrite(section, value);
  cache = { ...current, [section]: value };
  cacheAt = Date.now();
  writeSnapshot(cache);
  return cache[section];
}

async function resetSection(section) {
  return setSection(section, structuredClone(defaults[section]));
}

function status() {
  return {
    mode: useAppwrite ? "appwrite" : "file",
    endpoint: useAppwrite ? aw.endpoint : null,
    projectId: useAppwrite ? aw.projectId : null,
    databaseId: aw.databaseId,
    collectionId: aw.collectionId,
    lastError
  };
}

module.exports = { SECTIONS, getAll, setSection, resetSection, status, appwrite, defaults };
