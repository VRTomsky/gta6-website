/* ═══════════════════════════════════════════════════════════
   Minikarte und große Karte

   Beide zeigen dieselbe Stadt, nur in verschiedenen Ausschnitten, und
   beide arbeiten nach Norden ausgerichtet — die Karte dreht sich nicht
   mehr mit. Das war beim Fahren kaum zu lesen: drückt man A, wanderte
   die halbe Stadt nach rechts. Jetzt dreht sich nur der eigene Pfeil.

   Gezeichnet wird über Puffer:

     nahPuffer    Ausschnitt um den Spieler, 4 Bildpunkte je Meter,
                  wird erst neu gebaut, wenn man ein Stück gelaufen ist
     weltPuffer   die ganze Stadt, 2 Bildpunkte je Meter, einmalig

   Dadurch kosten Minikarte und große Karte pro Bild nur noch ein
   `drawImage` und ein paar Punkte — und sind trotzdem scharf.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";

/* Wenig Farben, dafür klare Abstufungen: Straße hell, Gehweg deutlich
   dunkler, Häuser fast schwarz. Vorher lagen Straße und Gehweg so nah
   beieinander, dass die Karte eine graue Fläche war. */
const FARBEN = {
  [Karte.ART.WASSER]: "#12304f",
  [Karte.ART.STRAND]: "#cfb78d",
  [Karte.ART.STRASSE]: "#cdd3db",
  [Karte.ART.KREUZUNG]: "#d8dde4",
  [Karte.ART.AUTOBAHN]: "#e6d295",
  [Karte.ART.BRUECKE]: "#b6bdc7",
  [Karte.ART.GEHWEG]: "#535b6a",
  [Karte.ART.PARK]: "#356b49",
  [Karte.ART.PARKPLATZ]: "#6b7280",
  [Karte.ART.GEBAEUDE]: "#232838",
  [Karte.ART.HAFEN]: "#3f4653"
};

/* Wahrzeichen bekommen eine eigene Farbe, damit man sie auf der großen
   Karte sofort findet */
const BAU_FARBE = {
  [Karte.BAU.POLIZEI]: "#3f6fd8",
  [Karte.BAU.FEUERWEHR]: "#d8492f",
  [Karte.BAU.KRANKENHAUS]: "#d8566f",
  [Karte.BAU.BANK]: "#caa63c",
  [Karte.BAU.STADION]: "#4aa07a",
  [Karte.BAU.KAUFHAUS]: "#7b5fc4",
  [Karte.BAU.TANKSTELLE]: "#c98a35",
  [Karte.BAU.KIRCHE]: "#8892a8",
  [Karte.BAU.SCHULE]: "#4f87a8",
  [Karte.BAU.HOCHHAUS]: "#39415a",
  [Karte.BAU.WAFFEN]: "#4bd07f"
};

/* Sichtweite der Minikarte (Höhe des Ausschnitts in Metern) */
const STUFEN = [60, 90, 140, 220, 340];
let stufe = 1;

export function zoomen(richtung) {
  stufe = Math.max(0, Math.min(STUFEN.length - 1, stufe + richtung));
  nahMitte.x = 1e9;                       // Puffer neu bauen
  return STUFEN[stufe];
}

