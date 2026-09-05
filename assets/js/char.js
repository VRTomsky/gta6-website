/* ═══════════════════════════════════════════════════════════
   Charakter-Detailseite — Aufbau und Interaktion

   Eine Seite fuer alle Charaktere. Welcher gezeigt wird, steht in
   der Adresse: charakter.html?c=jason. Die Inhalte kommen aus
   CHARS (Stammdaten) und CHAR_PAGES (Seitenaufbau) in data.js.

   Die Scroll-Mechanik ist bewusst dieselbe wie auf der Startseite:
   ein Wert pro Frame, weich nachgezogen. Wer dort etwas aendert,
   sollte hier mitziehen.
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

/* ═══ 1 · WELCHER CHARAKTER? ══════════════════════════════ */
const params = new URLSearchParams(location.search);
const id = (params.get("c") || "").toLowerCase();
const base = typeof CHARS !== "undefined" ? CHARS.find(c => c.id === id) : null;
const page = typeof CHAR_PAGES !== "undefined" ? CHAR_PAGES[id] : null;
const root = $("#charRoot");

if (!base || !page) {
  root.removeAttribute("aria-busy");
  root.innerHTML = `
    <section class="coutro" style="padding-top:34svh">
      <h1 class="coutro__h">Akte nicht gefunden</h1>
      <p class="cbody" style="margin:0 auto var(--s4);max-width:44ch">
        Zu <strong>${esc(id) || "diesem Eintrag"}</strong> gibt es keine Akte.
        Die Uebersicht listet alle Charaktere.
      </p>
      <div class="coutro__acts">
        <a class="btn btn--pink btn--lg" href="index.html#charaktere">Zu den Charakteren</a>
      </div>
    </section>`;
  document.title = "Akte nicht gefunden — Grand Theft Auto VI";
  return;
}

/* ═══ 2 · SEITE AUFBAUEN ══════════════════════════════════ */
document.title = base.name + " — Grand Theft Auto VI";
const where = $("#navWhere");
if (where) where.textContent = base.name;

const meta = $('meta[name="description"]');
if (meta) meta.setAttribute("content", base.name + " — Akte zu Grand Theft Auto VI: " + base.sub + ".");

/* Jedes Bild bekommt eine laufende Nummer, damit die Lightbox in der
   Reihenfolge blaettert, in der die Bilder auf der Seite stehen. */
const lbList = [];
function shot(src, alt, cls) {
  const i = lbList.length;
  const url = "assets/img/" + src;
  lbList.push({ src: url, cap: alt });
  return `
    <figure class="cshot ${cls || ""} cin">
      <img src="${url}" alt="${esc(alt)}" loading="lazy" decoding="async">
      <button class="cshot__zoom" type="button" data-lb="${i}" aria-label="${esc(alt)} vergroessern">
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"
                stroke="currentColor" stroke-width="2" fill="none"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </figure>`;
}

const rightSide = page.side === "right";

/* Jason und Lucia bekommen ihren scroll-gesteuerten Clip. Für die
   Nebenfiguren gibt es keinen: Rockstars Charakter-Loops sind
   1–1,5-Sekunden-Schnipsel, für das Scrubben hochinterpoliert — im
   Vollbild sieht man das sofort. Dort steht stattdessen das Artwork
   in 1920×1080. Der Rest der Seite bleibt identisch. */
const hatVideo = !!page.scrub;

const heroMedium = hatVideo
  ? `<video class="cv__video" id="cvVideo"
            src="${page.scrub}" poster="${page.scrubPoster}"
            muted playsinline preload="auto" disablepictureinpicture
            aria-label="Clip zu ${esc(base.name)}, läuft über die Scrollposition"></video>`
  : `<img class="cv__video" id="cvImg" src="${page.heroImg}"
          alt="${esc(base.name)} — ${esc(base.sub)}" fetchpriority="high" decoding="async">`;

