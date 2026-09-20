/* ═══════════════════════════════════════════════════════════
   Polizei und Fahndung

   Fahndungsstufe 0–5. Sie steigt bei echten Delikten — schießen,
   jemanden umbringen, einen Streifenwagen rammen — und fällt wieder,
   wenn eine Weile kein Polizist den Spieler sieht.

   Wie hart sie vorgehen, hängt an der Stufe:

     1     ein Wagen fährt hinterher, Festnahme zu Fuß
     2–3   mehrere Wagen, die Beamten steigen aus und schießen zurück
     4–5   dazu wird gerammt

   Vorher war schon ein angefahrener Fußgänger einen Stern wert und
   gleich drei Wagen haben einen von der Straße geschoben. Das war kein
   Spiel, das war eine Strafe.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import { VerkehrsAuto } from "./verkehr.js";
import { Figur } from "./wesen.js";
import { sicht } from "./waffen.js";
import * as Ton from "./ton.js";

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

  jagen(dt, ziel, autos, hart) {
    this.blinken += dt;
    this.jagdZiel = ziel;

    if (this.freieSicht(ziel)) {
      const zx = ziel.x - this.x, zy = ziel.y - this.y;
      let ab = Math.atan2(zy, zx) - this.winkel;
      while (ab > Math.PI) ab -= Math.PI * 2;
      while (ab < -Math.PI) ab += Math.PI * 2;
      const entfernung = Math.hypot(zx, zy);
      let gas = 1;
      if (Math.abs(ab) > 1.9 && entfernung < 12) gas = -0.7;       // vorbeigeschossen
      /* Bis Stufe 2 wird nicht gerammt: die Streife bleibt ein paar
         Meter hinter dem Spieler und geht vom Gas. */
      if (!hart) {
        if (entfernung < 9) gas = -0.5;
        else if (entfernung < 16) gas = 0.15;
      }
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
    this.nachladen = 1.2;             // bis zum ersten Schuss
    this.griff = 0;                   // wie lange er den Spieler schon hält
  }

  get daten() {
    return { name: "VCPD", tempo: 4.4, rennen: 6.6, breite: 0.7 };
  }

  /* Wer schießt, trägt die Dienstwaffe auch sichtbar in der Hand */
  set schiesst(wert) {
    this._schiesst = wert;
    this.waffenBild = wert ? "waffe_pistole" : null;
    this.waffenBreite = 0.15;
  }
  get schiesst() { return this._schiesst; }

  jagen(dt, ziel) {
    this.aus += dt;
    this.nachladen -= dt;
    const dx = ziel.x - this.x, dy = ziel.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    if (this.tot) return d;
    /* Auf Schussweite bleiben statt stumpf ins Ziel zu rennen */
    const abstand = this.schiesst ? 7 : 0.8;
    const schub = d > abstand ? 1 : -0.4;
    this.bewegen((dx / d) * schub, (dy / d) * schub, d > 6, dt);
    if (d < 40) this.winkel = Math.atan2(dy, dx);
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

  /* Wunschzahl an Streifenwagen für die aktuelle Stufe.
     Bei einem Stern ist es genau einer — vorher waren es zwei bis drei,
     und gegen die kam man zu Fuß nie an. */
  get sollWagen() {
    return [0, 1, 2, 3, 4, 6][this.stufe] || 0;
  }

  /* Ab vier Sternen wird gerammt, ab zwei geschossen */
  get hart() { return this.stufe >= 4; }
  get bewaffnet() { return this.stufe >= 2; }

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

  rechnen(dt, spieler, autos, zustand) {
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
      s.jagen(dt, ziel, autos, this.hart);

      /* Aussteigen: wenn der Spieler zu Fuß ist, aber auch, wenn sein
         Wagen steht — sonst fahren sie nur ewig im Kreis. */
      const zielSteht = spieler.imAuto && Math.hypot(ziel.vx || 0, ziel.vy || 0) < 3.5;
      const raus = (!spieler.imAuto && d < 24) || (zielSteht && d < 18);
      if (raus && this.polizisten.length < this.stufe + 1 && Math.abs(s.tempo) < 7) {
        const seite = { x: -Math.sin(s.winkel), y: Math.cos(s.winkel) };
        const p = new Polizist(s.x + seite.x * 1.6, s.y + seite.y * 1.6, Math.random() < 0.4);
        p.schiesst = this.bewaffnet;
        this.polizisten.push(p);
      }
    }

    for (let k = this.polizisten.length - 1; k >= 0; k--) {
      const p = this.polizisten[k];
      p.schiesst = this.bewaffnet;
      if (p.tot) {
        p.totZeit += dt;
        if (p.totZeit > 20) this.polizisten.splice(k, 1);
        continue;
      }
      const d = p.jagen(dt, ziel);
      if (d < SICHT) gesehen = true;

      /* Ab zwei Sternen wird geschossen — auch auf einen Spieler im Auto */
      if (this.bewaffnet && zustand && d < 24 && p.nachladen <= 0 && sicht(p, ziel, 26)) {
        p.nachladen = 1.2 + Math.random() * 1.1;
        const treffer = Math.random() < 0.42;
        if (treffer) zustand.leben -= 5;
        zustand.strahlen.push({
          x1: p.x, y1: p.y,
          x2: treffer ? ziel.x : ziel.x + (Math.random() - 0.5) * 4,
          y2: treffer ? ziel.y : ziel.y + (Math.random() - 0.5) * 4,
          t: 0.07
        });
        Ton.schuss(0.7);
      }

      /* Festnahme: erst wenn er einen Moment am Spieler dranbleibt */
      if (!spieler.imAuto && d < 1.5 && p.aus > 1.2) p.griff += dt;
      else p.griff = 0;
    }

    /* Aus einem zerstörten Streifenwagen steigen die Beamten aus und
       machen zu Fuß weiter, statt einfach zu verschwinden. */
    for (let k = this.streifen.length - 1; k >= 0; k--) {
      const s = this.streifen[k];
      if (s.schaden <= 118) continue;
      if (this.polizisten.length < this.stufe + 1) {
        const p = new Polizist(s.x + 1.4, s.y + 1.4, Math.random() < 0.4);
        p.schiesst = this.bewaffnet;
        this.polizisten.push(p);
      }
      this.streifen.splice(k, 1);
    }

    /* Fahndung kühlt ab, wenn niemand den Spieler sieht */
    this.ruhe = gesehen ? 0 : this.ruhe + dt;
    if (this.ruhe > 12) {
      this.stufe = Math.max(0, this.stufe - 1);
      this.ruhe = 0;
    }
  }

  /* Alles, worauf geschossen werden kann */
  ziele() {
    return this.polizisten.filter(p => !p.tot);
  }

  /* Wird der Spieler zu Fuß gefasst? */
  verhaftet(spieler) {
    if (spieler.imAuto) return false;
    return this.polizisten.some(p => !p.tot && p.griff > 0.8);
  }

  zeichnen(ctx, kamera, sichtbar) {
    for (const p of this.polizisten) if (sichtbar(p)) p.zeichnen(ctx, kamera);
    for (const s of this.streifen) if (sichtbar(s)) s.zeichnen(ctx, kamera);
  }
}
