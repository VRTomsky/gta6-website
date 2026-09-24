/* ═══════════════════════════════════════════════════════════
   Admin-Seite (admin.html)

   Nur für Admins (Liste in rolle.js, dieselbe in firestore.rules).
   Alle anderen sehen „Kein Zugriff". Die Seite selbst ist kein Schutz —
   geschützt wird beim Schreiben durch die Firestore-Regeln.

   Einstellbar:
     Website   Hinweisbanner über jeder Seite (an/aus, Text DE und EN)
     Spiel     Belohnungsfaktor für Aufträge (1× bis 5×)
   Dazu ein Überblick über das Entwicklermenü im Spiel (F8) und die
   Bestenliste.

   Gespeichert wird in der Sammlung "einstellungen" (Dokumente "seite"
   und "spiel"); konto.js zeigt den Banner, spiel.js liest den Faktor.
   ═══════════════════════════════════════════════════════════ */

import { zustand, abonnieren, L, esc, dialogOeffnen, bannerAuffrischen } from "./konto.js";
import { istAdmin } from "./rolle.js";

const root = document.getElementById("adminRoot");
const TEXT_MAX = 200;

/* Nur neu aufbauen, wenn sich Person oder Rolle ändert — sonst würden
   halb getippte Texte bei jeder Kontomeldung verschwinden. */
let gezeichnet = "";

abonnieren(z => {
  const art = !z.geladen ? "laden"
    : !z.backend ? "aus"
    : !z.nutzer ? "abgemeldet"
    : !z.profil ? "laden"
    : istAdmin(z.profil) ? "admin:" + z.nutzer.uid
    : "gesperrt";
  if (art === gezeichnet) return;
  gezeichnet = art;
  if (art.startsWith("admin:")) return adminBauen(z);
  leer(art);
});

function leer(art) {
  if (art === "laden") {
    root.innerHTML = `<p class="kleer__laden">${L("Wird geladen …", "Loading …")}</p>`;
    return;
  }
  const texte = {
    aus: [L("Nicht verfügbar", "Not available"),
          L("Konten sind gerade nicht erreichbar. Später noch einmal versuchen.",
            "Accounts are not reachable right now. Please try again later.")],
    abgemeldet: [L("Nur für Admins", "Admins only"),
          L("Diese Seite ist für die Verwaltung von luciajason.de. Bitte mit dem Admin-Konto anmelden.",
            "This page is for running luciajason.de. Please sign in with the admin account.")],
    gesperrt: [L("Kein Zugriff", "No access"),
          L("Dieses Konto hat keine Admin-Rechte. Die Verwaltung ist nur für den Betreiber der Seite.",
            "This account has no admin rights. The admin area is for the site owner only.")]
  }[art];
  root.innerHTML = `
    <section class="kleer adm__leer">
      <p class="kicker adm__kicker">Admin</p>
      <h1 class="h-display">${texte[0]}</h1>
      <p class="kleer__t">${texte[1]}</p>
      <div class="kleer__knoepfe">
        ${art === "abgemeldet" ? `<button type="button" class="btn btn--pink btn--lg" data-adm="anmelden">${L("Anmelden", "Sign in")}</button>` : ""}
        <a class="btn btn--ghost btn--lg" href="index.html">${L("Zur Startseite", "Back to home")}</a>
      </div>
    </section>`;
}

root.addEventListener("click", e => {
  if (e.target.closest("[data-adm=anmelden]")) dialogOeffnen("anmelden");
});

