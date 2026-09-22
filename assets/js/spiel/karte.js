/* ═══════════════════════════════════════════════════════════
   Vice City — Zeichnen und Abfragen der Stadt

   Der Plan selbst entsteht in stadtplan.js (Wasser, Autobahn, Straßen,
   Blöcke, Wahrzeichen). Diese Datei malt ihn und beantwortet die Fragen,
   die Spiel, Verkehr und Polizei stellen:

     art(tx, ty)                Art einer Kachel
     fest / festAnPunkt         blockiert sie?
     spurMitte(tx, ty, …)       Mitte der richtigen Fahrspur
     naechsteKreuzung(…)        nächste Kreuzung in Fahrtrichtung
     ampelGruen(…)              darf ich über die Kreuzung?
     zeichnen(ctx, kamera)      sichtbaren Ausschnitt malen

   Gezeichnet wird nur, was im Bild liegt. Untergründe kommen als Textur
   (texturen.js), Häuser bekommen Farbe und Dachaufbauten nach Bauart.
   ═══════════════════════════════════════════════════════════ */

import * as Tex from "./texturen.js";
import * as Plan from "./stadtplan.js";
import { bild as sprite } from "./bilder.js";

export const KACHEL = Plan.KACHEL;
export const BREITE = Plan.BREITE;
export const HOEHE = Plan.HOEHE;
export const ART = Plan.ART;
export const BAU = Plan.BAU;
export const BEZIRK = Plan.BEZIRK;
export const wahrzeichen = Plan.wahrzeichen;

export const art = Plan.art;
export const fest = Plan.fest;
export const bauArt = Plan.bauArt;
export const hausNr = Plan.hausNr;
export const bezirkVon = Plan.bezirkVon;
export const hoeheVon = Plan.hoeheVon;
export const befahrbar = Plan.befahrbar;

