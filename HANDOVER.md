# Übergabe — GTA VI Fan-Website

Kurzfassung des Projektstands für die nächste KI, die daran weiterarbeitet.

## Was das ist

Eine private, **inoffizielle Fan-Website zu Grand Theft Auto VI**, gebaut als Hype-Seite für
den Besitzer (hat die Ultimate Edition vorbestellt). Sie ist kein Shop und keine Kopie der
Rockstar-Seite, sondern eine eigene Scroll-Erzählung im Look von `rockstargames.com/VI`.

**Sprache der Inhalte: Deutsch.** Englische Zitate von Rockstar bleiben wörtlich stehen.

- **Pfad:** `C:\Users\young\OneDrive\Desktop\Claude Projekte\GTA6-Hype-Website`
- **Stack:** statisches HTML/CSS/JS, **kein Build-Schritt**, keine Abhängigkeiten außer Google Fonts
- **Umfang:** ~4.400 Zeilen Code, 150 Bilder, 10 Videos, ~85 MB
- **Nicht veröffentlichen** — private Nutzung, siehe Abschnitt „Rechtliches"

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
| `charakter.html` | 104 | **Gerüst der Charakter-Detailseiten** — eine Seite für alle acht |
| `assets/css/style.css` | 1351 | Design-Tokens, Layout, Responsive, Reduced-Motion, **Mobil-Block M1–M9** |
| `assets/css/char.css` | 403 | **Nur die Detailseiten** — Editorial-Raster, Zitatbänder, Vollbild |
| `assets/js/data.js` | 670 | **Alle Texte und Bildlisten**; `CHARS` (Stammdaten) + `CHAR_PAGES` (Seitenaufbau) |
| `assets/js/main.js` | 756 | Countdown, Scroll-Motor, Videos, Galerie, 3D-Hülle |
| `assets/js/char.js` | 514 | Aufbau der Detailseiten, Scroll-Video, Vollbild, Lightbox |
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
- **News:** Rockstar Newswire, Leak-Chronik mit Quellen, X-Accounts
- **Trailer:** Trailer 1 + 2 als YouTube-Overlay auf der Seite, Extended Look als externer Link
- **Barrierefreiheit:** Skip-Link, Fokus-Ringe, ARIA-Labels, vollständiger `prefers-reduced-motion`-Zweig
- **Mobil:** eigener Verhaltenszweig für Touch — Details im Abschnitt „Mobil / Android"
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

**Eine Seite für alle acht.** Welche Figur gezeigt wird, steht in der Adresse.
Eine unbekannte `id` liefert eine Fehlerseite mit Rückweg statt einer leeren Seite.

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
8. **`.coutro`** — Bilder, dann **`.cnav`**: zwei Vorschaukarten auf die
   vorherige und die nächste Figur, darunter „Zurück zu den Charakteren" und
   „Zur Startseite". Die Reihenfolge kommt aus `CHARS` und läuft **geradeaus,
   nicht im Kreis**: Jason hat keinen Vorgänger, Brian Heder keinen Nachfolger.
   An diesen beiden Enden bleibt nur eine Karte übrig — sie bekommt über
   `.cnav--einzeln` die volle Breite, damit das Raster nicht halb leer wirkt.
   Als Kartenbild dient `page.heroImg` bzw. `base.thumb`, nie ein Duo-Motiv —
   sonst zeigt die Karte die falsche Person.

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

### Drei Fallstricke

**Die Hero-Höhe steuert zwei Dinge gleichzeitig.**

1. *Wie schnell der Clip läuft.* Die nutzbare Strecke ist `Höhe − 100svh` (die
   ersten 100 svh klebt das Medium nur), davon spielt `PLAY_END` (0.90) den Clip
   ab. Damit sich das Video genauso durchscrollen lässt wie das zwischen Trailer
   und Story, spiegeln die Werte `.scrub` aus `style.css`: **400 svh** am Desktop,
   250 / 215 svh in den Media-Queries. Gemessen ergibt das auf beiden Seiten
   **329 px Scroll pro Videosekunde** — 2,70 Bildschirmhöhen für einen ganzen Clip.
2. *Ob die Karte passt.* Die Höhe muss mindestens `--rise + 100svh` betragen,
   sonst ragt die Intro-Karte schon beim Laden ins Bild und der Name steht
   doppelt da — einmal im Hero, einmal auf der Karte. Genau das passierte, als
   die Nebenfiguren-Heroes auf 190 svh gekürzt wurden.

Beides hängt zusammen: weil die mobilen Höhen kleiner sind, geht `--rise` dort
von 118 auf 100 zurück. Wer an einem der Werte dreht, muss die andere Bedingung
nachrechnen; alles steht kommentiert in `char.css` bei `.cv` / `.cv--still`.

Einzige Abweichung: im Querformat läuft der Clip minimal langsamer als auf der
Startseite (1,03 statt 0,90 Bildschirmhöhen). Dort bräuchte die exakte Strecke
200 svh, das lässt der Karte aber keinen Puffer mehr — 215 svh ist der Kompromiss.

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

### Drei Fallstricke

**Die Hero-Höhe steuert zwei Dinge gleichzeitig.**

