# ═══════════════════════════════════════════════════════════
#  Sprite-Bögen zerlegen
#
#  Die Fahrzeuge und Figuren kommen als große Rasterbilder aus einer
#  Bild-KI: 4 Spalten, 3 Zeilen, alles vor einem einfarbigen Hintergrund
#  (Chroma-Grün oder Weiß). Dieses Werkzeug schneidet daraus die
#  einzelnen Sprites für das Spiel:
#
#    1. Hintergrund entfernen (Grün per Farbabstand, Weiß per Flutfüllung
#       vom Rand — sonst würde der weiße Krankenwagen mitverschwinden)
#    2. Grün an den Rändern entsättigen, sonst bleibt ein grüner Saum
#    3. je Rasterzelle den Inhalt freistellen
#    4. auf Spielmaßstab bringen (PX_PRO_METER Bildpunkte je Meter)
#    5. dunkle Kontur dazu und mittig auf eine Leinwand setzen
#
#  Aufruf:
#    python tools/spiel-bogen.py --bogen autos1 --bild "pfad/1.webp"
# ═══════════════════════════════════════════════════════════

import argparse
import os

from PIL import Image, ImageChops, ImageFilter

PX_PRO_METER = 64
ZIEL = "assets/img/spiel"


# ── Bögen: Name, Raster, Hintergrund, Inhalte ──────────────
#  Bei Fahrzeugen ist das Maß die Länge, bei Figuren die Körpergröße.
BOEGEN = {
    "autos1": dict(
        spalten=4, zeilen=3, hintergrund="weiss", art="auto",
        zellen=[
            ("cabrio", 4.45), ("limo", 4.80), ("sport", 4.30), ("pickup", 5.10),
            ("taxi", 4.75), ("streife", 4.90), ("kombi", 4.95), ("transporter", 5.40),
            ("bus", 9.20), ("oldtimer", 5.20), ("krankenwagen", 5.60), ("feuerwehr", 7.80),
        ]),
    "autos2": dict(
        spalten=4, zeilen=3, hintergrund="gruen", art="auto",
        zellen=[
            ("limousine", 7.00), ("luxuscabrio", 4.90), ("lowrider", 5.30), ("muscle", 4.90),
            ("supersport", 4.40), ("surfbus", 4.70), ("schrottkarre", 4.80), ("gelaende", 4.70),
            ("abschlepper", 6.20), ("muellwagen", 8.00), ("nachrichten", 5.50), ("kipper", 7.50),
        ]),
    "leute": dict(
        spalten=4, zeilen=3, hintergrund="gruen", art="figur",
        zellen=[
            ("mann_hemd", 1.80), ("mann_tank", 1.82), ("mann_anzug", 1.80), ("mann_jung", 1.76),
            ("mann_arbeiter", 1.80), ("frau_kleid", 1.70), ("frau_top", 1.68), ("frau_sport", 1.70),
            ("frau_business", 1.70), ("tourist", 1.78), ("rentner", 1.72), ("rentnerin", 1.64),
        ]),
    "dienst": dict(
        spalten=4, zeilen=3, hintergrund="gruen", art="figur",
        zellen=[
            ("polizist", 1.82), ("polizistin", 1.72), ("polizist_sommer", 1.82), ("swat", 1.84),
            ("sanitaeter", 1.80), ("sanitaeterin", 1.72), ("feuerwehr_mann", 1.84), ("feuerwehr_dienst", 1.80),
            ("rettungsschwimmerin", 1.70), ("wachmann", 1.80), ("taxifahrer", 1.76), ("verkaeufer", 1.78),
        ]),
    "helden": dict(
        spalten=4, zeilen=2, hintergrund="gruen", art="held",
        zellen=[
            ("jason", 1.86), ("jason", 1.86), ("jason", 1.86), ("jason", 1.86),
            ("lucia", 1.74), ("lucia", 1.74), ("lucia", 1.74), ("lucia", 1.74),
        ]),
}