/* Immer gleicher Zufall für denselben Ort (Deko, Verteilungen) */
export function streu(x, y, salz = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salz, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export const inMeter = t => t * KACHEL;
export const inKachel = m => Math.floor(m / KACHEL);
export const festAnPunkt = (mx, my) => fest(inKachel(mx), inKachel(my));
export const istStrasse = (tx, ty) => befahrbar(art(tx, ty));

export const START = Plan.startSuchen();

/* ── Fahrspuren ──────────────────────────────────────────
   Rechtsverkehr: in Fahrtrichtung liegt die eigene Spur rechts. Die
   Breite der Straße wird an Ort und Stelle abgetastet, weil das Raster
   nicht mehr gleichmäßig ist. */
export function bandGrenzen(tx, ty, senkrecht) {
  let von = senkrecht ? tx : ty;
  let bis = von;
  /* Nur die Fahrbahn zählt, nicht die Kreuzung: An einer Kreuzung maß das
     Band vorher quer über die Querstraße mit, und die Spurmitte landete
     auf dem Gehweg — deshalb fuhr der Verkehr dort ständig hinauf. */
  const prüfe = k => {
    const a = senkrecht ? art(k, ty) : art(tx, k);
    return a === ART.STRASSE || a === ART.BRUECKE || a === ART.AUTOBAHN;
  };
  while (prüfe(von - 1) && bis - (von - 1) < 8) von--;
  while (prüfe(bis + 1) && (bis + 1) - von < 8) bis++;
  return { von, bis, breite: bis - von + 1 };
}

export function spurMitte(tx, ty, richtung, senkrecht) {
  const { von, bis } = bandGrenzen(tx, ty, senkrecht);
  /* Rechtsverkehr: erlaubt ist die eigene Hälfte der Fahrbahn. Genommen
     wird darin die Spur, auf der der Wagen ohnehin schon fährt.

     Vorher zeigte die Spur immer auf den äußersten Rand des Bandes. Auf
     einer vierspurigen Autobahn lag der bis zu 25 Meter zur Seite — die
     Wagen zogen quer über die Fahrbahn und landeten auf dem Gehweg. */
  const mitte = (von + bis) / 2;
  const rechts = senkrecht ? richtung < 0 : richtung > 0;   // nach oben: rechts ist Osten
  const unten = rechts ? Math.ceil(mitte) : von;
  const oben = rechts ? bis : Math.floor(mitte);
  const eigen = senkrecht ? tx : ty;
  return inMeter(Math.min(oben, Math.max(unten, eigen))) + KACHEL / 2;
}

/* Nächste Kreuzung in Fahrtrichtung (Mitte in Metern) */
export function naechsteKreuzung(x, y, dx, dy) {
  let tx = inKachel(x), ty = inKachel(y);
  for (let s = 1; s < 70; s++) {
    const px = tx + dx * s, py = ty + dy * s;
    const a = art(px, py);
    if (a === ART.KREUZUNG) {
      /* Ausdehnung der Kreuzung bestimmen und Mitte nehmen */
      let x0 = px, x1 = px, y0 = py, y1 = py;
      while (art(x0 - 1, py) === ART.KREUZUNG) x0--;
      while (art(x1 + 1, py) === ART.KREUZUNG) x1++;
      while (art(px, y0 - 1) === ART.KREUZUNG) y0--;
      while (art(px, y1 + 1) === ART.KREUZUNG) y1++;
      return {
        tx: px, ty: py,
        x: inMeter((x0 + x1) / 2) + KACHEL / 2,
        y: inMeter((y0 + y1) / 2) + KACHEL / 2
      };
    }
    if (!befahrbar(a)) return null;
  }
  return null;
}

/* ── Ampeln ──
   Jede Kreuzung hat eine feste Taktverschiebung. 10 s Grün Nord-Süd,
   2 s Gelb/Räumen, 10 s Grün Ost-West, wieder 2 s. */
const TAKT = 24;
export function ampelPhase(tx, ty, zeit) {
  const t = (zeit / 1000 + streu(Math.floor(tx / 6), Math.floor(ty / 6), 53) * TAKT) % TAKT;
  if (t < 10) return "ns";            // Nord-Süd fährt
  if (t < 12) return "ns-gelb";
  if (t < 22) return "ow";            // Ost-West fährt
  return "ow-gelb";
}

export function ampelNordSued(tx, ty, zeit) {
  const p = ampelPhase(tx, ty, zeit);
  return p === "ns" || p === "ns-gelb";
}

export function ampelGruen(tx, ty, zeit, senkrecht) {
  const p = ampelPhase(tx, ty, zeit);
  return senkrecht ? p === "ns" : p === "ow";
}

/* ── Bodenkacheln und Deko aus den Bögen ──
   Die Untergründe sind jetzt echte Kacheln (4 × 4 m, nahtlos), die Deko
   sind freigestellte Sprites im Spielmaßstab (64 Bildpunkte je Meter).
   Fällt ein Bild aus, bleibt die alte gemalte Fläche darunter stehen. */
function bodenMalen(ctx, name, px, py, g) {
  const b = sprite("boden_" + name);
  if (!b) return false;
  ctx.drawImage(b, px, py, g + 1, g + 1);
  return true;
}

/* Deko mittig auf die Kachel, in ihrer echten Größe.
   vx/vy verschieben innerhalb der Kachel (0…1), dreh in Radiant. */
function dekoMalen(ctx, name, px, py, g, vx = 0.5, vy = 0.5, dreh = 0) {
  const b = sprite("deko_" + name);
  if (!b) return;
  const skala = g / (KACHEL * 64);
  const w = b.width * skala, h = b.height * skala;
  const mx = px + g * vx, my = py + g * vy;
  if (dreh) {
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(dreh);
    ctx.drawImage(b, -w / 2, -h / 2, w, h);
    ctx.restore();
    return;
  }
  ctx.drawImage(b, mx - w / 2, my - h / 2, w, h);
}

/* ── Farben ─────────────────────────────────────────────── */
const FARBE = {
  wasser: "#123a63",
  strand: "#d9c391",
  strasse: "#31333c",
  autobahn: "#2b2d35",
  bruecke: "#3a3d46",
  gehweg: "#70737c",
  park: "#2f6b45",
  parkplatz: "#3c3f4a",
  hafen: "#4a4d57"
};

/* Dachfarben je Bauart — bunt genug, dass die Stadt lebt */
const DACH = {
  [Plan.BAU.WOHNHAUS]: ["#a4635a", "#8d6f8f", "#6f8496", "#9c8a5f", "#7f6f92", "#6e8a72"],
  [Plan.BAU.HOCHHAUS]: ["#44507a", "#4d4a74", "#3a4d77", "#565a84", "#414a6b"],
  [Plan.BAU.HOTEL]: ["#e0b9a0", "#dcc7a6", "#d2a68f", "#e6cdb6", "#cfa98b"],
  [Plan.BAU.LAGER]: ["#5f6570", "#565c66", "#69707a", "#4f555f"],
  [Plan.BAU.LADEN]: ["#c96f6a", "#d8a03f", "#5d9fb0", "#b06fa8", "#6fa96b"],
  [Plan.BAU.BANK]: ["#c9b072"],
  [Plan.BAU.POLIZEI]: ["#3f5d96"],
  [Plan.BAU.FEUERWEHR]: ["#b3453c"],
  [Plan.BAU.KRANKENHAUS]: ["#d8dde4"],
  [Plan.BAU.STADION]: ["#6c8f5f"],
  [Plan.BAU.KIRCHE]: ["#8d8fa6"],
  [Plan.BAU.SCHULE]: ["#c08a55"],
  [Plan.BAU.TANKSTELLE]: ["#d9d3c2"],
  [Plan.BAU.KAUFHAUS]: ["#8f6fa8", "#7a7fb5"],
  [Plan.BAU.WERK]: ["#6a6f62", "#77705d"],
  [Plan.BAU.WAFFEN]: ["#3f5c46"],
  [Plan.BAU.CLUB]: ["#8a3f7a"]
};

/* ── Gebäudebilder ────────────────────────────────────────
   Für jede Bauart gibt es mehrere gezeichnete Dächer. Welches
   ein Haus bekommt, entscheidet seine Nummer — also immer dasselbe.
   Das Bild wird auf die Grundfläche gezogen und quer gelegt, wenn
   das Haus hochkant steht. Fehlt ein Bild, bleibt das alte gemalte
   Dach stehen. */
const HAUSBILD = {
  [Plan.BAU.WOHNHAUS]: ["haus_klein", "haus_bungalow", "haus_stuck", "haus_strand",
                        "haus_reihe", "haus_hof", "haus_modern", "haus_villa",
                        "haus_block2", "haus_alt"],
  [Plan.BAU.HOCHHAUS]: ["turm_buero", "turm_glas", "turm_deco", "turm_antennen",
                        "turm_bau", "turm_pool", "turm_helipad", "haus_block_lang"],
  [Plan.BAU.HOTEL]: ["turm_pool", "turm_bar", "haus_motel", "turm_helipad"],
  [Plan.BAU.LAGER]: ["bau_lager", "turm_tank"],
  [Plan.BAU.LADEN]: ["bau_laden", "bau_diner", "haus_block2"],
  [Plan.BAU.CLUB]: ["bau_club"],
  [Plan.BAU.BANK]: ["bau_bank", "turm_bank"],
  [Plan.BAU.POLIZEI]: ["bau_polizei"],
  [Plan.BAU.FEUERWEHR]: ["bau_feuerwehr"],
  [Plan.BAU.KRANKENHAUS]: ["bau_klinik"],
  [Plan.BAU.KIRCHE]: ["bau_kirche"],
  [Plan.BAU.SCHULE]: ["bau_schule"],
  [Plan.BAU.STADION]: ["bau_schule"],
  [Plan.BAU.KAUFHAUS]: ["turm_mall", "bau_markt", "turm_parkhaus"],
  [Plan.BAU.WERK]: ["bau_lager", "turm_tank"],
  [Plan.BAU.WAFFEN]: ["bau_waffen"]
};

/* Die Bilder liegen mit 32 Bildpunkten je Meter im Ordner — daraus
   ergibt sich, wie groß ein Gebäude gedacht ist. */
const HAUS_PX = 32;

/* Passendes Bild zum Grundstück suchen.
   Vorher wurde einfach gewürfelt: ein 34-Meter-Einkaufszentrum landete
   dann auf einem 12-Meter-Grundstück und war winzig, der kleine Club auf
   einem Riesengrundstück verzerrt. Jetzt zählt, wie gut Länge und
   Seitenverhältnis des Bildes zur Fläche passen; ein kleiner Zuschlag je
   Hausnummer sorgt dafür, dass gleich große Grundstücke trotzdem
   unterschiedliche Häuser bekommen. */
function hausWaehlen(h) {
  const liste = HAUSBILD[h.bau];
  if (!liste) return null;
  const a = (h.kx1 - h.kx0 + 1) * KACHEL;
  const b2 = (h.ky1 - h.ky0 + 1) * KACHEL;
  const langM = Math.max(a, b2), kurzM = Math.min(a, b2);
  let bester = null, bestWert = Infinity;
  for (let k = 0; k < liste.length; k++) {
    const b = sprite(liste[k]);
    if (!b) continue;
    const lang = Math.max(b.width, b.height) / HAUS_PX;
    const seite = Math.max(b.width, b.height) / Math.min(b.width, b.height);
    const wert = Math.abs(Math.log(lang / langM))
               + Math.abs(Math.log(seite / (langM / kurzM))) * 0.7
               + streu(h.nr, k, 23) * 0.14;
    if (wert < bestWert) { bestWert = wert; bester = liste[k]; }
  }
  return bester;
}

/* Bild eines Hauses — einmal gewählt und am Haus gemerkt.
   Bleibt vom Grundstück kein brauchbares Rechteck übrig (schmale
   L-Formen), malt weiter der alte Dachzeichner. */
function hausBild(h) {
  if (!h || h.kern < 0.55) return null;
  if (h.bild === undefined) h.bild = hausWaehlen(h);
  return h.bild ? sprite(h.bild) : null;
}

const hausVon = (tx, ty) => Plan.haeuser[hausNr(tx, ty)] || null;

/* Liegt die Kachel unter einem Gebäudebild oder in dessen Hof? Dann malt
   der Kachelzeichner kein Dach und der Wandzeichner keine Wand. */
const bildHaus = (tx, ty) => !!hausBild(hausVon(tx, ty));

/* Zu welcher Seite des Grundstücks liegt die Straße?
   Die Bilder zeigen die Vorderseite unten — also wird das Haus so
   gedreht, dass seine Front zur Straße zeigt. Vorher stand der Club
   mit dem Eingang zur Hauswand. */
function strassenSeiten(h) {
  const zaehlen = (x0, y0, x1, y1) => {
    let n = 0;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const a = art(tx, ty);
        if (a === ART.STRASSE || a === ART.KREUZUNG) n += 2;
        else if (a === ART.GEHWEG) n += 1;
      }
    }
    return n;
  };
  return {
    s: zaehlen(h.x0, h.y1 + 1, h.x1, h.y1 + 2),
    n: zaehlen(h.x0, h.y0 - 2, h.x1, h.y0 - 1),
    o: zaehlen(h.x1 + 1, h.y0, h.x1 + 2, h.y1),
    w: zaehlen(h.x0 - 2, h.y0, h.x0 - 1, h.y1)
  };
}

