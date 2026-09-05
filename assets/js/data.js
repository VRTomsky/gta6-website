/* ═══════════════════════════════════════════════════════════
   Inhalte der Seite.
   Zitate in ENGLISCH stammen 1:1 von rockstargames.com/VI.
   Deutsche Fließtexte sind Übersetzung bzw. Zusammenfassung.
   ═══════════════════════════════════════════════════════════ */

const RELEASE = new Date(2026, 10, 19, 0, 0, 0); // 19. November 2026, 00:00 Ortszeit

/* ── Charaktere ─────────────────────────────────────────── */
const CHARS = [
  {
    id: "jason",
    name: "Jason Duval",
    display: "Jason<br>Duval",
    tag: "Protagonist",
    quote: "If anything happens,<br>I'm right behind you.",
    hero: "assets/img/art/jason_lucia_beach.jpg",
    video: "assets/video/loop_jason_duval.mp4",
    poster: "assets/img/chars/loop_jason_duval_poster.jpg",
    thumb: "assets/img/chars/jason_01.jpg",
    sub: "Ex-Army · Leonida Keys",
    bio: [
      "Jason will ein einfaches Leben — nur werden die Dinge einfach nicht einfacher. Aufgewachsen ist er zwischen Trickbetrügern und Kleinkriminellen. Nach einer Zeit bei der Army, mit der er seine schwierige Jugend abschütteln wollte, landete er in den Keys und macht das, was er am besten kann: für die örtlichen Drogenkuriere arbeiten.",
      "Lucia zu treffen könnte das Beste oder das Schlimmste sein, was ihm je passiert ist. Jason weiß ziemlich genau, wie er es gern hätte — aber im Moment ist schwer zu sagen, wohin das läuft. Vielleicht ist es Zeit, etwas Neues zu probieren."
    ],
    meta: [["Basis", "Leonida Keys"], ["Vorgeschichte", "US Army"], ["Beziehung", "Lucia Caminos"], ["Rolle", "Spielbar"]],
    shots: ["chars/jason_01.jpg","chars/jason_02.jpg","chars/jason_03.jpg","chars/jason_04.jpg","chars/jason_05.jpg","chars/jason_06.jpg","art/jason_lucia_motel.jpg","art/jason_lucia_01.jpg"]
  },
  {
    id: "lucia",
    name: "Lucia Caminos",
    display: "Lucia<br>Caminos",
    tag: "Protagonistin",
    quote: "The only thing that matters is<br>who you know and what you got.",
    hero: "assets/img/art/jason_lucia_robbery.jpg",
    video: "assets/video/loop_lucia_caminos.mp4",
    poster: "assets/img/chars/loop_lucia_caminos_poster.jpg",
    thumb: "assets/img/chars/lucia_01.jpg",
    sub: "Ex-Häftling · Vice City",
    bio: [
      "Lucias Vater brachte ihr das Kämpfen bei, sobald sie laufen konnte. Seitdem schlägt das Leben zurück. Weil sie für ihre Familie kämpfte, landete sie im Leonida Penitentiary. Reines Glück holte sie wieder heraus. Lucia hat ihre Lektion gelernt — ab jetzt nur noch kluge Entscheidungen.",
      "Frisch aus dem Knast und fest entschlossen, die Chancen zu ihren Gunsten zu drehen, hält Lucia an ihrem Plan fest — egal, was es kostet. Ein Leben mit Jason könnte ihr Weg raus sein."
    ],
    meta: [["Basis", "Vice City"], ["Vorgeschichte", "Leonida Penitentiary"], ["Beziehung", "Jason Duval"], ["Rolle", "Spielbar"]],
    shots: ["chars/lucia_01.jpg","chars/lucia_02.jpg","chars/lucia_03.jpg","chars/lucia_04.jpg","chars/lucia_05.jpg","chars/lucia_06.jpg","art/jason_lucia_02.jpg","art/user_lucia_jason.jpg"]
  },
  {
    id: "cal",
    name: "Cal Hampton",
    display: "Cal<br>Hampton",
    tag: "Jasons Kumpel",
    quote: "Der Funk lügt nicht.",
    hero: "assets/img/art/cal_hampton.jpg",
    video: "assets/video/loop_cal_hampton.mp4",
    poster: "assets/img/chars/loop_cal_hampton_poster.jpg",
    thumb: "assets/img/chars/cal_01.jpg",
    sub: "Polizeifunk · Paranoia",
    bio: [
      "Cal ist Jasons Freund und am glücklichsten, wenn er allein mit seinem Polizeiscanner ist. Wer wissen will, wo gerade eine Streife steht, welcher Kanal abgehört wird oder wo man ungestört etwas abwickelt, fragt Cal.",
      "Der Preis dafür: Man bekommt seine Theorien gleich mit dazu. Über die Regierung, über das, was über Leonida fliegt, und darüber, wer angeblich wirklich das Sagen hat. Nützlich ist er trotzdem."
    ],
    meta: [["Basis", "Leonida Keys"], ["Spezialgebiet", "Funk & Elektronik"], ["Verbindung", "Jason"], ["Rolle", "Nebenfigur"]],
    shots: ["chars/cal_01.jpg","chars/cal_02.jpg","chars/cal_03.jpg","chars/cal_04.jpg"]
  },
  {
    id: "boobie",
    name: "Boobie Ike",
    display: "Boobie<br>Ike",
    tag: "Unternehmer",
    quote: "Vom Block ins Grundbuch.",
    hero: "assets/img/art/boobie_ike.jpg",
    video: "assets/video/loop_boobie_ike.mp4",
    poster: "assets/img/chars/loop_boobie_ike_poster.jpg",
    thumb: "assets/img/chars/boobie_01.jpg",
    sub: "Vice City · Business",
    bio: [
      "Boobie hat seine Zeit auf der Straße abgesessen und den Hustle danach in etwas Belastbares verwandelt: einen Club, ein Tonstudio, Immobilien. In Vice City kennt ihn jeder, der irgendwo Geld unterbringen muss.",
      "Er ist nicht mehr derjenige, der selbst die Drecksarbeit macht — aber er weiß immer noch genau, wie sie funktioniert. Und wer ihm etwas schuldet, merkt das ziemlich schnell."
    ],
    meta: [["Basis", "Vice City"], ["Geschäft", "Club & Studio"], ["Netzwerk", "Dre'Quan Priest"], ["Rolle", "Nebenfigur"]],
    shots: ["chars/boobie_01.jpg","chars/boobie_02.jpg","chars/boobie_03.jpg","chars/boobie_04.jpg"]
  },
  {
    id: "drequan",
    name: "Dre'Quan Priest",
    display: "Dre'Quan<br>Priest",
    tag: "Label-Chef",
    quote: "Only Raw Records.",
    hero: "assets/img/art/drequan_priest.jpg",
    video: "assets/video/loop_drequan_priest.mp4",
    poster: "assets/img/chars/loop_drequan_priest_poster.jpg",
    thumb: "assets/img/chars/drequan_01.jpg",
    sub: "Musik · Only Raw Records",
    bio: [
      "Dre'Quan kam über selbstgebaute Beats und Mixtapes nach oben und betreibt heute sein eigenes Label, Only Raw Records. Sein Ziel ist simpel: einen echten Hit landen, bevor ihm jemand anderes zuvorkommt.",
      "Bei ihm unter Vertrag: Real Dimez. Wenn Bae-Luxe und Roxy noch einmal einschlagen, ist Dre'Quan der Mann, der davon am meisten hat — und der am meisten zu verlieren hat, wenn nicht."
    ],
    meta: [["Basis", "Vice City"], ["Label", "Only Raw Records"], ["Act", "Real Dimez"], ["Rolle", "Nebenfigur"]],
    shots: ["chars/drequan_01.jpg","chars/drequan_02.jpg","chars/drequan_03.jpg","chars/drequan_04.jpg"]
  },
  {
    id: "dimez",
    name: "Real Dimez",
    display: "Real<br>Dimez",
    tag: "Duo",
    quote: "One hit away from fame.",
    hero: "assets/img/art/real_dimez.jpg",
    video: "assets/video/loop_real_dimez.mp4",
    poster: "assets/img/chars/loop_real_dimez_poster.jpg",
    thumb: "assets/img/chars/dimez_01.jpg",
    sub: "Bae-Luxe & Roxy",
    bio: [
      "Bae-Luxe und Roxy, zusammen Real Dimez, sind seit der Highschool befreundet — clever genug, ihre Zeit als Abzockerinnen lokaler Dealer in bares Geld zu verwandeln: über deftige Rap-Tracks und eine Social-Media-Präsenz, die nie stillsteht.",
      "Ein früher Hit mit dem Rapper DWNPLY brachte sie ganz nach oben. Nach fünf Jahren und einer Menge Ärger stehen sie jetzt bei Only Raw Records unter Vertrag und hoffen, dass der Blitz zweimal einschlägt."
    ],
    meta: [["Basis", "Vice City"], ["Label", "Only Raw Records"], ["Feature", "DWNPLY"], ["Rolle", "Nebenfiguren"]],
    shots: ["chars/dimez_01.jpg","chars/dimez_02.jpg","chars/dimez_03.jpg","chars/dimez_04.jpg"]
  },
  {
    id: "raul",
    name: "Raul Bautista",
    display: "Raul<br>Bautista",
    tag: "Bankräuber",
    quote: "Experience counts.",
    hero: "assets/img/art/raul_bautista.jpg",
    video: "assets/video/loop_raul_bautista.mp4",
    poster: "assets/img/chars/loop_raul_bautista_poster.jpg",
    thumb: "assets/img/chars/raul_01.jpg",
    sub: "Port Gellhorn · Crew",
    bio: [
      "Selbstbewusstsein, Charme und Gerissenheit — Raul ist ein erfahrener Bankräuber, ständig auf der Suche nach Leuten, die bereit sind, für den ganz großen Ertrag das ganz große Risiko zu nehmen.",
      "Seine Rücksichtslosigkeit erhöht mit jedem Coup den Einsatz. Früher oder später muss seine Crew entscheiden: nachlegen — oder die Chips vom Tisch nehmen."
    ],
    meta: [["Region", "Port Gellhorn"], ["Fach", "Banküberfälle"], ["Merkmal", "Zu hohes Risiko"], ["Rolle", "Nebenfigur"]],
    shots: ["chars/raul_01.jpg","chars/raul_02.jpg","chars/raul_03.jpg","chars/raul_04.jpg"]
  },
  {
    id: "brian",
    name: "Brian Heder",
    display: "Brian<br>Heder",
    tag: "Schmuggler",
    quote: "Nothing better than<br>a Mudslide at sunset.",
    hero: "assets/img/art/brian_heder.jpg",
    video: "assets/video/loop_brian_heder.mp4",
    poster: "assets/img/chars/loop_brian_heder_poster.jpg",
    thumb: "assets/img/chars/brian_01.jpg",
    sub: "Bootswerft · Leonida Keys",
    bio: [
      "Brian ist ein klassischer Drogenschmuggler aus der goldenen Ära des Schmuggels in den Keys. Über seine Bootswerft läuft mit seiner dritten Frau Lori noch immer Ware — nur lässt er die schmutzige Arbeit inzwischen andere machen.",
      "Sieht aus wie ein Strandpenner aus Leonida, bewegt sich aber wie ein Weißer Hai. Jason darf mietfrei in einer seiner Immobilien wohnen — solange er bei den lokalen Abzocken hilft und ab und zu auf Loris Sangria vorbeischaut."
    ],
    meta: [["Basis", "Leonida Keys"], ["Geschäft", "Bootswerft"], ["Vermieter von", "Jason"], ["Rolle", "Nebenfigur"]],
    shots: ["chars/brian_01.jpg","chars/brian_02.jpg","chars/brian_03.jpg","chars/brian_04.jpg"]
  }
];

