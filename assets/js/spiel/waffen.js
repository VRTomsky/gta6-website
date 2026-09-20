/* ═══════════════════════════════════════════════════════════
   Fäuste und Waffen

   Bisher konnte man nur weglaufen. Jetzt gibt es vier Möglichkeiten,
   sich zu wehren:

     Fäuste          immer dabei, kurze Reichweite
     Pistole         genau, langsam
     Maschinenpistole schnell, streut
     Schrotflinte    sechs Kugeln auf einmal, nur aus der Nähe

   Getroffen wird per Strahl: vom Schützen aus in Schritten nach vorn,
   bis eine Wand oder jemand im Weg ist. Das ist billiger als echte
   Geschosse und fühlt sich bei diesen Entfernungen gleich an.

   Gekauft wird im Waffenladen (grüner Punkt auf der Karte) — dafür ist
   das Geld aus den Aufträgen da.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";

const L = (de, en) => ((window.LANG || document.documentElement.lang || "de").startsWith("en") ? en : de);

export const WAFFEN = {
  faust: {
    name: L("Fäuste", "Fists"), art: "nah",
    schaden: 16, reichweite: 2.0, takt: 0.32
  },
  pistole: {
    name: L("Pistole", "Pistol"), art: "schuss",
    schaden: 28, reichweite: 38, takt: 0.30, streuung: 0.03, kugeln: 1, laut: 1
  },
  mp: {
    name: L("Maschinenpistole", "SMG"), art: "schuss",
    schaden: 16, reichweite: 32, takt: 0.085, streuung: 0.085, kugeln: 1, laut: 0.7
  },
  schrot: {
    name: L("Schrotflinte", "Shotgun"), art: "schuss",
    schaden: 13, reichweite: 17, takt: 0.9, streuung: 0.2, kugeln: 7, laut: 1.3
  }
};

/* Was im Laden steht: Waffe, Preis, Schuss je Kauf */
export const WARE = [
  { waffe: "pistole", preis: 300, munition: 60 },
  { waffe: "mp", preis: 1200, munition: 150 },
  { waffe: "schrot", preis: 1900, munition: 40 },
  { waffe: "munition", preis: 150, munition: 60 }      // Nachschub für alles
];

export class Arsenal {
  constructor() {
    this.reihe = ["faust"];
    this.aktiv = 0;
    this.munition = {};
    this.abklingen = 0;
  }

  get name() { return this.reihe[this.aktiv]; }
  get waffe() { return WAFFEN[this.name]; }
  get schuss() {
    const n = this.name;
    return WAFFEN[n].art === "nah" ? Infinity : (this.munition[n] || 0);
  }

  rechnen(dt) { this.abklingen = Math.max(0, this.abklingen - dt); }

  besitzt(name) { return this.reihe.includes(name); }

  geben(name, schuss) {
    if (!WAFFEN[name]) return;
    if (!this.besitzt(name)) this.reihe.push(name);
    this.munition[name] = (this.munition[name] || 0) + schuss;
  }

  /* Nachschub auf alles, was man schon hat */
  nachladen(schuss) {
    for (const n of this.reihe) {
      if (WAFFEN[n].art === "nah") continue;
      this.munition[n] = (this.munition[n] || 0) + schuss;
    }
  }

  wechseln(richtung) {
    if (this.reihe.length < 2) return this.name;
    this.aktiv = (this.aktiv + richtung + this.reihe.length) % this.reihe.length;
    return this.name;
  }

  waehlen(nummer) {
    if (nummer >= 0 && nummer < this.reihe.length) this.aktiv = nummer;
    return this.name;
  }

  /* Leerer Lauf? Dann auf die Fäuste zurückfallen */
  pruefen() {
    if (this.waffe.art !== "nah" && this.schuss <= 0) this.aktiv = 0;
  }
}

/* ── Treffer suchen ──
   welt: { ziele: [...] } — alles mit x, y und treffer(schaden, von)
   Gibt { strahlen, treffer } zurück. */
export function feuern(arsenal, schuetze, richtung, ziele) {
  if (arsenal.abklingen > 0) return null;
  const w = arsenal.waffe;
  arsenal.abklingen = w.takt;

  const von = { x: schuetze.x, y: schuetze.y };
  const ergebnis = { strahlen: [], treffer: [], art: w.art, laut: w.laut || 0 };

  if (w.art === "nah") {
    for (const z of ziele) {
      if (z === schuetze || z.tot) continue;
      const dx = z.x - von.x, dy = z.y - von.y;
      const d = Math.hypot(dx, dy);
      if (d > w.reichweite) continue;
      let ab = Math.atan2(dy, dx) - richtung;
      while (ab > Math.PI) ab -= Math.PI * 2;
      while (ab < -Math.PI) ab += Math.PI * 2;
      if (Math.abs(ab) > 1.0) continue;
      z.treffer(w.schaden, schuetze);
      ergebnis.treffer.push(z);
    }
    return ergebnis;
  }

  const name = arsenal.name;
  if ((arsenal.munition[name] || 0) <= 0) return null;
  arsenal.munition[name]--;

  for (let k = 0; k < (w.kugeln || 1); k++) {
    const r = richtung + (Math.random() - 0.5) * 2 * w.streuung;
    const treffer = strahl(von, r, w.reichweite, ziele, schuetze);
    ergebnis.strahlen.push({ x1: von.x, y1: von.y, x2: treffer.x, y2: treffer.y });
    if (treffer.wen) {
      treffer.wen.treffer(w.schaden, schuetze);
      ergebnis.treffer.push(treffer.wen);
    }
  }
  arsenal.pruefen();
  return ergebnis;
}

/* Ein Strahl bis zur ersten Wand oder zum ersten Getroffenen */
function strahl(von, richtung, weite, ziele, schuetze) {
  const dx = Math.cos(richtung), dy = Math.sin(richtung);
  const schritt = 0.5;
  let x = von.x, y = von.y;
  for (let s = schritt; s <= weite; s += schritt) {
    x = von.x + dx * s;
    y = von.y + dy * s;
    if (Karte.festAnPunkt(x, y)) return { x, y, wen: null };
    for (const z of ziele) {
      if (z === schuetze || z.tot) continue;
      const r = z.trefferRadius || 0.55;
      if (Math.hypot(z.x - x, z.y - y) < r) return { x: z.x, y: z.y, wen: z };
    }
  }
  return { x, y, wen: null };
}

/* Freie Sicht zwischen zwei Punkten — für die Polizei */
export function sicht(von, nach, weite = 40) {
  const dx = nach.x - von.x, dy = nach.y - von.y;
  const d = Math.hypot(dx, dy);
  if (d > weite) return false;
  const schritte = Math.ceil(d / 1.2);
  for (let k = 1; k < schritte; k++) {
    const t = k / schritte;
    if (Karte.festAnPunkt(von.x + dx * t, von.y + dy * t)) return false;
  }
  return true;
}

/* ── Waffenläden in der Stadt verteilen ── */
export function laedenSetzen(startX, startY) {
  const stellen = [
    { x: startX + 70, y: startY - 50 },
    { x: startX - 110, y: startY + 90 },
    { x: Karte.inMeter(Karte.BREITE) * 0.86, y: Karte.inMeter(Karte.HOEHE) * 0.42 }
  ];
  return stellen.map(s => {
    const p = Karte.freierPunkt(s.x, s.y, [Karte.ART.GEHWEG, Karte.ART.PARKPLATZ], 40);
    return { x: p.x, y: p.y, name: L("Waffenladen", "Gun shop") };
  });
}
