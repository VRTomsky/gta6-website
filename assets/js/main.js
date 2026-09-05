/* ═══════════════════════════════════════════════════════════
   GTA VI Hype-Seite — Interaktion
   ═══════════════════════════════════════════════════════════ */
(() => {
"use strict";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad2 = n => String(n).padStart(2, "0");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Touch-Geräte verhalten sich an vier Stellen grundsätzlich anders:
   es gibt keinen Hover, der Browser blendet beim Scrollen die URL-Leiste
   ein und aus (was ein resize auslöst), das Mobilfunknetz ist teuer, und
   es lassen sich nur eine Handvoll Videos gleichzeitig dekodieren.
   Die Klasse am <html> macht das zusätzlich für CSS greifbar. */
const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
document.documentElement.classList.toggle("is-touch", coarse);

/* ═══ 1 · COUNTDOWN ═══════════════════════════════════════ */
(function countdown() {
  const box = $("#countdown");
  if (!box) return;
  const out = {
    d: box.querySelector('[data-cd="d"]'),
    h: box.querySelector('[data-cd="h"]'),
    m: box.querySelector('[data-cd="m"]'),
    s: box.querySelector('[data-cd="s"]')
  };
  const mini = $("#navMini");
  const miniMobile = $("#navMiniMobile");
  const finale = $("#finaleDays");
  const note = $("#cdNote");

  function tick() {
    const diff = RELEASE - Date.now();
    if (diff <= 0) {
      out.d.textContent = out.h.textContent = out.m.textContent = out.s.textContent = "00";
      if (note) note.innerHTML = "<strong>Es ist so weit.</strong> Grand Theft Auto VI ist da.";
      if (mini) mini.textContent = "OUT NOW";
      if (miniMobile) miniMobile.textContent = "0";
      if (finale) finale.textContent = "0";
      clearInterval(timer);
      return;
    }
    const sec = Math.floor(diff / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    out.d.textContent = d;
    out.h.textContent = pad2(h);
    out.m.textContent = pad2(m);
    out.s.textContent = pad2(s);
    if (mini) mini.textContent = d + " Tage";
    if (miniMobile) miniMobile.textContent = d;
    if (finale) finale.textContent = d;
  }
  tick();
  const timer = setInterval(tick, 1000);
})();

/* ═══ 2 · REVEAL ON SCROLL ════════════════════════════════ */
const revealIO = reduced ? null : new IntersectionObserver((entries) => {
  entries.forEach(e => {
    // Sichtbar geworden — oder beim schnellen Scrollen schon nach oben
    // durchgelaufen. Im zweiten Fall sofort zeigen statt unsichtbar lassen.
    if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
      e.target.classList.add("is-in");
      revealIO.unobserve(e.target);
    }
  });
}, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

function watchReveals(root = document) {
  if (!revealIO) return;
  $$(".reveal:not(.is-in)", root).forEach((el, i) => {
    if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", (i % 6) * 70 + "ms");
    revealIO.observe(el);
  });
}

/* Sicherheitsnetz zum Observer. Läuft ein Element zwischen zwei Frames
   komplett durch das Bild — kräftiger Mausrad-Schwung, Wisch auf dem
   Handy —, meldet der Observer dafür gar nichts und der Block bliebe
   dauerhaft auf Deckkraft 0 stehen. Was oben aus dem Bild heraus ist und
   noch nicht eingeblendet wurde, wird deshalb pro Frame nachgezogen. */
if (revealIO) {
  let pending = false;
  addEventListener("scroll", () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      $$(".reveal:not(.is-in)").forEach(el => {
        if (el.getBoundingClientRect().bottom < 0) {
          el.classList.add("is-in");
          revealIO.unobserve(el);
        }
      });
    });
  }, { passive: true });
}

