/* ═══════════════════════════════════════════════════════════
   Vice City — Stadtkarte

   Die Karte ist ein Raster aus Kacheln zu je 4 Metern. Sie liegt nicht
   als Datei vor, sondern wird aus den Koordinaten berechnet: derselbe
   Ort ergibt immer dieselbe Kachel. Das spart Speicher und die Stadt
   lässt sich in einer Zeile verändern.

   Vier Gegenden, damit nicht überall dasselbe steht:
     innenstadt  Hochhäuser, Glasdächer, Hubschrauberplätze
     strand      Hotels mit Dachpools, Palmen, Sonnenschirme
     hafen       flache Lagerhallen, Container
     wohnen      kleinere Häuser, Gärten, Pools

   Jede vierte Straße ist eine vierspurige Avenue mit Mittelinsel, an den
   Kreuzungen stehen Ampeln, die im Takt umschalten.

     art(tx, ty)              Art einer Kachel
     fest(tx, ty)             blockiert sie Figuren und Autos?
     zeichnen(ctx, kamera)    sichtbaren Ausschnitt malen
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
   Alle 14 Kacheln eine Straße. Jede vierte ist doppelt so breit. */
const BLOCK = 14;
const SCHMAL = 2;
const AVENUE = 4;

const imRaster = t => ((t % BLOCK) + BLOCK) % BLOCK;
const blockNr = t => Math.floor(t / BLOCK);
export const bandBreite = t => (((blockNr(t) % 4) + 4) % 4 === 0 ? AVENUE : SCHMAL);
const istStrassenBand = t => imRaster(t) < bandBreite(t);
const istGehwegBand = t => imRaster(t) === bandBreite(t) || imRaster(t) === BLOCK - 1;

/* Küste: Osten ist Meer, davor Sandstrand */
const STRAND_VON = 186;
const WASSER_VON = 194;

export function bezirk(tx, ty) {
  if (tx < 30 && ty > HOEHE - 40) return "hafen";
  if (tx > 160) return "strand";
  if (Math.hypot(tx - 104, ty - 92) < 42) return "innenstadt";
  return "wohnen";
}

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

  const bx = blockNr(tx), by = blockNr(ty);
  const los = streu(bx, by, 7);
  const geg = bezirk(tx, ty);

  if (geg === "wohnen" && los < 0.16) return ART.PARK;
  if (geg !== "wohnen" && los < 0.09) return ART.PARK;
  if (los < 0.20) return ART.PARKPLATZ;

  /* Innenhof: in manchen Blöcken bleibt die Mitte frei */
  const w = bandBreite(tx), h = bandBreite(ty);
  const ix = imRaster(tx) - w, iy = imRaster(ty) - h;
  const innenX = BLOCK - w - 1, innenY = BLOCK - h - 1;
  if (los > 0.74 && ix > 2 && iy > 2 && ix < innenX - 3 && iy < innenY - 3) {
    return geg === "wohnen" ? ART.PARK : ART.PARKPLATZ;
  }

  return ART.GEBAEUDE;
}

export function fest(tx, ty) {
  const a = art(tx, ty);
  return a === ART.GEBAEUDE || a === ART.WASSER;
}

/* Ein Block besteht aus mehreren Häusern: in der Innenstadt wenige große,
   im Wohngebiet viele kleine. */
export function hausId(tx, ty) {
  const bx = blockNr(tx), by = blockNr(ty);
  const geg = bezirk(tx, ty);
  const w = bandBreite(tx), h = bandBreite(ty);
  const ix = Math.max(0, imRaster(tx) - w - 1), iy = Math.max(0, imRaster(ty) - h - 1);
  const innenX = Math.max(1, BLOCK - w - 2), innenY = Math.max(1, BLOCK - h - 2);
  const teile = geg === "wohnen"
    ? 2 + Math.floor(streu(bx, by, 29) * 3)
    : 1 + Math.floor(streu(bx, by, 29) * 2);
  const hx = Math.min(teile - 1, Math.floor((ix / innenX) * teile));
  const hy = Math.min(teile - 1, Math.floor((iy / innenY) * teile));
  return { bx, by, hx, hy, ix, iy, innenX, innenY, teile, geg };
}

