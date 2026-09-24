/* ═══════════════════════════════════════════════════════════
   Rollen: wer ist Admin?

   Admin ist, wessen Benutzername in ADMINS steht — der Besitzer der
   Seite. Benutzernamen sind einmalig (Sammlung „usernames"), deshalb
   reicht das als Merkmal. Die Datenbank prüft dasselbe in
   firestore.rules (Funktion istAdmin); was hier steht, entscheidet
   nur, was die Seite anzeigt.

   Admins sehen den roten „Admin"-Chip im Profil, den Reiter „Admin" in
   der Navigation und öffnen im Spiel das Entwicklermenü mit F8.
   Wer hier einen Namen ergänzt, muss ihn auch in firestore.rules
   ergänzen und die Regeln neu veröffentlichen.
   ═══════════════════════════════════════════════════════════ */

export const ADMINS = ["vrtomsky"];            // klein geschrieben

export function istAdmin(profil) {
  if (!profil) return false;
  const name = String(profil.usernameLower || profil.username || "").toLowerCase();
  return ADMINS.includes(name);
}
