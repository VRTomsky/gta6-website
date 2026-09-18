/* ═══════════════════════════════════════════════════════════
   Polizei und Fahndung

   Fahndungsstufe 0–5. Sie steigt, wenn man Leute überfährt oder
   Streifenwagen rammt, und fällt wieder, wenn eine Weile kein Polizist
   den Spieler sieht.

   Streifenwagen fahren auf den Spieler zu und versuchen ihn zu rammen.
   Ist der Spieler zu Fuß, steigen Polizisten aus und verhaften ihn bei
   Berührung. Beides benutzt dieselbe Physik wie der Rest.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import { Fahrzeug } from "./fahrzeug.js";
import { Figur } from "./wesen.js";

export const STUFEN = 5;
const SICHT = 95;                     // so weit sieht die Polizei

export class Streife extends Fahrzeug {
  constructor(x, y, winkel) {
    super("streife", x, y, winkel);
    this.blinken = Math.random() * 10;
  }

  jagen(dt, ziel, autos) {
    this.blinken += dt;
    const zx = ziel.x - this.x, zy = ziel.y - this.y;
    const entfernung = Math.hypot(zx, zy);

    let ab = Math.atan2(zy, zx) - this.winkel;
    while (ab > Math.PI) ab -= Math.PI * 2;
    while (ab < -Math.PI) ab += Math.PI * 2;

    /* Vor Hindernissen ausweichen: etwas nach der freien Seite lenken */
    const vor = { x: Math.cos(this.winkel), y: Math.sin(this.winkel) };
    const blick = 6 + Math.abs(this.tempo) * 0.6;
    const hindernis = Karte.festAnPunkt(this.x + vor.x * blick, this.y + vor.y * blick);
    let lenken = Math.max(-1, Math.min(1, ab * 2.0));
    if (hindernis) lenken = ab > 0 ? -1 : 1;

    let gas = 1;
    if (entfernung < 6 && Math.abs(ab) > 1.2) gas = -0.6;          // vorbeigeschossen
    if (Math.abs(this.tempo) > 22 && Math.abs(ab) > 0.9) gas = 0;  // vor der Kurve vom Gas

    this.fahren(gas, lenken, false, dt);
  }

  zeichnen(ctx, kamera) {
    super.zeichnen(ctx, kamera);
    /* Blaulicht: zwei Lichtkegel, die abwechselnd aufblitzen */
    const an = Math.floor(this.blinken * 5) % 2 === 0;
    const px = (this.x - kamera.x) * kamera.zoom + kamera.breite / 2;
    const py = (this.y - kamera.y) * kamera.zoom + kamera.hoehe / 2;
    const r = kamera.zoom * 1.1;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, an ? "rgba(90,150,255,.5)" : "rgba(255,70,90,.5)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class Polizist extends Figur {
  constructor(x, y, weiblich = false) {
    super(weiblich ? "polizistin" : "polizist", x, y);
    this.aus = 0;                     // Zeit seit dem Aussteigen
  }

  get daten() {
    return { name: "VCPD", tempo: 4.4, rennen: 6.6, breite: 0.7 };
  }

  jagen(dt, ziel) {
    this.aus += dt;
    const dx = ziel.x - this.x, dy = ziel.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    this.bewegen(dx / d, dy / d, true, dt);
    return d;
  }
}

/* ── Verwaltung ── */
export class Fahndung {
  constructor() {
    this.stufe = 0;
    this.ruhe = 0;                    // Sekunden ohne Sichtkontakt
    this.streifen = [];
    this.polizisten = [];
  }

  melden(punkte) {
    this.stufe = Math.min(STUFEN, this.stufe + punkte);
    this.ruhe = 0;
  }

  loeschen() {
    this.stufe = 0;
    this.ruhe = 0;
    this.streifen.length = 0;
    this.polizisten.length = 0;
  }

  /* Wunschzahl an Streifenwagen für die aktuelle Stufe */
  get sollWagen() {
    return this.stufe === 0 ? 0 : Math.min(6, this.stufe + 1);
  }

  nachschub(zielX, zielY) {
    while (this.streifen.length < this.sollWagen) {
      const p = Karte.freierPunkt(zielX + (Math.random() - 0.5) * 120,
                                  zielY + (Math.random() - 0.5) * 120,
                                  [Karte.ART.STRASSE], 70);
      const weit = Math.hypot(p.x - zielX, p.y - zielY);
      if (weit < 45) { /* zu nah: trotzdem nehmen, sonst hängt die Schleife */ }
      this.streifen.push(new Streife(p.x, p.y, Math.random() * Math.PI * 2));
    }
    while (this.streifen.length > this.sollWagen) this.streifen.pop();
  }

  rechnen(dt, spieler, autos) {
    if (this.stufe === 0) {
      this.streifen.length = 0;
      this.polizisten.length = 0;
      return;
    }

    const ziel = spieler.imAuto || spieler;
    this.nachschub(ziel.x, ziel.y);

    let gesehen = false;
    for (const s of this.streifen) {
      const d = Math.hypot(s.x - ziel.x, s.y - ziel.y);
      if (d < SICHT) gesehen = true;
      s.jagen(dt, ziel, autos);

      /* Ist der Spieler zu Fuß und die Streife nah, steigt ein Polizist aus */
      if (!spieler.imAuto && d < 22 && this.polizisten.length < this.stufe + 1 && Math.abs(s.tempo) < 6) {
        this.polizisten.push(new Polizist(s.x + 1.5, s.y + 1.5, Math.random() < 0.4));
      }
    }

    for (const p of this.polizisten) {
      const d = p.jagen(dt, ziel);
      if (d < SICHT) gesehen = true;
    }

    /* Fahndung kühlt ab, wenn niemand den Spieler sieht */
    this.ruhe = gesehen ? 0 : this.ruhe + dt;
    if (this.ruhe > 14) {
      this.stufe = Math.max(0, this.stufe - 1);
      this.ruhe = 0;
    }
  }

  /* Wird der Spieler zu Fuß gefasst? */
  verhaftet(spieler) {
    if (spieler.imAuto) return false;
    return this.polizisten.some(p => Math.hypot(p.x - spieler.x, p.y - spieler.y) < 1.3 && p.aus > 1.2);
  }

  zeichnen(ctx, kamera, sichtbar) {
    for (const p of this.polizisten) if (sichtbar(p)) p.zeichnen(ctx, kamera);
    for (const s of this.streifen) if (sichtbar(s)) s.zeichnen(ctx, kamera);
  }
}
