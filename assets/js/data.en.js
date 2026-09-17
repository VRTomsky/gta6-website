/* ═══════════════════════════════════════════════════════════
   Englische Fassung der Inhalte aus data.js

   Greift nur, wenn die Seite auf Englisch steht (siehe i18n.js).
   Die deutschen Objekte bleiben die Grundlage: hier werden nur die
   Textfelder überschrieben. Bildpfade stehen ausschließlich in
   data.js, damit sie nicht doppelt gepflegt werden müssen.

   Fehlt hier eine Übersetzung — etwa für eine neu ergänzte Figur —,
   bleibt einfach der deutsche Text stehen. Nichts geht kaputt.

   Bildunterschriften der Akten stehen als Liste in derselben
   Reihenfolge wie die Bildpaare in data.js.
   ═══════════════════════════════════════════════════════════ */
(function () {
"use strict";
if (window.LANG !== "en") return;

/* ── Charaktere ─────────────────────────────────────────── */
const CHARS_EN = {
  jason: {
    tag: "Protagonist",
    sub: "Ex-Army · Leonida Keys",
    bio: [
      "Jason wants a simple life — but nothing ever seems to get simpler. Raised among hustlers and petty criminals, he joined the Army to leave a rough youth behind, then drifted down to the Keys to do what he’s good at: running jobs for the local drug couriers.",
      "Meeting Lucia may turn out to be the best thing that ever happened to him — or the worst. Jason has a fairly clear idea of how he wants it to go, but for now it’s anyone’s guess. Maybe it’s time for a change."
    ],
    meta: [["Age", "28–32"], ["Base", "Leonida Keys"], ["Background", "US Army"], ["Relationship", "Lucia Caminos"], ["Role", "Playable"]]
  },
  lucia: {
    tag: "Protagonist",
    sub: "Ex-con · Vice City",
    bio: [
      "Lucia’s father taught her to fight as soon as she could walk, and life has been hitting back ever since. Standing up for her family landed her in Leonida Penitentiary; sheer luck got her out. She has learned her lesson — smart moves only from now on.",
      "Fresh out of prison and determined to tip the odds her way, Lucia is sticking to her plan whatever it costs. A life with Jason could be her way out."
    ],
    meta: [["Age", "24–27"], ["Base", "Vice City"], ["Background", "Leonida Penitentiary"], ["Relationship", "Jason Duval"], ["Role", "Playable"]]
  },
  cal: {
    tag: "Jason’s buddy",
    quote: "The radio never lies.",
    sub: "Police scanner · Paranoia",
    bio: [
      "Cal is Jason’s friend and never happier than when he’s alone with his police scanner. Want to know where a patrol car is parked, which channel is being monitored or where a deal can go down undisturbed? Ask Cal.",
      "The catch: his theories come free with every answer — about the government, about what’s flying over Leonida and about who supposedly pulls the strings. He’s useful all the same."
    ],
    meta: [["Age", "27–32"], ["Base", "Leonida Keys"], ["Specialty", "Radio & electronics"], ["Connection", "Jason"], ["Role", "Supporting character"]]
  },
  boobie: {
    tag: "Entrepreneur",
    quote: "From the corner to the deed.",
    sub: "Vice City · Business",
    bio: [
      "Boobie did his time on the streets and turned the hustle into something that lasts: a club, a recording studio, real estate. Anyone in Vice City who needs to park some money knows his name.",
      "He’s no longer the one doing the dirty work himself — but he still knows exactly how it’s done. And anyone who owes him finds that out fast."
    ],
    meta: [["Age", "38–45"], ["Base", "Vice City"], ["Business", "Club & studio"], ["Network", "Dre'Quan Priest"], ["Role", "Supporting character"]]
  },
  drequan: {
    tag: "Label boss",
    sub: "Music · Only Raw Records",
    bio: [
      "Dre'Quan came up through home-made beats and mixtapes and now runs his own label, Only Raw Records. His goal is simple: land a real hit before somebody else beats him to it.",
      "Signed to him: Real Dimez. If Bae-Luxe and Roxy strike again, Dre'Quan gains the most — and he has the most to lose if they don’t."
    ],
    meta: [["Age", "28–33"], ["Base", "Vice City"], ["Label", "Only Raw Records"], ["Act", "Real Dimez"], ["Role", "Supporting character"]]
  },
  dimez: {
    tag: "Duo",
    sub: "Bae-Luxe & Roxy",
    bio: [
      "Bae-Luxe and Roxy, together Real Dimez, have been friends since high school — smart enough to turn their days of hustling local dealers into cash through raunchy rap tracks and a social media presence that never sleeps.",
      "An early hit with rapper DWNPLY took them all the way up. Five years and plenty of trouble later, they’re signed to Only Raw Records and hoping lightning strikes twice."
    ],
    meta: [["Age", "25–29"], ["Base", "Vice City"], ["Label", "Only Raw Records"], ["Feature", "DWNPLY"], ["Role", "Supporting characters"]]
  },
  raul: {
    tag: "Bank robber",
    sub: "Port Gellhorn · Crew",
    bio: [
      "Confidence, charm and cunning — Raul is a seasoned bank robber, always on the lookout for people willing to take the biggest risks for the biggest payouts.",
      "His recklessness raises the stakes with every job. Sooner or later his crew will have to decide: double down, or take their chips off the table."
    ],
    meta: [["Age", "45–55"], ["Region", "Port Gellhorn"], ["Specialty", "Bank robberies"], ["Trait", "Too much risk"], ["Role", "Supporting character"]]
  },
  brian: {
    tag: "Smuggler",
    sub: "Boatyard · Leonida Keys",
    bio: [
      "Brian is an old-school drug smuggler from the golden age of trafficking in the Keys. With his third wife, Lori, he still moves product through his boatyard — he just lets other people do the dirty work these days.",
      "He looks like a Leonida beach bum but moves like a great white shark. Jason lives rent-free in one of his properties, as long as he helps out with local scams and drops by now and then for Lori’s sangria."
    ],
    meta: [["Age", "55–65"], ["Base", "Leonida Keys"], ["Business", "Boatyard"], ["Landlord to", "Jason"], ["Role", "Supporting character"]]
  }
};
CHARS.forEach(c => { if (CHARS_EN[c.id]) Object.assign(c, CHARS_EN[c.id]); });

/* ── Orte ───────────────────────────────────────────────── */
const PLACES_EN = {
  "vice-city": {
    sub: "The metropolis",
    badge: "Leonida · Coast",
    text: "Neon-soaked boulevards, Art Deco facades along the beach and, behind them, towers of glass and money. Vice City sells sunshine, music and the fast climb to the top — and charges you everything you’ve got. Whoever makes it up here rarely played it clean on the way."
  },
  "leonida-keys": {
    sub: "The island chain",
    badge: "South · Water",
    text: "A string of islands tied together by a single long road. Bars with crooked roofs, boat docks, sandbars — and beneath it all the smuggling routes Brian Heder has been working for decades. Jason’s home and Leonida’s back door at the same time."
  },
  "grassrivers": {
    sub: "The swamps",
    badge: "Inland · Wetland",
    text: "Endless sawgrass, airboats, alligators and a handful of houses on stilts. Things disappear in Grassrivers — cargo, vehicles, occasionally people. This is where Leonida stops being a postcard."
  },
  "port-gellhorn": {
    sub: "The old coastal town",
    badge: "Gulf Coast · Boardwalk",
    text: "A beach town whose best years are long gone: faded motel signs, a boardwalk with half-working rides, shops that haven’t been renovated since the eighties. Which makes it perfect for people like Raul Bautista."
  },
  "ambrosia": {
    sub: "The small town",
    badge: "Inland · Industry",
    text: "Silos, trailer parks, a diner on the road out of town. Ambrosia lives off farming and whatever comes after the work dries up. Far enough from Vice City that nobody’s watching — close enough that everything ends up here."
  },
  "mount-kalaga": {
    sub: "The national park",
    badge: "North · Wilderness",
    text: "Forest, fog and elevation — the opposite of the coast. Mount Kalaga National Park is the most remote corner of Leonida: hiking trails, cabins, dead zones. Perfect for getting away from it all. Or for hiding."
  }
};
PLACES.forEach(p => { if (PLACES_EN[p.id]) Object.assign(p, PLACES_EN[p.id]); });

/* ── Ultimate Edition ───────────────────────────────────── */
/* Gleiche Reihenfolge wie ULTIMATE in data.js; null = Titel bleibt */
const ULTIMATE_EN = [
  [null, "Vehicle · Retro livery"],
  [null, "Hawk & Little · Weapon pair"],
  ["Weapon Variants", "Exclusive finishes"],
  [null, "Outfits for Jason & Lucia"],
  [null, "Shop · Hair & make-up"],
  [null, "Shop · Tuning"],
  [null, "Shop · Fashion"],
  [null, "Shop · Tattoos"],
  [null, "Shop · Bar"],
  ["Safehouse Vehicles", "Starter garage"],
  [null, "Boat"],
  [null, "Off-road"],
  [null, "Vehicle build"],
  [null, "Collection"],
  [null, "Gear"],
  [null, "Shop · Accessories"]
];
ULTIMATE.forEach((u, i) => {
  const en = ULTIMATE_EN[i];
  if (!en) return;
  if (en[0]) u.t = en[0];
  if (en[1]) u.s = en[1];
});

/* ── X / Twitter ────────────────────────────────────────── */
const XACCOUNTS_EN = {
  "@RockstarGames": "Official account — news lands here first",
  "@GTA6Alerts":    "Fan feed · News, clips, community",
  "@_GTAVI_":       "Fan feed · GTA VI news",
  "@GTA6NewsHub":   "Fan feed · News & leaks",
  "@GTASNEWSLEAKS": "Fan feed · Leak aggregator"
};
XACCOUNTS.forEach(a => { if (XACCOUNTS_EN[a.h]) a.d = XACCOUNTS_EN[a.h]; });

/* ── Galerie ────────────────────────────────────────────── */
const GALLERY_EN = {
  "chars/jason_07.jpg": "Jason behind a chain-link fence, police lights at his back",
  "chars/jason_08.jpg": "Jason with a pistol by a boat in the Leonida Keys",
  "chars/lucia_07.jpg": "Lucia with a shotgun during a chase",
  "chars/lucia_08.jpg": "Lucia outside a currency exchange in Vice City",
  "chars/lucia_10.jpg": "Lucia in the car, neon light on her face",
  "duo/duo_01.jpg": "Jason and Lucia at the harbor, the Vice City skyline behind them",
  "duo/duo_02.jpg": "Jason and Lucia armed inside a vault",
  "duo/duo_03.jpg": "Lucia leaning on the car door, Jason at the wheel",
  "duo/duo_04.jpg": "Shootout in a nail salon",
  "duo/duo_05.jpg": "Nighttime meeting in a back courtyard",
  "duo/duo_06.jpg": "Jason at the wheel, Lucia with her gun drawn",
  "duo/duo_07.jpg": "Lucia on a car hood in turquoise neon light",
  "duo/duo_08.jpg": "Jason and Lucia in front of a burning wreck at sunset",
  "duo/duo_09.jpg": "Motorcycle chase with a patrol car on their tail",
  "duo/duo_10.jpg": "Lucia on a rooftop terrace above the night skyline",
  "duo/duo_11.jpg": "Jason and Lucia in a convertible on the coast",
  "duo/duo_12.jpg": "Jason armed in the half-light",
  "duo/duo_13.jpg": "Jason and Lucia backlit by the sunset"
};
GALLERY.forEach(g => {
  const eigen = GALLERY_EN[g.src.replace("assets/img/", "")];
  if (eigen) g.cap = eigen;
  else g.cap = g.cap.replace(/^Charakter /, "Character ");
});

const GAL_CATS_EN = { all: "All", chars: "Characters", art: "Artwork" };
GAL_CATS.forEach(c => { if (GAL_CATS_EN[c.id]) c.label = GAL_CATS_EN[c.id]; });

/* ── Charakter-Akten ────────────────────────────────────── */
const nummeriert = (name, n) => Array.from({ length: n }, (_, i) => `${name} — image ${i + 1}`);

const CHAR_PAGES_EN = {
  jason: {
    kicker: "Protagonist 01",
    lead: "Jason wants a simple life — but it just won’t get any simpler.",
    intro: [
      "He grew up among hustlers and petty criminals. After a stint in the Army meant to leave that rough youth behind, he ended up in the Keys doing what he does best: working for the local drug couriers.",
      "Maybe it’s time to try something new."
    ],
    introShots: ["Jason by a boat in the Leonida Keys", "Jason and Lucia in a convertible on the coast", "Jason on the porch"],
    band: {
      pink: "Another day in paradise, right?",
      body: "Meeting Lucia could be the best or the worst thing that ever happened to him. Jason has a pretty clear idea of how he’d like it to go — but right now it’s hard to say where this is heading."
    },
    bandShots: ["Jason at the wheel, Lucia in the passenger seat", "Jason in Vice City"],
    fullAlt: "Jason behind a chain-link fence, the lights of the patrol cars at his back",
    fullCap: "Leonida Keys · the night it all tips over",
    quote2: "From a simple job<br>to the point of no return.",
    band2: {
      body: "A simple score goes wrong — and suddenly Jason is caught in a conspiracy that stretches across the whole state. There’s no going back.",
      pink: "He knows how he’d like it to go. Nobody’s asking him right now."
    },
    gallery: ["Jason Duval — portrait", "Jason on the beach", "Jason at the motel", "Jason at night", "A robbery for two", "Motorcycle chase", "Jason armed in the half-light", "Jason and Lucia at the motel"],
    outro: ["Jason and Lucia at the Vice City harbor", "Jason and Lucia in front of a burning wreck"]
  },

  lucia: {
    kicker: "Protagonist 02",
    lead: "Lucia’s father taught her to fight as soon as she could walk.",
    intro: [
      "Life has been hitting back ever since. Fighting for her family landed her in Leonida Penitentiary. Pure luck got her out again.",
      "Lucia has learned her lesson — only smart moves from now on."
    ],
    introShots: ["Lucia in the car, neon light on her face", "Lucia with a shotgun during a chase", "Lucia in Vice City"],
    band: {
      pink: "A life with Jason could be her way out.",
      body: "Fresh out of prison and determined to turn the odds in her favor, Lucia is sticking to her plan — whatever it takes."
    },
    bandShots: ["Lucia outside a currency exchange", "Lucia and Jason in the car by day"],
    fullAlt: "Lucia on a rooftop terrace above the Vice City skyline at night",
    fullCap: "Vice City · everything she ever wanted, one floor too high",
    quote2: "She doesn’t want to dream.<br>She wants to take it.",
    band2: {
      body: "More than anything, Lucia wants the good life her mother has talked about since their days in Liberty City. Instead of half-baked fantasies, she takes matters into her own hands.",
      pink: "Only smart moves. From here on."
    },
    gallery: ["Lucia Caminos — portrait", "Lucia on the beach", "Lucia at the club", "Lucia at night", "Lucia on the street", "Lucia and Jason in the vault", "Lucia in neon light", "Meeting in the back courtyard"],
    outro: ["Lucia and Jason at sunset", "Lucia and Jason — artwork"]
  },

  cal: {
    kicker: "Supporting character",
    lead: "Cal is happiest when he’s alone with his police scanner.",
    intro: [
      "Want to know where a patrol car is parked, which channel is being monitored or where a deal can go down undisturbed? Ask Cal.",
      "The price: his theories come included."
    ],
    introShots: ["Cal at his radio", "Cal in the Leonida Keys"],
    quote1: "The radio never lies.",
    band: {
      pink: "About the government. About what’s flying over Leonida.",
      body: "And about who supposedly really runs things. He’s still useful — Jason listens because in the end it usually pays off."
    },
    bandShots: ["Cal in the half-light"],
    fullAlt: "Cal Hampton at his police scanner",
    fullCap: "Leonida Keys · channel open, door shut",
    quote2: "He hears everything.<br>He believes almost all of it.",
    band2: {
      body: "Cal isn’t a fighter and has no wish to be one. His contribution comes through frequencies, cables and the patience to listen for hours.",
      pink: "Jason’s oldest friend — and his most reliable head start."
    },
    gallery: nummeriert("Cal Hampton", 4),
    outro: ["Jason and Lucia on the beach"]
  },

  boobie: {
    kicker: "Supporting character",
    lead: "Boobie did his time on the streets — and turned the hustle into something that lasts.",
    intro: [
      "A club, a recording studio, real estate. Anyone in Vice City who needs to park some money knows him.",
      "He doesn’t do the dirty work himself anymore. He just knows exactly how it works."
    ],
    introShots: ["Boobie Ike in his club", "Boobie Ike in Vice City"],
    quote1: "From the corner to the deed.",
    band: {
      pink: "Anyone who owes him finds out fast.",
      body: "His network runs from Dre'Quan Priest’s label into corners of the city where nobody asks questions."
    },
    bandShots: ["Boobie Ike at night"],
    fullAlt: "Boobie Ike in his Vice City club",
    fullCap: "Vice City · club, studio, property deeds",
    quote2: "The street stays the street.<br>Only the bank balance changes.",
    band2: {
      body: "Boobie invests in people, not ideas. Whoever starts out with him works first and talks later.",
      pink: "His business runs quietly. That’s the whole point."
    },
    gallery: nummeriert("Boobie Ike", 4),
    outro: ["Jason and Lucia — artwork"]
  },

  drequan: {
    kicker: "Supporting character",
    lead: "Dre'Quan came up on home-made beats — and now runs his own label.",
    intro: [
      "Only Raw Records. His goal is simple: land a real hit before somebody else beats him to it.",
      "Signed to him: Real Dimez."
    ],
    introShots: ["Dre'Quan Priest in the studio", "Dre'Quan Priest in Vice City"],
    band: {
      pink: "One hit stands between him and everything.",
      body: "If Bae-Luxe and Roxy strike again, Dre'Quan gains the most — and has the most to lose if they don’t."
    },
    bandShots: ["Dre'Quan Priest at a show"],
    fullAlt: "Dre'Quan Priest in the Only Raw Records studio",
    fullCap: "Vice City · everything riding on one record",
    quote2: "He filled the venue.<br>Now he needs the charts.",
    band2: {
      body: "Between the studio, Boobie Ike’s money and the city’s expectations, Dre'Quan has little room for a second shot.",
      pink: "Mixtapes were the easy part."
    },
    gallery: nummeriert("Dre'Quan Priest", 4),
    outro: ["Real Dimez — artwork"]
  },

  dimez: {
    kicker: "Supporting characters",
    lead: "Bae-Luxe and Roxy have been friends since high school — and smart enough to turn it into money.",
    intro: [
      "They turned their days of hustling local dealers into raunchy rap tracks and a social media presence that never stands still.",
      "An early hit with rapper DWNPLY took them all the way to the top."
    ],
    introShots: ["Real Dimez on stage", "Real Dimez in Vice City"],
    band: {
      pink: "Five years and a lot of trouble later.",
      body: "Now they’re signed to Only Raw Records and hoping lightning strikes twice."
    },
    bandShots: ["Real Dimez at night"],
    fullAlt: "Real Dimez performing",
    fullCap: "Vice City · two voices, one more shot",
    quote2: "They’ve been on top before.<br>The way back is shorter.",
    band2: {
      body: "Bae-Luxe writes, Roxy leads. Together they’re the loudest argument Dre'Quan’s label has to offer.",
      pink: "The hustle just changed formats."
    },
    gallery: nummeriert("Real Dimez", 4),
    outro: ["Dre'Quan Priest — artwork"]
  },

  raul: {
    kicker: "Supporting character",
    lead: "Confidence, charm and cunning — Raul is a seasoned bank robber.",
    intro: [
      "Always looking for people willing to take the biggest risks for the biggest payouts.",
      "His recklessness raises the stakes with every job."
    ],
    introShots: ["Raul Bautista in Port Gellhorn", "Raul Bautista with his crew"],
    band: {
      pink: "Sooner or later his crew has to decide.",
      body: "Double down — or take their chips off the table. Raul answered that question for himself a long time ago."
    },
    bandShots: ["Raul Bautista during a robbery"],
    fullAlt: "Raul Bautista with his crew in Port Gellhorn",
    fullCap: "Port Gellhorn · always one job too many",
    quote2: "Experience protects him.<br>Just not from himself.",
    band2: {
      body: "Ride with Raul and you’ll earn more than anywhere else. And carry a little more risk every single time.",
      pink: "The next job is always the biggest."
    },
    gallery: nummeriert("Raul Bautista", 4),
    outro: ["Jason and Lucia during a robbery"]
  },

  brian: {
    kicker: "Supporting character",
    lead: "Brian is an old-school smuggler from the golden age of the Keys.",
    intro: [
      "With his third wife, Lori, he still moves product through his boatyard — he just lets others do the dirty work these days.",
      "Looks like a beach bum. Moves like a great white shark."
    ],
    introShots: ["Brian Heder at his boatyard", "Brian Heder in the Leonida Keys"],
    band: {
      pink: "Jason lives rent-free at his place.",
      body: "As long as he helps out with local scams and drops by for Lori’s sangria now and then. The deal holds — until it doesn’t."
    },
    bandShots: ["Brian Heder by the water"],
    fullAlt: "Brian Heder at his boatyard",
    fullCap: "Leonida Keys · the yard everything runs through",
    quote2: "Friendly to everyone.<br>Loyal to no one.",
    band2: {
      body: "Brian has survived every raid of the last thirty years because he was never the one driving the boat.",
      pink: "A favor from him is never free."
    },
    gallery: nummeriert("Brian Heder", 4),
    outro: ["Jason and Lucia on the beach"]
  }
};

/* Bildpaare ["pfad", "Alt-Text"] behalten ihren Pfad, nur der Text
   wird ersetzt — gleiche Reihenfolge wie in data.js. */
const BILDLISTEN = ["introShots", "bandShots", "gallery", "outro"];

Object.keys(CHAR_PAGES_EN).forEach(id => {
  const page = CHAR_PAGES[id];
  if (!page) return;
  const en = CHAR_PAGES_EN[id];
  Object.keys(en).forEach(feld => {
    const wert = en[feld];
    if (BILDLISTEN.includes(feld)) {
      page[feld] = page[feld].map(([pfad, alt], i) => [pfad, wert[i] || alt]);
    } else if (feld === "band" || feld === "band2") {
      Object.assign(page[feld], wert);
    } else {
      page[feld] = wert;
    }
  });
});

})();
