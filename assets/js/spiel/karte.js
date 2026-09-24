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
import { HAUSMASS } from "./hausmass.js";

export const KACHEL = Plan.KACHEL;
export const BREITE = Plan.BREITE;
export const HOEHE = Plan.HOEHE;
export const S = Plan.S;                     // Maßstab der Stadt
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

/* Bodenkachel in Vierteldrehungen — für Pfeile, Haltelinien, Zebra */
function bodenGedreht(ctx, name, px, py, g, dreh) {
  const b = sprite("boden_" + name);
  if (!b) return false;
  if (!dreh) { ctx.drawImage(b, px, py, g + 1, g + 1); return true; }
  ctx.save();
  ctx.translate(px + g / 2, py + g / 2);
  ctx.rotate(dreh);
  ctx.drawImage(b, -g / 2 - 0.5, -g / 2 - 0.5, g + 1, g + 1);
  ctx.restore();
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

/* ── Wasser ────────────────────────────────────────────────
   Vorher: eine Textur je Kachel mit waagerechten Streifen, die an jeder
   Kachelkante abrissen — das Meer sah aus wie ein Duschvorhang. Jetzt
   ein nahtloses Muster, 16 × 16 m groß, das an der Welt festhängt statt
   an der Kachel. Dadurch gibt es keine Kanten mehr. Gerechnet wird es
   einmal; die Wellen laufen mit ganzzahligen Frequenzen über die
   Periode, deshalb passt der Rand genau an den Anfang. */
const WASSER_PX = 16;                 // Bildpunkte je Meter im Muster
let wasserBild = null;
const wasserMuster = new WeakMap();

function wasserBildBauen() {
  const n = 16 * WASSER_PX;
  const l = document.createElement("canvas");
  l.width = l.height = n;
  const c = l.getContext("2d");
  const bild = c.createImageData(n, n);
  const d = bild.data, T = Math.PI * 2 / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      /* Dünung: drei Wellenzüge in verschiedene Richtungen */
      const v = Math.sin(T * (2 * x + y)) * 0.5 +
                Math.sin(T * (3 * x - 2 * y) + 1.3) * 0.3 +
                Math.sin(T * (5 * x + 4 * y) + 0.7) * 0.2;
      /* Glanzlinien: schmale helle Kämme, leicht gewellt */
      const k = Math.sin(T * (7 * x + 3 * y) + Math.sin(T * 2 * y) * 2.2);
      const glanz = k > 0.965 ? ((k - 0.965) / 0.035) * 0.55 : 0;
      const t = v * 0.5 + 0.5;
      const q = (y * n + x) * 4;
      d[q] = 14 + t * 18 + glanz * 90;
      d[q + 1] = 58 + t * 34 + glanz * 110;
      d[q + 2] = 102 + t * 44 + glanz * 100;
      d[q + 3] = 255;
    }
  }
  c.putImageData(bild, 0, 0);
  return l;
}

function wasserFlaeche(ctx, tx, ty, px, py, g) {
  if (!wasserBild) wasserBild = wasserBildBauen();
  let muster = wasserMuster.get(ctx);
  if (!muster) { muster = ctx.createPattern(wasserBild, "repeat"); wasserMuster.set(ctx, muster); }
  /* Muster an die Welt hängen: Weltursprung liegt bei px − tx·g */
  const k = (g / KACHEL) / WASSER_PX;
  muster.setTransform(new DOMMatrix([k, 0, 0, k, px - tx * g, py - ty * g]));
  ctx.fillStyle = muster;
  ctx.fillRect(px, py, g + 1, g + 1);
}

/* Wasser am Ufer: Schatten unter der Kaimauer oder Brücke, eine helle
   Schaumlinie; am Strand stattdessen flaches, helleres Wasser. */
