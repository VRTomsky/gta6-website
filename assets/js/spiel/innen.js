/* ═══════════════════════════════════════════════════════════
   Innenräume — Clubs, Ammu-Vice, 24/7, Klinik, Wache, Bank

   Das erste Gebäude, das man wirklich betreten kann. Jeder Raum ist ein
   einziges Bild von oben (48 Bildpunkte je Meter), dazu von Hand gesetzte
   Kästen für Wände und Möbel und die Türöffnungen als Rechtecke.

   Der Spieler läuft als Kreis mit 34 cm Radius; stößt er in einen Kasten,
   wird er auf der kürzeren Seite wieder herausgeschoben. Das reicht völlig
   und braucht keine Physik.

   Anders als `zustand.drinnen` beim Ladenraub — das ist nur ein
   Bildschirm, hier bewegt man sich wirklich.

   Räume ohne eigenes Bild (24/7, Klinik, Wache, Bank — seit 25.09.2026)
   werden hier gemalt: Boden, Wände und eine Möbelliste. Aus derselben
   Liste entstehen die Sperren, Bild und Kollision passen also immer.
   Kommt später ein gemaltes Bild mit gleichem Namen dazu, wird es
   stattdessen gezeigt — dann die Möbelkästen daran anpassen.
   ═══════════════════════════════════════════════════════════ */

import { bild as sprite } from "./bilder.js";

export const RADIUS = 0.34;              // Spielerkreis in Metern
const TEMPO = 3.1, RENNEN = 5.3;
const LAUF_POSEN = [1, 2, 3, 2];

