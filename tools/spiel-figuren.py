# ═══════════════════════════════════════════════════════════
#  Figuren für das Browser-Spiel
#
#  Im Spiel ist eine Figur nur etwa 25 × 35 Pixel groß. Ein verkleinertes
#  3D-Bild wird dabei zu Matsch, deshalb werden die Figuren hier direkt
#  gezeichnet: vierfach vergrößert, dann sauber heruntergerechnet.
#
#  Blick nach oben (im Spiel wird das Bild gedreht). Maßstab wie bei den
#  Fahrzeugen: PX_PRO_METER Pixel je Meter.
#
#  Jason und Lucia tragen ihre Sachen aus den Trailern: Lucia cremefarbenes
#  Top, dunkle Jeans, schwarzer Pferdeschwanz; Jason graues Tanktop,
#  Cargohose, kurze dunkle Haare und Bart. Die Passanten unterscheiden sich
#  in Frisur, Kleidung, Statur und Hautton, damit die Straße lebt.
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

# frisur: "zopf" | "lang" | "kurz" | "glatze" | "kappe" | "duttchen"
FIGUREN = {
    # ── Hauptfiguren ──────────────────────────────────────────
    "lucia": dict(
        haut=(206, 148, 106), oben=(240, 232, 214), unten=(36, 40, 60),
        haar=(22, 16, 18), schulter=0.58, kopf=0.235, frisur="zopf",
        schmuck=(226, 184, 88)                       # goldene Creolen
    ),
    "jason": dict(
        haut=(222, 168, 128), oben=(146, 152, 146), unten=(74, 70, 56),
        haar=(58, 40, 28), schulter=0.72, kopf=0.25, frisur="kurz",
        bart=True
    ),
    # ── Passanten ─────────────────────────────────────────────
    "mann_hemd": dict(
        haut=(212, 158, 116), oben=(96, 158, 202), unten=(48, 50, 60),
        haar=(40, 30, 24), schulter=0.68, kopf=0.24, frisur="kurz"
    ),
    "mann_tank": dict(
        haut=(150, 102, 70), oben=(238, 236, 230), unten=(62, 66, 78),
        haar=(18, 14, 14), schulter=0.70, kopf=0.245, frisur="glatze"
    ),
    "mann_anzug": dict(
        haut=(226, 176, 136), oben=(46, 48, 62), unten=(38, 40, 52),
        haar=(64, 48, 34), schulter=0.66, kopf=0.235, frisur="kurz"
    ),
    "frau_kleid": dict(
        haut=(190, 132, 94), oben=(232, 104, 138), unten=(232, 104, 138),
        haar=(46, 28, 20), schulter=0.56, kopf=0.23, frisur="lang", rock=True
    ),
    "frau_top": dict(
        haut=(236, 194, 156), oben=(126, 206, 188), unten=(52, 56, 70),
        haar=(196, 154, 74), schulter=0.55, kopf=0.225, frisur="duttchen"
    ),
    "frau_sport": dict(
        haut=(160, 110, 76), oben=(250, 182, 74), unten=(40, 44, 56),
        haar=(20, 16, 16), schulter=0.57, kopf=0.23, frisur="zopf"
    ),
    "tourist": dict(
        haut=(238, 196, 160), oben=(246, 142, 92), unten=(226, 220, 204),
        haar=(96, 74, 46), schulter=0.66, kopf=0.24, frisur="kappe",
        kappe=(238, 238, 236), hemd_muster=(86, 168, 140)
    ),
    "rentner": dict(
        haut=(226, 188, 152), oben=(176, 180, 186), unten=(104, 100, 92),
        haar=(212, 210, 206), schulter=0.62, kopf=0.24, frisur="kurz"
    ),
    "polizist": dict(
        haut=(216, 162, 120), oben=(40, 52, 92), unten=(30, 34, 54),
        haar=(32, 26, 22), schulter=0.72, kopf=0.245, frisur="kappe",
        kappe=(28, 36, 66), weste=(22, 26, 44)
    ),
    "mann_jacke": dict(
        haut=(206, 152, 112), oben=(58, 74, 96), unten=(44, 46, 56),
        haar=(30, 22, 18), schulter=0.70, kopf=0.242, frisur="kurz", bart=True
    ),
    "mann_arbeiter": dict(
        haut=(180, 124, 86), oben=(240, 166, 48), unten=(56, 60, 72),
        haar=(28, 22, 18), schulter=0.72, kopf=0.245, frisur="kappe",
        kappe=(230, 160, 40), weste=(246, 190, 60)
    ),
    "mann_jung": dict(
        haut=(226, 182, 146), oben=(70, 176, 148), unten=(70, 74, 86),
        haar=(120, 84, 44), schulter=0.62, kopf=0.235, frisur="kurz"
    ),
    "frau_business": dict(
        haut=(212, 160, 120), oben=(52, 54, 70), unten=(52, 54, 70),
        haar=(64, 40, 26), schulter=0.56, kopf=0.228, frisur="duttchen", rock=True
    ),
    "frau_lang": dict(
        haut=(150, 100, 68), oben=(226, 226, 232), unten=(46, 52, 74),
        haar=(24, 18, 16), schulter=0.56, kopf=0.23, frisur="lang"
    ),
    "frau_sommer": dict(
        haut=(238, 200, 162), oben=(250, 140, 170), unten=(250, 140, 170),
        haar=(210, 170, 90), schulter=0.55, kopf=0.226, frisur="lang", rock=True
    ),
    "tourist2": dict(
        haut=(220, 170, 130), oben=(120, 190, 235), unten=(230, 226, 212),
        haar=(60, 44, 30), schulter=0.64, kopf=0.238, frisur="kappe",
        kappe=(240, 90, 90), hemd_muster=(250, 210, 90)
    ),
    "rentnerin": dict(
        haut=(228, 192, 158), oben=(196, 168, 200), unten=(86, 82, 78),
        haar=(220, 218, 214), schulter=0.56, kopf=0.232, frisur="duttchen", rock=True
    ),
    "polizistin": dict(
        haut=(188, 134, 98), oben=(40, 52, 92), unten=(30, 34, 54),
        haar=(26, 20, 18), schulter=0.60, kopf=0.232, frisur="zopf",
        weste=(22, 26, 44)
    ),
}