root.innerHTML = `
  <!-- 1 · Hero: Scroll-Video (Jason, Lucia) oder Artwork (alle anderen) -->
  <section class="cv ${hatVideo ? "" : "cv--still"}" id="cv">
    <div class="cv__sticky">
      <div class="cv__frame" id="cvFrame">${heroMedium}</div>
      <div class="cv__vig" aria-hidden="true"></div>
      <div class="cv__title ${rightSide ? "cv__title--right" : ""}" id="cvTitle">
        <p class="cv__kicker">${esc(page.kicker)}</p>
        <h1 class="cv__name">${base.display}</h1>
        <p class="cv__hint">
          <span>Scroll</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 4v14m0 0l-6-6m6 6l6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </p>
      </div>
      <!-- Blendet den Hero auf die Grundfarbe ab, während die Karte hochfährt -->
      <div class="cv__out" aria-hidden="true"></div>
    </div>
  </section>

  <!-- 2 · Intro — fährt als Karte von unten über den Hero -->
  <section class="cintro rise-card ${rightSide ? "cintro--right" : ""}" id="cintro">
    <div class="cintro__copy">
      <h2 class="cintro__name cin">${base.display}</h2>
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

  <!-- 3 · Zitat -->
  <section class="cquote ${rightSide ? "cquote--right" : ""}">
    <blockquote class="cin">&bdquo;${page.quote1}&ldquo;</blockquote>
  </section>

  <!-- 4 · Textband -->
  <section class="cband ${rightSide ? "cband--right" : ""}">
    ${rightSide
      ? `<p class="cband__body cin">${page.band.body}</p><p class="cband__pink cin">${page.band.pink}</p>`
      : `<p class="cband__pink cin">${page.band.pink}</p><p class="cband__body cin">${page.band.body}</p>`}
    <div class="cband__shots">
      ${page.bandShots.map(([s, a]) => shot(s, a)).join("")}
    </div>
  </section>

  <!-- 5 · Vollbild — über die volle Breite, ohne Zuschnitt und ohne Zoom -->
  <figure class="cfull" id="cfull">
    <img src="assets/img/${page.full}" alt="${esc(page.fullAlt)}" id="cfullImg" loading="lazy" decoding="async">
    <figcaption class="cfull__cap">${esc(page.fullCap)}</figcaption>
  </figure>

  <!-- 6 · Zweites Zitat -->
  <section class="cquote ${rightSide ? "" : "cquote--right"}">
    <blockquote class="cin">${page.quote2}</blockquote>
  </section>

  <!-- 7 · Zweites Textband, Spalten getauscht -->
  <section class="cband ${rightSide ? "" : "cband--right"}">
    ${rightSide
      ? `<p class="cband__pink cin">${page.band2.pink}</p><p class="cband__body cin">${page.band2.body}</p>`
      : `<p class="cband__body cin">${page.band2.body}</p><p class="cband__pink cin">${page.band2.pink}</p>`}
  </section>

  <!-- 8 · Bilderraster -->
  <section class="cgal">
    <h2 class="cgal__head cin">Bilder &middot; ${esc(base.name)}</h2>
    <div class="cgal__grid">
      ${page.gallery.map(([s, a]) => shot(s, a)).join("")}
    </div>
  </section>

  <!-- 9 · Abschluss -->
  <section class="coutro">
    <div class="coutro__shots">
      ${page.outro.map(([s, a]) => shot(s, a)).join("")}
    </div>
    <h2 class="coutro__h cin">Weiter in Leonida</h2>
    <div class="coutro__acts cin">
      <a class="btn btn--pink btn--lg" href="index.html#charaktere">
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Zurueck zu den Charakteren
      </a>
      <a class="btn btn--ghost btn--lg" href="index.html">Zur Startseite</a>
    </div>
  </section>`;

root.removeAttribute("aria-busy");

/* ═══ 3 · SCROLL-MOTOR ════════════════════════════════════ */
/* Liest die Position eines Abschnitts einmal pro Frame und zieht den
   Wert weich nach — ohne das springen die Werte im Takt der
   Mausrad-Schritte. Gleiche Funktion wie in main.js. */
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
    rafId = current !== target ? requestAnimationFrame(frame) : null;
  };

  const kick = () => {
    target = read();
    if (rafId === null) rafId = requestAnimationFrame(frame);
    if (performance.now() - lastFrame > 260) { current = target; onUpdate(current, target); }
  };

  addEventListener("scroll", kick, { passive: true });

  /* Auf dem Handy blendet der Browser beim Scrollen die URL-Leiste aus.
     Das loest ein resize aus, obwohl sich am Layout nichts geaendert
     hat — bei einer reinen Hoehenaenderung nur das Ziel nachziehen. */
  let lastW = innerWidth, lastH = innerHeight;
  addEventListener("resize", () => {
    const dw = Math.abs(innerWidth - lastW), dh = Math.abs(innerHeight - lastH);
    lastW = innerWidth; lastH = innerHeight;
    if (coarse && dw === 0 && dh < 200) { kick(); return; }
    target = current = read();
    onUpdate(current, target);
  });

  target = current = read();
  onUpdate(current, target);
  return kick;
}

/* Wie weit ist die Karte darunter hochgefahren?
   0 = Oberkante am unteren Bildschirmrand, 1 = Karte füllt das Bild.
   Gleiche Rechnung wie auf der Startseite. */
function cardRise(card) {
  if (!card) return 0;
  return clamp((innerHeight - card.getBoundingClientRect().top) / innerHeight, 0, 1);
}

