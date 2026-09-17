/* ═══════════════════════════════════════════════════════════
   Konto-Backend: Firebase oder lokaler Demo-Modus

   Beide liefern dieselbe Schnittstelle, der Rest des Kontosystems
   weiß nicht, womit er gerade spricht:

     beiAenderung(cb)          cb(nutzer | null) bei jedem An-/Abmelden
     registrieren(email, pw)   neues Konto, schickt die Bestätigungs-Mail
     anmelden(email, pw)
     mitGoogle()
     abmelden()
     passwortVergessen(email)  Link zum Zurücksetzen per Mail
     bestaetigungSenden()      Bestätigungs-Mail erneut schicken
     bestaetigungPruefen()     fragt nach, ob die Mail bestätigt wurde
     profilLaden(uid)          → profil | null
     nameFrei(name, uid)       → true, wenn frei oder schon der eigene
     profilSpeichern(uid, daten, vorher)
     newsletterStatus(uid)     → true / false
     newsletterSetzen(uid, an, lang)
     kontoLoeschen(uid, profil, passwort)

   nutzer = { uid, email, emailVerified, provider: "password"|"google", name }
   profil = { username, bio, avatar, favChar, lang, createdAt: Date|null }

   Fehler kommen als KontoFehler mit einem kurzen `code` — Firebase-Codes
   ohne das Präfix „auth/", dazu eigene wie „name-vergeben".
   ═══════════════════════════════════════════════════════════ */

const FIREBASE = "https://www.gstatic.com/firebasejs/12.19.0/";

export class KontoFehler extends Error {
  constructor(code, nachricht) {
    super(nachricht || code);
    this.code = code;
  }
}

/* Gibt es eine Firebase-Konfiguration, wird sie benutzt. Ohne läuft auf
   dem eigenen Rechner (und im Heimnetz, fürs Handy) der Demo-Modus; auf
   der öffentlichen Seite gibt es dann gar kein Kontosystem. */
export async function backendWaehlen() {
  const cfg = window.KONTO_CONFIG || {};
  if (cfg.firebase && cfg.firebase.apiKey) return firebaseBackend(cfg.firebase);

  const h = location.hostname;
  const lokal = h === "localhost" || h === "127.0.0.1" || h === "[::1]" ||
                /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
  return lokal ? demoBackend() : null;
}