def m(wert):
    """Meter → Pixel im vergrößerten Bild"""
    return wert * PX_PRO_METER * UEBER


def dunkler(farbe, faktor):
    return tuple(max(0, min(255, int(c * faktor))) for c in farbe[:3])


def rundes_rechteck(mitte, breite, hoehe, radius, farbe):
    b, h = int(breite), int(hoehe)
    teil = Image.new("RGBA", (b + 4, h + 4), (0, 0, 0, 0))
    ImageDraw.Draw(teil).rounded_rectangle([2, 2, b + 1, h + 1], radius=radius, fill=farbe)
    return teil, (int(mitte[0] - teil.width / 2), int(mitte[1] - teil.height / 2))


def figur_zeichnen(art, phase):
    """phase 0…1 im Laufzyklus, None = Stand."""
    d = FIGUREN[art]
    haut = d["haut"]
    haut_dunkel = dunkler(haut, 0.82)
    oben = d["oben"]
    oben_dunkel = dunkler(oben, 0.78)
    unten = d["unten"]
    haar = d["haar"]
    schulter = d["schulter"]
    frisur = d.get("frisur", "kurz")

    gross = FELD * UEBER
    bild = Image.new("RGBA", (gross, gross), (0, 0, 0, 0))
    z = ImageDraw.Draw(bild)
    mx, my = gross / 2, gross / 2
    schwung = math.sin(phase * math.tau) if phase is not None else 0.0

    # ── Beine (beim Kleid nur die Unterschenkel) ──
    bein_laenge = 0.30 if d.get("rock") else 0.42
    for seite in (-1, 1):
        versatz = schwung * seite * m(0.16)
        x = mx + seite * m(schulter * 0.21)
        teil, pos = rundes_rechteck((x, my + m(0.16) + versatz * 0.4),
                                    m(0.19), m(bein_laenge), int(m(0.08)),
                                    haut if d.get("rock") else unten)
        bild.alpha_composite(teil, pos)
        teil, pos = rundes_rechteck((x, my + m(0.28) + versatz),
                                    m(0.19), m(0.20), int(m(0.07)), (26, 26, 32))
        bild.alpha_composite(teil, pos)

    # Rock als breiter Saum über den Beinen
    if d.get("rock"):
        teil, pos = rundes_rechteck((mx, my + m(0.14)), m(schulter * 1.15), m(0.34),
                                    int(m(0.12)), unten)
        bild.alpha_composite(teil, pos)

    # ── Arme ──
    for seite in (-1, 1):
        versatz = -schwung * seite * m(0.13)
        x = mx + seite * m(schulter * 0.52)
        teil, pos = rundes_rechteck((x, my - m(0.02) + versatz),
                                    m(0.17), m(0.46), int(m(0.08)), haut_dunkel)
        bild.alpha_composite(teil, pos)
        z.ellipse([x - m(0.085), my + m(0.16) + versatz - m(0.085),
                   x + m(0.085), my + m(0.16) + versatz + m(0.085)], fill=haut)

    # ── Haar, das hinter dem Körper liegt (Zopf, lange Haare) ──
    kyv = my - m(0.16)
    rv = m(d["kopf"])
    if frisur == "zopf":
        zy = kyv + rv * 1.30
        z.ellipse([mx - rv * 0.24, zy - rv * 0.55, mx + rv * 0.24, zy + rv * 0.45], fill=haar)
        z.ellipse([mx - rv * 0.17, zy + rv * 0.30, mx + rv * 0.17, zy + rv * 0.90], fill=haar)
    elif frisur == "lang":
        for seite in (-1, 1):
            z.ellipse([mx + seite * rv * 0.86 - rv * 0.30, kyv + rv * 0.10,
                       mx + seite * rv * 0.86 + rv * 0.30, kyv + rv * 1.35], fill=haar)
        z.ellipse([mx - rv * 0.62, kyv + rv * 0.55, mx + rv * 0.62, kyv + rv * 1.30], fill=haar)

    # ── Rumpf ──
    teil, pos = rundes_rechteck((mx, my + m(0.02)), m(schulter), m(0.52), int(m(0.16)), oben)
    bild.alpha_composite(teil, pos)
    teil, pos = rundes_rechteck((mx, my + m(0.22)), m(schulter * 0.92), m(0.16), int(m(0.07)), oben_dunkel)
    bild.alpha_composite(teil, pos)

    # Hawaiihemd-Tupfen für den Touristen
    if d.get("hemd_muster"):
        for i, (ox, oy) in enumerate([(-0.14, -0.08), (0.12, -0.02), (-0.05, 0.10), (0.16, 0.14)]):
            r = m(0.035 + (i % 2) * 0.012)
            z.ellipse([mx + m(ox) - r, my + m(oy) - r, mx + m(ox) + r, my + m(oy) + r],
                      fill=d["hemd_muster"])

    # Schutzweste der Polizei
    if d.get("weste"):
        teil, pos = rundes_rechteck((mx, my + m(0.03)), m(schulter * 0.74), m(0.40),
                                    int(m(0.10)), d["weste"])
        bild.alpha_composite(teil, pos)

    # ── Kopf ──
    ky = my - m(0.16)
    r = m(d["kopf"])
    z.ellipse([mx - r, ky - r, mx + r, ky + r], fill=haut)

    # Haare: Kappe über dem hinteren Teil, Gesicht bleibt frei
    if frisur != "glatze":
        haare = Image.new("RGBA", bild.size, (0, 0, 0, 0))
        hz = ImageDraw.Draw(haare)
        weite = 1.02 if frisur in ("kurz", "zopf", "duttchen") else 1.10
        hz.ellipse([mx - r * weite, ky - r * 0.96, mx + r * weite, ky + r * 1.02], fill=haar)
        hz.ellipse([mx - r * 0.86, ky - r * 1.30, mx + r * 0.86, ky + r * 0.46], fill=(0, 0, 0, 0))
        bild.alpha_composite(haare)

    if frisur == "duttchen":
        zy = ky + r * 1.12
        z.ellipse([mx - r * 0.38, zy - r * 0.38, mx + r * 0.38, zy + r * 0.38], fill=haar)
    elif frisur == "kappe":
        kf = d.get("kappe", (40, 44, 60))
        z.ellipse([mx - r * 1.08, ky - r * 1.02, mx + r * 1.08, ky + r * 1.02], fill=kf)
        z.rounded_rectangle([mx - r * 0.78, ky - r * 1.42, mx + r * 0.78, ky - r * 0.62],
                            radius=int(r * 0.35), fill=dunkler(kf, 0.82))

    # Ohrringe
    if d.get("schmuck"):
        for seite in (-1, 1):
            z.ellipse([mx + seite * r * 0.92 - r * 0.13, ky + r * 0.12,
                       mx + seite * r * 0.92 + r * 0.13, ky + r * 0.38], fill=d["schmuck"])

    # Gesicht: Augenbrauen (und Bart, wenn vorhanden)
    if d.get("bart"):
        z.ellipse([mx - r * 0.62, ky - r * 0.34, mx + r * 0.62, ky + r * 0.42], fill=dunkler(haar, 0.9))
        z.ellipse([mx - r * 0.44, ky - r * 0.50, mx + r * 0.44, ky + r * 0.18], fill=haut)
    z.rounded_rectangle([mx - r * 0.52, ky - r * 0.46, mx - r * 0.12, ky - r * 0.32],
                        radius=int(r * 0.07), fill=haar)
    z.rounded_rectangle([mx + r * 0.12, ky - r * 0.46, mx + r * 0.52, ky - r * 0.32],
                        radius=int(r * 0.07), fill=haar)

    # ── Licht von oben links, Schatten unten rechts ──
    licht = Image.new("RGBA", bild.size, (0, 0, 0, 0))
    lz = ImageDraw.Draw(licht)
    lz.ellipse([mx - m(0.42), my - m(0.52), mx + m(0.10), my + m(0.10)], fill=(255, 255, 255, 34))
    lz.ellipse([mx - m(0.05), my - m(0.10), mx + m(0.46), my + m(0.44)], fill=(0, 0, 0, 44))
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
    return kontur(bild.resize((FELD, FELD), Image.LANCZOS), 1)


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
