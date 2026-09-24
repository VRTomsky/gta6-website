/* ═══════════════════════════════════════════════════════════
   Kontoseite (konto.html)

   Vier Zustände:
     aus           kein Backend — Konten noch nicht freigeschaltet
     abgemeldet    Einladung zum Anmelden / Registrieren
     ohne-profil   angemeldet, aber noch kein Name gewählt
     angemeldet    Profil ansehen — oder mit #bearbeiten bearbeiten

   ── Profil ansehen (konto.html) ──
   Das eigene Titelbild liegt fest hinter der ganzen Seite; beim Scrollen
   läuft nur der Inhalt darüber. Es steht außerhalb von kontoRoot und
   kommt aus dem Zwischenspeicher (titelcache.js), damit es sofort da ist
   und nicht erst die Vorlage zu sehen war. Oben Profilbild, Name, Beschreibung, dann
   Countdown und Steckbrief, Lieblingsfigur und -ort, Gamertag, Vorfreude
   und die neuesten Meldungen vom Rockstar Newswire.

   ── Profil bearbeiten (konto.html#bearbeiten) ──
   Titel- und Profilbild (Vorlage oder eigenes Bild mit Zuschneiden),
   Name, Beschreibung, „Über dich", dazu Newsletter, Anmeldung und
   Konto löschen. Wer ein Bild wählt, sieht es sofort im Profilkopf;
   gespeichert wird erst mit „Speichern". Eigene Bilder gehen beim Wechsel
   zu einer Vorlage nicht verloren, sie bleiben als Kachel „Eigenes".

   Die Seite wird nur neu aufgebaut, wenn sich der angemeldete Nutzer
   ändert. Speichert man das Profil, werden Kopf, Ansicht und Nav
   nachgezogen — halb ausgefüllte Felder bleiben dabei stehen.
   ═══════════════════════════════════════════════════════════ */

import {
  zustand, abonnieren, profilSetzen, L, LANG, esc, avatarUrl, titelUrl, meldung,
  datumMonat, kontenLesen, VORLAGEN, TITEL_VORLAGEN, TITEL_STANDARD, NAME_MUSTER, BIO_MAX
} from "./konto.js";
import { zuschneiden } from "./zuschnitt.js";
import { istAdmin } from "./rolle.js";
import { titelLesen, titelMerken, titelVergessen, titelAufraeumen } from "./titelcache.js";

const root = document.getElementById("kontoRoot");
const FIGUREN = typeof CHARS !== "undefined" ? CHARS : [];
const ORTE = typeof PLACES !== "undefined" ? PLACES : [];
const SEITEN = typeof CHAR_PAGES !== "undefined" ? CHAR_PAGES : {};
const STANDARD = { avatar: "preset:vi", titel: TITEL_STANDARD };
const GAMERTAG_MUSTER = /^[A-Za-z0-9 _.-]{0,24}$/;

const PLATTFORMEN = [
  { id: "ps5",  kurz: "PS5",  name: "PlayStation 5" },
  { id: "xbox", kurz: "Xbox", name: "Xbox Series X|S" }
];
const EDITIONEN = [
  { id: "standard", kurz: "Standard", name: "Standard Edition" },
  { id: "ultimate", kurz: "Ultimate", name: "Ultimate Edition" }
];
const VORFREUDE = [
  { id: "story",       name: L("Die Story von Jason & Lucia", "Jason & Lucia’s story"),  bild: "art/jason_lucia_motel.jpg" },
  { id: "vice-city",   name: L("Vice City erkunden", "Exploring Vice City"),              bild: "places/vice_city_09.jpg" },
  { id: "ueberfaelle", name: L("Überfälle planen", "Planning heists"),                    bild: "art/jason_lucia_robbery.jpg" },
  { id: "autos",       name: L("Autos & Tuning", "Cars & tuning"),                        bild: "ultimate/ue_cheetah_01.jpg" },
  { id: "online",      name: "GTA Online",                                                 bild: "places/vice_city_05.jpg" },
  { id: "musik",       name: L("Radio & Soundtrack", "Radio & soundtrack"),               bild: "news/album.jpg" },
  { id: "jiggle",      name: "Lucia's Jiggle Physics",                                        bild: "duo/duo_10.jpg" }
];

/* Ein Ort, den es in der Leonida-Übersicht nicht gibt — Spaß-Eintrag */
const SPASS_ORTE = [
  {
    id: "jack-of-hearts",
    name: "Jack of Hearts",
    sub: L("Stripclub", "Strip club"),
    badge: L("Crosstown · Vice City", "Crosstown · Vice City"),
    text: L("Boobie Ikes Club in Crosstown und der bekannteste Stripclub in Vice City — aus beiden Trailern und den offiziellen Bildern. Mit dem, was hier hereinkommt, finanziert er sein Tonstudio Only Raw Records. Ein zweiter, kleinerer Laden außerhalb der Stadt ist bisher nur aus Leaks bekannt.",
            "Boobie Ike’s club in Crosstown and the best-known strip club in Vice City — seen in both trailers and the official screenshots. What comes in here funds his recording studio, Only Raw Records. A second, smaller place outside the city so far only shows up in leaks."),
    shots: ["places/vice_city_07.jpg"],
    ziel: "charakter.html?c=boobie",
    zielText: L("Boobies Akte", "Boobie’s file")
  }
];
const ALLE_ORTE = () => ORTE.concat(SPASS_ORTE);

/* ── Titelbild-Hintergrund ──
   Eigenes Element neben der Seite: So bleibt das Bild stehen, wenn
   kontoRoot neu gezeichnet wird, und es kann schon hängen, bevor
   Firebase geantwortet hat. */
const hintergrund = document.createElement("div");
hintergrund.className = "kbg";
hintergrund.setAttribute("aria-hidden", "true");
hintergrund.hidden = true;
const seite = document.getElementById("main");
if (seite && seite.parentNode) seite.parentNode.insertBefore(hintergrund, seite);

let hintergrundUrl = "";
function hintergrundSetzen(url) {
  if (!url) {
    hintergrund.hidden = true;
    hintergrund.textContent = "";
    hintergrundUrl = "";
    return;
  }
  if (url !== hintergrundUrl) {
    hintergrundUrl = url;
    const bild = new Image();
    bild.alt = "";
    bild.decoding = "async";
    bild.src = url;
    hintergrund.textContent = "";
    hintergrund.appendChild(bild);
  }
  hintergrund.hidden = false;
}

let gebautFuer = null;       // uid, für den die Seite gerade steht
let newsletterAn = false;
let uhr = null;              // Countdown in der Profilansicht
let newswire = null;         // zuletzt geladene Meldungen

/* Bilder — `wahl` ist das, was gerade ausgewählt ist (auch ungespeichert),
   `eigen` die hochgeladenen Bilder, `quellen` die Originale dieses
   Besuchs, damit sich der Zuschnitt noch ändern lässt. */
