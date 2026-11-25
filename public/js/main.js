document.addEventListener("DOMContentLoaded", () => {
  const { profileData, LanyardClient, EffectsController } = window.FerbCV;
  // Panelde "Kendi fotoğrafım" seçildiyse Discord bağlı olsa da yüklenen fotoğraf gösterilir.
  const useDiscordAvatar = (profileData.profile && profileData.profile.avatarSource) !== "custom";
  let spotifyProgressTimer = null;
  let activeSpotifyTimestamps = null;
  let currentActivities = [];
  let currentActivityIndex = 0;
  let latestPresence = null;
  let latestDiscordStatus = null;
  let latestLanyardPresence = null;
  let lanyardAvailable = false;
  let spotifyFallbackTimer = null;
  let spotifyFallbackRequest = 0;
  let themedAlbumUrl = "";
  const timelinePages = { education: 0, experience: 0 };
  let activeProjectFilter = "all";
  let activeProjectPage = 0;
  let snakeTimer = null;
  let snakeState = null;

  function escapeXml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function createSvgFallback(label) {
    const safeLabel = escapeXml(label || (profileData.profile && profileData.profile.name) || "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#g)"/>
      <text x="50%" y="50%" fill="#38bdf8" font-family="Poppins, sans-serif" font-size="24" font-weight="600" text-anchor="middle" dominant-baseline="middle">${safeLabel}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function bindImageFallback(img, fallbackUrl, label) {
    img.dataset.fallbackUrl = fallbackUrl || "";
    img.dataset.fallbackLabel = label || (profileData.profile && profileData.profile.name) || "";
    img.dataset.fallbackStep = "0";

    if (img.dataset.fallbackBound === "1") return;
    img.dataset.fallbackBound = "1";

    img.addEventListener("error", () => {
      const step = Number(img.dataset.fallbackStep || "0") + 1;
      img.dataset.fallbackStep = String(step);
      if (step === 1 && img.dataset.fallbackUrl) {
        img.src = img.dataset.fallbackUrl;
      } else if (step <= 2) {
        img.src = createSvgFallback(img.dataset.fallbackLabel);
      }
    });
  }

  function renderAbout() {
    const container = document.getElementById("about-bento-grid");
    const { about } = profileData;

    container.innerHTML = `
      <article class="bento-card bento-span-7">
        <p class="manifesto-quote">“${about.manifesto}”</p>
        <p class="bento-text">${about.summary}</p>
        <div class="tag-cloud">
          ${about.tags.map((tag) => `<span class="tech-pill accent">${tag}</span>`).join("")}
        </div>
      </article>

      <article class="bento-card bento-photo-card bento-span-5">
        <img id="workspace-photo" src="${about.workspaceImage}" alt="${about.workspaceAlt || "Yazılım geliştirme çalışma alanı"}" referrerpolicy="no-referrer" />
        <div class="bento-photo-overlay">
          <p style="font-size:0.82rem;font-weight:600;">${about.workspaceCaption}</p>
        </div>
      </article>

      <article class="bento-card bento-span-6">
        <h3 style="font-size:1rem;font-weight:600;">${about.visionTitle}</h3>
        <p class="bento-text">${about.visionText}</p>
      </article>

      <article class="bento-card bento-span-6">
        <h3 style="font-size:1rem;font-weight:600;">${about.techTitle || "Yetenekler"}</h3>
        <div class="tag-cloud">
          ${about.techStack
            .map((t) => `<span class="tech-pill ${t.primary ? "accent" : ""}">${t.label}</span>`)
            .join("")}
        </div>
      </article>
    `;

    const workspaceImg = document.getElementById("workspace-photo");
    bindImageFallback(workspaceImg, about.workspaceFallback, "Workspace");
  }

  const TR_MONTHS = { ocak: 0, şubat: 1, mart: 2, nisan: 3, mayıs: 4, haziran: 5, temmuz: 6, ağustos: 7, eylül: 8, ekim: 9, kasım: 10, aralık: 11 };
  function isOngoing(period) {
    const text = String(period || "").toLocaleLowerCase("tr");
    if (text.includes("devam")) return true;
    const dates = [...text.matchAll(/(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+(\d{4})/g)]
      .map((m) => new Date(+m[2], TR_MONTHS[m[1]], 1));
    if (dates.length < 2) return false;
    const now = new Date();
    const end = new Date(dates[1].getFullYear(), dates[1].getMonth() + 1, 1);
    return dates[0] <= now && now < end;
  }

  function renderEducation() {
    renderTimelinePage("education", profileData.education, (item) => `
      <article class="timeline-card${isOngoing(item.period) ? " is-current" : ""}">
        ${renderOrganizationMark(item, item.school)}
        <div class="timeline-content"><div class="timeline-top"><h3 class="timeline-org">${item.school}</h3><span class="timeline-date">${item.period}</span></div>
        <p class="timeline-role">${item.department}</p><p class="timeline-desc">${item.details}</p></div>
      </article>`);

    const certs = document.getElementById("certificates-list");
    certs.innerHTML = profileData.certificates
      .map(
        (c) => `
      <div class="cert-card">
        ${renderOrganizationMark(c, c.issuer.split(" • ")[0])}
        <div><h4 class="cert-title">${c.title}</h4>
        <p class="cert-desc" style="color:var(--accent);font-weight:500;margin-bottom:4px;">${c.issuer}</p>
        <p class="cert-desc">${c.desc}</p></div>
      </div>
    `
      )
      .join("");
  }

  function renderExperience() {
    renderTimelinePage("experience", profileData.experience, (item) => `
      <article class="timeline-card${isOngoing(item.period) ? " is-current" : ""}">
        ${renderOrganizationMark(item, item.company)}
        <div class="timeline-content"><div class="timeline-top"><h3 class="timeline-org">${item.company}</h3><span class="timeline-date">${item.period}</span></div>
        <p class="timeline-role">${item.role}</p><p class="timeline-desc">${item.details}</p></div>
      </article>`);
  }

  function getInitials(label) {
    return String(label || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function renderOrganizationMark(item, name) {
    if (item.logo) {
      return `<img class="org-mark" src="${item.logo}" alt="${item.logoAlt || `${name} logosu`}" loading="lazy" />`;
    }
    return `<span class="org-mark org-mark-placeholder" role="img" aria-label="${name} için logo alanı">${getInitials(name)}</span>`;
  }

  function rgbToHsl(red, green, blue) {
    const r = red / 255, g = green / 255, b = blue / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hue = 0;
    const lightness = (max + min) / 2;
    const delta = max - min;
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
    if (delta !== 0) {
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue = Math.round(hue * 60);
      if (hue < 0) hue += 360;
    }
    return { hue, saturation: Math.round(saturation * 100), lightness: Math.round(lightness * 100) };
  }

  function resetDynamicAccent() {
    const root = document.documentElement.style;
    ["--accent", "--accent-soft", "--accent-glow", "--song-bg-primary", "--song-bg-secondary"].forEach((name) => root.removeProperty(name));
    themedAlbumUrl = "";
  }

  function applyAlbumAccent(url) {
    return; // Şarkıya göre değişen tema rengi kapalı: sabit vurgu rengi (flaş/yanıp sönme olmasın)
    if (!url || url === themedAlbumUrl) return;
    themedAlbumUrl = url;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 28;
        canvas.width = canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        let red = 0, green = 0, blue = 0, count = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
          const spread = Math.max(r, g, b) - Math.min(r, g, b);
          const brightness = (r + g + b) / 3;
          if (spread > 28 && brightness > 35 && brightness < 225) {
            red += r; green += g; blue += b; count += 1;
          }
        }
        if (!count) return;
        const color = rgbToHsl(red / count, green / count, blue / count);
        const saturation = Math.max(54, Math.min(84, color.saturation));
        const lightness = Math.max(48, Math.min(62, color.lightness));
        const root = document.documentElement.style;
        root.setProperty("--accent", `hsl(${color.hue} ${saturation}% ${lightness}%)`);
        root.setProperty("--accent-soft", `hsl(${color.hue} ${saturation}% ${lightness}% / 0.14)`);
        root.setProperty("--accent-glow", `hsl(${color.hue} ${saturation}% ${lightness}% / 0.13)`);
        root.setProperty("--song-bg-primary", `hsl(${color.hue} ${Math.min(70, saturation)}% ${Math.max(24, lightness - 20)}% / 0.24)`);
        root.setProperty("--song-bg-secondary", `hsl(${(color.hue + 38) % 360} ${Math.min(66, saturation)}% ${Math.max(20, lightness - 25)}% / 0.18)`);
      } catch (_) {
        // CORS izin vermeyen kapaklarda varsayılan vurgu rengi korunur.
      }
    };
    image.onerror = () => { if (themedAlbumUrl === url) resetDynamicAccent(); };
    image.src = url;
  }

  function renderTimelinePage(type, items, renderItem) {
    const list = document.getElementById(`${type}-list`);
    const pageSize = 3;
    const totalPages = Math.ceil(items.length / pageSize);
    const page = Math.min(timelinePages[type], totalPages - 1);
    timelinePages[type] = page;
    const visibleItems = items.slice(page * pageSize, (page + 1) * pageSize);
    list.innerHTML = visibleItems.map(renderItem).join("") + (totalPages > 1 ? `
      <nav class="timeline-pagination" aria-label="${type === "education" ? "Eğitim" : "Çalışma hayatı"} sayfaları">
        <button type="button" class="timeline-page-btn" data-timeline="${type}" data-direction="-1" ${page === 0 ? "disabled" : ""} aria-label="Önceki sayfa">‹</button>
        <span class="timeline-page-status" aria-live="polite">${page + 1} / ${totalPages}</span>
        <button type="button" class="timeline-page-btn" data-timeline="${type}" data-direction="1" ${page === totalPages - 1 ? "disabled" : ""} aria-label="Sonraki sayfa">›</button>
      </nav>` : "");

    list.querySelectorAll(".timeline-page-btn").forEach((button) => {
      button.addEventListener("click", () => {
        timelinePages[type] += Number(button.dataset.direction);
        renderTimelinePage(type, items, renderItem);
      });
    });
  }

  function renderComingSoon(grid) {
    const soon = profileData.comingSoon || {};
    if (soon.enabled === false) { grid.innerHTML = ""; return; }
    grid.innerHTML = `
      <article class="soon-card" id="soon-card" tabindex="0" role="button" aria-label="Konfeti patlat">
        <div class="soon-glow" aria-hidden="true"></div>
        <div class="soon-inner">
          <span class="soon-badge"><i aria-hidden="true"></i>${soon.badge || ""}</span>
          ${soon.emoji ? `<div class="soon-emoji" aria-hidden="true">${soon.emoji}</div>` : ""}
          <h3 class="soon-title">${soon.title || ""}</h3>
          <p class="soon-text">${soon.text || ""}</p>
          ${soon.hint ? `<span class="soon-hint">${soon.hint}</span>` : ""}
        </div>
      </article>`;
    const card = document.getElementById("soon-card");
    const fire = (e) => {
      if (e && e.type === "click") siteConfetti(e.clientX, e.clientY);
      else { const r = card.getBoundingClientRect(); siteConfetti(r.left + r.width / 2, r.top + r.height * 0.4); }
    };
    card.addEventListener("click", fire);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) { setTimeout(fire, 450); io.disconnect(); }
      }, { threshold: 0.55 });
      io.observe(card);
    }
  }

  /* Tüm sayfayı kaplayan konfeti: merkez patlaması + iki yan top + yukarıdan yağmur, farklı şekiller */
  const confetti = { canvas: null, ctx: null, pieces: [], raf: 0, w: 0, h: 0 };
  function siteConfetti(x, y) {
    const c = confetti;
    if (!c.canvas) {
      c.canvas = document.createElement("canvas");
      c.canvas.setAttribute("aria-hidden", "true");
      c.canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
      document.body.appendChild(c.canvas);
      c.ctx = c.canvas.getContext("2d");
    }
    const d = Math.min(window.devicePixelRatio || 1, 2);
    c.w = window.innerWidth; c.h = window.innerHeight;
    c.canvas.width = c.w * d; c.canvas.height = c.h * d;
    c.ctx.setTransform(d, 0, 0, d, 0, 0);
    const colors = ["#38bdf8", "#818cf8", "#f472b6", "#fbbf24", "#34d399", "#fb7185", "#ffffff", "#c084fc"];
    const shapes = ["rect", "rect", "circle", "star", "ribbon"];
    const add = (px, py, angle, spread, speed, n, gravity = 0.32) => {
      for (let i = 0; i < n; i++) {
        const a = angle + (Math.random() - 0.5) * spread, v = speed * (0.45 + Math.random() * 0.75);
        c.pieces.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: gravity, drag: 0.985 - Math.random() * 0.012,
          s: 6 + Math.random() * 7, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.35, ph: Math.random() * 6.28,
          col: colors[(Math.random() * colors.length) | 0], shape: shapes[(Math.random() * shapes.length) | 0], life: 1, decay: 0.004 + Math.random() * 0.004 });
      }
    };
    const mobile = c.w < 700, k = mobile ? 0.6 : 1;
    add(x, y, 0, Math.PI * 2, 17 * k, Math.round(120 * k), 0.34);              // merkez patlaması
    setTimeout(() => {                                                          // yan toplar
      add(0, c.h, -Math.PI * 0.32, 0.55, 30 * k, Math.round(70 * k), 0.4);
      add(c.w, c.h, -Math.PI * 0.68, 0.55, 30 * k, Math.round(70 * k), 0.4);
    }, 180);
    setTimeout(() => {                                                          // yukarıdan yağmur
      for (let i = 0; i < Math.round(90 * k); i++) add(Math.random() * c.w, -20 - Math.random() * 160, Math.PI / 2, 0.4, 2 + Math.random() * 3, 1, 0.07);
    }, 450);
    if (c.pieces.length > 650) c.pieces.splice(0, c.pieces.length - 650);
    if (!c.raf) c.raf = requestAnimationFrame(confettiTick);
  }
  function confettiTick() {
    const c = confetti, ctx = c.ctx;
    ctx.clearRect(0, 0, c.w, c.h);
    c.pieces = c.pieces.filter((p) => p.life > 0 && p.y < c.h + 40);
    for (const p of c.pieces) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx + Math.sin(p.ph) * 0.6; p.y += p.vy;
      p.rot += p.vr; p.ph += 0.08; p.life -= p.decay;
      ctx.save(); ctx.globalAlpha = Math.min(1, p.life * 2.2); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.col; ctx.shadowColor = p.col; ctx.shadowBlur = 8;
      const s = p.s, flip = Math.cos(p.ph);
      if (p.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, s / 2.2, 0, 6.283); ctx.fill(); }
      else if (p.shape === "star") {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? s / 4 : s / 1.6, a = (i * Math.PI) / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill();
      } else if (p.shape === "ribbon") { ctx.scale(1, flip); ctx.fillRect(-s * 0.9, -s / 7, s * 1.8, s / 3.5); }
      else { ctx.scale(1, flip); ctx.fillRect(-s / 2, -s / 3, s, s / 1.6); }
      ctx.restore();
    }
    c.raf = c.pieces.length ? requestAnimationFrame(confettiTick) : 0;
    if (!c.raf) ctx.clearRect(0, 0, c.w, c.h);
  }

  function renderProjects(filter = "all") {
    const grid = document.getElementById("projects-grid");
    const pagination = document.getElementById("projects-pagination");
    const filtered =
      filter === "all"
        ? profileData.projects
        : profileData.projects.filter((p) => p.category === filter);
    if (!filtered.length) {
      pagination.innerHTML = "";
      renderComingSoon(grid);
      return;
    }
    // İlk sayfa: öne çıkan geniş kart + 2 kart (3 öğe, grid dolu). Sonraki sayfalar: 4 kart (2x2).
    const firstSize = filter === "all" && filtered[0] && filtered[0].featured ? 3 : 4;
    const restSize = 4;
    const totalPages = 1 + Math.max(0, Math.ceil((filtered.length - firstSize) / restSize));
    activeProjectPage = Math.min(activeProjectPage, totalPages - 1);
    const start = activeProjectPage === 0 ? 0 : firstSize + (activeProjectPage - 1) * restSize;
    const end = activeProjectPage === 0 ? firstSize : start + restSize;
    const visibleProjects = filtered.slice(start, end);

    grid.innerHTML = visibleProjects
      .map(
        (project, idx) => `
      <article class="project-card ${project.featured && filter === "all" ? "is-featured" : ""}">
        <div class="project-media ${project.framedThumb ? "is-framed-thumb" : ""}">
          <div class="project-browser">
          <div class="project-browser-bar" aria-hidden="true"><span></span><span></span><span></span><i></i></div>
          <img
            id="project-img-${idx}"
            src="${project.image}"
            alt="${project.title} önizleme görseli"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          </div>
          <span class="project-status-badge">${project.status}</span>
        </div>
        <div class="project-body">
          <div>
            <div class="project-title-row">
              <h3 class="project-title">${project.title}</h3>
              <span class="project-year">${project.year}</span>
            </div>
            <p class="project-desc" style="margin-top:8px;">${project.desc}</p>
          </div>
          <div class="project-footer">
            <div class="tag-cloud">
              ${project.tech.map((t) => `<span class="tech-pill">${t}</span>`).join("")}
            </div>
            <a href="/projeler/${encodeURIComponent(project.id)}" class="project-link project-discover" aria-label="${project.title} projesini keşfet">Projeyi keşfet <span aria-hidden="true">→</span></a>
            ${project.link ? `<a href="${/^(https?:\/\/|\/|#)/i.test(project.link) ? project.link : `https://${project.link}`}" target="_blank" rel="noopener noreferrer" class="project-link project-external">Siteyi aç ↗</a>` : ""}
          </div>
        </div>
      </article>
    `
      )
      .join("");

    visibleProjects.forEach((project, idx) => {
      const img = document.getElementById(`project-img-${idx}`);
      if (img) bindImageFallback(img, project.fallbackImage, project.title);
    });

    pagination.innerHTML = totalPages > 1 ? `
      <button type="button" class="project-page-btn" data-direction="-1" ${activeProjectPage === 0 ? "disabled" : ""} aria-label="Önceki proje sayfası">‹</button>
      <span class="project-page-status" aria-live="polite">${activeProjectPage + 1} / ${totalPages}</span>
      <button type="button" class="project-page-btn" data-direction="1" ${activeProjectPage === totalPages - 1 ? "disabled" : ""} aria-label="Sonraki proje sayfası">›</button>` : "";

    pagination.querySelectorAll(".project-page-btn").forEach((button) => {
      button.addEventListener("click", () => {
        activeProjectPage += Number(button.dataset.direction);
        renderProjects(activeProjectFilter);
      });
    });

    EffectsController.initCardTilt();
  }

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function updateProgressUI() {
    if (!activeSpotifyTimestamps) return;
    const { start, end } = activeSpotifyTimestamps;
    const total = Math.max(end - start, 1);
    const elapsed = Math.min(Math.max(Date.now() - start, 0), total);
    const pct = (elapsed / total) * 100;

    document.getElementById("spotify-progress-fill").style.width = `${pct.toFixed(1)}%`;
    document.getElementById("spotify-time-elapsed").textContent = formatTime(elapsed);
    document.getElementById("spotify-time-total").textContent = formatTime(total);
  }

  function renderPresence(data) {
    const statusMap = {
      online: { cls: "status-online", label: "Çevrimiçi" },
      idle: { cls: "status-idle", label: "Boşta" },
      dnd: { cls: "status-dnd", label: "Rahatsız Etmeyin" },
      offline: { cls: "status-offline", label: "Çevrimdışı" }
    };

    const st = statusMap[data.discord_status] || statusMap.offline;
    const badge = document.getElementById("discord-status-badge");
    const mobileDot = document.getElementById("mobile-status-dot");
    const discordStateLabel = document.getElementById("discord-text-state");

    badge.className = `discord-status-badge ${st.cls}`;
    badge.title = `Discord: ${st.label}`;
    mobileDot.className = `mobile-dot ${st.cls}`;
    discordStateLabel.textContent = st.label;

    if (useDiscordAvatar && data.discord_user && data.discord_user.avatar) {
      const ext = data.discord_user.avatar.startsWith("a_") ? "gif" : "png";
      const avatarEl = document.getElementById("profile-avatar");
      bindImageFallback(avatarEl, profileData.avatarUrls.primary, "FB");
      avatarEl.src = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.${ext}?size=256`;
    }

    const previouslyActive = currentActivities[currentActivityIndex];
    const previousKey = previouslyActive && `${previouslyActive.type}:${previouslyActive.title}`;
    const wasListeningToSpotify = currentActivities.some((item) => item.type === "spotify");
    latestPresence = data;
    latestDiscordStatus = st;
    currentActivities = getPresenceActivities(data);
    const spotifyActivity = currentActivities.find((item) => item.type === "spotify");
    if (spotifyActivity) applyAlbumAccent(spotifyActivity.image);
    else resetDynamicAccent();
    const preservedIndex = currentActivities.findIndex((item) => `${item.type}:${item.title}` === previousKey);
    const spotifyIndex = currentActivities.findIndex((item) => item.type === "spotify");
    currentActivityIndex = spotifyIndex >= 0 && !wasListeningToSpotify ? spotifyIndex : preservedIndex >= 0 ? preservedIndex : 0;
    renderCurrentActivity();
    return;

    if (useDiscordAvatar && data.discord_user && data.discord_user.avatar) {
      const ext = data.discord_user.avatar.startsWith("a_") ? "gif" : "png";
      const discordAvatarUrl = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.${ext}?size=256`;
      const avatarEl = document.getElementById("profile-avatar");
      bindImageFallback(avatarEl, profileData.avatarUrls.primary, "FB");
      avatarEl.src = discordAvatarUrl;
    }

    const card = document.getElementById("lanyard-card");
    const labelEl = document.getElementById("spotify-state-label");
    const songEl = document.getElementById("spotify-song");
    const artistEl = document.getElementById("spotify-artist");
    const albumEl = document.getElementById("spotify-album");
    const artEl = document.getElementById("spotify-album-art");
    const coverLink = document.getElementById("spotify-cover-link");
    const progressWrap = document.getElementById("spotify-progress-wrap");
    const activityBody = card.querySelector(".spotify-body");

    if (data.listening_to_spotify && data.spotify) {
      const sp = data.spotify;
      const trackUrl = `https://open.spotify.com/track/${sp.track_id}`;
      card.classList.add("is-playing");
      labelEl.textContent = "Şu Anda Dinliyor";
      songEl.textContent = sp.song;
      songEl.href = trackUrl;
      coverLink.href = trackUrl;
      artistEl.textContent = sp.artist;
      albumEl.textContent = sp.album;
      bindImageFallback(artEl, profileData.spotifyFallbackArt, "Spotify");
      document.getElementById("spotify-cover-link").classList.remove("is-app");
      artEl.src = sp.album_art_url || profileData.spotifyFallbackArt;
      progressWrap.hidden = false;

      activeSpotifyTimestamps = sp.timestamps;
      updateProgressUI();
      if (!spotifyProgressTimer) {
        spotifyProgressTimer = setInterval(updateProgressUI, 1000);
      }
    } else {
      card.classList.remove("is-playing");
      labelEl.textContent = "Spotify Beklemede";
      songEl.textContent = "Şu an müzik çalmıyor";
      songEl.href = "https://open.spotify.com/";
      coverLink.href = "https://open.spotify.com/";
      artistEl.textContent = `@${data.discord_user ? data.discord_user.username : profileData.profile.username}`;
      albumEl.textContent = `Discord Durumu: ${st.label}`;
      artEl.src = profileData.spotifyFallbackArt;
      progressWrap.hidden = true;
      activeSpotifyTimestamps = null;
      if (spotifyProgressTimer) {
        clearInterval(spotifyProgressTimer);
        spotifyProgressTimer = null;
      }
    }
  }

  function shouldUseSpotifyFallback() {
    return !lanyardAvailable || !latestLanyardPresence || latestLanyardPresence.discord_status === "offline";
  }

  function offlinePresence() {
    return {
      source: "lanyard",
      discord_status: "offline",
      discord_user: latestLanyardPresence && latestLanyardPresence.discord_user,
      listening_to_spotify: false,
      activities: []
    };
  }

  async function refreshSpotifyFallback() {
    const requestId = ++spotifyFallbackRequest;
    try {
      const response = await fetch("/api/spotify/now-playing", { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Spotify fallback: ${response.status}`);
      const data = await response.json();
      if (requestId !== spotifyFallbackRequest || !shouldUseSpotifyFallback()) return;
      if (data.available && data.is_playing) {
        if (latestPresence && latestPresence.source === "spotify" && latestPresence.spotify?.track_id === data.spotify?.track_id) {
          latestPresence = data;
          activeSpotifyTimestamps = data.spotify.timestamps;
          return;
        }
        renderPresence(data);
      } else if (!latestPresence || latestPresence.discord_status !== "offline" || latestPresence.listening_to_spotify) {
        renderPresence(offlinePresence());
      }
    } catch (_) {
      if (requestId === spotifyFallbackRequest && shouldUseSpotifyFallback() && (!latestPresence || latestPresence.discord_status !== "offline" || latestPresence.listening_to_spotify)) {
        renderPresence(offlinePresence());
      }
    }
  }

  function startSpotifyFallback() {
    if (!shouldUseSpotifyFallback()) return;
    renderPresence(offlinePresence());
    refreshSpotifyFallback();
    if (!spotifyFallbackTimer) spotifyFallbackTimer = window.setInterval(refreshSpotifyFallback, 7000);
  }

  function stopSpotifyFallback() {
    spotifyFallbackRequest += 1;
    if (spotifyFallbackTimer) window.clearInterval(spotifyFallbackTimer);
    spotifyFallbackTimer = null;
  }

  function handlePresenceUpdate(data) {
    lanyardAvailable = true;
    latestLanyardPresence = data;
    if (data.discord_status !== "offline") {
      stopSpotifyFallback();
      renderPresence(data);
      return;
    }
    startSpotifyFallback();
  }

  function handleLanyardAvailability(available) {
    lanyardAvailable = available;
    if (available && latestLanyardPresence && latestLanyardPresence.discord_status !== "offline") {
      stopSpotifyFallback();
      renderPresence(latestLanyardPresence);
    } else if (!available) {
      startSpotifyFallback();
    }
  }

  function applyTheme(theme, remember = false) {
    document.documentElement.setAttribute("data-theme", theme);
    // Yalnızca ziyaretçi düğmeye bastığında hatırla; böylece paneldeki varsayılan tema değişince yeni ziyaretçilere yansır.
    if (remember) try { localStorage.setItem("ferb-theme", theme); } catch (e) {}
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("ferb-theme"); } catch (e) {}
    applyTheme(saved || (profileData.site && profileData.site.defaultTheme) || "light");

    const toggle = () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark", true);
    };

    document.getElementById("theme-toggle-btn").addEventListener("click", toggle);
    document.getElementById("mobile-theme-btn").addEventListener("click", toggle);
  }

  function getPresenceActivities(data) {
    const activities = [];
    if (data.listening_to_spotify && data.spotify) {
      const sp = data.spotify;
      activities.push({
        type: "spotify", label: "Şu Anda Dinliyor", title: sp.song,
        subtitle: [sp.artist, sp.album].filter(Boolean).join(" · "),
        image: sp.album_art_url || profileData.spotifyFallbackArt,
        link: sp.track_url || `https://open.spotify.com/track/${sp.track_id}`,
        timestamps: sp.timestamps, icon: "♫"
      });
    }

    (data.activities || []).forEach((activity) => {
      if (activity.name === "Spotify" || activity.type === 4 && !activity.state) return;
      const asset = String(activity.assets && activity.assets.large_image || "");
      const image = asset.startsWith("http")
        ? asset
        : asset && !asset.startsWith("mp:") && activity.application_id
          ? `https://cdn.discordapp.com/app-assets/${activity.application_id}/${asset}.png`
          : "";
      const isCustom = activity.type === 4;
      const normalizedName = String(activity.name || "").toLowerCase();
      const fallbackImage = normalizedName.includes("visual studio code") || normalizedName === "code"
        ? "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg"
        : "";
      activities.push({
        type: "activity", label: isCustom ? "Özel Durum" : activity.type === 0 ? "Şu Anda Oynuyor" : "Şu Anda Aktif",
        title: isCustom ? activity.state : activity.name,
        subtitle: isCustom ? "Discord durumu" : [activity.details, activity.state].filter(Boolean).join(" · "),
        image: image || fallbackImage, link: "", timestamps: null,
        icon: activity.type === 0 ? "◉" : activity.type === 3 ? "◌" : "◆"
      });
    });
    return activities;
  }

  function renderCurrentActivity() {
    const card = document.getElementById("lanyard-card");
    const labelEl = document.getElementById("spotify-state-label");
    const titleEl = document.getElementById("spotify-song");
    const subtitleEl = document.getElementById("spotify-artist");
    const metaEl = document.getElementById("spotify-album");
    const artEl = document.getElementById("spotify-album-art");
    const coverLink = document.getElementById("spotify-cover-link");
    const progressWrap = document.getElementById("spotify-progress-wrap");
    const activityBody = card.querySelector(".spotify-body");
    const prevBtn = document.getElementById("activity-prev-btn");
    const nextBtn = document.getElementById("activity-next-btn");
    const statusEl = document.getElementById("discord-text-state");
    const gamePrompt = document.getElementById("idle-game-prompt");
    const item = currentActivities[currentActivityIndex];
    const hasPages = currentActivities.length > 1;

    prevBtn.hidden = nextBtn.hidden = !hasPages;
    prevBtn.disabled = nextBtn.disabled = !hasPages;
    gamePrompt.hidden = Boolean(item);
    const sourceLabel = latestPresence && latestPresence.source === "spotify" ? "Spotify" : latestDiscordStatus.label;
    statusEl.textContent = hasPages ? `${currentActivityIndex + 1}/${currentActivities.length} · ${sourceLabel}` : sourceLabel;

    if (!item) {
      // Oyun oynanırken ya da ad girilirken kartı boşta görünümüne çevirme
      if (!snakeState && !card.classList.contains("is-naming")) card.classList.add("is-idle");
      card.classList.remove("is-playing");
      labelEl.textContent = "Şu Anda Aktif Değil";
      titleEl.textContent = "Şu an paylaşılmış bir etkinlik yok";
      subtitleEl.textContent = "Discord Durumu";
      metaEl.textContent = latestDiscordStatus.label;
      artEl.src = createSvgFallback("Discord");
      artEl.alt = "Discord etkinliği yok";
      coverLink.hidden = true;
      activityBody.classList.add("is-compact");
      coverLink.removeAttribute("href");
      coverLink.removeAttribute("target");
      progressWrap.hidden = true;
      return;
    }

    stopSnakeGame();
    card.classList.remove("is-idle");

    const isSpotify = item.type === "spotify";
    const activeSpotify = currentActivities.find((activity) => activity.type === "spotify");
    const hasArtwork = Boolean(item.image);
    card.classList.toggle("is-playing", Boolean(activeSpotify));
    coverLink.hidden = !hasArtwork;
    activityBody.classList.toggle("is-compact", !hasArtwork);
    labelEl.textContent = item.label;
    titleEl.textContent = item.title;
    subtitleEl.textContent = item.subtitle || "Discord etkinliği";
    metaEl.textContent = isSpotify ? "Spotify" : "Discord";
    artEl.alt = `${item.title} etkinlik görseli`;
    bindImageFallback(artEl, profileData.spotifyFallbackArt, item.icon);
    coverLink.classList.toggle("is-app", !isSpotify);
    if (hasArtwork) artEl.src = item.image;

    if (item.link) {
      coverLink.href = item.link;
      coverLink.target = "_blank";
      titleEl.href = item.link;
    } else {
      coverLink.removeAttribute("href");
      coverLink.removeAttribute("target");
      titleEl.removeAttribute("href");
    }

    if (activeSpotify && activeSpotify.timestamps) {
      activeSpotifyTimestamps = activeSpotify.timestamps;
      progressWrap.hidden = !isSpotify;
      updateProgressUI();
      if (!spotifyProgressTimer) spotifyProgressTimer = setInterval(updateProgressUI, 1000);
    } else {
      activeSpotifyTimestamps = null;
      progressWrap.hidden = true;
      if (spotifyProgressTimer) { clearInterval(spotifyProgressTimer); spotifyProgressTimer = null; }
    }
  }

  function initLiveStatus() {
    const statusText = document.getElementById("live-status-text");
    const statuses = profileData.about.liveStatuses || [];
    if (!statusText || profileData.profile.liveStatusesEnabled === false || statuses.length === 0) return;

    let activeIndex = 0;
    statusText.textContent = statuses[activeIndex];

    window.setInterval(() => {
      activeIndex = (activeIndex + 1) % statuses.length;
      statusText.textContent = statuses[activeIndex];
    }, 4200);
  }

  function drawSnake() {
    if (!snakeState) return;
    const canvas = document.getElementById("snake-canvas");
    const context = canvas.getContext("2d");
    const { snake, food, size } = snakeState;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#0a1019";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(255,255,255,.045)";
    for (let x = 0; x < canvas.width; x += size) for (let y = 0; y < canvas.height; y += size) context.fillRect(x, y, 1, 1);
    context.fillStyle = "#fb7185";
    context.fillRect(food.x * size + 3, food.y * size + 3, size - 6, size - 6);
    snake.forEach((part, index) => {
      context.fillStyle = index === 0 ? "#a5f3fc" : "#38bdf8";
      context.fillRect(part.x * size + 2, part.y * size + 2, size - 4, size - 4);
    });
  }

  function placeSnakeFood() {
    const { cols, rows, snake } = snakeState;
    let food;
    do { food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; }
    while (snake.some((part) => part.x === food.x && part.y === food.y));
    snakeState.food = food;
  }

  let snakeStepPending = false;
  async function stepSnake() {
    const state = snakeState;
    if (!state || !snakeToken || snakeStepPending) return;
    snakeStepPending = true;
    const direction = state.direction.x === 1 ? "right" : state.direction.x === -1 ? "left" : state.direction.y === -1 ? "up" : "down";
    try {
      const res = await fetch("/api/snake/step", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: snakeToken, direction }) });
      const result = await res.json();
      if (res.status === 429) return;
      if (!res.ok) throw new Error(result.error || "Bağlantı hatası");
      if (state !== snakeState) return;
      if (result.ended) {
        snakeToken = null;
        stopSnakeGame();
        if (result.record) snakeRecord = result.record;
        renderSnakeRecord();
        showToast(`Snake bitti — Skor: ${result.score} · ${result.reason}`);
        return;
      }
      state.snake = result.snake; state.food = result.food; state.score = result.score;
      document.getElementById("snake-score").textContent = `Skor: ${state.score}`;
      drawSnake();
    } catch (_) { stopSnakeGame(); snakeToken = null; showToast("Oyun bağlantısı kesildi; skor kaydedilemedi."); }
    finally { snakeStepPending = false; }
  }

  function startSnakeGame() {
    if (currentActivities.length) return;
    const card = document.getElementById("lanyard-card");
    const game = document.getElementById("snake-game");
    const canvas = document.getElementById("snake-canvas");
    const size = 12;
    snakeState = { size, cols: canvas.width / size, rows: canvas.height / size, snake: [{ x: 10, y: 4 }, { x: 9, y: 4 }, { x: 8, y: 4 }], direction: { x: 1, y: 0 }, score: 0, food: { x: 16, y: 4 } };
    document.getElementById("snake-score").textContent = "Skor: 0";
    card.classList.remove("is-idle");
    card.classList.add("is-gaming");
    game.hidden = false;
    drawSnake();
    canvas.focus();
    clearInterval(snakeTimer);
    snakeTimer = setInterval(stepSnake, 135);
  }

  function stopSnakeGame() {
    hideSnakeNameForm();
    if (!snakeTimer && !snakeState) return;
    clearInterval(snakeTimer);
    snakeTimer = null;
    snakeState = null;
    const card = document.getElementById("lanyard-card");
    const game = document.getElementById("snake-game");
    if (card) card.classList.remove("is-gaming");
    if (game) game.hidden = true;
    if (card && currentActivities.length === 0) {
      card.classList.add("is-idle");
      document.getElementById("idle-game-prompt").hidden = false;
    }
  }

  /* --- Snake: kullanıcı adı, rekor ve skor gönderimi --- */
  let snakeToken = null;
  const snakeCfg = profileData.snake || {};
  let snakeRecord = snakeCfg.record || null;

  function renderSnakeRecord() {
    const idle = document.getElementById("snake-record-idle");
    const live = document.getElementById("snake-record-live");
    const show = snakeCfg.showRecord !== false && snakeRecord && snakeRecord.score > 0;
    if (idle) {
      idle.hidden = !show;
      if (show) {
        document.getElementById("snake-record-title").textContent = snakeCfg.recordLabel || "Rekor";
        document.getElementById("snake-record-score").textContent = snakeRecord.score;
        document.getElementById("snake-record-name").textContent = snakeRecord.name;
      }
    }
    if (live) live.textContent = show ? `🏆 ${snakeRecord.score} · ${snakeRecord.name}` : "";
  }

  function hideSnakeNameForm() {
    const form = document.getElementById("snake-name-form");
    const card = document.getElementById("lanyard-card");
    if (form) form.hidden = true;
    if (card && card.classList.contains("is-naming")) {
      card.classList.remove("is-naming");
      if (!currentActivities.length) card.classList.add("is-idle");
    }
  }

  function openSnakeNameForm() {
    if (currentActivities.length) return;
    const card = document.getElementById("lanyard-card");
    const form = document.getElementById("snake-name-form");
    const input = document.getElementById("snake-name");
    document.getElementById("snake-name-error").hidden = true;
    try { input.value = localStorage.getItem("ferb-snake-name") || ""; } catch (e) {}
    card.classList.remove("is-idle");
    card.classList.add("is-naming");
    form.hidden = false;
    input.focus();
    input.select();
  }

  async function submitSnakeName(event) {
    event.preventDefault();
    const input = document.getElementById("snake-name");
    const errorEl = document.getElementById("snake-name-error");
    const btn = document.getElementById("snake-name-submit");
    const name = input.value.replace(/\s+/g, " ").trim();
    const fail = (msg) => { errorEl.textContent = msg; errorEl.hidden = false; input.focus(); };
    if (name.length < 2 || name.length > 16) return fail("Kullanıcı adı 2–16 karakter olmalı.");
    btn.disabled = true;
    snakeToken = null;
    try {
      const res = await fetch("/api/snake/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { btn.disabled = false; return fail(data.error || "Oyun başlatılamadı."); }
      snakeToken = data.token;
      if (data.record) snakeRecord = data.record;
    } catch (e) { btn.disabled = false; return fail("Sunucuya ulaşılamadı. Tekrar dene."); }
    btn.disabled = false;
    try { localStorage.setItem("ferb-snake-name", name); } catch (e) {}
    hideSnakeNameForm();
    renderSnakeRecord();
    startSnakeGame();
  }

  async function submitSnakeScore(score) {
    const token = snakeToken;
    snakeToken = null;
    if (!token || score <= 0) { showToast(`Snake bitti — Skor: ${score}`); return; }
    try {
      const res = await fetch("/api/snake/finish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, score }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(`Snake bitti — Skor: ${score}`); return; }
      if (data.record) snakeRecord = data.record;
      renderSnakeRecord();
      if (data.newRecord) {
        showToast(`🏆 Yeni rekor! ${score} puan`);
        siteConfetti(window.innerWidth / 2, window.innerHeight / 3);
      } else if (data.personalBest) showToast(`Kişisel rekorun: ${score} puan 🎉`);
      else showToast(`Snake bitti — Skor: ${score} · En iyin: ${data.best}`);
    } catch (e) {
      showToast(`Snake bitti — Skor: ${score}`);
    }
  }

  function initSnakeGame() {
    renderSnakeRecord();
    document.getElementById("idle-game-prompt").addEventListener("click", openSnakeNameForm);
    document.getElementById("snake-name-form").addEventListener("submit", submitSnakeName);
    document.getElementById("snake-name-cancel").addEventListener("click", hideSnakeNameForm);
    document.getElementById("snake-name").addEventListener("keydown", (e) => { if (e.key === "Escape") hideSnakeNameForm(); });
    window.addEventListener("keydown", (event) => {
      if (!snakeState) return;
      const directions = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
      const next = directions[event.key];
      if (!next) return;
      event.preventDefault();
      if (next.x + snakeState.direction.x !== 0 && next.y + snakeState.direction.y !== 0) snakeState.direction = next;
    });
  }

  function initReadingProgress() {
    const fill = document.getElementById("reading-progress-fill");
    if (!fill) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initMagneticButtons() {
    if (EffectsController.reducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
    document.querySelectorAll(".social-link-btn").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.22;
        button.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      button.addEventListener("pointerleave", () => { button.style.transform = ""; });
    });
  }

  /* Ziyaret sayacı: sayfa açılınca sunucuya bir kez bildirir. F5 ile şişirmeyi sunucu engeller (30 dk kuralı). */
  function initVisitCounter() {
    const box = document.getElementById("view-counter");
    const valueEl = document.getElementById("view-counter-value");
    if (!box || !valueEl || !window.fetch) return;
    fetch("/api/visit", { method: "POST", credentials: "same-origin", keepalive: true })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.enabled) return;
        const from = Number(String(valueEl.textContent).replace(/\D/g, "")) || 0;
        const to = Number(data.value) || 0;
        if (to === from) return;
        const start = performance.now();
        const step = (now) => {
          const t = Math.min((now - start) / 700, 1);
          valueEl.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))).toLocaleString("tr-TR");
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        box.classList.add("is-bump");
      })
      .catch(() => {});
  }

  function renderPrintableCv() {
    const root = document.getElementById("print-cv");
    if (!root || !window.FerbCvRender) return;
    const draw = () => { FerbCvRender.render(root, profileData); FerbCvRender.fit(root); FerbCvRender.attachCode(root, profileData); };
    draw();
    // Yazı tipi yüklenince ölçü değişir; yeniden sığdır
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => FerbCvRender.fit(root));
    window.addEventListener("beforeprint", () => FerbCvRender.fit(root));
  }

  function initCvDownload() {
    document.getElementById("download-cv-btn").addEventListener("click", () => {
      const cv = profileData.cv || {};
      // Panelde "Hazır PDF" seçildiyse o dosya açılır; yoksa sitedeki verilerden A4 CV üretilip yazdırılır.
      if (cv.mode === "file" && cv.fileUrl) window.open(cv.fileUrl, "_blank", "noopener");
      else window.print();
    });
  }

  function initActivityNavigation() {
    const changeActivity = (direction) => {
      if (currentActivities.length < 2 || !latestDiscordStatus) return;
      currentActivityIndex = (currentActivityIndex + direction + currentActivities.length) % currentActivities.length;
      renderCurrentActivity();
    };
    document.getElementById("activity-prev-btn").addEventListener("click", () => changeActivity(-1));
    document.getElementById("activity-next-btn").addEventListener("click", () => changeActivity(1));
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function copyEmail() {
    const email = profileData.email;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).then(() => showToast(`Kopyalandı: ${email}`));
    } else {
      showToast(`E-posta: ${email}`);
    }
  }

  function initMobileDrawer() {
    const sidebar = document.getElementById("sidebar-panel");
    const backdrop = document.getElementById("sidebar-backdrop");
    const menuBtn = document.getElementById("mobile-menu-btn");

    const closeDrawer = () => {
      sidebar.classList.remove("is-open");
      backdrop.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    };

    menuBtn.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("is-open");
      backdrop.hidden = !isOpen;
      menuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    backdrop.addEventListener("click", closeDrawer);
    document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", closeDrawer));
  }

  // Yönetim paneli yeni sekmede açılır; giriş yapılmamışsa sunucu giriş sayfasına yönlendirir.
  function openAdmin() {
    window.open("/admin", "_blank", "noopener");
  }

  let fireEffectTimer = null;
  function showConsoleEffect(emoji) {
    document.getElementById("hamide-fire-effect")?.remove();
    clearTimeout(fireEffectTimer);
    const layer = document.createElement("div");
    layer.id = "hamide-fire-effect";
    layer.className = "hamide-fire-effect";
    layer.setAttribute("aria-hidden", "true");
      const sides = ["bottom", "top", "left", "right"];
      sides.forEach((side) => {
        for (let i = 0; i < 30; i++) {
          const flame = document.createElement("span");
          flame.className = `hamide-flame is-${side}`;
          flame.textContent = emoji;
          flame.style.setProperty("--position", `${Math.random() * 100}%`);
          flame.style.setProperty("--delay", `${Math.random() * 1.8}s`);
          flame.style.setProperty("--drift", `${Math.round((Math.random() - .5) * 180)}px`);
          flame.style.setProperty("--duration", `${1.8 + Math.random() * 1.2}s`);
          flame.style.setProperty("--size", `${30 + Math.round(Math.random() * 42)}px`);
          layer.appendChild(flame);
        }
      });
    document.body.appendChild(layer);
    fireEffectTimer = setTimeout(() => layer.remove(), 5200);
  }

  function initCommandPalette() {
    const modal = document.getElementById("cmd-modal");
    const searchInput = document.getElementById("cmd-search");
    const listEl = document.getElementById("cmd-list");

    // Komutlar panel verisinden üretilir: bölüm adları, e-posta ve sosyal bağlantılar
    const sec = profileData.sections || {};
    const goto = [["about", "hakkimda", "01"], ["education", "egitim", "02"], ["experience", "calisma-hayati", "03"], ["projects", "projeler", "04"]]
      .filter(([key]) => !sec[key] || sec[key].enabled !== false)
      .map(([key, id, n]) => ({ label: `${(sec[key] && sec[key].nav) || key} bölümüne git`, hint: n, action: () => location.assign(`#${id}`) }));
    const socials = (profileData.socialLinks || [])
      .filter((x) => /^https?:/i.test(x.url || ""))
      .map((x) => ({ label: `${x.label} Profilini Aç`, hint: "Dış Bağlantı", keys: [x.label, x.icon], action: () => window.open(x.url, "_blank", "noopener") }));
    const commands = [
      ...goto,
      { label: "Temayı Değiştir (Açık / Koyu)", hint: "Tema", action: () => document.getElementById("theme-toggle-btn").click() },
      { label: `E-posta Adresini Kopyala (${profileData.email})`, hint: "Kopyala", action: copyEmail },
      ...socials,
      { label: "Yönetim Paneli (admin)", hint: "Giriş", keys: ["admin", "yönetim", "yonetim", "panel", "giriş", "giris", "login"], action: openAdmin }
    ];

    let filtered = [];
    let selected = 0;
    const norm = (t) => String(t).toLocaleLowerCase("tr");
    const matches = (c, q) => norm(c.label).includes(q) || (c.keys || []).some((k) => norm(k).includes(q));

    const paintSelection = () => {
      listEl.querySelectorAll(".cmd-item").forEach((btn, i) => {
        btn.classList.toggle("is-selected", i === selected);
        if (i === selected) btn.scrollIntoView({ block: "nearest" });
      });
    };

    const renderCommands = (query = "") => {
      const q = norm(query.trim());
      filtered = commands.filter((c) => !q || matches(c, q));
      // Yazılan kelime bir komutun anahtar sözcüğüyle birebir aynıysa (örn. "admin") o komut en üste gelir
      filtered.sort((a, b) => Number((b.keys || []).some((k) => norm(k) === q)) - Number((a.keys || []).some((k) => norm(k) === q)));
      selected = 0;
      listEl.innerHTML = filtered
        .map(
          (c, i) => `
        <li>
          <button type="button" class="cmd-item" data-cmd-index="${i}">
            <span>${c.label}</span>
            <span style="color:var(--text-muted);font-size:0.75rem;">${c.hint}</span>
          </button>
        </li>
      `
        )
        .join("");

      listEl.querySelectorAll(".cmd-item").forEach((btn, idx) => {
        btn.addEventListener("click", () => {
          filtered[idx].action();
          closeModal();
        });
      });
      paintSelection();
    };

    const openModal = () => {
      modal.hidden = false;
      searchInput.value = "";
      renderCommands();
      searchInput.focus();
    };

    const closeModal = () => {
      modal.hidden = true;
    };

    const cmdOpenBtn = document.getElementById("cmd-open-btn");
    if (cmdOpenBtn) cmdOpenBtn.addEventListener("click", openModal);
    document.getElementById("cmd-close-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    searchInput.addEventListener("input", (e) => {
      const value = e.target.value;
      const keyword = norm(value.trim());
      const effect = keyword !== "admin" && !e.isComposing && (profileData.consoleEffects || []).find((item) => item && norm(String(item.trigger || "").trim()) === keyword && String(item.emoji || "").trim());
      if (effect) {
        closeModal();
        searchInput.value = "";
        document.getElementById("cmd-open-btn")?.focus();
        showConsoleEffect(effect.emoji);
        return;
      }
      renderCommands(value);
      // Konsola "admin" yazılınca doğrudan yönetim paneline gider
      if (norm(value.trim()) === "admin") {
        closeModal();
        openAdmin();
      }
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!filtered.length) return;
        selected = (selected + (e.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length;
        paintSelection();
      } else if (e.key === "Enter" && filtered[selected]) {
        e.preventDefault();
        filtered[selected].action();
        closeModal();
      }
    });

    window.addEventListener("keydown", (e) => {
      const isKey = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      const isF4 = e.key === "F4" && !e.altKey && !e.ctrlKey && !e.metaKey;
      if (isKey || isF4) {
        e.preventDefault();
        modal.hidden ? openModal() : closeModal();
      } else if (e.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });
  }

  bindImageFallback(document.getElementById("profile-avatar"), useDiscordAvatar ? profileData.avatarUrls.secondary : "", "FB");
  bindImageFallback(document.getElementById("spotify-album-art"), profileData.spotifyFallbackArt, "Spotify");

  renderAbout();
  renderEducation();
  renderExperience();
  renderProjects("all");

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      activeProjectFilter = btn.dataset.filter;
      activeProjectPage = 0;
      renderProjects(btn.dataset.filter);
    });
  });

  document.getElementById("copy-email-btn").addEventListener("click", copyEmail);
  document.getElementById("copy-discord-btn")?.addEventListener("click", () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileData.discordUsername).then(() => showToast(`Discord kullanıcı adı kopyalandı: ${profileData.discordUsername}`));
    } else {
      showToast("Discord");
    }
  });
  document.getElementById("footer-year").textContent = new Date().getFullYear();
  initVisitCounter();

  initTheme();
  initLiveStatus();
  initReadingProgress();
  initMagneticButtons();
  renderPrintableCv();
  initCvDownload();
  initActivityNavigation();
  initSnakeGame();
  initMobileDrawer();
  initCommandPalette();
  EffectsController.init();

  const lanyard = new LanyardClient(profileData.discordId, handlePresenceUpdate, handleLanyardAvailability);
  lanyard.start();
});