/* ── Orte ───────────────────────────────────────────────── */
const PLACES = [
  {
    id: "vice-city",
    name: "Vice City",
    sub: "Die Metropole",
    badge: "Leonida · Küste",
    hero: "assets/img/places/postcard_vice_city.jpg",
    text: "Neongetränkte Boulevards, Art-déco-Fassaden am Strand und dahinter Türme aus Glas und Geld. Vice City verkauft Sonne, Musik und den schnellen Aufstieg — und kassiert dafür alles, was du hast. Wer hier oben ankommt, hat auf dem Weg dorthin selten sauber gespielt.",
    shots: ["places/vice_city_01.jpg","places/vice_city_02.jpg","places/vice_city_03.jpg","places/vice_city_04.jpg","places/vice_city_05.jpg","places/vice_city_06.jpg","places/vice_city_07.jpg","places/vice_city_08.jpg","places/vice_city_09.jpg"]
  },
  {
    id: "leonida-keys",
    name: "Leonida Keys",
    sub: "Die Inselkette",
    badge: "Süden · Wasser",
    hero: "assets/img/places/postcard_leonida_keys.jpg",
    text: "Eine Kette aus Inseln, verbunden durch eine einzige lange Straße. Bars mit schiefen Dächern, Bootsstege, Sandbänke — und darunter die Schmuggelrouten, auf denen Brian Heder schon seit Jahrzehnten Ware bewegt. Jasons Zuhause und Leonidas Hintertür zugleich.",
    shots: ["places/leonida_keys_01.jpg","places/leonida_keys_02.jpg","places/leonida_keys_03.jpg","places/leonida_keys_04.jpg","places/leonida_keys_05.jpg"]
  },
  {
    id: "grassrivers",
    name: "Grassrivers",
    sub: "Die Sümpfe",
    badge: "Landesinneres · Wetland",
    hero: "assets/img/places/postcard_grassrivers.jpg",
    text: "Endlose Sägegras-Flächen, Airboats, Alligatoren und ein paar Häuser auf Stelzen. In Grassrivers verschwinden Dinge — Fracht, Fahrzeuge, gelegentlich Menschen. Der Ort, an dem Leonida aufhört, Postkarte zu sein.",
    shots: ["places/grassrivers_01.jpg","places/grassrivers_02.jpg","places/grassrivers_03.jpg","places/grassrivers_04.jpg"]
  },
  {
    id: "port-gellhorn",
    name: "Port Gellhorn",
    sub: "Die alte Küstenstadt",
    badge: "Golfküste · Boardwalk",
    hero: "assets/img/places/postcard_port_gellhorn.jpg",
    text: "Ein Badeort, dessen beste Jahre lange vorbei sind: verblichene Motelschilder, ein Boardwalk mit halb funktionierenden Fahrgeschäften, Läden, die seit den Achtzigern nicht renoviert wurden. Genau deshalb ideal für Leute wie Raul Bautista.",
    shots: ["places/port_gellhorn_01.jpg","places/port_gellhorn_02.jpg","places/port_gellhorn_03.jpg","places/port_gellhorn_04.jpg","places/port_gellhorn_05.jpg"]
  },
  {
    id: "ambrosia",
    name: "Ambrosia",
    sub: "Die Kleinstadt",
    badge: "Binnenland · Industrie",
    hero: "assets/img/places/postcard_ambrosia.jpg",
    text: "Silos, Trailer Parks, ein Diner an der Ausfallstraße. Ambrosia lebt von Landwirtschaft und dem, was danach kommt, wenn die Arbeit ausbleibt. Weit genug weg von Vice City, dass keiner hinsieht — und nah genug, dass alles dort landet.",
    shots: ["places/ambrosia_01.jpg","places/ambrosia_02.jpg","places/ambrosia_03.jpg","places/ambrosia_04.jpg","places/ambrosia_05.jpg"]
  },
  {
    id: "mount-kalaga",
    name: "Mount Kalaga",
    sub: "Der Nationalpark",
    badge: "Norden · Wildnis",
    hero: "assets/img/places/postcard_mount_kalaga.jpg",
    text: "Wald, Nebel und Höhenmeter — der Gegenentwurf zur Küste. Der Mount Kalaga National Park ist der abgelegenste Teil von Leonida: Wanderwege, Hütten, Funklöcher. Perfekt, um sich zu erholen. Oder um sich zu verstecken.",
    shots: ["places/kalaga_01.jpg","places/kalaga_02.jpg","places/kalaga_03.jpg","places/kalaga_04.jpg","places/kalaga_05.jpg","places/kalaga_06.jpg"]
  }
];

