// ferhatb.com — Node.js sunucusu (cPanel "Setup Node.js App" başlangıç dosyası: app.js)
const fs = require("fs");
const path = require("path");
const express = require("express");
const config = require("./server/env");
const auth = require("./server/auth");
const googleAuth = require("./server/google-auth");
const adminUsers = require("./server/admin-users");
const { clientIp } = require("./server/ip");
const store = require("./server/store");
const stats = require("./server/stats");
const snake = require("./server/snake");
const presence = require("./server/presence");
const verify = require("./server/verify");
const media = require("./server/media");
const spotify = require("./server/spotify");
const crypto = require("crypto");
const { renderIndex, dataJs } = require("./server/render");
const { renderProject } = require("./server/project-page");

if (!config.google.clientId || !config.google.clientSecret || !config.google.founderEmail || config.sessionSecret.length < 32) {
  console.error("\n[!] .env eksik: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_FOUNDER_EMAIL ve en az 32 karakterlik SESSION_SECRET gerekli.\n");
  process.exit(1);
}

const PUBLIC = path.join(__dirname, "public");
const UPLOADS = path.join(PUBLIC, "uploads");
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", "loopback"); // cPanel'de Apache/Passenger aynı makineden bağlanır

// --- Güvenlik başlıkları ---
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  });
  next();
});

// --- Temiz adresler: /index(.html) -> /, /sayfa.html -> /sayfa ---
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  const q = req.originalUrl.slice(req.path.length);
  if (/^\/index(\.html)?$/i.test(req.path)) return res.redirect(301, "/" + q);
  if (/\.html$/i.test(req.path)) return res.redirect(301, req.path.replace(/\.html$/i, "") + q);
  next();
});

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// --- Site ---
app.get("/", asyncRoute(async (req, res) => {
  const [content] = await Promise.all([store.getAll(), stats.load()]);
  res.set("Cache-Control", "no-cache").type("html").send(renderIndex(content, stats.displayValue(content.counter)));
}));

app.get("/projeler/:id", asyncRoute(async (req, res) => {
  const content = await store.getAll();
  const project = (content.projects.items || []).find((item) => item && item.enabled !== false && item.id === req.params.id);
  if (!project || content.sections.projects?.enabled === false) return res.status(404).sendFile(path.join(PUBLIC, "errors", "404.html"));
  res.set("Cache-Control", "no-cache").type("html").send(renderProject(project, content.settings.adminDemoEnabled === true));
}));

// --- Ziyaret sayacı: sayfa açılınca tarayıcı bir kez çağırır (kurallar server/stats.js içinde) ---
app.post("/api/visit", asyncRoute(async (req, res) => {
  const content = await store.getAll();
  const cookies = auth.parseCookies(req.headers.cookie);
  let visitorId = cookies.ferb_vid;
  const isNewVisitor = !/^[a-f0-9]{32}$/.test(visitorId || "");
  if (isNewVisitor) visitorId = crypto.randomBytes(16).toString("hex");
  res.cookie("ferb_vid", visitorId, { httpOnly: true, sameSite: "lax", secure: config.isProd, maxAge: 365 * 24 * 60 * 60 * 1000, path: "/" });
  const { counted, value } = await stats.record(req, { visitorId, isNewVisitor, isAdmin: auth.isAuthed(req), cfg: content.counter });
  res.set("Cache-Control", "no-store").json({ counted, value, enabled: content.counter.enabled !== false });
}));

app.get("/js/data.js", asyncRoute(async (req, res) => {
  const [content, snakeRecord] = await Promise.all([store.getAll(), snake.publicRecord()]);
  res.set("Cache-Control", "no-cache").type("application/javascript").send(dataJs(content, { snakeRecord }));
}));

