/* ═══════════════════════════════════════════════════════════
   Figuren zu Fuß — Jason, Lucia und später Passanten

   Bewegung: Beschleunigung in Laufrichtung, Reibung, Anstoßen an
   Gebäuden. Die Laufanimation hängt an der zurückgelegten Strecke,
   nicht an der Zeit — dadurch passt sie bei jedem Tempo.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import { malen, schatten } from "./bilder.js";

export const FIGUREN = {
  lucia: { name: "Lucia", tempo: 4.6, rennen: 7.4, breite: 0.62 },
  jason: { name: "Jason", tempo: 4.3, rennen: 7.0, breite: 0.70 }
};

const RADIUS = 0.32;                    // Kollisionskreis in Metern
const BILDER_LAUF = 8;

export class Figur {
  constructor(art, x, y) {
    this.art = art;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.winkel = -Math.PI / 2;         // schaut nach oben
    this.strecke = 0;
    this.imAuto = null;
  }

  get daten() { return FIGUREN[this.art] || FIGUREN.lucia; }

  /* dx/dy: gewünschte Richtung (−1…1), rennen: Schub */
  bewegen(dx, dy, rennen, dt) {
    const d = this.daten;
    const ziel = rennen ? d.rennen : d.tempo;
    const laenge = Math.hypot(dx, dy);

    if (laenge > 0.01) {
      dx /= laenge; dy /= laenge;
      this.vx += (dx * ziel - this.vx) * Math.min(1, dt * 12);
      this.vy += (dy * ziel - this.vy) * Math.min(1, dt * 12);
      this.winkel = Math.atan2(this.vy, this.vx);
    } else {
      this.vx -= this.vx * Math.min(1, dt * 14);
      this.vy -= this.vy * Math.min(1, dt * 14);
    }

    this.schieben(this.vx * dt, this.vy * dt);
    this.strecke += Math.hypot(this.vx, this.vy) * dt;
  }

  /* Bewegt die Figur und lässt sie an Hindernissen entlanggleiten:
     erst x, dann y — so bleibt man an Hauswänden nicht kleben. */
  schieben(mx, my) {
    if (!this.blockiert(this.x + mx, this.y)) this.x += mx;
    if (!this.blockiert(this.x, this.y + my)) this.y += my;
  }

  blockiert(x, y) {
    for (const [ex, ey] of [[RADIUS, 0], [-RADIUS, 0], [0, RADIUS], [0, -RADIUS]]) {
      if (Karte.festAnPunkt(x + ex, y + ey)) return true;
    }
    return false;
  }

  get tempo() { return Math.hypot(this.vx, this.vy); }

  bildname() {
    if (this.tempo < 0.35) return `${this.art}_steht`;
    const i = Math.floor((this.strecke / 0.9) % BILDER_LAUF);
    return `${this.art}_lauf${i}`;
  }

  zeichnen(ctx, kamera) {
    if (this.imAuto) return;
    schatten(ctx, kamera, this.x, this.y + 0.12, 0.42, 0.3);
    malen(ctx, this.bildname(), kamera, this.x, this.y, this.winkel);
  }
}
