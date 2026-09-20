/* ═══════════════════════════════════════════════════════════
   Wegfindung auf dem Straßennetz

   Bisher zog die Minikarte eine gerade Linie zum Ziel — quer über
   Häuser, Parks und den Fluss. Hier wird stattdessen ein Weg gesucht,
   den man wirklich fahren kann: A* über die befahrbaren Kacheln.

   Damit das nicht jeden Bildaufbau kostet, merkt sich `Route` das
   Ergebnis und rechnet nur neu, wenn sich Ziel oder Standort deutlich
   verschoben haben.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";

const B = Karte.BREITE, H = Karte.HOEHE, N = B * H;
const idx = (tx, ty) => ty * B + tx;

/* Arbeitsfelder einmal anlegen. `marke` spart das Nullsetzen: jede Suche
   bekommt eine eigene Nummer, alles Ältere gilt als unbesucht. */
const kosten = new Float32Array(N);
const her = new Int32Array(N);
const marke = new Int32Array(N);
let lauf = 0;

const befahrbar = (tx, ty) =>
  tx >= 0 && ty >= 0 && tx < B && ty < H && Karte.istStrasse(tx, ty);

/* Nächste Straßenkachel zu einem Punkt — der Spieler steht oft auf dem
   Gehweg oder in einem Park. */
export function naechsteStrasse(x, y, radius = 20) {
  const t0x = Karte.inKachel(x), t0y = Karte.inKachel(y);
  if (befahrbar(t0x, t0y)) return { tx: t0x, ty: t0y };
  for (let r = 1; r <= radius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (befahrbar(t0x + dx, t0y + dy)) return { tx: t0x + dx, ty: t0y + dy };
      }
    }
  }
  return null;
}

/* ── Kleiner Haufen (Min-Heap) für die offene Liste ── */
class Haufen {
  constructor() { this.wert = []; this.stelle = []; }
  get leer() { return this.stelle.length === 0; }
  rein(stelle, wert) {
    this.stelle.push(stelle);
    this.wert.push(wert);
    let k = this.stelle.length - 1;
    while (k > 0) {
      const e = (k - 1) >> 1;
      if (this.wert[e] <= this.wert[k]) break;
      this.tauschen(k, e);
      k = e;
    }
  }
  raus() {
    const oben = this.stelle[0];
    const s = this.stelle.pop(), w = this.wert.pop();
    if (this.stelle.length) {
      this.stelle[0] = s; this.wert[0] = w;
      let k = 0;
      for (;;) {
        const l = k * 2 + 1, r = l + 1;
        let klein = k;
        if (l < this.wert.length && this.wert[l] < this.wert[klein]) klein = l;
        if (r < this.wert.length && this.wert[r] < this.wert[klein]) klein = r;
        if (klein === k) break;
        this.tauschen(k, klein);
        k = klein;
      }
    }
    return oben;
  }
  tauschen(a, b) {
    const s = this.stelle[a]; this.stelle[a] = this.stelle[b]; this.stelle[b] = s;
    const w = this.wert[a]; this.wert[a] = this.wert[b]; this.wert[b] = w;
  }
}

const NACHBARN = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/* Weg von Punkt zu Punkt in Metern. Gibt eine Liste von Eckpunkten
   zurück oder null, wenn es keinen Weg gibt. */
