import type { NextConfig } from "next";

// Achtung: KEINE rewrites() hier verwenden – config-Rewrites in Kombination mit
// der Middleware brechen den No-JS-Fallback von Server Actions
// (vercel/next.js#56368). Wer eine hübsche URL braucht, nimmt einen
// Route-Handler.
const nextConfig: NextConfig = {
  // Isolated browser/build checks must not overwrite a running developer's cache.
  distDir: process.env.CRM_TEST_DIST_DIR || ".next",
  typescript: { tsconfigPath: process.env.CRM_TEST_TSCONFIG || "tsconfig.json" },
  experimental: {
    // Server-Actions nehmen standardmaessig 1 MB Rumpf an. Eine Sprachnachricht
    // aus der Rueckmeldung ist bei 60 Sekunden rund 240 KB, kann bei einem
    // gespraechigen Geraet aber an die Grenze stossen - und dann scheitert
    // nicht die Aufnahme, sondern die ganze Meldung. Die harte Grenze zieht
    // ohnehin die Server-Action (lib/rueckmeldung.ts, AUDIO_MAX_BYTES) und
    // zusaetzlich ein CHECK in der Datenbank; hier steht nur der Puffer
    // darueber.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
