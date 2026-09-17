/* ═══════════════════════════════════════════════════════════
   Bild zuschneiden — für Profilbild (1 : 1) und Titelbild (3 : 1)

   const erg = await zuschneiden({ art: "avatar" | "titel", datei, vorschau });
   → null (abgebrochen) oder { daten, quelle }

     daten    fertiges JPEG als data:-URL
     quelle   { bild, stand } — damit lässt sich derselbe Upload später
              erneut zuschneiden: zuschneiden({ art, quelle, vorschau })

   `vorschau` ist optional: { avatar: url, name } für die Titelbild-
   Vorschau (Profilbild und Name darüber, wie auf der Kontoseite).

   Bedienung: ziehen (Maus, Finger), Regler, Mausrad, zwei Finger,
   Pfeiltasten und +/−. Das Bild füllt den Rahmen immer ganz aus —
   leere Ränder sind nicht möglich.
   ═══════════════════════════════════════════════════════════ */

import { L, esc } from "./konto.js";
import { KontoFehler } from "./backend.js";

const ARTEN = {
  avatar: { verh: 1, breite: 256, hoehe: 256, max: 140000, min: 200 },
  titel:  { verh: 3, breite: 1500, hoehe: 500, max: 280000, min: 200 }
};
const ZOOM_MAX = 5;

/* Datei → geladenes <img>. Große Fotos vom Handy gehen problemlos,
   die Drehung aus den EXIF-Daten übernimmt der Browser. */
