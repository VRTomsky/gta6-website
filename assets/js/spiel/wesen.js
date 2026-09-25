/* ═══════════════════════════════════════════════════════════
   Figuren zu Fuß — Jason, Lucia und später Passanten

   Bewegung: Beschleunigung in Laufrichtung, Reibung, Anstoßen an
   Gebäuden. Die Laufanimation hängt an der zurückgelegten Strecke,
   nicht an der Zeit — dadurch passt sie bei jedem Tempo.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import { malen, aufrecht, schatten } from "./bilder.js";

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

  /* Welche der vier Ansichten passt zur Laufrichtung? */
  get richtung() {
    const s = Math.sin(this.winkel);          // > 0: nach unten, zum Betrachter
    const c = Math.cos(this.winkel);
    if (Math.abs(s) >= Math.abs(c)) return s > 0 ? "vorn" : "hinten";
    return c > 0 ? "rechts" : "links";
  }

  bildname() {
    const r = this.richtung;
    if (VIER_RICHTUNGEN.has(this.art)) {
      if (this.tempo < 0.35) return `${this.art}_${r}0`;
      const k = LAUF_POSEN[Math.floor(this.strecke / 0.55) % LAUF_POSEN.length];
      return `${this.art}_${r}${k}`;
    }
    /* Passanten: drei Bilder, nach rechts wird das linke gespiegelt */
    if (r === "hinten") return `${this.art}_hinten`;
    if (r === "links" || r === "rechts") return `${this.art}_links`;
    return `${this.art}_steht`;
  }

  /* Wer kein Laufbild hat, bekommt die Bewegung angedeutet: ein leichtes
     Wiegen um die Hochachse und ein kleines Auf und Ab. Bei 50 Bildpunkten
     Körpergröße liest sich das wie ein Schritt. */
  get wiegen() {
    if (VIER_RICHTUNGEN.has(this.art) || this.tempo < 0.35) return 0;
    return Math.sin(this.strecke * 4.4) * 0.09;
  }

  /* Wie stark die Figur sich in Laufrichtung legt. Voll gedreht sähe sie
     aus, als läge sie auf dem Asphalt — die Bögen zeigen sie von schräg
     vorn. Also: aufrecht bleiben, nach links spiegeln, leicht kippen. */
  get blick() {
    /* Wer vier Ansichten hat, braucht weder Spiegelung noch Neigung */
    if (VIER_RICHTUNGEN.has(this.art)) return { spiegeln: false, neigung: 0 };
    /* Die Seitenansicht der Passanten schaut nach links — nach rechts
       wird sie gespiegelt. Dazu das Wiegen, weil es keine Laufbilder gibt. */
    return { spiegeln: this.richtung === "rechts", neigung: this.wiegen };
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
      /* Liegend: einmal um 90° gekippt, dann liegt die Figur wirklich */
      aufrecht(ctx, `${this.art}_steht`, kamera, this.x, this.y,
               Math.PI / 2, this.faktor * 0.9);
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

    const blick = this.blick;
    aufrecht(ctx, this.bildname(), kamera, zx, zy - Math.abs(this.wiegen) * 0.12,
             blick.neigung, this.faktor * (1 + h * 0.14), blick.spiegeln);

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

/* Passanten mit echtem Laufzyklus: vier Richtungen mal vier Posen wie
   Jason und Lucia (Bogen „richtung" in tools/spiel-bogen.py). Hier nur
   eintragen, wenn die Bilder wirklich in assets/img/spiel liegen —
   sonst lädt das Spiel 17 fehlende Dateien je Name. */
export const LAUF_LEUTE = [];

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

/* Jason und Lucia gibt es in vier Richtungen mal vier Posen
   (`jason_vorn0` … `lucia_rechts3`), dazu die Laufleute oben. Alle
   anderen haben drei Standbilder. */
const VIER_RICHTUNGEN = new Set(["jason", "lucia", ...LAUF_LEUTE]);
const RICHTUNGEN = ["vorn", "hinten", "links", "rechts"];
/* Spalte 0 steht, 1–3 laufen: Schritt links, Mitte, Schritt rechts, Mitte */
const LAUF_POSEN = [1, 2, 3, 2];

/* Wo Passanten sich aufhalten. Parkplätze sind bewusst nicht dabei —
   dort liefen sie ständig zwischen den Autos herum. */
const GEHBAR = [Karte.ART.GEHWEG, Karte.ART.PARK, Karte.ART.STRAND];

export class Passant extends Figur {
  constructor(art, x, y) {
    super(art, x, y);
    this.ziel = Math.random() * Math.PI * 2;
    this.warten = Math.random() * 3;
    this.flucht = 0;
    this.kreuzen = null;               // laufender Gang über einen Überweg
    this.kreuzenZeit = 0;
  }

  get daten() {
    const d = FIGUREN[this.art];
    return d || { name: "", tempo: 1.5, rennen: 5.2, breite: 0.6 };
  }

  aufGehweg(x, y) {
    return GEHBAR.includes(Karte.art(Karte.inKachel(x), Karte.inKachel(y)));
  }

  /* ── Überqueren an der Ampel ──
     Passanten laufen sonst nie über die Straße. Jetzt suchen sie sich
     einen Fußgängerüberweg an einer Kreuzung, warten dort, bis die
     Autos auf dieser Achse Rot haben, und gehen dann durch. */
  kreuzungSuchen() {
    const tx = Karte.inKachel(this.x), ty = Karte.inKachel(this.y);
    const seiten = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = seiten.length - 1; i > 0; i--) {            // mischen
      const j = Math.floor(Math.random() * (i + 1));
      [seiten[i], seiten[j]] = [seiten[j], seiten[i]];
    }
    for (const [dx, dy] of seiten) {
      if (Karte.art(tx + dx, ty + dy) !== Karte.ART.KREUZUNG) continue;
      let k = 1;
      while (k < 9 && Karte.befahrbar(Karte.art(tx + dx * k, ty + dy * k))) k++;
      if (k < 2 || k >= 9) continue;
      if (Karte.art(tx + dx * k, ty + dy * k) !== Karte.ART.GEHWEG) continue;
      return {
        x: Karte.inMeter(tx + dx * k) + Karte.KACHEL / 2,
        y: Karte.inMeter(ty + dy * k) + Karte.KACHEL / 2,
        tx: tx + dx, ty: ty + dy,
        senkrecht: dx !== 0,          // quer zur Fahrtrichtung der Autos
        los: false
      };
    }
    return null;
  }

  denken(dt, autos, zeit = 0) {
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

    /* Ist ein Überweg angefangen, wird er zu Ende gegangen */
    if (this.kreuzen && this.flucht <= 0) {
      const zx = this.kreuzen.x - this.x, zy = this.kreuzen.y - this.y;
      const weit = Math.hypot(zx, zy);
      this.kreuzenZeit += dt;
      if (weit < 0.7 || this.kreuzenZeit > 22) {
        this.kreuzen = null;
        this.warten = 1 + Math.random() * 3;
      } else {
        if (!this.kreuzen.los &&
            !Karte.ampelGruen(this.kreuzen.tx, this.kreuzen.ty, zeit, this.kreuzen.senkrecht)) {
          this.kreuzen.los = true;                 // jetzt haben die Autos Rot
        }
        if (this.kreuzen.los) this.bewegen(zx / weit, zy / weit, false, dt);
        else this.bewegen(0, 0, false, dt);        // an der Bordsteinkante warten
        return;
      }
    }
    if (this.flucht > 0) this.kreuzen = null;

    this.warten -= dt;
    if (this.warten <= 0 && this.flucht <= 0) {
      /* Auf der Straße gelandet — etwa nach einer Flucht? Dann
         zielstrebig zurück auf den Gehweg statt weiter herumzuirren. */
      if (!this.aufGehweg(this.x, this.y)) {
        const heim = Karte.freierPunkt(this.x, this.y, [Karte.ART.GEHWEG], 9);
        this.ziel = heim ? Math.atan2(heim.y - this.y, heim.x - this.x)
                         : Math.random() * Math.PI * 2;
        this.warten = 1;
      } else if (Math.random() < 0.3 && (this.kreuzen = this.kreuzungSuchen())) {
        this.kreuzenZeit = 0;                      // Überweg gefunden
        this.warten = 1;
      } else {
        this.warten = 1.5 + Math.random() * 4;
        /* meistens weiterlaufen, manchmal abbiegen oder stehen bleiben */
        const w = Math.random();
        if (w < 0.25) this.ziel = null;                      // Pause
        else if (w < 0.6) this.ziel = Math.round(Math.random() * 4) * (Math.PI / 2);
        else this.ziel = Math.random() * Math.PI * 2;
      }
    }

    let dx = 0, dy = 0;
    if (this.ziel !== null) {
      dx = Math.cos(this.ziel);
      dy = Math.sin(this.ziel);
      /* Vor die Füße schauen: kein Haus, und möglichst auf dem Gehweg.
         Die Gehwegregel gilt nur, wenn man schon auf einem steht — sonst
         dreht sich einer, der auf dem Parkplatz gelandet ist, im Kreis,
         weil auch der Weg zurück kein Gehweg ist. */
      const vx = this.x + dx * 2.0, vy = this.y + dy * 2.0;
      const aufWeg = this.aufGehweg(this.x, this.y);
      if (this.blockiert(vx, vy) ||
          (aufWeg && this.flucht <= 0 && !this.aufGehweg(vx, vy))) {
        this.ziel += Math.PI / 2 + Math.random();
        dx = dy = 0;
      }
      /* Zurück auf den Gehweg wird schneller gegangen als geschlendert */
      if (!aufWeg && this.flucht <= 0) { dx *= 1.6; dy *= 1.6; }
    }
    this.bewegen(dx * (this.flucht > 0 ? 1 : 0.55), dy * (this.flucht > 0 ? 1 : 0.55),
                 this.flucht > 0, dt);
  }
}

