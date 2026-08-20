// Service Worker der Ergo-CRM-App (docs/willkommen-plan.md, Abschnitt 7.4).
//
// Zwei Aufgaben, mehr nicht:
//   1. Chrome bietet das Installieren erst an, wenn ein Service Worker
//      registriert ist, der bei Netzausfall eine Antwort liefert. Ohne diese
//      Datei gibt es auf Android keinen Installieren-Knopf.
//   2. Eine ehrliche "Kein Netz"-Seite statt des Dino-Spiels.
//
// WICHTIG: Zwischengespeichert werden ausschliesslich unveraenderliche
// Dateien. Niemals HTML, niemals Antworten von Server-Actions. Das sind
// Kundendaten - eine Seite aus dem Cache im falschen Konto waere der
// schlimmste denkbare Fehler dieser App.

const CACHE = "ergo-crm-v1";

// Im Entwicklungsbetrieb registriert die App diese Datei als "/sw.js?dev=1".
// Dann bleibt der Cache aus: sonst bekaeme man nach jeder Aenderung die alten
// Next-Bundles ausgeliefert. Die Offline-Antwort funktioniert trotzdem.
const CACHE_AKTIV = !self.location.search.includes("dev=1");

// Die Offline-Seite und die Symbole. Mehr braucht die Schale nicht.
const SCHALE = [
  "/offline",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  if (!CACHE_AKTIV) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    caches
      .open(CACHE)
      // Einzeln statt addAll: faellt ein Symbol aus, soll nicht die ganze
      // Installation scheitern und der Installieren-Knopf verschwinden.
      .then((cache) =>
        Promise.all(SCHALE.map((pfad) => cache.add(pfad).catch(() => undefined)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) =>
        Promise.all(namen.filter((name) => name !== CACHE).map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  );
});

// Nur was unter diesen Pfaden liegt, darf in den Cache: Next-Bundles tragen
// einen Hash im Namen, Symbole aendern sich praktisch nie.
function istUnveraenderlich(pfad) {
  return (
    pfad.startsWith("/_next/static/") ||
    pfad.startsWith("/icon") ||
    pfad === "/apple-touch-icon.png" ||
    pfad === "/favicon.ico"
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Seitenaufrufe: immer aus dem Netz, damit niemand fremde oder alte Daten
  // zu sehen bekommt. Nur wenn das Netz wegbleibt, kommt die Offline-Seite.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match("/offline");
        return (
          offline ??
          new Response("Kein Netz.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      })
    );
    return;
  }

  if (!CACHE_AKTIV || !istUnveraenderlich(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((treffer) => {
      if (treffer) return treffer;
      return fetch(request).then((antwort) => {
        if (antwort.ok) {
          const kopie = antwort.clone();
          caches.open(CACHE).then((cache) => cache.put(request, kopie));
        }
        return antwort;
      });
    })
  );
});