/* ═══ 3 · NAV ═════════════════════════════════════════════ */
(function nav() {
  const burger = $("#burger");
  const menu = $("#mobileMenu");

  // Mobile-Menü
  const closeMenu = () => {
    menu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Menü öffnen");
    document.body.classList.remove("is-locked");
  };
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    if (open) return closeMenu();
    menu.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Menü schließen");
    document.body.classList.add("is-locked");
  });
  menu.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) closeMenu(); });

  /* Dreht man das Handy quer und die Seite fällt zurück auf die
     Desktop-Navigation, verschwindet der Burger — ein offenes Menü bliebe
     sonst über der Seite stehen, ohne dass man es schließen könnte. */
  const wide = matchMedia("(min-width: 1025px)");
  const onWide = e => { if (e.matches && !menu.hidden) closeMenu(); };
  if (wide.addEventListener) wide.addEventListener("change", onWide);
  else wide.addListener(onWide);

  // Aktiver Abschnitt
  const links = $$(".nav__links a");
  const map = new Map();
  links.forEach(a => {
    const el = document.querySelector(a.getAttribute("href"));
    if (el) map.set(el, a);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const a = map.get(e.target);
      if (!a) return;
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove("is-active"));
        a.classList.add("is-active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  map.forEach((_, el) => io.observe(el));
})();

/* ═══ 3b · SCROLL-MOTOR ═════════════════════════ */
/* Liest die Scrollposition eines Abschnitts einmal pro Frame und zieht den
   Wert weich nach. Ohne das springen die Werte im Takt der Mausrad-Schritte,
   was beim langsamen Scrollen als Haken sichtbar wird. */
const smooth = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

function scrollStage(el, onUpdate, ease = 0.16) {
  let target = 0, current = 0, rafId = null;
  let lastFrame = performance.now();

  const read = () => {
    const range = el.offsetHeight - innerHeight;
    if (range <= 0) return 0;
    return clamp(-el.getBoundingClientRect().top / range, 0, 1);
  };

  const frame = () => {
    lastFrame = performance.now();
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.0004) current = target;
    onUpdate(current, target);
    if (current !== target) rafId = requestAnimationFrame(frame);
    else rafId = null;
  };

  const kick = () => {
    target = read();
    if (rafId === null) rafId = requestAnimationFrame(frame);
    // Fallback, falls requestAnimationFrame gedrosselt ist
    if (performance.now() - lastFrame > 260) { current = target; onUpdate(current, target); }
  };

  addEventListener("scroll", kick, { passive: true });

  /* Auf dem Handy blendet der Browser beim Scrollen die URL-Leiste aus und
     wieder ein. Das löst ein resize aus, obwohl sich am Layout nichts
     geändert hat. Würde man dabei — wie am Desktop — Ist- und Sollwert hart
     gleichsetzen, springt die Sequenz bei jedem Richtungswechsel sichtbar.
     Bei einer reinen Höhenänderung wird deshalb nur das Ziel nachgezogen
     und die Differenz vom weichen Lauf geschluckt. */
  let lastW = innerWidth, lastH = innerHeight;
  addEventListener("resize", () => {
    const dw = Math.abs(innerWidth - lastW);
    const dh = Math.abs(innerHeight - lastH);
    lastW = innerWidth; lastH = innerHeight;
    if (coarse && dw === 0 && dh < 200) { kick(); return; }
    target = current = read();
    onUpdate(current, target);
  });

  target = current = read();
  onUpdate(current, target);
  return kick;
}

/* Wie weit ist die nachfolgende Karte hochgefahren?
   0 = Oberkante am unteren Bildschirmrand, 1 = Karte füllt das Bild. */
function cardRise(card) {
  if (!card) return 0;
  return clamp((innerHeight - card.getBoundingClientRect().top) / innerHeight, 0, 1);
}

/* ═══ 3c · HERO: GESTAFFELTES AUSBLENDEN ═══════════ */
/* Erst Textblock, dann Logo, dann dunkelt der Hero auf die Grundfarbe ab,
   während die Trailer-Karte von unten hochfährt. */
