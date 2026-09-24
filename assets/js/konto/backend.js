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
     titelbildLaden(uid)       → eigenes Titelbild als data:-URL oder ""
     nameFrei(name, uid)       → true, wenn frei oder schon der eigene
     profilSpeichern(uid, daten, vorher)
     newsletterStatus(uid)     → true / false
     newsletterSetzen(uid, an, lang)
     kontoLoeschen(uid, profil, passwort)

   nutzer = { uid, email, emailVerified, provider: "password"|"google", name }

   Dazu die Bestenliste des Browser-Spiels: bestwertLaden, bestwertSetzen,
   bestenliste — ein Dokument je Konto in der Sammlung "bestenliste".
   profil = { username, bio, favChar, lang, createdAt: Date|null,
              stand: Zahl (letzte Änderung, für den Bild-Zwischenspeicher),
              avatar: "preset:<id>"|"eigen", avatarEigen: data:-URL|"",
              cover:  "preset:<id>"|"eigen",
              plattform, edition, lieblingsort, vorfreude, gamertag }

   ── Mehrere Konten ──
   Jedes Konto auf diesem Gerät bekommt einen eigenen „Slot". Bei Firebase
   ist das eine eigene App-Instanz mit eigener, dauerhafter Anmeldung —
   so bleiben alle Konten gleichzeitig angemeldet und ein Wechsel braucht
   kein erneutes Passwort. Der erste Slot heißt "standard" und ist die
   gewöhnliche Firebase-App; bestehende Anmeldungen bleiben so erhalten.

   ── Bilder ──
   Eigene Bilder bleiben gespeichert, auch wenn gerade eine Vorlage gewählt
   ist. Das Profilbild (klein) steht im Profil selbst, weil die Nav es auf
   jeder Seite braucht. Das Titelbild kommt in voller Auflösung (bis 4K)
   und ist dafür zu groß für ein einzelnes Firestore-Dokument (1 MB). Es
   liegt deshalb in Teilen unter users/{uid}/bilder:
     titel      { teile, typ }
     titel-0…7  { daten }   ← je bis 700.000 Zeichen Base64
   Firebase Storage wäre einfacher, ist aber nicht mehr kostenlos.
   ═══════════════════════════════════════════════════════════ */

const FIREBASE = "https://www.gstatic.com/firebasejs/12.19.0/";
const TEIL_GROESSE = 700000;
const TEILE_MAX = 8;

export class KontoFehler extends Error {
  constructor(code, nachricht) {
    super(nachricht || code);
    this.code = code;
  }
}

/* Welches Backend?

     ?demo auf localhost    Demo-Modus, auch wenn Firebase eingetragen ist
     Firebase eingetragen   localhost → Firebase
                            öffentliche Seite → Firebase nur mit `live: true`
                            und nur über https://
     nichts eingetragen     localhost und Heimnetz (fürs Handy) → Demo-Modus
                            öffentliche Seite → kein Kontosystem

   Über unverschlüsseltes HTTP gibt es nie ein echtes Konto: das Passwort
   ginge sonst im Klartext durchs Netz. localhost zählt als sicher. */
export function istDemo() {
  const cfg = window.KONTO_CONFIG || {};
  const h = location.hostname;
  const lokal = h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  const heimnetz = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
  if (lokal && new URLSearchParams(location.search).has("demo")) return true;
  return !(cfg.firebase && cfg.firebase.apiKey) && (lokal || heimnetz);
}

export async function backendWaehlen(slot = "standard") {
  const cfg = window.KONTO_CONFIG || {};
  const h = location.hostname;
  const lokal = h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  const sicher = location.protocol === "https:" || lokal;

  if (istDemo()) return demoBackend(slot);
  if (cfg.firebase && cfg.firebase.apiKey) {
    if (!sicher) return null;
    return lokal || cfg.live ? firebaseBackend(cfg.firebase, slot) : null;
  }
  return null;
}

/* Profil aus der Datenbank in die heutige Form bringen. Ältere Profile
   hatten das eigene Bild direkt in `avatar` und noch kein Titelbild. */
const DATEN_URL = /^data:image\/(jpeg|webp);base64,/;
const AUSWAHL = {
  plattform: ["ps5", "xbox"],
  edition: ["standard", "ultimate"],
  vorfreude: ["story", "vice-city", "ueberfaelle", "autos", "online", "musik", "jiggle"]
};
const eines = (wert, liste) => liste.includes(wert) ? wert : "";

