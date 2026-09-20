# ═══════════════════════════════════════════════════════════
#  Sprites für das Browser-Spiel (Blender 5, Hintergrundbetrieb)
#
#  Baut die Fahrzeuge als einfache 3D-Modelle,
#  stellt eine orthografische Kamera senkrecht darüber und rendert
#  sie als PNG mit durchsichtigem Hintergrund. Gedreht wird später
#  im Spiel, deshalb reicht je ein Bild pro Blickrichtung „nach oben".
#
#  Maßstab: 1 Blender-Einheit = 1 Meter, PX_PRO_METER Pixel je Meter.
#  Dadurch passen Figuren und Autos ohne Nachrechnen zusammen.
#
#  Die Figuren entstehen dagegen gezeichnet in tools/spiel-figuren.py — bei
#  25 Pixeln Körpergröße liest sich eine gezeichnete Figur deutlich besser
#  als ein heruntergerechnetes 3D-Bild.
#
#  Aufruf:
#    blender -b -P tools/spiel-sprites.py -- --ziel <ordner> --nur autos
# ═══════════════════════════════════════════════════════════

import bpy
import math
import os
import sys
from mathutils import Euler

PX_PRO_METER = 64
SAMPLES = 96


# ── Hilfen ─────────────────────────────────────────────────
def argumente():
    rest = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ziel = "sprites"
    nur = ""
    for i, a in enumerate(rest):
        if a == "--ziel" and i + 1 < len(rest):
            ziel = rest[i + 1]
        if a == "--nur" and i + 1 < len(rest):
            nur = rest[i + 1]
        if a == "--neigung" and i + 1 < len(rest):
            globals()["NEIGUNG"] = float(rest[i + 1])
        if a == "--kopf" and i + 1 < len(rest):
            globals()["KOPF"] = float(rest[i + 1])
    return ziel, nur


def szene_leeren():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.objects):
        for x in list(block):
            if x.users == 0:
                block.remove(x)


def farbe(name, rgb, rauheit=0.55, metall=0.0, leuchten=0.0):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    b = mat.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Roughness"].default_value = rauheit
    b.inputs["Metallic"].default_value = metall
    if leuchten:
        b.inputs["Emission Color"].default_value = (*rgb, 1.0)
        b.inputs["Emission Strength"].default_value = leuchten
    return mat


def wuerfel(name, groesse, ort, mat, drehung=(0, 0, 0), bevel=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=ort)
    o = bpy.context.object
    o.name = name
    o.scale = groesse
    o.rotation_euler = Euler(drehung)
    o.data.materials.append(mat)
    if bevel:
        m = o.modifiers.new("bevel", "BEVEL")
        m.width = bevel
        m.segments = 3
        m.limit_method = "ANGLE"
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    return o


def kugel(name, groesse, ort, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.5, location=ort)
    o = bpy.context.object
    o.name = name
    o.scale = groesse
    o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o


def zylinder(name, radius, hoehe, ort, mat, drehung=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=hoehe, location=ort)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = Euler(drehung)
    o.data.materials.append(mat)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    return o


# ── Licht und Kamera ───────────────────────────────────────
def licht_setzen():
    """Sonne schräg von vorne links, dazu ein weiches Gegenlicht.
       Immer gleich, damit alle Sprites gleich beleuchtet sind."""
    bpy.ops.object.light_add(type="SUN", location=(4, -6, 9))
    sonne = bpy.context.object
    sonne.data.energy = 5.6
    sonne.data.angle = math.radians(12)
    sonne.rotation_euler = Euler((math.radians(38), 0, math.radians(38)))

    bpy.ops.object.light_add(type="AREA", location=(-5, 4, 6))
    fuell = bpy.context.object
    fuell.data.energy = 140
    fuell.data.size = 8
    fuell.data.color = (0.75, 0.82, 1.0)
    fuell.rotation_euler = Euler((math.radians(-35), 0, math.radians(-140)))

    welt = bpy.context.scene.world
    if not welt:
        welt = bpy.data.worlds.new("Welt")
        bpy.context.scene.world = welt
    welt.use_nodes = True
    hg = welt.node_tree.nodes["Background"]
    hg.inputs[0].default_value = (0.30, 0.35, 0.52, 1)
    hg.inputs[1].default_value = 0.35