let wahl = { ...STANDARD };
let eigen = { avatar: "", titel: "" };
let quellen = { avatar: null, titel: null };
let titelGespeichert = "";   // eigenes Titelbild, wie es in der Datenbank liegt
let titelGeladen = false;
let zwischen = null;         // Titelbild aus dem Zwischenspeicher: { uid, cover, daten, stand }

/* Noch bevor klar ist, wer angemeldet ist: das zuletzt gesehene Titelbild
   des aktiven Kontos zeigen. Die uid dazu steht in der Kontoliste. */
(function sofortZeigen() {
  const liste = kontenLesen();
  titelAufraeumen(liste.konten.map(k => k.uid));
  const aktiv = liste.konten.find(k => k.slot === liste.aktiv) || liste.konten[0];
  if (!aktiv || !aktiv.uid) return;
  titelLesen(aktiv.uid).then(e => {
    if (!e) return;
    zwischen = { uid: aktiv.uid, cover: e.cover, daten: e.daten, stand: e.stand };
    if (gebautFuer) return;                       // Seite steht schon
    document.body.classList.add("hat-titelbild");
    hintergrundSetzen(titelUrl(e.cover, e.daten));
  });
})();

abonnieren(zeichnen);
addEventListener("hashchange", () => { if (gebautFuer) modusSetzen(true); });

function zeichnen(z) {
  if (!z.backend) return leer("aus");
  if (!z.nutzer) return leer("abgemeldet");
  if (!z.profil) return leer("ohne-profil");

  if (gebautFuer !== z.nutzer.uid) {
    gebautFuer = z.nutzer.uid;
    seiteBauen(z);
  } else {
    kopfAuffrischen(z);
    ansichtZeichnen();
    sicherheitAuffrischen(z);
  }
}

/* ═══ Leere Zustände ══════════════════════════════════════ */
function leer(art) {
  gebautFuer = null;
  clearInterval(uhr);
  document.body.classList.remove("hat-titelbild");
  hintergrundSetzen("");
  document.title = L("Mein Konto", "My account") + " — Grand Theft Auto VI";

  if (art === "aus") {
    root.innerHTML = `
      <section class="kleer">
        <p class="kicker">${L("Konto", "Account")}</p>
        <h1 class="h-display">${L("Bald verfügbar", "Coming soon")}</h1>
        <p class="kleer__t">${L("Konten sind auf luciajason.de noch nicht freigeschaltet. Schau bald wieder vorbei.",
                                 "Accounts on luciajason.de aren’t live yet. Check back soon.")}</p>
        <div class="kleer__knoepfe"><a class="btn btn--pink btn--lg" href="index.html">${L("Zur Startseite", "Back to home")}</a></div>
      </section>`;
    return;
  }

  if (art === "ohne-profil") {
    root.innerHTML = `
      <section class="kleer">
        <p class="kicker">${L("Fast geschafft", "Almost there")}</p>
        <h1 class="h-display">${L("Wähle deinen Namen", "Pick your name")}</h1>
        <p class="kleer__t">${L("Du bist angemeldet, hast aber noch keinen Benutzernamen. Leg ihn fest, dann steht dein Profil.",
                                 "You’re signed in but haven’t chosen a username yet. Set one and your profile is ready.")}</p>
        <div class="kleer__knoepfe">
          <button type="button" class="btn btn--pink btn--lg" data-konto-oeffnen="profil">${L("Profil anlegen", "Set up profile")}</button>
          <button type="button" class="btn btn--ghost btn--lg" data-konto-abmelden>${L("Abmelden", "Sign out")}</button>
        </div>
      </section>`;
    return;
  }

  let geloescht = false;
  try {
    geloescht = sessionStorage.getItem("konto-geloescht") === "1";
    if (geloescht) sessionStorage.removeItem("konto-geloescht");
  } catch (e) {}

  root.innerHTML = `
    <div class="kleer__bg" aria-hidden="true"><img src="assets/img/art/jason_lucia_robbery.jpg" alt=""></div>
    <section class="kleer">
      <p class="kicker">${geloescht ? L("Konto gelöscht", "Account deleted") : L("Konto · luciajason.de", "Account · luciajason.de")}</p>
      <h1 class="h-display">${geloescht ? L("Bis bald", "See you") : L("Dein Konto", "Your account")}</h1>
      <p class="kleer__t">${geloescht
        ? L("Dein Konto und alle Daten dazu sind gelöscht. Du kannst jederzeit ein neues anlegen.",
            "Your account and all its data have been deleted. You can create a new one at any time.")
        : L("Freiwillig und kostenlos. Mit Konto hast du ein eigenes Profil und bekommst die wichtigsten GTA-VI-News per E-Mail.",
            "Optional and free. With an account you get your own profile and the biggest GTA VI news by email.")}</p>
      <ul class="kleer__liste">
        <li><b>${L("Dein Profil", "Your profile")}</b>${L("Titelbild, Profilbild, Lieblingsfigur, Gamertag — alles, was zu dir gehört.", "Cover image, profile picture, favorite character, gamertag — everything that’s you.")}</li>
        <li><b>Newsletter</b>${L("Neue Trailer, offizielle Ankündigungen und die Leak-Lage, gesammelt in dein Postfach.", "New trailers, official announcements and the leak situation, straight to your inbox.")}</li>
        <li><b>${L("Mehrere Konten", "Multiple accounts")}</b>${L("Wechsle mit einem Klick zwischen deinen Konten. Abmelden und löschen geht jederzeit selbst.", "Switch between your accounts in one click. Sign out or delete any time.")}</li>
      </ul>
      <div class="kleer__knoepfe">
        <button type="button" class="btn btn--pink btn--lg" data-konto-oeffnen="registrieren">${L("Konto erstellen", "Create account")}</button>
        <button type="button" class="btn btn--ghost btn--lg" data-konto-oeffnen="anmelden">${L("Anmelden", "Sign in")}</button>
      </div>
    </section>`;
}

/* ═══ Angemeldet ══════════════════════════════════════════ */
const ICON_STIFT = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
const ICON_HAKEN = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_WECHSEL = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const auswahlFeld = (name, label, optionen, wert, leerText) => `
  <label class="kf">
    <span class="kf__l">${label}</span>
    <select class="kf__i" name="${name}">
      <option value="">${leerText || L("Keine Angabe", "No preference")}</option>
      ${optionen.map(o => `<option value="${esc(o.id)}"${wert === o.id ? " selected" : ""}>${esc(o.name)}</option>`).join("")}
    </select>
  </label>`;

