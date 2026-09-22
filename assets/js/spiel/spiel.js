/* ═══════════════════════════════════════════════════════════
   Vice City — Browser-Spiel, Hauptschleife

   Aufbau:
     stadtplan.js  die Stadt wird einmal gebaut (Felder)
     karte.js      Abfragen und Zeichnen der Stadt
     wege.js       Wegfindung über die Straßen (für die Route)
     bilder.js     Sprites laden und gedreht malen
     wesen.js      Figuren zu Fuß
     fahrzeug.js   Autos und Fahrmodell
     waffen.js     Fäuste, Waffen, Waffenladen
     minikarte.js  Minikarte und große Karte
     spiel.js      Eingabe, Kamera, Schleife, Anzeige  ← diese Datei

   Steuerung: WASD/Pfeile fahren und laufen, Umschalt rennen,
   E oder F ein- und aussteigen, Leertaste springen (im Auto Handbremse),
   Maustaste schlagen und schießen, Mausrad oder Q Waffe wechseln,
   Alt halten für den Figurenwechsel, M Karte, N Ton, H Hupe, V Vollbild,
   P Pause.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import * as Bilder from "./bilder.js";
import * as Tex from "./texturen.js";
import { Figur, passantenVerteilen, passantenNachziehen, panik, PASSANT_ARTEN } from "./wesen.js";
import { Fahrzeug, autosVerteilen, TYPEN } from "./fahrzeug.js";
import { verkehrAufbauen, verkehrNachziehen } from "./verkehr.js";
import { Fahndung, STUFEN } from "./polizei.js";
import { Missionen } from "./missionen.js";
import { Arsenal, feuern, laedenSetzen, WAFFEN, WARE } from "./waffen.js";
import * as Waffenbilder from "./waffenbilder.js";
import { Route } from "./wege.js";
import * as Minikarte from "./minikarte.js";
import * as Ton from "./ton.js";
import { zustand as konto, abonnieren as kontoAbo, dialogOeffnen, bereit as kontoBereit }
  from "../konto/konto.js";

const EN = (window.LANG || document.documentElement.lang || "de").startsWith("en");
const L = (de, en) => (EN ? en : de);

const leinwand = document.getElementById("spielFeld");
const ctx = leinwand.getContext("2d", { alpha: false });
const hud = {
  figur: document.querySelector("[data-hud=figur]"),
  tempo: document.querySelector("[data-hud=tempo]"),
  ort: document.querySelector("[data-hud=ort]"),
  hinweis: document.querySelector("[data-hud=hinweis]"),
  geld: document.querySelector("[data-hud=geld]"),
  sterne: document.querySelector("[data-hud=sterne]"),
  leben: document.querySelector("[data-hud=leben]"),
  lebenZahl: document.querySelector("[data-hud=lebenZahl]"),
  waffe: document.querySelector("[data-hud=waffe]"),
  waffenBild: document.querySelector("[data-hud=waffenbild]"),
  schuss: document.querySelector("[data-hud=schuss]"),
  endeText: document.querySelector("[data-hud=endeText]"),
  auftrag: document.querySelector("[data-hud=auftrag]")
};
const radar = document.getElementById("spielKarte");
const grossFeld = document.getElementById("spielGross");
const grossKarte = document.getElementById("spielGrossKarte");
const ladenFeld = document.getElementById("spielLaden");
const ladenListe = document.getElementById("spielLadenListe");
const ladenGeld = document.getElementById("spielLadenGeld");
const besteListe = document.getElementById("spielBeste");
const eigenText = document.getElementById("spielEigen");
const tonKnopf = document.getElementById("spielTon");
const touchFeld = document.getElementById("spielTouch");
const stick = document.getElementById("spielStick");
const endeFeld = document.getElementById("spielEnde");
const start = document.getElementById("spielStart");
const pauseFeld = document.getElementById("spielPause");
const wechselFeld = document.getElementById("spielWechsel");
const buehne = document.querySelector(".sbuehne");
const vollKnopf = document.getElementById("spielVollbild");
const karteKnopf = document.getElementById("spielKarteKnopf");
const torFeld = document.getElementById("spielTor");
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
  verkehr: [],
  passanten: [],
  zeit: 0,
  leben: 100,
  geld: 0,
  fahndung: new Fahndung(),
  missionen: new Missionen(Karte.START.x, Karte.START.y),
  arsenal: new Arsenal(),
  laeden: [],
  strahlen: [],               // kurze Schusslinien zum Zeichnen
  drinnen: null,              // { rest, text } während eines Überfalls
  wegpunkt: null,             // selbst gesetztes Ziel auf der Karte
  route: new Route(),
  schonung: 0,                // kurz nach einem Neustart keine Festnahme
  angefahren: [],             // Zeitpunkte umgefahrener Passanten
  bestwert: 0,
  ende: 0,              // Restzeit der Einblendung „Busted"/„Erledigt"
  /* Wechsel-Anzeige und -Fahrt der Kamera */
  wahl: null,          // Figur, die gerade im Wechselmenü gewählt ist
  fahrt: null          // { von, nach, t } während der Kamerafahrt
};

const spieler = () => zustand.figuren[zustand.aktiv];

/* Für Tests im Browser erreichbar: window.__spiel */
window.__spiel = zustand;

/* ── Eingabe ─────────────────────────────────────────────── */
const tasten = new Set();
const TASTE = {
  hoch: ["KeyW", "ArrowUp"], runter: ["KeyS", "ArrowDown"],
  links: ["KeyA", "ArrowLeft"], rechts: ["KeyD", "ArrowRight"]
};
const gedrueckt = liste => liste.some(t => tasten.has(t));

/* Mausposition auf der Bühne — zu Fuß wird damit gezielt */
const maus = { x: 0, y: 0, imBild: false, feuer: false };

addEventListener("keydown", e => {
  if (!zustand.laeuft) return;
  /* Pfeiltasten, Leertaste und Alt sollen die Seite nicht bedienen */
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Tab", "AltLeft", "AltRight"].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  tasten.add(e.code);
  if (zustand.fahrt) return;                       // während der Kamerafahrt nichts
  if (!ladenFeld.hidden) {                         // Laden offen
    if (e.code === "Escape" || e.code === "KeyE" || e.code === "KeyF") ladenSchliessen();
    const nr = "Digit1 Digit2 Digit3 Digit4 Digit5".split(" ").indexOf(e.code);
    if (nr >= 0) kaufen(nr);
    return;
  }
  if (e.code === "AltLeft" || e.code === "AltRight") { wechselOeffnen(); return; }
  if (zustand.wahl) {                              // Auswahl im Wechselmenü
    if (gedrueckt(TASTE.links)) wechselWaehlen("jason");
    if (gedrueckt(TASTE.rechts)) wechselWaehlen("lucia");
    return;
  }
  if (e.code === "KeyE" || e.code === "KeyF") einsteigenOderLaden();
  if (e.code === "Space" && !spieler().imAuto && spieler().springen()) Ton.sprung();
  if (e.code === "KeyV") vollbildUmschalten();
  if (e.code === "KeyM") karteUmschalten();
  if (e.code === "KeyN") tonUmschalten();
  if (e.code === "KeyQ") waffeWechseln(1);
  const nummer = "Digit1 Digit2 Digit3 Digit4 Digit5".split(" ").indexOf(e.code);
  if (nummer >= 0) waffeWaehlen(nummer);
  if (e.code === "KeyH" && spieler().imAuto) Ton.hupe();
  if ((e.code === "KeyP" || e.code === "Escape") && grossFeld.hidden) pauseUmschalten();
  if (e.code === "Escape" && !grossFeld.hidden) karteUmschalten(false);
});
addEventListener("keyup", e => {
  tasten.delete(e.code);
  if (e.code === "AltLeft" || e.code === "AltRight") wechselSchliessen(true);
});
addEventListener("blur", () => { tasten.clear(); maus.feuer = false; });

