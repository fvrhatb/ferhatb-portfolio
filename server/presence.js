// Canlı ziyaretçi imleçleri ("hayalet imleç") ve "Selam ver" dalgası.
// Tamamen bellekte tutulur (kalıcı kayıt yok). cPanel'de WebSocket güvenilir olmadığı için tarayıcılar kısa aralıklarla bu uç noktayı çağırır.
// Gizlilik: yalnızca rastgele oturum numarası ve imleç konumu (ekranın yüzdesi) paylaşılır; IP, şehir, ad gibi bilgi paylaşılmaz.
const crypto = require("crypto");
const config = require("./env");
const { clientIp } = require("./ip");

const ACTIVE_MS = 8000;       // bu kadar süre ses vermeyen ziyaretçi "ayrıldı" sayılır
const KEEP_MS = 30000;
const WAVE_SHOW_MS = 5000;
const WAVE_COOLDOWN_MS = 3000;
const MAX_PEERS = 300;
const MAX_IDS_PER_IP = 6;

const peers = new Map();      // oturum no -> { n, x, y, seen, waveAt, ip }
const hits = new Map();       // IP özeti -> [istek zamanları]
let seq = 0;
let wavesTotal = 0;

const ipKey = (ip) => crypto.createHmac("sha256", config.sessionSecret).update(`presence|${ip}`).digest("base64url").slice(0, 16);
const clamp = (v) => Math.min(1, Math.max(0, Number(v)));

function activePeers(now = Date.now()) {
  const out = [];
  for (const [id, p] of peers) if (now - p.seen < ACTIVE_MS) out.push([id, p]);
  return out;
}

function update(req, body, cfg) {
  const now = Date.now();
  const id = String(body && body.id || "");
  if (!/^[a-f0-9]{16,32}$/.test(id)) return { status: 400, body: { error: "Geçersiz istek" } };

  const ip = ipKey(clientIp(req) || "bilinmeyen");
  const list = (hits.get(ip) || []).filter((t) => now - t < 5000);
  if (list.length >= 14) return { status: 429, body: { error: "Çok sık istek" } };
  list.push(now);
  hits.set(ip, list);

  let me = peers.get(id);
  if (!me) {
    const mine = [...peers.values()].filter((p) => p.ip === ip && now - p.seen < KEEP_MS).length;
    if (mine >= MAX_IDS_PER_IP || peers.size >= MAX_PEERS) return { status: 429, body: { error: "Çok fazla oturum" } };
    seq = (seq % 999) + 1;
    me = { n: seq, x: null, y: null, seen: now, waveAt: 0, ip };
    peers.set(id, me);
  }
  me.seen = now;
  if (body.x != null && body.y != null && Number.isFinite(Number(body.x)) && Number.isFinite(Number(body.y))) {
    me.x = Math.round(clamp(body.x) * 10000) / 10000;
    me.y = Math.round(clamp(body.y) * 10000) / 10000;
  }
  if (body.wave === true && cfg.wave !== false && now - me.waveAt > WAVE_COOLDOWN_MS) { me.waveAt = now; wavesTotal += 1; }

  const max = Math.min(20, Math.max(1, Number(cfg.maxGhosts) || 8));
  const others = activePeers(now).filter(([pid]) => pid !== id);
  const shown = others
    .filter(([, p]) => p.x != null)
    .sort((a, b) => b[1].seen - a[1].seen)
    .slice(0, max)
    .map(([pid, p]) => ({ k: pid.slice(0, 8), n: p.n, x: p.x, y: p.y, w: now - p.waveAt < WAVE_SHOW_MS ? p.waveAt : 0 }));
  return { status: 200, body: { me: me.n, online: others.length + 1, peers: shown } };
}

function adminView() {
  const act = activePeers();
  return { online: act.length, waves: wavesTotal };
}

setInterval(() => {
  const now = Date.now();
  for (const [id, p] of peers) if (now - p.seen > KEEP_MS) peers.delete(id);
  for (const [k, l] of hits) { const keep = l.filter((t) => now - t < 5000); keep.length ? hits.set(k, keep) : hits.delete(k); }
}, 15000).unref();

module.exports = { update, adminView };
