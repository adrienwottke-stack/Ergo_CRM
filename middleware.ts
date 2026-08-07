import { NextResponse, type NextRequest } from "next/server";
import { authCookieName, authTokenValue } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(authCookieName)?.value;
  if (token && token === (await authTokenValue())) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Alles schützen außer Login, Next-Assets und statischen Dateien
  matcher: ["/((?!login|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)"],
};
