/* ═══════════════════════════════════════════════════════════
   Ton

   Alle Geräusche entstehen im Browser (Web Audio), es wird keine Datei
   geladen — das hält die Seite klein und es gibt keine Rechtefragen.

     Motor      zwei Oszillatoren, deren Höhe am Tempo hängt
     Reifen     Quietschen beim Driften und harten Bremsen
     Sirene     zwei Töne im Wechsel, solange die Fahndung läuft
     Hupe       kurzer Doppelton (Taste H)
     Rumms      kurzes Rauschen beim Aufprall
     Tür        Klacken beim Ein- und Aussteigen
     Schreck    kurzer Ruf, wenn jemand angefahren wird
     Schuss     kurzer Knall mit Nachhall
     Schlag     dumpfer Treffer mit der Faust
     Kasse      kleine Tonfolge, wenn eine Mission klappt

   Ein Grundrauschen gab es auch einmal. Es sollte die Stadt lebendig
   machen und klang nur wie ein defekter Lautsprecher — es ist raus.

   Wichtig: Browser halten den Ton an, sobald die Seite in den
   Hintergrund geht. Deshalb wird vor jedem Einsatz geprüft, ob der
   Ton noch läuft, und notfalls wieder gestartet.

   Der Ton startet erst beim ersten Klick — Browser erlauben es nicht
   früher. Mit M lässt sich alles stummschalten.
   ═══════════════════════════════════════════════════════════ */

let ctx = null;
let summe = null;          // Gesamtlautstärke
let motor = null;
let sirene = null;
let reifen = null;
let an = true;

export function bereit() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  summe = ctx.createGain();
  summe.gain.value = an ? 0.5 : 0;
  summe.connect(ctx.destination);
  motorBauen();
  sireneBauen();
  reifenBauen();
  /* Nach jedem Tabwechsel oder Klick sicherstellen, dass der Ton läuft */
  document.addEventListener("visibilitychange", wecken);
  addEventListener("pointerdown", wecken);
  addEventListener("keydown", wecken);
  return ctx;
}

/* Der Browser hält den Ton an, wenn die Seite in den Hintergrund geht.
   Ohne dieses Aufwecken bleibt danach alles stumm. */
export function wecken() {
  if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
}

function motorBauen() {
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  o1.type = "sawtooth";
  o2.type = "square";
  o1.frequency.value = 60;
  o2.frequency.value = 90;
  filter.type = "lowpass";
  filter.frequency.value = 700;
  g.gain.value = 0;
  o1.connect(filter);
  o2.connect(filter);
  filter.connect(g);
  g.connect(summe);
  o1.start();
  o2.start();
  motor = { o1, o2, g, filter };
}

function reifenBauen() {
  /* Gefiltertes Rauschen — klingt nach Gummi auf Asphalt */
  const dauer = 2;
  const puffer = ctx.createBuffer(1, ctx.sampleRate * dauer, ctx.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < daten.length; i++) daten[i] = Math.random() * 2 - 1;
  const quelle = ctx.createBufferSource();
  quelle.buffer = puffer;
  quelle.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2600;
  filter.Q.value = 3;
  const g = ctx.createGain();
  g.gain.value = 0;
  quelle.connect(filter);
  filter.connect(g);
  g.connect(summe);
  quelle.start();
  reifen = { g, filter };
}

function sireneBauen() {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.value = 660;
  g.gain.value = 0;
  o.connect(g);
  g.connect(summe);
  o.start();
  sirene = { o, g, zeit: 0 };
}

/* Jeden Bildaufbau aufrufen: Tempo in m/s, Fahndungsstufe, dt, Rutschen */
export function laufen(tempo, fahndung, dt, rutschen = 0) {
  if (!ctx) return;
  if (ctx.state !== "running") { wecken(); return; }

  if (motor) {
    const ziel = tempo > 0.2 ? Math.min(0.16, 0.03 + tempo * 0.006) : 0;
    motor.g.gain.setTargetAtTime(ziel, ctx.currentTime, 0.12);
    const hoehe = 55 + Math.min(150, tempo * 6);
    motor.o1.frequency.setTargetAtTime(hoehe, ctx.currentTime, 0.1);
    motor.o2.frequency.setTargetAtTime(hoehe * 1.5, ctx.currentTime, 0.1);
    motor.filter.frequency.setTargetAtTime(500 + tempo * 40, ctx.currentTime, 0.2);
  }

  if (reifen) {
    const ziel = Math.min(0.09, rutschen * 0.05);
    reifen.g.gain.setTargetAtTime(ziel, ctx.currentTime, 0.08);
    reifen.filter.frequency.setTargetAtTime(1800 + Math.min(2200, tempo * 80), ctx.currentTime, 0.2);
  }

  if (sirene) {
    if (fahndung > 0) {
      sirene.zeit += dt;
      const hoch = Math.floor(sirene.zeit * 2) % 2 === 0;
      sirene.o.frequency.setTargetAtTime(hoch ? 760 : 560, ctx.currentTime, 0.02);
      sirene.g.gain.setTargetAtTime(0.035, ctx.currentTime, 0.2);
    } else {
      sirene.g.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    }
  }
}

/* Alles Dauerhafte ausblenden — Pause und offene Karte.
   Ohne das lief der Motor weiter und es klang, als spiele das Spiel im
   Hintergrund weiter, obwohl längst nichts mehr gerechnet wurde. */