function wasserUfer(ctx, tx, ty, px, py, g) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nb = art(tx + dx, ty + dy);
    if (nb === ART.WASSER) continue;
    const strand = nb === ART.STRAND;
    const bruecke = nb === ART.BRUECKE || Plan.istSteg(tx + dx, ty + dy);
    const breit = g * (strand ? 0.5 : bruecke ? 0.42 : 0.22);
    /* Verlauf von der Uferkante ins Wasser hinein */
    const kx = dx > 0 ? px + g : px, ky = dy > 0 ? py + g : py;
    const verlauf = dx
      ? ctx.createLinearGradient(kx, 0, kx - dx * breit, 0)
      : ctx.createLinearGradient(0, ky, 0, ky - dy * breit);
    if (strand) {
      verlauf.addColorStop(0, "rgba(120,215,210,.55)");
      verlauf.addColorStop(1, "rgba(120,215,210,0)");
    } else {
      verlauf.addColorStop(0, bruecke ? "rgba(2,10,24,.6)" : "rgba(2,10,24,.45)");
      verlauf.addColorStop(1, "rgba(2,10,24,0)");
    }
    ctx.fillStyle = verlauf;
    if (dx > 0) ctx.fillRect(px + g - breit, py, breit, g + 1);
    if (dx < 0) ctx.fillRect(px, py, breit, g + 1);
    if (dy > 0) ctx.fillRect(px, py + g - breit, g + 1, breit);
    if (dy < 0) ctx.fillRect(px, py, g + 1, breit);
    /* Schaumlinie */
    ctx.fillStyle = strand ? "rgba(240,250,255,.5)" : "rgba(210,232,250,.28)";
    const f = g * 0.03, ab = g * (strand ? 0.06 : 0.04);
    if (dx > 0) ctx.fillRect(px + g - ab - f, py, f, g + 1);
    if (dx < 0) ctx.fillRect(px + ab, py, f, g + 1);
    if (dy > 0) ctx.fillRect(px, py + g - ab - f, g + 1, f);
    if (dy < 0) ctx.fillRect(px, py + ab, g + 1, f);
  }
}

/* Kaimauer an Land: Betonkante zum Wasser, dahinter ein Geländer
   (am Hafen Poller statt Geländer). Vorher stieß der Asphalt ohne
   jede Kante ans Wasser. */