/* ═══ Firebase ════════════════════════════════════════════ */
async function firebaseBackend(config) {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(FIREBASE + "firebase-app.js"),
    import(FIREBASE + "firebase-auth.js"),
    import(FIREBASE + "firebase-firestore.js")
  ]);

  const app = initializeApp(config);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  /* Bestätigungs- und Passwort-Mails kommen in der Sprache der Seite */
  auth.languageCode = window.LANG || "de";

  /* Nach dem Klick in der Mail landet man wieder auf der Kontoseite */
  const zurueck = { url: new URL("konto.html", location.href).href };

  const nutzer = u => u && {
    uid: u.uid,
    email: u.email || "",
    emailVerified: !!u.emailVerified,
    provider: u.providerData.some(p => p.providerId === "google.com") ? "google" : "password",
    name: u.displayName || ""
  };

  const weiter = e => {
    const code = e && e.code ? String(e.code).replace(/^(auth|firestore)\//, "") : "unbekannt";
    throw new KontoFehler(code, e && e.message);
  };

  const google = () => {
    const p = new A.GoogleAuthProvider();
    p.setCustomParameters({ prompt: "select_account" });
    return p;
  };

  return {
    modus: "firebase",

    beiAenderung(cb) {
      return A.onAuthStateChanged(auth, u => cb(nutzer(u)));
    },

    async registrieren(email, pw) {
      try {
        const { user } = await A.createUserWithEmailAndPassword(auth, email, pw);
        A.sendEmailVerification(user, zurueck).catch(() => {});
        return nutzer(user);
      } catch (e) { weiter(e); }
    },

    async anmelden(email, pw) {
      try {
        return nutzer((await A.signInWithEmailAndPassword(auth, email, pw)).user);
      } catch (e) { weiter(e); }
    },

    /* Popup zuerst. Blockiert der Browser es, bleibt die Weiterleitung —
       die Seite lädt dann nach der Google-Anmeldung neu. */
    async mitGoogle() {
      try {
        return nutzer((await A.signInWithPopup(auth, google())).user);
      } catch (e) {
        if (e.code === "auth/popup-blocked" ||
            e.code === "auth/operation-not-supported-in-this-environment") {
          await A.signInWithRedirect(auth, google());
          return null;
        }
        weiter(e);
      }
    },

    abmelden() {
      return A.signOut(auth);
    },

    async passwortVergessen(email) {
      try { await A.sendPasswordResetEmail(auth, email, zurueck); }
      catch (e) {
        /* Ob es die Adresse gibt, verraten wir nicht */
        if (e.code === "auth/user-not-found") return;
        weiter(e);
      }
    },

    async bestaetigungSenden() {
      try { await A.sendEmailVerification(auth.currentUser, zurueck); }
      catch (e) { weiter(e); }
    },

    /* Neu laden und das Token erneuern — erst mit frischem Token sehen
       die Sicherheitsregeln `email_verified == true`. */
    async bestaetigungPruefen() {
      const u = auth.currentUser;
      if (!u) return null;
      try {
        await A.reload(u);
        await u.getIdToken(true);
        return nutzer(auth.currentUser);
      } catch (e) { weiter(e); }
    },

    async profilLaden(uid) {
      try {
        const s = await F.getDoc(F.doc(db, "users", uid));
        if (!s.exists()) return null;
        const d = s.data();
        return {
          username: d.username,
          bio: d.bio || "",
          avatar: d.avatar || "",
          favChar: d.favChar || "",
          lang: d.lang || "de",
          createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null
        };
      } catch (e) { weiter(e); }
    },

    async nameFrei(name, uid) {
      try {
        const s = await F.getDoc(F.doc(db, "usernames", name.toLowerCase()));
        return !s.exists() || s.data().uid === uid;
      } catch (e) { weiter(e); }
    },

    /* Profil und Namensreservierung gehen in einem Rutsch — entweder
       beides oder nichts. `usernames/<name>` sorgt dafür, dass jeder Name
       nur einmal existiert; die Regeln lassen keinen zweiten Eintrag zu. */
    async profilSpeichern(uid, daten, vorher) {
      const lower = daten.username.toLowerCase();
      const neuerName = !vorher || vorher.username.toLowerCase() !== lower;
      const batch = F.writeBatch(db);
      const felder = {
        username: daten.username,
        usernameLower: lower,
        bio: daten.bio,
        avatar: daten.avatar,
        favChar: daten.favChar,
        lang: daten.lang,
        updatedAt: F.serverTimestamp()
      };

      if (neuerName) {
        if (!(await this.nameFrei(daten.username, uid))) throw new KontoFehler("name-vergeben");
        batch.set(F.doc(db, "usernames", lower), { uid });
        if (vorher) batch.delete(F.doc(db, "usernames", vorher.username.toLowerCase()));
      }
      if (vorher) batch.update(F.doc(db, "users", uid), felder);
      else batch.set(F.doc(db, "users", uid), { ...felder, createdAt: F.serverTimestamp() });

      try { await batch.commit(); }
      catch (e) {
        /* Zwischen Prüfen und Speichern hat jemand den Namen genommen */
        if (neuerName && e.code === "permission-denied") throw new KontoFehler("name-vergeben");
        weiter(e);
      }
    },

    async newsletterStatus(uid) {
      try { return (await F.getDoc(F.doc(db, "newsletter", uid))).exists(); }
      catch (e) { return false; }
    },

    async newsletterSetzen(uid, an, lang) {
      const ref = F.doc(db, "newsletter", uid);
      try {
        if (an) {
          await F.setDoc(ref, { email: auth.currentUser.email, lang, consentAt: F.serverTimestamp() });
        } else {
          await F.deleteDoc(ref);
        }
      } catch (e) { weiter(e); }
    },

    /* Firebase verlangt vor dem Löschen eine frische Anmeldung. Die holen
       wir zuerst — sonst wären die Daten schon weg, das Konto aber noch da. */
    async kontoLoeschen(uid, profil, passwort) {
      const u = auth.currentUser;
      try {
        if (nutzer(u).provider === "google") {
          await A.reauthenticateWithPopup(u, google());
        } else {
          await A.reauthenticateWithCredential(u, A.EmailAuthProvider.credential(u.email, passwort || ""));
        }
        const batch = F.writeBatch(db);
        batch.delete(F.doc(db, "newsletter", uid));
        if (profil) {
          batch.delete(F.doc(db, "usernames", profil.username.toLowerCase()));
          batch.delete(F.doc(db, "users", uid));
        }
        await batch.commit();
        await A.deleteUser(u);
      } catch (e) { weiter(e); }
    }
  };
}

/* ═══ Demo-Modus ══════════════════════════════════════════ */
/* Nur auf dem eigenen Rechner. Speichert alles im Browser, verschickt
   keine Mails und prüft nichts gegen einen Server — zum Ausprobieren der
   Oberfläche, bevor Firebase eingerichtet ist. */
