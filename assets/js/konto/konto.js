/* ═══════════════════════════════════════════════════════════
   Kontosystem: Zustand, Anmelde-Knopf in der Nav, Anmelde-Dialog

   Wird auf jeder Seite als Modul geladen:
     <script type="module" src="assets/js/konto/konto.js"></script>

   Ohne Backend (öffentliche Seite ohne Firebase-Konfiguration) bleibt
   der Platz in der Nav leer und sonst passiert nichts.

   Der Dialog kennt fünf Ansichten:
     anmelden · registrieren · vergessen · profil (Namen wählen) · willkommen

   Von außen öffnen: jedes Element mit data-konto-oeffnen="anmelden"
   (oder "registrieren"), oder per import { dialogOeffnen }.

   ── Mehrere Konten ──
   Die Liste der Konten auf diesem Gerät steht in localStorage
   ("konto-liste"): welcher Slot aktiv ist und pro Konto Name, E-Mail und
   ein kleines Profilbild für das Wechsel-Fenster. Jeder Slot ist bei
   Firebase eine eigene App mit eigener Anmeldung (siehe backend.js).
   „Konto wechseln" setzt den aktiven Slot und lädt die Seite neu;
   „Konto hinzufügen" meldet sich in einem neuen Slot an. Meldet man sich
   ab, rückt das nächste Konto der Liste nach.
   ═══════════════════════════════════════════════════════════ */

import { backendWaehlen, istDemo, KontoFehler } from "./backend.js";
import { titelVergessen } from "./titelcache.js";
import { istAdmin } from "./rolle.js";

export const L = window.L || (de => de);
export const LANG = window.LANG || "de";

export const NAME_MUSTER = /^[A-Za-z0-9_.-]{3,20}$/;
export const BIO_MAX = 300;
export const PW_MIN = 8;

/* Vorlagen für das Profilbild — Zuschnitte aus Rockstars Artworks in
   assets/img/avatars/. Gespeichert wird nur "preset:<id>". */
export const VORLAGEN = [
  { id: "vi",      name: "Grand Theft Auto VI" },
  { id: "jason",   name: "Jason Duval" },
  { id: "lucia",   name: "Lucia Caminos" },
  { id: "cal",     name: "Cal Hampton" },
  { id: "boobie",  name: "Boobie Ike" },
  { id: "drequan", name: "Dre'Quan Priest" },
  { id: "dimez",   name: "Real Dimez" },
  { id: "raul",    name: "Raul Bautista" },
  { id: "brian",   name: "Brian Heder" }
];

/* Vorlagen für das Titelbild — 16 : 9, bis 2560 px breit, in assets/img/covers/
   (Vorschaubilder 480 × 270 in covers/klein/) */
export const TITEL_VORLAGEN = [
  { id: "vice-city",   name: "Vice City bei Nacht" },
  { id: "strand",      name: "Jason & Lucia am Strand" },
  { id: "ueberfall",   name: "Jason & Lucia — Überfall" },
  { id: "motel",       name: "Jason & Lucia im Motel" },
  { id: "cabrio",      name: "Im Cabrio an der Küste" },
  { id: "feuer",       name: "Vor dem brennenden Wrack" },
  { id: "schild",      name: "Das Vice-City-Schild" },
  { id: "keys",        name: "Leonida Keys" },
  { id: "motel-nacht", name: "Motel bei Nacht" }
];
export const TITEL_STANDARD = "preset:vice-city";

export const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const DATEN_URL = /^data:image\/(jpeg|webp);base64,/;

/* Profilbild als Adresse. Nimmt ein Profil ({ avatar, avatarEigen }) oder
   einen einzelnen Wert ("preset:lucia", ältere Profile: data:-URL). */
export function avatarUrl(wert, eigen) {
  if (wert && typeof wert === "object") { eigen = wert.avatarEigen; wert = wert.avatar; }
  if (typeof wert === "string" && DATEN_URL.test(wert)) return wert;
  if (wert === "eigen" && typeof eigen === "string" && DATEN_URL.test(eigen)) return eigen;
  const id = typeof wert === "string" && wert.startsWith("preset:") ? wert.slice(7) : "vi";
  return "assets/img/avatars/" + (VORLAGEN.some(v => v.id === id) ? id : "vi") + ".jpg";
}

/* Titelbild als Adresse: Vorlage oder eigenes Bild (data:-URL) */
export function titelUrl(wert, eigen) {
  if (wert === "eigen" && typeof eigen === "string" && DATEN_URL.test(eigen)) return eigen;
  const id = typeof wert === "string" && wert.startsWith("preset:") ? wert.slice(7) : "";
  return "assets/img/covers/" + (TITEL_VORLAGEN.some(v => v.id === id) ? id : "vice-city") + ".jpg";
}

