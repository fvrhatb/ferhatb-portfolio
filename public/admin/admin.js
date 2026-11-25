// ferhatb.com — Yönetim paneli motoru: pages.js'teki tanımlardan formları çizer, kaydeder.
(() => {
  const PAGES = window.ADMIN_PAGES;
  const $ = (sel, root = document) => root.querySelector(sel);

  // ---------- Simgeler ----------
  const P = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M3 13h18"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    doc: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    up: '<path d="M18 15l-6-6-6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
    reset: '<path d="M3 12a9 9 0 109-9 9.5 9.5 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0z"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 010 6.8M18 14.4c2 .7 3.5 2.5 3.5 5.6"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.2A9.8 9.8 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 004.2 4.2"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'
    ,shield: '<path d="M12 3l8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;

  // ---------- Küçük yardımcılar ----------
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(c));
    return el;
  }
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const uid = () => "k" + Math.random().toString(36).slice(2, 10);
  const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  function setPath(obj, path, value) {
    const keys = path.split(".");
    let o = obj;
    keys.slice(0, -1).forEach((k) => { if (typeof o[k] !== "object" || o[k] === null) o[k] = {}; o = o[k]; });
    o[keys.at(-1)] = value;
  }
  const previewUrl = (u) => (!u ? "" : /^(https?:|data:|\/)/.test(u) ? u : "/" + u);
  const initials = (s) => String(s || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  function toast(message, type = "ok") {
    const el = h("div", { class: `toast ${type}`, role: "status" }, message);
    $("#toasts").append(el);
    setTimeout(() => el.remove(), 3200);
  }

  function modal({ title, text, body, confirm = "Tamam", cancel = "Vazgeç", danger = false }) {
    return new Promise((resolve) => {
      const previousFocus = document.activeElement;
      const close = (val) => { wrap.remove(); document.removeEventListener("keydown", onKey); if (previousFocus?.isConnected) previousFocus.focus(); resolve(val); };
      const onKey = (e) => {
        if (e.key === "Escape") { close(false); return; }
        if (e.key !== "Tab") return;
        const controls = [...wrap.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hidden && el.getClientRects().length);
        if (!controls.length) { e.preventDefault(); return; }
        const first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      };
      const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;
      const wrap = h("div", { class: "modal-wrap", onclick: (e) => { if (e.target === wrap) close(false); } },
        h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId },
          h("h3", { id: titleId }, title), text ? h("p", {}, text) : null, body || null,
          h("div", { class: "modal-actions" },
            cancel ? h("button", { class: "btn ghost", type: "button", onclick: () => close(false) }, cancel) : null,
            confirm ? h("button", { class: `btn ${danger ? "danger" : "primary"}`, type: "button", onclick: () => close(true) }, confirm) : null)));
      document.body.append(wrap);
      document.addEventListener("keydown", onKey);
      wrap.querySelector(".modal-actions .btn:last-child")?.focus();
    });
  }

  async function api(method, url, body, headers = {}) {
    if (currentUser?.role === "demo" && method !== "GET") throw new Error("Demo modunda değişiklik yapma yetkiniz yok.");
    const res = await fetch(url, {
      method,
      headers: { "X-Ferb-Admin": "1", ...(body && !(body instanceof Blob) ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? (body instanceof Blob ? body : JSON.stringify(body)) : undefined,
      credentials: "same-origin"
    });
    if (res.status === 401) { location.href = "/admin/giris"; throw new Error("Oturum süresi doldu"); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Hata (${res.status})`);
    return data;
  }

  // ---------- Durum ----------
  let saved = null;      // sunucudaki son hali
  let draft = null;      // düzenlenen hali
  let defaults = null;
  let status = null;
  let currentUser = null;
  const slug = decodeURIComponent(location.pathname.replace(/^\/admin\/?/, "").split("/")[0] || "");
  const page = PAGES.find((p) => p.slug === slug) || PAGES[0];
  const openItems = new WeakSet();

  const dirtySections = () => Object.keys(draft || {}).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(saved[k]));
  function refreshDirty() {
    $("#savebar").classList.toggle("is-on", dirtySections().length > 0);
  }

  async function save() {
    if (currentUser?.role === "demo") { toast("Demo modunda değişiklik yapma yetkiniz yok.", "err"); return; }
    const sections = dirtySections();
    if (!sections.length) return;
    const btn = $("#save-btn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> Kaydediliyor';
    try {
      for (const s of sections) {
        await api("PUT", `/api/admin/content/${s}`, draft[s]);
        saved[s] = clone(draft[s]);
      }
      toast("Kaydedildi — değişiklikler sitede yayında.");
    } catch (err) {
      toast(`Kaydedilemedi: ${err.message}`, "err");
    } finally {
      btn.disabled = false;
      btn.textContent = "Kaydet";
      refreshDirty();
    }
  }

  // ---------- Alanlar ----------
  function fieldWrap(field, control) {
    return h("div", { class: `field${field.span === 2 ? " span-2" : ""}` },
      field.label ? h("label", {}, field.label) : null,
      control,
      field.hint ? h("span", { class: "hint" }, field.hint) : null);
  }

  function renderField(field, obj, ctx) {
    const value = getPath(obj, field.key);
    const set = (v) => { setPath(obj, field.key, v); refreshDirty(); ctx.onChange?.(field.key); };
    const id = `f-${Math.random().toString(36).slice(2, 9)}`;

    if (field.showIf && getPath(obj, field.showIf[0]) !== field.showIf[1]) return null;

    switch (field.type) {
      case "textarea": {
        const ta = h("textarea", { class: "textarea", id, rows: field.rows || 3, placeholder: field.placeholder, oninput: (e) => set(e.target.value) });
        ta.value = value ?? "";
        const wrap = fieldWrap(field, ta);
        wrap.querySelector("label")?.setAttribute("for", id);
        return wrap;
      }
      case "select": {
        const sel = h("select", { class: "select", id, onchange: (e) => { set(e.target.value); ctx.rerender?.(); } },
          field.options.map(([v, label]) => h("option", { value: v }, label)));
        sel.value = value ?? field.options[0][0];
        return fieldWrap(field, sel);
      }
      case "toggle": {
        const input = h("input", { type: "checkbox", onchange: (e) => set(e.target.checked) });
        input.checked = value === undefined ? field.default === true : Boolean(value);
        return h("div", { class: `field${field.span === 2 ? " span-2" : ""}` },
          h("label", { class: "toggle" }, input, h("span", { class: "track" }), field.label),
          field.hint ? h("span", { class: "hint" }, field.hint) : null);
      }
      case "theme": {
        const wrap = h("div", { class: "theme-pick" });
        const opts = [["light", "Açık tema", "☀️"], ["dark", "Koyu tema", "🌙"]];
        const draw = () => {
          wrap.replaceChildren(...opts.map(([v, label, emoji]) => {
            const on = (value === v) || (!value && v === "light");
            return h("label", { class: `theme-opt${on ? " is-on" : ""}` },
              h("input", { type: "radio", name: id, value: v, checked: on, onchange: () => { set(v); field.__v = v; } }),
              h("div", { class: `theme-prev ${v}` }, h("i"), h("i")),
              h("span", {}, `${emoji} ${label}`, on ? h("span", { class: "badge blue" }, "Seçili") : ""));
          }));
        };
        draw();
        wrap.addEventListener("change", () => { setTimeout(() => ctx.rerender?.(), 0); });
        return fieldWrap(field, wrap);
      }
      case "choice": {
        const wrap = h("div", { class: "choice-pick", role: "radiogroup" });
        const current = value ?? field.options[0][0];
        field.options.forEach(([v, label, desc]) => {
          const card = h("label", { class: `choice-opt${current === v ? " is-on" : ""}` },
            h("input", { type: "radio", name: id, value: v, checked: current === v, onchange: () => {
              set(v);
              wrap.querySelectorAll(".choice-opt").forEach((c) => c.classList.toggle("is-on", c === card));
            } }),
            h("span", { class: "choice-dot" }),
            h("span", { class: "choice-text" }, h("strong", {}, label), desc ? h("small", {}, desc) : null));
          wrap.append(card);
        });
        return fieldWrap(field, wrap);
      }
      case "strings": {
        const list = Array.isArray(value) ? value : [];
        if (!Array.isArray(value)) setPath(obj, field.key, list);
        const box = h("div", { class: "strings" });
        const draw = () => {
          box.replaceChildren(
            ...list.map((str, i) => h("div", { class: "string-row" },
              h("input", { class: "input", value: str, placeholder: field.placeholder, oninput: (e) => { list[i] = e.target.value; refreshDirty(); } }),
              h("button", { class: "icon-btn", type: "button", title: "Yukarı", disabled: i === 0, html: icon("up"), onclick: () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; draw(); refreshDirty(); } }),
              h("button", { class: "icon-btn danger", type: "button", title: "Sil", html: icon("x"), onclick: () => { list.splice(i, 1); draw(); refreshDirty(); } }))),
            h("button", { class: "btn small", type: "button", style: "align-self:flex-start", onclick: () => { list.push(""); draw(); refreshDirty(); box.querySelectorAll("input")[list.length - 1]?.focus(); } },
              h("span", { html: icon("plus") }), field.addLabel || "Ekle"));
        };
        draw();
        return fieldWrap(field, box);
      }
      case "color": {
        const swatches = ["#38bdf8", "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#16a34a", "#0f766e", "#334155", "#b45309"];
        const wrap = h("div", { class: "color-pick" });
        const picker = h("input", { type: "color", class: "color-input", "aria-label": "Renk seç" });
        let current = value;
        const draw = () => {
          const cur = /^#[0-9a-f]{6}$/i.test(current || "") ? current : "#38bdf8";
          picker.value = cur;
          wrap.replaceChildren(picker, ...swatches.map((c) => h("button", { type: "button", class: `swatch${c.toLowerCase() === cur.toLowerCase() ? " is-on" : ""}`, style: `background:${c}`, title: c, "aria-label": c, onclick: () => { current = c; set(c); draw(); } })));
        };
        picker.addEventListener("input", (e) => { current = e.target.value; set(current); wrap.querySelectorAll(".swatch").forEach((b) => b.classList.remove("is-on")); });
        draw();
        return fieldWrap(field, wrap);
      }
      case "templatepick": {
        const wrap = h("div", { class: "tpl-pick", role: "radiogroup" });
        const cur = value || field.options[0][0];
        field.options.forEach(([v, label, desc]) => {
          const card = h("label", { class: `tpl-opt${cur === v ? " is-on" : ""}` },
            h("input", { type: "radio", name: id, value: v, checked: cur === v, onchange: () => {
              set(v);
              wrap.querySelectorAll(".tpl-opt").forEach((c) => c.classList.toggle("is-on", c === card));
            } }),
            h("div", { class: `tpl-prev tpl-${v}`, "aria-hidden": "true" }, h("i"), h("i"), h("i")),
            h("strong", {}, label), desc ? h("small", {}, desc) : null);
          wrap.append(card);
        });
        return fieldWrap(field, wrap);
      }
      case "pick":
        return fieldWrap(field, pickControl(field, obj));
      case "image":
      case "file":
        return fieldWrap(field, mediaControl(field, value, set));
      case "list":
        return h("div", { class: "field span-2" }, field.label ? h("span", { class: "field-label" }, field.label) : null, listControl(field, obj));
      default: {
        const input = h("input", {
          class: "input", id, type: { email: "email", url: "url", number: "number" }[field.type] || "text",
          placeholder: field.placeholder, pattern: field.pattern, min: field.type === "number" ? "0" : null,
          oninput: (e) => set(field.type === "number" ? Math.max(0, Number(e.target.value) || 0) : e.target.value)
        });
        input.value = value ?? "";
        const wrap = fieldWrap(field, input);
        wrap.querySelector("label")?.setAttribute("for", id);
        return wrap;
      }
    }
  }

  // CV sürümünde hangi kayıtların görüneceğini seçtiren onay kutusu listesi. Kutu işaretliyse CV'de görünür.
  function pickControl(field, obj) {
    const src = field.source;
    const hiddenList = () => { if (!Array.isArray(obj[field.key])) obj[field.key] = []; return obj[field.key]; };
    const items = () => {
      const list = (draft[src.section] && draft[src.section][src.key]) || [];
      return list.map((it) => (src.plain ? { id: it, title: it, sub: "" } : { id: it.id, title: it[src.title] || "Adsız", sub: it[src.sub] || "", off: it.enabled === false })).filter((x) => x.id && x.title);
    };
    const box = h("div", { class: "pick" });
    const draw = () => {
      const all = items();
      const hidden = hiddenList();
      const shown = all.filter((x) => !hidden.includes(x.id)).length;
      const setAll = (visible) => { obj[field.key] = visible ? [] : all.map((x) => x.id); draw(); refreshDirty(); };
      box.replaceChildren(
        h("div", { class: "pick-head" },
          h("span", { class: "badge blue" }, `${shown} / ${all.length} gösteriliyor`),
          h("span", { class: "pick-actions" },
            h("button", { class: "btn small ghost", type: "button", onclick: () => setAll(true) }, "Hepsini göster"),
            h("button", { class: "btn small ghost", type: "button", onclick: () => setAll(false) }, "Hepsini gizle"))),
        all.length ? h("div", { class: "pick-list" }, all.map((x) => {
          const input = h("input", { type: "checkbox", onchange: (e) => {
            const list = hiddenList();
            const i = list.indexOf(x.id);
            if (e.target.checked && i >= 0) list.splice(i, 1);
            if (!e.target.checked && i < 0) list.push(x.id);
            draw(); refreshDirty();
          } });
          input.checked = !hidden.includes(x.id);
          return h("label", { class: `pick-row${input.checked ? "" : " is-off"}` }, input, h("span", { class: "pick-box", html: icon("check") }),
            h("span", { class: "pick-text" }, h("strong", {}, x.title), x.sub ? h("small", {}, x.sub) : null), x.off ? h("span", { class: "badge amber" }, "Sitede gizli") : null);
        })) : h("div", { class: "empty" }, field.emptyText || "Henüz kayıt yok."));
    };
    draw();
    return box;
  }

  // CV önizlemesi: kaydedilmemiş (taslak) değişiklikleri de gösterir
  let previewWin = null;
  const previewData = () => ({
    education: draft.education.items, certificates: draft.certificates.items, experience: draft.experience.items,
    projects: draft.projects.items, about: {}, cv: draft.cv
  });
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || !e.data || e.data.type !== "ferb-cv-ready" || !previewWin || e.source !== previewWin) return;
    previewWin.postMessage({ type: "ferb-cv-draft", data: previewData() }, location.origin);
  });
  function openCvPreview(id) {
    previewWin = window.open(`/cv/${encodeURIComponent(id)}?taslak=1`, "ferb-cv-onizleme");
    if (!previewWin) toast("Açılır pencere engellendi. Tarayıcıda bu site için izin ver.", "err");
  }

  function mediaControl(field, value, set) {
    const isDoc = field.type === "file";
    const thumb = h("div", { class: `media-thumb${isDoc ? " is-doc" : ""}` });
    const input = h("input", { class: "input", placeholder: isDoc ? "/uploads/cv.pdf" : "Görsel adresi veya yükle", oninput: (e) => { set(e.target.value); paint(); } });
    input.value = value ?? "";
    const openLink = h("a", { class: "btn small ghost", target: "_blank", rel: "noopener", html: `${icon("ext")} Aç` });
    const paint = () => {
      const u = input.value.trim();
      if (isDoc) thumb.textContent = u ? "PDF" : "—";
      else { thumb.style.backgroundImage = u ? `url("${previewUrl(u).replace(/"/g, "%22")}")` : ""; thumb.innerHTML = u ? "" : icon("image"); }
      openLink.href = previewUrl(u) || "#";
      openLink.hidden = !u;
    };
    const fileInput = h("input", { type: "file", accept: isDoc ? "application/pdf,.pdf" : "image/png,image/jpeg,image/webp,image/gif", hidden: true,
      onchange: async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        upBtn.disabled = true;
        upBtn.innerHTML = '<span class="spin"></span> Yükleniyor';
        try {
          const res = await api("POST", "/api/admin/upload", file, { "X-File-Name": encodeURIComponent(file.name) });
          input.value = res.url; set(res.url); paint();
          toast("Dosya yüklendi. Kaydetmeyi unutma.");
        } catch (err) { toast(err.message, "err"); }
        upBtn.disabled = false;
        upBtn.innerHTML = `${icon("upload")} Yükle`;
        fileInput.value = "";
      } });
    const upBtn = h("button", { class: "btn small", type: "button", html: `${icon("upload")} Yükle`, onclick: () => fileInput.click() });
    const libBtn = isDoc ? null : h("button", { class: "btn small ghost", type: "button", html: `${icon("image")} Yüklenenler`, onclick: async () => {
      const { files } = await api("GET", "/api/admin/uploads");
      const images = files.filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));
      let picked = null;
      const grid = h("div", { class: "picker" }, images.length ? images.map((f) => h("button", { type: "button", style: `background-image:url("${f}")`, title: f, onclick: (e) => { picked = f; e.target.closest(".modal-wrap").querySelector(".modal-actions .btn:last-child").click(); } }, h("span", {}, f.split("/").pop()))) : h("p", { class: "hint" }, "Henüz yüklenmiş görsel yok."));
      const ok = await modal({ title: "Yüklenen görseller", text: "Kullanmak istediğin görsele tıkla.", body: grid, confirm: images.length ? "Seç" : null, cancel: "Kapat" });
      if (ok && picked) { input.value = picked; set(picked); paint(); }
    } });
    const clearBtn = h("button", { class: "btn small ghost danger", type: "button", html: `${icon("x")} Kaldır`, onclick: () => { input.value = ""; set(""); paint(); } });
    paint();
    return h("div", { class: "media" }, thumb, h("div", { class: "media-main" }, input, h("div", { class: "media-actions" }, upBtn, libBtn, openLink, clearBtn, fileInput)));
  }

  function listControl(field, obj) {
    if (!Array.isArray(getPath(obj, field.key))) setPath(obj, field.key, []);
    const items = getPath(obj, field.key);
    const box = h("div", { class: "list" });
    const titleOf = (it) => (field.itemTitle && it[field.itemTitle]) || "Adsız";
    const subOf = (it) => (field.itemSub && it[field.itemSub]) || "";

    const draw = () => {
      box.replaceChildren();
      if (!items.length) box.append(h("div", { class: "empty" }, "Henüz kayıt yok."));
      items.forEach((item, i) => {
        const open = openItems.has(item);
        const title = h("strong", {}, titleOf(item));
        const sub = h("small", {}, subOf(item));
        let logo = null;
        if (field.itemLogo) {
          const src = previewUrl(item[field.itemLogo]);
          logo = h("span", { class: "item-logo", style: src ? `background-image:url("${src.replace(/"/g, "%22")}")` : "" }, src ? "" : initials(titleOf(item)));
        }
        const badges = [];
        const isOff = field.canDisable && item.enabled === false;
        if (isOff) badges.push(h("span", { class: "badge amber" }, "Sitede gizli"));
        const isActive = field.activeKey && item.id === obj[field.activeKey];
        if (isActive) badges.push(h("span", { class: "badge green" }, "Sitede aktif"));
        if (field.cvInfo) badges.push(h("span", { class: "badge" }, field.cvInfo[item.template] || item.template || ""));
        if (/devam/i.test(item.period || "")) badges.push(h("span", { class: "badge green" }, "Devam ediyor"));
        if (item.featured) badges.push(h("span", { class: "badge blue" }, "Öne çıkan"));
        if (field.compact && item.primary) badges.push(h("span", { class: "badge blue" }, "Vurgulu"));

        const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
        const sw = field.canDisable ? h("button", { class: `switch${isOff ? "" : " is-on"}`, type: "button", role: "switch", "aria-checked": String(!isOff), title: isOff ? "Sitede gizli — açmak için tıkla" : "Sitede görünüyor — gizlemek için tıkla", onclick: stop(() => { item.enabled = isOff; draw(); refreshDirty(); }) }, h("span", { class: "track" }), h("span", { class: "switch-text" }, isOff ? "Gizli" : "Açık")) : null;
        const tools = h("div", { class: "item-tools" },
          field.activeKey && !isActive ? h("button", { class: "icon-btn", type: "button", title: "Bunu sitede aktif yap", html: icon("star"), onclick: stop(() => { obj[field.activeKey] = item.id; draw(); refreshDirty(); toast("Aktif sürüm değişti. Kaydedince “CV İndir” bu sürümü verir."); }) }) : null,
          field.preview ? h("button", { class: "icon-btn", type: "button", title: "Önizle / PDF olarak kaydet", html: icon("eye"), onclick: stop(() => openCvPreview(item.id)) }) : null,
          h("button", { class: "icon-btn", type: "button", title: "Yukarı taşı", disabled: i === 0, html: icon("up"), onclick: stop(() => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; draw(); refreshDirty(); }) }),
          h("button", { class: "icon-btn", type: "button", title: "Aşağı taşı", disabled: i === items.length - 1, html: icon("down"), onclick: stop(() => { [items[i + 1], items[i]] = [items[i], items[i + 1]]; draw(); refreshDirty(); }) }),
          h("button", { class: "icon-btn", type: "button", title: "Kopyasını oluştur", html: icon("copy"), onclick: stop(() => { const c = clone(item); if (field.ids) { c.id = uid(); if (c.name) c.name += " (kopya)"; } items.splice(i + 1, 0, c); openItems.add(c); draw(); refreshDirty(); }) }),
          h("button", { class: "icon-btn danger", type: "button", title: field.minItems && items.length <= field.minItems ? "En az bir kayıt kalmalı" : "Sil", disabled: Boolean(field.minItems && items.length <= field.minItems), html: icon("trash"), onclick: stop(async () => {
            if (await modal({ title: "Silinsin mi?", text: `“${titleOf(item)}” silinecek. Kaydetmeden önce “Vazgeç” ile geri alabilirsin.`, confirm: "Sil", danger: true })) {
              items.splice(i, 1);
              if (field.activeKey && !items.some((x) => x.id === obj[field.activeKey])) obj[field.activeKey] = items[0] ? items[0].id : "";
              draw(); refreshDirty();
            }
          }) }),
          h("span", { class: "chev", html: icon("down") }));

        const el = h("div", { class: `item${open ? " is-open" : ""}${isOff ? " is-disabled" : ""}` },
          h("div", { class: "item-head", role: "button", tabindex: "0", "aria-expanded": String(open),
            onclick: () => { open ? openItems.delete(item) : openItems.add(item); draw(); },
            onkeydown: (e) => { if (e.key === "Enter" && e.target === e.currentTarget) e.currentTarget.click(); } },
            logo, h("div", { class: "item-text" }, title, sub), ...badges, sw, tools));
        if (open) {
          const grid = h("div", { class: "grid" });
          const ctx = {
            onChange: (key) => { if (key === field.itemTitle) title.textContent = titleOf(item); if (key === field.itemSub) sub.textContent = subOf(item); },
            rerender: () => draw()
          };
          field.fields.forEach((f) => { const node = renderField(f, item, ctx); if (node) grid.append(node); });
          el.append(h("div", { class: "item-body" }, grid));
        }
        box.append(el);
      });
    };
    draw();
    const add = h("button", { class: "add-btn", type: "button", html: `${icon("plus")} ${field.addLabel || "Ekle"}`, onclick: () => {
      const item = clone(field.newItem || {});
      if (field.ids) item.id = uid();
      items.unshift(item);
      openItems.add(item);
      draw(); refreshDirty();
      box.querySelector(".item-body input, .item-body textarea")?.focus();
    } });
    return h("div", {}, add, box);
  }

  // ---------- Sayfalar ----------
  function renderNav() {
    const nav = $("#nav");
    nav.replaceChildren();
    let group = null;
    for (const p of PAGES.filter((item) => !item.founderOnly || currentUser?.role === "founder" || currentUser?.role === "demo")) {
      if (p.group !== group) { group = p.group; nav.append(h("div", { class: "nav-label" }, group)); }
      nav.append(h("a", { href: `/admin${p.slug ? "/" + p.slug : ""}`, class: p === page ? "is-active" : "", "aria-current": p === page ? "page" : null, html: `${icon(p.icon)}<span>${p.title}</span>` }));
    }
  }

  function renderFormPage() {
    const root = $("#page");
    const sections = [...new Set(page.blocks.map((b) => b.section))];
    const resetBtn = h("button", { class: "btn ghost", type: "button", html: `${icon("reset")} Varsayılana döndür`, onclick: async () => {
      const ok = await modal({ title: "Bu sayfa varsayılana dönsün mü?", text: "Bu sayfadaki alanlar ilk kurulumdaki hallerine döner. “Kaydet”e basmadıkça sitede bir şey değişmez.", confirm: "Döndür", danger: true });
      if (!ok) return;
      sections.forEach((s) => { draft[s] = clone(defaults[s]); });
      renderFormPage(); refreshDirty();
    } });
    root.replaceChildren(
      h("div", { class: "page-head" },
        h("div", {}, h("h1", {}, page.title), page.desc ? h("p", {}, page.desc) : null),
        h("div", { class: "head-actions" }, resetBtn, h("a", { class: "btn", href: "/", target: "_blank", html: `${icon("ext")} Sitede gör` }))));

    if (page.statsPanel) root.append(statsPanel());
    if (page.snakePanel) root.append(snakePanel());
    if (page.presencePanel) root.append(presencePanel());

    for (const block of page.blocks) {
      const base = block.prefix ? (getPath(draft[block.section], block.prefix) || (setPath(draft[block.section], block.prefix, {}), getPath(draft[block.section], block.prefix))) : draft[block.section];
      const grid = h("div", { class: "grid" });
      const ctx = { rerender: () => { const y = scrollY; renderFormPage(); scrollTo(0, y); } };
      block.fields.forEach((f) => { const node = renderField(f, base, ctx); if (node) grid.append(node); });
      root.append(h("section", { class: "card" },
        h("div", { class: "card-head" }, h("div", {}, h("h2", {}, block.title), block.desc ? h("p", {}, block.desc) : null), block.headToggle ? headSwitch(block.headToggle) : null),
        h("div", { class: "card-body" }, grid)));
    }
  }

  // Kart başlığındaki "sitede göster" anahtarı (bölümü / kart grubunu toplu gizler)
  function headSwitch(t) {
    const get = () => { const v = getPath(draft[t.section], t.key); return v === undefined ? true : Boolean(v); };
    const btn = h("button", { type: "button", role: "switch", class: "switch is-big", onclick: () => { setPath(draft[t.section], t.key, !get()); paint(); refreshDirty(); } });
    const paint = () => {
      const on = get();
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-checked", String(on));
      btn.replaceChildren(h("span", { class: "track" }), h("span", { class: "switch-text" }, on ? t.onLabel || "Sitede açık" : t.offLabel || "Sitede gizli"));
    };
    paint();
    return btn;
  }

  function snakePanel() {
    const card = h("section", { class: "card" },
      h("div", { class: "card-head" }, h("div", {}, h("h2", {}, "Oyuncular"), h("p", {}, "Her kullanıcı adının en iyi skoru. Gizlenen oyuncu rekor olarak sitede gösterilmez."))),
      h("div", { class: "card-body" }, h("div", { class: "loading", style: "min-height:120px" }, h("span", { class: "spin" }))));
    const body = card.querySelector(".card-body");
    const when = (iso) => iso ? new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
    const load = () => api("GET", "/api/admin/snake").then(({ players }) => {
      const total = players.reduce((a, p) => a + (p.games || 0), 0);
      let rank = 0;
      const rows = players.map((p) => {
        if (!p.hidden) rank += 1;
        const medal = !p.hidden && rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : (p.hidden ? "—" : String(rank));
        const key = encodeURIComponent(p.key);
        return h("tr", { class: p.hidden ? "is-muted" : "" },
          h("td", { class: "rank" }, medal),
          h("td", {}, h("button", { class: "btn ghost small", type: "button", onclick: () => {
            const details = h("div", { class: "attempt-modal-body" });
            let requestId = 0;
            const loadPage = async (number) => {
              const id = ++requestId;
              details.replaceChildren(h("div", { class: "attempt-loading", role: "status" }, h("span", {}, "Denemeler yükleniyor…"), h("i"), h("i"), h("i")));
              try {
                const data = await api("GET", `/api/admin/snake/${key}/attempts?page=${number}`);
                if (id !== requestId) return;
                if (!data.total) {
                  details.replaceChildren(h("div", { class: "attempt-empty" }, h("strong", {}, "Henüz ayrıntılı deneme yok"), h("p", {}, "Eski oyunların ayrıntıları kaydedilmemiş. Yeni tamamlanan oyunlar burada görünür.")));
                  return;
                }
                const cards = data.attempts.map((a) => h("article", { class: "attempt-card" },
                  h("div", { class: "attempt-card-head" }, h("div", {}, h("span", { class: "attempt-number" }, `DENEME ${a.number}`), h("strong", {}, when(a.endedAt))), h("div", { class: "attempt-score" }, String(a.score), h("small", {}, "PUAN"))),
                  h("div", { class: "attempt-metrics" }, h("span", {}, `${Math.round(a.durationMs / 1000)} sn süre`), h("span", {}, `${a.steps} adım`), h("span", {}, `${a.turns} dönüş`)),
                  h("div", { class: "attempt-reason" }, a.reason || "Oyun tamamlandı")));
                const previous = h("button", { class: "btn small", type: "button", disabled: data.page <= 1, onclick: () => loadPage(data.page - 1) }, "← Önceki");
                const next = h("button", { class: "btn small", type: "button", disabled: data.page >= data.pages, onclick: () => loadPage(data.page + 1) }, "Sonraki →");
                details.replaceChildren(h("div", { class: "attempt-summary" }, h("span", {}, `${data.total} kayıtlı deneme`), h("span", {}, "En yeniden eskiye")), h("div", { class: "snake-attempts" }, cards),
                  h("nav", { class: "attempt-pagination", "aria-label": "Deneme geçmişi sayfaları" }, previous, h("span", { role: "status", "aria-live": "polite" }, `${data.page} / ${data.pages}`), next));
              } catch (_) {
                if (id !== requestId) return;
                details.replaceChildren(h("div", { class: "attempt-empty", role: "alert" }, h("strong", {}, "Denemeler yüklenemedi"), h("p", {}, "Bağlantıyı kontrol edip tekrar deneyin."), h("button", { class: "btn small", type: "button", onclick: () => loadPage(number) }, "Tekrar dene")));
              }
            };
            modal({ title: `${p.name} · Deneme geçmişi`, text: `En iyi skor: ${p.best} · Toplam oyun: ${p.games || 0}`, body: details, confirm: "Kapat", cancel: null });
            loadPage(1);
          } }, p.name), p.hidden ? h("span", { class: "badge", style: "margin-left:8px" }, "Gizli") : ""),
          h("td", { class: "num" }, String(p.best)),
          h("td", { class: "num" }, String(p.games || 0)),
          h("td", { class: "muted" }, when(p.last)),
          h("td", { class: "actions" },
            h("button", { class: "icon-btn", type: "button", title: p.hidden ? "Rekorda göster" : "Rekordan gizle", html: icon(p.hidden ? "eye" : "x"), onclick: async () => {
              try { await api("PATCH", `/api/admin/snake/${key}`, { hidden: !p.hidden }); load(); } catch (err) { toast(err.message, "err"); }
            } }),
            h("button", { class: "icon-btn danger", type: "button", title: "Sil", html: icon("trash"), onclick: async () => {
              if (!(await modal({ title: `“${p.name}” silinsin mi?`, text: "Bu oyuncunun tüm skor kaydı silinir.", confirm: "Sil", danger: true }))) return;
              try { await api("DELETE", `/api/admin/snake/${key}`); toast("Silindi."); load(); } catch (err) { toast(err.message, "err"); }
            } })));
      });
      const resetBtn = h("button", { class: "btn small danger", type: "button", html: `${icon("reset")} Tüm skorları sıfırla`, onclick: async () => {
        if (!(await modal({ title: "Tüm skorlar silinsin mi?", text: "Bütün oyuncular ve skorları kalıcı olarak silinir. Bu işlem geri alınamaz.", confirm: "Sıfırla", danger: true }))) return;
        try { await api("POST", "/api/admin/snake/reset"); toast("Skorlar sıfırlandı."); load(); } catch (err) { toast(err.message, "err"); }
      } });
      body.replaceChildren(
        h("div", { class: "stats", style: "margin-bottom:22px;grid-template-columns:repeat(3,minmax(0,1fr))" },
          h("div", { class: "stat" }, h("b", {}, String(players.length)), h("small", {}, "Oyuncu")),
          h("div", { class: "stat" }, h("b", {}, String(total)), h("small", {}, "Oynanan oyun")),
          h("div", { class: "stat" }, h("b", {}, String(players.find((p) => !p.hidden)?.best || 0)), h("small", {}, "Rekor"))),
        players.length
          ? h("div", { class: "table-wrap" }, h("table", { class: "table" },
              h("thead", {}, h("tr", {}, h("th", {}, "#"), h("th", {}, "Kullanıcı adı"), h("th", { class: "num" }, "En iyi"), h("th", { class: "num" }, "Oyun"), h("th", {}, "Son oynama"), h("th", {}, ""))),
              h("tbody", {}, rows)))
          : h("div", { class: "empty" }, "Henüz kimse oynamadı."),
        h("div", { style: "display:flex;justify-content:flex-end;gap:8px;margin-top:18px" },
          h("button", { class: "btn small", type: "button", html: `${icon("reset")} Yenile`, onclick: load }), players.length ? resetBtn : ""));
    }).catch((err) => body.replaceChildren(h("p", { class: "note" }, `Skorlar alınamadı: ${err.message}`)));
    load();
    return card;
  }

  function presencePanel() {
    const card = h("section", { class: "card" },
      h("div", { class: "card-head" }, h("div", {}, h("h2", {}, "Şu an sitede"), h("p", {}, "Son 8 saniyede hareket eden ziyaretçiler. Veri bellekte tutulur, kaydedilmez."))),
      h("div", { class: "card-body" }, h("div", { class: "loading", style: "min-height:80px" }, h("span", { class: "spin" }))));
    const body = card.querySelector(".card-body");
    const load = () => api("GET", "/api/admin/presence").then((d) => {
      body.replaceChildren(h("div", { class: "stats", style: "grid-template-columns:repeat(2,minmax(0,1fr))" },
        h("div", { class: "stat" }, h("b", {}, String(d.online)), h("small", {}, "Şu an sitede")),
        h("div", { class: "stat" }, h("b", {}, String(d.waves)), h("small", {}, "Selam (sunucu açıldığından beri)"))));
    }).catch((err) => body.replaceChildren(h("p", { class: "note" }, `Alınamadı: ${err.message}`)));
    load();
    const t = setInterval(() => { if (!document.body.contains(card)) clearInterval(t); else load(); }, 5000);
    return card;
  }

  function statsPanel() {
    const card = h("section", { class: "card" },
      h("div", { class: "card-head" }, h("div", {}, h("h2", {}, "Ziyaretler"), h("p", {}, "Saat dilimi: İstanbul. Sayılar en geç 10 saniye içinde güncellenir."))),
      h("div", { class: "card-body" }, h("div", { class: "loading", style: "min-height:120px" }, h("span", { class: "spin" }))));
    const body = card.querySelector(".card-body");
    const fmt = (n) => Number(n || 0).toLocaleString("tr-TR");
    const load = () => api("GET", "/api/admin/stats").then((st) => {
      const max = Math.max(1, ...st.days.map((d) => d.count));
      const chart = h("div", { class: "chart", role: "img", "aria-label": "Son 14 günün ziyaret grafiği" },
        st.days.map((d) => {
          const label = new Date(d.date + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
          return h("div", { class: "bar", title: `${label}: ${fmt(d.count)} ziyaret` },
            h("span", { class: "bar-val" }, d.count ? fmt(d.count) : ""),
            h("i", { style: `height:${Math.max(3, (d.count / max) * 100)}%` }),
            h("small", {}, label.split(" ")[0]));
        }));
      const resetBtn = h("button", { class: "btn small danger", type: "button", html: `${icon("reset")} Sayaçları sıfırla`, onclick: async () => {
        const ok = await modal({ title: "Tüm sayaçlar sıfırlansın mı?", text: "Toplam, tekil ve günlük tüm ziyaret sayıları kalıcı olarak 0 olur. Bu işlem geri alınamaz.", confirm: "Sıfırla", danger: true });
        if (!ok) return;
        try { await api("POST", "/api/admin/stats/reset"); toast("Sayaçlar sıfırlandı."); load(); } catch (err) { toast(err.message, "err"); }
      } });
      body.replaceChildren(
        h("div", { class: "stats", style: "margin-bottom:22px" },
          h("div", { class: "stat" }, h("b", {}, fmt(st.total)), h("small", {}, "Toplam ziyaret")),
          h("div", { class: "stat" }, h("b", {}, fmt(st.unique)), h("small", {}, "Tekil ziyaretçi")),
          h("div", { class: "stat" }, h("b", {}, fmt(st.today)), h("small", {}, "Bugün")),
          h("div", { class: "stat" }, h("b", {}, fmt(st.last7)), h("small", {}, "Son 7 gün"))),
        h("span", { class: "field-label" }, "Son 14 gün"),
        chart,
        st.lastError ? h("p", { class: "note", style: "margin-top:16px" }, `Kayıt hatası: ${st.lastError}`) : "",
        h("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:18px" },
          h("span", { class: "hint" }, "Sıfırlama yalnızca sayıları etkiler; aşağıdaki ayarlar korunur."),
          h("div", { style: "display:flex;gap:8px" }, h("button", { class: "btn small", type: "button", html: `${icon("reset")} Yenile`, onclick: load }), resetBtn)));
    }).catch((err) => body.replaceChildren(h("p", { class: "note" }, `İstatistikler alınamadı: ${err.message}`)));
    load();
    return card;
  }

  function renderDashboard() {
    const c = draft;
    const hour = new Date().getHours();
    const hello = hour < 6 ? "İyi geceler" : hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
    const first = String(c.profile.name || "").split(" ")[0];
    const stat = (n, label, slug) => h("a", { class: "stat", href: `/admin/${slug}` }, h("b", {}, String(n)), h("small", {}, label));
    const tiles = PAGES.filter((p) => p.slug && (!p.founderOnly || currentUser?.role === "founder" || currentUser?.role === "demo")).map((p) => h("a", { class: "tile", href: `/admin/${p.slug}` },
      h("span", { class: "tile-icon", html: icon(p.icon) }), h("div", {}, h("strong", {}, p.title), h("small", {}, p.desc || ""))));
    const s = status;
    const store = s.mode === "appwrite"
      ? h("span", { class: `badge ${s.lastError ? "amber" : "green"}` }, s.lastError ? "Appwrite (bağlantı sorunu)" : "Appwrite bağlı")
      : h("span", { class: "badge amber" }, "Yerel dosya");

    $("#page").replaceChildren(
      h("div", { class: "hero" },
        h("h1", {}, `${hello}${first ? ", " + first : ""} 👋`),
        h("p", {}, "Sitendeki her şeyi buradan düzenleyebilirsin. Değişiklikler “Kaydet”e bastığın anda yayına girer."),
        h("div", { class: "head-actions" },
          h("a", { class: "btn", href: "/", target: "_blank", html: `${icon("ext")} Siteyi aç` }),
          h("a", { class: "btn", href: "/api/admin/export", html: `${icon("download")} Yedek indir` }))),
      h("div", { class: "stats" },
        stat(c.experience.items.length, "Deneyim", "deneyim"),
        stat(c.education.items.length, "Eğitim", "egitim"),
        stat(c.certificates.items.length, "Sertifika", "egitim"),
        stat(c.projects.items.length, "Proje", "projeler")),
      h("section", { class: "card" },
        h("div", { class: "card-head" }, h("div", {}, h("h2", {}, "Durum"), h("p", {}, "Sitenin şu anki temel ayarları."))),
        h("div", { class: "card-body" },
          h("dl", { class: "kv" },
            h("dt", {}, "Veri deposu"), h("dd", {}, store),
            s.mode === "appwrite" ? [h("dt", {}, "Appwrite projesi"), h("dd", {}, s.projectId)] : null,
            h("dt", {}, "Varsayılan tema"), h("dd", {}, c.settings.defaultTheme === "dark" ? "🌙 Koyu" : "☀️ Açık"),
            h("dt", {}, "Discord ID"), h("dd", {}, c.settings.discordId || "—"),
            h("dt", {}, "CV düğmesi"), h("dd", {}, c.cv.mode === "file" ? "Hazır PDF açılıyor" : `Otomatik A4 CV — ${((c.cv.versions || []).find((v) => v.id === c.cv.activeVersion) || {}).name || "Genel CV"}`)),
          s.mode !== "appwrite" ? h("p", { class: "note", style: "margin-top:18px" }, "Appwrite henüz bağlı değil; veriler sunucudaki data/content.json dosyasında tutuluyor. .env içine APPWRITE_PROJECT_ID girip “npm run setup:appwrite” çalıştırınca Appwrite'a geçer.") : null,
          s.lastError ? h("p", { class: "note", style: "margin-top:18px" }, `Appwrite hatası: ${s.lastError}`) : null)),
      h("div", { class: "tiles" }, tiles));
  }

  function renderAdminsPage() {
    const root = $("#page");
    const list = h("div", { class: "admin-user-list", "aria-live": "polite" }, h("div", { class: "loading" }, h("span", { class: "spin" })));
    const input = h("input", { class: "input", id: "new-admin-email", name: "email", type: "email", autocomplete: "email", placeholder: "ornek@gmail.com", required: true });
    const submit = h("button", { class: "btn primary", type: "submit" }, "Yönetici ekle");

    const draw = (data) => {
      const people = [data.founder, ...(data.admins || [])];
      list.replaceChildren(...people.map((person) => {
        const isFounder = person.role === "founder";
        const remove = isFounder ? null : h("button", {
          class: "icon-btn danger", type: "button", "aria-label": `${person.email} yöneticisini kaldır`, html: icon("trash"),
          onclick: async () => {
            const ok = await modal({ title: "Yönetici kaldırılsın mı?", text: `${person.email} bir sonraki isteğinde panel erişimini kaybedecek.`, confirm: "Erişimi kaldır", danger: true });
            if (!ok) return;
            try { draw(await api("DELETE", `/api/admin/users/${encodeURIComponent(person.email)}`)); toast("Yönetici erişimi kaldırıldı."); }
            catch (error) { toast(error.message, "err"); }
          }
        });
        return h("div", { class: "admin-user-row" },
          h("span", { class: `admin-avatar${isFounder ? " is-founder" : ""}`, "aria-hidden": "true" }, person.email[0].toUpperCase()),
          h("div", { class: "admin-user-copy" }, h("strong", {}, person.email), h("small", {}, isFounder ? "Kurucu · kaldırılamaz" : `Yönetici${person.addedAt ? ` · ${new Date(person.addedAt).toLocaleDateString("tr-TR")}` : ""}`)),
          isFounder ? h("span", { class: "badge blue" }, "Kurucu") : remove);
      }));
    };

    const form = h("form", { class: "admin-add-form", onsubmit: async (event) => {
      event.preventDefault();
      submit.disabled = true;
      try {
        const data = await api("POST", "/api/admin/users", { email: input.value.trim() });
        draw(data); input.value = ""; input.focus(); toast("Yeni yönetici yetkilendirildi.");
      } catch (error) { toast(error.message, "err"); }
      finally { submit.disabled = false; }
    } },
      h("div", { class: "field admin-email-field" }, h("label", { for: "new-admin-email" }, "Google hesabı e-postası"), input, h("span", { class: "hint" }, "Bu e-posta Google tarafından doğrulanmış olmalı.")), submit);

    root.replaceChildren(
      h("div", { class: "page-head" }, h("div", {}, h("h1", {}, "Yöneticiler"), h("p", {}, page.desc))),
      h("section", { class: "card" }, h("div", { class: "card-head" }, h("div", {}, h("h2", {}, "Yeni yönetici"), h("p", {}, "Listeye eklenmeyen Google hesapları giriş yapamaz."))), h("div", { class: "card-body" }, form)),
      h("section", { class: "card" }, h("div", { class: "card-head" }, h("div", {}, h("h2", {}, "Erişim listesi"), h("p", {}, "Kurucu hesap her zaman erişebilir."))), h("div", { class: "card-body" }, list)));

    api("GET", "/api/admin/users").then(draw).catch((error) => list.replaceChildren(h("p", { class: "note" }, `Yönetici listesi alınamadı: ${error.message}`)));
  }

  function render() {
    if (page.type === "dashboard") renderDashboard();
    else if (page.type === "admins") renderAdminsPage();
    else renderFormPage();
    document.title = `${page.title} — Yönetim Paneli`;
  }

  // ---------- Olaylar ----------
  $("#save-btn").addEventListener("click", save);
  $("#discard-btn").addEventListener("click", () => { draft = clone(saved); render(); refreshDirty(); toast("Değişiklikler geri alındı."); });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
  });
  window.addEventListener("beforeunload", (e) => { if (draft && dirtySections().length) { e.preventDefault(); e.returnValue = ""; } });
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("a[href^='/admin']");
    if (!a || a.target === "_blank" || a.getAttribute("href").startsWith("/api") || !draft || !dirtySections().length) return;
    e.preventDefault();
    const go = await modal({ title: "Kaydedilmemiş değişiklikler var", text: "Sayfadan çıkarsan değişikliklerin kaybolur.", confirm: "Kaydet ve geç", cancel: "Kalsın" });
    if (go) { await save(); if (!dirtySections().length) location.href = a.href; }
  });
  $("#logout-btn").addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/admin/giris";
  });
  const side = $("#side"), scrim = $("#scrim");
  $("#menu-btn").addEventListener("click", () => { side.classList.add("is-open"); scrim.hidden = false; });
  scrim.addEventListener("click", () => { side.classList.remove("is-open"); scrim.hidden = true; });

  // ---------- Başlat ----------
  api("GET", "/api/admin/content").then((data) => {
    saved = data.content;
    defaults = data.defaults;
    status = data.status;
    currentUser = data.user || { email: data.email, role: "admin" };
    draft = clone(saved);
    if (page.founderOnly && currentUser.role !== "founder" && currentUser.role !== "demo") { location.href = "/admin"; return; }
    renderNav();
    $("#who").textContent = currentUser.email;
    if (currentUser.role === "demo") {
      const notice = h("div", { class: "demo-banner", role: "status" }, "Demo modu · Örnek veriler gösteriliyor. Değişiklikler kaydedilmez.");
      document.querySelector(".main").prepend(notice);
    }
    render();
  }).catch((err) => {
    $("#page").replaceChildren(h("div", { class: "note" }, `Veriler yüklenemedi: ${err.message}`));
  });
})();
