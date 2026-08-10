import { NextResponse, type NextRequest } from "next/server";
import {
  authCookieName,
  authTokenValue,
  teamCookieName,
  teamTokenValue,
} from "@/lib/auth";

// Nur diese Pfade sind mit dem Team-Zugang erreichbar (keine Kundendaten).
const teamPathPrefixes = ["/log", "/leaderboard"];

export async function middleware(request: NextRequest) {
  const fullToken = request.cookies.get(authCookieName)?.value;
  if (fullToken && fullToken === (await authTokenValue())) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isTeamPath = teamPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (isTeamPath) {
    const teamToken = request.cookies.get(teamCookieName)?.value;
    if (teamToken && teamToken === (await teamTokenValue())) {
      return NextResponse.next();
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Alles schützen außer Login, Next-Assets und statischen Dateien
  matcher: ["/((?!login|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)"],
};
