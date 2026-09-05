# Arbeitsanweisungen für dieses Projekt

## Nach jeder Änderung veröffentlichen

Die Seite läuft öffentlich auf **https://luciajason.de** (GitHub Pages,
Repository `VRTomsky/gta6-website`). Der Nutzer erwartet, dass dort **immer der
aktuelle Stand** liegt.

**Deshalb: Sobald eine Aufgabe fertig und geprüft ist, hochladen — ohne zu
fragen.** Der Nutzer hat das dauerhaft so gewünscht.

```bash
"Auf GitHub hochladen.bat" Kurze Beschreibung der Aenderung
```

Das Skript spiegelt diesen Ordner ins Repository, committet und pusht. Danach
kurz bestätigen, dass es oben ist, und die Seite nennen.

**Wann nicht hochladen:**

- mitten in einer mehrstufigen Änderung — erst wenn der Stand in sich stimmt
- wenn etwas nachweislich kaputt ist; dann erst reparieren
- bei reinen Fragen ohne Dateiänderung (das Skript merkt das selbst und tut nichts)

## Warum zwei Ordner

Gearbeitet wird hier in OneDrive, das Git-Repository liegt unter
`C:\Users\young\gta6-website` — bewusst **außerhalb** von OneDrive, weil
OneDrive sonst den `.git`-Ordner mitsynchronisiert, dabei Dateien sperrt und das
Repository beschädigen kann. `robocopy /MIR` im Skript hält beide deckungsgleich.

Das Skript holt **vor** dem Spiegeln den Stand von GitHub (`fetch` +
`merge --ff-only`). Ohne das würde eine dort angelegte Datei — etwa das `CNAME`
für die Domain — beim Spiegeln verloren gehen.

## Was nicht ins Repository gehört

Geregelt in `.gitignore` und den `robocopy`-Ausschlüssen:

| | Warum |
|---|---|
| `server.log` | enthält die WLAN-IP dieses Rechners |
| `_backup/` | lokale Sicherungen vor Umbauten |
| `__pycache__/` | Python-Bytecode |

## Zum Rest des Projekts

Alles Inhaltliche und Technische steht in `HANDOVER.md` — Aufbau der Seite,
Charakter-Detailseiten, Scroll-Mechanik, Mobil-Zweig, Fallstricke. Bei Arbeiten
an der Seite zuerst dort nachlesen.