# Kameraneigung: 0° wäre senkrecht von oben. Ein Mensch von exakt oben ist
# nur ein Kopf mit Schultern — erst mit etwas Neigung erkennt man die Figur.
# Dieselbe Neigung gilt für Autos, damit alles zusammenpasst (GTA-2-Blick).
NEIGUNG = 20
KOPF = 1.28   # Kopf bewusst größer als anatomisch: sonst ist die Figur
              # bei 40 Pixeln Höhe nicht zu erkennen


def kamera_setzen(breite_m, hoehe_m=None):
    n = math.radians(NEIGUNG)
    abstand = 14
    bpy.ops.object.camera_add(location=(0, -abstand * math.sin(n), abstand * math.cos(n)))
    kam = bpy.context.object
    kam.data.type = "ORTHO"
    kam.data.ortho_scale = breite_m
    kam.rotation_euler = Euler((n, 0, 0))
    bpy.context.scene.camera = kam
    return kam


def render_setzen(breite_m, px):
    s = bpy.context.scene
    s.render.engine = "CYCLES"
    s.cycles.samples = SAMPLES
    s.cycles.use_denoising = True
    s.cycles.device = "CPU"
    s.render.film_transparent = True
    s.render.resolution_x = px
    s.render.resolution_y = px
    s.render.resolution_percentage = 100
    s.render.image_settings.file_format = "PNG"
    s.render.image_settings.color_mode = "RGBA"
    s.view_settings.view_transform = "Standard"


def rendern(pfad):
    os.makedirs(os.path.dirname(pfad), exist_ok=True)
    bpy.context.scene.render.filepath = pfad
    bpy.ops.render.render(write_still=True)
    print("gerendert:", pfad)


# ── Figuren ────────────────────────────────────────────────
HAUT_L = (0.72, 0.47, 0.33)
HAUT_J = (0.78, 0.55, 0.40)
HAAR = (0.07, 0.05, 0.05)


