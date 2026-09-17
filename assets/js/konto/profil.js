/* ═══════════════════════════════════════════════════════════
   Kontoseite (konto.html)

   Vier Zustände:
     aus           kein Backend — Konten noch nicht freigeschaltet
     abgemeldet    Einladung zum Anmelden / Registrieren
     ohne-profil   angemeldet, aber noch kein Name gewählt
     angemeldet    Profilkopf + Bearbeiten, Newsletter, Sicherheit, Löschen

   Der Profilkopf zeigt Titelbild, Profilbild, Name und Beschreibung. Wer
   ein anderes Bild wählt, sieht es dort sofort — gespeichert wird erst
   mit „Speichern".

   Eigene Bilder gehen nicht verloren, wenn man zu einer Vorlage wechselt:
   Sie bleiben als eigene Kachel in der Auswahl stehen, bis man sie
   ausdrücklich entfernt.

   Die Seite wird nur neu aufgebaut, wenn sich der angemeldete Nutzer
   ändert. Speichert man das Profil, werden Kopf und Nav nachgezogen —
   halb ausgefüllte Felder bleiben dabei stehen.
   ═══════════════════════════════════════════════════════════ */

import {
  zustand, abonnieren, profilSetzen, L, LANG, esc, avatarUrl, titelUrl, meldung,
  datumMonat, VORLAGEN, TITEL_VORLAGEN, TITEL_STANDARD, NAME_MUSTER, BIO_MAX
} from "./konto.js";
import { zuschneiden } from "./zuschnitt.js";

const root = document.getElementById("kontoRoot");
const FIGUREN = (typeof CHARS !== "undefined" ? CHARS : []).map(c => ({ id: c.id, name: c.name }));
const STANDARD = { avatar: "preset:vi", titel: TITEL_STANDARD };

let gebautFuer = null;       // uid, für den die Seite gerade steht
let newsletterAn = false;

/* Bilder — `wahl` ist das, was gerade ausgewählt ist (auch ungespeichert),
   `eigen` die hochgeladenen Bilder, `quellen` die Originale dieses
   Besuchs, damit sich der Zuschnitt noch ändern lässt. */
let wahl = { ...STANDARD };
let eigen = { avatar: "", titel: "" };
let quellen = { avatar: null, titel: null };
let titelGespeichert = "";   // eigenes Titelbild, wie es in der Datenbank liegt
let titelGeladen = false;

abonnieren(zeichnen);

function zeichnen(z) {
  if (!z.backend) return leer("aus");
  if (!z.nutzer) return leer("abgemeldet");
  if (!z.profil) return leer("ohne-profil");

  if (gebautFuer !== z.nutzer.uid) {
    gebautFuer = z.nutzer.uid;
    seiteBauen(z);
  } else {
    kopfAuffrischen(z);
    sicherheitAuffrischen(z);
  }
}

