/* ═══════════════════════════════════════════════════════════
   Vice City — Stadtkarte

   Die Karte ist ein Raster aus Kacheln zu je 4 Metern. Sie liegt nicht
   als Datei vor, sondern wird aus den Koordinaten berechnet: derselbe
   Ort ergibt immer dieselbe Kachel. Das spart Speicher und die Stadt
   lässt sich in einer Zeile verändern.

   Gezeichnet wird nur, was gerade im Bild ist — bei 38 Pixeln je Meter
   sind das rund 60 Kacheln pro Bild, das schafft jeder Browser.

     ART.WASSER … ART.GEBAEUDE   Kachelarten
     art(tx, ty)                 Art einer Kachel
     fest(tx, ty)                blockiert sie Figuren und Autos?
     zeichnen(ctx, kamera)       sichtbaren Ausschnitt malen
   ═══════════════════════════════════════════════════════════ */

export const KACHEL = 4;                  // Meter je Kachel
export const BREITE = 210;                // Kacheln in x
export const HOEHE = 190;                 // Kacheln in y

export const ART = {
  WASSER: 0, STRAND: 1, STRASSE: 2, KREUZUNG: 3,
  GEHWEG: 4, PARK: 5, PARKPLATZ: 6, GEBAEUDE: 7, HAFEN: 8
};

/* Immer gleicher Zufall für denselben Ort */
export function streu(x, y, salz = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salz, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* ── Straßenraster ──
   Alle 12 Kacheln (48 m) eine Straße, jede Straße 2 Kacheln breit.
   Daneben je eine Kachel Gehweg, der Rest ist Bebauung. */
const BLOCK = 14;
const STRASSE_BREIT = 2;

const imRaster = t => ((t % BLOCK) + BLOCK) % BLOCK;
const istStrassenBand = t => imRaster(t) < STRASSE_BREIT;
const istGehwegBand = t => imRaster(t) === STRASSE_BREIT || imRaster(t) === BLOCK - 1;

/* Küste: Osten ist Meer, davor Sandstrand */
const STRAND_VON = 186;
const WASSER_VON = 194;

export function art(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= BREITE || ty >= HOEHE) return ART.WASSER;

  /* Hafenbecken im Südwesten */
  if (tx < 26 && ty > HOEHE - 30) return tx < 22 && ty > HOEHE - 26 ? ART.WASSER : ART.HAFEN;

  if (tx >= WASSER_VON) return ART.WASSER;
  if (tx >= STRAND_VON) return ART.STRAND;

  const sx = istStrassenBand(tx), sy = istStrassenBand(ty);
  if (sx && sy) return ART.KREUZUNG;
  if (sx || sy) return ART.STRASSE;
  if (istGehwegBand(tx) || istGehwegBand(ty)) return ART.GEHWEG;

  /* Blockinneres: meist Gebäude, dazwischen Parks und Parkplätze */
  const bx = Math.floor(tx / BLOCK), by = Math.floor(ty / BLOCK);
  const los = streu(bx, by, 7);
  if (los < 0.10) return ART.PARK;
  if (los < 0.18) return ART.PARKPLATZ;

  /* Innenhof: in großen Blöcken bleibt die Mitte frei */
  const ix = imRaster(tx) - STRASSE_BREIT, iy = imRaster(ty) - STRASSE_BREIT;
  const innen = BLOCK - STRASSE_BREIT - 1;
  if (los > 0.72 && ix > 2 && iy > 2 && ix < innen - 3 && iy < innen - 3) return ART.PARKPLATZ;

  return ART.GEBAEUDE;
}

export function fest(tx, ty) {
  const a = art(tx, ty);
  return a === ART.GEBAEUDE || a === ART.WASSER;
}

/* Ein Block besteht aus mehreren Häusern. Die Hausnummer ergibt sich aus
   der Lage im Block — dadurch bekommt jedes Haus eigene Farbe und Höhe,
   und zwischen den Häusern bleiben dunkle Fugen. */
export function hausId(tx, ty) {
  const bx = Math.floor(tx / BLOCK), by = Math.floor(ty / BLOCK);
  const ix = imRaster(tx) - STRASSE_BREIT - 1, iy = imRaster(ty) - STRASSE_BREIT - 1;
  const teile = 2 + Math.floor(streu(bx, by, 29) * 2);       // 2 oder 3 Häuser je Richtung
  const innen = BLOCK - STRASSE_BREIT - 2;
  const hx = Math.min(teile - 1, Math.floor((ix / innen) * teile));
  const hy = Math.min(teile - 1, Math.floor((iy / innen) * teile));
  return { bx, by, hx, hy, ix, iy, innen, teile };
}

