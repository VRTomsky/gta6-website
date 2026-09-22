/* ═══════════════════════════════════════════════════════════
   Innenräume — Pink Flamingo

   Das erste Gebäude, das man wirklich betreten kann. Jeder Raum ist ein
   einziges Bild von oben (48 Bildpunkte je Meter), dazu von Hand gesetzte
   Kästen für Wände und Möbel und die Türöffnungen als Rechtecke.

   Der Spieler läuft als Kreis mit 34 cm Radius; stößt er in einen Kasten,
   wird er auf der kürzeren Seite wieder herausgeschoben. Das reicht völlig
   und braucht keine Physik.

   Anders als `zustand.drinnen` beim Ladenraub — das ist nur ein
   Bildschirm, hier bewegt man sich wirklich.
   ═══════════════════════════════════════════════════════════ */

import { bild as sprite } from "./bilder.js";

export const RADIUS = 0.34;              // Spielerkreis in Metern
const TEMPO = 3.1, RENNEN = 5.3;
const LAUF_POSEN = [1, 2, 3, 2];

/* Kasten: [x, y, breite, höhe] in Metern, Ursprung oben links im Bild */
export const RAEUME = {
  eingang: {
    bild: "innen_eingang", breite: 15, hoehe: 10, wand: 0.9,
    name: ["Eingang", "Entrance"],
    sperren: [[2.4, 4.6, 3.2, 2.6], [9.4, 1.4, 3.6, 1.8], [12.6, 5.6, 1.6, 2.2]],
    tueren: [
      { x: 6.2, y: 8.9, b: 2.2, h: 1.1, ziel: "raus" },
      { x: 5.8, y: 0.0, b: 2.6, h: 1.1, ziel: "haupt" }
    ],
    aktionen: [],
    leute: []
  },
  haupt: {
    bild: "innen_haupt", breite: 24, hoehe: 16, wand: 1.0,
    name: ["Tanzfläche", "Dance floor"],
    sperren: [[5.0, 0.8, 12.4, 4.0], [0.9, 1.0, 3.0, 14.0], [19.0, 5.0, 3.0, 8.0]],
    tueren: [
      { x: 10.3, y: 14.9, b: 2.9, h: 1.1, ziel: "eingang" },
      { x: 22.9, y: 2.2, b: 1.1, h: 2.4, ziel: "bar" },
      { x: 11.2, y: 0.0, b: 2.2, h: 1.1, ziel: "garderobe" }
    ],
    aktionen: [],
    leute: [
      { art: "tanz1", x: 9.3, y: 3.2, buehne: true },
      { art: "tanz2", x: 14.7, y: 3.2, buehne: true },
      { art: "tanz3", x: 7.0, y: 9.0 },
      { art: "tanz4", x: 16.0, y: 10.5 }
    ]
  },
  bar: {
    bild: "innen_bar", breite: 18, hoehe: 12, wand: 1.0,
    name: ["Bar", "Bar"],
    sperren: [[3.6, 0.9, 9.4, 2.6], [0.9, 7.0, 3.2, 4.0], [14.0, 3.4, 3.1, 7.6],
              [14.4, 0.9, 2.2, 1.8]],
    tueren: [
      { x: 0.0, y: 3.4, b: 1.1, h: 1.8, ziel: "haupt" },
      { x: 7.6, y: 10.9, b: 2.6, h: 1.1, ziel: "vip" }
    ],
    aktionen: [
      { art: "drink", x: 6.5, y: 4.4, preis: 20 },
      { art: "essen", x: 11.0, y: 4.4, preis: 35 }
    ],
    leute: [{ art: "tanz5", x: 8.0, y: 7.5 }]
  },
  vip: {
    bild: "innen_vip", breite: 18, hoehe: 12, wand: 1.0,
    name: ["VIP-Raum", "VIP room"],
    sperren: [[3.0, 1.8, 7.0, 6.6], [11.8, 0.9, 4.6, 4.4], [14.4, 5.2, 2.2, 2.4],
              [12.8, 7.4, 3.6, 2.6]],
    tueren: [{ x: 7.6, y: 10.9, b: 2.8, h: 1.1, ziel: "bar" }],
    aktionen: [{ art: "tanz", x: 12.4, y: 6.2, preis: 200 }],
    leute: [{ art: "tanz6", x: 14.1, y: 3.0, buehne: true }]
  },
  garderobe: {
    bild: "innen_garderobe", breite: 18, hoehe: 12, wand: 1.0,
    name: ["Garderobe", "Dressing room"],
    sperren: [[2.4, 0.9, 10.6, 1.8], [13.4, 0.9, 3.6, 3.0], [13.4, 4.6, 2.4, 3.0],
              [0.9, 3.2, 1.6, 5.0], [3.4, 5.4, 2.8, 3.6], [8.4, 6.0, 2.6, 3.0]],
    tueren: [
      { x: 7.6, y: 10.9, b: 2.6, h: 1.1, ziel: "haupt" },
      { x: 16.9, y: 4.0, b: 1.1, h: 2.6, ziel: "buero" }
    ],
    aktionen: [],
    leute: [{ art: "tanz7", x: 6.5, y: 4.0 }, { art: "tanz8", x: 11.5, y: 4.5 }]
  },
  buero: {
    bild: "innen_buero", breite: 15, hoehe: 10, wand: 0.9,
    name: ["Büro", "Office"],
    sperren: [[4.4, 3.2, 6.2, 2.8], [11.4, 0.9, 2.6, 2.8], [0.9, 0.9, 2.2, 2.8],
              [0.9, 6.4, 3.2, 2.6], [4.0, 0.9, 6.4, 1.2]],
    tueren: [{ x: 0.0, y: 3.4, b: 1.0, h: 2.2, ziel: "garderobe" }],
    aktionen: [],
    leute: []
  }
};

