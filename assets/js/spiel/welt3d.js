/* ═══════════════════════════════════════════════════════════
   Vice City Run in 3D (Three.js)

   Die Spiellogik bleibt, wie sie ist: Figuren, Autos, Verkehr, Polizei
   und Aufträge rechnen in Metern auf einer Fläche (x nach Osten, y nach
   Süden, winkel wie atan2(vy, vx)). Diese Datei zeigt denselben Zustand
   in 3D: Weltpunkt (x, y) → Three-Punkt (x, Höhe, y).

     Boden     aus dem 2D-Maler (karte.js → bodenStueck3d), in Stücken
               von 32 m, je nach Abstand fein oder grob
     Häuser    Blöcke mit Höhe aus dem Stadtplan, oben das Dachbild aus
               einem Atlas, an den Seiten Fassaden mit Fenstern
     Deko      Palmen, Bäume, Laternen, Ampeln … als einfache Modelle,
               je Stück zu einem Körper zusammengefasst
     Autos     Karosserie mit dem Autobild oben drauf, Räder, Lichter
     Figuren   Aufsteller mit den Laufbildern — gewählt wird das Bild,
               das zur Blickrichtung der Kamera passt (vorn, hinten,
               links, rechts), wie in klassischen 3D-Spielen

   Three.js kommt beim ersten Umschalten auf 3D vom CDN (jsDelivr).
   ═══════════════════════════════════════════════════════════ */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js";
import * as Karte from "./karte.js";
import { bild as sprite } from "./bilder.js";
import { TYPEN } from "./fahrzeug.js";

const STUECK = Karte.STUECK_METER;           // 32 m
const SICHT = 300;                           // so weit wird gebaut
const NEBEL_NAH = 140, NEBEL_FERN = 290;
const LAUF_POSEN = [1, 2, 3, 2];

/* ── Grundgerüst ────────────────────────────────────────── */
let renderer, szene, kamera, sonne, himmel, halbkugel, himmelKugel;
let leinwand3d = null;
let atlas = null;
const stuecke = new Map();                   // "cx,cy" → Stück
let bereit = false;

/* Kamerazustand. gier = Blickrichtung wie `winkel` in der Spiellogik. */
export const kam = {
  gier: -Math.PI / 2, neigung: 0.32, abstand: 7,
  frei: 0,                                   // Sekunden seit dem letzten Mausblick
  x: 0, y: 0, z: 0, gefangen: false
};

export function einrichten(buehne, vorDem) {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  leinwand3d = renderer.domElement;
  leinwand3d.className = "spiel3d";
  buehne.insertBefore(leinwand3d, vorDem);

  szene = new THREE.Scene();
  himmel = new THREE.Color("#f6b38a");
  szene.fog = new THREE.Fog(himmel, NEBEL_NAH, NEBEL_FERN);
  szene.background = himmel;

  kamera = new THREE.PerspectiveCamera(62, 16 / 9, 0.3, 700);

  /* Himmel: Verlauf von tiefem Blau oben zum warmen Horizont */
  const himmelMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { oben: { value: new THREE.Color("#3d5fae") }, mitte: { value: new THREE.Color("#e48aa0") },
                unten: { value: new THREE.Color("#f6b38a") } },
    vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 oben; uniform vec3 mitte; uniform vec3 unten; varying vec3 p;" +
      "void main(){ float h = clamp(p.y, 0.0, 1.0); vec3 c = mix(unten, mitte, smoothstep(0.0, 0.12, h));" +
      "c = mix(c, oben, smoothstep(0.1, 0.55, h)); gl_FragColor = vec4(c, 1.0); }"
  });
  himmelKugel = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 12), himmelMat);
  himmelKugel.renderOrder = -1;
  szene.add(himmelKugel);

  halbkugel = new THREE.HemisphereLight("#cfe3ff", "#8a7a6a", 1.35);
  szene.add(halbkugel);
  sonne = new THREE.DirectionalLight("#ffe2bd", 2.3);
  sonne.castShadow = true;
  sonne.shadow.mapSize.set(2048, 2048);
  const sc = sonne.shadow.camera;
  sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 1; sc.far = 260;
  sonne.shadow.bias = -0.0006;
  sonne.shadow.normalBias = 0.4;
  szene.add(sonne);
  szene.add(sonne.target);

  atlasBauen();
  fassadeBauen();
  wasserBauen();
  bereit = true;
  return leinwand3d;
}

/* ── Wasser ─────────────────────────────────────────────────
   Eine große Fläche einen halben Meter unter dem Land. Der Boden hat
   dort, wo Wasser ist, Löcher — man sieht also hinunter auf die Wellen,
   und an jeder Kante steht eine Kaimauer. Die Wellen sind eine
   Normalen-Textur aus Sinuswellen, die langsam wandert. */
const WASSER_Y = -0.55;
let wasser = null;
function wasserBauen() {
  const N = 256;
  const hoehe = new Float32Array(N * N);
  const wellen = [[3, 1, 1.0, 0.3], [1, 4, 0.7, 1.7], [5, -2, 0.45, 2.9], [-2, 7, 0.3, 0.8], [9, 3, 0.18, 4.1]];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let h = 0;
      for (const [fx, fy, a, ph] of wellen) h += a * Math.sin((2 * Math.PI * (fx * x + fy * y)) / N + ph);
      hoehe[y * N + x] = h;
    }
  }
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d");
  const bild = g.createImageData(N, N);
  const at = (x, y) => hoehe[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2.2;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2.2;
      const l = Math.hypot(dx, dy, 1);
      const k = (y * N + x) * 4;
      bild.data[k] = ((-dx / l) * 0.5 + 0.5) * 255;
      bild.data[k + 1] = ((-dy / l) * 0.5 + 0.5) * 255;
      bild.data[k + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      bild.data[k + 3] = 255;
    }
  }
  g.putImageData(bild, 0, 0);
  const normalen = new THREE.CanvasTexture(c);
  normalen.wrapS = normalen.wrapT = THREE.RepeatWrapping;
  const breit = Karte.BREITE * Karte.KACHEL + 1200, tief = Karte.HOEHE * Karte.KACHEL + 1200;
  normalen.repeat.set(breit / 14, tief / 14);
  const mat = new THREE.MeshPhongMaterial({
    color: "#1b6d8c", specular: "#d8f2ff", shininess: 70,
    normalMap: normalen, normalScale: new THREE.Vector2(0.55, 0.55)
  });
  wasser = new THREE.Mesh(new THREE.PlaneGeometry(breit, tief), mat);
  wasser.rotation.x = -Math.PI / 2;
  wasser.position.set(Karte.BREITE * Karte.KACHEL / 2, WASSER_Y, Karte.HOEHE * Karte.KACHEL / 2);
  wasser.receiveShadow = true;
  szene.add(wasser);
}

export function groesse(b, h) {
  if (!renderer) return;
  renderer.setSize(b, h, false);
  kamera.aspect = b / Math.max(1, h);
  kamera.updateProjectionMatrix();
}

export function sichtbar(an) {
  if (leinwand3d) leinwand3d.hidden = !an;
}

/* ── Maus: Umsehen ──────────────────────────────────────── */
export function drehen(dx, dy) {
  kam.gier += dx * 0.0026;
  kam.neigung = Math.max(0.02, Math.min(1.05, kam.neigung + dy * 0.0022));
  kam.frei = 0;
}

/* ═══ Texturen ═══════════════════════════════════════════ */
const texturen = new Map();
function textur(name) {
  let t = texturen.get(name);
  if (t !== undefined) return t;
  const b = sprite(name);
  if (!b) { texturen.set(name, null); return null; }
  t = new THREE.Texture(b);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  texturen.set(name, t);
  return t;
}

