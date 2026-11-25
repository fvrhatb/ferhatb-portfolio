// Snake skor tablosu.
// Akış: oyun başlarken tarayıcı /api/snake/start ile imzalı, tek kullanımlık bir "bilet" alır; oyun bitince skoru bu biletle gönderir.
// Hileye karşı: bilet imzası, tek kullanım, oyun süresine göre en yüksek olası skor sınırı, IP başına oyun başlatma sınırı, ad filtresi.
// (Skor tarayıcıda hesaplandığı için kesin engel mümkün değildir; şüpheli kayıtlar panelden silinebilir.)
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./env");
const store = require("./store");
const { clientIp } = require("./ip");

const STEP_MS = 135;            // oyundaki yılanın adım süresi (main.js ile aynı)
const MIN_STEPS_PER_FOOD = 3;   // bir yemi yemek için gereken en az adım (gerçekçi alt sınır)
const MAX_GAME_MS = 2 * 60 * 60 * 1000;
const MAX_SCORE = 200;          // oyun alanı ~23x8 kare
const MAX_PLAYERS = 500;
const FILE = path.join(__dirname, "..", "data", "snake.json");
const ROW = `/tablesdb/${config.appwrite.databaseId}/tables/${config.appwrite.collectionId}/rows/snake`;
const useAppwrite = store.status().mode === "appwrite";

let data = null;               // { players: { key: { name, best, games, last } } }
let loadedAt = 0;
let loading = null;
let queue = Promise.resolve(); // değişiklikler sırayla yapılır
const CACHE_MS = 30 * 1000;    // okumalar için kısa önbellek
const usedTokens = new Map();  // bilet id -> son kullanım (tekrar gönderimi engeller)
const starts = new Map();      // IP özeti -> [başlatma zamanları]
const games = new Map();

// ---- Ad doğrulama ----
const BAD_PARTS = ["orospu", "yarrak", "siktir", "sikerim", "sikeyim", "amina", "amına", "pezevenk", "kahpe", "ibne", "gavat", "yavşak", "yavsak"];
const BAD_WORDS = ["amk", "aq", "oç", "oc", "piç", "pic", "sik", "göt", "got", "mal"];
function cleanName(raw) {
  const name = String(raw || "").normalize("NFC").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 16) return { error: "Kullanıcı adı 2–16 karakter olmalı." };
  if (!/^[\p{L}\p{N} _.\-]+$/u.test(name)) return { error: "Yalnızca harf, rakam, boşluk ve _ . - kullanabilirsin." };
  const low = name.toLocaleLowerCase("tr");
  if (BAD_PARTS.some((w) => low.includes(w)) || low.split(/[\s_.\-]+/).some((w) => BAD_WORDS.includes(w))) return { error: "Bu kullanıcı adı kullanılamaz." };
  return { name, key: low };
}

// ---- Depolama ----
async function readStored() {
  if (useAppwrite) {
    try { return JSON.parse((await store.appwrite("GET", ROW)).data); }
    catch (err) { if (err.status === 404) return { players: {} }; throw err; }
  }
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { players: {} }; }
}

async function writeStored(value) {
  if (useAppwrite) {
    const body = { data: JSON.stringify(value) };
    try { await store.appwrite("PATCH", ROW, { data: body }); }
    catch (err) {
      if (err.status !== 404) throw err;
      await store.appwrite("POST", ROW.replace(/\/snake$/, ""), { rowId: "snake", data: body, permissions: [] });
    }
  } else {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(value));
  }
}

async function load({ fresh = false } = {}) {
  if (data && !fresh && Date.now() - loadedAt < CACHE_MS) return data;
  if (!loading) {
    loading = readStored()
      .then((v) => { data = { players: {}, ...v }; loadedAt = Date.now(); return data; })
      .catch((err) => { if (data) return data; throw err; })
      .finally(() => { loading = null; });
  }
  return loading;
}

// Her değişiklik: depodan güncel veriyi oku -> değiştir -> yaz. Sırayla çalışır;
// böylece aynı anda gelen skorlar ya da birden fazla sunucu süreci birbirinin kaydını ezmez.
function mutate(fn) {
  const run = queue.then(async () => {
    await load({ fresh: true });
    const result = fn(data);
    await writeStored(data);
    loadedAt = Date.now();
    return result;
  });
  queue = run.catch((err) => console.error("[snake] yazılamadı:", err.message));
  return run;
}