/* ═══ 4 · HERO ════════════════════════════════════════════ */
/* Drei Dinge hängen an derselben Scrollstrecke:
   1. der Name blendet aus,
   2. die Intro-Karte fährt von unten darüber und ihre Fläche blendet ein,
   3. der Hero dahinter geht auf die Grundfarbe über.
   Bei Jason und Lucia läuft zusätzlich das Video über die Scrollposition. */
(function hero() {
  const sec = $("#cv");
  const vid = $("#cvVideo");          // nur bei Jason und Lucia
  const frame = $("#cvFrame");
  const title = $("#cvTitle");
  const card = $("#cintro");
  if (!sec) return;

  if (reduced) {
    if (vid) { vid.loop = true; vid.muted = true; vid.play().catch(() => {}); }
    return;
  }

  /* Ohne Video braucht es keine Spul-Maschinerie — nur die Karten- und
     Titel-Werte pro Frame. */
  if (!vid) {
    scrollStage(sec, p => {
      const out = smooth(seg(p, 0.06, 0.42));
      if (title) {
        title.style.setProperty("--t-out", (1 - out).toFixed(3));
        title.style.setProperty("--t-y", (-out * 40).toFixed(1) + "px");
      }
      const q = cardRise(card);
      sec.style.setProperty("--s-out", smooth(clamp(q / 0.9, 0, 1)).toFixed(3));
      if (card) card.style.setProperty("--card-bg", smooth(clamp(q / 0.55, 0, 1)).toFixed(3));
    });
    return;
  }

  // Derselbe Wert wie in main.js: bis hierhin ist der Clip durchgelaufen.
  // Zusammen mit der Hoehe von .cv ergibt das dieselbe Scrollgeschwindigkeit
  // wie beim Video zwischen Trailer und Story auf der Startseite.
  const PLAY_END = 0.90;
  let duration = 0, target = 0, current = 0, rafId = null, looping = false;
  let lastFrame = performance.now();

  const waitFor = (evt, ms) => new Promise(res => {
    let done = false;
    const fin = () => { if (!done) { done = true; res(); } };
    vid.addEventListener(evt, fin, { once: true });
    setTimeout(fin, ms);
  });

  const canSeek = () =>
    vid.seekable && vid.seekable.length > 0 &&
    vid.seekable.end(vid.seekable.length - 1) > 0.5;

  const fallBackToLoop = () => {
    if (looping) return;
    looping = true;
    vid.loop = true; vid.muted = true;
    vid.play().catch(() => {});
  };

  const seek = t => {
    if (looping || !duration) return;
    try { vid.currentTime = clamp(t, 0, duration - 0.05); } catch (e) {}
  };

  /* Dieselbe Leiter wie auf der Startseite:
     1) Direktquelle, wenn der Server Range-Requests kann
     2) sonst als Blob laden, damit currentTime ueberhaupt greift
     3) sonst als Loop laufen lassen statt einzufrieren  */
  const load = async () => {
    const url = vid.getAttribute("src");
    if (!url || url.startsWith("blob:")) return;

    if (vid.readyState < 1) await waitFor("loadedmetadata", 6000);
    if (vid.duration && canSeek()) {
      duration = vid.duration;
      vid.removeAttribute("poster");
      kick();
      return;
    }
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

  const loop = () => {
    lastFrame = performance.now();
    current += (target - current) * 0.16;
    if (Math.abs(target - current) > 0.012) {
      seek(current);
      rafId = requestAnimationFrame(loop);
    } else {
      current = target; seek(target); rafId = null;
    }
  };

  const kick = scrollStage(sec, (p, raw) => {
    // Der Name blendet auf dem ersten Drittel aus und wandert leicht hoch
    const out = smooth(seg(p, 0.06, 0.42));
    if (title) {
      title.style.setProperty("--t-out", (1 - out).toFixed(3));
      title.style.setProperty("--t-y", (-out * 40).toFixed(1) + "px");
    }
    if (frame) frame.style.setProperty("--z", (1 + p * 0.07).toFixed(3));

    // Karte fährt hoch, der Hero dahinter geht auf die Grundfarbe über
    const q = cardRise(card);
    sec.style.setProperty("--s-out", smooth(clamp(q / 0.9, 0, 1)).toFixed(3));
    if (card) card.style.setProperty("--card-bg", smooth(clamp(q / 0.55, 0, 1)).toFixed(3));

    if (looping) {
      const r = sec.getBoundingClientRect();
      const on = r.top < innerHeight && r.bottom > 0;
      if (on && vid.paused) vid.play().catch(() => {});
      else if (!on && !vid.paused) vid.pause();
      return;
    }

    target = clamp(raw / PLAY_END, 0, 1) * duration;
    if (rafId === null) rafId = requestAnimationFrame(loop);
    if (performance.now() - lastFrame > 260) { current = target; seek(target); }
  });

  load();
})();

/* Das Vollbild hatte einmal einen Parallax-Versatz mit leichtem Zoom.
   Beides ist raus: es zeigt jetzt schlicht das ganze Bild über die volle
   Breite und scrollt normal mit. Reiner CSS-Fall, kein JS nötig. */

/* ═══ 5 · EINBLENDEN BEIM SCROLLEN ════════════════════════ */
(function reveals() {
  if (reduced) { $$(".cin").forEach(el => el.classList.add("is-in")); return; }

  const show = el => { el.classList.add("is-in"); io.unobserve(el); };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      // Sichtbar geworden — oder beim schnellen Scrollen schon nach oben
      // durchgelaufen. Im zweiten Fall sofort zeigen, sonst bliebe der
      // Absatz unsichtbar stehen.
      if (e.isIntersecting || e.boundingClientRect.bottom < 0) show(e.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.06 });

  // Gestaffelt, aber nur innerhalb einer Gruppe — sonst wartet man zu lang
  $$(".cin").forEach(el => {
    const sibs = Array.from(el.parentElement.children).filter(c => c.classList.contains("cin"));
    el.style.setProperty("--d", (sibs.indexOf(el) % 4) * 70 + "ms");
    io.observe(el);
  });

  /* Sicherheitsnetz. Läuft ein Element zwischen zwei Frames komplett
     durch das Bild — bei einem kräftigen Mausrad-Schwung oder einem
     Wisch auf dem Handy —, meldet der Observer dafür gar nichts und der
     Absatz bliebe dauerhaft auf Deckkraft 0 stehen. Was oben aus dem
     Bild heraus ist und noch nicht eingeblendet wurde, wird deshalb pro
     Frame nachgezogen. Die Liste ist kurz, sie schrumpft mit jedem
     Treffer. */
  let pending = false;
  const sweep = () => {
    pending = false;
    const rest = $$(".cin:not(.is-in)");
    if (!rest.length) return removeEventListener("scroll", onScroll);
    rest.forEach(el => { if (el.getBoundingClientRect().bottom < 0) show(el); });
  };
  const onScroll = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(sweep);
  };
  addEventListener("scroll", onScroll, { passive: true });
})();