export function profilAusDaten(d) {
  let avatar = String(d.avatar || "");
  let avatarEigen = String(d.avatarEigen || "");
  if (DATEN_URL.test(avatar)) { avatarEigen = avatar; avatar = "eigen"; }
  if (!/^(preset:[a-z]{2,12}|eigen)$/.test(avatar) || (avatar === "eigen" && !avatarEigen)) avatar = "preset:vi";
  let cover = String(d.cover || "");
  if (!/^(preset:[a-z-]{2,20}|eigen)$/.test(cover)) cover = "preset:vice-city";
  return {
    username: d.username,
    bio: d.bio || "",
    favChar: d.favChar || "",
    lang: d.lang || "de",
    createdAt: d.createdAt || null,
    stand: Number(d.stand) || 0,
    avatar, avatarEigen, cover,
    plattform: eines(d.plattform, AUSWAHL.plattform),
    edition: eines(d.edition, AUSWAHL.edition),
    vorfreude: eines(d.vorfreude, AUSWAHL.vorfreude),
    lieblingsort: /^[a-z-]{2,20}$/.test(d.lieblingsort || "") ? d.lieblingsort : "",
    gamertag: /^[A-Za-z0-9 _.-]{0,24}$/.test(d.gamertag || "") ? String(d.gamertag || "") : ""
  };
}

