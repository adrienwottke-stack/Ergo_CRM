import type { MetadataRoute } from "next";

// Macht aus "Zum Startbildschirm hinzufuegen" ein richtiges Symbol ohne
// Adressleiste. Kein App-Store-Aufwand - nur diese Datei plus die Icons.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ergo CRM",
    short_name: "Ergo CRM",
    description: "Namensliste und Kontakt-Tracking für das Ergo-Netzwerk",
    // Einsteiger landen direkt auf ihrer Namensliste, nicht im Dashboard.
    start_url: "/namen",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1628",
    theme_color: "#0a1628",
    lang: "de",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
