import type { MetadataRoute } from "next";

// Macht aus "Zum Startbildschirm hinzufuegen" ein richtiges Symbol ohne
// Adressleiste. Kein App-Store-Aufwand - nur diese Datei plus die Icons.
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Die Kennung der App. Steht fest und haengt bewusst NICHT an der
    // start_url: die Einladungsseite liefert ein eigenes Manifest mit anderer
    // start_url aus, und ohne gleiche id hielte Chrome das fuer eine zweite
    // App und legte ein zweites Symbol an.
    id: "/",
    name: "Ergo CRM",
    short_name: "Ergo CRM",
    description: "Namensliste und Kontakt-Tracking für das Ergo-Netzwerk",
    // Nicht direkt auf eine Seite, sondern auf die Weiche: /start entscheidet
    // je nach Anmeldung, wo es weitergeht (app/start/route.ts).
    start_url: "/start",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1628",
    theme_color: "#0a1628",
    lang: "de",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      // Zweimal dieselbe Datei mit verschiedenem Zweck: "any" ist das Symbol,
      // das Android anzeigt, "maskable" das, was es in seine Form schneidet.
      // Steht nur "maskable" da, fehlt Android das grosse Symbol ganz.
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