/* Titelbild in Teile schneiden: data:-URL → { typ, teile[] } */
function titelZerlegen(daten) {
  const m = /^data:(image\/(?:webp|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(daten);
  if (!m) throw new KontoFehler("bild-ungueltig");
  const teile = [];
  for (let i = 0; i < m[2].length; i += TEIL_GROESSE) teile.push(m[2].slice(i, i + TEIL_GROESSE));
  if (teile.length > TEILE_MAX) throw new KontoFehler("zu-gross");
  return { typ: m[1], teile };
}

/* ═══ Firebase ════════════════════════════════════════════ */
async function firebaseBackend(config, slot) {
  const [{ initializeApp, getApps }, A, F] = await Promise.all([
    import(FIREBASE + "firebase-app.js"),
    import(FIREBASE + "firebase-auth.js"),
    import(FIREBASE + "firebase-firestore.js")
  ]);

  const appName = slot === "standard" ? "[DEFAULT]" : slot;
  const app = getApps().find(a => a.name === appName) ||
              (slot === "standard" ? initializeApp(config) : initializeApp(config, slot));
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

  /* Firestore wartet bei fehlender Verbindung (oder einer noch nicht
     angelegten Datenbank) still und endlos. Nach der Frist gibt es eine
     Meldung statt eines Knopfs, der sich ewig dreht. */
  const frist = (versprechen, ms = 12000) => Promise.race([
    versprechen,
    new Promise((_, nein) => setTimeout(() => nein(new KontoFehler("unavailable")), ms))
  ]);

  const google = () => {
    const p = new A.GoogleAuthProvider();
    p.setCustomParameters({ prompt: "select_account" });
    return p;
  };

  /* Nach dem Klick auf den Bestätigungslink zeigt Firebase die Adresse
     sofort als bestätigt — das Token im Browser trägt aber noch bis zu
     einer Stunde „nicht bestätigt". Die Sicherheitsregeln lesen nur das
     Token, der Newsletter meldete deshalb „keine Berechtigung". Weichen
     beide voneinander ab, wird das Token gleich erneuert. */
  const tokenAbgleichen = async u => {
    if (!u || !u.emailVerified) return;
    try {
      const t = await u.getIdTokenResult();
      if (!t.claims.email_verified) await u.getIdToken(true);
    } catch (e) { /* offline — beim Schreiben wird noch einmal erneuert */ }
  };

  const bildRef = id => F.doc(db, "users", auth.currentUser ? auth.currentUser.uid : "-", "bilder", id);

  return {
    modus: "firebase",
    slot,

    beiAenderung(cb) {
      return A.onAuthStateChanged(auth, async u => {
        await tokenAbgleichen(u);
        cb(nutzer(u));
      });
    },

    aktuellerNutzer() {
      return nutzer(auth.currentUser);
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
        const s = await frist(F.getDoc(F.doc(db, "users", uid)));
        if (!s.exists()) return null;
        const d = s.data();
        return profilAusDaten({
          ...d,
          createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null,
          stand: d.updatedAt && d.updatedAt.toMillis ? d.updatedAt.toMillis() : 0
        });
      } catch (e) { weiter(e); }
    },

    async titelbildLaden(uid) {
      try {
        const meta = await frist(F.getDoc(F.doc(db, "users", uid, "bilder", "titel")));
        if (!meta.exists()) return "";
        const d = meta.data();
        /* Altes Format (vor dem 17.09.2026): alles in einem Dokument */
        if (typeof d.daten === "string") return d.daten;
        const n = Math.min(TEILE_MAX, d.teile | 0);
        if (!n || !/^image\/(webp|jpeg)$/.test(d.typ)) return "";
        const teile = await frist(Promise.all(
          Array.from({ length: n }, (_, i) => F.getDoc(F.doc(db, "users", uid, "bilder", "titel-" + i)))
        ), 30000);
        if (teile.some(t => !t.exists())) return "";
        return "data:" + d.typ + ";base64," + teile.map(t => t.data().daten).join("");
      } catch (e) {
        if (e.code === "unavailable") weiter(e);
        return "";
      }
    },

    async nameFrei(name, uid) {
      try {
        const s = await frist(F.getDoc(F.doc(db, "usernames", name.toLowerCase())));
        return !s.exists() || s.data().uid === uid;
      } catch (e) { weiter(e); }
    },

    /* Profil, Namensreservierung und Titelbild gehen in einem Rutsch —
       entweder alles oder nichts. `usernames/<name>` sorgt dafür, dass
       jeder Name nur einmal existiert; die Regeln lassen keinen zweiten
       Eintrag zu. */
    async profilSpeichern(uid, daten, vorher) {
      const lower = daten.username.toLowerCase();
      const neuerName = !vorher || vorher.username.toLowerCase() !== lower;
      const batch = F.writeBatch(db);
      const felder = {
        username: daten.username,
        usernameLower: lower,
        bio: daten.bio,
        avatar: daten.avatar,
        avatarEigen: daten.avatarEigen || "",
        cover: daten.cover,
        favChar: daten.favChar,
        plattform: daten.plattform || "",
        edition: daten.edition || "",
        lieblingsort: daten.lieblingsort || "",
        vorfreude: daten.vorfreude || "",
        gamertag: daten.gamertag || "",
        lang: daten.lang,
        updatedAt: F.serverTimestamp()
      };

      /* Das große Titelbild wird nur geschrieben, wenn es sich geändert
         hat: undefined = unverändert, "" = entfernen */
      if (typeof daten.coverEigen === "string") {
        const ref = id => F.doc(db, "users", uid, "bilder", id);
        if (daten.coverEigen) {
          const { typ, teile } = titelZerlegen(daten.coverEigen);
          batch.set(ref("titel"), { teile: teile.length, typ });
          teile.forEach((t, i) => batch.set(ref("titel-" + i), { daten: t }));
          for (let i = teile.length; i < TEILE_MAX; i++) batch.delete(ref("titel-" + i));
        } else {
          batch.delete(ref("titel"));
          for (let i = 0; i < TEILE_MAX; i++) batch.delete(ref("titel-" + i));
        }
      }

      if (neuerName) {
        if (!(await this.nameFrei(daten.username, uid))) throw new KontoFehler("name-vergeben");
        batch.set(F.doc(db, "usernames", lower), { uid });
        if (vorher) batch.delete(F.doc(db, "usernames", vorher.username.toLowerCase()));
      }
      if (vorher) batch.update(F.doc(db, "users", uid), felder);
      else batch.set(F.doc(db, "users", uid), { ...felder, createdAt: F.serverTimestamp() });

      try { await frist(batch.commit(), 60000); }
      catch (e) {
        /* Zwischen Prüfen und Speichern hat jemand den Namen genommen */
        if (neuerName && e.code === "permission-denied") throw new KontoFehler("name-vergeben");
        weiter(e);
      }
    },

    async newsletterStatus(uid) {
      try { return (await frist(F.getDoc(F.doc(db, "newsletter", uid)))).exists(); }
      catch (e) { return false; }
    },

    /* ── Bestenliste des Spiels ──
       Ein Dokument je Konto, öffentlich lesbar. Geschrieben wird nur der
       eigene Eintrag und nur, wenn der Wert größer ist als bisher. */
    async bestwertLaden(uid) {
      try {
        const s = await frist(F.getDoc(F.doc(db, "bestenliste", uid)));
        return s.exists() ? (s.data().punkte | 0) : 0;
      } catch (e) { return 0; }
    },

    async bestwertSetzen(uid, name, punkte) {
      try {
        await frist(F.setDoc(F.doc(db, "bestenliste", uid), {
          name: String(name || "").slice(0, 20),
          punkte: Math.max(0, Math.min(9999999, Math.round(punkte))),
          updatedAt: F.serverTimestamp()
        }), 15000);
      } catch (e) { /* Bestenliste ist Beiwerk — Fehler bleiben still */ }
    },

    /* ── Spielstand des Browser-Spiels ──
       Ein Dokument je Konto, nur für die Person selbst: Geld, Waffen,
       Munition, Weste, erledigte Aufträge. Vorher fing jede Runde bei
       null an, obwohl man angemeldet sein muss. */
    async spielstandLaden(uid) {
      try {
        const s = await frist(F.getDoc(F.doc(db, "spielstaende", uid)));
        return s.exists() ? s.data() : null;
      } catch (e) { return null; }
    },

    async spielstandSetzen(uid, d) {
      try {
        await frist(F.setDoc(F.doc(db, "spielstaende", uid), {
          geld: Math.max(0, Math.min(99999999, Math.round(d.geld || 0))),
          waffen: (d.waffen || []).slice(0, 10).map(String),
          munition: Object.fromEntries(Object.entries(d.munition || {}).slice(0, 10)
            .map(([k, v]) => [String(k), Math.max(0, Math.min(99999, Math.round(v) || 0))])),
          panzerung: Math.max(0, Math.min(100, Math.round(d.panzerung || 0))),
          erledigt: (d.erledigt || []).slice(0, 50).map(String),
          schiessBest: Math.max(0, Math.min(10, d.schiessBest | 0)),
          schiessRunden: Math.max(0, Math.min(99999, d.schiessRunden | 0)),
          updatedAt: F.serverTimestamp()
        }), 15000);
        return true;
      } catch (e) { return false; }
    },

    /* ── Einstellungen der Seite (nur Admin schreibt) ── */
    async einstellungLaden(name) {
      try {
        const s = await frist(F.getDoc(F.doc(db, "einstellungen", name)));
        return s.exists() ? s.data() : null;
      } catch (e) { return null; }
    },

    async einstellungSetzen(name, daten) {
      await frist(F.setDoc(F.doc(db, "einstellungen", name),
        { ...daten, updatedAt: F.serverTimestamp() }), 15000);
    },

    async bestenliste(anzahl = 10) {
      try {
        const q = F.query(F.collection(db, "bestenliste"),
                          F.orderBy("punkte", "desc"), F.limit(anzahl));
        const s = await frist(F.getDocs(q));
        return s.docs.map(d => ({ name: d.data().name || "?", punkte: d.data().punkte | 0 }));
      } catch (e) { return []; }
    },

    async newsletterSetzen(uid, an, lang) {
      const ref = F.doc(db, "newsletter", uid);
      try {
        if (an) {
          /* Frisches Token — nur darin sehen die Regeln die Bestätigung */
          await frist(auth.currentUser.getIdToken(true));
          await frist(F.setDoc(ref, { email: auth.currentUser.email, lang, consentAt: F.serverTimestamp() }), 15000);
        } else {
          await frist(F.deleteDoc(ref), 15000);
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
        batch.delete(bildRef("titel"));
        for (let i = 0; i < TEILE_MAX; i++) batch.delete(bildRef("titel-" + i));
        if (profil) {
          batch.delete(F.doc(db, "usernames", profil.username.toLowerCase()));
          batch.delete(F.doc(db, "users", uid));
        }
        await frist(batch.commit(), 15000);
        await A.deleteUser(u);
      } catch (e) { weiter(e); }
    }
  };
}

/* ═══ Demo-Modus ══════════════════════════════════════════ */
/* Nur auf dem eigenen Rechner. Speichert alles im Browser, verschickt
   keine Mails und prüft nichts gegen einen Server — zum Ausprobieren der
   Oberfläche ohne echte Konten. Jeder Slot hat seine eigene Anmeldung. */
function demoBackend(slot) {
  const SCHLUESSEL = "konto-demo";
  const leer = () => ({ konten: {}, profile: {}, namen: {}, newsletter: {}, angemeldet: {} });
  const lese = () => {
    let s;
    try { s = JSON.parse(localStorage.getItem(SCHLUESSEL)); } catch (e) { s = null; }
    s = s || leer();
    s.angemeldet = s.angemeldet || {};
    if (s.aktiv && !s.angemeldet.standard) { s.angemeldet.standard = s.aktiv; }   // älterer Stand
    delete s.aktiv;
    return s;
  };
  const schreibe = s => {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(s)); }
    catch (e) { throw new KontoFehler("zu-gross"); }
  };
  const titelSchluessel = uid => "konto-demo-titel-" + uid;
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
    const uid = s.angemeldet[slot];
    const k = uid && s.konten[uid];
    return k ? { uid: k.uid, email: k.email, emailVerified: k.verifiziert, provider: k.provider, name: k.name || "" } : null;
  };
  const anmeldenAls = (s, uid) => { s.angemeldet[slot] = uid; };
  const melden = () => { const u = aktuell(); hoerer.forEach(cb => cb(u)); };
  /* Anmelden in einem Tab wirkt auch in den anderen */
  addEventListener("storage", e => { if (e.key === SCHLUESSEL) melden(); });

  const neueUid = () => "demo-" + Math.random().toString(36).slice(2, 12);

  return {
    modus: "demo",
    slot,

    beiAenderung(cb) {
      hoerer.add(cb);
      setTimeout(() => cb(aktuell()), 60);
      return () => hoerer.delete(cb);
    },

    aktuellerNutzer() {
      return aktuell();
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
      anmeldenAls(s, uid);
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
      anmeldenAls(s, k.uid);
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
      anmeldenAls(s, k.uid);
      schreibe(s); melden();
      return aktuell();
    },

    async abmelden() {
      const s = lese();
      delete s.angemeldet[slot];
      schreibe(s); melden();
    },

    async passwortVergessen() { await warte(); },
    async bestaetigungSenden() { await warte(); },

    /* Es gibt keine echte Mail — im Demo-Modus gilt die Adresse als
       bestätigt, sobald man nachfragt. */
    async bestaetigungPruefen() {
      await warte();
      const s = lese();
      const k = s.konten[s.angemeldet[slot]];
      if (k) { k.verifiziert = true; schreibe(s); }
      melden();
      return aktuell();
    },

    async profilLaden(uid) {
      await warte(140);
      const p = lese().profile[uid];
      return p ? profilAusDaten({
        ...p,
        createdAt: p.createdAt ? new Date(p.createdAt) : null,
        stand: Date.parse(p.updatedAt || "") || 0
      }) : null;
    },

    async titelbildLaden(uid) {
      await warte(120);
      try { return localStorage.getItem(titelSchluessel(uid)) || ""; } catch (e) { return ""; }
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
      const { coverEigen, ...rest } = daten;
      if (typeof coverEigen === "string") {
        try {
          if (coverEigen) localStorage.setItem(titelSchluessel(uid), coverEigen);
          else localStorage.removeItem(titelSchluessel(uid));
        } catch (e) { throw new KontoFehler("zu-gross"); }
      }
      if (vorher) delete s.namen[vorher.username.toLowerCase()];
      s.namen[lower] = uid;
      s.profile[uid] = {
        ...rest,
        createdAt: vorher && vorher.createdAt ? new Date(vorher.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      schreibe(s);
    },

    async newsletterStatus(uid) {
      return !!lese().newsletter[uid];
    },

    /* Bestenliste im Demo-Modus: nur in diesem Browser */
    async bestwertLaden(uid) {
      const s = lese();
      return (s.bestenliste && s.bestenliste[uid] && s.bestenliste[uid].punkte) || 0;
    },

    async bestwertSetzen(uid, name, punkte) {
      const s = lese();
      s.bestenliste = s.bestenliste || {};
      s.bestenliste[uid] = { name, punkte: Math.round(punkte) };
      schreibe(s);
    },

    /* Spielstand und Einstellungen im Demo-Modus: nur in diesem Browser */
    async spielstandLaden(uid) {
      const s = lese();
      return (s.spielstaende && s.spielstaende[uid]) || null;
    },

    async spielstandSetzen(uid, d) {
      const s = lese();
      s.spielstaende = s.spielstaende || {};
      s.spielstaende[uid] = JSON.parse(JSON.stringify(d));
      schreibe(s);
      return true;
    },

    async einstellungLaden(name) {
      const s = lese();
      return (s.einstellungen && s.einstellungen[name]) || null;
    },

    async einstellungSetzen(name, daten) {
      const s = lese();
      s.einstellungen = s.einstellungen || {};
      s.einstellungen[name] = JSON.parse(JSON.stringify(daten));
      schreibe(s);
    },

    async bestenliste(anzahl = 10) {
      const s = lese();
      return Object.values(s.bestenliste || {})
        .sort((a, b) => b.punkte - a.punkte)
        .slice(0, anzahl);
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
      Object.keys(s.angemeldet).forEach(sl => { if (s.angemeldet[sl] === uid) delete s.angemeldet[sl]; });
      try { localStorage.removeItem(titelSchluessel(uid)); } catch (e) {}
      schreibe(s); melden();
    }
  };
}
