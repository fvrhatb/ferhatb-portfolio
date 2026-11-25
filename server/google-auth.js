const crypto = require("crypto");
const config = require("./env");
const auth = require("./auth");

const STATE_COOKIE = "ferb_google_state";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

let jwksCache = { expiresAt: 0, keys: [] };

function sign(value) {
  return crypto.createHmac("sha256", config.sessionSecret).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function redirectUriFor(req) {
  const hostname = String(req.hostname || "").toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" ? config.google.redirectUriLocal : config.google.redirectUri;
}

function createState(redirectUri) {
  const payload = Buffer.from(JSON.stringify({
    nonce: crypto.randomBytes(24).toString("base64url"),
    expiresAt: Date.now() + STATE_MAX_AGE_MS,
    redirectUri
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readState(value) {
  const [payload, signature] = String(value || "").split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const allowedRedirects = [config.google.redirectUri, config.google.redirectUriLocal];
    return parsed.expiresAt > Date.now() && parsed.nonce && allowedRedirects.includes(parsed.redirectUri) ? parsed : null;
  } catch (_) {
    return null;
  }
}

function begin(req, res) {
  if (!config.google.clientId || !config.google.clientSecret) throw new Error("Google OAuth yapilandirmasi eksik");
  const redirectUri = redirectUriFor(req);
  const state = createState(redirectUri);
  const stateData = readState(state);
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: redirectUri.startsWith("https://"),
    maxAge: STATE_MAX_AGE_MS,
    path: "/api/auth/google/callback"
  });
  const query = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce: stateData.nonce,
    prompt: "select_account"
  });
  res.set("Cache-Control", "no-store").redirect(`${AUTH_URL}?${query}`);
}

async function fetchJwks(force = false) {
  if (!force && jwksCache.keys.length && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch(JWKS_URL, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Google anahtarlari alinamadi (${response.status})`);
  const body = await response.json();
  const maxAge = Number((response.headers.get("cache-control") || "").match(/max-age=(\d+)/)?.[1]) || 3600;
  jwksCache = { keys: body.keys || [], expiresAt: Date.now() + maxAge * 1000 };
  return jwksCache.keys;
}

async function verifyIdToken(token, nonce) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Gecersiz Google ID token");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  if (header.alg !== "RS256" || !header.kid) throw new Error("Gecersiz Google imza algoritmasi");
  let jwk = (await fetchJwks()).find((key) => key.kid === header.kid);
  if (!jwk) jwk = (await fetchJwks(true)).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("Google imza anahtari bulunamadi");
  const verified = crypto.verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), crypto.createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(parts[2], "base64url"));
  if (!verified) throw new Error("Google ID token imzasi gecersiz");
  const now = Math.floor(Date.now() / 1000);
  if (!["https://accounts.google.com", "accounts.google.com"].includes(claims.iss)) throw new Error("Google token issuer gecersiz");
  if (claims.aud !== config.google.clientId || Number(claims.exp) <= now || Number(claims.iat) > now + 60) throw new Error("Google token suresi veya hedefi gecersiz");
  if (!safeEqual(claims.nonce, nonce)) throw new Error("Google nonce dogrulamasi basarisiz");
  if (claims.email_verified !== true && claims.email_verified !== "true") throw new Error("Google e-posta adresi dogrulanmamis");
  return claims;
}

async function callback(req, res) {
  const cookieState = auth.parseCookies(req.headers.cookie)[STATE_COOKIE];
  const queryState = String(req.query.state || "");
  res.clearCookie(STATE_COOKIE, { path: "/api/auth/google/callback" });
  if (!cookieState || !safeEqual(cookieState, queryState)) throw new Error("Google OAuth state dogrulamasi basarisiz");
  const state = readState(queryState);
  if (!state || !req.query.code) throw new Error("Google OAuth istegi gecersiz veya suresi dolmus");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: String(req.query.code),
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: state.redirectUri,
      grant_type: "authorization_code"
    })
  });
  const tokens = await response.json().catch(() => ({}));
  if (!response.ok || !tokens.id_token) throw new Error(`Google token degisimi basarisiz (${response.status})`);
  const claims = await verifyIdToken(tokens.id_token, state.nonce);
  return {
    email: String(claims.email || "").trim().toLowerCase(),
    name: String(claims.name || "").slice(0, 120),
    picture: /^https:\/\//.test(claims.picture || "") ? claims.picture : "",
    sub: String(claims.sub || "")
  };
}

module.exports = { begin, callback };
