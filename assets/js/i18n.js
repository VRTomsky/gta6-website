/* ═══════════════════════════════════════════════════════════
   Sprache: Deutsch (Standard) oder Englisch

   Steht im <head>, damit die Sprache feststeht, bevor irgendetwas
   gezeichnet wird. Welche Sprache gilt, entscheidet in dieser
   Reihenfolge:

     1. ?lang=en / ?lang=de in der Adresse — zum Verschicken, etwa
        luciajason.de/?lang=en für eine Bewerbung
     2. die zuletzt gewählte Sprache (localStorage)
     3. Deutsch

   Übersetzt wird auf zwei Wegen:

     · Statisches HTML trägt die englische Fassung direkt am Element:
         <p data-en="English text">Deutscher Text</p>
         <img alt="…" data-en-alt="…">
       `data-en` ersetzt den Inhalt (HTML erlaubt), `data-en-<attr>`
       das gleichnamige Attribut. Beide Sprachen stehen so nebeneinander
       und lassen sich zusammen pflegen.
     · Was per JavaScript entsteht, fragt `L("Deutsch", "English")`.
       Inhalte aus data.js überschreibt data.en.js.

   Ein Wechsel lädt die Seite neu. Alles, was main.js und char.js
   aufbauen, entsteht damit von selbst in der neuen Sprache, und die
   Scrollposition bleibt beim Neuladen erhalten.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var SCHLUESSEL = "lang";
  var html = document.documentElement;

  var ausAdresse = null;
  try { ausAdresse = new URLSearchParams(location.search).get("lang"); } catch (e) {}
  if (ausAdresse !== "en" && ausAdresse !== "de") ausAdresse = null;

  var gespeichert = null;
  try { gespeichert = localStorage.getItem(SCHLUESSEL); } catch (e) {}

  var lang = ausAdresse || (gespeichert === "en" ? "en" : "de");
  if (ausAdresse) { try { localStorage.setItem(SCHLUESSEL, ausAdresse); } catch (e) {} }

  html.lang = lang;

  /* Bis die englischen Texte eingesetzt sind, bleibt die Seite
     unsichtbar — sonst blitzt beim Laden kurz Deutsch auf. Fällt das
     Einsetzen aus irgendeinem Grund aus, gibt der Zeitgeber die Seite
     trotzdem frei. */
  if (lang === "en") {
    html.classList.add("i18n-warte");
    setTimeout(function () { html.classList.remove("i18n-warte"); }, 2500);
  }

  function L(de, en) {
    return lang === "en" && en != null ? en : de;
  }

  var ATTR_AUSWAHL = "[data-en],[data-en-aria-label],[data-en-alt],[data-en-title]," +
                     "[data-en-content],[data-en-placeholder],[data-en-data-yt-title]";

  function anwenden(wurzel) {
    wurzel = wurzel || document;
    if (lang === "en") {
      var liste = wurzel.querySelectorAll(ATTR_AUSWAHL);
      for (var i = 0; i < liste.length; i++) {
        var el = liste[i];
        var attrs = el.attributes;
        for (var j = 0; j < attrs.length; j++) {
          var name = attrs[j].name;
          if (name === "data-en") el.innerHTML = attrs[j].value;
          else if (name.indexOf("data-en-") === 0) el.setAttribute(name.slice(8), attrs[j].value);
        }
      }
    }
    schalterAbgleichen();
    html.classList.remove("i18n-warte");
  }

  function schalterAbgleichen() {
    var knoepfe = document.querySelectorAll("[data-lang]");
    for (var i = 0; i < knoepfe.length; i++) {
      knoepfe[i].setAttribute("aria-pressed", String(knoepfe[i].getAttribute("data-lang") === lang));
    }
  }

  function wechseln(neu) {
    if (neu !== "de" && neu !== "en") return;
    if (neu === lang) return;

    var speicherOk = true;
    try { localStorage.setItem(SCHLUESSEL, neu); } catch (e) { speicherOk = false; }

    /* Die Adresse bleibt sauber. Nur wenn sich die Wahl nicht speichern
       lässt (privates Fenster mit gesperrtem Speicher), trägt sie die
       Sprache als ?lang=en weiter. */
    var url = new URL(location.href);
    url.searchParams.delete("lang");
    if (!speicherOk && neu === "en") url.searchParams.set("lang", "en");
    if (url.href !== location.href) history.replaceState(history.state, "", url.href);

    html.classList.add("lang-wechsel");
    setTimeout(function () { location.reload(); }, 180);
  }

  document.addEventListener("click", function (e) {
    var knopf = e.target.closest && e.target.closest("[data-lang]");
    if (!knopf) return;
    e.preventDefault();
    wechseln(knopf.getAttribute("data-lang"));
  });

  window.LANG = lang;
  window.L = L;
  window.I18N = { lang: lang, L: L, anwenden: anwenden, wechseln: wechseln };
})();
