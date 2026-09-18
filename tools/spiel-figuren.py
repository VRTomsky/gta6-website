# ═══════════════════════════════════════════════════════════
#  Figuren für das Browser-Spiel (Jason, Lucia, Passanten, Polizei)
#
#  Im Spiel ist eine Figur nur etwa 25 × 35 Pixel groß. Ein verkleinertes
#  3D-Bild wird dabei zu Matsch, deshalb werden die Figuren hier direkt
#  gezeichnet: vierfach vergrößert, dann sauber heruntergerechnet.
#
#  Blick nach oben (im Spiel wird das Bild gedreht). Maßstab wie bei den
#  Fahrzeugen: PX_PRO_METER Pixel je Meter.
#
#  Aufruf:  python tools/spiel-figuren.py --ziel assets/img/spiel
# ═══════════════════════════════════════════════════════════

import argparse
import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageChops

PX_PRO_METER = 64
UEBER = 4                      # vierfach zeichnen, danach verkleinern
FELD = 96                      # Kantenlänge des fertigen Bildes
SCHRITTE = 8                   # Bilder je Laufzyklus

FIGUREN = {
    "lucia": dict(
        haut=(214, 154, 112), haut_dunkel=(176, 120, 84),
        oben=(240, 232, 214), oben_dunkel=(198, 188, 170),
        unten=(38, 42, 62), haar=(24, 18, 20),
        schulter=0.60, kopf=0.23, zopf=True
    ),
    "jason": dict(
        haut=(224, 168, 126), haut_dunkel=(184, 130, 92),
        oben=(150, 156, 150), oben_dunkel=(116, 122, 116),
        unten=(60, 56, 46), haar=(46, 32, 24),
        schulter=0.70, kopf=0.245, zopf=False
    ),
    "passant1": dict(
        haut=(198, 146, 108), haut_dunkel=(160, 112, 78),
        oben=(86, 150, 196), oben_dunkel=(62, 116, 158),
        unten=(52, 54, 64), haar=(38, 28, 22),
        schulter=0.62, kopf=0.235, zopf=False
    ),
    "passant2": dict(
        haut=(150, 104, 72), haut_dunkel=(116, 78, 54),
        oben=(232, 138, 92), oben_dunkel=(190, 104, 66),
        unten=(70, 66, 58), haar=(20, 16, 16),
        schulter=0.58, kopf=0.23, zopf=True
    ),
    "polizist": dict(
        haut=(216, 162, 120), haut_dunkel=(176, 126, 88),
        oben=(40, 52, 92), oben_dunkel=(28, 38, 70),
        unten=(30, 34, 54), haar=(32, 26, 22),
        schulter=0.72, kopf=0.245, zopf=False
    ),
}


def m(wert):
    """Meter → Pixel im vergrößerten Bild"""
    return wert * PX_PRO_METER * UEBER


