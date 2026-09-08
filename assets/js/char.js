/* ═══════════════════════════════════════════════════════════
   Charakter-Akten — eine durchgehende Seite

   Alle acht Figuren stehen untereinander: unten bei Jason geht es
   ohne Klick direkt in Lucias Hero über, danach Cal Hampton und so
   weiter bis Brian Heder.

   `charakter.html?c=lucia` springt beim Laden zur passenden Figur;
   beim Scrollen läuft die Adresse mit, damit sich jede Akte einzeln
   teilen lässt.

   Die Seite ist dadurch sehr lang (rund 55.000 px). Deshalb:
     · ein einziger Scroll-Motor für alle Bühnen statt 16 einzelner
     · weit entfernte Abschnitte werden pro Frame übersprungen
     · Videos laden erst in Reichweite, Bilder hängen an loading="lazy"
     · Navigation mit Kapitelliste und Fortschritt, sonst ist die
       Strecke nicht zu bewältigen
   ═══════════════════════════════════════════════════════════ */
(() => {
"use strict";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse  = matchMedia("(hover: none), (pointer: coarse)").matches;
document.documentElement.classList.toggle("is-touch", coarse);

const smooth = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const zwei = n => String(n).padStart(2, "0");

const root = $("#charRoot");
const reihe = (typeof CHARS !== "undefined" ? CHARS : []).filter(c => CHAR_PAGES[c.id]);

if (!reihe.length) {
  root.removeAttribute("aria-busy");
  root.innerHTML = `
    <section class="coutro" style="padding-top:34svh">
      <h1 class="coutro__h">Keine Akten vorhanden</h1>
      <div class="coutro__acts">
        <a class="btn btn--pink btn--lg" href="index.html">Zur Startseite</a>
      </div>
    </section>`;
  return;
}

/* Welche Figur ist gemeint? Unbekannte oder fehlende Angabe landet bei
   der ersten — die Seite enthält ohnehin alle. */
const params = new URLSearchParams(location.search);
const wunsch = (params.get("c") || "").toLowerCase();
const startIndex = Math.max(0, reihe.findIndex(c => c.id === wunsch));

/* ═══ 1 · AUFBAU ══════════════════════════════════════════ */

/* Alle Bilder der ganzen Seite in einer Liste — die Lightbox blättert
   dadurch über Figurengrenzen hinweg in der Reihenfolge der Seite. */
const lbList = [];
function shot(src, alt, cls) {
  const i = lbList.length;
  const url = "assets/img/" + src;
  lbList.push({ src: url, cap: alt });
  return `
    <figure class="cshot ${cls || ""} cin">
      <img src="${url}" alt="${esc(alt)}" loading="lazy" decoding="async">
      <button class="cshot__zoom" type="button" data-lb="${i}" aria-label="${esc(alt)} vergrößern">
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"
                stroke="currentColor" stroke-width="2" fill="none"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </figure>`;
}

function figurHTML(base, nr) {
  const page = CHAR_PAGES[base.id];
  const rechts = page.side === "right";
  const hatVideo = !!page.scrub;

  /* Jason und Lucia bekommen ihren scroll-gesteuerten Clip. Für die
     Nebenfiguren gibt es keinen: Rockstars Charakter-Loops sind
     1–1,5-Sekunden-Schnipsel, fürs Scrubben hochinterpoliert — im
     Vollbild sieht man das sofort. Dort steht das Artwork. */
  const medium = hatVideo
    ? `<video class="cv__video" data-scrub
              src="${page.scrub}" poster="${page.scrubPoster}"
              muted playsinline preload="none" disablepictureinpicture
              aria-label="Clip zu ${esc(base.name)}, läuft über die Scrollposition"></video>`
    : `<img class="cv__video" src="${page.heroImg}"
            alt="${esc(base.name)} — ${esc(base.sub)}" loading="lazy" decoding="async">`;

  return `
<article class="cfigur" id="c-${base.id}" data-figur="${base.id}" data-nr="${nr}"
         aria-labelledby="titel-${base.id}">

  <!-- Hero: Scroll-Video (Jason, Lucia) oder Artwork -->
  <section class="cv ${hatVideo ? "" : "cv--still"}" data-cv>
    <div class="cv__sticky">
      <div class="cv__frame" data-frame>${medium}</div>
      <div class="cv__vig" aria-hidden="true"></div>
      <div class="cv__title ${rechts ? "cv__title--right" : ""}" data-titel>
        <p class="cv__kicker">${esc(page.kicker)} &middot; ${zwei(nr)} / ${zwei(reihe.length)}</p>
        <h2 class="cv__name" id="titel-${base.id}">${base.display}</h2>
        <p class="cv__hint">
          <span>Scroll</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 4v14m0 0l-6-6m6 6l6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </p>
      </div>
      <div class="cv__out" aria-hidden="true"></div>
    </div>
  </section>

  <!-- Intro — fährt als Karte von unten über den Hero -->
  <section class="cintro rise-card ${rechts ? "cintro--right" : ""}" data-intro>
    <div class="cintro__copy">
      <p class="cintro__name cin">${base.display}</p>
      <p class="clead cin">${page.lead}</p>
      <div class="cbody cin">${page.intro.map(p => `<p>${p}</p>`).join("")}</div>
      <div class="cmeta cin">
        ${base.meta.map(([k, v]) => `<div><b>${esc(k)}</b><i>${esc(v)}</i></div>`).join("")}
      </div>
    </div>
    <div class="cintro__shots">
      ${page.introShots.map(([s, a], i) => shot(s, a, i === 0 ? "cshot--framed" : "")).join("")}
    </div>
  </section>

  <section class="cquote ${rechts ? "cquote--right" : ""}">
    <blockquote class="cin">&bdquo;${page.quote1}&ldquo;</blockquote>
  </section>

  <section class="cband ${rechts ? "cband--right" : ""}">
    ${rechts
      ? `<p class="cband__body cin">${page.band.body}</p><p class="cband__pink cin">${page.band.pink}</p>`
      : `<p class="cband__pink cin">${page.band.pink}</p><p class="cband__body cin">${page.band.body}</p>`}
    <div class="cband__shots">
      ${page.bandShots.map(([s, a]) => shot(s, a)).join("")}
    </div>
  </section>

  <!-- Vollbild über die volle Breite, ohne Zuschnitt und ohne Zoom -->
  <figure class="cfull">
    <img src="assets/img/${page.full}" alt="${esc(page.fullAlt)}" loading="lazy" decoding="async">
    <figcaption class="cfull__cap">${esc(page.fullCap)}</figcaption>
  </figure>

  <section class="cquote ${rechts ? "" : "cquote--right"}">
    <blockquote class="cin">${page.quote2}</blockquote>
  </section>

  <section class="cband ${rechts ? "" : "cband--right"}">
    ${rechts
      ? `<p class="cband__pink cin">${page.band2.pink}</p><p class="cband__body cin">${page.band2.body}</p>`
      : `<p class="cband__body cin">${page.band2.body}</p><p class="cband__pink cin">${page.band2.pink}</p>`}
  </section>

  <section class="cgal">
    <h3 class="cgal__head cin">Bilder &middot; ${esc(base.name)}</h3>
    <div class="cgal__grid">
      ${page.gallery.map(([s, a]) => shot(s, a)).join("")}
    </div>
  </section>

  <section class="coutro">
    <div class="coutro__shots">
      ${page.outro.map(([s, a]) => shot(s, a)).join("")}
    </div>
  </section>
</article>`;
}

/* Der Abschluss steht nur einmal ganz unten, hinter Brian Heder. */
const abschlussHTML = `
<section class="cende">
  <p class="cende__kicker cin">Alle ${zwei(reihe.length)} Akten gelesen</p>
  <h2 class="cende__h cin">Bis dahin<br>bleibt nur Warten.</h2>
  <div class="coutro__acts cin">
    <a class="btn btn--pink btn--lg" href="index.html#charaktere">
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Zurück zu den Charakteren
    </a>
    <a class="btn btn--ghost btn--lg" href="index.html">Zur Startseite</a>
    <button class="btn btn--ghost btn--lg" type="button" id="nachOben">
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 20V6m0 0l-6 6m6-6l6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Nach oben
    </button>
  </div>
</section>`;

root.innerHTML = reihe.map((c, i) => figurHTML(c, i + 1)).join("") + abschlussHTML;
root.removeAttribute("aria-busy");

const figuren = $$(".cfigur");

/* ═══ 2 · SCROLL-MOTOR ════════════════════════════════════ */
/* Eine einzige Schleife für alle Bühnen. Bei acht Figuren hingen sonst
   16 eigene scroll-Listener und 16 rAF-Schleifen an der Seite — auf dem
   Handy deutlich spürbar. Abschnitte weiter als zwei Bildschirmhöhen weg
   werden übersprungen und einmalig auf ihren Endwert gesetzt. */
const buehnen = [];

function fortschritt(el, r) {
  const range = el.offsetHeight - innerHeight;
  if (range <= 0) return 0;
  return clamp(-r.top / range, 0, 1);
}

function scrollStage(el, onUpdate, ease = 0.16) {
  const st = { el, onUpdate, ease, target: 0, current: 0, gesetzt: false };
  buehnen.push(st);
  const r = el.getBoundingClientRect();
  st.target = st.current = fortschritt(el, r);
  onUpdate(st.current, st.target);
  return () => { anstossen(); };
}

let rafId = null, letzterFrame = performance.now();

function frame() {
  letzterFrame = performance.now();
  const vh = innerHeight;
  let weiter = false;

  for (const st of buehnen) {
    const r = st.el.getBoundingClientRect();
    st.target = fortschritt(st.el, r);

    // Weit weg: nicht weich nachziehen, nur einmal auf Endwert setzen
    if (r.top > vh * 2 || r.bottom < -vh) {
      if (!st.gesetzt || st.current !== st.target) {
        st.current = st.target;
        st.onUpdate(st.current, st.target);
        st.gesetzt = true;
      }
      continue;
    }
    st.gesetzt = false;

    st.current += (st.target - st.current) * st.ease;
    if (Math.abs(st.target - st.current) < 0.0004) st.current = st.target;
    st.onUpdate(st.current, st.target);
    if (st.current !== st.target) weiter = true;
  }

  rafId = weiter ? requestAnimationFrame(frame) : null;
}

function anstossen() {
  if (rafId === null) rafId = requestAnimationFrame(frame);
  // Fallback, falls requestAnimationFrame gedrosselt ist
  if (performance.now() - letzterFrame > 260) frame();
}

addEventListener("scroll", anstossen, { passive: true });

/* Auf dem Handy blendet der Browser beim Scrollen die URL-Leiste aus.
   Das löst ein resize aus, obwohl sich am Layout nichts geändert hat —
   bei einer reinen Höhenänderung nur nachziehen statt hart setzen. */
let letzteB = innerWidth, letzteH = innerHeight;
addEventListener("resize", () => {
  const db = Math.abs(innerWidth - letzteB), dh = Math.abs(innerHeight - letzteH);
  letzteB = innerWidth; letzteH = innerHeight;
  if (!(coarse && db === 0 && dh < 200)) {
    for (const st of buehnen) st.current = st.target = fortschritt(st.el, st.el.getBoundingClientRect());
  }
  anstossen();
});

/* Wie weit ist die Karte darunter hochgefahren?
   0 = Oberkante am unteren Bildschirmrand, 1 = Karte füllt das Bild.

   Die Prüfung auf `innerHeight` ist kein Zierrat: ist das Fenster (noch)
   0 px hoch — etwa während die Seite in einem versteckten Tab aufgebaut
   wird —, käme sonst eine Division durch null heraus und `--card-bg: NaN`
   landete im CSS. Die Kartenfläche bliebe dann unsichtbar. */
function cardRise(card) {
  if (!card || !innerHeight) return 0;
  return clamp((innerHeight - card.getBoundingClientRect().top) / innerHeight, 0, 1);
}

/* ═══ 3 · HERO JE FIGUR ═══════════════════════════════════ */
/* Drei Dinge an derselben Scrollstrecke: der Name blendet aus, die
   Intro-Karte fährt darüber, der Hero geht auf die Grundfarbe. Bei Jason
   und Lucia läuft zusätzlich das Video über die Scrollposition. */
function heroAufsetzen(figur) {
  const sec = figur.querySelector("[data-cv]");
  const vid = figur.querySelector("[data-scrub]");
  const frameEl = figur.querySelector("[data-frame]");
  const titel = figur.querySelector("[data-titel]");
  const karte = figur.querySelector("[data-intro]");
  if (!sec) return;

  const titelUndKarte = p => {
    const raus = smooth(seg(p, 0.06, 0.42));
    if (titel) {
      titel.style.setProperty("--t-out", (1 - raus).toFixed(3));
      titel.style.setProperty("--t-y", (-raus * 40).toFixed(1) + "px");
    }
    const q = cardRise(karte);
    sec.style.setProperty("--s-out", smooth(clamp(q / 0.9, 0, 1)).toFixed(3));
    if (karte) karte.style.setProperty("--card-bg", smooth(clamp(q / 0.55, 0, 1)).toFixed(3));
  };

  if (reduced) {
    if (vid) { vid.loop = true; vid.muted = true; vid.play().catch(() => {}); }
    return;
  }

  if (!vid) {                       // Standbild: nur Titel und Karte
    scrollStage(sec, titelUndKarte);
    return;
  }

  const PLAY_END = 0.90;
  let dauer = 0, ziel = 0, ist = 0, spulRaf = null, schleife = false;
  let letzteSpur = performance.now();

  const wartAuf = (evt, ms) => new Promise(res => {
    let fertig = false;
    const fin = () => { if (!fertig) { fertig = true; res(); } };
    vid.addEventListener(evt, fin, { once: true });
    setTimeout(fin, ms);
  });

  const spulbar = () =>
    vid.seekable && vid.seekable.length > 0 &&
    vid.seekable.end(vid.seekable.length - 1) > 0.5;

  const alsSchleife = () => {
    if (schleife) return;
    schleife = true;
    vid.loop = true; vid.muted = true;
    vid.play().catch(() => {});
  };

  /* Android und iOS liefern für ein <video>, das nie abgespielt wurde,
     keine dekodierten Bilder: currentTime lässt sich setzen, die Fläche
     bleibt aber schwarz. Ein einmaliges stummes Anspielen weckt den
     Decoder — daran fehlte auf dem Handy die ganze Animation. */
  const weckeDecoder = async () => {
    if (vid.readyState >= 2) return;
    try {
      vid.muted = true;
      vid.playsInline = true;
      const p = vid.play();
      if (p && p.then) await p;
      vid.pause();
      vid.currentTime = 0;
    } catch (e) { /* dann greift der Schleifen-Rückfall */ }
    if (vid.readyState < 2) await wartAuf("loadeddata", 4000);
  };

  const spule = t => {
    if (schleife || !dauer) return;
    try { vid.currentTime = clamp(t, 0, dauer - 0.05); } catch (e) {}
  };

  const spurLauf = () => {
    letzteSpur = performance.now();
    ist += (ziel - ist) * 0.16;
    if (Math.abs(ziel - ist) > 0.012) {
      spule(ist);
      spulRaf = requestAnimationFrame(spurLauf);
    } else {
      ist = ziel; spule(ziel); spulRaf = null;
    }
  };

  const laden = async () => {
    const url = vid.getAttribute("src");
    if (!url || url.startsWith("blob:")) return;
    if (vid.preload !== "auto") { vid.preload = "auto"; vid.load(); }

    /* 1 · Direktquelle — beherrscht der Server Range-Requests, ist die
       Datei ohne Umweg spulbar (serve.py und GitHub Pages tun das). */
    if (vid.readyState < 1) await wartAuf("loadedmetadata", 6000);
    if (vid.duration && spulbar()) {
      dauer = vid.duration;
      await weckeDecoder();
      if (vid.readyState >= 2) { vid.removeAttribute("poster"); anstossen(); return; }
    }

    /* 2 · Blob-Umweg — ohne Range-Support meldet der Browser
       seekable = 0–0 und ignoriert currentTime stillschweigend.
       NICHT ENTFERNEN. */
    try {
      const blob = await (await fetch(url)).blob();
      vid.src = URL.createObjectURL(blob);
      vid.load();
      await wartAuf("loadeddata", 8000);
    } catch (e) { /* Direktquelle behalten */ }

    dauer = vid.duration || 0;
    await weckeDecoder();
    /* 3 · Ohne Bilder wäre die Fläche schwarz — dann lieber die Schleife. */
    if (!dauer || !spulbar() || vid.readyState < 2) alsSchleife();
    else vid.removeAttribute("poster");
    anstossen();
  };

  let ladenBegonnen = false;
  const ladeEinmal = () => {
    if (ladenBegonnen) return;
    ladenBegonnen = true;
    laden();
  };

  scrollStage(sec, (p, roh) => {
    if (p > 0) ladeEinmal();
    titelUndKarte(p);
    if (frameEl) frameEl.style.setProperty("--z", (1 + p * 0.07).toFixed(3));

    if (schleife) {
      const r = sec.getBoundingClientRect();
      const sichtbar = r.top < innerHeight && r.bottom > 0;
      if (sichtbar && vid.paused) vid.play().catch(() => {});
      else if (!sichtbar && !vid.paused) vid.pause();
      return;
    }

    ziel = clamp(roh / PLAY_END, 0, 1) * dauer;
    if (spulRaf === null) spulRaf = requestAnimationFrame(spurLauf);
    if (performance.now() - letzteSpur > 260) { ist = ziel; spule(ziel); }
  });

  /* Vorladen, sobald die Figur in Reichweite kommt — spart auf dem Handy
     rund 5 MB, solange man weiter oben unterwegs ist. */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      ladeEinmal();
    }, { rootMargin: "150% 0px 150% 0px" });
    io.observe(sec);
  } else {
    ladeEinmal();
  }
}

