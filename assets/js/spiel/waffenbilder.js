/* ═══════════════════════════════════════════════════════════
   Waffen zeichnen

   Vier Waffen, von oben gesehen, mit der Mündung nach oben — so wie
   alle anderen Sprites auch. Gezeichnet wird im Browser auf eine
   Leinwand, nicht als Datei geladen: keine zusätzliche Ladezeit, und es
   ist garantiert selbst gemacht.

   Gemalt wird mit 256 Bildpunkten je Meter. Beim Zeichnen im Spiel gibt
   `malen()` die gewünschte Breite in Metern vor, die Auflösung spielt
   also keine Rolle — sie sorgt nur dafür, dass beim Heranzoomen nichts
   ausfranst.
   ═══════════════════════════════════════════════════════════ */

import { setzen } from "./bilder.js";

const AUFL = 256;                       // Bildpunkte je Meter

/* Maße in Metern: quer × längs */
export const MASSE = {
  pistole: { breit: 0.15, lang: 0.40 },
  mp:      { breit: 0.17, lang: 0.52 },
  pumpgun: { breit: 0.16, lang: 0.92 },
  ak:      { breit: 0.19, lang: 0.98 }
};

const METALL = "#474e5b";
const METALL_HELL = "#69717f";
const METALL_DUNKEL = "#20242b";
const HOLZ = "#7a4a28";
const HOLZ_HELL = "#96603a";

function neu(art) {
  const m = MASSE[art];
  const c = document.createElement("canvas");
  c.width = Math.round(m.breit * AUFL);
  c.height = Math.round(m.lang * AUFL);
  return { c, ctx: c.getContext("2d"), b: c.width, h: c.height };
}

/* Hilfen: Maße relativ zur Leinwand, damit die Formen mitwachsen */
function kasten(ctx, x, y, b, h, farbe, radius = 0) {
  ctx.fillStyle = farbe;
  ctx.beginPath();
  ctx.roundRect(x, y, b, h, radius);
  ctx.fill();
}

function umriss(ctx, x, y, b, h, radius = 0) {
  ctx.strokeStyle = "rgba(8,10,16,.85)";
  ctx.lineWidth = Math.max(1.5, b * 0.08);
  ctx.beginPath();
  ctx.roundRect(x, y, b, h, radius);
  ctx.stroke();
}

