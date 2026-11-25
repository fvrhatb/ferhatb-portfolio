// Canlı ziyaretçi imleçleri + "Selam ver" (W tuşu). Yönetim panelinden açılıp kapatılır (profileData.presence).
(() => {
  const start = () => {
    const cfg = (window.FerbCV && window.FerbCV.profileData && window.FerbCV.profileData.presence) || {};
    if (!cfg.enabled || !window.fetch) return;
    if (!window.matchMedia("(pointer: fine)").matches) return; // dokunmatik cihazda imleç yok

    let id = "";
    try { id = sessionStorage.getItem("ferb_pid") || ""; } catch { /* sessionStorage kapalı olabilir */ }
    if (!/^[a-f0-9]{16}$/.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
      try { sessionStorage.setItem("ferb_pid", id); } catch { /* yoksay */ }
    }

    const layer = document.createElement("div");
    layer.className = "presence-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.append(layer);
    const chip = document.createElement("div");
    chip.className = "presence-chip";
    chip.hidden = true;
    chip.setAttribute("role", "status");
    document.body.append(chip);

    const label = (cfg.label || "Ziyaretçi").slice(0, 24);
    const ghosts = new Map(); // k -> { el, bubbleTimer, wave }
    let px = null, py = null, moved = false, lastMove = 0, waveQueued = false, lastWave = 0, timer = 0, myNo = 0;

    const hue = (n) => (n * 47) % 360;
    function bubble(el, text) {
      const old = el.querySelector(".presence-bubble");
      if (old) old.remove();
      const b = document.createElement("span");
      b.className = "presence-bubble";
      b.textContent = text;
      el.append(b);
      setTimeout(() => b.classList.add("is-out"), 2200);
      setTimeout(() => b.remove(), 2700);
    }

    function place(g, x, y) {
      const w = innerWidth, h = innerHeight;
      g.el.style.transform = `translate3d(${Math.round(x * w)}px, ${Math.round(y * h)}px, 0)`;
    }

    function sync(peers) {
      const seen = new Set();
      for (const p of peers) {
        seen.add(p.k);
        let g = ghosts.get(p.k);
        if (!g) {
          const el = document.createElement("div");
          el.className = "presence-ghost";
          el.style.setProperty("--h", hue(p.n));
          el.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 3l15 8-6.5 1.8L9.5 19z" fill="currentColor" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg><span class="presence-name"></span>`;
          el.querySelector(".presence-name").textContent = `${label} #${p.n}`;
          layer.append(el);
          g = { el, wave: p.w || 0 }; // yeni gelenin eski selamını tekrar gösterme
          ghosts.set(p.k, g);
          place(g, p.x, p.y);
          requestAnimationFrame(() => el.classList.add("is-in"));
        } else {
          place(g, p.x, p.y);
        }
        if (p.w && p.w !== g.wave) { g.wave = p.w; if (cfg.wave !== false) bubble(g.el, "👋 Selam!"); }
      }
      for (const [k, g] of ghosts) if (!seen.has(k)) { g.el.classList.remove("is-in"); setTimeout(() => g.el.remove(), 400); ghosts.delete(k); }
    }

    function paintChip(online) {
      if (cfg.showHint === false) { chip.hidden = true; return; }
      chip.hidden = false;
      chip.innerHTML = online < 2
        ? '<i></i><span>Şu an sitede yalnızsın</span>'
        : `<i></i><span>${online - 1} kişi daha sitede</span>${cfg.wave !== false ? "<kbd>W</kbd><span>selam ver</span>" : ""}`;
    }

    async function tick() {
      timer = 0;
      if (document.hidden) return;
      const body = { id };
      if (moved && px != null) { body.x = px; body.y = py; moved = false; }
      if (waveQueued) { body.wave = true; waveQueued = false; }
      try {
        const res = await fetch("/api/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin", keepalive: true });
        if (res.status === 429) { schedule(8000); return; }
        if (!res.ok) { schedule(15000); return; }
        const d = await res.json();
        myNo = d.me;
        sync(d.peers || []);
        paintChip(d.online || 1);
        // Etkin değilsek ve kimse yoksa seyrek sor
        const idle = Date.now() - lastMove > 15000;
        schedule(d.online > 1 ? (idle ? 2500 : 1200) : (idle ? 6000 : 2500));
      } catch { schedule(10000); }
    }
    function schedule(ms) { clearTimeout(timer); timer = setTimeout(tick, ms); }

    addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      px = e.clientX / innerWidth; py = e.clientY / innerHeight; moved = true; lastMove = Date.now();
    }, { passive: true });

    function sendWave() {
      const now = Date.now();
      if (cfg.wave === false || now - lastWave < 3000) return;
      lastWave = now;
      waveQueued = true;
      const me = document.createElement("div");
      me.className = "presence-ghost presence-me is-in";
      me.style.transform = `translate3d(${Math.round((px ?? 0.5) * innerWidth)}px, ${Math.round((py ?? 0.5) * innerHeight)}px, 0)`;
      layer.append(me);
      bubble(me, "👋 Selam!");
      setTimeout(() => me.remove(), 2700);
      schedule(50);
    }
    addEventListener("keydown", (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== "w") return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      sendWave();
    });

    document.addEventListener("visibilitychange", () => { if (!document.hidden) schedule(100); else clearTimeout(timer); });
    addEventListener("resize", () => {}, { passive: true });
    schedule(800);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
