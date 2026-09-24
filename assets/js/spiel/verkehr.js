/* ═══════════════════════════════════════════════════════════
   Verkehr

   Die Autos fahren nicht auf Schienen, sondern steuern wie ein Spieler:
   Sie halten auf einen Punkt auf ihrer Spur zu, lenken dorthin und geben
   Gas. Dadurch benutzen sie dieselbe Fahrphysik, rutschen bei einem Stoß
   zur Seite und lassen sich rammen.

   Vor jeder Kreuzung wird entschieden: geradeaus, links oder rechts —
   sofern es dort eine Straße gibt. Rot heißt anhalten, ein Auto oder ein
   Fußgänger direkt davor auch.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import { Fahrzeug, TYPEN } from "./fahrzeug.js";

const RICHTUNGEN = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
  { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
];

const winkelVon = (dx, dy) => Math.atan2(dy, dx);

export class VerkehrsAuto extends Fahrzeug {
  constructor(typ, x, y, dx, dy) {
    super(typ, x, y, winkelVon(dx, dy));
    this.dx = dx;
    this.dy = dy;
    this.ziel = null;
    this.wunschTempo = 9 + Math.random() * 7;      // 32–58 km/h
    this.geduld = 0;
    this.drang = 0;                                // Sekunden „vorbeischieben"
    this.abseits = 0;                              // Sekunden neben der Fahrbahn
    this.zielSuchen();
  }

  get senkrecht() { return this.dy !== 0; }

  /* Nächsten Punkt auf der eigenen Spur bestimmen: die Kreuzung voraus,
     seitlich auf die richtige Spur geschoben.

     Hier lag der Hauptgrund für die vielen stehenden Autos: Gab es voraus
     keine Kreuzung mehr — Sackgasse, Kartenrand, oder der Wagen war von
     der Fahrbahn abgekommen — blieb `ziel` leer und der Wagen stand für
     immer. Jetzt gibt es für beide Fälle ein Ersatzziel. */
  zielSuchen() {
    const tx = Karte.inKachel(this.x), ty = Karte.inKachel(this.y);

    /* Von der Straße abgekommen: zurück auf die nächste Fahrbahn zielen */
    if (!Karte.istStrasse(tx, ty)) {
      this.ziel = this.strasseSuchen(tx, ty);
      this.verirrt = !this.ziel;
      return;
    }
    this.verirrt = false;

    /* Spurmitte auf einer Kachel messen, die wirklich Straße ist — auf
       der Kreuzung stehend käme sonst ein falscher Seitenversatz heraus. */
    let mx = tx, my = ty;
    for (let k = 0; k < 4 && Karte.art(mx, my) !== Karte.ART.STRASSE; k++) {
      mx += this.dx; my += this.dy;
    }
    if (!Karte.istStrasse(mx, my)) { mx = tx; my = ty; }
    const quer = this.senkrecht
      ? Karte.spurMitte(mx, my, this.dy, true)
      : Karte.spurMitte(mx, my, this.dx, false);

    const k = Karte.naechsteKreuzung(this.x, this.y, this.dx, this.dy);
    if (k) {
      this.ziel = this.senkrecht ? { x: quer, y: k.y, tx: k.tx, ty: k.ty }
                                 : { x: k.x, y: quer, tx: k.tx, ty: k.ty };
      return;
    }

    /* Keine Kreuzung voraus: bis ans Ende der Fahrbahn fahren, dort wenden */
    let weit = this.weiteVoraus(tx, ty, this.dx, this.dy);
    if (weit === 0) {
      /* Geht geradeaus gar nichts mehr — etwa auf einer schrägen Straße,
         der das achsenparallele Suchen nicht folgen kann — dann die
         Richtung mit dem längsten freien Stück nehmen. Ohne das blieb hier
         ein Wagen stehen und staute alles hinter sich auf. */
      let beste = null, bestWeit = 0;
      for (const r of RICHTUNGEN) {
        const w = this.weiteVoraus(tx, ty, r.dx, r.dy);
        if (w > bestWeit) { bestWeit = w; beste = r; }
      }
      if (!beste) { this.ziel = null; this.verirrt = true; return; }
      this.dx = beste.dx; this.dy = beste.dy;
      weit = bestWeit;
    }
    const ex = tx + this.dx * weit, ey = ty + this.dy * weit;
    const mitte = Karte.KACHEL / 2;
    /* Richtung kann sich eben geändert haben — Spur neu messen */
    const quer2 = this.senkrecht
      ? Karte.spurMitte(tx, ty, this.dy, true)
      : Karte.spurMitte(tx, ty, this.dx, false);
    this.ziel = this.senkrecht
      ? { x: quer2, y: Karte.inMeter(ey) + mitte, tx: ex, ty: ey, ende: true }
      : { x: Karte.inMeter(ex) + mitte, y: quer2, tx: ex, ty: ey, ende: true };
  }

  /* Wie weit geht es in dieser Richtung noch auf der Fahrbahn weiter? */
  weiteVoraus(tx, ty, dx, dy) {
    let w = 0;
    while (w < 40 && Karte.istStrasse(tx + dx * (w + 1), ty + dy * (w + 1))) w++;
    return w;
  }

  /* Nächste befahrbare Kachel in der Nähe — Ziel für den Weg zurück */
  strasseSuchen(tx, ty) {
    for (let r = 1; r <= 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (Karte.art(tx + dx, ty + dy) !== Karte.ART.STRASSE) continue;
          /* Eine Kachel weiter in die Straße hinein, sonst bleibt der Wagen
             mit den Vorderrädern am Bordstein stehen. */
          const sx = Math.sign(dx), sy = Math.sign(dy);
          const zx = Karte.istStrasse(tx + dx + sx, ty + dy + sy) ? tx + dx + sx : tx + dx;
          const zy = Karte.istStrasse(tx + dx + sx, ty + dy + sy) ? ty + dy + sy : ty + dy;
          const mitte = Karte.KACHEL / 2;
          return {
            x: Karte.inMeter(zx) + mitte, y: Karte.inMeter(zy) + mitte,
            tx: zx, ty: zy, zurueck: true
          };
        }
      }
    }
    return null;
  }

  /* Am Ende der Straße umdrehen */
  wenden() {
    this.dx = -this.dx;
    this.dy = -this.dy;
    this.zielSuchen();
  }

  /* An der Kreuzung neue Richtung wählen */
  abbiegen() {
    const moeglich = RICHTUNGEN.filter(r => {
      if (r.dx === -this.dx && r.dy === -this.dy) return false;     // nicht wenden
      const tx = Karte.inKachel(this.x) + r.dx * 3;
      const ty = Karte.inKachel(this.y) + r.dy * 3;
      return Karte.istStrasse(tx, ty);
    });
    const geradeaus = moeglich.find(r => r.dx === this.dx && r.dy === this.dy);
    let wahl;
    if (geradeaus && Math.random() < 0.62) wahl = geradeaus;
    else wahl = moeglich[Math.floor(Math.random() * moeglich.length)] || geradeaus;
    if (!wahl) { this.dx = -this.dx; this.dy = -this.dy; }
    else { this.dx = wahl.dx; this.dy = wahl.dy; }

    /* Erst aus der Kreuzung heraus zielen, dann weiter. Ohne diesen
       Zwischenpunkt zog der Wagen vom Kreuzungsinneren schnurgerade auf
       die übernächste Kreuzung zu — und schnitt die Kurve über den
       Gehweg. */
    const tx = Karte.inKachel(this.x), ty = Karte.inKachel(this.y);
    let k = 1;
    while (k < 5 && Karte.art(tx + this.dx * k, ty + this.dy * k) === Karte.ART.KREUZUNG) k++;
    const ax = tx + this.dx * k, ay = ty + this.dy * k;
    if (Karte.istStrasse(ax, ay)) {
      const quer = this.senkrecht
        ? Karte.spurMitte(ax, ay, this.dy, true)
        : Karte.spurMitte(ax, ay, this.dx, false);
      const mitte = Karte.KACHEL / 2;
      this.ziel = this.senkrecht
        ? { x: quer, y: Karte.inMeter(ay) + mitte, tx: ax, ty: ay, austritt: true }
        : { x: Karte.inMeter(ax) + mitte, y: quer, tx: ax, ty: ay, austritt: true };
      return;
    }
    this.zielSuchen();
  }

  /* Abstand zum nächsten Hindernis voraus, sonst Infinity.
     Vorher war das ein Ja/Nein: Ein Fußgänger auf dem Gehweg reichte, um
     einen Wagen für immer mitten auf der Straße anzuhalten, und bei Tempo
     war der Blick zu kurz, um noch bremsen zu können. Jetzt zählen
     Fußgänger nur, wenn sie wirklich auf der Fahrbahn stehen, und aus dem
     Abstand wird gebremst statt geschaltet. */
  hindernis(autos, leute) {
    const vor = { x: Math.cos(this.winkel), y: Math.sin(this.winkel) };
    const sicht = 6 + Math.abs(this.tempo) * 1.3;
    let naechstes = Infinity;
    const pruefen = (liste, breite, reichweite, nurFahrbahn) => {
      for (const o of liste) {
        if (o === this) continue;
        const dx = o.x - this.x, dy = o.y - this.y;
        const laengs = dx * vor.x + dy * vor.y;
        if (laengs < 0.5 || laengs > reichweite || laengs >= naechstes) continue;
        if (Math.abs(-dx * vor.y + dy * vor.x) > breite) continue;
        if (nurFahrbahn &&
            !Karte.befahrbar(Karte.art(Karte.inKachel(o.x), Karte.inKachel(o.y)))) continue;
        naechstes = laengs;
      }
    };
    pruefen(autos, 2.3, sicht, false);
    pruefen(leute, 1.4, Math.min(sicht, 8), true);
    return naechstes;
  }

  denken(dt, zeit, autos, leute) {
    if (!this.ziel) {
      this.zielSuchen();
      /* Sackgasse: umdrehen statt für immer stehen */
      if (!this.ziel) {
        this.wenden();
        if (!this.ziel) { this.verirrt = true; return; }
      }
    }

    const dx = this.ziel.x - this.x, dy = this.ziel.y - this.y;
    const entfernung = Math.hypot(dx, dy);
    if (entfernung < (this.ziel.austritt ? 2.5 : 4.5)) {
      if (this.ziel.ende) this.wenden();           // Straßenende: umdrehen
      else if (this.ziel.austritt) this.zielSuchen();  // aus der Kreuzung heraus
      else if (this.ziel.zurueck) this.zielSuchen(); // wieder auf der Fahrbahn
      else this.abbiegen();                        // Kreuzung erreicht
      return;
    }

    /* Wer sich dauerhaft neben der Fahrbahn verfranst — etwa beim Wenden
       am Strand —, wird außer Sicht neu eingesetzt statt dort zu kurven. */
    if (Karte.befahrbar(Karte.art(Karte.inKachel(this.x), Karte.inKachel(this.y)))) this.abseits = 0;
    else if ((this.abseits += dt) > 6) this.verirrt = true;

    /* Lenken: Winkel zum Ziel ausgleichen */
    let ab = Math.atan2(dy, dx) - this.winkel;
    while (ab > Math.PI) ab -= Math.PI * 2;
    while (ab < -Math.PI) ab += Math.PI * 2;
    const lenken = Math.max(-1, Math.min(1, ab * 2.2));

    /* Anhalten: rote Ampel kurz vor der Kreuzung oder Hindernis voraus.
       Wer schon auf der Kreuzung steht, räumt sie — sonst blockiert alles. */
    const aufKreuzung = Karte.art(Karte.inKachel(this.x), Karte.inKachel(this.y)) === Karte.ART.KREUZUNG;
    const rot = !aufKreuzung && entfernung < 9 && entfernung > 2.5 &&
      !Karte.ampelGruen(this.ziel.tx, this.ziel.ty, zeit, this.senkrecht);
    /* Tempo nach Abstand statt An/Aus: Je mehr Platz vor der Stoßstange,
       desto schneller. Mit einem harten Bremsschalter staute sich die
       ganze Straße auf und löste sich nie wieder auf. */
    const abstand = this.hindernis(autos, leute);
    let wunsch = Math.min(this.wunschTempo, Math.max(0, (abstand - 5.5) * 0.9));
    if (rot) wunsch = 0;
    /* Drängeln: Zwei Wagen, die sich gegenseitig im Weg stehen, warteten
       sonst bis in alle Ewigkeit aufeinander — die halbe Stadt stand nach
       einer Minute. Wer zu lange steht und dabei keine rote Ampel vor sich
       hat, schiebt sich kurz vorbei; anstoßen darf er dabei. */
    if (this.tempo < 0.6 && !rot) this.geduld += dt; else this.geduld = 0;
    if (this.geduld > 4) { this.drang = 1.5; this.geduld = 0; this.abbiegen(); }
    if (this.drang > 0) {
      this.drang -= dt;
      wunsch = Math.max(wunsch, this.wunschTempo * 0.45);
    }

    let gas = wunsch > this.tempo + 0.4 ? 1 : wunsch < this.tempo - 0.4 ? -1 : 0;
    if (wunsch < 0.4 && this.tempo < 1.2) gas = 0;

    this.fahren(gas, lenken, false, dt);
  }
}