/* Zielen und Schießen mit der Maus */
leinwand.addEventListener("mousemove", e => {
  const k = leinwand.getBoundingClientRect();
  maus.x = e.clientX - k.left;
  maus.y = e.clientY - k.top;
  maus.imBild = true;
});
leinwand.addEventListener("mouseleave", () => { maus.imBild = false; maus.feuer = false; });
leinwand.addEventListener("mousedown", e => {
  if (e.button !== 0 || !zustand.laeuft) return;
  leinwand.focus();
  maus.feuer = true;
});
addEventListener("mouseup", e => { if (e.button === 0) maus.feuer = false; });

/* Mausrad über dem Spielfeld wechselt die Waffe */
leinwand.addEventListener("wheel", e => {
  if (!zustand.laeuft) return;
  e.preventDefault();
  waffeWechseln(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

/* ── Steuerung mit dem Finger ──
   Links ein Kreuz, das wie ein Stick funktioniert, rechts vier Knöpfe.
   Erscheint nur, wenn das Gerät Touch kann. */
const finger = { x: 0, y: 0, aktiv: false, bremse: false, gas: false, hand: false, lenken: false };
const istTouch = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;

function touchEinrichten() {
  if (!istTouch) return;
  touchFeld.hidden = false;
  const knopf = stick.querySelector("i");
  let mitte = null;

  const setzen = e => {
    const r = stick.getBoundingClientRect();
    mitte = mitte || { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const dx = e.clientX - mitte.x, dy = e.clientY - mitte.y;
    if (finger.lenken) {
      /* Am Steuer zählt nur links und rechts. Der Ausschlag wird
         gekrümmt: kleine Bewegungen lenken fein, große voll. */
      const roh = Math.max(-1, Math.min(1, dx / (r.width * 0.38)));
      finger.x = Math.sign(roh) * Math.pow(Math.abs(roh), 1.4);
      finger.y = 0;
      finger.aktiv = true;
      knopf.style.transform = `translate(${finger.x * r.width * 0.33}px, 0)`;
      return;
    }
    const weite = Math.min(1, Math.hypot(dx, dy) / (r.width * 0.42));
    const w = Math.atan2(dy, dx);
    finger.x = Math.cos(w) * weite;
    finger.y = Math.sin(w) * weite;
    finger.aktiv = true;
    knopf.style.transform = `translate(${finger.x * r.width * 0.3}px, ${finger.y * r.height * 0.3}px)`;
  };
  const los = () => {
    finger.aktiv = false;
    finger.x = finger.y = 0;
    knopf.style.transform = "";
    mitte = null;
  };

  stick.addEventListener("pointerdown", e => { stick.setPointerCapture(e.pointerId); setzen(e); });
  stick.addEventListener("pointermove", e => { if (finger.aktiv) setzen(e); });
  stick.addEventListener("pointerup", los);
  stick.addEventListener("pointercancel", los);

  const losLassen = art => {
    if (art === "bremse") finger.bremse = false;
    if (art === "gas") finger.gas = false;
    if (art === "hand") finger.hand = false;
    if (art === "feuer") maus.feuer = false;
  };

  touchFeld.querySelectorAll("[data-touch]").forEach(b => {
    const art = b.dataset.touch;
    b.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (art === "e") einsteigenOderLaden();
      if (art === "bremse") finger.bremse = true;
      if (art === "gas") finger.gas = true;
      if (art === "hand") finger.hand = true;
      if (art === "feuer") maus.feuer = true;
      if (art === "hupe") Ton.hupe();
      if (art === "sprung" && spieler().springen()) Ton.sprung();
      if (art === "karte") karteUmschalten();
      if (art === "wechsel") {
        if (zustand.wahl) wechselSchliessen(true);
        else { wechselOeffnen(); wechselWaehlen(zustand.aktiv === "lucia" ? "jason" : "lucia"); }
      }
    });
    b.addEventListener("pointerup", () => losLassen(art));
    b.addEventListener("pointercancel", () => losLassen(art));
  });
}

/* Am Steuer sieht die Bedienung anders aus als zu Fuß */
function touchModus(imAuto) {
  if (!istTouch || finger.lenken === !!imAuto) return;
  finger.lenken = !!imAuto;
  touchFeld.classList.toggle("stouch--auto", !!imAuto);
  finger.x = finger.y = 0;
  finger.gas = finger.bremse = finger.hand = false;
  const knopf = stick.querySelector("i");
  if (knopf) knopf.style.transform = "";
}

/* ── Spielwelt aufbauen ──────────────────────────────────── */
function weltBauen() {
  zustand.verkehr = verkehrAufbauen(70, Karte.START.x, Karte.START.y);
  /* Parkende Autos zum Schluss und mit Abstand zum fahrenden Verkehr —
     sonst stehen am Start zehn Wagen ineinander. */
  zustand.autos = autosVerteilen(22, Karte.START.x, Karte.START.y, 150, zustand.verkehr);
  zustand.passanten = passantenVerteilen(75, Karte.START.x, Karte.START.y);
  zustand.laeden = laedenSetzen(Karte.START.x, Karte.START.y);
  /* Ein Wagen steht auf der Straße neben dem Start: die nächste
     Straßenkachel im Umkreis, mindestens 3,5 m entfernt. */
  let beste = null;
  const t0x = Karte.inKachel(Karte.START.x), t0y = Karte.inKachel(Karte.START.y);
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const tx = t0x + dx, ty = t0y + dy;
      if (Karte.art(tx, ty) !== Karte.ART.STRASSE) continue;
      const x = Karte.inMeter(tx) + Karte.KACHEL / 2;
      const y = Karte.inMeter(ty) + Karte.KACHEL / 2;
      const d = Math.hypot(x - Karte.START.x, y - Karte.START.y);
      if (d < 3.6) continue;
      if (!beste || d < beste.d) beste = { x, y, d, tx, ty };
    }
  }
  if (beste) {
    const belegt = zustand.autos.concat(zustand.verkehr)
      .some(a => Math.hypot(a.x - beste.x, a.y - beste.y) < 6);
    if (!belegt) {
      const senkrecht = Karte.istStrasse(beste.tx, beste.ty + 2) && Karte.istStrasse(beste.tx, beste.ty - 2);
      zustand.autos.push(new Fahrzeug("cabrio", beste.x, beste.y, senkrecht ? -Math.PI / 2 : 0));
    }
  }
}

