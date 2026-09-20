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
  streife: { name: "VCPD Cruiser",  lang: 4.90, breit: 2.00, kraft: 17.0, spitze: 45, griff: 0.93 },
  kombi:   { name: "Gellhorn Kombi", lang: 4.95, breit: 1.98, kraft: 12.5, spitze: 34, griff: 0.93 },
  transporter: { name: "Leonida Van", lang: 5.40, breit: 2.10, kraft: 11.0, spitze: 30, griff: 0.95 },
  bus:     { name: "Vice Transit",  lang: 9.20, breit: 2.45, kraft: 8.5,  spitze: 26, griff: 0.97 },
  oldtimer:{ name: "Ocean Classic", lang: 5.20, breit: 2.05, kraft: 11.5, spitze: 32, griff: 0.90 },
  krankenwagen: { name: "VC Rettung", lang: 5.60, breit: 2.20, kraft: 13.0, spitze: 34, griff: 0.94 },
  feuerwehr: { name: "VCFD Löschzug", lang: 7.80, breit: 2.50, kraft: 10.0, spitze: 28, griff: 0.96 }
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
    const d0 = this.daten;
    /* Ein zerbeulter Wagen zieht schlechter und läuft nicht mehr voll —
       hinausgeworfen wird aber niemand mehr, das war das Nervigste am
       Fahren. */
    const d = this.schrott
      ? { ...d0, kraft: d0.kraft * 0.55, spitze: d0.spitze * 0.6 }
      : d0;
    this.entklemmen();
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

  /* Nach einem harten Treffer kann der Wagen mit einer Ecke in der Wand
     stecken. Dann ist jede Bewegung blockiert und nichts geht mehr —
     deshalb wird er hier herausgeschoben. */
  entklemmen() {
    if (this.frei(this.x, this.y)) return false;
    for (let r = 0.4; r <= 12; r += 0.4) {
      for (let i = 0; i < 16; i++) {
        const w = (i / 16) * Math.PI * 2;
        const x = this.x + Math.cos(w) * r, y = this.y + Math.sin(w) * r;
        if (this.frei(x, y)) {
          this.x = x; this.y = y;
          this.vx *= 0.2; this.vy *= 0.2;
          return true;
        }
      }
    }
    return false;
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
      /* Ein Stück von der Wand wegsetzen, damit der nächste Gasstoß greift */
      const raus = 0.12;
      if (this.frei(this.x - Math.sign(mx) * raus, this.y)) this.x -= Math.sign(mx) * raus;
      if (this.frei(this.x, this.y - Math.sign(my) * raus)) this.y -= Math.sign(my) * raus;
    }
  }

  zeichnen(ctx, kamera) {
    const d = this.daten;
    schatten(ctx, kamera, this.x, this.y + 0.25, d.lang * 0.42, d.breit * 0.4);
    malen(ctx, "auto_" + this.typ, kamera, this.x, this.y, this.winkel, d.breit * 1.34);
    if (this.schrott) this.rauchMalen(ctx, kamera);
  }

  /* Qualm aus der Motorhaube — das Zeichen dafür, dass der Wagen hinüber
     ist. Drei Wolken, die aufsteigen und verblassen. */
  rauchMalen(ctx, kamera) {
    const z = kamera.zeit || (performance.now() / 1000);
    const vorn = { x: Math.cos(this.winkel), y: Math.sin(this.winkel) };
    const px = (this.x + vorn.x * this.daten.lang * 0.38 - kamera.x) * kamera.zoom + kamera.breite / 2;
    const py = (this.y + vorn.y * this.daten.lang * 0.38 - kamera.y) * kamera.zoom + kamera.hoehe / 2;
    ctx.save();
    for (let k = 0; k < 3; k++) {
      const t = ((z * 0.9 + k / 3) % 1);
      const r = kamera.zoom * (0.25 + t * 0.55);
      ctx.fillStyle = `rgba(120,124,134,${0.34 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(px, py - t * kamera.zoom * 0.9, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/* ── Parkende Autos ──
   Sie standen früher irgendwo auf der Fahrbahn und oft zu mehreren
   ineinander — beim Start sah es aus wie ein Schrottplatz. Jetzt gilt:
   Parkplätze zuerst, auf der Straße nur am Fahrbahnrand, immer längs zur
   Straße und nie näher als eine Wagenlänge am nächsten Auto. */
export function autosVerteilen(anzahl, umX, umY, radius, meiden = []) {
  const typen = Object.keys(TYPEN).filter(t => t !== "streife");
  const liste = [];

  const frei = (x, y) => {
    for (const a of liste) if (Math.hypot(a.x - x, a.y - y) < 6.5) return false;
    for (const a of meiden) if (Math.hypot(a.x - x, a.y - y) < 9) return false;
    return true;
  };

  for (let versuch = 0; versuch < anzahl * 40 && liste.length < anzahl; versuch++) {
    const w = Karte.streu(versuch, 1, 31) * Math.PI * 2;
    const r = 12 + Karte.streu(versuch, 2, 37) * radius;
    const px = umX + Math.cos(w) * r, py = umY + Math.sin(w) * r;
    const tx = Karte.inKachel(px), ty = Karte.inKachel(py);
    const a = Karte.art(tx, ty);
    if (a !== Karte.ART.PARKPLATZ && a !== Karte.ART.STRASSE) continue;

    let x, y, winkel;
    if (a === Karte.ART.PARKPLATZ) {
      x = Karte.inMeter(tx) + Karte.KACHEL / 2;
      y = Karte.inMeter(ty) + Karte.KACHEL / 2;
      winkel = Math.round(Karte.streu(versuch, 5, 43) * 3) * (Math.PI / 2);
    } else {
      /* Am Rand der Fahrbahn parken, nicht mitten in der Spur */
      const senkrecht = Karte.istStrasse(tx, ty + 2) && Karte.istStrasse(tx, ty - 2);
      const band = Karte.bandGrenzen(tx, ty, senkrecht);
      if (band.breite < 3) continue;                 // schmale Gasse bleibt frei
      const rand = Karte.streu(versuch, 6, 51) < 0.5 ? band.von : band.bis;
      if (senkrecht) {
        x = Karte.inMeter(rand) + Karte.KACHEL / 2;
        y = Karte.inMeter(ty) + Karte.KACHEL / 2;
        winkel = rand === band.von ? Math.PI / 2 : -Math.PI / 2;
      } else {
        x = Karte.inMeter(tx) + Karte.KACHEL / 2;
        y = Karte.inMeter(rand) + Karte.KACHEL / 2;
        winkel = rand === band.von ? 0 : Math.PI;
      }
    }

    if (!frei(x, y)) continue;
    const typ = typen[Math.floor(Karte.streu(versuch, 3, 41) * typen.length)];
    const auto = new Fahrzeug(typ, x, y, winkel);
    if (!auto.frei(x, y)) continue;                  // steckt in einer Wand
    liste.push(auto);
  }
  return liste;
}