/* Kasten: [x, y, breite, höhe] in Metern, Ursprung oben links im Bild */
export const RAEUME = {
  eingang: {
    musik: true,
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
    musik: true,
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
    musik: true,
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
    musik: true,
    bild: "innen_vip", breite: 18, hoehe: 12, wand: 1.0,
    name: ["VIP-Raum", "VIP room"],
    sperren: [[3.0, 1.8, 7.0, 6.6], [11.8, 0.9, 4.6, 4.4], [14.4, 5.2, 2.2, 2.4],
              [12.8, 7.4, 3.6, 2.6]],
    tueren: [{ x: 7.6, y: 10.9, b: 2.8, h: 1.1, ziel: "bar" }],
    aktionen: [{ art: "tanz", x: 12.4, y: 6.2, preis: 200 }],
    leute: [{ art: "tanz6", x: 14.1, y: 3.0, buehne: true }]
  },
  garderobe: {
    musik: true,
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
    musik: true,
    bild: "innen_buero", breite: 15, hoehe: 10, wand: 0.9,
    name: ["Büro", "Office"],
    sperren: [[4.4, 3.2, 6.2, 2.8], [11.4, 0.9, 2.6, 2.8], [0.9, 0.9, 2.2, 2.8],
              [0.9, 6.4, 3.2, 2.6], [4.0, 0.9, 6.4, 1.2]],
    tueren: [{ x: 0.0, y: 3.4, b: 1.0, h: 2.2, ziel: "garderobe" }],
    aktionen: [],
    leute: []
  },

  /* ── Ammu-Vice: Verkaufsraum und Schießstand (23.09.2026) ──
     Die untere Wand ist hier gut anderthalb Meter dick, deshalb stehen
     ihre beiden Stücke links und rechts der Tür als eigene Sperren. */
  ammu_laden: {
    bild: "innen_ammu_laden", breite: 18, hoehe: 12, wand: 0.6,
    name: ["Ammu-Vice", "Ammu-Vice"],
    sperren: [
      [0.4, 1.2, 2.1, 8.8],                    // Gewehrregal links
      [0.4, 0.4, 17.2, 1.2],                   // Regale an der Rückwand
      [3.5, 2.2, 11.0, 1.8],                   // Glastheke
      [6.9, 5.3, 4.2, 2.0],                    // Munitionstisch
      [12.3, 5.5, 3.0, 2.5],                   // Westenständer
      [3.9, 5.4, 1.8, 2.2],                    // Drehständer
      [16.2, 4.8, 1.4, 3.2],                   // Regal rechts
      [7.3, 8.5, 3.4, 0.8],                    // Bank
      [14.9, 8.1, 2.3, 2.6],                   // Vitrine unten rechts
      [2.3, 8.6, 1.3, 1.6],                    // Kisten unten links
      [0, 10.4, 7.2, 1.6], [10.8, 10.4, 7.2, 1.6]   // dicke Außenwand
    ],
    tueren: [
      { x: 7.4, y: 10.8, b: 3.2, h: 1.2, ziel: "raus" },
      { x: 17.0, y: 2.8, b: 1.0, h: 1.8, ziel: "ammu_stand" }
    ],
    aktionen: [{ art: "laden", x: 9.0, y: 4.6 }],
    leute: []
  },
  ammu_stand: {
    bild: "innen_ammu_stand", breite: 18, hoehe: 12, wand: 0.6,
    name: ["Schießstand", "Shooting range"],
    sperren: [
      [3.8, 0.4, 12.5, 7.4],                   // Schießbahnen
      [3.8, 7.8, 12.5, 1.1],                   // Schützentische
      [1.7, 3.9, 0.8, 3.1],                    // Pult neben der Tür
      [1.4, 1.0, 1.3, 1.6],                    // Kisten oben links
      [1.2, 8.8, 1.0, 1.3],                    // Kiste unten links
      [16.6, 4.6, 0.8, 2.2],                   // Kisten rechts
      [0, 11.2, 18, 0.8]                       // Außenwand unten
    ],
    tueren: [{ x: 0.0, y: 4.4, b: 1.0, h: 2.2, ziel: "ammu_laden" }],
    aktionen: [
      { art: "schiessen", x: 5.4, y: 9.4, preis: 10 },
      { art: "schiessen", x: 8.5, y: 9.4, preis: 10 },
      { art: "schiessen", x: 11.6, y: 9.4, preis: 10 },
      { art: "schiessen", x: 14.7, y: 9.4, preis: 10 }
    ],
    leute: []
  },

  /* ── 24/7 an der Tankstelle (25.09.2026) ──
     Kühlregale hinten, drei Regalreihen, Theke rechts. Die Kasse lässt
     sich ausrauben — dann kommen zwei Sterne. */
  markt: {
    bild: "innen_markt", breite: 16, hoehe: 11, wand: 0.5,
    boden: "fliesen", wandFarbe: "#4a4f5c",
    name: ["24/7", "24/7"],
    moebel: [
      { art: "kuehl", x: 0.5, y: 0.5, b: 10.4, h: 1.2 },
      { art: "regal", x: 12.4, y: 0.5, b: 3.1, h: 0.6 },
      { art: "theke", x: 11.2, y: 5.4, b: 4.3, h: 1.0, farbe: "#c7572d" },
      { art: "theke", x: 11.2, y: 1.9, b: 1.0, h: 3.5, farbe: "#c7572d" },
      { art: "kasse", x: 12.9, y: 5.62, b: 0.62, h: 0.52, sperrt: false, oben: true },
      { art: "regal", x: 2.2, y: 3.0, b: 1.2, h: 4.6 },
      { art: "regal", x: 5.0, y: 3.0, b: 1.2, h: 4.6 },
      { art: "regal", x: 7.8, y: 3.0, b: 1.2, h: 4.6 },
      { art: "automat", x: 0.6, y: 8.4, b: 1.0, h: 1.4, farbe: "#b3242f" },
      { art: "zeitung", x: 14.4, y: 8.6, b: 1.0, h: 1.2 },
      { art: "teppich", x: 6.4, y: 8.8, b: 3.2, h: 1.3, farbe: "#3b3f4a", sperrt: false }
    ],
    tueren: [{ x: 6.6, y: 10.2, b: 2.8, h: 0.8, ziel: "raus" }],
    aktionen: [
      { art: "getraenk", x: 5.7, y: 2.35, preis: 6 },
      { art: "snack", x: 4.2, y: 5.3, preis: 12 },
      { art: "kasse", x: 13.3, y: 7.2 }
    ],
    leute: [{ art: "verkaeufer", x: 13.8, y: 3.6, bild: "verkaeufer_steht" }]
  },

  /* ── Klinik: Empfang, Wartebänke, zwei Betten ── */
  klinik: {
    bild: "innen_klinik", breite: 20, hoehe: 12, wand: 0.5,
    boden: "linoleum", wandFarbe: "#7d8c98",
    name: ["Klinik", "Clinic"],
    moebel: [
      { art: "theke", x: 6.5, y: 2.6, b: 7.0, h: 1.1, farbe: "#e8edf2" },
      { art: "wand", x: 5.9, y: 0.5, b: 0.6, h: 3.2 },
      { art: "wand", x: 13.5, y: 0.5, b: 0.6, h: 3.2 },
      { art: "schreibtisch", x: 7.2, y: 0.6, b: 2.2, h: 1.0 },
      { art: "regal", x: 10.8, y: 0.6, b: 2.4, h: 0.6 },
      { art: "spind", x: 2.4, y: 0.5, b: 3.2, h: 0.7, farbe: "#b8c2cc" },
      { art: "bank", x: 1.2, y: 5.0, b: 4.0, h: 0.8, farbe: "#3aa6a0" },
      { art: "bank", x: 1.2, y: 7.4, b: 4.0, h: 0.8, farbe: "#3aa6a0" },
      { art: "bett", x: 15.4, y: 4.0, b: 3.4, h: 1.5 },
      { art: "bett", x: 15.4, y: 7.2, b: 3.4, h: 1.5 },
      { art: "vorhang", x: 14.8, y: 3.4, b: 0.14, h: 6.2, sperrt: false },
      { art: "pflanze", x: 0.8, y: 9.8, b: 1.0, h: 1.0 },
      { art: "pflanze", x: 18.2, y: 0.8, b: 1.0, h: 1.0 },
      { art: "automat", x: 18.3, y: 10.0, b: 1.0, h: 1.3, farbe: "#2b6cb0" },
      { art: "kreuz", x: 9.0, y: 6.3, b: 2.0, h: 2.0, sperrt: false }
    ],
    tueren: [{ x: 8.6, y: 11.2, b: 2.8, h: 0.8, ziel: "raus" }],
    aktionen: [
      { art: "heilen", x: 10.0, y: 4.5, preis: 150 },
      { art: "spenden", x: 14.2, y: 8.0 },
      { art: "akte", x: 4.0, y: 1.8, nurMission: true }
    ],
    leute: [
      { art: "sanitaeterin", x: 10.0, y: 1.9, bild: "sanitaeterin_steht" },
      { art: "sanitaeter", x: 17.0, y: 10.3, bild: "sanitaeter_steht" }
    ]
  },

  /* ── Polizeiwache: Tresen, Büro, Zelle ── */
  polizei: {
    bild: "innen_polizei", breite: 18, hoehe: 12, wand: 0.6,
    boden: "beton", wandFarbe: "#2f3848",
    name: ["VCPD-Wache", "VCPD station"],
    moebel: [
      { art: "theke", x: 5.0, y: 3.4, b: 8.0, h: 1.1, farbe: "#3d4a63" },
      { art: "wand", x: 4.4, y: 0.6, b: 0.6, h: 3.9 },
      { art: "wand", x: 13.0, y: 0.6, b: 0.6, h: 3.9 },
      { art: "schreibtisch", x: 5.8, y: 0.9, b: 2.4, h: 1.1 },
      { art: "schreibtisch", x: 9.8, y: 0.9, b: 2.4, h: 1.1 },
      { art: "zelle", x: 14.0, y: 5.2, b: 3.4, h: 4.4 },
      { art: "bank", x: 0.9, y: 6.0, b: 0.8, h: 3.6, farbe: "#45526b" },
      { art: "spind", x: 0.8, y: 0.8, b: 3.2, h: 0.8, farbe: "#56657a" },
      { art: "pflanze", x: 0.9, y: 10.2, b: 0.9, h: 0.9 },
      { art: "teppich", x: 7.4, y: 9.6, b: 3.2, h: 1.2, farbe: "#27324a", sperrt: false },
      { art: "stern", x: 8.0, y: 6.0, b: 2.0, h: 2.0, sperrt: false }
    ],
    tueren: [{ x: 7.6, y: 11.2, b: 2.8, h: 0.8, ziel: "raus" }],
    aktionen: [{ art: "strafe", x: 9.0, y: 5.3 }],
    leute: [
      { art: "polizist", x: 9.0, y: 2.6, bild: "polizist_steht" },
      { art: "polizistin", x: 11.8, y: 2.5, bild: "polizistin_steht" },
      { art: "mann_tank", x: 15.7, y: 7.6, bild: "mann_tank_steht" }
    ]
  },

  /* ── Bank: Schalterhalle mit Tresortür ── */
  bank: {
    bild: "innen_bank", breite: 22, hoehe: 14, wand: 0.7,
    boden: "marmor", wandFarbe: "#5a4a3c",
    name: ["Bank", "Bank"],
    moebel: [
      { art: "schalter", x: 3.5, y: 3.4, b: 15.0, h: 1.2 },
      { art: "wand", x: 2.9, y: 0.7, b: 0.6, h: 3.9 },
      { art: "wand", x: 18.5, y: 0.7, b: 0.6, h: 3.9 },
      { art: "tresor", x: 9.5, y: 0.7, b: 3.0, h: 1.2 },
      { art: "schreibtisch", x: 4.2, y: 1.2, b: 2.2, h: 1.0 },
      { art: "schreibtisch", x: 15.4, y: 1.2, b: 2.2, h: 1.0 },
      { art: "saeule", x: 3.0, y: 7.6, b: 1.2, h: 1.2 },
      { art: "saeule", x: 17.8, y: 7.6, b: 1.2, h: 1.2 },
      { art: "bank", x: 0.9, y: 9.6, b: 0.8, h: 3.0, farbe: "#6b3a2e" },
      { art: "pflanze", x: 1.0, y: 1.0, b: 1.0, h: 1.0 },
      { art: "pflanze", x: 20.1, y: 1.0, b: 1.0, h: 1.0 },
      { art: "pflanze", x: 20.2, y: 12.0, b: 1.0, h: 1.0 },
      { art: "automat", x: 20.4, y: 5.6, b: 0.9, h: 1.3, farbe: "#1f5f3a" },
      { art: "teppich", x: 9.9, y: 4.6, b: 2.2, h: 8.6, farbe: "#8c1d2a", sperrt: false }
    ],
    tueren: [{ x: 9.6, y: 13.2, b: 2.8, h: 0.8, ziel: "raus" }],
    aktionen: [{ art: "schalter", x: 11.0, y: 5.6 }],
    leute: [
      { art: "frau_business", x: 7.6, y: 2.5, bild: "frau_business_steht" },
      { art: "mann_anzug", x: 14.2, y: 2.5, bild: "mann_anzug_steht" },
      { art: "wachmann", x: 19.6, y: 11.2, bild: "wachmann_steht" }
    ]
  }
};

