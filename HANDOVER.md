# Übergabe — GTA VI Fan-Website

Kurzfassung des Projektstands für die nächste KI, die daran weiterarbeitet.

## Was das ist

Eine private, **inoffizielle Fan-Website zu Grand Theft Auto VI**, gebaut als Hype-Seite für
den Besitzer (hat die Ultimate Edition vorbestellt). Sie ist kein Shop und keine Kopie der
Rockstar-Seite, sondern eine eigene Scroll-Erzählung im Look von `rockstargames.com/VI`.

**Sprache: Deutsch, per Schalter auch Englisch** (Abschnitt „Sprache"). Englische Zitate von
Rockstar bleiben in beiden Fassungen wörtlich stehen.

- **Pfad:** `C:\Users\young\OneDrive\Desktop\Claude Projekte\GTA6-Hype-Website`
- **Stack:** statisches HTML/CSS/JS, **kein Build-Schritt**, keine Abhängigkeiten außer Google Fonts
- **Umfang:** ~4.400 Zeilen Code, 150 Bilder, 10 Videos, ~85 MB
- **Öffentlich auf https://luciajason.de** (GitHub Pages) — Arbeitsweise in `CLAUDE.md`
- **Benutzerkonten** über Firebase, siehe Abschnitt „Benutzerkonten" und `KONTO-EINRICHTEN.md`

### Starten

**Doppelklick auf `Server starten.bat`** — einmal, danach nie wieder. Der Server läuft als
Hintergrunddienst weiter und kommt nach jedem Neustart von selbst hoch.
**`Server stoppen.bat`** beendet ihn und schaltet den Autostart wieder ab.
Details unten im Abschnitt „Hintergrund-Server & Autostart".

Von Hand, mit Fenster und `Strg+C`:

```bash
cd "C:\Users\young\OneDrive\Desktop\Claude Projekte\GTA6-Hype-Website"
python serve.py
```

Dann `http://localhost:5174` öffnen. Die Adresse fürs Handy steht in `server.log`.

`serve.py` ersetzt `python -m http.server` und kann drei Dinge mehr:

| | Warum |
|---|---|
| **Range-Requests (206)** | Ohne die meldet der Browser für MP4s `seekable = 0–0` — genau der Fallstrick aus Abschnitt 1. Mit Range-Support ist die Direktquelle spulbar und der Blob-Umweg entfällt |
| **`Cache-Control: no-store`** | Löst den Cache-Fallstrick aus Abschnitt 6 an der Wurzel |
| **Bindet auf `0.0.0.0`** | Damit ist die Seite vom Handy im selben WLAN erreichbar |

## Dateien

| Datei | Zeilen | Inhalt |
|---|---:|---|
| `index.html` | 481 | Struktur aller Abschnitte der Startseite |
| `charakter.html` | 125 | **Gerüst aller Akten** — alle acht auf einer durchgehenden Seite |
| `konto.html` | 110 | Kontoseite, Inhalt baut `konto/profil.js` |
| `datenschutz.html` | 160 | Datenschutzerklärung DE/EN |
| `assets/css/style.css` | 1351 | Design-Tokens, Layout, Responsive, Reduced-Motion, **Mobil-Block M1–M9** |
| `assets/css/char.css` | 476 | **Nur die Detailseiten** — Editorial-Raster, Zitatbänder, Vollbild |
| `assets/js/data.js` | 670 | **Alle Texte und Bildlisten**; `CHARS` (Stammdaten) + `CHAR_PAGES` (Seitenaufbau) |
| `assets/js/main.js` | 810 | Countdown, Scroll-Motor, Videos, Galerie, 3D-Hülle |
| `assets/js/char.js` | 700 | Baut alle acht Akten, ein Scroll-Motor für alle, Einstiegssprung, Lightbox |
| `assets/js/i18n.js` | 125 | Sprachwahl, `data-en`-Einsetzen, `L()` — im `<head>` jeder Seite |
| `assets/js/data.en.js` | 480 | Englische Texte zu `data.js` |
| `assets/js/seite.js` | 55 | Menü, Countdown-Pille — für `konto.html` und `datenschutz.html` |
| `assets/js/konto-config.js` | 50 | Firebase-Werte und Schalter `live` |
| `assets/js/konto/backend.js` | 430 | Firebase **oder** Demo-Modus hinter derselben Schnittstelle |
| `assets/js/konto/konto.js` | 590 | Zustand, Anmelde-Knopf in der Nav, Anmelde-Dialog |
| `assets/js/konto/profil.js` | 700 | Kontoseite: Profilkopf, Bildauswahl, Newsletter, Sicherheit, Löschen |
| `assets/js/konto/zuschnitt.js` | 330 | Bild zuschneiden: ziehen, zoomen, Vorschau |
| `assets/css/konto.css` | 580 | Nav-Knopf, Dialog, Kontoseite, Datenschutzseite |
| `firestore.rules` | 120 | Sicherheitsregeln — in die Firebase-Konsole kopieren |
| `assets/img/avatars/` | 9 | Profilbild-Vorlagen 256 px: VI-Logo + 8 Figuren (Zuschnitte der Artworks) |
| `assets/img/covers/` | 9 | Titelbild-Vorlagen 1500 × 500 px (3 : 1) aus Artworks und Screenshots |
| `assets/img/` | 150 | `art/` 20, `chars/` 49, `duo/` 13, `places/` 42, `ultimate/` 26 |
| `assets/img/app/` | 4 | quadratische Symbole für den Android-Startbildschirm |
| `assets/video/` | 10 | 2 Scroll-Clips + 8 Charakter-Loops |
| `Server starten.bat` | 126 | Hintergrund-Server starten + Autostart einrichten |
| `Server stoppen.bat` | 42 | Server beenden + Autostart entfernen |
| `serve.py` | 213 | Der Server dahinter |
| `server.log` | — | Startzeiten und Adressen, wird automatisch angelegt |
| `manifest.webmanifest` | — | Name/Symbol für „Zum Startbildschirm hinzufügen" |
| `_backup/` | 3 | Stand vor dem Mobil-Umbau, zum Vergleichen |
| `Bilder & Kurz videos/` | 32 | Original-Downloads des Nutzers, **unangetastet lassen** |

Inhalte pflegt man fast immer in `data.js` — neues Bild nach `assets/img/<ordner>/` legen und
in der passenden Liste eintragen, sonst nichts.

## Reihenfolge der Abschnitte

1. **Hero** — gepinnt (320vh), Skyline, GTA-VI-Logo, Live-Countdown auf den 19.11.2026
2. **Trailer & Gameplay** — fährt als Karte über den Hero
3. **Scroll-Video 1** — Lucia in Vice City
4. **Story „Vice City, USA"** — Karte über dem Video
5. **Charaktere** — Jason, Lucia + 6 Nebenfiguren; jede Karte verlinkt in einem neuen Tab auf ihre eigene Detailseite
6. **Leonida** — 6 Regionen mit Tabs
7. **Ultimate Edition** — Inhalte + drehbare 3D-Hülle
8. **Scroll-Video 2** — Jason beim Überfall
9. **News & Leak-Lage** — Karte über dem Video
10. **Medien** — filterbare Galerie mit Lightbox
11. **Finale + Footer**

## Funktionen

- **Live-Countdown** auf 19.11.2026, zusätzlich als Pille in der Navigation und im Mobile-Menü
- **Gepinnter Hero mit gestaffeltem Ausblenden:** beim Scrollen kommt zunächst kein neuer
  Inhalt. Erst blendet der Textblock aus (das Logo geht dabei nur auf 68 % zurück, bleibt also
  sichtbar), danach verschwindet das Logo ganz, zuletzt geht der Hintergrund auf die Grundfarbe
- **Zwei scroll-gesteuerte Videos:** Wiedergabe hängt an der Scrollposition. Scrollen = Video
  läuft, Stoppen = Video steht. Beide blenden schon hinter dem vorherigen Abschnitt auf
- **`.rise-card`-Übergänge:** der Folgeabschnitt fährt als abgerundete Box von unten über den
  gepinnten Abschnitt, die Kartenfläche blendet dabei ein, der Hintergrund geht auf Blau über
- **Charakter-Akten:** Klick öffnet `charakter.html?c=<id>` **in einem neuen Tab** — eine
  eigene, scroll-erzählte Seite je Figur. Details im Abschnitt „Charakter-Detailseiten".
  Hover startet auf der Karte einen kurzen Videoloop (bei **allen** Karten, auch Jason und
  Lucia). Auf Touch übernimmt das ein IntersectionObserver, siehe „Mobil / Android"
- **Orte:** Tab-Navigation über 6 Regionen mit Postkarte, Text und Thumbnails
- **Ultimate Edition:** 16 Inhalte als Kacheln + Spielhülle in CSS-3D, die auf Mausbewegung
  reagiert und sich ziehen lässt
- **Galerie:** 136 Bilder, 7 Filter, Lightbox mit Pfeiltasten und Wischgesten
- **News:** Aufmacher (aktuell „GTA VI: The Album"), Rockstar Newswire **aktualisiert sich
  selbst** (Abschnitt „Newswire automatisch"), Leak-Chronik mit Quellen, X-Accounts
- **Trailer:** Trailer 1 + 2 als YouTube-Overlay auf der Seite, Extended Look als externer Link
- **Barrierefreiheit:** Skip-Link, Fokus-Ringe, ARIA-Labels, vollständiger `prefers-reduced-motion`-Zweig
- **Mobil:** eigener Verhaltenszweig für Touch — Details im Abschnitt „Mobil / Android"
- **Deutsch / Englisch:** Schalter oben rechts, Direktlink `?lang=en` — Abschnitt „Sprache"
- **Benutzerkonten:** Anmelden per E-Mail oder Google, Profilansicht + Bearbeiten, mehrere
  Konten mit Wechsler, Newsletter — Abschnitt „Benutzerkonten" (live seit 17.09.2026)
- Geprüft auf 375×812, 812×375 (quer), 1280 und 1440 px

## Technische Fallstricke — das Wichtigste für Nachfolger

### 1 · Videos müssen spulbar sein — drei Stufen

**Wichtigster Punkt.** Je nach Server meldet der Browser für ein per HTTP ausgeliefertes MP4
`seekable = 0–0`. Das Setzen von `currentTime` wird dann **stillschweigend ignoriert** — das
Video bleibt auf dem ersten Bild stehen und sieht aus wie ein Standbild. `buffered` meldet
dabei trotzdem die volle Länge, die Fehlersuche führt also leicht in die Irre.

`load()` in `main.js` geht deshalb eine Leiter durch:

1. **Direktquelle prüfen.** Beherrscht der Server Range-Requests — `serve.py` tut das —,
   meldet der Browser `seekable: 0–<dauer>` und die Datei ist ohne Umweg spulbar. Auf dem
   Handy spart das den vollständigen Download in den Arbeitsspeicher.
2. **Blob-Umweg.** Sonst wird die Datei per `fetch` geholt und als `blob:`-URL ins `<video>`
   gehängt; damit ist sie immer voll spulbar. **Nicht entfernen** — greift bei jedem anderen
   Server ohne Range-Support.
3. **Loop-Rückfall.** Klappt beides nicht, läuft der Clip stumm in der Schleife statt als
   eingefrorenes Standbild (`looping`-Zweig, pausiert außerhalb des Bilds).

**Zusätzlich, und auf dem Handy entscheidend: der Decoder muss geweckt werden.**
Android und iOS liefern für ein `<video>`, das noch nie abgespielt wurde, **keine
dekodierten Bilder**. `currentTime` lässt sich setzen, `seekable` meldet die volle Länge,
`readyState` steht sogar auf 4 — die Fläche bleibt trotzdem schwarz. Da der Code an der
Stelle das Poster entfernt, sah man auf dem Handy gar nichts: keine Animation zwischen
Trailer und Story, keine zwischen Ultimate und News. `weckeDecoder()` spielt das Video
deshalb einmal stumm an und pausiert sofort wieder; danach spult es wie am Desktop.
Stumm ist Pflicht, sonst verweigert der Browser die Wiedergabe ohne Nutzergeste.
Das Poster fällt erst, wenn `readyState >= 2` ist — sonst bliebe ein leerer Rahmen.

**Zwei Auslöser fürs Laden.** Auf Touch startet der Download erst, wenn der Abschnitt in
die Nähe kommt (spart rund 5 MB beim Seitenaufruf). Ausgelöst wird das vom
IntersectionObserver **und** vom Scroll-Motor (`ladeEinmal`). Hinge es allein am
Beobachter und der meldet sich nicht, stünde dort dauerhaft das Standbild.

### 2 · Schriften

Rockstar nutzt die hauseigene **GTAArtDeco** (fünf Schnitte). Nicht käuflich, nicht
lizenziert, und ihr Server schickt keinen `Access-Control-Allow-Origin`-Header — sie lässt
sich also auch nicht per `@font-face` einbinden. **Die Schriftdatei nicht kopieren.**

Ersatz, gemessen gegen die echten Schnitte (gleicher Text, 100 px):

| Rockstar | Ersatz | Abweichung |
|---|---|---|
| ArtDeco Condensed Heavy (965,7 px, Versalhöhe 70) | **Barlow Condensed 800** (984,2 px, 71) | +1,9 % |
| ArtDeco Bold (1829,4 px, Versalhöhe 70) | **Figtree 700** (1731,3 px, 67) | −5,4 % |

Ausgeglichen über `letter-spacing:-.004em` auf `.h-display` und `font-size:17.6px` auf `body`.
Tokens: `--f-display`, `--f-body`, `--f-label`.

**Falle:** In der Google-Fonts-URL keine Achse angeben, die die Familie nicht hat. Ein
`opsz` bei Figtree führte dazu, dass Google die Familie **kommentarlos gar nicht ausliefert** —
der komplette Fließtext lief wochenlang auf System-Schrift, ohne Fehlermeldung.

### 3 · YouTube

| Video | ID | Einbindung |
|---|---|---|
| Trailer 1 | `QdBZY2fkU-0` | Overlay auf der Seite |
| Trailer 2 | `VQRLujxTm3c` | Overlay auf der Seite |
| An Extended Look | `tJbzMqJGH4k` | **nur externer Link** |

Der Extended Look ist altersbeschränkt; YouTube verbietet die Einbettung solcher Videos auf
fremden Seiten. Netflix-Direktlink: `netflix.com/watch/83035795?trackId=259776131&trkId=259776131&src=tudum`

**Falle:** Der iframe-Container braucht eine eigene Höhe. Ohne die fällt das iframe auf seine
Standardhöhe von **150 px** zurück und der Player erscheint als schmaler Streifen.

### 4 · Scroll-Motor

`scrollStage(el, onUpdate)` liest die Scrollposition eines Abschnitts einmal pro Frame und
zieht den Wert weich nach (Lerp 0.16). Ohne das springen die Werte im Takt der Mausrad-Schritte
und es sieht beim langsamen Scrollen nach Haken aus. Läuft `requestAnimationFrame` nicht
(Tab im Hintergrund), greift nach 260 ms ein direkter Fallback.

### 5 · Stellschrauben

In `style.css`:

| Wert | Wirkung |
|---|---|
| `.hero { height: 320vh }` | Länge der Ausblend-Staffel (größer = langsamer) |
| `.scrub { height: 400vh }` | Länge einer Video-Sequenz |
| `.scrub { margin-top: -100svh }` | Video liegt hinter dem vorherigen Abschnitt |
| `.rise-card { --rise }` | Überlappung der Karte in svh, Standard 100 |
| `#story, #news { --rise: 130 }` | Karte startet schon bei rund drei Vierteln des Clips |

Für Handys stehen dieselben Höhen noch einmal im Mobil-Block `M5`/`M6` — **in `svh` statt
`vh`** und kürzer (Hero 240/205, Scrub 250/215). Ändert man oben, muss man dort mitziehen.

In `main.js`: `FADE_IN = 0.22` (Video aufgeblendet), `PLAY_END = 0.90` (Clip durchgelaufen).
Wiedergabe startet bei 0 %, damit sich das Bild schon bewegt, während es aufblendet.

CSS-Variablen, die das JS setzt: `--h-body`, `--h-logo`, `--h-out` (Hero) sowie `--v-in`,
`--z`, `--s-out` (Video) und `--card-bg` (Kartenfläche).

### 6 · Weitere Stolpersteine

- **Browser-Cache beim Testen:** Headless Chrome mit persistentem Profil liefert altes CSS/JS
  aus. Bei „Änderung wirkt nicht" zuerst das Profil löschen, nicht den Code.
  `serve.py` schickt inzwischen `Cache-Control: no-store` und nimmt dem Problem die Spitze
- **Flexbox:** Bilder als Flex-Item brauchen `min-width: 0`, sonst schrumpfen sie wegen
  `min-width: auto` nicht unter ihre Eigenbreite und sprengen die Zeile
- **Kurze Clips:** Rockstars Charakter-Clips sind nur 1–1,5 s (30–45 Bilder) — viel zu wenig
  zum Scrubben. Per Bewegungsinterpolation gestreckt:
  ```bash
  ffmpeg -i quelle.mp4 -vf "scale=1280:-2,minterpolate=fps=150:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=5*PTS,fps=30" -an -c:v libx264 -crf 24 -g 5 -keyint_min 5 -sc_threshold 0 -bf 0 -movflags +faststart ziel.mp4
  ```
  Die **dichten Keyframes (`-g 5`) sind Pflicht**, sonst ruckelt das Scrubben

## Charakter-Detailseiten

Jede Charakterkarte auf der Startseite ist ein **echter Link**, der
`charakter.html?c=<id>` in einem neuen Tab öffnet — nachgebaut nach den
Figurenseiten auf `rockstargames.com/VI`.

**Alle acht Akten stehen untereinander auf einer durchgehenden Seite.** Unten bei
Jason geht es ohne Klick direkt in Lucias Hero über, danach Cal Hampton und so
weiter bis Brian Heder. `?c=<id>` bestimmt nur, **wo man einsteigt**; beim Scrollen
läuft die Adresse mit, damit sich jede Akte einzeln teilen lässt. Eine unbekannte
`id` startet schlicht bei Jason.

Daraus folgen drei Dinge, die man beim Weiterbauen kennen muss:

| | |
|---|---|
| **Länge** | rund 47.000 px am Desktop, 38.000 px auf dem Handy — etwa 65 bzw. 47 Bildschirme |
| **Orientierung** | die Nav zeigt Name und Zähler („03 / 08"), das Menü ist eine Kapitelliste. Ohne beides wäre die Strecke nicht zu bewältigen |
| **Ein Scroll-Motor** | acht Bühnen hängen an **einer** Schleife, nicht an acht eigenen — Messung: 0,057 ms pro Frame, 0,3 % des 60-fps-Budgets |

| Datei | Rolle |
|---|---|
| `charakter.html` | nur Gerüst: Nav, leerer `#charRoot`, Footer, Lightbox |
| `assets/js/char.js` | baut den Inhalt, Scroll-Video, Vollbild, Lightbox, Nav |
| `assets/css/char.css` | alle `.c*`-Bausteine; erbt die Tokens aus `style.css` |
| `CHAR_PAGES` in `data.js` | **hier stehen die Inhalte** — pro Figur ein Objekt |

### Aufbau einer Seite

1. **`.cv`** — Hero im Vollbild, Name darüber, blendet beim Scrollen aus.
   **Jason und Lucia** bekommen ihren scroll-gesteuerten Clip (`scrub_jason.mp4`,
   der Überfall; `scrub_lucia.mp4`, die Autofahrt — dieselben Dateien wie auf der
   Startseite). **Alle anderen zeigen ein Standbild** (`page.heroImg`, das Artwork
   in 1920×1080). Grund: Rockstars `loop_*.mp4` sind 1–1,5-Sekunden-Schnipsel,
   fürs Scrubben hochinterpoliert — im Vollbild sieht man das sofort. Der Zweig
   hängt an `page.scrub`: gesetzt = Video, sonst `heroImg`.
2. **`.cintro`** — **fährt als `.rise-card` von unten über den Hero**, genau wie
   Trailer → Story auf der Startseite: Kartenfläche blendet über `--card-bg` ein,
   der Hero dahinter geht über `--s-out` auf die Grundfarbe (`.cv__out`).
   Inhalt: Name, Lead-Satz in Pink, Fließtext, Metadaten; gegenüber ein Cluster
   aus drei versetzt ineinandergeschobenen Bildern.
3. **`.cquote`** — Zitatband quer über die Seite, Creme, `h-display`-Schnitt.
4. **`.cband`** — zwei Spalten, eine Pink, eine Weiß, gegeneinander abgesackt.
5. **`.cfull`** — Bild über die volle Breite. **Kein sticky, kein Parallax, kein
   Zoom** — es gilt das natürliche 16:9 und das Bild scrollt normal mit, damit es
   vollständig zu sehen ist. Jason: `chars/jason_07.jpg`, Lucia: `duo/duo_10.jpg`,
   Nebenfiguren: ihr jeweiliges `chars/<id>_01.jpg`.
6. **`.cquote` + `.cband`** noch einmal, Spalten getauscht.
7. **`.cgal`** — Bilderraster, erstes Bild doppelt so groß.
8. **`.coutro`** — nur noch die Abschlussbilder. Danach beginnt direkt der Hero
   der nächsten Figur; die früheren Blätter-Karten sind entfallen, weil man
   ohnehin weiterscrollt. Ganz unten hinter Brian Heder steht einmalig
   **`.cende`** mit „Zurück zu den Charakteren", „Zur Startseite" und
   „Nach oben".

### Der `side`-Schalter

`page.side` ist `"left"` oder `"right"` und dreht das komplette Layout:
Textspalte, Bildercluster, Zitat-Ausrichtung und die Reihenfolge der beiden
Textbänder. **Jason steht links, Lucia rechts** — dadurch spiegeln sich die
beiden Hauptfiguren, statt zweimal dasselbe zu zeigen. Genau so macht es
Rockstar auch. Für eine neue Figur reicht es, `side` zu setzen; der Rest folgt.

### Neue Figur ergänzen

Einen Eintrag in `CHARS` (Stammdaten) **und** einen in `CHAR_PAGES` anlegen.
Fehlt der zweite, zeigt die Seite den Fehlerzustand. Pflichtfelder:
`side, kicker, lead, intro, introShots, quote1, band, bandShots, full, fullAlt,
fullCap, quote2, band2, gallery, outro` — dazu **entweder** `scrub` + `scrubPoster`
(scroll-gesteuerter Clip) **oder** `heroImg` (Standbild).
Bildangaben sind Paare `["pfad/ab/assets/img", "Alt-Text"]` — der Alt-Text ist
gleichzeitig die Bildunterschrift in der Lightbox, also ganze Sätze schreiben.

### Der Einstieg per `?c=`

Der Sprung zur richtigen Figur ist heikler, als er aussieht — zwei Dinge stehen
ihm im Weg:

1. **Der Browser stellt die alte Scrollposition wieder her**, und zwar *nach*
   unserem Sprung. `history.scrollRestoration = "manual"` schaltet das ab.
2. **`scroll-behavior: smooth`** steht in `style.css` auf `<html>`. Ohne
   Aushebeln würde der Sprung als weiche Fahrt über zehntausende Pixel
   losrollen. Während des Sprungs wird es per Inline-Style auf `auto` gesetzt.

Dazu kommt: Die Zielhöhe verschiebt sich noch, während Schriften und die ersten
Bilder ankommen. Mit einem Durchgang landete der Sprung **169 px daneben**,
mit einer festen Zahl von Frames sogar **33.665 px**. Deshalb drei Runden —
sofort, nach `load` und wenn die Schriften stehen. Sobald der Nutzer selbst
scrollt, wird abgebrochen; sonst zöge die Seite ihn zurück.

### Drei Fallstricke

**Die Hero-Höhe steuert zwei Dinge gleichzeitig.**

1. *Wie schnell der Clip läuft.* Die nutzbare Strecke ist `Höhe − 100svh` (die
   ersten 100 svh klebt das Medium nur), davon spielt `PLAY_END` (0.90) den Clip
   ab. `.cv` steht wie `.scrub` auf der Startseite **überall auf 400 svh** —
   Desktop, Tablet, Handy, Querformat. Gemessen: 2,70 Bildschirmhöhen für einen
   ganzen Clip, auf beiden Seiten und jedem Gerät gleich.
2. *Ob die Karte passt.* Die Höhe muss mindestens `--rise + 100svh` betragen,
   sonst ragt die Intro-Karte schon beim Laden ins Bild und der Name steht
   doppelt da. Betrifft heute nur noch die kürzeren Standbild-Heroes
   (`.cv--still`); dort ist `--rise` mobil auf 100 gesenkt.

**Helle Artworks brauchen einen kräftigeren Verlauf.** Der Kicker über dem Hero
kam auf Rauls hellem Artwork auf **1,37 : 1** — unlesbar. Der untere Teil von
`.cv__vig` setzt jetzt früher an und erreicht am Fuß fast die Grundfarbe;
zusätzlich ist der Kicker von `--vice-hot` auf das hellere `--pink` gewechselt.
Gemessen danach: Kicker 7,1 : 1, Name 14 : 1. Wer den Verlauf abschwächt, muss
gegen ein **helles** Artwork nachmessen, nicht gegen Jasons dunklen Clip.

### Zwei weitere Fallstricke

**`overflow:hidden` bricht `position:sticky`.** Das Elternelement wird dadurch zum
eigenen Scroll-Container, das Kind klebt nicht mehr und der Inhalt scrollt einfach
weg. Beschnitten wird deshalb immer eine Ebene tiefer (`.cv__sticky`), nie am
Abschnitt selbst. `.cfull` hatte den Fehler auch, ist inzwischen aber gar nicht
mehr gepinnt.

**Der IntersectionObserver überspringt schnell durchlaufende Elemente.** Wischt
man kräftig, liegt ein Absatz zwischen zwei Frames einmal komplett hinter dem
Bild — der Observer meldet dafür nichts und der Absatz bleibt dauerhaft auf
Deckkraft 0 stehen. Beide Seiten haben deshalb ein Sicherheitsnetz: pro Frame
wird geprüft, was oben aus dem Bild heraus ist und noch nicht eingeblendet
wurde. Die Liste ist kurz und schrumpft mit jedem Treffer.
(`reveals()` in `char.js`, `watchReveals` in `main.js`.)

### Bildbestand

`assets/img/duo/` (13 Bilder) sind die Aufnahmen mit **beiden** Figuren,
`chars/jason_07|08`, `chars/lucia_07|08|10` die neuen Einzelbilder. Alle aus
Rockstars Downloadbereich, von 3840 px auf 1600 px verkleinert (die beiden
Vollbilder auf 2560 px), JPEG-Qualität 84.

`node` + ein kurzes Skript prüfen, ob alle in `CHAR_PAGES` genannten Pfade
existieren — bei 84 Pfaden findet man einen Tippfehler sonst erst im Browser.

## Hintergrund-Server & Autostart

Der Server soll einmal gestartet werden und dann dauerhaft laufen — auch über einen
Neustart hinweg. Drei Bausteine:

| | |
|---|---|
| `Server starten.bat` | startet den Server unsichtbar, legt die Autostart-Verknüpfung an, öffnet den Browser, schließt sich nach 12 s |
| `Server stoppen.bat` | beendet den Prozess **und** entfernt die Verknüpfung |
| `%APPDATA%\...\Startup\GTA VI Server.lnk` | zeigt direkt auf `pythonw.exe` mit `serve.py --no-browser --port 5174 --log ...` |

### Warum `pythonw.exe`

Der entscheidende Punkt. Ein mit `python.exe` gestarteter Prozess hängt an der Konsole des
aufrufenden Fensters — schließt sich das Fenster, stirbt er mit. `pythonw.exe` ist derselbe
Interpreter **ohne Konsole**; der Prozess überlebt das Schließen und blitzt beim Hochfahren
auch kein Fenster auf.

Der Preis: unter `pythonw` sind `sys.stdout` und `sys.stderr` **`None`**. Ein nacktes
`print()` bricht dort mit `AttributeError` ab — und zwar unsichtbar, weil auch die
Fehlermeldung nirgends hin kann. Alle Ausgaben in `serve.py` laufen deshalb über `say()`,
das die Konsole nimmt, wenn es eine gibt, und sonst nur in die Logdatei schreibt.
`log_message` des Handlers ebenso. **Kein `print()` mehr direkt einbauen.**

### Zwei weitere Fallstricke bei den .bat-Dateien

1. **Zeilenenden und Zeichensatz.** Die Dateien müssen **reines ASCII mit CRLF** sein. Mit
   Unix-Zeilenenden zerlegt der cmd-Parser die Datei an falschen Stellen und führt plötzlich
   Kommentarzeilen als Befehle aus („Der Befehl `nt-lan-ip` ist entweder falsch
   geschrieben…"). Umlaute und Rahmenzeichen im Kommentar reichen aus, um das auszulösen.
   Ein Editor, der stillschweigend als UTF-8/LF speichert, macht die Dateien unbrauchbar.
2. **Einfache Anführungszeichen in `for /f`.** `for /f ... in ('powershell … ('*'+$env:X+'*') …')`
   funktioniert **nicht** — das erste `'` im PowerShell-Code beendet für cmd bereits die
   Befehlszeichenkette. In `Server stoppen.bat` schreibt PowerShell seine Meldung deshalb
   selbst, statt sie über `for /f` einzusammeln.

Pfade werden grundsätzlich über **Umgebungsvariablen** (`%ROOT%`, `%SCRIPT%`, `%LOG%`) an
PowerShell übergeben und dort als `$env:ROOT` gelesen. Das erspart die Anführungszeichen-Hölle
zwischen cmd und PowerShell — der Projektpfad enthält ein Leerzeichen („Claude Projekte").
Doppelte Anführungszeichen baut PowerShell mit `[char]34` zusammen.

### Wie der Stopp den richtigen Prozess findet

Über die Kommandozeile: nur Prozesse, deren Name mit `python` beginnt **und** deren
Kommandozeile den vollen Pfad zu genau diesem `serve.py` enthält. Über den Port allein wäre
es unsicher — ein fremdes Programm könnte 5174 belegen. Weil das Suchmuster erst zur Laufzeit
aus `$env:SCRIPT` zusammengesetzt wird, steht der Pfad nicht in der eigenen Kommandozeile;
der Stopp-Befehl kann sich also nicht selbst treffen.

### Geprüft

Fenster schließt sich, Server läuft weiter (`HTTP 200`), Verknüpfung liegt im Autostart-Ordner
und startet den Server sauber neu, `Server stoppen.bat` beendet ihn und räumt die Verknüpfung
weg. Doppelter Start erkennt den belegten Port und öffnet nur den Browser.

## Mobil / Android

Die Seite ist kein zweiter Codestand, sondern **dieselbe Seite** mit einem eigenen
Verhaltenszweig. Zwei Schalter steuern alles:

- **CSS:** ein zusammenhängender Block am Ende von `style.css`, Abschnitte `M1`–`M9`.
  Er greift nur über `@media (hover: none)` bzw. Breiten unter 1024 / 860 / 720 / 560 px.
  **Der Desktop-Zweig darüber ist unangetastet** — 320vh Hero, 400vh Scrub, 76px Nav.
- **JS:** `const coarse = matchMedia("(hover: none), (pointer: coarse)")` ganz oben in
  `main.js`, zusätzlich als Klasse `is-touch` am `<html>`.

### Was auf Touch anders läuft

| Thema | Desktop | Touch |
|---|---|---|
| Charakter-Karten | Videoloop bei Hover | `IntersectionObserver`: Loop ab 62 % sichtbar, Stopp unter 35 %, **höchstens 2 gleichzeitig** |
| 3D-Hülle | Neigung folgt der Maus, Ziehen dreht | keine Neigung, nur Ziehen; `touch-action: pan-y`, damit senkrecht weiter gescrollt wird. Hinweistext wechselt zu „waagerecht wischen zum Drehen" |
| Scroll-Videos | Blob-Download beim Seitenaufruf | `preload="metadata"`, Datei lädt erst per `IntersectionObserver` bei `rootMargin: 120%` — sonst gehen rund 5 MB ins Netz, bevor der Hero zu Ende gescrollt ist |
| Hover-Zustände | normal | in `M1` einzeln neutralisiert, sonst bleibt die Karte nach dem Tap angehoben stehen. Ersatz: kurzes `:active`-Zurückfedern |
| `backdrop-filter` | Countdown, Menü, Overlays | abgeschaltet, dafür deckendere Flächen. Kostet auf Mittelklasse-Android in jedem Frame Zeit — und zwar genau dort, wo der Hero ohnehin animiert |
| `mix-blend-mode` | Hero-Grain, Story-Bild | Grain aus, Story-Bild auf normale Deckkraft |

### Die vier Fallstricke, die dabei aufgetreten sind

1. **`vh` ≠ `svh` auf Android.** Der Browser blendet beim Scrollen die URL-Leiste aus. `100vh`
   ist dort die *große* Ansicht, `100svh` die kleine. `.hero__pin` und `.scrub__sticky`
   rechnen in `svh`, die Gesamthöhen standen aber in `vh` — dadurch passte die Ausblend-Staffel
   nicht zur tatsächlichen Scrollstrecke. Im Mobil-Block stehen beide Höhen in `svh`
   (Hero 240/205 svh). **Die Scroll-Videos sind davon ausgenommen** — siehe unten,
   „Scroll-Videos brauchen überall 400 svh".
2. **`resize` beim Ein- und Ausblenden der URL-Leiste.** Dasselbe Ausblenden löst ein `resize`
   aus, obwohl sich am Layout nichts geändert hat. `scrollStage` setzte dabei Ist- und Sollwert
   hart gleich — sichtbarer Sprung bei jedem Richtungswechsel. Jetzt wird bei einer **reinen
   Höhenänderung unter 200 px** nur das Ziel nachgezogen; die Differenz schluckt der weiche Lauf.
3. **Querformat.** Ein Handy quer hat rund 375 px Höhe — untereinander passt der Hero-Block
   dort nicht. Ab `max-height:560px and (orientation:landscape)` steht das Logo links und der
   Textblock rechts daneben (`M9`).
4. **Video-Dekoder.** Android-Geräte halten nur eine Handvoll gleichzeitiger Video-Dekoder
   bereit; danach bleibt das nächste Video schwarz. Deshalb das Limit von 2 Charakter-Loops
   plus den einen Scroll-Clip.

### Scroll-Videos brauchen überall 400 svh

Auf dem Handy waren die Scroll-Videos eine Zeit lang auf 250 bzw. 215 svh gekürzt.
Ergebnis: **Die Animation war auf dem Handy nicht zu sehen** — Trailer und Story lagen
direkt übereinander, das Video dazwischen im Verborgenen. Im Desktop-Modus des Handys
ging es, weil dort die breiten Regeln greifen.

Das freie Fenster, in dem das Video weder vom Abschnitt davor noch von der Karte
danach verdeckt wird:

```
frei = Höhe − 200svh − --rise
```

| | Höhe | `--rise` | frei |
|---|---:|---:|---:|
| Desktop | 400 | 130 | **+70 svh** |
| Handy (vorher) | 215 | 130 | **−115 svh** — Überlappung |
| Handy (jetzt) | 400 | 130 | **+70 svh** |

Gemessen danach auf sechs Ansichten (Desktop bis Handy quer): überall 0,70 Bildschirme.
Wer die Höhe kürzt, muss `--rise` bei `#story` und `#news` im selben Zug senken.

### Startbildschirm

`manifest.webmanifest` plus `assets/img/app/` (192, 512, maskable 512, apple-touch 180).
Die Symbole sind aus `art/vi_logo.png` auf quadratischem `#0b1124` erzeugt. Android bietet
darüber „Zum Startbildschirm hinzufügen" an. **Eine echte Installation als PWA verlangt HTTPS
oder localhost** — über die WLAN-IP bleibt es deshalb eine normale Verknüpfung. Kein
Service Worker: der würde beim lokalen Entwickeln alte Dateien ausliefern.

### Prüfen

Getestet auf 375×812, 812×375 (quer), 1440×900. Kein waagerechtes Scrollen
(`document.scrollWidth === clientWidth`), keine Konsolenfehler, Desktop-Werte unverändert.

## Preise und Adressen je Sprache

Die Seite ist zuerst deutsch: Preise stehen in **Euro**, Links führen auf die deutschen
Seiten. Auf Englisch schaltet `i18n.js` beides um — auch `href`, seit `data-en-href` im
Selektor steht.

| | Deutsch | Englisch |
|---|---|---|
| Album | CD 16,99 €, Vinyl 51,99 €, Limitiert 123,99 € (EU-Shop `gtavi-thealbum.com/en-eu`) | 19,98 / 49,98 / 124,98 $ (`gtavi-thealbum.com`) |
| Controller | 84,99 € | 84,99 $ |
| Rockstar Newswire | `rockstargames.com/de/…` | `rockstargames.com/…` |
| PlayStation Blog | `blog.de.playstation.com/…/erster-blick-auf-die-…` | `blog.playstation.com/…/first-look-at-the-…` |

`rockstargames.com/de/VI` gibt es **nicht** — das leitet auf `/VI` um. Diese Links bleiben
deshalb in beiden Sprachen gleich.

## Sprache (Deutsch / Englisch)

Schalter **DE | EN** oben rechts in der Nav, auf jeder Seite. Standard ist Deutsch. Gedacht
unter anderem dafür, die Seite international zu zeigen (Bewerbungen) — deshalb auch der
Direktlink **`luciajason.de/?lang=en`**.

| Baustein | Wie |
|---|---|
| Welche Sprache | `?lang=` in der Adresse → `localStorage.lang` → Deutsch. Entschieden in `i18n.js` im `<head>`, bevor gezeichnet wird |
| Statisches HTML | `data-en="…"` ersetzt den Inhalt (HTML erlaubt), `data-en-<attr>` das Attribut (`alt`, `aria-label`, `content`, `title`, `placeholder`, `data-yt-title`) |
| JavaScript | `L("Deutsch", "English")` |
| Inhalte | `data.en.js` überschreibt nur Textfelder der Objekte aus `data.js`; Bildunterschriften der Akten als Liste in derselben Reihenfolge |
| Umschalten | speichert, blendet 180 ms aus, **lädt neu** — alles, was `main.js`/`char.js` bauen, entsteht so von selbst in der neuen Sprache; die Scrollposition bleibt |

### Fallstricke

1. **`data-en` ersetzt den kompletten Inhalt.** Steckt darin ein Element, das JavaScript per
   ID sucht (`#finaleDays`, `#navMiniMobile`), muss es in der englischen Fassung wieder
   vorkommen. Deshalb auch: `I18N.anwenden()` steht **ganz oben** in `main.js`, `char.js`
   und `seite.js`, vor jedem `querySelector`.
2. **Knöpfe mit Symbol:** `data-en` nie auf ein Element mit `<svg>` darin setzen — der Text
   kommt in ein eigenes `<span data-en>`.
3. **Kein Aufblitzen:** Auf Englisch trägt `<html>` bis zum Einsetzen `i18n-warte`
   (`visibility:hidden`). Ein Zeitgeber gibt die Seite nach 2,5 s in jedem Fall frei.
4. **`char.js` schreibt beim Scrollen die Adresse um** (`?c=lucia`). Ein vorhandenes
   `&lang=` bleibt dabei erhalten — sonst fiele ein privates Fenster ohne Speicher beim
   Neuladen auf Deutsch zurück.
5. **„Pre-Order" gilt auch auf Englisch.** „Deine Vorbestellung" heißt dort „Your edition",
   „jede Vorbestellung" wird zu „every copy bought before launch".
6. Auf Handys unter 480 px ist in der Akten-Nav kein Platz: die Sprachwahl steht dort im
   Menü (`.lang--menu`, `char.css`).

## Benutzerkonten

Freiwillig. Registrieren mit E-Mail + Passwort oder Google, Profil (Benutzername,
Beschreibung, Profil- und Titelbild, Lieblingsfigur, Lieblingsort, Plattform, Edition,
Vorfreude, Gamertag), mehrere Konten auf einem Gerät, Newsletter-Anmeldung, Passwort ändern,
Konto selbst löschen. Anmelde-Knopf bzw. Profilbild oben rechts in der Nav, Kontoseite
`konto.html`. Einrichtung Schritt für Schritt: **`KONTO-EINRICHTEN.md`**.

### Stand

**Live seit 17.09.2026.** Firebase-Projekt `luciajason-27a74`: E-Mail/Passwort und Google
aktiv, autorisierte Domains `luciajason.de` und `www.luciajason.de`, Firestore in Frankfurt mit
den Regeln aus `firestore.rules`, bei GitHub „Enforce HTTPS" an. `konto-config.js` steht auf
`live: true`. Nachprüfen ohne Anmeldung (nur lesend):
`identitytoolkit/v3/relyingparty/getProjectConfig?key=…` (Anmeldung eingerichtet?) und
`firestore.googleapis.com/v1/projects/luciajason-27a74/databases/(default)/documents/usernames/x?key=…`
(richtige Regeln: 404 bei `usernames`, 403 bei `users`).

Firestore wartet bei fehlender Datenbank oder Verbindung still und endlos — jede
Firestore-Anfrage hat deshalb eine Frist (12 s lesen, 15 s schreiben), danach „Server nicht
erreichbar". Echte Konten gibt es nie über http:// (außer localhost). Mit `live: false`:

| Wo | Verhalten |
|---|---|
| luciajason.de | kein Anmelde-Knopf, `konto.html` zeigt „Bald verfügbar", Datenschutz-Link im Footer ausgeblendet |
| localhost | echtes Firebase-Projekt |
| WLAN-IP (http) | kein Kontosystem — unverschlüsselt |
| ohne Firebase-Werte | Demo-Modus auf localhost/WLAN, gespeichert in `localStorage` (`konto-demo`) |

**Testen ohne echte Konten:** `http://localhost:5174/konto.html?demo` erzwingt den
Demo-Modus, auch wenn Firebase eingetragen ist.

**Regeln neu veröffentlichen**, sobald sich `firestore.rules` ändert — Anleitung in
`KONTO-EINRICHTEN.md`. Mit alten Regeln schlägt das Speichern des Profils fehl.

Geprüft im Demo-Modus (17.09.2026, Profilansicht/Wechsler): Registrieren → Profilansicht,
„Profil bearbeiten" (`#bearbeiten`), alle neuen Felder speichern, 4K-Titelbild
(3840 × 2160 → WebP ≈ 650 KB), fester Hintergrund beim Scrollen, zweites Konto hinzufügen,
wechseln, entfernen, aktuelles abmelden → automatischer Wechsel, Englisch, 1440 und 390 px.

Geprüft im Demo-Modus (17.09.2026, Titelbild): eigenes Titel- und Profilbild hochladen,
ziehen, zoomen, Randbegrenzung, übernehmen, zu Vorlage wechseln und zurück, speichern,
neu laden, „Zuschnitt ändern" mit gespeichertem Bild, altes Profilformat, Englisch,
1440 und 390 px.

Geprüft im Demo-Modus: Registrieren, falsches Passwort, Anmelden, Google, Namenswahl,
Profil speichern, Namensprüfung live, eigenes Bild (1,3 MB PNG → 35 KB JPEG), Newsletter mit
und ohne bestätigte Adresse, Konto löschen, Englisch, 390 px und 1440 px, Nav-Breiten
1040/1181/1281 px. Gegen Firebase selbst nur mit einem ungültigen Schlüssel: Module laden vom
CDN, Anmeldestatus kommt, Anfragen erreichen Google. Gegen das echte Projekt nur lesend
(Regeln: `usernames` 404, `users`/`newsletter` 403; Google-Anbieter aktiv). **Registrieren mit
echtem Konto testet der Nutzer selbst** — Testkonten legt Claude nicht an.

### Aufbau

```
konto-config.js  →  konto/backend.js   Firebase oder Demo, gleiche Schnittstelle
                    konto/konto.js     Zustand · Nav-Knopf · Dialog   (jede Seite)
                    konto/profil.js    Kontoseite                      (konto.html)
```

Firebase kommt als ES-Modul vom CDN, Version fest auf **12.19.0**
(`https://www.gstatic.com/firebasejs/12.19.0/`). Kein Build-Schritt nötig.

Firestore (Spark-Tarif, kostenlos):

```
users/{uid}                username, usernameLower, bio, favChar, lang, createdAt, updatedAt,
                           avatar, avatarEigen, cover,
                           plattform, edition, lieblingsort, vorfreude, gamertag
users/{uid}/bilder/titel   teile, typ ← eigenes Titelbild: Anzahl Teile, image/webp|jpeg
users/{uid}/bilder/titel-0…7  daten   ← Base64-Teile, je ≤ 700.000 Zeichen
usernames/{name}           uid        ← Eindeutigkeit; öffentlich lesbar für „Name schon vergeben"
newsletter/{uid}           email, lang, consentAt
```

- **Profil- und Titelbild** sind je `preset:<id>` oder `eigen`. Eigene Bilder schneidet
  `zuschnitt.js` im Browser zu: Profilbild 384 × 384 JPEG (≤ 140.000 Zeichen), Titelbild
  **16 : 9 in Originalauflösung bis 3840 px breit**, WebP (sonst JPEG), Qualität 0,93 abwärts
  bis ≤ 5,5 MB Base64. Weil ein Firestore-Dokument höchstens 1 MB groß sein darf, liegt das
  Titelbild in bis zu 8 Teilen (`titel-0…7`), geschrieben im selben Batch wie das Profil;
  überzählige alte Teile werden dabei gelöscht. Sie **bleiben gespeichert, wenn
  man zu einer Vorlage wechselt**, und stehen als Kachel „Eigenes" in der Auswahl, bis man
  sie entfernt. Das Profilbild liegt im Profil selbst (die Nav braucht es auf jeder Seite),
  das große Titelbild getrennt. Firebase Storage wäre nicht mehr kostenlos.
- **Ältere Profile** (eigenes Bild direkt in `avatar`, kein `cover`) bringt
  `profilAusDaten()` in `backend.js` beim Laden in die neue Form; beim nächsten Speichern
  steht es dann so in der Datenbank.
- **Newsletter nur mit bestätigter Adresse** (`email_verified` im Token) und nur die eigene
  Adresse — ersetzt das Double-Opt-in. Nach dem Bestätigen muss das Token erneuert werden
  (`bestaetigungPruefen()` → `getIdToken(true)`), sonst sehen die Regeln noch `false`.
- **Verschickt wird noch nichts.** Die Liste steht in Firestore → `newsletter`. Für den
  Versand braucht es einen Dienst (z. B. Brevo) — nächster Schritt, dann Datenschutz ergänzen.
- **Namen ändern** geht in einem Schreibvorgang: neuen Namen reservieren, alten freigeben,
  Profil ändern. Die Regeln lassen keinen Namen doppelt und keinen verwaisten zurück.
- **Löschen** verlangt bei Firebase eine frische Anmeldung — die wird **vor** dem Löschen
  der Daten geholt, sonst wären die Daten weg und das Konto noch da.

### Profilansicht und Bearbeiten

- `konto.html` zeigt zuerst die **Profilansicht**; `konto.html#bearbeiten` (Knopf „Profil
  bearbeiten") das Formular mit Newsletter, Sicherheit, Gefahrenzone. Umschalten über
  `hashchange`, kein Neuladen. Links in der Ansicht („festlegen") führen auch auf `#bearbeiten`.
- **Titelbild als fester Hintergrund** (`.kbg`, `position:fixed`, Verlauf darüber) — nur der
  Inhalt scrollt. Kein `background-attachment:fixed`, das kann iOS nicht. Das Element steht
  **außerhalb von `kontoRoot`** (direkt vor `<main>`), damit es beim Neuzeichnen der Seite
  nicht neu lädt und schon hängen kann, bevor Firebase geantwortet hat.
- **Zwischenspeicher `konto/titelcache.js`** (IndexedDB `luciajason-konto`, Lager
  `titelbilder`, Schlüssel = uid, im Demo-Modus mit `demo:` davor): Das zuletzt geladene
  Titelbild liegt im Browser und steht dadurch nach etwa 60 ms statt nach zwei bis drei
  Sekunden. Gespeichert wird `{ cover, daten, stand }`; `stand` ist `profil.stand`
  (`updatedAt` in Millisekunden). Stimmt er beim nächsten Besuch noch, wird aus Firestore
  **gar nichts** nachgeladen. Nach dem Speichern steht `stand: 0` — das Bild ist sofort da,
  beim nächsten Besuch wird einmal abgeglichen. Das Bild fliegt raus, wenn das Konto vom
  Gerät entfernt, abgemeldet oder gelöscht wird; beim Seitenstart räumt `titelAufraeumen()`
  Reste von Konten weg, die nicht mehr in der Liste stehen.
- Ist „eigenes Bild" gewählt und noch nicht geladen, bleibt der Hintergrund **dunkel**,
  statt kurz eine fremde Vorlage zu zeigen.
- Ansicht (`ansichtZeichnen()` in `profil.js`): Countdown live, „Dabei seit", Plattform,
  Edition; Karten Lieblingsfigur (Bild aus `CHAR_PAGES`, Zitat, „Akte öffnen") und
  Lieblingsort (erstes Bild aus `PLACES.shots`); Vorfreude, Gamertag mit Kopieren,
  Newsletter-Status (kommt später als der Rest und wird über `newsletterKachelAuffrischen()`
  einzeln nachgezogen — vorher stand dort bis zum Moduswechsel „Noch nicht abonniert"); die drei neuesten Newswire-Meldungen. Leere Angaben erscheinen als
  gestrichelte Karte mit Link zum Bearbeiten.
- Titelbild-Vorlagen liegen 16 : 9 in `assets/img/covers/` (2560 px) plus Kacheln
  `covers/klein/` (480 × 270).
- **Spaß-Einträge** (17.09.2026): Lieblingsort „Jack of Hearts" (Stripclub, Bild
  `places/vice_city_07.jpg`) steht in `SPASS_ORTE` in `profil.js` — nicht in `PLACES`, weil
  es ihn in der Leonida-Übersicht nicht gibt. Vorfreude „Lucia Jiggle Physics"
  (`duo/duo_10.jpg`) steht in `VORFREUDE`. Die Kennungen prüfen die Regeln seither als
  Muster (`^([a-z-]{2,20})?$`), neue Einträge brauchen also keine neuen Regeln mehr.
- **Wer ein Bild wählt, sieht es sofort** („Vorschau · noch nicht gespeichert");
  gespeichert wird erst mit „Speichern". Verlässt man die Seite mit ungespeicherten Bildern,
  fragt der Browser nach.
- **Zuschneiden:** ziehen, Mausrad, Regler, zwei Finger, Pfeiltasten, +/−. Das Bild füllt
  den Rahmen immer ganz. Neben der Anleitung steht die Zielauflösung. Rahmenmaße sind
  ganzzahlig — ohne `zielBreite()` käme ein unbeschnittenes 4K-Bild als 3839 px heraus.
  Kodiert wird mit `toBlob` (friert bei 4K nicht ein). „Handy"-Linien zeigen den Ausschnitt,
  der am Telefon hinter dem Profil sichtbar bleibt.
- **Nicht per Klick daneben schließen** — endet ein Ziehen außerhalb des Rahmens, käme
  sonst ein Klick auf den Hintergrund an und der Zuschnitt wäre weg.

### Mehrere Konten

- Menü oben rechts: „Mein Profil", „Konto wechseln", „Abmelden". „Konto wechseln" öffnet
  ein Fenster (`.kw`, kein Vollbild): Konten auflisten, wechseln, „Profil bearbeiten",
  „Entfernen" (zweimal klicken), „Konto hinzufügen", „Aktuelles Konto abmelden".
- Firebase kann pro App-Instanz nur **ein** angemeldetes Konto. Jedes weitere Konto bekommt
  deshalb eine eigene Instanz: `initializeApp(config, slot)`, `standard` = `[DEFAULT]`.
  Die Anmeldungen liegen getrennt in IndexedDB.
- Liste in `localStorage` `konto-liste` (`konto-liste-demo` im Demo-Modus):
  `{ aktiv, konten:[{slot, uid, email, name, bild}] }`. Wechseln = `aktiv` setzen + neu laden.
- „Konto hinzufügen" öffnet den Anmelde-Dialog mit einer **neuen** Instanz; erst nach
  erfolgreicher Anmeldung wird sie eingetragen und aktiv.
- Meldet sich das aktive Konto ab (oder läuft die Anmeldung aus), fliegt es aus der Liste
  und die Seite wechselt automatisch zum nächsten Konto.
- Das Schließen-Kreuz teilt sich die Klasse `.kd__zu` mit dem Anmelde-Dialog, der es am
  Handy über das Bild schiebt — im Wechsler per `.kw .kd__zu` zurückgesetzt.

### Fallstricke

0. **Newsletter „Keine Berechtigung" trotz bestätigter Adresse** (behoben 17.09.2026).
   Nach dem Klick auf den Bestätigungslink zeigt Firebase `emailVerified: true`, das
   **Token** im Browser trägt aber bis zu einer Stunde noch `email_verified: false` — und
   die Regeln lesen nur das Token. Jetzt: beim Anmelden wird das Token erneuert, wenn beides
   abweicht, und vor dem Abonnieren immer.
1. **`form.name` ist das `name`-Attribut des Formulars**, nicht das Feld `name="name"`.
   Das Bestätigungsfeld beim Löschen heißt deshalb `bestaetigung`.
2. **Nav-Breite.** Neben sieben Links, Countdown-Pille, Sprachwahl und Konto wird es unter
   1280 px eng: dort nur noch das Profilbild ohne Namen, zwischen 1025 und 1180 px fällt mit
   aktivem Konto die Countdown-Pille weg. Gemessen: kein Überlauf bei 1040, 1181, 1281 px,
   an- und abgemeldet, Deutsch und Englisch.
3. **Lauf-Zähler in `konto.js`.** Beim Registrieren meldet Firebase „angemeldet", bevor das
   Profil geschrieben ist. Ohne den Zähler überschriebe das verspätete „kein Profil" das
   gerade gespeicherte.
4. **Profil nicht geladen ≠ kein Profil.** Schlägt das Laden fehl (Netz), wird nicht nach
   einem neuen Namen gefragt.
5. **Am Handy kein Autofokus** im Dialog — sonst schiebt sich die Tastatur sofort drüber.
6. Wer die Namenswahl wegklickt, wird in derselben Sitzung nicht bei jedem Seitenwechsel
   erneut gefragt (`sessionStorage konto-profil-spaeter`); die Nav bietet „Profil anlegen".

### Admin, Rollen, Einstellungen (24.09.2026)

- **Wer Admin ist**, steht an zwei Stellen und muss gleich bleiben:
  `assets/js/konto/rolle.js` (`ADMINS = ["vrtomsky"]`, Benutzername klein) und
  `firestore.rules` (`istAdmin()` liest `users/{uid}.usernameLower`). Der Seitenbesitzer
  heißt auf der Seite **VRTomsky**. Die Liste in `rolle.js` blendet nur Knöpfe ein —
  geschützt wird durch die Regeln.
- **Admins sehen:** roten Reiter „Admin" in der Nav (oben und im Handy-Menü, von
  `konto.js → adminReiter()` eingehängt), roten Chip „Admin" im Profil, im Spiel den
  DEV-Knopf und das Entwicklermenü (F8).
- **`admin.html` + `konto/admin.js`:** Hinweisbanner (an/aus, Text DE/EN, je 200 Zeichen,
  Vorschau), Belohnungsfaktor für Spielaufträge 1×–5×, Übersicht Entwicklermenü,
  Bestenliste. Andere sehen „Kein Zugriff", Abgemeldete „Nur für Admins".
- **Speicherort:** Sammlung `einstellungen`, Dokumente `seite` (`bannerAn`, `bannerDe`,
  `bannerEn`) und `spiel` (`geldFaktor`). Für alle lesbar, schreiben nur Admins.
- **Banner** (`konto.js → bannerZeigen`): feste Leiste über der Nav, `html.hat-banner`
  schiebt Nav, Handy-Menü und Seite um `--banner-h` nach unten (ResizeObserver, weil der
  Text am Handy umbricht). Das × merkt sich den Text in `localStorage gta6-banner-weg` —
  ein neuer Text erscheint wieder.
- **Spielstand** (`spielstaende/{uid}`): Geld, Waffen, Munition, Weste, erledigte
  Aufträge, Schießstand. Nur die Person selbst liest und schreibt.
- **Neue Regeln müssen in der Firebase-Konsole veröffentlicht werden**, sonst schlagen
  Spielstand und Admin-Einstellungen auf der echten Seite fehl (die Admin-Seite sagt das
  dann auch). Im Demo-Modus geht alles ohne.
- **Testen:** `admin.html?demo`, Demo-Konto mit dem Namen `VRTomsky` registrieren. Das
  Entwicklermenü geht im Demo-Modus auch ohne diesen Namen mit `spiel.html?demo&admin`.

## Newswire automatisch

Die Liste „Rockstar Newswire" auf der Startseite (und „Neu für dich" im Profil) aktualisiert
sich selbst:

```
GitHub Action (.github/workflows/newswire.yml, alle 15 min)
  → node tools/newswire-holen.mjs
      POST https://graph.rockstargames.com/  NewswireList, tagId 666 (GTA VI), en_us + de_de
  → assets/data/newswire.json  (nur committen, wenn sich Meldungen geändert haben)
  → Pages-Build anstoßen
Browser: assets/js/newswire.js
  → raw.githubusercontent.com/VRTomsky/gta6-website/main/assets/data/newswire.json
    (CORS erlaubt, 5 min Cache), Ersatz: eigene Datei; alle 5 min erneut, solange sichtbar
```

- Rockstars API erlaubt keine Aufrufe aus dem Browser (kein CORS) — deshalb der Umweg über
  die Action. X/Twitter geht nicht: die API kostet.
- `Newswire.url(meldung)` gibt die Adresse in der Sprache der Seite zurück: auf Deutsch mit
  `/de/` im Pfad, auf Englisch ohne.
- Meldungen mit „Pre-Order/Vorbestellen" im Titel werden gefiltert (Wunsch des Nutzers).
- Bilder und Links nur von `rockstargames.com` bzw. `media-rockstargames-com.akamaized.net`
  (Prüfung in `main.js`). Neue Meldungen (< 7 Tage) tragen „NEU".
- **`newswire.json` gehört der Action.** `Auf GitHub hochladen.bat` spiegelt sie nicht,
  sondern holt vorher den Stand aus dem Repository in den Arbeitsordner — sonst würde ein
  Upload eine neuere Liste mit der alten überschreiben. Beim Push-Konflikt mit einem
  Action-Commit: `pull --rebase`, dann erneut pushen.
- GitHub pausiert geplante Actions nach 60 Tagen ohne Commit im Repository.
- Der Aufmacher (Album) und „Rund ums Spiel" sind handgepflegt in `index.html`.
- Lokal testen: `node tools/newswire-holen.mjs`.

## Vice City Run — das Browser-Spiel

`spiel.html` + `assets/js/spiel/` + `assets/css/spiel.css`. Reines Canvas-2D,
keine Fremdbibliothek, kein Build. Stand: komplett — Stadt mit fünf Gegenden
und eigenen Texturen, Laufen, Autofahren, Verkehr, Passanten, Polizei mit
Fahndungsstufen, Fäuste und Waffen mit Waffenladen, vier Aufträge, Minikarte
und große Karte mit Wegpunkt, Ton, Handy-Steuerung, Vollbild und Bestenliste
im Konto.

```
spiel/stadtplan.js  baut die Stadt beim Start: Wasser, Autobahnring, Haupt- und
                    Nebenstraßen (geschwungen, ungleiche Blöcke), Brücken,
                    Gehwege, Blöcke mit Häusern, Wahrzeichen
spiel/karte.js      zeichnet den Plan und beantwortet Fragen (Spuren, Kreuzungen,
                    Ampeln, Kollision)
spiel/texturen.js   Asphalt, Gehweg, Sand, Gras, Kiesdach, Bäume, Palmen —
                    alles beim Start im Browser gezeichnet, keine Bilddateien
spiel/bilder.js     Sprites laden, gedreht malen, Schatten
spiel/wesen.js      Figuren zu Fuß und Passanten (Laufanimation über die Strecke)
spiel/fahrzeug.js   Fahrmodell und Fahrzeugdaten
spiel/verkehr.js    Verkehr: Spuren, Abbiegen, Ampeln, Auffahren vermeiden
spiel/polizei.js    Streifen, Polizisten, Fahndungsstufe 0–5
spiel/missionen.js  zehn Aufträge als Schrittfolgen (fahren, warten,
                    drinnen, sammeln, jagen, abhaengen)
spiel/waffen.js     Fäuste, Pistole, Micro-MP, Pumpgun, AK, Waffenläden
spiel/waffenbilder.js  Waffen als Leinwand gezeichnet: von oben für die
                    Hand, von der Seite für Laden und Anzeige
spiel/wege.js       Wegfindung über die Straßen (A*) für die Route
spiel/minikarte.js  Minikarte unten links und große Karte (beide gepuffert)
spiel/ton.js        Motor, Sirene, Rumms, Schuss, Kasse — per Web Audio erzeugt
spiel/spiel.js      Eingabe, Kamera, Schleife, Anzeige, Punkte
```

- **Die Karte liegt nicht als Datei vor**, sondern wird aus den Koordinaten
  berechnet (`art(tx, ty)`, immer gleicher Zufall über `streu()`). Ändert sich
  das Raster, stimmt der Startpunkt trotzdem: `startSuchen()` sucht den nächsten
  Gehweg an einer Straße.
- Gezeichnet wird nur der sichtbare Ausschnitt, rund 60 Kacheln je Bild — auf
  dem Testrechner 60 Bilder pro Sekunde bei 1440 × 900.
- Gebäude bekommen aus Höhe und Nachbarschaft eine Wand und einen Schatten nach
  unten rechts. Das ist kein 3D, sieht aber so aus.
- **Fahrmodell:** Geschwindigkeitsvektor, der anteilig in Blickrichtung gezogen
  wird. Der Anteil ist der Grip — mit Handbremse rutscht der Wagen. Gelenkt wird
  nur bei Fahrt und mit steigendem Tempo weniger.
- **Sprites aus Bögen (22.09.2026):** Fahrzeuge und Figuren kommen jetzt aus
  fünf großen Rasterbildern, die der Nutzer mit einer Bild-KI erzeugt hat
  (Blick von oben, Nase/Blick nach oben, Chroma-Grün als Hintergrund).
  `tools/spiel-bogen.py` zerlegt sie:

  1. Hintergrund weg — Grün über den Farbabstand, Weiß per Flutfüllung vom
     Rand (sonst verschwindet der weiße Krankenwagen mit).
  2. **Objekte statt Raster:** Erst werden zusammenhängende Flächen gesucht
     und danach der Rasterzelle zugeordnet, in der ihr Schwerpunkt liegt.
     Ein fester Rasterschnitt hatte an jedem Sprite einen Schnipsel vom
     Nachbarwagen kleben.
  3. Auf Spielmaßstab bringen (64 px je Meter, Längen stehen in `BOEGEN`),
     dunkle Kontur, mittig auf die Leinwand.

  Aufruf: `python tools/spiel-bogen.py --bogen autos2 --bild "pfad/2.webp"`.
  Bögen: `autos1`, `autos2` (je 12 Fahrzeuge), `leute`, `dienst` (je 12
  Figuren), `helden` (Jason und Lucia mit vier Posen).
- **Stadt aus Bögen (22.09.2026):** Sechs weitere Bögen bringen die Stadt
  selbst ins Bild — `boden` (12 Untergründe), `zubehoer` und `strand`
  (24 Straßen- und Stranddinge), `wohnen`, `tuerme`, `besonders`
  (36 Gebäude). Drei Zuschnittarten in `spiel-bogen.py`:

  | Art | Schnitt | Ergebnis |
  |---|---|---|
  | `boden` | strikt nach Raster, Steg abziehen | `boden_*.webp`, 128 × 128, nahtlos wiederholbar |
  | `deko` | Objekterkennung, 64 px je Meter | `deko_*.webp`, freigestellt mit Kontur |
  | `haus` | Objekterkennung, **32 px je Meter**, knapp beschnitten | `haus_*`, `turm_*`, `bau_*` |

  Häuser laufen im halben Maßstab und ohne Kontur: Sie werden nie gedreht,
  nur auf ihre Grundfläche gezogen — 64 px je Meter wären bei einem 30-Meter-
  Bau fast 2000 Bildpunkte gewesen.
- **Ein Bild je Haus:** `stadtplan.js` legt beim Bauen für jede Hausnummer
  die umschließende Kachel-Schachtel ab (`export const haeuser`, dazu
  `voll` = Grundfläche ist ein volles Rechteck). `karte.js` malt daraus in
  `zeichnen` einen eigenen Durchgang zwischen Kacheln und Wänden: je
  sichtbarem Haus **ein** `drawImage`, auf die Grundfläche gezogen, um 90°
  gedreht, wenn das Bild quer zum Grundriss liegt. Welches Bild ein Haus
  bekommt, entscheidet `HAUSBILD[bauArt]` plus die Hausnummer — also immer
  dasselbe. Ist der Grundriss kein Rechteck (etwa eine L-Form an einer
  Kreuzung), wird das Bild auf den echten Umriss beschnitten (`hausPfad`,
  zeilenweise Kachelstücke). Unter dem Bild liegt Gehwegboden, damit an
  durchsichtigen Rändern kein buntes Dach durchblitzt. Häuser mit Bild
  bekommen keine gemalte Wand mehr, nur einen Schatten nach unten rechts.
  Fehlt ein Bild (`BAU.TANKSTELLE` hat keines), malt weiter `gebaeudeMalen`
  das alte Dach — beide Wege laufen nebeneinander.
- **Gebäude richtig setzen (22.09.2026, nach Rückmeldung):** Zwei Fehler in
  der ersten Fassung — Bilder wurden gewürfelt statt nach Größe gewählt (ein
  34-Meter-Einkaufszentrum landete auf einem 12-Meter-Grundstück und war
  winzig, der kleine Club auf einem Riesengrundstück verzerrt), und auf
  L-förmigen Grundstücken wurde das Bild am Umriss beschnitten, also
  angeschnitten. Jetzt:

  1. `stadtplan.js` rechnet je Haus den **Kern** aus — das größte volle
     Rechteck im Umriss (Histogramm-Verfahren). Darauf kommt das Bild, es
     wird nichts mehr beschnitten. Was außen übrig bleibt, wird Hof
     (Rasen, Baum, Bank). Deckt der Kern weniger als 55 % des Grundstücks,
     malt weiter der alte Dachzeichner.
  2. `hausWaehlen()` sucht aus der Liste der Bauart das Bild, dessen
     **Länge und Seitenverhältnis** am besten zum Kern passen; ein kleiner
     Zuschlag je Hausnummer sorgt für Abwechslung. Die Bilder liegen mit
     32 px/m, daraus ergibt sich ihre gedachte Größe.
- **Nachtclubs:** eigene Bauart `BAU.CLUB` mit drei Wahrzeichen (Pink
  Flamingo, Neon Kitty, Club Sunset). Vorher war `bau_club` nur eine von
  mehreren Ladenfassaden und tauchte auf der Karte nicht auf.
- **Innenräume (22.09.2026, `innen.js`):** Die drei Nachtclubs sind
  betretbar — das erste Gebäude mit echtem Innenleben. Vor jedem Club
  liegt ein pinker Leuchtpunkt auf dem Gehweg (`clubTuerenSuchen`, die
  nächste Gehwegkachel am Grundstück), **E** geht hinein.

  Sechs Räume, jeder ein Bild von oben mit 48 px/m: Eingang, Tanzfläche,
  Bar, VIP, Garderobe, Büro. In `RAEUME` steht je Raum die Größe in
  Metern, eine Liste von **Sperren** (Kästen für Wände und Möbel), die
  **Türen** als Rechtecke mit Zielraum und die **Aktionen**. Der Spieler
  ist ein Kreis mit 34 cm Radius und wird aus Kästen über die kürzeste
  Seite herausgeschoben — mehr Physik braucht es nicht. Ein Raum wird
  immer ganz gezeigt, der Zoom ergibt sich aus der Leinwand.

  | Ort | E macht |
  |---|---|
  | Tresen links in der Bar | Drink, $20, +18 Leben, +80 Ausdauer |
  | Tresen rechts in der Bar | Essen, $35, +40 Leben, +55 Ausdauer |
  | Bühne im VIP-Raum | Private Dance, $200, Bild blendet ab, danach alles voll |
  | Türöffnungen | Raum wechseln, unten im Eingang zurück auf die Straße |

  Acht Tänzerinnen laufen mit (`tanz1` … `tanz8`), zwei tanzen auf der
  Bühne. Dazu ein dumpfer Viervierteltakt (`Ton.club`). Das ist etwas
  anderes als `zustand.drinnen` beim Ladenraub — das bleibt ein reiner
  Bildschirm.
- **Das Spiel hing im Vollbild (22.09.2026):** Der Nutzer bekam nach
  kurzer Fahrt ein Standbild. Gemessen: **90 Millisekunden je Bild** —
  im Vollbild mit feinem Schirm zeichnete die Karte über tausend Kacheln
  plus Bäume, Laternen, Häuser und Wände, jedes Bild neu. Drei Eingriffe:

  1. **Zwischenspeicher** in `karte.js`: Boden, Gebäudebilder und Wände
     werden in Stücken von 8 × 8 Kacheln auf eigene Leinwände gemalt und
     danach nur noch kopiert (`stueckHolen`, `flaecheMalen`). Ändert sich
     der Zoom um mehr als 18 Prozent, werden die Stücke neu gebaut —
     aber höchstens zwei je Bild, sonst ruckelt es beim Beschleunigen.
     Danach: **2,7 ms im Schnitt statt 90.** Preis: Das Glitzern auf dem
     Wasser steht still.
  2. **Leinwand gedeckelt** auf rund 2,6 Millionen Bildpunkte
     (`groesseAnpassen`). Vollbild auf einem feinen Schirm wären über
     acht Millionen gewesen.
  3. **Bildschleife abgesichert:** `rechnen` und `zeichnen` laufen in
     `sicher()`. Ein Fehler kostet jetzt ein Bild statt das ganze Spiel,
     wird einmal gemeldet, und ein Wächter startet die Schleife neu,
     falls zwei Sekunden lang kein Bild mehr kam.
- **Der echte Absturz war ein Tippfehler (23.09.2026):** Beim Umbau des
  Verkehrs wurde aus `freiVoraus()` das `hindernis()`. In `polizei.js`
  stand der alte Name noch — **jede Verfolgung warf dadurch einen
  Fehler**, und weil das jedes Bild passierte, blieb das Bild stehen.
  Gefunden mit einem neuen Werkzeug: `window.__schritt(dt, malen)` rechnet
  das Spiel ohne Bild weiter, damit lassen sich 15 Spielminuten in
  Sekunden durchrechnen. Danach: 10 Minuten Dauerverfolgung mit vier
  Streifen, kein Fehler mehr.
- **Große Bildrunde (23.09.2026, zwölf Bögen):**

  | Bogen | Inhalt | Ergebnis |
  |---|---|---|
  | `jason4`, `lucia4` | neue Heldenbögen, 4 Ansichten × 4 Posen | alte gesichert in `_backup/figuren_alt/` |
  | `clubs`, `tanken`, `dienste`, `stadien`, `wohnen2` | je 12 Gebäude | 60 neue Modelle, `HAUSBILD` in `karte.js` |
  | `einsatz` | 12 Einsatzfahrzeuge | **Nase zeigte nach unten** → `drehen=180` im Bogen |
  | `strassenkram` | Ampeln, Schilder, Poller … | schon freigestellt geliefert (`hintergrund="keiner"`) |
  | `markierungen` | 12 Bodenmarken | wie Bodenkacheln strikt nach Raster |
  | Ammu-Vice Verkaufsraum, Schießstand | Innenräume | `innen_ammu_laden`, `innen_ammu_stand` |

  Tankstellen hatten vorher gar kein Bild, Stadien benutzten das
  Schulbild. Jetzt hat jede besondere Bauart mehrere Modelle.
- **Gebäudegröße getrennt vom Bild:** Die großen Sportanlagen wären mit
  32 px/m über 2000 Punkte breit gewesen — zusammen 9 MB Download und
  Hunderte MB Speicher. Deshalb werden Gebäudebilder auf **höchstens
  768 Punkte** verkleinert, und die gedachte Größe steht in
  `assets/js/spiel/hausmass.js`. `hausWaehlen` liest dort. Das
  Schneidewerkzeug trägt neue Häuser dort selbst ein.
- **Stadt um den Faktor 1,3 größer:** `stadtplan.js` hat jetzt `S = 1.3`
  und `s(v)`. Alle festen Orte (Küste, Kanal, Fluss, Hafen, Seepark,
  Autobahnring, Hauptachsen, Diagonalen, Kreisverkehre, Bezirke,
  Startplatz, Wahrzeichen) werden damit gestreckt; **Straßenbreiten und
  Blockabstände bleiben** — dadurch entstehen mehr Blöcke statt größerer
  Häuser. Ergebnis: 312 × 286 Kacheln (1248 × 1144 m statt 960 × 880),
  **1232 Häuser statt 588**, ein zusammenhängendes Straßennetz, Aufbau in
  0,4 s. Die A*-Suche darf dafür 140 000 statt 60 000 Schritte.
  **Fallstrick:** Wer neue feste Koordinaten einträgt, muss sie in `s()`
  packen. Auch `ortsname()` in `spiel.js` rechnet mit `Karte.S`.
- **Mehr Wahrzeichen, gleichmäßig verteilt:** Zusätzlich zu den festen
  16 werden weitere Wachen, Kliniken, Tankstellen, Clubs, Ammu-Vice und
  Sportparks gesetzt — jeweils an der Stelle, die am weitesten von allen
  gleichartigen entfernt ist. Jetzt 36: 4 Polizei, 4 Feuerwehr,
  3 Kliniken, 7 Tankstellen, 6 Clubs, 5 Ammu-Vice, 3 Sportanlagen.
  `belegt` verhindert, dass zwei Wahrzeichen dasselbe Haus nehmen.
- **Ammu-Vice von innen:** Wie der Club — Tür vor dem Laden, E geht
  hinein. Im Verkaufsraum öffnet E an der Theke das bisherige
  Ladenfenster (Waffen, Munition, Weste). Hinten rechts geht es in den
  Schießstand: vier Bahnen, eine Runde Training kostet $10, jede Runde
  macht etwas treffsicherer, der Bestwert wird gemerkt. Die Clubmusik
  läuft nur in Räumen mit `musik: true`.
- **Straße:** Überwege sind jetzt das Zebra-Bild, auf den Zufahrtsspuren
  liegen Haltelinien und Abbiegepfeile, verstreut Gullydeckel, Flicken,
  Ölflecken, Rinnen und Radwegsymbole, in manchen Kreuzungen ein gelbes
  Sperrfeld. Parkplätze haben Buchten genau dort, wo die Wagen stehen.
  An Ecken ohne Ampel steht ein Stopp- oder Straßenschild; die Ampeln
  sind die neuen Bilder (Mast am Bordstein, Kopf über der Fahrbahn).
- **Einsatzfahrzeuge:** Sechs Polizeiwagen (`POLIZEIWAGEN` in
  `fahrzeug.js`), jede Streife würfelt ihr Modell. Rettung, Feuerwehr,
  Abschlepper und Regierungswagen fahren im normalen Verkehr mit.
  Polizeiwagen stehen nicht geparkt herum.
- **Abhängen geht jetzt wirklich (23.09.2026):** Die Fahndung schickte
  ununterbrochen Nachschub an die **aktuelle** Position — egal, ob dich
  jemand sah. Man konnte minutenlang weg sein und hatte trotzdem Streifen
  vor der Nase. Jetzt merkt sich `Fahndung` den **letzten gesehenen Ort**;
  sieht dich niemand, fahren alle nur noch dorthin und es kommt kein
  Wagen mehr dazu. Das Abkühlen hängt am Abstand: gesehen → gar nicht,
  Streife näher als 140 m → sehr langsam (sie suchen noch), bis 220 m →
  ein Stern je 9 s, weiter weg → doppelt so schnell. Gemessen: aus 600 m
  Entfernung fallen drei Sterne in 13 Sekunden, direkt verfolgt bleibt
  die Stufe stehen.
- **Schaden umgebaut:** Blech hält mehr aus (Wandschaden erst ab Tempo 4
  und nur ein Drittel so stark, Rammschaden ein Drittel). Ein Rempler
  kostet **kein Leben** mehr — erst ein harter Aufprall über Tempo 11,
  und auch den fängt die neue **Panzerung** ab (`schadenNehmen`, eigene
  Leiste im HUD, Weste für $800 bei Ammu-Vice). Auch die Schüsse der
  Polizei laufen darüber.
- **Polizisten kann man überfahren** — kostet drei Sterne, tot vier.
- **Verkehr fährt nicht mehr durch Passanten:** Wer jemanden streift,
  stößt ihn zur Seite, erschreckt ihn und bremst.
- **Jeder startet woanders:** `figurenVerteilen()` verteilt Jason und
  Lucia auf zufällige Wahrzeichen, die nicht gespielte Figur sitzt mit
  40 % Wahrscheinlichkeit in einem Wagen davor. Und sie steht nicht mehr
  stocksteif herum: `zweitLeben()` schickt sie über den Gehweg spazieren.
  **Fallstrick:** `Karte.freierPunkt` würfelt mit `streu`, gibt bei
  gleichem Start also immer denselben Punkt — der lag direkt vor den
  Füßen, und die Figur bewegte sich keinen Meter. Ziel selbst auswürfeln.
- **Fehlerbericht:** Jeder Aussetzer landet jetzt mit Text und Aufrufliste
  in `zustand.fehler` und in `localStorage["spiel-fehler"]`, der Hinweis
  im Spiel zeigt die Meldung selbst. Ohne das sucht man blind.
- **Straßen aufgeräumt (23.09.2026):** Die grüne „Mittelinsel" war ein
  flaches grünes Rechteck auf dem Asphalt — jetzt Beton mit Bordstein.
  Die Zebrastreifen waren kleine Punkte in den Ecken — jetzt fünf breite
  Balken über die ganze Kachel, dort wo die Kreuzung an die Fahrbahn
  stößt. Der Gehwegbelag wechselt blockweise statt von Kachel zu Kachel.
  Die Ampeln waren **sechs Meter hoch** und lagen wie Klötze auf der
  Straße; jetzt knapp drei Meter, an der Bordsteinkante.
- **Passanten queren an der Ampel:** `Passant.kreuzungSuchen()` sucht
  einen Überweg an einer Kreuzung, der Passant wartet am Bordstein, bis
  die Autos auf seiner Achse Rot haben (`ampelGruen`), und geht dann
  durch. Gemessen über zwei Minuten: bis zu neun gleichzeitig auf einem
  Überweg, danach wieder alle auf dem Gehweg.
- **Häuser drehen sich zur Straße:** `hausDrehung` zählt Straße und
  Gehweg an allen vier Seiten des Grundstücks und dreht das Bild so, dass
  die Vorderseite (im Bild unten) dorthin zeigt — vorher stand der Club
  mit dem Eingang zur Hauswand. Gewählt wird nur unter den Drehungen, die
  zum Grundriss passen.
- **Parken:** Auf Parkplätzen stehen alle Wagen eines Platzes in
  derselben Richtung, quer zur langen Seite, jede dritte Reihe bleibt als
  Fahrgasse frei. Am Straßenrand wird nur noch auf breiten Straßen
  geparkt (Band ≥ 4 Kacheln) und dabei an den Bordstein gerückt — vorher
  standen die Wagen in der Fahrspur.
- **Passanten bleiben auf dem Gehweg:** Parkplätze sind aus `GEHBAR`
  heraus. Wer doch einmal daneben steht, geht zielstrebig zurück; die
  Gehwegregel beim Vorausschauen gilt nur, wenn man schon auf einem
  Gehweg steht — sonst dreht sich einer auf dem Parkplatz im Kreis, weil
  auch der Rückweg kein Gehweg ist. Gemessen nach 40 Sekunden: 62 von 75
  auf dem Gehweg, 13 im Park, **keiner mehr auf Parkplatz oder Straße**.
- **Eigene Ortssymbole:** `ORTSYMBOL` in `minikarte.js` — runde Plakette
  in der Farbe der Bauart, darauf ein selbst gezeichnetes Piktogramm
  (Schild, Flamme, Kreuz, Tempel, Ball, Tasche, Zapfsäule, Buch,
  Zielscheibe, Cocktailglas). **Nicht** aus einem anderen Spiel
  übernommen — Rockstars Symbole sind urheberrechtlich geschützt, und
  für diese Seite gilt ohnehin: alles selbst gemacht.
- **Türen im Club waren nicht erreichbar:** Die Türrechtecke liegen in
  der Wand, die Wandgrenze hielt einen aber schon davor an — man kam nur
  vom Eingang auf die Tanzfläche und sonst nirgendwo hin. Jetzt zählt
  eine Tür großzügig (eine Armlänge um ihr Rechteck, `inTuerBand`), und
  `naheAktion` misst zur Türmitte statt zum Rechteck.
- **Ausdauer:** neue Leiste im HUD neben dem Leben. Rennen kostet 20 je
  Sekunde, Stehen bringt 8 je Sekunde zurück; ohne Ausdauer geht nur noch
  Gehen. Essen und Trinken im Club füllen sie auf.
- **Tänzerinnen:** Für den Pink Flamingo sind acht Figuren
  geplant. Die Bögen `tanz1` … `tanz8` stehen schon in `spiel-bogen.py` —
  je ein Bild pro Figur, **vier Ansichten mal vier Posen wie bei Jason und
  Lucia**, Größe 1,72 m. Erst dadurch laufen sie; ein Bogen mit nur drei
  Standbildern reicht nicht. Die Prompts dafür liegen in
  `2d bilder/PROMPT-taenzerinnen-laufen.txt` (der Ordner geht nicht ins
  Repository). Sie laufen nur im Gebäude, deshalb brauchen sie nichts in
  `wesen.js` — `innen.js` setzt die Bildnamen selbst zusammen.
- **Neue Räume nachrüsten:** Bild mit `PX = 48` auf Metermaß skalieren
  (Skript wie bei den sechs bestehenden), als `innen_<name>.webp`
  ablegen, in `RAEUME` eintragen — Größe, Sperren, Türen, Aktionen. Die
  Kästen setzt man am schnellsten über eine Vorschau mit Metergitter.
- **Alles als WebP (22.09.2026):** Die 204 Sprites wären als PNG rund 65 MB,
  als WebP sind es 4,2 MB. `bilder.js` lädt nur noch `.webp`.
  **Nach jedem Bogenlauf `python tools/spiel-webp.py --ordner assets/img/spiel`
  hinterherschicken**, sonst fehlen die frischen Bilder im Spiel.
- **24 Fahrzeuge, 26 Figuren.** Jason und Lucia liegen in **vier Ansichten
  mal vier Posen** vor (`jason_vorn0` … `lucia_rechts3`, Bögen `jason4`
  und `lucia4`): `Figur.richtung` wählt aus dem Laufwinkel die Ansicht,
  `LAUF_POSEN = [1,2,3,2]` den Schritt. Alle anderen haben **drei
  Ansichten**: `_steht` von vorn, `_hinten` und `_links` — nach rechts wird
  das linke Bild gespiegelt (Bögen `leute_hinten`, `leute_links`,
  `dienst_hinten`, `dienst_links`). Gezeichnet wird über `bilder.aufrecht`,
  die Schrittbewegung kommt aus `Figur.wiegen`. **Wichtig:** Die Bögen zeigen die
  Figuren von schräg vorn, nicht streng von oben — deshalb dürfen sie
  nicht mit der Laufrichtung gedreht werden, sonst liegen sie quer auf
  der Straße. Genau das war der erste Fehler nach dem Umstieg.
  Ab vier Sternen steigt die Spezialeinheit aus (`swat`, mehr Leben).
- **Verkehr, große Reparatur (22.09.2026):** Der Nutzer meldete stehende
  Autos, Auffahrunfälle und Wagen, die nach dem Aussteigen von selbst
  weiterfuhren. Gemessen mit einer Simulation ohne Bild (60 Wagen, 60 s):
  **62 von 70 Wagen bewegten sich in 30 Sekunden keine 5 Meter.** Fünf
  Ursachen, alle in `verkehr.js` bzw. `karte.js`:

  | Fehler | Was passierte | Behoben durch |
  |---|---|---|
  | `zielSuchen` ohne Ersatz | Keine Kreuzung voraus (Sackgasse, Kartenrand, schräge Straße) → `ziel = null` → Wagen stand für immer und staute alles hinter sich | Ziel bis ans Straßenende, dort wenden; geht geradeaus nichts, die Richtung mit dem längsten freien Stück |
  | Spurmitte an der Kreuzung | `bandGrenzen` maß über die Querstraße mit, die Spur lag auf dem Gehweg | Band zählt nur Fahrbahn, keine Kreuzung |
  | Spurmitte auf breiten Straßen | Ziel war immer der äußerste Rand — auf der Autobahn bis 25 m zur Seite | Eigene Fahrbahnhälfte, darin die Spur, auf der der Wagen schon fährt |
  | Kurven geschnitten | Nach dem Abbiegen zog der Wagen aus der Kreuzung schnurgerade auf die übernächste zu, quer über den Gehweg | Zwischenziel am Kreuzungsausgang (`austritt`) |
  | Bremsen als Schalter | Ein Fußgänger auf dem Gehweg hielt einen Wagen dauerhaft an; zwei Wagen blockierten sich gegenseitig ewig | Abstand statt Ja/Nein, Wunschtempo proportional zur Lücke; Fußgänger zählen nur auf der Fahrbahn; nach 4 s Stillstand „Drängeln" (1,5 s Vorrang für sich selbst) |

  Danach: 3 von 70 stehen, im Schnitt 90 m in 30 Sekunden, kaum noch
  ineinander. Wer länger als 6 s neben der Fahrbahn kurvt, gilt als
  verirrt und wird außer Sicht neu eingesetzt.
- **Abgestelltes Auto bleibt stehen:** Beim Aussteigen bekommt der Wagen
  `verlassen = true`. Ohne den Merker übernahm ihn die Verkehrs-KI sofort
  wieder und er fuhr davon, als säße jemand drin. Jetzt rollt er aus und
  wird erst weit weg (oder verirrt) wieder eingesetzt.
- **Vorn und hinten am Auto (21.09.2026):** Die Kamera schaut von schräg hinten
  oben, man sieht also vor allem Dach und Heck. Deshalb tragen alle Fahrzeuge
  jetzt **zwei weiße Scheinwerferflächen auf der Haube** und **zwei rote
  Rückleuchten auf dem Heckdeckel**, dazu eine helle blaue Frontscheibe und
  eine fast schwarze Heckscheibe. Vorher sah ein Auto von oben vorn wie hinten
  aus. Streifenwagen haben einen breiten Lichtbalken und eine dunkle Haube,
  Rettungswagen ein rotes Kreuz auf dem Dach, die Feuerwehr Leiter und
  Reflexstreifen; beide fahren im normalen Verkehr mit.
- **Zwei Fallstricke beim Rendern** (beide haben je einen Durchgang gekostet):
  1. `--ziel` **muss ein absoluter Pfad sein**. Mit einem relativen Pfad meldet
     Blender „gerendert", schreibt die Datei aber woandershin — im Spiel bleibt
     das alte Bild stehen.
  2. Im Sammelmodus (`--nur autos`, alle Wagen in einer Blender-Sitzung) fehlte
     ein Teil der Geometrie. Deshalb **je Fahrzeug eine eigene Sitzung**
     (`--nur eins:<name>` in einer Schleife).
- **Sprites:** Fahrzeuge kommen aus Blender (`tools/spiel-sprites.py`, Kamera
  20° geneigt, orthografisch, 64 px je Meter), Figuren werden gezeichnet
  (`tools/spiel-figuren.py`) — ein heruntergerechnetes 3D-Bild ist bei 25 Pixeln
  Körpergröße nicht mehr zu erkennen, eine gezeichnete Figur schon.
  `tools/spiel-nachbearbeiten.py` setzt Konturen und beschneidet mittig.
  Alle Grafiken sind eigens entstanden — **nichts stammt aus Rockstar-Bildern**.
- **Figurenwechsel:** Alt halten öffnet die Auswahl (Porträts wie in GTA VI,
  `.swechsel` in `spiel.html`), A/D wählt, Loslassen wechselt. Danach fährt die
  Kamera hoch, hinüber und wieder herunter (`fahrtRechnen()` in `spiel.js`);
  auf halber Strecke übernimmt die neue Figur. Bei „Bewegung reduzieren"
  springt sie ohne Fahrt.
- **Passanten** (`Passant` in `wesen.js`): laufen auf Gehwegen, Parks und Strand,
  bleiben stehen, biegen ab und rennen weg, wenn ein schnelles Auto näher als
  8 m kommt. Gerechnet wird nur im Umkreis von 90 m, weiter entfernte werden vor
  dem Spieler neu aufgestellt (`passantenNachziehen`).
- **Steckenbleiben:** Figuren und Autos haben `entklemmen()` — steckt etwas in
  einer Wand, wird der nächste freie Platz gesucht. Ohne das konnte man nach
  einem Crash nicht mehr fahren und die zweite Figur stand im Haus fest.
- **Verkehr** steuert wie ein Spieler: Ziel auf der eigenen Spur, hinlenken, Gas.
  An Kreuzungen wird gewürfelt (62 % geradeaus), Rot heißt anhalten, und wer
  zu lange steht, sucht sich eine neue Richtung.
- **Polizei** erbt vom Verkehr, hält sich aber an keine Ampel: Bei freier Sicht
  fährt sie direkt auf den Spieler zu, sonst über das Straßennetz — an jeder
  Kreuzung die Richtung, die näher an den Spieler führt.
  **Härte hängt an der Stufe** (21.09.2026): bis zwei Sterne bleiben die Wagen
  ein paar Meter hinter dem Spieler und rammen nicht, zu Fuß wird nur verhaftet.
  Ab drei Sternen wird gerammt und geschossen. Wagen je Stufe: 1 · 2 · 3 · 4 · 6.
  Eine Festnahme braucht 0,8 s Kontakt (`Polizist.griff`), nach jedem Neustart
  gibt es 4 s Schonzeit — vorher war man nach einem Rempler sofort „Busted".
  Polizisten haben Leben und können ausgeschaltet werden; das kostet einen Stern
  mehr.
- **Fahndung 0–5:** Ein angefahrener Fußgänger allein ist **kein** Stern mehr.
  Es gibt einen Stern ab drei Angefahrenen in 20 s, beim Totfahren, beim Rammen
  eines Streifenwagens (zwei) und beim Schießen vor Zeugen; zwei Sterne beim
  Erschießen von Passanten. Abkühlung: eine Stufe je 12 s ohne Sichtkontakt.
  Im Code läuft alles über `mindestens(n)` in `spiel.js` — Delikte heben die
  Stufe nur an, sie summieren sich nicht mehr.
- **Kämpfen** (`waffen.js`): Maustaste schlägt oder schießt, gezielt wird zur
  Maus, das Mausrad oder Q wechselt die Waffe, 1–5 wählen direkt. Getroffen wird
  über einen Strahl in Schritten von 0,5 m bis zur ersten Wand oder Person —
  billiger als echte Geschosse und bei diesen Entfernungen nicht zu unterscheiden.
  Ein Faustschlag wirft Passanten um (`Figur.umwerfen`), sie liegen ein paar
  Sekunden. Die Figur holt dabei sichtbar aus (`ausholen()`), obwohl die Sprites
  kein eigenes Schlagbild haben: kurzer Versatz nach vorn plus ein heller Bogen.
- **Waffenbilder** (`waffenbilder.js`) entstehen im Browser auf einer Leinwand,
  nicht als Datei: von oben (Mündung nach oben, 256 px/m) für die Hand, von der
  Seite für Laden und Anzeige. In der Hand werden sie 1,7-fach gezeichnet —
  maßstabsgetreu wären es sechs Bildpunkte auf dunklem Asphalt.
- **Ammu-Vice:** drei eigene Gebäude (`BAU.WAFFEN`, grün mit Zielscheibe auf dem
  Dach, als Wahrzeichen auf der Karte). Der Eingang liegt auf dem Gehweg davor,
  dort öffnet E den Laden: Pistole 300, Micro-MP 1200, Pumpgun 1900, AK 3200,
  Munition 150.
- **Springen** mit der Leertaste (zu Fuß; im Auto bleibt sie die Handbremse).
  Der Sprung ist nur Zeichnung: `Figur.hoch` hebt das Sprite an, der Schatten
  schrumpft, das Tempo steigt kurz um ein Drittel.
- **Aufträge (22.09.2026 neu):** zehn statt vier, und sie liegen an den
  Wahrzeichen statt auf irgendeinem Parkplatz. Sechs Schrittarten:
  `fahren`, `warten`, `drinnen`, `sammeln`, `jagen`, `abhaengen`.
  Beim **Ladenraub** (`drinnen`) verschwindet die Figur im Gebäude
  (`zustand.drinnen`), die Uhr läuft, danach steht man mit Beute und zwei
  Sternen wieder draußen und muss flüchten — vorher stand man nur in einem
  Kreis auf einem Parkplatz herum, was niemand verstanden hat.
  Beim **Abhängen** zählt jetzt auch der Abstand: die Fahndung kühlt
  doppelt so schnell ab, wenn der nächste Streifenwagen weiter als 150 m
  weg ist.
- **Drei Einblendungen, drei Farben** (`endeZeigen(text, art)`):
  `verhaftet` blau, `tot` rot, `gut` grün für „Auftrag geschafft". Vorher
  hieß beides „ERLEDIGT" und man wusste nie, was gerade passiert war.
  Nach dem Tod startet man **an der Klinik**, nach einer Festnahme **vor
  der Wache** — nicht mehr irgendwo auf der Straße.
- **Zugang nur mit Konto:** `spielTor` liegt über der Bühne, solange
  `konto.nutzer` fehlt; die Knöpfe öffnen den Anmelde- oder
  Registrierdialog (`dialogOeffnen`). Ohne eingerichtetes Backend bleibt
  die Tür offen, sonst könnte lokal niemand spielen.
- **Marken auf der Karte** haben eigene Formen (`MARKEN` in
  `minikarte.js`): Stern = Auftrag, Raute = aktuelles Ziel, Kreuz =
  Ammu-Vice, Fahne = Wegpunkt, Kreise für Figur und Polizei. Vorher waren
  alles Kreise, und Ziel wie Waffenladen waren beide grün. Auf der großen
  Karte zeigt ein Schild unter dem Zeiger, was die Marke bedeutet.
- **Wegpunkt** verschwindet von selbst, sobald man näher als 9 m dran ist.
- **Punkte** = Geld + 750 je erledigtem Auftrag. Mit Konto landet der Bestwert
  in Firestore (`bestenliste/{uid}`, öffentlich lesbar) und auf der Spielseite;
  ohne Konto nur im `localStorage`.
- **Tasten:** `E` **oder `F`** ein- und aussteigen bzw. Waffenladen betreten,
  `V` Vollbild (früher F), `M` Karte, `N` Ton, `H` Hupe, Mausrad/`Q` Waffe,
  `1`–`5` Waffe direkt, Maustaste angreifen, Leertaste springen (im Auto
  Handbremse), `P` Pause.
- **Touch (21.09.2026 neu):** Auf Telefon und Tablet erscheint die Bedienung
  automatisch (`pointer: coarse` oder `maxTouchPoints`). Zu Fuß: Stick in alle
  Richtungen, rechts ✊ schlagen, ⤒ springen, ⇄ wechseln, E. **Am Steuer wird
  aus dem Stick ein breites Lenkband**, das nur links und rechts kennt
  (Ausschlag gekrümmt: `sign(x)·|x|^1.4`), dazu ▲ Gas, ▼ Bremse, H Handbremse
  und ♪ Hupe. Mit dem Stick zu fahren war auf dem iPad nicht zu beherrschen —
  das war die Rückmeldung, die zu diesem Umbau geführt hat. Umgeschaltet wird
  in `touchModus()` über die Klasse `.stouch--auto`.
- **Karte auf dem Tablet:** Neben Ton und Vollbild liegt ein **Kartenknopf**
  (`#spielKarteKnopf`), und **ein Tipp auf die Minikarte öffnet die große
  Karte**, statt einen Wegpunkt zu setzen — mit dem Finger trifft man die
  kleine Karte nicht genau genug. Mit der Maus bleibt es beim Wegpunkt.
  Auf kleinen Schirmen füllt die große Karte die obere Hälfte, darunter
  stehen Legende und Knöpfe.
- Die aktive Figur bekommt einen pinken Ring, die zweite einen blauen — sonst
  findet man sich zwischen den Passanten nicht wieder.
- **Stadt (20.09.2026 neu):** kein Schachbrett mehr. Wasserarm mit Brücken,
  Kanal zur Strandinsel, Autobahnring ohne Ampeln, zwei Diagonalen, zwei
  Kreisverkehre, geschwungene Nebenstraßen mit ungleichen Abständen, Sackgassen,
  Bezirke (Innenstadt, Strand, Hafen, Industrie, Wohnen) und zehn Wahrzeichen
  (VCPD, Feuerwache, Klinik, Bank, Stadion, Kaufhaus, Tankstellen, Kirche, Schule).
  Häuser haben Bauarten mit eigener Farbe und eigenen Dachaufbauten.
  **Wichtig beim Ändern:** Flächen nur über `baulandSetzen()` füllen — `rechteck()`
  überschreibt sonst fertige Straßen, dann verschwindet ein halbes Viertel.
- **Straßen ohne Unsinn (21.09.2026):** Der Nutzer hatte Straßen gemeldet, die
  mitten zwischen Häusern anfangen und aufhören. Ursache waren Nebenstraßen mit
  zufälligem Anfang, Gassen, die im Gehweg endeten, und Brücken ohne Anschluss.
  Jetzt laufen alle Nebenstraßen von Rand zu Rand, Gassen werden quer durch die
  ganze Baufläche geschnitten, Brücken bauen hinter dem Wasser weiter, bis eine
  Straße kommt — und zum Schluss räumt `strassenSaeubern()` auf:
  1. 40 Runden Sackgassen abtragen (Kachel mit weniger als vier befahrbaren
     Nachbarn fliegt raus, Stadtrand ausgenommen),
  2. nur das größte zusammenhängende Netz behalten.
  Dazu **Uferstraßen** an Fluss, Kanal und Hafenbecken, damit Querstraßen am
  Wasser aufgefangen werden. Prüfen lässt sich das Ergebnis mit einem kurzen
  Node-Skript über `felder.art`: es muss genau **ein** Netzteil herauskommen.
- **Kein Bremsen mehr abseits der Fahrbahn** (Wunsch des Nutzers).
- **Ampeln** sind ein Blender-Modell (`ampel_rot|gelb|gruen.png`) plus farbiger
  Schein; die Phase liegt in `karte.js` (`ampelPhase`), Verkehr und Zeichnung
  fragen dieselbe Funktion. Wer schon auf der Kreuzung steht, räumt sie.
- **Karte auf Taste M** (`minikarte.js: grosseKarteZeichnen`) mit Zielen,
  Wahrzeichen, Legende und Einstellungen; das Spiel pausiert solange.
  Ton liegt seither auf **N**, Hupe auf **H**.
  Seit 21.09.2026 **scharf und bedienbar**: die ganze Stadt liegt einmal als
  Puffer mit 2 Bildpunkten je Meter (`weltPuffer`), die Leinwand wird auf die
  echte Bildschirmauflösung gebracht (`schaerfen()`), Beschriftungen stehen in
  Bildschirmpunkten mit dunklem Saum. Mausrad zoomt auf den Zeiger, Ziehen
  verschiebt, ein kurzer Klick setzt den **Wegpunkt** (noch einmal darauf
  klicken löscht ihn, wie der Knopf daneben).
- **Minikarte im GTA-VI-Stil:** abgerundetes Rechteck — **nach Norden
  ausgerichtet**. Sie drehte sich früher mit der Fahrtrichtung; beim Fahren
  wanderte dadurch die halbe Stadt und man fand keinen Wegpunkt. Jetzt dreht
  sich nur der Pfeil in der Mitte. Mausrad zoomt (fünf Stufen, 60–340 m), ein
  Klick setzt einen Wegpunkt. Der Ausschnitt wird doppelt so fein gepuffert wie
  gebraucht und verkleinert gezeichnet, sonst franst jede Kachelkante aus.
  Dafür braucht `.skarte` in `spiel.css` `pointer-events:auto` — die übrige
  Anzeige ist durchlässig.
- **Ortsliste auf der großen Karte (22.09.2026):** Rechts neben der Karte
  stehen alle festen Orte der Stadt (`Karte.wahrzeichen`, 16 Stück:
  Wache, Feuerwache, Klinik, Bank, Stadion, Kaufhaus, zwei Tankstellen,
  Kirche, Schule, drei Ammu-Vice, drei Nachtclubs), nach Entfernung
  sortiert, mit Farbpunkt der Bauart und Meterangabe. Ein Klick setzt den
  Wegpunkt, ein zweiter löscht ihn. Gebaut in `spiel.js` (`orteFuellen`),
  gefüllt beim Öffnen der Karte.
- **Karte hält das Spiel wirklich an:** `zustand.pause` stoppte zwar die
  Rechenschleife, aber Motor und Sirene sind Dauertöne, deren Lautstärke
  nur in `Ton.laufen` gesetzt wird — sie liefen einfach weiter und es
  klang, als spiele das Spiel im Hintergrund. `Ton.anhalten()` blendet sie
  beim Pausieren und beim Öffnen der Karte aus.
- **Route folgt Straßen** (`wege.js`): A* über die befahrbaren Kacheln, Start
  und Ziel werden auf die nächste Straße gezogen. Vorher lief eine gerade Linie
  quer über Häuser und den Fluss. Eine ganze Suche kostet bis zu 20 ms, deshalb
  rechnet `Route` nur bei Zielwechsel neu oder wenn man weiter als 28 m neben
  der Strecke ist; sonst werden nur zurückgelegte Stücke abgeschnitten.
- **Ton:** Browser halten Web Audio an, sobald die Seite in den Hintergrund geht —
  `ton.js` weckt es bei Tabwechsel, Klick und Taste wieder auf. Dazu Reifen,
  Hupe, Türen, Schreck, Schuss und Faustschlag. Das leise Stadtrauschen ist
  **wieder raus** — es klang nach defektem Lautsprecher (Rückmeldung des Nutzers).
- **Schrottautos:** Ein Wagen über 115 Schaden bekommt `schrott = true`, raucht
  aus der Motorhaube und fährt nur noch mit halber Kraft — **hinausgeworfen wird
  niemand mehr**. Das Aussteigen nach einem Crash war die größte Beschwerde:
  erst flog man jeden Bildaufbau erneut raus, dann einmal — jetzt gar nicht.
- **Parkende Autos** (`autosVerteilen`): Parkplätze zuerst, auf der Straße nur am
  Fahrbahnrand (`bandGrenzen`), längs zur Straße, mindestens 6,5 m Abstand
  zueinander und 9 m zum fahrenden Verkehr. Vorher standen am Start zehn Wagen
  ineinander. Es sind 22 parkende und 70 fahrende.
- Rechtsklick öffnet auf der Spielbühne kein Browser-Menü mehr.
- **Wasser (24.09.2026):** keine Kachel-Textur mehr, sondern ein nahtloses Muster
  (`wasserBildBauen`, 256 × 256, Sinuswellen mit ganzzahligen Frequenzen), das über
  `setTransform` an die Welt gebunden ist — dadurch keine Streifen und Nähte an den
  Stück-Grenzen. `wasserUfer()` dunkelt unter Kaimauern ab und macht Strände flach
  türkis mit Schaumlinie. `uferKante()` setzt an jede Straße/Gehweg-Kante zum Wasser
  eine Betonkante mit Geländer, am Hafen Poller.
- **Brücken mit Gehweg:** `stadtplan.js → brueckenStege()` macht aus dem Wasser neben
  einer Brücke Gehwegfelder (`felder.steg`, `istSteg()`), Autobahnbrücken ausgenommen.
  `karte.js → stegMalen()` zeichnet Gehweg, Stahlträger mit rostigen Kreuzstreben,
  Bordstein zur Fahrbahn und alle drei Felder eine Laterne. Passanten laufen darüber,
  weil es normale Gehwegfelder sind. Gemessen: 399 Brückenfelder, 179 Stegfelder, ein
  zusammenhängendes Straßennetz.
- **Mittelstreifen:** bei gerader Spurzahl lag die Mitte auf der Kachelgrenze und wurde
  doppelt gemalt. Jetzt `lage` hinten/vorn/mitte — ein Streifen über die Grenze.
- **Spielstand im Konto:** `spiel.js → spielstandLaden/-Sichern`. Gesichert alle 10 s,
  wenn sich etwas geändert hat, dazu bei Tabwechsel und Verlassen. Geprüft: Geld und
  Waffen sind nach Neuladen wieder da.
- **Entwicklermenü (F8 oder DEV-Knopf, nur Admins):** Geld setzen/dazu, Leben, Panzerung,
  Ausdauer unendlich, keine Polizei, Nacht, alle oder einzelne Waffen, Munition voll,
  heilen, jedes Fahrzeug spawnen und einsteigen (`devStellplatz` sucht ein Straßenfeld
  ohne anderes Auto), Auto reparieren (eigenes oder nächstes), alle in der Nähe reparieren,
  anhalten, Schalter „Auto unzerstörbar" und „Turbo" (`fahrzeug.turbo`, wirkt nur, solange
  der Spieler fährt), Fahndung 0–5, Sprung zum Wegpunkt. Das Menü pausiert das Spiel;
  `cheatsAnwenden()` läuft vor dem Todescheck.
- **Belohnungsfaktor** aus der Admin-Seite: `missionen.geldFaktor`, beim Spielstart geladen.
- **Laden und Startbild (25.09.2026):** Rund 11 MB Grafik, gut 400 Bilder, zwei Drittel
  Gebäude. Früher war die Bühne schwarz, bis das Konto antwortete (live mit Firebase ein
  paar Sekunden), und nach dem Klick lud es ohne jede Anzeige. Jetzt:
  - Startbild steht sofort (`torPruefen` wartet auf `kontoDa`), Sonnenuntergang mit
    Retro-Sonne, Skyline und Palmen — alles CSS/SVG in `spiel.html`, kein fremdes Bild.
  - Sobald feststeht, dass jemand spielen darf, lädt `vorladenStarten()` im Hintergrund
    (nicht bei „Datensparen"). Unter dem Knopf steht der Stand in Prozent.
  - Nach dem Klick: Ladebalken 0–100 % (Bilder bis 92 %, Stadt bauen den Rest), wechselnde
    Schritt-Texte und Tipps unten links.
  - `bilder.js → laden(namen, fortschritt)` holt jedes Bild nur einmal, auch wenn Vorladen
    und Start es beide anfordern. Innenräume laden erst nach dem Start.
  - **Fallstrick:** `naechsterFrame()` wartet nie nur auf `requestAnimationFrame` — das
    steht im Hintergrund-Tab still, das Laden hing dann bei 95 %.
  - **Fallstrick:** Beim Tabwechsel wurde auch vor dem Start pausiert; die Pause-Ebene lag
    dann über dem Startbild („schwarzer Bildschirm"). Pausiert wird nur noch, wenn das
    Spiel läuft.
  - **Fallstrick:** `kontoAbo()` ruft sofort zurück, wenn das Konto schon da ist — die
    Konto-Abos stehen deshalb hinter den Lade-Variablen (sonst TDZ-Fehler).
- **Neue Räume (25.09.2026):** 24/7 an jeder Tankstelle, jede Klinik, jede Wache, die Bank
  (`BETRETBAR` in `spiel.js`, Türen über `Karte.eingangVor`). Die Räume sind in `innen.js`
  gemalt (`moebel`-Liste → Bild und Sperren aus derselben Liste, `raumGemalt`). Personal
  steht mit Standbild (`bild` im Plan). Aktionen: Eistee, Snacks, Kasse ausrauben (★★),
  behandeln lassen, Blut spenden, Strafe zahlen (Fahndung weg, $300 je Stern), Bankschalter
  ausrauben (★★★). Ausgeraubte Kassen sind ein paar Minuten leer (`tuer.leerBis`), außer ein
  Auftrag verlangt sie. `nurMission`-Aktionen erscheinen nur, wenn ein Auftrag darauf wartet.
- **20 Aufträge** (10 neue): Straßenrennen, Taxi, Denkzettel (Auto zerstören), Schulden
  eintreiben, 24/7-Überfall, Krankenakte, Kisten vom Hafen, VIP-Chauffeur, Sportwagen,
  Der große Coup (erst nach 8 erledigten, `ab: 8`). Neue Schrittarten in `missionen.js`:
  `strecke`, `aktion`, `zerstoeren` (Zielauto auch beschießbar über `zusatzZiele()`),
  `ausschalten` (Zielperson flieht, wird von `passantenNachziehen` nicht versetzt),
  `typen` bei `fahren` (bestimmte Wagen).
- **Laufende Passanten (25.09.2026):** acht Figuren mit vier Richtungen mal vier Posen
  (`LAUF_LEUTE` in `wesen.js`, Bögen `volk_*` in `tools/spiel-bogen.py`): Surfer, Skaterin,
  Lebemann, Oma, Bauarbeiter, Joggerin, Tourist, Trainingsanzug. Sie kommen halb so oft vor
  wie alle alten Standbild-Passanten zusammen. Passanten machen kürzere Schritte
  (`schrittweite` 0,26 m je Bild statt 0,55 m), sonst rutschen die Beine; Oma und Joggerin
  haben ein eigenes Tempo (`EIGENES_TEMPO`). Neue Laufleute: Bogen eintragen, schneiden,
  `spiel-webp.py`, Namen in `LAUF_LEUTE`.
- **3D-Versuch wieder entfernt (25.09.2026):** Das Spiel lief kurz in 3D (Three.js), der
  Nutzer fand es hässlich — alles ist zurück auf 2D wie vorher. Der Code liegt nur noch
  lokal in `_backup/welt3d.js`, `_backup/spiel_mit_3d.js`, `_backup/karte_mit_3d.js`
  (nicht im Repository). Nicht ohne ausdrücklichen Wunsch wieder einbauen.
- **Figurenwechsel (25.09.2026):**
  - Startfigur ist zufällig (`weltBauen`), nicht mehr immer Lucia.
  - Die Figur, die man nicht spielt, lebt weiter (`selbstLeben` in `spiel.js`): im Auto
    fährt sie mit dem Verstand eines Verkehrsautos (`verkehr.js → selbstFahren` macht aus
    jedem Wagen nachträglich ein `VerkehrsAuto`), zu Fuß bummelt sie mit halbem Tempo die
    Gehwege entlang (`wesen.js → schlendern`: Kachel für Kachel, meist geradeaus, an Ecken
    abbiegen, ab und zu an der Ampel über die Straße). Kommt der Wagen 20 s nicht weiter,
    steigt sie aus und geht zu Fuß.
  - Nach dem Wechsel macht die neue Figur weiter, was sie tat (`zustand.selbst`), bis man
    eine Steuertaste, die Maustaste, E oder den Finger benutzt (`eingabe()`). Während der
    Kamerafahrt bewegen sich beide weiter.
  - Die eigene Steuerung steht jetzt in `steuern(f, dt)`; `f.gang` ist der Tempofaktor
    (0,5 beim Bummeln, 1 beim Steuern).
- **Lucia neu (25.09.2026):** neuer Bogen `lucia4` nach Wunsch des Nutzers; die vorherigen
  Bilder liegen in `_backup/lucia_vor_neu/`.
- Neu erzeugen:

```bash
powershell -Command "$z='<Projektordner>\assets\img\spiel'; foreach ($a in @('cabrio','limo','sport','pickup','taxi','streife','kombi','transporter','bus','oldtimer','krankenwagen','feuerwehr')) { & 'C:\Program Files\Blender Foundation\Blender 5.0\blender.exe' -b -P tools/spiel-sprites.py -- --ziel $z --nur ('eins:'+$a) }"
python tools/spiel-figuren.py --ziel assets/img/spiel
python tools/spiel-nachbearbeiten.py --ordner assets/img/spiel
```

**Achtung:** `--nur muster` rendert auch `lucia_steht.png` und `jason_steht.png` als 3D-Figuren und überschreibt damit die gezeichneten Sprites. Danach immer `tools/spiel-figuren.py` laufen lassen.

## Farben

Grundfarbe `--bg: #0b1124` — dunkelblau, nicht schwarz. Der Nutzer hat mehrfach betont, dass
die Seite ins Dunkelblaue gehen soll (Rockstars Flächen liegen bei `#111117` und `#0c0d1b`).
Abgeleitet: `--bg2 #111a33`, `--surf #17203d`, `--surf2 #1e294a`, `--surf3 #27345c`.

Marke: Creme `#fff9cb` (Headlines), Pink `#ffb2c6` (Primär-Buttons), Vice-Magenta `#e8548c`
(Kicker), Netflix-Rot `#e50914`.

## Altersangaben der Figuren

**Rockstar nennt zu keiner Figur ein Alter.** Die Spanne unter „Alter" in `CHARS[].meta`
ist aus der jeweiligen Biografie abgeleitet. Auf Wunsch des Nutzers steht auf der Seite
nur „Alter" ohne Zusatz — die Spanne statt einer festen Zahl trägt die Unsicherheit.
Trotzdem gilt: **keine offizielle Angabe**, nicht als solche weitergeben.

| Figur | Spanne | Woraus abgeleitet |
|---|---|---|
| Jason Duval | 28–32 | Army-Dienst plus die Jahre danach als Kurier in den Keys |
| Lucia Caminos | 24–27 | frisch aus dem Leonida Penitentiary, Erscheinung in Trailer 2 |
| Cal Hampton | 27–32 | Jasons langjähriger Freund, also ähnlicher Jahrgang |
| Boobie Ike | 38–45 | Straße abgesessen, danach Club, Studio und Immobilien aufgebaut |
| Dre'Quan Priest | 28–33 | über Mixtapes hochgekommen, sucht noch den ersten großen Hit |
| Real Dimez | 25–29 | seit der Highschool befreundet, der frühe Hit liegt fünf Jahre zurück |
| Raul Bautista | 45–55 | „Experience counts", langjähriger Bankräuber mit eigener Crew |
| Brian Heder | 55–65 | goldene Ära des Schmuggels in den Keys, inzwischen dritte Ehe |

Es kursiert eine Fan-Rechnung, die Jason und Lucia über die Bonnie-und-Clyde-Parallele auf
je 24–25 setzt. Sie hängt an einer einzelnen Annahme und passt schlecht zu Jasons
Army-Vorgeschichte, deshalb liegen die Werte hier etwas höher.

## Herkunft der Inhalte

- **Alle Bilder und Videos** stammen aus Rockstars offiziellem Presse- und Downloadbereich
  (`rockstargames.com/VI/media`), der ausdrücklich zum Herunterladen und Teilen einlädt
- **Charakter-Zitate** in Englisch sind wörtlich von `rockstargames.com/VI`
- **Deutsche Fließtexte** sind Übersetzung bzw. Zusammenfassung
- **Cal Hampton, Boobie Ike, Dre'Quan Priest:** Rockstar veröffentlicht zu diesen dreien keine
  Biografie. Die Texte sind aus dem Trailer-2-Material zusammengefasst — bei Bedarf prüfen
- **News-Stand: 17. September 2026.** GTA-VI-DualSense-Controller (PlayStation.Blog, 03.09.),
  Rob-Nelson-Interview „keine Mikrotransaktionen, keine generative KI" (Ende August), Extended
  Look (27.08.), Leak-Serie „CyberLeek" mit Subpoenas gegen Microsoft, Discord, X und Google,
  Download ab 12.11. Der Newswire-Artikel „Pre-Order …" vom 24.06. ist dabei rausgeflogen —
  passt ohnehin nicht zur Regel „kein Pre-Order". **Vor dem Release erneut aktualisieren**

## Wünsche des Nutzers, die dauerhaft gelten

- **Kein „Pre-Order"** irgendwo — er hat die Ultimate Edition bereits vorbestellt
- **Navigationsleiste immer transparent**, niemals ein schwarzer Balken beim Scrollen
- **VI-Logo dauerhaft oben links**
- Er arbeitet mit Screenshots von `rockstargames.com/VI` als Referenz und vergleicht genau
- Übergänge sollen weich sein; Ruckeln fällt ihm sofort auf
- Die Seite soll auch auf Englisch vorzeigbar sein (z. B. für Bewerbungen); Standard bleibt Deutsch

## Rechtliches

Inoffizielle Fan-Seite, nicht mit Rockstar Games oder Take-Two Interactive verbunden. Alle
Bilder, Videos, Logos und Marken gehören ihren jeweiligen Eigentümern. Die Seite ist öffentlich,
aber privat und nicht kommerziell. Der Footer trägt den entsprechenden Hinweis samt
Alterskennzeichnung.

**Datenschutz:** `datenschutz.html` beschreibt Hosting, Schriften, Videos, Speicherung im
Browser, Konten und Newsletter. **Name, Anschrift und E-Mail eines Verantwortlichen stehen dort
auf Wunsch des Nutzers nicht** — die Seite ist privat, nicht bei Google gelistet und nur für
Freunde gedacht. Die DSGVO verlangt die Angabe bei öffentlich erreichbaren Seiten mit Konten
eigentlich trotzdem; darauf wurde hingewiesen, der Nutzer hat sich dagegen entschieden. Der
Footer-Link erscheint nur bei aktivem Kontosystem (`html.konto-an`). Keine Rechtsberatung.
Offener Punkt: Google Fonts wird von Googles Servern geladen; selbst gehostete Schriften wären
datenschutzrechtlich sauberer.