/* Lackfarbe eines Autobildes: der Durchschnitt der kräftigen Punkte.
   Scheiben, Reifen und Glanzlichter zählen nicht mit. */
const lacke = new Map();
function lackFarbe(name) {
  if (lacke.has(name)) return lacke.get(name);
  const b = sprite(name);
  let farbe = mittelFarbe(name);
  if (b) {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(b, 0, 0, 32, 32);
    const d = g.getImageData(0, 0, 32, 32).data;
    const hsl = {};
    const tmp = new THREE.Color();
    let r = 0, gr = 0, bl = 0, n = 0, alle = 0;
    for (let k = 0; k < d.length; k += 4) {
      if (d[k + 3] < 200) continue;
      alle++;
      tmp.setRGB(d[k] / 255, d[k + 1] / 255, d[k + 2] / 255, THREE.SRGBColorSpace);
      tmp.getHSL(hsl, THREE.SRGBColorSpace);
      if (hsl.s < 0.28 || hsl.l < 0.18 || hsl.l > 0.88) continue;
      r += d[k]; gr += d[k + 1]; bl += d[k + 2]; n++;
    }
    if (n > alle * 0.12) farbe = new THREE.Color(`rgb(${Math.round(r / n)},${Math.round(gr / n)},${Math.round(bl / n)})`);
  }
  lacke.set(name, farbe);
  return farbe;
}

/* Mittlere Farbe eines Bildes (nur deckende Punkte) */
const mittel = new Map();
function mittelFarbe(name) {
  if (mittel.has(name)) return mittel.get(name);
  const b = sprite(name);
  let farbe = new THREE.Color("#8a8f99");
  if (b) {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(b, 0, 0, 16, 16);
    const d = g.getImageData(0, 0, 16, 16).data;
    let r = 0, gr = 0, bl = 0, n = 0;
    for (let k = 0; k < d.length; k += 4) {
      if (d[k + 3] < 200) continue;
      r += d[k]; gr += d[k + 1]; bl += d[k + 2]; n++;
    }
    if (n) farbe = new THREE.Color(`rgb(${Math.round(r / n)},${Math.round(gr / n)},${Math.round(bl / n)})`);
  }
  mittel.set(name, farbe);
  return farbe;
}

/* Dachbilder aller Häuser in einem Atlas: ein Körper je Stück statt
   einer Zeichnung je Haus */
function atlasBauen() {
  const namen = Karte.GEBAEUDEBILDER.filter(n => sprite(n));
  const FELD = 192, SP = 16;
  const zeilen = Math.max(1, Math.ceil(namen.length / SP));
  const c = document.createElement("canvas");
  c.width = FELD * SP;
  c.height = FELD * zeilen;
  const g = c.getContext("2d");
  const uv = new Map();
  namen.forEach((n, k) => {
    const x = (k % SP) * FELD, y = Math.floor(k / SP) * FELD;
    g.fillStyle = "#" + mittelFarbe(n).getHexString();
    g.fillRect(x, y, FELD, FELD);
    g.drawImage(sprite(n), x, y, FELD, FELD);
    const r = 3;                                  // Rand gegen Übersprechen
    uv.set(n, {
      u0: (x + r) / c.width, u1: (x + FELD - r) / c.width,
      v1: 1 - (y + r) / c.height, v0: 1 - (y + FELD - r) / c.height
    });
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  atlas = { textur: t, uv,
            mat: new THREE.MeshLambertMaterial({ map: t }) };
}

/* Fassade: ein Fensterfeld, 4 m breit und 3,4 m hoch, wird gekachelt.
   Oben links bleibt ein Stück reine Wand — dorthin zeigen Dächer ohne
   Bild, dann färbt nur die Eckfarbe. */
let fassadeMat;
function fassadeBauen() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#dcd8d0";                        // Geschossband
  g.fillRect(0, 118, 128, 10);
  const verlauf = g.createLinearGradient(0, 30, 0, 100);
  verlauf.addColorStop(0, "#43577a");
  verlauf.addColorStop(1, "#1d2638");
  g.fillStyle = "#8a8578";                        // Fensterrahmen
  g.fillRect(24, 28, 80, 72);
  g.fillStyle = verlauf;
  g.fillRect(28, 32, 72, 64);
  g.fillStyle = "rgba(255,255,255,.18)";          // Spiegelung
  g.beginPath();
  g.moveTo(28, 96); g.lineTo(70, 32); g.lineTo(84, 32); g.lineTo(42, 96);
  g.fill();
  g.fillStyle = "#8a8578";
  g.fillRect(62, 32, 4, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  fassadeMat = new THREE.MeshLambertMaterial({ map: t, vertexColors: true });
}

/* ═══ Geometrie-Helfer ═══════════════════════════════════
   Ein Sammler für Vierecke: Position, Normale, UV, Farbe. Daraus wird
   am Ende ein einziger Körper. */
class Sammler {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; }
  /* a, b, c, d gegen den Uhrzeigersinn von außen gesehen */
  viereck(a, b, c, d, normale, uvs, farbe) {
    const ecken = [a, b, c, a, c, d];
    const uvE = [uvs[0], uvs[1], uvs[2], uvs[0], uvs[2], uvs[3]];
    for (let k = 0; k < 6; k++) {
      this.p.push(ecken[k][0], ecken[k][1], ecken[k][2]);
      this.n.push(normale[0], normale[1], normale[2]);
      this.uv.push(uvE[k][0], uvE[k][1]);
      this.c.push(farbe.r, farbe.g, farbe.b);
    }
  }
  leer() { return this.p.length === 0; }
  koerper() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return g;
  }
}

/* Wände eines Quaders (ohne Boden). x0..x1, z0..z1 in Metern.
   `seiten` sagt, welche Wände gebraucht werden: n, s, w, o. */
function waende(s, x0, z0, x1, z1, hoehe, farbe, seiten = "nswo") {
  const fu = 1 / 4, fv = 1 / 3.4;
  if (seiten.includes("s")) {                      // Süden: +z
    s.viereck([x0, 0, z1], [x1, 0, z1], [x1, hoehe, z1], [x0, hoehe, z1], [0, 0, 1],
      [[x0 * fu, 0], [x1 * fu, 0], [x1 * fu, hoehe * fv], [x0 * fu, hoehe * fv]], farbe);
  }
  if (seiten.includes("n")) {                      // Norden: −z
    s.viereck([x1, 0, z0], [x0, 0, z0], [x0, hoehe, z0], [x1, hoehe, z0], [0, 0, -1],
      [[x1 * fu, 0], [x0 * fu, 0], [x0 * fu, hoehe * fv], [x1 * fu, hoehe * fv]], farbe);
  }
  if (seiten.includes("o")) {                      // Osten: +x
    s.viereck([x1, 0, z1], [x1, 0, z0], [x1, hoehe, z0], [x1, hoehe, z1], [1, 0, 0],
      [[z1 * fu, 0], [z0 * fu, 0], [z0 * fu, hoehe * fv], [z1 * fu, hoehe * fv]], farbe);
  }
  if (seiten.includes("w")) {                      // Westen: −x
    s.viereck([x0, 0, z0], [x0, 0, z1], [x0, hoehe, z1], [x0, hoehe, z0], [-1, 0, 0],
      [[z0 * fu, 0], [z1 * fu, 0], [z1 * fu, hoehe * fv], [z0 * fu, hoehe * fv]], farbe);
  }
}

/* Dach als einfarbige Fläche — UV zeigt auf den reinen Wandfleck */
const WANDFLECK = [[0.02, 0.98], [0.03, 0.98], [0.03, 0.99], [0.02, 0.99]];
function dachFlach(s, x0, z0, x1, z1, hoehe, farbe) {
  s.viereck([x0, hoehe, z1], [x1, hoehe, z1], [x1, hoehe, z0], [x0, hoehe, z0], [0, 1, 0], WANDFLECK, farbe);
}

