/* ═══════════════════════════════════════════════════════════
   Rockstar Newswire → assets/data/newswire.json

   Läuft alle 15 Minuten als GitHub Action (.github/workflows/newswire.yml)
   und lässt sich auch von Hand starten:

     node tools/newswire-holen.mjs

   Holt die neuesten Newswire-Artikel mit der Kategorie „Grand Theft
   Auto VI" (Rockstars Kategorie-Nummer 666) auf Englisch und Deutsch.
   Die Datei wird nur neu geschrieben, wenn sich an den Meldungen etwas
   geändert hat — sonst entsteht kein Commit.

   Warum nicht direkt im Browser? Rockstars Schnittstelle erlaubt keine
   Abrufe von fremden Seiten (kein CORS). Die Action holt die Daten
   serverseitig, die Seite liest dann nur noch die fertige Datei.

   Die Abfrage ist dieselbe, die rockstargames.com/newswire selbst
   benutzt. Ändert Rockstar sie, schlägt der Abruf fehl — die Seite zeigt
   dann einfach die zuletzt gespeicherten Meldungen weiter.
   ═══════════════════════════════════════════════════════════ */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ZIEL = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "data", "newswire.json");
const ENDPUNKT = "https://graph.rockstargames.com/";
const GTA_VI = 666;
const ANZAHL = 12;

/* Auf der Seite steht nirgends „Pre-Order" — solche Artikel fallen raus */
const AUSSCHLUSS = /pre-?order|vorbestell/i;

const QUERY = `fragment postFields on RockstarGames_Newswire_Model_Entity_Post_o {
    id: id_hash
    url
    title
    name_slug
    created
    created_formatted
    primary_tags {
        id
        name
    }
    secondary_tags {
        id
        name
    }
    preview_images_parsed {
        newswire_block {
            square
            d16x9
            _fallback
        }
    }
}
fragment paging on RockstarGames_Cake_Graph_Type_Paging_o {
    pageCount
    page
    count
    nextPage
    prevPage
    perPage
}

query NewswireList(
    $locale: String!
    $page: Int!
    $limit: Int
    $tagId: Int
    $tagIdHash: String
    $metaUrl: String!
    $cache: Boolean = true
) {
    meta: metaUrl(url: $metaUrl, domain: "www", locale: $locale) {
        title
    }
    posts(
        page: $page
        tagId: $tagId
        tagIdHash: $tagIdHash
        locale: $locale
        limit: $limit
    ) {
        paging {
            ...paging
        }
        results {
            ...postFields
        }
    }
}
`;

async function holen(locale) {
  const antwort = await fetch(ENDPUNKT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "luciajason.de newswire (+https://luciajason.de)",
      "Origin": "https://www.rockstargames.com",
      "Referer": "https://www.rockstargames.com/newswire"
    },
    body: JSON.stringify({
      operationName: "NewswireList",
      query: QUERY,
      variables: { locale, page: 1, limit: ANZAHL, tagId: GTA_VI, metaUrl: "/newswire" }
    })
  });
  if (!antwort.ok) throw new Error(`${locale}: HTTP ${antwort.status}`);
  const json = await antwort.json();
  const liste = json && json.data && json.data.posts && json.data.posts.results;
  if (!Array.isArray(liste)) throw new Error(`${locale}: unerwartete Antwort ${JSON.stringify(json).slice(0, 300)}`);
  return liste;
}

/* "9/17/26, 8:00 AM" → "2026-09-17T08:00" (zum Sortieren und für „neu") */
function isoDatum(created) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(created || "").trim());
  if (!m) return "";
  let [, mo, tag, jahr, std, min, ampm] = m;
  std = +std % 12 + (ampm.toUpperCase() === "PM" ? 12 : 0);
  const zwei = n => String(n).padStart(2, "0");
  return `20${jahr}-${zwei(mo)}-${zwei(tag)}T${zwei(std)}:${min}`;
}

const sauber = s => String(s || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();

async function main() {
  const [en, de] = await Promise.all([holen("en_us"), holen("de_de")]);
  const deutsch = new Map(de.map(p => [p.id, p]));

  const meldungen = en
    .filter(p => !AUSSCHLUSS.test(p.title) && !AUSSCHLUSS.test((deutsch.get(p.id) || {}).title || ""))
    .map(p => {
      const d = deutsch.get(p.id) || {};
      const bilder = (p.preview_images_parsed && p.preview_images_parsed.newswire_block) || {};
      return {
        id: p.id,
        url: "https://www.rockstargames.com" + p.url,
        datum: isoDatum(p.created),
        titel: { en: sauber(p.title), de: sauber(d.title || p.title) },
        datumText: { en: sauber(p.created_formatted), de: sauber(d.created_formatted || p.created_formatted) },
        bild: bilder.d16x9 || bilder.square || ""
      };
    })
    .sort((a, b) => b.datum.localeCompare(a.datum));

  if (!meldungen.length) throw new Error("keine Meldungen erhalten");

  let bisher = null;
  try { bisher = JSON.parse(await readFile(ZIEL, "utf8")); } catch (e) { /* erste Ausführung */ }
  if (bisher && JSON.stringify(bisher.meldungen) === JSON.stringify(meldungen)) {
    console.log(`Unverändert — ${meldungen.length} Meldungen, neueste: ${meldungen[0].titel.en}`);
    return;
  }

  await mkdir(dirname(ZIEL), { recursive: true });
  const datei = {
    quelle: "https://www.rockstargames.com/newswire",
    aktualisiert: new Date().toISOString(),
    meldungen
  };
  await writeFile(ZIEL, JSON.stringify(datei, null, 2) + "\n", "utf8");
  console.log(`Aktualisiert — ${meldungen.length} Meldungen, neueste: ${meldungen[0].titel.en}`);
}

main().catch(e => {
  console.error("Newswire-Abruf fehlgeschlagen:", e.message);
  process.exit(1);
});
