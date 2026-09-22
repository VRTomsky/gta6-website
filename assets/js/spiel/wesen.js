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
const SPRUNG = 0.5;                     // Dauer eines Sprungs in Sekunden
const SCHLAG = 0.28;                    // Dauer der Schlaganimation

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
    this.leben = 100;
    this.tot = false;
    this.totZeit = 0;
    this.trefferRadius = 0.55;
    this.sprung = 0;                    // Restzeit des Sprungs
    this.ko = 0;                        // liegt gerade am Boden
    this.schlag = 0;                    // Restzeit der Schlaganimation
    this.waffenBild = null;             // Sprite der getragenen Waffe
    this.waffenBreite = 0.5;
    /* Jason und Lucia sind etwas größer gezeichnet als die Passanten —
       zusammen mit Ring und Namensschild erkennt man sie sofort. Seit die
       Sprites aus den Bögen kommen, reicht ein kleiner Zuschlag. */
    this.faktor = art === "lucia" || art === "jason" ? 1.06 : 1;
  }

  get daten() { return FIGUREN[this.art] || FIGUREN.lucia; }

  /* Schaden einstecken. `von` ist der Verursacher — die Polizei will
     wissen, wer geschossen hat. */
  treffer(schaden) {
    if (this.tot) return false;
    this.leben -= schaden;
    if (this.leben <= 0) {
      this.leben = 0;
      this.tot = true;
      this.totZeit = 0;
      this.vx = this.vy = 0;
      return true;
    }
    return false;
  }

  /* Sprung — in jedem GTA drin, hier ein kurzer Hüpfer nach vorn */
  springen() {
    if (this.sprung > 0 || this.ko > 0 || this.tot || this.imAuto) return false;
    this.sprung = SPRUNG;
    return true;
  }

  /* Höhe über dem Boden in Metern (nur fürs Zeichnen) */
  get hoch() {
    return this.sprung > 0 ? Math.sin((1 - this.sprung / SPRUNG) * Math.PI) * 0.9 : 0;
  }

  /* Von einem Schlag umgerissen: liegt ein paar Sekunden */
  umwerfen(dauer = 3) {
    if (this.tot) return;
    this.ko = Math.max(this.ko, dauer);
    this.vx = this.vy = 0;
  }

  /* Schlagbewegung auslösen (die Sprites haben kein eigenes Bild dafür,
     die Figur holt stattdessen sichtbar aus) */
  ausholen() { this.schlag = SCHLAG; }

  /* dx/dy: gewünschte Richtung (−1…1), rennen: Schub */
  bewegen(dx, dy, rennen, dt) {
    if (this.tot) return;
    if (this.sprung > 0) this.sprung = Math.max(0, this.sprung - dt);
    if (this.schlag > 0) this.schlag = Math.max(0, this.schlag - dt);
    if (this.ko > 0) {
      this.ko -= dt;
      this.vx -= this.vx * Math.min(1, dt * 8);
      this.vy -= this.vy * Math.min(1, dt * 8);
      return;
    }
    const d = this.daten;
    this.entklemmen();
    const ziel = (rennen ? d.rennen : d.tempo) * (this.sprung > 0 ? 1.35 : 1);
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

  /* Steckt die Figur in einer Wand — etwa weil sie dort abgesetzt wurde —,
     wird der nächste freie Platz gesucht. Ohne das kann man sich nur noch
     drehen, aber nicht mehr bewegen. */
  entklemmen() {
    if (!this.blockiert(this.x, this.y)) return false;
    for (let r = 0.5; r <= 14; r += 0.5) {
      for (let i = 0; i < 16; i++) {
        const w = (i / 16) * Math.PI * 2;
        const x = this.x + Math.cos(w) * r, y = this.y + Math.sin(w) * r;
        if (!this.blockiert(x, y)) {
          this.x = x; this.y = y;
          this.vx = this.vy = 0;
          return true;
        }
      }
    }
    return false;
  }

  get tempo() { return Math.hypot(this.vx, this.vy); }

  bildname() {
    if (!MIT_LAUF.has(this.art) || this.tempo < 0.35) return `${this.art}_steht`;
    const i = Math.floor((this.strecke / 0.9) % BILDER_LAUF);
    return `${this.art}_lauf${i}`;
  }

  /* Wer kein Laufbild hat, bekommt die Bewegung angedeutet: ein leichtes
     Wiegen um die Hochachse und ein kleines Auf und Ab. Bei 50 Bildpunkten
     Körpergröße liest sich das wie ein Schritt. */
  get wiegen() {
    if (MIT_LAUF.has(this.art) || this.tempo < 0.35) return 0;
    return Math.sin(this.strecke * 4.4) * 0.09;
  }

  zeichnen(ctx, kamera) {
    if (this.imAuto) return;
    const px = (this.x - kamera.x) * kamera.zoom + kamera.breite / 2;
    const py = (this.y - kamera.y) * kamera.zoom + kamera.hoehe / 2;

    if (this.tot || this.ko > 0) {
      /* Liegend: flach und blass, bei Toten dazu ein dunkler Fleck */
      ctx.save();
      if (this.tot) {
        ctx.fillStyle = "rgba(90,12,24,.5)";
        ctx.beginPath();
        ctx.ellipse(px, py + kamera.zoom * 0.1, kamera.zoom * 0.62, kamera.zoom * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = this.tot ? 0.8 : 0.9;
      malen(ctx, `${this.art}_steht`, kamera, this.x, this.y, this.winkel + Math.PI / 2,
            0, this.faktor * 0.9);
      ctx.restore();
      return;
    }

    const h = this.hoch;
    schatten(ctx, kamera, this.x, this.y + 0.12, 0.42 * (1 - h * 0.3), 0.3 * (1 - h * 0.3));

    /* Beim Schlagen holt die Figur sichtbar aus: kurz nach vorn versetzt */
    const schwung = this.schlag > 0 ? Math.sin((1 - this.schlag / SCHLAG) * Math.PI) : 0;
    const vx = Math.cos(this.winkel), vy = Math.sin(this.winkel);
    const zx = this.x + vx * schwung * 0.22;
    const zy = this.y + vy * schwung * 0.22 - h;

    malen(ctx, this.bildname(), kamera, zx, zy - Math.abs(this.wiegen) * 0.12,
          this.winkel + this.wiegen, 0, this.faktor * (1 + h * 0.14));

    /* Waffe in der Hand — seitlich neben der Figur, in Blickrichtung */
    if (this.waffenBild) {
      const qx = -vy, qy = vx;
      /* Etwas größer als in Wirklichkeit — sonst sind sechs Bildpunkte
         auf dunklem Asphalt nicht zu erkennen. */
      malen(ctx, this.waffenBild, kamera,
            zx + vx * 0.3 + qx * 0.22, zy + vy * 0.3 + qy * 0.22,
            this.winkel, this.waffenBreite * 1.7);
    }

    /* Faust: ein kleiner heller Bogen vor der Figur */
    if (schwung > 0.05) {
      const fx = (zx + vx * (0.5 + schwung * 0.35) - kamera.x) * kamera.zoom + kamera.breite / 2;
      const fy = (zy + vy * (0.5 + schwung * 0.35) - kamera.y) * kamera.zoom + kamera.hoehe / 2;
      ctx.save();
      ctx.strokeStyle = `rgba(255,236,210,${0.75 * schwung})`;
      ctx.lineWidth = Math.max(1.5, kamera.zoom * 0.09);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(fx, fy, kamera.zoom * 0.34, this.winkel - 1.1, this.winkel + 1.1);
      ctx.stroke();
      ctx.fillStyle = `rgba(247,214,182,${0.9 * schwung})`;
      ctx.beginPath();
      ctx.arc(fx, fy, kamera.zoom * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   Passanten

   Sie laufen auf Gehwegen, in Parks und am Strand, bleiben ab und zu
   stehen und rennen weg, wenn ein Auto zu nah kommt. Ihre Wege sind
   bewusst einfach gehalten: Richtung wählen, laufen, bei Hindernis neue
   Richtung. Bei 60 Leuten im Bild kostet das kaum Rechenzeit.
   ═══════════════════════════════════════════════════════════ */

/* Alle Passantenarten. Seit dem 22.09.2026 kommen sie aus gezeichneten
   Bögen (tools/spiel-bogen.py) und haben nur ein Standbild — die
   Schrittbewegung entsteht im Spiel. */
export const PASSANT_ARTEN = [
  "mann_hemd", "mann_tank", "mann_anzug", "mann_jung", "mann_arbeiter",
  "frau_kleid", "frau_top", "frau_sport", "frau_business",
  "tourist", "rentner", "rentnerin",
  "wachmann", "taxifahrer", "verkaeufer", "rettungsschwimmerin",
  "sanitaeter", "feuerwehr_dienst"
];

/* Nur die Hauptfiguren haben echte Laufbilder */
const MIT_LAUF = new Set(["jason", "lucia"]);

const GEHBAR = [Karte.ART.GEHWEG, Karte.ART.PARK, Karte.ART.STRAND, Karte.ART.PARKPLATZ];

export class Passant extends Figur {
  constructor(art, x, y) {
    super(art, x, y);
    this.ziel = Math.random() * Math.PI * 2;
    this.warten = Math.random() * 3;
    this.flucht = 0;
  }

  get daten() {
    const d = FIGUREN[this.art];
    return d || { name: "", tempo: 1.5, rennen: 5.2, breite: 0.6 };
  }

  aufGehweg(x, y) {
    return GEHBAR.includes(Karte.art(Karte.inKachel(x), Karte.inKachel(y)));
  }

  denken(dt, autos) {
    if (this.tot) { this.totZeit += dt; return; }
    if (this.ko > 0) { this.bewegen(0, 0, false, dt); return; }   // liegt noch
    /* Kommt ein Auto mit Schwung näher, nichts wie weg */
    if (this.flucht > 0) this.flucht -= dt;
    for (const a of autos) {
      const dx = this.x - a.x, dy = this.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 64 && Math.hypot(a.vx, a.vy) > 4) {
        this.ziel = Math.atan2(dy, dx);
        this.flucht = 1.6;
        break;
      }
    }

    this.warten -= dt;
    if (this.warten <= 0 && this.flucht <= 0) {
      this.warten = 1.5 + Math.random() * 4;
      /* meistens weiterlaufen, manchmal abbiegen oder stehen bleiben */
      const w = Math.random();
      if (w < 0.25) this.ziel = null;                        // Pause
      else if (w < 0.6) this.ziel = Math.round(Math.random() * 4) * (Math.PI / 2);
      else this.ziel = Math.random() * Math.PI * 2;
    }

    let dx = 0, dy = 0;
    if (this.ziel !== null) {
      dx = Math.cos(this.ziel);
      dy = Math.sin(this.ziel);
      /* Vor die Füße schauen: kein Haus, und möglichst auf dem Gehweg */
      const vx = this.x + dx * 1.4, vy = this.y + dy * 1.4;
      if (this.blockiert(vx, vy) || (this.flucht <= 0 && !this.aufGehweg(vx, vy))) {
        this.ziel += Math.PI / 2 + Math.random();
        dx = dy = 0;
      }
    }
    this.bewegen(dx * (this.flucht > 0 ? 1 : 0.55), dy * (this.flucht > 0 ? 1 : 0.55),
                 this.flucht > 0, dt);
  }
}

/* Passanten rund um einen Punkt aufstellen */
export function passantenVerteilen(anzahl, umX, umY, radius = 110) {
  const liste = [];
  for (let i = 0; i < anzahl; i++) {
    const p = Karte.freierPunkt(umX + (Math.random() - 0.5) * radius,
                                umY + (Math.random() - 0.5) * radius, GEHBAR, 40);
    const art = PASSANT_ARTEN[Math.floor(Math.random() * PASSANT_ARTEN.length)];
    liste.push(new Passant(art, p.x, p.y));
  }
  return liste;
}

/* Alle in der Nähe erschrecken — nach einem Schuss oder einem Schlag */
export function panik(liste, x, y, radius = 26) {
  for (const p of liste) {
    if (p.tot || p.ko > 0) continue;
    const dx = p.x - x, dy = p.y - y;
    if (Math.hypot(dx, dy) > radius) continue;
    p.ziel = Math.atan2(dy, dx);
    p.flucht = 3.5;
  }
}

/* Wer zu weit weg ist, wird vor dem Spieler wieder aufgestellt —
   so bleibt die Stadt belebt, ohne tausend Figuren zu rechnen.
   Erschossene bleiben eine Weile liegen und werden dann ersetzt. */
export function passantenNachziehen(liste, x, y, weite = 150) {
  for (const p of liste) {
    const weg = Math.hypot(p.x - x, p.y - y) > weite;
    const alt = p.tot && p.totZeit > 16;
    if (!weg && !alt) continue;
    if (p.tot && !alt && weg) { /* Leiche außer Sicht: darf neu starten */ }
    const ziel = Karte.freierPunkt(x + (Math.random() - 0.5) * 120,
                                   y + (Math.random() - 0.5) * 120, GEHBAR, 50);
    p.x = ziel.x;
    p.y = ziel.y;
    p.vx = p.vy = 0;
    p.tot = false;
    p.totZeit = 0;
    p.leben = 100;
    p.ko = 0;
    p.flucht = 0;
    p.art = PASSANT_ARTEN[Math.floor(Math.random() * PASSANT_ARTEN.length)];
  }
}
