/* ═══════════════════════════════════════════════════════════
   Vice City — Browser-Spiel, Hauptschleife

   Aufbau:
     karte.js      die Stadt (Kacheln, Kollision, Zeichnen)
     bilder.js     Sprites laden und gedreht malen
     wesen.js      Figuren zu Fuß
     fahrzeug.js   Autos und Fahrmodell
     spiel.js      Eingabe, Kamera, Schleife, Anzeige  ← diese Datei

   Steuerung: WASD/Pfeile fahren und laufen, Umschalt rennen,
   E ein- und aussteigen, Leertaste Handbremse, Alt halten für den
   Figurenwechsel, P pausieren.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import * as Bilder from "./bilder.js";
import { Figur, passantenVerteilen, passantenNachziehen, PASSANT_ARTEN } from "./wesen.js";
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
const wechselFeld = document.getElementById("spielWechsel");
const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;

const kamera = { x: Karte.START.x, y: Karte.START.y, zoom: 30, breite: 0, hoehe: 0 };
const ZOOM_ZU_FUSS = 30, ZOOM_AUTO = 24;

const zustand = {
  laeuft: false,
  pause: false,
  figuren: {
    lucia: new Figur("lucia", Karte.START.x, Karte.START.y),
    /* Jasons Platz wird gesucht, nicht geraten — sonst steht er im Haus */
    jason: new Figur("jason", ...(() => {
      const p = Karte.freierPunkt(Karte.START.x, Karte.START.y,
        [Karte.ART.GEHWEG, Karte.ART.PARKPLATZ, Karte.ART.PARK], 26);
      return [p.x, p.y];
    })())
  },
  aktiv: "lucia",
  autos: [],
  passanten: [],
  zeit: 0,
  /* Wechsel-Anzeige und -Fahrt der Kamera */
  wahl: null,          // Figur, die gerade im Wechselmenü gewählt ist
  fahrt: null          // { von, nach, t } während der Kamerafahrt
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
  /* Pfeiltasten, Leertaste und Alt sollen die Seite nicht bedienen */
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Tab", "AltLeft", "AltRight"].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  tasten.add(e.code);
  if (zustand.fahrt) return;                       // während der Kamerafahrt nichts
  if (e.code === "AltLeft" || e.code === "AltRight") { wechselOeffnen(); return; }
  if (zustand.wahl) {                              // Auswahl im Wechselmenü
    if (gedrueckt(TASTE.links)) wechselWaehlen("jason");
    if (gedrueckt(TASTE.rechts)) wechselWaehlen("lucia");
    return;
  }
  if (e.code === "KeyE") einUndAussteigen();
  if (e.code === "KeyP" || e.code === "Escape") pauseUmschalten();
});
addEventListener("keyup", e => {
  tasten.delete(e.code);
  if (e.code === "AltLeft" || e.code === "AltRight") wechselSchliessen(true);
});
addEventListener("blur", () => tasten.clear());