/* ── Admin-Ansicht ─────────────────────────────────────────── */
async function adminBauen(z) {
  const b = z.backend;
  const name = esc(z.profil.username || "");
  root.innerHTML = `
    <header class="adm__kopf">
      <p class="kicker adm__kicker">Admin · Developer</p>
      <h1 class="h-display">${L("Steuerzentrale", "Control room")}</h1>
      <p class="adm__wer">${L("Angemeldet als", "Signed in as")} <b>${name}</b>
        <span class="kchip kchip--admin">Admin</span>
        ${b.modus === "demo" ? `<span class="kchip kchip--vorschau">Demo</span>` : ""}</p>
    </header>

    <div class="adm__raster">
      <section class="kbox adm__box" aria-labelledby="admSeiteH">
        <p class="kbox__k">Website</p>
        <h2 class="kbox__h" id="admSeiteH">${L("Hinweisbanner", "Notice banner")}</h2>
        <p class="kbox__t">${L(
          "Eine Zeile ganz oben auf jeder Seite — für Neuigkeiten, Wartung oder Aktionen im Spiel.",
          "One line at the very top of every page — for news, maintenance or in-game events.")}</p>
        <form class="kbox__form" id="admSeite" novalidate>
          <button type="button" class="kschalter" role="switch" aria-checked="false" id="admBannerAn">
            <span><b>${L("Banner anzeigen", "Show banner")}</b>
              <small>${L("Aus = niemand sieht ihn", "Off = nobody sees it")}</small></span>
            <span class="kschalter__bahn" aria-hidden="true"></span>
          </button>
          <label class="kf">
            <span class="kf__l">${L("Text Deutsch", "Text German")}</span>
            <textarea class="kf__i" id="admBannerDe" maxlength="${TEXT_MAX}" rows="2"></textarea>
            <span class="kzaehler" data-zaehler="admBannerDe"></span>
          </label>
          <label class="kf">
            <span class="kf__l">${L("Text Englisch", "Text English")}</span>
            <textarea class="kf__i" id="admBannerEn" maxlength="${TEXT_MAX}" rows="2"></textarea>
            <span class="kzaehler" data-zaehler="admBannerEn"></span>
          </label>
          <div class="adm__vorschau" id="admVorschau" hidden>
            <span class="adm__vl">${L("Vorschau", "Preview")}</span>
            <div class="seitenbanner" id="admVorschauText"></div>
          </div>
          <div class="kbox__zeile">
            <button type="submit" class="btn btn--red">${L("Speichern", "Save")}</button>
          </div>
          <p class="kbox__status" id="admSeiteStatus" role="status"></p>
        </form>
      </section>

      <section class="kbox adm__box" aria-labelledby="admSpielH">
        <p class="kbox__k">${L("Spiel", "Game")} · Vice City Run</p>
        <h2 class="kbox__h" id="admSpielH">${L("Belohnungen", "Rewards")}</h2>
        <p class="kbox__t">${L(
          "Faktor für das Geld aus Aufträgen — für alle Spieler, z. B. doppeltes Geld am Wochenende.",
          "Multiplier for mission money — for every player, e.g. double money at the weekend.")}</p>
        <form class="kbox__form" id="admSpiel" novalidate>
          <div class="adm__faktor" role="radiogroup" aria-label="${L("Belohnungsfaktor", "Reward multiplier")}">
            ${[1, 2, 3, 4, 5].map(n => `
              <label><input type="radio" name="faktor" value="${n}"${n === 1 ? " checked" : ""}>
                <span><b>${n}×</b><small>${n === 1 ? L("normal", "normal") : n === 2 ? L("doppelt", "double") : L("Aktion", "event")}</small></span></label>`).join("")}
          </div>
          <div class="kbox__zeile">
            <button type="submit" class="btn btn--red">${L("Speichern", "Save")}</button>
          </div>
          <p class="kbox__status" id="admSpielStatus" role="status"></p>
        </form>
      </section>

      <section class="kbox adm__box adm__box--dev" aria-labelledby="admDevH">
        <p class="kbox__k">Developer</p>
        <h2 class="kbox__h" id="admDevH">${L("Entwicklermenü im Spiel", "In-game developer menu")}</h2>
        <p class="kbox__t">${L(
          "Im Spiel mit <kbd>F8</kbd> öffnen — oder mit dem roten DEV-Knopf unten rechts. Nur mit diesem Konto sichtbar.",
          "Open it in the game with <kbd>F8</kbd> — or with the red DEV button bottom right. Only visible with this account.")}</p>
        <ul class="adm__liste">
          <li>${L("Geld setzen oder dazugeben", "Set or add money")}</li>
          <li>${L("Leben, Panzerung, Ausdauer unendlich", "Infinite health, armour, stamina")}</li>
          <li>${L("Alle Waffen oder einzelne, Munition voll", "All weapons or single ones, full ammo")}</li>
          <li>${L("Jedes Fahrzeug spawnen und direkt einsteigen", "Spawn any vehicle and get straight in")}</li>
          <li>${L("Fahndung 0–5 Sterne, Polizei aus", "Wanted level 0–5, police off")}</li>
          <li>${L("Tag und Nacht, Sprung zum Wegpunkt", "Day and night, jump to waypoint")}</li>
        </ul>
        <div class="kbox__zeile">
          <a class="btn btn--red" href="spiel.html">${L("Spiel öffnen", "Open game")}</a>
        </div>
      </section>

      <section class="kbox adm__box" aria-labelledby="admListeH">
        <p class="kbox__k">${L("Spiel", "Game")}</p>
        <h2 class="kbox__h" id="admListeH">${L("Bestenliste", "Leaderboard")}</h2>
        <ol class="adm__beste" id="admBeste"><li class="adm__leer">${L("Wird geladen …", "Loading …")}</li></ol>
      </section>
    </div>`;

  /* Gespeicherte Werte eintragen */
  const [seite, spiel, beste] = await Promise.all([
    b.einstellungLaden("seite"), b.einstellungLaden("spiel"),
    b.bestenliste ? b.bestenliste(10) : []
  ]);
  if (!root.querySelector("#admSeite")) return;           // inzwischen abgemeldet

  schalterSetzen(!!(seite && seite.bannerAn));
  root.querySelector("#admBannerDe").value = (seite && seite.bannerDe) || "";
  root.querySelector("#admBannerEn").value = (seite && seite.bannerEn) || "";
  const f = Math.max(1, Math.min(5, (spiel && spiel.geldFaktor) | 0 || 1));
  root.querySelector(`input[name=faktor][value="${f}"]`).checked = true;
  vorschau();

  const liste = root.querySelector("#admBeste");
  liste.innerHTML = (beste || []).length
    ? beste.map(e => `<li><span>${esc(e.name)}</span><b>${Math.round(e.punkte).toLocaleString(L("de-DE", "en-US"))}</b></li>`).join("")
    : `<li class="adm__leer">${L("Noch keine Einträge.", "No entries yet.")}</li>`;
}

