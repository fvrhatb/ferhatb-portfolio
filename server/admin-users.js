const fs = require("fs");
const path = require("path");
const config = require("./env");
const store = require("./store");

const ROW_ID = "admin_users";
const LOCAL_FILE = path.join(__dirname, "..", "data", "admin-users.json");
const CACHE_MS = 30 * 1000;
const founderEmail = config.google.founderEmail;
const aw = config.appwrite;
const useAppwrite = Boolean(aw.endpoint && aw.projectId && aw.apiKey);

let cache = null;
let cacheAt = 0;
let lastError = null;

const rowsRoute = () => `/tablesdb/${aw.databaseId}/tables/${aw.collectionId}/rows`;
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalize(value) {
  const seen = new Set([founderEmail]);
  const items = [];
  for (const item of value?.items || []) {
    const email = normalizeEmail(typeof item === "string" ? item : item.email);
    if (!validEmail(email) || seen.has(email)) continue;
    seen.add(email);
    items.push({
      email,
      addedAt: item.addedAt || new Date().toISOString(),
      addedBy: normalizeEmail(item.addedBy) || founderEmail
    });
  }
  return { items };
}

function readLocal() {
  try { return normalize(JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8"))); }
  catch { return { items: [] }; }
}

function writeLocal(value) {
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  const temp = `${LOCAL_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temp, LOCAL_FILE);
  try { fs.chmodSync(LOCAL_FILE, 0o600); } catch (_) {}
}

async function loadRemote() {
  try {
    const row = await store.appwrite("GET", `${rowsRoute()}/${ROW_ID}`);
    return normalize(JSON.parse(row.data || "{}"));
  } catch (error) {
    if (error.status === 404) return readLocal();
    throw error;
  }
}

async function saveRemote(value) {
  const body = { data: JSON.stringify(value) };
  try {
    await store.appwrite("PATCH", `${rowsRoute()}/${ROW_ID}`, body);
  } catch (error) {
    if (error.status !== 404) throw error;
    await store.appwrite("POST", rowsRoute(), { rowId: ROW_ID, ...body, permissions: [] });
  }
}

async function get({ fresh = false } = {}) {
  if (cache && !fresh && Date.now() - cacheAt < CACHE_MS) return cache;
  try {
    cache = useAppwrite ? await loadRemote() : readLocal();
    lastError = null;
  } catch (error) {
    lastError = error.message;
    console.error("[admin-users] Appwrite okunamadi, yerel liste kullaniliyor:", error.message);
    cache = readLocal();
  }
  cacheAt = Date.now();
  return cache;
}

async function save(value) {
  const normalized = normalize(value);
  if (useAppwrite) await saveRemote(normalized);
  writeLocal(normalized);
  cache = normalized;
  cacheAt = Date.now();
  lastError = null;
  return normalized;
}

async function roleOf(value) {
  const email = normalizeEmail(value);
  if (email === founderEmail) return "founder";
  const valueList = await get();
  return valueList.items.some((item) => item.email === email) ? "admin" : null;
}

async function list() {
  const value = await get({ fresh: true });
  return {
    founder: { email: founderEmail, role: "founder", locked: true },
    admins: value.items.map((item) => ({ ...item, role: "admin", locked: false })),
    storage: useAppwrite ? "appwrite" : "file",
    lastError
  };
}

async function add(value, actorEmail) {
  const email = normalizeEmail(value);
  if (!validEmail(email)) throw Object.assign(new Error("Gecerli bir e-posta adresi girin."), { status: 400 });
  if (email === founderEmail) throw Object.assign(new Error("Bu hesap zaten kurucu."), { status: 409 });
  const current = await get({ fresh: true });
  if (current.items.some((item) => item.email === email)) throw Object.assign(new Error("Bu yonetici zaten ekli."), { status: 409 });
  current.items.push({ email, addedAt: new Date().toISOString(), addedBy: normalizeEmail(actorEmail) });
  await save(current);
  return list();
}

async function remove(value) {
  const email = normalizeEmail(value);
  if (email === founderEmail) throw Object.assign(new Error("Kurucu hesabi kaldirilamaz."), { status: 400 });
  const current = await get({ fresh: true });
  const next = current.items.filter((item) => item.email !== email);
  if (next.length === current.items.length) throw Object.assign(new Error("Yonetici bulunamadi."), { status: 404 });
  await save({ items: next });
  return list();
}

module.exports = { founderEmail, normalizeEmail, roleOf, list, add, remove };