function hoeheVon(tx, ty) {
  const h = hausId(tx, ty);
  const mitte = 1 - Math.min(1, Math.hypot(tx - 100, ty - 92) / 115);
  return 0.22 + mitte * 0.78 * (0.45 + streu(h.bx * 7 + h.hx, h.by * 7 + h.hy, 3) * 0.8);
}

/* ── Farben ── */
const FARBE = {
  wasser: "#12305a",
  wasser2: "#17406f",
  strand: "#d9c391",
  strasse: "#31333c",
  gehweg: "#6d6f78",
  park: "#2f6b45",
  parkplatz: "#3c3f4a",
  hafen: "#4a4d57"
};

const DACH = ["#5d4b74", "#4c5d86", "#6e5560", "#4a6a72", "#6b5a45", "#54566b"];

function dachFarbe(bx, by) {
  return DACH[Math.floor(streu(bx, by, 11) * DACH.length)];
}

/* #rrggbb abdunkeln — für die Hauswände unter der Dachkante */
function dunkler(hex, faktor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * faktor);
  const g = Math.round(((n >> 8) & 255) * faktor);
  const b = Math.round((n & 255) * faktor);
  return `rgb(${r},${g},${b})`;
}

/* Eine Kachel malen. px/py ist die linke obere Ecke in Bildpunkten,
   g die Kantenlänge einer Kachel in Bildpunkten. */
