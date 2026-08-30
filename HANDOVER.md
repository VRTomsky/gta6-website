# Übergabe — GTA VI Fan-Website

Kurzfassung des Projektstands für die nächste KI, die daran weiterarbeitet.

## Was das ist

Eine private, **inoffizielle Fan-Website zu Grand Theft Auto VI**, gebaut als Hype-Seite für
den Besitzer (hat die Ultimate Edition vorbestellt). Sie ist kein Shop und keine Kopie der
Rockstar-Seite, sondern eine eigene Scroll-Erzählung im Look von `rockstargames.com/VI`.

**Sprache der Inhalte: Deutsch.** Englische Zitate von Rockstar bleiben wörtlich stehen.

- **Pfad:** `C:\Users\young\OneDrive\Desktop\Claude Projekte\GTA6-Hype-Website`
- **Stack:** statisches HTML/CSS/JS, **kein Build-Schritt**, keine Abhängigkeiten außer Google Fonts
- **Umfang:** ~3.100 Zeilen Code, 132 Bilder, 10 Videos, 81 MB
- **Nicht veröffentlichen** — private Nutzung, siehe Abschnitt „Rechtliches"

### Starten

**Doppelklick auf `Website starten.bat`.** Sucht Python (erst `py -3`, dann `python`),
startet `serve.py` und öffnet den Browser. Fenster schließen beendet den Server.

Von Hand:

```bash
cd "C:\Users\young\OneDrive\Desktop\Claude Projekte\GTA6-Hype-Website"
python serve.py
```

Dann `http://localhost:5174` öffnen. Die Adresse fürs Handy zeigt das Fenster beim Start an.

`serve.py` ersetzt `python -m http.server` und kann drei Dinge mehr:

| | Warum |
|---|---|
| **Range-Requests (206)** | Ohne die meldet der Browser für MP4s `seekable = 0–0` — genau der Fallstrick aus Abschnitt 1. Mit Range-Support ist die Direktquelle spulbar und der Blob-Umweg entfällt |
| **`Cache-Control: no-store`** | Löst den Cache-Fallstrick aus Abschnitt 6 an der Wurzel |
| **Bindet auf `0.0.0.0`** | Damit ist die Seite vom Handy im selben WLAN erreichbar |

## Dateien

| Datei | Zeilen | Inhalt |
|---|---:|---|
| `index.html` | 483 | Struktur aller Abschnitte |
| `assets/css/style.css` | 1371 | Design-Tokens, Layout, Responsive, Reduced-Motion, **Mobil-Block M1–M9** |
| `assets/js/data.js` | 302 | **Alle Texte und Bildlisten** (Charaktere, Orte, Ultimate, News, Galerie) |
| `assets/js/main.js` | 761 | Countdown, Scroll-Motor, Videos, Modals, Galerie, 3D-Hülle |
| `assets/img/` | 132 | `art/` 20, `chars/` 44, `places/` 42, `ultimate/` 26 |
| `assets/img/app/` | 4 | quadratische Symbole für den Android-Startbildschirm |
| `assets/video/` | 10 | 2 Scroll-Clips + 8 Charakter-Loops |
| `Website starten.bat` | — | Startet Server + Browser per Doppelklick |
| `serve.py` | 207 | Der Server dahinter |
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
5. **Charaktere** — Jason, Lucia + 6 Nebenfiguren
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
- **Charakter-Akten:** Klick öffnet ein Modal mit Biografie, Metadaten und Bildergalerie.
  Hover startet einen kurzen Videoloop (bei **allen** Karten, auch Jason und Lucia). Auf Touch übernimmt das ein IntersectionObserver, siehe Abschnitt „Mobil / Android"
- **Orte:** Tab-Navigation über 6 Regionen mit Postkarte, Text und Thumbnails
- **Ultimate Edition:** 16 Inhalte als Kacheln + Spielhülle in CSS-3D, die auf Mausbewegung
  reagiert und sich ziehen lässt
- **Galerie:** 118 Bilder, 6 Filter, Lightbox mit Pfeiltasten und Wischgesten
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