const ZEICHNER = {
  /* Pistole: Schlitten, Korn, Griff hinten */
  pistole({ ctx, b, h }) {
    const mitte = b / 2;
    kasten(ctx, mitte - b * 0.22, h * 0.02, b * 0.44, h * 0.62, METALL, b * 0.1);
    umriss(ctx, mitte - b * 0.22, h * 0.02, b * 0.44, h * 0.62, b * 0.1);
    kasten(ctx, mitte - b * 0.08, h * 0.03, b * 0.16, h * 0.5, METALL_HELL, b * 0.05);
    kasten(ctx, mitte - b * 0.07, 0, b * 0.14, h * 0.05, METALL_DUNKEL, b * 0.04);  // Mündung
    kasten(ctx, mitte - b * 0.3, h * 0.55, b * 0.6, h * 0.42, METALL_DUNKEL, b * 0.16);
    umriss(ctx, mitte - b * 0.3, h * 0.55, b * 0.6, h * 0.42, b * 0.16);
    /* Griffriffelung */
    ctx.fillStyle = "rgba(255,255,255,.08)";
    for (let k = 0; k < 4; k++) ctx.fillRect(mitte - b * 0.24, h * (0.62 + k * 0.07), b * 0.48, h * 0.02);
  },

  /* Micro-MP: kurzer Lauf, Magazin seitlich, Schulterstütze */
  mp({ ctx, b, h }) {
    const mitte = b / 2;
    kasten(ctx, mitte - b * 0.1, 0, b * 0.2, h * 0.3, METALL_DUNKEL, b * 0.06);      // Lauf
    kasten(ctx, mitte - b * 0.26, h * 0.22, b * 0.52, h * 0.46, METALL, b * 0.08);   // Gehäuse
    umriss(ctx, mitte - b * 0.26, h * 0.22, b * 0.52, h * 0.46, b * 0.08);
    kasten(ctx, mitte - b * 0.12, h * 0.25, b * 0.24, h * 0.36, METALL_HELL, b * 0.05);
    kasten(ctx, mitte + b * 0.2, h * 0.36, b * 0.22, h * 0.22, METALL_DUNKEL, b * 0.05); // Magazin
    kasten(ctx, mitte - b * 0.2, h * 0.66, b * 0.4, h * 0.3, METALL_DUNKEL, b * 0.1);    // Griff
    umriss(ctx, mitte - b * 0.2, h * 0.66, b * 0.4, h * 0.3, b * 0.1);
    kasten(ctx, mitte - b * 0.08, h * 0.9, b * 0.16, h * 0.1, METALL, b * 0.04);         // Stütze
  },

  /* Pumpgun: langer Lauf, Vorderschaft und Kolben aus Holz */
  pumpgun({ ctx, b, h }) {
    const mitte = b / 2;
    kasten(ctx, mitte - b * 0.13, 0, b * 0.26, h * 0.52, METALL_DUNKEL, b * 0.08);   // Lauf
    kasten(ctx, mitte - b * 0.05, h * 0.02, b * 0.1, h * 0.46, METALL_HELL, b * 0.03);
    kasten(ctx, mitte - b * 0.24, h * 0.3, b * 0.48, h * 0.14, HOLZ, b * 0.07);      // Pumpe
    umriss(ctx, mitte - b * 0.24, h * 0.3, b * 0.48, h * 0.14, b * 0.07);
    kasten(ctx, mitte - b * 0.22, h * 0.5, b * 0.44, h * 0.22, METALL, b * 0.06);    // Gehäuse
    umriss(ctx, mitte - b * 0.22, h * 0.5, b * 0.44, h * 0.22, b * 0.06);
    kasten(ctx, mitte - b * 0.26, h * 0.7, b * 0.52, h * 0.3, HOLZ, b * 0.12);       // Kolben
    umriss(ctx, mitte - b * 0.26, h * 0.7, b * 0.52, h * 0.3, b * 0.12);
    ctx.fillStyle = HOLZ_HELL;
    ctx.fillRect(mitte - b * 0.08, h * 0.72, b * 0.16, h * 0.24);
  },

  /* AK: Lauf, Holzvorderschaft, gebogenes Magazin, Kolben */
  ak({ ctx, b, h }) {
    const mitte = b / 2;
    kasten(ctx, mitte - b * 0.1, 0, b * 0.2, h * 0.42, METALL_DUNKEL, b * 0.05);     // Lauf
    kasten(ctx, mitte - b * 0.14, h * 0.02, b * 0.08, h * 0.08, METALL_HELL, b * 0.03); // Korn
    kasten(ctx, mitte - b * 0.22, h * 0.24, b * 0.44, h * 0.18, HOLZ, b * 0.06);     // Vorderschaft
    umriss(ctx, mitte - b * 0.22, h * 0.24, b * 0.44, h * 0.18, b * 0.06);
    kasten(ctx, mitte - b * 0.24, h * 0.42, b * 0.48, h * 0.26, METALL, b * 0.06);   // Gehäuse
    umriss(ctx, mitte - b * 0.24, h * 0.42, b * 0.48, h * 0.26, b * 0.06);
    /* Krummes Magazin: drei Stufen nach außen */
    ctx.fillStyle = METALL_DUNKEL;
    ctx.beginPath();
    ctx.moveTo(mitte + b * 0.2, h * 0.46);
    ctx.lineTo(mitte + b * 0.46, h * 0.5);
    ctx.lineTo(mitte + b * 0.44, h * 0.62);
    ctx.lineTo(mitte + b * 0.18, h * 0.6);
    ctx.closePath();
    ctx.fill();
    kasten(ctx, mitte - b * 0.2, h * 0.66, b * 0.4, h * 0.34, HOLZ, b * 0.1);        // Kolben
    umriss(ctx, mitte - b * 0.2, h * 0.66, b * 0.4, h * 0.34, b * 0.1);
    ctx.fillStyle = HOLZ_HELL;
    ctx.fillRect(mitte - b * 0.06, h * 0.68, b * 0.12, h * 0.3);
  }
};

const fertige = new Map();

export function bauen() {
  if (fertige.size) return;
  for (const art of Object.keys(ZEICHNER)) {
    const feld = neu(art);
    ZEICHNER[art](feld);
    fertige.set(art, feld.c);
    setzen("waffe_" + art, feld.c);
  }
}

/* ── Seitenansicht für den Laden und die Anzeige ──
   Von oben erkennt man eine Waffe kaum wieder; im Regal soll sie aber
   aussehen wie im Schaufenster. Deshalb gibt es zu jeder Waffe eine
   zweite Zeichnung von der Seite, Lauf nach rechts. */
