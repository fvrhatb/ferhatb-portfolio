// Yönetim paneli sayfaları. Yeni bir alan eklemek için ilgili sayfanın "fields" listesine bir satır eklemen yeterli.
// Alan türleri: text, textarea, url, email, image, file (PDF), select, toggle, theme, strings (metin listesi), list (kart listesi)
window.ADMIN_PAGES = [
  { slug: "", title: "Genel Bakış", icon: "home", type: "dashboard", group: "Panel" },

  {
    slug: "profil", title: "Profil & Sosyal", icon: "user", group: "İçerik",
    desc: "Sol paneldeki adın, unvanın, iletişim bilgilerin ve sosyal medya bağlantıların.",
    blocks: [
      {
        section: "profile", title: "Kimlik", desc: "Sitenin sol üstünde görünen bilgiler.",
        fields: [
          { key: "name", label: "Ad Soyad", type: "text" },
          { key: "handle", label: "Lakap rozeti", type: "text", hint: "Adının yanındaki küçük rozet. Örn: @Ferb" },
          { key: "role", label: "Unvan", type: "text", span: 2, hint: "Adının altındaki satır." },
          { key: "location", label: "Konum satırı", type: "text", span: 2 },
          { key: "avatarSource", label: "Sitede hangi fotoğraf görünsün?", type: "choice", span: 2, options: [
            ["discord", "Discord fotoğrafım", "Discord'da fotoğrafını değiştirince sitede de değişir. Discord'a ulaşılamazsa aşağıdaki fotoğraf görünür."],
            ["custom", "Kendi yüklediğim fotoğraf", "Discord bağlı olsa bile her zaman aşağıdaki fotoğraf görünür."]
          ] },
          { key: "avatar", label: "Profil fotoğrafı", type: "image", span: 2, hint: "“Kendi yüklediğim fotoğraf” seçiliyse her zaman bu görünür; Discord seçiliyse yedek olarak kullanılır." }
        ]
      },
      {
        section: "profile", title: "İletişim & alt bilgi",
        fields: [
          { key: "email", label: "E-posta", type: "email", hint: "Kopyalanabilen e-posta düğmesinde görünür." },
          { key: "username", label: "Kullanıcı adı", type: "text", hint: "Spotify kartında “@kullanıcıadı” olarak görünür." },
          { key: "footer", label: "Alt bilgi yazısı", type: "text", span: 2, hint: "Sayfanın en altında “© 2026” yazısından sonra gelir." }
        ]
      },
      {
        section: "profile", title: "Canlı durum cümleleri", desc: "Adının altında sırayla dönen kısa cümleler.",
        fields: [
          { key: "liveStatusesEnabled", label: "Canlı durum cümlelerini sitede göster", type: "toggle", default: true, span: 2, hint: "Kapatınca cümleler silinmez; yeniden açabilirsin." },
          { key: "liveStatuses", label: "", type: "strings", span: 2, addLabel: "Cümle ekle", placeholder: "Örn: Yeni projeler için fikir üretiyorum 💡" }
        ]
      },
      {
        section: "socials", title: "Sosyal medya bağlantıları", desc: "Sıralamayı oklarla değiştirebilirsin.",
        fields: [{
          key: "items", type: "list", span: 2, addLabel: "Bağlantı ekle", itemTitle: "label", itemSub: "url",
          newItem: { label: "Yeni bağlantı", icon: "link", url: "https://" },
          fields: [
            { key: "label", label: "Ad", type: "text" },
            { key: "icon", label: "Simge", type: "select", options: [
              ["linkedin", "LinkedIn"], ["x", "X (Twitter)"], ["instagram", "Instagram"], ["github", "GitHub"], ["youtube", "YouTube"],
              ["tiktok", "TikTok"], ["spotify", "Spotify"], ["discord", "Discord"], ["mail", "E-posta"], ["link", "Genel bağlantı"], ["text", "Harf (örn. B, K)"]
            ] },
            { key: "url", label: "Adres", type: "url", span: 2, hint: "Discord için boş bırakırsan, tıklayınca Discord kullanıcı adını kopyalayan düğme olur." },
            { key: "text", label: "Harf", type: "text", hint: "Yalnızca “Harf” simgesi seçiliyse kullanılır (1–2 karakter)." }
          ]
        }]
      }
    ]
  },

  {
    slug: "hakkimda", title: "Hakkımda", icon: "spark", group: "İçerik",
    desc: "“Hakkımda” bölümündeki kartlar.",
    blocks: [
      {
        section: "about", title: "Giriş kartı",
        fields: [
          { key: "manifesto", label: "Alıntı", type: "text", span: 2, hint: "Tırnak içinde büyük yazılan söz." },
          { key: "summary", label: "Özet", type: "textarea", span: 2, rows: 4 },
          { key: "tags", label: "Etiketler", type: "strings", span: 2, addLabel: "Etiket ekle", placeholder: "#Müzik" }
        ]
      },
      {
        section: "about", title: "Fotoğraf kartı",
        fields: [
          { key: "workspaceImage", label: "Fotoğraf", type: "image", span: 2 },
          { key: "workspaceAlt", label: "Fotoğraf açıklaması", type: "text", hint: "Görme engelliler ve arama motorları için." },
          { key: "workspaceCaption", label: "Fotoğraf üstü yazı", type: "text", hint: "Boş bırakılabilir." }
        ]
      },
      {
        section: "about", title: "İlham & vizyon kartı",
        fields: [
          { key: "visionTitle", label: "Başlık", type: "text", span: 2 },
          { key: "visionText", label: "Metin", type: "textarea", span: 2, rows: 4 }
        ]
      },
      {
        section: "about", title: "Yetenekler kartı",
        fields: [
          { key: "techTitle", label: "Kart başlığı", type: "text", span: 2 },
          {
            key: "techStack", label: "Yetenekler", type: "list", span: 2, addLabel: "Yetenek ekle", itemTitle: "label", compact: true, canDisable: true,
            newItem: { enabled: true, label: "Yeni yetenek", primary: true },
            fields: [
              { key: "enabled", label: "Sitede göster", type: "toggle", default: true },
              { key: "label", label: "Yetenek", type: "text" },
              { key: "primary", label: "Vurgulu göster", type: "toggle" }
            ]
          }
        ]
      }
    ]
  },

  {
    slug: "egitim", title: "Eğitim & Sertifikalar", icon: "cap", group: "İçerik",
    desc: "Okulların ve sertifikaların. Dönemde “Devam ediyor” yazarsan veya bitiş tarihi gelecekteyse kart sitede parlar.",
    blocks: [
      {
        section: "education", title: "Eğitim", desc: "En yeniyi en üste koy.", headToggle: { section: "sections", key: "education.showSchools", onLabel: "Okullar sitede açık", offLabel: "Okullar sitede gizli" },
        fields: [{
          key: "items", type: "list", span: 2, addLabel: "Okul ekle", canDisable: true, ids: true, itemTitle: "school", itemSub: "period", itemLogo: "logo",
          newItem: { enabled: true, school: "Yeni okul", department: "", period: "Eylül 2026 – Devam ediyor", details: "", logo: "" },
          fields: [
            { key: "enabled", label: "Sitede göster", type: "toggle", default: true, span: 2, hint: "Kapatırsan kart silinmez, sadece sitede görünmez. İstediğin zaman geri açabilirsin." },
            { key: "school", label: "Okul", type: "text" },
            { key: "period", label: "Dönem", type: "text", hint: "Örn: Eylül 2024 – Haziran 2026" },
            { key: "department", label: "Bölüm / derece", type: "text", span: 2 },
            { key: "logo", label: "Logo", type: "image", span: 2 },
            { key: "details", label: "Açıklama", type: "textarea", span: 2, rows: 4 }
          ]
        }]
      },
      {
        section: "certificates", title: "Sertifikalar", headToggle: { section: "sections", key: "education.showCertificates", onLabel: "Sertifikalar sitede açık", offLabel: "Sertifikalar sitede gizli" },
        fields: [{
          key: "items", type: "list", span: 2, addLabel: "Sertifika ekle", canDisable: true, ids: true, itemTitle: "title", itemSub: "issuer", itemLogo: "logo",
          newItem: { enabled: true, title: "Yeni sertifika", issuer: "", desc: "", logo: "" },
          fields: [
            { key: "enabled", label: "Sitede göster", type: "toggle", default: true, span: 2, hint: "Kapatırsan kart silinmez, sadece sitede görünmez." },
            { key: "title", label: "Sertifika adı", type: "text", span: 2 },
            { key: "issuer", label: "Veren kurum • tarih", type: "text", span: 2, hint: "Örn: Biruni Üniversitesi • Ekim 2024" },
            { key: "logo", label: "Logo", type: "image", span: 2 },
            { key: "desc", label: "Kısa açıklama", type: "textarea", span: 2, rows: 2 }
          ]
        }]
      }
    ]
  },

  {
    slug: "deneyim", title: "Çalışma Hayatı", icon: "briefcase", group: "İçerik",
    desc: "İş deneyimlerin. Dönemde “Devam ediyor” yazan iş sitede parlayarak öne çıkar.",
    blocks: [{
      section: "experience", title: "Deneyimler", desc: "En yeniyi en üste koy.", headToggle: { section: "sections", key: "experience.enabled", onLabel: "Bölüm sitede açık", offLabel: "Bölüm sitede gizli" },
      fields: [{
        key: "items", type: "list", span: 2, addLabel: "Deneyim ekle", canDisable: true, ids: true, itemTitle: "company", itemSub: "role", itemLogo: "logo",
        newItem: { enabled: true, company: "Yeni iş yeri", role: "", period: "Ocak 2027 – Devam ediyor", details: "", logo: "" },
        fields: [
          { key: "enabled", label: "Sitede göster", type: "toggle", default: true, span: 2, hint: "Kapatırsan kart silinmez, sadece sitede görünmez." },
          { key: "company", label: "İş yeri", type: "text" },
          { key: "period", label: "Dönem", type: "text", hint: "Örn: Haziran 2025 – Ocak 2026 (8 ay)" },
          { key: "role", label: "Pozisyon", type: "text", span: 2, hint: "Örn: Barista • Tam zamanlı (Maltepe, İstanbul)" },
          { key: "logo", label: "Logo", type: "image", span: 2 },
          { key: "details", label: "Açıklama", type: "textarea", span: 2, rows: 4 }
        ]
      }]
    }]
  },

  {
    slug: "projeler", title: "Projeler", icon: "grid", group: "İçerik",
    desc: "Hiç proje yoksa sitede “Çok Yakında” kartı görünür.",
    blocks: [
      {
        section: "projects", title: "Projeler", headToggle: { section: "sections", key: "projects.enabled", onLabel: "Bölüm sitede açık", offLabel: "Bölüm sitede gizli" },
        fields: [{
          key: "items", type: "list", span: 2, addLabel: "Proje ekle", canDisable: true, ids: true, itemTitle: "title", itemSub: "year", itemLogo: "image",
          newItem: { enabled: true, title: "Yeni proje", year: String(new Date().getFullYear()), status: "Aktif", desc: "", image: "", link: "", tech: [], featured: false },
          fields: [
            { key: "enabled", label: "Sitede göster", type: "toggle", default: true, span: 2, hint: "Kapatırsan proje silinmez, sadece sitede görünmez." },
            { key: "title", label: "Proje adı", type: "text" },
            { key: "year", label: "Yıl", type: "text" },
            { key: "status", label: "Durum rozeti", type: "text", hint: "Örn: Aktif, Tamamlandı" },
            { key: "link", label: "Bağlantı", type: "url" },
            { key: "image", label: "Kapak görseli", type: "image", span: 2 },
            { key: "desc", label: "Açıklama", type: "textarea", span: 2, rows: 3 },
            { key: "detailIntro", label: "Proje hikâyesi", type: "textarea", span: 2, rows: 3 },
            { key: "detailWork", label: "Neler yapıldı?", type: "textarea", span: 2, rows: 4 },
            { key: "detailTools", label: "Kullanılan araçlar ve yaklaşım", type: "textarea", span: 2, rows: 3 },
            { key: "detailSections", type: "list", label: "Ek detay bölümleri", span: 2, addLabel: "Detay bölümü ekle", itemTitle: "title", newItem: { title: "", text: "" }, fields: [
              { key: "title", label: "Bölüm başlığı", type: "text", span: 2 }, { key: "text", label: "Açıklama", type: "textarea", span: 2, rows: 4 }
            ] },
            { key: "gallery", type: "list", label: "Proje görselleri", span: 2, addLabel: "Görsel ekle", itemTitle: "caption", newItem: { url: "", caption: "" }, fields: [
              { key: "url", label: "Görsel", type: "image", span: 2 }, { key: "caption", label: "Görsel açıklaması", type: "text", span: 2 }
            ] },
            { key: "demoPanel", label: "Yönetim paneli demo bağlantısını göster", type: "toggle", span: 2, hint: "Demo erişimi Site Ayarları'ndan açık olmalıdır." },
            { key: "tech", label: "Etiketler", type: "strings", span: 2, addLabel: "Etiket ekle" },
            { key: "featured", label: "Öne çıkan (geniş kart)", type: "toggle", span: 2, hint: "Listenin ilk projesiyse geniş gösterilir." }
          ]
        }]
      },
      {
        section: "projects", prefix: "comingSoon", title: "“Çok Yakında” kartı", desc: "Proje yokken görünen konfetili kart.",
        fields: [
          { key: "enabled", label: "Proje yokken bu kartı göster", type: "toggle", default: true, span: 2, hint: "Kapatırsan hiç proje yokken Projeler bölümü menüyle birlikte tamamen gizlenir. Proje ekleyip açık bırakınca bölüm kendiliğinden geri gelir." },
          { key: "badge", label: "Rozet", type: "text" },
          { key: "emoji", label: "Emoji", type: "text" },
          { key: "title", label: "Başlık", type: "text", span: 2 },
          { key: "text", label: "Metin", type: "textarea", span: 2, rows: 3 },
          { key: "hint", label: "Alt ipucu", type: "text", span: 2 }
        ]
      }
    ]
  },

  {
    slug: "cv", title: "CV", icon: "doc", group: "İçerik",
    desc: "Birden fazla CV sürümü hazırla (örn. yazılım başvurusu, kafe başvurusu). Her sürümde şablonu, rengi ve hangi deneyim/eğitim/sertifika/yeteneğin görüneceğini bir kez seçersin; sonra tek tıkla aktif sürümü değiştirirsin.",
    blocks: [
      {
        section: "cv", title: "“CV İndir” düğmesi",
        desc: "Ziyaretçi düğmeye basınca ne olacağı. Otomatik modda aşağıda “Sitede aktif” yazan sürüm yazdırılır / PDF olarak kaydedilir.",
        fields: [
          { key: "mode", label: "Düğmeye basınca", type: "select", span: 2, options: [["auto", "Aktif CV sürümünden A4 CV oluştur (yazdır / PDF kaydet)"], ["file", "Yüklediğim hazır PDF dosyasını aç"]] },
          { key: "fileUrl", label: "Hazır CV dosyası (PDF)", type: "file", span: 2, hint: "Yalnızca “hazır PDF” seçiliyse kullanılır.", showIf: ["mode", "file"] },
          { key: "buttonLabel", label: "Düğme yazısı", type: "text" },
          { key: "buttonHint", label: "Düğme alt yazısı", type: "text" }
        ]
      },
      {
        section: "cv", title: "CV sürümleri",
        desc: "Her sürüm ayrı bir CV’dir. ⭐ ile sitede hangisinin kullanılacağını seç, 👁 ile önizle ve PDF olarak kaydet. Herkese açık adres: ferhatb.com/cv/sürüm-kodu",
        fields: [{
          key: "versions", type: "list", span: 2, ids: true, minItems: 1, preview: true, activeKey: "activeVersion", addLabel: "Yeni CV sürümü", itemTitle: "name", itemSub: "role",
          cvInfo: { modern: "Modern", klasik: "Klasik", zarif: "Zarif", kompakt: "Kompakt" },
          newItem: {
            name: "Yeni CV sürümü", template: "modern", accent: "#38bdf8", lang: "tr", role: "", summary: "", showPhoto: true, descMode: "short",
            showSummary: true, showSkills: true, showCertificates: true, showProjects: true, showLanguages: true, showInterests: true, showReferences: true, showPersonal: false, showQr: true,
            hiddenExperience: [], hiddenEducation: [], hiddenCertificates: [], hiddenProjects: [], hiddenSkills: [], languages: [], interests: [], references: []
          },
          fields: [
            { key: "name", label: "Sürüm adı", type: "text", span: 2, hint: "Sadece senin göreceğin ad. Örn: Yazılım başvurusu" },
            { key: "template", label: "Şablon", type: "templatepick", span: 2, options: [
              ["modern", "Modern", "Koyu yan panel, fotoğraflı"],
              ["klasik", "Klasik", "Tek sütun, sade — işe alım yazılımları (ATS) için"],
              ["zarif", "Zarif", "Renkli üst bant, iki sütun"],
              ["kompakt", "Kompakt", "Tarih sütunlu, çok içerik sığdırır"]
            ] },
            { key: "accent", label: "Vurgu rengi", type: "color", span: 2 },
            { key: "lang", label: "Başlıkların dili", type: "select", options: [["tr", "Türkçe (Deneyim, Eğitim…)"], ["en", "English (Experience, Education…)"]], hint: "Yalnızca bölüm başlıkları değişir; yazdığın içerik aynen kalır." },
            { key: "descMode", label: "Açıklamalar", type: "select", options: [["short", "Kısaltılmış (tek sayfaya sığar)"], ["full", "Tam metin"], ["none", "Gösterme (sadece başlıklar)"]] },
            { key: "role", label: "Bu sürümün başlığı / pozisyon", type: "text", span: 2, hint: "Adının altında görünür. Boş bırakırsan aşağıdaki genel başlık kullanılır. Örn: Yazılım Geliştirici Adayı" },
            { key: "summary", label: "Bu sürümün özet yazısı", type: "textarea", span: 2, rows: 4, hint: "Başvurduğun işe göre yaz. Boş bırakırsan genel özet kullanılır." },
            { key: "showPhoto", label: "Fotoğraf göster", type: "toggle" },
            { key: "showSummary", label: "Özet yazısını göster", type: "toggle" },
            { key: "showSkills", label: "Yetenekler bölümünü göster", type: "toggle" },
            { key: "showCertificates", label: "Sertifikalar bölümünü göster", type: "toggle" },
            { key: "showProjects", label: "Projeler bölümünü göster", type: "toggle" },
            { key: "showLanguages", label: "Diller bölümünü göster", type: "toggle" },
            { key: "showInterests", label: "İlgi alanlarını göster", type: "toggle" },
            { key: "showReferences", label: "Referansları göster", type: "toggle" },
            { key: "languages", label: "Bu CV'nin dilleri", type: "list", span: 2, addLabel: "Dil ekle", itemTitle: "name", itemSub: "level", newItem: { name: "", level: "" }, fields: [
              { key: "name", label: "Dil", type: "text", placeholder: "Örn: İngilizce" },
              { key: "level", label: "Seviye", type: "text", placeholder: "Örn: B1 – Orta" }
            ] },
            { key: "interests", label: "Bu CV'nin ilgi alanları", type: "strings", span: 2, addLabel: "İlgi alanı ekle", placeholder: "Örn: Müzik" },
            { key: "references", label: "Bu CV'nin referansları", type: "list", span: 2, addLabel: "Referans ekle", itemTitle: "name", itemSub: "title", newItem: { name: "", title: "", contact: "" }, fields: [
              { key: "name", label: "Ad Soyad", type: "text" },
              { key: "title", label: "Unvan / kurum", type: "text" },
              { key: "contact", label: "İletişim", type: "text", span: 2 }
            ] },
            { key: "showQr", label: "Sağ alt köşeye doğrulama QR kodu koy", type: "toggle", span: 2, hint: "Kodu okutan kişi ferhatb.com/cv/dogrula sayfasında CV’nin güncel olup olmadığını ve canlı projelerini görür." },
            { key: "showPersonal", label: "Kişisel bilgileri göster", type: "toggle", span: 2, hint: "Doğum tarihi, ehliyet, askerlik durumu (aşağıda doldurduysan)." },
            { key: "hiddenExperience", label: "Hangi iş deneyimleri görünsün?", type: "pick", span: 2, source: { section: "experience", key: "items", title: "company", sub: "role" }, emptyText: "Henüz iş deneyimi eklenmemiş." },
            { key: "hiddenEducation", label: "Hangi okullar görünsün?", type: "pick", span: 2, source: { section: "education", key: "items", title: "school", sub: "department" } },
            { key: "hiddenCertificates", label: "Hangi sertifikalar görünsün?", type: "pick", span: 2, source: { section: "certificates", key: "items", title: "title", sub: "issuer" } },
            { key: "hiddenProjects", label: "Hangi projeler görünsün?", type: "pick", span: 2, source: { section: "projects", key: "items", title: "title", sub: "year" }, emptyText: "Henüz proje eklenmemiş." },
            { key: "hiddenSkills", label: "Hangi yetenekler görünsün?", type: "pick", span: 2, source: { section: "cv", key: "skills", plain: true }, emptyText: "Aşağıdaki “Yetenekler” listesine yetenek ekle." }
          ]
        }]
      },
      {
        section: "cv", title: "Kişisel bilgiler (tüm sürümlerde ortak)", desc: "Boş bıraktığın alan CV’de görünmez.",
        fields: [
          { key: "name", label: "Ad Soyad", type: "text" },
          { key: "role", label: "Genel başlık / pozisyon", type: "text", hint: "Sürümde başlık boşsa bu kullanılır." },
          { key: "summary", label: "Genel özet", type: "textarea", span: 2, rows: 4, hint: "Sürümde özet boşsa bu kullanılır." },
          { key: "photo", label: "Fotoğraf", type: "image", span: 2 },
          { key: "email", label: "E-posta", type: "email" },
          { key: "phone", label: "Telefon", type: "text" },
          { key: "location", label: "Konum", type: "text" },
          { key: "linkedin", label: "LinkedIn", type: "text" },
          { key: "github", label: "GitHub", type: "text" },
          { key: "web", label: "Web sitesi", type: "text" },
          { key: "birthDate", label: "Doğum tarihi", type: "text", placeholder: "Örn: 12.03.2002" },
          { key: "drivingLicense", label: "Ehliyet", type: "text", placeholder: "Örn: B sınıfı" },
          { key: "militaryStatus", label: "Askerlik durumu", type: "text", placeholder: "Örn: Tecilli", span: 2 }
        ]
      },
      {
        section: "cv", title: "Yetenekler", desc: "CV’deki yetenek listesi. Hangisinin hangi sürümde görüneceğini yukarıda sürümün içinden seçersin.",
        fields: [{ key: "skills", label: "", type: "strings", span: 2, addLabel: "Yetenek ekle" }]
      }
    ]
  },

  {
    slug: "snake", title: "Snake Skorları", icon: "trophy", group: "Ayarlar", snakePanel: true,
    desc: "Sitedeki Mini Snake oyununu oynayanlar ve skorları. Oyuncu oyuna başlamadan önce kullanıcı adını yazar.",
    blocks: [
      {
        section: "snake", title: "Rekor gösterimi",
        fields: [
          { key: "showRecord", label: "En yüksek skoru oyun kartında göster", type: "toggle", span: 2, hint: "Kartta “🏆 Rekor: 42 · ad” şeklinde küçük bir satır olarak görünür." },
          { key: "recordLabel", label: "Rekor yazısı", type: "text", hint: "Örn: Rekor, En iyi skor" }
        ]
      }
    ]
  },

  {
    slug: "istatistik", title: "Ziyaretçi Sayacı", icon: "eye", group: "Ayarlar", statsPanel: true,
    desc: "Sitedeki göz simgeli sayaç. Aynı kişi 30 dakika içinde sayfayı kaç kez yenilerse yenilesin tek ziyaret sayılır; botlar ve link önizlemeleri sayılmaz.",
    blocks: [
      {
        section: "counter", title: "Sayaç ayarları",
        fields: [
          { key: "enabled", label: "Sayacı sitede göster", type: "toggle", span: 2, hint: "Kapalıyken de ziyaretler sayılmaya devam eder, yalnızca sitede görünmez." },
          { key: "metric", label: "Sitede hangi sayı görünsün?", type: "choice", span: 2, options: [
            ["total", "Toplam ziyaret", "Aynı kişi farklı zamanlarda (30 dk arayla) gelirse yeniden sayılır."],
            ["unique", "Tekil ziyaretçi", "Her kişi (tarayıcı) yalnızca bir kez sayılır."],
            ["today", "Bugünkü ziyaret", "Her gece yarısı sıfırlanır."]
          ] },
          { key: "label", label: "Sayının yanındaki yazı", type: "text", hint: "Örn: görüntülenme, ziyaret, kişi baktı" },
          { key: "offset", label: "Başlangıç değeri", type: "number", hint: "Gösterilen sayıya eklenir (örn. eski sitedeki ziyaretleri eklemek için). Bugünkü ziyarete eklenmez." },
          { key: "excludeAdmin", label: "Panele giriş yaptığımda beni sayma", type: "toggle", span: 2 }
        ]
      }
    ]
  },

  {
    slug: "canli", title: "Canlı İmleçler", icon: "users", group: "Ayarlar", presencePanel: true,
    desc: "Sitede aynı anda gezen ziyaretçilerin silik “hayalet imleçleri” görünür; klavyede W tuşuna basan kişi “👋 Selam!” balonu patlatır ve diğerleri bunu görür.",
    blocks: [{
      section: "presence", title: "Ayarlar",
      fields: [
        { key: "enabled", label: "Canlı imleçleri aç", type: "toggle", span: 2, hint: "Kapatınca site hiçbir canlı bağlantı kurmaz ve imleçler görünmez." },
        { key: "wave", label: "“Selam ver” (W tuşu) açık olsun", type: "toggle", span: 2 },
        { key: "showHint", label: "Sol altta “N kişi daha sitede” rozetini göster", type: "toggle", span: 2 },
        { key: "label", label: "İmleç etiketi", type: "text", hint: "“Ziyaretçi” yazarsan imleçlerde “Ziyaretçi #2” görünür." },
        { key: "maxGhosts", label: "En fazla kaç imleç görünsün", type: "number", hint: "1–20 arası. Çok kalabalıkta ekran karışmasın diye." }
      ]
    }]
  },

  {
    slug: "ayarlar", title: "Site Ayarları", icon: "gear", group: "Ayarlar",
    desc: "Varsayılan tema, Discord/Lanyard bağlantısı, bölüm başlıkları ve paylaşım (SEO) bilgileri.",
    blocks: [
      {
        section: "settings", title: "Yönetim paneli demosu", desc: "Ziyaretçiler Google hesabı olmadan örnek verilerle paneli gezebilir; gerçek verileri değiştiremez.",
        fields: [{ key: "adminDemoEnabled", label: "Demo girişini etkinleştir", type: "toggle", default: false, span: 2, hint: "Kaydettikten sonra giriş sayfasında demo düğmesi görünür." }]
      },
      {
        section: "settings", title: "Konsol sürprizleri", desc: "F4 konsoluna yazılan kelimeyle ekranın kenarlarından seçtiğin emoji fırlar. Tetikleyici kelimeler herkese açık site verisidir; şifre olarak kullanma.",
        fields: [{ key: "consoleEffects", type: "list", span: 2, addLabel: "Sürpriz ekle", itemTitle: "trigger", itemSub: "emoji", canDisable: true,
          newItem: { trigger: "", emoji: "💧", enabled: true }, fields: [
            { key: "trigger", label: "Konsola yazılacak kelime", type: "text", hint: "Örn: deniz. Büyük/küçük harf fark etmez; admin kelimesi yönetim paneli için ayrılmıştır." },
            { key: "emoji", label: "Fırlatılacak emoji", type: "text", hint: "Örn: 💧, 🔥 veya 🌊" },
            { key: "enabled", label: "Sürprizi etkinleştir", type: "toggle", default: true }
          ] }]
      },
      {
        section: "settings", title: "Varsayılan tema", desc: "Siteye ilk kez giren ziyaretçinin göreceği tema. Ziyaretçi düğmeyle değiştirirse onun tercihi hatırlanır.",
        fields: [{ key: "defaultTheme", label: "", type: "theme", span: 2 }]
      },
      {
        section: "settings", title: "Discord & Lanyard", desc: "Spotify / Discord durum kartı bu hesaba göre çalışır.",
        fields: [
          { key: "discordId", label: "Discord kullanıcı ID", type: "text", pattern: "\\d{15,21}", hint: "Discord > Ayarlar > Gelişmiş > Geliştirici Modu'nu aç, profiline sağ tıkla > “Kullanıcı ID'sini kopyala”. Lanyard'ın çalışması için discord.gg/lanyard sunucusunda olman gerekir." },
          { key: "discordUsername", label: "Discord kullanıcı adı", type: "text", hint: "Discord simgesine tıklayınca kopyalanan ad." },
          { key: "spotifyFallbackArt", label: "Müzik çalmıyorken görünen kapak", type: "image", span: 2 }
        ]
      },
      {
        section: "sections", title: "Bölümleri göster / gizle", desc: "Bir bölümü tamamen gizleyebilirsin (içindeki kayıtlar silinmez). Gizlenen bölüm menüden de kalkar.",
        fields: [
          { key: "about.enabled", label: "Hakkımda bölümü", type: "toggle", default: true },
          { key: "education.enabled", label: "Eğitim bölümü (tamamı)", type: "toggle", default: true },
          { key: "education.showSchools", label: "Eğitim bölümünde okulları göster", type: "toggle", default: true, hint: "Kapatırsan okul kartları gizlenir, sertifikalar durur." },
          { key: "education.showCertificates", label: "Eğitim bölümünde sertifikaları göster", type: "toggle", default: true, hint: "Kapatırsan sertifika kartları gizlenir, okullar durur. İkisini de kapatırsan bölüm menüyle birlikte kalkar." },
          { key: "experience.enabled", label: "Çalışma Hayatı bölümü", type: "toggle", default: true },
          { key: "projects.enabled", label: "Projeler bölümü", type: "toggle", default: true }
        ]
      },
      {
        section: "sections", title: "Bölüm başlıkları", desc: "Üstteki küçük yazı, büyük başlık ve menüdeki kısa ad.",
        fields: [
          { key: "about.kicker", label: "Hakkımda • üst yazı", type: "text" },
          { key: "about.title", label: "Hakkımda • başlık", type: "text" },
          { key: "about.nav", label: "Hakkımda • menü adı", type: "text" },
          { key: "education.kicker", label: "Eğitim • üst yazı", type: "text" },
          { key: "education.title", label: "Eğitim • başlık", type: "text" },
          { key: "education.nav", label: "Eğitim • menü adı", type: "text" },
          { key: "experience.kicker", label: "Deneyim • üst yazı", type: "text" },
          { key: "experience.title", label: "Deneyim • başlık", type: "text" },
          { key: "experience.nav", label: "Deneyim • menü adı", type: "text" },
          { key: "projects.kicker", label: "Projeler • üst yazı", type: "text" },
          { key: "projects.title", label: "Projeler • başlık", type: "text" },
          { key: "projects.nav", label: "Projeler • menü adı", type: "text" }
        ]
      },
      {
        section: "settings", title: "Arama motorları & paylaşım önizlemesi", desc: "Google sonuçlarında ve Discord/WhatsApp'ta link paylaşınca görünen bilgiler.",
        fields: [
          { key: "seoTitle", label: "Sayfa başlığı", type: "text", span: 2 },
          { key: "seoDescription", label: "Google açıklaması", type: "textarea", span: 2, rows: 2, hint: "150–160 karakter idealdir." },
          { key: "shareDescription", label: "Paylaşım açıklaması", type: "text", span: 2 },
          { key: "ogImage", label: "Paylaşım görseli (1200×630)", type: "image", span: 2 },
          { key: "favicon", label: "Site simgesi (favicon)", type: "image", span: 2, hint: "Tarayıcı sekmesinde görünen küçük simge. Kare bir görsel iyi olur." },
          { key: "siteName", label: "Site adı", type: "text" },
          { key: "siteUrl", label: "Site adresi", type: "url", hint: "Sonunda / olmadan. Örn: https://ferhatb.com" },
          { key: "twitter", label: "X kullanıcı adı", type: "text" },
          { key: "jobTitle", label: "Meslek (Google için)", type: "text" },
          { key: "city", label: "Şehir (Google için)", type: "text" }
        ]
      }
    ]
  },

  {
    slug: "yoneticiler", title: "Yöneticiler", icon: "shield", type: "admins", group: "Sistem", founderOnly: true,
    desc: "Google hesabıyla panele giriş yapmasına izin verilen yöneticileri kontrol et."
  }
];