figuren.forEach(heroAufsetzen);

/* ═══ 4 · EINBLENDEN BEIM SCROLLEN ════════════════════════ */
(function reveals() {
  if (reduced) { $$(".cin").forEach(el => el.classList.add("is-in")); return; }

  const zeigen = el => { el.classList.add("is-in"); io.unobserve(el); };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      // Sichtbar geworden — oder beim schnellen Scrollen durchgelaufen
      if (e.isIntersecting || e.boundingClientRect.bottom < 0) zeigen(e.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.06 });

  $$(".cin").forEach(el => {
    const nachbarn = Array.from(el.parentElement.children).filter(c => c.classList.contains("cin"));
    el.style.setProperty("--d", (nachbarn.indexOf(el) % 4) * 70 + "ms");
    io.observe(el);
  });

  /* Sicherheitsnetz: läuft ein Element zwischen zwei Frames komplett durch
     das Bild, meldet der Observer nichts und der Absatz bliebe unsichtbar. */
  let offen = false;
  const nachziehen = () => {
    offen = false;
    const rest = $$(".cin:not(.is-in)");
    if (!rest.length) return removeEventListener("scroll", beiScroll);
    rest.forEach(el => { if (el.getBoundingClientRect().bottom < 0) zeigen(el); });
  };
  const beiScroll = () => {
    if (offen) return;
    offen = true;
    requestAnimationFrame(nachziehen);
  };
  addEventListener("scroll", beiScroll, { passive: true });
})();