/* ── Verkehr rund um den Spieler ── */
/* Polizeiwagen fahren nur, wenn gefahndet wird — nicht im Verkehr */
const TYPEN_LISTE = Object.keys(TYPEN).filter(t => t !== "streife" && !TYPEN[t].polizei);

/* Manche Wagen sind seltener als andere */
const HAEUFIG = {
  limo: 3, kombi: 3, taxi: 2, cabrio: 2, sport: 1, pickup: 2,
  transporter: 2, bus: 1, oldtimer: 1, krankenwagen: 1, feuerwehr: 1,
  /* Alltagswagen oft, Arbeitsfahrzeuge selten */
  schrottkarre: 3, gelaende: 2, luxuscabrio: 2, muscle: 2, lowrider: 2,
  surfbus: 2, supersport: 1, limousine: 1, nachrichten: 1,
  abschlepper: 1, muellwagen: 1, kipper: 1
};
function typWaehlen() {
  const liste = [];
  for (const t of TYPEN_LISTE) {
    const n = HAEUFIG[t] || 1;
    for (let k = 0; k < n; k++) liste.push(t);
  }
  return liste[Math.floor(Math.random() * liste.length)];
}

function startPunkt(umX, umY, weit) {
  for (let i = 0; i < 80; i++) {
    const w = Math.random() * Math.PI * 2;
    const r = weit * (0.55 + Math.random() * 0.45);
    const x = umX + Math.cos(w) * r, y = umY + Math.sin(w) * r;
    const tx = Karte.inKachel(x), ty = Karte.inKachel(y);
    const a = Karte.art(tx, ty);
    if (a !== Karte.ART.STRASSE && a !== Karte.ART.AUTOBAHN && a !== Karte.ART.BRUECKE) continue;
    const senkrecht = Karte.istStrasse(tx, ty + 2) && Karte.istStrasse(tx, ty - 2);
    const richtung = Math.random() < 0.5 ? 1 : -1;
    const quer = senkrecht ? Karte.spurMitte(tx, ty, richtung, true)
                           : Karte.spurMitte(tx, ty, richtung, false);
    return senkrecht
      ? { x: quer, y: Karte.inMeter(ty) + 2, dx: 0, dy: richtung }
      : { x: Karte.inMeter(tx) + 2, y: quer, dx: richtung, dy: 0 };
  }
  return null;
}