/* ── Ein- und Aussteigen, Laden betreten ─────────────────── */
function einsteigenOderLaden() {
  const f = spieler();
  if (!f.imAuto) {
    const laden = zustand.laeden.find(l => Math.hypot(l.x - f.x, l.y - f.y) < 4);
    if (laden) { ladenOeffnen(); return; }
  }
  einUndAussteigen();
}

function einUndAussteigen() {
  const f = spieler();
  if (f.imAuto) {
    aussteigen();
    hinweis(L("Ausgestiegen", "Out of the car"));
    return;
  }
  let naechstes = null, beste = 4.2;
  for (const a of zustand.autos.concat(zustand.verkehr)) {
    if (a.fahrer) continue;
    const d = Math.hypot(a.x - f.x, a.y - f.y);
    if (d >= beste) continue;
    beste = d;
    naechstes = a;
  }
  if (naechstes) {
    f.imAuto = naechstes;
    naechstes.fahrer = f;
    Ton.tuer();
    hinweis(naechstes.daten.name + (naechstes.schrott ? L(" (raucht)", " (smoking)") : ""));
  } else {
    hinweis(L("Kein Auto in der Nähe", "No car nearby"));
  }
}

function aussteigen() {
  const f = spieler();
  const auto = f.imAuto;
  if (!auto) return;
  const seite = { x: -Math.sin(auto.winkel), y: Math.cos(auto.winkel) };
  f.x = auto.x + seite.x * (auto.daten.breit / 2 + 0.6);
  f.y = auto.y + seite.y * (auto.daten.breit / 2 + 0.6);
  f.vx = auto.vx * 0.2;
  f.vy = auto.vy * 0.2;
  f.imAuto = null;
  auto.fahrer = null;
  f.entklemmen();
  Ton.tuer();
}

/* ── Waffen ──────────────────────────────────────────────── */
function waffeWechseln(richtung) {
  if (spieler().imAuto) return;
  zustand.arsenal.wechseln(richtung);
  waffeZeigen();
}

function waffeWaehlen(nummer) {
  if (spieler().imAuto) return;
  zustand.arsenal.waehlen(nummer);
  waffeZeigen();
}

let letzteWaffe = "faust";
function waffeZeigen() {
  const a = zustand.arsenal;
  letzteWaffe = a.name;
  hud.waffe.textContent = a.waffe.name;
  hud.schuss.textContent = a.schuss === Infinity ? "∞" : a.schuss;
  if (hud.waffenBild) {
    const bild = a.waffe.bild ? Waffenbilder.datenUrl(a.name) : "";
    hud.waffenBild.hidden = !bild;
    if (bild) hud.waffenBild.src = bild;
  }
  /* Beide Figuren tragen, was gerade gewählt ist */
  for (const name of Object.keys(zustand.figuren)) {
    const f = zustand.figuren[name];
    f.waffenBild = a.waffe.bild || null;
    f.waffenBreite = a.waffe.breit || 0.5;
  }
}

/* Richtung, in die der Spieler zielt: zur Maus, sonst nach vorn */
function zielRichtung(f) {
  if (!maus.imBild) return f.winkel;
  const zx = kamera.x + (maus.x - kamera.breite / 2) / kamera.zoom;
  const zy = kamera.y + (maus.y - kamera.hoehe / 2) / kamera.zoom;
  return Math.atan2(zy - f.y, zx - f.x);
}

/* Mindestens so viele Sterne — Delikte heben die Stufe nur an */
function mindestens(n) {
  const fa = zustand.fahndung;
  if (fa.stufe < n) fa.melden(n - fa.stufe);
  else fa.ruhe = 0;
}

function angreifen() {
  const f = spieler();
  const a = zustand.arsenal;
  if (f.imAuto || f.tot || a.abklingen > 0) return;
  if (a.waffe.art !== "nah" && a.schuss <= 0) {
    hinweis(L("Keine Munition", "Out of ammo"));
    a.pruefen();
    waffeZeigen();
    return;
  }

  const richtung = zielRichtung(f);
  f.winkel = richtung;
  const ziele = zustand.passanten.concat(zustand.fahndung.ziele());
  const nah = a.waffe.art === "nah";
  if (nah) f.ausholen();
  const ergebnis = feuern(a, f, richtung, ziele);
  if (!ergebnis) return;
  waffeZeigen();

  if (nah) {
    Ton.schlag(ergebnis.treffer.length > 0);
  } else {
    Ton.schuss(a.waffe.laut);
    for (const s of ergebnis.strahlen) zustand.strahlen.push({ ...s, t: 0.07 });
    /* Mündungsfeuer */
    zustand.blitz = 0.06;
  }
  panik(zustand.passanten, f.x, f.y, nah ? 16 : 34);

  /* Sieht das jemand? Dann ruft er die Polizei. */
  const zeugen = zustand.passanten.some(p => !p.tot && Math.hypot(p.x - f.x, p.y - f.y) < 30);
  if (!nah && (zeugen || zustand.fahndung.stufe > 0)) mindestens(1);

  for (const z of ergebnis.treffer) {
    if (!z.tot) continue;
    if (zustand.fahndung.polizisten.includes(z)) {
      mindestens(zustand.fahndung.stufe + 1);
      hinweis(L("Polizist ausgeschaltet", "Officer down"));
    } else {
      mindestens(2);
      zustand.geld += 25;                            // Kleingeld aus der Tasche
    }
  }
}

/* ── Figurenwechsel ──
   Alt öffnet die Auswahl (wie in GTA VI), mit A/D oder den Pfeiltasten
   wählt man, beim Loslassen wechselt die Kamera zur anderen Figur:
   erst nach oben wegziehen, dann hinüberfahren, dann wieder heran. */
function wechselOeffnen() {
  if (zustand.wahl || zustand.fahrt) return;
  zustand.wahl = zustand.aktiv;
  mausWeg = 0;
  wechselFeld.hidden = false;
  requestAnimationFrame(() => wechselFeld.classList.add("is-an"));
  wechselZeichnen();
}

/* Die Maus wählt, solange Alt gehalten wird: nach links Jason, nach
   rechts Lucia — wie mit dem Stick in GTA. */
let mausWeg = 0;
addEventListener("mousemove", e => {
  if (!zustand.wahl) return;
  mausWeg += e.movementX || 0;
  if (mausWeg < -26) { wechselWaehlen("jason"); mausWeg = 0; }
  if (mausWeg > 26) { wechselWaehlen("lucia"); mausWeg = 0; }
});

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