/* ═══ 5 · LIGHTBOX ════════════════════════════════════════ */
(function lightbox() {
  const lb = $("#lightbox");
  const img = $("#lbImg"), cap = $("#lbCap");
  let idx = 0, vorherFokus = null;

  const zeichne = () => {
    const it = lbList[idx];
    img.src = it.src;
    img.alt = it.cap || "";
    cap.textContent = `${it.cap || ""}  ·  ${idx + 1} / ${lbList.length}`;
    const mehrere = lbList.length > 1;
    $("#lbPrev").hidden = !mehrere;
    $("#lbNext").hidden = !mehrere;
  };
  const oeffne = i => {
    vorherFokus = document.activeElement;
    idx = i; zeichne();
    lb.hidden = false;
    document.body.classList.add("is-locked");
    $("#lightbox .modal__close").focus();
  };
  const schliesse = () => {
    if (lb.hidden) return;
    lb.hidden = true;
    document.body.classList.remove("is-locked");
    if (vorherFokus && vorherFokus.focus) vorherFokus.focus();
  };
  const schritt = d => { idx = (idx + d + lbList.length) % lbList.length; zeichne(); };

  document.addEventListener("click", e => {
    const z = e.target.closest("[data-lb]");
    if (z) return oeffne(+z.dataset.lb);
    if (e.target.closest("[data-close]")) return schliesse();
    if (e.target === lb) schliesse();
  });
  $("#lbPrev").addEventListener("click", () => schritt(-1));
  $("#lbNext").addEventListener("click", () => schritt(1));
  addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") schliesse();
    if (e.key === "ArrowLeft") schritt(-1);
    if (e.key === "ArrowRight") schritt(1);
  });

  let x0 = null;
  lb.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 55) schritt(dx > 0 ? -1 : 1);
    x0 = null;
  }, { passive: true });
})();

