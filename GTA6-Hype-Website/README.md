# GTA VI — Countdown nach Vice City

Eine interaktive Fan-Seite zu *Grand Theft Auto VI*. Statisches HTML/CSS/JS, kein Build-Schritt,
keine Abhängigkeiten außer Google Fonts.

## Starten

Wegen der Videos und `fetch`-freien, aber `file://`-empfindlichen Medien am besten über einen
lokalen Server öffnen:

```bash
python -m http.server 5173
```

Dann [http://localhost:5173](http://localhost:5173) im Browser aufrufen.

`index.html` per Doppelklick funktioniert in Chrome ebenfalls, das Scroll-Video kann dabei aber
ruckeln.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Struktur aller Abschnitte |
| `assets/css/style.css` | Design-Tokens, Layout, Responsive, Reduced-Motion |
| `assets/js/data.js` | Texte und Bildlisten (Charaktere, Orte, Ultimate Edition, News) |
| `assets/js/main.js` | Countdown, Scroll-Scrub, Modals, Galerie, 3D-Hülle |
| `assets/img/` | 131 offizielle Screenshots und Artworks |
| `assets/video/` | Scroll-Clip (Lucia) + 8 Charakter-Loops (web-optimiert) |
| `Bilder & Kurz videos/` | Original-Downloads, unangetastet |

## Abschnitte

1. **Home** – Skyline, Logo, Live-Countdown bis 19.11.2026. Beim Scrollen kommt
   zunächst kein neuer Inhalt: erst blendet der Textblock aus (das Logo geht dabei
   nur auf 68 % zurück), danach verschwindet das Logo ganz, zuletzt dunkelt der
   Hero ab.
2. **Trailer** – Extended Look (Netflix/Rockstar), Trailer 1 + 2 als YouTube-Overlay
3. **Scroll-Video** – der Clip von Lucia in Vice City. Er blendet schon hinter den
   letzten Trailer-Karten auf, läuft dann über die Scrollposition, und im letzten
   Drittel schiebt sich der Story-Abschnitt als Karte von unten darüber.
4. **Story** – Vice City, USA
5. **Charaktere** – Jason, Lucia und sechs Nebenfiguren, jeweils mit Akte und Galerie
6. **Leonida** – sechs Regionen mit Bildern
7. **Ultimate Edition** – Inhalte plus drehbare 3D-Hülle
8. **Medien** – filterbare Galerie mit Lightbox
9. **News & Leak-Lage** – Newswire, Leak-Chronik, X-Feed

## Inhalte pflegen

Alle Texte und Bildzuordnungen stehen in `assets/js/data.js`:

- `RELEASE` – Zieldatum des Countdowns
- `CHARS` – Charakterakten (`bio`, `meta`, `shots`)
- `PLACES` – Orte
- `ULTIMATE` – Inhalte der Ultimate Edition
- `XACCOUNTS` – verlinkte X-Accounts
- `GALLERY` / `GAL_CATS` – Galerie und Filter

Ein neues Bild kommt nach `assets/img/<ordner>/` und wird in der passenden Liste eingetragen —
sonst ist nichts zu tun.

## Schriften

Rockstar liefert auf `rockstargames.com/VI` fünf Schnitte einer hauseigenen Schrift aus:
`GTAArtDeco_Regular`, `_Medium`, `_Bold`, `_CondensedBold`, `_CondensedHeavy`. Die Schrift ist
weder käuflich noch für Dritte lizenziert, und ihr Server schickt keinen
`Access-Control-Allow-Origin`-Header — sie lässt sich also auch nicht per `@font-face` einbinden.

Ersatz nach direkter Messung gegen die echten Schnitte (gleicher Text, 100 px):

Die Grundfarbe der Seite ist `--bg: #090d1a` — ein sehr dunkles Blau statt Schwarz, passend
zu rockstargames.com/VI. Alle abgeleiteten Flächen (`--bg2`, `--surf`, `--surf2`, `--surf3`)
liegen im selben Blauton.

| Rockstar | gemessen | Ersatz | gemessen | Abweichung |
|---|---|---|---|---|
| ArtDeco Condensed Heavy | 965,7 px · Versalhöhe 70 | **Barlow Condensed 800** | 984,2 px · 71 | +1,9 % Breite |
| ArtDeco Bold | 1829,4 px · Versalhöhe 70 | **Figtree 700** | 1731,3 px · 67 | −5,4 % Breite |

Ausgeglichen über `letter-spacing:-.004em` auf `.h-display` und `font-size:17.6px` auf `body`
(hebt Figtrees 4 % kleinere Versalhöhe an). Alles über `--f-display`, `--f-body` und `--f-label`
in `style.css` austauschbar.

## Scroll-Video austauschen

`assets/video/scrub_lucia.mp4` entstand aus Rockstars offiziellem 1,5-Sekunden-Clip
`Lucia_Caminos_Video_Clip.mp4`. Für ein Scroll-Video sind 45 Bilder zu wenig, deshalb wurde
per Bewegungsinterpolation auf 225 Bilder / 7,5 s gestreckt:

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
| `.scrub { margin-top: -100svh }` | Video liegt schon hinter dem Trailer-Ende |
| `.story { margin-top: -100svh }` | Story-Karte fährt über das Video |

In `main.js` steuern drei Marken den Ablauf: `FADE_IN = 0.26` (bis dahin blendet das Video
auf), `PLAY_END = 0.70` (bis dahin ist der Clip durchgelaufen), `CARD_FROM = 0.66` (ab da
kommt die Story-Karte).

## Rechtliches

Inoffizielle Fan-Seite, nicht mit Rockstar Games oder Take-Two Interactive verbunden.
Alle Bilder, Videos, Logos und Marken gehören ihren jeweiligen Eigentümern; die Medien stammen
aus dem offiziellen Presse- und Downloadbereich unter
[rockstargames.com/VI/media](https://www.rockstargames.com/VI/media). Nur für den privaten
Gebrauch — nicht veröffentlichen.
