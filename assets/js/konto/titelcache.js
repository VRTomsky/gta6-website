/* ═══════════════════════════════════════════════════════════
   Titelbild — Zwischenspeicher im Browser

   Das eigene Titelbild liegt in Firestore in bis zu acht Teilen. Sie zu
   holen dauert ein bis drei Sekunden — solange stand vorher die Vorlage
   im Hintergrund und wurde dann ausgetauscht. Deshalb liegt das zuletzt
   geladene Bild zusätzlich in der IndexedDB dieses Browsers und ist
   sofort da.

   Gespeichert wird je Konto (uid):
     { cover, daten, stand }
       cover  was im Profil gewählt ist ("eigen" oder "preset:…")
       daten  das eigene Bild als data:-URL (kann leer sein)
       stand  Zeitpunkt der letzten Profiländerung (profil.stand).
              Stimmt er noch, muss gar nichts nachgeladen werden.

   Alles ist ein reiner Zwischenspeicher: Geht etwas schief (privater
   Modus, gesperrter Speicher), fällt die Seite still auf den bisherigen
   Weg zurück. Entfernt man ein Konto vom Gerät oder löscht es, fliegt
   auch sein Bild hier raus.
   ═══════════════════════════════════════════════════════════ */

import { istDemo } from "./backend.js";

const DB_NAME = "luciajason-konto";
const LAGER = "titelbilder";
const schluessel = uid => (istDemo() ? "demo:" : "") + uid;

let dbVersprechen = null;

function db() {
  if (dbVersprechen) return dbVersprechen;
  dbVersprechen = new Promise((ok, weg) => {
    if (typeof indexedDB === "undefined") return weg(new Error("keine IndexedDB"));
    const a = indexedDB.open(DB_NAME, 1);
    a.onupgradeneeded = () => {
      if (!a.result.objectStoreNames.contains(LAGER)) a.result.createObjectStore(LAGER);
    };
    a.onsuccess = () => ok(a.result);
    a.onerror = () => weg(a.error);
    a.onblocked = () => weg(new Error("blockiert"));
  }).catch(e => { dbVersprechen = null; throw e; });
  return dbVersprechen;
}

function lauf(art, arbeit) {
  return db().then(d => new Promise((ok, weg) => {
    const t = d.transaction(LAGER, art);
    const anfrage = arbeit(t.objectStore(LAGER));
    t.oncomplete = () => ok(anfrage ? anfrage.result : undefined);
    t.onerror = t.onabort = () => weg(t.error);
  }));
}

/* Gelesen wird auch, bevor überhaupt klar ist, wer angemeldet ist —
   die uid steht in der Kontoliste im localStorage. */
export function titelLesen(uid) {
  if (!uid) return Promise.resolve(null);
  return lauf("readonly", s => s.get(schluessel(uid)))
    .then(e => (e && typeof e === "object" ? e : null))
    .catch(() => null);
}

export function titelMerken(uid, eintrag) {
  if (!uid) return Promise.resolve();
  return lauf("readwrite", s => s.put({
    cover: String(eintrag.cover || ""),
    daten: String(eintrag.daten || ""),
    stand: eintrag.stand || 0
  }, schluessel(uid))).catch(() => {});
}

export function titelVergessen(uid) {
  if (!uid) return Promise.resolve();
  return lauf("readwrite", s => s.delete(schluessel(uid))).catch(() => {});
}

/* Bilder von Konten, die nicht mehr auf dem Gerät sind, verschwinden */
export function titelAufraeumen(uids) {
  const behalten = new Set((uids || []).filter(Boolean).map(schluessel));
  return lauf("readwrite", s => {
    const a = s.getAllKeys();
    a.onsuccess = () => {
      const eigene = istDemo() ? k => String(k).startsWith("demo:") : k => !String(k).startsWith("demo:");
      (a.result || []).forEach(k => { if (eigene(k) && !behalten.has(k)) s.delete(k); });
    };
    return null;
  }).catch(() => {});
}
