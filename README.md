# KaRAKuLE — Hüsnü Atik

> Kuleden bakan görür.

Hüsnü Atik'in kişisel tasarım atölyesi **KaRAKuLE** için portfolyo sitesi. Kurulum ya da build adımı yok: düz HTML, CSS ve JavaScript. GitHub Pages'te doğrudan çalışır.

## Klasör yapısı

```
index.html              Tek sayfa site
404.html                Bulunamadı sayfası (EN/TR)
css/style.css           Tüm stiller (renk ve font değişkenleri en üstte)
js/data.js              PROJELER — içeriği buradan düzenle
js/main.js              Etkileşimler
js/dims.js              Görsel ölçüleri (otomatik üretilir, elle düzenlemeyin)
assets/                 Logo ve favicon (SVG)
assets/work/            Proje görselleri (.webp + kaynak .jpg)
sitemap.xml             Arama motoru site haritası
robots.txt              Tarama kuralları
scripts/                Yardımcı scriptler (görsel optimizasyonu, kontrol)
.github/workflows/      Otomatik varlık kontrolü
BRAND.md                Kimlik kılavuzu
```

## Yayın adresi (yayından önce ayarla)

Sitedeki mutlak adresler tek bir alan adına göre yazılıdır. Kendi adresin farklıysa şu üç yerde değiştir:

| Dosya | Ne var |
|---|---|
| `index.html` | `canonical`, `hreflang`, `og:url`, `og:image`, `twitter:image`, JSON-LD |
| `sitemap.xml` | `<loc>` ve `hreflang` bağlantıları |
| `robots.txt` | `Sitemap:` satırı |

Üçü de aynı adresi göstermeli. Depoda `CNAME` dosyası yoksa GitHub Pages adresi `https://KULLANICIADI.github.io/DEPO-ADI/` biçimindedir; bu durumda yol sonundaki `/` dahil tüm adresleri buna göre yaz.

## GitHub Pages'te yayınlama

1. GitHub'da yeni bir depo aç.
   - Adresin `https://KULLANICIADI.github.io` olsun istiyorsan depo adını tam olarak `KULLANICIADI.github.io` koy.
   - Başka bir ad (ör. `karakule`) verirsen adres `https://KULLANICIADI.github.io/karakule/` olur.
2. Bu klasörde:
   ```bash
   git remote add origin https://github.com/KULLANICIADI/DEPO-ADI.git
   git push -u origin main
   ```
3. Depoda **Settings → Pages → Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** / **(root)** → Save
4. 1-2 dakika sonra site yayında.

**Kendi alan adın varsa** (ör. `karakule.studio`): Settings → Pages → Custom domain alanına yaz, DNS'te `CNAME` kaydını `KULLANICIADI.github.io` adresine yönlendir.

## İçeriği düzenleme

| Ne | Nerede |
|---|---|
| Projeler (başlık, müşteri, yıl, açıklama, görsel) | `js/data.js` |
| Proje görseli | `assets/work/` klasörüne koy, projeye `image: "assets/work/dosya.webp"` ekle |
| E-posta, telefon, sosyal bağlantılar | `index.html` → `#iletisim` bölümü |
| Hakkında metni, sayılar (15+ yıl vb.) | `index.html` → `#hakkinda` bölümü |
| Renkler, fontlar | `css/style.css` → `:root` |

> [!IMPORTANT]
> Hakkında bölümündeki sayılar (yıl, proje, marka) sitede yazan iddialardır; yayından önce güncel tut. Arşivdeki projeler Behance'teki 2014–2019 seçkisidir, daha yeni işler eklendikçe bu aralık değişir.

Görsel önerisi: 4:5 oranında (ör. 1200×1500), JPG/WebP, 300 KB altı.

## Görselleri optimize etme

Yeni görseller ekledikten sonra bir kez çalıştır:

```bash
py scripts/optimize-images.py      # sadece eksikleri üretir
py scripts/optimize-images.py --force
```

Script her JPG/PNG için aynı adlı bir `.webp` üretir (en uzun kenar 1800 px, kalite 82) ve `js/dims.js` içine genişlik/yükseklik haritasını yazar. `data.js` içindeki yolun `.webp` olduğundan emin ol; kaynak JPG'ler yedek olarak kalabilir, sayfada kullanılmaz.

Gereksinim: Pillow (`py -m pip install --user pillow`).

## Kontroller

```bash
node scripts/check-assets.mjs
```

`data.js` ve HTML dosyalarındaki yerel referansların var olduğunu, görsel yollarının `.webp` olduğunu ve `dims.js` kapsamını denetler. Aynı kontrol her push ve pull request'te GitHub Actions ile çalışır.

## Dil

Varsayılan dil İngilizce. Ziyaretçinin seçimi `localStorage` içinde saklanır; `?lang=tr` veya `?lang=en` bağlantı parametresi de çalışır.

## Yerelde bakmak

`index.html` dosyasını tarayıcıda açman yeterli. Ya da:

```bash
python -m http.server 8000
```
→ http://localhost:8000
