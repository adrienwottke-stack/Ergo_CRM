import { NextResponse, type NextRequest } from "next/server";
// Relativer Import statt "@/lib/auth": Vercels Edge-Bundler löst den
// tsconfig-Alias in der Middleware nicht auf ("referencing unsupported modules").
import {
  authCookieName,
  authTokenValue,
  reportCookieName,
  reportTokenValue,
  teamCookieName,
  teamTokenValue,
} from "./lib/auth";

// Nur diese Pfade sind mit dem Team-Zugang erreichbar (keine Kundendaten).
const teamPathPrefixes = ["/log", "/leaderboard"];
// Nur dieser Pfad ist mit dem Berichts-Zugang erreichbar (nur Aggregate).
const reportPathPrefixes = ["/report"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const fullToken = request.cookies.get(authCookieName)?.value;
  if (fullToken && fullToken === (await authTokenValue())) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (matchesPrefix(pathname, teamPathPrefixes)) {
    const teamToken = request.cookies.get(teamCookieName)?.value;
    if (teamToken && teamToken === (await teamTokenValue())) {
      return NextResponse.next();
    }
  }

  if (matchesPrefix(pathname, reportPathPrefixes)) {
    const reportToken = request.cookies.get(reportCookieName)?.value;
    if (reportToken && reportToken === (await reportTokenValue())) {
      return NextResponse.next();
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Alles schützen außer Login, Storno-Spiel (bewusst öffentlich, keine Kundendaten),
  // Next-Assets und statischen Dateien
  matcher: ["/((?!login|storno|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)"],
};