/* Höhe nur für die Optik: Innenstadt hoch, Hafen flach */
function hoeheVon(tx, ty) {
  const id = hausId(tx, ty);
  const zufall = streu(id.bx * 7 + id.hx, id.by * 7 + id.hy, 3);
  if (id.geg === "innenstadt") {
    const mitte = 1 - Math.min(1, Math.hypot(tx - 104, ty - 92) / 46);
    return 0.42 + mitte * 0.5 + zufall * 0.25;
  }
  if (id.geg === "hafen") return 0.16 + zufall * 0.16;
  if (id.geg === "strand") return 0.28 + zufall * 0.45;
  return 0.18 + zufall * 0.3;
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

const DAECHER = {
  innenstadt: ["#3a4463", "#44425e", "#2f3b58", "#4a4a6b", "#353f5c"],
  strand: ["#c9a893", "#d7bda4", "#bf9d8c", "#cdb3a6", "#c2a288"],
  hafen: ["#5a5f63", "#4f565c", "#63635c", "#555b60"],
  wohnen: ["#8a6a63", "#7a6b84", "#6f7f86", "#87775c", "#7d6672", "#6d7a6a"]
};

function dachFarbe(id) {
  const liste = DAECHER[id.geg] || DAECHER.wohnen;
  return liste[Math.floor(streu(id.bx * 9 + id.hx, id.by * 9 + id.hy, 11) * liste.length)];
}

function dunkler(hex, faktor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * faktor);
  const g = Math.round(((n >> 8) & 255) * faktor);
  const b = Math.round((n & 255) * faktor);
  return `rgb(${r},${g},${b})`;
}

/* ── Kacheln malen ── */
function strasseMalen(ctx, tx, ty, px, py, g, a) {
  ctx.fillStyle = FARBE.strasse;
  ctx.fillRect(px, py, g + 1, g + 1);

  if (a === ART.KREUZUNG) {
    ctx.fillStyle = "rgba(236,232,220,.42)";
    const wx = bandBreite(tx), wy = bandBreite(ty);
    for (let i = 0; i < 4; i++) {
      const t = (i + 0.25) / 4;
      if (imRaster(ty) === 0) ctx.fillRect(px + g * t, py + g * 0.06, g * 0.11, g * 0.2);
      if (imRaster(ty) === wy - 1) ctx.fillRect(px + g * t, py + g * 0.74, g * 0.11, g * 0.2);
      if (imRaster(tx) === 0) ctx.fillRect(px + g * 0.06, py + g * t, g * 0.2, g * 0.11);
      if (imRaster(tx) === wx - 1) ctx.fillRect(px + g * 0.74, py + g * t, g * 0.2, g * 0.11);
    }
    return;
  }

  const senkrecht = istStrassenBand(tx) && !istStrassenBand(ty);
  const breite = bandBreite(senkrecht ? tx : ty);
  const spur = imRaster(senkrecht ? tx : ty);

  if (breite === AVENUE) {
    if (spur === 1) {                                  // begrünte Mittelinsel
      ctx.fillStyle = "rgba(74,104,80,.95)";
      if (senkrecht) ctx.fillRect(px + g * 0.74, py, g * 0.52, g + 1);
      else ctx.fillRect(px, py + g * 0.74, g + 1, g * 0.52);
    } else if (spur === 0 || spur === 3) {             // gestrichelte Spurlinien
      ctx.fillStyle = "rgba(235,225,180,.5)";
      const seite = spur === 0 ? 0.98 : 0.02;
      if (senkrecht) {
        ctx.fillRect(px + g * seite - g * 0.02, py + g * 0.1, g * 0.05, g * 0.34);
        ctx.fillRect(px + g * seite - g * 0.02, py + g * 0.58, g * 0.05, g * 0.34);
      } else {
        ctx.fillRect(px + g * 0.1, py + g * seite - g * 0.02, g * 0.34, g * 0.05);
        ctx.fillRect(px + g * 0.58, py + g * seite - g * 0.02, g * 0.34, g * 0.05);
      }
    }
  } else if (spur === 1) {                             // schmale Straße
    ctx.fillStyle = "rgba(235,225,180,.85)";
    if (senkrecht) ctx.fillRect(px - g * 0.03, py + g * 0.2, g * 0.06, g * 0.6);
    else ctx.fillRect(px + g * 0.2, py - g * 0.03, g * 0.6, g * 0.06);
  }
}