/* Bewegliche Teile (Deko, Autos) aus Grundformen zusammensetzen */
class Baukasten {
  constructor() { this.p = []; this.n = []; this.c = []; }
  teil(geo, farbe, matrix) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const pos = g.attributes.position, nor = g.attributes.normal;
    const nm = new THREE.Matrix3().getNormalMatrix(matrix);
    const v = new THREE.Vector3(), w = new THREE.Vector3();
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k).applyMatrix4(matrix);
      w.fromBufferAttribute(nor, k).applyMatrix3(nm).normalize();
      this.p.push(v.x, v.y, v.z);
      this.n.push(w.x, w.y, w.z);
      this.c.push(farbe.r, farbe.g, farbe.b);
    }
  }
  leer() { return this.p.length === 0; }
  koerper() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return g;
  }
}

const M4 = () => new THREE.Matrix4();
const setzen = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) =>
  M4().compose(new THREE.Vector3(x, y, z),
               new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
               new THREE.Vector3(sx, sy, sz));
const F = hex => new THREE.Color(hex);

/* Grundformen, einmal gebaut */
const FORM = {
  kasten: new THREE.BoxGeometry(1, 1, 1),
  rohr: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  rohrFein: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  kegel: new THREE.ConeGeometry(0.5, 1, 10),
  kugel: new THREE.IcosahedronGeometry(0.5, 1),
  blatt: new THREE.BoxGeometry(1, 0.04, 0.34)
};

/* ═══ Deko-Modelle ══════════════════════════════════════
   Jede Funktion setzt ihre Teile an (x, z) mit Drehung dreh. */
const DEKO = {
  palme(b, x, z, d, n) {
    const h = 6.5 + (n % 5) * 0.6;
    const neig = ((n % 7) - 3) * 0.035;
    for (let k = 0; k < 6; k++) {                  // leicht gebogener Stamm
      const t = k / 6;
      b.teil(FORM.rohr, F(k % 2 ? "#8a6a48" : "#7a5c3d"),
             setzen(x + neig * t * h * 3, t * h + h / 12, z, 0, 0.32 - t * 0.08, h / 6, 0.32 - t * 0.08));
    }
    const kx = x + neig * h * 3, ky = h + 0.2;
    for (let k = 0; k < 8; k++) {
      const w = (k / 8) * Math.PI * 2 + d;
      const m = M4().compose(
        new THREE.Vector3(kx + Math.cos(w) * 1.3, ky - 0.35, z + Math.sin(w) * 1.3),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -w, -0.45)),
        new THREE.Vector3(2.8, 1, 1.1));
      b.teil(FORM.blatt, F(k % 2 ? "#2f7d3b" : "#3e9a4a"), m);
    }
    b.teil(FORM.kugel, F("#5b4a2a"), setzen(kx, ky, z, 0, 0.6, 0.5, 0.6));
  },
  baum(b, x, z, d, n) {
    b.teil(FORM.rohr, F("#6b4e33"), setzen(x, 1.3, z, 0, 0.3, 2.6, 0.3));
    const r = 2.1 + (n % 4) * 0.3;
    b.teil(FORM.kugel, F("#3f8a3f"), setzen(x, 3.4, z, d, r * 1.6, r * 1.3, r * 1.6));
    b.teil(FORM.kugel, F("#4fa04a"), setzen(x + 0.6, 4.1, z - 0.3, d, r, r, r));
  },
  laterne(b, x, z) {
    b.teil(FORM.rohrFein, F("#2b2f38"), setzen(x, 3, z, 0, 0.14, 6, 0.14));
    b.teil(FORM.kasten, F("#2b2f38"), setzen(x, 5.9, z, 0, 1.1, 0.1, 0.1));
    b.teil(FORM.kasten, F("#fff2c8"), setzen(x + 0.5, 5.8, z, 0, 0.5, 0.12, 0.3));
  },
  hydrant(b, x, z) {
    b.teil(FORM.rohr, F("#d23a3a"), setzen(x, 0.4, z, 0, 0.32, 0.8, 0.32));
    b.teil(FORM.kugel, F("#d23a3a"), setzen(x, 0.82, z, 0, 0.34, 0.3, 0.34));
  },
  muelleimer(b, x, z) {
    b.teil(FORM.rohr, F("#3b5b44"), setzen(x, 0.5, z, 0, 0.55, 1, 0.55));
  },
  telefon(b, x, z, d) {
    b.teil(FORM.kasten, F("#c9ccd3"), setzen(x, 1.1, z, d, 0.8, 2.2, 0.8));
    b.teil(FORM.kasten, F("#2b64b0"), setzen(x, 2.25, z, d, 0.85, 0.2, 0.85));
  },
  haltestelle(b, x, z, d) {
    b.teil(FORM.kasten, F("#9fb6c9"), setzen(x, 1.2, z, d, 3.2, 2.4, 0.08));
    b.teil(FORM.kasten, F("#2b2f38"), setzen(x, 2.45, z, d, 3.4, 0.12, 1.4));
    b.teil(FORM.kasten, F("#6b4a33"), setzen(x, 0.5, z, d, 2.4, 0.1, 0.5));
  },
  container(b, x, z, d, n) {
    const f = ["#b3432f", "#2f6db3", "#3f8a55", "#c8912a"][n % 4];
    b.teil(FORM.kasten, F(f), setzen(x, 1.3, z, d, 6, 2.6, 2.4));
  },
  muellcontainer(b, x, z, d) {
    b.teil(FORM.kasten, F("#2f5a3a"), setzen(x, 0.7, z, d, 2, 1.4, 1.2));
  },
  stopp(b, x, z) {
    b.teil(FORM.rohrFein, F("#9aa0a8"), setzen(x, 1.2, z, 0, 0.08, 2.4, 0.08));
    b.teil(FORM.rohr, F("#c9252d"), setzen(x, 2.4, z, Math.PI / 8, 0.8, 0.06, 0.8));
  },
  strassenschild(b, x, z, d) {
    b.teil(FORM.rohrFein, F("#9aa0a8"), setzen(x, 1.5, z, 0, 0.08, 3, 0.08));
    b.teil(FORM.kasten, F("#1f6b3a"), setzen(x, 2.9, z, d, 1.2, 0.3, 0.05));
  },
  parkuhr(b, x, z) {
    b.teil(FORM.rohrFein, F("#6f7680"), setzen(x, 0.6, z, 0, 0.08, 1.2, 0.08));
    b.teil(FORM.kasten, F("#9aa0a8"), setzen(x, 1.3, z, 0, 0.25, 0.35, 0.2));
  },
  plakatwand(b, x, z, d) {
    b.teil(FORM.rohrFein, F("#6f7680"), setzen(x, 1.5, z, 0, 0.2, 3, 0.2));
    b.teil(FORM.kasten, F("#e8548c"), setzen(x, 3.6, z, d, 4, 2, 0.15));
  },
  stromkasten(b, x, z, d) {
    b.teil(FORM.kasten, F("#8d949c"), setzen(x, 0.6, z, d, 0.8, 1.2, 0.4));
  },
  schirm(b, x, z, d, n) {
    b.teil(FORM.rohrFein, F("#e8e2d0"), setzen(x, 1.1, z, 0, 0.06, 2.2, 0.06));
    b.teil(FORM.kegel, F(["#e63946", "#2a9d8f", "#f4a261", "#ff6fb5"][n % 4]),
           setzen(x, 2.3, z, d, 2.4, 0.6, 2.4));
  },
  turm(b, x, z, d) {
    for (const [ox, oz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
      b.teil(FORM.rohrFein, F("#e8e2d0"), setzen(x + ox, 1.2, z + oz, 0, 0.12, 2.4, 0.12));
    }
    b.teil(FORM.kasten, F("#e8e2d0"), setzen(x, 2.6, z, d, 2.2, 0.3, 2.2));
    b.teil(FORM.kasten, F("#e63946"), setzen(x, 3.6, z, d, 2, 1.6, 2));
  },
  zeitungsbox(b, x, z, d) {
    b.teil(FORM.kasten, F("#2f6db3"), setzen(x, 0.5, z, d, 0.5, 1, 0.45));
  },
  kuebel(b, x, z) {
    b.teil(FORM.rohr, F("#9a8d78"), setzen(x, 0.35, z, 0, 0.9, 0.7, 0.9));
    b.teil(FORM.kugel, F("#3fa052"), setzen(x, 0.9, z, 0, 0.9, 0.7, 0.9));
  },
  bank(b, x, z, d) {
    b.teil(FORM.kasten, F("#7a5a3a"), setzen(x, 0.45, z, d, 1.8, 0.08, 0.5));
    b.teil(FORM.kasten, F("#7a5a3a"), setzen(x, 0.8, z, d, 1.8, 0.5, 0.06));
    b.teil(FORM.kasten, F("#2b2f38"), setzen(x, 0.22, z, d, 1.6, 0.44, 0.4));
  },
  boot(b, x, z, d) {
    const y = WASSER_Y;
    b.teil(FORM.kasten, F("#f2f2ee"), setzen(x, y + 0.35, z, d, 5.2, 0.9, 2.0));
    b.teil(FORM.kasten, F("#1f6db3"), setzen(x, y + 0.05, z, d, 5.3, 0.25, 2.05));
    b.teil(FORM.kasten, F("#dfe6ee"), setzen(x - Math.cos(-d) * 0.4, y + 1.1, z - Math.sin(-d) * 0.4, d, 1.8, 0.7, 1.5));
  },
  segler(b, x, z, d) {
    const y = WASSER_Y;
    b.teil(FORM.kasten, F("#f5f1e6"), setzen(x, y + 0.35, z, d, 6, 0.8, 2.2));
    b.teil(FORM.rohrFein, F("#d9d4c8"), setzen(x, y + 4.5, z, 0, 0.12, 8, 0.12));
    b.teil(FORM.kasten, F("#ffffff"), setzen(x - Math.cos(-d) * 1.3, y + 4, z - Math.sin(-d) * 1.3, d, 2.6, 6, 0.04));
  },
  jetski(b, x, z, d) {
    const y = WASSER_Y;
    b.teil(FORM.kasten, F("#e8548c"), setzen(x, y + 0.25, z, d, 2.6, 0.5, 1.0));
    b.teil(FORM.kasten, F("#20232a"), setzen(x, y + 0.6, z, d, 1.0, 0.25, 0.6));
  },
  marktstand(b, x, z, d) {
    b.teil(FORM.kasten, F("#b98a5a"), setzen(x, 0.5, z, d, 2.4, 1, 1.2));
    b.teil(FORM.kasten, F("#e63946"), setzen(x, 2.3, z, d, 2.8, 0.1, 1.6));
  }
};