/* Vierteldrehungen im Uhrzeigersinn: 0 = Front nach Süden, 1 = Westen,
   2 = Norden, 3 = Osten. Gewählt wird unter den Drehungen, die zum
   Grundriss passen, die mit der meisten Straße davor. */
function hausDrehung(h, b) {
  const bildQuer = b.width >= b.height;
  const platzQuer = (h.kx1 - h.kx0) >= (h.ky1 - h.ky0);
  const kandidaten = bildQuer === platzQuer ? [0, 2] : [1, 3];
  const seiten = strassenSeiten(h);
  const wohin = { 0: seiten.s, 1: seiten.w, 2: seiten.n, 3: seiten.o };
  return kandidaten[0] >= 0 && wohin[kandidaten[1]] > wohin[kandidaten[0]]
    ? kandidaten[1] : kandidaten[0];
}

/* Gehört die Kachel zum Kern, also zur Fläche unter dem Bild? */
function imKern(h, tx, ty) {
  return tx >= h.kx0 && tx <= h.kx1 && ty >= h.ky0 && ty <= h.ky1;
}

function hausMalen(ctx, h, linksM, obenM, zoom) {
  const b = hausBild(h);
  if (!b) return;
  /* Gezeichnet wird auf den Kern — das größte volle Rechteck des
     Grundstücks. Dadurch muss nichts beschnitten werden, kein Haus ist
     mehr angeschnitten. Was außen herum übrig bleibt, ist Hof. */
  const x = (inMeter(h.kx0) - linksM) * zoom;
  const y = (inMeter(h.ky0) - obenM) * zoom;
  const w = (h.kx1 - h.kx0 + 1) * KACHEL * zoom;
  const t = (h.ky1 - h.ky0 + 1) * KACHEL * zoom;

  /* Schatten nach unten rechts, so hoch wie das Haus */
  const hoch = Plan.hoeheVon(h.kx0, h.ky0);
  const weg = KACHEL * zoom * 0.42 * hoch;
  ctx.fillStyle = "rgba(6,10,24,.3)";
  ctx.fillRect(x + weg, y + weg, w, t);

  if (h.dreh === undefined) h.dreh = hausDrehung(h, b);
  if (h.dreh === 0) { ctx.drawImage(b, x, y, w, t); return; }

  /* Gedreht gezeichnet: Bei einer Vierteldrehung tauschen Breite und
     Höhe, deshalb wird das Bild in der getauschten Größe gemalt. */
  const quer = h.dreh % 2 === 1;
  ctx.save();
  ctx.translate(x + w / 2, y + t / 2);
  ctx.rotate(h.dreh * (Math.PI / 2));
  ctx.drawImage(b, quer ? -t / 2 : -w / 2, quer ? -w / 2 : -t / 2,
                quer ? t : w, quer ? w : t);
  ctx.restore();
}

function dachFarbe(tx, ty) {
  const liste = DACH[bauArt(tx, ty)] || DACH[Plan.BAU.WOHNHAUS];
  return liste[Math.floor(streu(hausNr(tx, ty), 7, 11) * liste.length) % liste.length];
}

function dunkler(farbe, faktor) {
  const n = parseInt(farbe.slice(1), 16);
  return `rgb(${Math.round(((n >> 16) & 255) * faktor)},${Math.round(((n >> 8) & 255) * faktor)},${Math.round((n & 255) * faktor)})`;
}

