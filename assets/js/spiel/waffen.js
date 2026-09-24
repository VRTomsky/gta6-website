/* ═══════════════════════════════════════════════════════════
   Fäuste und Waffen

   Fünf Möglichkeiten, sich zu wehren:

     Fäuste     immer dabei, kurze Reichweite, wirft Leute um
     Pistole    genau, langsam
     Micro-MP   schnell, streut
     Pumpgun    sechs Schrotkugeln, nur aus der Nähe
     AK-47      weit, hart, viel Munition

   Getroffen wird per Strahl: vom Schützen aus in Schritten nach vorn,
   bis eine Wand oder jemand im Weg ist. Das ist billiger als echte
   Geschosse und fühlt sich bei diesen Entfernungen gleich an.

   Die Waffen sind sichtbar: jede hat ein eigenes Bild (waffenbilder.js),
   das in der Hand mitgeführt und im Laden gezeigt wird. Gekauft wird bei
   Ammu-Vice — drei eigene Gebäude in der Stadt.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import { MASSE } from "./waffenbilder.js";

const L = (de, en) => ((window.LANG || document.documentElement.lang || "de").startsWith("en") ? en : de);

export const WAFFEN = {
  faust: {
    name: L("Fäuste", "Fists"), art: "nah",
    schaden: 26, reichweite: 2.1, takt: 0.34
  },
  pistole: {
    name: L("Pistole", "Pistol"), art: "schuss",
    schaden: 30, reichweite: 38, takt: 0.30, streuung: 0.03, kugeln: 1, laut: 1,
    bild: "waffe_pistole", breit: MASSE.pistole.breit
  },
  mp: {
    name: L("Micro-MP", "Micro SMG"), art: "schuss",
    schaden: 17, reichweite: 32, takt: 0.085, streuung: 0.085, kugeln: 1, laut: 0.7,
    bild: "waffe_mp", breit: MASSE.mp.breit
  },
  pumpgun: {
    name: L("Pumpgun", "Pump shotgun"), art: "schuss",
    schaden: 15, reichweite: 18, takt: 0.85, streuung: 0.19, kugeln: 7, laut: 1.3,
    bild: "waffe_pumpgun", breit: MASSE.pumpgun.breit
  },
  ak: {
    name: L("AK-47", "AK-47"), art: "schuss",
    schaden: 26, reichweite: 44, takt: 0.12, streuung: 0.055, kugeln: 1, laut: 1.15,
    bild: "waffe_ak", breit: MASSE.ak.breit
  }
};

/* Was bei Ammu-Vice im Regal liegt */
export const WARE = [
  { waffe: "pistole", preis: 300, munition: 60 },
  { waffe: "mp", preis: 1200, munition: 150 },
  { waffe: "pumpgun", preis: 1900, munition: 40 },
  { waffe: "ak", preis: 3200, munition: 120 },
  { waffe: "munition", preis: 150, munition: 60 },     // Nachschub für alles
  { waffe: "weste", preis: 800, munition: 0 }          // Panzerung auffüllen
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
    this.aktiv = this.reihe.indexOf(name);          // neue Waffe gleich in die Hand
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

/* ── Angreifen ──
   ziele: alles mit x, y, treffer(schaden) und umwerfen(). Gibt
   { strahlen, treffer, art } zurück oder null, wenn nichts passiert. */
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
      if (Math.abs(ab) > 1.1) continue;
      const tot = z.treffer(w.schaden, schuetze);
      /* Wer den Schlag überlebt, geht erst mal zu Boden und wird
         zusätzlich weggestoßen — sonst merkt man gar nichts davon. */
      if (!tot && z.umwerfen) {
        z.umwerfen(2.2 + Math.random());
        z.x += (dx / (d || 1)) * 0.6;
        z.y += (dy / (d || 1)) * 0.6;
      }
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

/* ── Ammu-Vice: die Läden stehen als eigene Gebäude in der Stadt ──
   Der Eingang liegt auf dem Gehweg davor, dort wird E gedrückt. */
export function laedenSetzen(startX, startY) {
  const haeuser = Karte.wahrzeichen.filter(w => w.bau === Karte.BAU.WAFFEN);
  const stellen = haeuser.length
    ? haeuser
    : [{ x: startX + 70, y: startY - 50 }, { x: startX - 110, y: startY + 90 }];

  /* Die Tür liegt auf der nächsten Gehwegkachel am Haus — dort betritt
     man den Verkaufsraum. */
  return stellen.map(s => {
    const tx = Karte.inKachel(s.x), ty = Karte.inKachel(s.y);
    let p = null, bestWeit = Infinity;
    for (let dy = -9; dy <= 9; dy++) {
      for (let dx = -9; dx <= 9; dx++) {
        if (Karte.art(tx + dx, ty + dy) !== Karte.ART.GEHWEG) continue;
        const weit = Math.hypot(dx, dy);
        if (weit >= bestWeit) continue;
        bestWeit = weit;
        p = { x: Karte.inMeter(tx + dx) + Karte.KACHEL / 2,
              y: Karte.inMeter(ty + dy) + Karte.KACHEL / 2 };
      }
    }
    if (!p) p = Karte.freierPunkt(s.x, s.y, [Karte.ART.GEHWEG], 26);
    return { x: p.x, y: p.y, haus: { x: s.x, y: s.y }, name: "Ammu-Vice", start: "ammu_laden" };
  });
}
