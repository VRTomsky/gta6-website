/* ═══════════════════════════════════════════════════════════
   Vice City — Browser-Spiel, Hauptschleife

   Aufbau:
     karte.js      die Stadt (Kacheln, Kollision, Zeichnen)
     bilder.js     Sprites laden und gedreht malen
     wesen.js      Figuren zu Fuß
     fahrzeug.js   Autos und Fahrmodell
     spiel.js      Eingabe, Kamera, Schleife, Anzeige  ← diese Datei

   Steuerung: WASD/Pfeile fahren und laufen, Umschalt rennen,
   E ein- und aussteigen, Leertaste Handbremse, Tab Figur wechseln,
   P pausieren.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import * as Bilder from "./bilder.js";
import { Figur } from "./wesen.js";
import { Fahrzeug, autosVerteilen, TYPEN } from "./fahrzeug.js";

const EN = (window.LANG || document.documentElement.lang || "de").startsWith("en");
const L = (de, en) => (EN ? en : de);

const leinwand = document.getElementById("spielFeld");
const ctx = leinwand.getContext("2d", { alpha: false });
const hud = {
  figur: document.querySelector("[data-hud=figur]"),
  tempo: document.querySelector("[data-hud=tempo]"),
  ort: document.querySelector("[data-hud=ort]"),
  hinweis: document.querySelector("[data-hud=hinweis]")
};
const start = document.getElementById("spielStart");
const pauseFeld = document.getElementById("spielPause");

const kamera = { x: Karte.START.x, y: Karte.START.y, zoom: 30, breite: 0, hoehe: 0 };
const ZOOM_ZU_FUSS = 30, ZOOM_AUTO = 24;

const zustand = {
  laeuft: false,
  pause: false,
  figuren: {
    lucia: new Figur("lucia", Karte.START.x, Karte.START.y),
    jason: new Figur("jason", Karte.START.x + 6, Karte.START.y + 3)
  },
  aktiv: "lucia",
  autos: [],
  zeit: 0
};

const spieler = () => zustand.figuren[zustand.aktiv];

/* ── Eingabe ─────────────────────────────────────────────── */
const tasten = new Set();
const TASTE = {
  hoch: ["KeyW", "ArrowUp"], runter: ["KeyS", "ArrowDown"],
  links: ["KeyA", "ArrowLeft"], rechts: ["KeyD", "ArrowRight"]
};
const gedrueckt = liste => liste.some(t => tasten.has(t));

addEventListener("keydown", e => {
  if (!zustand.laeuft) return;
  /* Pfeiltasten und Leertaste sollen die Seite nicht scrollen */
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Tab"].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  tasten.add(e.code);
  if (e.code === "KeyE") einUndAussteigen();
  if (e.code === "Tab") figurWechseln();
  if (e.code === "KeyP" || e.code === "Escape") pauseUmschalten();
});
addEventListener("keyup", e => tasten.delete(e.code));
addEventListener("blur", () => tasten.clear());

/* ── Spielwelt aufbauen ──────────────────────────────────── */
function weltBauen() {
  zustand.autos = autosVerteilen(30, Karte.START.x, Karte.START.y, 110);
  /* Ein Wagen steht auf der Straße direkt neben dem Start */
  const nah = Karte.freierPunkt(Karte.START.x, Karte.START.y, [Karte.ART.STRASSE], 7);
  const senkrecht = Math.abs(nah.x - Karte.START.x) > Math.abs(nah.y - Karte.START.y);
  zustand.autos.push(new Fahrzeug("cabrio", nah.x, nah.y, senkrecht ? -Math.PI / 2 : 0));
}