/* ── Straße ─────────────────────────────────────────────── */
function strasseMalen(ctx, tx, ty, px, py, g, a) {
  ctx.fillStyle = a === ART.AUTOBAHN ? FARBE.autobahn : a === ART.BRUECKE ? FARBE.bruecke : FARBE.strasse;
  ctx.fillRect(px, py, g + 1, g + 1);
  /* Zwei Asphaltsorten im Wechsel, damit die Straße nicht wie Linoleum
     aussieht; Brücken bleiben beim alten Belag. */
  const kachel = a === ART.BRUECKE ? null
    : streu(tx, ty, 131) > 0.78 ? "asphalt_riss" : "asphalt";
  if (!kachel || !bodenMalen(ctx, kachel, px, py, g)) {
    Tex.malen(ctx, "asphalt", streu(tx, ty, 101), px, py, g);
  }

  if (a === ART.KREUZUNG) {
    ctx.fillStyle = "rgba(236,232,220,.38)";
    /* Zebrastreifen an den Rändern der Kreuzung */
    const randOben = art(tx, ty - 1) !== ART.KREUZUNG && befahrbar(art(tx, ty - 1));
    const randUnten = art(tx, ty + 1) !== ART.KREUZUNG && befahrbar(art(tx, ty + 1));
    const randLinks = art(tx - 1, ty) !== ART.KREUZUNG && befahrbar(art(tx - 1, ty));
    const randRechts = art(tx + 1, ty) !== ART.KREUZUNG && befahrbar(art(tx + 1, ty));
    for (let k = 0; k < 4; k++) {
      const t = (k + 0.25) / 4;
      if (randOben) ctx.fillRect(px + g * t, py + g * 0.04, g * 0.12, g * 0.18);
      if (randUnten) ctx.fillRect(px + g * t, py + g * 0.78, g * 0.12, g * 0.18);
      if (randLinks) ctx.fillRect(px + g * 0.04, py + g * t, g * 0.18, g * 0.12);
      if (randRechts) ctx.fillRect(px + g * 0.78, py + g * t, g * 0.18, g * 0.12);
    }
    return;
  }

  if (a === ART.BRUECKE) {
    /* Geländer an den Seiten */
    ctx.fillStyle = "rgba(210,214,224,.5)";
    if (!befahrbar(art(tx - 1, ty))) ctx.fillRect(px, py, g * 0.12, g + 1);
    if (!befahrbar(art(tx + 1, ty))) ctx.fillRect(px + g * 0.88, py, g * 0.12, g + 1);
    if (!befahrbar(art(tx, ty - 1))) ctx.fillRect(px, py, g + 1, g * 0.12);
    if (!befahrbar(art(tx, ty + 1))) ctx.fillRect(px, py + g * 0.88, g + 1, g * 0.12);
  }

  /* Mittel- und Spurlinien: aus der Lage im Band bestimmt */
  const senkrecht = befahrbar(art(tx, ty - 1)) && befahrbar(art(tx, ty + 1));
  const band = bandGrenzen(tx, ty, senkrecht);
  const stelle = (senkrecht ? tx : ty) - band.von;
  const mitte = (band.breite - 1) / 2;

  if (a === ART.AUTOBAHN) {
    ctx.fillStyle = "rgba(235,225,180,.55)";
    if (Math.abs(stelle - mitte) < 0.6) {                    // Mittelschutz
      ctx.fillStyle = "rgba(190,196,206,.8)";
      if (senkrecht) ctx.fillRect(px + g * 0.42, py, g * 0.16, g + 1);
      else ctx.fillRect(px, py + g * 0.42, g + 1, g * 0.16);
    } else if (stelle === 0 || stelle === band.breite - 1) {  // Randstreifen
      ctx.fillStyle = "rgba(235,235,225,.45)";
      if (senkrecht) ctx.fillRect(px + (stelle === 0 ? g * 0.06 : g * 0.88), py, g * 0.06, g + 1);
      else ctx.fillRect(px, py + (stelle === 0 ? g * 0.06 : g * 0.88), g + 1, g * 0.06);
    }
    return;
  }

  if (band.breite >= 4 && Math.abs(stelle - mitte) < 0.6) {
    ctx.fillStyle = "rgba(74,104,80,.95)";                   // begrünte Mittelinsel
    if (senkrecht) ctx.fillRect(px + g * 0.3, py, g * 0.4, g + 1);
    else ctx.fillRect(px, py + g * 0.3, g + 1, g * 0.4);
  } else if (band.breite <= 3 && Math.abs(stelle - mitte) < 0.55) {
    ctx.fillStyle = "rgba(235,225,180,.8)";                  // Mittelstreifen
    if (senkrecht) ctx.fillRect(px + g * 0.46, py + g * 0.15, g * 0.08, g * 0.7);
    else ctx.fillRect(px + g * 0.15, py + g * 0.46, g * 0.7, g * 0.08);
  }
}

/* ── Gehweg mit Bäumen, Laternen, Hydranten ─────────────── */
function gehwegMalen(ctx, tx, ty, px, py, g, bez) {
  ctx.fillStyle = FARBE.gehweg;
  ctx.fillRect(px, py, g + 1, g + 1);
  const belag = bez === Plan.BEZIRK.INNENSTADT && streu(tx, ty, 147) > 0.6 ? "platz" : "gehweg";
  if (!bodenMalen(ctx, belag, px, py, g)) {
    Tex.malen(ctx, "gehweg", streu(tx, ty, 103), px, py, g);
  }
  /* Strandpromenade: Holzdielen entlang des Sandes */
  if (bez === Plan.BEZIRK.STRAND && (art(tx - 1, ty) === ART.STRAND || art(tx + 1, ty) === ART.STRAND ||
                                     art(tx, ty - 1) === ART.STRAND || art(tx, ty + 1) === ART.STRAND)) {
    dekoMalen(ctx, "promenade", px, py, g, 0.5, 0.5,
              art(tx, ty - 1) === ART.STRAND || art(tx, ty + 1) === ART.STRAND ? Math.PI / 2 : 0);
  }

  /* Bordsteinkante zur Straße */
  ctx.fillStyle = "rgba(226,206,120,.35)";
  if (befahrbar(art(tx, ty - 1))) ctx.fillRect(px, py, g + 1, g * 0.1);
  if (befahrbar(art(tx, ty + 1))) ctx.fillRect(px, py + g * 0.9, g + 1, g * 0.1);
  if (befahrbar(art(tx - 1, ty))) ctx.fillRect(px, py, g * 0.1, g + 1);
  if (befahrbar(art(tx + 1, ty))) ctx.fillRect(px + g * 0.9, py, g * 0.1, g + 1);

  /* Straßenmöbel: was hier steht, entscheidet der feste Zufall des Ortes.
     Dadurch steht jede Bank immer an derselben Stelle. */
  const l = streu(tx, ty, 13);
  const dreh = streu(tx, ty, 133) * Math.PI * 2;
  const palmen = bez === Plan.BEZIRK.STRAND ? 0.7 : 0.9;
  if (l > palmen) {
    dekoMalen(ctx, bez === Plan.BEZIRK.STRAND ? "palme" : "baum", px, py, g);
  } else if (l > 0.84) {
    dekoMalen(ctx, "laterne", px, py, g, 0.5, 0.5, dreh);
  } else if (l > 0.815) {
    dekoMalen(ctx, "bank", px, py, g, 0.5, 0.5, Math.round(dreh / (Math.PI / 2)) * (Math.PI / 2));
  } else if (l > 0.795) {
    dekoMalen(ctx, "muelleimer", px, py, g);
  } else if (l > 0.785) {
    dekoMalen(ctx, "haltestelle", px, py, g);
  } else if (l > 0.775) {
    dekoMalen(ctx, "telefon", px, py, g);
  } else if (l > 0.765 && bez === Plan.BEZIRK.INNENSTADT) {
    dekoMalen(ctx, "zeitungsbox", px, py, g);
  } else if (l > 0.755 && bez === Plan.BEZIRK.INNENSTADT) {
    dekoMalen(ctx, "cafetisch", px, py, g);
  } else if (l > 0.745 && bez === Plan.BEZIRK.STRAND) {
    dekoMalen(ctx, "marktstand", px, py, g);
  } else if (l < 0.04) {
    dekoMalen(ctx, "hydrant", px, py, g, 0.5, 0.5);
  }
}

