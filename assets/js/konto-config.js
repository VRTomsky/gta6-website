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

   Mit `firebase` gesetzt:
     · localhost spricht mit dem echten Firebase-Projekt
     · luciajason.de erst, wenn zusätzlich `live: true` steht — und nur
       über https://, Passwörter gehen nie unverschlüsselt raus

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
  /* Google Analytics (measurementId) wird bewusst nicht geladen —
     die Seite trackt niemanden. */
  firebase: {
    apiKey: "AIzaSyCshK9lkWbvptsyWjKoOXkYflIwwV8apV0",
    authDomain: "luciajason-27a74.firebaseapp.com",
    projectId: "luciajason-27a74",
    storageBucket: "luciajason-27a74.firebasestorage.app",
    messagingSenderId: "1066000420072",
    appId: "1:1066000420072:web:110afd1d9d5c2479fe8d5d"
  },

  /* Konten auf luciajason.de zeigen. Auf false gesetzt verschwindet der
     Anmelde-Knopf wieder von der öffentlichen Seite (localhost bleibt an). */
  live: true
};