async function bildLaden(datei) {
  if (!datei || !/^image\//.test(datei.type)) throw new KontoFehler("bild-ungueltig");
  if (datei.size > 25 * 1024 * 1024) throw new KontoFehler("zu-gross");
  const url = URL.createObjectURL(datei);
  const bild = await new Promise((ok, nein) => {
    const i = new Image();
    i.decoding = "async";
    i.onload = () => ok(i);
    i.onerror = () => { URL.revokeObjectURL(url); nein(new KontoFehler("bild-ungueltig")); };
    i.src = url;
  });
  if (Math.min(bild.naturalWidth, bild.naturalHeight) < 200) {
    URL.revokeObjectURL(url);
    throw new KontoFehler("bild-zu-klein");
  }
  return bild;
}

export async function zuschneiden({ art, datei, quelle, vorschau }) {
  const cfg = ARTEN[art];
  const bild = quelle ? quelle.bild : await bildLaden(datei);
  /* stand = Zoom und Mittelpunkt relativ zum Bild (0…1) — unabhängig von
     der Größe des Rahmens, damit ein Drehen des Handys nichts verschiebt */
  const stand = quelle ? { ...quelle.stand } : { zoom: 1, mx: 0.5, my: 0.5 };

  return new Promise(fertig => {
    const vorherFokus = document.activeElement;
    const el = document.createElement("div");
    el.className = "kz";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "kzTitel");
    el.innerHTML = `
      <div class="kz__karte kz__karte--${art}">
        <p class="kd__kicker">${art === "avatar" ? L("Profilbild", "Profile picture") : L("Titelbild", "Cover image")}</p>
        <h2 class="kz__titel" id="kzTitel">${L("Bild zuschneiden", "Crop image")}</h2>
        <p class="kz__text">${L("Ziehen zum Verschieben, Regler oder Mausrad zum Zoomen.", "Drag to move, use the slider or scroll wheel to zoom.")}</p>

        <div class="kz__buehne kz__buehne--${art}" tabindex="0"
             aria-label="${esc(L("Bildausschnitt. Pfeiltasten verschieben, Plus und Minus zoomen.", "Image crop. Arrow keys move, plus and minus zoom."))}">
          <img class="kz__bild" src="${esc(bild.src)}" alt="" draggable="false">
          <div class="kz__maske" aria-hidden="true">
            ${art === "titel" ? `<span class="kz__handy"><i>${L("Handy", "Phone")}</i></span>` : ""}
          </div>
        </div>

        <div class="kz__zoom">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11h6M16 16l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input type="range" min="1" max="${ZOOM_MAX}" step="0.01" value="${stand.zoom}" aria-label="Zoom">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11h6M11 8v6M16 16l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>

        <div class="kz__vorschau kz__vorschau--${art}" aria-hidden="true">
          <span class="kz__vl">${L("So sieht es aus", "Preview")}</span>
          ${art === "avatar"
            ? `<div class="kz__vav"><canvas width="192" height="192"></canvas></div>
               <div class="kz__vav kz__vav--klein"><canvas width="68" height="68"></canvas></div>`
            : `<div class="kz__vtitel">
                 <canvas width="600" height="200"></canvas>
                 <div class="kz__vinhalt">
                   ${vorschau && vorschau.avatar ? `<img src="${esc(vorschau.avatar)}" alt="">` : ""}
                   <b>${esc((vorschau && vorschau.name) || "")}</b>
                 </div>
               </div>`}
        </div>

        <p class="kbox__status is-schlecht" data-kz-fehler role="alert"></p>
        <div class="kz__knoepfe">
          <button type="button" class="btn btn--ghost" data-kz-mitte>${L("Zurücksetzen", "Reset")}</button>
          <span class="kz__luecke"></span>
          <button type="button" class="btn btn--ghost" data-kz-abbruch>${L("Abbrechen", "Cancel")}</button>
          <button type="button" class="btn btn--pink" data-kz-ok>${L("Übernehmen", "Apply")}</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    document.body.classList.add("is-locked");

    const buehne = el.querySelector(".kz__buehne");
    const img = el.querySelector(".kz__bild");
    const regler = el.querySelector("input[type=range]");
    const leinwaende = Array.from(el.querySelectorAll(".kz__vorschau canvas"));
    const bw = bild.naturalWidth, bh = bild.naturalHeight;

    /* ── Geometrie ──
       W, H   Rahmen in px
       s      Maßstab Bild → Rahmen (bei Zoom 1 füllt das Bild den Rahmen)
       x, y   linke obere Bildecke im Rahmen */
    const geo = () => {
      const W = buehne.clientWidth, H = buehne.clientHeight;
      const s = Math.max(W / bw, H / bh) * stand.zoom;
      const dw = bw * s, dh = bh * s;
      let x = W / 2 - stand.mx * dw;
      let y = H / 2 - stand.my * dh;
      x = Math.min(0, Math.max(W - dw, x));
      y = Math.min(0, Math.max(H - dh, y));
      /* Begrenzung zurück in den Stand schreiben */
      stand.mx = (W / 2 - x) / dw;
      stand.my = (H / 2 - y) / dh;
      return { W, H, s, dw, dh, x, y };
    };

    let rafId = null;
    const zeichnen = () => {
      rafId = null;
      const g = geo();
      img.style.width = g.dw + "px";
      img.style.height = g.dh + "px";
      img.style.transform = `translate3d(${g.x}px, ${g.y}px, 0)`;
      regler.value = stand.zoom;
      /* Vorschau aus demselben Ausschnitt */
      const sx = -g.x / g.s, sy = -g.y / g.s, sw = g.W / g.s, sh = g.H / g.s;
      leinwaende.forEach(c => {
        const ctx = c.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#0b1124";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(bild, sx, sy, sw, sh, 0, 0, c.width, c.height);
      });
    };
    const neuZeichnen = () => { if (rafId === null) rafId = requestAnimationFrame(zeichnen); };

    /* Zoomen um einen Punkt im Rahmen (Mauszeiger, Fingermitte) —
       der Bildpunkt darunter bleibt stehen */
    const zoomAuf = (neu, px, py) => {
      const g = geo();
      neu = Math.min(ZOOM_MAX, Math.max(1, neu));
      if (px === undefined) { px = g.W / 2; py = g.H / 2; }
      const bx = (px - g.x) / g.s, by = (py - g.y) / g.s;     // Bildpunkt
      stand.zoom = neu;
      const s2 = Math.max(g.W / bw, g.H / bh) * neu;
      const x2 = px - bx * s2, y2 = py - by * s2;
      stand.mx = (g.W / 2 - x2) / (bw * s2);
      stand.my = (g.H / 2 - y2) / (bh * s2);
      neuZeichnen();
    };

    const verschieben = (dx, dy) => {
      const g = geo();
      stand.mx -= dx / g.dw;
      stand.my -= dy / g.dh;
      neuZeichnen();
    };

    /* ── Ziehen und Zwei-Finger-Zoom ── */
    const zeiger = new Map();
    let abstand0 = 0, zoom0 = 1;
    const mitte = () => {
      const p = Array.from(zeiger.values());
      const r = buehne.getBoundingClientRect();
      return { x: (p[0].x + p[1].x) / 2 - r.left, y: (p[0].y + p[1].y) / 2 - r.top, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) };
    };
    buehne.addEventListener("pointerdown", e => {
      try { buehne.setPointerCapture(e.pointerId); } catch (err) { /* Zeiger schon weg */ }
      zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
      buehne.classList.add("is-ziehen");
      if (zeiger.size === 2) { const m = mitte(); abstand0 = m.d; zoom0 = stand.zoom; }
    });
    buehne.addEventListener("pointermove", e => {
      const alt = zeiger.get(e.pointerId);
      if (!alt) return;
      const neu = { x: e.clientX, y: e.clientY };
      if (zeiger.size === 1) {
        verschieben(neu.x - alt.x, neu.y - alt.y);
        zeiger.set(e.pointerId, neu);
      } else if (zeiger.size === 2) {
        zeiger.set(e.pointerId, neu);
        const m = mitte();
        if (abstand0 > 0) zoomAuf(zoom0 * m.d / abstand0, m.x, m.y);
      }
    });
    const loslassen = e => {
      zeiger.delete(e.pointerId);
      if (zeiger.size < 2) abstand0 = 0;
      if (!zeiger.size) buehne.classList.remove("is-ziehen");
    };
    buehne.addEventListener("pointerup", loslassen);
    buehne.addEventListener("pointercancel", loslassen);

    buehne.addEventListener("wheel", e => {
      e.preventDefault();
      const r = buehne.getBoundingClientRect();
      zoomAuf(stand.zoom * Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    regler.addEventListener("input", () => zoomAuf(parseFloat(regler.value)));

    buehne.addEventListener("keydown", e => {
      const schritt = e.shiftKey ? 40 : 12;
      if (e.key === "ArrowLeft") verschieben(schritt, 0);
      else if (e.key === "ArrowRight") verschieben(-schritt, 0);
      else if (e.key === "ArrowUp") verschieben(0, schritt);
      else if (e.key === "ArrowDown") verschieben(0, -schritt);
      else if (e.key === "+" || e.key === "=") zoomAuf(stand.zoom * 1.12);
      else if (e.key === "-") zoomAuf(stand.zoom / 1.12);
      else return;
      e.preventDefault();
    });

    const beiGroesse = () => neuZeichnen();
    addEventListener("resize", beiGroesse);

    /* ── Schließen ── */
    const schliessen = erg => {
      removeEventListener("resize", beiGroesse);
      removeEventListener("keydown", beiTaste, true);
      el.remove();
      if (!document.querySelector(".kd:not([hidden]), .kz")) document.body.classList.remove("is-locked");
      if (vorherFokus && vorherFokus.focus && document.contains(vorherFokus)) vorherFokus.focus();
      fertig(erg);
    };

    const ausschneiden = () => {
      const g = geo();
      const c = document.createElement("canvas");
      c.width = cfg.breite; c.height = cfg.hoehe;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#0b1124";                 // Hintergrund für transparente PNGs
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bild, -g.x / g.s, -g.y / g.s, g.W / g.s, g.H / g.s, 0, 0, c.width, c.height);
      for (const q of [0.86, 0.78, 0.7, 0.6, 0.5]) {
        const d = c.toDataURL("image/jpeg", q);
        if (d.length <= cfg.max) return d;
      }
      throw new KontoFehler("zu-gross");
    };

    const beiTaste = e => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); schliessen(null); return; }
      if (e.key !== "Tab") return;
      const ziele = Array.from(el.querySelectorAll("button, input, [tabindex='0']"));
      const erstes = ziele[0], letztes = ziele[ziele.length - 1];
      if (e.shiftKey && document.activeElement === erstes) { e.preventDefault(); letztes.focus(); }
      else if (!e.shiftKey && document.activeElement === letztes) { e.preventDefault(); erstes.focus(); }
    };
    addEventListener("keydown", beiTaste, true);

    /* Kein Schließen per Klick daneben: endet ein Ziehen außerhalb des
       Rahmens, käme sonst ein Klick auf den Hintergrund an */
    el.addEventListener("click", e => {
      if (e.target.closest("[data-kz-abbruch]")) return schliessen(null);
      if (e.target.closest("[data-kz-mitte]")) {
        stand.zoom = 1; stand.mx = 0.5; stand.my = 0.5;
        return neuZeichnen();
      }
      if (e.target.closest("[data-kz-ok]")) {
        try {
          const daten = ausschneiden();
          schliessen({ daten, quelle: { bild, stand: { ...stand } } });
        } catch (err) {
          el.querySelector("[data-kz-fehler]").textContent = err.code === "zu-gross"
            ? L("Das Bild ist zu groß. Versuch ein anderes.", "That image is too large. Try another one.")
            : L("Das hat nicht geklappt. Versuch es noch einmal.", "That didn’t work. Please try again.");
        }
      }
    });

    requestAnimationFrame(() => {
      el.classList.add("is-offen");
      zeichnen();
      buehne.focus({ preventScroll: true });
    });
  });
}
