/* ═══════════════════════════════════════════════════════════
   Einstellungen für das Kontosystem

   Die Konten laufen über Firebase (Google): Anmeldung per E-Mail und
   Passwort oder mit dem Google-Konto, die Profile liegen in der
   Firestore-Datenbank. Eingerichtet wird das einmal von Hand, die
   Schritte stehen in KONTO-EINRICHTEN.md.

   Solange `firebase` auf null steht:
     · auf luciajason.de ist vom Kontosystem nichts zu sehen
     · auf dem eigenen Rechner (localhost) läuft ein Demo-Modus, der
       alles im Browser speichert — zum Ausprobieren ohne Firebase

   Die Werte unten sind KEIN Geheimnis. Firebase ist dafür gebaut, dass
   sie öffentlich im Code stehen; geschützt werden die Daten durch die
   Sicherheitsregeln in firestore.rules.
   ═══════════════════════════════════════════════════════════ */
window.KONTO_CONFIG = {

  /* Aus der Firebase-Konsole: Projekteinstellungen → Allgemein →
     „Meine Apps" → Web-App → SDK-Einrichtung → „Konfiguration".
     Beispiel:
       firebase: {
         apiKey: "AIza…",
         authDomain: "luciajason-de.firebaseapp.com",
         projectId: "luciajason-de",
         storageBucket: "luciajason-de.firebasestorage.app",
         messagingSenderId: "…",
         appId: "1:…:web:…"
       }, */
  firebase: null,

  /* Verantwortlicher für die Datenschutzerklärung (datenschutz.html).
     Pflicht, bevor die Konten öffentlich starten. */
  betreiber: {
    name: "",
    anschrift: "",
    email: ""
  }
};
