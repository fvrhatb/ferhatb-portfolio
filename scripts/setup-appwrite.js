// Appwrite'ta veritabanını, tabloyu ve "data" sütununu oluşturur (TablesDB API); mevcut içeriği (varsa data/content.json, yoksa varsayılanlar) yükler.
// Kullanım: npm run setup:appwrite   (birden çok kez çalıştırmak güvenlidir; var olanı atlar, içeriğin üzerine yazmaz)
const fs = require("fs");
const path = require("path");
const config = require("../server/env");
const store = require("../server/store");

const aw = config.appwrite;
const missing = ["endpoint", "projectId", "apiKey"].filter((k) => !aw[k]);
if (missing.length) {
  console.error(`\n[!] .env içinde eksik: ${missing.map((k) => ({ endpoint: "APPWRITE_ENDPOINT", projectId: "APPWRITE_PROJECT_ID", apiKey: "APPWRITE_API_KEY" })[k]).join(", ")}\n`);
  process.exit(1);
}

const call = store.appwrite;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensure(label, getRoute, create) {
  try {
    await call("GET", getRoute);
    console.log(`  ✓ ${label} zaten var`);
  } catch (err) {
    if (err.status !== 404) throw err;
    await create();
    console.log(`  + ${label} oluşturuldu`);
  }
}

(async () => {
  console.log(`\nAppwrite: ${aw.endpoint}  •  proje: ${aw.projectId}\n`);
  const db = `/tablesdb/${aw.databaseId}`;
  const col = `${db}/tables/${aw.collectionId}`;

  await ensure(`Veritabanı "${aw.databaseId}"`, db, () =>
    call("POST", "/tablesdb", { databaseId: aw.databaseId, name: "ferhatb.com" }));

  await ensure(`Tablo "${aw.collectionId}"`, col, () =>
    call("POST", `${db}/tables`, { tableId: aw.collectionId, name: "Site içeriği", permissions: [], rowSecurity: false }));

  await ensure('Sütun "data"', `${col}/columns/data`, () =>
    call("POST", `${col}/columns/string`, { key: "data", size: 1000000, required: true }));

  // Alan hazır olana kadar bekle
  for (let i = 0; i < 30; i++) {
    const attr = await call("GET", `${col}/columns/data`);
    if (attr.status === "available") break;
    if (attr.status === "failed") throw new Error('"data" sütunu oluşturulamadı (Appwrite konsolundan kontrol et).');
    await sleep(1000);
  }

  // İçeriği yükle (Appwrite'ta zaten olan belgelere dokunma)
  const existing = new Set(((await call("GET", `${col}/rows`)).rows || []).map((d) => d.$id));
  const snapshotFile = path.join(__dirname, "..", "data", "content.json");
  const local = fs.existsSync(snapshotFile) ? JSON.parse(fs.readFileSync(snapshotFile, "utf8")) : {};
  for (const section of store.SECTIONS) {
    if (existing.has(section)) { console.log(`  ✓ "${section}" satırı zaten var`); continue; }
    const value = local[section] || store.defaults[section];
    await call("POST", `${col}/rows`, { rowId: section, data: { data: JSON.stringify(value) }, permissions: [] });
    console.log(`  + "${section}" yüklendi`);
  }
  console.log("\nHazır. Sunucuyu yeniden başlat: npm run dev\n");
})().catch((err) => {
  console.error(`\n[!] ${err.message}`);
  if (err.status === 401) console.error("    API anahtarının yetkilerini (scopes) ve Project ID'yi kontrol et.");
  process.exit(1);
});
