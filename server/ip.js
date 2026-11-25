// Ziyaretçinin gerçek IP adresi.
// cPanel'de uygulama Apache + Passenger arkasında çalışır: bağlantı ya yerel makineden ya da bir unix soketinden gelir,
// gerçek adres X-Forwarded-For başlığındadır. Doğrudan (proxy'siz) bağlantılarda ise soket adresi kullanılır.
// Başlık yalnızca bağlantı yerel bir proxy'den geldiyse dikkate alınır; dışarıdan gelen sahte başlığa güvenilmez.
function isLocal(addr) {
  if (!addr) return true; // unix soketi: adres yok
  return /^(::1|127\.|::ffff:127\.)/.test(addr);
}

function clientIp(req) {
  const sock = req.socket && req.socket.remoteAddress;
  if (isLocal(sock)) {
    const xff = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (xff) return xff;
    const real = String(req.headers["x-real-ip"] || "").trim();
    if (real) return real;
  }
  return sock || ""; // boş dönerse çağıran taraf IP kontrolünü atlar
}

module.exports = { clientIp };
