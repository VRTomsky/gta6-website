/* ═══════════════════════════════════════════════════════════
   Stadtplan — die Karte wird einmal beim Start gebaut

   Vorher lag die Stadt als Formel vor (alle 14 Kacheln eine Straße). Das
   sah aus wie Manhattan. Jetzt entsteht ein richtiger Plan in Feldern:

     1. Land und Wasser  — Meer im Osten, Kanal quer durch die Stadt,
                           Hafenbecken im Südwesten, Strandinsel
     2. Autobahn         — Ring um die Innenstadt, ohne Ampeln
     3. Hauptstraßen     — breite Achsen, zwei Diagonalen, Kreisverkehre
     4. Nebenstraßen     — unregelmäßige Abstände, leicht versetzt
     5. Brücken          — wo eine Straße Wasser kreuzt
     6. Gehwege          — alles, was an einer Straße liegt
     7. Blöcke füllen    — Häuser, Parks, Parkplätze, Wahrzeichen

   Alles landet in flachen Feldern (je 40.000 Einträge, rund 120 KB).
   Abfragen sind dadurch ein Feldzugriff statt einer Rechnerei.
   ═══════════════════════════════════════════════════════════ */

export const KACHEL = 4;                    // Meter je Kachel
export const BREITE = 240;
export const HOEHE = 220;

export const ART = {
  WASSER: 0, STRAND: 1, STRASSE: 2, KREUZUNG: 3, GEHWEG: 4,
  PARK: 5, PARKPLATZ: 6, GEBAEUDE: 7, HAFEN: 8, AUTOBAHN: 9, BRUECKE: 10
};

/* Gebäudearten — bestimmen Farbe, Dachaufbauten und Namen auf der Karte */
export const BAU = {
  WOHNHAUS: 0, HOCHHAUS: 1, HOTEL: 2, LAGER: 3, LADEN: 4,
  BANK: 5, POLIZEI: 6, FEUERWEHR: 7, KRANKENHAUS: 8, STADION: 9,
  KIRCHE: 10, SCHULE: 11, TANKSTELLE: 12, KAUFHAUS: 13, WERK: 14,
  WAFFEN: 15
};

export const BEZIRK = {
  INNENSTADT: 0, STRAND: 1, HAFEN: 2, WOHNEN: 3, INDUSTRIE: 4, PARKLAND: 5
};

const N = BREITE * HOEHE;
export const felder = {
  art: new Uint8Array(N),
  bau: new Uint8Array(N),
  haus: new Uint16Array(N),          // Hausnummer: gleiche Nummer = ein Haus
  bezirk: new Uint8Array(N),
  hoehe: new Uint8Array(N)           // 0…255 → Höhe für Wand und Schatten
};

const i = (tx, ty) => ty * BREITE + tx;
const drin = (tx, ty) => tx >= 0 && ty >= 0 && tx < BREITE && ty < HOEHE;

/* ── Zufall mit festem Startwert: die Stadt sieht immer gleich aus ── */
let samen = 20260920;
function zufall() {
  samen = (Math.imul(samen ^ (samen >>> 15), 2246822507) + 1013904223) >>> 0;
  return samen / 4294967296;
}
const zwischen = (a, b) => a + zufall() * (b - a);
const ganz = (a, b) => Math.floor(zwischen(a, b + 1));

/* ── Hilfen zum Malen in die Felder ── */
function setzen(tx, ty, art) {
  if (!drin(tx, ty)) return;
  felder.art[i(tx, ty)] = art;
}

function rechteck(x0, y0, x1, y1, art) {
  for (let ty = Math.max(0, y0); ty <= Math.min(HOEHE - 1, y1); ty++) {
    for (let tx = Math.max(0, x0); tx <= Math.min(BREITE - 1, x1); tx++) {
      felder.art[i(tx, ty)] = art;
    }
  }
}

function kreis(mx, my, r, art) {
  for (let ty = Math.max(0, Math.floor(my - r)); ty <= Math.min(HOEHE - 1, Math.ceil(my + r)); ty++) {
    for (let tx = Math.max(0, Math.floor(mx - r)); tx <= Math.min(BREITE - 1, Math.ceil(mx + r)); tx++) {
      if (Math.hypot(tx - mx, ty - my) <= r) felder.art[i(tx, ty)] = art;
    }
  }
}

function ring(mx, my, innen, aussen, art) {
  for (let ty = Math.max(0, Math.floor(my - aussen)); ty <= Math.min(HOEHE - 1, Math.ceil(my + aussen)); ty++) {
    for (let tx = Math.max(0, Math.floor(mx - aussen)); tx <= Math.min(BREITE - 1, Math.ceil(mx + aussen)); tx++) {
      const d = Math.hypot(tx - mx, ty - my);
      if (d >= innen && d <= aussen) felder.art[i(tx, ty)] = art;
    }
  }
}