/* ── Ein- und Aussteigen ─────────────────────────────────── */
function einUndAussteigen() {
  const f = spieler();
  if (f.imAuto) {
    const auto = f.imAuto;
    const seite = { x: -Math.sin(auto.winkel), y: Math.cos(auto.winkel) };
    const px = auto.x + seite.x * (auto.daten.breit / 2 + 0.6);
    const py = auto.y + seite.y * (auto.daten.breit / 2 + 0.6);
    f.x = px; f.y = py;
    f.vx = auto.vx * 0.2; f.vy = auto.vy * 0.2;
    f.imAuto = null;
    auto.fahrer = null;
    hinweis(L("Ausgestiegen", "Out of the car"));
    return;
  }
  let naechstes = null, beste = 4.2;
  for (const a of zustand.autos) {
    if (a.fahrer) continue;
    const d = Math.hypot(a.x - f.x, a.y - f.y);
    if (d < beste) { beste = d; naechstes = a; }
  }
  if (naechstes) {
    f.imAuto = naechstes;
    naechstes.fahrer = f;
    hinweis(naechstes.daten.name);
  } else {
    hinweis(L("Kein Auto in der Nähe", "No car nearby"));
  }
}

function figurWechseln() {
  zustand.aktiv = zustand.aktiv === "lucia" ? "jason" : "lucia";
  const f = spieler();
  hinweis(L("Jetzt spielst du ", "Now playing as ") + f.daten.name);
  hud.figur.textContent = f.daten.name;
  /* Die andere Figur bleibt stehen, wo sie war — auch im Auto. */
}

let hinweisZeit = 0;
function hinweis(text) {
  hud.hinweis.textContent = text;
  hud.hinweis.classList.add("is-an");
  hinweisZeit = 2.6;
}

/* ── Kamera und Größe ───────────────────────────────────── */
function groesseAnpassen() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const b = leinwand.clientWidth, h = leinwand.clientHeight;
  leinwand.width = Math.round(b * dpr);
  leinwand.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  kamera.breite = b;
  kamera.hoehe = h;
}
addEventListener("resize", groesseAnpassen);

function kameraFolgen(dt) {
  const f = spieler();
  const ziel = f.imAuto || f;
  /* etwas voraussehen, damit man beim Fahren die Straße sieht */
  const vx = ziel.vx || 0, vy = ziel.vy || 0;
  const zx = ziel.x + vx * 0.45, zy = ziel.y + vy * 0.45;
  const k = Math.min(1, dt * (f.imAuto ? 3.6 : 6));
  kamera.x += (zx - kamera.x) * k;
  kamera.y += (zy - kamera.y) * k;

  const zielZoom = f.imAuto
    ? ZOOM_AUTO - Math.min(7, f.imAuto.kmh * 0.09)
    : ZOOM_ZU_FUSS;
  kamera.zoom += (zielZoom - kamera.zoom) * Math.min(1, dt * 2.2);
}

/* ── Ortsnamen für die Anzeige ──────────────────────────── */
function ortsname(x, y) {
  const tx = Karte.inKachel(x), ty = Karte.inKachel(y);
  if (tx >= 186) return L("Ocean Drive", "Ocean Drive");
  if (tx < 26 && ty > Karte.HOEHE - 30) return L("Hafen", "Docks");
  if (ty < 45) return L("Nord-Vice City", "North Vice City");
  if (ty > 140) return L("Süd-Vice City", "South Vice City");
  if (tx < 60) return L("Westufer", "West Bank");
  if (tx > 150) return L("Strandviertel", "Beach District");
  return L("Innenstadt", "Downtown");
}

/* ── Schleife ───────────────────────────────────────────── */
let letzte = 0;
function schleife(jetzt) {
  if (!zustand.laeuft) return;
  requestAnimationFrame(schleife);
  const dt = Math.min(0.05, (jetzt - letzte) / 1000 || 0);
  letzte = jetzt;
  if (zustand.pause) return;

  zustand.zeit += dt;
  rechnen(dt);
  zeichnen();
}