(function heroSequence() {
  const hero = $("#home");
  const img = $("#heroImg");
  const card = $("#trailer");
  if (!hero || reduced) return;

  scrollStage(hero, p => {
    const bodyOut  = smooth(seg(p, 0.04, 0.36));   // Text, Countdown, Buttons
    const logoLate = smooth(seg(p, 0.38, 0.66));   // danach das Logo
    const logoOut  = 0.32 * bodyOut + 0.68 * logoLate;

    hero.style.setProperty("--h-body", (1 - bodyOut).toFixed(3));
    hero.style.setProperty("--h-body-y", (-bodyOut * 46).toFixed(1) + "px");
    hero.style.setProperty("--h-logo", (1 - logoOut).toFixed(3));
    hero.style.setProperty("--h-logo-s", (1 + logoLate * 0.10).toFixed(3));
    if (img) img.style.transform = `scale(${(1.06 + p * 0.10).toFixed(3)}) translate3d(0,0,0)`;

    // Hintergrund geht auf die Grundfarbe über, sobald die Karte kommt
    const q = cardRise(card);
    hero.style.setProperty("--h-out", smooth(clamp(q / 0.85, 0, 1)).toFixed(3));
    if (card) card.style.setProperty("--card-bg", smooth(clamp(q / 0.55, 0, 1)).toFixed(3));
  });
})();

/* ═══ 4 · SCROLL-VIDEOS ════════════════════════ */
/* Jeder .scrub-Abschnitt blendet sein Video hinter dem vorherigen Abschnitt
   auf, spielt es über die Scrollposition ab und übergibt an die Karte, die
   schon ab rund drei Vierteln des Clips von unten hochfährt. */
(function scrubVideos() {
  const FADE_IN  = 0.22;  // bis hierhin ist das Video voll sichtbar
  const PLAY_END = 0.90;  // bis hierhin läuft der Clip — er wird nicht vorher gestoppt

  $$(".scrub").forEach(sec => {
    const vid = sec.querySelector(".scrub__video");
    const frame = sec.querySelector(".scrub__frame");
    const card = sec.nextElementSibling && sec.nextElementSibling.classList.contains("rise-card")
      ? sec.nextElementSibling : null;
    if (!vid) return;

    let duration = 0, target = 0, current = 0, rafId = null;
    let looping = false;   // Rückfallebene, wenn sich der Clip nicht spulen lässt
    let lastFrame = performance.now();

    const waitFor = (evt, ms) => new Promise(res => {
      let done = false;
      const fin = () => { if (!done) { done = true; res(); } };
      vid.addEventListener(evt, fin, { once: true });
      setTimeout(fin, ms);
    });

    /* Meldet der Browser eine brauchbare Spulweite? */
    const canSeek = () =>
      vid.seekable && vid.seekable.length > 0 &&
      vid.seekable.end(vid.seekable.length - 1) > 0.5;

    /* Letzte Rückfallebene: lässt sich der Clip partout nicht spulen, läuft
       er stattdessen stumm in der Schleife. Sieht beim Vorbeiscrollen fast
       gleich aus und ist allemal besser als ein eingefrorenes Standbild. */
    const fallBackToLoop = () => {
      if (looping) return;
      looping = true;
      vid.loop = true;
      vid.muted = true;
      vid.play().catch(() => {});
    };

    const load = async () => {
      const url = vid.getAttribute("src");
      if (!url || url.startsWith("blob:")) return;

      /* Schritt 1 — Direktquelle prüfen.
         Beherrscht der Server Range-Requests (206 Partial Content, siehe
         serve.py), meldet der Browser seekable: 0–<dauer> und die Datei ist
         ohne Umweg spulbar. Auf dem Handy spart das den vollständigen
         Download in den Arbeitsspeicher. */
      if (vid.readyState < 1) await waitFor("loadedmetadata", 6000);
      if (vid.duration && canSeek()) {
        duration = vid.duration;
        vid.removeAttribute("poster");
        kick();
        return;
      }

      /* Schritt 2 — Blob-Umweg.
         Ohne Range-Support meldet der Browser seekable = 0–0; das Setzen von
         currentTime wird dann stillschweigend ignoriert und das Video bleibt
         auf dem ersten Bild stehen. buffered meldet dabei trotzdem die volle
         Länge. Als blob:-URL ist die Datei immer voll spulbar.
         NICHT ENTFERNEN. */
      try {
        const blob = await (await fetch(url)).blob();
        vid.src = URL.createObjectURL(blob);
        vid.load();
        await waitFor("loadeddata", 8000);
      } catch (e) { /* Direktquelle behalten */ }

      duration = vid.duration || 0;
      vid.removeAttribute("poster");
      if (!duration || !canSeek()) fallBackToLoop();
      kick();
    };

    const seek = t => {
      if (looping || !duration) return;
      try { vid.currentTime = clamp(t, 0, duration - 0.05); } catch (e) {}
    };

    const loop = () => {
      lastFrame = performance.now();
      current += (target - current) * 0.16;
      if (Math.abs(target - current) > 0.012) {
        seek(current);
        rafId = requestAnimationFrame(loop);
      } else {
        current = target;
        seek(target);
        rafId = null;
      }
    };

    if (reduced) { sec.style.setProperty("--v-in", "1"); return; }

    const kick = scrollStage(sec, (p, raw) => {
      // Video taucht hinter dem vorherigen Abschnitt auf …
      sec.style.setProperty("--v-in", smooth(clamp(p / FADE_IN, 0, 1)).toFixed(3));
      // … und läuft von Anfang an mit. Die Rohposition steuert das Video,
      // damit es dem Finger direkt folgt.
      const vp = clamp(raw / PLAY_END, 0, 1);
      target = vp * duration;
      if (frame) frame.style.setProperty("--z", (1 + vp * 0.06).toFixed(3));

      // Karte fährt hoch, das Video geht dahinter auf die Grundfarbe über
      const q = cardRise(card);
      sec.style.setProperty("--s-out", smooth(clamp(q / 0.9, 0, 1)).toFixed(3));
      if (card) card.style.setProperty("--card-bg", smooth(clamp(q / 0.55, 0, 1)).toFixed(3));

      if (looping) {
        // Im Loop-Modus wird nicht gespult — nur außerhalb des Bilds gestoppt
        const r = sec.getBoundingClientRect();
        const onScreen = r.top < innerHeight && r.bottom > 0;
        if (onScreen && vid.paused) vid.play().catch(() => {});
        else if (!onScreen && !vid.paused) vid.pause();
        return;
      }

      if (rafId === null) rafId = requestAnimationFrame(loop);
      if (performance.now() - lastFrame > 260) { current = target; seek(target); }
    });

    /* Auf dem Handy erst laden, wenn der Abschnitt in die Nähe kommt. Sonst
       gehen beim Seitenaufruf rund 5 MB Video ins Netz, bevor der Hero
       überhaupt zu Ende gescrollt ist. */
    if (coarse && "IntersectionObserver" in window) {
      vid.preload = "metadata";
      const io = new IntersectionObserver(entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        io.disconnect();
        load();
      }, { rootMargin: "120% 0px 120% 0px" });
      io.observe(sec);
    } else {
      load();
    }
  });
})();