function hudFahndung() {
  const stufe = zustand.fahndung.stufe;
  if (hud.sterne.childElementCount !== STUFEN) {
    hud.sterne.innerHTML = Array.from({ length: STUFEN }, () => "<i></i>").join("");
  }
  [...hud.sterne.children].forEach((st, i) => st.classList.toggle("is-an", i < stufe));
  const leben = Math.max(0, Math.min(100, zustand.leben));
  hud.leben.style.width = leben + "%";
  hud.lebenZahl.textContent = Math.round(leben);
  hud.geld.textContent = "$" + zustand.geld.toLocaleString(EN ? "en-US" : "de-DE");
}

let hinweisZeit = 0;
function hinweis(text) {
  hud.hinweis.textContent = text;
  hud.hinweis.classList.add("is-an");
  hinweisZeit = 2.6;
}

/* ── Zusammenstöße ──
   Alles bewusst einfach: Kreis gegen Kreis. Wer im Auto sitzt, rammt;
   wer zu Fuß ist, wird umgerissen. */
let rammPause = 0;
function zusammenstoesse(dt, f, alleAutos) {
  rammPause = Math.max(0, rammPause - dt);
  const auto = f.imAuto;

  if (auto) {
    const tempo = Math.hypot(auto.vx, auto.vy);
    /* Fußgänger anfahren. Ein einzelner Rempler kostet keinen Stern —
       wer aber mehrere umfährt oder jemanden totfährt, wird gesucht. */
    for (const p of zustand.passanten) {
      if (p.tot) continue;
      if (Math.hypot(p.x - auto.x, p.y - auto.y) > 2.2) continue;
      if (tempo <= 3) continue;
      p.x += (p.x - auto.x) * 0.6 + auto.vx * 0.12;
      p.y += (p.y - auto.y) * 0.6 + auto.vy * 0.12;
      p.flucht = 3;
      const tot = p.treffer(tempo * 7);
      if (rammPause > 0) continue;
      rammPause = 1.2;
      Ton.schreck();
      panik(zustand.passanten, p.x, p.y, 22);
      if (tot) {
        mindestens(1);
        hinweis(L("Du hast jemanden überfahren", "You ran someone over"));
      } else {
        zustand.angefahren.push(zustand.zeit);
        zustand.angefahren = zustand.angefahren.filter(t => zustand.zeit - t < 20);
        hinweis(L("Fußgänger angefahren", "You hit a pedestrian"));
        if (zustand.angefahren.length >= 3) mindestens(1);
      }
    }
    /* Andere Autos und Streifenwagen rammen */
    for (const a of alleAutos.concat(zustand.fahndung.streifen)) {
      if (a === auto) continue;
      const d = Math.hypot(a.x - auto.x, a.y - auto.y);
      if (d > auto.daten.lang * 0.5 + a.daten.lang * 0.5) continue;
      const nx = (a.x - auto.x) / (d || 1), ny = (a.y - auto.y) / (d || 1);
      const wucht = Math.abs(auto.vx * nx + auto.vy * ny);
      a.vx += nx * wucht * 0.8;
      a.vy += ny * wucht * 0.8;
      auto.vx -= nx * wucht * 0.5;
      auto.vy -= ny * wucht * 0.5;
      auto.schaden = Math.min(130, auto.schaden + wucht * 0.75);
      a.schaden = Math.min(130, (a.schaden || 0) + wucht * 0.9);
      zustand.leben -= wucht * 0.22;
      if (wucht > 3) Ton.rumms(Math.min(1, wucht / 14));
      if (zustand.fahndung.streifen.includes(a) && rammPause <= 0 && wucht > 5) {
        mindestens(2);
        hinweis(L("Streifenwagen gerammt", "You rammed a cop car"));
        rammPause = 2.5;
      }
    }
    /* Der Wagen nimmt Schaden, wirft aber niemanden hinaus. Genau das
       hat beim Fahren am meisten gestört: einmal irgendwo angeeckt und
       man stand plötzlich auf der Straße. */
    if (auto.schaden > 115 && !auto.schrott) {
      auto.schrott = true;
      hinweis(L("Der Wagen raucht — er fährt nur noch langsam",
                "The car is smoking — it barely runs"));
    }
  } else {
    /* Zu Fuß: von einem Auto erwischt zu werden tut weh */
    for (const a of alleAutos.concat(zustand.fahndung.streifen)) {
      const d = Math.hypot(a.x - f.x, a.y - f.y);
      if (d > 1.8) continue;
      const tempo = Math.hypot(a.vx, a.vy);
      if (tempo < 3) continue;
      zustand.leben -= tempo * 1.6 * dt * 10;
      f.x += (f.x - a.x) * 0.4;
      f.y += (f.y - a.y) * 0.4;
      hinweis(L("Angefahren!", "You got hit!"));
    }
  }
}

function neustartAn(x, y) {
  const f = spieler();
  if (f.imAuto) { f.imAuto.fahrer = null; f.imAuto = null; }
  const p = Karte.freierPunkt(x, y, [Karte.ART.GEHWEG, Karte.ART.PARKPLATZ], 40);
  f.x = p.x; f.y = p.y;
  f.vx = f.vy = 0;
  f.tot = false;
  f.leben = 100;
  kamera.x = p.x; kamera.y = p.y;
  zustand.leben = 100;
  zustand.schonung = 4;
  zustand.angefahren.length = 0;
  zustand.fahndung.loeschen();
}

/* Ort eines Wahrzeichens, sonst der Notfallpunkt */
function wahrzeichenPunkt(bau, ersatzX, ersatzY) {
  const w = Karte.wahrzeichen.find(x => x.bau === bau);
  return w ? { x: w.x, y: w.y } : { x: ersatzX, y: ersatzY };
}

function verhaftet() {
  bestwertSichern();
  const f = spieler();
  zustand.geld = Math.round(zustand.geld * 0.7);
  zustand.missionen.abbrechen(L("Auftrag geplatzt", "Job blown"));
  endeZeigen(L("VERHAFTET", "BUSTED"), "verhaftet");
  /* Aus der Zelle kommt man vor der Wache heraus */
  const wache = wahrzeichenPunkt(Karte.BAU.POLIZEI, f.x + 60, f.y + 40);
  neustartAn(wache.x, wache.y);
  hinweis(L("Die Wache spuckt dich wieder aus", "The station spits you back out"));
}

function erledigt() {
  bestwertSichern();
  const f = spieler();
  zustand.geld = Math.round(zustand.geld * 0.85);
  zustand.missionen.abbrechen(L("Auftrag geplatzt", "Job blown"));
  endeZeigen(L("TOT", "WASTED"), "tot");
  /* Wer stirbt, wacht in der Klinik auf — nicht irgendwo auf der Straße */
  const klinik = wahrzeichenPunkt(Karte.BAU.KRANKENHAUS, f.x - 50, f.y - 30);
  neustartAn(klinik.x, klinik.y);
  hinweis(L("Du wachst in der Klinik auf", "You wake up at the hospital"));
}

