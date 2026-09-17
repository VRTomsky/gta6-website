# Kontosystem einrichten (Firebase)

Das Kontosystem ist fertig gebaut, braucht aber ein **eigenes Firebase-Projekt**.
Firebase gehört zu Google, ist für diese Größenordnung **kostenlos** (Spark-Tarif,
keine Kreditkarte) und übernimmt Anmeldung, Passwörter, Bestätigungs-Mails und die
Datenbank. Einmalig rund 15 Minuten.

Solange das nicht eingerichtet ist:

- **luciajason.de** zeigt keinen Anmelde-Knopf — nichts wirkt kaputt
- **localhost** (eigener Rechner) läuft ein **Demo-Modus**: alles funktioniert,
  gespeichert wird aber nur im Browser, und es gehen keine Mails raus

## 1 · Projekt anlegen

1. <https://console.firebase.google.com> öffnen, mit dem Google-Konto anmelden
2. **„Projekt erstellen"** → Name z. B. `luciajason-de`
3. Google Analytics: **ausschalten** (wird nicht gebraucht) → **Projekt erstellen**

## 2 · Web-App registrieren

1. In der Projektübersicht auf das Symbol **`</>`** (Web) klicken
2. App-Spitzname: `luciajason.de` — „Firebase Hosting" **nicht** ankreuzen
3. **App registrieren** → es erscheint ein Block `const firebaseConfig = { … }`
4. Diesen Block kopieren und **Claude schicken** — oder selbst in
   `assets/js/konto-config.js` bei `firebase:` einsetzen

Die Werte darin sind **kein Geheimnis**, sie stehen später ohnehin im Seitencode.
Geschützt werden die Daten durch die Sicherheitsregeln (Schritt 5).

## 3 · Anmeldung freischalten

**Build → Authentication → Jetzt starten**, dann Reiter **Anmeldemethode**:

1. **E-Mail/Passwort** → nur den **oberen** Schalter aktivieren → Speichern
2. **Neuer Anbieter → Google** → aktivieren → Support-E-Mail auswählen → Speichern

Reiter **Einstellungen → Autorisierte Domains → Domain hinzufügen**:

- `luciajason.de`
- `www.luciajason.de`

(`localhost` steht dort schon.)

## 4 · Datenbank anlegen

**Build → Firestore Database → Datenbank erstellen**

1. Standort: **`europe-west3 (Frankfurt)`** — lässt sich später nicht mehr ändern
2. **Produktionsmodus** wählen → Erstellen

## 5 · Sicherheitsregeln einsetzen

**Firestore Database → Regeln** → den vorhandenen Text komplett durch den Inhalt
der Datei **`firestore.rules`** ersetzen → **Veröffentlichen**.

Die Regeln sorgen dafür, dass

- jeder nur sein **eigenes** Profil lesen und ändern kann
- jeder Benutzername **nur einmal** existiert
- sich nur **bestätigte** Adressen für den Newsletter eintragen — und nur die eigene
- Profilbilder klein bleiben und Texte nicht ausufern

## 6 · Name im Google-Fenster

Beim „Mit Google anmelden" zeigt Google den Projektnamen an. Damit dort
**luciajason.de** steht statt `project-123456`:

**Zahnrad → Projekteinstellungen → Allgemein → Öffentlicher Name** → `luciajason.de`

## 7 · Datenschutz vervollständigen

Mit Konten und Newsletter verarbeitet die Seite personenbezogene Daten — die
Datenschutzerklärung (`datenschutz.html`) braucht deshalb **Name, Anschrift und
E-Mail** des Verantwortlichen. Einzutragen in `assets/js/konto-config.js` unter
`betreiber`. Danach in `datenschutz.html` die Zeile
`<meta name="robots" content="noindex">` entfernen.

Die Erklärung ist sorgfältig formuliert, aber **keine Rechtsberatung**.

## Danach

- **Nutzer ansehen:** Authentication → Nutzer
- **Profile ansehen:** Firestore Database → `users`
- **Newsletter-Liste:** Firestore Database → `newsletter` (E-Mail, Sprache,
  Zeitpunkt der Einwilligung)

### Newsletter verschicken

Firebase **sammelt** die Anmeldungen, **verschickt** aber keine Newsletter. Dafür
braucht es noch einen Versanddienst, z. B. Brevo (kostenlos bis 300 Mails am Tag).
Das ist ein eigener nächster Schritt — und der Dienst muss dann in der
Datenschutzerklärung ergänzt werden.

## Aufbau im Code

| Datei | Rolle |
|---|---|
| `assets/js/konto-config.js` | Firebase-Werte und Verantwortlicher |
| `assets/js/konto/backend.js` | Firebase **oder** Demo-Modus, gleiche Schnittstelle |
| `assets/js/konto/konto.js` | Zustand, Anmelde-Knopf in der Nav, Anmelde-Dialog |
| `assets/js/konto/profil.js` | die Kontoseite `konto.html` |
| `assets/css/konto.css` | Nav-Knopf, Dialog, Kontoseite, Datenschutzseite |
| `assets/img/avatars/` | 9 Profilbild-Vorlagen (VI-Logo + 8 Figuren), 256 px |
| `firestore.rules` | Sicherheitsregeln — gehören in die Firebase-Konsole |
| `datenschutz.html` | Datenschutzerklärung (DE/EN) |

Datenmodell in Firestore:

```
users/{uid}          username, usernameLower, bio, avatar, favChar, lang, createdAt, updatedAt
usernames/{name}     uid                       ← klein geschrieben, sorgt für Eindeutigkeit
newsletter/{uid}     email, lang, consentAt
```

`avatar` ist entweder `preset:<id>` (Vorlage) oder ein auf 256 px verkleinertes
JPEG als `data:`-URL (höchstens 150.000 Zeichen). Ein eigener Speicher-Dienst
(Firebase Storage) wird so nicht gebraucht — der wäre nicht mehr kostenlos.
