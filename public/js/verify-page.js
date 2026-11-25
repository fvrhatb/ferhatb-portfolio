// /cv/dogrula — CV'deki QR kodun (veya elle girilen kodun) açtığı sayfa.
// Kod yoksa kod sorar; kod varsa o basılı CV'nin güncel olup olmadığını ve canlı projeleri gösterir.
(() => {
  const card = document.getElementById("card");
  const params = new URLSearchParams(location.search);
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmtDate = (d) => new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const fmtCode = (c) => `FB-${c.slice(0, 4)}-${c.slice(4)}`;
  document.getElementById("foot").textContent = `Bu sayfa ${location.host} adresine aittir.`;

  const form = (note) => `
    <form id="f" autocomplete="off">
      <input id="k" name="k" placeholder="FB-XXXX-XXXX" maxlength="14" aria-label="Doğrulama kodu" autofocus />
      <button class="btn" type="submit" style="flex:none">Doğrula</button>
    </form>${note ? `<p class="help">${note}</p>` : ""}`;

  function bind() {
    const f = document.getElementById("f");
    if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const k = document.getElementById("k").value.trim();
      if (k) location.href = `/cv/dogrula?k=${encodeURIComponent(k)}`;
    });
  }

  function hero(state, icon, title, lead, code) {
    return `<div class="hero state-${state}"><div class="badge">${icon}</div><h1>${title}</h1><p class="lead">${lead}</p>${code ? `<div class="code">${esc(fmtCode(code))}</div>` : ""}</div>`;
  }

  function render(d) {
    if (d.state === "none") {
      card.innerHTML = hero("none", "🔎", "CV’nin kodunu gir", "Çıktının sağ altındaki “FB-XXXX-XXXX” kodunu yaz ya da QR kodu okut. CV’nin güncel olup olmadığını hemen gösteririm.")
        + `<div class="body">${form("Her CV çıktısının kendine ait benzersiz bir kodu vardır. Kod yoksa ya da tanınmıyorsa çıktı bu siteden alınmamıştır.")}</div>`;
      bind();
      return;
    }
    if (d.state === "invalid") {
      card.innerHTML = hero("invalid", "⛔", "Kod tanınmadı", "Bu kodla eşleşen bir CV bulunamadı. Kodu yanlış yazmış olabilirsin ya da bu çıktı ferhatb.com üzerinden alınmamış olabilir.")
        + `<div class="body">${form("Kodu tekrar dene. Harf büyük/küçük olabilir, tire gerekmez.")}</div>`;
      bind();
      return;
    }

    const ok = d.state === "current";
    const lead = ok
      ? "Elindeki çıktı, sitedeki en güncel CV ile birebir aynı."
      : `Elindeki çıktı eski bir sürüm${d.changedAt ? `; CV’nin içeriği ${esc(fmtDate(d.changedAt))} tarihinde değişti` : ""}. Güncel hali için aşağıdaki düğmeyi kullan.`;
    const projects = d.projects.length
      ? d.projects.map((p) => {
          const pill = p.live === true ? '<span class="pill up">● Canlı</span>' : p.live === false ? '<span class="pill down">Ulaşılamıyor</span>' : `<span class="pill">${esc(p.status || "Proje")}</span>`;
          const name = p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>` : esc(p.title);
          return `<div class="proj"><div><strong>${name}</strong><small>${esc([p.year, p.status].filter(Boolean).join(" · "))}</small></div>${pill}</div>`;
        }).join("")
      : '<p class="empty">Şu an listelenmiş bir proje yok. Yeni projeler eklendikçe burada görünür.</p>';

    card.innerHTML = hero(ok ? "current" : "outdated", ok ? "✅" : "⚠️", ok ? "Bu CV güncel" : "Bu CV güncel değil", lead, d.code)
      + `<div class="body">
        <div class="who"><strong>${esc(d.name)}</strong>${d.role ? `<span>${esc(d.role)}</span>` : ""}</div>
        <dl>
          ${d.version.name ? `<dt>CV sürümü</dt><dd>${esc(d.version.name)}</dd>` : ""}
          <dt>Bu içeriğin oluşturulması</dt><dd>${esc(fmtDate(d.issuedAt))}</dd>
          <dt>Kontrol zamanı</dt><dd>${esc(new Date(d.checkedAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }))}</dd>
        </dl>
        <h2>Projeler</h2>${projects}
        <div class="actions">
          <a class="btn" href="/cv${d.version.id ? "/" + encodeURIComponent(d.version.id) : ""}">${ok ? "CV’yi aç" : "Güncel CV’yi aç"}</a>
          <a class="btn alt" href="/">Siteyi gör</a>
        </div>
      </div>`;
    document.title = `${d.name} — CV Doğrulama`;
  }

  fetch(`/api/verify?k=${encodeURIComponent(params.get("k") || "")}`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then(render)
    .catch(() => { card.innerHTML = hero("invalid", "❌", "Doğrulanamadı", "Şu anda bilgilere ulaşılamıyor, biraz sonra tekrar dene."); });
})();