/* Räume mit Möbelliste: Sperren aus den Möbeln ableiten */
for (const raum of Object.values(RAEUME)) {
  if (!raum.moebel) continue;
  raum.sperren = raum.moebel.filter(m => m.sperrt !== false).map(m => [m.x, m.y, m.b, m.h]);
}

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

/* Innerhalb der Wände bleiben — in einer Türöffnung darf man bis an die
   Wandkante heran.

   Hier steckte der Fehler, wegen dem im Club nur Eingang und Tanzfläche
   erreichbar waren: Die Türen liegen in der Wand, die Wandgrenze hielt
   einen aber schon davor an. Also zählt eine Tür jetzt großzügig — eine
   Armlänge um ihr Rechteck herum. */
function inTuerBand(raum, x, y, rand = 0.75) {
  return raum.tueren.some(t => imKasten([t.x, t.y, t.b, t.h], x, y, rand));
}

function inDenWaenden(raum, pos) {
  if (inTuerBand(raum, pos.x, pos.y)) {
    pos.x = klemmen(pos.x, 0.1, raum.breite - 0.1);
    pos.y = klemmen(pos.y, 0.1, raum.hoehe - 0.1);
    return;
  }
  pos.x = klemmen(pos.x, raum.wand + RADIUS, raum.breite - raum.wand - RADIUS);
  pos.y = klemmen(pos.y, raum.wand + RADIUS, raum.hoehe - raum.wand - RADIUS);
}