/* ── Spielwelt aufbauen ──────────────────────────────────── */
function weltBauen() {
  zustand.autos = autosVerteilen(30, Karte.START.x, Karte.START.y, 110);
  zustand.passanten = passantenVerteilen(55, Karte.START.x, Karte.START.y);
  /* Ein Wagen steht auf der Straße neben dem Start — nah genug zum
     Einsteigen, aber nicht auf der Figur */
  let nah = null;
  for (let i = 0; i < 40 && !nah; i++) {
    const p = Karte.freierPunkt(Karte.START.x, Karte.START.y, [Karte.ART.STRASSE], 8 + i);
    if (Math.hypot(p.x - Karte.START.x, p.y - Karte.START.y) > 3.6) nah = p;
  }
  nah = nah || { x: Karte.START.x + 5, y: Karte.START.y };
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

/* ── Figurenwechsel ──
   Alt öffnet die Auswahl (wie in GTA VI), mit A/D oder den Pfeiltasten
   wählt man, beim Loslassen wechselt die Kamera zur anderen Figur:
   erst nach oben wegziehen, dann hinüberfahren, dann wieder heran. */
function wechselOeffnen() {
  if (zustand.wahl || zustand.fahrt) return;
  zustand.wahl = zustand.aktiv;
  wechselFeld.hidden = false;
  requestAnimationFrame(() => wechselFeld.classList.add("is-an"));
  wechselZeichnen();
}

function wechselWaehlen(art) {
  if (!zustand.wahl || !zustand.figuren[art]) return;
  zustand.wahl = art;
  wechselZeichnen();
}

function wechselZeichnen() {
  wechselFeld.querySelectorAll("[data-wechsel]").forEach(k =>
    k.classList.toggle("is-gewaehlt", k.dataset.wechsel === zustand.wahl));
}

function wechselSchliessen(ausfuehren) {
  if (!zustand.wahl) return;
  const ziel = zustand.wahl;
  zustand.wahl = null;
  wechselFeld.classList.remove("is-an");
  setTimeout(() => { if (!zustand.wahl) wechselFeld.hidden = true; }, 160);
  if (ausfuehren && ziel !== zustand.aktiv) figurWechseln(ziel);
}

function figurWechseln(ziel) {
  const alt = spieler();
  const neu = zustand.figuren[ziel];
  if (!neu || neu === alt) return;
  tasten.clear();

  if (ruhig) {                                     // ohne Bewegungseffekte
    zustand.aktiv = ziel;
    kamera.x = neu.x; kamera.y = neu.y;
    nachWechsel();
    return;
  }
  zustand.fahrt = {
    von: { x: alt.x, y: alt.y },
    nach: neu,
    t: 0,
    dauer: 1.35
  };
}

function nachWechsel() {
  const f = spieler();
  hud.figur.textContent = f.daten.name;
  hinweis(L("Jetzt spielst du ", "Now playing as ") + f.daten.name);
}

/* Die Kamerafahrt selbst: hoch, hinüber, wieder herunter */
function fahrtRechnen(dt) {
  const fa = zustand.fahrt;
  fa.t += dt;
  const p = Math.min(1, fa.t / fa.dauer);
  const weich = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

  /* Auf halber Strecke übernimmt die neue Figur — dann zeigt die Anzeige
     schon den neuen Namen, während die Kamera noch unterwegs ist. */
  if (p >= 0.5 && zustand.aktiv !== keyOf(fa.nach)) {
    zustand.aktiv = keyOf(fa.nach);
    nachWechsel();
  }

  kamera.x = fa.von.x + (fa.nach.x - fa.von.x) * weich;
  kamera.y = fa.von.y + (fa.nach.y - fa.von.y) * weich;
  /* Zoom: erst weit weg, dann wieder heran (Sinus über die Fahrt) */
  const weite = Math.sin(p * Math.PI);
  kamera.zoom = ZOOM_ZU_FUSS - weite * (ZOOM_ZU_FUSS - 9);

  if (p >= 1) {
    zustand.fahrt = null;
    kamera.zoom = ZOOM_ZU_FUSS;
  }
}

const keyOf = figur => Object.keys(zustand.figuren).find(k => zustand.figuren[k] === figur);

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
  if (zustand.fahrt) {
    fahrtRechnen(dt);
    for (const name of Object.keys(zustand.figuren)) {
      const a = zustand.figuren[name];
      if (a.imAuto) { a.imAuto.fahren(0, 0, false, dt); a.x = a.imAuto.x; a.y = a.imAuto.y; }
    }
    return;
  }
  if (zustand.wahl) return;                        // Auswahl offen: Spiel wartet

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

  /* Passanten: nur die in der Nähe bewegen, der Rest ruht */
  const naheAutos = zustand.autos.filter(a =>
    Math.abs(a.x - f.x) < 60 && Math.abs(a.y - f.y) < 60 && Math.hypot(a.vx, a.vy) > 3);
  for (const p of zustand.passanten) {
    if (Math.abs(p.x - f.x) > 90 || Math.abs(p.y - f.y) > 90) continue;
    p.denken(dt, naheAutos);
  }
  passantenNachziehen(zustand.passanten, f.x, f.y);

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

  /* Markierung unter den beiden Hauptfiguren: sonst verliert man sich
     zwischen den Passanten. Die aktive Figur bekommt den vollen Ring. */
  for (const name of Object.keys(zustand.figuren)) {
    const f = zustand.figuren[name];
    if (f.imAuto || !sichtbar(f)) continue;
    const aktiv = name === zustand.aktiv;
    const px = (f.x - kamera.x) * kamera.zoom + kamera.breite / 2;
    const py = (f.y - kamera.y) * kamera.zoom + kamera.hoehe / 2;
    ctx.save();
    ctx.translate(px, py + 0.1 * kamera.zoom);
    ctx.scale(1, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, kamera.zoom * (aktiv ? 0.58 : 0.5), 0, Math.PI * 2);
    ctx.strokeStyle = aktiv ? "rgba(255,120,168,.95)" : "rgba(120,190,255,.55)";
    ctx.lineWidth = Math.max(1.5, kamera.zoom * 0.07);
    ctx.stroke();
    ctx.restore();
  }

  for (const p of zustand.passanten) if (sichtbar(p)) p.zeichnen(ctx, kamera);
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
  for (const art of ["lucia", "jason", ...PASSANT_ARTEN]) {
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
  hinweis(L("E drücken, um einzusteigen · Alt halten zum Wechseln",
            "Press E to get in a car · hold Alt to switch"));
  letzte = performance.now();
  requestAnimationFrame(schleife);
}

wechselFeld.addEventListener("click", e => {
  const k = e.target.closest("[data-wechsel]");
  if (!k) return;
  wechselWaehlen(k.dataset.wechsel);
  wechselSchliessen(true);
});

document.getElementById("spielStartKnopf").addEventListener("click", starten);
groesseAnpassen();
