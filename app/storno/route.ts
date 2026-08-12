import { readFile } from "fs/promises";
import path from "path";

// Liefert das Storno-Spiel unter der hübschen URL /storno aus.
// Bewusst als Route-Handler statt config-Rewrite: rewrites() + Middleware
// bricht den No-JS-Fallback von Server Actions (vercel/next.js#56368).
export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "public", "storno.html"),
    "utf-8"
  );
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
