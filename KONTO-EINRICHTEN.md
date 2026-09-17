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
| 7 · Verantwortlicher für den Datenschutz | — bewusst weggelassen (Entscheidung des Nutzers, privat für Freunde) |
| `live: true` in `konto-config.js` | ✅ seit 17.09.2026 |

Mit `live: false` verschwindet der Anmelde-Knopf wieder von luciajason.de; **localhost**
spricht in beiden Fällen mit dem echten Firebase-Projekt — außer mit **`?demo`** in der
Adresse (`http://localhost:5174/konto.html?demo`): dann läuft der Demo-Modus, gespeichert
nur im Browser, ohne echte Konten.

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

## 7 · Datenschutz

`datenschutz.html` beschreibt, was die Seite speichert. Name und Anschrift eines
Verantwortlichen stehen dort **auf Wunsch des Nutzers nicht** — die Seite ist privat und
nur für Freunde gedacht. Rechtlich verlangt die DSGVO diese Angabe bei einer öffentlich
erreichbaren Seite mit Konten eigentlich trotzdem; soll die Seite breiter bekannt werden,
Abschnitt 1 der Datenschutzerklärung um Name, Anschrift und E-Mail ergänzen.
Keine Rechtsberatung.

## Regeln aktualisieren

Ändert sich `firestore.rules` (zuletzt am 17.09.2026 für Titelbild und eigene Bilder),
müssen die Regeln **neu veröffentlicht** werden — sonst lehnt die Datenbank das Speichern
des Profils ab:

1. **<https://console.firebase.google.com/project/luciajason-27a74/firestore>** → Reiter **„Regeln"**
2. `firestore.rules` im Editor öffnen → **Strg + A**, **Strg + C**
3. In Firebase ins Textfeld → **Strg + A**, **Strg + V** → **„Veröffentlichen"**

## Absender der Mails

Bestätigungs- und Passwort-Mails kommen von Firebase. Anpassbar sind **Absendername** und
**Absenderadresse**; ein **Profilbild neben dem Absender** geht nicht (Gmail verlangt dafür
BIMI mit einem kostenpflichtigen Markenzertifikat — für ein fremdes Logo wie das GTA-VI-Logo
gäbe es das ohnehin nicht).

**Absendername** (sofort wirksam):

1. **<https://console.firebase.google.com/project/luciajason-27a74/authentication/emails>**
   (Authentication → Reiter **„Vorlagen"**)
2. **„E-Mail-Adressbestätigung"** → Stift-Symbol
3. **„Absendername"**: `luciajason.de` → **„Speichern"**

**Absenderadresse `noreply@luciajason.de`** statt `…@luciajason-27a74.firebaseapp.com`:

1. Im selben Fenster **„Domain anpassen"** → `luciajason.de` → Weiter
2. Firebase zeigt mehrere DNS-Einträge (TXT und CNAME) — Fenster offen lassen
3. Bei **INWX** anmelden → **Domains** → `luciajason.de` → **DNS** (Nameserver-Einträge)
4. Jeden Eintrag aus Firebase mit **„Eintrag hinzufügen"** anlegen: Typ, Name und Wert genau
   übernehmen. Die vier **A-Einträge für GitHub nicht anfassen**
5. Zurück in Firebase **„Bestätigen"** — das kann bis zu 48 Stunden dauern

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
| `assets/js/konto-config.js` | Firebase-Werte und Schalter `live` |
| `assets/js/konto/backend.js` | Firebase **oder** Demo-Modus, gleiche Schnittstelle |
| `assets/js/konto/konto.js` | Zustand, Anmelde-Knopf in der Nav, Anmelde-Dialog |
| `assets/js/konto/profil.js` | die Kontoseite `konto.html` |
| `assets/js/konto/zuschnitt.js` | Bild zuschneiden (Profilbild 1 : 1, Titelbild 3 : 1) |
| `assets/css/konto.css` | Nav-Knopf, Dialog, Kontoseite, Datenschutzseite |
| `assets/img/avatars/` | 9 Profilbild-Vorlagen (VI-Logo + 8 Figuren), 256 px |
| `assets/img/covers/` | 9 Titelbild-Vorlagen, 1500 × 500 px |
| `firestore.rules` | Sicherheitsregeln — gehören in die Firebase-Konsole |
| `datenschutz.html` | Datenschutzerklärung (DE/EN) |

Datenmodell in Firestore:

```
users/{uid}                username, usernameLower, bio, favChar, lang, createdAt, updatedAt,
                           avatar, avatarEigen, cover
users/{uid}/bilder/titel   daten                ← eigenes Titelbild
usernames/{name}           uid                  ← klein geschrieben, sorgt für Eindeutigkeit
newsletter/{uid}           email, lang, consentAt
```

`avatar` und `cover` sind `preset:<id>` (Vorlage) oder `eigen`. Eigene Bilder schneidet der
Browser zu und speichert sie als JPEG-`data:`-URL: Profilbild 256 × 256 px in `avatarEigen`
(≤ 150.000 Zeichen), Titelbild 1500 × 500 px in `bilder/titel` (≤ 300.000 Zeichen). Sie
bleiben gespeichert, auch wenn gerade eine Vorlage gewählt ist. Ein eigener Speicher-Dienst
(Firebase Storage) wird so nicht gebraucht — der wäre nicht mehr kostenlos.
