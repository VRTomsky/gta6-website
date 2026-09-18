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
import { VerkehrsAuto } from "./verkehr.js";
import { Figur } from "./wesen.js";

export const STUFEN = 5;
const SICHT = 95;                     // so weit sieht die Polizei

export class Streife extends VerkehrsAuto {
  constructor(x, y, dx, dy) {
    super("streife", x, y, dx, dy);
    this.wunschTempo = 22;                   // deutlich schneller als der Verkehr
    this.blinken = Math.random() * 10;
    this.ziel = null;
    this.jagdZiel = null;
    this.zielSuchen();
  }

  /* An der Kreuzung die Richtung nehmen, die näher an den Spieler führt —
     dadurch fahren die Streifen durch das Straßennetz statt gegen Wände. */
  abbiegen() {
    const z = this.jagdZiel;
    if (!z) return super.abbiegen();
    const wahl = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }]
      .filter(r => Karte.istStrasse(Karte.inKachel(this.x) + r.dx * 3, Karte.inKachel(this.y) + r.dy * 3))
      .map(r => ({
        r,
        weit: Math.hypot(z.x - (this.x + r.dx * 40), z.y - (this.y + r.dy * 40))
      }))
      .sort((a, b) => a.weit - b.weit);
    const beste = wahl[0] ? wahl[0].r : { dx: -this.dx, dy: -this.dy };
    this.dx = beste.dx;
    this.dy = beste.dy;
    this.zielSuchen();
  }

  /* Freie Sicht auf den Spieler? Dann direkt drauf zu. */
  freieSicht(ziel) {
    const dx = ziel.x - this.x, dy = ziel.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d > 45) return false;
    const schritte = Math.ceil(d / 3);
    for (let i = 1; i < schritte; i++) {
      const t = i / schritte;
      if (Karte.festAnPunkt(this.x + dx * t, this.y + dy * t)) return false;
    }
    return true;
  }

  jagen(dt, ziel, autos) {
    this.blinken += dt;
    this.jagdZiel = ziel;

    if (this.freieSicht(ziel)) {
      /* Direkt drauf zu — rammen ist erlaubt */
      const zx = ziel.x - this.x, zy = ziel.y - this.y;
      let ab = Math.atan2(zy, zx) - this.winkel;
      while (ab > Math.PI) ab -= Math.PI * 2;
      while (ab < -Math.PI) ab += Math.PI * 2;
      const entfernung = Math.hypot(zx, zy);
      let gas = 1;
      if (Math.abs(ab) > 1.9 && entfernung < 12) gas = -0.7;       // vorbeigeschossen
      this.fahren(gas, Math.max(-1, Math.min(1, ab * 2.2)), false, dt);
      this.ziel = null;
      return;
    }

    /* Sonst über das Straßennetz heranfahren, ohne auf Ampeln zu achten */
    if (!this.ziel) this.zielSuchen();
    if (!this.ziel) { this.abbiegen(); return; }
    const dx = this.ziel.x - this.x, dy = this.ziel.y - this.y;
    if (Math.hypot(dx, dy) < 5) { this.abbiegen(); return; }
    let ab = Math.atan2(dy, dx) - this.winkel;
    while (ab > Math.PI) ab -= Math.PI * 2;
    while (ab < -Math.PI) ab += Math.PI * 2;
    const frei = this.freiVoraus(autos, []);
    this.fahren(frei ? 1 : -0.4, Math.max(-1, Math.min(1, ab * 2.2)), false, dt);
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
      const senkrecht = Math.random() < 0.5;
      this.streifen.push(new Streife(p.x, p.y,
        senkrecht ? 0 : (Math.random() < 0.5 ? 1 : -1),
        senkrecht ? (Math.random() < 0.5 ? 1 : -1) : 0));
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