def figur(art, beinphase=0.0, armphase=0.0):
    """Blick nach +Y (im Bild nach oben). Von oben zählt vor allem die
       Silhouette: Schultern, Arme, Kopf, Haare — deshalb sind sie etwas
       kräftiger als anatomisch korrekt."""
    if art == "lucia":
        haut = farbe("haut_l", HAUT_L, 0.55)
        oben = farbe("top_l", (0.97, 0.93, 0.86), 0.7)       # Creme-Top
        unten = farbe("hose_l", (0.10, 0.12, 0.21), 0.82)    # dunkle Jeans
        schulter, hueft, groesse = 0.54, 0.38, 0.92
        haar_farbe = (0.06, 0.045, 0.05)
    else:
        haut = farbe("haut_j", HAUT_J, 0.55)
        oben = farbe("shirt_j", (0.55, 0.58, 0.55), 0.82)    # graues Tanktop
        unten = farbe("hose_j", (0.20, 0.19, 0.16), 0.86)    # Cargohose
        schulter, hueft, groesse = 0.66, 0.44, 1.0
        haar_farbe = (0.10, 0.07, 0.05)

    haar = farbe("haar_" + art, haar_farbe, 0.42)
    schuh = farbe("schuh", (0.09, 0.09, 0.11), 0.7)

    # Becken und Brustkorb — von oben ein Oval, nach vorn schmaler
    wuerfel("becken", (hueft, 0.30, 0.34), (0, -0.05, 0.98 * groesse), unten, bevel=0.08)
    wuerfel("brust", (schulter * 0.80, 0.34, 0.46), (0, 0.00, 1.30 * groesse), oben, bevel=0.10)
    wuerfel("schultern", (schulter, 0.26, 0.15), (0, -0.02, 1.47 * groesse), oben, bevel=0.07)

    # Arme: ein Stück, dicht am Körper, die Hand vorn sichtbar. Beim Laufen
    # schwingt der Arm um die Schulter nach vorn und hinten.
    for seite in (-1, 1):
        phase = armphase * seite
        x = seite * (schulter / 2 + 0.015)
        arm = wuerfel(f"arm{seite}", (0.135, 0.17, 0.52),
                      (x, 0.03 + math.sin(phase) * 0.10, 1.22 * groesse), haut, bevel=0.06)
        arm.rotation_euler = Euler((math.radians(-10) + phase * 0.65, 0, seite * math.radians(3)))
        kugel(f"hand{seite}", (0.13, 0.15, 0.12),
              (x, 0.14 + math.sin(phase) * 0.20, 0.99 * groesse), haut)

    # Beine und Schuhe
    for seite in (-1, 1):
        phase = beinphase * seite
        x = seite * (hueft / 2 - 0.02)
        wuerfel(f"bein{seite}", (0.16, 0.18, 0.62),
                (x, math.sin(phase) * 0.17, 0.62 * groesse), unten,
                drehung=(phase * 0.5, 0, 0), bevel=0.05)
        wuerfel(f"schuh{seite}", (0.17, 0.28, 0.11),
                (x, math.sin(phase) * 0.30 + 0.05, 0.32 * groesse), schuh, bevel=0.03)

    # Hals und Kopf. Der Kopf sitzt etwas weiter vorn und ist nach vorn
    # geneigt — dadurch sieht man von oben Stirn und Gesicht statt nur Haar.
    zylinder("hals", 0.085, 0.14, (0, -0.01, 1.56 * groesse), haut)
    kopf = kugel("kopf", (0.225 * KOPF, 0.245 * KOPF, 0.255 * KOPF), (0, 0.035, 1.70 * groesse), haut)
    kopf.rotation_euler = Euler((math.radians(26), 0, 0))

    # Gesicht: von oben reichen Augenbrauen, Augen und ein Mundschatten
    dunkel = farbe("gesicht", (0.08, 0.06, 0.06), 0.6)
    for seite in (-1, 1):
        kugel(f"auge{seite}", (0.045, 0.035, 0.03),
              (seite * 0.062, 0.135, 1.745 * groesse), dunkel)
        kugel(f"braue{seite}", (0.062, 0.030, 0.026),
              (seite * 0.066, 0.115, 1.775 * groesse), haar)
    kugel("mund", (0.075, 0.045, 0.025), (0, 0.165, 1.665 * groesse), dunkel)

    if art == "lucia":
        # Haar liegt hinten und an den Seiten, vorn bleibt Gesicht frei
        kappe = kugel("haarkappe", (0.245 * KOPF, 0.235 * KOPF, 0.20 * KOPF), (0, -0.055, 1.775 * groesse), haar)
        kappe.rotation_euler = Euler((math.radians(4), 0, 0))
        for seite in (-1, 1):
            kugel(f"straehne{seite}", (0.075, 0.20, 0.13),
                  (seite * 0.105, -0.02, 1.72 * groesse), haar)
        zopf = kugel("zopf", (0.125, 0.30, 0.13), (0, -0.26, 1.70 * groesse), haar)
        zopf.rotation_euler = Euler((math.radians(16), 0, 0))
        kugel("zopf2", (0.10, 0.13, 0.10), (0, -0.42, 1.62 * groesse), haar)
    else:
        kappe = kugel("haarkappe", (0.235 * KOPF, 0.225 * KOPF, 0.175 * KOPF), (0, -0.05, 1.79 * groesse), haar)
        kappe.rotation_euler = Euler((math.radians(4), 0, 0))
        bart = kugel("bart", (0.165, 0.14, 0.085), (0, 0.115, 1.635 * groesse), haar)
        bart.rotation_euler = Euler((math.radians(26), 0, 0))


