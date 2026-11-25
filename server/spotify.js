const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const config = require("./env");

const ACCOUNTS_URL = "https://accounts.spotify.com";
const API_URL = "https://api.spotify.com/v1";
const SCOPES = ["user-read-currently-playing", "user-read-playback-state"];

class SpotifyTokenManager {
  constructor(options) {
    this.options = options;
    this.tokens = null;
    this.refreshPromise = null;
    this.load();
  }

  load() {
    try {
      const stored = JSON.parse(fs.readFileSync(this.options.tokenFile, "utf8"));
      if (stored && stored.refresh_token) this.tokens = stored;
    } catch (error) {
      if (error.code !== "ENOENT") console.error("[spotify] Token deposu okunamadi:", error.message);
    }
  }

  isConfigured() {
    return Boolean(this.options.clientId && this.options.clientSecret && this.options.redirectUri);
  }

  isAuthorized() {
    return Boolean(this.tokens && this.tokens.refresh_token);
  }

  async save(tokens) {
    const dir = path.dirname(this.options.tokenFile);
    const next = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || this.tokens?.refresh_token,
      expires_at: tokens.expires_at,
      scope: tokens.scope || this.tokens?.scope || SCOPES.join(" "),
      updated_at: new Date().toISOString()
    };
    if (!next.refresh_token) throw new Error("Spotify refresh_token donmedi");
    fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${this.options.tokenFile}.${process.pid}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(next, null, 2), { mode: 0o600 });
    fs.renameSync(tempFile, this.options.tokenFile);
    try { fs.chmodSync(this.options.tokenFile, 0o600); } catch (_) {}
    this.tokens = next;
    return next;
  }

  async tokenRequest(params) {
    if (!this.isConfigured()) throw new Error("Spotify yapilandirmasi eksik");
    const response = await fetch(`${ACCOUNTS_URL}/api/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.options.clientId}:${this.options.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(params)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Spotify token istegi basarisiz (${response.status}): ${body.error_description || body.error || "bilinmeyen hata"}`);
    return body;
  }

  async exchangeCode(code) {
    const body = await this.tokenRequest({ grant_type: "authorization_code", code, redirect_uri: this.options.redirectUri });
    return this.save({ ...body, expires_at: Date.now() + body.expires_in * 1000 });
  }

  async refresh() {
    if (!this.isAuthorized()) throw new Error("Spotify yetkilendirmesi gerekli");
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = (async () => {
      const body = await this.tokenRequest({ grant_type: "refresh_token", refresh_token: this.tokens.refresh_token });
      return this.save({ ...body, expires_at: Date.now() + body.expires_in * 1000 });
    })();
    try { return await this.refreshPromise; }
    finally { this.refreshPromise = null; }
  }

  async accessToken(forceRefresh = false) {
    if (!this.isAuthorized()) throw new Error("Spotify yetkilendirmesi gerekli");
    if (forceRefresh || !this.tokens.access_token || Date.now() >= Number(this.tokens.expires_at || 0) - 60000) await this.refresh();
    return this.tokens.access_token;
  }
}

const tokenManager = new SpotifyTokenManager(config.spotify);
let cache = { expiresAt: 0, value: null };
let currentRequest = null;

function signState(payload) {
  return crypto.createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
}

function createLoginUrl() {
  if (!tokenManager.isConfigured()) throw new Error("SPOTIFY_CLIENT_SECRET eksik");
  const payload = Buffer.from(JSON.stringify({ nonce: crypto.randomBytes(24).toString("base64url"), expiresAt: Date.now() + 10 * 60 * 1000 })).toString("base64url");
  const state = `${payload}.${signState(payload)}`;
  const query = new URLSearchParams({ response_type: "code", client_id: config.spotify.clientId, scope: SCOPES.join(" "), redirect_uri: config.spotify.redirectUri, state, show_dialog: "true" });
  return `${ACCOUNTS_URL}/authorize?${query}`;
}

function consumeState(state) {
  const [payload, signature] = String(state || "").split(".");
  if (!payload || !signature) return false;
  const expected = signState(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Boolean(value.nonce && value.expiresAt > Date.now());
  } catch (_) {
    return false;
  }
}

async function spotifyFetch(endpoint, retry = true) {
  const accessToken = await tokenManager.accessToken();
  const response = await fetch(`${API_URL}${endpoint}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 401 && retry) {
    await tokenManager.accessToken(true);
    return spotifyFetch(endpoint, false);
  }
  return response;
}

function normalizePlayer(body) {
  if (!body || body.is_playing !== true || !body.item || body.item.type !== "track") {
    return { source: "spotify", available: true, is_playing: false, discord_status: "offline", listening_to_spotify: false, activities: [] };
  }
  const duration = Math.max(Number(body.item.duration_ms) || 0, 1);
  const progress = Math.max(0, Math.min(Number(body.progress_ms) || 0, duration));
  const start = Date.now() - progress;
  return {
    source: "spotify", available: true, is_playing: true, discord_status: "offline", listening_to_spotify: true, activities: [],
    spotify: {
      track_id: body.item.id,
      song: body.item.name,
      artist: (body.item.artists || []).map((artist) => artist.name).filter(Boolean).join(", "),
      album: body.item.album?.name || "",
      album_art_url: body.item.album?.images?.[0]?.url || "",
      track_url: body.item.external_urls?.spotify || `https://open.spotify.com/track/${body.item.id}`,
      timestamps: { start, end: start + duration }
    }
  };
}

async function loadNowPlaying() {
  if (!tokenManager.isConfigured()) return { source: "spotify", available: false, is_playing: false, reason: "not_configured" };
  if (!tokenManager.isAuthorized()) return { source: "spotify", available: false, is_playing: false, reason: "not_authorized" };
  const response = await spotifyFetch("/me/player/currently-playing?additional_types=track");
  if (response.status === 204) return normalizePlayer(null);
  if (response.status === 429) { const error = new Error("Spotify rate limit"); error.status = 503; throw error; }
  if (!response.ok) { const error = new Error(`Spotify API hatasi (${response.status})`); error.status = 502; throw error; }
  return normalizePlayer(await response.json());
}

async function nowPlaying() {
  if (cache.value && cache.expiresAt > Date.now()) return cache.value;
  if (currentRequest) return currentRequest;
  currentRequest = loadNowPlaying()
    .then((value) => { cache = { value, expiresAt: Date.now() + config.spotify.cacheMs }; return value; })
    .catch((error) => { if (cache.value) return cache.value; throw error; })
    .finally(() => { currentRequest = null; });
  return currentRequest;
}

function clearCache() { cache = { expiresAt: 0, value: null }; }

module.exports = { tokenManager, createLoginUrl, consumeState, nowPlaying, clearCache };