// --- Yüklenen görseller / PDF'ler (Appwrite Storage'dan, yerel önbellekle) ---
app.get("/media/:id", asyncRoute(async (req, res) => {
  const found = await media.resolve(req.params.id);
  if (!found) return res.status(404).sendFile(path.join(PUBLIC, "errors", "404.html"));
  res.set({ "Content-Type": found.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" });
  res.sendFile(found.file, { headers: { "Content-Type": found.mime } });
}));

// --- Panelden yönetilen site dosyaları: favicon, manifest, robots, sitemap ---
const siteBase = (c) => String(c.settings.siteUrl || "").replace(/\/+$/, "");
const iconOf = (c) => c.settings.favicon || "/favicon.jpg";
app.get("/favicon.ico", asyncRoute(async (req, res) => res.redirect(302, iconOf(await store.getAll()))));
app.get("/site.webmanifest", asyncRoute(async (req, res) => {
  const c = await store.getAll();
  const dark = c.settings.defaultTheme === "dark";
  const icon = iconOf(c);
  res.set("Cache-Control", "no-cache").type("application/manifest+json").send(JSON.stringify({
    name: c.settings.siteName, short_name: c.settings.siteName, start_url: "/", display: "browser", lang: "tr",
    background_color: dark ? "#0b1220" : "#ffffff", theme_color: dark ? "#0b1220" : "#ffffff",
    icons: [{ src: icon, sizes: "any", type: /\.png$/i.test(icon) ? "image/png" : "image/jpeg" }]
  }));
}));
app.get("/robots.txt", asyncRoute(async (req, res) => {
  const c = await store.getAll();
  res.set("Cache-Control", "no-cache").type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /errors/\nDisallow: /admin\nDisallow: /api/\nDisallow: /cv/dogrula\n\nSitemap: ${siteBase(c)}/sitemap.xml\n`);
}));
app.get("/sitemap.xml", asyncRoute(async (req, res) => {
  const c = await store.getAll();
  const stamps = ["settings", "profile", "about", "education", "experience", "certificates", "projects"].map((k) => c[k] && c[k]._updatedAt).filter(Boolean).sort();
  const last = (stamps.pop() || new Date().toISOString()).slice(0, 10);
  res.set("Cache-Control", "no-cache").type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteBase(c)}/</loc><lastmod>${last}</lastmod><priority>1.0</priority></url>\n</urlset>\n`);
}));

// --- Canlı ziyaretçi imleçleri (kurallar server/presence.js içinde) ---
app.post("/api/presence", express.json({ limit: "1kb" }), asyncRoute(async (req, res) => {
  const site = req.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "same-site" && site !== "none") return res.status(403).json({ error: "İzin yok" });
  const cfg = (await store.getAll()).presence || {};
  res.set("Cache-Control", "no-store");
  if (!cfg.enabled) return res.json({ me: 0, online: 1, peers: [] });
  const out = presence.update(req, req.body, cfg);
  res.status(out.status).json(out.body);
}));

// --- CV doğrulama: CV'ye basılan kodu üretir ve kodu sorgular ---
const verifyHits = new Map();
function verifyLimited(req, max) {
  const key = clientIp(req) || "x";
  const now = Date.now();
  const list = (verifyHits.get(key) || []).filter((t) => now - t < 60000);
  const over = list.length >= max;
  if (!over) { list.push(now); verifyHits.set(key, list); }
  return over;
}
app.post("/api/cv/code", express.json({ limit: "1kb" }), asyncRoute(async (req, res) => {
  if (verifyLimited(req, 20)) return res.status(429).json({ error: "Çok fazla istek" });
  res.set("Cache-Control", "no-store").json({ code: await verify.issue(String(req.body?.v || "").slice(0, 60)) });
}));
app.get("/api/verify", asyncRoute(async (req, res) => {
  if (verifyLimited(req, 40)) return res.status(429).json({ error: "Çok fazla istek" });
  res.set("Cache-Control", "no-store").json(await verify.view(String(req.query.k || "").slice(0, 40)));
}));
app.get("/cv/dogrula", (req, res) => {
  res.set({ "Cache-Control": "no-cache", "X-Robots-Tag": "noindex" }).sendFile(path.join(PUBLIC, "dogrula.html"));
});