/* ═══ Leere Zustände ══════════════════════════════════════ */
function leer(art) {
  gebautFuer = null;
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
        <li><b>${L("Dein Profil", "Your profile")}</b>${L("Benutzername, Beschreibung und ein Profilbild — eigenes Foto oder eine der Figuren.", "Username, bio and a profile picture — your own photo or one of the characters.")}</li>
        <li><b>Newsletter</b>${L("Neue Trailer, offizielle Ankündigungen und die Leak-Lage, gesammelt in dein Postfach.", "New trailers, official announcements and the leak situation, straight to your inbox.")}</li>
        <li><b>${L("Deine Daten", "Your data")}</b>${L("Kein Abo, keine Werbung. Abmelden und Konto löschen geht jederzeit selbst.", "No subscription, no ads. Unsubscribe or delete your account yourself at any time.")}</li>
      </ul>
      <div class="kleer__knoepfe">
        <button type="button" class="btn btn--pink btn--lg" data-konto-oeffnen="registrieren">${L("Konto erstellen", "Create account")}</button>
        <button type="button" class="btn btn--ghost btn--lg" data-konto-oeffnen="anmelden">${L("Anmelden", "Sign in")}</button>
      </div>
    </section>`;
}

/* ═══ Angemeldet ══════════════════════════════════════════ */
function seiteBauen(z) {
  const { nutzer, profil } = z;
  wahl = { avatar: profil.avatar || STANDARD.avatar, titel: profil.cover || STANDARD.titel };
  eigen = { avatar: profil.avatarEigen || "", titel: "" };
  quellen = { avatar: null, titel: null };
  titelGespeichert = "";
  titelGeladen = false;

  root.innerHTML = `
    <section class="khero">
      <div class="khero__bg" aria-hidden="true"><img data-k="titel" src="${esc(titelUrl(wahl.titel, ""))}" alt=""></div>
      <div class="khero__inner">
        <img class="khero__av" data-k="av" src="" alt="" width="164" height="164">
        <div class="khero__txt">
          <p class="kicker" data-k="seit"></p>
          <h1 class="h-display khero__name" data-k="name"></h1>
          <p class="khero__bio" data-k="bio"></p>
          <div class="khero__chips" data-k="chips"></div>
        </div>
      </div>
    </section>

    <div class="kgrid">
      <section class="kbox" aria-labelledby="kProfilH">
        <p class="kbox__k">${L("Profil", "Profile")}</p>
        <h2 class="kbox__h" id="kProfilH">${L("Profil bearbeiten", "Edit profile")}</h2>
        <form class="kbox__form" id="kProfilForm" novalidate>
          <fieldset class="kbild">
            <legend class="kf__l">${L("Titelbild", "Cover image")}</legend>
            <p class="kf__h kbild__hinweis">${L("Oben im Profilkopf siehst du sofort, wie es aussieht.", "The header above shows right away how it looks.")}</p>
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

          <label class="kf">
            <span class="kf__l">${L("Lieblingsfigur", "Favorite character")}</span>
            <select class="kf__i" name="favChar">
              <option value="">${L("Keine Angabe", "No preference")}</option>
              ${FIGUREN.map(f => `<option value="${f.id}"${profil.favChar === f.id ? " selected" : ""}>${esc(f.name)}</option>`).join("")}
            </select>
          </label>

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

  /* Das eigene Titelbild liegt getrennt und kommt nach */
  const uid = nutzer.uid;
  zustand.backend.titelbildLaden(uid).then(daten => {
    if (gebautFuer !== uid) return;
    eigen.titel = daten || "";
    titelGespeichert = eigen.titel;
    titelGeladen = true;
    if (wahl.titel === "eigen" && !eigen.titel) wahl.titel = STANDARD.titel;
    bildAuswahlZeichnen("titel");
    kopfAuffrischen(zustand);
  }).catch(() => {
    if (gebautFuer !== uid) return;
    bildAuswahlZeichnen("titel");
  });
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
  const titel = titelUrl(wahl.titel, eigen.titel);
  if (q("titel").getAttribute("src") !== titel) q("titel").src = titel;
  q("name").textContent = profil.username;
  q("bio").textContent = profil.bio || "";
  q("seit").textContent = profil.createdAt
    ? L("Mitglied seit ", "Member since ") + datumMonat(profil.createdAt)
    : L("Mitglied", "Member");

  const chips = [];
  if (ungespeichert()) chips.push(`<span class="kchip kchip--vorschau">${L("Vorschau · noch nicht gespeichert", "Preview · not saved yet")}</span>`);
  const fig = FIGUREN.find(f => f.id === profil.favChar);
  if (fig) chips.push(`<span class="kchip"><img src="assets/img/avatars/${fig.id}.jpg" alt="">${L("Lieblingsfigur", "Favorite")}: ${esc(fig.name)}</span>`);
  if (newsletterAn) chips.push(`<span class="kchip kchip--pink">${L("Newsletter aktiv", "Newsletter on")}</span>`);
  if (!nutzer.emailVerified) chips.push(`<span class="kchip kchip--warn">${L("E-Mail nicht bestätigt", "Email not confirmed")}</span>`);
  q("chips").innerHTML = chips.join("");

  const status = document.getElementById("kProfilStatus");
  if (status && ungespeichert() && !status.textContent) {
    status.textContent = L("Änderungen noch nicht gespeichert.", "Changes not saved yet.");
    status.classList.add("is-hinweis");
  }
}

/* ── Bildauswahl (Titelbild und Profilbild) ── */
function bildAuswahlZeichnen(art) {
  const raster = root.querySelector(`[data-raster="${art}"]`);
  const aktionen = root.querySelector(`[data-aktionen="${art}"]`);
  if (!raster) return;
  const istTitel = art === "titel";
  const vorlagen = istTitel ? TITEL_VORLAGEN : VORLAGEN;
  const klasse = istTitel ? "tb-wahl" : "av-wahl";
  const url = istTitel ? (id => `assets/img/covers/${id}.jpg`) : (id => `assets/img/avatars/${id}.jpg`);

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
      lang: LANG
    };
    const titelNeu = titelGeladen && eigen.titel !== titelGespeichert;
    if (titelNeu) daten.coverEigen = eigen.titel;
    const knopf = form.querySelector("[type=submit]");
    knopf.disabled = true; knopf.classList.add("is-busy");
    statusSetzen("");
    try {
      await zustand.backend.profilSpeichern(zustand.nutzer.uid, daten, zustand.profil);
      if (titelNeu) titelGespeichert = eigen.titel;
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
      kopfAuffrischen(zustand);
    }
  });

  zustand.backend.newsletterStatus(zustand.nutzer.uid).then(an => {
    newsletterAn = an;
    newsletterZeichnen();
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