/* ── Flächen in einen Zusammenhang malen ────────────────── */
function flaechenMalen(ctx, linksM, obenM, breiteM, hoeheM, pxProM, mitWahrzeichen) {
  const k = Karte.KACHEL;
  const t0x = Math.max(0, Karte.inKachel(linksM));
  const t0y = Math.max(0, Karte.inKachel(obenM));
  const t1x = Math.min(Karte.BREITE - 1, Karte.inKachel(linksM + breiteM) + 1);
  const t1y = Math.min(Karte.HOEHE - 1, Karte.inKachel(obenM + hoeheM) + 1);
  const kachel = k * pxProM + 0.6;

  ctx.fillStyle = FARBEN[Karte.ART.WASSER];
  ctx.fillRect(0, 0, breiteM * pxProM, hoeheM * pxProM);

  for (let ty = t0y; ty <= t1y; ty++) {
    for (let tx = t0x; tx <= t1x; tx++) {
      const a = Karte.art(tx, ty);
      let farbe = FARBEN[a] || "#2c3243";
      if (a === Karte.ART.GEBAEUDE) {
        const bau = Karte.bauArt(tx, ty);
        if (mitWahrzeichen && BAU_FARBE[bau]) farbe = BAU_FARBE[bau];
        else if (Karte.hoeheVon(tx, ty) > 0.5) farbe = "#2c3345";
      }
      ctx.fillStyle = farbe;
      ctx.fillRect((Karte.inMeter(tx) - linksM) * pxProM,
                   (Karte.inMeter(ty) - obenM) * pxProM, kachel, kachel);
    }
  }
}

/* ── Puffer um den Spieler ──────────────────────────────── */
let nahPuffer = null;
const nahMitte = { x: 1e9, y: 1e9 };
let nahSpanne = 0, nahAufl = 0, nahBreite = 0, nahHoehe = 0;

/* Der Puffer wird doppelt so fein gemalt, wie er gebraucht wird, und
   beim Zeichnen verkleinert. Dadurch franst keine Kachelkante aus — die
   Karte sah vorher wie ein Mosaik aus. */
const UEBER = 2;

function nahPufferBauen(pos, breiteM, hoeheM, pxProM) {
  const rand = 40;
  nahBreite = breiteM + rand * 2;
  nahHoehe = hoeheM + rand * 2;
  if (!nahPuffer) nahPuffer = document.createElement("canvas");
  const b = Math.ceil(nahBreite * pxProM * UEBER), h = Math.ceil(nahHoehe * pxProM * UEBER);
  if (nahPuffer.width !== b || nahPuffer.height !== h) {
    nahPuffer.width = b;
    nahPuffer.height = h;
  }
  const ctx = nahPuffer.getContext("2d");
  flaechenMalen(ctx, pos.x - nahBreite / 2, pos.y - nahHoehe / 2,
                nahBreite, nahHoehe, pxProM * UEBER);
  nahMitte.x = pos.x;
  nahMitte.y = pos.y;
  nahSpanne = hoeheM;
  nahAufl = pxProM;
}

/* Die Leinwand auf die echte Bildschirmauflösung bringen — sonst sieht
   die Karte auf feinen Bildschirmen verwaschen aus. */
function schaerfen(leinwand) {
  const dpr = Math.min(2.5, devicePixelRatio || 1);
  const kasten = leinwand.getBoundingClientRect();
  if (!kasten.width || !kasten.height) return false;
  const b = Math.round(kasten.width * dpr), h = Math.round(kasten.height * dpr);
  if (leinwand.width !== b || leinwand.height !== h) {
    leinwand.width = b;
    leinwand.height = h;
  }
  return true;
}

