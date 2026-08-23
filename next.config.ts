import type { NextConfig } from "next";

// Achtung: KEINE rewrites() hier verwenden – config-Rewrites in Kombination mit
// der Middleware brechen den No-JS-Fallback von Server Actions
// (vercel/next.js#56368). Wer eine hübsche URL braucht, nimmt einen
// Route-Handler.
const nextConfig: NextConfig = {};

export default nextConfig;