1. *Wie schnell der Clip läuft.* Die nutzbare Strecke ist `Höhe − 100svh` (die
   ersten 100 svh klebt das Medium nur), davon spielt `PLAY_END` (0.90) den Clip
   ab. Damit sich das Video genauso durchscrollen lässt wie das zwischen Trailer
   und Story, spiegeln die Werte `.scrub` aus `style.css`: **400 svh** am Desktop,
   250 / 215 svh in den Media-Queries. Gemessen ergibt das auf beiden Seiten
   **329 px Scroll pro Videosekunde** — 2,70 Bildschirmhöhen für einen ganzen Clip.
2. *Ob die Karte passt.* Die Höhe muss mindestens `--rise + 100svh` betragen,
   sonst ragt die Intro-Karte schon beim Laden ins Bild und der Name steht
   doppelt da — einmal im Hero, einmal auf der Karte. Genau das passierte, als
   die Nebenfiguren-Heroes auf 190 svh gekürzt wurden.

Beides hängt zusammen: weil die mobilen Höhen kleiner sind, geht `--rise` dort
von 118 auf 100 zurück. Wer an einem der Werte dreht, muss die andere Bedingung
nachrechnen; alles steht kommentiert in `char.css` bei `.cv` / `.cv--still`.

Einzige Abweichung: im Querformat läuft der Clip minimal langsamer als auf der
Startseite (1,03 statt 0,90 Bildschirmhöhen). Dort bräuchte die exakte Strecke
200 svh, das lässt der Karte aber keinen Puffer mehr — 215 svh ist der Kompromiss.

**Helle Artworks brauchen einen kräftigeren Verlauf.** Der Kicker über dem Hero
kam auf Rauls hellem Artwork auf **1,37 : 1** — unlesbar. Der untere Teil von
`.cv__vig` setzt jetzt früher an und erreicht am Fuß fast die Grundfarbe;
zusätzlich ist der Kicker von `--vice-hot` auf das hellere `--pink` gewechselt.
Gemessen danach: Kicker 7,1 : 1, Name 14 : 1. Wer den Verlauf abschwächt, muss
gegen ein **helles** Artwork nachmessen, nicht gegen Jasons dunklen Clip.
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
   (Hero 240/205 svh, Scrub 250/215 svh; am Desktop unverändert 320/400 vh).
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

### Startbildschirm

`manifest.webmanifest` plus `assets/img/app/` (192, 512, maskable 512, apple-touch 180).
Die Symbole sind aus `art/vi_logo.png` auf quadratischem `#0b1124` erzeugt. Android bietet
darüber „Zum Startbildschirm hinzufügen" an. **Eine echte Installation als PWA verlangt HTTPS
oder localhost** — über die WLAN-IP bleibt es deshalb eine normale Verknüpfung. Kein
Service Worker: der würde beim lokalen Entwickeln alte Dateien ausliefern.

### Prüfen

Getestet auf 375×812, 812×375 (quer), 1440×900. Kein waagerechtes Scrollen
(`document.scrollWidth === clientWidth`), keine Konsolenfehler, Desktop-Werte unverändert.

## Farben

Grundfarbe `--bg: #0b1124` — dunkelblau, nicht schwarz. Der Nutzer hat mehrfach betont, dass
die Seite ins Dunkelblaue gehen soll (Rockstars Flächen liegen bei `#111117` und `#0c0d1b`).
Abgeleitet: `--bg2 #111a33`, `--surf #17203d`, `--surf2 #1e294a`, `--surf3 #27345c`.

Marke: Creme `#fff9cb` (Headlines), Pink `#ffb2c6` (Primär-Buttons), Vice-Magenta `#e8548c`
(Kicker), Netflix-Rot `#e50914`.

## Herkunft der Inhalte

- **Alle Bilder und Videos** stammen aus Rockstars offiziellem Presse- und Downloadbereich
  (`rockstargames.com/VI/media`), der ausdrücklich zum Herunterladen und Teilen einlädt
- **Charakter-Zitate** in Englisch sind wörtlich von `rockstargames.com/VI`
- **Deutsche Fließtexte** sind Übersetzung bzw. Zusammenfassung
- **Cal Hampton, Boobie Ike, Dre'Quan Priest:** Rockstar veröffentlicht zu diesen dreien keine
  Biografie. Die Texte sind aus dem Trailer-2-Material zusammengefasst — bei Bedarf prüfen
- **News-Stand: 29. August 2026.** Release 19.11.2026, Extended Look seit 27.08.2026,
  laufende Leak-Serie („CyberLeek"), Rockstar-Statement vom 26.08.2026. **Muss aktualisiert werden**

## Wünsche des Nutzers, die dauerhaft gelten

- **Kein „Pre-Order"** irgendwo — er hat die Ultimate Edition bereits vorbestellt
- **Navigationsleiste immer transparent**, niemals ein schwarzer Balken beim Scrollen
- **VI-Logo dauerhaft oben links**
- Er arbeitet mit Screenshots von `rockstargames.com/VI` als Referenz und vergleicht genau
- Übergänge sollen weich sein; Ruckeln fällt ihm sofort auf

## Rechtliches

Inoffizielle Fan-Seite, nicht mit Rockstar Games oder Take-Two Interactive verbunden. Alle
Bilder, Videos, Logos und Marken gehören ihren jeweiligen Eigentümern. **Nur für den privaten
Gebrauch — nicht veröffentlichen.** Der Footer trägt den entsprechenden Hinweis samt
Alterskennzeichnung.