# ── Fahrzeuge ──────────────────────────────────────────────
AUTOS = {
    "cabrio":  dict(lang=4.45, breit=1.90, lack=(0.92, 0.30, 0.52), offen=True),
    "limo":    dict(lang=4.80, breit=1.95, lack=(0.20, 0.26, 0.45), offen=False),
    "sport":   dict(lang=4.30, breit=1.92, lack=(0.95, 0.78, 0.22), offen=False, flach=True),
    "pickup":  dict(lang=5.10, breit=2.05, lack=(0.30, 0.55, 0.42), offen=False, pritsche=True),
    "taxi":    dict(lang=4.75, breit=1.95, lack=(0.98, 0.72, 0.12), offen=False, taxi=True),
    "streife": dict(lang=4.90, breit=2.00, lack=(0.92, 0.93, 0.96), offen=False, polizei=True),
    # ── später dazugekommen ──
    "kombi":   dict(lang=4.95, breit=1.98, lack=(0.62, 0.20, 0.24), offen=False, kombi=True),
    "transporter": dict(lang=5.40, breit=2.10, lack=(0.86, 0.87, 0.88), offen=False, kasten=True),
    "bus":     dict(lang=9.20, breit=2.45, lack=(0.24, 0.52, 0.72), offen=False, kasten=True, bus=True),
    "oldtimer": dict(lang=5.20, breit=2.05, lack=(0.30, 0.62, 0.55), offen=False, chrom_viel=True),
    "krankenwagen": dict(lang=5.60, breit=2.20, lack=(0.95, 0.95, 0.96), offen=False,
                         kasten=True, rettung=True),
    "feuerwehr": dict(lang=7.80, breit=2.50, lack=(0.78, 0.13, 0.12), offen=False,
                      kasten=True, feuer=True),
}


