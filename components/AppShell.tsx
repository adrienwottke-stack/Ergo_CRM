import { logout } from "@/app/login/actions";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import NavLinks, { type NavLink } from "@/components/NavLinks";
import UndoBar from "@/components/UndoBar";
import InstallationMelder from "@/components/InstallationMelder";
import { LogoutIcon } from "@/components/icons";
import { shell, gutter } from "@/components/ui";
import type { User } from "@/lib/generated/prisma/client";

// Eine Schale fuer alle angemeldeten Seiten.
//
// Vorher hatten der Beraterbereich und der Wettbewerb je eine eigene Kopfzeile
// mit eigener Navigation, eigener Unterzeile und unterschiedlichem Aufbau. Der
// Sprung von /heute nach /arena wechselte damit die gesamte Umgebung - der
// Nutzer musste sich zweimal zurechtfinden und wusste nach dem Wechsel nicht
// mehr, wo er ist. docs/audit-kernmodell.md, 10.9: die Navigation darf das
// Versprechen "keine Entscheidung beim Oeffnen" nicht wieder einreissen.
//
// Jetzt gibt es eine Leiste, an einer Stelle definiert. Was innerhalb des
// Wettbewerbs zusammengehoert (Arena, Rangliste, eigene Aktivitaeten), verlinkt
// sich auf den Seiten selbst - eine Ebene tiefer, wo es hingehoert.

export async function navigationFuer(user: User): Promise<NavLink[]> {
  // "Mannschaft" taucht nur auf, wenn wirklich jemand unter dir haengt:
  // Fuehrungskraft ist eine Position im Baum, keine Rolle, die man vergibt.
  const gefuehrte = await prisma.user.count({
    where: { leaderId: user.id, deactivatedAt: null },
  });

  return [
    { href: "/namen", label: "Namen" },
    { href: "/heute", label: "Heute" },
    { href: "/kalender", label: "Kalender" },
    { href: "/trichter", label: "Trichter" },
    ...(gefuehrte > 0 ? [{ href: "/mannschaft", label: "Mannschaft" }] : []),
    // "Einladen" kann jeder: Werben ist der Kern des Berufs, nicht die Kuer.
    { href: "/einladen", label: "Einladen" },
    // Ein Punkt fuer den ganzen Wettbewerb. Rangliste und eigene Aktivitaeten
    // haengen darunter und markieren denselben Punkt mit.
    { href: "/arena", label: "Wettbewerb", match: ["/leaderboard", "/log"] },
    ...(user.role === "ADMIN"
      ? [{ href: "/team", label: "Team", match: ["/werkstatt"] }]
      : []),
  ];
}

export default async function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const links = await navigationFuer(user);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Helle Kopfzeile mit Haarlinie: die App ist das Blatt, nicht die Buehne. */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-surface">
        <div
          className={`${shell} ${gutter} flex h-14 items-center justify-between gap-4`}
        >
          <Wordmark sub="Beraterbereich" />
          <form action={logout}>
            {/* Am Handy nur das Symbol – der Text sprengt sonst die Kopfzeile. */}
            <button
              type="submit"
              aria-label="Abmelden"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:px-3"
            >
              <LogoutIcon className="h-4.5 w-4.5 sm:hidden" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </form>
        </div>
        {/* Navigation ueber die volle Breite, der aktive Unterstrich liegt
            direkt auf der Haarlinie der Kopfzeile. */}
        <div className={`${shell} ${gutter} flex items-center gap-2`}>
          <NavLinks links={links} />
        </div>
      </header>

      <main className={`${shell} ${gutter} flex-1 py-8 sm:py-10`}>
        {children}
      </main>

      {/* Liegt ueber allem und meldet sich nur, wenn es etwas zurueckzunehmen gibt. */}
      <UndoBar />
      {/* Haelt einmalig fest, wer die App wirklich vom Startbildschirm startet. */}
      <InstallationMelder melden={user.installedAt === null} />
    </div>
  );
}
