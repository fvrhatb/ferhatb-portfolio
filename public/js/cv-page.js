// /cv ve /cv/<sürüm> sayfası: seçilen CV sürümünü A4 sayfa olarak gösterir. Tarayıcının "PDF olarak kaydet" özelliğiyle indirilir.
(() => {
  const $ = (id) => document.getElementById(id);
  const sheet = $("sheet");
  const params = new URLSearchParams(location.search);
  const draftMode = params.has("taslak");
  let data = (window.FerbCV && window.FerbCV.profileData) || null;
  let current = decodeURIComponent((location.pathname.split("/")[2] || "")).trim();

  function scaleToScreen() {
    const avail = document.documentElement.clientWidth - 24;
    const w = sheet.offsetWidth || 794;
    const s = Math.min(1, avail / w);
    sheet.style.transform = s < 1 ? `scale(${s})` : "";
    sheet.style.marginBottom = s < 1 ? `${-(sheet.offsetHeight * (1 - s))}px` : "";
  }

  function draw() {
    if (!data) { $("empty").hidden = false; return; }
    $("empty").hidden = true;
    const R = window.FerbCvRender;
    const versions = R.versions(data);
    const v = R.pickVersion(data, current);
    current = v.id;
    R.render(sheet, data, v.id);
    const res = R.fit(sheet);
    R.attachCode(sheet, data, v.id, { draft: draftMode && Boolean(window.opener) });
    scaleToScreen();

    const name = (data.cv && data.cv.name) || "CV";
    $("who").textContent = name;
    document.title = `${name} — CV`;
    $("tabs").replaceChildren(...versions.map((x) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tab"; b.textContent = x.name || x.id;
      b.setAttribute("aria-pressed", String(x.id === v.id));
      b.addEventListener("click", () => {
        current = x.id;
        history.replaceState(null, "", `/cv/${encodeURIComponent(x.id)}${location.search}`);
        draw();
      });
      return b;
    }));
    const fit = $("fit");
    fit.className = "note" + (res.pages > 1 ? " warn" : "");
    fit.textContent = res.pages > 1
      ? `Bu CV tek sayfaya sığmıyor (${res.pages} sayfa). Bazı kayıtları gizleyebilirsin.`
      : res.zoom < 0.999 ? `Tek sayfaya sığdırıldı (%${Math.round(res.zoom * 100)} ölçek).` : "Tek sayfa";
    // Yazdırma sırasında önizleme dönüşümü sıfırlansın
    document.body.classList.toggle("multi", res.pages > 1);
  }

  $("print").addEventListener("click", () => window.print());
  window.addEventListener("resize", scaleToScreen);
  window.addEventListener("beforeprint", () => { sheet.style.transform = ""; });
  window.addEventListener("afterprint", scaleToScreen);

  function start() {
    draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  }

  if (draftMode && window.opener) {
    // Yönetim panelinden: kaydedilmemiş (taslak) veriyi panelden al
    $("draft").hidden = false;
    let got = false;
    window.addEventListener("message", (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== "ferb-cv-draft") return;
      got = true;
      data = { ...(data || {}), ...e.data.data };
      start();
    });
    window.opener.postMessage({ type: "ferb-cv-ready" }, location.origin);
    setTimeout(() => { if (!got) start(); }, 1500); // panel yanıt vermezse kayıtlı veriyle aç
  } else {
    start();
  }
})();
