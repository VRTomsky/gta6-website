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
import { Figur, passantenVerteilen, passantenNachziehen, panik, PASSANT_ARTEN, LAUF_LEUTE } from "./wesen.js";
import { Fahrzeug, autosVerteilen, TYPEN } from "./fahrzeug.js";
import { verkehrAufbauen, verkehrNachziehen } from "./verkehr.js";
import { Fahndung, STUFEN } from "./polizei.js";
import { Missionen } from "./missionen.js";
import * as Innen from "./innen.js";
import { istAdmin } from "../konto/rolle.js";
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
/* Durchsichtig: in 3D liegt diese Leinwand über dem 3D-Bild und zeigt
   nur das Fadenkreuz */
const ctx = leinwand.getContext("2d");
const hud = {
  figur: document.querySelector("[data-hud=figur]"),
  tempo: document.querySelector("[data-hud=tempo]"),
  ort: document.querySelector("[data-hud=ort]"),
  hinweis: document.querySelector("[data-hud=hinweis]"),
  geld: document.querySelector("[data-hud=geld]"),
  sterne: document.querySelector("[data-hud=sterne]"),
  leben: document.querySelector("[data-hud=leben]"),
  lebenZahl: document.querySelector("[data-hud=lebenZahl]"),
  ausdauer: document.querySelector("[data-hud=ausdauer]"),
  ausdauerZahl: document.querySelector("[data-hud=ausdauerZahl]"),
  panzer: document.querySelector("[data-hud=panzer]"),
  panzerZahl: document.querySelector("[data-hud=panzerZahl]"),
  waffe: document.querySelector("[data-hud=waffe]"),
  waffenBild: document.querySelector("[data-hud=waffenbild]"),
  schuss: document.querySelector("[data-hud=schuss]"),
  endeText: document.querySelector("[data-hud=endeText]"),
  auftrag: document.querySelector("[data-hud=auftrag]")
};
const radar = document.getElementById("spielKarte");
const grossFeld = document.getElementById("spielGross");
const grossKarte = document.getElementById("spielGrossKarte");
const orteFeld = document.getElementById("spielOrte");
const devFeld = document.getElementById("spielDev");
const devInhalt = document.getElementById("spielDevInhalt");
const devKnopf = document.getElementById("spielDevKnopf");
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
  ausdauer: 100,              // Rennen kostet, Essen und Trinken füllt auf
  panzerung: 0,               // Weste aus dem Waffenladen, fängt Schaden ab
  schadenNehmen: null,        // wird unten gesetzt, auch für polizei.js
  geld: 0,
  innen: null,                // Zustand im Gebäude (innen.js)
  clubTueren: [],             // Eingänge der drei Nachtclubs
  tueren: [],                 // 24/7, Klinik, Wache, Bank (seit 25.09.2026)
  fehler: [],                 // letzte Aussetzer, auch in localStorage
  /* Schalter aus dem Entwicklermenü (nur Admins) */
  cheats: { leben: false, panzer: false, ausdauer: false, polizei: false, nacht: false,
            auto: false, turbo: false },
  schwarz: null,              // { rest, dauer, text } für die Ausblendung
  clubTuer: null,             // Eingang des Pink Flamingo auf der Straße
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

zustand.schadenNehmen = menge => schadenNehmen(menge);

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

/* ── 3D (welt3d.js, Three.js) ──
   Die Spiellogik ist dieselbe, nur das Bild entsteht in 3D. Umschalten
   mit T oder dem Knopf; die Wahl bleibt im Browser gespeichert. */
let W3 = null;
let modus3d = (() => {
  try {
    const w = localStorage.getItem("spiel-3d");
    if (w === "1") return true;
    if (w === "0") return false;
  } catch (e) { /* privat */ }
  return true;
})();
let letzteDt = 1 / 60;
const knopf3d = document.getElementById("spiel3dKnopf");

function knopf3dZeigen() {
  if (!knopf3d) return;
  knopf3d.textContent = modus3d ? "2D" : "3D";
  knopf3d.title = modus3d ? L("Zur 2D-Ansicht (T)", "Switch to 2D (T)") : L("Zur 3D-Ansicht (T)", "Switch to 3D (T)");
}

async function dreiDLaden() {
  if (W3) return true;
  try {
    const modul = await import("./welt3d.js");
    modul.einrichten(buehne, leinwand);
    modul.groesse(leinwand.clientWidth, leinwand.clientHeight);
    W3 = modul;
    return true;
  } catch (fehler) {
    console.warn("[Spiel] 3D nicht verfügbar", fehler);
    return false;
  }
}

async function dreiDUmschalten() {
  const neu = !modus3d;
  if (neu) {
    hinweis(L("3D wird geladen …", "Loading 3D …"));
    if (!(await dreiDLaden())) {
      hinweis(L("3D geht auf diesem Gerät nicht", "3D doesn't work on this device"));
      return;
    }
    W3.kameraSetzen(spieler());
  } else if (document.pointerLockElement === leinwand) {
    document.exitPointerLock();
  }
  modus3d = neu;
  try { localStorage.setItem("spiel-3d", modus3d ? "1" : "0"); } catch (e) { /* privat */ }
  if (W3) W3.sichtbar(modus3d);
  knopf3dZeigen();
  hinweis(modus3d ? L("3D — Klick ins Bild, dann lenkt die Maus die Kamera", "3D — click the view to steer the camera with the mouse")
                  : L("2D-Ansicht", "2D view"));
}
if (knopf3d) knopf3d.addEventListener("click", () => dreiDUmschalten());
knopf3dZeigen();

/* Maus fängt die Kamera: nach einem Klick ins Bild (nur 3D, nur mit Maus) */
document.addEventListener("mousemove", e => {
  if (!modus3d || !W3 || zustand.wahl) return;
  if (document.pointerLockElement !== leinwand) return;
  W3.drehen(e.movementX || 0, e.movementY || 0);
});
document.addEventListener("pointerlockchange", () => {
  if (W3) W3.kam.gefangen = document.pointerLockElement === leinwand;
});