/* ═══ Stücke: Boden, Häuser, Deko, Ampeln ══════════════════ */
function stufeFuer(abstand) {
  if (abstand < 80) return 16;                     // Bildpunkte je Meter
  if (abstand < 180) return 5;
  return 2;
}

const HOEHE_BAU = b => {
  const BAU = Karte.BAU;
  if (b === BAU.TANKSTELLE) return 5;
  if (b === BAU.WAFFEN) return 6;
  if (b === BAU.CLUB) return 9;
  return 0;
};
const hausHoehe = h => HOEHE_BAU(h.bau) || 3.5 + Karte.hoeheVon(h.kx0 ?? h.x0, h.ky0 ?? h.y0) * 40;

const bodenMat = new Map();
function stueckBauen(cx, cy, stufe) {
  const schl = cx + "," + cy;
  let st = stuecke.get(schl);
  if (!st) {
    st = { cx, cy, gruppe: new THREE.Group(), stufe: 0, boden: null, fest: false };
    st.gruppe.userData.stueck = true;
    szene.add(st.gruppe);
    stuecke.set(schl, st);
  }
  /* Boden in der gewünschten Schärfe */
  const { leinwand, deko } = Karte.bodenStueck3d(cx, cy, stufe);
  const t = new THREE.CanvasTexture(leinwand);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = stufe >= 16 ? 8 : 2;
  if (st.boden) {
    st.boden.material.map.dispose();
    st.boden.material.map = t;
    st.boden.material.needsUpdate = true;
  } else {
    const m = new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5 });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(STUECK, STUECK), m);
    b.rotation.x = -Math.PI / 2;
    b.position.set(cx * STUECK + STUECK / 2, 0, cy * STUECK + STUECK / 2);
    b.receiveShadow = true;
    st.gruppe.add(b);
    st.boden = b;
  }
  st.stufe = stufe;
  /* Häuser, Deko und Ampeln nur einmal je Stück */
  if (!st.fest) {
    st.fest = true;
    hausKoerper(st);
    dekoKoerper(st, deko);
    ampelKoerper(st);
    uferKoerper(st);
  }
  return st;
}

function stueckWeg(st) {
  szene.remove(st.gruppe);
  st.gruppe.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && o.material.map && o.material !== atlas.mat && o.material.map !== fassadeMat.map) {
      o.material.map.dispose();
    }
    if (o.material && o.material !== atlas.mat && o.material !== fassadeMat && o.material !== dekoMat &&
        o.material !== ampelMat) o.material.dispose();
  });
  stuecke.delete(st.cx + "," + st.cy);
}

/* Häuser: Bildhäuser gehören dem Stück, in dem ihr Kern beginnt;
   Häuser ohne Bild werden kachelweise gebaut */
