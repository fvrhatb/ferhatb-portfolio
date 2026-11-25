// Basılan CV'lerin doğrulama kodları. Kod = (CV sürümü + o anki içerik) için üretilen kısa imza;
// içerik değişince yeni kod çıkar, eski kod "güncel değil" olarak tanınır. Kayıtlar Appwrite'ta (yoksa data/cvcodes.json) tutulur.
const fs = require("fs");
const path = require("path");
const config = require("./env");
const store = require("./store");

const FILE = path.join(__dirname, "..", "data", "cvcodes.json");
const ROW = `/tablesdb/${config.appwrite.databaseId}/tables/${config.appwrite.collectionId}/rows/cvcodes`;
const useAppwrite = store.status().mode === "appwrite";
const MAX = 500;

let queue = Promise.resolve();

async function read() {
  if (useAppwrite) {
    try { return JSON.parse((await store.appwrite("GET", ROW)).data); }
    catch (err) { if (err.status === 404) return { codes: {} }; throw err; }
  }
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { codes: {} }; }
}

async function write(value) {
  if (useAppwrite) {
    const body = { data: JSON.stringify(value) };
    try { await store.appwrite("PATCH", ROW, { data: body }); }
    catch (err) {
      if (err.status !== 404) throw err;
      await store.appwrite("POST", ROW.replace(/\/cvcodes$/, ""), { rowId: "cvcodes", data: body, permissions: [] });
    }
  } else {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(value));
  }
}

async function find(code) {
  const d = await read();
  return (d.codes && d.codes[code]) || null;
}

// Kod daha önce kaydedilmediyse ekler (aynı içerik için tekrar tekrar yazmaz)
function register(code, rec) {
  const run = queue.then(async () => {
    const d = await read();
    d.codes = d.codes || {};
    if (d.codes[code]) return false;
    d.codes[code] = rec;
    const keys = Object.keys(d.codes);
    if (keys.length > MAX) keys.sort((a, b) => String(d.codes[a].at).localeCompare(String(d.codes[b].at))).slice(0, keys.length - MAX).forEach((k) => delete d.codes[k]);
    await write(d);
    return true;
  });
  queue = run.catch((err) => console.error("[cvcodes] yazılamadı:", err.message));
  return run;
}

module.exports = { find, register };
