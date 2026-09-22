/* ═══════════════════════════════════════════════════════════
   Bilder laden und zeichnen

   Alle Sprites liegen in assets/img/spiel/ und sind im selben Maßstab
   gerendert: SPRITE_PX Bildpunkte je Meter, Blickrichtung nach oben.
   Gedreht wird erst beim Zeichnen — ein Bild reicht für alle Richtungen.
   ═══════════════════════════════════════════════════════════ */

export const SPRITE_PX = 64;          // Bildpunkte je Meter in den Dateien
const ORDNER = "assets/img/spiel/";

const bilder = new Map();

export function laden(namen) {
  return Promise.all(namen.map(name => new Promise(fertig => {
    const b = new Image();
    b.onload = () => { bilder.set(name, b); fertig(b); };
    b.onerror = () => { console.warn("[Spiel] Bild fehlt:", name); fertig(null); };
    b.src = ORDNER + name + ".png";
  })));
}

export const bild = name => bilder.get(name) || null;

/* Selbst gezeichnete Sprites (Waffen) anmelden — sie kommen aus einer
   Leinwand statt aus einer Datei, malen() behandelt beides gleich. */
export const setzen = (name, leinwand) => bilder.set(name, leinwand);

/* Sprite an Weltposition zeichnen. winkel in Radiant, 0 = nach rechts —
   die Bilder zeigen nach oben, deshalb kommt eine Vierteldrehung dazu. */
export function malen(ctx, name, kamera, x, y, winkel, breiteM = 0, faktor = 1) {
  const b = bilder.get(name);
  if (!b) return;
  const z = kamera.zoom;
  const px = (x - kamera.x) * z + kamera.breite / 2;
  const py = (y - kamera.y) * z + kamera.hoehe / 2;
  const skala = (breiteM ? (breiteM * SPRITE_PX) / b.width : 1) * (z / SPRITE_PX) * faktor;
  const w = b.width * skala, h = b.height * skala;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(winkel + Math.PI / 2);
  ctx.drawImage(b, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/* ── Aufrechte Sprites ──
   Die Figuren sind von schräg vorn gezeichnet, nicht streng von oben.
   Dreht man sie mit der Laufrichtung, liegen sie quer auf der Straße.
   Deshalb bleiben sie aufrecht: gekippt wird nur ein wenig, und wer nach
   links geht, wird gespiegelt.

   neigung in Radiant, spiegeln = Blick nach links. */
export function aufrecht(ctx, name, kamera, x, y, neigung = 0, faktor = 1, spiegeln = false) {
  const bild = bilder.get(name);
  if (!bild) return;
  const z = kamera.zoom;
  const px = (x - kamera.x) * z + kamera.breite / 2;
  const py = (y - kamera.y) * z + kamera.hoehe / 2;
  const skala = (z / SPRITE_PX) * faktor;
  const w = bild.width * skala, h = bild.height * skala;

  ctx.save();
  ctx.translate(px, py);
  if (neigung) ctx.rotate(neigung);
  if (spiegeln) ctx.scale(-1, 1);
  ctx.drawImage(bild, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/* Weicher Schatten unter Figuren und Autos */
export function schatten(ctx, kamera, x, y, rx, ry) {
  const z = kamera.zoom;
  const px = (x - kamera.x) * z + kamera.breite / 2;
  const py = (y - kamera.y) * z + kamera.hoehe / 2;
  ctx.save();
  ctx.translate(px, py + ry * z * 0.25);
  ctx.scale(1, 0.6);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * z);
  g.addColorStop(0, "rgba(4,8,20,.45)");
  g.addColorStop(1, "rgba(4,8,20,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx * z, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