/* ═══ Meldungen ═══════════════════════════════════════════ */
const MELDUNGEN = {
  "invalid-email":          ["Diese E-Mail-Adresse ist ungültig.", "That email address isn’t valid."],
  "missing-email":          ["Bitte gib deine E-Mail-Adresse ein.", "Please enter your email address."],
  "missing-password":       ["Bitte gib dein Passwort ein.", "Please enter your password."],
  "invalid-credential":     ["E-Mail oder Passwort stimmt nicht.", "Email or password is incorrect."],
  "wrong-password":         ["E-Mail oder Passwort stimmt nicht.", "Email or password is incorrect."],
  "user-not-found":         ["E-Mail oder Passwort stimmt nicht.", "Email or password is incorrect."],
  "invalid-login-credentials": ["E-Mail oder Passwort stimmt nicht.", "Email or password is incorrect."],
  "email-already-in-use":   ["Mit dieser E-Mail gibt es schon ein Konto. Melde dich stattdessen an.", "There’s already an account with this email. Sign in instead."],
  "weak-password":          ["Das Passwort ist zu kurz — mindestens 8 Zeichen.", "That password is too short — use at least 8 characters."],
  "password-does-not-meet-requirements": ["Das Passwort erfüllt die Anforderungen nicht.", "That password doesn’t meet the requirements."],
  "too-many-requests":      ["Zu viele Versuche. Warte kurz und versuch es dann noch einmal.", "Too many attempts. Wait a moment and try again."],
  "network-request-failed": ["Keine Verbindung. Prüf dein Internet und versuch es noch einmal.", "No connection. Check your internet and try again."],
  "popup-blocked":          ["Das Google-Fenster wurde blockiert. Erlaube Pop-ups für diese Seite.", "The Google window was blocked. Allow pop-ups for this site."],
  "unauthorized-domain":    ["Diese Adresse ist in Firebase noch nicht freigegeben.", "This address hasn’t been authorized in Firebase yet."],
  "operation-not-allowed":  ["Diese Anmeldeart ist noch nicht freigeschaltet.", "This sign-in method isn’t enabled yet."],
  "configuration-not-found": ["Die Anmeldung ist in Firebase noch nicht eingerichtet.", "Sign-in hasn’t been set up in Firebase yet."],
  "account-exists-with-different-credential": ["Diese E-Mail ist schon mit einer anderen Anmeldeart verknüpft.", "This email is already linked to a different sign-in method."],
  "user-disabled":          ["Dieses Konto ist gesperrt.", "This account has been disabled."],
  "requires-recent-login":  ["Bitte melde dich zur Sicherheit noch einmal an.", "For security, please sign in again."],
  "user-mismatch":          ["Das war ein anderes Google-Konto.", "That was a different Google account."],
  "name-vergeben":          ["Dieser Name ist schon vergeben.", "That name is already taken."],
  "name-ungueltig":         ["3–20 Zeichen: Buchstaben, Ziffern, Punkt, Minus oder Unterstrich.", "3–20 characters: letters, numbers, dot, dash or underscore."],
  "permission-denied":      ["Keine Berechtigung. Ist deine E-Mail-Adresse schon bestätigt?", "Permission denied. Has your email address been confirmed?"],
  "unavailable":            ["Der Server ist gerade nicht erreichbar. Versuch es gleich noch einmal.", "The server is unavailable right now. Try again shortly."],
  "zu-gross":               ["Das Bild ist zu groß. Versuch ein anderes.", "That image is too large. Try another one."],
  "bild-ungueltig":         ["Diese Datei lässt sich nicht als Bild öffnen.", "That file can’t be opened as an image."],
  "bild-zu-klein":          ["Das Bild ist zu klein — mindestens 200 px breit und hoch.", "That image is too small — at least 200 px wide and tall."],
  "api-key-not-valid.-please-pass-a-valid-api-key.": ["Die Firebase-Einstellungen stimmen nicht (API-Key).", "The Firebase settings are wrong (API key)."],
  "invalid-api-key":        ["Die Firebase-Einstellungen stimmen nicht (API-Key).", "The Firebase settings are wrong (API key)."],
  "unbekannt":              ["Da ist etwas schiefgelaufen. Versuch es bitte noch einmal.", "Something went wrong. Please try again."]
};

export function meldung(fehler) {
  const code = (fehler && fehler.code) || "unbekannt";
  /* Fenster selbst geschlossen — kein Fehler, keine Meldung */
  if (code === "popup-closed-by-user" || code === "cancelled-popup-request") return "";
  const m = MELDUNGEN[code];
  if (!m) console.warn("[Konto]", fehler);
  return L(...(m || MELDUNGEN.unbekannt));
}

export function datumMonat(d) {
  if (!d) return "";
  return d.toLocaleDateString(LANG === "en" ? "en-US" : "de-DE", { month: "long", year: "numeric" });
}

/* ═══ Konten auf diesem Gerät ═════════════════════════════ */
const LISTE = "konto-liste" + (istDemo() ? "-demo" : "");

export function kontenLesen() {
  try {
    const d = JSON.parse(localStorage.getItem(LISTE));
    if (d && Array.isArray(d.konten)) {
      return { aktiv: typeof d.aktiv === "string" ? d.aktiv : "standard", konten: d.konten.filter(k => k && k.slot) };
    }
  } catch (e) {}
  return { aktiv: "standard", konten: [] };
}
function kontenSchreiben(d) {
  try { localStorage.setItem(LISTE, JSON.stringify(d)); } catch (e) {}
}
const neuerSlot = () => "konto-" + Math.random().toString(36).slice(2, 10);

/* Kleines Profilbild für die Liste — eigene Bilder als 72-px-Vorschau,
   damit die Liste nicht mit großen Bildern vollläuft */
function miniBild(profil) {
  const url = avatarUrl(profil);
  if (!url.startsWith("data:")) return Promise.resolve(url);
  return new Promise(ok => {
    const i = new Image();
    i.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 72;
      c.getContext("2d").drawImage(i, 0, 0, 72, 72);
      ok(c.toDataURL("image/jpeg", 0.82));
    };
    i.onerror = () => ok(avatarUrl(null));
    i.src = url;
  });
}

async function kontoEintragen(nutzer, profil) {
  const liste = kontenLesen();
  /* Dasselbe Konto schon in einem anderen Slot? Dann gilt dieser hier. */
  const doppelt = liste.konten.filter(k => k.uid === nutzer.uid && k.slot !== zustand.slot);
  if (doppelt.length) {
    liste.konten = liste.konten.filter(k => !doppelt.includes(k));
    doppelt.forEach(k => backendWaehlen(k.slot).then(b => b && b.abmelden()).catch(() => {}));
  }
  let eintrag = liste.konten.find(k => k.slot === zustand.slot);
  if (!eintrag) { eintrag = { slot: zustand.slot }; liste.konten.push(eintrag); }
  eintrag.uid = nutzer.uid;
  eintrag.email = nutzer.email;
  eintrag.name = profil ? profil.username : (nutzer.name || nutzer.email);
  eintrag.bild = await miniBild(profil);
  liste.aktiv = zustand.slot;
  kontenSchreiben(liste);
}

function neuLaden() {
  location.reload();
}

export function kontoWechseln(slot, ziel) {
  const liste = kontenLesen();
  if (!liste.konten.some(k => k.slot === slot)) return;
  liste.aktiv = slot;
  kontenSchreiben(liste);
  if (ziel) location.href = ziel;
  else neuLaden();
}

/* Konto von diesem Gerät entfernen = dort abmelden. Das Konto selbst
   bleibt bestehen und lässt sich jederzeit wieder hinzufügen. */
export async function kontoEntfernen(slot) {
  const liste = kontenLesen();
  const warAktiv = slot === zustand.slot;
  const weg = liste.konten.find(k => k.slot === slot);
  if (weg) titelVergessen(weg.uid);
  liste.konten = liste.konten.filter(k => k.slot !== slot);
  if (warAktiv) liste.aktiv = liste.konten.length ? liste.konten[0].slot : "standard";
  kontenSchreiben(liste);
  try {
    const b = warAktiv ? zustand.backend : await backendWaehlen(slot);
    if (b) await b.abmelden();
  } catch (e) { /* offline — der Eintrag ist trotzdem weg */ }
  if (warAktiv) neuLaden();
}

