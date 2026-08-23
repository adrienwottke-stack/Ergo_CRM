import { logout } from "@/app/login/actions";
import { requireOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import UndoBar from "@/components/UndoBar";
import InstallationMelder from "@/components/InstallationMelder";
import { LogoutIcon } from "@/components/icons";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Wer den Start noch nie gesehen hat, wird von hier einmalig nach
  // /willkommen geschickt - die Route liegt in ihrer eigenen Gruppe und
  // laeuft deshalb nicht durch dieses Layout.
  const user = await requireOnboardedUser();
  // "Mannschaft" taucht nur auf, wenn wirklich jemand unter dir haengt:
  // Führungskraft ist eine Position im Baum, keine Rolle, die man vergibt.
  const gefuehrte = await prisma.user.count({
    where: { leaderId: user.id, deactivatedAt: null },
  });
  // Eine Navigation fuer alle. Der frueher noetige Einsteiger-Modus war ein
  // Pflaster auf zu vielen Bildschirmen - nach dem Rueckbau bleibt eine Leiste,
  // die niemand mehr ausduennen muss. "Einladen" kann jeder: Werben ist der
  // Kern des Berufs, nicht die Kuer.
  const links = [
    { href: "/namen", label: "Namen" },
    { href: "/heute", label: "Heute" },
    { href: "/kalender", label: "Kalender" },
    { href: "/trichter", label: "Trichter" },
    ...(gefuehrte > 0 ? [{ href: "/mannschaft", label: "Mannschaft" }] : []),
    { href: "/einladen", label: "Einladen" },
    { href: "/arena", label: "Wettbewerb" },
    ...(user.role === "ADMIN" ? [{ href: "/team", label: "Team" }] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Helle Kopfzeile mit Haarlinie: die App ist das Blatt, nicht die Buehne. */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Wordmark sub="Beraterbereich" />
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <form action={logout}>
              {/* Am Handy nur das Symbol – der Text sprengt sonst die Kopfzeile. */}
              <button
                type="submit"
                aria-label="Abmelden"
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:px-3"
              >
                <LogoutIcon className="h-4.5 w-4.5 sm:hidden" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </form>
          </div>
        </div>
        {/* Navigation ueber die volle Breite, der aktive Unterstrich liegt
            direkt auf der Haarlinie der Kopfzeile. */}
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 sm:px-6">
          <NavLinks links={links} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      {/* Liegt ueber allem und meldet sich nur, wenn es etwas zurueckzunehmen gibt. */}
      <UndoBar />
      {/* Haelt einmalig fest, wer die App wirklich vom Startbildschirm startet. */}
      <InstallationMelder melden={user.installedAt === null} />
    </div>
  );
}
