// CV doğrulama: basılı CV'deki kod ve QR buraya gelir. Yalnızca zaten herkese açık bilgiler döner.
const crypto = require("crypto");
const config = require("./env");
const store = require("./store");
const cvcodes = require("./cvcodes");
const { buildProfileData } = require("./render");
const R = require("../public/js/cv-render.js"); // tarayıcıdaki CV oluşturucuyla aynı kural: aynı içerik -> aynı özet

const STAMPED = ["cv", "education", "experience", "certificates", "projects"];
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const LIVE_TTL = 10 * 60 * 1000;
const liveCache = new Map(); // adres -> { ok, at }

function isPublicHttp(link) {
  try {
    const u = new URL(link);
    if (!/^https?:$/.test(u.protocol)) return false;
    const h = u.hostname.toLowerCase();
    return !(h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$|\[?f[cd])/.test(h));
  } catch { return false; }
}

async function isLive(link) {
  const hit = liveCache.get(link);
  if (hit && Date.now() - hit.at < LIVE_TTL) return hit.ok;
  let ok = null;
  if (isPublicHttp(link)) {
    try {
      const res = await fetch(link, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(4000), headers: { "User-Agent": "ferhatb-cv-verify" } });
      ok = res.status < 400;
      if (res.body && res.body.cancel) res.body.cancel().catch(() => {});
    } catch { ok = false; }
  }
  liveCache.set(link, { ok, at: Date.now() });
  return ok;
}

// Bir CV sürümünün o anki içeriği: kâğıda basılacak her şey
function snapshot(content, versionId) {
  const m = R.resolve(buildProfileData(content), versionId);
  return {
    v: m.v.id, template: m.v.template, accent: m.v.accent, lang: m.v.lang, desc: m.v.descMode,
    name: m.name, role: m.role, summary: m.summary, photo: m.photo, contact: m.contact, personal: m.personal,
    skills: m.skills, certs: m.certs, exp: m.exp, edu: m.edu, projects: m.projects,
    languages: m.languages, interests: m.interests, references: m.references
  };
}

function codeFor(content, versionId) {
  const snap = snapshot(content, versionId);
  const hash = crypto.createHash("sha256").update(JSON.stringify(snap)).digest();
  const mac = crypto.createHmac("sha256", config.sessionSecret).update(`cvcode|${snap.v}|`).update(hash).digest();
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[mac[i] % ALPHABET.length];
  return { code, versionId: snap.v };
}

async function issue(rawVersion) {
  const content = await store.getAll();
  const { code, versionId } = codeFor(content, String(rawVersion || ""));
  await cvcodes.register(code, { v: versionId, at: new Date().toISOString() });
  return code;
}

function normalize(raw) {
  let c = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length === 10 && c.startsWith("FB")) c = c.slice(2);
  return /^[A-Z0-9]{8}$/.test(c) ? c : "";
}

async function view(rawCode) {
  const base = { checkedAt: new Date().toISOString() };
  if (!String(rawCode || "").trim()) return { ...base, state: "none" };
  const code = normalize(rawCode);
  if (!code) return { ...base, state: "invalid" };
  const rec = await cvcodes.find(code);
  if (!rec) return { ...base, state: "invalid" };

  const c = await store.getAll();
  const current = codeFor(c, rec.v).code === code;
  const versions = Array.isArray(c.cv.versions) ? c.cv.versions : [];
  const v = versions.find((x) => x.id === rec.v) || versions.find((x) => x.id === c.cv.activeVersion) || versions[0] || {};
  const stamps = STAMPED.map((k) => c[k] && c[k]._updatedAt).filter(Boolean).sort();
  const projects = (c.projects.items || []).filter((p) => p && p.title && p.enabled !== false).slice(0, 12);
  const live = await Promise.all(projects.map((p) => (p.link ? isLive(p.link) : null)));
  return {
    ...base,
    state: current ? "current" : "outdated",
    code,
    name: c.cv.name || c.profile.name,
    role: v.role || c.cv.role || "",
    version: { id: v.id || rec.v, name: v.name || "" },
    issuedAt: rec.at,
    changedAt: stamps.length ? stamps[stamps.length - 1] : null,
    projects: projects.map((p, i) => ({ title: p.title, year: p.year || "", status: p.status || "", link: p.link || "", live: live[i] }))
  };
}

module.exports = { view, issue, codeFor };