/* ── Ultimate Edition ───────────────────────────────────── */
const ULTIMATE = [
  { img: "ultimate/ue_cheetah_01.jpg", t: "'95 Grotti Cheetah", s: "Fahrzeug · Retro-Livery" },
  { img: "ultimate/ue_revolvers.jpg",  t: "Morgan Revolvers",   s: "Hawk & Little · Waffenpaar" },
  { img: "ultimate/ue_weapon_variants.jpg", t: "Waffen-Varianten", s: "Exklusive Finishes" },
  { img: "ultimate/ue_vc_style_01.jpg", t: "Vice City Style",   s: "Outfits für Jason & Lucia" },
  { img: "ultimate/ue_saras_salon.jpg", t: "Sara's Unisex Salon", s: "Laden · Haare & Make-up" },
  { img: "ultimate/ue_rideout.jpg",    t: "Rideout Customs",    s: "Laden · Tuning" },
  { img: "ultimate/ue_stock305.jpg",   t: "Stock 305",          s: "Laden · Mode" },
  { img: "ultimate/ue_fang.jpg",       t: "Electric Fang Tattoo", s: "Laden · Tattoos" },
  { img: "ultimate/ue_willie.jpg",     t: "One-Eyed Willie's",  s: "Laden · Bar" },
  { img: "ultimate/ue_safehouse.jpg",  t: "Safehouse-Fahrzeuge", s: "Startgarage" },
  { img: "ultimate/ue_squalo.jpg",     t: "Shitzu Squalo",      s: "Boot" },
  { img: "ultimate/ue_buggy.jpg",      t: "Vapid Buggy",        s: "Offroad" },
  { img: "ultimate/ue_ganado.jpg",     t: "Vapid Ganado Retro", s: "Fahrzeug-Build" },
  { img: "ultimate/ue_wyman_01.jpg",   t: "Wyman Car Collection", s: "Sammlung" },
  { img: "ultimate/ue_goodtime.jpg",   t: "Goodtime Gear",      s: "Ausrüstung" },
  { img: "ultimate/ue_ptt.jpg",        t: "PTT Store",          s: "Laden · Zubehör" }
];