/* ── Hilfen ─────────────────────────────────────────────── */
const klemmen = (w, a, b) => Math.max(a, Math.min(b, w));

function imKasten(k, x, y, rand = 0) {
  return x > k[0] - rand && x < k[0] + k[2] + rand &&
         y > k[1] - rand && y < k[1] + k[3] + rand;
}

/* Kreis aus allen Kästen herausschieben — jeweils über die kürzeste Seite */
function freiSchieben(raum, pos) {
  for (const k of raum.sperren) {
    if (!imKasten(k, pos.x, pos.y, RADIUS)) continue;
    const links = pos.x - (k[0] - RADIUS);
    const rechts = (k[0] + k[2] + RADIUS) - pos.x;
    const oben = pos.y - (k[1] - RADIUS);
    const unten = (k[1] + k[3] + RADIUS) - pos.y;
    const kleinste = Math.min(links, rechts, oben, unten);
    if (kleinste === links) pos.x = k[0] - RADIUS;
    else if (kleinste === rechts) pos.x = k[0] + k[2] + RADIUS;
    else if (kleinste === oben) pos.y = k[1] - RADIUS;
    else pos.y = k[1] + k[3] + RADIUS;
  }
}

/* Innerhalb der Wände bleiben — aber in einer Türöffnung darf man raus,
   sonst käme man an der Wandkante nie durch. */
function inDenWaenden(raum, pos) {
  const inTuer = raum.tueren.some(t => imKasten([t.x, t.y, t.b, t.h], pos.x, pos.y, 0.2));
  if (inTuer) return;
  pos.x = klemmen(pos.x, raum.wand + RADIUS, raum.breite - raum.wand - RADIUS);
  pos.y = klemmen(pos.y, raum.wand + RADIUS, raum.hoehe - raum.wand - RADIUS);
}

/* Freier Punkt zum Herumlaufen */
function freierPunkt(raum) {
  for (let k = 0; k < 60; k++) {
    const x = raum.wand + 0.8 + Math.random() * (raum.breite - 2 * raum.wand - 1.6);
    const y = raum.wand + 0.8 + Math.random() * (raum.hoehe - 2 * raum.wand - 1.6);
    if (raum.sperren.some(s => imKasten(s, x, y, 0.5))) continue;
    return { x, y };
  }
  return { x: raum.breite / 2, y: raum.hoehe / 2 };
}

/* ── Tänzerinnen ────────────────────────────────────────── */
class Taenzerin {
  constructor(plan, raum) {
    this.art = plan.art;
    this.x = plan.x;
    this.y = plan.y;
    this.buehne = !!plan.buehne;                 // tanzt auf der Stelle
    this.raum = raum;
    this.ziel = null;
    this.warte = Math.random() * 3;
    this.strecke = 0;
    this.richtung = "vorn";
  }

