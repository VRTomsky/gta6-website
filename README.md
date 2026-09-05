# GTA VI — Countdown nach Vice City

Eine interaktive Fan-Seite zu *Grand Theft Auto VI*. Statisches HTML/CSS/JS, kein Build-Schritt,
keine Abhängigkeiten außer Google Fonts.

## Starten

**Doppelklick auf `Server starten.bat`.** Einmal genügt:

- der Server startet im Hintergrund und läuft weiter, auch wenn das Fenster weg ist
- das Fenster zeigt kurz beide Adressen und schließt sich dann von selbst
- der Browser geht auf [http://localhost:5174](http://localhost:5174)
- der **Autostart wird eingerichtet** — nach jedem Hochfahren läuft der Server von selbst

**Doppelklick auf `Server stoppen.bat`** beendet ihn wieder und entfernt den Autostart.
Er bleibt dann auch nach einem Neustart aus, bis `Server starten.bat` wieder ausgeführt wird.

Voraussetzung ist eine Python-3-Installation; fehlt sie, sagt das Fenster es und nennt den
Downloadlink.

Von Hand geht es auch — dann mit Fenster und `Strg+C` zum Beenden:

```bash
python serve.py
```

`serve.py` kann drei Dinge, die `python -m http.server` nicht kann: es beantwortet
Range-Requests (ohne die lässt sich kein MP4 spulen, siehe `HANDOVER.md`), es schickt
`Cache-Control: no-store` (geänderte Dateien sind sofort sichtbar) und es ist im WLAN
erreichbar — die Adresse fürs Handy steht beim Start im Fenster.

`index.html` per Doppelklick funktioniert in Chrome ebenfalls, das Scroll-Video kann dabei aber
ruckeln.

## Veröffentlichen

Die Seite läuft öffentlich auf **https://luciajason.de** über GitHub Pages
(Repository `VRTomsky/gta6-website`).

**Doppelklick auf `Auf GitHub hochladen.bat`** — spiegelt den Projektordner ins
Repository, committet und lädt hoch. Ein bis zwei Minuten später ist der neue
Stand online. Im Browser einmal mit `Strg+F5` neu laden, sonst zeigt er die alte
Fassung aus dem Cache.

Optional mit eigener Beschreibung:

```bash
"Auf GitHub hochladen.bat" Neue Bilder in der Galerie
```

Gearbeitet wird in diesem Ordner, das Repository liegt unter
`C:\Users\young\gta6-website` — bewusst außerhalb von OneDrive, weil OneDrive
sonst den `.git`-Ordner mitsynchronisiert und dabei beschädigen kann.
`server.log`, `_backup/` und `__pycache__/` bleiben lokal.

## Auf dem Handy

Im Startfenster die Zeile **„Am Handy"** ablesen (z. B. `http://192.168.1.42:5174`) und diese
Adresse am Handy im Browser öffnen. Wenn das Fenster schon weg ist: dieselbe Adresse steht in
`server.log` im Projektordner.

PC und Handy müssen im selben WLAN sein; beim ersten Start fragt die Windows-Firewall —
„Privates Netzwerk" zulassen. Die Adresse kann sich ändern, wenn der Router dem PC eine neue
IP gibt; dann noch einmal in `server.log` nachsehen.

Über das Browser-Menü lässt sich die Seite auf Android als **„Zum Startbildschirm hinzufügen"**
ablegen; Name und Symbol dafür stehen in `manifest.webmanifest`.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Struktur aller Abschnitte der Startseite |
| `charakter.html` | Detailseite je Charakter, aufgerufen als `charakter.html?c=jason` |
| `assets/css/char.css` | Styles nur für die Detailseiten |
| `assets/js/char.js` | Aufbau der Detailseiten, Scroll-Video, Lightbox |
| `assets/css/style.css` | Design-Tokens, Layout, Responsive, Reduced-Motion |
| `assets/js/data.js` | Texte und Bildlisten (Charaktere, Orte, Ultimate Edition, News) |
| `assets/js/main.js` | Countdown, Scroll-Scrub, Trailer-Overlay, Galerie, 3D-Hülle |
| `assets/img/` | 150 offizielle Screenshots und Artworks (`duo/` = Jason + Lucia) |
| `assets/img/app/` | quadratische App-Symbole für den Startbildschirm |
| `assets/video/` | 2 Scroll-Clips (Lucia, Jason) + 8 Charakter-Loops (web-optimiert) |
| `Bilder & Kurz videos/` | Original-Downloads, unangetastet |
| `Server starten.bat` | Startet den Hintergrund-Server und richtet den Autostart ein |
| `Server stoppen.bat` | Beendet ihn und entfernt den Autostart |
| `serve.py` | Der Server dahinter (Range-Requests, kein Cache, WLAN) |
| `server.log` | Startzeiten und Adressen; wird automatisch angelegt |
| `manifest.webmanifest` | Name und Symbol für „Zum Startbildschirm hinzufügen" |
| `_backup/` | Sicherungen vor größeren Umbauten (bleibt lokal, nicht auf GitHub) |
| `Auf GitHub hochladen.bat` | Veröffentlicht den aktuellen Stand auf luciajason.de |
| `CNAME` | Die Domain für GitHub Pages — nicht löschen |
| `CLAUDE.md` | Arbeitsanweisungen für Claude (u. a. automatisch veröffentlichen) |

## Abschnitte

1. **Home** – Skyline, Logo, Live-Countdown bis 19.11.2026. Beim Scrollen kommt
   zunächst kein neuer Inhalt: erst blendet der Textblock aus (das Logo geht dabei
   nur auf 68 % zurück), danach verschwindet das Logo ganz, zuletzt dunkelt der
   Hero ab.
2. **Trailer** – fährt als Karte über den Hero. Extended Look (Netflix/YouTube),
   Trailer 1 + 2 als Overlay auf der Seite
3. **Scroll-Video 1** – Lucia in Vice City. Blendet schon hinter den letzten
   Trailer-Karten auf und läuft dabei von Anfang an mit.
4. **Story** – Vice City, USA, als Karte über dem Video
5. **Charaktere** – Jason, Lucia und sechs Nebenfiguren. Ein Klick öffnet die Akte
   in einem **neuen Tab**: eigene Seite mit Scroll-Video, Zitatbändern, Vollbild und
   Bildergalerie. Jason steht links, Lucia gespiegelt rechts.
6. **Leonida** – sechs Regionen mit Bildern
7. **Ultimate Edition** – Inhalte plus drehbare 3D-Hülle
8. **Scroll-Video 2** – Jason beim Überfall, gleiche Mechanik
9. **News & Leak-Lage** – Newswire, Leak-Chronik, X-Feed, ebenfalls als Karte
10. **Medien** – filterbare Galerie mit Lightbox

Alle drei Übergänge laufen über dieselbe Mechanik: ein gepinnter Abschnitt (Hero oder
`.scrub`) und darauf ein Abschnitt mit der Klasse `.rise-card`, der als abgerundete Box von
unten darüber fährt. Beim Hochfahren blendet die Kartenfläche über `--card-bg` ein, während
der gepinnte Hintergrund über `--h-out` bzw. `--s-out` auf die Grundfarbe übergeht — am Ende
steht die Karte auf dem normalen Blau, nicht mehr auf dem Video.

## Inhalte pflegen

Alle Texte und Bildzuordnungen stehen in `assets/js/data.js`:

- `RELEASE` – Zieldatum des Countdowns
- `CHARS` – Charakter-Stammdaten (`bio`, `meta`, `shots`)
- `CHAR_PAGES` – Aufbau der Detailseiten (Video, Zitate, Bildercluster, `side`)
- `PLACES` – Orte
- `ULTIMATE` – Inhalte der Ultimate Edition
- `XACCOUNTS` – verlinkte X-Accounts
- `GALLERY` / `GAL_CATS` – Galerie und Filter. Ein Eintrag ist entweder nur der
  Dateiname (Beschriftung wird durchnummeriert) oder `["datei.jpg", "Was drauf ist"]` —
  das Paar ist besser, es liefert Alt-Text und Lightbox-Zeile

Ein neues Bild kommt nach `assets/img/<ordner>/` und wird in der passenden Liste eingetragen —
sonst ist nichts zu tun.

## Schriften

Rockstar liefert auf `rockstargames.com/VI` fünf Schnitte einer hauseigenen Schrift aus:
`GTAArtDeco_Regular`, `_Medium`, `_Bold`, `_CondensedBold`, `_CondensedHeavy`. Die Schrift ist
weder käuflich noch für Dritte lizenziert, und ihr Server schickt keinen
`Access-Control-Allow-Origin`-Header — sie lässt sich also auch nicht per `@font-face` einbinden.

Ersatz nach direkter Messung gegen die echten Schnitte (gleicher Text, 100 px):

Die Grundfarbe der Seite ist `--bg: #0b1124` — dunkelblau statt schwarz, angelehnt an
rockstargames.com/VI (deren Flächen liegen bei `#111117` und `#0c0d1b`). Alle abgeleiteten Flächen (`--bg2`, `--surf`, `--surf2`, `--surf3`)
liegen im selben Blauton.

| Rockstar | gemessen | Ersatz | gemessen | Abweichung |
|---|---|---|---|---|
| ArtDeco Condensed Heavy | 965,7 px · Versalhöhe 70 | **Barlow Condensed 800** | 984,2 px · 71 | +1,9 % Breite |
| ArtDeco Bold | 1829,4 px · Versalhöhe 70 | **Figtree 700** | 1731,3 px · 67 | −5,4 % Breite |

Ausgeglichen über `letter-spacing:-.004em` auf `.h-display` und `font-size:17.6px` auf `body`
(hebt Figtrees 4 % kleinere Versalhöhe an). Alles über `--f-display`, `--f-body` und `--f-label`
in `style.css` austauschbar.

## Scroll-Video austauschen

`scrub_lucia.mp4` und `scrub_jason.mp4` entstanden aus Rockstars offiziellen 1–1,5-Sekunden-Clips
(`Lucia_Caminos_Video_Clip.mp4`, `Jason_Duval_Video_Clip.mp4`). Für ein Scroll-Video sind 30–45
Bilder zu wenig, deshalb wurden sie per Bewegungsinterpolation auf 150 bzw. 225 Bilder gestreckt:

```bash
ffmpeg -i quelle.mp4 -vf "scale=1280:-2,minterpolate=fps=150:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=5*PTS,fps=30" -an -c:v libx264 -crf 24 -g 5 -keyint_min 5 -sc_threshold 0 -bf 0 -movflags +faststart assets/video/scrub_lucia.mp4
```

Für ein Video, das schon lang genug ist, reicht die kurze Fassung — dichte Keyframes sind
Pflicht, sonst ruckelt das Scrubben:

```bash
ffmpeg -i quelle.mp4 -vf "scale=1280:-2,fps=30" -an -c:v libx264 -crf 25 -g 5 -keyint_min 5 -sc_threshold 0 -bf 0 -movflags +faststart assets/video/scrub_coverart.mp4
```

### Wichtig: das Video wird als Blob geladen

Je nach Server meldet der Browser für ein per HTTP ausgeliefertes MP4 `seekable = 0–0`. Das
Setzen von `currentTime` wird dann stillschweigend ignoriert und das Video bleibt auf dem
ersten Bild stehen — es sieht aus wie ein Standbild. `main.js` lädt die Datei deshalb zuerst
per `fetch` als Blob und hängt sie als `blob:`-URL ins `<video>`; damit ist sie immer voll
spulbar. Schlägt der Abruf fehl, bleibt die Direktquelle als Rückfallebene.

### Scroll-Strecken

Alles in `style.css`:

| Wert | Wirkung |
|---|---|
| `.hero { height: 320vh }` | Länge der Ausblend-Staffel (größer = langsamer) |
| `.scrub { height: 400vh }` | Länge der Video-Sequenz |
| `.scrub { margin-top: -100svh }` | Video liegt schon hinter dem vorherigen Abschnitt |
| `.rise-card { --rise }` | Überlappung der Karte in svh (Standard 100) |
| `#story, #news { --rise: 130 }` | Karte startet schon bei rund drei Vierteln des Clips |

In `main.js` steuern zwei Marken den Ablauf, gültig für beide Sequenzen: `FADE_IN = 0.22`
(bis dahin blendet das Video auf) und `PLAY_END = 0.90` (bis dahin läuft der Clip). Die
Wiedergabe startet schon bei 0 %, damit sich das Bild bewegt, während es noch aufblendet,
und endet erst, wenn die Karte das Video vollständig verdeckt — der Clip wird also nie
vorzeitig angehalten.

### Scroll-Motor

`scrollStage(el, onUpdate)` in `main.js` liest die Scrollposition eines Abschnitts einmal pro
Frame und zieht den Wert weich nach (Lerp, Faktor 0.16). Ohne das springen die Werte im Takt
der einzelnen Mausrad-Schritte, was beim langsamen Scrollen als Haken sichtbar wird. Läuft
`requestAnimationFrame` nicht (Tab im Hintergrund), greift nach 260 ms ein direkter Fallback.

## Videos in der Trailer-Sektion

| Video | ID | Einbindung |
|---|---|---|
| Trailer 1 | `QdBZY2fkU-0` | Overlay auf der Seite |
| Trailer 2 | `VQRLujxTm3c` | Overlay auf der Seite |
| An Extended Look | `tJbzMqJGH4k` | **nur externer Link** |

Der Extended Look ist auf YouTube altersbeschränkt. YouTube verbietet die Einbettung solcher
Videos auf fremden Seiten („nur auf YouTube verfügbar"), deshalb öffnen die beiden Buttons
einen neuen Tab statt des Overlays. Bei den Trailern geht das Overlay.

## Rechtliches

Inoffizielle Fan-Seite, nicht mit Rockstar Games oder Take-Two Interactive verbunden.
Alle Bilder, Videos, Logos und Marken gehören ihren jeweiligen Eigentümern; die Medien stammen
aus dem offiziellen Presse- und Downloadbereich unter
[rockstargames.com/VI/media](https://www.rockstargames.com/VI/media). Nur für den privaten
Gebrauch — nicht veröffentlichen.
