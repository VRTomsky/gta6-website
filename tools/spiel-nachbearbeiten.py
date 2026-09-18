# ═══════════════════════════════════════════════════════════
#  Sprites nachbearbeiten
#
#  Die Fahrzeuge kommen aus Blender ohne Kontur und mit viel Luft
#  ringsum. Hier bekommen sie eine dunkle Umrandung (damit sie sich vom
#  Asphalt abheben) und werden mittig auf ihre tatsächliche Größe
#  beschnitten — das spart die Hälfte der Dateigröße, ohne dass sich der
#  Mittelpunkt verschiebt.
#
#  Aufruf:  python tools/spiel-nachbearbeiten.py --ordner assets/img/spiel
# ═══════════════════════════════════════════════════════════

import argparse
import os
from PIL import Image, ImageFilter, ImageChops


def kontur(bild, staerke=1, farbe=(12, 14, 24, 235)):
    a = bild.split()[3]
    dick = a.filter(ImageFilter.MaxFilter(staerke * 2 + 1))
    rand = ImageChops.subtract(dick, a)
    umriss = Image.new("RGBA", bild.size, farbe)
    umriss.putalpha(rand)
    aus = Image.new("RGBA", bild.size, (0, 0, 0, 0))
    aus.alpha_composite(umriss)
    aus.alpha_composite(bild)
    return aus


def mittig_beschneiden(bild, rand=2):
    """Beschneidet symmetrisch zur Bildmitte — der Mittelpunkt des Sprites
       bleibt dadurch der Mittelpunkt des Bildes, was die Drehung im Spiel
       einfach hält."""
    kasten = bild.getbbox()
    if not kasten:
        return bild
    mx, my = bild.width / 2, bild.height / 2
    dx = max(abs(kasten[0] - mx), abs(kasten[2] - mx)) + rand
    dy = max(abs(kasten[1] - my), abs(kasten[3] - my)) + rand
    return bild.crop((int(mx - dx), int(my - dy), int(mx + dx), int(my + dy)))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ordner", default="assets/img/spiel")
    a = p.parse_args()

    for name in sorted(os.listdir(a.ordner)):
        if not name.endswith(".png"):
            continue
        pfad = os.path.join(a.ordner, name)
        bild = Image.open(pfad).convert("RGBA")
        if name.startswith("auto_"):
            bild = kontur(bild)
        bild = mittig_beschneiden(bild)
        bild.save(pfad, optimize=True)
        print(f"{name}: {bild.width}×{bild.height}")


if __name__ == "__main__":
    main()