def auto(name):
    d = AUTOS[name]
    lang, breit = d["lang"], d["breit"]
    lack = farbe("lack_" + name, d["lack"], 0.22, 0.45)
    if "Coat Weight" in lack.node_tree.nodes["Principled BSDF"].inputs:
        lack.node_tree.nodes["Principled BSDF"].inputs["Coat Weight"].default_value = 0.6
    dunkel = tuple(c * 0.55 for c in d["lack"])
    lack_dunkel = farbe("lackd_" + name, dunkel, 0.3, 0.4)
    glas = farbe("glas", (0.045, 0.07, 0.12), 0.08, 0.2)
    schwarz = farbe("gummi", (0.045, 0.045, 0.055), 0.9)
    grau = farbe("kunststoff", (0.13, 0.14, 0.16), 0.75)
    chrom = farbe("chrom", (0.78, 0.80, 0.84), 0.2, 0.95)
    licht_v = farbe("licht_v", (1.0, 0.96, 0.85), 0.15, 0.0, 3.0)
    licht_h = farbe("licht_h", (0.95, 0.12, 0.18), 0.2, 0.0, 2.4)

    flach = d.get("flach")
    hoehe = 0.58 if flach else 0.70

    # Grundkörper + aufgesetzte Haube und Heck, dadurch Kanten statt Seife
    wuerfel("karosse", (breit, lang * 0.98, hoehe), (0, 0, 0.56), lack, bevel=0.06)
    wuerfel("haube", (breit * 0.94, lang * 0.30, hoehe * 0.42),
            (0, lang * 0.30, 0.56 + hoehe * 0.30), lack, bevel=0.05)
    wuerfel("heck", (breit * 0.94, lang * 0.24, hoehe * 0.40),
            (0, -lang * 0.34, 0.56 + hoehe * 0.28), lack, bevel=0.05)
    # Sicke entlang der Flanke
    for sx in (-1, 1):
        wuerfel(f"sicke{sx}", (0.05, lang * 0.70, 0.07),
                (sx * (breit / 2 - 0.01), 0, 0.72), lack_dunkel, bevel=0.02)

    # Radkästen als dunkle Aussparungen
    rad_x = breit / 2 - 0.02
    for sx in (-1, 1):
        for sy in (-1, 1):
            wuerfel(f"kasten{sx}{sy}", (0.30, 0.86, 0.34),
                    (sx * (rad_x - 0.08), sy * lang * 0.32, 0.50), schwarz, bevel=0.04)
            zylinder(f"rad{sx}{sy}", 0.33, 0.26,
                     (sx * rad_x, sy * lang * 0.32, 0.33), schwarz,
                     drehung=(0, math.radians(90), 0))
            zylinder(f"felge{sx}{sy}", 0.17, 0.28,
                     (sx * rad_x, sy * lang * 0.32, 0.33), chrom,
                     drehung=(0, math.radians(90), 0))

    if d.get("kasten"):
        # Kasten: hoher, langer Aufbau über der ganzen Länge
        hoch = 1.05 if d.get("bus") else 0.86
        wuerfel("aufbau", (breit * 0.96, lang * 0.80, hoch),
                (0, -lang * 0.06, 0.62 + hoch / 2), lack, bevel=0.07)
        wuerfel("dach", (breit * 0.86, lang * 0.72, 0.07),
                (0, -lang * 0.06, 0.62 + hoch), lack_dunkel, bevel=0.03)
        wuerfel("frontscheibe", (breit * 0.84, 0.10, 0.44),
                (0, lang * 0.34, 0.62 + hoch * 0.72), glas,
                drehung=(math.radians(-16), 0, 0), bevel=0.02)
        for sx in (-1, 1):
            anzahl = 4 if d.get("bus") else 2
            for i in range(anzahl):
                wuerfel(f"fenster{sx}{i}", (0.06, lang * (0.62 / anzahl) * 0.8, 0.30),
                        (sx * breit * 0.48,
                         -lang * 0.06 + lang * 0.62 * ((i + 0.5) / anzahl - 0.5),
                         0.62 + hoch * 0.7), glas, bevel=0.02)
        if d.get("rettung"):
            rot = farbe("rettung_rot", (0.85, 0.12, 0.14), 0.4)
            for sx in (-1, 1):
                wuerfel(f"streifen{sx}", (0.05, lang * 0.7, 0.16),
                        (sx * (breit / 2 + 0.005), -lang * 0.06, 0.95), rot, bevel=0.02)
            blau = farbe("blaulicht", (0.20, 0.42, 1.0), 0.18, 0.0, 4.0)
            wuerfel("balken_b", (breit * 0.5, 0.22, 0.14), (0, lang * 0.24, 0.66 + hoch), blau, bevel=0.03)
        if d.get("feuer"):
            silber = farbe("leiter", (0.72, 0.74, 0.78), 0.35, 0.8)
            wuerfel("leiter", (0.42, lang * 0.78, 0.14), (0, -lang * 0.04, 0.70 + hoch), silber, bevel=0.03)
            rotlicht = farbe("rotlicht", (1.0, 0.16, 0.22), 0.18, 0.0, 3.4)
            wuerfel("balken_r", (breit * 0.55, 0.22, 0.14), (0, lang * 0.26, 0.66 + hoch), rotlicht, bevel=0.03)
    elif d.get("pritsche"):
        wuerfel("kabine", (breit * 0.88, lang * 0.30, 0.50), (0, lang * 0.16, 1.02), lack, bevel=0.05)
        wuerfel("dach", (breit * 0.84, lang * 0.17, 0.07), (0, lang * 0.13, 1.27), lack, bevel=0.04)
        wuerfel("frontscheibe", (breit * 0.78, 0.10, 0.36), (0, lang * 0.31, 1.07), glas,
                drehung=(math.radians(-30), 0, 0), bevel=0.02)
        wuerfel("ladeflaeche", (breit * 0.90, lang * 0.44, 0.30), (0, -lang * 0.24, 0.80), grau, bevel=0.03)
        for sx in (-1, 1):
            wuerfel(f"bordwand{sx}", (0.07, lang * 0.46, 0.34),
                    (sx * breit * 0.46, -lang * 0.24, 0.92), lack, bevel=0.03)
    elif d["offen"]:
        wuerfel("innenraum", (breit * 0.80, lang * 0.46, 0.14), (0, -lang * 0.06, 0.86), grau, bevel=0.03)
        wuerfel("frontscheibe", (breit * 0.80, 0.07, 0.34), (0, lang * 0.13, 0.99), glas,
                drehung=(math.radians(-34), 0, 0), bevel=0.02)
        for sx in (-1, 1):
            wuerfel(f"sitz{sx}", (0.40, 0.42, 0.36), (sx * breit * 0.21, -lang * 0.04, 0.98), schwarz, bevel=0.06)
            wuerfel(f"lehne{sx}", (0.40, 0.12, 0.42), (sx * breit * 0.21, -lang * 0.14, 1.06), schwarz, bevel=0.05)
        wuerfel("armatur", (breit * 0.74, 0.20, 0.16), (0, lang * 0.07, 0.94), grau, bevel=0.03)
    else:
        kabine_l = lang * (0.44 if flach else (0.62 if d.get("kombi") else 0.50))
        wuerfel("kabine", (breit * 0.88, kabine_l, 0.46), (0, -lang * 0.03, 0.98), lack, bevel=0.07)
        # Dach etwas schmaler und dunkler als der Lack
        wuerfel("dach", (breit * 0.76, kabine_l * 0.52, 0.07), (0, -lang * 0.03, 1.22), lack, bevel=0.04)
        wuerfel("frontscheibe", (breit * 0.80, 0.30, 0.10),
                (0, -lang * 0.03 + kabine_l * 0.36, 1.16), glas,
                drehung=(math.radians(-34), 0, 0), bevel=0.02)
        wuerfel("heckscheibe", (breit * 0.76, 0.26, 0.10),
                (0, -lang * 0.03 - kabine_l * 0.36, 1.16), glas,
                drehung=(math.radians(32), 0, 0), bevel=0.02)
        for sx in (-1, 1):
            wuerfel(f"seitenglas{sx}", (0.06, kabine_l * 0.74, 0.28),
                    (sx * breit * 0.44, -lang * 0.03, 1.06), glas, bevel=0.02)

    # Spiegel
    for sx in (-1, 1):
        wuerfel(f"spiegel{sx}", (0.22, 0.12, 0.09),
                (sx * (breit / 2 + 0.06), lang * 0.14, 0.94), lack_dunkel, bevel=0.02)

    # Leuchten, in die Front eingelassen
    for sx in (-1, 1):
        wuerfel(f"vorn{sx}", (0.30, 0.08, 0.14), (sx * breit * 0.28, lang * 0.485, 0.70), licht_v, bevel=0.02)
        wuerfel(f"hinten{sx}", (0.32, 0.08, 0.14), (sx * breit * 0.28, -lang * 0.485, 0.70), licht_h, bevel=0.02)

    wuerfel("stangev", (breit * 0.98, 0.16, 0.20), (0, lang * 0.47, 0.44), grau, bevel=0.04)
    wuerfel("stangeh", (breit * 0.98, 0.16, 0.20), (0, -lang * 0.47, 0.44), grau, bevel=0.04)
    wuerfel("grill", (breit * 0.52, 0.10, 0.16), (0, lang * 0.49, 0.66), schwarz, bevel=0.02)

    if d.get("taxi"):
        gelb = farbe("taxischild", (0.99, 0.86, 0.28), 0.35, 0.0, 1.6)
        wuerfel("schild", (0.58, 0.24, 0.16), (0, lang * 0.10, 1.31), gelb, bevel=0.03)
        for sx in (-1, 1):
            wuerfel(f"karo{sx}", (0.07, lang * 0.40, 0.16),
                    (sx * (breit / 2 + 0.005), -lang * 0.02, 0.74), schwarz, bevel=0.02)
    if d.get("polizei"):
        blau = farbe("blaulicht", (0.22, 0.42, 1.0), 0.18, 0.0, 4.0)
        rot = farbe("rotlicht", (1.0, 0.16, 0.22), 0.18, 0.0, 3.4)
        wuerfel("balken", (breit * 0.70, 0.26, 0.10), (0, lang * 0.10, 1.29), schwarz, bevel=0.03)
        wuerfel("balken_b", (breit * 0.30, 0.22, 0.13), (-breit * 0.17, lang * 0.10, 1.31), blau, bevel=0.03)
        wuerfel("balken_r", (breit * 0.30, 0.22, 0.13), (breit * 0.17, lang * 0.10, 1.31), rot, bevel=0.03)
        streifen = farbe("streifen", (0.10, 0.16, 0.36), 0.5)
        for sx in (-1, 1):
            wuerfel(f"tuer{sx}", (0.05, lang * 0.40, 0.26),
                    (sx * (breit / 2 + 0.008), -lang * 0.02, 0.62), streifen, bevel=0.02)