/* Linie beliebiger Richtung mit Breite — für Diagonalen und Rampen */
function linie(x0, y0, x1, y1, breite, art) {
  const schritte = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) * 2;
  const h = (breite - 1) / 2;
  for (let s = 0; s <= schritte; s++) {
    const t = s / schritte;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    for (let dy = -h; dy <= h; dy++) {
      for (let dx = -h; dx <= h; dx++) {
        setzen(Math.round(x + dx), Math.round(y + dy), art);
      }
    }
  }
}

/* ═══ 1 · Land, Meer, Kanal, Hafen ═══════════════════════ */
const STRAND_VON = 206;                       // ab hier Sand
const MEER_VON = 224;

function wasserBauen() {
  felder.art.fill(ART.GEBAEUDE);               // vorerst alles Bauland

  /* Meer im Osten, davor Strand */
  rechteck(MEER_VON, 0, BREITE - 1, HOEHE - 1, ART.WASSER);
  rechteck(STRAND_VON, 0, MEER_VON - 1, HOEHE - 1, ART.STRAND);

  /* Kanal zwischen Festland und Strandinsel, mit zwei Lücken für Brücken */
  for (let ty = 0; ty < HOEHE; ty++) {
    const wellig = Math.round(Math.sin(ty * 0.05) * 4);
    rechteck(196 + wellig, ty, 202 + wellig, ty, ART.WASSER);
  }

  /* Fluss quer durch die Stadt — trennt Nord und Süd */
  for (let tx = 0; tx < 200; tx++) {
    const y = Math.round(126 + Math.sin(tx * 0.035) * 12 + Math.sin(tx * 0.011) * 8);
    rechteck(tx, y - 4, tx, y + 4, ART.WASSER);
  }

  /* Hafenbecken im Südwesten */
  rechteck(4, HOEHE - 34, 30, HOEHE - 6, ART.WASSER);
  rechteck(30, HOEHE - 38, 46, HOEHE - 4, ART.HAFEN);

  /* Seeufer-Park im Nordwesten */
  kreis(38, 34, 15, ART.PARK);

  /* Merken, wo Wasser war: Straßen, die später darüber gemalt werden,
     sind in Wahrheit Brücken. */
  wasserKopie = felder.art.slice();
}

let wasserKopie = null;

/* Straße über altem Wasser ist in Wahrheit eine Brücke */
function brueckenNachtragen() {
  if (!wasserKopie) return;
  for (let q = 0; q < N; q++) {
    if (wasserKopie[q] !== ART.WASSER) continue;
    const a = felder.art[q];
    if (a === ART.STRASSE || a === ART.AUTOBAHN) felder.art[q] = ART.BRUECKE;
  }
}

/* ═══ 2 · Autobahn ═══════════════════════════════════════ */
const autobahn = [];                           // für Auf- und Abfahrten

function autobahnBauen() {
  /* Ring um die Innenstadt, Ecken abgerundet */
  const l = 26, r = 190, o = 24, u = 196;
  const ecke = 18;
  const punkte = [
    [l + ecke, o], [r - ecke, o], [r, o + ecke], [r, u - ecke],
    [r - ecke, u], [l + ecke, u], [l, u - ecke], [l, o + ecke]
  ];
  for (let k = 0; k < punkte.length; k++) {
    const a = punkte[k], b = punkte[(k + 1) % punkte.length];
    linie(a[0], a[1], b[0], b[1], 5, ART.AUTOBAHN);
    autobahn.push([a, b]);
  }
}

/* ═══ 3 · Hauptstraßen, Diagonalen, Kreisverkehre ═══════ */
const plaetze = [];

function hauptstrassenBauen() {
  /* Vier breite Achsen mit ungleichem Abstand */
  const senkrecht = [54, 96, 134, 170];
  const waagerecht = [46, 88, 150, 184];
  for (const x of senkrecht) rechteck(x, 6, x + 3, HOEHE - 7, ART.STRASSE);
  for (const y of waagerecht) rechteck(6, y, BREITE - 40, y + 3, ART.STRASSE);

  /* Zwei Diagonalen, die das Raster brechen */
  linie(30, 30, 150, 120, 3, ART.STRASSE);
  linie(180, 40, 70, 180, 3, ART.STRASSE);

  /* Strandboulevard, geschwungen der Küste entlang */
  for (let ty = 6; ty < HOEHE - 6; ty++) {
    const x = 208 + Math.round(Math.sin(ty * 0.06) * 3);
    rechteck(x, ty, x + 3, ty, ART.STRASSE);
  }

  /* Kreisverkehre an zwei Kreuzungen */
  for (const [mx, my] of [[96, 88], [134, 150]]) {
    ring(mx + 1.5, my + 1.5, 5, 9, ART.STRASSE);
    kreis(mx + 1.5, my + 1.5, 5, ART.PARK);
    plaetze.push([mx + 1.5, my + 1.5]);
  }
}

