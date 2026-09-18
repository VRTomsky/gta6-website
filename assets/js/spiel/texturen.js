/* ═══════════════════════════════════════════════════════════
   Texturen

   Von oben besteht die Stadt sonst aus lauter einfarbigen Flächen. Hier
   werden beim Start kleine Bilder erzeugt — Asphalt mit Körnung, Gehweg
   mit Platten, Sand, Gras, Kiesdach — und beim Zeichnen über die Kacheln
   gelegt. Je Untergrund gibt es mehrere Fassungen, damit sich das Muster
   nicht sichtbar wiederholt.

   Alles entsteht im Browser (kein Bild-Download) und passt sich der
   Kachelgröße an: eine Textur ist genau eine Kachel groß (4 Meter).
   ═══════════════════════════════════════════════════════════ */

const KANTE = 128;                    // Auflösung einer Texturkachel
const sammlung = new Map();

/* Eigener Zufall mit Startwert, damit Texturen reproduzierbar sind */
function wuerfel(startwert) {
  let z = startwert >>> 0;
  return () => {
    z = (Math.imul(z ^ (z >>> 15), 2246822507) + 1013904223) >>> 0;
    return z / 4294967296;
  };
}

function leinwand() {
  const c = document.createElement("canvas");
  c.width = c.height = KANTE;
  return c;
}

function koernung(ctx, zufall, anzahl, farben, groesse = 2) {
  for (let i = 0; i < anzahl; i++) {
    ctx.fillStyle = farben[Math.floor(zufall() * farben.length)];
    const s = groesse * (0.5 + zufall());
    ctx.fillRect(zufall() * KANTE, zufall() * KANTE, s, s);
  }
}

/* ── Asphalt: dunkel, körnig, mit Flicken und Rissen ── */
function asphalt(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(1000 + nr);
  ctx.fillStyle = "#31333c";
  ctx.fillRect(0, 0, KANTE, KANTE);
  koernung(ctx, z, 900, ["rgba(255,255,255,.035)", "rgba(0,0,0,.09)", "rgba(180,190,210,.03)"], 2.4);
  /* geflickte Stellen */
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = z() > 0.5 ? "rgba(20,22,28,.35)" : "rgba(58,60,68,.25)";
    const w = 20 + z() * 46, h = 14 + z() * 40;
    ctx.fillRect(z() * (KANTE - w), z() * (KANTE - h), w, h);
  }
  /* Risse */
  ctx.strokeStyle = "rgba(12,14,18,.5)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    let x = z() * KANTE, y = z() * KANTE;
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (z() - 0.5) * 40;
      y += (z() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return c;
}

/* ── Gehweg: Platten mit Fugen ── */
function gehweg(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(2000 + nr);
  ctx.fillStyle = "#70737c";
  ctx.fillRect(0, 0, KANTE, KANTE);
  koernung(ctx, z, 700, ["rgba(255,255,255,.05)", "rgba(0,0,0,.05)"], 2);
  const platte = KANTE / 3;
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      ctx.fillStyle = `rgba(255,255,255,${0.02 + z() * 0.05})`;
      ctx.fillRect(x * platte + 1, y * platte + 1, platte - 2, platte - 2);
    }
  }
  ctx.strokeStyle = "rgba(20,22,28,.35)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(i * platte, 0); ctx.lineTo(i * platte, KANTE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * platte); ctx.lineTo(KANTE, i * platte); ctx.stroke();
  }
  return c;
}

/* ── Sand: helle Körnung mit Rippeln ── */
function sand(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(3000 + nr);
  ctx.fillStyle = "#dcc69a";
  ctx.fillRect(0, 0, KANTE, KANTE);
  koernung(ctx, z, 1400, ["rgba(255,250,230,.35)", "rgba(168,146,106,.3)"], 2);
  ctx.strokeStyle = "rgba(180,158,116,.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const y = z() * KANTE;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(KANTE * 0.3, y + (z() - 0.5) * 18, KANTE * 0.7, y + (z() - 0.5) * 18, KANTE, y);
    ctx.stroke();
  }
  return c;
}

/* ── Gras: Büschel in mehreren Grüntönen ── */
function gras(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(4000 + nr);
  ctx.fillStyle = "#2f6b45";
  ctx.fillRect(0, 0, KANTE, KANTE);
  koernung(ctx, z, 1200, ["rgba(70,140,90,.5)", "rgba(24,70,48,.55)", "rgba(120,170,110,.25)"], 3);
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = z() > 0.5 ? "rgba(90,160,100,.45)" : "rgba(24,64,44,.5)";
    ctx.lineWidth = 1.4;
    const x = z() * KANTE, y = z() * KANTE;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (z() - 0.5) * 6, y - 4 - z() * 5);
    ctx.stroke();
  }
  return c;
}

/* ── Kiesdach: für alle Dächer, wird über die Hausfarbe gelegt ── */
function dachRauschen(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(5000 + nr);
  koernung(ctx, z, 1500, ["rgba(255,255,255,.07)", "rgba(0,0,0,.10)", "rgba(255,255,255,.03)"], 2.6);
  /* Dachbahnen */
  ctx.strokeStyle = "rgba(0,0,0,.10)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const y = (i + 0.5) * (KANTE / 4);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(KANTE, y); ctx.stroke();
  }
  return c;
}