/* ── X / Twitter ────────────────────────────────────────── */
const XACCOUNTS = [
  { h: "@RockstarGames", d: "Offizieller Account — hier zuerst",  u: "https://x.com/RockstarGames", av: "R", off: true },
  { h: "@GTA6Alerts",    d: "Fan-Feed · News, Clips, Community",  u: "https://x.com/GTA6Alerts",    av: "A" },
  { h: "@_GTAVI_",       d: "Fan-Feed · GTA VI News",             u: "https://x.com/_GTAVI_",       av: "V" },
  { h: "@GTA6NewsHub",   d: "Fan-Feed · News & Leaks",            u: "https://x.com/GTA6NewsHub",   av: "N" },
  { h: "@GTASNEWSLEAKS", d: "Fan-Feed · Leak-Aggregator",         u: "https://x.com/GTASNEWSLEAKS", av: "L" }
];

/* ── Galerie ────────────────────────────────────────────── */
const GALLERY = (() => {
  const g = [];
  /* Ein Eintrag ist entweder nur der Dateiname — dann wird die Bildunter-
     schrift durchnummeriert ("Artwork 01") — oder ein Paar
     ["datei.jpg", "Was drauf ist"]. Das Paar ist die bessere Form: die
     Beschriftung landet als Alt-Text am Bild und als Zeile in der Lightbox. */
  const push = (cat, files, cap) => files.forEach((f, i) => {
    const [datei, text] = Array.isArray(f) ? f : [f, null];
    g.push({
      src: "assets/img/" + datei,
      cat,
      cap: text || cap + " " + String(i + 1).padStart(2, "0")
    });
  });

  push("art", [
    "art/cover_art.jpg","art/jason_lucia_robbery_logo.jpg","art/jason_lucia_beach_logo.jpg",
    "art/jason_lucia_01_logo.jpg","art/jason_lucia_02_logo.jpg","art/jason_lucia_motel.jpg",
    "art/jason_lucia_robbery.jpg","art/jason_lucia_beach.jpg","art/user_lucia_jason.jpg"
  ], "Artwork");

  push("vice", [
    "places/vice_city_01.jpg","places/vice_city_02.jpg","places/vice_city_03.jpg","places/vice_city_04.jpg",
    "places/vice_city_05.jpg","places/vice_city_06.jpg","places/vice_city_07.jpg","places/vice_city_08.jpg",
    "places/vice_city_09.jpg","places/user_vice_city_nacht.jpg","places/postcard_vice_city.jpg"
  ], "Vice City");

  push("leonida", [
    "places/leonida_keys_01.jpg","places/leonida_keys_02.jpg","places/leonida_keys_03.jpg",
    "places/leonida_keys_04.jpg","places/leonida_keys_05.jpg",
    "places/port_gellhorn_01.jpg","places/port_gellhorn_02.jpg","places/port_gellhorn_03.jpg",
    "places/port_gellhorn_04.jpg","places/port_gellhorn_05.jpg",
    "places/grassrivers_01.jpg","places/grassrivers_02.jpg","places/grassrivers_03.jpg","places/grassrivers_04.jpg",
    "places/ambrosia_01.jpg","places/ambrosia_02.jpg","places/ambrosia_03.jpg","places/ambrosia_04.jpg","places/ambrosia_05.jpg",
    "places/kalaga_01.jpg","places/kalaga_02.jpg","places/kalaga_03.jpg","places/kalaga_04.jpg","places/kalaga_05.jpg","places/kalaga_06.jpg",
    "places/postcard_leonida_keys.jpg","places/postcard_port_gellhorn.jpg","places/postcard_grassrivers.jpg",
    "places/postcard_ambrosia.jpg","places/postcard_mount_kalaga.jpg"
  ], "Leonida");

  push("chars", [
    "chars/jason_01.jpg","chars/jason_02.jpg","chars/jason_03.jpg","chars/jason_04.jpg","chars/jason_05.jpg","chars/jason_06.jpg",
    "chars/lucia_01.jpg","chars/lucia_02.jpg","chars/lucia_03.jpg","chars/lucia_04.jpg","chars/lucia_05.jpg","chars/lucia_06.jpg",
    "chars/cal_01.jpg","chars/cal_02.jpg","chars/cal_03.jpg","chars/cal_04.jpg",
    "chars/boobie_01.jpg","chars/boobie_02.jpg","chars/boobie_03.jpg","chars/boobie_04.jpg",
    "chars/drequan_01.jpg","chars/drequan_02.jpg","chars/drequan_03.jpg","chars/drequan_04.jpg",
    "chars/dimez_01.jpg","chars/dimez_02.jpg","chars/dimez_03.jpg","chars/dimez_04.jpg",
    "chars/raul_01.jpg","chars/raul_02.jpg","chars/raul_03.jpg","chars/raul_04.jpg",
    "chars/brian_01.jpg","chars/brian_02.jpg","chars/brian_03.jpg","chars/brian_04.jpg",
    "art/cal_hampton.jpg","art/boobie_ike.jpg","art/drequan_priest.jpg","art/real_dimez.jpg",
    "art/raul_bautista.jpg","art/brian_heder.jpg",
    ["chars/jason_07.jpg", "Jason hinter einem Maschendrahtzaun, im Rücken das Blaulicht"],
    ["chars/jason_08.jpg", "Jason mit Pistole an einem Boot in den Leonida Keys"],
    ["chars/lucia_07.jpg", "Lucia mit Schrotflinte während einer Verfolgungsjagd"],
    ["chars/lucia_08.jpg", "Lucia vor einer Wechselstube in Vice City"],
    ["chars/lucia_10.jpg", "Lucia im Wagen, Neonlicht auf dem Gesicht"]
  ], "Charakter");

  /* Die Szenen mit beiden Protagonisten bekommen einen eigenen Filter —
     13 Bilder sind genug dafür, und inhaltlich sind es Story-Momente und
     keine Einzelporträts. */
  push("duo", [
    ["duo/duo_01.jpg", "Jason und Lucia am Hafen, dahinter die Skyline von Vice City"],
    ["duo/duo_02.jpg", "Jason und Lucia bewaffnet in einem Tresorraum"],
    ["duo/duo_03.jpg", "Lucia auf die Autotür gelehnt, Jason am Steuer"],
    ["duo/duo_04.jpg", "Schusswechsel in einem Nagelstudio"],
    ["duo/duo_05.jpg", "Nächtliches Treffen in einem Hinterhof"],
    ["duo/duo_06.jpg", "Jason am Steuer, Lucia mit gezogener Waffe"],
    ["duo/duo_07.jpg", "Lucia auf einer Motorhaube im türkisen Neonlicht"],
    ["duo/duo_08.jpg", "Jason und Lucia vor einem brennenden Wrack im Sonnenuntergang"],
    ["duo/duo_09.jpg", "Verfolgungsjagd auf dem Motorrad, Streifenwagen im Rücken"],
    ["duo/duo_10.jpg", "Lucia auf einer Dachterrasse über der nächtlichen Skyline"],
    ["duo/duo_11.jpg", "Jason und Lucia im Cabrio an der Küste"],
    ["duo/duo_12.jpg", "Jason bewaffnet im Halbdunkel"],
    ["duo/duo_13.jpg", "Jason und Lucia im Gegenlicht des Sonnenuntergangs"]
  ], "Jason & Lucia");

  push("ultimate", ULTIMATE.map(u => u.img).concat([
    "ultimate/ue_01.jpg","ultimate/ue_02.jpg","ultimate/ue_cheetah_03.jpg","ultimate/ue_vc_style_03.jpg",
    "ultimate/ue_wyman_03.jpg","ultimate/vvcp_01.jpg","ultimate/vvcp_stanier.jpg",
    "ultimate/vvcp_looks_01.jpg","ultimate/vvcp_looks_03.jpg","ultimate/vvcp_weapon.jpg"
  ]), "Edition");

  return g;
})();