/* ═══ 3b · Uferstraßen ═══════════════════════════════════
   Ohne sie hört jede Querstraße am Wasser einfach auf und steht als
   Stummel zwischen den Häusern. Die Promenade fängt sie auf. */
function uferstrassenBauen() {
  /* Beide Ufer des Flusses */
  for (let tx = 2; tx < 200; tx++) {
    const y = Math.round(126 + Math.sin(tx * 0.035) * 12 + Math.sin(tx * 0.011) * 8);
    for (let b = 0; b < 2; b++) {
      strasseSetzen(tx, y - 6 - b);
      strasseSetzen(tx, y + 6 + b);
    }
  }
  /* Westufer des Kanals */
  for (let ty = 2; ty < HOEHE - 2; ty++) {
    const wellig = Math.round(Math.sin(ty * 0.05) * 4);
    for (let b = 0; b < 2; b++) strasseSetzen(196 + wellig - 3 - b, ty);
  }
  /* Rund um das Hafenbecken */
  for (let tx = 2; tx <= 33; tx++) for (let b = 0; b < 2; b++) strasseSetzen(tx, HOEHE - 37 - b);
  for (let ty = HOEHE - 37; ty < HOEHE - 3; ty++) for (let b = 0; b < 2; b++) strasseSetzen(32 + b, ty);
}

/* ═══ 4 · Nebenstraßen: Blöcke unterschiedlich groß ═══════ */
/* Straßen nur auf Bauland ziehen — Wasser und Hauptstraßen bleiben */
function strasseSetzen(tx, ty) {
  if (drin(tx, ty) && felder.art[i(tx, ty)] === ART.GEBAEUDE) felder.art[i(tx, ty)] = ART.STRASSE;
}

function nebenstrassenBauen() {
  /* Jede Nebenstraße bekommt eigene Werte: Breite und Schwung. Anfang und
     Ende liegen immer am Stadtrand — eine Straße, die mitten im Block
     aufhört, ergibt keinen Sinn. Wo Wasser dazwischenliegt, räumt der
     spätere Durchgang „strassenSaeubern" den Rest weg. */
  let x = 12;
  while (x < BREITE - 28) {
    const breit = zufall() < 0.25 ? 3 : 2;
    const schwung = zufall() < 0.45 ? zwischen(1.5, 4.5) : zwischen(0, 1.2);
    const takt = zwischen(0.012, 0.045);
    const phase = zufall() * 6.3;
    for (let ty = 0; ty < HOEHE; ty++) {
      const v = Math.round(Math.sin(ty * takt + phase) * schwung);
      for (let b = 0; b < breit; b++) strasseSetzen(x + b + v, ty);
    }
    x += ganz(15, 27);
  }

  let y = 12;
  while (y < HOEHE - 18) {
    const breit = zufall() < 0.2 ? 3 : 2;
    const schwung = zufall() < 0.45 ? zwischen(1.5, 4.0) : zwischen(0, 1.2);
    const takt = zwischen(0.012, 0.04);
    const phase = zufall() * 6.3;
    for (let tx = 0; tx < BREITE; tx++) {
      const v = Math.round(Math.sin(tx * takt + phase) * schwung);
      for (let b = 0; b < breit; b++) strasseSetzen(tx, y + b + v);
    }
    y += ganz(14, 25);
  }

  /* Geschwungene Wohnstraßen quer durch die Stadt. Sie brechen das
     Raster auf und werden breiter gemalt als die Rasterstraßen, sonst
     zerfallen sie beim Aufräumen. */
  for (let k = 0; k < 8; k++) {
    let px = ganz(12, 190), py = ganz(12, 200);
    const laenge = ganz(70, 150);
    let richtung = zufall() * Math.PI * 2;
    for (let s = 0; s < laenge; s++) {
      richtung += zwischen(-0.085, 0.085);
      px += Math.cos(richtung);
      py += Math.sin(richtung);
      const mx = Math.round(px), my = Math.round(py);
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]]) {
        strasseSetzen(mx + dx, my + dy);
      }
    }
  }
}

