module.exports = {
  id: "ferhatb-portfolio", enabled: true, title: "ferhatb.com · Kişisel Portföy", year: "2026", status: "Aktif", featured: false,
  desc: "Kişisel portföy, çok sürümlü CV ve özel yönetim panelini bir araya getiren dinamik web uygulaması.",
  image: "/assets/images/ferhatb-portfolio.png", link: "https://ferhatb.com", tech: ["Node.js", "Express", "JavaScript", "Appwrite", "Responsive"],
  detailIntro: "Kendimi, deneyimlerimi ve projelerimi tek bir yerde paylaşırken içeriği kod değiştirmeden yönetebilmek için geliştirilen kişisel web platformu.",
  detailWork: "Duyarlı portföy arayüzü, birden fazla özelleştirilebilir CV, QR ile CV doğrulama ve içerik yönetim paneli bir arada tasarlandı. Google ile yönetici girişi, ziyaretçilere ayrılabilen salt okunur demo, canlı Discord ve Spotify durumu ile etkileşimli küçük özellikler eklendi.",
  detailTools: "Sunucu tarafında Node.js ve Express; içerik ve medya için Appwrite; arayüzde JavaScript, HTML ve CSS kullanıldı. Lanyard ve Spotify entegrasyonları canlı durum kartını besliyor.",
  detailSections: [
    { title: "Başvuruya özel CV sürümleri", text: "Tek bir CV ile sınırlı kalmak yerine farklı başvurular için ayrı sürümler hazırlanabiliyor. Her sürümün başlığı, özeti, dili, rengi ve şablonu seçilebiliyor; deneyim, eğitim, sertifika, proje ve yeteneklerin hangilerinin görüneceği ayrı ayrı belirlenebiliyor. Diller, ilgi alanları ve referanslar da sürüme göre düzenlenebiliyor." },
    { title: "Doğrulama kodu ve QR", text: "CV'ye eklenen doğrulama kodu ve QR sayesinde belgeyi alan kişi doğrulama sayfasını açabiliyor. Sistem, kodun bilinen bir CV'ye ait olup olmadığını ve o sürümün içeriğinin sonradan değişip değişmediğini kontrol ederek güncel veya güncelliğini yitirmiş durumunu gösteriyor." },
    { title: "Önizleme ve PDF", text: "CV sürümleri kendi adreslerinde önizlenebiliyor; yazdırma ekranından PDF olarak kaydedilebiliyor. Yönetim paneli kaydedilmemiş değişiklikleri taslak olarak önizlemeyi, aktif CV'yi seçmeyi ve istenirse hazır PDF kullanmayı da destekliyor." },
    { title: "Yönetim paneli ve güvenli demo", text: "Profil, eğitim, deneyim, projeler, CV ve site ayarları panelden yönetiliyor. Yönetici erişimi Google ile giriş ve yetkili hesap listesiyle sınırlandırılıyor. Ziyaretçiler için açılıp kapatılabilen demo, örnek verileri salt okunur sunuyor." },
    { title: "Canlı durum ve etkileşim", text: "Discord üzerinden çevrimiçi durum ve etkinlikler Lanyard ile gösteriliyor. Discord çevrimdışıysa yapılandırılmış Spotify bağlantısı çalan parçayı sunabiliyor. Canlı ziyaretçi imleçleri, selamlaşma, komut menüsü ve Snake oyunu portföye etkileşim katıyor." }
  ],
  gallery: [{ url: "/assets/images/ferhatb-portfolio.png", caption: "Portföyün ana sayfası" }, { url: "/assets/images/ferhatb-panel-demo.png", caption: "Yönetim paneli demo görünümü" }, { url: "/assets/images/ferhatb-cv-panel.png", caption: "Yönetim panelinde CV sürümlerinin ayarları" }, { url: "/assets/images/ferhatb-cv-preview.png", caption: "CV sürümleri, önizleme ve PDF oluşturma" }, { url: "/assets/images/ferhatb-cv-verify.png", caption: "CV doğrulama kodu sorgulama sayfası" }, { url: "/assets/images/ferhatb-panel-giris.png", caption: "Yönetim paneli giriş ekranı" }],
  demoPanel: true
};
