"""PNG-Sprites des Spiels in WebP umwandeln.

Die Sprites zusammen waren als PNG rund 8 MB — beim Aufruf der Spielseite
lädt der Browser alle. Als WebP sind es etwa 4 MB bei gleichem Aussehen
(verlustbehaftet, Qualität 92, Transparenz bleibt erhalten).

`bilder.js` lädt ausschließlich `.webp`. Also: nach jedem Lauf von
spiel-bogen.py, spiel-figuren.py oder spiel-sprites.py dieses Werkzeug
hinterherschicken, sonst fehlen die neuen Bilder im Spiel.

    python tools/spiel-webp.py --ordner assets/img/spiel
"""
import argparse
import glob
import os

from PIL import Image

GUETE = 92


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ordner", default="assets/img/spiel")
    p.add_argument("--behalten", action="store_true",
                   help="die PNG-Dateien nicht löschen")
    a = p.parse_args()

    alt = neu = 0
    dateien = sorted(glob.glob(os.path.join(a.ordner, "*.png")))
    for pfad in dateien:
        ziel = pfad[:-4] + ".webp"
        Image.open(pfad).convert("RGBA").save(ziel, quality=GUETE, method=6, exact=True)
        alt += os.path.getsize(pfad)
        neu += os.path.getsize(ziel)
        if not a.behalten:
            os.remove(pfad)
    print(f"{len(dateien)} Dateien: {alt / 1e6:.2f} MB -> {neu / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