/* ═══ 5 · PARALLAX ════════════════════════════════════════ */
(function parallax() {
  if (reduced) return;
  const items = $$("[data-parallax]");
  let ticking = false;

  const run = () => {
    ticking = false;
    items.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const rel = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.transform = `translate3d(0, ${(-rel * (parseFloat(el.dataset.parallax) || .1) * 100).toFixed(1)}px, 0)`;
    });
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  run();
})();

/* ═══ 6 · CHARAKTERE ══════════════════════════════════════ */
(function characters() {
  const cast = $("#cast");
  const supporting = CHARS.filter(c => !["jason", "lucia"].includes(c.id));

  /* Echte Links statt role="button": damit funktionieren Mittelklick,
     Strg+Klick und das Kontextmenü von selbst, und die Tastatur-
     bedienung kommt ohne eigenen Keydown-Handler aus. */
  cast.innerHTML = supporting.map(c => `
    <a class="ccard reveal" href="charakter.html?c=${c.id}" target="_blank" rel="noopener"
       aria-label="Akte ${c.name} öffnen (neuer Tab)">
      <img src="${c.poster}" alt="${c.name}" loading="lazy">
      <video src="${c.video}" muted loop playsinline preload="none" aria-hidden="true"></video>
      <span class="ccard__ring" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="15" height="15"><path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <div class="ccard__txt">
        <h3>${c.name}</h3>
        <span>${c.sub}</span>
      </div>
    </a>`).join("");

  // Hover-/Fokus-Loops (auch auf den beiden großen Karten)
  const bindLoop = (card, video) => {
    if (!video) return;
    const play = () => {
      if (reduced) return;
      if (video.preload === "none") video.preload = "auto";
      card.classList.add("is-playing");
      video.play().catch(() => {});
    };
    const stop = () => { card.classList.remove("is-playing"); video.pause(); };
    card.addEventListener("mouseenter", play);
    card.addEventListener("focusin", play);
    card.addEventListener("mouseleave", stop);
    card.addEventListener("focusout", stop);
  };
  $$(".ccard").forEach(c => bindLoop(c, c.querySelector("video")));
  // Jason und Lucia verhalten sich wie die übrigen Karten: erst beim Hover
  $$(".duo__card").forEach(c => bindLoop(c, c.querySelector(".duo__vid")));

  /* Auf Touch gibt es keinen Hover — die Karten blieben sonst Standbilder.
     Der Loop startet dort, sobald eine Karte weit genug im Bild steht, und
     hört auf, wenn sie es wieder verlässt. Mehr als zwei gleichzeitig sind
     nicht drin: Android-Geräte halten nur eine Handvoll Video-Dekoder
     bereit, danach bleibt das nächste Video schwarz. */
  if (coarse && !reduced && "IntersectionObserver" in window) {
    const MAX = 2;
    const playing = new Set();

    const stopCard = card => {
      const v = card.querySelector("video");
      card.classList.remove("is-playing");
      if (v) v.pause();
      playing.delete(card);
    };

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const card = e.target;
        const v = card.querySelector("video");
        if (!v) return;
        if (e.intersectionRatio >= 0.62) {
          if (playing.has(card)) return;
          if (playing.size >= MAX) stopCard(playing.values().next().value);
          if (v.preload === "none") v.preload = "auto";
          playing.add(card);
          card.classList.add("is-playing");
          v.play().catch(() => stopCard(card));
        } else if (e.intersectionRatio < 0.35) {
          stopCard(card);
        }
      });
    }, { threshold: [0, 0.35, 0.62, 0.9] });

    $$(".ccard, .duo__card").forEach(c => io.observe(c));
  }

  watchReveals(cast);
})();
/* Die Charakter-Akte ist seit dem Umbau eine eigene Seite:
   charakter.html?c=<id>, siehe assets/js/char.js. Das frühere
   Modal an dieser Stelle ist damit entfallen. */