function hausKoerper(st) {
  const dach = new Sammler(), wand = new Sammler();
  const K = Karte.KACHEL;
  const tx0 = st.cx * Karte.STUECK_KACHELN, ty0 = st.cy * Karte.STUECK_KACHELN;
  const gesehen = new Set();
  for (let j = 0; j < Karte.STUECK_KACHELN; j++) {
    for (let k = 0; k < Karte.STUECK_KACHELN; k++) {
      const tx = tx0 + k, ty = ty0 + j;
      if (Karte.art(tx, ty) !== Karte.ART.GEBAEUDE) continue;
      const nr = Karte.hausNr(tx, ty);
      const h = Karte.haeuser[nr];
      if (!h) continue;
      const info = Karte.haus3d(h);
      if (info.bild && atlas.uv.has(info.bild)) {
        if (gesehen.has(nr)) continue;
        gesehen.add(nr);
        if (tx !== h.kx0 || ty !== h.ky0) {
          /* Kern beginnt in einem anderen Stück? Dann baut das dort */
          if (Math.floor(h.kx0 / Karte.STUECK_KACHELN) !== st.cx ||
              Math.floor(h.ky0 / Karte.STUECK_KACHELN) !== st.cy) continue;
        }
        const x0 = h.kx0 * K, z0 = h.ky0 * K, x1 = (h.kx1 + 1) * K, z1 = (h.ky1 + 1) * K;
        const hoch = hausHoehe(h);
        const farbe = mittelFarbe(info.bild).clone().lerp(F("#f2ece2"), 0.45);
        waende(wand, x0, z0, x1, z1, hoch, farbe);
        const u = atlas.uv.get(info.bild);
        const ecken = [[u.u0, u.v1], [u.u1, u.v1], [u.u1, u.v0], [u.u0, u.v0]];   // TL TR BR BL
        const d = ((info.dreh % 4) + 4) % 4;
        const bei = c => ecken[(c - d + 4) % 4];
        /* NW, NO, SO, SW — in dieser Reihenfolge bekommen sie die Bildecken */
        dach.viereck([x0, hoch, z1], [x1, hoch, z1], [x1, hoch, z0], [x0, hoch, z0], [0, 1, 0],
                     [bei(3), bei(2), bei(1), bei(0)], F("#ffffff"));
        continue;
      }
      if (info.bild) continue;
      /* Haus ohne Bild: diese Kachel als Säule, Wände nur nach außen */
      const hoch = hausHoehe({ bau: h.bau, kx0: tx, ky0: ty });
      const farbe = F(Karte.dachFarbe3d(tx, ty));
      const x0 = tx * K, z0 = ty * K, x1 = x0 + K, z1 = z0 + K;
      const anders = (ax, ay) => Karte.hausNr(ax, ay) !== nr || Karte.art(ax, ay) !== Karte.ART.GEBAEUDE;
      let seiten = "";
      if (anders(tx, ty - 1)) seiten += "n";
      if (anders(tx, ty + 1)) seiten += "s";
      if (anders(tx - 1, ty)) seiten += "w";
      if (anders(tx + 1, ty)) seiten += "o";
      waende(wand, x0, z0, x1, z1, hoch, farbe.clone().lerp(F("#f2ece2"), 0.35), seiten);
      dachFlach(wand, x0, z0, x1, z1, hoch, farbe);
    }
  }
  if (!wand.leer()) {
    const m = new THREE.Mesh(wand.koerper(), fassadeMat);
    m.castShadow = true; m.receiveShadow = true;
    st.gruppe.add(m);
  }
  if (!dach.leer()) {
    const m = new THREE.Mesh(dach.koerper(), atlas.mat);
    m.receiveShadow = true;
    st.gruppe.add(m);
  }
}

const dekoMat = new THREE.MeshLambertMaterial({ vertexColors: true });

/* Kaimauern, Geländer und Poller an jeder Kante zum Wasser */
function uferKoerper(st) {
  const A = Karte.ART, K = Karte.KACHEL;
  const mauer = new Sammler();
  const b = new Baukasten();
  const tx0 = st.cx * Karte.STUECK_KACHELN, ty0 = st.cy * Karte.STUECK_KACHELN;
  const TIEF = WASSER_Y - 0.6;
  for (let j = 0; j < Karte.STUECK_KACHELN; j++) {
    for (let k = 0; k < Karte.STUECK_KACHELN; k++) {
      const tx = tx0 + k, ty = ty0 + j;
      const a = Karte.art(tx, ty);
      if (a === A.WASSER) continue;
      const x0 = tx * K, z0 = ty * K, x1 = x0 + K, z1 = z0 + K;
      const farbe = a === A.STRAND ? F("#d8c08a") : a === A.BRUECKE ? F("#4a505a") : F("#a7a398");
      const gelaender = a !== A.STRAND && a !== A.GEBAEUDE && a !== A.HAFEN;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (Karte.art(tx + dx, ty + dy) !== A.WASSER) continue;
        /* senkrechte Mauer von der Kante hinunter ins Wasser */
        if (dx > 0) mauer.viereck([x1, TIEF, z1], [x1, TIEF, z0], [x1, 0, z0], [x1, 0, z1], [1, 0, 0], WANDFLECK, farbe);
        if (dx < 0) mauer.viereck([x0, TIEF, z0], [x0, TIEF, z1], [x0, 0, z1], [x0, 0, z0], [-1, 0, 0], WANDFLECK, farbe);
        if (dy > 0) mauer.viereck([x0, TIEF, z1], [x1, TIEF, z1], [x1, 0, z1], [x0, 0, z1], [0, 0, 1], WANDFLECK, farbe);
        if (dy < 0) mauer.viereck([x1, TIEF, z0], [x0, TIEF, z0], [x0, 0, z0], [x1, 0, z0], [0, 0, -1], WANDFLECK, farbe);
        /* Linie 0,3 m innerhalb der Kante, entlang der Kachel */
        const lx = dx > 0 ? x1 - 0.3 : dx < 0 ? x0 + 0.3 : (x0 + x1) / 2;
        const lz = dy > 0 ? z1 - 0.3 : dy < 0 ? z0 + 0.3 : (z0 + z1) / 2;
        const quer = dx !== 0;                         // Geländer läuft in z-Richtung
        if (gelaender) {
          b.teil(FORM.kasten, F("#2b2f38"), setzen(lx, 1.0, lz, 0, quer ? 0.06 : K, 0.06, quer ? K : 0.06));
          b.teil(FORM.kasten, F("#2b2f38"), setzen(lx, 0.55, lz, 0, quer ? 0.04 : K, 0.04, quer ? K : 0.04));
          for (let p = 0.5; p < K; p += 1) {
            b.teil(FORM.kasten, F("#2b2f38"),
                   setzen(quer ? lx : x0 + p, 0.5, quer ? z0 + p : lz, 0, 0.07, 1.0, 0.07));
          }
        } else if (a === A.HAFEN) {
          for (let p = 1; p < K; p += 2) {
            b.teil(FORM.rohr, F("#2c2f36"), setzen(quer ? lx : x0 + p, 0.3, quer ? z0 + p : lz, 0, 0.35, 0.6, 0.35));
          }
        }
      }
    }
  }
  if (!mauer.leer()) st.gruppe.add(new THREE.Mesh(mauer.koerper(), fassadeMat));
  if (!b.leer()) {
    const m = new THREE.Mesh(b.koerper(), dekoMat);
    m.castShadow = true;
    st.gruppe.add(m);
  }
}
function dekoKoerper(st, deko) {
  if (!deko.length) return;
  const b = new Baukasten();
  deko.forEach((d, k) => {
    const bau = DEKO[d.name];
    if (bau) bau(b, d.x, d.y, -(d.dreh || 0), Math.floor(Math.abs(d.x * 7 + d.y * 13)) + k);
  });
  if (b.leer()) return;
  const m = new THREE.Mesh(b.koerper(), dekoMat);
  m.castShadow = true;
  st.gruppe.add(m);
}

/* Ampeln: Mast als fester Körper, die Lampe als eigenes Stück, dessen
   Farbe jedes Bild zur Ampelphase passt */
const ampelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const LAMPE = new THREE.BoxGeometry(0.34, 0.9, 0.34);
function ampelKoerper(st) {
  const orte = Karte.ampelOrte3d(st.cx, st.cy);
  if (!orte.length) return;
  const b = new Baukasten();
  for (const o of orte) {
    b.teil(FORM.rohrFein, F("#2b2f38"), setzen(o.x, 2.4, o.y, 0, 0.16, 4.8, 0.16));
    /* Ausleger über die Straße */
    const w = Math.atan2(o.dy, o.dx);
    b.teil(FORM.kasten, F("#2b2f38"),
           setzen(o.x + Math.cos(w) * 1.6, 4.7, o.y + Math.sin(w) * 1.6, -w, 3.2, 0.14, 0.14));
    b.teil(FORM.kasten, F("#1a1c20"),
           setzen(o.x + Math.cos(w) * 3, 4.2, o.y + Math.sin(w) * 3, -w, 0.45, 1.1, 0.45));
  }
  const m = new THREE.Mesh(b.koerper(), dekoMat);
  m.castShadow = true;
  st.gruppe.add(m);
  const lampen = new THREE.InstancedMesh(LAMPE, ampelMat, orte.length);
  orte.forEach((o, k) => {
    const w = Math.atan2(o.dy, o.dx);
    lampen.setMatrixAt(k, setzen(o.x + Math.cos(w) * 3 - Math.cos(w) * 0.25, 4.2,
                                 o.y + Math.sin(w) * 3 - Math.sin(w) * 0.25, -w, 1.05, 0.34, 1.05));
    lampen.setColorAt(k, F("#ff3040"));
  });
  st.lampen = lampen;
  st.ampeln = orte;
  st.gruppe.add(lampen);
}