function kachelMalen(ctx, tx, ty, px, py, g, zeit) {
  const a = art(tx, ty);

  switch (a) {
    case ART.WASSER: {
      ctx.fillStyle = FARBE.wasser;
      ctx.fillRect(px, py, g + 1, g + 1);
      /* ruhige Wellenlinien */
      const w = Math.sin((tx * 0.7 + ty * 0.4) + zeit * 0.0009) * 0.5 + 0.5;
      ctx.fillStyle = FARBE.wasser2;
      ctx.globalAlpha = 0.25 + w * 0.3;
      ctx.fillRect(px, py + g * 0.32, g + 1, g * 0.16);
      ctx.globalAlpha = 1;
      break;
    }
    case ART.STRAND:
      ctx.fillStyle = FARBE.strand;
      ctx.fillRect(px, py, g + 1, g + 1);
      if (streu(tx, ty, 5) > 0.88) {
        ctx.fillStyle = "rgba(190,168,120,.55)";
        ctx.beginPath();
        ctx.arc(px + g * 0.5, py + g * 0.5, g * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case ART.STRASSE:
    case ART.KREUZUNG: {
      ctx.fillStyle = FARBE.strasse;
      ctx.fillRect(px, py, g + 1, g + 1);
      if (a === ART.STRASSE) {
        ctx.fillStyle = "rgba(235,225,180,.85)";
        const senkrecht = istStrassenBand(tx) && !istStrassenBand(ty);
        const rand = imRaster(senkrecht ? tx : ty);
        if (rand === 1) {               // Mittelstreifen zwischen den Spuren
          if (senkrecht) ctx.fillRect(px - g * 0.03, py + g * 0.2, g * 0.06, g * 0.6);
          else ctx.fillRect(px + g * 0.2, py - g * 0.03, g * 0.6, g * 0.06);
        }
      } else {
        /* Zebrastreifen am Rand der Kreuzung */
        ctx.fillStyle = "rgba(235,232,220,.5)";
        const zebra = 5;
        for (let i = 0; i < zebra; i++) {
          const t = (i + 0.2) / zebra;
          if (imRaster(ty) === 0) ctx.fillRect(px + g * t, py + g * 0.04, g * 0.10, g * 0.16);
          if (imRaster(ty) === STRASSE_BREIT - 1) ctx.fillRect(px + g * t, py + g * 0.80, g * 0.10, g * 0.16);
          if (imRaster(tx) === 0) ctx.fillRect(px + g * 0.04, py + g * t, g * 0.16, g * 0.10);
          if (imRaster(tx) === STRASSE_BREIT - 1) ctx.fillRect(px + g * 0.80, py + g * t, g * 0.16, g * 0.10);
        }
      }
      break;
    }

    case ART.GEHWEG: {
      ctx.fillStyle = FARBE.gehweg;
      ctx.fillRect(px, py, g + 1, g + 1);
      ctx.strokeStyle = "rgba(0,0,0,.14)";
      ctx.lineWidth = Math.max(1, g * 0.02);
      ctx.strokeRect(px + 0.5, py + 0.5, g, g);
      /* Palme oder Laterne */
      const l = streu(tx, ty, 13);
      if (l > 0.93) {
        ctx.fillStyle = "#1f3b2a";
        ctx.beginPath();
        ctx.arc(px + g * 0.5, py + g * 0.5, g * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2f6b45";
        ctx.beginPath();
        ctx.arc(px + g * 0.46, py + g * 0.46, g * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (l > 0.88) {
        ctx.fillStyle = "#23252c";
        ctx.fillRect(px + g * 0.44, py + g * 0.44, g * 0.12, g * 0.12);
      }
      break;
    }

    case ART.PARK: {
      ctx.fillStyle = FARBE.park;
      ctx.fillRect(px, py, g + 1, g + 1);
      const b = streu(tx, ty, 17);
      if (b > 0.45) {
        ctx.fillStyle = "rgba(20,60,40,.85)";
        ctx.beginPath();
        ctx.arc(px + g * (0.3 + b * 0.4), py + g * (0.3 + streu(tx, ty, 19) * 0.4), g * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case ART.PARKPLATZ: {
      ctx.fillStyle = FARBE.parkplatz;
      ctx.fillRect(px, py, g + 1, g + 1);
      ctx.strokeStyle = "rgba(230,230,210,.25)";
      ctx.lineWidth = Math.max(1, g * 0.03);
      ctx.beginPath();
      ctx.moveTo(px + g * 0.5, py + g * 0.1);
      ctx.lineTo(px + g * 0.5, py + g * 0.9);
      ctx.stroke();
      break;
    }

    case ART.HAFEN: {
      ctx.fillStyle = FARBE.hafen;
      ctx.fillRect(px, py, g + 1, g + 1);
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.fillRect(px, py + g * 0.46, g + 1, g * 0.08);
      break;
    }

    default: {                                  // Gebäude
      const id = hausId(tx, ty);
      const h = hoeheVon(tx, ty);
      ctx.fillStyle = dachFarbe(id.bx * 9 + id.hx, id.by * 9 + id.hy);
      ctx.fillRect(px, py, g + 1, g + 1);

      /* Helligkeit nach Haushöhe: hohe Häuser fangen mehr Licht */
      ctx.fillStyle = `rgba(255,255,255,${0.03 + h * 0.10})`;
      ctx.fillRect(px, py, g + 1, g + 1);

      /* Fugen zwischen den Häusern eines Blocks */
      const kante = (a, b) => Math.floor(((a / id.innen) * id.teile)) !== Math.floor((((a + b) / id.innen) * id.teile));
      ctx.fillStyle = "rgba(8,10,22,.55)";
      if (kante(id.ix, 1)) ctx.fillRect(px + g * 0.88, py, g * 0.14, g + 1);
      if (kante(id.iy, 1)) ctx.fillRect(px, py + g * 0.88, g + 1, g * 0.14);

      const d = streu(tx, ty, 23);
      if (d > 0.86) {                            // Aufbau auf dem Dach
        ctx.fillStyle = "rgba(0,0,0,.26)";
        ctx.fillRect(px + g * 0.26, py + g * 0.26, g * 0.46, g * 0.46);
        ctx.fillStyle = "rgba(255,255,255,.07)";
        ctx.fillRect(px + g * 0.26, py + g * 0.26, g * 0.46, g * 0.12);
      } else if (d < 0.12) {                     // Lichtkuppel
        ctx.fillStyle = "rgba(180,220,255,.18)";
        ctx.fillRect(px + g * 0.3, py + g * 0.3, g * 0.4, g * 0.4);
      } else if (d > 0.62 && d < 0.68) {         // Klimatechnik
        ctx.fillStyle = "rgba(0,0,0,.2)";
        ctx.fillRect(px + g * 0.55, py + g * 0.18, g * 0.24, g * 0.2);
      }
    }
  }
}

/* Schatten der Gebäude: ein Versatz nach unten rechts, gemalt über die
   Nachbarkachel — dadurch wirkt die Stadt räumlich, ohne echtes 3D. */
function schattenMalen(ctx, tx, ty, px, py, g) {
  if (art(tx, ty) !== ART.GEBAEUDE) return;
  const rechtsFrei = art(tx + 1, ty) !== ART.GEBAEUDE;
  const untenFrei = art(tx, ty + 1) !== ART.GEBAEUDE;
  if (!rechtsFrei && !untenFrei) return;

  const id = hausId(tx, ty);
  const h = hoeheVon(tx, ty);
  const wand = g * 0.42 * h;                       // sichtbare Hauswand
  const schatten = g * 0.30 * h;                   // Schatten daneben
  const dach = dachFarbe(id.bx * 9 + id.hx, id.by * 9 + id.hy);

  ctx.fillStyle = "rgba(6,10,24,.30)";
  if (rechtsFrei) ctx.fillRect(px + g + wand, py + wand * 0.4, schatten, g);
  if (untenFrei) ctx.fillRect(px + wand * 0.4, py + g + wand, g, schatten);

  ctx.fillStyle = dunkler(dach, 0.62);
  if (rechtsFrei) ctx.fillRect(px + g, py, wand, g);
  ctx.fillStyle = dunkler(dach, 0.48);
  if (untenFrei) ctx.fillRect(px, py + g, g + (rechtsFrei ? wand : 0), wand);
}

export function zeichnen(ctx, kamera, zeit) {
  const g = KACHEL * kamera.zoom;                       // Kachel in Bildpunkten
  const halbB = kamera.breite / 2, halbH = kamera.hoehe / 2;
  const linksM = kamera.x - halbB / kamera.zoom;
  const obenM = kamera.y - halbH / kamera.zoom;
  const tx0 = Math.floor(linksM / KACHEL) - 1;
  const ty0 = Math.floor(obenM / KACHEL) - 1;
  const spalten = Math.ceil(kamera.breite / g) + 3;
  const zeilen = Math.ceil(kamera.hoehe / g) + 3;

  for (let j = 0; j < zeilen; j++) {
    for (let i = 0; i < spalten; i++) {
      const tx = tx0 + i, ty = ty0 + j;
      const px = (tx * KACHEL - linksM) * kamera.zoom;
      const py = (ty * KACHEL - obenM) * kamera.zoom;
      kachelMalen(ctx, tx, ty, px, py, g, zeit);
    }
  }
  for (let j = 0; j < zeilen; j++) {
    for (let i = 0; i < spalten; i++) {
      const tx = tx0 + i, ty = ty0 + j;
      const px = (tx * KACHEL - linksM) * kamera.zoom;
      const py = (ty * KACHEL - obenM) * kamera.zoom;
      schattenMalen(ctx, tx, ty, px, py, g);
    }
  }
}

/* ── Hilfen für Bewegung und Aufbau ── */
export const inMeter = t => t * KACHEL;
export const inKachel = m => Math.floor(m / KACHEL);

export function festAnPunkt(mx, my) {
  return fest(inKachel(mx), inKachel(my));
}

/* Startplatz: der nächste Gehweg an einer Straße, ausgehend von der
   Stadtmitte. Wird gesucht statt fest eingetragen — so stimmt er auch,
   wenn sich das Straßenraster ändert. */
function startSuchen(mx = 100, my = 92) {
  for (let r = 0; r < 40; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const tx = mx + dx, ty = my + dy;
        if (art(tx, ty) !== ART.GEHWEG) continue;
        const amRand = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .some(([ax, ay]) => art(tx + ax, ty + ay) === ART.STRASSE);
        if (amRand) return { x: inMeter(tx) + KACHEL / 2, y: inMeter(ty) + KACHEL / 2 };
      }
    }
  }
  return { x: inMeter(mx), y: inMeter(my) };
}

export const START = startSuchen();

/* Freien Platz in der Nähe suchen (für Autos, Figuren, Missionen) */
export function freierPunkt(nahX, nahY, arten, radius = 40) {
  for (let versuch = 0; versuch < 400; versuch++) {
    const w = streu(versuch, 1, 31) * Math.PI * 2;
    const r = streu(versuch, 2, 37) * radius;
    const x = nahX + Math.cos(w) * r, y = nahY + Math.sin(w) * r;
    const a = art(inKachel(x), inKachel(y));
    if (arten.includes(a)) return { x, y };
  }
  return { x: nahX, y: nahY };
}