/* Zufällige Art — wer richtig laufen kann, kommt öfter dran */
function passantArt() {
  if (LAUF_LEUTE.length && Math.random() < 0.5) {
    return LAUF_LEUTE[Math.floor(Math.random() * LAUF_LEUTE.length)];
  }
  return PASSANT_ARTEN[Math.floor(Math.random() * PASSANT_ARTEN.length)];
}

/* Passanten rund um einen Punkt aufstellen */
export function passantenVerteilen(anzahl, umX, umY, radius = 110) {
  const liste = [];
  for (let i = 0; i < anzahl; i++) {
    const p = Karte.freierPunkt(umX + (Math.random() - 0.5) * radius,
                                umY + (Math.random() - 0.5) * radius, GEHBAR, 40);
    const art = passantArt();
    const passant = new Passant(art, p.x, p.y);
    /* Blickrichtung streuen — sonst schaut beim Start die halbe Stadt
       gleichzeitig nach Norden */
    passant.winkel = Math.random() * Math.PI * 2;
    liste.push(passant);
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
    if (p.zielperson) continue;                // gehört gerade zu einem Auftrag
    const weg = Math.hypot(p.x - x, p.y - y) > weite;
    const alt = p.tot && p.totZeit > 16;
    if (!weg && !alt) continue;
    if (p.tot && !alt && weg) { /* Leiche außer Sicht: darf neu starten */ }
    const ziel = Karte.freierPunkt(x + (Math.random() - 0.5) * 120,
                                   y + (Math.random() - 0.5) * 120, GEHBAR, 50);
    p.x = ziel.x;
    p.y = ziel.y;
    p.vx = p.vy = 0;
    p.winkel = Math.random() * Math.PI * 2;
    p.tot = false;
    p.totZeit = 0;
    p.leben = 100;
    p.ko = 0;
    p.flucht = 0;
    p.art = passantArt();
  }
}