/* Freier Punkt zum Herumlaufen */
function freierPunkt(raum) {
  for (let k = 0; k < 60; k++) {
    const x = raum.wand + 0.8 + Math.random() * (raum.breite - 2 * raum.wand - 1.6);
    const y = raum.wand + 0.8 + Math.random() * (raum.hoehe - 2 * raum.wand - 1.6);
    if (raum.sperren.some(s => imKasten(s, x, y, 0.5))) continue;
    if (raum.tueren.some(t => imKasten([t.x, t.y, t.b, t.h], x, y, 1.2))) continue;
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
    this.bild = plan.bild || null;               // Personal: ein Standbild, bleibt stehen
    this.buehne = !!plan.buehne;                 // tanzt auf der Stelle
    this.raum = raum;
    this.ziel = null;
    this.warte = Math.random() * 3;
    this.strecke = 0;
    this.richtung = "vorn";
  }

  rechnen(dt) {
    if (this.bild) return;
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
    if (this.bild) return this.bild;
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
/* Manche Aktionen gibt es nur, solange ein Auftrag darauf wartet */
function sichtbar(a, zustand) {
  return !a.nurMission || !!(zustand.missionen && zustand.missionen.wartetAuf(a.art));
}

export function naheAktion(zustand) {
  const s = zustand.innen;
  const raum = RAEUME[s.raum];
  for (const a of raum.aktionen) {
    if (!sichtbar(a, zustand)) continue;
    if (Math.hypot(a.x - s.x, a.y - s.y) < 1.7) return { ...a, raum };
  }
  if (s.sperre > 0) return null;
  for (const t of raum.tueren) {
    /* Mitte der Tür, nicht das Rechteck: Man steht ja davor, nicht drin. */
    if (Math.hypot(t.x + t.b / 2 - s.x, t.y + t.h / 2 - s.y) < 2.2) {
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

  const b = sprite(raum.bild) || (raum.moebel ? raumGemalt(s.raum, raum) : null);
  const [px, py] = zuBild(0, 0);
  if (b) ctx.drawImage(b, px, py, raum.breite * z, raum.hoehe * z);

  /* Türen leuchten schwach, damit man sie findet */
  for (const t of raum.tueren) {
    const [tx, ty] = zuBild(t.x, t.y);
    ctx.fillStyle = "rgba(255,210,74,.16)";
    ctx.fillRect(tx, ty, t.b * z, t.h * z);
  }
  for (const a of raum.aktionen) {
    if (!sichtbar(a, zustand)) continue;
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
  const namen = Object.values(RAEUME).filter(r => !r.moebel).map(r => r.bild);
  for (const r of Object.values(RAEUME)) {
    for (const p of r.leute) {
      if (p.bild) { namen.push(p.bild); continue; }
      for (const ri of ["vorn", "hinten", "links", "rechts"]) {
        for (let k = 0; k < 4; k++) namen.push(`${p.art}_${ri}${k}`);
      }
    }
  }
  return namen;
}

/* ═══ Räume malen ════════════════════════════════════════════
   Einmal je Raum auf eine Leinwand mit 48 Bildpunkten je Meter, danach
   wie ein Bild benutzt. Gezeichnet wird in Metern (ctx ist skaliert),
   streng von oben — wie die gemalten Räume der Clubs. */
const MAL_PX = 48;
const gemalt = new Map();

function raumGemalt(name, raum) {
  let c = gemalt.get(name);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = Math.round(raum.breite * MAL_PX);
  c.height = Math.round(raum.hoehe * MAL_PX);
  const g = c.getContext("2d");
  g.scale(MAL_PX, MAL_PX);
  bodenMalen(g, raum);
  /* Teppiche zuerst, dann Möbel, zuletzt was auf den Möbeln steht */
  for (const m of raum.moebel) if (m.sperrt === false && !m.oben) moebelMalen(g, m);
  for (const m of raum.moebel) if (m.sperrt !== false) moebelMalen(g, m);
  for (const m of raum.moebel) if (m.oben) moebelMalen(g, m);
  waendeMalen(g, raum);
  gemalt.set(name, c);
  return c;
}

/* Immer gleicher Zufall, damit der Raum bei jedem Besuch gleich aussieht */
function zufall(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function kasten(g, x, y, b, h, farbe, r = 0.08) {
  g.fillStyle = farbe;
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, b, h, Math.min(r, b / 2, h / 2));
  else g.rect(x, y, b, h);
  g.fill();
}

function schattenUnter(g, m) {
  g.fillStyle = "rgba(0,0,0,.22)";
  g.fillRect(m.x + 0.08, m.y + 0.12, m.b, m.h);
}

function bodenMalen(g, raum) {
  const B = raum.breite, H = raum.hoehe;
  const art = raum.boden;
  if (art === "fliesen") {                           // 24/7: helles Schachbrett
    g.fillStyle = "#e6e2d8";
    g.fillRect(0, 0, B, H);
    const k = 0.6;
    g.fillStyle = "#d3cec2";
    for (let y = 0; y < H; y += k) {
      for (let x = 0; x < B; x += k) {
        if ((Math.round(x / k) + Math.round(y / k)) % 2) g.fillRect(x, y, k, k);
      }
    }
  } else if (art === "linoleum") {                   // Klinik: mintgrün, gesprenkelt
    g.fillStyle = "#cfe2da";
    g.fillRect(0, 0, B, H);
    for (let n = 0; n < B * H * 6; n++) {
      g.fillStyle = zufall(n) > 0.5 ? "rgba(255,255,255,.35)" : "rgba(60,110,100,.12)";
      g.fillRect(zufall(n + 0.3) * B, zufall(n + 0.7) * H, 0.05, 0.05);
    }
    g.strokeStyle = "rgba(60,100,95,.14)";
    g.lineWidth = 0.025;
    for (let x = 0; x <= B; x += 1.2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y <= H; y += 1.2) { g.beginPath(); g.moveTo(0, y); g.lineTo(B, y); g.stroke(); }
  } else if (art === "beton") {                      // Wache: blaugraue Platten
    g.fillStyle = "#6c7684";
    g.fillRect(0, 0, B, H);
    for (let y = 0, r = 0; y < H; y += 1, r++) {
      for (let x = 0, c = 0; x < B; x += 1, c++) {
        g.fillStyle = `rgba(255,255,255,${0.02 + zufall(r * 31 + c) * 0.05})`;
        g.fillRect(x + 0.02, y + 0.02, 0.96, 0.96);
      }
    }
  } else {                                           // Bank: Marmor mit Adern
    g.fillStyle = "#e7dcc6";
    g.fillRect(0, 0, B, H);
    const k = 1.4;
    g.fillStyle = "#d7c8ab";
    for (let y = 0; y < H; y += k) {
      for (let x = 0; x < B; x += k) {
        if ((Math.round(x / k) + Math.round(y / k)) % 2) g.fillRect(x, y, k, k);
      }
    }
    g.strokeStyle = "rgba(150,135,110,.35)";
    g.lineWidth = 0.02;
    for (let n = 0; n < B * H / 3; n++) {
      const x = zufall(n) * B, y = zufall(n + 5) * H;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 0.4, y + (zufall(n + 9) - 0.5), x + 0.9, y + (zufall(n + 2) - 0.5) * 0.8);
      g.stroke();
    }
  }
}

function waendeMalen(g, raum) {
  const B = raum.breite, H = raum.hoehe, w = raum.wand;
  const farbe = raum.wandFarbe || "#3a3f4b";
  /* Außenwände als Band, die Türen danach als Lücke mit Schwelle */
  g.fillStyle = farbe;
  g.fillRect(0, 0, B, w);
  g.fillRect(0, H - w, B, w);
  g.fillRect(0, 0, w, H);
  g.fillRect(B - w, 0, w, H);
  g.fillStyle = "rgba(255,255,255,.14)";            // Oberkante
  g.fillRect(w, w - 0.06, B - 2 * w, 0.06);
  g.fillRect(w - 0.06, w, 0.06, H - 2 * w);
  g.fillStyle = "rgba(0,0,0,.18)";                  // Schatten nach innen
  g.fillRect(w, w, B - 2 * w, 0.14);
  g.fillRect(w, w, 0.14, H - 2 * w);
  for (const t of raum.tueren) {
    const unten = t.y + t.h >= H - 0.05, oben = t.y <= 0.05;
    const links = t.x <= 0.05, rechts = t.x + t.b >= B - 0.05;
    let x = t.x, y = t.y, b = t.b, h = t.h;
    if (unten) { y = H - w; h = w; }
    if (oben) { y = 0; h = w; }
    if (links) { x = 0; b = w; }
    if (rechts) { x = B - w; b = w; }
    g.fillStyle = "#1c1e24";
    g.fillRect(x, y, b, h);
    g.fillStyle = "rgba(255,210,74,.5)";            // Türschwelle
    if (unten || oben) g.fillRect(x, unten ? y : y + h - 0.06, b, 0.06);
    else g.fillRect(links ? x + b - 0.06 : x, y, 0.06, h);
  }
}

const WAREN = ["#e63946", "#f4a261", "#2a9d8f", "#e9c46a", "#457b9d", "#ff6fb5", "#8ac926", "#6a4c93"];

function moebelMalen(g, m) {
  const { x, y, b, h } = m;
  const quer = b >= h;                              // lange Seite waagerecht?
  switch (m.art) {
    case "teppich": {
      kasten(g, x, y, b, h, m.farbe || "#444", 0.06);
      g.strokeStyle = "rgba(255,220,150,.35)";
      g.lineWidth = 0.05;
      g.strokeRect(x + 0.15, y + 0.15, b - 0.3, h - 0.3);
      break;
    }
    case "kreuz": {                                  // rotes Kreuz im Boden
      g.fillStyle = "rgba(214,40,57,.8)";
      g.fillRect(x + b * 0.36, y, b * 0.28, h);
      g.fillRect(x, y + h * 0.36, b, h * 0.28);
      break;
    }
    case "stern": {                                  // Polizeistern im Boden
      g.save();
      g.translate(x + b / 2, y + h / 2);
      g.fillStyle = "rgba(230,190,70,.55)";
      g.beginPath();
      for (let k = 0; k < 14; k++) {
        const r = k % 2 ? b * 0.22 : b * 0.5;
        const w = (k / 14) * Math.PI * 2 - Math.PI / 2;
        g.lineTo(Math.cos(w) * r, Math.sin(w) * r);
      }
      g.closePath();
      g.fill();
      g.restore();
      break;
    }
    case "vorhang": {
      g.fillStyle = "#9fc6d8";
      g.fillRect(x, y, b, h);
      g.fillStyle = "rgba(0,0,0,.12)";
      for (let k = y; k < y + h; k += 0.3) g.fillRect(x, k, b, 0.1);
      break;
    }
    case "wand": {
      g.fillStyle = "#454b58";
      g.fillRect(x, y, b, h);
      g.fillStyle = "rgba(255,255,255,.12)";
      g.fillRect(x, y, 0.06, h);
      break;
    }
    case "regal": {
      schattenUnter(g, m);
      kasten(g, x, y, b, h, "#2d2f36", 0.05);
      /* Waren in zwei Reihen entlang der langen Seite */
      const lang = quer ? b : h, kurz = quer ? h : b;
      const reihen = kurz > 0.9 ? 2 : 1;
      let n = Math.round(x * 7 + y * 13);
      for (let r = 0; r < reihen; r++) {
        for (let p = 0.12; p < lang - 0.2; p += 0.24) {
          const f = WAREN[Math.floor(zufall(n++) * WAREN.length)];
          const t = kurz / reihen - 0.16;
          const ox = quer ? x + p : x + 0.08 + r * (kurz / reihen);
          const oy = quer ? y + 0.08 + r * (kurz / reihen) : y + p;
          g.fillStyle = f;
          g.fillRect(ox, oy, quer ? 0.18 : t, quer ? t : 0.18);
        }
      }
      break;
    }
    case "kuehl": {
      schattenUnter(g, m);
      kasten(g, x, y, b, h, "#9aa7b3", 0.05);
      let n = 7;
      for (let k = x + 0.1; k < x + b - 0.3; k += 1.3) {
        const breite = Math.min(1.2, x + b - 0.1 - k);
        g.fillStyle = "#1f3440";
        g.fillRect(k, y + 0.12, breite, h - 0.24);
        for (let f = k + 0.12; f < k + breite - 0.1; f += 0.2) {
          g.fillStyle = WAREN[Math.floor(zufall(n++) * WAREN.length)];
          g.beginPath();
          g.arc(f, y + h * 0.4, 0.07, 0, Math.PI * 2);
          g.arc(f + 0.1, y + h * 0.68, 0.07, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = "rgba(170,225,255,.28)";      // Glas
        g.fillRect(k, y + 0.12, breite, h - 0.24);
      }
      g.fillStyle = "rgba(120,200,255,.45)";        // kaltes Licht
      g.fillRect(x, y + h - 0.06, b, 0.06);
      break;
    }
    case "theke":
    case "schalter": {
      schattenUnter(g, m);
      const bank = m.art === "schalter";
      kasten(g, x, y, b, h, bank ? "#6b4b33" : (m.farbe || "#8a5a3c"), 0.06);
      kasten(g, x + 0.06, y + 0.06, b - 0.12, h - 0.2, bank ? "#d8cfc0" : "rgba(255,255,255,.18)", 0.04);
      if (bank) {                                    // Glas mit Schalterfenstern
        g.fillStyle = "rgba(150,210,235,.55)";
        g.fillRect(x, y + h * 0.35, b, 0.08);
        g.fillStyle = "rgba(40,30,20,.5)";
        for (let k = x + 1.5; k < x + b - 1; k += 3.4) g.fillRect(k, y + h * 0.35, 0.8, 0.08);
      }
      break;
    }
    case "kasse": {
      kasten(g, x, y, b, h, "#20232a", 0.05);
      g.fillStyle = "#56d364";
      g.fillRect(x + 0.08, y + 0.08, b - 0.16, h * 0.35);
      break;
    }
    case "schreibtisch": {
      schattenUnter(g, m);
      kasten(g, x, y, b, h, "#5c4a3a", 0.05);
      g.fillStyle = "#1c1f26";                        // Bildschirm
      g.fillRect(x + b * 0.35, y + 0.1, b * 0.3, 0.14);
      g.fillStyle = "#f4f1e8";                        // Papiere
      g.fillRect(x + 0.2, y + h * 0.45, 0.4, 0.3);
      g.fillRect(x + b - 0.6, y + h * 0.4, 0.34, 0.28);
      g.fillStyle = "#2b2f38";                        // Stuhl davor
      g.beginPath();
      g.arc(x + b / 2, y + h + 0.35, 0.3, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "bank": {                                   // Wartesitze in einer Reihe
      schattenUnter(g, m);
      kasten(g, x, y, b, h, "#2b2f38", 0.05);
      const lang = quer ? b : h;
      for (let p = 0.08; p < lang - 0.5; p += 0.62) {
        g.fillStyle = m.farbe || "#3a6";
        if (quer) kasten(g, x + p, y + 0.08, 0.54, h - 0.16, g.fillStyle, 0.08);
        else kasten(g, x + 0.08, y + p, b - 0.16, 0.54, g.fillStyle, 0.08);
      }
      break;
    }
    case "bett": {
      schattenUnter(g, m);
      kasten(g, x, y, b, h, "#c9ced6", 0.1);
      kasten(g, x + 0.08, y + 0.08, b - 0.16, h - 0.16, "#f4f6f8", 0.08);
      kasten(g, x + 0.14, y + 0.2, 0.55, h - 0.4, "#ffffff", 0.12);    // Kissen
      kasten(g, x + b * 0.4, y + 0.08, b * 0.58, h - 0.16, "#8fc1e3", 0.06);   // Decke
      break;
    }
    case "pflanze": {
      g.fillStyle = "#7a4b32";
      g.beginPath();
      g.arc(x + b / 2, y + h / 2, b * 0.36, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 7; k++) {
        const w = (k / 7) * Math.PI * 2;
        g.fillStyle = k % 2 ? "#2f7d3b" : "#3fa052";
        g.beginPath();
        g.ellipse(x + b / 2 + Math.cos(w) * b * 0.24, y + h / 2 + Math.sin(w) * h * 0.24,
                  b * 0.26, b * 0.12, w, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case "automat": {
      schattenUnter(g, m);
      kasten(g, x, y, b, h, m.farbe || "#b3242f", 0.06);
      g.fillStyle = "rgba(200,235,255,.5)";
      g.fillRect(x + 0.1, y + 0.1, b - 0.2, h * 0.5);
      g.fillStyle = "#ffd24a";
      g.fillRect(x + b * 0.6, y + h * 0.7, b * 0.25, 0.12);
      break;
    }
    case "zeitung": {
      schattenUnter(g, m);
      kasten(g, x, y, b, h, "#35506e", 0.05);
      for (let k = 0; k < 3; k++) {
        g.fillStyle = k % 2 ? "#f1ede2" : "#e2dccb";
        g.fillRect(x + 0.1, y + 0.12 + k * 0.34, b - 0.2, 0.26);
      }
      break;
    }
    case "spind": {
      schattenUnter(g, m);
      kasten(g, x, y, b, h, m.farbe || "#56657a", 0.04);
      g.strokeStyle = "rgba(0,0,0,.35)";
      g.lineWidth = 0.03;
      for (let k = x + 0.53; k < x + b; k += 0.53) {
        g.beginPath(); g.moveTo(k, y); g.lineTo(k, y + h); g.stroke();
      }
      break;
    }
    case "zelle": {                                  // Arrestzelle mit Gitter
      g.fillStyle = "#4b525c";
      g.fillRect(x, y, b, h);
      kasten(g, x + b - 1.0, y + 0.3, 0.7, h - 0.6, "#6d747e", 0.05);   // Pritsche
      /* Gitterstäbe als helle Punkte auf einer dunklen Schiene */
      g.strokeStyle = "#16181c";
      g.lineWidth = 0.12;
      g.strokeRect(x, y, b, h);
      g.fillStyle = "#b7c0ca";
      for (let k = y + 0.2; k < y + h - 0.1; k += 0.22) {
        g.beginPath(); g.arc(x, k, 0.05, 0, Math.PI * 2); g.fill();
      }
      for (let k = x + 0.2; k < x + b - 0.1; k += 0.22) {
        g.beginPath(); g.arc(k, y, 0.05, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(k, y + h, 0.05, 0, Math.PI * 2); g.fill();
      }
      break;
    }
    case "saeule": {
      g.fillStyle = "rgba(0,0,0,.22)";
      g.beginPath();
      g.arc(x + b / 2 + 0.08, y + h / 2 + 0.12, b / 2, 0, Math.PI * 2);
      g.fill();
      const v = g.createRadialGradient(x + b * 0.4, y + h * 0.4, 0.05, x + b / 2, y + h / 2, b / 2);
      v.addColorStop(0, "#fbf6ea");
      v.addColorStop(1, "#cbbd9f");
      g.fillStyle = v;
      g.beginPath();
      g.arc(x + b / 2, y + h / 2, b / 2, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "tresor": {                                 // Tresortür in der Rückwand
      kasten(g, x, y, b, h, "#555c66", 0.05);
      const cx = x + b / 2, cy = y + h / 2, r = Math.min(b, h) * 0.46;
      const v = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0.05, cx, cy, r);
      v.addColorStop(0, "#d9dee4");
      v.addColorStop(1, "#8a929c");
      g.fillStyle = v;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#3a3f47";
      g.lineWidth = 0.05;
      for (let k = 0; k < 6; k++) {
        const w = (k / 6) * Math.PI * 2;
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(w) * r * 0.7, cy + Math.sin(w) * r * 0.7);
        g.stroke();
      }
      break;
    }
    default:
      schattenUnter(g, m);
      kasten(g, x, y, b, h, m.farbe || "#555", 0.05);
  }
}
