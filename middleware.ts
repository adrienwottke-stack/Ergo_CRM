import { NextResponse, type NextRequest } from "next/server";
import { authCookieName, sessionUserId } from "./lib/session";

export async function middleware(request: NextRequest) {
  const session = await sessionUserId(
    request.cookies.get(authCookieName)?.value
  );
  if (session) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Login, die Einladungsseite (wer eingeladen wird, hat noch kein Konto),
  // Next-Assets und statische Dateien bleiben erreichbar. Alles andere
  // verlangt ein persoenliches Konto.
  //
  // Dazu alles, was zur Installation gehoert: /start entscheidet selbst, wohin
  // es geht, /offline liefert der Service Worker aus, und Manifest, sw.js und
  // die Symbole muss der Browser abrufen koennen, BEVOR jemand ein Konto hat -
  // sonst gibt es auf der Einladungsseite gar nichts zu installieren.
  //
  // /neues-passwort ist der Weg zurueck ins eigene Konto - wer sein Passwort
  // vergessen hat, kann sich per Definition nicht anmelden. Geschuetzt ist die
  // Seite ueber den Code im Link, nicht ueber eine Sitzung.
  //
  // /api/cron laeuft ohne Sitzung: der Auftrag kommt von Vercel, nicht aus
  // einem Browser. Geschuetzt ist er ueber CRON_SECRET, nicht ueber ein Cookie.
  matcher: [
    "/((?!login|einladung|neues-passwort|start|offline|api/cron|manifest\\.webmanifest|sw\\.js|icon-|apple-touch-icon\\.png|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)",
  ],
};