/* ═══ 7 · ORTE ════════════════════════════════════════════ */
(function places() {
  const tabs = $("#placeTabs");
  const stage = $("#placeStage");

  tabs.innerHTML = PLACES.map((p, i) => `
    <button class="ptab" role="tab" id="tab-${p.id}" aria-controls="pane-${p.id}"
            aria-selected="${i === 0}" data-place="${p.id}">${p.name}</button>`).join("");

  function render(id) {
    const p = PLACES.find(x => x.id === id);
    stage.innerHTML = `
      <div class="pane" id="pane-${p.id}" role="tabpanel" aria-labelledby="tab-${p.id}">
        <div class="pane__hero">
          <span class="pane__badge">${p.badge}</span>
          <img src="${p.hero}" alt="${p.name}" loading="lazy">
        </div>
        <div class="pane__info">
          <h3>${p.name}</h3>
          <p class="pane__sub">${p.sub}</p>
          <p>${p.text}</p>
          <div class="pane__thumbs">
            ${p.shots.slice(0, 6).map((s, i) => `<button type="button" data-i="${i}" aria-label="${p.name} Bild ${i + 1} vergrößern">
              <img src="assets/img/${s}" alt="${p.name} — Bild ${i + 1}" loading="lazy"></button>`).join("")}
          </div>
        </div>
      </div>`;
    const list = p.shots.map((s, i) => ({ src: "assets/img/" + s, cap: p.name + " · " + String(i + 1).padStart(2, "0") }));
    stage.querySelectorAll("[data-i]").forEach(b =>
      b.addEventListener("click", () => openLightbox(list, +b.dataset.i))
    );
  }

  tabs.addEventListener("click", e => {
    const b = e.target.closest("[data-place]");
    if (!b) return;
    $$(".ptab", tabs).forEach(t => t.setAttribute("aria-selected", String(t === b)));
    render(b.dataset.place);
  });
  tabs.addEventListener("keydown", e => {
    const list = $$(".ptab", tabs);
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    let n = null;
    if (e.key === "ArrowRight") n = (i + 1) % list.length;
    if (e.key === "ArrowLeft")  n = (i - 1 + list.length) % list.length;
    if (n === null) return;
    e.preventDefault();
    list[n].focus(); list[n].click();
  });

  render(PLACES[0].id);
})();

