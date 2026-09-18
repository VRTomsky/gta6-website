/* ═══════════════════════════════════════════════════════════
   Ton

   Alle Geräusche entstehen im Browser (Web Audio), es wird keine Datei
   geladen — das hält die Seite klein und es gibt keine Rechtefragen.

     Motor     zwei Oszillatoren, deren Höhe am Tempo hängt
     Sirene    zwei Töne im Wechsel, solange die Fahndung läuft
     Rumms     kurzes Rauschen beim Aufprall
     Kasse     kleine Tonfolge, wenn eine Mission klappt

   Der Ton startet erst beim ersten Klick — Browser erlauben es nicht
   früher. Mit M lässt sich alles stummschalten.
   ═══════════════════════════════════════════════════════════ */

let ctx = null;
let summe = null;          // Gesamtlautstärke
let motor = null;
let sirene = null;
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
  return ctx;
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

/* Jeden Bildaufbau aufrufen: Tempo in m/s, Fahndungsstufe, dt */
export function laufen(tempo, fahndung, dt) {
  if (!ctx || ctx.state === "suspended") return;

  if (motor) {
    const ziel = tempo > 0.2 ? Math.min(0.16, 0.03 + tempo * 0.006) : 0;
    motor.g.gain.setTargetAtTime(ziel, ctx.currentTime, 0.12);
    const hoehe = 55 + Math.min(150, tempo * 6);
    motor.o1.frequency.setTargetAtTime(hoehe, ctx.currentTime, 0.1);
    motor.o2.frequency.setTargetAtTime(hoehe * 1.5, ctx.currentTime, 0.1);
    motor.filter.frequency.setTargetAtTime(500 + tempo * 40, ctx.currentTime, 0.2);
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
  quelle.start();
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
  if (summe) summe.gain.setTargetAtTime(an ? 0.5 : 0, ctx.currentTime, 0.05);
  return an;
}

export const istAn = () => an;