function seiteBauen(z) {
  const { nutzer, profil } = z;
  wahl = { avatar: profil.avatar || STANDARD.avatar, titel: profil.cover || STANDARD.titel };
  eigen = { avatar: profil.avatarEigen || "", titel: "" };
  quellen = { avatar: null, titel: null };
  titelGespeichert = "";
  titelGeladen = false;
  document.body.classList.add("hat-titelbild");

  /* Bild aus dem Zwischenspeicher gilt sofort. Hat sich das Profil seither
     nicht geändert, muss aus der Datenbank gar nichts mehr kommen. */
  if (zwischen && zwischen.uid === nutzer.uid) {
    eigen.titel = zwischen.daten || "";
    if (zwischen.stand && profil.stand && zwischen.stand === profil.stand) {
      titelGespeichert = eigen.titel;
      titelGeladen = true;
    }
  }

  root.innerHTML = `
    <section class="khero">
      <div class="khero__inner">
        <img class="khero__av" data-k="av" src="" alt="" width="164" height="164">
        <div class="khero__txt">
          <p class="kicker" data-k="seit"></p>
          <h1 class="h-display khero__name" data-k="name"></h1>
          <p class="khero__bio" data-k="bio"></p>
          <div class="khero__chips" data-k="chips"></div>
          <div class="khero__aktionen">
            <a class="btn btn--pink" href="#bearbeiten" data-nur="profil">${ICON_STIFT}<span>${L("Profil bearbeiten", "Edit profile")}</span></a>
            <a class="btn btn--pink" href="#profil" data-nur="bearbeiten">${ICON_HAKEN}<span>${L("Zur Profilansicht", "View profile")}</span></a>
            <button type="button" class="btn btn--ghost" data-konto-wechseln>${ICON_WECHSEL}<span>${L("Konto wechseln", "Switch account")}</span></button>
          </div>
        </div>
      </div>
    </section>

    <div class="kprofil" data-modus="profil"></div>

    <div class="kgrid" data-modus="bearbeiten" hidden>
      <section class="kbox" aria-labelledby="kProfilH">
        <p class="kbox__k">${L("Profil", "Profile")}</p>
        <h2 class="kbox__h" id="kProfilH">${L("Profil bearbeiten", "Edit profile")}</h2>
        <form class="kbox__form" id="kProfilForm" novalidate>
          <fieldset class="kbild">
            <legend class="kf__l">${L("Titelbild", "Cover image")}</legend>
            <p class="kf__h kbild__hinweis">${L("Liegt hinter deinem ganzen Profil. Eigene Bilder bleiben in voller Auflösung — bis 4K.", "Sits behind your whole profile. Your own images keep their full resolution — up to 4K.")}</p>
            <div class="kbild__raster kbild__raster--titel" role="radiogroup"
                 aria-label="${esc(L("Titelbild", "Cover image"))}" data-raster="titel"></div>
            <div class="kbox__zeile kbild__aktionen" data-aktionen="titel"></div>
          </fieldset>

          <fieldset class="kbild">
            <legend class="kf__l">${L("Profilbild", "Profile picture")}</legend>
            <div class="kbild__raster kbild__raster--avatar" role="radiogroup"
                 aria-label="${esc(L("Profilbild", "Profile picture"))}" data-raster="avatar"></div>
            <div class="kbox__zeile kbild__aktionen" data-aktionen="avatar"></div>
          </fieldset>

          <label class="kf">
            <span class="kf__l">${L("Benutzername", "Username")}</span>
            <input class="kf__i" name="username" value="${esc(profil.username)}" maxlength="20"
                   autocomplete="username" autocapitalize="off" spellcheck="false" required aria-describedby="kNameHinweis">
            <span class="kf__h" id="kNameHinweis">${L("3–20 Zeichen: Buchstaben, Ziffern, Punkt, Minus, Unterstrich", "3–20 characters: letters, numbers, dot, dash, underscore")}</span>
          </label>

          <label class="kf">
            <span class="kf__l">${L("Über mich", "About me")}</span>
            <textarea class="kf__i" name="bio" maxlength="${BIO_MAX}" rows="4"
                      placeholder="${esc(L("Team Jason oder Team Lucia? Worauf freust du dich am meisten?", "Team Jason or Team Lucia? What are you most excited about?"))}">${esc(profil.bio)}</textarea>
            <span class="kzaehler" id="kBioZahl" aria-live="polite"></span>
          </label>

          <fieldset class="kbild">
            <legend class="kf__l">${L("Über dich", "About you")}</legend>
            <div class="kfelder">
              ${auswahlFeld("favChar", L("Lieblingsfigur", "Favorite character"), FIGUREN.map(f => ({ id: f.id, name: f.name })), profil.favChar)}
              ${auswahlFeld("lieblingsort", L("Lieblingsort", "Favorite place"), ALLE_ORTE().map(o => ({ id: o.id, name: o.name })), profil.lieblingsort)}
              ${auswahlFeld("plattform", L("Plattform", "Platform"), PLATTFORMEN, profil.plattform)}
              ${auswahlFeld("edition", L("Edition", "Edition"), EDITIONEN, profil.edition)}
              ${auswahlFeld("vorfreude", L("Am meisten freue ich mich auf", "Most excited about"), VORFREUDE, profil.vorfreude)}
              <label class="kf">
                <span class="kf__l">${L("Gamertag (PSN / Xbox)", "Gamertag (PSN / Xbox)")}</span>
                <input class="kf__i" name="gamertag" value="${esc(profil.gamertag)}" maxlength="24"
                       autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(L("z. B. ViceCityLegend", "e.g. ViceCityLegend"))}">
              </label>
            </div>
          </fieldset>

          <div class="kbox__zeile kspeichern">
            <button type="submit" class="btn btn--pink btn--lg">${L("Speichern", "Save")}</button>
            <p class="kbox__status" id="kProfilStatus" role="status"></p>
          </div>
        </form>
      </section>

      <div class="kspalte">
        <section class="kbox" aria-labelledby="kNewsH">
          <p class="kbox__k">Newsletter</p>
          <h2 class="kbox__h" id="kNewsH">${L("GTA VI News", "GTA VI News")}</h2>
          <p class="kbox__t">${L("Neue Trailer, offizielle Ankündigungen und die wichtigsten Leaks — gesammelt per E-Mail. Kein Spam, jederzeit abbestellbar.",
                                 "New trailers, official announcements and the biggest leaks — collected by email. No spam, unsubscribe any time.")}</p>
          <button type="button" class="kschalter" role="switch" aria-checked="false" id="kNews" disabled>
            <span><b>${L("Newsletter abonnieren", "Subscribe to the newsletter")}</b><small id="kNewsKlein">${esc(nutzer.email)}</small></span>
            <span class="kschalter__bahn" aria-hidden="true"></span>
          </button>
          <div id="kNewsHinweis"></div>
          <p class="kbox__status" id="kNewsStatus" role="status"></p>
        </section>

        <section class="kbox" aria-labelledby="kSichH">
          <p class="kbox__k">${L("Sicherheit", "Security")}</p>
          <h2 class="kbox__h" id="kSichH">${L("Anmeldung", "Sign-in")}</h2>
          <dl class="kdaten" id="kDaten"></dl>
          <div class="kbox__zeile" id="kSichKnoepfe"></div>
          <p class="kbox__status" id="kSichStatus" role="status"></p>
        </section>

        <section class="kbox kbox--gefahr" aria-labelledby="kWegH">
          <p class="kbox__k">${L("Gefahrenzone", "Danger zone")}</p>
          <h2 class="kbox__h" id="kWegH">${L("Konto löschen", "Delete account")}</h2>
          <p class="kbox__t">${L("Löscht dein Profil, deinen Benutzernamen, deine Newsletter-Anmeldung und das Konto selbst — endgültig.",
                                 "Deletes your profile, username, newsletter subscription and the account itself — permanently.")}</p>
          <button type="button" class="btn btn--gefahr" id="kWegStart" aria-expanded="false" aria-controls="kWegForm">${L("Konto löschen …", "Delete account …")}</button>
          <form class="kloeschen" id="kWegForm" hidden novalidate></form>
        </section>
      </div>
    </div>`;

  kopfAuffrischen(z);
  sicherheitAuffrischen(z);
  profilFormular();
  newsletterEinrichten();
  loeschenEinrichten();
  modusSetzen(false);

  if (window.Newswire) {
    Newswire.laden().then(d => {
      if (!d || gebautFuer !== nutzer.uid) return;
      newswire = d;
      ansichtZeichnen();
    });
  }

  /* Das eigene Titelbild liegt getrennt. Steht es schon aus dem
     Zwischenspeicher und hat sich das Profil nicht geändert, sparen wir
     uns das Laden ganz. */
  const uid = nutzer.uid;
  if (titelGeladen) {
    if (wahl.titel === "eigen" && !eigen.titel) wahl.titel = STANDARD.titel;
    bildAuswahlZeichnen("titel");
    kopfAuffrischen(zustand);
    titelMerken(uid, { cover: profil.cover, daten: eigen.titel, stand: profil.stand });
    return;
  }
  zustand.backend.titelbildLaden(uid).then(daten => {
    if (gebautFuer !== uid) return;
    eigen.titel = daten || "";
    titelGespeichert = eigen.titel;
    titelGeladen = true;
    if (wahl.titel === "eigen" && !eigen.titel) wahl.titel = STANDARD.titel;
    bildAuswahlZeichnen("titel");
    kopfAuffrischen(zustand);
    titelMerken(uid, { cover: zustand.profil.cover, daten: eigen.titel, stand: zustand.profil.stand });
  }).catch(() => {
    if (gebautFuer !== uid) return;
    bildAuswahlZeichnen("titel");
  });
}

