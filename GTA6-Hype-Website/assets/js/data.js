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
  const push = (cat, files, cap) => files.forEach((f, i) => g.push({ src: "assets/img/" + f, cat, cap: cap + " " + String(i + 1).padStart(2, "0") }));

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
    "art/raul_bautista.jpg","art/brian_heder.jpg"
  ], "Charakter");

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
  { id: "art",      label: "Artworks" },
  { id: "ultimate", label: "Ultimate Edition" }
];