/* ═══ Zustand ═════════════════════════════════════════════ */
export const zustand = { backend: null, slot: "standard", nutzer: null, profil: null, geladen: false };
const abonnenten = new Set();

export function abonnieren(cb) {
  abonnenten.add(cb);
  if (zustand.geladen) cb(zustand);
  return () => abonnenten.delete(cb);
}
function melden() {
  navZeichnen();
  if (zustand.nutzer) kontoEintragen(zustand.nutzer, zustand.profil).then(() => { if (kw && !kw.hidden) kontenZeichnen(); });
  abonnenten.forEach(cb => { try { cb(zustand); } catch (e) { console.error(e); } });
}

/* Jede Änderung zählt hoch. Ein Profil, das noch unterwegs ist, während
   schon ein neueres gespeichert wurde, darf das neuere nicht überschreiben. */
let lauf = 0;
let registrierungLaeuft = false;

export function profilSetzen(profil) {
  lauf++;
  zustand.profil = profil;
  melden();
}

let bereitLoesen;
export const bereit = new Promise(r => { bereitLoesen = r; });

async function start() {
  zustand.slot = kontenLesen().aktiv || "standard";
  try {
    zustand.backend = await backendWaehlen(zustand.slot);
  } catch (e) {
    /* Firebase nicht erreichbar (offline, Blocker) — die Seite läuft
       ohne Konten weiter */
    console.warn("[Konto] nicht verfügbar", e);
    zustand.backend = null;
  }

  if (!zustand.backend) {
    zustand.geladen = true;
    melden();
    bereitLoesen(zustand);
    return;
  }

  document.documentElement.classList.add("konto-an", "konto-" + zustand.backend.modus);

  zustand.backend.beiAenderung(async nutzer => {
    const meinLauf = ++lauf;
    let profil = null;
    let ladeFehler = false;
    if (nutzer) {
      try { profil = await zustand.backend.profilLaden(nutzer.uid); }
      catch (e) {
        /* Netz weg o. Ä. — dann nicht nach einem neuen Namen fragen,
           das Profil gibt es womöglich längst */
        ladeFehler = true;
        console.warn("[Konto] Profil nicht geladen", e);
      }
    }
    if (meinLauf !== lauf) return;

    /* Abgemeldet (hier oder in einem anderen Tab): aus der Liste nehmen.
       Gibt es noch weitere Konten, rückt das nächste nach. */
    if (!nutzer) {
      const liste = kontenLesen();
      if (liste.konten.some(k => k.slot === zustand.slot)) {
        const weg = liste.konten.find(k => k.slot === zustand.slot);
        if (weg) titelVergessen(weg.uid);
        liste.konten = liste.konten.filter(k => k.slot !== zustand.slot);
        if (liste.konten.length) {
          liste.aktiv = liste.konten[0].slot;
          kontenSchreiben(liste);
          return neuLaden();
        }
        kontenSchreiben(liste);
      }
    }

    zustand.nutzer = nutzer;
    zustand.profil = profil;
    zustand.geladen = true;
    melden();
    bereitLoesen(zustand);

    if (!nutzer) return;
    if (!profil && !ladeFehler && !registrierungLaeuft && !spaeterGewaehlt()) {
      dialogOeffnen("profil");
    } else if (profil && dlg && !dlg.hidden && ["anmelden", "registrieren"].includes(ansicht)) {
      dialogSchliessen();
    }
  });
}

export function abmelden() {
  if (zustand.backend) return zustand.backend.abmelden();
}

/* ═══ Nav ═════════════════════════════════════════════════ */
const ICON_PERSON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="8.2" r="3.7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 20.2c1.3-3.6 4.2-5.4 7.5-5.4s6.2 1.8 7.5 5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const ICON_PFEIL = `<svg class="acct__pfeil" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* Reiter „Admin" in der Navigation — nur für Admins, rot abgesetzt.
   Die Navigation steht fest in jeder Seite, deshalb wird der Reiter
   hier nachträglich eingehängt (oben und im Handy-Menü). */
function adminReiter() {
  const admin = istAdmin(zustand.profil);
  const ziele = [...document.querySelectorAll(".nav__links, #mobileMenu nav")];
  for (const nav of ziele) {
    let link = nav.querySelector("[data-admin-reiter]");
    if (!admin) { if (link) link.remove(); continue; }
    if (link) continue;
    link = document.createElement("a");
    link.href = "admin.html";
    link.className = "nav__admin";
    link.dataset.adminReiter = "";
    link.textContent = "Admin";
    if (/admin\.html$/.test(location.pathname)) link.setAttribute("aria-current", "page");
    nav.appendChild(link);
  }
}

/* Hinweisbanner: eine feste Leiste über der Navigation, von der
   Admin-Seite aus gesetzt. Einmal je Seitenaufruf geladen. Die Nav
   rutscht um die Höhe der Leiste nach unten (--banner-h). Weggeklickt
   bleibt sie weg, bis ein anderer Text kommt. */
const BANNER_WEG = "gta6-banner-weg";
let bannerGeladen = false;
let bannerBeobachter = null;

function bannerHoehe() {
  const leiste = document.getElementById("seitenBanner");
  const h = leiste ? leiste.offsetHeight : 0;
  document.documentElement.style.setProperty("--banner-h", h + "px");
  document.documentElement.classList.toggle("hat-banner", h > 0);
}

function bannerEntfernen() {
  const alt = document.getElementById("seitenBanner");
  if (alt) alt.remove();
  if (bannerBeobachter) { bannerBeobachter.disconnect(); bannerBeobachter = null; }
  bannerHoehe();
}

/* Nach dem Speichern auf der Admin-Seite sofort neu zeigen */
export function bannerAuffrischen() {
  bannerGeladen = false;
  return bannerZeigen();
}
async function bannerZeigen() {
  if (bannerGeladen || !zustand.backend || !zustand.backend.einstellungLaden) return;
  bannerGeladen = true;
  const e = await zustand.backend.einstellungLaden("seite");
  bannerEntfernen();
  if (!e || !e.bannerAn) return;
  const text = LANG === "en" ? (e.bannerEn || e.bannerDe) : (e.bannerDe || e.bannerEn);
  if (!text) return;
  let weg = "";
  try { weg = localStorage.getItem(BANNER_WEG) || ""; } catch (err) { /* privat */ }
  if (weg === text) return;
  const leiste = document.createElement("div");
  leiste.id = "seitenBanner";
  leiste.className = "seitenbanner";
  leiste.setAttribute("role", "status");
  const t = document.createElement("span");
  t.textContent = text;
  const zu = document.createElement("button");
  zu.type = "button";
  zu.className = "seitenbanner__zu";
  zu.setAttribute("aria-label", L("Hinweis schließen", "Close notice"));
  zu.textContent = "×";
  zu.addEventListener("click", () => {
    try { localStorage.setItem(BANNER_WEG, text); } catch (err) { /* privat */ }
    bannerEntfernen();
  });
  leiste.append(t, zu);
  document.body.prepend(leiste);
  bannerHoehe();
  if ("ResizeObserver" in window) {
    bannerBeobachter = new ResizeObserver(bannerHoehe);
    bannerBeobachter.observe(leiste);
  }
}