const ROT = F("#ff3040"), GELB = F("#ffc53a"), GRUEN = F("#34e07a");
function ampelnFaerben(st, zeit) {
  if (!st.lampen) return;
  st.ampeln.forEach((o, k) => {
    const phase = Karte.ampelPhase(o.tx, o.ty, zeit);
    const gruen = o.senkrecht ? phase === "ns" : phase === "ow";
    const gelb = o.senkrecht ? phase === "ns-gelb" : phase === "ow-gelb";
    st.lampen.setColorAt(k, gruen ? GRUEN : gelb ? GELB : ROT);
  });
  st.lampen.instanceColor.needsUpdate = true;
}

/* Welche Stücke werden gebraucht? Nahe zuerst, höchstens ein paar je Bild. */
function stueckePflegen(px, pz, alles = false, weite = SICHT) {
  const r = Math.ceil(weite / STUECK);
  const pcx = Math.floor(px / STUECK), pcy = Math.floor(pz / STUECK);
  const liste = [];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const cx = pcx + dx, cy = pcy + dy;
      if (cx < 0 || cy < 0 || cx * STUECK >= Karte.BREITE * Karte.KACHEL ||
          cy * STUECK >= Karte.HOEHE * Karte.KACHEL) continue;
      const mx = cx * STUECK + STUECK / 2, mz = cy * STUECK + STUECK / 2;
      const d = Math.hypot(mx - px, mz - pz);
      if (d > weite) continue;
      const st = stuecke.get(cx + "," + cy);
      const soll = stufeFuer(d);
      if (!st || st.stufe !== soll) liste.push({ cx, cy, d, soll });
    }
  }
  liste.sort((a, b) => a.d - b.d);
  /* Ein feines Stück kostet viel mehr als ein grobes — danach richtet
     sich, wie viele in ein Bild passen */
  let budget = alles ? Infinity : 6;
  for (const e of liste) {
    if (budget <= 0) break;
    stueckBauen(e.cx, e.cy, e.soll);
    budget -= e.soll >= 16 ? 4 : e.soll >= 5 ? 1.5 : 0.7;
  }
  /* Weit weg: abräumen */
  for (const st of [...stuecke.values()]) {
    const d = Math.hypot(st.cx * STUECK + STUECK / 2 - px, st.cy * STUECK + STUECK / 2 - pz);
    if (d > SICHT + 70) stueckWeg(st);
  }
}

/* ═══ Autos ════════════════════════════════════════════════ */
const autoTeile = new WeakMap();
const HOHE_WAGEN = new Set(["bus", "transporter", "krankenwagen", "feuerwehr", "muellwagen",
  "kipper", "loeschzug", "rettungswagen", "polizei_bus", "nachrichten", "surfbus",
  "abschlepper", "abschlepp_gelb", "feuer_pickup"]);
const RAD = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12);
const radMat = new THREE.MeshLambertMaterial({ color: "#1c1d21" });
const glasMat = new THREE.MeshLambertMaterial({ color: "#1d2740" });
const lichtVorn = new THREE.MeshBasicMaterial({ color: "#fff4d6" });
const lichtHinten = new THREE.MeshBasicMaterial({ color: "#ff2a3a" });
const blauMat = new THREE.MeshBasicMaterial({ color: "#2a6cff" });
const rotMat = new THREE.MeshBasicMaterial({ color: "#ff2a3a" });
const lackMats = new Map();
const dachMats = new Map();

function autoModell(a) {
  const typ = a.typ;
  const d = TYPEN[typ] || TYPEN.limo;
  const L = d.lang, B = d.breit;
  const hoch = HOHE_WAGEN.has(typ);
  const g = new THREE.Group();
  const lackName = "auto_" + typ;
  let lack = lackMats.get(typ);
  if (!lack) {
    lack = new THREE.MeshLambertMaterial({ color: lackFarbe(lackName) });
    lackMats.set(typ, lack);
  }
  const unten = 0.32;
  const rumpfH = hoch ? 2.0 : 0.72;
  /* Unterbau */
  const rumpf = new THREE.Mesh(new THREE.BoxGeometry(L, rumpfH, B), lack);
  rumpf.position.y = unten + rumpfH / 2;
  rumpf.castShadow = true;
  g.add(rumpf);
  /* Kabine: bei Limousinen kürzer und schmaler, mit Glas rundum */
  let dachY = unten + rumpfH;
  if (!hoch) {
    const kabL = L * 0.52, kabH = 0.58;
    const kab = new THREE.Mesh(new THREE.BoxGeometry(kabL, kabH, B * 0.84), glasMat);
    kab.position.set(-L * 0.05, dachY + kabH / 2, 0);
    kab.castShadow = true;
    g.add(kab);
    dachY += kabH;
  } else {
    const band = new THREE.Mesh(new THREE.BoxGeometry(L * 0.96, 0.55, B + 0.02), glasMat);
    band.position.set(0, unten + rumpfH - 0.5, 0);
    g.add(band);
  }
  /* Oben: das Autobild, auf die Wagengröße zugeschnitten */
  const tex = textur(lackName);
  if (tex) {
    let dm = dachMats.get(typ);
    if (!dm) {
      dm = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.35 });
      dachMats.set(typ, dm);
    }
    const bildB = B * 1.34;
    const img = tex.image;
    const bildL = bildB * (img.height / img.width);
    const geo = new THREE.PlaneGeometry(1, 1);
    /* Bild zeigt nach oben (Norden) — die Wagenspitze ist lokal +x */
    const uv = geo.attributes.uv;
    const fu = (1 - B / bildB) / 2, fv = (1 - L / bildL) / 2;
    const u0 = fu, u1 = 1 - fu, v0 = fv, v1 = 1 - fv;
    /* Ebene liegt nach dem Kippen in x/z: Ecke (−,+)=hinten links … */
    uv.setXY(0, u0, v0); uv.setXY(1, u0, v1); uv.setXY(2, u1, v0); uv.setXY(3, u1, v1);
    const oben = new THREE.Mesh(geo, dm);
    oben.rotation.x = -Math.PI / 2;
    oben.scale.set(L, B, 1);
    oben.position.y = dachY + 0.01;
    g.add(oben);
  }
  /* Räder */
  for (const [ox, oz] of [[L * 0.32, B * 0.46], [L * 0.32, -B * 0.46], [-L * 0.32, B * 0.46], [-L * 0.32, -B * 0.46]]) {
    const r = new THREE.Mesh(RAD, radMat);
    r.rotation.x = Math.PI / 2;
    r.position.set(ox, 0.36, oz);
    g.add(r);
  }
  /* Lichter */
  for (const s of [-1, 1]) {
    const v = new THREE.Mesh(FORM.kasten, lichtVorn);
    v.scale.set(0.06, 0.16, 0.36);
    v.position.set(L / 2 + 0.01, unten + 0.42, s * B * 0.32);
    g.add(v);
    const h = new THREE.Mesh(FORM.kasten, lichtHinten);
    h.scale.set(0.06, 0.16, 0.36);
    h.position.set(-L / 2 - 0.01, unten + 0.42, s * B * 0.32);
    g.add(h);
  }
  /* Blaulicht für Polizei und Rettung */
  if (d.polizei || /kranken|rettung|notarzt|feuer|loesch/.test(typ)) {
    const bl = new THREE.Mesh(FORM.kasten, blauMat);
    bl.scale.set(0.3, 0.14, 0.4);
    bl.position.set(-L * 0.05, dachY + 0.08, -0.3);
    const rt = new THREE.Mesh(FORM.kasten, d.polizei ? rotMat : blauMat);
    rt.scale.set(0.3, 0.14, 0.4);
    rt.position.set(-L * 0.05, dachY + 0.08, 0.3);
    g.add(bl, rt);
    g.userData.blink = [bl, rt];
  }
  g.userData.typ = typ;
  szene.add(g);
  return g;
}

