# ferhatb.com — Kurulum Rehberi

Site artık bir **Node.js (Express)** uygulaması. Sitedeki tüm yazılar, deneyimler, eğitimler, sertifikalar, projeler, CV, varsayılan tema ve Discord ID **/admin** adresindeki yönetim panelinden düzenlenir. Veriler **Appwrite**'ta tutulur. Appwrite bağlanana kadar `data/content.json` dosyası kullanılır.

## Klasör yapısı

```
app.js               → sunucunun başlangıç dosyası (cPanel bunu çalıştırır)
package.json         → bağımlılıklar ve komutlar
.env                 → GİZLİ ayarlar (şifre özeti, Appwrite anahtarı) — kimseyle paylaşma
.env.example         → .env'nin boş örneği
server/              → sunucu kodu (giriş, veri deposu, sayfa üretimi)
server/defaults.json → ilk kurulumdaki içerik ("Varsayılana döndür" buraya döner)
server/views/index.html → sitenin şablonu ({{...}} alanları panelden dolar)
public/              → herkese açık dosyalar (css, js, görseller, hata sayfaları, panel)
public/admin/        → yönetim paneli arayüzü
public/uploads/      → panelden yüklediğin görseller ve PDF'ler
scripts/             → yardımcı komutlar (Appwrite kurulumu, şifre değiştirme)
data/content.json    → verilerin yerel kopyası / yedeği
deploy/              → cPanel için yardımcı dosyalar
```

---

## 1) Bilgisayarında çalıştırma (localhost)

Bunu bir kez yapman yeterli. Sonrasında her seferinde yalnızca 3. adımı tekrarlarsın.

1. **Node.js kur:** https://nodejs.org adresinden **LTS** sürümünü indir ve kur. Kontrol için terminalde şunu çalıştır:
   ```
   node -v
   ```
2. **Bağımlılıkları kur:** VS Code'da proje klasörünü aç. `Terminal > New Terminal` menüsünden bir terminal aç ve şunu çalıştır:
   ```
   npm install
   ```
3. **Sunucuyu başlat:**
   ```
   npm run dev
   ```
   Terminalde şunu görürsün:
   ```
   ferhatb.com çalışıyor → http://localhost:3000
   Yönetim paneli       → http://localhost:3000/admin
   ```
4. Tarayıcıda **http://localhost:3000** siteyi, **http://localhost:3000/admin** paneli açar. Panelde **Google ile giriş yap** düğmesini kullan.
5. Durdurmak için terminalde **Ctrl + C** tuşlarına bas.

`npm run dev` modunda kod dosyalarını değiştirince sunucu kendini yeniden başlatır. Paneldeki değişiklikler için yeniden başlatmaya gerek yoktur; "Kaydet"e basınca anında yansır.

> Artık `index.html` dosyasını çift tıklayarak açma. Site yalnızca `npm run dev` ile, `localhost:3000` üzerinden doğru çalışır.

---

## 2) Appwrite'ı bağlama

1. https://cloud.appwrite.io adresinde projeni aç.
2. **Project ID** ve **API Endpoint** değerlerini al. İkisi de projenin **Overview** sayfasında ya da **Settings** altında yazar. Endpoint şuna benzer: `https://fra.cloud.appwrite.io/v1`.
3. **API anahtarının yetkilerini kontrol et.** `Overview > Integrations > API Keys` sayfasında anahtarına şu yetkileri ver: `databases.read`, `databases.write`, `tables.read`, `tables.write`, `columns.read`, `columns.write`, `rows.read`, `rows.write`, `buckets.read`, `buckets.write`, `files.read`, `files.write`. Site, Appwrite'ın yeni **TablesDB** API'sini ve görseller için **Storage**'ı kullanır.
4. Proje klasöründeki `.env` dosyasını aç ve şu iki satırı doldur:
   ```
   APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=buraya-project-id
   ```
5. Veritabanını otomatik oluştur ve mevcut içeriği yükle:
   ```
   npm run setup:appwrite
   ```
   Bu komut `ferbcv` adında bir veritabanı ve `content` adında bir tablo oluşturur, içeriğini de oraya yükler. Birden çok kez çalıştırmak güvenlidir; var olan veriye dokunmaz.
6. Sunucuyu yeniden başlat (`Ctrl + C`, ardından `npm run dev`). Panelin "Genel Bakış" sayfasında **"Appwrite bağlı"** yazmalı.

7. **Görselleri Appwrite'a taşı** (yalnızca bir kez, sabit dosyalarda kalan logo/fotoğrafları veritabanına alır):
   ```
   npm run migrate:media            # önce ne yapacağını gösterir
   npm run migrate:media -- --yes   # uygular
   ```
   Panelden yüklenen her yeni görsel zaten doğrudan Appwrite Storage'daki `ferbmedia` kovasına gider ve sitede `/media/...` adresinden görünür.