/* art: "tot" (rot), "verhaftet" (blau), "gut" (grün) */
function endeZeigen(text, art) {
  hud.endeText.textContent = text;
  endeFeld.classList.remove("sende--tot", "sende--verhaftet", "sende--gut");
  endeFeld.classList.add("sende--" + art);
  endeFeld.hidden = false;
  zustand.ende = art === "gut" ? 1.8 : 2.2;
}

function auftragAnzeigen() {
  const text = zustand.missionen.anzeige(zustand);
  hud.auftrag.textContent = text;
  hud.auftrag.classList.toggle("is-an", !!text);
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
  if (tx >= 204) return L("Ocean Drive", "Ocean Drive");
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

  /* Überfall: Der Spieler ist im Gebäude. Dann läuft nur die Uhr —
     steuern kann man nicht, gesehen wird man auch nicht. */
  if (zustand.drinnen) {
    const geldDrin = zustand.geld;
    zustand.missionen.rechnen(dt, f, zustand);
    if (zustand.geld > geldDrin) { Ton.kasse(); bestwertSichern(); }
    auftragAnzeigen();
    kameraFolgen(dt);
    Ton.laufen(0, zustand.fahndung.stufe, dt, 0);
    hudFahndung();
    return;
  }

  touchModus(!!f.imAuto);
  let vor = (gedrueckt(TASTE.hoch) ? 1 : 0) - (gedrueckt(TASTE.runter) ? 1 : 0);
  let quer = (gedrueckt(TASTE.rechts) ? 1 : 0) - (gedrueckt(TASTE.links) ? 1 : 0);
  if (f.imAuto && istTouch) {
    /* Lenken über das Band, Gas und Bremse über die Knöpfe */
    if (finger.aktiv) quer = finger.x;
    if (finger.gas) vor = 1;
    else if (finger.bremse) vor = -1;
  } else if (finger.aktiv) {                        // zu Fuß: Finger hat Vorrang
    quer = finger.x;
    vor = -finger.y;
  }
  const bremse = (tasten.has("Space") && f.imAuto) || finger.hand;

  if (f.imAuto) {
    f.imAuto.fahren(vor, quer, bremse, dt);
    f.x = f.imAuto.x;
    f.y = f.imAuto.y;
    f.winkel = f.imAuto.winkel;
  } else {
    f.bewegen(quer, -vor, tasten.has("ShiftLeft") || tasten.has("ShiftRight"), dt);
  }

  /* Schlagen und schießen. Die getragene Waffe wird jedes Bild
     abgeglichen — dann stimmt sie auch, wenn eine Mission oder der
     Laden das Arsenal ändert. */
  zustand.arsenal.rechnen(dt);
  const gewaehlt = zustand.arsenal.waffe;
  f.waffenBild = gewaehlt.bild || null;
  f.waffenBreite = gewaehlt.breit || 0.5;
  if (letzteWaffe !== zustand.arsenal.name) {
    letzteWaffe = zustand.arsenal.name;
    waffeZeigen();
  }
  if (maus.feuer) angreifen();
  if (zustand.blitz) zustand.blitz = Math.max(0, zustand.blitz - dt);
  for (let k = zustand.strahlen.length - 1; k >= 0; k--) {
    zustand.strahlen[k].t -= dt;
    if (zustand.strahlen[k].t <= 0) zustand.strahlen.splice(k, 1);
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

  /* Verkehr: fahren lassen, was in der Nähe ist */
  const alleAutos = zustand.autos.concat(zustand.verkehr);
  for (const a of zustand.verkehr) {
    if (a.fahrer) continue;                      // gerade vom Spieler gefahren
    if (Math.abs(a.x - f.x) > 120 || Math.abs(a.y - f.y) > 120) continue;
    a.denken(dt, zustand.zeit * 1000, alleAutos, zustand.passanten);
  }
  verkehrNachziehen(zustand.verkehr, f.x, f.y);

  /* Passanten: nur die in der Nähe bewegen, der Rest ruht */
  const naheAutos = alleAutos.filter(a =>
    Math.abs(a.x - f.x) < 60 && Math.abs(a.y - f.y) < 60 && Math.hypot(a.vx, a.vy) > 3);
  for (const p of zustand.passanten) {
    if (Math.abs(p.x - f.x) > 90 || Math.abs(p.y - f.y) > 90) continue;
    p.denken(dt, naheAutos);
  }
  passantenNachziehen(zustand.passanten, f.x, f.y);

  /* ── Zusammenstöße ── */
  zusammenstoesse(dt, f, alleAutos);

  /* ── Missionen ── */
  const geldVorher = zustand.geld;
  const erledigtVorher = zustand.missionen.erledigt.size;
  zustand.missionen.rechnen(dt, f, zustand);
  if (zustand.geld > geldVorher) { Ton.kasse(); bestwertSichern(); }
  if (zustand.missionen.erledigt.size > erledigtVorher) {
    endeZeigen(L("AUFTRAG GESCHAFFT", "JOB DONE"), "gut");
  }
  auftragAnzeigen();

  /* ── Polizei ── */
  zustand.schonung = Math.max(0, zustand.schonung - dt);
  zustand.fahndung.rechnen(dt, f, alleAutos.concat(zustand.fahndung.streifen), zustand);
  if (zustand.schonung <= 0 && zustand.fahndung.verhaftet(f)) verhaftet();
  if (zustand.leben <= 0) erledigt();
  hudFahndung();

  /* ── Route und Wegpunkt ── */
  const pos = f.imAuto || f;
  if (zustand.wegpunkt &&
      Math.hypot(pos.x - zustand.wegpunkt.x, pos.y - zustand.wegpunkt.y) < 9) {
    zustand.wegpunkt = null;
    zustand.route.leeren();
    hinweis(L("Wegpunkt erreicht", "Waypoint reached"));
  }
  zustand.route.aktualisieren(pos.x, pos.y, routenZiel(), dt);

  /* ── Ton ── */
  const auto = f.imAuto;
  const rutschen = auto
    ? Math.min(1, Math.abs(auto.vx * -Math.sin(auto.winkel) + auto.vy * Math.cos(auto.winkel)) / 6)
    : 0;
  Ton.laufen(auto ? Math.hypot(auto.vx, auto.vy) : 0, zustand.fahndung.stufe, dt, rutschen);

  kameraFolgen(dt);

  if (hinweisZeit > 0) {
    hinweisZeit -= dt;
    if (hinweisZeit <= 0) hud.hinweis.classList.remove("is-an");
  }
  if (zustand.ende > 0) {
    zustand.ende -= dt;
    if (zustand.ende <= 0) endeFeld.hidden = true;
  }

  hud.tempo.textContent = f.imAuto
    ? Math.round(f.imAuto.kmh) + " km/h"
    : (f.tempo > 5 ? L("rennt", "running") : f.tempo > 0.4 ? L("geht", "walking") : L("steht", "standing"));
  hud.ort.textContent = ortsname(f.x, f.y);
}

/* Wohin die Route führt: eigener Wegpunkt zuerst, sonst das Auftragsziel */
function routenZiel() {
  if (zustand.wegpunkt) return zustand.wegpunkt;
  const marken = zustand.missionen.marken();
  if (!zustand.missionen.laeuft) return null;       // freie Marken: keine Route
  return marken[0] || null;
}

function zeichnen() {
  Minikarte.zeichnen(radar, zustand, spieler());
  ctx.fillStyle = "#0b1124";
  ctx.fillRect(0, 0, kamera.breite, kamera.hoehe);
  Karte.zeichnen(ctx, kamera, zustand.zeit * 1000);

  /* Nur zeichnen, was im Bild liegt */
  const rand = 8;
  const sichtbar = o => Math.abs(o.x - kamera.x) < kamera.breite / kamera.zoom / 2 + rand &&
                        Math.abs(o.y - kamera.y) < kamera.hoehe / kamera.zoom / 2 + rand;
  const aufBild = (x, y) => [(x - kamera.x) * kamera.zoom + kamera.breite / 2,
                             (y - kamera.y) * kamera.zoom + kamera.hoehe / 2];

  /* Waffenläden als leuchtender Punkt */
  for (const laden of zustand.laeden) {
    if (!sichtbar(laden)) continue;
    const [px, py] = aufBild(laden.x, laden.y);
    const r = kamera.zoom * 1.1;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(110,231,160,.75)");
    g.addColorStop(1, "rgba(110,231,160,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Markierung unter den beiden Hauptfiguren: sonst verliert man sich
     zwischen den Passanten. Die aktive Figur bekommt den vollen Ring. */
  for (const name of Object.keys(zustand.figuren)) {
    const f = zustand.figuren[name];
    if (f.imAuto || !sichtbar(f)) continue;
    const aktiv = name === zustand.aktiv;
    const [px, py] = aufBild(f.x, f.y);
    ctx.save();
    ctx.translate(px, py + 0.1 * kamera.zoom);
    ctx.scale(1, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, kamera.zoom * (aktiv ? 0.58 : 0.5), 0, Math.PI * 2);
    ctx.strokeStyle = aktiv ? "rgba(255,120,168,.95)" : "rgba(120,190,255,.55)";
    ctx.lineWidth = Math.max(1.5, kamera.zoom * 0.07);
    ctx.stroke();
    ctx.restore();

    /* Namensschild über dem Kopf — sonst sieht Lucia aus wie jede andere
       Passantin. Nur, wenn nah genug herangezoomt ist. */
    if (kamera.zoom > 16) {
      const text = f.daten.name.toUpperCase();
      ctx.save();
      ctx.font = `700 ${Math.round(kamera.zoom * 0.32)}px "Barlow Condensed", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const breite = ctx.measureText(text).width + kamera.zoom * 0.34;
      const hoehe = kamera.zoom * 0.46;
      const ty2 = py - kamera.zoom * 1.05;
      ctx.fillStyle = aktiv ? "rgba(255,120,168,.92)" : "rgba(20,28,52,.8)";
      ctx.beginPath();
      ctx.roundRect(px - breite / 2, ty2 - hoehe / 2, breite, hoehe, hoehe / 2);
      ctx.fill();
      ctx.fillStyle = aktiv ? "#1b1024" : "rgba(220,232,255,.9)";
      ctx.fillText(text, px, ty2 + 1);
      ctx.restore();
    }
  }

  /* Während eines Überfalls steckt der Spieler im Haus: statt der Figur
     pulsiert der Eingang. */
  if (zustand.drinnen) {
    const [px, py] = aufBild(zustand.drinnen.x, zustand.drinnen.y);
    const r = kamera.zoom * (1.4 + Math.sin(zustand.zeit * 4) * 0.2);
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(57,212,255,.55)");
    g.addColorStop(1, "rgba(57,212,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of zustand.passanten) if (sichtbar(p)) p.zeichnen(ctx, kamera);
  for (const a of zustand.autos) if (sichtbar(a)) a.zeichnen(ctx, kamera);
  for (const a of zustand.verkehr) if (sichtbar(a)) a.zeichnen(ctx, kamera);
  zustand.fahndung.zeichnen(ctx, kamera, sichtbar);
  zustand.missionen.zeichnen(ctx, kamera, zustand.zeit);
  for (const name of Object.keys(zustand.figuren)) {
    const f = zustand.figuren[name];
    if (zustand.drinnen && name === zustand.aktiv) continue;   // steckt im Haus
    if (sichtbar(f)) f.zeichnen(ctx, kamera);
  }

  /* Schüsse: kurze helle Linien */
  if (zustand.strahlen.length) {
    ctx.save();
    ctx.lineCap = "round";
    for (const s of zustand.strahlen) {
      const [x1, y1] = aufBild(s.x1, s.y1);
      const [x2, y2] = aufBild(s.x2, s.y2);
      ctx.strokeStyle = `rgba(255,226,150,${Math.min(1, s.t * 12)})`;
      ctx.lineWidth = Math.max(1.2, kamera.zoom * 0.06);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Hinweisring um Autos, in die man einsteigen kann */
  const f = spieler();
  if (!f.imAuto) {
    for (const a of zustand.autos.concat(zustand.verkehr)) {
      if (a.fahrer) continue;
      if (Math.hypot(a.x - f.x, a.y - f.y) > 3.4) continue;
      const [px, py] = aufBild(a.x, a.y);
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

/* ── Punkte und Bestenliste ──
   Punkte = Geld + 750 je erledigtem Auftrag. Wer angemeldet ist, dessen
   Bestwert steht in der Datenbank und damit in der Liste auf der Seite;
   ohne Konto bleibt er in diesem Browser. */
const PUNKTE_JE_AUFTRAG = 750;
const punkteStand = () => zustand.geld + zustand.missionen.erledigt.size * PUNKTE_JE_AUFTRAG;

function bestwertLesenLokal() {
  try { return parseInt(localStorage.getItem("spiel-bestwert") || "0", 10) || 0; } catch (e) { return 0; }
}

async function bestwertLaden() {
  if (konto.backend && konto.nutzer) {
    zustand.bestwert = await konto.backend.bestwertLaden(konto.nutzer.uid);
  } else {
    zustand.bestwert = bestwertLesenLokal();
  }
  eigenZeigen();
}

let speichernLaeuft = false;
async function bestwertSichern() {
  const punkte = punkteStand();
  if (punkte <= zustand.bestwert || speichernLaeuft) return;
  zustand.bestwert = punkte;
  eigenZeigen();
  try { localStorage.setItem("spiel-bestwert", String(punkte)); } catch (e) {}
  if (!konto.backend || !konto.nutzer || !konto.profil) return;
  speichernLaeuft = true;
  try {
    await konto.backend.bestwertSetzen(konto.nutzer.uid, konto.profil.username, punkte);
    bestenlisteZeigen();
  } finally {
    speichernLaeuft = false;
  }
}

function eigenZeigen() {
  const punkte = punkteStand();
  eigenText.textContent = konto.nutzer
    ? L(`Dein Bestwert: ${zustand.bestwert.toLocaleString("de-DE")} · dieser Lauf: ${punkte.toLocaleString("de-DE")}`,
        `Your best: ${zustand.bestwert.toLocaleString("en-US")} · this run: ${punkte.toLocaleString("en-US")}`)
    : L(`Bestwert in diesem Browser: ${zustand.bestwert.toLocaleString("de-DE")} — mit Konto landest du in der Liste.`,
        `Best in this browser: ${zustand.bestwert.toLocaleString("en-US")} — with an account you make the list.`);
}

async function bestenlisteZeigen() {
  if (!konto.backend) {
    besteListe.innerHTML = `<li><b>${L("Noch keine Einträge", "No entries yet")}</b><span>—</span></li>`;
    return;
  }
  const liste = await konto.backend.bestenliste(10);
  if (!liste.length) {
    besteListe.innerHTML = `<li><b>${L("Noch keine Einträge — sei der Erste", "No entries yet — be the first")}</b><span>—</span></li>`;
    return;
  }
  const ich = konto.profil && konto.profil.username;
  besteListe.innerHTML = liste.map(e => `
    <li class="${e.name === ich ? "is-ich" : ""}">
      <b>${e.name.replace(/[&<>"]/g, "")}</b>
      <span>${e.punkte.toLocaleString(EN ? "en-US" : "de-DE")}</span>
    </li>`).join("");
}

/* ── Waffenladen ────────────────────────────────────────── */
function ladenOeffnen() {
  if (!ladenFeld.hidden) return;
  ladenFeld.hidden = false;
  zustand.pause = true;
  ladenZeichnen();
}

function ladenSchliessen() {
  ladenFeld.hidden = true;
  zustand.pause = false;
  letzte = performance.now();
  leinwand.focus();
}

function ladenZeichnen() {
  ladenGeld.textContent = "$" + zustand.geld.toLocaleString(EN ? "en-US" : "de-DE");
  ladenListe.innerHTML = WARE.map((w, k) => {
    const munition = w.waffe === "munition";
    const waffe = munition ? null : WAFFEN[w.waffe];
    const name = munition ? L("Munition für alles", "Ammo for everything") : waffe.name;
    const hat = !munition && zustand.arsenal.besitzt(w.waffe);
    const reicht = zustand.geld >= w.preis;
    const bild = munition ? "" : Waffenbilder.datenUrl(w.waffe);
    const wucht = munition
      ? L("füllt jede Waffe auf", "tops up every weapon")
      : L(`Schaden ${waffe.schaden} · Reichweite ${Math.round(waffe.reichweite)} m`,
          `Damage ${waffe.schaden} · range ${Math.round(waffe.reichweite)} m`);
    return `<li>
      <button type="button" data-kauf="${k}" ${reicht ? "" : "disabled"}>
        <i class="sladen__bild">${bild ? `<img src="${bild}" alt="" width="84" height="26">` : "+"}</i>
        <span class="sladen__text">
          <b>${k + 1} · ${name}${hat ? " ✓" : ""}</b>
          <small>${wucht} · ${w.munition} ${L("Schuss", "rounds")}</small>
        </span>
        <em>$${w.preis}</em>
      </button>
    </li>`;
  }).join("");
}

function kaufen(nr) {
  const w = WARE[nr];
  if (!w) return;
  if (zustand.geld < w.preis) {
    hinweis(L("Zu wenig Geld", "Not enough money"));
    return;
  }
  zustand.geld -= w.preis;
  if (w.waffe === "munition") zustand.arsenal.nachladen(w.munition);
  else zustand.arsenal.geben(w.waffe, w.munition);
  Ton.kasse();
  waffeZeigen();
  ladenZeichnen();
  hudFahndung();
}

ladenFeld.addEventListener("click", e => {
  const k = e.target.closest("[data-kauf]");
  if (k) { kaufen(parseInt(k.dataset.kauf, 10)); return; }
  if (e.target.closest("[data-ladenzu]")) ladenSchliessen();
});

/* ── Große Karte (Taste M) ──
   Sie hält das Spiel an, zeigt die ganze Stadt mit Zielen und lässt
   einen Wegpunkt setzen. Zoomen mit dem Mausrad, schieben mit
   gedrückter Maustaste. */
let ansicht = null;
let karteBild = 0;
let karteMaus = null;            // Zeigerposition auf der großen Karte

function karteUmschalten(an) {
  const auf = an === undefined ? grossFeld.hidden : an;
  grossFeld.hidden = !auf;
  zustand.pause = auf;
  pauseFeld.hidden = true;
  if (auf) {
    karteFrisch(true);
    karteSchleife();
  } else {
    cancelAnimationFrame(karteBild);
    letzte = performance.now();
    leinwand.focus();
  }
}

function karteFrisch(neu) {
  const dpr = Math.min(2.5, devicePixelRatio || 1);
  const kasten = grossKarte.getBoundingClientRect();
  const b = Math.max(320, Math.round(kasten.width * dpr));
  const h = Math.max(240, Math.round(kasten.height * dpr));
  if (grossKarte.width !== b || grossKarte.height !== h) {
    grossKarte.width = b;
    grossKarte.height = h;
    neu = true;
  }
  if (neu || !ansicht) {
    const standard = Minikarte.ansichtStandard(grossKarte);
    if (!ansicht) ansicht = standard;
    else ansicht.grund = standard.grund;
  }
  Minikarte.ansichtBegrenzen(grossKarte, ansicht);
}

function karteSchleife() {
  if (grossFeld.hidden) return;
  karteFrisch(false);
  Minikarte.grosseKarteZeichnen(grossKarte, zustand, spieler(), ansicht, karteMaus);
  karteBild = requestAnimationFrame(karteSchleife);
}

grossKarte.addEventListener("wheel", e => {
  e.preventDefault();
  if (!ansicht) return;
  const vorher = Minikarte.ortAusKlick(grossKarte, ansicht, e.clientX, e.clientY);
  ansicht.pxProM *= e.deltaY > 0 ? 0.85 : 1.18;
  Minikarte.ansichtBegrenzen(grossKarte, ansicht);
  const nachher = Minikarte.ortAusKlick(grossKarte, ansicht, e.clientX, e.clientY);
  ansicht.x += vorher.x - nachher.x;
  ansicht.y += vorher.y - nachher.y;
  Minikarte.ansichtBegrenzen(grossKarte, ansicht);
}, { passive: false });

let schieben = null;
grossKarte.addEventListener("pointermove", e => {
  const kasten = grossKarte.getBoundingClientRect();
  if (!kasten.width) return;
  karteMaus = {
    x: (e.clientX - kasten.left) / kasten.width * grossKarte.width,
    y: (e.clientY - kasten.top) / kasten.height * grossKarte.height
  };
});
grossKarte.addEventListener("pointerleave", () => { karteMaus = null; });

grossKarte.addEventListener("pointerdown", e => {
  grossKarte.setPointerCapture(e.pointerId);
  schieben = { x: e.clientX, y: e.clientY, weg: 0, ax: ansicht.x, ay: ansicht.y };
});
grossKarte.addEventListener("pointermove", e => {
  if (!schieben) return;
  const kasten = grossKarte.getBoundingClientRect();
  const massstab = (grossKarte.width / kasten.width) / ansicht.pxProM;
  const dx = (e.clientX - schieben.x) * massstab;
  const dy = (e.clientY - schieben.y) * massstab;
  schieben.weg = Math.max(schieben.weg, Math.hypot(e.clientX - schieben.x, e.clientY - schieben.y));
  ansicht.x = schieben.ax - dx;
  ansicht.y = schieben.ay - dy;
  Minikarte.ansichtBegrenzen(grossKarte, ansicht);
});
grossKarte.addEventListener("pointerup", e => {
  if (!schieben) return;
  const kurz = schieben.weg < 5;
  schieben = null;
  if (kurz) wegpunktSetzen(Minikarte.ortAusKlick(grossKarte, ansicht, e.clientX, e.clientY));
});
grossKarte.addEventListener("pointercancel", () => { schieben = null; });

function wegpunktSetzen(ort) {
  if (!ort) return;
  const alt = zustand.wegpunkt;
  if (alt && Math.hypot(alt.x - ort.x, alt.y - ort.y) < 25) {
    zustand.wegpunkt = null;
    zustand.route.leeren();
    hinweis(L("Wegpunkt gelöscht", "Waypoint cleared"));
    return;
  }
  zustand.wegpunkt = { x: ort.x, y: ort.y };
  zustand.route.leeren();
  const pos = spieler().imAuto || spieler();
  zustand.route.aktualisieren(pos.x, pos.y, zustand.wegpunkt, 9);
  hinweis(L("Wegpunkt gesetzt", "Waypoint set"));
}

grossFeld.addEventListener("click", e => {
  const k = e.target.closest("[data-gross]");
  if (!k) return;
  if (k.dataset.gross === "ton") tonUmschalten();
  if (k.dataset.gross === "vollbild") vollbildUmschalten();
  if (k.dataset.gross === "wegpunkt") {
    zustand.wegpunkt = null;
    zustand.route.leeren();
  }
  if (k.dataset.gross === "zu") karteUmschalten(false);
});

/* ── Minikarte: zoomen und Wegpunkt setzen ──────────────── */
radar.addEventListener("wheel", e => {
  e.preventDefault();
  Minikarte.zoomen(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

radar.addEventListener("click", e => {
  /* Mit dem Finger ist die Minikarte zu klein, um darauf zu zielen —
     dort öffnet ein Tipp die große Karte, und der Wegpunkt wird dort
     gesetzt. Mit der Maus bleibt es beim Wegpunkt. */
  if (istTouch) { karteUmschalten(true); return; }
  const ort = Minikarte.ortAusMinikarte(radar, spieler(), e.clientX, e.clientY);
  wegpunktSetzen(ort);
});

/* ── Ton an und aus ─────────────────────────────────────── */
function tonUmschalten() {
  const an = Ton.stumm();
  tonKnopf.classList.toggle("is-aus", !an);
  hinweis(an ? L("Ton an", "Sound on") : L("Ton aus", "Sound off"));
}
tonKnopf.addEventListener("click", tonUmschalten);
if (karteKnopf) karteKnopf.addEventListener("click", () => karteUmschalten());

/* ── Vollbild ───────────────────────────────────────────── */
function vollbildUmschalten() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else if (buehne.requestFullscreen) {
    buehne.requestFullscreen().catch(() => hinweis(L("Vollbild geht hier nicht", "Fullscreen is not available here")));
  }
}
vollKnopf.addEventListener("click", vollbildUmschalten);
document.addEventListener("fullscreenchange", () => {
  groesseAnpassen();
  if (document.fullscreenElement) leinwand.focus();
});

/* ── Pause, Start ───────────────────────────────────────── */
function pauseUmschalten(an) {
  zustand.pause = an === undefined ? !zustand.pause : an;
  pauseFeld.hidden = !zustand.pause;
  if (!zustand.pause) letzte = performance.now();
}
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseUmschalten(true); });
pauseFeld.addEventListener("click", () => pauseUmschalten(false));

/* ── Zugang ──
   Das Spiel merkt sich Geld, erledigte Aufträge und den Bestwert im
   Konto — deshalb geht es nur angemeldet. Ist gar kein Konto-Backend
   eingerichtet (etwa lokal ohne Firebase), bleibt die Tür offen, sonst
   könnte niemand spielen. */
let torOffen = false;

function torPruefen() {
  torOffen = !konto.backend || !!konto.nutzer;
  if (zustand.laeuft) { torFeld.hidden = true; return; }
  torFeld.hidden = torOffen;
  start.hidden = !torOffen;
}

kontoBereit.then(torPruefen);
kontoAbo(torPruefen);
/* Falls das Konto-Modul hängt, nach ein paar Sekunden trotzdem entscheiden */
setTimeout(torPruefen, 4000);

torFeld.addEventListener("click", e => {
  const k = e.target.closest("[data-tor]");
  if (!k) return;
  dialogOeffnen(k.dataset.tor === "neu" ? "registrieren" : "anmelden");
});

async function starten() {
  if (!torOffen) { torPruefen(); return; }
  start.classList.add("is-laden");
  const autos = Object.keys(TYPEN).map(t => "auto_" + t);
  const ampeln = ["ampel_rot", "ampel_gelb", "ampel_gruen"];
  /* Hauptfiguren: vier Richtungen mal vier Posen. Alle anderen ein Bild. */
  const figuren = [];
  for (const art of ["lucia", "jason"]) {
    figuren.push(`${art}_steht`);
    for (const r of ["vorn", "hinten", "links", "rechts"]) {
      for (let i = 0; i < 4; i++) figuren.push(`${art}_${r}${i}`);
    }
  }
  for (const art of [...PASSANT_ARTEN, "polizist", "polizistin", "swat",
                     "polizist_sommer", "sanitaeterin", "feuerwehr_mann"]) {
    figuren.push(`${art}_steht`);
  }
  Tex.bauen();
  Waffenbilder.bauen();
  await Bilder.laden([...autos, ...ampeln, ...figuren]);

  Ton.bereit();
  touchEinrichten();
  weltBauen();
  groesseAnpassen();
  start.hidden = true;
  leinwand.focus();
  zustand.laeuft = true;
  hud.figur.textContent = spieler().daten.name;
  waffeZeigen();
  bestwertLaden();
  bestenlisteZeigen();
  addEventListener("pagehide", bestwertSichern);
  hinweis(L("E einsteigen · Maustaste schlagen · Leertaste springen · M Karte",
            "E to get in · mouse to fight · space to jump · M for the map"));
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

/* Rechtsklick im Spiel soll kein Browser-Menü öffnen */
buehne.addEventListener("contextmenu", e => e.preventDefault());