function record() {
  if (!data) return null;
  let best = null;
  for (const p of Object.values(data.players)) if (!p.hidden && p.best > 0 && (!best || p.best > best.score)) best = { name: p.name, score: p.best };
  return best;
}

// ---- Bilet ----
const sign = (v) => crypto.createHmac("sha256", config.sessionSecret).update(`snake|${v}`).digest("base64url");
function makeToken(name) {
  const payload = Buffer.from(JSON.stringify({ n: name, t: Date.now(), id: crypto.randomBytes(9).toString("base64url") })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
function readToken(token) {
  const [payload, mac] = String(token || "").split(".");
  if (!payload || !mac || mac !== sign(payload)) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { return null; }
}

function ipKey(ip) {
  return crypto.createHmac("sha256", config.sessionSecret).update(`snake-ip|${ip}`).digest("base64url").slice(0, 20);
}

setInterval(() => {
  const now = Date.now();
  for (const [token, game] of games) if (now - game.lastStep > 60000 || now - game.started > MAX_GAME_MS) games.delete(token);
  for (const [k, t] of usedTokens) if (now - t > MAX_GAME_MS) usedTokens.delete(k);
  for (const [k, list] of starts) { const keep = list.filter((t) => now - t < 10 * 60 * 1000); keep.length ? starts.set(k, keep) : starts.delete(k); }
}, 10 * 60 * 1000).unref();

// ---- Genel API ----
async function start(req, rawName) {
  const checked = cleanName(rawName);
  if (checked.error) return { status: 400, body: { error: checked.error } };
  const ip = clientIp(req);
  const key = ip ? ipKey(ip) : "bilinmeyen";
  const now = Date.now();
  if (games.size >= 2000) return { status: 503, body: { error: "Oyun sunucusu meşgul." } };
  const list = (starts.get(key) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (list.length >= (ip ? 40 : 400)) return { status: 429, body: { error: "Çok fazla oyun başlattın, biraz sonra tekrar dene." } };
  list.push(now);
  starts.set(key, list);
  await load();
  const token = crypto.randomBytes(32).toString("base64url");
  games.set(token, { name: checked.name, key: checked.key, started: now, lastStep: now, snake: [{x:10,y:4},{x:9,y:4},{x:8,y:4}], food: {x:16,y:4}, direction: 'right', score: 0, steps: 0, turns: 0, busy: false });
  return { status: 200, body: { token, record: record() } };
}

async function legacyFinish(token, rawScore) {
  const t = readToken(token);
  if (!t) return { status: 400, body: { error: "Geçersiz oyun." } };
  if (usedTokens.has(t.id)) return { status: 409, body: { error: "Bu oyun zaten kaydedildi." } };
  const elapsed = Date.now() - t.t;
  const score = Math.floor(Number(rawScore));
  if (!Number.isFinite(score) || score < 0 || elapsed > MAX_GAME_MS) return { status: 400, body: { error: "Geçersiz skor." } };
  const possible = Math.min(MAX_SCORE, Math.floor(elapsed / (STEP_MS * MIN_STEPS_PER_FOOD)) + 1);
  if (score > possible) return { status: 400, body: { error: "Skor doğrulanamadı." } };
  usedTokens.set(t.id, Date.now());

  const checked = cleanName(t.n);
  if (checked.error) return { status: 400, body: { error: checked.error } };
  const out = await mutate((d) => {
    const before = record();
    const p = d.players[checked.key] || { name: checked.name, best: 0, games: 0, last: null };
    p.name = checked.name;
    p.games += 1;
    p.last = new Date().toISOString();
    const personalBest = score > p.best;
    if (personalBest) { p.best = score; p.bestAt = p.last; }
    d.players[checked.key] = p;

    // Çok fazla oyuncu birikirse en düşük skorluları at
    const keys = Object.keys(d.players);
    if (keys.length > MAX_PLAYERS) {
      keys.sort((a, b) => d.players[a].best - d.players[b].best).slice(0, keys.length - MAX_PLAYERS).forEach((k) => delete d.players[k]);
    }
    const now = record();
    const newRecord = Boolean(now && score > 0 && now.name === p.name && now.score === score && (!before || score > before.score));
    return { best: p.best, personalBest, newRecord, record: now };
  });
  return { status: 200, body: { ok: true, ...out } };
}

async function step(token, direction) {
  const game = games.get(String(token || ""));
  if (!game || game.busy) return { status: 400, body: { error: "Oyun bulunamadı." } };
  const now = Date.now();
  if (now - game.started > MAX_GAME_MS) { games.delete(token); return { status: 400, body: { error: "Oyun süresi doldu." } }; }
  if (now - game.lastStep < 115) return { status: 429, body: { error: "Çok hızlı hareket." } };
  const dirs = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  if (!Object.hasOwn(dirs, direction)) return { status: 400, body: { error: "Geçersiz yön." } };
  const old = dirs[game.direction], nextDir = dirs[direction];
  if (old[0] + nextDir[0] !== 0 || old[1] + nextDir[1] !== 0) {
    if (direction !== game.direction) game.turns++;
    game.direction = direction;
  }
  const [dx,dy] = dirs[game.direction];
  const head = game.snake[0], next = {x:head.x+dx,y:head.y+dy};
  game.lastStep = now; game.steps++;
  const reason = next.x < 0 || next.x >= 23 || next.y < 0 || next.y >= 7 ? 'Duvara çarpma' : game.snake.some(p => p.x === next.x && p.y === next.y) ? 'Kendine çarpma' : null;
  if (reason) {
    game.busy = true;
    const score = game.score;
    try {
      const out = await mutate(d => {
        const before = record();
        const p = d.players[game.key] || { name: game.name, best: 0, games: 0, last: null };
        p.games++; p.name = game.name; p.last = new Date(now).toISOString();
        const personalBest = score > p.best;
        if (personalBest) { p.best = score; p.bestAt = p.last; }
        p.attempts = Array.isArray(p.attempts) ? p.attempts : [];
        p.attempts.push({ score, startedAt: new Date(game.started).toISOString(), endedAt: p.last, durationMs: now-game.started, steps: game.steps, turns: game.turns, reason });
        if (p.attempts.length > 100) p.attempts = p.attempts.slice(-100);
        d.players[game.key] = p;
        const current = record();
        return {best:p.best,personalBest,newRecord: Boolean(current && (!before || current.score > before.score)),record:current};
      });
      games.delete(token);
      return { status: 200, body: { ended: true, score, reason, ...out } };
    } catch (error) { game.busy = false; throw error; }
  }
  game.snake.unshift(next);
  if (next.x === game.food.x && next.y === game.food.y) {
    game.score++;
    const free=[];
    for(let y=0;y<7;y++) for(let x=0;x<23;x++) if(!game.snake.some(p=>p.x===x&&p.y===y)) free.push({x,y});
    if (free.length) game.food=free[crypto.randomInt(free.length)];
  } else game.snake.pop();
  return {status:200,body:{ended:false,snake:game.snake,food:game.food,score:game.score,direction:game.direction}};
}

async function finish() { return { status: 410, body: { error: "Skor istemciden kabul edilmez." } }; }

async function publicRecord() {
  try { await load(); } catch { return null; }
  return record();
}

// ---- Yönetim ----
async function list() {
  await load({ fresh: true });
  return Object.entries(data.players)
    .map(([key, p]) => { const { attempts, ...summary } = p; return { key, ...summary, recordedAttempts: Array.isArray(attempts) ? attempts.length : 0 }; })
    .sort((a, b) => b.best - a.best || String(a.last).localeCompare(String(b.last)));
}

async function attemptPage(key, page) {
  await load();
  const player = data.players[key];
  if (!player) throw Object.assign(new Error("Oyuncu bulunamadı."), { status: 404 });
  const attempts = Array.isArray(player.attempts) ? player.attempts : [];
  const limit = 5;
  const total = attempts.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const requested = Number(page);
  if (page !== undefined && (!Number.isSafeInteger(requested) || requested < 1)) throw Object.assign(new Error("Geçersiz sayfa."), { status: 400 });
  const current = Math.min(requested || 1, pages);
  const end = total - (current - 1) * limit;
  const start = Math.max(0, end - limit);
  return { page: current, pages, total, limit, attempts: attempts.slice(start, end).reverse().map((attempt, i) => ({ ...attempt, number: (player.games || total) - ((current - 1) * limit + i) })) };
}

function remove(key) {
  return mutate((d) => { delete d.players[key]; });
}

function setHidden(key, hidden) {
  return mutate((d) => { if (d.players[key]) d.players[key].hidden = Boolean(hidden); });
}

function reset() {
  return mutate((d) => { d.players = {}; });
}

module.exports = { start, step, finish, publicRecord, list, attemptPage, remove, setHidden, reset, cleanName };