// --- CV sayfası: /cv (aktif sürüm) ve /cv/<sürüm> ---
app.get(["/cv", "/cv/:id"], (req, res) => {
  res.set({ "Cache-Control": "no-cache", "X-Robots-Tag": "noindex" }).sendFile(path.join(PUBLIC, "cv.html"));
});

// --- Snake skorları (kurallar server/snake.js içinde) ---
app.post("/api/snake/start", express.json({ limit: "2kb" }), asyncRoute(async (req, res) => {
  const out = await snake.start(req, req.body?.name);
  res.status(out.status).json(out.body);
}));
app.post("/api/snake/finish", express.json({ limit: "2kb" }), asyncRoute(async (req, res) => {
  const out = await snake.finish(req.body?.token, req.body?.score);
  res.status(out.status).json(out.body);
}));
app.post("/api/snake/step", express.json({ limit: "2kb" }), asyncRoute(async (req, res) => {
  const out = await snake.step(req.body?.token, req.body?.direction);
  res.set("Cache-Control", "no-store").status(out.status).json(out.body);
}));

// --- Google OAuth 2.0 yönetici girişi ---
app.get("/api/auth/google", (req, res, next) => {
  try { googleAuth.begin(req, res); }
  catch (error) { next(error); }
});

app.get("/api/auth/google/callback", asyncRoute(async (req, res) => {
  if (req.query.error) return res.redirect("/admin/giris?error=cancelled");
  try {
    const identity = await googleAuth.callback(req, res);
    const role = await adminUsers.roleOf(identity.email);
    if (!role) return res.redirect(`/admin/giris?error=unauthorized&email=${encodeURIComponent(identity.email)}`);
    auth.setSession(res, identity);
    res.redirect("/admin");
  } catch (error) {
    console.error("[google-auth] Giris basarisiz:", error.message);
    auth.clearSession(res);
    res.redirect("/admin/giris?error=oauth");
  }
}));

app.post("/api/auth/logout", (req, res) => {
  auth.clearSession(res);
  res.json({ ok: true });
});

app.get("/api/auth/demo/status", asyncRoute(async (req, res) => {
  const content = await store.getAll({ fresh: true });
  res.set("Cache-Control", "no-store").json({ enabled: content.settings.adminDemoEnabled === true });
}));
app.post("/api/auth/demo", asyncRoute(async (req, res) => {
  const content = await store.getAll({ fresh: true });
  if (content.settings.adminDemoEnabled !== true) return res.status(403).json({ error: "Demo şu anda kapalı." });
  if (await auth.authorize(req)) return res.status(409).json({ error: "Zaten bir oturum açık." });
  auth.setDemoSession(res);
  res.set("Cache-Control", "no-store").json({ ok: true });
}));

// --- Spotify OAuth + sunucu tarafli Now Playing fallback'i ---
app.get("/api/spotify/login", asyncRoute(async (req, res) => {
  const identity = await auth.authorize(req);
  if (!identity || identity.role === "demo") return res.redirect("/admin/giris");
  try {
    res.set("Cache-Control", "no-store").redirect(spotify.createLoginUrl());
  } catch (error) {
    throw error;
  }
}));

app.get("/api/spotify/callback", asyncRoute(async (req, res) => {
  if (req.query.error) return res.status(400).type("text/plain").send(`Spotify yetkilendirmesi reddedildi: ${String(req.query.error)}`);
  if (!req.query.code || !spotify.consumeState(req.query.state)) return res.status(400).type("text/plain").send("Gecersiz veya suresi dolmus Spotify OAuth istegi.");
  await spotify.tokenManager.exchangeCode(String(req.query.code));
  spotify.clearCache();
  res.set("Cache-Control", "no-store").type("html").send("<!doctype html><html lang=\"tr\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>Spotify baglandi</title><body><main><h1>Spotify baglandi</h1><p>Yetkilendirme tamamlandi. Bu pencereyi kapatabilirsiniz.</p><p><a href=\"/\">Siteye don</a></p></main></body></html>");
}));

