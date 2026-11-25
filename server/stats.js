// Ziyaret sayacı.
// Kurallar (kötüye kullanıma karşı):
//  - Aynı kişi 30 dakika içinde sayfayı kaç kez yenilerse yenilesin 1 ziyaret sayılır.
//  - Kişi hem tarayıcı çerezinden hem IP'sinden tanınır: çerezi silmek ya da göndermemek yeni sayım sağlamaz.
//  - IP adresleri saklanmaz; yalnızca günlük değişen tuzla alınmış özeti, 30 dakika boyunca bellekte tutulur.
//  - Botlar, link önizleyicileri (Discord, WhatsApp...) ve başka sitelerden gelen istekler sayılmaz.
//  - Panele giriş yapmış yönetici, ayara göre sayılmaz.
// Sayılar Appwrite'ta "stats" satırında (Appwrite yoksa data/stats.json'da) tutulur; her ziyarette değil, toplu olarak yazılır.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./env");
const store = require("./store");
const { clientIp } = require("./ip");

const WINDOW_MS = 30 * 60 * 1000;
const FLUSH_MS = 10 * 1000;
const KEEP_DAYS = 120;
const FILE = path.join(__dirname, "..", "data", "stats.json");
const ROW = `/tablesdb/${config.appwrite.databaseId}/tables/${config.appwrite.collectionId}/rows/stats`;
const useAppwrite = store.status().mode === "appwrite";

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|embedly|skype|slack|vkshare|curl|wget|python|java\/|go-http|axios|node-fetch|headless|lighthouse|pagespeed|monitor|uptime|scan/i;

const empty = () => ({ total: 0, unique: 0, days: {} });
let base = empty();          // depodaki son bilinen değer
let pending = empty();       // henüz yazılmamış artışlar
let loaded = null;
let flushTimer = null;
let lastError = null;

const seenVisitor = new Map(); // ziyaretçi çerezi -> son sayım zamanı
const seenIp = new Map();      // IP özeti -> son sayım zamanı
const hits = new Map();        // IP özeti -> [istek zamanları] (hız sınırı)

const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); // YYYY-MM-DD

function ipKey(ip) {
  return crypto.createHmac("sha256", config.sessionSecret).update(`${today()}|${ip}`).digest("base64url").slice(0, 22);
}

function trimDays(days) {
  const keys = Object.keys(days).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete days[k];
  return days;
}

async function readStored() {
  if (useAppwrite) {
    try {
      const row = await store.appwrite("GET", ROW);
      return { ...empty(), ...JSON.parse(row.data) };
    } catch (err) {
      if (err.status === 404) return empty();
      throw err;
    }
  }
  try { return { ...empty(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; } catch { return empty(); }
}

async function writeStored(value) {
  if (useAppwrite) {
    const data = { data: JSON.stringify(value) };
    try { await store.appwrite("PATCH", ROW, { data }); }
    catch (err) {
      if (err.status !== 404) throw err;
      await store.appwrite("POST", ROW.replace(/\/stats$/, ""), { rowId: "stats", data, permissions: [] });
    }
  } else {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(value));
  }
}

function load() {
  if (!loaded) {
    loaded = readStored().then((v) => { base = v; }).catch((err) => { lastError = err.message; console.error("[stats] okunamadı:", err.message); });
  }
  return loaded;
}

// Bekleyen artışları depodaki güncel değerin üzerine ekleyerek yazar (birden fazla süreç çalışsa da sayım kaybolmasın).
async function flush() {
  flushTimer = null;
  if (!pending.total && !pending.unique) return;
  const add = pending;
  pending = empty();
  try {
    const current = await readStored();
    current.total += add.total;
    current.unique += add.unique;
    for (const [d, n] of Object.entries(add.days)) current.days[d] = (current.days[d] || 0) + n;
    trimDays(current.days);
    await writeStored(current);
    base = current;
    lastError = null;
  } catch (err) {
    // yazılamadıysa artışları geri koy, sonra tekrar denenir
    pending.total += add.total;
    pending.unique += add.unique;
    for (const [d, n] of Object.entries(add.days)) pending.days[d] = (pending.days[d] || 0) + n;
    lastError = err.message;
    console.error("[stats] yazılamadı:", err.message);
    scheduleFlush();
  }
}

function scheduleFlush() {
  if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_MS);
}

function snapshot() {
  const days = { ...base.days };
  for (const [d, n] of Object.entries(pending.days)) days[d] = (days[d] || 0) + n;
  return { total: base.total + pending.total, unique: base.unique + pending.unique, days };
}

function displayValue(cfg = {}) {
  const s = snapshot();
  const raw = cfg.metric === "unique" ? s.unique : cfg.metric === "today" ? (s.days[today()] || 0) : s.total;
  return raw + (cfg.metric === "today" ? 0 : Number(cfg.offset) || 0);
}

// Eski kayıtları bellekten temizle
setInterval(() => {
  const now = Date.now();
  for (const map of [seenVisitor, seenIp]) for (const [k, t] of map) if (now - t > WINDOW_MS) map.delete(k);
  for (const [k, list] of hits) { const keep = list.filter((t) => now - t < 60000); keep.length ? hits.set(k, keep) : hits.delete(k); }
}, 5 * 60 * 1000).unref();

/**
 * Bir ziyareti değerlendirir. Dönüş: { counted, value }
 */
async function record(req, { visitorId, isNewVisitor, isAdmin, cfg }) {
  await load();
  const ua = req.get("user-agent") || "";
  const ip = clientIp(req);
  const key = ip ? ipKey(ip) : null; // IP bulunamazsa yalnızca çerezle ayırt edilir
  const now = Date.now();

  // Hız sınırı: aynı IP'den (IP yoksa aynı çerezden) dakikada 30'dan fazla istek gelirse hiçbiri sayılmaz
  const limitKey = key || `v:${visitorId}`;
  const list = (hits.get(limitKey) || []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(limitKey, list);

  // Başka bir siteden tetiklenen istekleri sayma
  const origin = req.get("origin") || req.get("referer") || "";
  let sameSite = true;
  if (origin) { try { sameSite = new URL(origin).host === req.get("host"); } catch { sameSite = false; } }

  const recently = (map, k) => k && map.has(k) && now - map.get(k) < WINDOW_MS;
  const counted =
    !BOT_RE.test(ua) && ua.length > 10 && sameSite && list.length <= 30 &&
    !(isAdmin && cfg.excludeAdmin !== false) &&
    !recently(seenVisitor, visitorId) && !recently(seenIp, key);

  if (counted) {
    seenVisitor.set(visitorId, now);
    if (key) seenIp.set(key, now);
    pending.total += 1;
    if (isNewVisitor) pending.unique += 1;
    const d = today();
    pending.days[d] = (pending.days[d] || 0) + 1;
    scheduleFlush();
  }
  return { counted, value: displayValue(cfg) };
}

async function adminView() {
  await load();
  const s = snapshot();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
    days.push({ date: d, count: s.days[d] || 0 });
  }
  const last7 = days.slice(-7).reduce((a, b) => a + b.count, 0);
  return { total: s.total, unique: s.unique, today: s.days[today()] || 0, last7, days, lastError };
}

async function reset() {
  await load();
  pending = empty();
  base = empty();
  seenVisitor.clear();
  seenIp.clear();
  await writeStored(base);
}

// Sunucu kapanırken bekleyen sayıları yaz
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.once(sig, () => { flush().finally(() => process.exit(0)); setTimeout(() => process.exit(0), 3000).unref(); });
}

module.exports = { load, record, displayValue, adminView, reset };
