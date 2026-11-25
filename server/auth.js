// Google OAuth ile doğrulanan yöneticiler için HMAC imzalı, HttpOnly oturum çerezi.
const crypto = require("crypto");
const config = require("./env");
const adminUsers = require("./admin-users");
const store = require("./store");

const COOKIE = "ferb_admin";
const DEMO_COOKIE = "ferb_demo";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function sign(value) {
  return crypto.createHmac("sha256", config.sessionSecret).update(value).digest("base64url");
}

function createToken(identity) {
  const payload = Buffer.from(JSON.stringify({
    e: String(identity.email || "").trim().toLowerCase(),
    n: String(identity.name || "").slice(0, 120),
    p: /^https:\/\//.test(identity.picture || "") ? identity.picture : "",
    s: String(identity.sub || "").slice(0, 64),
    x: Date.now() + MAX_AGE_MS
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, mac] = token.split(".");
  const expected = sign(payload);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.x > Date.now() && data.e ? data : null;
  } catch {
    return null;
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((p) => p.trim().split("=")).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
  );
}

function isAuthed(req) {
  return Boolean(readToken(parseCookies(req.headers.cookie)[COOKIE]));
}

function getSession(req) {
  return readToken(parseCookies(req.headers.cookie)[COOKIE]);
}

async function authorize(req) {
  const session = getSession(req);
  if (session) {
    const role = await adminUsers.roleOf(session.e);
    if (role) return { email: session.e, name: session.n, picture: session.p, sub: session.s, role };
  }
  const demo = readToken(parseCookies(req.headers.cookie)[DEMO_COOKIE]);
  if (!demo || demo.e !== "demo" || demo.s !== "demo-v1") return null;
  const content = await store.getAll({ fresh: true });
  return content.settings.adminDemoEnabled === true ? { email: "Demo ziyaretçi", name: "Demo", role: "demo" } : null;
}

function setDemoSession(res) {
  res.cookie(DEMO_COOKIE, createToken({ email: "demo", sub: "demo-v1" }), { httpOnly: true, sameSite: "lax", secure: config.isProd, maxAge: 60 * 60 * 1000, path: "/" });
}

function setSession(res, identity) {
  res.cookie(COOKIE, createToken(identity), {
    httpOnly: true, sameSite: "lax", secure: config.isProd, maxAge: MAX_AGE_MS, path: "/"
  });
}

function clearSession(res) {
  res.clearCookie(COOKIE, { path: "/" });
  res.clearCookie(DEMO_COOKIE, { path: "/" });
}

function requireAuthApi(req, res, next) {
  authorize(req).then((identity) => {
    if (!identity) {
      clearSession(res);
      return res.status(401).json({ error: "Google yonetici oturumu gerekli" });
    }
    if (identity.role === "demo" && req.method !== "GET") return res.status(403).json({ error: "Demo modunda değişiklik yapma yetkiniz yok." });
    if (req.method !== "GET" && req.get("X-Ferb-Admin") !== "1") return res.status(403).json({ error: "Gecersiz istek" });
    req.admin = identity;
    next();
  }).catch(next);
}

module.exports = { parseCookies, isAuthed, getSession, authorize, setSession, setDemoSession, clearSession, requireAuthApi };