/* ── Minikarte ──────────────────────────────────────────── */
export function zeichnen(leinwand, zustand, spieler) {
  if (!schaerfen(leinwand)) return;
  const ctx = leinwand.getContext("2d");
  const b = leinwand.width, h = leinwand.height;
  const spanne = STUFEN[stufe];                    // Meter von oben nach unten
  const pxProM = h / spanne;
  const breiteM = b / pxProM;
  const pos = spieler.imAuto || spieler;
  const blick = (spieler.imAuto ? spieler.imAuto.winkel : spieler.winkel) + Math.PI / 2;

  if (!nahPuffer || nahSpanne !== spanne || nahAufl !== pxProM ||
      Math.abs(pos.x - nahMitte.x) > 25 || Math.abs(pos.y - nahMitte.y) > 25) {
    nahPufferBauen(pos, breiteM, spanne, pxProM);
  }

  ctx.clearRect(0, 0, b, h);
  ctx.save();
  ctx.translate(b / 2, h / 2);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const zielB = nahBreite * pxProM, zielH = nahHoehe * pxProM;
  ctx.drawImage(nahPuffer, 0, 0, nahPuffer.width, nahPuffer.height,
    (nahMitte.x - pos.x) * pxProM - zielB / 2,
    (nahMitte.y - pos.y) * pxProM - zielH / 2, zielB, zielH);

  const nach = (x, y) => [(x - pos.x) * pxProM, (y - pos.y) * pxProM];

  /* Route zum Ziel — sie folgt jetzt den Straßen */
  routeMalen(ctx, zustand.route, nach, Math.max(2.5, h * 0.035));

  const punkt = (x, y, farbe, r, rand) => {
    const [px, py] = nach(x, y);
    ctx.fillStyle = farbe;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    if (rand) {
      ctx.strokeStyle = "rgba(10,14,26,.85)";
      ctx.lineWidth = Math.max(1, r * 0.35);
      ctx.stroke();
    }
  };

  for (const m of zustand.missionen.marken()) punkt(m.x, m.y, m.farbe, h * 0.035, true);
  for (const l of zustand.laeden || []) punkt(l.x, l.y, "#6ee7a0", h * 0.03, true);
  for (const s of zustand.fahndung.streifen) punkt(s.x, s.y, "#ff5566", h * 0.028, true);
  for (const name of Object.keys(zustand.figuren)) {
    if (name === zustand.aktiv) continue;
    punkt(zustand.figuren[name].x, zustand.figuren[name].y, "#7ab8ff", h * 0.03, true);
  }
  if (zustand.wegpunkt) wegpunktMalen(ctx, nach(zustand.wegpunkt.x, zustand.wegpunkt.y), h * 0.055);
  ctx.restore();

  /* Eigener Pfeil in der Mitte — er dreht sich, nicht die Karte */
  ctx.save();
  ctx.translate(b / 2, h / 2);
  ctx.rotate(blick);
  ctx.fillStyle = "#ff8ab4";
  ctx.strokeStyle = "rgba(10,14,26,.9)";
  ctx.lineWidth = Math.max(1.2, h * 0.012);
  const r = h * 0.055;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.72, r * 0.8);
  ctx.lineTo(0, r * 0.34);
  ctx.lineTo(-r * 0.72, r * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  /* Norden oben rechts */
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.font = `700 ${Math.round(h * 0.085)}px "Barlow Condensed", system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("N", b - h * 0.05, h * 0.04);

  /* Entfernung zum Ziel oben links */
  const ziel = zustand.wegpunkt || zustand.missionen.marken()[0];
  if (ziel) {
    const d = zustand.route && zustand.route.laenge
      ? zustand.route.laenge
      : Math.hypot(ziel.x - pos.x, ziel.y - pos.y);
    const text = d > 950 ? (d / 1000).toFixed(1) + " km" : Math.round(d / 5) * 5 + " m";
    ctx.font = `700 ${Math.round(h * 0.085)}px "Barlow Condensed", system-ui, sans-serif`;
    const breite = ctx.measureText(text).width + h * 0.1;
    ctx.fillStyle = "rgba(10,14,26,.78)";
    ctx.beginPath();
    ctx.roundRect(h * 0.05, h * 0.04, breite, h * 0.14, h * 0.07);
    ctx.fill();
    ctx.fillStyle = "#e9edf7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, h * 0.05 + breite / 2, h * 0.113);
  }
}

/* Klick auf die Minikarte → Ort in der Stadt. Sie ist nach Norden
   ausgerichtet und liegt mittig auf dem Spieler, das macht die
   Umrechnung kurz. */
export function ortAusMinikarte(leinwand, spieler, klickX, klickY) {
  const kasten = leinwand.getBoundingClientRect();
  if (!kasten.width || !leinwand.height) return null;
  const px = (klickX - kasten.left) / kasten.width * leinwand.width;
  const py = (klickY - kasten.top) / kasten.height * leinwand.height;
  const pxProM = leinwand.height / STUFEN[stufe];
  const pos = spieler.imAuto || spieler;
  return {
    x: pos.x + (px - leinwand.width / 2) / pxProM,
    y: pos.y + (py - leinwand.height / 2) / pxProM
  };
}

function routeMalen(ctx, route, nach, breite) {
  if (!route || !route.punkte || route.punkte.length < 2) return;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(12,16,28,.65)";
  ctx.lineWidth = breite + 2.5;
  zeichneLinie(ctx, route.punkte, nach);
  ctx.strokeStyle = "#ff4aa0";
  ctx.lineWidth = breite;
  zeichneLinie(ctx, route.punkte, nach);
  ctx.restore();
}

function zeichneLinie(ctx, punkte, nach) {
  ctx.beginPath();
  for (let k = 0; k < punkte.length; k++) {
    const [px, py] = nach(punkte[k].x, punkte[k].y);
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function wegpunktMalen(ctx, [px, py], groesse) {
  ctx.save();
  ctx.translate(px, py);
  ctx.fillStyle = "#ff4aa0";
  ctx.strokeStyle = "rgba(10,14,26,.9)";
  ctx.lineWidth = Math.max(1, groesse * 0.14);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-groesse * 0.1, -groesse);
  ctx.lineTo(groesse * 0.72, -groesse * 0.72);
  ctx.lineTo(-groesse * 0.1, -groesse * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, groesse * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ── Große Karte ────────────────────────────────────────── */
let weltPuffer = null;
const WELT_AUFL = 2;                        // Bildpunkte je Meter im Puffer

function weltPufferBauen() {
  if (weltPuffer) return weltPuffer;
  const breiteM = Karte.inMeter(Karte.BREITE), hoeheM = Karte.inMeter(Karte.HOEHE);
  weltPuffer = document.createElement("canvas");
  weltPuffer.width = Math.round(breiteM * WELT_AUFL);
  weltPuffer.height = Math.round(hoeheM * WELT_AUFL);
  flaechenMalen(weltPuffer.getContext("2d"), 0, 0, breiteM, hoeheM, WELT_AUFL, true);
  return weltPuffer;
}

/* Die Ansicht der großen Karte: Mittelpunkt in Metern und Maßstab */
export function ansichtStandard(leinwand) {
  const breiteM = Karte.inMeter(Karte.BREITE), hoeheM = Karte.inMeter(Karte.HOEHE);
  const dpr = Math.min(2.5, devicePixelRatio || 1);
  const kasten = leinwand.getBoundingClientRect();
  const pxProM = Math.min((kasten.width * dpr) / breiteM, (kasten.height * dpr) / hoeheM) * 0.98;
  return { x: breiteM / 2, y: hoeheM / 2, pxProM, grund: pxProM };
}

export function ansichtBegrenzen(leinwand, ansicht) {
  const breiteM = Karte.inMeter(Karte.BREITE), hoeheM = Karte.inMeter(Karte.HOEHE);
  ansicht.pxProM = Math.max(ansicht.grund, Math.min(ansicht.grund * 10, ansicht.pxProM));
  const sichtB = leinwand.width / ansicht.pxProM, sichtH = leinwand.height / ansicht.pxProM;
  ansicht.x = sichtB >= breiteM ? breiteM / 2
    : Math.max(sichtB / 2, Math.min(breiteM - sichtB / 2, ansicht.x));
  ansicht.y = sichtH >= hoeheM ? hoeheM / 2
    : Math.max(sichtH / 2, Math.min(hoeheM - sichtH / 2, ansicht.y));
}

/* Bildpunkt auf der Leinwand → Ort in der Stadt */
export function ortAusKlick(leinwand, ansicht, klickX, klickY) {
  const kasten = leinwand.getBoundingClientRect();
  const px = (klickX - kasten.left) / kasten.width * leinwand.width;
  const py = (klickY - kasten.top) / kasten.height * leinwand.height;
  return {
    x: ansicht.x + (px - leinwand.width / 2) / ansicht.pxProM,
    y: ansicht.y + (py - leinwand.height / 2) / ansicht.pxProM
  };
}

export function grosseKarteZeichnen(leinwand, zustand, spieler, ansicht) {
  const ctx = leinwand.getContext("2d");
  const b = leinwand.width, h = leinwand.height;
  const puffer = weltPufferBauen();

  ctx.fillStyle = "#0b1124";
  ctx.fillRect(0, 0, b, h);
  ctx.save();
  ctx.translate(b / 2, h / 2);
  ctx.scale(ansicht.pxProM / WELT_AUFL, ansicht.pxProM / WELT_AUFL);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(puffer, -ansicht.x * WELT_AUFL, -ansicht.y * WELT_AUFL);
  ctx.restore();

  const nach = (x, y) => [b / 2 + (x - ansicht.x) * ansicht.pxProM,
                          h / 2 + (y - ansicht.y) * ansicht.pxProM];
  const dpr = Math.min(2.5, devicePixelRatio || 1);
  const pt = px => px * dpr;                  // Schriftgrößen in Bildschirmpunkten

  /* Wahrzeichen mit Namen — groß genug zum Lesen, mit dunklem Saum */
  ctx.font = `600 ${Math.round(pt(13))}px Figtree, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  for (const w of Karte.wahrzeichen) {
    const [px, py] = nach(w.x, w.y);
    if (px < -80 || py < -40 || px > b + 80 || py > h + 40) continue;
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.beginPath();
    ctx.arc(px, py, pt(3.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = pt(3);
    ctx.strokeStyle = "rgba(8,12,24,.85)";
    ctx.strokeText(w.name, px, py - pt(7));
    ctx.fillStyle = "rgba(236,242,255,.95)";
    ctx.fillText(w.name, px, py - pt(7));
  }

  /* Route und Wegpunkt */
  routeMalen(ctx, zustand.route, nach, Math.max(pt(2.5), ansicht.pxProM * 0.9));

  const punkt = (x, y, farbe, r) => {
    const [px, py] = nach(x, y);
    ctx.fillStyle = farbe;
    ctx.strokeStyle = "rgba(8,12,24,.85)";
    ctx.lineWidth = pt(1.5);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  for (const l of zustand.laeden || []) punkt(l.x, l.y, "#6ee7a0", pt(5));
  for (const m of zustand.missionen.marken()) punkt(m.x, m.y, m.farbe, pt(6));
  for (const s of zustand.fahndung.streifen) punkt(s.x, s.y, "#ff5566", pt(4));
  for (const name of Object.keys(zustand.figuren)) {
    if (name === zustand.aktiv) continue;
    punkt(zustand.figuren[name].x, zustand.figuren[name].y, "#7ab8ff", pt(5));
  }
  if (zustand.wegpunkt) {
    const [px, py] = nach(zustand.wegpunkt.x, zustand.wegpunkt.y);
    wegpunktMalen(ctx, [px, py], pt(15));
  }

  /* Spieler als Pfeil */
  const pos = spieler.imAuto || spieler;
  const blick = (spieler.imAuto ? spieler.imAuto.winkel : spieler.winkel) + Math.PI / 2;
  const [px, py] = nach(pos.x, pos.y);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(blick);
  ctx.fillStyle = "#ff8ab4";
  ctx.strokeStyle = "rgba(8,12,24,.9)";
  ctx.lineWidth = pt(1.5);
  const r = pt(9);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.72, r * 0.8);
  ctx.lineTo(0, r * 0.34);
  ctx.lineTo(-r * 0.72, r * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