/* Profil ansehen ↔ bearbeiten, gesteuert über #bearbeiten */
function modusSetzen(scrollen) {
  const modus = location.hash === "#bearbeiten" ? "bearbeiten" : "profil";
  root.querySelectorAll("[data-modus]").forEach(el => { el.hidden = el.dataset.modus !== modus; });
  root.querySelectorAll("[data-nur]").forEach(el => { el.hidden = el.dataset.nur !== modus; });
  document.body.classList.toggle("ist-bearbeiten", modus === "bearbeiten");
  if (modus === "profil") ansichtZeichnen();
  if (scrollen) {
    const ziel = root.querySelector(`[data-modus="${modus}"]`);
    const oben = ziel ? ziel.getBoundingClientRect().top + scrollY - 110 : 0;
    if (scrollY > oben) scrollTo({ top: Math.max(0, oben), behavior: "smooth" });
  }
}

/* ── Profilkopf ── */
function ungespeichert() {
  const p = zustand.profil;
  if (!p) return false;
  return wahl.avatar !== p.avatar ||
         eigen.avatar !== (p.avatarEigen || "") ||
         (titelGeladen && (wahl.titel !== p.cover || eigen.titel !== titelGespeichert));
}

function kopfAuffrischen({ nutzer, profil }) {
  const q = s => root.querySelector(`[data-k="${s}"]`);
  if (!q("name")) return;
  document.title = profil.username + " — Grand Theft Auto VI";
  /* Bilder aus der aktuellen Auswahl — Vorschau vor dem Speichern */
  q("av").src = avatarUrl(wahl.avatar, eigen.avatar);
  /* Eigenes Bild gewählt, aber noch nicht da? Dann lieber nur den dunklen
     Grund zeigen, statt kurz eine fremde Vorlage. */
  hintergrundSetzen(wahl.titel === "eigen" && !eigen.titel ? "" : titelUrl(wahl.titel, eigen.titel));
  q("name").textContent = profil.username;
  q("bio").textContent = profil.bio || "";
  q("seit").textContent = profil.createdAt
    ? L("Mitglied seit ", "Member since ") + datumMonat(profil.createdAt)
    : L("Mitglied", "Member");

  const chips = [];
  if (ungespeichert()) chips.push(`<span class="kchip kchip--vorschau">${L("Vorschau · noch nicht gespeichert", "Preview · not saved yet")}</span>`);
  const plattform = PLATTFORMEN.find(p => p.id === profil.plattform);
  if (plattform) chips.push(`<span class="kchip">${esc(plattform.name)}</span>`);
  if (profil.edition === "ultimate") chips.push(`<span class="kchip kchip--gold">Ultimate Edition</span>`);
  if (newsletterAn) chips.push(`<span class="kchip kchip--pink">${L("Newsletter aktiv", "Newsletter on")}</span>`);
  if (istAdmin(profil)) chips.push(`<span class="kchip kchip--admin">Admin</span>`);
  if (!nutzer.emailVerified) chips.push(`<span class="kchip kchip--warn">${L("E-Mail nicht bestätigt", "Email not confirmed")}</span>`);
  q("chips").innerHTML = chips.join("");

  const status = document.getElementById("kProfilStatus");
  if (status && ungespeichert() && !status.textContent) {
    status.textContent = L("Änderungen noch nicht gespeichert.", "Changes not saved yet.");
    status.classList.add("is-hinweis");
  }
}