addEventListener("keydown", e => {
  if (!zustand.laeuft) return;
  /* Pfeiltasten, Leertaste und Alt sollen die Seite nicht bedienen */
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Tab", "AltLeft", "AltRight"].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (e.code === "F8") { e.preventDefault(); devUmschalten(); return; }
  if (!devFeld.hidden) {                           // Entwicklermenü offen
    if (e.code === "Escape") devUmschalten(false);
    return;
  }
  tasten.add(e.code);
  if (zustand.fahrt) return;                       // während der Kamerafahrt nichts
  if (!ladenFeld.hidden) {                         // Laden offen
    if (e.code === "Escape" || e.code === "KeyE" || e.code === "KeyF") ladenSchliessen();
    const nr = "Digit1 Digit2 Digit3 Digit4 Digit5 Digit6".split(" ").indexOf(e.code);
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
  if (e.code === "KeyT") dreiDUmschalten();
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
leinwand.addEventListener("mouseleave", () => {
  if (document.pointerLockElement === leinwand) return;
  maus.imBild = false;
  maus.feuer = false;
});
leinwand.addEventListener("mousedown", e => {
  if (e.button !== 0 || !zustand.laeuft) return;
  leinwand.focus();
  if (modus3d && W3 && !istTouch && document.pointerLockElement !== leinwand && !zustand.innen) {
    leinwand.requestPointerLock();
    return;                                        // erster Klick fängt nur die Maus
  }
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
  zustand.clubTueren = clubTuerenSuchen();
  zustand.tueren = tuerenSuchen();
  figurenVerteilen();
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

/* ── Wo das Spiel beginnt ──
   Immer derselbe Startplatz wurde langweilig. Jetzt startet jede Figur
   an einem anderen Ort der Stadt, und wer gerade nicht dran ist, sitzt
   manchmal in einem Wagen davor. */
function figurenVerteilen() {
  const orte = Karte.wahrzeichen.slice();
  for (let i = orte.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orte[i], orte[j]] = [orte[j], orte[i]];
  }
  const namen = Object.keys(zustand.figuren);
  namen.forEach((name, k) => {
    const ort = orte[k % orte.length];
    if (!ort) return;
    const p = Karte.freierPunkt(ort.x, ort.y, [Karte.ART.GEHWEG, Karte.ART.PARK], 24);
    const figur = zustand.figuren[name];
    figur.x = p.x;
    figur.y = p.y;
    figur.vx = figur.vy = 0;
    figur.streifzug = null;
    /* Die nicht gespielte Figur setzt sich manchmal in einen Wagen */
    if (name !== zustand.aktiv && Math.random() < 0.4) {
      const wagen = zustand.autos.find(a => !a.fahrer &&
        Math.hypot(a.x - p.x, a.y - p.y) < 30);
      if (wagen) { figur.imAuto = wagen; wagen.fahrer = figur; }
    }
  });
  const held = spieler();
  kamera.x = held.x;
  kamera.y = held.y;
  zustand.missionen = new Missionen(held.x, held.y);
}

/* ── Pink Flamingo ──────────────────────────────────────────
   Die Tür liegt auf dem Gehweg vor dem Club: die nächste begehbare
   Kachel am Rand des Grundstücks. Dort steht der Leuchtpunkt, und dort
   steht man auch wieder, wenn man herauskommt. */
/* Die nächste Gehwegkachel vor einem Wahrzeichen — dort liegt der
   Eingang, dort steht man nach dem Verlassen wieder. */
const tuerVor = ort => Karte.eingangVor(ort);

function clubTuerenSuchen() {
  return Karte.wahrzeichen
    .filter(w => w.bau === Karte.BAU.CLUB)
    .map(w => { const t = tuerVor(w); if (t) t.start = "eingang"; return t; })
    .filter(Boolean);
}

/* Weitere Häuser zum Betreten: an jeder Tankstelle ein 24/7, dazu jede
   Klinik, jede Wache und die Bank. Farbe = Leuchtpunkt vor der Tür. */
const BETRETBAR = [
  { bau: Karte.BAU.TANKSTELLE, raum: "markt", farbe: "255,170,70", name: "24/7" },
  { bau: Karte.BAU.KRANKENHAUS, raum: "klinik", farbe: "255,110,125" },
  { bau: Karte.BAU.POLIZEI, raum: "polizei", farbe: "90,170,255" },
  { bau: Karte.BAU.BANK, raum: "bank", farbe: "255,210,74" }
];

function tuerenSuchen() {
  const liste = [];
  for (const art of BETRETBAR) {
    for (const w of Karte.wahrzeichen.filter(o => o.bau === art.bau)) {
      const t = tuerVor(w);
      if (!t) continue;
      t.start = art.raum;
      t.farbe = art.farbe;
      if (art.name) t.name = `${art.name} · ${w.name}`;
      liste.push(t);
    }
  }
  return liste;
}

/* Tür, vor der der Spieler gerade steht — Clubs und Ammu-Vice */
function clubTuerNah(f, weite = 2.6) {
  let beste = null, bestWeit = weite;
  for (const t of zustand.clubTueren.concat(zustand.laeden, zustand.tueren)) {
    const d = Math.hypot(t.x - f.x, t.y - f.y);
    if (d < bestWeit) { bestWeit = d; beste = t; }
  }
  return beste;
}

function clubBetreten(tuer) {
  zustand.clubTuer = tuer;
  Innen.betreten(zustand, tuer.start || "eingang", "raus");
  radar.hidden = true;
  Ton.tuer();
  Ton.anhalten();
  innenLetzte = "";
  hinweis(L(`${tuer.name} — WASD laufen, E benutzen`,
            `${tuer.name} — WASD to walk, E to use`));
}

function clubVerlassen() {
  const f = spieler();
  if (zustand.clubTuer) {
    f.x = zustand.clubTuer.x;
    f.y = zustand.clubTuer.y + 2;
    f.vx = f.vy = 0;
  }
  zustand.innen = null;
  zustand.schwarz = null;
  radar.hidden = false;
  Ton.tuer();
  kamera.x = f.x;
  kamera.y = f.y;
}

/* E im Gebäude: Tür, Getränk, Essen oder VIP */
function innenTaste() {
  const a = Innen.naheAktion(zustand);
  if (!a) return;
  if (a.art === "tuer") {
    if (a.ziel === "raus") { clubVerlassen(); return; }
    Innen.betreten(zustand, a.ziel, zustand.innen.raum);
    innenLetzte = "";                              // Hinweis neu zeigen
    Ton.tuer();
    hinweis(L(...Innen.raumName(zustand)));
    return;
  }
  if (a.art === "drink" || a.art === "essen") {
    if (zustand.geld < a.preis) {
      hinweis(L(`Zu wenig Geld ($${a.preis})`, `Not enough money ($${a.preis})`));
      return;
    }
    zustand.geld -= a.preis;
    const essen = a.art === "essen";
    zustand.leben = Math.min(100, zustand.leben + (essen ? 40 : 18));
    zustand.ausdauer = Math.min(100, zustand.ausdauer + (essen ? 55 : 80));
    Ton.kasse();
    hinweis(essen ? L("Burger und Pommes — satt", "Burger and fries — full")
                  : L("Ein Drink aufs Haus-Preis", "One drink, house price"));
    return;
  }
  if (a.art === "laden") { ladenOeffnen(); return; }
  if (a.art === "schiessen") {
    if (zustand.geld < a.preis) {
      hinweis(L(`Eine Runde kostet $${a.preis}`, `A round costs $${a.preis}`));
      return;
    }
    zustand.geld -= a.preis;
    /* Kleine Runde: zehn Schuss, Treffer je nach Glück — mit Übung
       (jede Runde zählt) wird man besser. */
    zustand.schiessRunden = (zustand.schiessRunden || 0) + 1;
    const koennen = Math.min(0.85, 0.35 + zustand.schiessRunden * 0.04);
    let treffer = 0;
    for (let k = 0; k < 10; k++) if (Math.random() < koennen) treffer++;
    zustand.schiessBest = Math.max(zustand.schiessBest || 0, treffer);
    for (let k = 0; k < 4; k++) setTimeout(() => Ton.schuss(0.6), k * 180);
    hinweis(L(`Schießtraining: ${treffer} von 10 Treffern · Bestwert ${zustand.schiessBest}`,
              `Target practice: ${treffer} of 10 hits · best ${zustand.schiessBest}`));
    return;
  }
  if (a.art === "tanz") {
    if (zustand.geld < a.preis) {
      hinweis(L(`Der VIP-Raum kostet $${a.preis}`, `The VIP room costs $${a.preis}`));
      return;
    }
    zustand.geld -= a.preis;
    zustand.schwarz = { rest: 4.2, dauer: 4.2 };
    Ton.kasse();
    return;
  }
  neueRaumAktion(a);
}

/* ── 24/7, Klinik, Wache, Bank ──────────────────────────────
   Kaufen, heilen, Strafe zahlen — oder ausrauben. Eine ausgeräumte
   Kasse bleibt ein paar Minuten leer, außer ein Auftrag verlangt sie. */
function bezahlen(preis) {
  if (zustand.geld < preis) {
    hinweis(L(`Zu wenig Geld ($${preis})`, `Not enough money ($${preis})`));
    return false;
  }
  zustand.geld -= preis;
  Ton.kasse();
  return true;
}

function ausrauben(von, bis, sterne, pause) {
  const tuer = zustand.clubTuer || {};
  const auftrag = zustand.missionen.wartetAuf(tuer.start === "bank" ? "schalter" : "kasse");
  if (!auftrag && tuer.leerBis && zustand.zeit < tuer.leerBis) {
    hinweis(L("Hier ist gerade nichts zu holen — komm später wieder",
              "Nothing left to take — come back later"));
    return 0;
  }
  const beute = Math.round(von + Math.random() * (bis - von));
  zustand.geld += beute;
  tuer.leerBis = zustand.zeit + pause;
  mindestens(sterne);
  hudFahndung();
  Ton.kasse();
  return beute;
}

function neueRaumAktion(a) {
  const m = zustand.missionen;
  switch (a.art) {
    case "getraenk":
      if (!bezahlen(a.preis)) return;
      zustand.ausdauer = Math.min(100, zustand.ausdauer + 45);
      zustand.leben = Math.min(100, zustand.leben + 5);
      hinweis(L("Eistee aus dem Kühlregal — kalt und süß", "Iced tea from the fridge — cold and sweet"));
      return;
    case "snack":
      if (!bezahlen(a.preis)) return;
      zustand.leben = Math.min(100, zustand.leben + 25);
      hinweis(L("Chips und ein Schokoriegel", "Chips and a candy bar"));
      return;
    case "kasse": {
      const beute = ausrauben(150, 450, 2, 240);
      if (!beute) return;
      m.aktionMelden("kasse");
      hinweis(L(`Kasse geleert: +$${beute} — der Kassierer drückt den Alarm`,
                `Till emptied: +$${beute} — the clerk hits the alarm`));
      return;
    }
    case "schalter": {
      const beute = ausrauben(600, 1200, 3, 300);
      if (!beute) return;
      m.aktionMelden("schalter");
      hinweis(L(`Schalter ausgeräumt: +$${beute} — stiller Alarm!`,
                `Counter cleaned out: +$${beute} — silent alarm!`));
      return;
    }
    case "heilen":
      if (zustand.leben >= 100) {
        hinweis(L("Der Arzt findet nichts — du bist kerngesund", "The doctor finds nothing — you're fine"));
        return;
      }
      if (!bezahlen(a.preis)) return;
      zustand.leben = 100;
      hinweis(L("Zusammengeflickt — Leben voll", "Patched up — full health"));
      return;
    case "spenden":
      if (zustand.leben < 60) {
        hinweis(L("Zu schwach zum Blutspenden", "Too weak to give blood"));
        return;
      }
      zustand.leben -= 30;
      zustand.geld += 60;
      Ton.kasse();
      hinweis(L("Blut gespendet: +$60 und ein Keks", "Blood donated: +$60 and a cookie"));
      return;
    case "akte":
      m.aktionMelden("akte");
      Ton.tuer();
      hinweis(L("Akte eingesteckt — nichts wie raus", "File pocketed — get out of here"));
      return;
    case "strafe": {
      const stufe = zustand.fahndung.stufe;
      if (!stufe) {
        hinweis(L("Gegen dich liegt nichts vor", "There's nothing on you"));
        return;
      }
      const preis = 300 * stufe;
      if (!bezahlen(preis)) return;
      zustand.fahndung.loeschen();
      hudFahndung();
      hinweis(L(`Strafe bezahlt ($${preis}) — Fahndung gelöscht`,
                `Fine paid ($${preis}) — wanted level cleared`));
      return;
    }
  }
}

/* ── Ein- und Aussteigen, Laden betreten ─────────────────── */
function einsteigenOderLaden() {
  const f = spieler();
  if (zustand.innen) { innenTaste(); return; }
  if (!f.imAuto) {
    const tuer = clubTuerNah(f);
    if (tuer) { clubBetreten(tuer); return; }
  }
  if (!f.imAuto) {
    const laden = zustand.laeden.find(l => Math.hypot(l.x - f.x, l.y - f.y) < 4);
    if (laden) { clubBetreten(laden); return; }
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
  /* Ein abgestellter Wagen fährt nicht von selbst weiter. Ohne den Merker
     übernahm die Verkehrs-KI ihn sofort wieder, als säße jemand drin.
     Er rollt aus, bleibt stehen und wird später weit weg neu eingesetzt. */
  auto.verlassen = true;
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
  if (modus3d && W3) return W3.gier();
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
  const ziele = zustand.passanten.concat(zustand.fahndung.ziele(), zustand.missionen.zusatzZiele());
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
    if (z.istAuto) { mindestens(1); continue; }
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
  const kraft = Math.max(0, Math.min(100, zustand.ausdauer));
  hud.ausdauer.style.width = kraft + "%";
  hud.ausdauerZahl.textContent = Math.round(kraft);
  const panzer = Math.max(0, Math.min(100, zustand.panzerung));
  hud.panzer.style.width = panzer + "%";
  hud.panzerZahl.textContent = Math.round(panzer);
  hud.geld.textContent = "$" + zustand.geld.toLocaleString(EN ? "en-US" : "de-DE");
}

/* ── Schaden ──
   Alles, was wehtut, läuft hier durch: erst frisst die Weste, was übrig
   bleibt geht ans Leben. */
function schadenNehmen(menge) {
  /* Auch von außen erreichbar — die Polizei schießt aus ihrem Modul */
  if (menge <= 0) return;
  if (zustand.panzerung > 0) {
    const weg = Math.min(zustand.panzerung, menge);
    zustand.panzerung -= weg;
    menge -= weg;
  }
  zustand.leben -= menge;
}

/* ── Die zweite Figur ──
   Sie stand bisher regungslos herum, bis man zu ihr wechselte. Jetzt
   schlendert sie über den Gehweg oder sitzt in ihrem Wagen. */
function zweitLeben(figur, dt) {
  if (figur.imAuto) {
    figur.imAuto.fahren(0, 0, false, dt);
    figur.x = figur.imAuto.x;
    figur.y = figur.imAuto.y;
    return;
  }
  figur.streifzugZeit = (figur.streifzugZeit || 0) - dt;
  if (!figur.streifzug || figur.streifzugZeit <= 0) {
    /* Selbst würfeln statt Karte.freierPunkt: das liefert bei gleichem
       Start immer denselben Punkt — und der lag direkt vor den Füßen,
       weshalb die zweite Figur sich keinen Meter bewegt hat. */
    figur.streifzug = null;
    for (let k = 0; k < 24 && !figur.streifzug; k++) {
      const w = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 16;
      const x = figur.x + Math.cos(w) * r, y = figur.y + Math.sin(w) * r;
      const a = Karte.art(Karte.inKachel(x), Karte.inKachel(y));
      if (a === Karte.ART.GEHWEG || a === Karte.ART.PARK) figur.streifzug = { x, y };
    }
    figur.streifzugZeit = 6 + Math.random() * 8;
  }
  const dx = figur.streifzug ? figur.streifzug.x - figur.x : 0;
  const dy = figur.streifzug ? figur.streifzug.y - figur.y : 0;
  const weit = Math.hypot(dx, dy);
  if (!figur.streifzug || weit < 0.8) {
    figur.streifzug = null;
    figur.bewegen(0, 0, false, dt);
    return;
  }
  figur.bewegen((dx / weit) * 0.5, (dy / weit) * 0.5, false, dt);
}

/* ── Ausdauer ──
   Rennen kostet, Stehen füllt langsam wieder auf. Essen und Getränke im
   Club füllen sie auf einen Schlag. */
function ausdauerRechnen(dt, rennt) {
  zustand.ausdauer = Math.max(0, Math.min(100,
    zustand.ausdauer + (rennt ? -20 : 8) * dt));
}

/* ── Im Gebäude ──────────────────────────────────────────── */
let innenLetzte = "";
function innenRechnen(dt) {
  /* Schwarzbild nach dem VIP-Besuch */
  if (zustand.schwarz) {
    Ton.club(dt, 1.5);
    zustand.schwarz.rest -= dt;
    if (zustand.schwarz.rest <= 0) {
      zustand.schwarz = null;
      zustand.leben = 100;
      zustand.ausdauer = 100;
      hinweis(L("Teuer. Aber du fühlst dich wie neu.",
                "Pricey. But you feel brand new."));
    }
    hudFahndung();
    return;
  }

  let vor = (gedrueckt(TASTE.hoch) ? 1 : 0) - (gedrueckt(TASTE.runter) ? 1 : 0);
  let quer = (gedrueckt(TASTE.rechts) ? 1 : 0) - (gedrueckt(TASTE.links) ? 1 : 0);
  if (finger.aktiv) { quer = finger.x; vor = -finger.y; }
  const willRennen = tasten.has("ShiftLeft") || tasten.has("ShiftRight");
  const rennt = willRennen && zustand.ausdauer > 1 && (quer !== 0 || vor !== 0);
  ausdauerRechnen(dt, rennt);

  const naht = Innen.rechnen(dt, quer, -vor, rennt, zustand);
  const schluessel = naht ? naht.art + (naht.ziel || "") : "";
  if (schluessel !== innenLetzte) {
    innenLetzte = schluessel;
    if (naht) hinweis(innenText(naht));
  }
  if (Innen.RAEUME[zustand.innen.raum].musik) Ton.club(dt);
  hudFahndung();
  hud.ort.textContent = L(...Innen.raumName(zustand));
  hud.tempo.textContent = "";
}

function innenText(a) {
  if (a.art === "tuer") {
    return a.ziel === "raus" ? L("E — zurück auf die Straße", "E — back outside")
                             : L("E — Tür", "E — door");
  }
  if (a.art === "drink") return L(`E — Drink kaufen ($${a.preis})`, `E — buy a drink ($${a.preis})`);
  if (a.art === "essen") return L(`E — Essen kaufen ($${a.preis})`, `E — buy food ($${a.preis})`);
  if (a.art === "tanz") return L(`E — Private Dance ($${a.preis})`, `E — private dance ($${a.preis})`);
  if (a.art === "laden") return L("E — an die Theke: Waffen, Munition, Weste", "E — counter: guns, ammo, armour");
  if (a.art === "schiessen") return L(`E — Schießtraining ($${a.preis})`, `E — target practice ($${a.preis})`);
  if (a.art === "getraenk") return L(`E — Eistee kaufen ($${a.preis})`, `E — buy iced tea ($${a.preis})`);
  if (a.art === "snack") return L(`E — Snacks kaufen ($${a.preis})`, `E — buy snacks ($${a.preis})`);
  if (a.art === "kasse") return L("E — Kasse ausrauben (★★)", "E — rob the till (★★)");
  if (a.art === "schalter") return L("E — Schalter ausrauben (★★★)", "E — rob the counter (★★★)");
  if (a.art === "heilen") return L(`E — behandeln lassen ($${a.preis})`, `E — get treated ($${a.preis})`);
  if (a.art === "spenden") return L("E — Blut spenden (+$60)", "E — give blood (+$60)");
  if (a.art === "akte") return L("E — Akte einstecken", "E — take the file");
  if (a.art === "strafe") {
    const n = zustand.fahndung.stufe;
    return n ? L(`E — Strafe zahlen ($${300 * n}), Fahndung weg`, `E — pay the fine ($${300 * n}), clear wanted level`)
             : L("E — Tresen", "E — front desk");
  }
  return "";
}

function innenZeichnen() {
  Innen.zeichnen(ctx, zustand, kamera);
  if (!zustand.schwarz) return;
  /* Ausblendung: rein, halten, wieder heraus */
  const f = zustand.schwarz;
  const anteil = 1 - f.rest / f.dauer;
  const deckung = Math.min(1, anteil * 4, f.rest * 4);
  ctx.fillStyle = `rgba(0,0,0,${deckung})`;
  ctx.fillRect(0, 0, kamera.breite, kamera.hoehe);
  if (deckung > 0.9) {
    ctx.fillStyle = "rgba(255,74,160,.75)";
    ctx.font = `700 ${Math.round(kamera.hoehe * 0.05)}px "Barlow Condensed", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("VIP", kamera.breite / 2, kamera.hoehe / 2);
    ctx.textAlign = "start";
  }
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
    /* Polizisten zu Fuß kann man auch umfahren — sie sind nicht aus
       Stein. Das kostet natürlich einen Stern extra. */
    for (const p of zustand.fahndung.polizisten) {
      if (p.tot) continue;
      if (Math.hypot(p.x - auto.x, p.y - auto.y) > 2.2) continue;
      if (tempo <= 3) continue;
      p.x += (p.x - auto.x) * 0.6 + auto.vx * 0.12;
      p.y += (p.y - auto.y) * 0.6 + auto.vy * 0.12;
      const tot = p.treffer(tempo * 8);
      if (rammPause > 0) continue;
      rammPause = 1.2;
      Ton.rumms(0.8);
      mindestens(tot ? 4 : 3);
      hinweis(tot ? L("Polizist überfahren", "You ran over a cop")
                  : L("Polizist angefahren", "You hit a cop"));
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
      /* Blech hält mehr aus als vorher, und ein Rempler kostet kein
         Leben mehr — erst ein richtig harter Aufprall tut weh, und auch
         den fängt die Weste ab. */
      auto.schaden = Math.min(130, auto.schaden + Math.max(0, wucht - 3) * 0.3);
      a.schaden = Math.min(130, (a.schaden || 0) + Math.max(0, wucht - 3) * 0.4);
      if (wucht > 11) schadenNehmen((wucht - 11) * 0.5);
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
      schadenNehmen(tempo * 1.1 * dt * 10);
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
/* Nächstes Wahrzeichen dieser Art — seit es vier Wachen und drei
   Kliniken gibt, wacht man in der nächsten auf, nicht quer durch die Stadt */
function wahrzeichenPunkt(bau, ersatzX, ersatzY) {
  const f = spieler();
  let beste = null, bestWeit = Infinity;
  for (const w of Karte.wahrzeichen) {
    if (w.bau !== bau) continue;
    const d = Math.hypot(w.x - f.x, w.y - f.y);
    if (d < bestWeit) { bestWeit = d; beste = w; }
  }
  return beste ? { x: beste.x, y: beste.y } : { x: ersatzX, y: ersatzY };
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
  const b = leinwand.clientWidth, h = leinwand.clientHeight;
  /* Im Vollbild auf einem feinen Schirm wären das über acht Millionen
     Bildpunkte je Bild — das schaffte kein Browser flüssig. Deshalb ist
     die Leinwand bei rund 2,6 Millionen Punkten gedeckelt; gestreckt
     wird sie ohnehin vom Browser. */
  const hoechst = 2.6e6;
  const dpr = Math.min(2, devicePixelRatio || 1,
                       Math.sqrt(hoechst / Math.max(1, b * h)));
  leinwand.width = Math.round(b * dpr);
  leinwand.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  kamera.breite = b;
  kamera.hoehe = h;
  if (W3) W3.groesse(b, h);
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
  /* Grenzen in Kacheln der ursprünglichen Stadt, mit dem Maßstab gestreckt */
  const S = Karte.S;
  const tx = Karte.inKachel(x) / S, ty = Karte.inKachel(y) / S;
  if (tx >= 204) return L("Ocean Drive", "Ocean Drive");
  if (tx < 26 && ty > Karte.HOEHE / S - 30) return L("Hafen", "Docks");
  if (ty < 45) return L("Nord-Vice City", "North Vice City");
  if (ty > 140) return L("Süd-Vice City", "South Vice City");
  if (tx < 60) return L("Westufer", "West Bank");
  if (tx > 150) return L("Strandviertel", "Beach District");
  return L("Innenstadt", "Downtown");
}

/* ── Schleife ───────────────────────────────────────────── */
let letzte = 0;
let letzterFehler = "";
let letztesBild = 0;

/* Ein Fehler in einem einzelnen Bild darf nicht das ganze Spiel
   einfrieren — vorher sah das aus wie ein Absturz. Jetzt wird das Bild
   übersprungen, der Fehler einmal gemeldet und weitergespielt. */
function sicher(was, name) {
  try {
    was();
    return true;
  } catch (fehler) {
    const text = String(fehler && fehler.message || fehler);
    /* Fehler sichtbar und nachlesbar machen: Der Nutzer sieht die
       Konsole nicht, deshalb landet der Bericht auch im Browser-Speicher
       und unter window.__fehler. */
    const bericht = {
      wann: new Date().toISOString(),
      wo: name,
      text,
      stapel: String(fehler && fehler.stack || "").split(String.fromCharCode(10)).slice(0, 4).join(" | ")
    };
    zustand.fehler.push(bericht);
    if (zustand.fehler.length > 20) zustand.fehler.shift();
    try {
      localStorage.setItem("spiel-fehler", JSON.stringify(zustand.fehler));
    } catch { /* privater Modus: dann eben nicht */ }
    if (text !== letzterFehler) {
      letzterFehler = text;
      console.error(`[Spiel] Fehler in ${name}:`, fehler);
      hinweis(`${L("Aussetzer", "Hiccup")}: ${text.slice(0, 70)}`);
    }
    return false;
  }
}

/* Für die Fehlersuche: ein Rechenschritt von außen, ohne Bild.
   Damit lässt sich eine Viertelstunde Spiel in Sekunden durchrechnen. */
window.__schritt = (dt = 1 / 60, male = false) => {
  zustand.zeit += dt;
  letzteDt = dt;
  rechnen(dt);
  if (male) zeichnen();
};

function schleife(jetzt) {
  if (!zustand.laeuft) return;
  requestAnimationFrame(schleife);
  letztesBild = performance.now();
  const dt = Math.min(0.05, (jetzt - letzte) / 1000 || 0);
  letzte = jetzt;
  if (zustand.pause) return;

  zustand.zeit += dt;
  letzteDt = dt;
  if (sicher(() => rechnen(dt), "rechnen")) sicher(zeichnen, "zeichnen");
}

/* Wächter: Bleibt die Bildschleife stehen — etwa weil der Browser sie
   nach einem Vollbildwechsel abgeworfen hat —, wird sie neu gestartet. */
setInterval(() => {
  if (!zustand.laeuft || zustand.pause) return;
  if (performance.now() - letztesBild < 2000) return;
  letztesBild = performance.now();
  letzte = performance.now();
  requestAnimationFrame(schleife);
}, 2000);

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

  /* Im Gebäude läuft eine eigene, viel kleinere Schleife — die Stadt
     ruht solange. */
  if (zustand.innen) { innenRechnen(dt); return; }

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
    const willRennen = tasten.has("ShiftLeft") || tasten.has("ShiftRight");
    const rennt = willRennen && zustand.ausdauer > 1 && (quer !== 0 || vor !== 0);
    ausdauerRechnen(dt, rennt);
    if (modus3d && W3) {
      /* W geht dahin, wohin die Kamera schaut */
      const g = W3.gier();
      const vx = Math.cos(g), vy = Math.sin(g);
      f.bewegen(vx * vor - vy * quer, vy * vor + vx * quer, rennt, dt);
    } else {
      f.bewegen(quer, -vor, rennt, dt);
    }
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
    zweitLeben(zustand.figuren[name], dt);
  }

  /* Verkehr: fahren lassen, was in der Nähe ist */
  const alleAutos = zustand.autos.concat(zustand.verkehr);
  for (const a of zustand.verkehr) {
    if (a.fahrer) continue;                      // gerade vom Spieler gefahren
    if (Math.abs(a.x - f.x) > 120 || Math.abs(a.y - f.y) > 120) continue;
    if (a.verlassen) { a.fahren(0, 0, true, dt); continue; }   // abgestellt
    a.denken(dt, zustand.zeit * 1000, alleAutos, zustand.passanten);
  }
  verkehrNachziehen(zustand.verkehr, f.x, f.y, 190, alleAutos);

  /* Wer im Verkehr jemanden streift, stößt ihn zur Seite und bremst
     erschrocken. Vorher fuhren die Wagen einfach durch die Leute
     hindurch, als wären sie Luft. */
  for (const a of zustand.verkehr) {
    if (a.fahrer || a.verlassen) continue;
    if (Math.abs(a.x - f.x) > 90 || Math.abs(a.y - f.y) > 90) continue;
    const tempo = Math.hypot(a.vx, a.vy);
    if (tempo < 2) continue;
    for (const p of zustand.passanten) {
      if (p.tot || Math.hypot(p.x - a.x, p.y - a.y) > 2) continue;
      p.x += (p.x - a.x) * 0.5 + a.vx * 0.08;
      p.y += (p.y - a.y) * 0.5 + a.vy * 0.08;
      p.flucht = 2.2;
      p.kreuzen = null;
      if (tempo > 10) p.treffer(tempo * 2.5);
      a.vx *= 0.6;
      a.vy *= 0.6;
      break;
    }
  }

  /* Passanten: nur die in der Nähe bewegen, der Rest ruht */
  const naheAutos = alleAutos.filter(a =>
    Math.abs(a.x - f.x) < 60 && Math.abs(a.y - f.y) < 60 && Math.hypot(a.vx, a.vy) > 3);
  for (const p of zustand.passanten) {
    if (Math.abs(p.x - f.x) > 90 || Math.abs(p.y - f.y) > 90) continue;
    p.denken(dt, naheAutos, zustand.zeit * 1000);
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
  cheatsAnwenden();
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
  if (zustand.innen) {
    if (W3) W3.sichtbar(false);
    innenZeichnen();
    return;
  }
  if (modus3d && W3) {
    W3.sichtbar(true);
    Minikarte.zeichnen(radar, zustand, spieler());
    W3.zeichnen(zustand, spieler(), letzteDt);
    ueber3dZeichnen();
    return;
  }
  if (W3) W3.sichtbar(false);
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

  /* Die Clubeingänge, pink statt grün */
  for (const tuer of zustand.clubTueren) {
    if (!sichtbar(tuer)) continue;
    const [px, py] = aufBild(tuer.x, tuer.y);
    const r = kamera.zoom * 1.2;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(255,74,160,.8)");
    g.addColorStop(1, "rgba(255,74,160,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    if (kamera.zoom > 16) {
      ctx.fillStyle = "rgba(255,230,245,.9)";
      ctx.font = `700 ${Math.round(kamera.zoom * 0.34)}px "Barlow Condensed", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(tuer.name, px, py - kamera.zoom * 0.9);
      ctx.textAlign = "start";
    }
  }

  /* 24/7, Klinik, Wache, Bank: farbiger Punkt mit Namen */
  for (const tuer of zustand.tueren) {
    if (!sichtbar(tuer)) continue;
    const [px, py] = aufBild(tuer.x, tuer.y);
    const r = kamera.zoom * 1.1;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(${tuer.farbe},.75)`);
    g.addColorStop(1, `rgba(${tuer.farbe},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    if (kamera.zoom > 16) {
      ctx.fillStyle = "rgba(255,248,235,.9)";
      ctx.font = `700 ${Math.round(kamera.zoom * 0.32)}px "Barlow Condensed", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(tuer.name, px, py - kamera.zoom * 0.9);
      ctx.textAlign = "start";
    }
  }

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
  if (zustand.cheats.nacht) nachtMalen();
}

/* Über dem 3D-Bild: nur ein Fadenkreuz zu Fuß */
function ueber3dZeichnen() {
  ctx.clearRect(0, 0, kamera.breite, kamera.hoehe);
  const f = spieler();
  if (f.imAuto || zustand.drinnen) return;
  const mx = kamera.breite / 2 + Math.min(40, kamera.breite * 0.03), my = kamera.hoehe / 2 - 20;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(mx, my, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,120,168,.95)";
  ctx.fillRect(mx - 1, my - 1, 2, 2);
  ctx.restore();
}

/* Nacht: dunkelblauer Schleier, um den Spieler ein Lichtkegel —
   im Auto die Scheinwerfer nach vorn. */
function nachtMalen() {
  const f = spieler();
  const ziel = f.imAuto || f;
  const px = (ziel.x - kamera.x) * kamera.zoom + kamera.breite / 2;
  const py = (ziel.y - kamera.y) * kamera.zoom + kamera.hoehe / 2;
  ctx.save();
  ctx.fillStyle = "rgba(6,10,38,.62)";
  ctx.fillRect(0, 0, kamera.breite, kamera.hoehe);
  ctx.globalCompositeOperation = "lighter";
  const r = kamera.zoom * (f.imAuto ? 9 : 6);
  const lx = f.imAuto ? px + Math.cos(f.imAuto.winkel) * r * 0.6 : px;
  const ly = f.imAuto ? py + Math.sin(f.imAuto.winkel) * r * 0.6 : py;
  const licht = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
  licht.addColorStop(0, "rgba(255,230,170,.35)");
  licht.addColorStop(1, "rgba(255,230,170,0)");
  ctx.fillStyle = licht;
  ctx.beginPath();
  ctx.arc(lx, ly, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ── Entwicklermenü ─────────────────────────────────────────
   Nur für Admins (assets/js/konto/rolle.js), im Spiel mit F8 oder dem
   roten DEV-Knopf. Im Demo-Modus zum Testen mit ?demo&admin. */
function devErlaubt() {
  if (istAdmin(konto.profil)) return true;
  return !!(konto.backend && konto.backend.modus === "demo" &&
            new URLSearchParams(location.search).has("admin"));
}

function devKnopfZeigen() {
  if (devKnopf) devKnopf.hidden = !(zustand.laeuft && devErlaubt());
}

function devUmschalten(an) {
  if (!zustand.laeuft || !devErlaubt()) return;
  const auf = an === undefined ? devFeld.hidden : an;
  devFeld.hidden = !auf;
  zustand.pause = auf;
  pauseFeld.hidden = true;
  if (auf) { Ton.anhalten(); devBauen(); }
  else { letzte = performance.now(); leinwand.focus(); }
}

const devWaffen = () => Object.keys(WAFFEN).filter(w => w !== "faust");

function devBauen() {
  const schalter = [
    ["leben", L("Leben unendlich", "Infinite health")],
    ["panzer", L("Panzerung unendlich", "Infinite armour")],
    ["ausdauer", L("Ausdauer unendlich", "Infinite stamina")],
    ["polizei", L("Keine Polizei", "No police")],
    ["nacht", L("Nacht", "Night")],
    ["auto", L("Auto unzerstörbar", "Indestructible car")],
    ["turbo", L("Turbo (Auto +70 %)", "Turbo (car +70%)")]
  ];
  const autos = Object.keys(TYPEN)
    .map(t => `<option value="${t}">${TYPEN[t].name}</option>`).join("");
  devInhalt.innerHTML = `
    <div class="sdev__gruppe">
      <h3>${L("Geld", "Money")} · $${zustand.geld.toLocaleString(EN ? "en-US" : "de-DE")}</h3>
      <div class="sdev__reihe">
        <input type="number" min="0" max="99999999" step="1000" id="devGeld" value="${zustand.geld}">
        <button type="button" data-dev="geld">${L("Setzen", "Set")}</button>
        <button type="button" data-dev="plus" data-wert="10000">+10.000</button>
        <button type="button" data-dev="plus" data-wert="100000">+100.000</button>
        <button type="button" data-dev="plus" data-wert="1000000">+1.000.000</button>
      </div>
    </div>
    <div class="sdev__gruppe">
      <h3>${L("Schalter", "Toggles")}</h3>
      <div class="sdev__schalter">
        ${schalter.map(([k, t]) => `<label><input type="checkbox" data-schalter="${k}"
          ${zustand.cheats[k] ? "checked" : ""}><span>${t}</span></label>`).join("")}
      </div>
    </div>
    <div class="sdev__gruppe">
      <h3>${L("Waffen", "Weapons")}</h3>
      <div class="sdev__reihe">
        <button type="button" data-dev="alle">${L("Alle Waffen", "All weapons")}</button>
        ${devWaffen().map(w => `<button type="button" data-dev="waffe" data-wert="${w}">${WAFFEN[w].name}</button>`).join("")}
        <button type="button" data-dev="munition">${L("Munition voll", "Full ammo")}</button>
        <button type="button" data-dev="heilen">${L("Leben, Weste, Ausdauer voll", "Heal, armour, stamina")}</button>
      </div>
    </div>
    <div class="sdev__gruppe">
      <h3>${L("Fahrzeug", "Vehicle")}</h3>
      <div class="sdev__reihe">
        <select id="devAuto">${autos}</select>
        <button type="button" data-dev="auto">${L("Spawnen und einsteigen", "Spawn and get in")}</button>
      </div>
      <div class="sdev__reihe">
        <button type="button" data-dev="reparieren">${L("Auto reparieren", "Repair car")}</button>
        <button type="button" data-dev="alleReparieren">${L("Alle Autos in der Nähe reparieren", "Repair all nearby cars")}</button>
        <button type="button" data-dev="stopp">${L("Auto anhalten", "Stop car")}</button>
      </div>
    </div>
    <div class="sdev__gruppe">
      <h3>${L("Fahndung", "Wanted level")} · ${zustand.fahndung.stufe}</h3>
      <div class="sdev__reihe">
        ${[0, 1, 2, 3, 4, 5].map(n => `<button type="button" data-dev="sterne" data-wert="${n}">${n} ★</button>`).join("")}
        <button type="button" data-dev="wegpunkt">${L("Zum Wegpunkt springen", "Teleport to waypoint")}</button>
      </div>
    </div>`;
}

devFeld.addEventListener("change", e => {
  const k = e.target.dataset && e.target.dataset.schalter;
  if (!k) return;
  zustand.cheats[k] = e.target.checked;
  hinweis(`${k}: ${e.target.checked ? L("an", "on") : L("aus", "off")}`);
});

devFeld.addEventListener("click", e => {
  const k = e.target.closest("[data-dev]");
  if (!k) return;
  const was = k.dataset.dev, wert = k.dataset.wert;
  const f = spieler();
  if (was === "zu") { devUmschalten(false); return; }
  if (was === "geld") {
    const n = parseInt(document.getElementById("devGeld").value, 10);
    if (Number.isFinite(n)) zustand.geld = Math.max(0, Math.min(99999999, n));
  }
  if (was === "plus") zustand.geld = Math.min(99999999, zustand.geld + parseInt(wert, 10));
  if (was === "alle") for (const w of devWaffen()) zustand.arsenal.geben(w, 300);
  if (was === "waffe") zustand.arsenal.geben(wert, 300);
  if (was === "munition") zustand.arsenal.nachladen(999);
  if (was === "heilen") { zustand.leben = 100; zustand.panzerung = 100; zustand.ausdauer = 100; }
  if (was === "reparieren") {
    /* Das eigene Auto, sonst das nächste in Reichweite */
    let a = f.imAuto;
    if (!a) {
      let beste = 9;
      for (const b of zustand.autos.concat(zustand.verkehr)) {
        const d = Math.hypot(b.x - f.x, b.y - f.y);
        if (d < beste) { beste = d; a = b; }
      }
    }
    if (a) {
      a.schaden = 0;
      a.schrott = false;
      hinweis(L(`${a.daten.name} repariert`, `${a.daten.name} repaired`));
    } else {
      hinweis(L("Kein Auto in der Nähe", "No car nearby"));
    }
  }
  if (was === "alleReparieren") {
    let n = 0;
    for (const b of zustand.autos.concat(zustand.verkehr)) {
      if (Math.hypot(b.x - f.x, b.y - f.y) > 80 || (!b.schaden && !b.schrott)) continue;
      b.schaden = 0;
      b.schrott = false;
      n++;
    }
    hinweis(L(`${n} Autos repariert`, `${n} cars repaired`));
  }
  if (was === "stopp" && f.imAuto) { f.imAuto.vx = 0; f.imAuto.vy = 0; }
  if (was === "sterne") {
    const n = parseInt(wert, 10);
    if (n === 0) zustand.fahndung.loeschen();
    else { zustand.fahndung.loeschen(); zustand.fahndung.melden(n); }
  }
  if (was === "wegpunkt" && zustand.wegpunkt) {
    const p = Karte.freierPunkt(zustand.wegpunkt.x, zustand.wegpunkt.y,
      [Karte.ART.STRASSE, Karte.ART.GEHWEG], 20);
    const ziel = f.imAuto || f;
    ziel.x = p.x; ziel.y = p.y; ziel.vx = ziel.vy = 0;
    f.x = p.x; f.y = p.y;
    kamera.x = p.x; kamera.y = p.y;
  }
  if (was === "auto") {
    const typ = document.getElementById("devAuto").value;
    if (f.imAuto) aussteigen();
    const p = devStellplatz(f.x, f.y);
    const neu = new Fahrzeug(typ, p.x, p.y, f.winkel || 0);
    zustand.autos.push(neu);
    f.imAuto = neu;
    neu.fahrer = f;
    Ton.tuer();
    devUmschalten(false);
    hinweis(neu.daten.name);
    return;
  }
  waffeZeigen();
  hudFahndung();
  devBauen();
});

/* Nächstes Straßenfeld, auf dem kein anderes Auto steht — sonst
   steckt der neue Wagen in einem anderen fest */
function devStellplatz(x, y) {
  const t0x = Karte.inKachel(x), t0y = Karte.inKachel(y);
  for (let r = 0; r < 12; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (Karte.art(t0x + dx, t0y + dy) !== Karte.ART.STRASSE) continue;
        const px = Karte.inMeter(t0x + dx) + Karte.KACHEL / 2;
        const py = Karte.inMeter(t0y + dy) + Karte.KACHEL / 2;
        if (zustand.autos.every(a => Math.hypot(a.x - px, a.y - py) > 7)) return { x: px, y: py };
      }
    }
  }
  return Karte.freierPunkt(x, y, [Karte.ART.STRASSE], 12);
}

/* Schalter anwenden — vor dem Todescheck, sonst stirbt man trotzdem */
function cheatsAnwenden() {
  const c = zustand.cheats;
  if (c.leben) zustand.leben = 100;
  if (c.panzer) zustand.panzerung = 100;
  if (c.ausdauer) zustand.ausdauer = 100;
  if (c.polizei && zustand.fahndung.stufe > 0) zustand.fahndung.loeschen();
  const wagen = spieler().imAuto;
  if (wagen) {
    if (c.auto) { wagen.schaden = 0; wagen.schrott = false; }
    wagen.turbo = c.turbo ? 1.7 : 1;
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

/* ── Spielstand im Konto ─────────────────────────────────────
   Geld, Waffen, Munition, Weste, erledigte Aufträge und der Bestwert
   am Schießstand gehören zum Konto. Gesichert wird alle zehn Sekunden,
   wenn sich etwas geändert hat, dazu beim Verlassen der Seite. */
function spielstandJetzt() {
  return {
    geld: Math.round(zustand.geld),
    waffen: zustand.arsenal.reihe.slice(),
    munition: { ...zustand.arsenal.munition },
    panzerung: Math.round(zustand.panzerung),
    erledigt: [...zustand.missionen.erledigt],
    schiessBest: zustand.schiessBest || 0,
    schiessRunden: zustand.schiessRunden || 0
  };
}

let spielstandZuletzt = "";
async function spielstandLaden() {
  if (!konto.backend || !konto.nutzer) return;
  const d = await konto.backend.spielstandLaden(konto.nutzer.uid);
  if (!d) return;
  zustand.geld = d.geld | 0;
  for (const w of d.waffen || []) {
    if (w === "faust") continue;
    zustand.arsenal.geben(w, 0);
  }
  zustand.arsenal.munition = { ...(d.munition || {}) };
  zustand.arsenal.aktiv = 0;
  zustand.panzerung = d.panzerung | 0;
  for (const id of d.erledigt || []) zustand.missionen.erledigt.add(id);
  zustand.schiessBest = d.schiessBest | 0;
  zustand.schiessRunden = d.schiessRunden | 0;
  spielstandZuletzt = JSON.stringify(spielstandJetzt());
  waffeZeigen();
  hudFahndung();
  if (zustand.geld > 0 || (d.waffen || []).length > 1) {
    hinweis(L(`Spielstand geladen — $${zustand.geld.toLocaleString("de-DE")}`,
              `Game loaded — $${zustand.geld.toLocaleString("en-US")}`));
  }
}

async function spielstandSichern() {
  if (!zustand.laeuft || !konto.backend || !konto.nutzer) return;
  const jetzt = spielstandJetzt();
  const text = JSON.stringify(jetzt);
  if (text === spielstandZuletzt) return;
  spielstandZuletzt = text;
  const ok = await konto.backend.spielstandSetzen(konto.nutzer.uid, jetzt);
  if (!ok) spielstandZuletzt = "";               // beim nächsten Mal nochmal
}
setInterval(spielstandSichern, 10000);
document.addEventListener("visibilitychange", () => { if (document.hidden) spielstandSichern(); });

/* Belohnungsfaktor der Admin-Seite: 1 = normal, 2 = doppelt … */
async function spielEinstellungenLaden() {
  if (!konto.backend || !konto.backend.einstellungLaden) return;
  const e = await konto.backend.einstellungLaden("spiel");
  zustand.missionen.geldFaktor = Math.max(1, Math.min(5, (e && e.geldFaktor) | 0 || 1));
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
    const weste = w.waffe === "weste";
    const waffe = munition || weste ? null : WAFFEN[w.waffe];
    const name = munition ? L("Munition für alles", "Ammo for everything")
               : weste ? L("Schutzweste", "Body armour") : waffe.name;
    const hat = !munition && !weste && zustand.arsenal.besitzt(w.waffe);
    const reicht = zustand.geld >= w.preis;
    const bild = munition || weste ? "" : Waffenbilder.datenUrl(w.waffe);
    const wucht = munition
      ? L("füllt jede Waffe auf", "tops up every weapon")
      : weste
      ? L("Panzerung wieder voll", "armour back to full")
      : L(`Schaden ${waffe.schaden} · Reichweite ${Math.round(waffe.reichweite)} m`,
          `Damage ${waffe.schaden} · range ${Math.round(waffe.reichweite)} m`);
    return `<li>
      <button type="button" data-kauf="${k}" ${reicht ? "" : "disabled"}>
        <i class="sladen__bild">${bild ? `<img src="${bild}" alt="" width="84" height="26">` : "+"}</i>
        <span class="sladen__text">
          <b>${k + 1} · ${name}${hat ? " ✓" : ""}</b>
          <small>${wucht}${w.munition ? ` · ${w.munition} ${L("Schuss", "rounds")}` : ""}</small>
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
  else if (w.waffe === "weste") zustand.panzerung = 100;
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
    Ton.anhalten();                // Motor und Sirene aus, sonst läuft der Ton weiter
    orteFuellen();
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
  if (kurz) {
    wegpunktSetzen(Minikarte.ortAusKlick(grossKarte, ansicht, e.clientX, e.clientY));
    orteFuellen();
  }
});
grossKarte.addEventListener("pointercancel", () => { schieben = null; });

/* ── Ortsliste neben der Karte ──
   Alle festen Orte der Stadt, nach Entfernung sortiert. Ein Klick setzt
   den Wegpunkt, ein zweiter löscht ihn wieder. */
const ORT_ENGLISCH = {
  "VCPD": "VCPD police station", "Feuerwache": "Fire station", "Klinik": "Hospital",
  "Bank": "Bank", "Stadion": "Stadium", "Kaufhaus": "Mall",
  "Tankstelle": "Gas station", "Kirche": "Church", "Schule": "School",
  "Ammu-Vice": "Ammu-Vice gun shop", "Sportpark": "Sports park"
};
const ORT_ART = {
  [Karte.BAU.POLIZEI]: ["#3f6fd8", "Polizei", "Police"],
  [Karte.BAU.FEUERWEHR]: ["#d8492f", "Feuerwehr", "Fire"],
  [Karte.BAU.KRANKENHAUS]: ["#d8566f", "Klinik", "Hospital"],
  [Karte.BAU.BANK]: ["#caa63c", "Bank", "Bank"],
  [Karte.BAU.STADION]: ["#4aa07a", "Sport", "Sports"],
  [Karte.BAU.KAUFHAUS]: ["#7b5fc4", "Einkaufen", "Shopping"],
  [Karte.BAU.TANKSTELLE]: ["#c98a35", "Tankstelle", "Fuel"],
  [Karte.BAU.KIRCHE]: ["#8892a8", "Kirche", "Church"],
  [Karte.BAU.SCHULE]: ["#4f87a8", "Schule", "School"],
  [Karte.BAU.WAFFEN]: ["#4bd07f", "Waffen", "Guns"],
  [Karte.BAU.CLUB]: ["#e05bc0", "Nachtclub", "Nightclub"]
};

/* „Feuerwache Nordost 2" → „Fire station Northeast 2" */
const RICHTUNG_EN = { Nord: "North", Süd: "South", Ost: "East", West: "West",
  Nordost: "Northeast", Nordwest: "Northwest", Südost: "Southeast", Südwest: "Southwest" };
function ortEnglisch(name) {
  if (ORT_ENGLISCH[name]) return ORT_ENGLISCH[name];
  const teile = name.split(" ");
  const basis = Object.keys(ORT_ENGLISCH).find(k => name.startsWith(k + " "));
  if (!basis) return name;
  const rest = name.slice(basis.length + 1).split(" ").map(t => RICHTUNG_EN[t] || t).join(" ");
  return `${ORT_ENGLISCH[basis]} ${rest}`;
}

function orteFuellen() {
  if (!orteFeld) return;
  const pos = spieler().imAuto || spieler();
  const liste = Karte.wahrzeichen
    .map(w => ({ w, weit: Math.hypot(w.x - pos.x, w.y - pos.y) }))
    .sort((a, b) => a.weit - b.weit);

  orteFeld.textContent = "";
  for (const { w, weit } of liste) {
    const art = ORT_ART[w.bau] || ["#e6ecff", "Ort", "Landmark"];
    const gesetzt = !!zustand.wegpunkt &&
      Math.hypot(zustand.wegpunkt.x - w.x, zustand.wegpunkt.y - w.y) < 25;

    const punkt = document.createElement("i");
    punkt.style.background = art[0];
    const name = document.createElement("span");
    name.textContent = L(w.name, ortEnglisch(w.name));
    const weite = document.createElement("em");
    weite.textContent = `${Math.round(weit)} m`;

    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.title = L(art[1], art[2]);
    knopf.setAttribute("aria-pressed", gesetzt ? "true" : "false");
    knopf.append(punkt, name, weite);
    knopf.addEventListener("click", () => {
      wegpunktSetzen({ x: w.x, y: w.y });
      orteFuellen();
    });

    const zeile = document.createElement("li");
    zeile.appendChild(knopf);
    orteFeld.appendChild(zeile);
  }
}

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
    orteFuellen();
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
  if (zustand.pause) Ton.anhalten();
  pauseFeld.hidden = !zustand.pause;
  if (!zustand.pause) letzte = performance.now();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden && zustand.laeuft) pauseUmschalten(true);
});
pauseFeld.addEventListener("click", () => pauseUmschalten(false));

/* ── Zugang ──
   Das Spiel merkt sich Geld, erledigte Aufträge und den Bestwert im
   Konto — deshalb geht es nur angemeldet. Ist gar kein Konto-Backend
   eingerichtet (etwa lokal ohne Firebase), bleibt die Tür offen, sonst
   könnte niemand spielen.

   Bis das Konto antwortet (live mit Firebase ein paar Sekunden), steht
   schon das Startbild da — vorher war die Bühne so lange schwarz. */
let torOffen = false;
let kontoDa = false;                            // Konto hat geantwortet (oder Frist um)

function torPruefen() {
  if (!kontoDa && !konto.geladen) return;       // noch keine Antwort: Startbild bleibt
  torOffen = !konto.backend || !!konto.nutzer;
  if (zustand.laeuft) { torFeld.hidden = true; return; }
  torFeld.hidden = torOffen;
  start.hidden = !torOffen;
  if (torOffen) vorladenStarten();
}


torFeld.addEventListener("click", e => {
  const k = e.target.closest("[data-tor]");
  if (!k) return;
  dialogOeffnen(k.dataset.tor === "neu" ? "registrieren" : "anmelden");
});

/* ── Laden ──────────────────────────────────────────────────
   Rund 12 MB Grafik, zwei Drittel davon Gebäude. Geladen wird schon,
   sobald feststeht, dass jemand spielen darf — beim Klick auf „Spiel
   starten" ist dann meist ein guter Teil da. Innenräume kommen erst nach
   dem Start im Hintergrund. Der Balken zeigt Bilder bis 92 %, den Rest
   das Bauen der Stadt. */
function bildListe() {
  const autos = Object.keys(TYPEN).map(t => "auto_" + t);
  const ampeln = ["ampel_rot", "ampel_gelb", "ampel_gruen"];
  /* Bodenkacheln und Deko aus den Bögen */
  const boden = ["asphalt", "asphalt_riss", "gehweg", "sand", "gras", "parkplatz",
                 "erde", "platz", "wasser", "hafen", "kies", "nass",
                 "mark_zebra", "mark_halt", "mark_gerade", "mark_links", "mark_rechts",
                 "mark_bucht", "mark_gully", "mark_flicken", "mark_oel",
                 "mark_rad", "mark_sperr"].map(n => "boden_" + n);
  const deko = ["laterne", "bank", "palme", "baum", "hydrant", "muelleimer", "telefon",
                "haltestelle", "zeitungsbox", "cafetisch", "marktstand",
                "schirm", "liegen", "turm", "volleyball", "ruderboot",
                "container", "muellcontainer", "steg", "promenade",
                "jetski", "boot", "segler",
                "ampel_rot", "ampel_gelb", "ampel_gruen", "stopp", "strassenschild",
                "parkuhr", "radstaender", "kuebel", "plakatwand", "bauzaun",
                "huetchen", "stromkasten"].map(n => "deko_" + n);
  /* Hauptfiguren und Laufleute: vier Richtungen mal vier Posen */
  const figuren = [];
  for (const art of ["lucia", "jason", ...LAUF_LEUTE]) {
    figuren.push(`${art}_steht`);
    for (const r of ["vorn", "hinten", "links", "rechts"]) {
      for (let i = 0; i < 4; i++) figuren.push(`${art}_${r}${i}`);
    }
  }
  /* Passanten und Uniformen: von vorn, von hinten und von der Seite */
  for (const art of [...PASSANT_ARTEN, "polizist", "polizistin", "swat",
                     "polizist_sommer", "sanitaeterin", "feuerwehr_mann"]) {
    figuren.push(`${art}_steht`, `${art}_hinten`, `${art}_links`);
  }
  /* Kleines zuerst, damit Straße und Figuren früh da sind. Gebäude: ein
     Bild je Haus — die Liste führt karte.js, sonst fehlt nach jeder
     neuen Bogenrunde eins. */
  return [...boden, ...autos, ...ampeln, ...deko, ...figuren, ...Karte.GEBAEUDEBILDER];
}

const ladeStand = { fertig: 0, gesamt: 0, klick: false };
let vorladen = null;

function vorladenStarten() {
  if (vorladen) return vorladen;
  /* Wer Datensparen eingeschaltet hat, lädt erst beim Klick */
  const sparen = navigator.connection && navigator.connection.saveData;
  if (sparen && !ladeStand.klick) return null;
  vorladen = Bilder.laden(bildListe(), (fertig, gesamt) => {
    ladeStand.fertig = fertig;
    ladeStand.gesamt = gesamt;
    ladeAnzeigen();
  });
  return vorladen;
}

const ladeFeld = document.getElementById("spielStartLaden");
const ladeProzent = document.getElementById("spielStartProzent");
const ladeBalken = document.getElementById("spielStartBalken");
const ladeSchritt = document.getElementById("spielStartSchritt");
const ladeTipp = document.getElementById("spielStartTipp");
const ladeKlein = document.getElementById("spielStartKlein");
let ladeBau = 0;                                   // 0–8 %: Stadt bauen

function ladeAnzeigen(schrittText) {
  const anteil = ladeStand.gesamt ? ladeStand.fertig / ladeStand.gesamt : 0;
  const prozent = Math.min(100, Math.floor(anteil * 92 + ladeBau));
  if (ladeKlein && !ladeStand.klick) {
    ladeKlein.textContent = anteil >= 1
      ? L("Grafik ist geladen — los geht's.", "Graphics loaded — ready to go.")
      : L(`Grafik wird schon geladen · ${prozent} %`, `Loading graphics · ${prozent} %`);
  }
  if (!ladeStand.klick) return;
  ladeProzent.textContent = prozent;
  ladeBalken.style.transform = `scaleX(${prozent / 100})`;
  ladeFeld.setAttribute("aria-valuenow", prozent);
  ladeSchritt.textContent = schrittText || (
    anteil < 0.12 ? L("Straßen werden asphaltiert …", "Paving the streets …")
    : anteil < 0.2 ? L("Autos rollen an …", "Cars rolling in …")
    : anteil < 0.3 ? L("Palmen werden gepflanzt …", "Planting palm trees …")
    : anteil < 0.38 ? L("Leute kommen auf die Straße …", "People hit the streets …")
    : anteil < 0.7 ? L("Häuser werden hochgezogen …", "Putting up buildings …")
    : anteil < 1 ? L("Stadien und Tankstellen …", "Stadiums and gas stations …")
    : L("Vice City wird aufgebaut …", "Building Vice City …"));
}

/* Tipps wie auf einem echten Ladebildschirm, alle paar Sekunden neu */
const TIPPS = [
  ["Mit M öffnest du die große Karte — ein Klick setzt einen Wegpunkt.",
   "Press M for the big map — one click sets a waypoint."],
  ["Alt halten und die Maus nach links oder rechts: Wechsel zwischen Jason und Lucia.",
   "Hold Alt and move the mouse left or right to switch between Jason and Lucia."],
  ["Bei Ammu-Vice gibt es Waffen, Westen und einen Schießstand.",
   "Ammu-Vice sells weapons and vests — and has a shooting range."],
  ["Die Polizei verliert dich, wenn sie dich eine Weile nicht mehr sieht.",
   "The police lose you once they haven't seen you for a while."],
  ["Mit E steigst du ein und betrittst Clubs und Läden.",
   "Press E to get in cars and to enter clubs and shops."],
  ["Umschalt halten zum Rennen — das kostet Ausdauer.",
   "Hold shift to run — it costs stamina."],
  ["An der Bar im Pink Flamingo füllen Drinks dein Leben wieder auf.",
   "Drinks at the Pink Flamingo bar refill your health."],
  ["Dein Geld und deine Waffen bleiben im Konto gespeichert.",
   "Your money and weapons are saved in your account."],
  ["Im 24/7 an der Tankstelle gibt es Snacks — oder die Kasse.",
   "The 24/7 at the gas station sells snacks — or you take the till."],
  ["In der Klinik wirst du gegen Geld wieder zusammengeflickt.",
   "The clinic patches you up — for a price."]
];
let tippNr = Math.floor(Math.random() * TIPPS.length);
let tippUhr = 0;
function tippZeigen() {
  tippNr = (tippNr + 1) % TIPPS.length;
  ladeTipp.classList.remove("is-an");
  setTimeout(() => {
    ladeTipp.textContent = L(TIPPS[tippNr][0], TIPPS[tippNr][1]);
    ladeTipp.classList.add("is-an");
  }, 220);
}

/* Kurz Luft lassen, damit der Balken gemalt wird. Nicht nur auf
   requestAnimationFrame warten: das steht still, solange der Tab im
   Hintergrund ist — dann bliebe das Laden bei 95 % hängen. */
const naechsterFrame = () => new Promise(r => {
  let fertig = false;
  const los = () => { if (!fertig) { fertig = true; r(); } };
  requestAnimationFrame(() => setTimeout(los, 0));
  setTimeout(los, 60);
});
let startLaeuft = false;

/* Erst hier, weil torPruefen das Vorladen anstößt und abonnieren sofort
   aufruft, wenn das Konto schon da ist */
kontoBereit.then(() => { kontoDa = true; torPruefen(); });
kontoAbo(torPruefen);
/* Falls das Konto-Modul hängt, nach ein paar Sekunden trotzdem entscheiden */
setTimeout(() => { kontoDa = true; torPruefen(); }, 6000);

async function starten() {
  if (startLaeuft || zustand.laeuft) return;
  if (!kontoDa && !konto.geladen) {
    ladeKlein.textContent = L("Konto wird geprüft …", "Checking your account …");
    await Promise.race([kontoBereit, new Promise(r => setTimeout(r, 6000))]);
    kontoDa = true;
  }
  torPruefen();
  if (!torOffen) return;
  startLaeuft = true;
  Ton.bereit();                                   // noch im Klick, sonst bleibt der Ton stumm

  ladeStand.klick = true;
  start.classList.add("is-laden");
  ladeFeld.hidden = false;
  tippZeigen();
  tippUhr = setInterval(tippZeigen, 4800);
  ladeAnzeigen();
  await vorladenStarten();

  ladeBau = 3;
  ladeAnzeigen(L("Texturen werden gemalt …", "Painting textures …"));
  await naechsterFrame();
  Tex.bauen();
  Waffenbilder.bauen();
  ladeBau = 6;
  ladeAnzeigen(L("Verkehr und Passanten …", "Traffic and pedestrians …"));
  await naechsterFrame();
  touchEinrichten();
  weltBauen();
  groesseAnpassen();
  if (modus3d) {
    ladeBau = 7;
    ladeAnzeigen(L("3D-Welt wird gebaut …", "Building the 3D world …"));
    await naechsterFrame();
    if (await dreiDLaden()) {
      W3.kameraSetzen(spieler());
    } else {
      modus3d = false;
      knopf3dZeigen();
    }
  }
  ladeBau = 8;
  ladeAnzeigen(L("Fertig!", "Done!"));
  await naechsterFrame();

  clearInterval(tippUhr);
  start.hidden = true;
  leinwand.focus();
  zustand.laeuft = true;
  hud.figur.textContent = spieler().daten.name;
  waffeZeigen();
  bestwertLaden();
  bestenlisteZeigen();
  await spielstandLaden();
  spielEinstellungenLaden();
  addEventListener("pagehide", bestwertSichern);
  addEventListener("pagehide", spielstandSichern);
  devKnopfZeigen();
  hinweis(L("E einsteigen und Clubs betreten · Umschalt rennen · Maustaste schlagen · M Karte",
            "E to get in and enter clubs · shift to run · mouse to fight · M for the map"));
  letzte = performance.now();
  requestAnimationFrame(schleife);
  /* Innenräume und Tänzerinnen erst jetzt, im Hintergrund */
  Bilder.laden(Innen.bildnamen());
}

wechselFeld.addEventListener("click", e => {
  const k = e.target.closest("[data-wechsel]");
  if (!k) return;
  wechselWaehlen(k.dataset.wechsel);
  wechselSchliessen(true);
});

document.getElementById("spielStartKnopf").addEventListener("click", starten);
if (devKnopf) devKnopf.addEventListener("click", () => devUmschalten());
kontoAbo(() => devKnopfZeigen());
groesseAnpassen();

/* Rechtsklick im Spiel soll kein Browser-Menü öffnen */
buehne.addEventListener("contextmenu", e => e.preventDefault());