/* ── Beton (Parkplatz, Hafen) ── */
function beton(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(6000 + nr);
  ctx.fillStyle = "#3f424d";
  ctx.fillRect(0, 0, KANTE, KANTE);
  koernung(ctx, z, 800, ["rgba(255,255,255,.04)", "rgba(0,0,0,.08)"], 2.2);
  for (let i = 0; i < 3; i++) {                   // Ölflecken
    const x = z() * KANTE, y = z() * KANTE, r = 6 + z() * 12;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(10,10,14,.5)");
    g.addColorStop(1, "rgba(10,10,14,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}

/* ── Wasser ── */
function wasser(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(7000 + nr);
  const g = ctx.createLinearGradient(0, 0, KANTE, KANTE);
  g.addColorStop(0, "#12305a");
  g.addColorStop(1, "#164272");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, KANTE, KANTE);
  ctx.strokeStyle = "rgba(190,225,255,.16)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = z() * KANTE;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(KANTE * 0.3, y - 6, KANTE * 0.6, y + 6, KANTE, y);
    ctx.stroke();
  }
  return c;
}

/* ── Bäume, Palmen, Büsche als kleine Bilder mit Schatten ── */
function baum(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(8000 + nr);
  const m = KANTE / 2;
  ctx.fillStyle = "rgba(6,10,22,.32)";            // Schatten
  ctx.beginPath(); ctx.ellipse(m + 9, m + 9, 40, 34, 0, 0, Math.PI * 2); ctx.fill();
  const tiefe = ["#1b3a2a", "#215039", "#2a6444", "#357a4f"];
  for (let i = 0; i < 16; i++) {                  // Krone aus vielen Blattballen
    const w = z() * Math.PI * 2, r = z() * 26;
    ctx.fillStyle = tiefe[Math.floor(z() * tiefe.length)];
    ctx.beginPath();
    ctx.arc(m + Math.cos(w) * r, m + Math.sin(w) * r, 12 + z() * 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(150,210,140,.22)";        // Lichtseite
  ctx.beginPath(); ctx.arc(m - 10, m - 12, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3a2a1e";                      // Stamm in der Mitte
  ctx.beginPath(); ctx.arc(m, m, 5, 0, Math.PI * 2); ctx.fill();
  return c;
}

function palme(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(9000 + nr);
  const m = KANTE / 2;
  ctx.fillStyle = "rgba(6,10,22,.3)";
  ctx.beginPath(); ctx.ellipse(m + 10, m + 10, 30, 24, 0, 0, Math.PI * 2); ctx.fill();
  const wedel = 7 + Math.floor(z() * 3);
  for (let i = 0; i < wedel; i++) {
    const w = (i / wedel) * Math.PI * 2 + z() * 0.3;
    const lang = 30 + z() * 16;
    ctx.strokeStyle = i % 2 ? "#24603c" : "#2f7a4b";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(m, m);
    ctx.quadraticCurveTo(m + Math.cos(w) * lang * 0.6, m + Math.sin(w) * lang * 0.6,
                         m + Math.cos(w + 0.35) * lang, m + Math.sin(w + 0.35) * lang);
    ctx.stroke();
  }
  ctx.fillStyle = "#6b4a2c";                      // Stamm
  ctx.beginPath(); ctx.arc(m, m, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#c9a03a";                      // Kokosnüsse
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(m + (z() - 0.5) * 14, m + (z() - 0.5) * 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

function busch(nr) {
  const c = leinwand(), ctx = c.getContext("2d"), z = wuerfel(9500 + nr);
  const m = KANTE / 2;
  ctx.fillStyle = "rgba(6,10,22,.25)";
  ctx.beginPath(); ctx.ellipse(m + 6, m + 6, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = ["#245a38", "#2d6b42", "#357a4d"][Math.floor(z() * 3)];
    ctx.beginPath();
    ctx.arc(m + (z() - 0.5) * 26, m + (z() - 0.5) * 26, 8 + z() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

const BAUPLAN = {
  asphalt: [asphalt, 4],
  gehweg: [gehweg, 3],
  sand: [sand, 3],
  gras: [gras, 3],
  dach: [dachRauschen, 3],
  beton: [beton, 3],
  wasser: [wasser, 2],
  baum: [baum, 3],
  palme: [palme, 3],
  busch: [busch, 2]
};

export function bauen() {
  if (sammlung.size) return;
  for (const [name, [bauer, anzahl]] of Object.entries(BAUPLAN)) {
    const liste = [];
    for (let i = 0; i < anzahl; i++) liste.push(bauer(i));
    sammlung.set(name, liste);
  }
}

/* Textur holen — `wahl` entscheidet, welche Fassung (z. B. aus streu()) */
export function tex(name, wahl = 0) {
  const liste = sammlung.get(name);
  if (!liste) return null;
  return liste[Math.floor(wahl * liste.length) % liste.length];
}

/* Textur über eine Kachel legen */
export function malen(ctx, name, wahl, px, py, g) {
  const bild = tex(name, wahl);
  if (bild) ctx.drawImage(bild, px, py, g + 1, g + 1);
}