function autosZeigen(liste, jetzt, genutzt, zx, zz) {
  for (const a of liste) {
    if (Math.abs(a.x - zx) > 200 || Math.abs(a.y - zz) > 200) continue;
    let g = autoTeile.get(a);
    if (!g || g.userData.typ !== a.typ) {
      if (g) szene.remove(g);
      g = autoModell(a);
      autoTeile.set(a, g);
    }
    g.visible = true;
    g.position.set(a.x, 0, a.y);
    g.rotation.y = -a.winkel;
    if (g.userData.blink) {
      const an = Math.floor(jetzt * 6) % 2 === 0;
      g.userData.blink[0].visible = an;
      g.userData.blink[1].visible = !an;
    }
    genutzt.add(g);
  }
}

/* ═══ Figuren als Aufsteller ════════════════════════════════ */
const figurTeile = new WeakMap();
const AUFSTELLER = new THREE.PlaneGeometry(1, 1);
AUFSTELLER.translate(0, 0.5, 0);                  // Fußpunkt unten
const SCHATTEN = new THREE.CircleGeometry(0.42, 16);
SCHATTEN.rotateX(-Math.PI / 2);
const schattenMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3,
                                                  depthWrite: false });
const ringMat = new THREE.MeshBasicMaterial({ color: "#ff78a8", transparent: true, opacity: 0.9,
                                              depthWrite: false });
const RING = new THREE.RingGeometry(0.5, 0.62, 28);
RING.rotateX(-Math.PI / 2);

/* Welches Bild zeigt die Figur, von der Kamera aus gesehen? */
function figurBild(f) {
  const vier = !!sprite(`${f.art}_vorn0`);
  let rel = f.winkel - kam.gier;
  while (rel > Math.PI) rel -= Math.PI * 2;
  while (rel < -Math.PI) rel += Math.PI * 2;
  const a = Math.abs(rel);
  const richtung = a < Math.PI / 4 ? "hinten" : a > (3 * Math.PI) / 4 ? "vorn"
                 : rel > 0 ? "rechts" : "links";
  if (vier) {
    const schritt = f.schrittweite || 0.55;
    const pose = f.tempo < 0.35 ? 0 : LAUF_POSEN[Math.floor(f.strecke / schritt) % 4];
    return { name: `${f.art}_${richtung}${pose}`, spiegeln: false };
  }
  if (richtung === "hinten") return { name: `${f.art}_hinten`, spiegeln: false };
  if (richtung === "vorn") return { name: `${f.art}_steht`, spiegeln: false };
  return { name: `${f.art}_links`, spiegeln: richtung === "rechts" };
}

let helligkeit = 1;
function figurZeigen(f, genutzt, markiert) {
  let t = figurTeile.get(f);
  if (!t) {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    const tafel = new THREE.Mesh(AUFSTELLER, mat);
    const schatten = new THREE.Mesh(SCHATTEN, schattenMat);
    const g = new THREE.Group();
    g.add(tafel, schatten);
    szene.add(g);
    t = { g, tafel, schatten, ring: null, name: "" };
    figurTeile.set(f, t);
  }
  t.g.visible = true;
  t.g.position.set(f.x, 0, f.y);
  genutzt.add(t.g);

  const liegt = f.tot || f.ko > 0;
  const wahl = liegt ? { name: `${f.art}_steht`, spiegeln: false } : figurBild(f);
  if (wahl.name !== t.name) {
    const tex = textur(wahl.name) || textur(`${f.art}_steht`);
    if (tex) {
      t.tafel.material.map = tex;
      t.tafel.material.needsUpdate = true;
      const img = tex.image;
      t.w = (img.width / 64) * (f.faktor || 1);
      t.h = (img.height / 64) * (f.faktor || 1);
    }
    t.name = wahl.name;
  }
  if (!t.w) return;
  t.tafel.material.color.setScalar(f.tot ? helligkeit * 0.7 : helligkeit);
  if (liegt) {
    t.tafel.rotation.set(-Math.PI / 2, 0, -kam.gier);
    t.tafel.position.set(0, 0.05, 0);
    t.tafel.scale.set(t.w, t.h, 1);
  } else {
    /* Zur Kamera drehen, nur um die Hochachse */
    t.tafel.rotation.set(0, Math.atan2(kamera.position.x - f.x, kamera.position.z - f.y), 0);
    t.tafel.position.set(0, (f.hoch || 0) - t.h * 0.04, 0);
    t.tafel.scale.set(wahl.spiegeln ? -t.w : t.w, t.h, 1);
  }
  t.schatten.position.y = 0.03;
  if (markiert && !t.ring) {
    t.ring = new THREE.Mesh(RING, ringMat);
    t.ring.position.y = 0.04;
    t.g.add(t.ring);
  }
  if (t.ring) t.ring.visible = !!markiert;
}

/* ═══ Leuchtsäulen: Aufträge, Türen, Ziele ═══════════════════ */
const saeulenGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
saeulenGeo.translate(0, 0.5, 0);
const saeulenTex = (() => {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 64;
  const g = c.getContext("2d");
  const v = g.createLinearGradient(0, 0, 0, 64);
  v.addColorStop(0, "rgba(255,255,255,0)");
  v.addColorStop(1, "rgba(255,255,255,1)");
  g.fillStyle = v;
  g.fillRect(0, 0, 4, 64);
  return new THREE.CanvasTexture(c);
})();
const saeulen = [];
let saeulenNr = 0;
function saeule(x, z, r, hoehe, farbe) {
  let m = saeulen[saeulenNr];
  if (!m) {
    m = new THREE.Mesh(saeulenGeo, new THREE.MeshBasicMaterial({
      map: saeulenTex, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending }));
    szene.add(m);
    saeulen.push(m);
  }
  saeulenNr++;
  m.visible = true;
  m.position.set(x, 0.02, z);
  m.scale.set(r, hoehe, r);
  m.material.color.set(farbe);
}

/* ═══ Schüsse ═══════════════════════════════════════════════ */
const schussMat = new THREE.LineBasicMaterial({ color: "#ffe296", transparent: true });
let schussLinien = null;
function schuesseZeigen(strahlen) {
  if (!schussLinien) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6 * 40), 3));
    schussLinien = new THREE.LineSegments(g, schussMat);
    schussLinien.frustumCulled = false;
    szene.add(schussLinien);
  }
  const pos = schussLinien.geometry.attributes.position;
  let n = 0;
  for (const s of strahlen.slice(0, 40)) {
    pos.setXYZ(n++, s.x1, 1.25, s.y1);
    pos.setXYZ(n++, s.x2, 1.1, s.y2);
  }
  schussLinien.geometry.setDrawRange(0, n);
  pos.needsUpdate = true;
  schussLinien.visible = n > 0;
}