Appwrite geçici olarak erişilemez olursa site kapanmaz. Sunucu, son başarılı veriyi (`data/content.json`) kullanarak açılmaya devam eder.

---

## 3) cPanel'e yükleme (sıfırdan)

Hazır paket: `deploy/ferhatb-cpanel.zip`. İçinde `.env` (şifreler dahil) olduğu için kimseyle paylaşma.

1. **Eski kurulumu temizle.** cPanel > **Setup Node.js App** sayfasında eski uygulama varsa **Delete** (ya da **Stop**) et. File Manager'da ana dizindeki eski `ferhatb` klasörünü sil. `public_html` içinden `.well-known`, `cgi-bin` ve `.htaccess` **dışındaki** her şeyi sil (eski statik site).
2. **Yükle.** File Manager'da ana dizinde (`public_html`'in **dışında**) `ferhatb` adında yeni bir klasör aç. `ferhatb-cpanel.zip` dosyasını oraya yükle, **Extract** et, ZIP'i sil. Sonuç `/home/KULLANICI/ferhatb/app.js` olmalı (alt klasörde değil).
3. **Node.js uygulamasını oluştur.** **Setup Node.js App** > **Create Application**:
   - **Node.js version:** listedeki en yeni sürüm (en az 18)
   - **Application mode:** Production
   - **Application root:** `ferhatb`
   - **Application URL:** `ferhatb.com`
   - **Application startup file:** `app.js`

   **Create**'e bas. Sonra **Environment variables** bölümüne `NODE_ENV` = `production` ekle.
4. **Bağımlılıkları kur.** **Run NPM Install**, ardından **Restart**.
5. **HTTPS yönlendirmesi.** `deploy/public_html.htaccess` içindeki bloğu `public_html/.htaccess` dosyasının **en üstüne** yapıştır (Passenger satırlarına dokunma). **SSL/TLS Status** sayfasında alan adının SSL'i aktif olmalı; değilse **Run AutoSSL**.
6. **Kontrol et.** https://ferhatb.com ve https://ferhatb.com/admin. Panelde "Genel Bakış" sayfasında **"Appwrite bağlı"** yazmalı.

Veriler ve görseller Appwrite'ta olduğu için sıfırdan kurulumda içerik kaybolmaz; yeni sunucu aynı veritabanına bağlanır. `npm run setup:appwrite` ya da `migrate:media` tekrar çalıştırmak gerekmez.

**Güncelleme yaparken:** Değişen dosyaları File Manager ile üzerine yükle ve **Restart** de. İçerik değişiklikleri için bunu yapmana gerek yok, onları panelden yaparsın. Görseller artık sunucuda değil Appwrite'ta durduğu için dosya yüklerken görsel klasörlerini korumana da gerek yok.

---

## Sık kullanılan işler

**Panel yöneticilerini değiştirmek:** Kurucu Google hesabıyla giriş yap, ardından Panel > Yöneticiler sayfasından izin verilen e-posta adreslerini ekle veya kaldır.

**Yedek almak:** Panel > Genel Bakış > **Yedek indir** düğmesi tüm içeriği tek bir JSON dosyası olarak indirir.

**Panele yeni bir alan eklemek:** `public/admin/pages.js` dosyasında ilgili sayfanın `fields` listesine bir satır ekle. Sonra o alanı `server/views/index.html` içinde `{{bolum.alan}}` olarak, ya da `public/js/main.js` içinde `profileData` üzerinden kullan.

---

## Spotify fallback kurulumu

1. Spotify Developer Dashboard'daki uygulamanın Redirect URI alanına `https://ferhatb.com/api/spotify/callback` ekle.
2. Sunucu `.env` dosyasında `SPOTIFY_CLIENT_SECRET` değerini doldur. `SPOTIFY_CLIENT_ID` ve `SPOTIFY_REDIRECT_URI` değerlerinin `.env.example` ile aynı olduğunu doğrula.
3. Uygulamayı yeniden başlat, yönetici panelinde oturum aç ve bir kez `https://ferhatb.com/api/spotify/login` adresini ziyaret et.

Yetkilendirmeden sonra refresh token `data/spotify-tokens.json` içinde yalnızca sunucu tarafında saklanır. Bu dosya `.gitignore` kapsamındaki `data/` klasöründe kalır; silinirse tek seferlik yetkilendirme tekrarlanmalıdır.

---

## Google yönetici girişi

Google Cloud Console'daki Web application OAuth istemcisine şu callback adreslerini ekle:

- `https://ferhatb.com/api/auth/google/callback`
- `http://localhost:3000/api/auth/google/callback`

Panelde parola girişi yoktur. `GOOGLE_FOUNDER_EMAIL` kurucu hesaptır ve kaldırılamaz. Kurucu giriş yaptıktan sonra **Yöneticiler** sayfasından başka Google hesaplarına erişim verebilir veya erişimlerini kaldırabilir.