app.get("/api/spotify/now-playing", asyncRoute(async (req, res) => {
  res.set("Cache-Control", "private, no-store");
  try {
    res.json(await spotify.nowPlaying());
  } catch (error) {
    console.error("[spotify] Now Playing alinamadi:", error.message);
    res.status(503).json({ source: "spotify", available: false, is_playing: false, reason: "temporarily_unavailable" });
  }
}));

// --- Yönetim API'si (oturum gerekli) ---
const admin = express.Router();
admin.use(auth.requireAuthApi);

admin.use((req, res, next) => {
  if (req.admin.role !== "demo") return next();
  res.set("Cache-Control", "no-store");
  if (req.path === "/content") {
    const content = structuredClone(store.defaults);
    content.profile.email = "demo@example.com";
    Object.assign(content.cv, { email: "demo@example.com", phone: "", birthDate: "", references: [], drivingLicense: "", militaryStatus: "" });
    for (const version of content.cv.versions || []) { version.references = []; version.showPersonal = false; }
    content.settings.consoleEffects = [];
    content.settings.adminDemoEnabled = true;
    return res.json({ content, defaults: structuredClone(content), status: { mode: "demo", projectId: null, lastError: null }, email: "Demo ziyaretçi", user: req.admin });
  }
  if (req.path === "/stats") return res.json({ total: 1240, unique: 820, today: 18, last7: 126, days: Array.from({ length: 14 }, (_, i) => ({ date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10), count: 5 + (i * 7) % 18 })), lastError: null });
  if (req.path === "/presence") return res.json({ online: 3, waves: 8 });
  if (req.path === "/snake") return res.json({ players: [] });
  if (req.path === "/uploads") return res.json({ files: [], items: [] });
  if (req.path === "/users") return res.json({ founder: { email: "kurucu@example.com", role: "founder", locked: true }, admins: [{ email: "yonetici@example.com", role: "admin", locked: false }], storage: "demo", lastError: null });
  return res.status(403).json({ error: "Demo modunda bu veriye erişim izniniz yok." });
});

admin.get("/content", asyncRoute(async (req, res) => {
  const content = await store.getAll({ fresh: true });
  res.set("Cache-Control", "no-store").json({ content, defaults: store.defaults, status: store.status(), email: req.admin.email, user: req.admin });
}));

const founderOnly = (req, res, next) => req.admin.role === "founder" ? next() : res.status(403).json({ error: "Bu islem yalnizca kurucu tarafindan yapilabilir." });
admin.get("/users", founderOnly, asyncRoute(async (req, res) => {
  res.set("Cache-Control", "no-store").json(await adminUsers.list());
}));
admin.post("/users", founderOnly, express.json({ limit: "2kb" }), asyncRoute(async (req, res) => {
  res.status(201).json(await adminUsers.add(req.body?.email, req.admin.email));
}));
admin.delete("/users/:email", founderOnly, asyncRoute(async (req, res) => {
  res.json(await adminUsers.remove(req.params.email));
}));

admin.put("/content/:section", express.json({ limit: "2mb" }), asyncRoute(async (req, res) => {
  const saved = await store.setSection(req.params.section, req.body);
  res.json({ ok: true, section: saved });
}));

admin.post("/content/:section/reset", asyncRoute(async (req, res) => {
  const saved = await store.resetSection(req.params.section);
  res.json({ ok: true, section: saved });
}));

admin.get("/export", asyncRoute(async (req, res) => {
  const content = await store.getAll({ fresh: true });
  const stamp = new Date().toISOString().slice(0, 10);
  res.set("Content-Disposition", `attachment; filename="ferhatb-yedek-${stamp}.json"`).json(content);
}));

admin.post("/upload", express.raw({ type: () => true, limit: "20mb" }), asyncRoute(async (req, res) => {
  const original = decodeURIComponent(req.get("X-File-Name") || "dosya");
  const out = await media.put(req.body, original);
  res.json({ ok: true, url: out.url });
}));

admin.get("/uploads", asyncRoute(async (req, res) => {
  const items = await media.list();
  res.set("Cache-Control", "no-store").json({ files: items.map((x) => x.url), items });
}));

