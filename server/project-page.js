const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
function safeUrl(value, fallback = "") {
  const raw = String(value || "").trim();
  if (/^\/(?!\/)/.test(raw)) return raw;
  try { const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`); return ["http:", "https:"].includes(url.protocol) ? url.href : fallback; } catch { return fallback; }
}
function renderProject(project, demoEnabled) {
  const image = safeUrl(project.image);
  const link = project.link ? safeUrl(project.link) : "";
  const gallery = (Array.isArray(project.gallery) ? project.gallery : []).filter((item) => item && safeUrl(item.url)).map((item) => `<figure><img src="${esc(safeUrl(item.url))}" alt="${esc(item.caption || project.title + ' görseli')}" loading="lazy"><figcaption>${esc(item.caption || "Proje görünümü")}</figcaption></figure>`).join("");
  const portfolioImages = {
    3: { url: "/assets/images/ferhatb-cv-preview.png", alt: "CV s\u00fcr\u00fcm\u00fc \u00f6nizlemesi" },
    4: { url: "/assets/images/ferhatb-cv-verify.png", alt: "CV do\u011frulama sayfas\u0131" },
    6: { url: "/assets/images/ferhatb-panel-demo.png", alt: "Y\u00f6netim paneli demo g\u00f6r\u00fcn\u00fcm\u00fc" }
  };
  const section = (number, title, value, index) => {
    if (!value) return "";
    const image = project.id === "ferhatb-portfolio" ? portfolioImages[index] : null;
    return `<article class="case-section${image ? " case-section--visual" : ""}"><div class="case-section-copy"><span class="case-number">${number}</span><h3>${esc(title)}</h3><p>${esc(value)}</p></div>${image ? `<figure class="case-screen"><div class="case-screen-bar" aria-hidden="true"><i></i><i></i><i></i></div><img src="${esc(image.url)}" alt="${esc(image.alt)}" loading="lazy"></figure>` : ""}</article>`;
  };
  const extraSections = (Array.isArray(project.detailSections) ? project.detailSections : []).filter((item) => item && item.title && item.text).map((item, i) => section(String(i + 4).padStart(2, "0"), item.title, item.text, i + 3)).join("");
  const demo = project.demoPanel ? demoEnabled ? `<a class="button primary" href="/admin/demo" target="_blank" rel="noopener noreferrer">Yönetim paneli demosu <span aria-hidden="true">↗</span></a><p class="demo-caption">Örnek verilerle salt okunur demo</p>` : `<p class="demo-caption">Yönetim paneli demosu şu anda kapalı.</p>` : "";
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(project.title)} — Ferhat Bayram</title><meta name="description" content="${esc(project.desc || '')}"><link rel="icon" href="/favicon.jpg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/css/project-detail.css"></head><body><header class="top"><a class="brand" href="/">ferhat<span>b.</span></a><a class="back" href="/#projeler">← Tüm projeler</a></header><main><section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span> SEÇİLİ ÇALIŞMA <b>/ ${esc(project.year || '')}</b></div><h1>${esc(project.title)}</h1><p class="lead">${esc(project.desc || '')}</p><div class="chips">${(Array.isArray(project.tech) ? project.tech : []).map((tag) => `<span>${esc(tag)}</span>`).join('')}</div><div class="actions">${demo}${link ? `<a class="button secondary" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Siteyi ziyaret et ↗</a>` : ''}</div></div>${image ? `<div class="hero-media"><div class="browser-bar"><i></i><i></i><i></i><span>PROJE ÖNİZLEMESİ</span></div><img src="${esc(image)}" alt="${esc(project.title)} önizlemesi"></div>` : ''}</section><div class="content"><section class="case-story"><header class="case-heading"><div><div class="section-label">PROJE HAKKINDA</div><h2>Bir fikrin<br>ger\u00e7ekle\u015fme hik\u00e2yesi<span>.</span></h2></div><p>Fikirden uygulamaya, projenin arkas\u0131ndaki kararlar ve ayr\u0131nt\u0131lar.</p></header><div class="case-sections">${section('01', 'Fikir', project.detailIntro || project.desc, 0)}${section('02', 'Neler yapıldı?', project.detailWork, 1)}${section('03', 'Araçlar ve yaklaşım', project.detailTools, 2)}${extraSections}</div></section>${gallery ? `<section class="gallery"><div class="gallery-title"><div><span class="section-label">İÇERİDEN BİR BAKIŞ</span><h2>Proje görselleri</h2></div><span>↘</span></div><div class="gallery-grid">${gallery}</div></section>` : ''}</div></main><footer><span>© ${new Date().getFullYear()} Ferhat Bayram</span><a href="/#projeler">Diğer projeler →</a></footer></body></html>`;
}
module.exports = { renderProject };