function gehwegMalen(ctx, tx, ty, px, py, g, geg) {
  ctx.fillStyle = FARBE.gehweg;
  ctx.fillRect(px, py, g + 1, g + 1);
  ctx.strokeStyle = "rgba(0,0,0,.14)";
  ctx.lineWidth = Math.max(1, g * 0.02);
  ctx.strokeRect(px + 0.5, py + 0.5, g, g);

  const l = streu(tx, ty, 13);
  const palmen = geg === "strand" ? 0.74 : 0.92;
  if (l > palmen) {                                    // Palme mit Schatten
    ctx.fillStyle = "rgba(8,14,26,.3)";
    ctx.beginPath();
    ctx.arc(px + g * 0.57, py + g * 0.58, g * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f3b2a";
    ctx.beginPath();
    ctx.arc(px + g * 0.5, py + g * 0.5, g * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2f6b45";
    ctx.beginPath();
    ctx.arc(px + g * 0.45, py + g * 0.45, g * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (l > 0.86) {                               // Laterne
    ctx.fillStyle = "#23252c";
    ctx.fillRect(px + g * 0.44, py + g * 0.44, g * 0.12, g * 0.12);
  } else if (l < 0.05) {                               // Telefonzelle
    ctx.fillStyle = "#2a5fa8";
    ctx.fillRect(px + g * 0.34, py + g * 0.34, g * 0.3, g * 0.34);
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.fillRect(px + g * 0.38, py + g * 0.38, g * 0.22, g * 0.12);
  }
}

/* Ampeln an den Ecken der Kreuzung, im Takt umschaltend */
function ampelMalen(ctx, tx, ty, px, py, g, zeit) {
  const takt = (zeit / 1000 + streu(blockNr(tx), blockNr(ty), 53) * 12) % 12;
  ctx.fillStyle = "#1b1d24";
  ctx.fillRect(px + g * 0.34, py + g * 0.34, g * 0.32, g * 0.32);
  ctx.fillStyle = takt < 5.5 ? "#3fdc7a" : "#ff4a55";
  ctx.beginPath();
  ctx.arc(px + g * 0.5, py + g * 0.5, g * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function gebaeudeMalen(ctx, tx, ty, px, py, g) {
  const id = hausId(tx, ty);
  const h = hoeheVon(tx, ty);
  const dach = dachFarbe(id);
  ctx.fillStyle = dach;
  ctx.fillRect(px, py, g + 1, g + 1);
  ctx.fillStyle = `rgba(255,255,255,${0.02 + h * 0.09})`;
  ctx.fillRect(px, py, g + 1, g + 1);

  /* Fugen zwischen den Häusern eines Blocks */
  const kante = (a, innen) => Math.floor((a / innen) * id.teile) !== Math.floor(((a + 1) / innen) * id.teile);
  ctx.fillStyle = "rgba(8,10,22,.5)";
  if (kante(id.ix, id.innenX)) ctx.fillRect(px + g * 0.88, py, g * 0.14, g + 1);
  if (kante(id.iy, id.innenY)) ctx.fillRect(px, py + g * 0.88, g + 1, g * 0.14);

  const d = streu(tx, ty, 23);
  /* Große Aufbauten gehören dem ganzen Haus, nicht jeder Kachel:
     sie erscheinen nur auf der Mittelkachel des Hauses. */
  const mitteX = Math.floor((id.hx + 0.5) * id.innenX / id.teile);
  const mitteY = Math.floor((id.hy + 0.5) * id.innenY / id.teile);
  const hausMitte = id.ix === mitteX && id.iy === mitteY;
  const hausLos = streu(id.bx * 9 + id.hx, id.by * 9 + id.hy, 71);

  if (id.geg === "innenstadt") {
    if (hausMitte && hausLos > 0.62) {                 // Hubschrauberplatz
      ctx.strokeStyle = "rgba(240,240,230,.5)";
      ctx.lineWidth = Math.max(1, g * 0.05);
      ctx.beginPath();
      ctx.arc(px + g * 0.5, py + g * 0.5, g * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(240,240,230,.5)";
      ctx.fillRect(px + g * 0.41, py + g * 0.32, g * 0.06, g * 0.36);
      ctx.fillRect(px + g * 0.53, py + g * 0.32, g * 0.06, g * 0.36);
      ctx.fillRect(px + g * 0.41, py + g * 0.47, g * 0.18, g * 0.06);
    } else if (d > 0.62) {                             // Glasdach
      ctx.fillStyle = "rgba(150,200,255,.12)";
      ctx.fillRect(px + g * 0.18, py + g * 0.18, g * 0.64, g * 0.64);
    } else if (d < 0.2) {                              // Technikaufbau
      ctx.fillStyle = "rgba(0,0,0,.3)";
      ctx.fillRect(px + g * 0.3, py + g * 0.28, g * 0.4, g * 0.3);
    }
  } else if (id.geg === "strand") {
    if (hausMitte && hausLos > 0.5) {                  // Dachpool
      ctx.fillStyle = "#2f8fd0";
      ctx.fillRect(px + g * 0.24, py + g * 0.28, g * 0.5, g * 0.4);
      ctx.fillStyle = "rgba(255,255,255,.3)";
      ctx.fillRect(px + g * 0.24, py + g * 0.28, g * 0.5, g * 0.08);
    } else if (d < 0.22) {                             // Sonnenschirme
      ctx.fillStyle = "rgba(240,120,140,.8)";
      ctx.beginPath();
      ctx.arc(px + g * 0.35, py + g * 0.4, g * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + g * 0.66, py + g * 0.62, g * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id.geg === "hafen") {
    ctx.fillStyle = "rgba(0,0,0,.12)";                 // Wellblech
    for (let i = 0; i < 4; i++) ctx.fillRect(px, py + g * (0.12 + i * 0.22), g + 1, g * 0.07);
    if (d > 0.8) {
      ctx.fillStyle = ["#c0533f", "#2f6f8f", "#c9a23a"][Math.floor(d * 100) % 3];
      ctx.fillRect(px + g * 0.2, py + g * 0.3, g * 0.6, g * 0.3);
    }
  } else {
    if (hausMitte && hausLos > 0.82) {                 // Gartenpool
      ctx.fillStyle = "#2f8fd0";
      ctx.fillRect(px + g * 0.3, py + g * 0.34, g * 0.4, g * 0.3);
    } else if (d < 0.18) {                             // Dachfenster
      ctx.fillStyle = "rgba(180,220,255,.18)";
      ctx.fillRect(px + g * 0.32, py + g * 0.32, g * 0.36, g * 0.36);
    } else if (d > 0.62 && d < 0.68) {
      ctx.fillStyle = "rgba(0,0,0,.2)";
      ctx.fillRect(px + g * 0.55, py + g * 0.18, g * 0.24, g * 0.2);
    }
  }
}

function kachelMalen(ctx, tx, ty, px, py, g, zeit) {
  const a = art(tx, ty);
  const geg = bezirk(tx, ty);

  switch (a) {
    case ART.WASSER: {
      ctx.fillStyle = FARBE.wasser;
      ctx.fillRect(px, py, g + 1, g + 1);
      const w = Math.sin((tx * 0.7 + ty * 0.4) + zeit * 0.0009) * 0.5 + 0.5;
      ctx.fillStyle = FARBE.wasser2;
      ctx.globalAlpha = 0.25 + w * 0.3;
      ctx.fillRect(px, py + g * 0.32, g + 1, g * 0.16);
      ctx.globalAlpha = 1;
      break;
    }

    case ART.STRAND: {
      ctx.fillStyle = FARBE.strand;
      ctx.fillRect(px, py, g + 1, g + 1);
      const s = streu(tx, ty, 5);
      if (s > 0.9) {
        ctx.fillStyle = "rgba(240,120,140,.75)";       // Sonnenschirm
        ctx.beginPath();
        ctx.arc(px + g * 0.5, py + g * 0.5, g * 0.16, 0, Math.PI * 2);
        ctx.fill();
      } else if (s < 0.08) {
        ctx.fillStyle = "rgba(190,168,120,.55)";
        ctx.beginPath();
        ctx.arc(px + g * 0.5, py + g * 0.5, g * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case ART.STRASSE:
    case ART.KREUZUNG:
      strasseMalen(ctx, tx, ty, px, py, g, a);
      break;

    case ART.GEHWEG:
      gehwegMalen(ctx, tx, ty, px, py, g, geg);
      if (imRaster(tx) === bandBreite(tx) && imRaster(ty) === bandBreite(ty)) {
        ampelMalen(ctx, tx, ty, px, py, g, zeit);
      }
      break;

    case ART.PARK: {
      ctx.fillStyle = FARBE.park;
      ctx.fillRect(px, py, g + 1, g + 1);
      const b = streu(tx, ty, 17);
      if (b > 0.5) {
        ctx.fillStyle = "rgba(20,60,40,.85)";
        ctx.beginPath();
        ctx.arc(px + g * (0.3 + b * 0.4), py + g * (0.3 + streu(tx, ty, 19) * 0.4), g * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else if (b < 0.12) {
        ctx.fillStyle = "#3f7d55";                     // Weg durch den Park
        ctx.fillRect(px, py + g * 0.4, g + 1, g * 0.2);
      }
      break;
    }

    case ART.PARKPLATZ:
      ctx.fillStyle = FARBE.parkplatz;
      ctx.fillRect(px, py, g + 1, g + 1);
      ctx.strokeStyle = "rgba(230,230,210,.22)";
      ctx.lineWidth = Math.max(1, g * 0.03);
      ctx.beginPath();
      ctx.moveTo(px + g * 0.5, py + g * 0.1);
      ctx.lineTo(px + g * 0.5, py + g * 0.9);
      ctx.stroke();
      break;

    case ART.HAFEN: {
      ctx.fillStyle = FARBE.hafen;
      ctx.fillRect(px, py, g + 1, g + 1);
      const c = streu(tx, ty, 61);
      if (c > 0.8) {                                   // Container
        ctx.fillStyle = ["#c0533f", "#2f6f8f", "#c9a23a", "#4a7d52"][Math.floor(c * 100) % 4];
        ctx.fillRect(px + g * 0.12, py + g * 0.2, g * 0.76, g * 0.5);
        ctx.fillStyle = "rgba(255,255,255,.12)";
        ctx.fillRect(px + g * 0.12, py + g * 0.2, g * 0.76, g * 0.12);
      } else {
        ctx.fillStyle = "rgba(0,0,0,.16)";
        ctx.fillRect(px, py + g * 0.46, g + 1, g * 0.08);
      }
      break;
    }

    default:
      gebaeudeMalen(ctx, tx, ty, px, py, g);
  }
}

/* Wände und Schatten: ein Versatz nach unten rechts, gemalt über die
   Nachbarkachel — dadurch wirkt die Stadt räumlich, ohne echtes 3D. */
function wandMalen(ctx, tx, ty, px, py, g) {
  if (art(tx, ty) !== ART.GEBAEUDE) return;
  const rechtsFrei = art(tx + 1, ty) !== ART.GEBAEUDE;
  const untenFrei = art(tx, ty + 1) !== ART.GEBAEUDE;
  if (!rechtsFrei && !untenFrei) return;

  const id = hausId(tx, ty);
  const h = hoeheVon(tx, ty);
  const wand = g * 0.42 * h;
  const schatten = g * 0.3 * h;
  const dach = dachFarbe(id);

  ctx.fillStyle = "rgba(6,10,24,.3)";
  if (rechtsFrei) ctx.fillRect(px + g + wand, py + wand * 0.4, schatten, g);
  if (untenFrei) ctx.fillRect(px + wand * 0.4, py + g + wand, g, schatten);

  if (rechtsFrei) {
    ctx.fillStyle = dunkler(dach, 0.62);
    ctx.fillRect(px + g, py, wand, g);
    ctx.fillStyle = "rgba(255,240,190,.16)";           // Fensterreihen
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(px + g + wand * (0.2 + i * 0.26), py + g * 0.18, wand * 0.13, g * 0.6);
    }
  }
  if (untenFrei) {
    ctx.fillStyle = dunkler(dach, 0.48);
    ctx.fillRect(px, py + g, g + (rechtsFrei ? wand : 0), wand);
    ctx.fillStyle = "rgba(255,240,190,.13)";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(px + g * 0.18, py + g + wand * (0.2 + i * 0.26), g * 0.6, wand * 0.13);
    }
  }
}

export function zeichnen(ctx, kamera, zeit) {
  const g = KACHEL * kamera.zoom;
  const linksM = kamera.x - kamera.breite / 2 / kamera.zoom;
  const obenM = kamera.y - kamera.hoehe / 2 / kamera.zoom;
  const tx0 = Math.floor(linksM / KACHEL) - 1;
  const ty0 = Math.floor(obenM / KACHEL) - 1;
  const spalten = Math.ceil(kamera.breite / g) + 3;
  const zeilen = Math.ceil(kamera.hoehe / g) + 3;

  for (let j = 0; j < zeilen; j++) {
    for (let i = 0; i < spalten; i++) {
      const tx = tx0 + i, ty = ty0 + j;
      kachelMalen(ctx, tx, ty, (tx * KACHEL - linksM) * kamera.zoom,
                  (ty * KACHEL - obenM) * kamera.zoom, g, zeit);
    }
  }
  for (let j = 0; j < zeilen; j++) {
    for (let i = 0; i < spalten; i++) {
      const tx = tx0 + i, ty = ty0 + j;
      wandMalen(ctx, tx, ty, (tx * KACHEL - linksM) * kamera.zoom,
                (ty * KACHEL - obenM) * kamera.zoom, g);
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