function uferKante(ctx, tx, ty, px, py, g, a) {
  if (a === ART.WASSER || a === ART.STRAND || a === ART.GEBAEUDE || a === ART.BRUECKE) return;
  if (Plan.istSteg(tx, ty)) return;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (art(tx + dx, ty + dy) !== ART.WASSER) continue;
    const kante = g * 0.12, gel = g * 0.2;
    /* Rechteck entlang der Wasserseite, von Tiefe t0 bis t1 nach innen */
    const streifen = (t0, t1) => dx > 0 ? [px + g - t1, py, t1 - t0, g + 1]
                              : dx < 0 ? [px + t0, py, t1 - t0, g + 1]
                              : dy > 0 ? [px, py + g - t1, g + 1, t1 - t0]
                              : [px, py + t0, g + 1, t1 - t0];
    ctx.fillStyle = "#b9b5aa";                             // Mauerkrone
    ctx.fillRect(...streifen(0, kante));
    ctx.fillStyle = "rgba(40,36,30,.55)";                  // Außenkante
    ctx.fillRect(...streifen(0, g * 0.025));
    if (a === ART.HAFEN) {                                 // Poller statt Geländer
      ctx.fillStyle = "#2c2f36";
      for (let k = 0.25; k < 1; k += 0.5) {
        const bx = dx ? (dx > 0 ? px + g - kante * 1.6 : px + kante * 1.6) : px + g * k;
        const by = dx ? py + g * k : (dy > 0 ? py + g - kante * 1.6 : py + kante * 1.6);
        ctx.beginPath();
        ctx.arc(bx, by, g * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      continue;
    }
    /* Geländer: Handlauf und Pfosten alle gut ein Meter */
    ctx.fillStyle = "#2b2f38";
    ctx.fillRect(...streifen(kante + gel * 0.3, kante + gel * 0.3 + g * 0.03));
    for (let k = 0.12; k < 1; k += 0.25) {
      const p = g * k;
      if (dx) {
        const x = dx > 0 ? px + g - kante - gel * 0.45 : px + kante + gel * 0.15;
        ctx.fillRect(x, py + p, g * 0.06, g * 0.06);
      } else {
        const y = dy > 0 ? py + g - kante - gel * 0.45 : py + kante + gel * 0.15;
        ctx.fillRect(px + p, y, g * 0.06, g * 0.06);
      }
    }
  }
}

/* Gehweg auf der Brücke: Betonplatten, zur Wasserseite ein Stahlträger
   mit Kreuzverstrebung, zur Fahrbahn ein Bordstein. */
function stegMalen(ctx, tx, ty, px, py, g) {
  ctx.fillStyle = "#8d8a84";
  ctx.fillRect(px, py, g + 1, g + 1);
  bodenMalen(ctx, "gehweg", px, py, g);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nb = art(tx + dx, ty + dy);
    if (nb === ART.WASSER) {
      const t = g * 0.28;                                  // Trägerbreite
      const bx = dx > 0 ? px + g - t : px, by = dy > 0 ? py + g - t : py;
      const bw = dx ? t : g + 1, bh = dx ? g + 1 : t;
      ctx.fillStyle = "#3b4049";                           // Stahlträger
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = "#6c4a3c";                         // rostrote Streben
      ctx.lineWidth = Math.max(1, g * 0.035);
      ctx.beginPath();
      for (let k = 0; k < 2; k++) {
        if (dx) {
          const y0 = by + (bh / 2) * k, y1 = y0 + bh / 2;
          ctx.moveTo(bx, y0); ctx.lineTo(bx + bw, y1);
          ctx.moveTo(bx + bw, y0); ctx.lineTo(bx, y1);
        } else {
          const x0 = bx + (bw / 2) * k, x1 = x0 + bw / 2;
          ctx.moveTo(x0, by); ctx.lineTo(x1, by + bh);
          ctx.moveTo(x0, by + bh); ctx.lineTo(x1, by);
        }
      }
      ctx.stroke();
      ctx.fillStyle = "#1f232a";                           // Obergurt zum Gehweg
      if (dx) ctx.fillRect(dx > 0 ? bx : bx + bw - g * 0.05, by, g * 0.05, bh);
      else ctx.fillRect(bx, dy > 0 ? by : by + bh - g * 0.05, bw, g * 0.05);
    } else if (nb === ART.BRUECKE) {
      ctx.fillStyle = "rgba(226,206,120,.4)";              // Bordstein zur Fahrbahn
      const b = g * 0.08;
      if (dx > 0) ctx.fillRect(px + g - b, py, b, g + 1);
      if (dx < 0) ctx.fillRect(px, py, b, g + 1);
      if (dy > 0) ctx.fillRect(px, py + g - b, g + 1, b);
      if (dy < 0) ctx.fillRect(px, py, g + 1, b);
    }
  }
  /* Laternen in regelmäßigem Abstand */
  if ((tx + ty) % 3 === 0) dekoMalen(ctx, "laterne", px, py, g);
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
/* Zweite Runde (23.09.2026): Jede besondere Bauart hat jetzt mehrere
   Modelle — vorher sah jede Tankstelle und jeder Club gleich aus, und
   Tankstellen hatten gar kein Bild. Welches Modell ein Haus bekommt,
   entscheidet weiter hausWaehlen() nach Größe und Seitenverhältnis. */
const WOHNEN2 = ["haus_pastell", "haus_flachpool", "haus_stadt", "haus_innenhof",
                 "haus_laubengang", "haus_stelzen", "haus_schmetterling", "haus_anlage",
                 "haus_anwesen", "haus_motelzeile", "haus_garage", "haus_veranda"];
const CLUBS = ["bau_club", "club_neon", "club_lila", "club_terrasse", "club_deco",
               "club_strand", "club_wuerfel", "club_halle", "club_herz", "club_pool",
               "club_kneipe", "club_kabarett", "club_heli"];
const TANKEN = ["tanke_klein", "tanke_gross", "tanke_alt", "tanke_wasch", "tanke_rot",
                "tanke_ecke", "tanke_solar", "tanke_werkstatt", "tanke_schild", "tanke_neon",
                "tanke_markt", "tanke_verlassen"];
const SPORT = ["sport_fussball", "sport_stadion", "sport_baseball", "sport_arena",
               "sport_tennis", "sport_skate", "sport_amphi", "sport_bahn", "sport_bad",
               "sport_boxen", "sport_kart", "sport_golf"];

const HAUSBILD = {
  [Plan.BAU.WOHNHAUS]: ["haus_klein", "haus_bungalow", "haus_stuck", "haus_strand",
                        "haus_reihe", "haus_hof", "haus_modern", "haus_villa",
                        "haus_block2", "haus_alt", ...WOHNEN2],
  [Plan.BAU.HOCHHAUS]: ["turm_buero", "turm_glas", "turm_deco", "turm_antennen",
                        "turm_bau", "turm_pool", "turm_helipad", "haus_block_lang"],
  [Plan.BAU.HOTEL]: ["turm_pool", "turm_bar", "haus_motel", "turm_helipad", "haus_motelzeile"],
  [Plan.BAU.LAGER]: ["bau_lager", "turm_tank"],
  [Plan.BAU.LADEN]: ["bau_laden", "bau_diner", "haus_block2"],
  [Plan.BAU.CLUB]: CLUBS,
  [Plan.BAU.BANK]: ["bau_bank", "turm_bank"],
  [Plan.BAU.POLIZEI]: ["bau_polizei", "dienst_polizei1", "dienst_polizei2", "dienst_polizei3"],
  [Plan.BAU.FEUERWEHR]: ["bau_feuerwehr", "dienst_feuer1", "dienst_feuer2", "dienst_feuer3"],
  [Plan.BAU.KRANKENHAUS]: ["bau_klinik", "dienst_klinik1", "dienst_klinik2", "dienst_klinik3"],
  [Plan.BAU.KIRCHE]: ["bau_kirche"],
  [Plan.BAU.SCHULE]: ["bau_schule"],
  [Plan.BAU.STADION]: SPORT,
  [Plan.BAU.TANKSTELLE]: TANKEN,
  [Plan.BAU.KAUFHAUS]: ["turm_mall", "bau_markt", "turm_parkhaus"],
  [Plan.BAU.WERK]: ["bau_lager", "turm_tank"],
  [Plan.BAU.WAFFEN]: ["bau_waffen", "dienst_waffen1", "dienst_waffen2", "dienst_waffen3"]
};

/* Alle Gebäudebilder — spiel.js lädt sie vor */
export const GEBAEUDEBILDER = [...new Set(Object.values(HAUSBILD).flat())];

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
    /* Gedachte Größe aus der Tabelle — die großen Bilder sind
       verkleinert und verraten ihre Größe nicht mehr selbst */
    const lang = HAUSMASS[liste[k]] || Math.max(b.width, b.height) / HAUS_PX;
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
  const kachel = streu(tx, ty, 131) > 0.78 && a !== ART.BRUECKE ? "asphalt_riss" : "asphalt";
  if (!kachel || !bodenMalen(ctx, kachel, px, py, g)) {
    Tex.malen(ctx, "asphalt", streu(tx, ty, 101), px, py, g);
  }
  if (a === ART.STRASSE && strassenMarke(ctx, tx, ty, px, py, g)) return;

  if (a === ART.KREUZUNG) {
    /* Fußgängerüberweg: breite Balken über die ganze Kachel, dort wo die
       Kreuzung an die Fahrbahn stößt. Vorher waren das kleine Punkte in
       den Ecken — auf dem Asphalt sah das aus wie Dreck. */
    const randOben = art(tx, ty - 1) !== ART.KREUZUNG && befahrbar(art(tx, ty - 1));
    const randUnten = art(tx, ty + 1) !== ART.KREUZUNG && befahrbar(art(tx, ty + 1));
    const randLinks = art(tx - 1, ty) !== ART.KREUZUNG && befahrbar(art(tx - 1, ty));
    const randRechts = art(tx + 1, ty) !== ART.KREUZUNG && befahrbar(art(tx + 1, ty));
    /* Gelbes Sperrfeld mitten in manchen großen Kreuzungen */
    if (!randOben && !randUnten && !randLinks && !randRechts) {
      if (streu(tx, ty, 173) > 0.92) bodenMalen(ctx, "mark_sperr", px, py, g);
      return;
    }
    /* Überweg als echtes Bild: Balken laufen längs zur Straße */
    if (bodenGedreht(ctx, "mark_zebra", px, py, g,
                     randOben || randUnten ? 0 : Math.PI / 2)) return;
    ctx.fillStyle = "rgba(240,238,230,.72)";
    const balken = 5, dick = g * 0.12, lang = g * 0.5;
    for (let k = 0; k < balken; k++) {
      const t = ((k + 0.5) / balken) * g - dick / 2;
      if (randOben) ctx.fillRect(px + t, py + g * 0.06, dick, lang);
      if (randUnten) ctx.fillRect(px + t, py + g - g * 0.06 - lang, dick, lang);
      if (randLinks) ctx.fillRect(px + g * 0.06, py + t, lang, dick);
      if (randRechts) ctx.fillRect(px + g - g * 0.06 - lang, py + t, lang, dick);
    }
    return;
  }

  if (a === ART.BRUECKE) {
    /* Direkt am Wasser (Brücken ohne Gehweg, etwa die Autobahn): ein
       Stahlträger als Rand. Liegt daneben ein Steg, malt der den Rand. */
    ctx.fillStyle = "#3b4049";
    const t = g * 0.16;
    if (art(tx - 1, ty) === ART.WASSER) ctx.fillRect(px, py, t, g + 1);
    if (art(tx + 1, ty) === ART.WASSER) ctx.fillRect(px + g - t, py, t, g + 1);
    if (art(tx, ty - 1) === ART.WASSER) ctx.fillRect(px, py, g + 1, t);
    if (art(tx, ty + 1) === ART.WASSER) ctx.fillRect(px, py + g - t, g + 1, t);
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
    /* Mittelinsel aus Beton mit Bordstein. Vorher lag da ein grünes
       Rechteck mitten auf dem Asphalt — das sah aus wie ein Fehler.
       Bei gerader Spurzahl liegt die Mitte auf der Kachelgrenze: Dann
       malt jede der beiden mittleren Kacheln ihre Hälfte der Insel an
       die gemeinsame Kante. Vorher lagen zwei Inseln nebeneinander. */
    const dickeM = g * 0.34;
    const lage = stelle < mitte - 0.25 ? "hinten" : stelle > mitte + 0.25 ? "vorn" : "mitte";
    /* Anfang und Breite der Insel quer zur Fahrtrichtung, in Kachelpunkten */
    const von = lage === "mitte" ? (g - dickeM) / 2 : lage === "hinten" ? g - dickeM / 2 : 0;
    const breit = lage === "mitte" ? dickeM : dickeM / 2;
    const bord = g * 0.05;
    ctx.fillStyle = "rgba(150,150,146,.95)";
    if (senkrecht) ctx.fillRect(px + von, py, breit, g + 1);
    else ctx.fillRect(px, py + von, g + 1, breit);
    ctx.fillStyle = "rgba(226,206,120,.5)";
    const kanten = lage === "mitte" ? [von, von + breit - bord]
                 : lage === "hinten" ? [von] : [breit - bord];
    for (const k of kanten) {
      if (senkrecht) ctx.fillRect(px + k, py, bord, g + 1);
      else ctx.fillRect(px, py + k, g + 1, bord);
    }
  } else if (band.breite <= 3 && Math.abs(stelle - mitte) < 0.55) {
    ctx.fillStyle = "rgba(235,225,180,.8)";                  // Mittelstreifen
    if (senkrecht) ctx.fillRect(px + g * 0.46, py + g * 0.15, g * 0.08, g * 0.7);
    else ctx.fillRect(px + g * 0.15, py + g * 0.46, g * 0.7, g * 0.08);
  }
}