/* ═══ 4b · Straßennetz aufräumen ═════════════════════════
   Zwei Regeln, die den New-York-Eindruck und die sinnlosen Stummel
   zwischen den Häusern gleichermaßen austreiben:

     1. Sackgassen abtragen — eine Kachel am Ende einer Straße hat kaum
        Nachbarn. Runde für Runde wandert das Ende zurück bis zur
        nächsten Kreuzung. Der Stadtrand bleibt verschont, dort verlässt
        die Straße einfach die Stadt.
     2. Nur das größte zusammenhängende Netz behalten — was man nicht
        erreichen kann, gehört nicht auf die Karte.                      */
const ACHT = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const fahrbarArt = a =>
  a === ART.STRASSE || a === ART.AUTOBAHN || a === ART.BRUECKE || a === ART.KREUZUNG;

function strassenSaeubern() {
  for (let runde = 0; runde < 40; runde++) {
    const weg = [];
    for (let ty = 2; ty < HOEHE - 2; ty++) {
      for (let tx = 2; tx < BREITE - 2; tx++) {
        if (felder.art[i(tx, ty)] !== ART.STRASSE) continue;
        let n = 0;
        for (const [dx, dy] of ACHT) if (fahrbarArt(felder.art[i(tx + dx, ty + dy)])) n++;
        if (n < 4) weg.push(i(tx, ty));
      }
    }
    if (!weg.length) break;
    for (const q of weg) felder.art[q] = ART.GEBAEUDE;
  }

  const gesehen = new Uint8Array(N);
  let groesstes = null;
  for (let ty = 0; ty < HOEHE; ty++) {
    for (let tx = 0; tx < BREITE; tx++) {
      const p = i(tx, ty);
      if (gesehen[p] || !fahrbarArt(felder.art[p])) continue;
      const teil = [];
      const stapel = [p];
      gesehen[p] = 1;
      while (stapel.length) {
        const q = stapel.pop();
        teil.push(q);
        const qx = q % BREITE, qy = (q / BREITE) | 0;
        for (const [dx, dy] of ACHT) {
          const nx = qx + dx, ny = qy + dy;
          if (!drin(nx, ny)) continue;
          const nq = i(nx, ny);
          if (gesehen[nq] || !fahrbarArt(felder.art[nq])) continue;
          gesehen[nq] = 1;
          stapel.push(nq);
        }
      }
      if (!groesstes || teil.length > groesstes.length) groesstes = teil;
    }
  }
  if (!groesstes) return;
  const imNetz = new Uint8Array(N);
  for (const q of groesstes) imNetz[q] = 1;
  for (let q = 0; q < N; q++) {
    if (!imNetz[q] && felder.art[q] === ART.STRASSE) felder.art[q] = ART.GEBAEUDE;
  }
}

/* ═══ 4c · Zu große Bauflächen aufbrechen ════════════════
   Gassen werden quer durch die ganze Fläche geschnitten, nicht nur ein
   Stück weit — so treffen sie an beiden Enden auf eine Straße. */
function grosseFlaechenAufbrechen() {
  const gesehen = new Uint8Array(N);
  for (let ty = 1; ty < HOEHE - 1; ty++) {
    for (let tx = 1; tx < BREITE - 1; tx++) {
      const p = i(tx, ty);
      if (gesehen[p] || felder.art[p] !== ART.GEBAEUDE) continue;
      let x0 = tx, x1 = tx, y0 = ty, y1 = ty, groesse = 0;
      const stapel = [p];
      gesehen[p] = 1;
      while (stapel.length) {
        const q = stapel.pop();
        groesse++;
        const qx = q % BREITE, qy = (q / BREITE) | 0;
        if (qx < x0) x0 = qx;
        if (qx > x1) x1 = qx;
        if (qy < y0) y0 = qy;
        if (qy > y1) y1 = qy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = qx + dx, ny = qy + dy;
          if (!drin(nx, ny)) continue;
          const nq = i(nx, ny);
          if (gesehen[nq] || felder.art[nq] !== ART.GEBAEUDE) continue;
          gesehen[nq] = 1;
          stapel.push(nq);
        }
      }
      if (groesse < 360) continue;
      if (x1 - x0 > 24) {
        for (let x = x0 + ganz(9, 14); x < x1 - 7; x += ganz(11, 17)) {
          for (let y = y0 - 1; y <= y1 + 1; y++) { strasseSetzen(x, y); strasseSetzen(x + 1, y); }
        }
      }
      if (y1 - y0 > 24) {
        for (let y = y0 + ganz(9, 14); y < y1 - 7; y += ganz(11, 17)) {
          for (let x = x0 - 1; x <= x1 + 1; x++) { strasseSetzen(x, y); strasseSetzen(x, y + 1); }
        }
      }
    }
  }
}

