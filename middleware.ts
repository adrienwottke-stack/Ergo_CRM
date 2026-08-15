import { NextResponse, type NextRequest } from "next/server";
import {
  authCookieName,
  reportCookieName,
  reportTokenValue,
  sessionUserId,
} from "./lib/session";

export async function middleware(request: NextRequest) {
  const session = await sessionUserId(
    request.cookies.get(authCookieName)?.value
  );
  if (session) return NextResponse.next();

  // Der Berichts-Zugang kann weiterhin getrennt an Vorgesetzte vergeben werden.
  if (request.nextUrl.pathname === "/report") {
    const reportToken = request.cookies.get(reportCookieName)?.value;
    if (reportToken && reportToken === (await reportTokenValue())) {
      return NextResponse.next();
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Login, die Einladungsseite (wer eingeladen wird, hat noch kein Konto), das
  // bewusst oeffentliche Storno-Spiel, Next-Assets und statische Dateien
  // bleiben erreichbar. Alles andere verlangt ein persoenliches Konto.
  matcher: [
    "/((?!login|einladung|storno|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)",
  ],
};
