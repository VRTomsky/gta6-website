/* ═══════════════════════════════════════════════════════════
   Aufträge

   Eine Mission ist eine Liste von Schritten. Jeder Schritt hat eine Art,
   ein Ziel und eine Bedingung. Die Arten:

     fahren     Punkt erreichen (wahlweise im Auto oder zu Fuß)
     warten     im Kreis bleiben, bis die Zeit um ist
     drinnen    im Gebäude verschwinden (Überfall), danach wieder heraus
     sammeln    mehrere Punkte in beliebiger Reihenfolge abklappern
     jagen      ein fahrendes Auto einholen
     abhaengen  die Polizei loswerden
     strecke    Kontrollpunkte in fester Reihenfolge (Rennen)
     aktion     drinnen etwas tun: Kasse, Schalter, Akte (innen.js)
     zerstoeren einen abgestellten Wagen kaputt machen (schießen, rammen)
     ausschalten eine bestimmte Person umhauen

   Aufträge mit `ab` erscheinen erst, wenn so viele andere erledigt sind.

   Die Marken liegen an den Wahrzeichen der Stadt, nicht auf irgendeinem
   Parkplatz — ein Überfall vor dem Kaufhaus ergibt mehr Sinn als einer
   im Nirgendwo. Das war die Rückmeldung zum ersten Entwurf.
   ═══════════════════════════════════════════════════════════ */

import * as Karte from "./karte.js";
import { Fahrzeug } from "./fahrzeug.js";
import { Passant } from "./wesen.js";

const L = (de, en) => ((window.LANG || "de").startsWith("en") ? en : de);

/* Gehweg oder Parkplatz in der Nähe eines Ortes */
function platz(x, y, radius = 30, arten) {
  return Karte.freierPunkt(x, y, arten || [Karte.ART.GEHWEG, Karte.ART.PARKPLATZ], radius);
}

/* Wahrzeichen der Stadt heraussuchen (mit Ausweichpunkt, falls es fehlt) */
function wahrzeichen(bau, ersatzX, ersatzY) {
  const treffer = Karte.wahrzeichen.filter(w => w.bau === bau);
  if (!treffer.length) return { x: ersatzX, y: ersatzY };
  return treffer[0];
}

function wahrzeichenAlle(bau) {
  return Karte.wahrzeichen.filter(w => w.bau === bau);
}

