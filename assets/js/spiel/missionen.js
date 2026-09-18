/* ═══════════════════════════════════════════════════════════
   Missionen

   Eine Mission ist eine Liste von Schritten. Jeder Schritt hat ein Ziel
   auf der Karte, eine Bedingung (zu Fuß, im Auto, egal) und manchmal eine
   Frist. Wer alle Schritte schafft, bekommt Geld; wer die Frist reißt
   oder stirbt, fängt die Mission neu an.

   Die Missionsmarken stehen fest in der Stadt: gelb, wenn frei, grün,
   während sie läuft.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";

const L = (de, en) => ((window.LANG || "de").startsWith("en") ? en : de);

/* Ein Punkt in der Nähe eines Ortes, der auf der Straße oder am Gehweg liegt */
function platz(x, y, radius, arten) {
  return Karte.freierPunkt(x, y, arten || [Karte.ART.GEHWEG, Karte.ART.PARKPLATZ], radius);
}

export class Missionen {
  constructor(startX, startY) {
    this.start = { x: startX, y: startY };
    this.liste = this.bauen();
    this.aktiv = null;
    this.schritt = 0;
    this.zeit = 0;
    this.meldung = "";
    this.erledigt = new Set();
  }

  bauen() {
    const s = this.start;
    const p = (dx, dy, arten) => platz(s.x + dx, s.y + dy, 30, arten);

    return [
      {
        id: "lieferung",
        name: L("Paket ausliefern", "Make a delivery"),
        lohn: 500,
        marke: p(40, -60),
        schritte: [
          { ziel: p(60, -90), text: L("Hol das Paket ab", "Pick up the package"), radius: 4 },
          { ziel: p(-120, 80, [Karte.ART.PARKPLATZ, Karte.ART.GEHWEG]),
            text: L("Bring es zum Hafen — die Zeit läuft", "Take it to the docks — clock’s running"),
            radius: 6, frist: 75 }
        ]
      },
      {
        id: "autoklau",
        name: L("Wagen besorgen", "Steal a car"),
        lohn: 800,
        marke: p(-70, 40),
        schritte: [
          { ziel: p(-130, -40, [Karte.ART.PARKPLATZ]),
            text: L("Schnapp dir einen Wagen und fahr ihn zur Garage", "Grab a car and drive it to the garage"),
            radius: 6, imAuto: true },
          { ziel: p(90, 110, [Karte.ART.PARKPLATZ]),
            text: L("Ab in die Garage", "Get it to the garage"),
            radius: 6, imAuto: true, frist: 90 }
        ]
      },
      {
        id: "ueberfall",
        name: L("Der kleine Überfall", "The small job"),
        lohn: 1500,
        marke: p(-40, -100),
        schritte: [
          { ziel: p(-60, -140), text: L("Rein in den Laden", "Get inside the store"), radius: 4, warten: 8,
            wartenText: L("Kasse leeren …", "Emptying the register …") },
          { ziel: p(120, 60), text: L("Verschwinde — die Cops sind dran", "Get out — the cops are on you"),
            radius: 7, frist: 100, fahndung: 2 }
        ]
      },
      {
        id: "abhaengen",
        name: L("Abhängen", "Shake them off"),
        lohn: 1200,
        marke: p(100, -20),
        schritte: [
          { ziel: null, text: L("Häng die Streifen ab", "Lose the cops"),
            fahndung: 3, halten: 45 }
        ]
      }
    ];
  }

  get laeuft() { return this.aktiv !== null; }

  aktuelleSchritt() {
    return this.aktiv ? this.aktiv.schritte[this.schritt] : null;
  }

  starten(m, zustand) {
    this.aktiv = m;
    this.schritt = 0;
    this.zeit = 0;
    const s = this.aktuelleSchritt();
    if (s && s.fahndung) zustand.fahndung.melden(s.fahndung);
    this.meldung = m.name;
  }

  abbrechen(grund) {
    this.aktiv = null;
    this.meldung = grund || "";
  }

  fertig(zustand) {
    zustand.geld += this.aktiv.lohn;
    this.erledigt.add(this.aktiv.id);
    this.meldung = L("Geschafft: ", "Done: ") + this.aktiv.name + "  +$" + this.aktiv.lohn;
    this.aktiv = null;
  }