/* ═══ 8 · ULTIMATE EDITION ════════════════════════════════ */
(function ultimate() {
  const grid = $("#ueGrid");
  grid.innerHTML = ULTIMATE.map((u, i) => `
    <button class="ue-item reveal" type="button" data-i="${i}" aria-label="${u.t} vergrößern">
      <img src="assets/img/${u.img}" alt="${u.t}" loading="lazy">
      <span class="ue-item__t"><b>${u.t}</b><span>${u.s}</span></span>
    </button>`).join("");

  const list = ULTIMATE.map(u => ({ src: "assets/img/" + u.img, cap: u.t + " · " + u.s }));
  grid.querySelectorAll("[data-i]").forEach(b =>
    b.addEventListener("click", () => openLightbox(list, +b.dataset.i))
  );
  watchReveals(grid);

  // Vintage-Pack-Thumbs ebenfalls klickbar
  const vv = $$(".vvcp__thumbs img");
  const vvList = vv.map(i => ({ src: i.getAttribute("src"), cap: i.alt }));
  vv.forEach((img, i) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => openLightbox(vvList, i));
  });

  /* 3D-Hülle */
  const wrap = $("#caseWrap");
  const box = $("#case3d");
  if (!wrap || !box || reduced) return;

  box.classList.add("is-idle");
  let idleTimer = null, dragging = false, lastX = 0, ry = -26, rx = -8;

  const apply = () => {
    box.style.setProperty("--ry", ry.toFixed(1) + "deg");
    box.style.setProperty("--rx", rx.toFixed(1) + "deg");
  };
  const wake = () => {
    box.classList.remove("is-idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (!dragging) box.classList.add("is-idle"); }, 2600);
  };

  /* Die Maus-Neigung ergibt nur mit einem Zeigegerät Sinn. Auf Touch würde
     schon das Antippen die Hülle verreißen — dort bleibt nur das Ziehen. */
  if (!coarse) {
    wrap.addEventListener("pointermove", e => {
      if (dragging) return;
      const r = wrap.getBoundingClientRect();
      ry = ((e.clientX - r.left) / r.width - 0.5) * 78 - 10;
      rx = -((e.clientY - r.top) / r.height - 0.5) * 26;
      wake(); apply();
    });
    wrap.addEventListener("pointerleave", () => { ry = -26; rx = -8; apply(); wake(); });
  } else {
    const hint = $(".case__hint");
    if (hint) hint.textContent = "waagerecht wischen zum Drehen";
  }

  box.addEventListener("pointerdown", e => {
    dragging = true; lastX = e.clientX;
    box.setPointerCapture(e.pointerId);
    box.classList.remove("is-idle");
  });
  box.addEventListener("pointermove", e => {
    if (!dragging) return;
    ry += (e.clientX - lastX) * 0.6;
    lastX = e.clientX;
    apply();
  });
  const endDrag = () => { dragging = false; wake(); };
  box.addEventListener("pointerup", endDrag);
  box.addEventListener("pointercancel", endDrag);
})();