# ── Hintergrund entfernen ──────────────────────────────────
def gruen_weg(bild):
    """Chroma-Grün: alles, wo Grün deutlich über Rot und Blau liegt."""
    bild = bild.convert("RGBA")
    px = bild.load()
    b, h = bild.size
    for y in range(h):
        for x in range(b):
            r, g, bl, a = px[x, y]
            if g > 90 and g > r * 1.35 + 10 and g > bl * 1.35 + 10:
                px[x, y] = (0, 0, 0, 0)
            elif g > max(r, bl) + 18:
                # Saum: Grünstich herausnehmen, Rest halbdurchsichtig lassen
                neu = int((r + bl) / 2)
                px[x, y] = (r, neu, bl, int(a * 0.85))
    return bild


def weiss_weg(bild, schwelle=232):
    """Weiß nur von außen wegnehmen — sonst verschwinden weiße Autos."""
    bild = bild.convert("RGBA")
    px = bild.load()
    b, h = bild.size
    hell = lambda x, y: min(px[x, y][0], px[x, y][1], px[x, y][2]) >= schwelle
    stapel = []
    for x in range(b):
        for y in (0, h - 1):
            if hell(x, y):
                stapel.append((x, y))
    for y in range(h):
        for x in (0, b - 1):
            if hell(x, y):
                stapel.append((x, y))
    gesehen = set(stapel)
    while stapel:
        x, y = stapel.pop()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < b and 0 <= ny < h and (nx, ny) not in gesehen:
                if px[nx, ny][3] and hell(nx, ny):
                    gesehen.add((nx, ny))
                    stapel.append((nx, ny))
    return bild


# ── Nachbearbeiten ─────────────────────────────────────────
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


def mittig(bild, rand=2):
    """Symmetrisch zur Mitte beschneiden — das Spiel dreht um den
       Bildmittelpunkt, deshalb muss der Sprite dort sitzen."""
    kasten = bild.getbbox()
    if not kasten:
        return bild
    mx, my = bild.width / 2, bild.height / 2
    dx = max(abs(kasten[0] - mx), abs(kasten[2] - mx)) + rand
    dy = max(abs(kasten[1] - my), abs(kasten[3] - my)) + rand
    return bild.crop((int(mx - dx), int(my - dy), int(mx + dx), int(my + dy)))


