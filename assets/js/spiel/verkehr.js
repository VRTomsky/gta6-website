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
    this.zielSuchen();
  }

  get senkrecht() { return this.dy !== 0; }

  /* Nächsten Punkt auf der eigenen Spur bestimmen: die Kreuzung voraus,
     seitlich auf die richtige Spur geschoben. */
  zielSuchen() {
    const k = Karte.naechsteKreuzung(this.x, this.y, this.dx, this.dy);
    if (!k) { this.ziel = null; return; }
    const tx = Karte.inKachel(this.x), ty = Karte.inKachel(this.y);
    const quer = this.senkrecht
      ? Karte.spurMitte(tx, ty, this.dy, true)
      : Karte.spurMitte(tx, ty, this.dx, false);
    this.ziel = this.senkrecht ? { x: quer, y: k.y, tx: k.tx, ty: k.ty }
                               : { x: k.x, y: quer, tx: k.tx, ty: k.ty };
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
    this.zielSuchen();
  }

  /* Ist die Fahrbahn frei? Prüft Autos und Fußgänger im Kegel voraus. */
  freiVoraus(autos, leute) {
    const vor = { x: Math.cos(this.winkel), y: Math.sin(this.winkel) };
    const reichweite = 4 + Math.abs(this.tempo) * 0.9;
    const pruefen = liste => {
      for (const o of liste) {
        if (o === this) continue;
        const dx = o.x - this.x, dy = o.y - this.y;
        const laengs = dx * vor.x + dy * vor.y;
        if (laengs < 0.5 || laengs > reichweite) continue;
        const quer = Math.abs(-dx * vor.y + dy * vor.x);
        if (quer < 2.1) return false;
      }
      return true;
    };
    return pruefen(autos) && pruefen(leute);
  }

  denken(dt, zeit, autos, leute) {
    if (!this.ziel) { this.zielSuchen(); if (!this.ziel) return; }

    const dx = this.ziel.x - this.x, dy = this.ziel.y - this.y;
    const entfernung = Math.hypot(dx, dy);
    if (entfernung < 4.5) {                       // Kreuzung erreicht
      this.abbiegen();
      return;
    }

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
    const frei = this.freiVoraus(autos, leute);
    let gas = 1;
    if (rot || !frei) {
      gas = this.tempo > 1.2 ? -1 : 0;
      this.geduld += dt;
      /* Steht zu lange? Dann neu ausrichten, damit nichts verklemmt */
      if (this.geduld > 7) { this.geduld = 0; this.abbiegen(); }
    } else {
      this.geduld = 0;
      if (this.tempo > this.wunschTempo) gas = 0;
    }

    this.fahren(gas, lenken, false, dt);
  }
}

/* ── Verkehr rund um den Spieler ── */
const TYPEN_LISTE = Object.keys(TYPEN).filter(t => t !== "streife");

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
export function verkehrNachziehen(liste, x, y, weite = 190) {
  for (const a of liste) {
    if (a.fahrer) continue;                        // vom Spieler geklaut
    if (Math.hypot(a.x - x, a.y - y) < weite) continue;
    const p = startPunkt(x, y, 80 + Math.random() * 90);
    if (!p || !platzFrei(liste, p.x, p.y)) continue;
    a.x = p.x; a.y = p.y;
    a.dx = p.dx; a.dy = p.dy;
    a.winkel = winkelVon(p.dx, p.dy);
    a.vx = a.vy = 0;
    a.zielSuchen();
  }
}