function navZeichnen() {
  adminReiter();
  bannerZeigen();
  document.querySelectorAll("[data-acct]").forEach(box => {
    if (!zustand.backend || !zustand.geladen) { box.innerHTML = ""; return; }
    const { nutzer, profil } = zustand;

    if (!nutzer) {
      box.innerHTML = `
        <button type="button" class="acct__login" data-konto-oeffnen="anmelden">
          ${ICON_PERSON}<span>${L("Anmelden", "Sign in")}</span>
        </button>`;
      return;
    }

    const name = profil ? profil.username : L("Profil anlegen", "Set up profile");
    box.innerHTML = `
      <button type="button" class="acct__me" aria-expanded="false" aria-controls="acctMenu"
              aria-label="${esc(L("Konto-Menü", "Account menu"))}: ${esc(name)}">
        <img class="acct__av" src="${esc(avatarUrl(profil))}" alt="" width="34" height="34">
        <span class="acct__name">${esc(name)}</span>${ICON_PFEIL}
      </button>
      <div class="acct__menu" id="acctMenu" hidden>
        <div class="acct__kopf">
          <img src="${esc(avatarUrl(profil))}" alt="" width="44" height="44">
          <div><b>${esc(name)}</b><span>${esc(nutzer.email)}</span></div>
        </div>
        ${profil
          ? `<a class="acct__punkt" href="konto.html">${L("Mein Profil", "My profile")}</a>`
          : `<button type="button" class="acct__punkt" data-konto-oeffnen="profil">${L("Profil anlegen", "Set up profile")}</button>`}
        <button type="button" class="acct__punkt" data-konto-wechseln>${L("Konto wechseln", "Switch account")}</button>
        <button type="button" class="acct__punkt acct__punkt--aus" data-konto-abmelden>${L("Abmelden", "Sign out")}</button>
      </div>`;
  });
}

function menueSchliessen() {
  document.querySelectorAll(".acct__me[aria-expanded='true']").forEach(k => {
    k.setAttribute("aria-expanded", "false");
    const m = document.getElementById(k.getAttribute("aria-controls"));
    if (m) m.hidden = true;
  });
}

document.addEventListener("click", e => {
  const knopf = e.target.closest(".acct__me");
  if (knopf) {
    const offen = knopf.getAttribute("aria-expanded") === "true";
    menueSchliessen();
    if (!offen) {
      knopf.setAttribute("aria-expanded", "true");
      const m = document.getElementById(knopf.getAttribute("aria-controls"));
      if (m) m.hidden = false;
    }
    return;
  }
  if (!e.target.closest(".acct__menu")) menueSchliessen();

  const oeffnen = e.target.closest("[data-konto-oeffnen]");
  if (oeffnen) {
    e.preventDefault();
    menueSchliessen();
    dialogOeffnen(oeffnen.getAttribute("data-konto-oeffnen"));
    return;
  }
  if (e.target.closest("[data-konto-wechseln]")) {
    e.preventDefault();
    menueSchliessen();
    kontenOeffnen();
    return;
  }
  if (e.target.closest("[data-konto-abmelden]")) {
    e.preventDefault();
    menueSchliessen();
    abmelden();
  }
});
addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const offen = document.querySelector(".acct__me[aria-expanded='true']");
  if (offen) { menueSchliessen(); offen.focus(); }
});

/* ═══ Dialog ══════════════════════════════════════════════ */
let dlg = null;
let ansicht = "anmelden";
let vorherFokus = null;
let ansichtDaten = {};
/* „Konto hinzufügen": eigener Slot mit eigenem Backend, bis die Anmeldung
   durch ist. Alle Formulare sprechen mit aktivesBackend(). */
let hinzu = null;          // { slot, backend }
const aktivesBackend = () => (hinzu && hinzu.backend) || zustand.backend;
const beruehrung = matchMedia("(hover: none), (pointer: coarse)").matches;