/* Eingang des nächstgelegenen Hauses einer Bauart */
function eingangNah(bau, x, y) {
  const liste = wahrzeichenAlle(bau)
    .map(w => Karte.eingangVor(w)).filter(Boolean)
    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
  return liste[0] || null;
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
    this.stand = {};
    this.fluechtiger = null;
    this.geschafft = 0;              // Restzeit der Einblendung „geschafft"
  }

  bauen() {
    const s = this.start;
    const nah = (dx, dy, r = 30, arten) => platz(s.x + dx, s.y + dy, r, arten);
    const vor = w => platz(w.x, w.y, 26, [Karte.ART.GEHWEG]);

    const bank = wahrzeichen(Karte.BAU.BANK, s.x + 60, s.y - 40);
    const kaufhaus = wahrzeichen(Karte.BAU.KAUFHAUS, s.x - 60, s.y + 80);
    const klinik = wahrzeichen(Karte.BAU.KRANKENHAUS, s.x + 120, s.y + 40);
    const stadion = wahrzeichen(Karte.BAU.STADION, s.x - 160, s.y - 90);
    const schule = wahrzeichen(Karte.BAU.SCHULE, s.x + 140, s.y + 180);
    const kirche = wahrzeichen(Karte.BAU.KIRCHE, s.x - 180, s.y + 30);
    const tanken = wahrzeichenAlle(Karte.BAU.TANKSTELLE);
    const tanke1 = tanken[0] || { x: s.x + 90, y: s.y + 120 };
    const tanke2 = tanken[1] || { x: s.x - 120, y: s.y - 120 };
    const waffen = wahrzeichenAlle(Karte.BAU.WAFFEN);
    const waffe1 = waffen[0] || { x: s.x + 70, y: s.y - 50 };

    /* Für die zweite Runde */
    const clubs = wahrzeichenAlle(Karte.BAU.CLUB);
    const club1 = clubs[0] || { x: s.x + 50, y: s.y + 50 };
    const club2 = clubs[1] || clubs[0] || { x: s.x - 50, y: s.y + 60 };
    const wache = wahrzeichen(Karte.BAU.POLIZEI, s.x - 90, s.y - 60);
    const ersatz = w => ({ x: w.x, y: w.y });
    const markt = eingangNah(Karte.BAU.TANKSTELLE, s.x + 60, s.y + 40) || ersatz(vor(tanke1));
    const klinikTuer = eingangNah(Karte.BAU.KRANKENHAUS, s.x, s.y) || ersatz(vor(klinik));
    const bankTuer = eingangNah(Karte.BAU.BANK, s.x, s.y) || ersatz(vor(bank));
    const ammuTuer = eingangNah(Karte.BAU.WAFFEN, s.x - 100, s.y + 100) || ersatz(vor(waffe1));
    const strasse = (dx, dy) => nah(dx, dy, 40, [Karte.ART.STRASSE]);
    const startlinie = strasse(60, -120);
    const rennstrecke = [strasse(200, -60), strasse(250, 90), strasse(120, 210),
                         strasse(-60, 220), strasse(-170, 70), strasse(60, -120)];
    const hafen = platz(s.x - 150, s.y + 150, 60, [Karte.ART.PARKPLATZ, Karte.ART.GEHWEG]);
    const kisten = [platz(hafen.x + 16, hafen.y, 20), platz(hafen.x - 20, hafen.y + 12, 20),
                    platz(hafen.x + 4, hafen.y - 22, 20)];
    const strandparty = Karte.freierPunkt(s.x + 200, s.y, [Karte.ART.STRAND], 400);
    const garage = platz(s.x + 120, s.y - 140, 50, [Karte.ART.PARKPLATZ]);
    const SCHICK = ["limousine", "luxuscabrio", "limo", "oldtimer", "regierung", "cabrio"];
    const SPORTLICH = ["sport", "supersport", "muscle"];

    return [
      {
        id: "einweisung",
        name: L("Erste Runde", "First lap"),
        kurz: L("Einweisung", "Warm-up"),
        lohn: 300,
        marke: nah(18, 14, 18),
        schritte: [
          { art: "fahren", ziel: nah(70, -40), radius: 6, imAuto: true,
            text: L("Schnapp dir einen Wagen und fahr zum Treffpunkt",
                    "Grab a car and drive to the meeting point") },
          { art: "fahren", ziel: vor(tanke1), radius: 7, imAuto: true, frist: 80,
            text: L("Weiter zur Tankstelle — die Zeit läuft",
                    "On to the gas station — clock's running") }
        ]
      },
      {
        id: "lieferung",
        name: L("Paket ausliefern", "Make a delivery"),
        kurz: L("Kurierfahrt", "Courier run"),
        lohn: 600,
        marke: nah(-40, -60, 24),
        schritte: [
          { art: "fahren", ziel: nah(-90, -110), radius: 4,
            text: L("Hol das Paket ab", "Pick up the package") },
          { art: "fahren", ziel: platz(s.x - 150, s.y + 150, 60, [Karte.ART.PARKPLATZ, Karte.ART.GEHWEG]),
            radius: 7, frist: 95,
            text: L("Bring es zum Hafen — die Zeit läuft", "Take it to the docks — clock's running") }
        ]
      },
      {
        id: "autoklau",
        name: L("Wagen besorgen", "Steal a car"),
        kurz: L("Autoklau", "Car theft"),
        lohn: 900,
        marke: nah(-80, 50, 24),
        schritte: [
          { art: "fahren", ziel: platz(s.x - 140, s.y - 60, 50, [Karte.ART.PARKPLATZ]),
            radius: 6, imAuto: true,
            text: L("Such dir einen Wagen und setz dich rein", "Find a car and get behind the wheel") },
          { art: "fahren", ziel: platz(s.x + 120, s.y + 140, 50, [Karte.ART.PARKPLATZ]),
            radius: 7, imAuto: true, frist: 100,
            text: L("Ab in die Garage", "Get it to the garage") }
        ]
      },
      {
        id: "ueberfall",
        name: L("Der kleine Überfall", "The small job"),
        kurz: L("Ladenraub", "Store robbery"),
        lohn: 1600,
        marke: vor(kaufhaus),
        schritte: [
          { art: "drinnen", ziel: vor(kaufhaus), radius: 4, dauer: 7, fahndung: 2, beute: 400,
            text: L("Rein ins Kaufhaus", "Get inside the store"),
            drinText: L("Du bist drin — Kasse leeren …", "Inside — emptying the register …") },
          { art: "fahren", ziel: vor(kirche), radius: 8, frist: 110,
            text: L("Weg hier — bring die Beute zur Kirche", "Get out — take the loot to the church") }
        ]
      },
      {
        id: "bank",
        name: L("Die Bank", "The bank"),
        kurz: L("Bankraub", "Bank heist"),
        lohn: 3200,
        marke: vor(bank),
        schritte: [
          { art: "fahren", ziel: vor(waffe1), radius: 5,
            text: L("Erst Ausrüstung holen — ab zu Ammu-Vice", "Gear up first — head to Ammu-Vice") },
          { art: "drinnen", ziel: vor(bank), radius: 4, dauer: 11, fahndung: 3, beute: 1200,
            text: L("Jetzt die Bank", "Now the bank"),
            drinText: L("Tresor offen — nimm alles mit …", "Vault's open — take it all …") },
          { art: "abhaengen", halten: 100,
            text: L("Verschwinde und häng die Streifen ab", "Disappear and lose the cops") }
        ]
      },
      {
        id: "abhaengen",
        name: L("Abhängen", "Shake them off"),
        kurz: L("Flucht", "Escape"),
        lohn: 1300,
        marke: nah(110, -20, 26),
        schritte: [
          { art: "abhaengen", fahndung: 3, halten: 120,
            text: L("Häng die Streifen ab — fahr weit genug weg",
                    "Lose the cops — put some distance between you") }
        ]
      },
      {
        id: "runde",
        name: L("Drei Adressen", "Three addresses"),
        kurz: L("Sammeltour", "Collection run"),
        lohn: 1500,
        schritte: [
          { art: "sammeln", frist: 150,
            ziele: [vor(schule), vor(stadion), vor(tanke2)],
            text: L("Klappere die drei Adressen ab", "Hit all three addresses") }
        ],
        marke: nah(60, 90, 26)
      },
      {
        id: "schutzgeld",
        name: L("Schutzgeld", "Protection money"),
        kurz: L("Kassieren", "Collecting"),
        lohn: 1100,
        marke: vor(tanke1),
        schritte: [
          { art: "warten", ziel: vor(tanke1), radius: 4, dauer: 5,
            text: L("Kassier an der Tankstelle", "Collect at the gas station"),
            wartenText: L("Der Kassierer zahlt …", "The clerk is paying up …") },
          { art: "warten", ziel: vor(kaufhaus), radius: 4, dauer: 5, frist: 120,
            text: L("Weiter zum Kaufhaus", "On to the department store"),
            wartenText: L("Auch hier wird gezahlt …", "They're paying here too …") }
        ]
      },
      {
        id: "jagd",
        name: L("Die Verfolgung", "The chase"),
        kurz: L("Verfolgung", "Pursuit"),
        lohn: 2000,
        marke: nah(-30, 110, 26),
        schritte: [
          { art: "fahren", ziel: nah(-60, 130), radius: 6, imAuto: true,
            text: L("Setz dich in einen Wagen", "Get in a car") },
          { art: "jagen", frist: 120,
            text: L("Hol den Flüchtigen ein", "Catch the runaway") }
        ]
      },
      {
        id: "krankenfahrt",
        name: L("Notfall", "Emergency"),
        kurz: L("Notfall", "Emergency"),
        lohn: 1400,
        marke: nah(90, -90, 26),
        schritte: [
          { art: "fahren", ziel: nah(130, -130), radius: 5, imAuto: true,
            text: L("Hol den Verletzten ab", "Pick up the injured guy") },
          { art: "fahren", ziel: vor(klinik), radius: 7, imAuto: true, frist: 85,
            text: L("Fahr ihn in die Klinik — schnell", "Get him to the hospital — fast") }
        ]
      },

      /* ── Zweite Runde (25.09.2026) ── */
      {
        id: "rennen",
        name: L("Straßenrennen", "Street race"),
        kurz: L("Rennen", "Race"),
        lohn: 1800,
        marke: nah(40, -100, 26),
        schritte: [
          { art: "fahren", ziel: startlinie, radius: 6, imAuto: true,
            text: L("Hol dir einen Wagen und fahr an die Startlinie",
                    "Get a car and roll up to the start line") },
          { art: "strecke", imAuto: true, frist: 150, ziele: rennstrecke,
            text: L("Fahr alle Kontrollpunkte der Reihe nach ab",
                    "Hit every checkpoint in order") }
        ]
      },
      {
        id: "taxi",
        name: L("Taxi-Schicht", "Taxi shift"),
        kurz: L("Taxi", "Taxi"),
        lohn: 1000,
        marke: vor(club1),
        schritte: [
          { art: "fahren", ziel: vor(club1), radius: 7, imAuto: true,
            text: L(`Hol den Fahrgast vorm ${club1.name || "Club"} ab`,
                    `Pick up the fare outside ${club1.name || "the club"}`) },
          { art: "warten", ziel: vor(club1), radius: 7, dauer: 3, imAuto: true,
            text: L("Halt kurz an", "Pull over for a second"),
            wartenText: L("Der Fahrgast steigt ein …", "The fare gets in …") },
          { art: "fahren", ziel: vor(stadion), radius: 8, imAuto: true, frist: 95,
            text: L("Zum Stadion — er hat es eilig", "To the stadium — he's in a hurry") },
          { art: "fahren", ziel: vor(kirche), radius: 8, imAuto: true, frist: 95,
            text: L("Nächste Fahrt: eine Dame will zur Kirche", "Next fare: a lady wants the church") }
        ]
      },
      {
        id: "denkzettel",
        name: L("Denkzettel", "A little message"),
        kurz: L("Zerstören", "Wreck it"),
        lohn: 1500,
        marke: platz(tanke2.x + 10, tanke2.y + 10, 20),
        schritte: [
          { art: "zerstoeren", typ: "luxuscabrio",
            ziel: platz(tanke2.x, tanke2.y, 30, [Karte.ART.PARKPLATZ, Karte.ART.STRASSE]),
            text: L("Der Konkurrent parkt an der Tankstelle — mach seinen Wagen kaputt",
                    "The rival parked at the gas station — wreck his car") },
          { art: "abhaengen", fahndung: 2, halten: 120,
            text: L("Das hat jemand gesehen — häng die Polizei ab",
                    "Someone saw that — lose the cops") }
        ]
      },
      {
        id: "schulden",
        name: L("Schulden eintreiben", "Debt collection"),
        kurz: L("Eintreiben", "Collect"),
        lohn: 1200,
        marke: vor(kirche),
        schritte: [
          { art: "ausschalten", figur: "mann_anzug", ziel: vor(kaufhaus),
            text: L("Der Schuldner treibt sich am Kaufhaus rum — schnapp ihn dir",
                    "The debtor hangs around the department store — get him") },
          { art: "fahren", ziel: vor(kirche), radius: 6, frist: 120,
            text: L("Bring das Geld zur Kirche", "Bring the money to the church") }
        ]
      },
      {
        id: "tankraub",
        name: L("24/7-Überfall", "24/7 hold-up"),
        kurz: L("Überfall", "Hold-up"),
        lohn: 1400,
        marke: platz(markt.x + 9, markt.y + 4, 14),
        schritte: [
          { art: "aktion", aktion: "kasse", ziel: markt, radius: 3,
            text: L("Rein in den 24/7 und die Kasse leeren", "Get into the 24/7 and empty the till") },
          { art: "abhaengen", halten: 120,
            text: L("Raus und die Polizei abhängen", "Get out and lose the cops") }
        ]
      },
      {
        id: "akte",
        name: L("Die Krankenakte", "The medical file"),
        kurz: L("Akte", "File"),
        lohn: 1100,
        marke: platz(klinikTuer.x - 9, klinikTuer.y + 4, 14),
        schritte: [
          { art: "aktion", aktion: "akte", ziel: klinikTuer, radius: 3,
            text: L("In der Klinik liegt eine Akte im Aktenschrank — hol sie",
                    "There's a file in the clinic's filing cabinet — grab it") },
          { art: "fahren", ziel: vor(wache), radius: 6, frist: 110,
            text: L("Der Informant wartet vor der Wache", "The informant is waiting outside the station") }
        ]
      },
      {
        id: "schmuggel",
        name: L("Kisten vom Hafen", "Crates from the docks"),
        kurz: L("Schmuggel", "Smuggling"),
        lohn: 1700,
        marke: nah(-120, 120, 26),
        schritte: [
          { art: "sammeln", frist: 130, ziele: kisten,
            text: L("Sammle die drei Kisten am Hafen ein", "Collect the three crates at the docks") },
          { art: "fahren", ziel: ammuTuer, radius: 5, frist: 120,
            text: L("Ab damit zu Ammu-Vice", "Take them to Ammu-Vice") }
        ]
      },
      {
        id: "vip",
        name: L("VIP-Chauffeur", "VIP chauffeur"),
        kurz: L("Chauffeur", "Chauffeur"),
        lohn: 1100,
        marke: vor(club2),
        schritte: [
          { art: "fahren", ziel: vor(club2), radius: 7, imAuto: true, typen: SCHICK,
            text: L(`Fahr mit etwas Schickem vor den ${club2.name || "Club"} — Limousine, Cabrio, Oldtimer`,
                    `Pull up at ${club2.name || "the club"} in something classy — limo, convertible, classic`) },
          { art: "warten", ziel: vor(club2), radius: 7, dauer: 3, imAuto: true,
            text: L("Warte auf den Star", "Wait for the star"),
            wartenText: L("Der Star steigt ein …", "The star gets in …") },
          { art: "fahren", ziel: strandparty, radius: 9, imAuto: true, frist: 110,
            text: L("Zur Party am Strand", "To the beach party") }
        ]
      },
      {
        id: "sportwagen",
        name: L("Bestellung: Sportwagen", "Order: sports car"),
        kurz: L("Sportwagen", "Sports car"),
        lohn: 1300,
        marke: nah(100, 40, 26),
        schritte: [
          { art: "fahren", ziel: garage, radius: 7, imAuto: true, typen: SPORTLICH,
            text: L("Besorg einen Sportwagen (Sunset GT, Sunset Wedge, Leonida Muscle) und ab in die Garage",
                    "Get a sports car (Sunset GT, Sunset Wedge, Leonida Muscle) into the garage") }
        ]
      },
      {
        id: "coup",
        name: L("Der große Coup", "The big score"),
        kurz: L("Coup", "Score"),
        lohn: 6000,
        ab: 8,
        marke: platz(bankTuer.x + 10, bankTuer.y + 6, 16),
        schritte: [
          { art: "fahren", ziel: ammuTuer, radius: 5,
            text: L("Erst zu Ammu-Vice — deck dich ein", "Hit Ammu-Vice first — stock up") },
          { art: "aktion", aktion: "schalter", ziel: bankTuer, radius: 3,
            text: L("Jetzt die Bank: rein und den Schalter ausräumen",
                    "Now the bank: get in and clean out the counter") },
          { art: "abhaengen", fahndung: 4, halten: 170,
            text: L("Vier Sterne — häng sie ab", "Four stars — shake them") },
          { art: "fahren", ziel: vor(kirche), radius: 7,
            text: L("Versteck die Beute bei der Kirche", "Stash the loot at the church") }
        ]
      }
    ];
  }

  get laeuft() { return this.aktiv !== null; }

  aktuellerSchritt() {
    return this.aktiv ? this.aktiv.schritte[this.schritt] : null;
  }

  starten(m, zustand) {
    this.aktiv = m;
    this.schritt = 0;
    this.zeit = 0;
    this.stand = {};                 // Zustand des laufenden Schritts
    this.schrittBeginnen(zustand);
    this.meldung = m.name;
  }

  /* Was ein Schritt beim Beginn braucht: Sterne, Ziele, Zielauto, Person */
  schrittBeginnen(zustand) {
    const s = this.aktuellerSchritt();
    if (!s) return;
    if (s.fahndung && s.art !== "drinnen" && s.art !== "abhaengen") zustand.fahndung.melden(s.fahndung);
    if (s.art === "sammeln") this.stand.offen = s.ziele.map(() => true);
    if (s.art === "strecke") this.stand.k = 0;
    if (s.art === "jagen") this.fluechtigenWaehlen(zustand);
    if (s.art === "zerstoeren") {
      const a = new Fahrzeug(s.typ || "limo", s.ziel.x, s.ziel.y, Math.random() * Math.PI * 2);
      a.missionsZiel = true;
      zustand.autos.push(a);
      this.zielAuto = a;
    }
    if (s.art === "ausschalten") {
      const p = new Passant(s.figur || "mann_anzug", s.ziel.x, s.ziel.y);
      p.zielperson = true;
      zustand.passanten.push(p);
      this.zielPerson = p;
    }
  }

  aufraeumen() {
    if (this.zielAuto) this.zielAuto.missionsZiel = false;
    if (this.zielPerson) this.zielPerson.zielperson = false;
    this.zielAuto = null;
    this.zielPerson = null;
    this.fluechtiger = null;
  }

  abbrechen(grund) {
    this.aufraeumen();
    this.aktiv = null;
    this.stand = {};
    this.meldung = grund || "";
  }

  /* innen.js/spiel.js melden, was drinnen getan wurde */
  wartetAuf(art) {
    const s = this.aktuellerSchritt();
    return !!(s && s.art === "aktion" && s.aktion === art);
  }

  aktionMelden(art) {
    if (this.wartetAuf(art)) this.stand.erledigt = true;
  }

  /* Zusätzliche Ziele für Schüsse: das Auto, das kaputt soll */
  zusatzZiele() {
    const a = this.zielAuto;
    if (!a) return [];
    if (!this._autoZiel || this._autoZiel.auto !== a) {
      this._autoZiel = {
        auto: a, istAuto: true, trefferRadius: 1.9,
        get x() { return a.x; },
        get y() { return a.y; },
        get tot() { return a.schaden >= 110; },
        treffer(schaden) { a.schaden = Math.min(130, a.schaden + schaden * 0.9); return a.schaden >= 110; }
      };
    }
    return [this._autoZiel];
  }

  /* Erscheint der Auftrag schon? */
  offen(m) {
    return !this.erledigt.has(m.id) && (!m.ab || this.erledigt.size >= m.ab);
  }

  fertig(zustand) {
    const m = this.aktiv;
    /* Faktor aus der Admin-Seite (Wochenend-Aktion o. ä.) */
    const lohn = m.lohn * (this.geldFaktor || 1);
    zustand.geld += lohn;
    this.erledigt.add(m.id);
    this.meldung = L("Geschafft: ", "Done: ") + m.name + "  +$" + lohn;
    this.geschafft = 2.4;
    this.aufraeumen();
    this.aktiv = null;
    this.stand = {};
  }

  /* Ein Auto aus dem Verkehr, das weit genug weg ist, wird zum Flüchtigen */
  fluechtigenWaehlen(zustand) {
    const pos = zustand.figuren[zustand.aktiv];
    let beste = null;
    for (const a of zustand.verkehr) {
      if (a.fahrer) continue;
      const d = Math.hypot(a.x - pos.x, a.y - pos.y);
      if (d < 40 || d > 160) continue;
      if (!beste || d < beste.d) beste = { a, d };
    }
    this.fluechtiger = beste ? beste.a : null;
    if (this.fluechtiger) this.fluechtiger.wunschTempo = 20;
  }

  /* dt, Spielerfigur, gesamter Spielzustand */
  rechnen(dt, spieler, zustand) {
    if (this.geschafft > 0) this.geschafft = Math.max(0, this.geschafft - dt);
    const pos = spieler.imAuto || spieler;

    if (!this.aktiv) {
      for (const m of this.liste) {
        if (!this.offen(m)) continue;
        if (Math.hypot(m.marke.x - pos.x, m.marke.y - pos.y) < 4.5) {
          this.starten(m, zustand);
          break;
        }
      }
      return;
    }

    const s = this.aktuellerSchritt();
    this.zeit += dt;

    if (s.frist && this.zeit > s.frist) {
      this.abbrechen(L("Zeit abgelaufen", "Out of time"));
      return;
    }

    switch (s.art) {
      case "drinnen":   this.drinnenRechnen(dt, spieler, zustand, s); break;
      case "warten":    this.wartenRechnen(dt, pos, zustand, s, spieler); break;
      case "strecke":   this.streckeRechnen(pos, spieler, zustand, s); break;
      case "aktion":    if (this.stand.erledigt) this.weiter(zustand); break;
      case "zerstoeren": this.zerstoerenRechnen(zustand); break;
      case "ausschalten": this.ausschaltenRechnen(pos, zustand); break;
      case "sammeln":   this.sammelnRechnen(pos, zustand, s); break;
      case "jagen":     this.jagenRechnen(pos, zustand, s); break;
      case "abhaengen": this.abhaengenRechnen(dt, zustand, s); break;
      default:          this.fahrenRechnen(pos, spieler, zustand, s);
    }
  }

  fahrenRechnen(pos, spieler, zustand, s) {
    if (!s.ziel) return;
    if (Math.hypot(s.ziel.x - pos.x, s.ziel.y - pos.y) > s.radius) return;
    if (s.imAuto && !spieler.imAuto) return;
    if (s.typen && !(spieler.imAuto && s.typen.includes(spieler.imAuto.typ))) {
      this.stand.falsch = true;                       // Anzeige sagt es dazu
      return;
    }
    this.weiter(zustand);
  }

  /* Rennen: immer nur der nächste Punkt zählt */
  streckeRechnen(pos, spieler, zustand, s) {
    if (s.imAuto && !spieler.imAuto) return;
    const z = s.ziele[this.stand.k || 0];
    if (!z) { this.weiter(zustand); return; }
    if (Math.hypot(z.x - pos.x, z.y - pos.y) < 8) {
      this.stand.k = (this.stand.k || 0) + 1;
      if (this.stand.k >= s.ziele.length) this.weiter(zustand);
    }
  }

  zerstoerenRechnen(zustand) {
    const a = this.zielAuto;
    if (!a) { this.weiter(zustand); return; }
    if (a.schaden >= 110) {
      a.schrott = true;
      this.weiter(zustand);
    }
  }

  /* Die Zielperson rennt davon, sobald man ihr zu nahe kommt */
  ausschaltenRechnen(pos, zustand) {
    const p = this.zielPerson;
    if (!p) { this.weiter(zustand); return; }
    if (p.tot || p.ko > 0) { this.weiter(zustand); return; }
    const d = Math.hypot(p.x - pos.x, p.y - pos.y);
    if (d < 11 && p.flucht <= 0) {
      p.ziel = Math.atan2(p.y - pos.y, p.x - pos.x);
      p.flucht = 2.5;
      p.kreuzen = null;
    }
  }

  wartenRechnen(dt, pos, zustand, s, spieler) {
    const nah = Math.hypot(s.ziel.x - pos.x, s.ziel.y - pos.y) < s.radius &&
                (!s.imAuto || (spieler && spieler.imAuto));
    this.stand.gewartet = nah ? (this.stand.gewartet || 0) + dt : 0;
    if (this.stand.gewartet >= s.dauer) this.weiter(zustand);
  }

  /* Überfall: Der Spieler verschwindet im Gebäude, die Uhr läuft, danach
     steht er wieder draußen — mit Beute und der Polizei im Nacken. */
  drinnenRechnen(dt, spieler, zustand, s) {
    if (!zustand.drinnen) {
      const pos = spieler.imAuto || spieler;
      if (Math.hypot(s.ziel.x - pos.x, s.ziel.y - pos.y) > s.radius) return;
      if (spieler.imAuto) return;                       // zu Fuß hineingehen
      zustand.drinnen = { rest: s.dauer, text: s.drinText, x: spieler.x, y: spieler.y };
      return;
    }
    zustand.drinnen.rest -= dt;
    if (zustand.drinnen.rest > 0) return;
    zustand.drinnen = null;
    if (s.beute) zustand.geld += s.beute;
    if (s.fahndung) zustand.fahndung.melden(s.fahndung);
    this.weiter(zustand);
  }

  sammelnRechnen(pos, zustand, s) {
    if (!this.stand.offen) this.stand.offen = s.ziele.map(() => true);
    s.ziele.forEach((z, k) => {
      if (!this.stand.offen[k]) return;
      if (Math.hypot(z.x - pos.x, z.y - pos.y) < 6) this.stand.offen[k] = false;
    });
    if (!this.stand.offen.some(Boolean)) this.weiter(zustand);
  }

  jagenRechnen(pos, zustand, s) {
    if (!this.fluechtiger) { this.fluechtigenWaehlen(zustand); return; }
    const f = this.fluechtiger;
    f.wunschTempo = 22;
    if (Math.hypot(f.x - pos.x, f.y - pos.y) < 6) this.weiter(zustand);
  }

  /* Abhängen: Der Stern muss weg. Zusätzlich zählt der Abstand — wer weit
     genug weg ist, hat es geschafft, auch wenn die Fahndung noch tickt.
     Vorher konnte man drei Minuten fahren, ohne dass etwas passierte. */
  abhaengenRechnen(dt, zustand, s) {
    if (s.fahndung && !this.stand.gestartet) {
      this.stand.gestartet = true;
      if (zustand.fahndung.stufe < s.fahndung) {
        zustand.fahndung.melden(s.fahndung - zustand.fahndung.stufe);
      }
    }
    if (zustand.fahndung.stufe === 0) { this.fertig(zustand); return; }
    if (s.halten && this.zeit > s.halten) {
      this.abbrechen(L("Zu lange gebraucht", "Took too long"));
    }
  }

  weiter(zustand) {
    this.schritt++;
    this.zeit = 0;
    this.stand = {};
    if (this.schritt >= this.aktiv.schritte.length) { this.fertig(zustand); return; }
    this.schrittBeginnen(zustand);
  }

  /* Text für die Anzeige */
  anzeige(zustand) {
    if (!this.aktiv) return this.meldung;
    const s = this.aktuellerSchritt();
    let text = s.text;
    if (zustand && zustand.drinnen && s.art === "drinnen") {
      text = `${s.drinText}  ${Math.ceil(zustand.drinnen.rest)}s`;
    }
    if (s.art === "warten" && this.stand.gewartet) {
      text = `${s.wartenText}  ${Math.ceil(s.dauer - this.stand.gewartet)}s`;
    }
    if (s.art === "sammeln" && this.stand.offen) {
      const fehlt = this.stand.offen.filter(Boolean).length;
      text += L(`  · noch ${fehlt}`, `  · ${fehlt} left`);
    }
    if (s.art === "strecke") text += `  · ${(this.stand.k || 0) + 1}/${s.ziele.length}`;
    if (this.stand.falsch) text += L("  · falscher Wagen!", "  · wrong car!");
    if (s.art === "zerstoeren" && this.zielAuto) {
      text += `  · ${Math.min(100, Math.round(this.zielAuto.schaden / 1.1))}%`;
    }
    if (s.frist) text += `  ⏱ ${Math.max(0, Math.ceil(s.frist - this.zeit))}s`;
    if (s.art === "abhaengen" && zustand) {
      text += "  " + "★".repeat(zustand.fahndung.stufe);
    }
    return text;
  }

  /* Alle Ziele des laufenden Schritts (für Karte und Ringe) */
  zielPunkte() {
    if (!this.aktiv) return [];
    const s = this.aktuellerSchritt();
    if (!s) return [];
    if (s.art === "sammeln") {
      return s.ziele
        .filter((z, k) => !this.stand.offen || this.stand.offen[k])
        .map(z => ({ x: z.x, y: z.y, r: 6 }));
    }
    if (s.art === "jagen") {
      return this.fluechtiger ? [{ x: this.fluechtiger.x, y: this.fluechtiger.y, r: 5 }] : [];
    }
    if (s.art === "abhaengen") return [];
    if (s.art === "strecke") {
      const z = s.ziele[this.stand.k || 0];
      return z ? [{ x: z.x, y: z.y, r: 8 }] : [];
    }
    if (s.art === "zerstoeren" && this.zielAuto) return [{ x: this.zielAuto.x, y: this.zielAuto.y, r: 4 }];
    if (s.art === "ausschalten" && this.zielPerson) return [{ x: this.zielPerson.x, y: this.zielPerson.y, r: 2.4 }];
    return s.ziel ? [{ x: s.ziel.x, y: s.ziel.y, r: s.radius || 5 }] : [];
  }

  /* Ziele und freie Marken zeichnen */
  zeichnen(ctx, kamera, zeit) {
    const punkte = this.aktiv
      ? this.zielPunkte().map(p => ({ ...p, farbe: "#39d4ff" }))
      : this.liste.filter(m => this.offen(m))
          .map(m => ({ x: m.marke.x, y: m.marke.y, r: 2.6, farbe: "#ffd24a" }));

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

  /* Punkte für Minikarte und große Karte */
  marken() {
    if (this.aktiv) {
      return this.zielPunkte().map(p => ({
        x: p.x, y: p.y, farbe: "#39d4ff", art: "ziel",
        name: L("Aktuelles Ziel", "Current target")
      }));
    }
    return this.liste
      .filter(m => this.offen(m))
      .map(m => ({
        x: m.marke.x, y: m.marke.y, farbe: "#ffd24a", art: "auftrag",
        name: m.name + " · $" + m.lohn
      }));
  }
}
