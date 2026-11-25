// .env dosyasını ek paket kullanmadan okur (cPanel'de ortam değişkenleri panelden de girilebilir; panel değerleri önceliklidir).
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", ".env");
if (fs.existsSync(file)) {
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const env = process.env;
module.exports = {
  port: Number(env.PORT) || 3000,
  isProd: env.NODE_ENV === "production",
  sessionSecret: env.SESSION_SECRET || "",
  google: {
    clientId: env.GOOGLE_CLIENT_ID || "",
    clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    founderEmail: (env.GOOGLE_FOUNDER_EMAIL || "fvrhatb@gmail.com").trim().toLowerCase(),
    redirectUri: env.GOOGLE_REDIRECT_URI || "https://ferhatb.com/api/auth/google/callback",
    redirectUriLocal: env.GOOGLE_REDIRECT_URI_LOCAL || "http://localhost:3000/api/auth/google/callback"
  },
  spotify: {
    clientId: env.SPOTIFY_CLIENT_ID || "a8d4bffb975a4c3a958750418d6d2720",
    clientSecret: env.SPOTIFY_CLIENT_SECRET || "",
    redirectUri: env.SPOTIFY_REDIRECT_URI || "https://ferhatb.com/api/spotify/callback",
    tokenFile: env.SPOTIFY_TOKEN_FILE || path.join(__dirname, "..", "data", "spotify-tokens.json"),
    cacheMs: Math.max(5000, Math.min(Number(env.SPOTIFY_CACHE_MS) || 7000, 30000))
  },
  appwrite: {
    endpoint: (env.APPWRITE_ENDPOINT || "").replace(/\/+$/, ""),
    projectId: env.APPWRITE_PROJECT_ID || "",
    apiKey: env.APPWRITE_API_KEY || "",
    databaseId: env.APPWRITE_DATABASE_ID || "ferbcv",
    collectionId: env.APPWRITE_COLLECTION_ID || "content"
  }
};