/* ═══ 5 · Brücken über das Wasser ════════════════════════ */
function brueckenBauen() {
  /* Wo eine Straße am Wasser endet, wird weitergebaut, bis wieder Land
     kommt — das ergibt Brücken über Fluss und Kanal. */
  const kandidaten = [];
  for (let ty = 2; ty < HOEHE - 2; ty++) {
    for (let tx = 2; tx < BREITE - 2; tx++) {
      const a = felder.art[i(tx, ty)];
      if (a !== ART.STRASSE && a !== ART.AUTOBAHN) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        if (felder.art[i(tx + dx, ty + dy)] === ART.WASSER) kandidaten.push([tx, ty, dx, dy, a]);
      }
    }
  }
  const gebaut = [];
  for (const [tx, ty, dx, dy, a] of kandidaten) {
    /* nicht zu viele Brücken nebeneinander */
    if (gebaut.some(([gx, gy]) => Math.hypot(gx - tx, gy - ty) < 26)) continue;
    let laenge = 0;
    while (laenge < 40 && drin(tx + dx * laenge, ty + dy * laenge) &&
           felder.art[i(tx + dx * laenge, ty + dy * laenge)] === ART.WASSER) {
      laenge++;
    }
    if (laenge < 3 || laenge >= 40) continue;

    /* Hinter der Brücke weiterbauen, bis wieder eine Straße kommt.
       Eine Brücke, die im Baugebiet endet, wäre so sinnlos wie eine
       Straße mitten zwischen zwei Häusern. */
    let anschluss = 0;
    while (anschluss < 16) {
      const nx = tx + dx * (laenge + anschluss), ny = ty + dy * (laenge + anschluss);
      if (!drin(nx, ny)) break;
      const b = felder.art[i(nx, ny)];
      if (fahrbarArt(b)) break;
      if (b !== ART.GEBAEUDE) { anschluss = 99; break; }     // Park, Strand … reicht nicht
      anschluss++;
    }
    if (anschluss >= 16) continue;

    const breite = a === ART.AUTOBAHN ? 5 : 3;
    const halb = Math.floor(breite / 2);
    for (let s = 0; s < laenge + anschluss; s++) {
      for (let b = -halb; b <= halb; b++) {
        const bx = tx + dx * s + (dx ? 0 : b);
        const by = ty + dy * s + (dy ? 0 : b);
        if (!drin(bx, by)) continue;
        const art = felder.art[i(bx, by)];
        if (art === ART.WASSER) felder.art[i(bx, by)] = ART.BRUECKE;
        else if (art === ART.GEBAEUDE) felder.art[i(bx, by)] = ART.STRASSE;
      }
    }
    gebaut.push([tx, ty]);
  }
}

/* ═══ 6 · Gehwege ════════════════════════════════════════ */
function gehwegeBauen() {
  const kopie = felder.art.slice();
  const strasse = a => a === ART.STRASSE || a === ART.KREUZUNG || a === ART.BRUECKE;
  for (let ty = 1; ty < HOEHE - 1; ty++) {
    for (let tx = 1; tx < BREITE - 1; tx++) {
      if (kopie[i(tx, ty)] !== ART.GEBAEUDE) continue;
      let daneben = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        if (strasse(kopie[i(tx + dx, ty + dy)])) { daneben = true; break; }
      }
      if (daneben) felder.art[i(tx, ty)] = ART.GEHWEG;
    }
  }
}

/* ═══ 7 · Bezirke ════════════════════════════════════════ */
function bezirkeSetzen() {
  for (let ty = 0; ty < HOEHE; ty++) {
    for (let tx = 0; tx < BREITE; tx++) {
      let b = BEZIRK.WOHNEN;
      if (tx >= 196) b = BEZIRK.STRAND;
      else if (tx < 48 && ty > HOEHE - 44) b = BEZIRK.HAFEN;
      else if (tx < 60 && ty > 150) b = BEZIRK.INDUSTRIE;
      else if (Math.hypot(tx - 112, ty - 84) < 44) b = BEZIRK.INNENSTADT;
      else if (Math.hypot(tx - 38, ty - 34) < 20) b = BEZIRK.PARKLAND;
      felder.bezirk[i(tx, ty)] = b;
    }
  }
}

/* ═══ 8 · Blöcke füllen: Häuser, Parks, Wahrzeichen ══════ */
let hausZaehler = 1;

/* Nur Bauland überschreiben — Straßen, Gehwege und Wasser bleiben stehen.
   Vorher hat das Füllen ganze Straßenzüge weggewischt. */
function baulandSetzen(x0, y0, x1, y1, art) {
  for (let ty = Math.max(0, y0); ty <= Math.min(HOEHE - 1, y1); ty++) {
    for (let tx = Math.max(0, x0); tx <= Math.min(BREITE - 1, x1); tx++) {
      if (felder.art[i(tx, ty)] === ART.GEBAEUDE) felder.art[i(tx, ty)] = art;
    }
  }
}

