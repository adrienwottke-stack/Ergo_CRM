import type { NextConfig } from "next";

// Achtung: KEINE rewrites() hier verwenden – config-Rewrites in Kombination mit
// der Middleware brechen den No-JS-Fallback von Server Actions
// (vercel/next.js#56368). /storno wird stattdessen über app/storno/route.ts
// ausgeliefert.
const nextConfig: NextConfig = {};

export default nextConfig;
