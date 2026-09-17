/* ═══════════════════════════════════════════════════════════
   Einfache Unterseiten (konto.html, datenschutz.html)

   Die Startseite hat main.js, die Akten char.js — beide bauen viel
   mehr auf, als diese Seiten brauchen. Hier nur das Gemeinsame:
   Sprache einsetzen, Handy-Menü, Countdown-Pille.
   ═══════════════════════════════════════════════════════════ */
(() => {
"use strict";

const L = window.L || (de => de);
if (window.I18N) I18N.anwenden();

const coarse = matchMedia("(hover: none), (pointer: coarse)").matches;
document.documentElement.classList.toggle("is-touch", coarse);

/* ── Handy-Menü ── */
const burger = document.getElementById("burger");
const menue = document.getElementById("mobileMenu");
if (burger && menue) {
  const schliessen = () => {
    menue.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", L("Menü öffnen", "Open menu"));
    document.body.classList.remove("is-locked");
  };
  burger.addEventListener("click", () => {
    if (burger.getAttribute("aria-expanded") === "true") return schliessen();
    menue.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", L("Menü schließen", "Close menu"));
    document.body.classList.add("is-locked");
  });
  menue.addEventListener("click", e => { if (e.target.closest("a, [data-lang]")) schliessen(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !menue.hidden) schliessen(); });
  const breit = matchMedia("(min-width: 1025px)");
  const beiBreit = e => { if (e.matches && !menue.hidden) schliessen(); };
  if (breit.addEventListener) breit.addEventListener("change", beiBreit);
}

/* ── Countdown-Pille ── */
if (typeof RELEASE !== "undefined") {
  const mini = document.getElementById("navMini");
  const miniMobil = document.getElementById("navMiniMobile");
  const tick = () => {
    const tage = Math.floor(Math.max(0, RELEASE - Date.now()) / 86400000);
    if (mini) mini.textContent = RELEASE - Date.now() <= 0 ? "OUT NOW" : tage + L(" Tage", " days");
    if (miniMobil) miniMobil.textContent = tage;
  };
  tick();
  setInterval(tick, 60000);
}

/* ── Verantwortlicher auf der Datenschutzseite ── */
const betreiber = (window.KONTO_CONFIG && KONTO_CONFIG.betreiber) || {};
document.querySelectorAll("[data-betreiber]").forEach(el => {
  const feld = el.getAttribute("data-betreiber");
  const wert = String(betreiber[feld] || "").trim();
  if (!wert) return;
  el.classList.remove("ds__offen");
  if (feld === "email") {
    const a = document.createElement("a");
    a.href = "mailto:" + wert;
    a.textContent = wert;
    el.replaceChildren(a);
  } else {
    el.textContent = wert;
  }
});
})();