function blockFuellen(x0, y0, x1, y1) {
  const bez = felder.bezirk[i((x0 + x1) >> 1, (y0 + y1) >> 1)];
  const breite = x1 - x0 + 1, hoehe = y1 - y0 + 1;
  if (breite < 2 || hoehe < 2) return;

  const los = zufall();
  /* Manche Blöcke werden Park oder Parkplatz */
  if (los < (bez === BEZIRK.WOHNEN ? 0.16 : 0.09)) {
    baulandSetzen(x0, y0, x1, y1, ART.PARK);
    return;
  }
  if (los < 0.2) {
    baulandSetzen(x0, y0, x1, y1, ART.PARKPLATZ);
    return;
  }

  /* Häuser: den Block in Rechtecke schneiden */
  const teileX = Math.max(1, Math.round(breite / zwischen(3.2, 6.5)));
  const teileY = Math.max(1, Math.round(hoehe / zwischen(3.2, 6.5)));
  const hof = breite > 9 && hoehe > 9 && zufall() < 0.45;

  for (let hy = 0; hy < teileY; hy++) {
    for (let hx = 0; hx < teileX; hx++) {
      const ax = x0 + Math.round((hx * breite) / teileX);
      const bx = x0 + Math.round(((hx + 1) * breite) / teileX) - 1;
      const ay = y0 + Math.round((hy * hoehe) / teileY);
      const by = y0 + Math.round(((hy + 1) * hoehe) / teileY) - 1;
      if (bx < ax || by < ay) continue;

      /* Innenhof in der Mitte großer Blöcke */
      if (hof && hx > 0 && hy > 0 && hx < teileX - 1 && hy < teileY - 1) {
        baulandSetzen(ax, ay, bx, by, zufall() < 0.5 ? ART.PARK : ART.PARKPLATZ);
        continue;
      }

      const nr = hausZaehler++;
      const bauArt = hausArtWaehlen(bez, (bx - ax + 1) * (by - ay + 1));
      const h = hausHoehe(bez, bauArt);
      for (let ty = ay; ty <= by; ty++) {
        for (let tx = ax; tx <= bx; tx++) {
          if (!drin(tx, ty) || felder.art[i(tx, ty)] !== ART.GEBAEUDE) continue;
          felder.haus[i(tx, ty)] = nr;
          felder.bau[i(tx, ty)] = bauArt;
          felder.hoehe[i(tx, ty)] = h;
        }
      }
    }
  }
}

function hausArtWaehlen(bez, flaeche) {
  const l = zufall();
  if (bez === BEZIRK.INNENSTADT) {
    if (l < 0.42) return BAU.HOCHHAUS;
    if (l < 0.58) return BAU.KAUFHAUS;
    if (l < 0.72) return BAU.LADEN;
    if (l < 0.8) return BAU.HOTEL;
    return BAU.WOHNHAUS;
  }
  if (bez === BEZIRK.STRAND) {
    if (l < 0.5) return BAU.HOTEL;
    if (l < 0.7) return BAU.LADEN;
    return BAU.WOHNHAUS;
  }
  if (bez === BEZIRK.HAFEN || bez === BEZIRK.INDUSTRIE) {
    if (l < 0.6) return BAU.LAGER;
    if (l < 0.75) return BAU.WERK;
    return BAU.LADEN;
  }
  if (l < 0.62) return BAU.WOHNHAUS;
  if (l < 0.76) return BAU.LADEN;
  if (l < 0.84) return BAU.SCHULE;
  if (l < 0.9) return BAU.KIRCHE;
  return BAU.HOTEL;
}

function hausHoehe(bez, bauArt) {
  if (bauArt === BAU.HOCHHAUS) return ganz(150, 255);
  if (bauArt === BAU.LAGER || bauArt === BAU.WERK) return ganz(40, 70);
  if (bauArt === BAU.HOTEL) return ganz(90, 170);
  if (bauArt === BAU.STADION) return ganz(80, 110);
  if (bez === BEZIRK.INNENSTADT) return ganz(90, 160);
  return ganz(45, 95);
}

