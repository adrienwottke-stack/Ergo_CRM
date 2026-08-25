import { NextResponse, type NextRequest } from "next/server";
import { authCookieName, sessionUserId } from "./lib/session";

// Die zuletzt gewaehlte Kalenderansicht. Sie wird HIER gesetzt und nicht auf
// der Seite: eine Server-Komponente darf beim Rendern kein Cookie schreiben,
// und der Umschalter soll bewusst aus reinen Links bestehen, damit er ohne
// Javascript funktioniert. Die Middleware sieht denselben Aufruf und kann die
// Antwort anfassen - das ist die einzige Stelle, an der beides zusammenkommt.
const ANSICHT_COOKIE = "kalender_ansicht";
const ANSICHTEN = new Set(["monat", "woche", "tag", "liste"]);

export async function middleware(request: NextRequest) {
  const session = await sessionUserId(
    request.cookies.get(authCookieName)?.value
  );
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  const antwort = NextResponse.next();

  if (request.nextUrl.pathname === "/kalender") {
    const gewaehlt = request.nextUrl.searchParams.get("ansicht");
    if (gewaehlt && ANSICHTEN.has(gewaehlt)) {
      antwort.cookies.set(ANSICHT_COOKIE, gewaehlt, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  return antwort;
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
  //
  // /kalender/feed ist der Abo-Feed. Er MUSS ohne Sitzung erreichbar sein: ein
  // abonnierter Kalender im Handy schickt kein Cookie mit, sondern holt die
  // Adresse stumpf ab. Geschuetzt ist er ueber den Schluessel im Pfad, der sich
  // jederzeit zurueckziehen laesst.
  matcher: [
    "/((?!login|einladung|neues-passwort|start|offline|api/cron|kalender/feed|manifest\\.webmanifest|sw\\.js|icon-|apple-touch-icon\\.png|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)",
  ],
};
