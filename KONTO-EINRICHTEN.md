# Kontosystem einrichten (Firebase)

Das Kontosystem ist fertig gebaut, braucht aber ein **eigenes Firebase-Projekt**.
Firebase gehört zu Google, ist für diese Größenordnung **kostenlos** (Spark-Tarif,
keine Kreditkarte) und übernimmt Anmeldung, Passwörter, Bestätigungs-Mails und die
Datenbank. Einmalig rund 15 Minuten.

Solange das nicht eingerichtet ist:

- **luciajason.de** zeigt keinen Anmelde-Knopf — nichts wirkt kaputt
- **localhost** (eigener Rechner) läuft ein **Demo-Modus**: alles funktioniert,
  gespeichert wird aber nur im Browser, und es gehen keine Mails raus

## Stand

| Schritt | |
|---|---|
| HTTPS-Zertifikat für luciajason.de | ✅ seit 17.09.2026 gültig |
| „Enforce HTTPS" bei GitHub | ✅ |
| 1 · Projekt `luciajason-27a74` | ✅ |
| 2 · Web-App, Werte in `konto-config.js` | ✅ |
| 3 · Anmeldung freischalten | ✅ E-Mail/Passwort, Google, Domains |
| 4 · Datenbank anlegen | ✅ |
| 5 · Sicherheitsregeln | ✅ geprüft: `usernames` lesbar, `users`/`newsletter` gesperrt |
| 6 · Öffentlicher Name | ✅ |
| 7 · Verantwortlicher für den Datenschutz | ⬜ |
| `live: true` in `konto-config.js` | ⬜ erst wenn 3–7 stehen |

Solange `live: false` steht, sieht auf luciajason.de niemand etwas vom Kontosystem. Auf
**localhost** spricht die Seite schon mit dem echten Firebase-Projekt.

## 0 · HTTPS erzwingen

GitHub gibt es nur auf Englisch.

1. **<https://github.com/VRTomsky/gta6-website/settings/pages>** öffnen
   (ggf. vorher bei GitHub anmelden)
2. Etwas nach unten scrollen bis **„Custom domain"** — dort steht `luciajason.de`
3. Darunter den Haken bei **„Enforce HTTPS"** setzen. Er speichert sofort

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

Wurde beim Anlegen Google Analytics mit eingeschaltet (`measurementId` im Block), ist das
egal: die Seite lädt Analytics nicht und trackt niemanden.

## 3 · Anmeldung freischalten

„Authentication" ist bei Firebase der Bereich für die Anmeldung. Er heißt auch in der
deutschen Oberfläche so. Am einfachsten über den direkten Link:

**<https://console.firebase.google.com/project/luciajason-27a74/authentication>**

(Ohne Link: links in der grauen Seitenleiste unter **Build** bzw. **Security** auf
**Authentication**. Ist die Leiste eingeklappt, oben links auf die drei Striche ☰.)

1. Großer Knopf **„Jetzt starten"** anklicken (nur beim ersten Mal da)
2. Oben erscheinen Reiter — **„Anmeldemethode"** anklicken

**E-Mail und Passwort:**

3. In der Liste **„E-Mail/Passwort"** anklicken
4. Den **oberen** Schalter **„Aktivieren"** einschalten.
   Den unteren („E-Mail-Link / Anmeldung ohne Passwort") **aus** lassen
5. **„Speichern"**

**Google:**

6. **„Neuen Anbieter hinzufügen"** anklicken → **„Google"**
7. Schalter **„Aktivieren"** einschalten
8. **„Öffentlicher Name des Projekts"**: `luciajason.de` eintragen
   (das steht später im Google-Anmeldefenster)
9. **„Support-E-Mail-Adresse des Projekts"**: aufklappen, die eigene Adresse wählen
10. **„Speichern"**

**Freigegebene Adressen:**

11. Oben den Reiter **„Einstellungen"** anklicken
12. Links **„Autorisierte Domains"** → **„Domain hinzufügen"** → `luciajason.de` → Hinzufügen
13. Noch einmal **„Domain hinzufügen"** → `www.luciajason.de` → Hinzufügen

`localhost` und `luciajason-27a74.firebaseapp.com` stehen dort schon — so lassen.

## 4 · Datenbank anlegen

**<https://console.firebase.google.com/project/luciajason-27a74/firestore>**

(Ohne Link: Seitenleiste → **Build** bzw. **Databases & Storage** → **Firestore Database**.)

1. **„Datenbank erstellen"** anklicken
2. Fragt Firebase nach der Edition: **Standard** lassen → **„Weiter"**
3. **Standort**: aufklappen und **`europe-west3 (Frankfurt)`** wählen → **„Weiter"**.
   Lässt sich später nicht mehr ändern
4. **„Im Produktionsmodus starten"** auswählen → **„Erstellen"**
5. Kurz warten, bis die leere Datenbank erscheint

## 5 · Sicherheitsregeln einsetzen

Auf derselben Firestore-Seite oben den Reiter **„Regeln"** anklicken. Dort steht schon
ein kurzer Text.

1. Im Projektordner die Datei **`firestore.rules`** öffnen: Rechtsklick →
   **„Öffnen mit"** → **„Editor"**
2. Im Editor **Strg + A** (alles markieren), dann **Strg + C** (kopieren)
3. Zurück in Firebase: in das Textfeld klicken, **Strg + A**, dann **Strg + V** (einfügen) —
   der alte Text ist damit komplett ersetzt
4. **„Veröffentlichen"** anklicken

Meldet Firebase einen Fehler in rot, den Wortlaut an Claude schicken.

Die Regeln sorgen dafür, dass

- jeder nur sein **eigenes** Profil lesen und ändern kann
- jeder Benutzername **nur einmal** existiert
- sich nur **bestätigte** Adressen für den Newsletter eintragen — und nur die eigene
- Profilbilder klein bleiben und Texte nicht ausufern

## 6 · Name im Google-Fenster

Ist in Schritt 3 unter Punkt 8 schon erledigt. Falls dort nicht zu sehen:

**<https://console.firebase.google.com/project/luciajason-27a74/settings/general>** →
**„Öffentlicher Name"** → Stift-Symbol → `luciajason.de` → Speichern

## 7 · Datenschutz vervollständigen

Mit Konten und Newsletter verarbeitet die Seite personenbezogene Daten — die
Datenschutzerklärung (`datenschutz.html`) braucht deshalb **Name, Anschrift und
E-Mail** des Verantwortlichen. Einzutragen in `assets/js/konto-config.js` unter
`betreiber`. Danach in `datenschutz.html` die Zeile
`<meta name="robots" content="noindex">` entfernen.

Die Erklärung ist sorgfältig formuliert, aber **keine Rechtsberatung**.

## Danach

- **Nutzer ansehen:** Authentication → Reiter **Nutzer**
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