def ampel(zustand):
    """Ampelkopf auf kurzem Mast. Die Lampen zeigen zur Kamera (−Y),
       sonst sieht man von oben nur den Mast."""
    gehaeuse = farbe("ampel_gehaeuse", (0.11, 0.12, 0.14), 0.55)
    mast = farbe("ampel_mast", (0.24, 0.25, 0.28), 0.5, 0.4)
    aus = farbe("lampe_aus", (0.05, 0.05, 0.06), 0.4)
    lampen = {
        "rot": farbe("lampe_rot", (1.0, 0.16, 0.18), 0.25, 0.0, 7.0),
        "gelb": farbe("lampe_gelb", (1.0, 0.74, 0.12), 0.25, 0.0, 7.0),
        "gruen": farbe("lampe_gruen", (0.22, 0.95, 0.42), 0.25, 0.0, 7.0),
    }

    # kurzer Mast mit Fuß
    zylinder("fuss", 0.22, 0.12, (0, 0, 0.06), mast)
    zylinder("mast", 0.07, 1.5, (0, 0, 0.75), mast)

    # Kopf: Kasten mit drei Lampen, Front nach −Y (zur Kamera)
    wuerfel("kopf", (0.46, 0.26, 1.15), (0, 0, 2.0), gehaeuse, bevel=0.05)
    for i, (name, hoehe) in enumerate((("rot", 2.36), ("gelb", 2.0), ("gruen", 1.64))):
        zylinder(f"lampe{i}", 0.13, 0.1, (0, -0.16, hoehe),
                 lampen[name] if zustand == name else aus,
                 drehung=(math.radians(90), 0, 0))
        wuerfel(f"blende{i}", (0.38, 0.16, 0.05), (0, -0.22, hoehe + 0.14), gehaeuse, bevel=0.02)