def rundes_rechteck(zeichner, mitte, breite, hoehe, radius, farbe, winkel=0):
    """Rechteck mit runden Ecken, notfalls gedreht — als eigenes Bild,
       damit die Drehung sauber bleibt."""
    b, h = int(breite), int(hoehe)
    teil = Image.new("RGBA", (b + 4, h + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(teil)
    d.rounded_rectangle([2, 2, b + 1, h + 1], radius=radius, fill=farbe)
    if winkel:
        teil = teil.rotate(winkel, resample=Image.BICUBIC, expand=True)
    return teil, (int(mitte[0] - teil.width / 2), int(mitte[1] - teil.height / 2))


def figur_zeichnen(art, phase):
    """phase 0..1 im Laufzyklus; 0 = Stand."""
    d = FIGUREN[art]
    gross = FELD * UEBER
    bild = Image.new("RGBA", (gross, gross), (0, 0, 0, 0))
    z = ImageDraw.Draw(bild)
    mx, my = gross / 2, gross / 2
    schwung = math.sin(phase * math.tau) if phase is not None else 0.0

    # ── Beine: schauen unten heraus, wechseln beim Laufen
    for seite in (-1, 1):
        versatz = schwung * seite * m(0.16)
        x = mx + seite * m(d["schulter"] * 0.21)
        teil, pos = rundes_rechteck(z, (x, my + m(0.10) + versatz * 0.4),
                                    m(0.19), m(0.42), int(m(0.08)), d["unten"])
        bild.alpha_composite(teil, pos)
        # Schuh
        teil, pos = rundes_rechteck(z, (x, my + m(0.26) + versatz),
                                    m(0.19), m(0.22), int(m(0.07)), (26, 26, 32))
        bild.alpha_composite(teil, pos)

    # ── Arme, schwingen gegenläufig zu den Beinen
    for seite in (-1, 1):
        versatz = -schwung * seite * m(0.13)
        x = mx + seite * m(d["schulter"] * 0.52)
        teil, pos = rundes_rechteck(z, (x, my - m(0.02) + versatz),
                                    m(0.17), m(0.46), int(m(0.08)), d["haut_dunkel"])
        bild.alpha_composite(teil, pos)
        # Hand
        z.ellipse([x - m(0.085), my + m(0.16) + versatz - m(0.085),
                   x + m(0.085), my + m(0.16) + versatz + m(0.085)], fill=d["haut"])

    # ── Rumpf: Schultern breit, nach unten schmaler
    teil, pos = rundes_rechteck(z, (mx, my + m(0.02)),
                                m(d["schulter"]), m(0.52), int(m(0.16)), d["oben"])
    bild.alpha_composite(teil, pos)
    # Schattenkante hinten, damit der Rumpf Tiefe bekommt
    teil, pos = rundes_rechteck(z, (mx, my + m(0.22)),
                                m(d["schulter"] * 0.92), m(0.16), int(m(0.07)), d["oben_dunkel"])
    bild.alpha_composite(teil, pos)

    # ── Kopf mit Haaren, sitzt leicht vor der Rumpfmitte
    ky = my - m(0.16)
    r = m(d["kopf"])
    z.ellipse([mx - r, ky - r, mx + r, ky + r], fill=d["haut"])
    # Haare als Kappe über dem hinteren Teil des Kopfes
    haar = Image.new("RGBA", bild.size, (0, 0, 0, 0))
    hz = ImageDraw.Draw(haar)
    hz.ellipse([mx - r * 1.06, ky - r * 0.98, mx + r * 1.06, ky + r * 1.06], fill=d["haar"])
    hz.ellipse([mx - r * 0.74, ky - r * 1.30, mx + r * 0.74, ky + r * 0.30], fill=(0, 0, 0, 0))
    bild.alpha_composite(haar)
    if d["zopf"]:
        zy = ky + r * 1.25
        z.ellipse([mx - r * 0.30, zy - r * 0.62, mx + r * 0.30, zy + r * 0.55], fill=d["haar"])
        z.ellipse([mx - r * 0.22, zy + r * 0.35, mx + r * 0.22, zy + r * 1.05], fill=d["haar"])

    # Gesichtsandeutung: Augenbrauen als kurze dunkle Striche
    z.rounded_rectangle([mx - r * 0.52, ky - r * 0.44, mx - r * 0.12, ky - r * 0.30],
                        radius=int(r * 0.07), fill=d["haar"])
    z.rounded_rectangle([mx + r * 0.12, ky - r * 0.44, mx + r * 0.52, ky - r * 0.30],
                        radius=int(r * 0.07), fill=d["haar"])

    # ── Licht von oben links, Schatten unten rechts
    licht = Image.new("RGBA", bild.size, (0, 0, 0, 0))
    lz = ImageDraw.Draw(licht)
    lz.ellipse([mx - m(0.42), my - m(0.52), mx + m(0.10), my + m(0.10)], fill=(255, 255, 255, 34))
    lz.ellipse([mx - m(0.05), my - m(0.10), mx + m(0.46), my + m(0.44)], fill=(0, 0, 0, 40))
    licht.putalpha(ImageChops.multiply(licht.split()[3], bild.split()[3]))
    bild.alpha_composite(licht.filter(ImageFilter.GaussianBlur(m(0.05))))

    return bild


def kontur(bild, staerke_px, farbe=(12, 14, 24, 235)):
    a = bild.split()[3]
    dick = a.filter(ImageFilter.MaxFilter(staerke_px * 2 + 1))
    rand = ImageChops.subtract(dick, a)
    umriss = Image.new("RGBA", bild.size, farbe)
    umriss.putalpha(rand)
    aus = Image.new("RGBA", bild.size, (0, 0, 0, 0))
    aus.alpha_composite(umriss)
    aus.alpha_composite(bild)
    return aus


def fertig(bild):
    klein = bild.resize((FELD, FELD), Image.LANCZOS)
    return kontur(klein, 1)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ziel", default="assets/img/spiel")
    p.add_argument("--nur", default="")
    a = p.parse_args()
    os.makedirs(a.ziel, exist_ok=True)

    arten = [a.nur] if a.nur else list(FIGUREN)
    for art in arten:
        fertig(figur_zeichnen(art, None)).save(os.path.join(a.ziel, f"{art}_steht.png"))
        for i in range(SCHRITTE):
            fertig(figur_zeichnen(art, i / SCHRITTE)).save(os.path.join(a.ziel, f"{art}_lauf{i}.png"))
        print("gezeichnet:", art)


if __name__ == "__main__":
    main()