export function anhalten() {
  if (!ctx) return;
  const jetzt = ctx.currentTime;
  if (motor) motor.g.gain.setTargetAtTime(0, jetzt, 0.05);
  if (reifen) reifen.g.gain.setTargetAtTime(0, jetzt, 0.05);
  if (sirene) sirene.g.gain.setTargetAtTime(0, jetzt, 0.05);
}

/* Dumpfer Viervierteltakt im Club — jeden Bildaufbau aufrufen.
   Kein Musikstück, nur ein Kickdrum-Puls hinter der Wand. */
let clubZeit = 0;
export function club(dt, laut = 1) {
  if (!ctx || ctx.state !== "running") return;
  clubZeit -= dt;
  if (clubZeit > 0) return;
  clubZeit = 0.52;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(115, t);
  o.frequency.exponentialRampToValueAtTime(44, t + 0.17);
  g.gain.setValueAtTime(0.085 * laut, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.32);
  o.connect(g);
  g.connect(summe);
  o.start(t);
  o.stop(t + 0.34);
}

/* Kurzes Rauschen beim Aufprall, Stärke 0…1 */
export function rumms(staerke = 1) {
  if (!ctx) return;
  const dauer = 0.25;
  const puffer = ctx.createBuffer(1, ctx.sampleRate * dauer, ctx.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < daten.length; i++) {
    daten[i] = (Math.random() * 2 - 1) * (1 - i / daten.length);
  }
  const quelle = ctx.createBufferSource();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  g.gain.value = Math.min(0.5, 0.12 + staerke * 0.25);
  quelle.buffer = puffer;
  quelle.connect(filter);
  filter.connect(g);
  g.connect(summe);
  quelle.onended = () => { g.disconnect(); filter.disconnect(); };
  quelle.start();
  quelle.stop(ctx.currentTime + dauer + 0.05);
}

/* Hupe: zwei Töne übereinander, kurz angerissen */
export function hupe() {
  if (!ctx) return;
  wecken();
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.16, t + 0.02);
  g.gain.setValueAtTime(0.16, t + 0.32);
  g.gain.linearRampToValueAtTime(0, t + 0.4);
  g.connect(summe);
  for (const f of [420, 530]) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    o.connect(g);
    o.start(t);
    o.stop(t + 0.42);
    o.onended = () => o.disconnect();
  }
  setTimeout(() => g.disconnect(), 600);
}

/* Autotür */
export function tuer() {
  if (!ctx) return;
  wecken();
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  g.gain.setValueAtTime(0.14, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(g);
  g.connect(summe);
  o.start(t);
  o.stop(t + 0.18);
  o.onended = () => { o.disconnect(); g.disconnect(); };
}

/* Kurzer Schreck, wenn jemand angefahren wird */
export function schreck() {
  if (!ctx) return;
  wecken();
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(680 + Math.random() * 260, t);
  o.frequency.exponentialRampToValueAtTime(240, t + 0.3);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.1, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
  o.connect(g);
  g.connect(summe);
  o.start(t);
  o.stop(t + 0.36);
  o.onended = () => { o.disconnect(); g.disconnect(); };
}

/* Schuss: harter Knall aus Rauschen, darunter ein kurzer Tiefton */
export function schuss(staerke = 1) {
  if (!ctx) return;
  wecken();
  const t = ctx.currentTime;
  const dauer = 0.22;
  const puffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dauer), ctx.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < daten.length; i++) {
    const ab = Math.pow(1 - i / daten.length, 4);
    daten[i] = (Math.random() * 2 - 1) * ab;
  }
  const quelle = ctx.createBufferSource();
  quelle.buffer = puffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 400;
  const g = ctx.createGain();
  g.gain.value = 0.22 * staerke;
  quelle.connect(filter);
  filter.connect(g);
  g.connect(summe);
  quelle.onended = () => { g.disconnect(); filter.disconnect(); };
  quelle.start(t);
  quelle.stop(t + dauer);

  const o = ctx.createOscillator();
  const og = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
  og.gain.setValueAtTime(0.18 * staerke, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  o.connect(og);
  og.connect(summe);
  o.start(t);
  o.stop(t + 0.16);
  o.onended = () => { o.disconnect(); og.disconnect(); };
}

/* Fausttreffer: dumpf und kurz */
export function schlag(getroffen) {
  if (!ctx) return;
  wecken();
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(getroffen ? 220 : 340, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.1);
  g.gain.setValueAtTime(getroffen ? 0.2 : 0.07, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
  o.connect(g);
  g.connect(summe);
  o.start(t);
  o.stop(t + 0.15);
  o.onended = () => { o.disconnect(); g.disconnect(); };
}

/* Kurzer Absprung: ein Ton, der schnell nach oben geht */
export function sprung() {
  if (!ctx) return;
  wecken();
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(430, t + 0.12);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.07, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(g);
  g.connect(summe);
  o.start(t);
  o.stop(t + 0.18);
  o.onended = () => { o.disconnect(); g.disconnect(); };
}

/* Kleine Tonfolge, wenn etwas gelingt */
export function kasse() {
  if (!ctx) return;
  [660, 880, 1320].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    g.gain.value = 0;
    o.connect(g);
    g.connect(summe);
    const t = ctx.currentTime + i * 0.08;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.02);
    g.gain.linearRampToValueAtTime(0, t + 0.22);
    o.start(t);
    o.stop(t + 0.25);
  });
}

export function stumm(schalten) {
  an = schalten === undefined ? !an : schalten;
  if (summe) {
    wecken();
    summe.gain.setTargetAtTime(an ? 0.5 : 0, ctx.currentTime, 0.05);
  }
  return an;
}

export const istAn = () => an;
