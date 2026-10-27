#!/usr/bin/env python3
"""
KaRAKuLE — görsel optimizasyonu

assets/work/ altındaki JPG/PNG dosyalarını WebP'ye çevirir ve
js/dims.js içine genişlik/yükseklik haritası yazar (CLS önlemi).

Kullanım:
    py scripts/optimize-images.py            # sadece eksikleri üretir
    py scripts/optimize-images.py --force    # hepsini yeniden üretir

Yeni bir proje görseli ekledikten sonra bir kez çalıştırman yeterli.
WebP dosyası yoksa site JPG'ye düşmez; data.js'deki yolu .webp yapmayı unutma.
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow bulunamadı: py -m pip install --user pillow")

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "assets" / "work"
DIMS_OUT = ROOT / "js" / "dims.js"

MAX_SIDE = 1800      # en uzun kenar (px)
QUALITY = 82
SOURCES = {".jpg", ".jpeg", ".png"}


def convert(src: Path, force: bool) -> tuple[str, int, int] | None:
    dest = src.with_suffix(".webp")
    with Image.open(src) as im:
        im.load()
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        w, h = im.size

        if dest.exists() and not force and dest.stat().st_mtime >= src.stat().st_mtime:
            return rel(dest), w, h

        scale = min(1.0, MAX_SIDE / max(w, h))
        if scale < 1.0:
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
            w, h = im.size

        im.save(dest, "WEBP", quality=QUALITY, method=6)
        return rel(dest), w, h


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="mevcut WebP dosyalarını da yeniden üret")
    args = ap.parse_args()

    if not WORK.is_dir():
        sys.exit(f"Klasör yok: {WORK}")

    sources = sorted(p for p in WORK.rglob("*") if p.suffix.lower() in SOURCES)
    if not sources:
        sys.exit("Dönüştürülecek görsel bulunamadı.")

    before = 0
    after = 0
    dims: dict[str, tuple[int, int]] = {}

    for src in sources:
        before += src.stat().st_size
        result = convert(src, args.force)
        if result is None:
            continue
        key, w, h = result
        dims[key] = (w, h)
        after += (ROOT / key).stat().st_size
        print(f"{key}  {w}x{h}")

    lines = [
        "/* Otomatik üretildi: py scripts/optimize-images.py — elle düzenleme. */",
        "window.KRKL_DIMS = {",
    ]
    for key in sorted(dims):
        w, h = dims[key]
        lines.append(f'  "{key}": [{w}, {h}],')
    lines.append("};")
    lines.append("")
    DIMS_OUT.write_text("\n".join(lines), encoding="utf-8")

    if before:
        print(
            f"\n{len(sources)} görsel · {before / 1048576:.1f} MB → {after / 1048576:.1f} MB "
            f"(%{100 * after / before:.0f}) · {rel(DIMS_OUT)} yazıldı"
        )


if __name__ == "__main__":
    main()