  rechnen(dt) {
    if (this.buehne) {                            // Bühnentanz: nur Posen
      this.strecke += dt * 2.6;
      this.richtung = Math.floor(this.strecke / 3) % 2 ? "hinten" : "vorn";
      return;
    }
    if (this.warte > 0) { this.warte -= dt; return; }
    if (!this.ziel) { this.ziel = freierPunkt(this.raum); return; }

    const dx = this.ziel.x - this.x, dy = this.ziel.y - this.y;
    const weit = Math.hypot(dx, dy);
    if (weit < 0.35) { this.ziel = null; this.warte = 1 + Math.random() * 4; return; }

    const schritt = Math.min(weit, 1.35 * dt);
    this.x += (dx / weit) * schritt;
    this.y += (dy / weit) * schritt;
    this.strecke += schritt;
    this.richtung = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "rechts" : "links")
                                                : (dy > 0 ? "vorn" : "hinten");
    const pos = this;
    freiSchieben(this.raum, pos);
    inDenWaenden(this.raum, pos);
  }

  get bildname() {
    if (this.buehne) return `${this.art}_${this.richtung}${LAUF_POSEN[Math.floor(this.strecke) % 4]}`;
    if (this.warte > 0 && !this.ziel) return `${this.art}_${this.richtung}0`;
    return `${this.art}_${this.richtung}${LAUF_POSEN[Math.floor(this.strecke / 0.5) % 4]}`;
  }
}

/* ── Betreten, Wechseln, Verlassen ──────────────────────── */
export function betreten(zustand, raumName, von) {
  const raum = RAEUME[raumName];
  const zurueck = von ? raum.tueren.find(t => t.ziel === von) : null;
  const start = zurueck ? innenVonTuer(raum, zurueck) : freierPunkt(raum);
  zustand.innen = {
    raum: raumName,
    x: start.x, y: start.y,
    vx: 0, vy: 0,
    richtung: "vorn",
    strecke: 0,
    tempo: 0,
    leute: raum.leute.map(p => new Taenzerin(p, raum)),
    sperre: 0.4                                   // kurz keine Tür auslösen
  };
}

/* Punkt knapp innerhalb einer Tür — dort steht man nach dem Wechsel */
function innenVonTuer(raum, t) {
  const mx = t.x + t.b / 2, my = t.y + t.h / 2;
  const nachInnen = 1.5;
  if (t.x <= 0.2) return { x: mx + nachInnen, y: my };
  if (t.x + t.b >= raum.breite - 0.2) return { x: mx - nachInnen, y: my };
  if (t.y <= 0.2) return { x: mx, y: my + nachInnen };
  return { x: mx, y: my - nachInnen };
}

/* ── Rechnen ────────────────────────────────────────────────
   Gibt zurück, was der Spieler gerade tun könnte, damit spiel.js den
   Hinweis anzeigen und auf E reagieren kann. */
export function rechnen(dt, quer, vor, rennen, zustand) {
  const s = zustand.innen;
  const raum = RAEUME[s.raum];
  if (s.sperre > 0) s.sperre -= dt;

  const laenge = Math.hypot(quer, vor);
  const ziel = rennen ? RENNEN : TEMPO;
  if (laenge > 0.01) {
    s.vx += ((quer / laenge) * ziel - s.vx) * Math.min(1, dt * 12);
    s.vy += ((vor / laenge) * ziel - s.vy) * Math.min(1, dt * 12);
  } else {
    s.vx -= s.vx * Math.min(1, dt * 14);
    s.vy -= s.vy * Math.min(1, dt * 14);
  }
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.tempo = Math.hypot(s.vx, s.vy);

  freiSchieben(raum, s);
  inDenWaenden(raum, s);

  if (s.tempo > 0.35) {
    s.strecke += s.tempo * dt;
    s.richtung = Math.abs(s.vx) > Math.abs(s.vy) ? (s.vx > 0 ? "rechts" : "links")
                                                 : (s.vy > 0 ? "vorn" : "hinten");
  }

  for (const t of s.leute) t.rechnen(dt);

  return naheAktion(zustand);
}