/* ═══ Kamera ════════════════════════════════════════════════ */
function kameraRechnen(spieler, dt) {
  const auto = spieler.imAuto;
  const ziel = auto || spieler;
  kam.frei += dt;
  if (auto) {
    /* Hinter dem Wagen einschwenken, sobald man nicht selbst schaut */
    const tempo = Math.hypot(auto.vx, auto.vy);
    const rueck = auto.tempo < -1;
    const soll = rueck ? auto.winkel : auto.winkel;
    if (kam.frei > 1.2 && tempo > 0.5) kam.gier = winkelNach(kam.gier, soll, dt * 2.6);
    kam.abstand += ((7.5 + Math.min(4, tempo * 0.12)) - kam.abstand) * Math.min(1, dt * 2);
    if (kam.frei > 1.2) kam.neigung += (0.3 - kam.neigung) * Math.min(1, dt * 2);
  } else {
    kam.abstand += (4.6 - kam.abstand) * Math.min(1, dt * 3);
    /* Ohne Maus (Handy, noch nicht eingefangen) läuft die Kamera der
       Figur langsam nach */
    if (!kam.gefangen && kam.frei > 0.6 && spieler.tempo > 0.8) {
      kam.gier = winkelNach(kam.gier, spieler.winkel, dt * 1.4);
    }
  }
  const zielHoehe = auto ? 1.3 : 1.55;
  const vx = Math.cos(kam.gier), vz = Math.sin(kam.gier);
  const flach = Math.cos(kam.neigung), steil = Math.sin(kam.neigung);
  /* Schulterblick: zu Fuß etwas rechts versetzt */
  const schulter = auto ? 0 : 0.55;
  const qx = -vz, qz = vx;
  const zx = ziel.x + qx * schulter, zz = ziel.y + qz * schulter;
  /* Wand im Weg? Dann näher heran */
  let abstand = kam.abstand;
  for (let s = 1; s <= abstand; s += 0.5) {
    const px = zx - vx * s * flach, pz = zz - vz * s * flach;
    const py = zielHoehe + steil * s;
    if (Karte.festAnPunkt(px, pz) && py < 30) { abstand = Math.max(1.4, s - 0.6); break; }
  }
  const cx = zx - vx * abstand * flach;
  const cz = zz - vz * abstand * flach;
  const cy = Math.max(0.6, zielHoehe + steil * abstand);
  const k = Math.min(1, dt * (auto ? 9 : 14));
  kam.x += (cx - kam.x) * k;
  kam.y += (cy - kam.y) * k;
  kam.z += (cz - kam.z) * k;
  kamera.position.set(kam.x, kam.y, kam.z);
  kamera.lookAt(zx + vx * (auto ? 4 : 1.2), zielHoehe + (auto ? 0 : 0.1), zz + vz * (auto ? 4 : 1.2));
}

function winkelNach(ist, soll, k) {
  let d = soll - ist;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return ist + d * Math.min(1, k);
}

/* Beim Start oder Figurwechsel sofort an Ort und Stelle */
export function kameraSetzen(spieler) {
  const ziel = spieler.imAuto || spieler;
  kam.gier = ziel.winkel || -Math.PI / 2;
  kam.x = ziel.x - Math.cos(kam.gier) * 6;
  kam.z = ziel.y - Math.sin(kam.gier) * 6;
  kam.y = 3;
  /* Beim Start nur die Umgebung — der Rest entsteht in den ersten
     Sekunden nebenbei, der Nebel verdeckt es */
  stueckePflegen(ziel.x, ziel.y, true, 110);
}

/* ═══ Tag und Nacht ═════════════════════════════════════════ */
let nachtWar = null;
function licht(nacht) {
  if (nacht === nachtWar) return;
  nachtWar = nacht;
  const u = himmelKugel.material.uniforms;
  if (nacht) {
    himmel.set("#141a36");
    u.oben.value.set("#05070f"); u.mitte.value.set("#1b1f45"); u.unten.value.set("#2a2352");
    halbkugel.intensity = 0.45; sonne.intensity = 0.25; sonne.color.set("#8fa6ff");
    helligkeit = 0.55;
    renderer.toneMappingExposure = 0.9;
  } else {
    himmel.set("#f6b38a");
    u.oben.value.set("#3d5fae"); u.mitte.value.set("#e48aa0"); u.unten.value.set("#f6b38a");
    halbkugel.intensity = 1.35; sonne.intensity = 2.3; sonne.color.set("#ffe2bd");
    helligkeit = 1;
    renderer.toneMappingExposure = 1.05;
  }
  szene.fog.color.copy(himmel);
}

/* ═══ Ein Bild ══════════════════════════════════════════════ */
export function zeichnen(zustand, spieler, dt) {
  if (!bereit) return;
  licht(!!(zustand.cheats && zustand.cheats.nacht));
  kameraRechnen(spieler, dt);
  const ziel = spieler.imAuto || spieler;
  stueckePflegen(ziel.x, ziel.y);

  /* Sonne wandert mit, damit die Schatten um den Spieler herum liegen */
  sonne.position.set(ziel.x - 60, 110, ziel.y + 40);
  sonne.target.position.set(ziel.x, 0, ziel.y);
  himmelKugel.position.copy(kamera.position);
  if (wasser) {
    const n = wasser.material.normalMap;
    n.offset.x = (zustand.zeit * 0.012) % 1;
    n.offset.y = (zustand.zeit * 0.007) % 1;
  }

  const zeit = zustand.zeit * 1000;
  for (const st of stuecke.values()) {
    const d = Math.hypot(st.cx * STUECK + STUECK / 2 - ziel.x, st.cy * STUECK + STUECK / 2 - ziel.y);
    if (d < 120) ampelnFaerben(st, zeit);
  }

  const genutzt = new Set();
  const alleAutos = zustand.autos.concat(zustand.verkehr, zustand.fahndung.streifen);
  autosZeigen(alleAutos, zustand.zeit, genutzt, ziel.x, ziel.y);

  for (const p of zustand.passanten) {
    if (Math.abs(p.x - ziel.x) > 130 || Math.abs(p.y - ziel.y) > 130) continue;
    figurZeigen(p, genutzt, false);
  }
  for (const p of zustand.fahndung.polizisten) figurZeigen(p, genutzt, false);
  for (const name of Object.keys(zustand.figuren)) {
    const f = zustand.figuren[name];
    if (f.imAuto) continue;
    if (zustand.drinnen && name === zustand.aktiv) continue;
    figurZeigen(f, genutzt, name === zustand.aktiv);
  }

  /* Leuchtsäulen: Aufträge gelb, Ziele blau, Türen in ihrer Farbe */
  saeulenNr = 0;
  const nah = o => Math.abs(o.x - ziel.x) < 160 && Math.abs(o.y - ziel.y) < 160;
  for (const m of zustand.missionen.marken()) {
    if (!nah(m)) continue;
    saeule(m.x, m.y, m.art === "ziel" ? 3.2 : 1.6, m.art === "ziel" ? 9 : 6,
           m.art === "ziel" ? "#39d4ff" : "#ffd24a");
  }
  for (const t of zustand.clubTueren) if (nah(t)) saeule(t.x, t.y, 0.9, 2.6, "#ff4aa0");
  for (const t of zustand.laeden) if (nah(t)) saeule(t.x, t.y, 0.9, 2.6, "#6ee7a0");
  for (const t of zustand.tueren) if (nah(t)) saeule(t.x, t.y, 0.9, 2.6, `rgb(${t.farbe})`);
  if (zustand.wegpunkt && nah(zustand.wegpunkt)) {
    saeule(zustand.wegpunkt.x, zustand.wegpunkt.y, 2, 40, "#c77dff");
  }
  for (let k = saeulenNr; k < saeulen.length; k++) saeulen[k].visible = false;

  schuesseZeigen(zustand.strahlen);

  /* Autos und Figuren, die dieses Bild nicht vorkamen, ausblenden */
  for (const o of szene.children) {
    if (o.isGroup && !o.userData.stueck && !genutzt.has(o)) o.visible = false;
  }

  renderer.render(szene, kamera);
}

/* Blickrichtung für Steuerung und Zielen */
export const gier = () => kam.gier;