/* ── Gebäude ────────────────────────────────────────────── */
function gebaeudeMalen(ctx, tx, ty, px, py, g) {
  const bau = bauArt(tx, ty);
  const h = Plan.hoeheVon(tx, ty);
  const farbe = dachFarbe(tx, ty);
  ctx.fillStyle = farbe;
  ctx.fillRect(px, py, g + 1, g + 1);
  ctx.fillStyle = `rgba(255,255,255,${0.02 + h * 0.08})`;
  ctx.fillRect(px, py, g + 1, g + 1);
  Tex.malen(ctx, "dach", streu(tx, ty, 127), px, py, g);

  /* Fuge zum Nachbarhaus */
  const nr = hausNr(tx, ty);
  ctx.fillStyle = "rgba(8,10,22,.5)";
  if (hausNr(tx + 1, ty) !== nr) ctx.fillRect(px + g * 0.9, py, g * 0.12, g + 1);
  if (hausNr(tx, ty + 1) !== nr) ctx.fillRect(px, py + g * 0.9, g + 1, g * 0.12);

  const d = streu(tx, ty, 23);
  const mitteX = hausNr(tx - 1, ty) !== nr || hausNr(tx + 1, ty) !== nr;

  switch (bau) {
    case Plan.BAU.HOCHHAUS:
      if (d > 0.9) {                                         // Hubschrauberplatz
        ctx.strokeStyle = "rgba(240,240,230,.5)";
        ctx.lineWidth = Math.max(1, g * 0.05);
        ctx.beginPath();
        ctx.arc(px + g * 0.5, py + g * 0.5, g * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (d > 0.55) {
        ctx.fillStyle = "rgba(150,200,255,.14)";             // Glasdach
        ctx.fillRect(px + g * 0.16, py + g * 0.16, g * 0.68, g * 0.68);
      } else if (d < 0.2) {
        ctx.fillStyle = "rgba(0,0,0,.28)";                   // Technik
        ctx.fillRect(px + g * 0.3, py + g * 0.28, g * 0.4, g * 0.3);
      }
      break;
    case Plan.BAU.HOTEL:
      if (d > 0.78) {
        ctx.fillStyle = "#2f8fd0";                           // Dachpool
        ctx.fillRect(px + g * 0.22, py + g * 0.26, g * 0.56, g * 0.44);
        ctx.fillStyle = "rgba(255,255,255,.3)";
        ctx.fillRect(px + g * 0.22, py + g * 0.26, g * 0.56, g * 0.1);
      } else if (d < 0.3) {
        ctx.fillStyle = "rgba(240,120,140,.75)";             // Sonnenschirme
        ctx.beginPath();
        ctx.arc(px + g * 0.36, py + g * 0.4, g * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + g * 0.66, py + g * 0.64, g * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case Plan.BAU.LAGER:
    case Plan.BAU.WERK:
      ctx.fillStyle = "rgba(0,0,0,.12)";                     // Wellblech
      for (let k = 0; k < 4; k++) ctx.fillRect(px, py + g * (0.12 + k * 0.22), g + 1, g * 0.07);
      if (d > 0.82) {
        ctx.fillStyle = ["#c0533f", "#2f6f8f", "#c9a23a"][Math.floor(d * 100) % 3];
        ctx.fillRect(px + g * 0.18, py + g * 0.3, g * 0.64, g * 0.34);
      }
      if (bau === Plan.BAU.WERK && d < 0.18) {
        ctx.fillStyle = "#4a4f57";                           // Schornstein
        ctx.beginPath();
        ctx.arc(px + g * 0.5, py + g * 0.5, g * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case Plan.BAU.LADEN:
    case Plan.BAU.KAUFHAUS:
      if (mitteX) {                                          // Markise zur Straße
        ctx.fillStyle = "rgba(255,255,255,.18)";
        ctx.fillRect(px + g * 0.1, py + g * 0.1, g * 0.8, g * 0.2);
      }
      if (d > 0.7) {
        ctx.fillStyle = "rgba(255,240,190,.5)";              // Leuchtreklame
        ctx.fillRect(px + g * 0.24, py + g * 0.42, g * 0.52, g * 0.16);
      }
      break;
    case Plan.BAU.BANK:
      ctx.fillStyle = "rgba(255,240,190,.35)";
      ctx.fillRect(px + g * 0.2, py + g * 0.2, g * 0.6, g * 0.6);
      ctx.fillStyle = "rgba(80,60,20,.5)";
      ctx.fillRect(px + g * 0.42, py + g * 0.2, g * 0.16, g * 0.6);
      break;
    case Plan.BAU.POLIZEI:
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fillRect(px + g * 0.18, py + g * 0.4, g * 0.64, g * 0.2);
      ctx.fillStyle = "#e8b53a";
      ctx.fillRect(px + g * 0.42, py + g * 0.2, g * 0.16, g * 0.16);
      break;
    case Plan.BAU.FEUERWEHR:
      ctx.fillStyle = "rgba(255,255,255,.3)";
      ctx.fillRect(px + g * 0.15, py + g * 0.62, g * 0.7, g * 0.2);
      break;
    case Plan.BAU.KRANKENHAUS:
      ctx.fillStyle = "#d8404a";                             // rotes Kreuz
      ctx.fillRect(px + g * 0.42, py + g * 0.22, g * 0.16, g * 0.56);
      ctx.fillRect(px + g * 0.22, py + g * 0.42, g * 0.56, g * 0.16);
      break;
    case Plan.BAU.STADION:
      ctx.fillStyle = "#3f8b4f";
      ctx.fillRect(px, py, g + 1, g + 1);
      ctx.strokeStyle = "rgba(255,255,255,.4)";
      ctx.lineWidth = Math.max(1, g * 0.04);
      ctx.strokeRect(px + g * 0.1, py + g * 0.1, g * 0.8, g * 0.8);
      break;
    case Plan.BAU.KIRCHE:
      ctx.fillStyle = "rgba(255,255,255,.2)";
      ctx.fillRect(px + g * 0.44, py + g * 0.1, g * 0.12, g * 0.8);
      ctx.fillRect(px + g * 0.24, py + g * 0.4, g * 0.52, g * 0.12);
      break;
    case Plan.BAU.SCHULE:
      ctx.fillStyle = "rgba(255,255,255,.15)";
      for (let k = 0; k < 3; k++) ctx.fillRect(px + g * (0.16 + k * 0.26), py + g * 0.3, g * 0.16, g * 0.4);
      break;
    case Plan.BAU.WAFFEN:
      /* Ammu-Vice: grünes Dach mit Leuchtschrift und Zielscheibe */
      ctx.fillStyle = "rgba(255,240,190,.5)";
      ctx.fillRect(px + g * 0.14, py + g * 0.12, g * 0.72, g * 0.18);
      ctx.strokeStyle = "rgba(255,90,110,.75)";
      ctx.lineWidth = Math.max(1, g * 0.05);
      ctx.beginPath();
      ctx.arc(px + g * 0.5, py + g * 0.58, g * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,90,110,.75)";
      ctx.beginPath();
      ctx.arc(px + g * 0.5, py + g * 0.58, g * 0.07, 0, Math.PI * 2);
      ctx.fill();
      break;
    case Plan.BAU.TANKSTELLE:
      ctx.fillStyle = "#e8e2d2";
      ctx.fillRect(px, py, g + 1, g + 1);
      ctx.fillStyle = "#d8404a";
      ctx.fillRect(px + g * 0.1, py + g * 0.1, g * 0.8, g * 0.16);
      ctx.fillStyle = "#3b3f48";
      ctx.fillRect(px + g * 0.36, py + g * 0.44, g * 0.28, g * 0.36);
      break;
    default:
      if (d > 0.88) {
        ctx.fillStyle = "#2f8fd0";                           // Pool im Garten
        ctx.fillRect(px + g * 0.3, py + g * 0.34, g * 0.4, g * 0.3);
      } else if (d < 0.16) {
        ctx.fillStyle = "rgba(180,220,255,.18)";             // Dachfenster
        ctx.fillRect(px + g * 0.32, py + g * 0.32, g * 0.36, g * 0.36);
      } else if (d > 0.6 && d < 0.66) {
        ctx.fillStyle = "rgba(0,0,0,.2)";                    // Lüftung
        ctx.fillRect(px + g * 0.55, py + g * 0.18, g * 0.24, g * 0.2);
      }
  }
}

/* ── Untergründe ────────────────────────────────────────── */
function kachelMalen(ctx, tx, ty, px, py, g, zeit) {
  const a = art(tx, ty);
  const bez = bezirkVon(tx, ty);

  switch (a) {
    case ART.WASSER: {
      ctx.fillStyle = FARBE.wasser;
      ctx.fillRect(px, py, g + 1, g + 1);
      Tex.malen(ctx, "wasser", streu(tx, ty, 109), px, py, g);
      const w = Math.sin(tx * 0.7 + ty * 0.4 + zeit * 0.0009) * 0.5 + 0.5;
      ctx.globalAlpha = 0.08 + w * 0.14;
      ctx.fillStyle = "#bfe4ff";
      ctx.fillRect(px, py + g * (0.28 + w * 0.2), g + 1, g * 0.1);
      ctx.globalAlpha = 1;
      /* Ein paar Boote draußen — nur, wo kein Ufer angrenzt */
      const f = streu(tx, ty, 151);
      if (f > 0.985) dekoMalen(ctx, "segler", px, py, g, 0.5, 0.5, streu(tx, ty, 153) * 6.28);
      else if (f > 0.97) dekoMalen(ctx, "boot", px, py, g, 0.5, 0.5, streu(tx, ty, 155) * 6.28);
      else if (f > 0.96) dekoMalen(ctx, "jetski", px, py, g, 0.5, 0.5, streu(tx, ty, 157) * 6.28);
      break;
    }
    case ART.STRAND: {
      ctx.fillStyle = FARBE.strand;
      ctx.fillRect(px, py, g + 1, g + 1);
      const amWasser = art(tx - 1, ty) === ART.WASSER || art(tx + 1, ty) === ART.WASSER ||
                       art(tx, ty - 1) === ART.WASSER || art(tx, ty + 1) === ART.WASSER;
      if (!bodenMalen(ctx, "sand", px, py, g)) {
        Tex.malen(ctx, "sand", streu(tx, ty, 111), px, py, g);
      }
      if (amWasser && streu(tx, ty, 149) > 0.88) {
        dekoMalen(ctx, "steg", px, py, g, 0.5, 0.5,
                  art(tx, ty - 1) === ART.WASSER || art(tx, ty + 1) === ART.WASSER ? 0 : Math.PI / 2);
      }
      const s = streu(tx, ty, 5);
      if (s > 0.955) dekoMalen(ctx, "schirm", px, py, g);
      else if (s > 0.925) dekoMalen(ctx, "liegen", px, py, g, 0.5, 0.5, streu(tx, ty, 137) * 1.2);
      else if (s > 0.915) dekoMalen(ctx, "turm", px, py, g);
      else if (s > 0.908) dekoMalen(ctx, "volleyball", px, py, g);
      else if (s > 0.9) dekoMalen(ctx, "ruderboot", px, py, g, 0.5, 0.5, streu(tx, ty, 139) * 0.8);
      break;
    }
    case ART.STRASSE:
    case ART.KREUZUNG:
    case ART.AUTOBAHN:
    case ART.BRUECKE:
      strasseMalen(ctx, tx, ty, px, py, g, a);
      break;
    case ART.GEHWEG:
      gehwegMalen(ctx, tx, ty, px, py, g, bez);
      break;
    case ART.PARK: {
      ctx.fillStyle = FARBE.park;
      ctx.fillRect(px, py, g + 1, g + 1);
      if (!bodenMalen(ctx, "gras", px, py, g)) {
        Tex.malen(ctx, "gras", streu(tx, ty, 113), px, py, g);
      }
      const b = streu(tx, ty, 17);
      if (b < 0.1) {
        bodenMalen(ctx, streu(tx, ty, 145) > 0.5 ? "kies" : "erde", px, py, g);   // Weg
      } else if (b > 0.66) {
        dekoMalen(ctx, "baum", px, py, g);
      } else if (b > 0.52) {
        const busch = Tex.tex("busch", streu(tx, ty, 119));
        if (busch) ctx.drawImage(busch, px, py, g, g);
      } else if (b > 0.5) {
        dekoMalen(ctx, "bank", px, py, g, 0.5, 0.5,
                  Math.round(streu(tx, ty, 141) * 4) * (Math.PI / 2));
      } else if (b > 0.46) {
        if (bodenMalen(ctx, "wasser", px, py, g)) {          // Teich
          ctx.fillStyle = "rgba(18,58,60,.45)";              // im Park dunkler als ein Pool
          ctx.fillRect(px, py, g + 1, g + 1);
        }
      }
      break;
    }
    case ART.PARKPLATZ:
      ctx.fillStyle = FARBE.parkplatz;
      ctx.fillRect(px, py, g + 1, g + 1);
      if (!bodenMalen(ctx, "parkplatz", px, py, g)) {
        Tex.malen(ctx, "beton", streu(tx, ty, 121), px, py, g);
      }
      ctx.strokeStyle = "rgba(230,230,210,.22)";
      ctx.lineWidth = Math.max(1, g * 0.03);
      ctx.beginPath();
      ctx.moveTo(px + g * 0.5, py + g * 0.12);
      ctx.lineTo(px + g * 0.5, py + g * 0.88);
      ctx.stroke();
      break;
    case ART.HAFEN: {
      ctx.fillStyle = FARBE.hafen;
      ctx.fillRect(px, py, g + 1, g + 1);
      if (!bodenMalen(ctx, "hafen", px, py, g)) {
        Tex.malen(ctx, "beton", streu(tx, ty, 123), px, py, g);
      }
      if (streu(tx, ty, 147) > 0.85) bodenMalen(ctx, "nass", px, py, g);   // Pfütze
      const h2 = streu(tx, ty, 143);
      if (h2 > 0.78) dekoMalen(ctx, "container", px, py, g, 0.5, 0.5,
                               Math.round(h2 * 4) * (Math.PI / 2));
      else if (h2 > 0.72) dekoMalen(ctx, "muellcontainer", px, py, g);
      break;
    }
    default: {
      const haus = hausVon(tx, ty);
      if (hausBild(haus)) {
        /* Unter dem Gebäudebild liegt Boden — an den Rändern ist es
           durchsichtig, dort soll Gehweg durchscheinen, kein Dach. */
        ctx.fillStyle = FARBE.gehweg;
        ctx.fillRect(px, py, g + 1, g + 1);
        bodenMalen(ctx, "gehweg", px, py, g);
        /* Was neben dem Bild übrig bleibt, wird Hof: Rasen mit Baum */
        if (!imKern(haus, tx, ty)) {
          const hof = streu(tx, ty, 159);
          if (hof > 0.35) bodenMalen(ctx, "gras", px, py, g);
          if (hof > 0.75) {
            dekoMalen(ctx, bez === Plan.BEZIRK.STRAND ? "palme" : "baum", px, py, g);
          } else if (hof > 0.68) {
            dekoMalen(ctx, "bank", px, py, g, 0.5, 0.5,
                      Math.round(streu(tx, ty, 161) * 4) * (Math.PI / 2));
          }
        }
        break;
      }
      gebaeudeMalen(ctx, tx, ty, px, py, g);
      break;
    }
  }
}

/* ── Wände und Schatten ─────────────────────────────────── */
function wandMalen(ctx, tx, ty, px, py, g) {
  if (art(tx, ty) !== ART.GEBAEUDE) return;
  if (bildHaus(tx, ty)) return;             // Bild bringt Wand und Schatten mit
  const rechtsFrei = art(tx + 1, ty) !== ART.GEBAEUDE;
  const untenFrei = art(tx, ty + 1) !== ART.GEBAEUDE;
  if (!rechtsFrei && !untenFrei) return;

  const h = Plan.hoeheVon(tx, ty);
  const wand = g * 0.5 * h;
  const schatten = g * 0.34 * h;
  const farbe = dachFarbe(tx, ty);

  ctx.fillStyle = "rgba(6,10,24,.3)";
  if (rechtsFrei) ctx.fillRect(px + g + wand, py + wand * 0.4, schatten, g);
  if (untenFrei) ctx.fillRect(px + wand * 0.4, py + g + wand, g, schatten);

  if (rechtsFrei) {
    ctx.fillStyle = dunkler(farbe, 0.6);
    ctx.fillRect(px + g, py, wand, g);
    ctx.fillStyle = "rgba(255,240,190,.16)";
    for (let k = 0; k < 3; k++) ctx.fillRect(px + g + wand * (0.2 + k * 0.26), py + g * 0.18, wand * 0.13, g * 0.6);
  }
  if (untenFrei) {
    ctx.fillStyle = dunkler(farbe, 0.46);
    ctx.fillRect(px, py + g, g + (rechtsFrei ? wand : 0), wand);
    ctx.fillStyle = "rgba(255,240,190,.13)";
    for (let k = 0; k < 3; k++) ctx.fillRect(px + g * 0.18, py + g + wand * (0.2 + k * 0.26), g * 0.6, wand * 0.13);
  }
}

/* ── Ampeln an den Kreuzungsecken ───────────────────────── */
function ampelnMalen(ctx, kamera, zeit, tx0, ty0, spalten, zeilen, linksM, obenM) {
  for (let j = 0; j < zeilen; j++) {
    for (let k = 0; k < spalten; k++) {
      const tx = tx0 + k, ty = ty0 + j;
      if (art(tx, ty) !== ART.GEHWEG) continue;
      /* Ecke an einer Kreuzung? */
      const nachbarn = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .filter(([dx, dy]) => art(tx + dx, ty + dy) === ART.KREUZUNG);
      if (!nachbarn.length) continue;
      if (streu(tx, ty, 71) > 0.5) continue;         // nicht an jeder Ecke

      const [dx, dy] = nachbarn[0];
      const senkrecht = dy !== 0;
      const phase = ampelPhase(tx, ty, zeit);
      const gruen = senkrecht ? phase === "ns" : phase === "ow";
      const gelb = senkrecht ? phase === "ns-gelb" : phase === "ow-gelb";
      const name = gruen ? "ampel_gruen" : gelb ? "ampel_gelb" : "ampel_rot";
      const b = sprite(name);
      const g = KACHEL * kamera.zoom;
      const px = (inMeter(tx) - linksM) * kamera.zoom;
      const py = (inMeter(ty) - obenM) * kamera.zoom;
      if (!b) {                                       // Ersatz, falls Bild fehlt
        ctx.fillStyle = gruen ? "#3fdc7a" : gelb ? "#ffd24a" : "#ff4a55";
        ctx.fillRect(px + g * 0.38, py + g * 0.38, g * 0.24, g * 0.24);
        continue;
      }
      /* Höhe vorgeben, nicht Breite: die Ampel ist ein hohes, schmales Bild */
      const h = g * 1.5, w = (b.width / b.height) * h;
      ctx.save();
      ctx.translate(px + g / 2, py + g / 2);
      ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2);
      ctx.drawImage(b, -w / 2, -h / 2, w, h);
      /* Leuchten: kleiner Schein in der Ampelfarbe, damit man sie auch
         bei kleiner Darstellung erkennt */
      const licht = gruen ? "rgba(70,240,130," : gelb ? "rgba(255,200,60," : "rgba(255,70,90,";
      const schein = ctx.createRadialGradient(0, -h * 0.26, 0, 0, -h * 0.26, w * 0.6);
      schein.addColorStop(0, licht + "0.7)");
      schein.addColorStop(1, licht + "0)");
      ctx.fillStyle = schein;
      ctx.beginPath();
      ctx.arc(0, -h * 0.26, w * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/* ── Zwischenspeicher für den Untergrund ────────────────────
   Der Boden ist mit Abstand das Teuerste: im Vollbild sind das über
   tausend Kacheln je Bild, dazu Bäume, Laternen, Bänke. Gemessen waren
   das 90 Millisekunden — das Spiel sah dabei aus, als hinge es.

   Deshalb wird der Boden in Stücken von 8 × 8 Kacheln (32 m) einmal auf
   eine eigene Leinwand gemalt und danach nur noch als fertiges Bild
   kopiert. Neu gebaut wird erst, wenn sich der Zoom deutlich ändert;
   dazwischen werden die Stücke passend skaliert.

   Der Preis: Das Glitzern auf dem Wasser steht still. Das fällt kaum
   auf, 60 Bilder je Sekunde dagegen schon. */
const STUECK = 8;
const lager = new Map();
let bauBudget = 0;                  // wie viele Stücke dieses Bild neu dürfen

function stueckHolen(cx, cy, zeit, zoom) {
  const schluessel = cx + "," + cy;
  const da = lager.get(schluessel);
  /* Passt der Zoom halbwegs, wird das alte Stück einfach skaliert.
     Neu gebaut wird nur ein paar Stück je Bild — sonst ruckelt es beim
     Beschleunigen, wenn die Kamera herauszoomt. */
  if (da && (Math.abs(da.zoom / zoom - 1) <= 0.18 || bauBudget <= 0)) return da;
  if (da) bauBudget--;

  const g = KACHEL * zoom;
  const seite = Math.ceil(STUECK * g) + 2;
  const leinwand = document.createElement("canvas");
  leinwand.width = seite;
  leinwand.height = seite;
  const c = leinwand.getContext("2d");
  flaecheMalen(c, cx * STUECK, cy * STUECK, STUECK, STUECK,
               inMeter(cx * STUECK), inMeter(cy * STUECK), zoom, zeit);
  const stueck = { leinwand, kante: STUECK * g, zoom };
  lager.delete(schluessel);
  lager.set(schluessel, stueck);
  /* Höchstens rund 60 MB im Speicher halten, ältestes Stück fliegt raus */
  const grenze = Math.max(12, Math.min(200, Math.round(15e6 / (seite * seite))));
  while (lager.size > grenze) {
    const erster = lager.keys().next().value;
    lager.delete(erster);
  }
  return stueck;
}

/* Wird die Stadt verändert oder der Zoom sehr anders, muss alles neu */
export function lagerLeeren() {
  lager.clear();
}

/* Boden, Gebäudebilder und Wände eines Ausschnitts — alles, was sich
   nicht bewegt. Genau das landet im Lager. */
function flaecheMalen(ctx, tx0, ty0, spalten, zeilen, linksM, obenM, zoom, zeit) {
  const g = KACHEL * zoom;
  for (let j = 0; j < zeilen; j++) {
    for (let k = 0; k < spalten; k++) {
      const tx = tx0 + k, ty = ty0 + j;
      kachelMalen(ctx, tx, ty, (inMeter(tx) - linksM) * zoom,
                  (inMeter(ty) - obenM) * zoom, g, zeit);
    }
  }
  /* Gebäudebilder: jedes Haus einmal, egal wie viele Kacheln es hat.
     Ragt eines über den Rand, malt das Nachbarstück den Rest. */
  const gemalt = new Set();
  for (let j = 0; j < zeilen; j++) {
    for (let k = 0; k < spalten; k++) {
      const tx = tx0 + k, ty = ty0 + j;
      if (art(tx, ty) !== ART.GEBAEUDE) continue;
      const nr = hausNr(tx, ty);
      if (!nr || gemalt.has(nr)) continue;
      gemalt.add(nr);
      hausMalen(ctx, Plan.haeuser[nr], linksM, obenM, zoom);
    }
  }
  for (let j = 0; j < zeilen; j++) {
    for (let k = 0; k < spalten; k++) {
      const tx = tx0 + k, ty = ty0 + j;
      wandMalen(ctx, tx, ty, (inMeter(tx) - linksM) * zoom,
                (inMeter(ty) - obenM) * zoom, g);
    }
  }
}

export function zeichnen(ctx, kamera, zeit) {
  const g = KACHEL * kamera.zoom;
  const linksM = kamera.x - kamera.breite / 2 / kamera.zoom;
  const obenM = kamera.y - kamera.hoehe / 2 / kamera.zoom;
  const tx0 = Math.floor(linksM / KACHEL) - 1;
  const ty0 = Math.floor(obenM / KACHEL) - 1;
  const spalten = Math.ceil(kamera.breite / g) + 3;
  const zeilen = Math.ceil(kamera.hoehe / g) + 3;

  bauBudget = 2;
  const cx0 = Math.floor(tx0 / STUECK), cy0 = Math.floor(ty0 / STUECK);
  const cx1 = Math.floor((tx0 + spalten) / STUECK);
  const cy1 = Math.floor((ty0 + zeilen) / STUECK);
  const kante = STUECK * KACHEL * kamera.zoom;
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const stueck = stueckHolen(cx, cy, zeit, kamera.zoom);
      const px = (inMeter(cx * STUECK) - linksM) * kamera.zoom;
      const py = (inMeter(cy * STUECK) - obenM) * kamera.zoom;
      ctx.drawImage(stueck.leinwand, 0, 0, stueck.kante, stueck.kante,
                    px, py, kante + 1, kante + 1);
    }
  }
  if (kamera.zoom > 14) ampelnMalen(ctx, kamera, zeit, tx0, ty0, spalten, zeilen, linksM, obenM);
}

/* ── Freien Platz suchen ────────────────────────────────── */
export function freierPunkt(nahX, nahY, arten, radius = 40) {
  for (let versuch = 0; versuch < 500; versuch++) {
    const w = streu(versuch, 1, 31) * Math.PI * 2;
    const r = streu(versuch, 2, 37) * radius;
    const x = nahX + Math.cos(w) * r, y = nahY + Math.sin(w) * r;
    if (arten.includes(art(inKachel(x), inKachel(y)))) return { x, y };
  }
  /* Nichts gefunden: von innen nach außen absuchen. Ohne das landet ein
     Missionsziel im Zweifel in einer Hauswand und ist nie erreichbar. */
  const t0x = inKachel(nahX), t0y = inKachel(nahY);
  let ersatz = null;
  for (let r = 1; r < 70; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const tx = t0x + dx, ty = t0y + dy;
        const a = art(tx, ty);
        const punkt = { x: inMeter(tx) + KACHEL / 2, y: inMeter(ty) + KACHEL / 2 };
        if (arten.includes(a)) return punkt;
        if (!ersatz && !fest(tx, ty) && a !== ART.WASSER) ersatz = punkt;
      }
    }
  }
  return ersatz || { x: nahX, y: nahY };
}
