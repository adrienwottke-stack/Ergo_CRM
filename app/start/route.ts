import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalisiereCode } from "@/lib/einladung";

export const dynamic = "force-dynamic";

// Die Weiche nach dem App-Start (docs/willkommen-plan.md, Abschnitt 7.3).
//
// Die installierte App startet nicht auf einer Seite, sondern hier. Der Grund:
// Installiert wird auf der Einladungsseite, gestartet wird spaeter mit einer
// Anmeldung - und auf dem iPhone hat die App einen eigenen Speicher, in dem
// die Sitzung aus Safari nicht gilt. Ohne diese Weiche landet ein frisch
// Eingeladener nach der Installation vor dem Anmeldefenster, ohne je ein Konto
// angelegt zu haben.
//
// "e" traegt den Einladungscode durch die Installation. Er steht in der
// start_url des Manifests, das die Einladungsseite ausliefert.
export async function GET(request: NextRequest) {
  const ziel = (pfad: string) => NextResponse.redirect(new URL(pfad, request.url));

  const user = await currentUser();
  if (user) return ziel(user.beginnerMode ? "/namen" : "/heute");

  const code = normalisiereCode(request.nextUrl.searchParams.get("e") ?? "");
  if (code) {
    const invite = await prisma.invite.findUnique({
      where: { code },
      select: { usedById: true, expiresAt: true },
    });
    // Auch eine verbrauchte oder abgelaufene Einladung geht zurueck auf die
    // Einladungsseite: die erklaert in einem Satz, was los ist, und verlinkt
    // die Anmeldung. Besser als ein Anmeldefenster ohne Zusammenhang.
    if (invite) return ziel(`/einladung/${encodeURIComponent(code)}`);
  }

  return ziel("/login");
}