/* Was ist in Reichweite? Türen zählen erst, wenn man mitten drin steht. */
export function naheAktion(zustand) {
  const s = zustand.innen;
  const raum = RAEUME[s.raum];
  for (const a of raum.aktionen) {
    if (Math.hypot(a.x - s.x, a.y - s.y) < 1.7) return { ...a, raum };
  }
  if (s.sperre > 0) return null;
  for (const t of raum.tueren) {
    if (imKasten([t.x, t.y, t.b, t.h], s.x, s.y, 0.35)) {
      return { art: "tuer", ziel: t.ziel, raum };
    }
  }
  return null;
}

export const raumName = zustand => RAEUME[zustand.innen.raum].name;

/* ── Zeichnen ───────────────────────────────────────────── */
export function zeichnen(ctx, zustand, kamera) {
  const s = zustand.innen;
  const raum = RAEUME[s.raum];

  /* Ein Raum wird immer ganz gezeigt — wie in GTA 1 und 2. Der Zoom
     ergibt sich aus der Leinwand, nicht aus der Kamera draußen. */
  const z = Math.max(18, Math.min(58, Math.min(kamera.breite / raum.breite,
                                               kamera.hoehe / raum.hoehe)));
  const sichtB = kamera.breite / z, sichtH = kamera.hoehe / z;
  const mx = raum.breite <= sichtB ? raum.breite / 2
                                   : klemmen(s.x, sichtB / 2, raum.breite - sichtB / 2);
  const my = raum.hoehe <= sichtH ? raum.hoehe / 2
                                  : klemmen(s.y, sichtH / 2, raum.hoehe - sichtH / 2);
  const zuBild = (x, y) => [(x - mx) * z + kamera.breite / 2,
                            (y - my) * z + kamera.hoehe / 2];

  ctx.fillStyle = "#07060d";
  ctx.fillRect(0, 0, kamera.breite, kamera.hoehe);

  const b = sprite(raum.bild);
  const [px, py] = zuBild(0, 0);
  if (b) ctx.drawImage(b, px, py, raum.breite * z, raum.hoehe * z);

  /* Türen leuchten schwach, damit man sie findet */
  for (const t of raum.tueren) {
    const [tx, ty] = zuBild(t.x, t.y);
    ctx.fillStyle = "rgba(255,210,74,.16)";
    ctx.fillRect(tx, ty, t.b * z, t.h * z);
  }
  for (const a of raum.aktionen) {
    const [ax, ay] = zuBild(a.x, a.y);
    ctx.fillStyle = "rgba(255,74,160,.22)";
    ctx.beginPath();
    ctx.arc(ax, ay, z * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Figuren von hinten nach vorn, damit sie sich richtig überdecken */
  const alle = [...s.leute.map(t => ({ t, y: t.y })), { spieler: true, y: s.y }];
  alle.sort((a, b2) => a.y - b2.y);
  for (const e of alle) {
    if (e.spieler) figurMalen(ctx, zuBild, s.x, s.y, spielerBild(zustand, s), z);
    else figurMalen(ctx, zuBild, e.t.x, e.t.y, sprite(e.t.bildname), z);
  }
}

function spielerBild(zustand, s) {
  const art = zustand.aktiv;
  const pose = s.tempo > 0.35 ? LAUF_POSEN[Math.floor(s.strecke / 0.55) % 4] : 0;
  return sprite(`${art}_${s.richtung}${pose}`) || sprite(`${art}_steht`);
}

function figurMalen(ctx, zuBild, x, y, b, z) {
  if (!b) return;
  const [px, py] = zuBild(x, y);
  const skala = z / 64;                            // Sprites sind 64 px je Meter
  const w = b.width * skala, h = b.height * skala;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(px, py + h * 0.06, w * 0.3, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.drawImage(b, px - w / 2, py - h * 0.86, w, h);
  ctx.restore();
}

/* Alle Bilder, die drinnen gebraucht werden */
export function bildnamen() {
  const namen = Object.values(RAEUME).map(r => r.bild);
  for (const r of Object.values(RAEUME)) {
    for (const p of r.leute) {
      for (const ri of ["vorn", "hinten", "links", "rechts"]) {
        for (let k = 0; k < 4; k++) namen.push(`${p.art}_${ri}${k}`);
      }
    }
  }
  return namen;
}
