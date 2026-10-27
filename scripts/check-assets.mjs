#!/usr/bin/env node
/**
 * KaRAKuLE — varlık kontrolü
 *
 * js/data.js ve html dosyalarındaki yerel dosya referanslarının var olduğunu,
 * görsel yollarının optimize edilmiş .webp dosyalarını gösterdiğini ve
 * js/dims.js içinde ölçü kaydı bulunduğunu denetler.
 *
 * Kullanım: node scripts/check-assets.mjs
 */

import { readFile, access } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const errors = [];
const warnings = [];

const read = p => readFile(path.join(ROOT, p), "utf8");
const exists = p => access(path.join(ROOT, p)).then(() => true, () => false);
const uniq = arr => [...new Set(arr)];

async function checkData() {
  const source = await read("js/data.js");
  const refs = uniq([...source.matchAll(/"((?:assets|\/)[^"]+\.(?:webp|jpg|jpeg|png|svg))"/g)].map(m => m[1].replace(/^\//, "")));

  if (!refs.length) {
    errors.push("js/data.js içinde hiç görsel referansı bulunamadı.");
    return;
  }

  for (const ref of refs) {
    if (!(await exists(ref))) errors.push(`Eksik dosya: ${ref}`);
    if (/^assets\/work\/.+\.(jpg|jpeg|png)$/i.test(ref)) {
      errors.push(`Optimize edilmemiş görsel: ${ref} — py scripts/optimize-images.py çalıştır.`);
    }
  }

  const dimsSource = await read("js/dims.js").catch(() => "");
  for (const ref of refs) {
    if (!/\.webp$/i.test(ref)) continue;
    if (!dimsSource.includes(`"${ref}"`)) {
      warnings.push(`Ölçü kaydı yok (CLS): ${ref}`);
    }
  }

  console.log(`data.js: ${refs.length} görsel referansı doğrulandı.`);
}

async function checkHtml(file) {
  const source = await read(file);
  const refs = uniq([...source.matchAll(/(?:src|href)="((?!https?:|mailto:|tel:|#)[^"]+\.(?:css|js|svg|png|webp|jpg))"/g)].map(m => m[1]));

  for (const ref of refs) {
    if (!(await exists(ref))) errors.push(`${file} → eksik dosya: ${ref}`);
  }
  console.log(`${file}: ${refs.length} yerel referans doğrulandı.`);
}

try {
  await checkData();
  await checkHtml("index.html");
  await checkHtml("404.html");
} catch (err) {
  errors.push(`Kontrol çalıştırılamadı: ${err.message}`);
}

for (const w of warnings) console.warn(`uyarı: ${w}`);
for (const e of errors) console.error(`hata: ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} hata bulundu.`);
  process.exit(1);
}

console.log(`\nSorun yok${warnings.length ? ` (${warnings.length} uyarı)` : ""}.`);
