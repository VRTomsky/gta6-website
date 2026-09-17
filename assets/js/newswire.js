/* ═══════════════════════════════════════════════════════════
   Rockstar Newswire — Meldungen laden

   Die Datei assets/data/newswire.json hält eine GitHub Action aktuell
   (tools/newswire-holen.mjs, alle 15 Minuten). Gelesen wird zuerst direkt
   aus dem Repository auf raw.githubusercontent.com — das ist nach etwa
   fünf Minuten frisch, ohne auf den Neubau von GitHub Pages zu warten.
   Klappt das nicht (offline, lokal ohne Netz), kommt die Kopie neben der
   Seite dran.

     Newswire.laden()          → Promise<{ aktualisiert, meldungen } | null>
     Newswire.beobachten(cb)   ruft cb(daten) sofort und bei jeder
                               Änderung (alle 5 Minuten, nur sichtbarer Tab)
     Newswire.istNeu(meldung)  jünger als 7 Tage
     Newswire.text(meldung)    { titel, datum } in der Sprache der Seite
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var QUELLEN = [
    "https://raw.githubusercontent.com/VRTomsky/gta6-website/main/assets/data/newswire.json",
    "assets/data/newswire.json"
  ];
  var TAKT = 5 * 60 * 1000;
  var NEU_TAGE = 7;

  function laden() {
    var stempel = Math.floor(Date.now() / 60000);          // höchstens minütlich neu
    var i = 0;
    function versuch() {
      if (i >= QUELLEN.length) return Promise.resolve(null);
      var url = QUELLEN[i++] + "?m=" + stempel;
      return fetch(url, { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) {
          if (!d || !Array.isArray(d.meldungen) || !d.meldungen.length) throw new Error("leer");
          return d;
        })
        .catch(versuch);
    }
    return versuch();
  }

  function kennung(d) {
    return d ? d.meldungen.map(function (m) { return m.id; }).join(",") : "";
  }

  function beobachten(cb) {
    var bisher = null;
    function holen() {
      laden().then(function (d) {
        if (!d) return;
        var k = kennung(d);
        if (k === bisher) return;
        var vorher = bisher;
        bisher = k;
        cb(d, vorher === null ? null : vorher.split(","));
      });
    }
    holen();
    setInterval(function () { if (!document.hidden) holen(); }, TAKT);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) holen(); });
  }

  function istNeu(m) {
    var t = Date.parse(m.datum);
    return !isNaN(t) && Date.now() - t < NEU_TAGE * 86400000;
  }

  function text(m) {
    var en = (window.LANG || "de") === "en";
    return {
      titel: (m.titel && (en ? m.titel.en : m.titel.de)) || "",
      datum: (m.datumText && (en ? m.datumText.en : m.datumText.de)) || ""
    };
  }

  window.Newswire = { laden: laden, beobachten: beobachten, istNeu: istNeu, text: text };
})();
