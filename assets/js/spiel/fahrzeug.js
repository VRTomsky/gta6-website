/* ═══════════════════════════════════════════════════════════
   Fahrzeuge

   Fahrmodell bewusst arcade-artig: Ein Geschwindigkeitsvektor, der zum
   Teil in Blickrichtung „umgelenkt" wird. Wie stark, hängt am Grip —
   mit Handbremse rutscht der Wagen, ohne klebt er in der Spur. Das
   fährt sich direkt und ist trotzdem leicht zu beherrschen.

   Lenken geht nur, solange der Wagen rollt, und wird mit steigendem
   Tempo weniger — sonst dreht sich das Auto auf der Stelle.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import { malen, schatten } from "./bilder.js";

export const TYPEN = {
  cabrio:  { name: "Vice Cabrio",   lang: 4.45, breit: 1.90, kraft: 15.5, spitze: 41, griff: 0.90 },
  limo:    { name: "Leonida Limo",  lang: 4.80, breit: 1.95, kraft: 13.0, spitze: 36, griff: 0.92 },
  sport:   { name: "Sunset GT",     lang: 4.30, breit: 1.92, kraft: 19.0, spitze: 50, griff: 0.88 },
  pickup:  { name: "Keys Pickup",   lang: 5.10, breit: 2.05, kraft: 12.0, spitze: 33, griff: 0.94 },
  taxi:    { name: "Vice Taxi",     lang: 4.75, breit: 1.95, kraft: 13.5, spitze: 35, griff: 0.92 },
  streife: { name: "VCPD Cruiser",  lang: 4.90, breit: 2.00, kraft: 17.0, spitze: 45, griff: 0.93 }
};

export class Fahrzeug {
  constructor(typ, x, y, winkel = 0) {
    this.typ = typ;
    this.x = x;
    this.y = y;
    this.winkel = winkel;
    this.vx = 0;
    this.vy = 0;
    this.lenkung = 0;
    this.schaden = 0;
    this.fahrer = null;
  }

  get daten() { return TYPEN[this.typ] || TYPEN.limo; }

  /* Tempo in Blickrichtung (negativ = rückwärts) */
  get tempo() {
    return this.vx * Math.cos(this.winkel) + this.vy * Math.sin(this.winkel);
  }

  get kmh() { return Math.abs(Math.hypot(this.vx, this.vy)) * 3.6; }

  /* gas −1…1, lenken −1…1 */
  fahren(gas, lenken, handbremse, dt) {
    const d = this.daten;
    const vor = { x: Math.cos(this.winkel), y: Math.sin(this.winkel) };
    const quer = { x: -vor.y, y: vor.x };
    let vVor = this.vx * vor.x + this.vy * vor.y;
    let vQuer = this.vx * quer.x + this.vy * quer.y;

    /* Antrieb und Bremse */
    if (gas > 0) vVor += d.kraft * gas * dt * (1 - Math.min(0.85, Math.abs(vVor) / d.spitze));
    else if (gas < 0) {
      if (vVor > 0.4) vVor -= 22 * dt;          // bremsen
      else vVor -= d.kraft * 0.55 * dt;          // rückwärts
    } else {
      vVor -= vVor * Math.min(1, dt * 0.9);      // ausrollen
    }
    vVor = Math.max(-14, Math.min(d.spitze, vVor));

    /* Seitenführung: ohne Handbremse rutscht kaum etwas weg */
    const griff = handbremse ? 0.965 : d.griff;
    vQuer *= Math.pow(1 - griff, dt * 8);
    if (handbremse) vVor -= vVor * Math.min(1, dt * 1.6);

    /* Lenken — abhängig vom Tempo, rückwärts andersherum */
    this.lenkung += (lenken - this.lenkung) * Math.min(1, dt * 9);
    const wirkung = Math.min(1, Math.abs(vVor) / 7) * (1 - Math.min(0.55, Math.abs(vVor) / d.spitze));
    this.winkel += this.lenkung * wirkung * 2.9 * dt * Math.sign(vVor || 1);

    const nvor = { x: Math.cos(this.winkel), y: Math.sin(this.winkel) };
    const nquer = { x: -nvor.y, y: nvor.x };
    this.vx = nvor.x * vVor + nquer.x * vQuer;
    this.vy = nvor.y * vVor + nquer.y * vQuer;

    this.schieben(this.vx * dt, this.vy * dt);
  }

  /* Vier Ecken prüfen. Stößt eine an, wird der Wagen zurückgesetzt und
     verliert Schwung — Blech vor Physik. */
  ecken(x = this.x, y = this.y, w = this.winkel) {
    const d = this.daten;
    const c = Math.cos(w), s = Math.sin(w);
    const l = d.lang / 2 - 0.15, b = d.breit / 2 - 0.12;
    return [[l, b], [l, -b], [-l, b], [-l, -b]].map(([fx, fy]) =>
      [x + fx * c - fy * s, y + fx * s + fy * c]);
  }

  frei(x, y) {
    return !this.ecken(x, y).some(([ex, ey]) => Karte.festAnPunkt(ex, ey));
  }

  schieben(mx, my) {
    let getroffen = false;
    if (this.frei(this.x + mx, this.y)) this.x += mx;
    else { getroffen = true; this.vx *= -0.22; }
    if (this.frei(this.x, this.y + my)) this.y += my;
    else { getroffen = true; this.vy *= -0.22; }
    if (getroffen) {
      const wucht = Math.hypot(this.vx, this.vy);
      this.schaden = Math.min(100, this.schaden + wucht * 0.6);
      this.vx *= 0.55;
      this.vy *= 0.55;
    }
  }

  zeichnen(ctx, kamera) {
    const d = this.daten;
    schatten(ctx, kamera, this.x, this.y + 0.25, d.lang * 0.42, d.breit * 0.4);
    malen(ctx, "auto_" + this.typ, kamera, this.x, this.y, this.winkel, d.breit * 1.34);
  }
}

/* Autos in der Nähe von Straßen und Parkplätzen verteilen */
export function autosVerteilen(anzahl, umX, umY, radius) {
  const arten = [Karte.ART.PARKPLATZ, Karte.ART.STRASSE];
  const typen = Object.keys(TYPEN).filter(t => t !== "streife");
  const liste = [];
  for (let i = 0; i < anzahl; i++) {
    const p = Karte.freierPunkt(umX, umY, arten, radius);
    const aufStrasse = Karte.art(Karte.inKachel(p.x), Karte.inKachel(p.y)) === Karte.ART.STRASSE;
    const senkrecht = ((Karte.inKachel(p.x) % 12) + 12) % 12 < 2;
    const typ = typen[Math.floor(Karte.streu(i, 3, 41) * typen.length)];
    const winkel = aufStrasse
      ? (senkrecht ? (Karte.streu(i, 5, 43) > 0.5 ? Math.PI / 2 : -Math.PI / 2)
                   : (Karte.streu(i, 5, 43) > 0.5 ? 0 : Math.PI))
      : Karte.streu(i, 7, 47) * Math.PI * 2;
    liste.push(new Fahrzeug(typ, p.x, p.y, winkel));
  }
  return liste;
}
