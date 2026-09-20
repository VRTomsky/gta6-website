/* ═══════════════════════════════════════════════════════════
   Minikarte im Stil von GTA VI

   Kein Kreis mehr, sondern ein abgerundetes Rechteck, das sich mit der
   Fahrtrichtung dreht: Die Straße vor einem zeigt nach oben, der eigene
   Pfeil sitzt unten in der Mitte. Zum Missionsziel führt eine pinke
   Linie, oben links steht die Entfernung, unten links ein N für Norden.

   Der Kartenteil wird in einen Puffer gezeichnet und nur erneuert, wenn
   man ein Stück gefahren ist — pro Bild bleiben nur Drehung und Punkte.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";

const SICHT = 150;                  // Meter vom Spieler bis zum Rand des Puffers
const SCHRITT = 2;                  // jede zweite Kachel reicht

const FARBEN = {
  [Karte.ART.WASSER]: "#16324f",
  [Karte.ART.STRAND]: "#c9b48b",
  [Karte.ART.STRASSE]: "#b9bdc4",
  [Karte.ART.KREUZUNG]: "#c3c7ce",
  [Karte.ART.AUTOBAHN]: "#d9c98f",
  [Karte.ART.BRUECKE]: "#aab0b8",
  [Karte.ART.GEHWEG]: "#6f7580",
  [Karte.ART.PARK]: "#3f6b4c",
  [Karte.ART.PARKPLATZ]: "#565c66",
  [Karte.ART.GEBAEUDE]: "#333944",
  [Karte.ART.HAFEN]: "#4a5058"
};

let puffer = null;
let standX = 1e9, standY = 1e9;

function pufferBauen(pos, massstab) {
  if (!puffer) {
    puffer = document.createElement("canvas");
    puffer.width = puffer.height = Math.ceil(SICHT * 2 * massstab);
  }
  const ctx = puffer.getContext("2d");
  const groesse = puffer.width;
  ctx.fillStyle = "#11182a";
  ctx.fillRect(0, 0, groesse, groesse);

  const kachelPx = Karte.KACHEL * massstab * SCHRITT + 1;
  const t0x = Karte.inKachel(pos.x - SICHT), t0y = Karte.inKachel(pos.y - SICHT);
  const anzahl = Math.ceil((SICHT * 2) / (Karte.KACHEL * SCHRITT)) + 1;
  for (let j = 0; j < anzahl; j++) {
    for (let k = 0; k < anzahl; k++) {
      const tx = t0x + k * SCHRITT, ty = t0y + j * SCHRITT;
      ctx.fillStyle = FARBEN[Karte.art(tx, ty)] || "#333944";
      ctx.fillRect((Karte.inMeter(tx) - pos.x + SICHT) * massstab,
                   (Karte.inMeter(ty) - pos.y + SICHT) * massstab,
                   kachelPx, kachelPx);
    }
  }
  standX = pos.x;
  standY = pos.y;
}

export function zeichnen(leinwand, zustand, spieler) {
  const ctx = leinwand.getContext("2d");
  const b = leinwand.width, h = leinwand.height;
  const massstab = h / 150;                       // Bildpunkte je Meter
  const pos = spieler.imAuto || spieler;
  const blick = (spieler.imAuto ? spieler.imAuto.winkel : spieler.winkel) + Math.PI / 2;

  if (!puffer || Math.hypot(pos.x - standX, pos.y - standY) > 8) pufferBauen(pos, massstab);

  ctx.clearRect(0, 0, b, h);
  ctx.save();

  /* Der eigene Pfeil sitzt unten in der Mitte, die Karte dreht sich darum */
  const ankerX = b / 2, ankerY = h * 0.78;
  ctx.translate(ankerX, ankerY);
  ctx.rotate(-blick);
  ctx.translate((standX - pos.x) * massstab, (standY - pos.y) * massstab);
  ctx.drawImage(puffer, -puffer.width / 2, -puffer.height / 2);

  /* Route zum Missionsziel */
  const ziele = zustand.missionen.marken();
  const ziel = ziele[0];
  if (ziel) {
    ctx.strokeStyle = "rgba(255,74,160,.95)";
    ctx.lineWidth = Math.max(3, h * 0.045);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo((ziel.x - pos.x) * massstab, (ziel.y - pos.y) * massstab);
    ctx.stroke();
    ctx.fillStyle = "#ff4aa0";
    ctx.beginPath();
    ctx.arc((ziel.x - pos.x) * massstab, (ziel.y - pos.y) * massstab, h * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }

  const punkt = (x, y, farbe, r) => {
    ctx.fillStyle = farbe;
    ctx.beginPath();
    ctx.arc((x - pos.x) * massstab, (y - pos.y) * massstab, r, 0, Math.PI * 2);
    ctx.fill();
  };
  for (const s of zustand.fahndung.streifen) punkt(s.x, s.y, "#ff5566", h * 0.028);
  for (const name of Object.keys(zustand.figuren)) {
    if (name === zustand.aktiv) continue;
    punkt(zustand.figuren[name].x, zustand.figuren[name].y, "#7ab8ff", h * 0.028);
  }
  ctx.restore();

  /* Spielerpfeil in einem dunklen Kreis */
  ctx.save();
  ctx.translate(ankerX, ankerY);
  ctx.fillStyle = "rgba(14,18,32,.85)";
  ctx.beginPath();
  ctx.arc(0, 0, h * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.05);
  ctx.lineTo(h * 0.035, h * 0.035);
  ctx.lineTo(0, h * 0.016);
  ctx.lineTo(-h * 0.035, h * 0.035);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* Norden als kleines N am Rand */
  ctx.save();
  ctx.translate(h * 0.12, h * 0.86);
  ctx.rotate(-blick);
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.font = `700 ${Math.round(h * 0.09)}px "Barlow Condensed", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", 0, -h * 0.02);
  ctx.restore();

  /* Entfernung zum Ziel oben links */
  if (ziel) {
    const d = Math.hypot(ziel.x - pos.x, ziel.y - pos.y);
    const text = d > 950 ? (d / 1000).toFixed(1) + " km" : Math.round(d / 5) * 5 + " m";
    ctx.font = `700 ${Math.round(h * 0.085)}px "Barlow Condensed", system-ui, sans-serif`;
    const breite = ctx.measureText(text).width + h * 0.1;
    ctx.fillStyle = "rgba(14,18,32,.8)";
    ctx.beginPath();
    ctx.roundRect(h * 0.05, h * 0.05, breite, h * 0.14, h * 0.07);
    ctx.fill();
    ctx.fillStyle = "#e9edf7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, h * 0.05 + breite / 2, h * 0.122);
  }
}

/* Die große Karte (Taste M): ganze Stadt, Marken, Wahrzeichen */
export function grosseKarteZeichnen(leinwand, zustand, spieler) {
  const ctx = leinwand.getContext("2d");
  const b = leinwand.width, h = leinwand.height;
  ctx.fillStyle = "#0b1124";
  ctx.fillRect(0, 0, b, h);

  const stadtB = Karte.inMeter(Karte.BREITE), stadtH = Karte.inMeter(Karte.HOEHE);
  const massstab = Math.min(b / stadtB, h / stadtH) * 0.94;
  const versatzX = (b - stadtB * massstab) / 2;
  const versatzY = (h - stadtH * massstab) / 2;
  const punktX = x => versatzX + x * massstab;
  const punktY = y => versatzY + y * massstab;

  const schritt = 2;
  const kachel = Karte.KACHEL * massstab * schritt + 1;
  for (let ty = 0; ty < Karte.HOEHE; ty += schritt) {
    for (let tx = 0; tx < Karte.BREITE; tx += schritt) {
      ctx.fillStyle = FARBEN[Karte.art(tx, ty)] || "#333944";
      ctx.fillRect(punktX(Karte.inMeter(tx)), punktY(Karte.inMeter(ty)), kachel, kachel);
    }
  }

  /* Wahrzeichen mit Namen */
  ctx.font = `600 ${Math.max(10, Math.round(h * 0.018))}px Figtree, system-ui, sans-serif`;
  ctx.textAlign = "center";
  for (const w of Karte.wahrzeichen) {
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.beginPath();
    ctx.arc(punktX(w.x), punktY(w.y), Math.max(3, h * 0.006), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(230,236,255,.75)";
    ctx.fillText(w.name, punktX(w.x), punktY(w.y) - h * 0.012);
  }

  /* Missionen */
  for (const m of zustand.missionen.marken()) {
    ctx.fillStyle = m.farbe;
    ctx.beginPath();
    ctx.arc(punktX(m.x), punktY(m.y), Math.max(5, h * 0.011), 0, Math.PI * 2);
    ctx.fill();
  }

  /* Polizei */
  ctx.fillStyle = "#ff5566";
  for (const s of zustand.fahndung.streifen) {
    ctx.beginPath();
    ctx.arc(punktX(s.x), punktY(s.y), Math.max(3, h * 0.007), 0, Math.PI * 2);
    ctx.fill();
  }

  /* zweite Figur */
  for (const name of Object.keys(zustand.figuren)) {
    if (name === zustand.aktiv) continue;
    const f = zustand.figuren[name];
    ctx.fillStyle = "#7ab8ff";
    ctx.beginPath();
    ctx.arc(punktX(f.x), punktY(f.y), Math.max(4, h * 0.008), 0, Math.PI * 2);
    ctx.fill();
  }

  /* Spieler als Pfeil */
  const pos = spieler.imAuto || spieler;
  const blick = (spieler.imAuto ? spieler.imAuto.winkel : spieler.winkel) + Math.PI / 2;
  ctx.save();
  ctx.translate(punktX(pos.x), punktY(pos.y));
  ctx.rotate(blick);
  ctx.fillStyle = "#ff8ab4";
  const r = Math.max(7, h * 0.014);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.7, r * 0.8);
  ctx.lineTo(0, r * 0.35);
  ctx.lineTo(-r * 0.7, r * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