def ampel_rendern(zustand, ziel, px=176):
    szene_leeren()
    licht_setzen()
    breite_m = px / PX_PRO_METER
    kamera_setzen(breite_m)
    render_setzen(breite_m, px)
    ampel(zustand)
    rendern(os.path.join(ziel, f"ampel_{zustand}.png"))


# ── Aufträge ───────────────────────────────────────────────
def figur_rendern(art, dateiname, ziel, beinphase=0.0, armphase=0.0, px=160):
    szene_leeren()
    licht_setzen()
    breite_m = px / PX_PRO_METER
    kamera_setzen(breite_m)
    render_setzen(breite_m, px)
    figur(art, beinphase, armphase)
    rendern(os.path.join(ziel, dateiname))


def auto_rendern(name, ziel, px=420):
    szene_leeren()
    licht_setzen()
    breite_m = px / PX_PRO_METER
    kamera_setzen(breite_m)
    render_setzen(breite_m, px)
    auto(name)
    rendern(os.path.join(ziel, f"auto_{name}.png"))


def main():
    ziel, nur = argumente()
    if nur == "autos":
        for a in AUTOS:
            auto_rendern(a, ziel)
        return
    if nur == "ampeln":
        for z in ("rot", "gelb", "gruen"):
            ampel_rendern(z, ziel)
        return
    if nur == "neu":
        for a in ("kombi", "transporter", "bus", "oldtimer", "krankenwagen", "feuerwehr"):
            auto_rendern(a, ziel)
        for z in ("rot", "gelb", "gruen"):
            ampel_rendern(z, ziel)
        return
    if nur == "muster":
        figur_rendern("lucia", "lucia_steht.png", ziel)
        figur_rendern("jason", "jason_steht.png", ziel)
        figur_rendern("lucia", "lucia_lauf.png", ziel, beinphase=0.85, armphase=0.7)
        for a in ("cabrio", "streife", "sport"):
            auto_rendern(a, ziel)
        return

    for art in ("lucia", "jason"):
        figur_rendern(art, f"{art}_steht.png", ziel)
        for i in range(8):
            p = math.sin(i / 8 * math.tau)
            figur_rendern(art, f"{art}_lauf{i}.png", ziel, beinphase=p * 0.9, armphase=p * 0.75)
    for a in AUTOS:
        auto_rendern(a, ziel)


main()
