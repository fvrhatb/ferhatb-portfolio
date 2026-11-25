// Siteyi içerikten üretir: index.html şablonundaki {{alan}} yerlerini doldurur ve /js/data.js'i oluşturur.
const fs = require("fs");
const path = require("path");
const config = require("./env");

const TEMPLATE = path.join(__dirname, "views", "index.html");
let templateCache = null;

function template() {
  if (!templateCache || !config.isProd) templateCache = fs.readFileSync(TEMPLATE, "utf8");
  return templateCache;
}

const esc = (v) => String(v ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const ICONS = {
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zm-1.29 19.494h2.039L6.486 3.24H4.298z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5.5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>',
  discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.74 19.74 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.079.009c.12.099.246.198.373.292a.077.077 0 01-.006.127 12.3 12.3 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 00-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 015.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.27 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0012 .5z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 2h-3.3v13.4a2.9 2.9 0 11-2.9-2.9c.3 0 .6 0 .8.1V9.2a6.3 6.3 0 105.4 6.2V8.6a7.9 7.9 0 004.6 1.5V6.8A4.6 4.6 0 0116.6 2z"/></svg>',
  spotify: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M7 9.5c3.5-1 7-.7 10 1M7.5 13c3-.8 5.8-.5 8.3.9M8 16.3c2.4-.6 4.6-.4 6.6.7"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1"/></svg>'
};

function socialsHtml(items = []) {
  return items.map((s) => {
    const label = esc(s.label || "Bağlantı");
    const inner = s.icon === "text" || !ICONS[s.icon] ? esc((s.text || s.label || "?").slice(0, 2)) : ICONS[s.icon];
    if (s.icon === "discord" && !s.url) {
      return `<button type="button" class="social-link-btn" id="copy-discord-btn" aria-label="Discord kullanıcı adını kopyala" data-tooltip="${label}"><span aria-hidden="true">${inner}</span></button>`;
    }
    const href = esc(s.icon === "mail" && s.url && !s.url.includes(":") ? `mailto:${s.url}` : s.url || "#");
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="social-link-btn" aria-label="${label} profilini aç" data-tooltip="${label}"><span aria-hidden="true">${inner}</span></a>`;
  }).join("\n            ");
}

function absUrl(base, value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${String(base || "").replace(/\/+$/, "")}/${String(value).replace(/^\/+/, "")}`;
}

const on = (list) => (Array.isArray(list) ? list : []).filter((x) => x && x.enabled !== false);

// Tarayıcıdaki main.js'in beklediği veri (eski data.js yapısıyla uyumlu + yeni alanlar)
function buildProfileData(c, extra = {}) {
  const s = c.settings;
  const sec = { education: {}, ...(c.sections || {}) };
  return {
    discordId: s.discordId,
    discordUsername: s.discordUsername,
    email: c.profile.email,
    avatarUrls: { primary: c.profile.avatar, secondary: `https://api.lanyard.rest/${s.discordId}.png` },
    spotifyFallbackArt: s.spotifyFallbackArt,
    consoleEffects: Array.isArray(s.consoleEffects) ? s.consoleEffects.filter((item) => item && item.enabled !== false && typeof item.trigger === "string" && typeof item.emoji === "string").map((item) => ({ trigger: item.trigger.trim().slice(0, 40), emoji: item.emoji.trim().slice(0, 32) })).filter((item) => item.trigger && item.emoji) : [],
    site: { defaultTheme: s.defaultTheme === "dark" ? "dark" : "light", url: s.siteUrl },
    profile: c.profile,
    about: { ...c.about, techStack: on(c.about.techStack), liveStatuses: c.profile.liveStatuses || [], skills: c.cv.skills || [] },
    // Sitede yalnızca açık (pasif yapılmamış) kartlar görünür; CV oluşturucu ise hepsini bilir ve sürüm kurallarıyla süzer
    education: sec.education.showSchools === false ? [] : on(c.education.items),
    certificates: sec.education.showCertificates === false ? [] : on(c.certificates.items),
    experience: on(c.experience.items),
    projects: on(c.projects.items),
    cvSource: { education: c.education.items || [], certificates: c.certificates.items || [], experience: c.experience.items || [], projects: c.projects.items || [] },
    sections: Object.fromEntries(Object.entries(c.sections || {}).map(([k, v]) => [k, { title: v.title, nav: v.nav, enabled: v.enabled !== false }])),
    comingSoon: c.projects.comingSoon || {},
    cv: c.cv,
    socialLinks: (c.socials.items || []).map((x) => ({ label: x.label, icon: x.icon, url: x.url })),
    counter: { enabled: c.counter.enabled !== false },
    presence: { enabled: Boolean(c.presence.enabled), wave: c.presence.wave !== false, showHint: c.presence.showHint !== false, label: c.presence.label || "Ziyaretçi" },
    snake: { showRecord: c.snake.showRecord !== false, recordLabel: c.snake.recordLabel || "Rekor", record: extra.snakeRecord || null }
  };
}

function dataJs(content, extra) {
  const json = JSON.stringify(buildProfileData(content, extra)).replace(/</g, "\\u003c");
  return `window.FerbCV = window.FerbCV || {};\nwindow.FerbCV.profileData = ${json};\n`;
}

function lookup(obj, key) {
  return key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function renderIndex(content, visits = 0) {
  const s = content.settings;
  const theme = s.defaultTheme === "dark" ? "dark" : "light";
  const siteUrl = String(s.siteUrl || "").replace(/\/+$/, "");
  const ogImage = absUrl(siteUrl, s.ogImage);
  const statuses = content.profile.liveStatuses || [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: content.profile.name,
    alternateName: content.profile.username,
    url: `${siteUrl}/`,
    image: ogImage,
    jobTitle: s.jobTitle,
    address: { "@type": "PostalAddress", addressLocality: s.city, addressCountry: "TR" },
    alumniOf: (content.education.items || []).filter((e) => /üniversite/i.test(e.school)).map((e) => ({ "@type": "CollegeOrUniversity", name: e.school })),
    sameAs: (content.socials.items || []).map((x) => x.url).filter((u) => /^https?:/.test(u))
  };
  const view = {
    ...content,
    view: {
      theme,
      themeColor: theme === "dark" ? "#0b1220" : "#ffffff",
      canonical: `${siteUrl}/`,
      ogImage,
      firstStatus: statuses[0] || "",
      liveStatusHidden: content.profile.liveStatusesEnabled === false || !statuses.length ? "hidden" : "",
      twitter: String(s.twitter || "").replace(/^@/, ""),
      socials: socialsHtml(content.socials.items),
      jsonLd: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      favicon: s.favicon || "/favicon.jpg",
      hide: Object.fromEntries(["about", "education", "experience", "projects"].map((k) => [k, (content.sections[k] || {}).enabled === false || (k === "education" && (content.sections.education || {}).showSchools === false && (content.sections.education || {}).showCertificates === false) || (k === "projects" && !on(content.projects.items).length && content.projects.comingSoon.enabled === false) ? "hidden" : ""])),
      cvLabel: content.cv.buttonLabel || "CV İndir",
      cvHint: content.cv.buttonHint || "",
      counterHidden: content.counter.enabled === false ? "hidden" : "",
      counterValue: Number(visits).toLocaleString("tr-TR"),
      counterLabel: content.counter.label || "görüntülenme"
    }
  };
  return template().replace(/\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{\s*([\w.]+)\s*\}\}/g, (_, raw, safe) =>
    raw ? String(lookup(view, raw) ?? "") : esc(lookup(view, safe)));
}

module.exports = { renderIndex, dataJs, buildProfileData };