/* Platz frei? Sonst stapeln sich die Wagen beim Einsetzen übereinander. */
function platzFrei(liste, x, y, abstand = 9) {
  return !liste.some(a => Math.hypot(a.x - x, a.y - y) < abstand);
}

export function verkehrAufbauen(anzahl, umX, umY) {
  const liste = [];
  for (let i = 0; i < anzahl * 4 && liste.length < anzahl; i++) {
    const p = startPunkt(umX, umY, 40 + Math.random() * 120);
    if (!p || !platzFrei(liste, p.x, p.y)) continue;
    liste.push(new VerkehrsAuto(typWaehlen(), p.x, p.y, p.dx, p.dy));
  }
  return liste;
}

/* Wer zu weit weg ist, wird vor dem Spieler neu eingesetzt */
export function verkehrNachziehen(liste, x, y, weite = 190, alle = null) {
  for (const a of liste) {
    if (a.fahrer) continue;                        // vom Spieler geklaut
    const fern = Math.hypot(a.x - x, a.y - y);
    /* Wer sich völlig verfahren hat, kommt schon früher zurück ins Spiel —
       aber erst außer Sicht, damit er nicht vor der Nase verschwindet. */
    if (fern < weite && !(a.verirrt && fern > 70)) continue;
    const p = startPunkt(x, y, 80 + Math.random() * 90);
    if (!p || !platzFrei(alle || liste, p.x, p.y)) continue;
    a.x = p.x; a.y = p.y;
    a.dx = p.dx; a.dy = p.dy;
    a.winkel = winkelVon(p.dx, p.dy);
    a.vx = a.vy = 0;
    a.geduld = 0;
    a.verlassen = false;                           // fährt wieder mit
    a.zielSuchen();
  }
}