/* ═══ 6 · NAVIGATION ══════════════════════════════════════ */
/* Die Seite ist rund 55.000 px lang. Ohne Kapitelliste und Fortschritt
   wüsste man nie, wo man ist und käme nur durch Scrollen weiter. */
(function nav() {
  const wo = $("#navWhere");
  const fortschrittEl = $("#navFortschritt");
  const menue = $("#mobileMenu");
  const burger = $("#burger");

  // Kapitelliste ins Menü
  const liste = menue && menue.querySelector("nav");
  if (liste) {
    liste.innerHTML =
      reihe.map((c, i) => `
        <a href="#c-${c.id}" data-kapitel="${c.id}">
          <span class="mm__nr">${zwei(i + 1)}</span>${esc(c.name)}
        </a>`).join("") +
      `<a class="mm__extra" href="index.html#charaktere">Zurück zur Übersicht</a>
       <a class="mm__extra" href="index.html">Startseite</a>`;
  }

  const schliesseMenue = () => {
    if (!menue || !burger) return;
    menue.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Menü öffnen");
    document.body.classList.remove("is-locked");
  };
  if (burger && menue) {
    burger.addEventListener("click", () => {
      if (burger.getAttribute("aria-expanded") === "true") return schliesseMenue();
      menue.hidden = false;
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Menü schließen");
      document.body.classList.add("is-locked");
    });
    menue.addEventListener("click", e => { if (e.target.closest("a")) schliesseMenue(); });
    addEventListener("keydown", e => { if (e.key === "Escape" && !menue.hidden) schliesseMenue(); });
  }

  /* Welche Figur ist gerade dran? Der Beobachter meldet den Wechsel,
     Name, Zähler und Adresse laufen mit. Die Adresse wird ersetzt, nicht
     angehängt — sonst wäre der Zurück-Knopf des Browsers nach einer
     langen Seite mit Dutzenden Einträgen unbrauchbar. */
  const setzeAktiv = figur => {
    const id = figur.dataset.figur;
    const nr = +figur.dataset.nr;
    const c = reihe.find(x => x.id === id);
    if (!c) return;
    if (wo) wo.textContent = c.name;
    if (fortschrittEl) fortschrittEl.textContent = `${zwei(nr)} / ${zwei(reihe.length)}`;
    document.title = c.name + " — Grand Theft Auto VI";
    if (liste) {
      $$("[data-kapitel]", liste).forEach(a =>
        a.classList.toggle("is-active", a.dataset.kapitel === id));
    }
    const neu = location.pathname + "?c=" + id;
    if (location.pathname + location.search !== neu) history.replaceState(null, "", neu);
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setzeAktiv(e.target); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    figuren.forEach(f => io.observe(f));
  }
  setzeAktiv(figuren[startIndex]);

  const obenKnopf = $("#nachOben");
  if (obenKnopf) obenKnopf.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  // Countdown-Pille im Menü
  const tage = $("#navMiniMobile");
  if (tage && typeof RELEASE !== "undefined") {
    const tick = () => { tage.textContent = Math.floor(Math.max(0, RELEASE - Date.now()) / 86400000); };
    tick();
    setInterval(tick, 60000);
  }
})();