  /* dt, Spielerfigur, gesamter Spielzustand */
  rechnen(dt, spieler, zustand) {
    const pos = spieler.imAuto || spieler;

    if (!this.aktiv) {
      /* Marke berühren startet die Mission */
      for (const m of this.liste) {
        if (Math.hypot(m.marke.x - pos.x, m.marke.y - pos.y) < 4) {
          this.starten(m, zustand);
          break;
        }
      }
      return;
    }

    const s = this.aktuelleSchritt();
    this.zeit += dt;

    /* Frist abgelaufen? */
    if (s.frist && this.zeit > s.frist) {
      this.abbrechen(L("Zeit abgelaufen", "Out of time"));
      return;
    }

    /* Schritt „Fahndung abhängen" */
    if (s.halten) {
      if (zustand.fahndung.stufe === 0) {
        this.fertig(zustand);
        return;
      }
      if (this.zeit > s.halten + 60) {
        this.abbrechen(L("Zu lange gebraucht", "Took too long"));
      }
      return;
    }

    /* Warten am Ziel (Überfall) */
    if (s.warten) {
      const nah = Math.hypot(s.ziel.x - pos.x, s.ziel.y - pos.y) < s.radius;
      if (nah) {
        s.gewartet = (s.gewartet || 0) + dt;
        if (s.gewartet >= s.warten) {
          s.gewartet = 0;
          this.weiter(zustand);
        }
      } else {
        s.gewartet = 0;
      }
      return;
    }

    /* Normales Ziel */
    if (!s.ziel) return;
    const d = Math.hypot(s.ziel.x - pos.x, s.ziel.y - pos.y);
    if (d < s.radius) {
      if (s.imAuto && !spieler.imAuto) return;      // muss im Auto sein
      this.weiter(zustand);
    }
  }

  weiter(zustand) {
    this.schritt++;
    this.zeit = 0;
    if (this.schritt >= this.aktiv.schritte.length) {
      this.fertig(zustand);
      return;
    }
    const s = this.aktuelleSchritt();
    if (s.fahndung) zustand.fahndung.melden(s.fahndung);
  }

  /* Text für die Anzeige */
  anzeige() {
    if (!this.aktiv) return this.meldung;
    const s = this.aktuelleSchritt();
    let text = s.text;
    if (s.warten && s.gewartet) text = s.wartenText;
    if (s.frist) {
      const rest = Math.max(0, Math.ceil(s.frist - this.zeit));
      text += `  ⏱ ${rest}s`;
    }
    if (s.halten) {
      text += "  ★" + "★".repeat(0);
    }
    return text;
  }

  /* Ziele und freie Marken zeichnen */
  zeichnen(ctx, kamera, zeit) {
    const punkte = [];
    if (this.aktiv) {
      const s = this.aktuelleSchritt();
      if (s && s.ziel) punkte.push({ ...s.ziel, r: s.radius, farbe: "#7dfba7" });
    } else {
      for (const m of this.liste) {
        punkte.push({ ...m.marke, r: 2.4, farbe: this.erledigt.has(m.id) ? "#8ba0c8" : "#ffd24a" });
      }
    }

    for (const p of punkte) {
      const px = (p.x - kamera.x) * kamera.zoom + kamera.breite / 2;
      const py = (p.y - kamera.y) * kamera.zoom + kamera.hoehe / 2;
      if (px < -80 || py < -80 || px > kamera.breite + 80 || py > kamera.hoehe + 80) continue;
      const puls = 0.85 + Math.sin(zeit * 3) * 0.15;
      const r = p.r * kamera.zoom * puls;
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, p.farbe + "cc");
      g.addColorStop(0.7, p.farbe + "44");
      g.addColorStop(1, p.farbe + "00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = p.farbe;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* Punkte für die Minikarte */
  marken() {
    if (this.aktiv) {
      const s = this.aktuelleSchritt();
      return s && s.ziel ? [{ x: s.ziel.x, y: s.ziel.y, farbe: "#7dfba7" }] : [];
    }
    return this.liste
      .filter(m => !this.erledigt.has(m.id))
      .map(m => ({ x: m.marke.x, y: m.marke.y, farbe: "#ffd24a" }));
  }
}