function rechnen(dt) {
  const f = spieler();
  const vor = (gedrueckt(TASTE.hoch) ? 1 : 0) - (gedrueckt(TASTE.runter) ? 1 : 0);
  const quer = (gedrueckt(TASTE.rechts) ? 1 : 0) - (gedrueckt(TASTE.links) ? 1 : 0);

  if (f.imAuto) {
    f.imAuto.fahren(vor, quer, tasten.has("Space"), dt);
    f.x = f.imAuto.x;
    f.y = f.imAuto.y;
    f.winkel = f.imAuto.winkel;
  } else {
    f.bewegen(quer, -vor, tasten.has("ShiftLeft") || tasten.has("ShiftRight"), dt);
  }

  /* Die zweite Figur bleibt stehen, rollt aber im Auto aus */
  for (const name of Object.keys(zustand.figuren)) {
    if (name === zustand.aktiv) continue;
    const andere = zustand.figuren[name];
    if (andere.imAuto) {
      andere.imAuto.fahren(0, 0, false, dt);
      andere.x = andere.imAuto.x;
      andere.y = andere.imAuto.y;
    }
  }

  kameraFolgen(dt);

  if (hinweisZeit > 0) {
    hinweisZeit -= dt;
    if (hinweisZeit <= 0) hud.hinweis.classList.remove("is-an");
  }

  hud.tempo.textContent = f.imAuto
    ? Math.round(f.imAuto.kmh) + " km/h"
    : (f.tempo > 5 ? L("rennt", "running") : f.tempo > 0.4 ? L("geht", "walking") : L("steht", "standing"));
  hud.ort.textContent = ortsname(f.x, f.y);
}

function zeichnen() {
  ctx.fillStyle = "#0b1124";
  ctx.fillRect(0, 0, kamera.breite, kamera.hoehe);
  Karte.zeichnen(ctx, kamera, zustand.zeit * 1000);

  /* Nur zeichnen, was im Bild liegt */
  const rand = 8;
  const sichtbar = o => Math.abs(o.x - kamera.x) < kamera.breite / kamera.zoom / 2 + rand &&
                        Math.abs(o.y - kamera.y) < kamera.hoehe / kamera.zoom / 2 + rand;

  for (const a of zustand.autos) if (sichtbar(a)) a.zeichnen(ctx, kamera);
  for (const name of Object.keys(zustand.figuren)) {
    const f = zustand.figuren[name];
    if (sichtbar(f)) f.zeichnen(ctx, kamera);
  }

  /* Hinweisring um Autos, in die man einsteigen kann */
  const f = spieler();
  if (!f.imAuto) {
    for (const a of zustand.autos) {
      if (a.fahrer) continue;
      if (Math.hypot(a.x - f.x, a.y - f.y) > 3) continue;
      const px = (a.x - kamera.x) * kamera.zoom + kamera.breite / 2;
      const py = (a.y - kamera.y) * kamera.zoom + kamera.hoehe / 2;
      ctx.strokeStyle = "rgba(255,138,180,.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(px, py, a.daten.lang * 0.55 * kamera.zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
  }
}

/* ── Pause, Start ───────────────────────────────────────── */
function pauseUmschalten(an) {
  zustand.pause = an === undefined ? !zustand.pause : an;
  pauseFeld.hidden = !zustand.pause;
  if (!zustand.pause) letzte = performance.now();
}
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseUmschalten(true); });
pauseFeld.addEventListener("click", () => pauseUmschalten(false));

async function starten() {
  start.classList.add("is-laden");
  const autos = Object.keys(TYPEN).map(t => "auto_" + t);
  const figuren = [];
  for (const art of ["lucia", "jason"]) {
    figuren.push(`${art}_steht`);
    for (let i = 0; i < 8; i++) figuren.push(`${art}_lauf${i}`);
  }
  await Bilder.laden([...autos, ...figuren]);

  weltBauen();
  groesseAnpassen();
  start.hidden = true;
  leinwand.focus();
  zustand.laeuft = true;
  hud.figur.textContent = spieler().daten.name;
  hinweis(L("E drücken, um einzusteigen", "Press E to get in a car"));
  letzte = performance.now();
  requestAnimationFrame(schleife);
}

document.getElementById("spielStartKnopf").addEventListener("click", starten);
groesseAnpassen();