/* ═══ 7 · EINSTIEG ════════════════════════════════════════ */
/* `?c=raul` soll direkt bei Raul landen, nicht oben bei Jason.

   Zwei Dinge stehen dem im Weg:

   1. Der Browser stellt beim Neuladen die vorherige Scrollposition wieder
      her — und zwar **nach** unserem Sprung, der damit wirkungslos wäre.
      `scrollRestoration = "manual"` schaltet das ab.
   2. Die Zielhöhe steht erst, wenn Schriften und Layout fertig sind. Ein
      einzelner Sprung landet sonst daneben, deshalb wird nachgesetzt,
      bis die Position stimmt.

   Ohne weiche Bewegung: bei 47.000 px liefe die minutenlang. */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

if (startIndex > 0) {
  const ziel = figuren[startIndex];
  const html = document.documentElement;
  const altesVerhalten = html.style.scrollBehavior;

  /* `scroll-behavior: smooth` steht in style.css auf <html>. Ohne dieses
     Aushebeln würde der Sprung als weiche Fahrt über zehntausende Pixel
     losrollen statt sofort zu sitzen. */
  html.style.scrollBehavior = "auto";

  /* Sobald der Nutzer selbst scrollt, wird nicht mehr nachgesetzt — sonst
     zöge die Seite ihn gegen seinen Willen zurück. */
  let nutzerScrollt = false;
  const merke = () => { nutzerScrollt = true; };
  addEventListener("wheel", merke, { passive: true, once: true });
  addEventListener("touchstart", merke, { passive: true, once: true });
  addEventListener("keydown", merke, { once: true });

  /* Nachgesetzt wird über Zeit statt über eine feste Anzahl Frames: die
     Zielhöhe verschiebt sich noch, während Schriften und die ersten Bilder
     ankommen. Bei sechs Figuren oberhalb summiert sich das — mit nur einem
     Durchgang landete der Sprung 169 px daneben.

     Deshalb drei Runden: sofort, nach `load` und wenn die Schriften stehen.
     Jede Runde läuft, bis sie nichts mehr zu korrigieren findet. */
  let bis = 0, laeuft = false;

  const aufraeumen = () => {
    laeuft = false;
    html.style.scrollBehavior = altesVerhalten;
  };

  const lauf = () => {
    if (nutzerScrollt) return aufraeumen();
    const abstand = ziel.getBoundingClientRect().top;
    if (Math.abs(abstand) > 2) {
      scrollTo(0, scrollY + abstand);
      anstossen();
    }
    if (performance.now() < bis) requestAnimationFrame(lauf);
    else aufraeumen();
  };

  const nachsetzen = ms => {
    if (nutzerScrollt) return;
    bis = performance.now() + ms;
    html.style.scrollBehavior = "auto";
    if (laeuft) return;          // laufende Runde verlängert sich nur
    laeuft = true;
    lauf();
  };

  nachsetzen(2500);
  addEventListener("load", () => nachsetzen(1200), { once: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => nachsetzen(1200));
  }
}

})();
