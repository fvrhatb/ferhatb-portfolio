// CV oluşturucu: sitedeki verilerden seçili CV sürümüne göre A4 CV üretir.
// Hem ana sayfadaki "CV İndir" düğmesi (yazdırma) hem de /cv sayfası bu dosyayı kullanır.
(() => {
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const LABELS = {
    tr: { contact: "İletişim", skills: "Yetenekler", certs: "Sertifikalar", exp: "Deneyim", edu: "Eğitim", projects: "Projeler", languages: "Diller", interests: "İlgi Alanları", references: "Referanslar", personal: "Kişisel Bilgiler", summary: "Profil", email: "E-posta", phone: "Telefon", location: "Konum", linkedin: "LinkedIn", web: "Web", github: "GitHub", birth: "Doğum Tarihi", license: "Ehliyet", military: "Askerlik", verify: "Doğrulama kodu" },
    en: { contact: "Contact", skills: "Skills", certs: "Certificates", exp: "Experience", edu: "Education", projects: "Projects", languages: "Languages", interests: "Interests", references: "References", personal: "Personal Details", summary: "Profile", email: "Email", phone: "Phone", location: "Location", linkedin: "LinkedIn", web: "Web", github: "GitHub", birth: "Date of Birth", license: "Driving License", military: "Military Service", verify: "Verification code" }
  };

  const FALLBACK_VERSION = { id: "genel", name: "Genel CV", template: "modern", accent: "#38bdf8", lang: "tr", showPhoto: true, descMode: "short" };

  function versionList(data) { return (data.cv && Array.isArray(data.cv.versions) && data.cv.versions.length ? data.cv.versions : [FALLBACK_VERSION]); }

  function pickVersion(data, id) {
    const list = versionList(data);
    return list.find((v) => v.id === id) || list.find((v) => v.id === (data.cv || {}).activeVersion) || list[0];
  }

  // "assets/..." gibi göreli yollar /cv/... altında bozulmasın
  const url = (u) => (!u ? "" : /^(https?:|data:|\/)/i.test(u) ? u : "/" + u);

  const initials = (name) => String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  function shorten(text = "") {
    const parts = String(text).split(/(?<=[^\d\s]\.)\s+/);
    let out = parts[0] || "";
    for (let i = 1; i < parts.length && (out + " " + parts[i]).length <= 230; i++) out += " " + parts[i];
    return out.length > 240 ? out.slice(0, 237).trim() + "…" : out;
  }

  // Sürümün gösterdiği içerik
  function resolve(data, versionId) {
    const cv = data.cv || {};
    const v = pickVersion(data, versionId);
    const L = LABELS[v.lang] || LABELS.tr;
    const src = data.cvSource || data; // CV, sitede pasif yapılan kartları da bilir; hangisinin görüneceğini sürüm belirler
    const visible = (list, hidden) => (list || []).filter((it) => !(hidden || []).includes(it.id));
    const on = (key) => v[key] !== false;
    const contact = [
      [L.email, cv.email, cv.email ? `mailto:${cv.email}` : ""],
      [L.phone, cv.phone],
      [L.location, cv.location],
      [L.linkedin, cv.linkedin],
      [L.github, cv.github],
      [L.web, cv.web]
    ].filter((r) => r[1]);
    const personal = [[L.birth, cv.birthDate], [L.license, cv.drivingLicense], [L.military, cv.militaryStatus]].filter((r) => r[1]);
    return {
      v, L, cv,
      name: cv.name || "",
      role: v.role || cv.role || "",
      summary: on("showSummary") ? (v.summary || cv.summary || "") : "",
      photo: v.showPhoto !== false ? cv.photo || "" : "",
      contact,
      personal: v.showPersonal === true ? personal : [],
      skills: on("showSkills") ? (cv.skills || []).filter((s) => s && !(v.hiddenSkills || []).includes(s)) : [],
      certs: on("showCertificates") ? visible(src.certificates, v.hiddenCertificates) : [],
      exp: visible(src.experience, v.hiddenExperience),
      edu: visible(src.education, v.hiddenEducation),
      projects: on("showProjects") ? visible(src.projects, v.hiddenProjects) : [],
      languages: on("showLanguages") ? (Array.isArray(v.languages) ? v.languages : cv.languages || []).filter((x) => x && x.name) : [],
      interests: on("showInterests") ? (Array.isArray(v.interests) ? v.interests : cv.interests || []).filter(Boolean) : [],
      references: on("showReferences") ? (Array.isArray(v.references) ? v.references : cv.references || []).filter((x) => x && x.name) : []
    };
  }

  function desc(text, mode) {
    if (mode === "none" || !text) return "";
    return `<p class="cv-desc">${esc(mode === "full" ? text : shorten(text))}</p>`;
  }

  function build(m) {
    const { v, L } = m;
    const mode = v.descMode || "short";
    const logo = (item, name) => item.logo ? `<img class="cv-logo" src="${esc(url(item.logo))}" alt="">` : `<span class="cv-logo cv-logo-ph">${esc(initials(name))}</span>`;
    const entry = (item, kind) => {
      const name = kind === "project" ? item.title : item.company || item.school;
      const sub = kind === "project" ? [item.status, (item.tech || []).join(", ")].filter(Boolean).join(" · ") : item.role || item.department;
      const date = kind === "project" ? item.year : item.period;
      return `<div class="cv-entry">${logo(item, name)}<div class="cv-entry-body">
        <div class="cv-entry-top"><strong>${esc(name)}</strong><span class="cv-date">${esc(date)}</span></div>
        ${sub ? `<p class="cv-sub">${esc(sub)}</p>` : ""}${desc(item.details || item.desc, mode)}</div></div>`;
    };
    const sec = (title, inner, cls = "") => inner ? `<section class="cv-sec ${cls}"><h2 class="cv-h">${esc(title)}</h2>${inner}</section>` : "";

    return {
      photo: m.photo ? `<img class="cv-photo" src="${esc(url(m.photo))}" alt="${esc(m.name)}">` : "",
      contact: m.contact.length ? sec(L.contact, m.contact.map(([l, val]) => `<div class="cv-contact-row"><small>${esc(l)}</small><span>${esc(val)}</span></div>`).join(""), "cv-contact") : "",
      personal: m.personal.length ? sec(L.personal, m.personal.map(([l, val]) => `<div class="cv-contact-row"><small>${esc(l)}</small><span>${esc(val)}</span></div>`).join("")) : "",
      skills: sec(L.skills, m.skills.length ? `<div class="cv-chips">${m.skills.map((s) => `<span class="cv-chip">${esc(s)}</span>`).join("")}</div>` : ""),
      languages: sec(L.languages, m.languages.map((x) => `<div class="cv-lang"><strong>${esc(x.name)}</strong>${x.level ? `<span>${esc(x.level)}</span>` : ""}</div>`).join("")),
      certs: sec(L.certs, m.certs.map((c) => `<div class="cv-cert"><strong>${esc(c.title)}</strong>${c.issuer ? `<span>${esc(c.issuer)}</span>` : ""}${mode === "full" && c.desc ? `<p class="cv-desc">${esc(c.desc)}</p>` : ""}</div>`).join("")),
      interests: sec(L.interests, m.interests.length ? `<div class="cv-chips">${m.interests.map((s) => `<span class="cv-chip">${esc(s)}</span>`).join("")}</div>` : ""),
      exp: sec(L.exp, m.exp.map((i) => entry(i, "exp")).join("")),
      edu: sec(L.edu, m.edu.map((i) => entry(i, "edu")).join("")),
      projects: sec(L.projects, m.projects.map((i) => entry(i, "project")).join("")),
      references: sec(L.references, m.references.map((r) => `<div class="cv-ref"><strong>${esc(r.name)}</strong>${r.title ? `<span>${esc(r.title)}</span>` : ""}${r.contact ? `<span>${esc(r.contact)}</span>` : ""}</div>`).join("")),
      summary: m.summary ? `<section class="cv-sec cv-summary-sec"><h2 class="cv-h">${esc(L.summary)}</h2><p class="cv-summary">${esc(m.summary)}</p></section>` : "",
      head: `<header class="cv-head"><h1>${esc(m.name)}</h1>${m.role ? `<p class="cv-role">${esc(m.role)}</p>` : ""}<div class="cv-bar"></div></header>`
    };
  }

  const TEMPLATES = {
    // Koyu yan panelli modern şablon
    modern: (b) => `<aside class="cv-side">${b.photo}${b.contact}${b.personal}${b.skills}${b.languages}${b.certs}${b.interests}</aside>
      <main class="cv-main">${b.head}${b.summary}${b.exp}${b.projects}${b.edu}${b.references}</main>`,
    // Tek sütun, sade, işe alım yazılımlarına (ATS) uygun klasik şablon
    klasik: (b) => `<header class="cv-top">${b.head}${b.photo}</header>${b.contact}${b.personal}${b.summary}${b.exp}${b.edu}${b.projects}${b.skills}${b.certs}${b.languages}${b.interests}${b.references}`,
    // Renkli üst bantlı, iki sütunlu zarif şablon
    zarif: (b) => `<header class="cv-top">${b.photo}${b.head}</header>
      <div class="cv-cols"><main class="cv-main">${b.summary}${b.exp}${b.projects}${b.edu}${b.references}</main>
      <aside class="cv-side">${b.contact}${b.personal}${b.skills}${b.languages}${b.certs}${b.interests}</aside></div>`,
    // Tarih sütunlu, sıkışık içerik için kompakt şablon
    kompakt: (b) => `<header class="cv-top">${b.head}${b.photo}</header>${b.contact}${b.summary}${b.exp}${b.edu}${b.projects}${b.skills}${b.certs}${b.languages}${b.interests}${b.references}`
  };

  // Doğrulama QR kodu için yer tutucu; kod sunucudan gelince attachCode doldurur
  function qrPlaceholder(m) {
    return m.v.showQr === false || typeof window === "undefined" || typeof window.qrcode !== "function" ? "" : '<div class="cv-qr is-pending"></div>';
  }

  const codeCache = {};
  const fmtCode = (c) => `FB-${c.slice(0, 4)}-${c.slice(4)}`;

  // Sunucudan bu CV'nin doğrulama kodunu alır; QR kodu ve kodu yazar. draft: kaydedilmemiş taslak önizlemesi
  async function attachCode(root, data, versionId, opts = {}) {
    const el = root.querySelector(".cv-qr");
    if (!el) return;
    const v = pickVersion(data, versionId);
    const site = String((data.site && data.site.url) || location.origin).replace(/\/+$/, "");
    const host = site.replace(/^https?:\/\//, "");
    let code = "";
    if (!opts.draft) {
      try {
        codeCache[v.id] = codeCache[v.id] || fetch("/api/cv/code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ v: v.id }) })
          .then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => d.code);
        code = await codeCache[v.id];
      } catch { delete codeCache[v.id]; }
      if (!code) { // kod alınamadıysa sahte bir QR basma
        const doc = el.closest(".cvdoc");
        el.remove();
        if (doc) doc.classList.remove("has-qr");
        return;
      }
    }
    if (!root.contains(el)) return; // bu arada başka sürüme geçildiyse
    const link = code ? `${site}/cv/dogrula?k=${code}` : `${site}/cv/dogrula`;
    try {
      const qr = window.qrcode(0, "M");
      qr.addData(link);
      qr.make();
      const L = LABELS[v.lang] || LABELS.tr;
      el.innerHTML = `${qr.createSvgTag({ cellSize: 2, margin: 2, scalable: true })}<span>${esc(L.verify)}</span><b>${code ? esc(fmtCode(code)) : "TASLAK"}</b><small>${esc(host)}/cv/dogrula</small>`;
      el.classList.remove("is-pending");
    } catch { el.remove(); }
  }

  function render(root, data, versionId) {
    const m = resolve(data, versionId);
    const tpl = TEMPLATES[m.v.template] ? m.v.template : "modern";
    const accent = /^#[0-9a-f]{3,8}$/i.test(m.v.accent || "") ? m.v.accent : "#38bdf8";
    const qr = qrPlaceholder(m);
    root.innerHTML = `<div class="cvdoc${qr ? " has-qr" : ""}" data-tpl="${tpl}" style="--acc:${accent}"><div class="cv-page cv-${tpl}">${TEMPLATES[tpl](build(m))}</div>${qr}</div>`;
    return m;
  }

  const A4_PX = (297 * 96) / 25.4;

  // İçerik tek sayfaya sığmıyorsa küçültür (en fazla %72'ye kadar). Sonuç: { pages, zoom }
  function fit(root) {
    const doc = root.querySelector(".cvdoc");
    const page = doc && doc.querySelector(".cv-page");
    if (!doc || !page) return { pages: 1, zoom: 1 };
    doc.style.setProperty("--z", "1");
    doc.classList.add("is-measuring");
    const needed = page.scrollHeight;
    doc.classList.remove("is-measuring");
    if (!needed) return { pages: 1, zoom: 1 };
    let zoom = Math.min(1, (A4_PX - 3) / needed);
    let pages = 1;
    if (zoom < 0.72) { zoom = 0.72; pages = Math.max(2, Math.ceil((needed * zoom) / (A4_PX - 3))); }
    zoom = Math.floor(zoom * 1000) / 1000;
    doc.style.setProperty("--z", String(zoom));
    doc.dataset.pages = String(pages);
    return { pages, zoom };
  }

  const api = { render, fit, resolve, attachCode, versions: versionList, pickVersion, TEMPLATE_IDS: Object.keys(TEMPLATES) };
  if (typeof module !== "undefined" && module.exports) module.exports = api; // sunucu, kod üretirken aynı kuralları kullanır
  else window.FerbCvRender = api;
})();
