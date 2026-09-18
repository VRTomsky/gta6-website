/* ═══════════════════════════════════════════════════════════
   Minikarte (Radar)

   Zeigt die Umgebung von oben stark vereinfacht: Straßen hell, Häuser
   dunkel, Wasser blau, Grün grün. Darüber die Punkte: Spieler, zweite
   Figur, Polizei, Missionsziele.

   Der Kartenteil wird nur neu gezeichnet, wenn sich der Spieler ein Stück
   bewegt hat — sonst kostet das Radar jeden Bildaufbau unnötig Zeit.
   Die Punkte kommen in jedem Bild frisch darüber.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";

const SICHT = 120;                 // Meter, die aufs Radar passen
const SCHRITT = 2;                 // jede zweite Kachel reicht

const FARBEN = {
  [Karte.ART.WASSER]: "#14335f",
  [Karte.ART.STRAND]: "#cbb488",
  [Karte.ART.STRASSE]: "#5b5f6b",
  [Karte.ART.KREUZUNG]: "#646977",
  [Karte.ART.GEHWEG]: "#42464f",
  [Karte.ART.PARK]: "#2c5c3e",
  [Karte.ART.PARKPLATZ]: "#3a3d46",
  [Karte.ART.GEBAEUDE]: "#22252e",
  [Karte.ART.HAFEN]: "#3f434b"
};

let hintergrund = null;
let standX = 1e9, standY = 1e9;

export function zeichnen(leinwand, zustand, spieler) {
  const ctx = leinwand.getContext("2d");
  const groesse = leinwand.width;
  const massstab = groesse / (SICHT * 2);        // Bildpunkte je Meter
  const pos = spieler.imAuto || spieler;

  if (!hintergrund) {
    hintergrund = document.createElement("canvas");
    hintergrund.width = hintergrund.height = groesse;
  }

  /* Kartenteil nur bei Bewegung neu aufbauen */
  if (Math.hypot(pos.x - standX, pos.y - standY) > 6) {
    standX = pos.x;
    standY = pos.y;
    const hg = hintergrund.getContext("2d");
    hg.fillStyle = "#0b1124";
    hg.fillRect(0, 0, groesse, groesse);
    const kachelPx = Karte.KACHEL * massstab * SCHRITT + 1;
    const t0x = Karte.inKachel(pos.x - SICHT), t0y = Karte.inKachel(pos.y - SICHT);
    const anzahl = Math.ceil((SICHT * 2) / (Karte.KACHEL * SCHRITT)) + 1;
    for (let j = 0; j < anzahl; j++) {
      for (let i = 0; i < anzahl; i++) {
        const tx = t0x + i * SCHRITT, ty = t0y + j * SCHRITT;
        hg.fillStyle = FARBEN[Karte.art(tx, ty)] || "#22252e";
        hg.fillRect((Karte.inMeter(tx) - pos.x + SICHT) * massstab,
                    (Karte.inMeter(ty) - pos.y + SICHT) * massstab,
                    kachelPx, kachelPx);
      }
    }
  }

  /* Hintergrund mitschieben, solange er nicht neu gebaut wurde */
  const versatzX = (standX - pos.x) * massstab;
  const versatzY = (standY - pos.y) * massstab;
  ctx.clearRect(0, 0, groesse, groesse);
  ctx.drawImage(hintergrund, versatzX, versatzY);

  const punkt = (x, y, farbe, r = 3) => {
    const px = (x - pos.x) * massstab + groesse / 2;
    const py = (y - pos.y) * massstab + groesse / 2;
    if (px < 0 || py < 0 || px > groesse || py > groesse) return;
    ctx.fillStyle = farbe;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  };

  for (const m of zustand.missionen.marken()) punkt(m.x, m.y, m.farbe, 4);
  for (const s of zustand.fahndung.streifen) punkt(s.x, s.y, "#ff5566", 3);
  for (const name of Object.keys(zustand.figuren)) {
    if (name === zustand.aktiv) continue;
    const f = zustand.figuren[name];
    punkt(f.x, f.y, "#7ab8ff", 3);
  }

  /* Spieler als Pfeil in Blickrichtung */
  const winkel = (spieler.imAuto ? spieler.imAuto.winkel : spieler.winkel) + Math.PI / 2;
  ctx.save();
  ctx.translate(groesse / 2, groesse / 2);
  ctx.rotate(winkel);
  ctx.fillStyle = "#ff8ab4";
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4.5, 5);
  ctx.lineTo(0, 2.5);
  ctx.lineTo(-4.5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