/* Blöcke finden: zusammenhängende Bauflächen zwischen den Straßen */
function bloeckeFuellen() {
  const gesehen = new Uint8Array(N);
  for (let ty = 1; ty < HOEHE - 1; ty++) {
    for (let tx = 1; tx < BREITE - 1; tx++) {
      const p = i(tx, ty);
      if (gesehen[p] || felder.art[p] !== ART.GEBAEUDE) continue;

      /* Ausdehnung des Blocks über eine einfache Flutfüllung bestimmen */
      let x0 = tx, x1 = tx, y0 = ty, y1 = ty;
      const stapel = [p];
      gesehen[p] = 1;
      const felderImBlock = [];
      while (stapel.length) {
        const q = stapel.pop();
        const qx = q % BREITE, qy = (q / BREITE) | 0;
        felderImBlock.push(q);
        if (qx < x0) x0 = qx;
        if (qx > x1) x1 = qx;
        if (qy < y0) y0 = qy;
        if (qy > y1) y1 = qy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = qx + dx, ny = qy + dy;
          if (!drin(nx, ny)) continue;
          const nq = i(nx, ny);
          if (gesehen[nq] || felder.art[nq] !== ART.GEBAEUDE) continue;
          gesehen[nq] = 1;
          stapel.push(nq);
        }
      }
      if (felderImBlock.length < 4) {
        for (const q of felderImBlock) felder.art[q] = ART.GEHWEG;
        continue;
      }
      blockFuellen(x0, y0, x1, y1);
    }
  }
}

/* ═══ 9 · Wahrzeichen setzen ═════════════════════════════ */
export const wahrzeichen = [];

function wahrzeichenSetzen() {
  const wunsch = [
    { bau: BAU.POLIZEI, name: "VCPD", nah: [104, 70] },
    { bau: BAU.FEUERWEHR, name: "Feuerwache", nah: [78, 110] },
    { bau: BAU.KRANKENHAUS, name: "Klinik", nah: [140, 96] },
    { bau: BAU.BANK, name: "Bank", nah: [112, 78] },
    { bau: BAU.STADION, name: "Stadion", nah: [66, 60] },
    { bau: BAU.KAUFHAUS, name: "Kaufhaus", nah: [122, 120] },
    { bau: BAU.TANKSTELLE, name: "Tankstelle", nah: [88, 150] },
    { bau: BAU.TANKSTELLE, name: "Tankstelle", nah: [170, 70] },
    { bau: BAU.KIRCHE, name: "Kirche", nah: [60, 96] },
    { bau: BAU.SCHULE, name: "Schule", nah: [150, 170] },
    /* Ammu-Vice: drei Waffenläden, verteilt über die Stadt */
    { bau: BAU.WAFFEN, name: "Ammu-Vice", nah: [126, 66] },
    { bau: BAU.WAFFEN, name: "Ammu-Vice", nah: [72, 140] },
    { bau: BAU.WAFFEN, name: "Ammu-Vice", nah: [186, 108] }
  ];

  for (const w of wunsch) {
    const treffer = hausSuchen(w.nah[0], w.nah[1], w.bau === BAU.STADION ? 40 : 22);
    if (!treffer) continue;
    const { nr, x0, y0, x1, y1 } = treffer;
    const h = w.bau === BAU.STADION ? 100
            : w.bau === BAU.TANKSTELLE ? 30
            : w.bau === BAU.WAFFEN ? 55 : 70;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (felder.haus[i(tx, ty)] !== nr) continue;
        felder.bau[i(tx, ty)] = w.bau;
        felder.hoehe[i(tx, ty)] = h;
      }
    }
    wahrzeichen.push({
      name: w.name, bau: w.bau,
      x: ((x0 + x1) / 2 + 0.5) * KACHEL,
      y: ((y0 + y1) / 2 + 0.5) * KACHEL
    });
  }
}

/* Haus in der Nähe eines Punktes finden, das groß genug ist */
function hausSuchen(nahX, nahY, radius) {
  let beste = null;
  for (let ty = Math.max(1, nahY - radius); ty < Math.min(HOEHE - 1, nahY + radius); ty++) {
    for (let tx = Math.max(1, nahX - radius); tx < Math.min(BREITE - 1, nahX + radius); tx++) {
      const nr = felder.haus[i(tx, ty)];
      if (!nr || felder.art[i(tx, ty)] !== ART.GEBAEUDE) continue;
      if (beste && beste.nr === nr) continue;
      /* Ausdehnung dieses Hauses bestimmen */
      let x0 = tx, x1 = tx, y0 = ty, y1 = ty;
      for (let sy = Math.max(1, ty - 12); sy < Math.min(HOEHE - 1, ty + 12); sy++) {
        for (let sx = Math.max(1, tx - 12); sx < Math.min(BREITE - 1, tx + 12); sx++) {
          if (felder.haus[i(sx, sy)] !== nr) continue;
          if (sx < x0) x0 = sx;
          if (sx > x1) x1 = sx;
          if (sy < y0) y0 = sy;
          if (sy > y1) y1 = sy;
        }
      }
      const flaeche = (x1 - x0 + 1) * (y1 - y0 + 1);
      const weit = Math.hypot(tx - nahX, ty - nahY);
      const wert = flaeche - weit * 2;
      if (!beste || wert > beste.wert) beste = { nr, x0, y0, x1, y1, wert };
    }
  }
  return beste;
}