/* ── Bodenmarken auf der Fahrbahn ──
   Auf der Spur, die in eine Kreuzung hineinführt: Haltelinie oder
   Richtungspfeil. Sonst ab und zu ein Gullydeckel, ein Flicken, ein
   Ölfleck oder ein Radweg-Symbol. Gibt true zurück, wenn gemalt wurde —
   dann fallen Mittel- und Spurlinien auf dieser Kachel weg. */
function strassenMarke(ctx, tx, ty, px, py, g) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (art(tx + dx, ty + dy) !== ART.KREUZUNG) continue;
    /* Nur die Spur, die auf die Kreuzung zufährt (Rechtsverkehr) */
    const senkrecht = dy !== 0;
    const band = bandGrenzen(tx, ty, senkrecht);
    const eigen = senkrecht ? tx : ty;
    const mitte = (band.von + band.bis) / 2;
    const zufahrt = senkrecht ? (dy < 0 ? eigen > mitte : eigen < mitte)
                              : (dx > 0 ? eigen > mitte : eigen < mitte);
    if (!zufahrt || band.breite < 2) return false;
    const r = streu(tx, ty, 177);
    const quer = senkrecht ? 0 : Math.PI / 2;               // Haltelinie quer
    const pfeil = Math.atan2(dy, dx) + Math.PI / 2;         // Pfeil zur Kreuzung
    if (r < 0.55) return bodenGedreht(ctx, "mark_halt", px, py, g, quer);
    if (r < 0.75) return bodenGedreht(ctx, "mark_gerade", px, py, g, pfeil);
    if (r < 0.88) return bodenGedreht(ctx, "mark_rechts", px, py, g, pfeil);
    return bodenGedreht(ctx, "mark_links", px, py, g, pfeil);
  }
  /* Mitten auf einer Insel liegen keine Gullys — sonst reißt sie ab */
  const senk = befahrbar(art(tx, ty - 1)) && befahrbar(art(tx, ty + 1));
  const bnd = bandGrenzen(tx, ty, senk);
  const st = (senk ? tx : ty) - bnd.von, mi = (bnd.breite - 1) / 2;
  if (bnd.breite >= 4 && Math.abs(st - mi) < 0.6) return false;
  const z = streu(tx, ty, 179);
  const dreh = Math.floor(streu(tx, ty, 181) * 4) * (Math.PI / 2);
  if (z < 0.025) return bodenGedreht(ctx, "mark_gully", px, py, g, dreh);
  if (z < 0.04) return bodenGedreht(ctx, "mark_flicken", px, py, g, dreh);
  if (z < 0.052) return bodenGedreht(ctx, "mark_oel", px, py, g, dreh);
  /* Rinne und Radweg nur am Fahrbahnrand */
  const amRand = !befahrbar(art(tx - 1, ty)) || !befahrbar(art(tx + 1, ty)) ||
                 !befahrbar(art(tx, ty - 1)) || !befahrbar(art(tx, ty + 1));
  if (!amRand) return false;
  /* Die Rinne (Gully am Bordstein) ist raus: als einzelne Kachel sah sie
     aus wie ein grauer Balken mitten auf der Fahrbahn. */
  if (z < 0.085) return bodenGedreht(ctx, "mark_rad", px, py, g,
    befahrbar(art(tx, ty - 1)) && befahrbar(art(tx, ty + 1)) ? 0 : Math.PI / 2);
  return false;
}