function demoBackend() {
  const SCHLUESSEL = "konto-demo";
  const leer = () => ({ konten: {}, profile: {}, namen: {}, newsletter: {}, aktiv: null });
  const lese = () => {
    try { return JSON.parse(localStorage.getItem(SCHLUESSEL)) || leer(); }
    catch (e) { return leer(); }
  };
  const schreibe = s => {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(s)); }
    catch (e) { throw new KontoFehler("zu-gross"); }
  };
  const warte = (ms = 380) => new Promise(r => setTimeout(r, ms));

  /* Auch im Demo-Modus kein Passwort im Klartext. crypto.subtle gibt es
     nur in sicheren Umgebungen (localhost ja, WLAN-IP nein). */
  const hash = async pw => {
    const text = "luciajason-demo:" + pw;
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, "0")).join("");
    }
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) >>> 0;
    return "djb2-" + h.toString(16);
  };

  const hoerer = new Set();
  const aktuell = () => {
    const s = lese();
    const k = s.aktiv && s.konten[s.aktiv];
    return k ? { uid: k.uid, email: k.email, emailVerified: k.verifiziert, provider: k.provider, name: k.name || "" } : null;
  };
  const melden = () => { const u = aktuell(); hoerer.forEach(cb => cb(u)); };
  /* Anmelden in einem Tab wirkt auch in den anderen */
  addEventListener("storage", e => { if (e.key === SCHLUESSEL) melden(); });

  const neueUid = () => "demo-" + Math.random().toString(36).slice(2, 12);

  return {
    modus: "demo",

    beiAenderung(cb) {
      hoerer.add(cb);
      setTimeout(() => cb(aktuell()), 60);
      return () => hoerer.delete(cb);
    },

    async registrieren(email, pw) {
      await warte();
      email = String(email).trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new KontoFehler("invalid-email");
      if (String(pw).length < 6) throw new KontoFehler("weak-password");
      const s = lese();
      if (Object.values(s.konten).some(k => k.email === email)) throw new KontoFehler("email-already-in-use");
      const uid = neueUid();
      s.konten[uid] = { uid, email, pw: await hash(pw), verifiziert: false, provider: "password" };
      s.aktiv = uid;
      schreibe(s); melden();
      return aktuell();
    },

    async anmelden(email, pw) {
      await warte();
      email = String(email).trim().toLowerCase();
      const s = lese();
      const h = await hash(pw);
      const k = Object.values(s.konten).find(x => x.email === email && x.pw === h);
      if (!k) throw new KontoFehler("invalid-credential");
      s.aktiv = k.uid;
      schreibe(s); melden();
      return aktuell();
    },

    async mitGoogle() {
      await warte(600);
      const s = lese();
      const email = "demo.google@gmail.com";
      let k = Object.values(s.konten).find(x => x.email === email);
      if (!k) {
        const uid = neueUid();
        k = s.konten[uid] = { uid, email, pw: null, verifiziert: true, provider: "google", name: "Demo Google" };
      }
      s.aktiv = k.uid;
      schreibe(s); melden();
      return aktuell();
    },

    async abmelden() {
      const s = lese();
      s.aktiv = null;
      schreibe(s); melden();
    },

    async passwortVergessen() { await warte(); },
    async bestaetigungSenden() { await warte(); },

    /* Es gibt keine echte Mail — im Demo-Modus gilt die Adresse als
       bestätigt, sobald man nachfragt. */
    async bestaetigungPruefen() {
      await warte();
      const s = lese();
      const k = s.konten[s.aktiv];
      if (k) { k.verifiziert = true; schreibe(s); }
      melden();
      return aktuell();
    },

    async profilLaden(uid) {
      await warte(140);
      const p = lese().profile[uid];
      return p ? { ...p, createdAt: p.createdAt ? new Date(p.createdAt) : null } : null;
    },

    async nameFrei(name, uid) {
      const n = lese().namen[String(name).toLowerCase()];
      return !n || n === uid;
    },

    async profilSpeichern(uid, daten, vorher) {
      await warte();
      const s = lese();
      const lower = daten.username.toLowerCase();
      if (s.namen[lower] && s.namen[lower] !== uid) throw new KontoFehler("name-vergeben");
      if (vorher) delete s.namen[vorher.username.toLowerCase()];
      s.namen[lower] = uid;
      s.profile[uid] = {
        ...daten,
        createdAt: vorher && vorher.createdAt ? new Date(vorher.createdAt).toISOString() : new Date().toISOString()
      };
      schreibe(s);
    },

    async newsletterStatus(uid) {
      return !!lese().newsletter[uid];
    },

    async newsletterSetzen(uid, an, lang) {
      await warte();
      const s = lese();
      const k = s.konten[uid];
      if (an) {
        if (!k || !k.verifiziert) throw new KontoFehler("permission-denied");
        s.newsletter[uid] = { email: k.email, lang, consentAt: new Date().toISOString() };
      } else {
        delete s.newsletter[uid];
      }
      schreibe(s);
    },

    async kontoLoeschen(uid, profil, passwort) {
      await warte();
      const s = lese();
      const k = s.konten[uid];
      if (!k) return;
      if (k.provider === "password" && k.pw !== await hash(passwort || "")) {
        throw new KontoFehler("invalid-credential");
      }
      if (profil) delete s.namen[profil.username.toLowerCase()];
      delete s.profile[uid];
      delete s.newsletter[uid];
      delete s.konten[uid];
      s.aktiv = null;
      schreibe(s); melden();
    }
  };
}