/* ═══ 6 · LIGHTBOX ════════════════════════════════════════ */
(function lightbox() {
  const lb = $("#lightbox");
  const img = $("#lbImg"), cap = $("#lbCap");
  let idx = 0, lastFocus = null;

  const paint = () => {
    const it = lbList[idx];
    img.src = it.src;
    img.alt = it.cap || "";
    cap.textContent = `${it.cap || ""}  ·  ${idx + 1} / ${lbList.length}`;
    const multi = lbList.length > 1;
    $("#lbPrev").hidden = !multi;
    $("#lbNext").hidden = !multi;
  };
  const open = i => {
    lastFocus = document.activeElement;
    idx = i; paint();
    lb.hidden = false;
    document.body.classList.add("is-locked");
    $("#lightbox .modal__close").focus();
  };
  const close = () => {
    if (lb.hidden) return;
    lb.hidden = true;
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  const step = d => { idx = (idx + d + lbList.length) % lbList.length; paint(); };

  document.addEventListener("click", e => {
    const z = e.target.closest("[data-lb]");
    if (z) return open(+z.dataset.lb);
    if (e.target.closest("[data-close]")) return close();
    if (e.target === lb) close();
  });
  $("#lbPrev").addEventListener("click", () => step(-1));
  $("#lbNext").addEventListener("click", () => step(1));
  addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // Wischen auf Touch
  let x0 = null;
  lb.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 55) step(dx > 0 ? -1 : 1);
    x0 = null;
  }, { passive: true });
})();

/* ═══ 7 · NAV ═════════════════════════════════════════════ */
(function nav() {
  const burger = $("#burger"), menu = $("#mobileMenu");
  if (!burger || !menu) return;

  const closeMenu = () => {
    menu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Menü öffnen");
    document.body.classList.remove("is-locked");
  };
  burger.addEventListener("click", () => {
    if (burger.getAttribute("aria-expanded") === "true") return closeMenu();
    menu.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Menü schließen");
    document.body.classList.add("is-locked");
  });
  menu.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) closeMenu(); });

  const wide = matchMedia("(min-width: 1025px)");
  const onWide = e => { if (e.matches && !menu.hidden) closeMenu(); };
  if (wide.addEventListener) wide.addEventListener("change", onWide);
  else wide.addListener(onWide);

  // Countdown-Pille im Mobile-Menü
  const out = $("#navMiniMobile");
  if (!out || typeof RELEASE === "undefined") return;
  const tick = () => {
    const d = Math.floor(Math.max(0, RELEASE - Date.now()) / 86400000);
    out.textContent = d;
  };
  tick();
  setInterval(tick, 60000);
})();

})();