/* ── Gehweg mit Bäumen, Laternen, Hydranten ─────────────── */
function gehwegMalen(ctx, tx, ty, px, py, g, bez) {
  ctx.fillStyle = FARBE.gehweg;
  ctx.fillRect(px, py, g + 1, g + 1);
  /* Der Belag wechselt blockweise, nicht von Kachel zu Kachel — sonst
     sieht der Gehweg aus, als wäre er zusammengewürfelt. */
  const belag = bez === Plan.BEZIRK.INNENSTADT &&
                streu(Math.floor(tx / 7), Math.floor(ty / 7), 147) > 0.55 ? "platz" : "gehweg";
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

  /* An Kreuzungsecken ohne Ampel steht ein Stoppschild oder ein
     Straßenschild (die Ampeln selbst malt ampelnMalen, sie leuchten) */
  const ecke = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) =>
    art(tx + dx, ty + dy) === ART.KREUZUNG);
  if (ecke && streu(tx, ty, 71) > 0.5) {
    const [dx, dy] = ecke;
    if (streu(tx, ty, 183) < 0.55) {
      dekoMalen(ctx, "stopp", px, py, g, 0.5 + dx * 0.3, 0.5 + dy * 0.3);
    } else {
      dekoMalen(ctx, "strassenschild", px, py, g, 0.5 + dx * 0.3, 0.5 + dy * 0.3);
    }
    return;
  }

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
  } else if (l < 0.055) {
    dekoMalen(ctx, "stromkasten", px, py, g);
  } else if (l < 0.07 && bez === Plan.BEZIRK.INNENSTADT) {
    dekoMalen(ctx, "kuebel", px, py, g);
  } else if (l < 0.08 && bez === Plan.BEZIRK.INNENSTADT) {
    dekoMalen(ctx, "radstaender", px, py, g, 0.5, 0.5,
              Math.round(dreh / (Math.PI / 2)) * (Math.PI / 2));
  } else if (l < 0.09) {
    dekoMalen(ctx, "parkuhr", px, py, g);
  } else if (l < 0.095 && bez !== Plan.BEZIRK.WOHNEN) {
    dekoMalen(ctx, "plakatwand", px, py, g, 0.5, 0.5,
              Math.round(dreh / (Math.PI / 2)) * (Math.PI / 2));
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
      wasserFlaeche(ctx, tx, ty, px, py, g);
      wasserUfer(ctx, tx, ty, px, py, g);
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
      if (Plan.istSteg(tx, ty)) stegMalen(ctx, tx, ty, px, py, g);
      else gehwegMalen(ctx, tx, ty, px, py, g, bez);
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
    case ART.PARKPLATZ: {
      ctx.fillStyle = FARBE.parkplatz;
      ctx.fillRect(px, py, g + 1, g + 1);
      /* Parkbuchten und Fahrgassen — dieselbe Einteilung wie beim
         Abstellen der Wagen in fahrzeug.js: Reihen quer zur langen
         Seite, jede dritte Reihe bleibt Gasse. So stehen die Autos auch
         wirklich in den gemalten Buchten. */
      const zaehlen = (dx, dy) => {
        let n = 0;
        while (n < 10 && art(tx + dx * (n + 1), ty + dy * (n + 1)) === ART.PARKPLATZ) n++;
        return n;
      };
      const reihenQuer = zaehlen(1, 0) + zaehlen(-1, 0) >= zaehlen(0, 1) + zaehlen(0, -1);
      const gasse = reihenQuer ? ty % 3 === 1 : tx % 3 === 1;
      const gemalt = !gasse &&
        bodenGedreht(ctx, "mark_bucht", px, py, g, reihenQuer ? 0 : Math.PI / 2);
      if (!gemalt && !bodenMalen(ctx, "parkplatz", px, py, g)) {
        Tex.malen(ctx, "beton", streu(tx, ty, 121), px, py, g);
      }
      break;
    }
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
  uferKante(ctx, tx, ty, px, py, g, a);
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
      /* Neue Ampeln aus dem Bogen (23.09.2026), von oben gesehen: Mast
         rechts, Lampenkopf ragt nach links. Gedreht wird so, dass der
         Kopf über die Fahrbahn zeigt. Die alten Blender-Ampeln bleiben
         als Ersatz, falls ein Bild fehlt. */
      const farbe = gruen ? "ampel_gruen" : gelb ? "ampel_gelb" : "ampel_rot";
      const b = sprite("deko_" + farbe) || sprite(farbe);
      const g = KACHEL * kamera.zoom;
      const px = (inMeter(tx) - linksM) * kamera.zoom;
      const py = (inMeter(ty) - obenM) * kamera.zoom;
      if (!b) {                                       // Ersatz, falls Bild fehlt
        ctx.fillStyle = gruen ? "#3fdc7a" : gelb ? "#ffd24a" : "#ff4a55";
        ctx.fillRect(px + g * 0.38, py + g * 0.38, g * 0.24, g * 0.24);
        continue;
      }
      const skala = (g / (KACHEL * 64)) * 1.25;       // echte Größe, etwas betont
      const w = b.width * skala, h = b.height * skala;
      ctx.save();
      ctx.translate(px + g / 2 + dx * g * 0.28, py + g / 2 + dy * g * 0.28);
      ctx.rotate(Math.atan2(-dy, -dx));
      ctx.drawImage(b, -w / 2, -h / 2, w, h);
      /* Leuchten: kleiner Schein in der Ampelfarbe über dem Lampenkopf */
      const licht = gruen ? "rgba(70,240,130," : gelb ? "rgba(255,200,60," : "rgba(255,70,90,";
      const kopfX = gruen ? -w * 0.06 : gelb ? -w * 0.2 : -w * 0.34, kopfY = -h * 0.22;
      const schein = ctx.createRadialGradient(kopfX, kopfY, 0, kopfX, kopfY, h * 0.35);
      schein.addColorStop(0, licht + "0.55)");
      schein.addColorStop(1, licht + "0)");
      ctx.fillStyle = schein;
      ctx.beginPath();
      ctx.arc(kopfX, kopfY, h * 0.35, 0, Math.PI * 2);
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