# ── Zusammenhängende Flächen finden ───────────────────────
#  Ein festes Raster reicht nicht: Ein langer Wagen ragt in die
#  Nachbarzelle, und dann klebt an jedem Sprite ein Schnipsel vom
#  Nachbarn. Deshalb werden erst alle Objekte gesucht und danach der
#  Rasterzelle zugeordnet, in der ihr Schwerpunkt liegt.
def objekte_finden(bild, mindest=2000):
    b, h = bild.size
    alpha = bild.split()[3].load()
    marke = [0] * (b * h)
    gefunden = []
    nummer = 0
    for start in range(b * h):
        if marke[start] or alpha[start % b, start // b] < 40:
            continue
        nummer += 1
        stapel = [start]
        marke[start] = nummer
        felder = []
        x0 = x1 = start % b
        y0 = y1 = start // b
        while stapel:
            q = stapel.pop()
            qx, qy = q % b, q // b
            felder.append(q)
            if qx < x0: x0 = qx
            if qx > x1: x1 = qx
            if qy < y0: y0 = qy
            if qy > y1: y1 = qy
            for nx, ny in ((qx + 1, qy), (qx - 1, qy), (qx, qy + 1), (qx, qy - 1)):
                if nx < 0 or ny < 0 or nx >= b or ny >= h:
                    continue
                n = ny * b + nx
                if marke[n] or alpha[nx, ny] < 40:
                    continue
                marke[n] = nummer
                stapel.append(n)
        if len(felder) < mindest:
            continue
        gefunden.append(dict(nummer=nummer, felder=len(felder), kasten=(x0, y0, x1 + 1, y1 + 1),
                             mitte=((x0 + x1) / 2, (y0 + y1) / 2)))
    return marke, gefunden


def objekt_ausschneiden(bild, marke, objekt):
    """Nur die Punkte dieses Objekts übernehmen — Nachbarn bleiben weg."""
    x0, y0, x1, y1 = objekt["kasten"]
    b = bild.width
    zu = bild.crop((x0, y0, x1, y1)).convert("RGBA")
    px = zu.load()
    for y in range(zu.height):
        for x in range(zu.width):
            if marke[(y + y0) * b + (x + x0)] != objekt["nummer"]:
                px[x, y] = (0, 0, 0, 0)
    return zu


def zelle_freistellen(bild, laenge_m, mindest=40):
    """Inhalt zuschneiden und auf Spielmaßstab bringen."""
    kasten = bild.getbbox()
    if not kasten:
        return None
    zu = bild.crop(kasten)
    if zu.width < mindest or zu.height < mindest:
        return None
    ziel_h = max(8, int(round(laenge_m * PX_PRO_METER)))
    faktor = ziel_h / zu.height
    zu = zu.resize((max(1, int(round(zu.width * faktor))), ziel_h), Image.LANCZOS)
    # auf eine quadratische Leinwand mit Luft, danach mittig beschneiden
    seite = int(max(zu.width, zu.height) * 1.3) + 8
    blatt = Image.new("RGBA", (seite, seite), (0, 0, 0, 0))
    blatt.alpha_composite(zu, ((seite - zu.width) // 2, (seite - zu.height) // 2))
    return blatt


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--bogen", required=True, choices=sorted(BOEGEN))
    p.add_argument("--bild", required=True)
    p.add_argument("--ziel", default=ZIEL)
    p.add_argument("--vorschau", default="")
    a = p.parse_args()

    plan = BOEGEN[a.bogen]
    bild = Image.open(a.bild)
    bild = gruen_weg(bild) if plan["hintergrund"] == "gruen" else weiss_weg(bild)

    os.makedirs(a.ziel, exist_ok=True)
    zb = bild.width / plan["spalten"]
    zh = bild.height / plan["zeilen"]
    zaehler = {}

    marke, objekte = objekte_finden(bild)
    print(f"  {len(objekte)} Objekte gefunden")
    proZelle = {}
    for o in objekte:
        sx = min(plan["spalten"] - 1, int(o["mitte"][0] // zb))
        sy = min(plan["zeilen"] - 1, int(o["mitte"][1] // zh))
        schluessel = sy * plan["spalten"] + sx
        if schluessel not in proZelle or o["felder"] > proZelle[schluessel]["felder"]:
            proZelle[schluessel] = o

    for i, (name, mass) in enumerate(plan["zellen"]):
        o = proZelle.get(i)
        if not o:
            print(f"  leer: {name} (Zelle {i})")
            continue
        frei = zelle_freistellen(objekt_ausschneiden(bild, marke, o), mass)
        if not frei:
            print(f"  zu klein: {name} (Zelle {i})")
            continue
        fertig = mittig(kontur(frei))

        if plan["art"] == "auto":
            fertig.save(os.path.join(a.ziel, f"auto_{name}.png"), optimize=True)
            print(f"  auto_{name}.png: {fertig.width}x{fertig.height}")
        elif plan["art"] == "held":
            zaehler.setdefault(name, []).append(fertig)
        else:
            fertig.save(os.path.join(a.ziel, f"{name}_steht.png"), optimize=True)
            print(f"  {name}_steht.png: {fertig.width}x{fertig.height}")

    # Hauptfiguren: aus vier Posen wird der Laufzyklus.
    # p0 steht, p1 und p3 sind die beiden Schrittweiten, p2 dazwischen.
    ZYKLUS = [1, 1, 2, 2, 3, 3, 0, 0]
    for name, posen in zaehler.items():
        if len(posen) < 4:
            print(f"  {name}: nur {len(posen)} Posen — uebersprungen")
            continue
        posen[0].save(os.path.join(a.ziel, f"{name}_steht.png"), optimize=True)
        for k, p in enumerate(ZYKLUS):
            posen[p].save(os.path.join(a.ziel, f"{name}_lauf{k}.png"), optimize=True)
        print(f"  {name}: steht + 8 Laufbilder, {posen[0].width}x{posen[0].height}")

    if a.vorschau:
        bild.save(a.vorschau)


if __name__ == "__main__":
    main()