/* ═══ 9 · GALERIE ═════════════════════════════════════════ */
(function gallery() {
  const filter = $("#galFilter");
  const grid = $("#gallery");
  const more = $("#galMore");
  const STEP = 24;
  let cat = "all", shown = 0, list = [];

  filter.innerHTML = GAL_CATS.map((c, i) => `
    <button class="ptab" role="tab" aria-selected="${i === 0}" data-cat="${c.id}">${c.label}</button>`).join("");

  function paint(reset) {
    if (reset) { grid.innerHTML = ""; shown = 0; }
    const slice = list.slice(shown, shown + STEP);
    grid.insertAdjacentHTML("beforeend", slice.map((g, i) => `
      <button class="gitem" type="button" data-i="${shown + i}" aria-label="${g.cap} vergrößern">
        <img src="${g.src}" alt="${g.cap}" loading="lazy" decoding="async">
      </button>`).join(""));
    shown += slice.length;
    more.hidden = shown >= list.length;
  }

  function setCat(id) {
    cat = id;
    list = cat === "all" ? GALLERY : GALLERY.filter(g => g.cat === cat);
    paint(true);
  }

  filter.addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    $$(".ptab", filter).forEach(t => t.setAttribute("aria-selected", String(t === b)));
    setCat(b.dataset.cat);
  });
  more.addEventListener("click", () => paint(false));
  grid.addEventListener("click", e => {
    const b = e.target.closest("[data-i]");
    if (b) openLightbox(list, +b.dataset.i);
  });

  setCat("all");
})();

/* ═══ 10 · X-FEED ═════════════════════════════════════════ */
(function xfeed() {
  const box = $("#xlist");
  box.innerHTML = XACCOUNTS.map(a => `
    <a class="xrow reveal" href="${a.u}" target="_blank" rel="noopener noreferrer">
      <span class="xrow__av" aria-hidden="true"${a.off ? ' style="background:linear-gradient(135deg,#ffb2c6,#e8548c);color:#0c0d1b"' : ""}>${a.av}</span>
      <span class="xrow__b"><b>${a.h}</b><span>${a.d}</span></span>
      <span class="xrow__go" aria-hidden="true">↗</span>
    </a>`).join("");
  watchReveals(box);
})();

/* ═══ 11 · OVERLAYS ═══════════════════════════════════════ */
let lastFocus = null;

function openModal(sel) {
  lastFocus = document.activeElement;
  const m = $(sel);
  m.hidden = false;
  document.body.classList.add("is-locked");
  const f = m.querySelector("button, [href], input, [tabindex]");
  if (f) f.focus();
}
function closeModal(m) {
  if (!m || m.hidden) return;
  m.hidden = true;
  if (!$$(".modal:not([hidden]), .lightbox:not([hidden])").length) document.body.classList.remove("is-locked");
  if (m.id === "ytModal") $("#ytHolder").innerHTML = "";
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-close]")) return closeModal(e.target.closest(".modal, .lightbox"));
  // Klick auf den Hintergrund schließt
  const ov = e.target.closest(".modal, .lightbox");
  if (ov && (e.target === ov)) closeModal(ov);
});
addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const open = $(".modal:not([hidden]), .lightbox:not([hidden])");
  if (open) closeModal(open);
});

/* YouTube */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-yt]");
  if (!t) return;
  $("#ytModalTitle").textContent = t.dataset.ytTitle || "Video";
  $("#ytHolder").innerHTML =
    `<iframe src="https://www.youtube-nocookie.com/embed/${t.dataset.yt}?autoplay=1&rel=0"
      title="${t.dataset.ytTitle || "Video"}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
      allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  openModal("#ytModal");
});

/* Lightbox */
let lbList = [], lbIdx = 0;
function paintLB() {
  const it = lbList[lbIdx];
  $("#lbImg").src = it.src;
  $("#lbImg").alt = it.cap || "";
  $("#lbCap").textContent = `${it.cap || ""}  ·  ${lbIdx + 1} / ${lbList.length}`;
  const multi = lbList.length > 1;
  $("#lbPrev").hidden = !multi;
  $("#lbNext").hidden = !multi;
}
function openLightbox(list, i) {
  lbList = list; lbIdx = i || 0;
  paintLB();
  openModal("#lightbox");
}
const step = d => { lbIdx = (lbIdx + d + lbList.length) % lbList.length; paintLB(); };
$("#lbPrev").addEventListener("click", () => step(-1));
$("#lbNext").addEventListener("click", () => step(1));
addEventListener("keydown", e => {
  if ($("#lightbox").hidden) return;
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});
// Wischen auf Touch
(() => {
  const lb = $("#lightbox");
  let x0 = null;
  lb.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 55) step(dx > 0 ? -1 : 1);
    x0 = null;
  }, { passive: true });
})();

/* ═══ 12 · START ══════════════════════════════════════════ */
watchReveals();

})();