const GAL_CATS = [
  { id: "all",      label: "Alles" },
  { id: "vice",     label: "Vice City" },
  { id: "leonida",  label: "Leonida" },
  { id: "chars",    label: "Charaktere" },
  { id: "duo",      label: "Jason & Lucia" },
  { id: "art",      label: "Artworks" },
  { id: "ultimate", label: "Ultimate Edition" }
];

/* ── Charakter-Detailseiten ──────────────────────────────
   Inhalte für charakter.html. Aufbau je Seite immer gleich:

     scrub    scroll-gesteuertes Video im Vollbild
     intro    Name, Lead (pink), Fließtext + Bildercluster gegenüber
     quote1   grosses Zitat quer über die Seite
     band     zweispaltiger Textblock unter dem Zitat
     full     Vollbild, das beim Scrollen durchfährt
     quote2   zweites Zitat
     band2    zweiter Textblock, Spalten getauscht
     gallery  Bilderraster
     outro    Bilder + Zurück-Button

   `side` dreht das Intro-Layout: "left" = Text links (Jason),
   "right" = Text rechts (Lucia). Alles andere ergibt sich daraus,
   damit sich die beiden Hauptfiguren spiegeln statt zu doppeln.
   ─────────────────────────────────────────────────────── */
const CHAR_PAGES = {

  jason: {
    side: "left",
    kicker: "Protagonist 01",
    scrub: "assets/video/scrub_jason.mp4",
    scrubPoster: "assets/img/art/scrub_poster2.jpg",
    lead: "Jason will ein einfaches Leben — aber es wird einfach nicht einfacher.",
    intro: [
      "Aufgewachsen ist er zwischen Trickbetrügern und Kleinkriminellen. Nach einer Zeit bei der Army, mit der er seine schwierige Jugend abschütteln wollte, landete er in den Keys und macht das, was er am besten kann: für die örtlichen Drogenkuriere arbeiten.",
      "Vielleicht ist es Zeit, etwas Neues zu probieren."
    ],
    introShots: [
      ["chars/jason_08.jpg", "Jason an einem Boot in den Leonida Keys"],
      ["duo/duo_11.jpg", "Jason und Lucia im Cabrio an der Küste"],
      ["chars/jason_02.jpg", "Jason auf der Veranda"]
    ],
    quote1: "If anything happens,<br>I'm right behind you.",
    band: {
      pink: "Another day in paradise, right?",
      body: "Lucia zu treffen könnte das Beste oder das Schlimmste sein, was ihm je passiert ist. Jason weiß ziemlich genau, wie er es gern hätte — aber im Moment ist schwer zu sagen, wohin das läuft."
    },
    bandShots: [
      ["duo/duo_06.jpg", "Jason am Steuer, Lucia auf dem Beifahrersitz"],
      ["chars/jason_04.jpg", "Jason in Vice City"]
    ],
    full: "chars/jason_07.jpg",
    fullAlt: "Jason hinter einem Maschendrahtzaun, im Rücken das Blaulicht der Streifenwagen",
    fullCap: "Leonida Keys · die Nacht, in der es kippt",
    quote2: "Vom einfachen Job<br>zum Punkt ohne Rückweg.",
    band2: {
      body: "Ein simples krummes Ding läuft schief — und plötzlich steht Jason mitten in einer Verschwörung, die sich über den ganzen Bundesstaat zieht. Zurück kann er nicht mehr.",
      pink: "Er weiß, wie er es gern hätte. Nur fragt ihn gerade niemand."
    },
    gallery: [
      ["chars/jason_01.jpg", "Jason Duval — Porträt"],
      ["chars/jason_03.jpg", "Jason am Strand"],
      ["chars/jason_05.jpg", "Jason im Motel"],
      ["chars/jason_06.jpg", "Jason bei Nacht"],
      ["duo/duo_04.jpg", "Überfall zu zweit"],
      ["duo/duo_09.jpg", "Verfolgungsjagd auf dem Motorrad"],
      ["duo/duo_12.jpg", "Jason bewaffnet im Halbdunkel"],
      ["art/jason_lucia_motel.jpg", "Jason und Lucia im Motel"]
    ],
    outro: [
      ["duo/duo_01.jpg", "Jason und Lucia am Hafen von Vice City"],
      ["duo/duo_08.jpg", "Jason und Lucia vor einem brennenden Wrack"]
    ]
  },

  lucia: {
    side: "right",
    kicker: "Protagonistin 02",
    scrub: "assets/video/scrub_lucia.mp4",
    scrubPoster: "assets/img/art/scrub_poster.jpg",
    lead: "Lucias Vater brachte ihr das Kämpfen bei, sobald sie laufen konnte.",
    intro: [
      "Seitdem schlägt das Leben zurück. Weil sie für ihre Familie kämpfte, landete sie im Leonida Penitentiary. Reines Glück holte sie wieder heraus.",
      "Lucia hat ihre Lektion gelernt — ab jetzt nur noch kluge Entscheidungen."
    ],
    introShots: [
      ["chars/lucia_10.jpg", "Lucia im Wagen, Neonlicht auf dem Gesicht"],
      ["chars/lucia_07.jpg", "Lucia mit Schrotflinte während einer Verfolgungsjagd"],
      ["chars/lucia_03.jpg", "Lucia in Vice City"]
    ],
    quote1: "The only thing that matters is<br>who you know and what you got.",
    band: {
      pink: "Ein Leben mit Jason könnte ihr Weg raus sein.",
      body: "Frisch aus dem Knast und fest entschlossen, die Chancen zu ihren Gunsten zu drehen, hält Lucia an ihrem Plan fest — egal, was es kostet."
    },
    bandShots: [
      ["chars/lucia_08.jpg", "Lucia vor einem Wechselstubenladen"],
      ["duo/duo_03.jpg", "Lucia und Jason im Wagen bei Tag"]
    ],
    full: "duo/duo_10.jpg",
    fullAlt: "Lucia auf einer Dachterrasse über der nächtlichen Skyline von Vice City",
    fullCap: "Vice City · alles, was sie wollte, eine Etage zu hoch",
    quote2: "Sie will nicht träumen.<br>Sie will es nehmen.",
    band2: {
      body: "Mehr als alles andere will Lucia das gute Leben, von dem ihre Mutter seit ihren Tagen in Liberty City redet. Statt halbgarer Fantasien nimmt sie die Sache selbst in die Hand.",
      pink: "Nur kluge Entscheidungen. Von hier an."
    },
    gallery: [
      ["chars/lucia_01.jpg", "Lucia Caminos — Porträt"],
      ["chars/lucia_02.jpg", "Lucia am Strand"],
      ["chars/lucia_04.jpg", "Lucia im Club"],
      ["chars/lucia_05.jpg", "Lucia bei Nacht"],
      ["chars/lucia_06.jpg", "Lucia auf der Straße"],
      ["duo/duo_02.jpg", "Lucia und Jason im Tresorraum"],
      ["duo/duo_07.jpg", "Lucia im Neonlicht"],
      ["duo/duo_05.jpg", "Treffen im Hinterhof"]
    ],
    outro: [
      ["duo/duo_13.jpg", "Lucia und Jason im Sonnenuntergang"],
      ["art/jason_lucia_02.jpg", "Lucia und Jason — Artwork"]
    ]
  },

  cal: {
    side: "left",
    kicker: "Nebenfigur",
    heroImg: "assets/img/art/cal_hampton.jpg",
    lead: "Cal ist am glücklichsten, wenn er allein mit seinem Polizeiscanner ist.",
    intro: [
      "Wer wissen will, wo gerade eine Streife steht, welcher Kanal abgehört wird oder wo man ungestört etwas abwickelt, fragt Cal.",
      "Der Preis dafür: Man bekommt seine Theorien gleich mit dazu."
    ],
    introShots: [
      ["chars/cal_02.jpg", "Cal an seinem Funkgerät"],
      ["chars/cal_03.jpg", "Cal in den Leonida Keys"]
    ],
    quote1: "Der Funk lügt nicht.",
    band: {
      pink: "Über die Regierung. Über das, was über Leonida fliegt.",
      body: "Und darüber, wer angeblich wirklich das Sagen hat. Nützlich ist er trotzdem — Jason hört ihm zu, weil es sich am Ende meistens auszahlt."
    },
    bandShots: [["chars/cal_04.jpg", "Cal im Halbdunkel"]],
    full: "chars/cal_01.jpg",
    fullAlt: "Cal Hampton an seinem Polizeiscanner",
    fullCap: "Leonida Keys · Kanal offen, Tür zu",
    quote2: "Er hört alles.<br>Er glaubt fast alles.",
    band2: {
      body: "Cal ist kein Kämpfer und will es auch nicht sein. Sein Beitrag kommt über Frequenzen, Kabel und die Geduld, stundenlang zuzuhören.",
      pink: "Jasons ältester Freund — und sein zuverlässigster Vorsprung."
    },
    gallery: [
      ["chars/cal_01.jpg", "Cal Hampton — Bild 1"],
      ["chars/cal_02.jpg", "Cal Hampton — Bild 2"],
      ["chars/cal_03.jpg", "Cal Hampton — Bild 3"],
      ["chars/cal_04.jpg", "Cal Hampton — Bild 4"]
    ],
    outro: [["art/jason_lucia_beach.jpg", "Jason und Lucia am Strand"]]
  },

  boobie: {
    side: "right",
    kicker: "Nebenfigur",
    heroImg: "assets/img/art/boobie_ike.jpg",
    lead: "Boobie hat seine Zeit auf der Straße abgesessen — und den Hustle in etwas Belastbares verwandelt.",
    intro: [
      "Einen Club, ein Tonstudio, Immobilien. In Vice City kennt ihn jeder, der irgendwo Geld unterbringen muss.",
      "Er macht die Drecksarbeit nicht mehr selbst. Er weiß nur noch genau, wie sie funktioniert."
    ],
    introShots: [
      ["chars/boobie_02.jpg", "Boobie Ike in seinem Club"],
      ["chars/boobie_03.jpg", "Boobie Ike in Vice City"]
    ],
    quote1: "Vom Block ins Grundbuch.",
    band: {
      pink: "Wer ihm etwas schuldet, merkt das ziemlich schnell.",
      body: "Sein Netzwerk reicht von Dre'Quan Priests Label bis in Ecken der Stadt, in denen niemand Fragen stellt."
    },
    bandShots: [["chars/boobie_04.jpg", "Boobie Ike bei Nacht"]],
    full: "chars/boobie_01.jpg",
    fullAlt: "Boobie Ike in seinem Club in Vice City",
    fullCap: "Vice City · Club, Studio, Grundbuch",
    quote2: "Straße bleibt Straße.<br>Nur das Konto ändert sich.",
    band2: {
      body: "Boobie investiert in Leute, nicht in Ideen. Wer bei ihm anfängt, arbeitet erst und redet später.",
      pink: "Sein Geschäft läuft leise. Genau das ist der Punkt."
    },
    gallery: [
      ["chars/boobie_01.jpg", "Boobie Ike — Bild 1"],
      ["chars/boobie_02.jpg", "Boobie Ike — Bild 2"],
      ["chars/boobie_03.jpg", "Boobie Ike — Bild 3"],
      ["chars/boobie_04.jpg", "Boobie Ike — Bild 4"]
    ],
    outro: [["art/jason_lucia_01.jpg", "Jason und Lucia — Artwork"]]
  },

  drequan: {
    side: "left",
    kicker: "Nebenfigur",
    heroImg: "assets/img/art/drequan_priest.jpg",
    lead: "Dre'Quan kam über selbstgebaute Beats nach oben — und betreibt heute sein eigenes Label.",
    intro: [
      "Only Raw Records. Sein Ziel ist simpel: einen echten Hit landen, bevor ihm jemand anderes zuvorkommt.",
      "Bei ihm unter Vertrag: Real Dimez."
    ],
    introShots: [
      ["chars/drequan_02.jpg", "Dre'Quan Priest im Studio"],
      ["chars/drequan_03.jpg", "Dre'Quan Priest in Vice City"]
    ],
    quote1: "Only Raw Records.",
    band: {
      pink: "Ein Hit trennt ihn von allem.",
      body: "Wenn Bae-Luxe und Roxy noch einmal einschlagen, ist Dre'Quan der Mann, der davon am meisten hat — und der am meisten zu verlieren hat, wenn nicht."
    },
    bandShots: [["chars/drequan_04.jpg", "Dre'Quan Priest bei einem Auftritt"]],
    full: "chars/drequan_01.jpg",
    fullAlt: "Dre'Quan Priest im Studio von Only Raw Records",
    fullCap: "Vice City · alles auf eine Platte",
    quote2: "Er hat die Halle gefüllt.<br>Jetzt braucht er die Charts.",
    band2: {
      body: "Zwischen Studio, Boobie Ikes Geld und den Erwartungen der Stadt bleibt Dre'Quan wenig Spielraum für einen zweiten Anlauf.",
      pink: "Mixtapes waren die einfache Phase."
    },
    gallery: [
      ["chars/drequan_01.jpg", "Dre'Quan Priest — Bild 1"],
      ["chars/drequan_02.jpg", "Dre'Quan Priest — Bild 2"],
      ["chars/drequan_03.jpg", "Dre'Quan Priest — Bild 3"],
      ["chars/drequan_04.jpg", "Dre'Quan Priest — Bild 4"]
    ],
    outro: [["art/real_dimez.jpg", "Real Dimez — Artwork"]]
  },

  dimez: {
    side: "right",
    kicker: "Nebenfiguren",
    heroImg: "assets/img/art/real_dimez.jpg",
    lead: "Bae-Luxe und Roxy sind seit der Highschool befreundet — und clever genug, daraus Geld zu machen.",
    intro: [
      "Ihre Zeit als Abzockerinnen lokaler Dealer haben sie in deftige Rap-Tracks verwandelt und in eine Social-Media-Präsenz, die nie stillsteht.",
      "Ein früher Hit mit dem Rapper DWNPLY brachte sie ganz nach oben."
    ],
    introShots: [
      ["chars/dimez_02.jpg", "Real Dimez auf der Bühne"],
      ["chars/dimez_03.jpg", "Real Dimez in Vice City"]
    ],
    quote1: "One hit away from fame.",
    band: {
      pink: "Fünf Jahre und eine Menge Ärger später.",
      body: "Jetzt stehen sie bei Only Raw Records unter Vertrag und hoffen, dass der Blitz zweimal einschlägt."
    },
    bandShots: [["chars/dimez_04.jpg", "Real Dimez bei Nacht"]],
    full: "chars/dimez_01.jpg",
    fullAlt: "Real Dimez bei einem Auftritt",
    fullCap: "Vice City · zwei Stimmen, ein Versuch",
    quote2: "Sie waren schon einmal oben.<br>Der Weg zurück ist kürzer.",
    band2: {
      body: "Bae-Luxe schreibt, Roxy führt. Zusammen sind sie das lauteste Argument, das Dre'Quans Label vorzuweisen hat.",
      pink: "Der Hustle hat nur das Format gewechselt."
    },
    gallery: [
      ["chars/dimez_01.jpg", "Real Dimez — Bild 1"],
      ["chars/dimez_02.jpg", "Real Dimez — Bild 2"],
      ["chars/dimez_03.jpg", "Real Dimez — Bild 3"],
      ["chars/dimez_04.jpg", "Real Dimez — Bild 4"]
    ],
    outro: [["art/drequan_priest.jpg", "Dre'Quan Priest — Artwork"]]
  },

  raul: {
    side: "left",
    kicker: "Nebenfigur",
    heroImg: "assets/img/art/raul_bautista.jpg",
    lead: "Selbstbewusstsein, Charme und Gerissenheit — Raul ist ein erfahrener Bankräuber.",
    intro: [
      "Ständig auf der Suche nach Leuten, die bereit sind, für den ganz großen Ertrag das ganz große Risiko zu nehmen.",
      "Seine Rücksichtslosigkeit erhöht mit jedem Coup den Einsatz."
    ],
    introShots: [
      ["chars/raul_02.jpg", "Raul Bautista in Port Gellhorn"],
      ["chars/raul_03.jpg", "Raul Bautista mit seiner Crew"]
    ],
    quote1: "Experience counts.",
    band: {
      pink: "Früher oder später muss seine Crew entscheiden.",
      body: "Nachlegen — oder die Chips vom Tisch nehmen. Raul selbst hat diese Frage für sich längst beantwortet."
    },
    bandShots: [["chars/raul_04.jpg", "Raul Bautista bei einem Überfall"]],
    full: "chars/raul_01.jpg",
    fullAlt: "Raul Bautista mit seiner Crew in Port Gellhorn",
    fullCap: "Port Gellhorn · immer ein Ding zu viel",
    quote2: "Erfahrung schützt ihn.<br>Nur nicht vor sich selbst.",
    band2: {
      body: "Wer bei Raul mitfährt, verdient mehr als anderswo. Und trägt jedes Mal ein bisschen mehr Risiko mit.",
      pink: "Der nächste Coup ist immer der größte."
    },
    gallery: [
      ["chars/raul_01.jpg", "Raul Bautista — Bild 1"],
      ["chars/raul_02.jpg", "Raul Bautista — Bild 2"],
      ["chars/raul_03.jpg", "Raul Bautista — Bild 3"],
      ["chars/raul_04.jpg", "Raul Bautista — Bild 4"]
    ],
    outro: [["art/jason_lucia_robbery.jpg", "Jason und Lucia bei einem Überfall"]]
  },

  brian: {
    side: "right",
    kicker: "Nebenfigur",
    heroImg: "assets/img/art/brian_heder.jpg",
    lead: "Brian ist ein klassischer Schmuggler aus der goldenen Ära der Keys.",
    intro: [
      "Über seine Bootswerft läuft mit seiner dritten Frau Lori noch immer Ware — nur lässt er die schmutzige Arbeit inzwischen andere machen.",
      "Sieht aus wie ein Strandpenner. Bewegt sich wie ein Weißer Hai."
    ],
    introShots: [
      ["chars/brian_02.jpg", "Brian Heder auf seiner Bootswerft"],
      ["chars/brian_03.jpg", "Brian Heder in den Leonida Keys"]
    ],
    quote1: "Nothing better than<br>a Mudslide at sunset.",
    band: {
      pink: "Jason wohnt mietfrei bei ihm.",
      body: "Solange er bei den lokalen Abzocken hilft und ab und zu auf Loris Sangria vorbeischaut. Der Deal steht — bis er es nicht mehr tut."
    },
    bandShots: [["chars/brian_04.jpg", "Brian Heder am Wasser"]],
    full: "chars/brian_01.jpg",
    fullAlt: "Brian Heder auf seiner Bootswerft",
    fullCap: "Leonida Keys · die Werft, über die alles läuft",
    quote2: "Freundlich zu allen.<br>Verbindlich zu keinem.",
    band2: {
      body: "Brian hat jede Razzia der letzten dreißig Jahre überstanden, weil er nie derjenige war, der das Boot gefahren hat.",
      pink: "Ein Gefallen von ihm ist nie umsonst."
    },
    gallery: [
      ["chars/brian_01.jpg", "Brian Heder — Bild 1"],
      ["chars/brian_02.jpg", "Brian Heder — Bild 2"],
      ["chars/brian_03.jpg", "Brian Heder — Bild 3"],
      ["chars/brian_04.jpg", "Brian Heder — Bild 4"]
    ],
    outro: [["art/jason_lucia_beach.jpg", "Jason und Lucia am Strand"]]
  }
};
