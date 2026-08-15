import type { NextConfig } from "next";

// Achtung: KEINE rewrites() hier verwenden – config-Rewrites in Kombination mit
// der Middleware brechen den No-JS-Fallback von Server Actions
// (vercel/next.js#56368). /storno wird stattdessen über app/storno/route.ts
// ausgeliefert.
const nextConfig: NextConfig = {
  // app/storno/route.ts liest die Spieldatei zur Laufzeit aus public/. Der
  // Datei-Tracer packt public/ nicht von selbst in das Function-Bundle, sonst
  // laeuft readFile im Deploy ins Leere (lokal faellt das nicht auf).
  outputFileTracingIncludes: {
    "/storno": ["./public/storno.html"],
  },
};

export default nextConfig;