/* ── Profil ansehen ── */
function tageZwischen(a, b) {
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function ansichtZeichnen() {
  const box = root.querySelector(".kprofil");
  const p = zustand.profil;
  if (!box || !p || box.hidden) return;

  const plattform = PLATTFORMEN.find(x => x.id === p.plattform);
  const edition = EDITIONEN.find(x => x.id === p.edition);
  const figur = FIGUREN.find(f => f.id === p.favChar);
  const ort = ALLE_ORTE().find(o => o.id === p.lieblingsort);
  const vorfreude = VORFREUDE.find(v => v.id === p.vorfreude);
  const dabei = p.createdAt ? tageZwischen(new Date(p.createdAt), Date.now()) : 0;
  const leerKarte = (kicker, text) => `
    <a class="kkarte kkarte--leer" href="#bearbeiten">
      <span class="kicker">${kicker}</span>
      <b>${text}</b>
      <span class="kkarte__plus">${L("Im Profil festlegen", "Set it in your profile")} →</span>
    </a>`;

  const figurBild = figur
    ? "assets/img/" + ((SEITEN[figur.id] && SEITEN[figur.id].full) || (figur.thumb || "").replace("assets/img/", ""))
    : "";

  box.innerHTML = `
    <div class="kstats">
      <div class="kstat kstat--countdown">
        <span class="kstat__k">${L("GTA VI erscheint in", "GTA VI launches in")}</span>
        <b class="kstat__v" data-k="tage">—</b>
        <span class="kstat__u" data-k="uhr">${L("Tagen", "days")}</span>
      </div>
      <div class="kstat">
        <span class="kstat__k">${L("Dabei seit", "Member for")}</span>
        <b class="kstat__v">${dabei}</b>
        <span class="kstat__u">${dabei === 1 ? L("Tag", "day") : L("Tagen", "days")}${p.createdAt ? " · " + esc(datumMonat(new Date(p.createdAt))) : ""}</span>
      </div>
      <div class="kstat">
        <span class="kstat__k">${L("Plattform", "Platform")}</span>
        <b class="kstat__v kstat__v--text">${plattform ? esc(plattform.kurz) : "—"}</b>
        <span class="kstat__u">${plattform ? esc(plattform.name) : `<a href="#bearbeiten">${L("festlegen", "set it")}</a>`}</span>
      </div>
      <div class="kstat">
        <span class="kstat__k">Edition</span>
        <b class="kstat__v kstat__v--text">${edition ? esc(edition.kurz) : "—"}</b>
        <span class="kstat__u">${edition ? "Edition" : `<a href="#bearbeiten">${L("festlegen", "set it")}</a>`}</span>
      </div>
    </div>

    <div class="kkarten">
      ${figur ? `
        <article class="kkarte kkarte--bild">
          <img src="${esc(figurBild)}" alt="" loading="lazy">
          <div class="kkarte__inhalt">
            <span class="kicker">${L("Lieblingsfigur", "Favorite character")}</span>
            <h2 class="kkarte__titel">${figur.display}</h2>
            <p class="kkarte__zeile">${esc(figur.tag)} · ${esc(figur.sub)}</p>
            <p class="kkarte__zitat">${L("„", "“")}${String(figur.quote).replace(/<br>/g, " ")}${L("“", "”")}</p>
            <a class="btn btn--ghost" href="charakter.html?c=${esc(figur.id)}">${L("Akte öffnen", "Open file")}</a>
          </div>
        </article>` : leerKarte(L("Lieblingsfigur", "Favorite character"), L("Team Jason oder Team Lucia?", "Team Jason or Team Lucia?"))}

      ${ort ? `
        <article class="kkarte kkarte--bild">
          <img src="${esc(ort.shots && ort.shots[0] ? "assets/img/" + ort.shots[0] : ort.hero)}" alt="" loading="lazy">
          <div class="kkarte__inhalt">
            <span class="kicker">${L("Lieblingsort", "Favorite place")}</span>
            <h2 class="kkarte__titel">${esc(ort.name)}</h2>
            <p class="kkarte__zeile">${esc(ort.sub)} · ${esc(ort.badge)}</p>
            <p class="kkarte__text">${esc(ort.text)}</p>
            <a class="btn btn--ghost" href="${esc(ort.ziel || "index.html#leonida")}">${ort.zielText || L("Nach Leonida", "Explore Leonida")}</a>
          </div>
        </article>` : leerKarte(L("Lieblingsort", "Favorite place"), L("Wo in Leonida fühlst du dich zu Hause?", "Where in Leonida do you feel at home?"))}
    </div>

    <div class="kreihe">
      ${vorfreude ? `
        <article class="kmini kmini--bild">
          <img src="assets/img/${esc(vorfreude.bild)}" alt="" loading="lazy">
          <div>
            <span class="kicker">${L("Freut sich am meisten auf", "Most excited about")}</span>
            <b>${esc(vorfreude.name)}</b>
          </div>
        </article>` : `
        <a class="kmini kmini--leer" href="#bearbeiten">
          <span class="kicker">${L("Vorfreude", "Excitement")}</span>
          <b>${L("Worauf freust du dich am meisten?", "What are you most excited about?")}</b>
        </a>`}

      ${p.gamertag ? `
        <article class="kmini">
          <div>
            <span class="kicker">Gamertag${plattform ? " · " + esc(plattform.kurz) : ""}</span>
            <b class="kmini__tag">${esc(p.gamertag)}</b>
          </div>
          <button type="button" class="btn btn--ghost btn--sm" data-kopieren="${esc(p.gamertag)}">${L("Kopieren", "Copy")}</button>
        </article>` : `
        <a class="kmini kmini--leer" href="#bearbeiten">
          <span class="kicker">Gamertag</span>
          <b>${L("Damit dich andere in Leonida finden", "So others can find you in Leonida")}</b>
        </a>`}

      ${newsletterKachel()}
    </div>

    <section class="kbox knews">
      <p class="kbox__k">Rockstar Newswire</p>
      <h2 class="kbox__h">${L("Neu für dich", "New for you")}</h2>
      <div class="knews__liste">${newswireHtml()}</div>
      <a class="kd__link" href="index.html#news">${L("Alle News & Leaks", "All news & leaks")} →</a>
    </section>`;

  clearInterval(uhr);
  const tick = () => {
    const rest = (typeof RELEASE !== "undefined" ? RELEASE : Date.now()) - Date.now();
    const t = box.querySelector('[data-k="tage"]'), u = box.querySelector('[data-k="uhr"]');
    if (!t) return clearInterval(uhr);
    if (rest <= 0) { t.textContent = "0"; u.textContent = L("Es ist so weit!", "It’s here!"); return clearInterval(uhr); }
    const s = Math.floor(rest / 1000), zwei = n => String(n).padStart(2, "0");
    t.textContent = Math.floor(s / 86400);
    u.textContent = L("Tagen · ", "days · ") + `${zwei(Math.floor(s % 86400 / 3600))}:${zwei(Math.floor(s % 3600 / 60))}:${zwei(s % 60)}`;
  };
  tick();
  uhr = setInterval(tick, 1000);
}

/* Der Newsletter-Stand kommt erst nach dem Zeichnen — deshalb steht die
   Kachel für sich und wird einzeln nachgezogen. */
function newsletterKachel() {
  return `
    <a class="kmini ${newsletterAn ? "kmini--an" : ""}" href="#bearbeiten" data-k="newsletter">
      <div>
        <span class="kicker">Newsletter</span>
        <b>${newsletterAn ? L("Du bekommst alle GTA-VI-News", "You’re getting all GTA VI news") : L("Noch nicht abonniert", "Not subscribed yet")}</b>
      </div>
      <span class="kmini__punkt" aria-hidden="true"></span>
    </a>`;
}

function newsletterKachelAuffrischen() {
  const alt = root.querySelector('[data-k="newsletter"]');
  if (!alt) return;
  const hilfe = document.createElement("div");
  hilfe.innerHTML = newsletterKachel();
  alt.replaceWith(hilfe.firstElementChild);
}

function newswireHtml() {
  if (!newswire || !window.Newswire) return `<p class="kf__h">${L("Meldungen werden geladen …", "Loading news …")}</p>`;
  const bildOk = u => /^https:\/\/media-rockstargames-com\.akamaized\.net\//.test(u) ? u : "";
  return newswire.meldungen.slice(0, 3).map(m => {
    const t = Newswire.text(m);
    const bild = bildOk(m.bild);
    return `
      <a class="knews__eintrag" href="${esc(Newswire.url(m))}" target="_blank" rel="noopener noreferrer">
        ${bild ? `<img src="${esc(bild)}" alt="" loading="lazy">` : ""}
        <span>
          <time datetime="${esc(m.datum)}">${esc(t.datum)}</time>${Newswire.istNeu(m) ? `<i class="nitem__neu">${L("NEU", "NEW")}</i>` : ""}
          <b>${esc(t.titel)}</b>
        </span>
      </a>`;
  }).join("");
}

root.addEventListener("click", e => {
  const k = e.target.closest("[data-kopieren]");
  if (!k) return;
  const text = k.getAttribute("data-kopieren");
  const fertig = () => { k.textContent = L("Kopiert ✓", "Copied ✓"); setTimeout(() => { k.textContent = L("Kopieren", "Copy"); }, 1800); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(fertig, () => {});
});

/* ── Bildauswahl (Titelbild und Profilbild) ── */
function bildAuswahlZeichnen(art) {
  const raster = root.querySelector(`[data-raster="${art}"]`);
  const aktionen = root.querySelector(`[data-aktionen="${art}"]`);
  if (!raster) return;
  const istTitel = art === "titel";
  const vorlagen = istTitel ? TITEL_VORLAGEN : VORLAGEN;
  const klasse = istTitel ? "tb-wahl" : "av-wahl";
  const url = istTitel ? (id => `assets/img/covers/klein/${id}.jpg`) : (id => `assets/img/avatars/${id}.jpg`);

  const kacheln = [];
  if (eigen[art]) {
    kacheln.push(`
      <button type="button" role="radio" class="${klasse} ${klasse}--eigen" data-bild="${art}" data-wert="eigen"
              aria-checked="${wahl[art] === "eigen"}" aria-label="${esc(L("Eigenes Bild", "Your own image"))}" title="${esc(L("Eigenes Bild", "Your own image"))}">
        <img src="${esc(eigen[art])}" alt="">
        <span class="kbild__eigen">${L("Eigenes", "Yours")}</span>
      </button>`);
  }
  vorlagen.forEach(v => kacheln.push(`
    <button type="button" role="radio" class="${klasse}" data-bild="${art}" data-wert="preset:${v.id}"
            aria-checked="${wahl[art] === "preset:" + v.id}" aria-label="${esc(v.name)}" title="${esc(v.name)}">
      <img src="${url(v.id)}" alt="" loading="lazy">
    </button>`));
  raster.innerHTML = kacheln.join("");

  const laden = istTitel && !titelGeladen && zustand.profil && zustand.profil.cover === "eigen";
  aktionen.innerHTML = `
    <label class="btn btn--ghost kav__upload">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 16V4m0 0l-5 5m5-5l5 5M4 20h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${eigen[art] ? L("Neues Bild hochladen", "Upload new image") : L("Eigenes Bild hochladen", "Upload your own")}</span>
      <input type="file" data-hochladen="${art}" accept="image/jpeg,image/png,image/webp,image/gif">
    </label>
    ${quellen[art] || eigen[art] ? `<button type="button" class="btn btn--ghost" data-zuschnitt="${art}">${L("Zuschnitt ändern", "Adjust crop")}</button>` : ""}
    ${eigen[art] ? `<button type="button" class="kd__link" data-entfernen="${art}">${L("Eigenes Bild entfernen", "Remove your image")}</button>` : ""}
    ${laden ? `<span class="kf__h">${L("Eigenes Titelbild wird geladen …", "Loading your cover …")}</span>` : ""}`;
}

function bildGewaehlt(art) {
  bildAuswahlZeichnen(art);
  const status = document.getElementById("kProfilStatus");
  if (status) { status.textContent = ""; status.classList.remove("is-schlecht", "is-hinweis"); }
  kopfAuffrischen(zustand);
}

/* Ohne Original aus diesem Besuch (Seite neu geladen) dient das
   gespeicherte Bild als Vorlage — verschieben und hineinzoomen geht
   dann weiterhin, nur nicht mehr heraus über den alten Rand. */
function gespeichertesBild(daten) {
  return new Promise((ok, nein) => {
    const i = new Image();
    i.onload = () => ok({ bild: i, stand: { zoom: 1, mx: 0.5, my: 0.5 } });
    i.onerror = nein;
    i.src = daten;
  });
}

async function bildZuschneiden(art, datei) {
  const status = document.getElementById("kProfilStatus");
  try {
    let quelle = datei ? undefined : quellen[art];
    if (!datei && !quelle && eigen[art]) quelle = await gespeichertesBild(eigen[art]);
    if (!datei && !quelle) return;
    const erg = await zuschneiden({
      art,
      datei: datei || undefined,
      quelle,
      vorschau: { avatar: avatarUrl(wahl.avatar, eigen.avatar), name: zustand.profil.username }
    });
    if (!erg) return;
    eigen[art] = erg.daten;
    quellen[art] = erg.quelle;
    wahl[art] = "eigen";
    bildGewaehlt(art);
  } catch (e) {
    status.textContent = meldung(e);
    status.classList.remove("is-hinweis");
    status.classList.add("is-schlecht");
  }
}

/* ── Profil bearbeiten ── */
function profilFormular() {
  const form = document.getElementById("kProfilForm");
  const status = document.getElementById("kProfilStatus");
  const hinweis = document.getElementById("kNameHinweis");
  const zahl = document.getElementById("kBioZahl");
  const hinweisText = hinweis.textContent;

  const statusSetzen = (text, schlecht) => {
    status.textContent = text || "";
    status.classList.remove("is-hinweis");
    status.classList.toggle("is-schlecht", !!schlecht);
  };

  bildAuswahlZeichnen("titel");
  bildAuswahlZeichnen("avatar");

  form.addEventListener("click", e => {
    const kachel = e.target.closest("[data-bild]");
    if (kachel) {
      wahl[kachel.dataset.bild] = kachel.dataset.wert;
      return bildGewaehlt(kachel.dataset.bild);
    }
    const neu = e.target.closest("[data-zuschnitt]");
    if (neu) return bildZuschneiden(neu.dataset.zuschnitt);
    const weg = e.target.closest("[data-entfernen]");
    if (weg) {
      const art = weg.dataset.entfernen;
      eigen[art] = "";
      quellen[art] = null;
      if (wahl[art] === "eigen") wahl[art] = STANDARD[art];
      return bildGewaehlt(art);
    }
  });

  form.addEventListener("change", e => {
    const feld = e.target.closest("[data-hochladen]");
    if (!feld) return;
    const datei = feld.files && feld.files[0];
    feld.value = "";
    if (datei) bildZuschneiden(feld.dataset.hochladen, datei);
  });

  /* Wer ungespeicherte Bilder hat, wird beim Verlassen gefragt */
  addEventListener("beforeunload", e => {
    if (gebautFuer && ungespeichert()) { e.preventDefault(); e.returnValue = ""; }
  });

  /* Zeichen zählen */
  const zaehlen = () => { zahl.textContent = `${form.bio.value.length} / ${BIO_MAX}`; };
  form.bio.addEventListener("input", zaehlen);
  zaehlen();

  /* Name live prüfen, leicht verzögert */
  let pruefTimer = null, pruefNr = 0;
  form.username.addEventListener("input", () => {
    clearTimeout(pruefTimer);
    const name = form.username.value.trim();
    hinweis.classList.remove("is-gut", "is-schlecht");
    if (name.toLowerCase() === zustand.profil.username.toLowerCase()) { hinweis.textContent = hinweisText; return; }
    if (!NAME_MUSTER.test(name)) {
      hinweis.textContent = hinweisText;
      if (name.length >= 3) hinweis.classList.add("is-schlecht");
      return;
    }
    const nr = ++pruefNr;
    pruefTimer = setTimeout(async () => {
      try {
        const frei = await zustand.backend.nameFrei(name, zustand.nutzer.uid);
        if (nr !== pruefNr) return;
        hinweis.textContent = frei ? L("Name ist frei", "Name is available") : L("Schon vergeben", "Already taken");
        hinweis.classList.add(frei ? "is-gut" : "is-schlecht");
      } catch (e) { /* beim Speichern wird ohnehin noch einmal geprüft */ }
    }, 420);
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = form.username.value.trim();
    if (!NAME_MUSTER.test(name)) { form.username.focus(); return statusSetzen(meldung({ code: "name-ungueltig" }), true); }
    const gamertag = form.gamertag.value.trim();
    if (!GAMERTAG_MUSTER.test(gamertag)) {
      form.gamertag.focus();
      return statusSetzen(L("Gamertag: bis 24 Zeichen, Buchstaben, Ziffern, Leerzeichen, Punkt, Minus, Unterstrich.",
                            "Gamertag: up to 24 characters — letters, numbers, spaces, dot, dash, underscore."), true);
    }
    if (wahl.avatar === "eigen" && !eigen.avatar) wahl.avatar = STANDARD.avatar;
    if (wahl.titel === "eigen" && titelGeladen && !eigen.titel) wahl.titel = STANDARD.titel;
    const daten = {
      username: name,
      bio: form.bio.value.trim().slice(0, BIO_MAX),
      avatar: wahl.avatar,
      avatarEigen: eigen.avatar,
      /* Solange das eigene Titelbild nicht geladen ist, bleibt es unangetastet */
      cover: titelGeladen ? wahl.titel : zustand.profil.cover,
      favChar: form.favChar.value,
      lieblingsort: form.lieblingsort.value,
      plattform: form.plattform.value,
      edition: form.edition.value,
      vorfreude: form.vorfreude.value,
      gamertag,
      lang: LANG
    };
    const titelNeu = titelGeladen && eigen.titel !== titelGespeichert;
    if (titelNeu) daten.coverEigen = eigen.titel;
    const knopf = form.querySelector("[type=submit]");
    knopf.disabled = true; knopf.classList.add("is-busy");
    statusSetzen(titelNeu && eigen.titel
      ? L("Titelbild wird hochgeladen …", "Uploading cover image …") : "");
    try {
      await zustand.backend.profilSpeichern(zustand.nutzer.uid, daten, zustand.profil);
      if (titelNeu) titelGespeichert = eigen.titel;
      /* stand 0: Der Zeitstempel kommt vom Server, beim nächsten Besuch
         wird einmal abgeglichen. Das Bild ist trotzdem sofort da. */
      titelMerken(zustand.nutzer.uid, { cover: daten.cover, daten: eigen.titel, stand: 0 });
      const { coverEigen, ...profil } = daten;
      profilSetzen({ ...profil, createdAt: zustand.profil.createdAt });
      bildAuswahlZeichnen("titel");
      bildAuswahlZeichnen("avatar");
      hinweis.textContent = hinweisText;
      hinweis.classList.remove("is-gut", "is-schlecht");
      statusSetzen(L("Gespeichert.", "Saved."));
    } catch (err) {
      if (err.code === "name-vergeben") form.username.focus();
      statusSetzen(meldung(err), true);
    } finally {
      knopf.disabled = false; knopf.classList.remove("is-busy");
    }
  });
}

/* ── Newsletter ── */
function newsletterEinrichten() {
  const schalter = document.getElementById("kNews");
  const status = document.getElementById("kNewsStatus");

  schalter.addEventListener("click", async () => {
    const neu = !newsletterAn;
    schalter.disabled = true;
    status.textContent = "";
    status.classList.remove("is-schlecht");
    try {
      await zustand.backend.newsletterSetzen(zustand.nutzer.uid, neu, LANG);
      newsletterAn = neu;
      status.textContent = neu
        ? L("Angemeldet. Die nächste Ausgabe kommt an deine E-Mail-Adresse.", "Subscribed. The next issue goes to your email address.")
        : L("Abgemeldet. Deine Adresse ist aus dem Verteiler gelöscht.", "Unsubscribed. Your address has been removed from the list.");
    } catch (e) {
      status.textContent = meldung(e);
      status.classList.add("is-schlecht");
    } finally {
      newsletterZeichnen();
      newsletterKachelAuffrischen();
      kopfAuffrischen(zustand);
    }
  });

  zustand.backend.newsletterStatus(zustand.nutzer.uid).then(an => {
    newsletterAn = an;
    newsletterZeichnen();
    newsletterKachelAuffrischen();
    kopfAuffrischen(zustand);
  });
}

function newsletterZeichnen() {
  const schalter = document.getElementById("kNews");
  const box = document.getElementById("kNewsHinweis");
  if (!schalter) return;
  const bestaetigt = zustand.nutzer.emailVerified;
  schalter.setAttribute("aria-checked", String(newsletterAn));
  /* Abbestellen geht immer, Anmelden erst mit bestätigter Adresse */
  schalter.disabled = !bestaetigt && !newsletterAn;

  if (bestaetigt) { box.innerHTML = ""; return; }
  box.innerHTML = `
    <div class="khinweis">
      <b>${L("E-Mail noch nicht bestätigt.", "Email not confirmed yet.")}</b>
      ${L(`Klick auf den Link in der Mail an ${esc(zustand.nutzer.email)} — erst dann lässt sich der Newsletter abonnieren. So stellen wir sicher, dass niemand eine fremde Adresse einträgt.`,
          `Click the link in the email sent to ${esc(zustand.nutzer.email)} — only then can you subscribe. That way nobody can sign up someone else’s address.`)}
      <div class="kbox__zeile">
        <button type="button" class="btn btn--ghost" data-bestaetigt>${L("Ich habe bestätigt", "I’ve confirmed it")}</button>
        <button type="button" class="kd__link" data-nochmal>${L("Mail erneut senden", "Resend email")}</button>
      </div>
    </div>`;

  const status = document.getElementById("kNewsStatus");
  box.querySelector("[data-bestaetigt]").addEventListener("click", async e => {
    const k = e.currentTarget;
    k.disabled = true; k.classList.add("is-busy");
    try {
      const n = await zustand.backend.bestaetigungPruefen();
      if (n) zustand.nutzer = n;
      if (n && n.emailVerified) {
        status.textContent = L("Bestätigt — jetzt kannst du den Newsletter abonnieren.", "Confirmed — you can subscribe now.");
        status.classList.remove("is-schlecht");
      } else {
        status.textContent = L("Noch nicht bestätigt. Schau auch im Spam-Ordner nach.", "Not confirmed yet. Check your spam folder too.");
        status.classList.add("is-schlecht");
      }
    } catch (err) {
      status.textContent = meldung(err);
      status.classList.add("is-schlecht");
    }
    newsletterZeichnen();
    kopfAuffrischen(zustand);
    sicherheitAuffrischen(zustand);
  });
  box.querySelector("[data-nochmal]").addEventListener("click", async e => {
    const k = e.currentTarget;
    k.disabled = true;
    try {
      await zustand.backend.bestaetigungSenden();
      status.textContent = L("Mail ist unterwegs.", "Email is on its way.");
      status.classList.remove("is-schlecht");
    } catch (err) {
      status.textContent = meldung(err);
      status.classList.add("is-schlecht");
    }
    setTimeout(() => { k.disabled = false; }, 30000);   // nicht im Sekundentakt
  });
}

/* ── Anmeldung & Sicherheit ── */
function sicherheitAuffrischen({ nutzer }) {
  const daten = document.getElementById("kDaten");
  const knoepfe = document.getElementById("kSichKnoepfe");
  if (!daten) return;
  const google = nutzer.provider === "google";
  daten.innerHTML = `
    <div><dt>${L("E-Mail", "Email")}</dt><dd>${esc(nutzer.email)}</dd></div>
    <div><dt>${L("Anmeldung über", "Signs in with")}</dt><dd>${google ? "Google" : L("E-Mail & Passwort", "Email & password")}</dd></div>
    <div><dt>${L("Bestätigt", "Confirmed")}</dt><dd>${nutzer.emailVerified ? L("Ja", "Yes") : L("Noch nicht", "Not yet")}</dd></div>`;

  if (knoepfe.dataset.fuer === nutzer.provider) return;
  knoepfe.dataset.fuer = nutzer.provider;
  knoepfe.innerHTML = `
    ${google ? "" : `<button type="button" class="btn btn--ghost" id="kPwNeu">${L("Passwort ändern", "Change password")}</button>`}
    <button type="button" class="btn btn--ghost" data-konto-abmelden>${L("Abmelden", "Sign out")}</button>`;

  const pw = document.getElementById("kPwNeu");
  if (pw) pw.addEventListener("click", async () => {
    const status = document.getElementById("kSichStatus");
    pw.disabled = true; pw.classList.add("is-busy");
    try {
      await zustand.backend.passwortVergessen(zustand.nutzer.email);
      status.textContent = L(`Link zum Ändern an ${zustand.nutzer.email} geschickt.`, `A link to change it was sent to ${zustand.nutzer.email}.`);
      status.classList.remove("is-schlecht");
    } catch (e) {
      status.textContent = meldung(e);
      status.classList.add("is-schlecht");
    } finally {
      pw.classList.remove("is-busy");
      setTimeout(() => { pw.disabled = false; }, 30000);
    }
  });
}

/* ── Konto löschen ── */
function loeschenEinrichten() {
  const start = document.getElementById("kWegStart");
  const form = document.getElementById("kWegForm");

  start.addEventListener("click", () => {
    const offen = !form.hidden;
    if (offen) { form.hidden = true; start.setAttribute("aria-expanded", "false"); return; }
    const google = zustand.nutzer.provider === "google";
    form.innerHTML = `
      <label class="kf">
        <span class="kf__l">${L("Zur Bestätigung deinen Benutzernamen eingeben", "Type your username to confirm")}</span>
        <input class="kf__i" name="bestaetigung" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(zustand.profil.username)}">
      </label>
      ${google
        ? `<p class="kf__h">${L("Google fragt gleich noch einmal nach deiner Anmeldung.", "Google will ask you to sign in once more.")}</p>`
        : `<label class="kf"><span class="kf__l">${L("Passwort", "Password")}</span>
             <input class="kf__i" type="password" name="pw" autocomplete="current-password"></label>`}
      <div class="kbox__zeile">
        <button type="submit" class="btn btn--gefahr-voll">${L("Endgültig löschen", "Delete permanently")}</button>
        <button type="button" class="btn btn--ghost" data-abbruch>${L("Abbrechen", "Cancel")}</button>
      </div>
      <p class="kbox__status is-schlecht" role="alert" data-status></p>`;
    form.hidden = false;
    start.setAttribute("aria-expanded", "true");
    form.bestaetigung.focus();
    form.querySelector("[data-abbruch]").addEventListener("click", () => {
      form.hidden = true;
      start.setAttribute("aria-expanded", "false");
      start.focus();
    });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const status = form.querySelector("[data-status]");
    if (form.bestaetigung.value.trim() !== zustand.profil.username) {
      status.textContent = L("Der Benutzername stimmt nicht.", "The username doesn’t match.");
      form.bestaetigung.focus();
      return;
    }
    const knopf = form.querySelector("[type=submit]");
    knopf.disabled = true; knopf.classList.add("is-busy");
    status.textContent = "";
    /* Vorher setzen: das Abmelden kommt noch während des Löschens an, und
       die Seite soll dann schon „Konto gelöscht" zeigen */
    const merken = an => {
      try {
        if (an) sessionStorage.setItem("konto-geloescht", "1");
        else sessionStorage.removeItem("konto-geloescht");
        sessionStorage.removeItem("konto-profil-spaeter");
      } catch (err) {}
    };
    merken(true);
    titelVergessen(zustand.nutzer.uid);
    try {
      const pw = form.pw ? form.pw.value : "";
      await zustand.backend.kontoLoeschen(zustand.nutzer.uid, zustand.profil, pw);
    } catch (err) {
      merken(false);
      status.textContent = meldung(err);
      knopf.disabled = false; knopf.classList.remove("is-busy");
    }
  });
}