function schalterSetzen(an) {
  const k = root.querySelector("#admBannerAn");
  if (k) k.setAttribute("aria-checked", an ? "true" : "false");
}

function vorschau() {
  const an = root.querySelector("#admBannerAn").getAttribute("aria-checked") === "true";
  const de = root.querySelector("#admBannerDe").value.trim();
  const en = root.querySelector("#admBannerEn").value.trim();
  const text = L(de || en, en || de);
  const box = root.querySelector("#admVorschau");
  box.hidden = !text;
  box.classList.toggle("is-aus", !an);
  root.querySelector("#admVorschauText").textContent = text;
  for (const z of root.querySelectorAll("[data-zaehler]")) {
    z.textContent = `${root.querySelector("#" + z.dataset.zaehler).value.length} / ${TEXT_MAX}`;
  }
}

root.addEventListener("input", e => { if (e.target.closest("#admSeite")) vorschau(); });
root.addEventListener("click", e => {
  const k = e.target.closest("#admBannerAn");
  if (!k) return;
  schalterSetzen(k.getAttribute("aria-checked") !== "true");
  vorschau();
});

function status(id, text, art) {
  const p = root.querySelector("#" + id);
  if (!p) return;
  p.textContent = text;
  p.classList.toggle("is-schlecht", art === "schlecht");
}

/* Schreiben scheitert, solange die neuen Firestore-Regeln nicht
   veröffentlicht sind — dann steht das hier auch so. */
const FEHLER = L("Speichern fehlgeschlagen — fehlen die neuen Firestore-Regeln?",
                 "Saving failed — are the new Firestore rules published?");

root.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const knopf = form.querySelector("[type=submit]");
  knopf.disabled = true;
  try {
    if (form.id === "admSeite") {
      const daten = {
        bannerAn: root.querySelector("#admBannerAn").getAttribute("aria-checked") === "true",
        bannerDe: root.querySelector("#admBannerDe").value.trim().slice(0, TEXT_MAX),
        bannerEn: root.querySelector("#admBannerEn").value.trim().slice(0, TEXT_MAX)
      };
      if (daten.bannerAn && !daten.bannerDe && !daten.bannerEn) {
        status("admSeiteStatus", L("Erst einen Text eingeben.", "Enter a text first."), "schlecht");
        return;
      }
      status("admSeiteStatus", L("Wird gespeichert …", "Saving …"));
      await zustand.backend.einstellungSetzen("seite", daten);
      await bannerAuffrischen();
      status("admSeiteStatus", daten.bannerAn
        ? L("Gespeichert — der Banner ist jetzt auf allen Seiten zu sehen.", "Saved — the banner now shows on every page.")
        : L("Gespeichert — der Banner ist aus.", "Saved — the banner is off."));
    }
    if (form.id === "admSpiel") {
      const n = parseInt((form.querySelector("input[name=faktor]:checked") || {}).value, 10) || 1;
      status("admSpielStatus", L("Wird gespeichert …", "Saving …"));
      await zustand.backend.einstellungSetzen("spiel", { geldFaktor: n });
      status("admSpielStatus", n === 1
        ? L("Gespeichert — normale Belohnungen.", "Saved — normal rewards.")
        : L(`Gespeichert — Aufträge zahlen ab dem nächsten Spielstart ${n}× so viel.`,
            `Saved — missions pay ${n}× from the next game start.`));
    }
  } catch (err) {
    console.warn("[Admin]", err);
    status(form.id === "admSeite" ? "admSeiteStatus" : "admSpielStatus", FEHLER, "schlecht");
  } finally {
    knopf.disabled = false;
  }
});