/* ═══ 10 · Kreuzungen markieren ══════════════════════════ */
function kreuzungenSetzen() {
  const strasse = a => a === ART.STRASSE || a === ART.KREUZUNG || a === ART.BRUECKE;
  const kopie = felder.art.slice();
  for (let ty = 2; ty < HOEHE - 2; ty++) {
    for (let tx = 2; tx < BREITE - 2; tx++) {
      if (kopie[i(tx, ty)] !== ART.STRASSE) continue;
      const waagerecht = strasse(kopie[i(tx - 2, ty)]) && strasse(kopie[i(tx + 2, ty)]);
      const senkrecht = strasse(kopie[i(tx, ty - 2)]) && strasse(kopie[i(tx, ty + 2)]);
      if (waagerecht && senkrecht) felder.art[i(tx, ty)] = ART.KREUZUNG;
    }
  }
}

/* ═══ Aufbau ═════════════════════════════════════════════ */
let gebaut = false;

export function bauen() {
  if (gebaut) return;
  gebaut = true;
  wasserBauen();
  autobahnBauen();
  hauptstrassenBauen();
  uferstrassenBauen();
  nebenstrassenBauen();
  grosseFlaechenAufbrechen();
  brueckenBauen();
  brueckenNachtragen();
  strassenSaeubern();
  bezirkeSetzen();
  gehwegeBauen();
  bloeckeFuellen();
  wahrzeichenSetzen();
  kreuzungenSetzen();
}

bauen();

/* ── Grundflächen der Häuser ──────────────────────────────
   Ein Durchgang über die Karte: je Hausnummer die umschließende
   Schachtel aus Kacheln. Der Zeichner setzt darauf ein einzelnes
   Gebäudebild, statt Kachel für Kachel ein Dach zu malen.
   Nur volle Rechtecke bekommen eines — bei L-Formen ragte das
   Bild sonst über die Straße. */
export const haeuser = [];
for (let ty = 0; ty < HOEHE; ty++) {
  for (let tx = 0; tx < BREITE; tx++) {
    const p = i(tx, ty);
    const nr = felder.haus[p];
    if (!nr || felder.art[p] !== ART.GEBAEUDE) continue;
    const h = haeuser[nr];
    if (!h) {
      haeuser[nr] = { nr, bau: felder.bau[p], x0: tx, y0: ty, x1: tx, y1: ty, zahl: 1 };
      continue;
    }
    if (tx < h.x0) h.x0 = tx;
    if (tx > h.x1) h.x1 = tx;
    if (ty > h.y1) h.y1 = ty;
    h.zahl++;
  }
}
for (const h of haeuser) {
  if (!h) continue;
  h.voll = h.zahl === (h.x1 - h.x0 + 1) * (h.y1 - h.y0 + 1);
}

/* ═══ Abfragen ═══════════════════════════════════════════ */
export function art(tx, ty) {
  if (!drin(tx, ty)) return ART.WASSER;
  return felder.art[i(tx, ty)];
}

export const bauArt = (tx, ty) => (drin(tx, ty) ? felder.bau[i(tx, ty)] : 0);
export const hausNr = (tx, ty) => (drin(tx, ty) ? felder.haus[i(tx, ty)] : 0);
export const bezirkVon = (tx, ty) => (drin(tx, ty) ? felder.bezirk[i(tx, ty)] : BEZIRK.WOHNEN);
export const hoeheVon = (tx, ty) => (drin(tx, ty) ? felder.hoehe[i(tx, ty)] / 255 : 0);

export function fest(tx, ty) {
  const a = art(tx, ty);
  return a === ART.GEBAEUDE || a === ART.WASSER;
}

export const befahrbar = a =>
  a === ART.STRASSE || a === ART.KREUZUNG || a === ART.BRUECKE || a === ART.AUTOBAHN;

/* Startplatz: Gehweg an einer Straße, nahe der Innenstadt */
export function startSuchen() {
  for (let r = 0; r < 60; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const tx = 112 + dx, ty = 84 + dy;
        if (art(tx, ty) !== ART.GEHWEG) continue;
        const amRand = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .some(([ax, ay]) => art(tx + ax, ty + ay) === ART.STRASSE);
        if (amRand) return { x: (tx + 0.5) * KACHEL, y: (ty + 0.5) * KACHEL };
      }
    }
  }
  return { x: 112 * KACHEL, y: 84 * KACHEL };
}