const SEITE_B = 360, SEITE_H = 150;

function form(ctx, punkte, farbe, strich = true) {
  ctx.beginPath();
  punkte.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = farbe;
  ctx.fill();
  if (strich) {
    ctx.strokeStyle = "rgba(6,8,14,.9)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function balken(ctx, x, y, b, h, farbe, r = 4) {
  ctx.beginPath();
  ctx.roundRect(x, y, b, h, r);
  ctx.fillStyle = farbe;
  ctx.fill();
  ctx.strokeStyle = "rgba(6,8,14,.9)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

const SEITE = {
  pistole(ctx) {
    balken(ctx, 60, 52, 200, 34, METALL);                    // Schlitten
    balken(ctx, 250, 58, 24, 20, METALL_DUNKEL, 3);          // Mündung
    form(ctx, [[86, 86], [150, 86], [136, 148], [80, 148]], METALL_DUNKEL);  // Griff
    ctx.strokeStyle = METALL_DUNKEL;                          // Abzugsbügel
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(160, 92, 22, 0.1, Math.PI - 0.1);
    ctx.stroke();
    balken(ctx, 70, 44, 16, 10, METALL_HELL, 2);              // Kimme
    balken(ctx, 236, 44, 14, 10, METALL_HELL, 2);             // Korn
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(70, 58, 180, 6);
  },

  mp(ctx) {
    balken(ctx, 250, 56, 70, 16, METALL_DUNKEL, 3);          // Lauf
    balken(ctx, 70, 44, 190, 44, METALL);                    // Gehäuse
    form(ctx, [[120, 88], [168, 88], [160, 140], [116, 140]], METALL_DUNKEL);  // Magazin
    form(ctx, [[86, 88], [120, 88], [112, 132], [78, 132]], METALL_DUNKEL);    // Griff
    balken(ctx, 30, 56, 44, 14, METALL_DUNKEL, 4);           // Schulterstütze
    ctx.fillStyle = "rgba(255,255,255,.1)";
    ctx.fillRect(80, 52, 170, 8);
    balken(ctx, 236, 34, 14, 12, METALL_HELL, 2);
  },

  pumpgun(ctx) {
    balken(ctx, 150, 52, 190, 16, METALL_DUNKEL, 3);         // Lauf
    balken(ctx, 160, 74, 90, 20, HOLZ, 5);                   // Pumpe
    balken(ctx, 80, 46, 90, 42, METALL);                     // Gehäuse
    form(ctx, [[20, 62], [84, 50], [84, 96], [30, 118]], HOLZ);       // Kolben
    form(ctx, [[86, 88], [116, 88], [108, 128], [80, 128]], HOLZ_HELL); // Griffhals
    ctx.strokeStyle = METALL_DUNKEL;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(126, 92, 18, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.1)";
    ctx.fillRect(152, 56, 180, 5);
  },

  ak(ctx) {
    balken(ctx, 236, 52, 104, 14, METALL_DUNKEL, 3);         // Lauf
    balken(ctx, 190, 40, 60, 16, METALL, 3);                 // Gasrohr
    balken(ctx, 170, 58, 70, 20, HOLZ, 4);                   // Vorderschaft
    balken(ctx, 80, 46, 96, 42, METALL);                     // Gehäuse
    form(ctx, [[30, 58], [86, 50], [86, 92], [36, 106]], HOLZ);        // Kolben
    form(ctx, [[86, 88], [118, 88], [108, 132], [78, 132]], METALL_DUNKEL); // Griff
    /* Krummes Magazin */
    form(ctx, [[126, 88], [172, 88], [186, 140], [138, 146]], METALL_DUNKEL);
    ctx.strokeStyle = METALL_DUNKEL;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(120, 94, 16, 0.2, Math.PI - 0.2);
    ctx.stroke();
    balken(ctx, 214, 30, 14, 14, METALL_HELL, 2);            // Korn
    ctx.fillStyle = "rgba(255,255,255,.1)";
    ctx.fillRect(88, 52, 84, 6);
  }
};

const seiten = new Map();

export function datenUrl(art) {
  if (seiten.has(art)) return seiten.get(art);
  if (!SEITE[art]) return "";
  const c = document.createElement("canvas");
  c.width = SEITE_B;
  c.height = SEITE_H;
  const ctx = c.getContext("2d");
  ctx.lineJoin = "round";
  SEITE[art](ctx);
  const url = c.toDataURL();
  seiten.set(art, url);
  return url;
}