const ICON_ZU = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const ICON_AUGE = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
const ICON_GOOGLE = `<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
const VI_MARK = `<svg class="vi-mark" viewBox="0 0 62 38" aria-hidden="true" focusable="false"><path d="M0 0h11.6l9.1 26.4L29.8 0h11.6L27.2 38H14.2z"/><path d="M49.2 0h11.6v38H49.2z"/></svg>`;

function dialogBauen() {
  dlg = document.createElement("div");
  dlg.className = "kd";
  dlg.hidden = true;
  dlg.setAttribute("role", "dialog");
  dlg.setAttribute("aria-modal", "true");
  dlg.setAttribute("aria-labelledby", "kdTitel");
  dlg.innerHTML = `
    <div class="kd__karte">
      <div class="kd__bild" aria-hidden="true">
        <img src="assets/img/art/jason_lucia_motel.jpg" alt="" decoding="async">
        <div class="kd__bildtext">
          ${VI_MARK}
          <p>${L("Dein Platz <br>in Leonida.", "Your place <br>in Leonida.")}</p>
        </div>
      </div>
      <div class="kd__inhalt">
        <button type="button" class="kd__zu" data-kd-zu aria-label="${esc(L("Schließen", "Close"))}">${ICON_ZU}</button>
        <div class="kd__ansicht" data-kd-ansicht></div>
      </div>
    </div>`;
  document.body.appendChild(dlg);

  dlg.addEventListener("click", e => {
    if (e.target === dlg || e.target.closest("[data-kd-zu]")) return dialogSchliessen();
    const wechsel = e.target.closest("[data-kd-wechsel]");
    if (wechsel) return zeige(wechsel.getAttribute("data-kd-wechsel"));
    const google = e.target.closest("[data-kd-google]");
    if (google) return mitGoogle(google);
    const zeigen = e.target.closest("[data-kd-zeigen]");
    if (zeigen) {
      const feld = zeigen.parentElement.querySelector("input");
      const sichtbar = feld.type === "text";
      feld.type = sichtbar ? "password" : "text";
      zeigen.setAttribute("aria-pressed", String(!sichtbar));
      return;
    }
    const vorlage = e.target.closest("[data-kd-vorlage]");
    if (vorlage) {
      dlg.querySelectorAll("[data-kd-vorlage]").forEach(b =>
        b.setAttribute("aria-checked", String(b === vorlage)));
      return;
    }
    if (e.target.closest("[data-kd-abmelden]")) {
      abmelden();
      dialogSchliessen();
    }
  });

  dlg.addEventListener("submit", e => {
    e.preventDefault();
    const form = e.target;
    const art = form.getAttribute("data-kd-form");
    if (art === "anmelden") formAnmelden(form);
    else if (art === "registrieren") formRegistrieren(form);
    else if (art === "vergessen") formVergessen(form);
    else if (art === "profil") formProfil(form);
  });

  dlg.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.stopPropagation(); dialogSchliessen(); return; }
    if (e.key !== "Tab") return;
    /* Fokus bleibt im Dialog */
    const ziele = Array.from(dlg.querySelectorAll(
      "button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])"
    )).filter(el => el.offsetParent !== null);
    if (!ziele.length) return;
    const erstes = ziele[0], letztes = ziele[ziele.length - 1];
    if (e.shiftKey && document.activeElement === erstes) { e.preventDefault(); letztes.focus(); }
    else if (!e.shiftKey && document.activeElement === letztes) { e.preventDefault(); erstes.focus(); }
  });
}

export async function dialogOeffnen(welche = "anmelden", daten = {}) {
  if (!zustand.backend) return;
  if (daten.hinzufuegen) {
    const slot = neuerSlot();
    try { hinzu = { slot, backend: await backendWaehlen(slot) }; }
    catch (e) { hinzu = null; return; }
  }
  if (!dlg) dialogBauen();
  if (dlg.hidden) {
    vorherFokus = document.activeElement;
    dlg.hidden = false;
    document.body.classList.add("is-locked");
    requestAnimationFrame(() => dlg.classList.add("is-offen"));
  }
  zeige(welche, daten);
}

/* Wer die Namenswahl wegklickt, wird in dieser Sitzung nicht bei jedem
   Seitenwechsel erneut gefragt — die Nav bietet „Profil anlegen" an. */
const spaeterGewaehlt = () => { try { return sessionStorage.getItem("konto-profil-spaeter") === "1"; } catch (e) { return false; } };

export function dialogSchliessen() {
  if (!dlg || dlg.hidden) return;
  if (ansicht === "profil") { try { sessionStorage.setItem("konto-profil-spaeter", "1"); } catch (e) {} }
  dlg.classList.remove("is-offen");
  dlg.hidden = true;
  hinzu = null;
  if (!document.querySelector(".kw:not([hidden]), .kz")) document.body.classList.remove("is-locked");
  if (vorherFokus && vorherFokus.focus && document.contains(vorherFokus)) vorherFokus.focus();
}

function zeige(welche, daten = {}) {
  ansicht = welche;
  ansichtDaten = daten;
  const box = dlg.querySelector("[data-kd-ansicht]");
  const bauen = ANSICHTEN[welche] || ANSICHTEN.anmelden;
  box.innerHTML = bauen(daten) + demoHinweis();
  dlg.setAttribute("data-ansicht", welche);
  if (daten.meldung) meldungSetzen(daten.meldung);
  /* Am Handy nicht gleich ins Eingabefeld — sonst schiebt sich die
     Tastatur über den Dialog, bevor man ihn überhaupt gesehen hat */
  const erstes = beruehrung
    ? dlg.querySelector(".kd__zu")
    : box.querySelector("input:not([type=hidden])") || box.querySelector(".kd__google, .btn");
  if (erstes) erstes.focus({ preventScroll: true });
}

function demoHinweis() {
  if (!zustand.backend || zustand.backend.modus !== "demo") return "";
  return `<p class="kd__demo">${L(
    "<b>Demo-Modus</b> · Firebase ist noch nicht eingerichtet. Konten werden nur in diesem Browser gespeichert, Mails gehen keine raus.",
    "<b>Demo mode</b> · Firebase isn’t set up yet. Accounts are stored in this browser only and no emails are sent."
  )}</p>`;
}

/* ── Bausteine ───────────────────────────────────────────── */
const kopf = (kicker, titel, text) => `
  <p class="kd__kicker">${kicker}</p>
  <h2 class="kd__titel" id="kdTitel">${titel}</h2>
  ${text ? `<p class="kd__text">${text}</p>` : ""}`;

const reiter = aktiv => `
  <div class="kd__reiter">
    <button type="button" data-kd-wechsel="anmelden" aria-current="${aktiv === "anmelden"}">${L("Anmelden", "Sign in")}</button>
    <button type="button" data-kd-wechsel="registrieren" aria-current="${aktiv === "registrieren"}">${L("Registrieren", "Sign up")}</button>
  </div>`;

const googleBlock = text => `
  <button type="button" class="kd__google" data-kd-google>${ICON_GOOGLE}<span>${text}</span></button>
  <div class="kd__oder"><span>${L("oder mit E-Mail", "or with email")}</span></div>`;

const feld = ({ name, label, typ = "text", auto, hinweis = "", wert = "", extra = "" }) => `
  <label class="kf">
    <span class="kf__l">${label}</span>
    ${typ === "password"
      ? `<span class="kf__pw">
           <input class="kf__i" type="password" name="${name}" autocomplete="${auto}" value="${esc(wert)}" ${extra}>
           <button type="button" class="kf__zeigen" data-kd-zeigen aria-pressed="false"
                   aria-label="${esc(L("Passwort anzeigen", "Show password"))}">${ICON_AUGE}</button>
         </span>`
      : `<input class="kf__i" type="${typ}" name="${name}" autocomplete="${auto}" value="${esc(wert)}" ${extra}>`}
    ${hinweis ? `<span class="kf__h">${hinweis}</span>` : ""}
  </label>`;

const meldungsZeile = `<p class="kd__meldung" role="alert" data-kd-meldung></p>`;

/* Abgemeldet, aber andere Konten sind noch auf dem Gerät angemeldet */
const gespeicherteKonten = () => `
  <div class="kd__gespeichert">
    <p class="kf__l">${L("Auf diesem Gerät", "On this device")}</p>
    ${kontenLesen().konten.map(k => `
      <button type="button" class="kw__wahl kw__wahl--klein" data-kw-wechseln="${esc(k.slot)}">
        <img src="${esc(k.bild || avatarUrl(null))}" alt="" width="36" height="36">
        <span><b>${esc(k.name || "")}</b><small>${esc(k.email || "")}</small></span>
      </button>`).join("")}
  </div>`;

const ANSICHTEN = {
  anmelden: () => `
    ${hinzu
      ? kopf(L("Weiteres Konto", "Another account"), L("Konto hinzufügen", "Add account"),
             L("Melde dich mit einem weiteren Konto an. Zwischen deinen Konten wechselst du danach über dein Profilbild oben rechts.",
               "Sign in with another account. Afterwards you can switch between your accounts from your profile picture at the top right."))
      : kopf(L("Konto", "Account") + " · luciajason.de", L("Willkommen zurück", "Welcome back"))}
    ${!hinzu && !zustand.nutzer && kontenLesen().konten.length ? gespeicherteKonten() : ""}
    ${reiter("anmelden")}
    ${googleBlock(L("Mit Google anmelden", "Sign in with Google"))}
    <form class="kd__form" data-kd-form="anmelden" novalidate>
      ${feld({ name: "email", label: L("E-Mail", "Email"), typ: "email", auto: "email", extra: 'inputmode="email" required' })}
      ${feld({ name: "pw", label: L("Passwort", "Password"), typ: "password", auto: "current-password", extra: "required" })}
      <button type="button" class="kd__link kd__link--rechts" data-kd-wechsel="vergessen">${L("Passwort vergessen?", "Forgot your password?")}</button>
      ${meldungsZeile}
      <button type="submit" class="btn btn--pink btn--lg kd__los">${L("Anmelden", "Sign in")}</button>
    </form>`,

  registrieren: () => `
    ${kopf(hinzu ? L("Weiteres Konto", "Another account") : L("Konto", "Account") + " · luciajason.de", L("Konto erstellen", "Create account"),
      L("Kostenlos und freiwillig — mit eigenem Profil und dem GTA-VI-Newsletter.",
        "Free and optional — with your own profile and the GTA VI newsletter."))}
    ${reiter("registrieren")}
    ${googleBlock(L("Mit Google registrieren", "Sign up with Google"))}
    <form class="kd__form" data-kd-form="registrieren" novalidate>
      ${feld({ name: "username", label: L("Benutzername", "Username"), auto: "username",
               hinweis: L("3–20 Zeichen, so erscheinst du auf der Seite", "3–20 characters, shown on the site"),
               extra: 'maxlength="20" autocapitalize="off" spellcheck="false" required' })}
      ${feld({ name: "email", label: L("E-Mail", "Email"), typ: "email", auto: "email", extra: 'inputmode="email" required' })}
      ${feld({ name: "pw", label: L("Passwort", "Password"), typ: "password", auto: "new-password",
               hinweis: L("Mindestens 8 Zeichen", "At least 8 characters"), extra: 'minlength="8" required' })}
      <p class="kd__klein">${L(
        'Es gilt die <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a>. Dein Konto kannst du jederzeit selbst löschen.',
        'Our <a href="datenschutz.html" target="_blank" rel="noopener">privacy policy</a> applies. You can delete your account yourself at any time.'
      )}</p>
      ${meldungsZeile}
      <button type="submit" class="btn btn--pink btn--lg kd__los">${L("Konto erstellen", "Create account")}</button>
    </form>`,

  vergessen: () => `
    ${kopf(L("Konto", "Account") + " · luciajason.de", L("Passwort vergessen", "Forgot password"),
      L("Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort setzt.",
        "Enter your email address and we’ll send you a link to set a new password."))}
    <form class="kd__form" data-kd-form="vergessen" novalidate>
      ${feld({ name: "email", label: L("E-Mail", "Email"), typ: "email", auto: "email", extra: 'inputmode="email" required' })}
      ${meldungsZeile}
      <button type="submit" class="btn btn--pink btn--lg kd__los">${L("Link senden", "Send link")}</button>
      <button type="button" class="kd__link" data-kd-wechsel="anmelden">← ${L("Zurück zur Anmeldung", "Back to sign in")}</button>
    </form>`,

  profil: (d = {}) => {
    const n = zustand.nutzer;
    const vorschlag = d.vorschlag || namensVorschlag(n);
    return `
    ${kopf(L("Letzter Schritt", "One last step"), L("Wähle deinen Namen", "Pick your name"),
      L("So erscheinst du auf luciajason.de. Bild, Name und Beschreibung kannst du später jederzeit ändern.",
        "This is how you’ll appear on luciajason.de. You can change your picture, name and bio any time."))}
    <form class="kd__form" data-kd-form="profil" novalidate>
      <fieldset class="kd__vorlagen">
        <legend class="kf__l">${L("Profilbild", "Profile picture")}</legend>
        <div class="kd__vorlagenreihe" role="radiogroup" aria-label="${esc(L("Profilbild", "Profile picture"))}">
          ${VORLAGEN.map((v, i) => `
            <button type="button" role="radio" class="av-wahl" data-kd-vorlage="${v.id}"
                    aria-checked="${i === 0}" aria-label="${esc(v.name)}" title="${esc(v.name)}">
              <img src="assets/img/avatars/${v.id}.jpg" alt="" width="52" height="52" loading="lazy">
            </button>`).join("")}
        </div>
      </fieldset>
      ${feld({ name: "username", label: L("Benutzername", "Username"), auto: "username", wert: vorschlag,
               hinweis: L("3–20 Zeichen: Buchstaben, Ziffern, Punkt, Minus, Unterstrich", "3–20 characters: letters, numbers, dot, dash, underscore"),
               extra: 'maxlength="20" autocapitalize="off" spellcheck="false" required' })}
      ${meldungsZeile}
      <button type="submit" class="btn btn--pink btn--lg kd__los">${L("Los geht’s", "Let’s go")}</button>
      <button type="button" class="kd__link" data-kd-abmelden>${L("Doch nicht — abmelden", "Never mind — sign out")}</button>
    </form>`;
  },

  willkommen: () => {
    const n = zustand.nutzer || {};
    const p = zustand.profil || {};
    const text = n.emailVerified
      ? L("Dein Konto steht. In deinem Konto stellst du Profilbild, Beschreibung und den Newsletter ein.",
          "Your account is ready. Head to your account to set your picture, bio and newsletter.")
      : L(`Wir haben eine Bestätigungs-Mail an <b>${esc(n.email)}</b> geschickt. Sobald du bestätigt hast, kannst du den GTA-VI-Newsletter abonnieren.`,
          `We’ve sent a confirmation email to <b>${esc(n.email)}</b>. Once you’ve confirmed it, you can subscribe to the GTA VI newsletter.`);
    return `
    <div class="kd__willkommen">
      <img class="kd__grossav" src="${esc(avatarUrl(p))}" alt="" width="96" height="96">
      ${kopf(L("Konto erstellt", "Account created"), L("Willkommen, ", "Welcome, ") + esc(p.username || ""), text)}
      <div class="kd__knoepfe">
        <a class="btn btn--pink btn--lg" href="konto.html">${L("Zu meinem Konto", "Go to my account")}</a>
        <button type="button" class="btn btn--ghost btn--lg" data-kd-zu>${L("Weiter stöbern", "Keep browsing")}</button>
      </div>
    </div>`;
  }
};

/* Vorschlag aus dem Google-Namen oder dem Teil vor dem @ */
function namensVorschlag(n) {
  if (!n) return "";
  const roh = (n.name || (n.email || "").split("@")[0] || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_").replace(/[^A-Za-z0-9_.-]/g, "");
  return roh.slice(0, 20);
}

/* ── Formulare ───────────────────────────────────────────── */
export const neuesProfil = (username, avatar) => ({
  username, bio: "", avatar, avatarEigen: "", cover: TITEL_STANDARD, favChar: "",
  plattform: "", edition: "", lieblingsort: "", vorfreude: "", gamertag: "", lang: LANG
});

function meldungSetzen(text, gut = false) {
  const m = dlg && dlg.querySelector("[data-kd-meldung]");
  if (!m) return;
  m.innerHTML = text || "";
  m.classList.toggle("is-gut", !!gut);
}

function beschaeftigt(knopf, an) {
  if (!knopf) return;
  knopf.disabled = an;
  knopf.classList.toggle("is-busy", an);
  knopf.setAttribute("aria-busy", String(an));
}

/* Anmeldung im neuen Slot geschafft: in die Liste, aktiv setzen, neu laden.
   War das Konto schon auf dem Gerät, wird einfach dorthin gewechselt. */
async function hinzugefuegt(nutzer) {
  const { slot, backend } = hinzu;
  const liste = kontenLesen();
  const vorhanden = liste.konten.find(k => k.uid === nutzer.uid);
  if (vorhanden) {
    try { await backend.abmelden(); } catch (e) {}
    liste.aktiv = vorhanden.slot;
  } else {
    liste.konten.push({ slot, uid: nutzer.uid, email: nutzer.email, name: nutzer.name || nutzer.email, bild: avatarUrl(null) });
    liste.aktiv = slot;
  }
  kontenSchreiben(liste);
  neuLaden();
}

async function mitGoogle(knopf) {
  meldungSetzen("");
  beschaeftigt(knopf, true);
  try {
    const n = await aktivesBackend().mitGoogle();
    if (hinzu && n) return hinzugefuegt(n);
    /* Weiter geht es im Beobachter: mit Profil schließt der Dialog,
       ohne Profil kommt die Namenswahl. */
  } catch (e) {
    meldungSetzen(meldung(e));
  } finally {
    beschaeftigt(knopf, false);
  }
}

async function formAnmelden(form) {
  const email = form.email.value.trim();
  const pw = form.pw.value;
  if (!email) return meldungSetzen(meldung({ code: "missing-email" }));
  if (!pw) return meldungSetzen(meldung({ code: "missing-password" }));
  const knopf = form.querySelector("[type=submit]");
  meldungSetzen("");
  beschaeftigt(knopf, true);
  try {
    const n = await aktivesBackend().anmelden(email, pw);
    if (hinzu && n) return hinzugefuegt(n);
  } catch (e) {
    meldungSetzen(meldung(e));
    beschaeftigt(knopf, false);
  }
}

async function formRegistrieren(form) {
  const name = form.username.value.trim();
  const email = form.email.value.trim();
  const pw = form.pw.value;
  if (!NAME_MUSTER.test(name)) { form.username.focus(); return meldungSetzen(meldung({ code: "name-ungueltig" })); }
  if (!email) { form.email.focus(); return meldungSetzen(meldung({ code: "missing-email" })); }
  if (pw.length < PW_MIN) { form.pw.focus(); return meldungSetzen(meldung({ code: "weak-password" })); }

  const knopf = form.querySelector("[type=submit]");
  meldungSetzen("");
  beschaeftigt(knopf, true);
  if (!hinzu) registrierungLaeuft = true;
  const b = aktivesBackend();
  try {
    /* Name zuerst prüfen — sonst stünde ein Konto ohne Namen da */
    if (!(await b.nameFrei(name, null))) throw new KontoFehler("name-vergeben");
    const nutzer = await b.registrieren(email, pw);
    const profil = neuesProfil(name, "preset:vi");
    try {
      await b.profilSpeichern(nutzer.uid, profil, null);
      if (hinzu) return hinzugefuegt(nutzer);
      zustand.nutzer = nutzer;
      profilSetzen({ ...profil, createdAt: new Date() });
      zeige("willkommen");
    } catch (e) {
      /* Das Konto steht, nur der Name hat nicht geklappt — dann eben
         im Profilschritt einen anderen wählen */
      zeige("profil", { vorschlag: name, meldung: meldung(e) });
    }
  } catch (e) {
    if (e.code === "name-vergeben") form.username.focus();
    meldungSetzen(meldung(e));
    beschaeftigt(knopf, false);
  } finally {
    registrierungLaeuft = false;
  }
}

async function formVergessen(form) {
  const email = form.email.value.trim();
  if (!email) return meldungSetzen(meldung({ code: "missing-email" }));
  const knopf = form.querySelector("[type=submit]");
  beschaeftigt(knopf, true);
  try {
    await aktivesBackend().passwortVergessen(email);
    meldungSetzen(L(
      "Wenn es zu dieser Adresse ein Konto gibt, ist der Link unterwegs. Schau auch im Spam-Ordner nach.",
      "If there’s an account for this address, the link is on its way. Check your spam folder too."
    ), true);
  } catch (e) {
    meldungSetzen(meldung(e));
  } finally {
    beschaeftigt(knopf, false);
  }
}

async function formProfil(form) {
  const n = zustand.nutzer;
  if (!n) return dialogSchliessen();
  const name = form.username.value.trim();
  if (!NAME_MUSTER.test(name)) { form.username.focus(); return meldungSetzen(meldung({ code: "name-ungueltig" })); }
  const gewaehlt = dlg.querySelector("[data-kd-vorlage][aria-checked='true']");
  const profil = neuesProfil(name, "preset:" + (gewaehlt ? gewaehlt.getAttribute("data-kd-vorlage") : "vi"));
  const knopf = form.querySelector("[type=submit]");
  meldungSetzen("");
  beschaeftigt(knopf, true);
  try {
    await zustand.backend.profilSpeichern(n.uid, profil, null);
    profilSetzen({ ...profil, createdAt: new Date() });
    zeige("willkommen");
  } catch (e) {
    if (e.code === "name-vergeben") form.username.focus();
    meldungSetzen(meldung(e));
    beschaeftigt(knopf, false);
  }
}

/* ═══ Konto wechseln ══════════════════════════════════════ */
let kw = null;

export function kontenOeffnen() {
  if (!zustand.backend) return;
  if (!kw) kontenBauen();
  kw.hidden = false;
  document.body.classList.add("is-locked");
  kontenZeichnen();
  requestAnimationFrame(() => {
    kw.classList.add("is-offen");
    const f = kw.querySelector(".kw__wahl, .kw__neu");
    if (f && !beruehrung) f.focus({ preventScroll: true });
  });
}

function kontenSchliessen() {
  if (!kw || kw.hidden) return;
  kw.classList.remove("is-offen");
  kw.hidden = true;
  if (!document.querySelector(".kd:not([hidden]), .kz")) document.body.classList.remove("is-locked");
}

const ICON_PLUS = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

function kontenBauen() {
  kw = document.createElement("div");
  kw.className = "kw";
  kw.hidden = true;
  kw.setAttribute("role", "dialog");
  kw.setAttribute("aria-modal", "true");
  kw.setAttribute("aria-labelledby", "kwTitel");
  kw.innerHTML = `
    <div class="kw__karte">
      <button type="button" class="kd__zu" data-kw-zu aria-label="${esc(L("Schließen", "Close"))}">${ICON_ZU}</button>
      <p class="kd__kicker">${L("Konten auf diesem Gerät", "Accounts on this device")}</p>
      <h2 class="kw__titel" id="kwTitel">${L("Konto wechseln", "Switch account")}</h2>
      <ul class="kw__liste" data-kw-liste></ul>
      <button type="button" class="kw__neu" data-kw-neu>${ICON_PLUS}<span>${L("Konto hinzufügen", "Add account")}</span></button>
      <div class="kw__fuss">
        <button type="button" class="btn btn--ghost" data-kw-abmelden>${L("Aktuelles Konto abmelden", "Sign out current account")}</button>
      </div>
    </div>`;
  document.body.appendChild(kw);

  kw.addEventListener("click", async e => {
    if (e.target === kw || e.target.closest("[data-kw-zu]")) return kontenSchliessen();
    const wechseln = e.target.closest("[data-kw-wechseln]");
    if (wechseln) {
      const slot = wechseln.getAttribute("data-kw-wechseln");
      if (slot === zustand.slot) return kontenSchliessen();
      wechseln.classList.add("is-busy");
      return kontoWechseln(slot);
    }
    const bearbeiten = e.target.closest("[data-kw-bearbeiten]");
    if (bearbeiten) {
      e.preventDefault();
      const slot = bearbeiten.getAttribute("data-kw-bearbeiten");
      if (slot === zustand.slot) {
        kontenSchliessen();
        if (/konto\.html$/.test(location.pathname)) { location.hash = "bearbeiten"; return; }
        location.href = "konto.html#bearbeiten";
        return;
      }
      return kontoWechseln(slot, "konto.html#bearbeiten");
    }
    const weg = e.target.closest("[data-kw-entfernen]");
    if (weg) {
      /* Zweimal klicken: erst fragen, dann entfernen */
      if (weg.dataset.sicher !== "1") {
        weg.dataset.sicher = "1";
        weg.textContent = L("Wirklich entfernen?", "Really remove?");
        weg.classList.add("is-sicher");
        setTimeout(() => {
          if (!weg.isConnected) return;
          weg.dataset.sicher = "";
          weg.textContent = L("Entfernen", "Remove");
          weg.classList.remove("is-sicher");
        }, 4000);
        return;
      }
      weg.disabled = true;
      await kontoEntfernen(weg.getAttribute("data-kw-entfernen"));
      return kontenZeichnen();
    }
    if (e.target.closest("[data-kw-neu]")) {
      kontenSchliessen();
      return dialogOeffnen("anmelden", { hinzufuegen: true });
    }
    if (e.target.closest("[data-kw-abmelden]")) {
      kontenSchliessen();
      return abmelden();
    }
  });

  kw.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.stopPropagation(); kontenSchliessen(); }
  });
}

function kontenZeichnen() {
  if (!kw) return;
  const liste = kontenLesen();
  const box = kw.querySelector("[data-kw-liste]");
  if (!liste.konten.length) {
    box.innerHTML = `<li class="kw__leer">${L("Noch kein Konto auf diesem Gerät.", "No accounts on this device yet.")}</li>`;
  } else {
    box.innerHTML = liste.konten.map(k => {
      const aktiv = k.slot === zustand.slot && zustand.nutzer;
      return `
        <li class="kw__konto ${aktiv ? "is-aktiv" : ""}">
          <button type="button" class="kw__wahl" data-kw-wechseln="${esc(k.slot)}"
                  aria-current="${aktiv ? "true" : "false"}">
            <img src="${esc(k.bild || avatarUrl(null))}" alt="" width="48" height="48">
            <span><b>${esc(k.name || "")}</b><small>${esc(k.email || "")}</small></span>
            ${aktiv ? `<i class="kw__marke">${L("Aktiv", "Active")}</i>` : `<i class="kw__pfeil" aria-hidden="true">›</i>`}
          </button>
          <div class="kw__aktionen">
            <a class="kw__klein" href="konto.html#bearbeiten" data-kw-bearbeiten="${esc(k.slot)}">${L("Profil bearbeiten", "Edit profile")}</a>
            <button type="button" class="kw__klein kw__klein--weg" data-kw-entfernen="${esc(k.slot)}">${L("Entfernen", "Remove")}</button>
          </div>
        </li>`;
    }).join("");
  }
  kw.querySelector("[data-kw-abmelden]").hidden = !zustand.nutzer;
}

/* Gespeicherte Konten im Anmelde-Dialog */
document.addEventListener("click", e => {
  const k = e.target.closest(".kd [data-kw-wechseln]");
  if (k) kontoWechseln(k.getAttribute("data-kw-wechseln"));
});

start();