export function route(vonX, vonY, nachX, nachY) {
  const a = naechsteStrasse(vonX, vonY);
  const b = naechsteStrasse(nachX, nachY, 26);
  if (!a || !b) return null;
  const start = idx(a.tx, a.ty), ziel = idx(b.tx, b.ty);
  if (start === ziel) return [{ x: vonX, y: vonY }, { x: nachX, y: nachY }];

  lauf++;
  const zx = b.tx, zy = b.ty;
  const haufen = new Haufen();
  marke[start] = lauf;
  kosten[start] = 0;
  her[start] = -1;
  haufen.rein(start, 0);

  let gefunden = false;
  let schritte = 0;
  while (!haufen.leer && schritte++ < 60000) {
    const p = haufen.raus();
    if (p === ziel) { gefunden = true; break; }
    const px = p % B, py = (p / B) | 0;
    const k = kosten[p];
    for (const [dx, dy] of NACHBARN) {
      const nx = px + dx, ny = py + dy;
      if (!befahrbar(nx, ny)) continue;
      const q = idx(nx, ny);
      /* Autobahn ist schneller, Brücken zählen normal */
      const schritt = Karte.art(nx, ny) === Karte.ART.AUTOBAHN ? 0.75 : 1;
      const neu = k + schritt;
      if (marke[q] === lauf && kosten[q] <= neu) continue;
      marke[q] = lauf;
      kosten[q] = neu;
      her[q] = p;
      haufen.rein(q, neu + Math.abs(nx - zx) + Math.abs(ny - zy));
    }
  }
  if (!gefunden) return null;

  /* Rückwärts auflesen und gerade Stücke zusammenfassen */
  const roh = [];
  for (let p = ziel; p !== -1; p = her[p]) {
    roh.push({ x: Karte.inMeter(p % B) + Karte.KACHEL / 2,
               y: Karte.inMeter((p / B) | 0) + Karte.KACHEL / 2 });
    if (her[p] === -1) break;
  }
  roh.reverse();

  const weg = [{ x: vonX, y: vonY }];
  for (let k = 1; k < roh.length - 1; k++) {
    const v = roh[k - 1], m = roh[k], n = roh[k + 1];
    const gerade = (v.x === m.x && m.x === n.x) || (v.y === m.y && m.y === n.y);
    if (!gerade) weg.push(m);
  }
  weg.push({ x: nachX, y: nachY });
  return weg;
}

/* ── Gemerkte Route ──
   Rechnet höchstens alle paar Zehntelsekunden neu und nur dann, wenn es
   sich lohnt. */
export class Route {
  constructor() {
    this.punkte = null;
    this.ziel = null;
    this.stand = null;
    this.alter = 99;
    this.laenge = 0;
  }

  leeren() {
    this.punkte = null;
    this.ziel = null;
    this.laenge = 0;
  }

  /* Eine ganze Suche kostet je nach Entfernung bis zu 20 ms. Deshalb
     wird nur neu gesucht, wenn das Ziel wechselt oder man die Strecke
     verlassen hat; sonst werden nur die zurückgelegten Stücke
     abgeschnitten — das kostet nichts. */
  aktualisieren(vonX, vonY, ziel, dt) {
    this.alter += dt;
    if (!ziel) { this.leeren(); return null; }

    const neuesZiel = !this.ziel || Math.hypot(this.ziel.x - ziel.x, this.ziel.y - ziel.y) > 5;
    if (neuesZiel || !this.punkte) {
      if (neuesZiel || this.alter > 1.2) this.suchen(vonX, vonY, ziel);
      return this.punkte;
    }

    const naechster = this.abschnitt(vonX, vonY);
    if (naechster.k > 1) this.punkte.splice(1, naechster.k - 1);
    this.punkte[0] = { x: vonX, y: vonY };
    if (naechster.abstand > 28 && this.alter > 1.2) this.suchen(vonX, vonY, ziel);
    else this.laengeRechnen();
    return this.punkte;
  }

  suchen(vonX, vonY, ziel) {
    this.punkte = route(vonX, vonY, ziel.x, ziel.y);
    this.ziel = { x: ziel.x, y: ziel.y };
    this.stand = { x: vonX, y: vonY };
    this.alter = 0;
    this.laengeRechnen();
  }

  laengeRechnen() {
    this.laenge = 0;
    if (!this.punkte) return;
    for (let k = 1; k < this.punkte.length; k++) {
      this.laenge += Math.hypot(this.punkte[k].x - this.punkte[k - 1].x,
                                this.punkte[k].y - this.punkte[k - 1].y);
    }
  }

  /* Nächster Abschnitt der Strecke zum Standort: Index und Abstand */
  abschnitt(x, y) {
    let beste = { k: 1, abstand: Infinity };
    for (let k = 1; k < this.punkte.length; k++) {
      const a = this.punkte[k - 1], b = this.punkte[k];
      const dx = b.x - a.x, dy = b.y - a.y;
      const l2 = dx * dx + dy * dy;
      const t = l2 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / l2)) : 0;
      const d = Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t));
      if (d < beste.abstand) beste = { k, abstand: d };
    }
    return beste;
  }
}