admin.get("/stats", asyncRoute(async (req, res) => {
  res.set("Cache-Control", "no-store").json(await stats.adminView());
}));

admin.post("/stats/reset", asyncRoute(async (req, res) => {
  await stats.reset();
  res.json({ ok: true });
}));

admin.get("/presence", (req, res) => {
  res.set("Cache-Control", "no-store").json(presence.adminView());
});

admin.get("/snake", asyncRoute(async (req, res) => {
  res.set("Cache-Control", "no-store").json({ players: await snake.list() });
}));
admin.get("/snake/:key/attempts", asyncRoute(async (req, res) => {
  res.set("Cache-Control", "no-store").json(await snake.attemptPage(req.params.key, req.query.page));
}));
admin.post("/snake/reset", asyncRoute(async (req, res) => {
  await snake.reset();
  res.json({ ok: true });
}));
admin.patch("/snake/:key", express.json({ limit: "2kb" }), asyncRoute(async (req, res) => {
  await snake.setHidden(req.params.key, req.body?.hidden);
  res.json({ ok: true });
}));
admin.delete("/snake/:key", asyncRoute(async (req, res) => {
  await snake.remove(req.params.key);
  res.json({ ok: true });
}));

app.use("/api/admin", admin);
app.use("/api", (req, res) => res.status(404).json({ error: "Bulunamadı" }));

// --- Yönetim paneli sayfaları ---
const ADMIN_DIR = path.join(PUBLIC, "admin");
app.get("/admin/demo", asyncRoute(async (req, res) => {
  const identity = await auth.authorize(req);
  if (identity) return res.redirect("/admin");
  const content = await store.getAll({ fresh: true });
  if (content.settings.adminDemoEnabled !== true) return res.status(403).set("Cache-Control", "no-store").type("text/plain").send("Yönetim paneli demosu şu anda kapalı.");
  auth.setDemoSession(res);
  res.set("Cache-Control", "no-store").redirect("/admin");
}));
app.get("/admin/giris", asyncRoute(async (req, res) => {
  if (await auth.authorize(req)) return res.redirect("/admin");
  res.set("Cache-Control", "no-store").sendFile(path.join(ADMIN_DIR, "login.html"));
}));
app.get(["/admin", "/admin/:page"], asyncRoute(async (req, res, next) => {
  if (req.params.page && req.params.page.includes(".")) return next(); // admin.css, admin.js...
  if (!await auth.authorize(req)) return res.redirect("/admin/giris");
  res.set("Cache-Control", "no-store").sendFile(path.join(ADMIN_DIR, "app.html"));
}));

// --- Statik dosyalar ---
app.use(express.static(PUBLIC, {
  index: false,
  extensions: ["html"],
  dotfiles: "ignore",
  setHeaders(res, file) {
    if (/\.(png|jpe?g|webp|avif|gif|svg|ico|woff2)$/i.test(file)) res.set("Cache-Control", "public, max-age=2592000");
    else if (/\.(css|js)$/i.test(file)) res.set("Cache-Control", "no-cache"); // her açılışta sürüm kontrolü (ETag): güncellemeler anında gelir
    else res.set("Cache-Control", "no-cache");
  }
}));

// --- Hata sayfaları ---
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC, "errors", "404.html"));
});
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.status && err.status < 600 ? err.status : 500;
  if (req.path.startsWith("/api/")) return res.status(status).json({ error: err.message || "Sunucu hatası" });
  res.status(500).sendFile(path.join(PUBLIC, "errors", "500.html"));
});

app.listen(config.port, () => {
  const s = store.status();
  console.log(`\n  ferhatb.com çalışıyor → http://localhost:${config.port}`);
  console.log(`  Yönetim paneli       → http://localhost:${config.port}/admin`);
  console.log(`  Veri deposu          → ${s.mode === "appwrite" ? `Appwrite (${s.projectId})` : "yerel dosya (data/content.json)"}\n`);
});
