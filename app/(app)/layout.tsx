import { logout } from "@/app/login/actions";
import { requireUser } from "@/lib/auth";
import { Wordmark } from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import CommandPalette from "@/components/CommandPalette";
import UndoBar from "@/components/UndoBar";
import { LogoutIcon } from "@/components/icons";
import { searchContacts } from "@/app/(app)/contacts/actions";
import { setBeginnerMode } from "@/app/(app)/namen/actions";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  // Einsteiger sehen drei Einträge statt zehn. Nichts ist gesperrt, nur
  // ausgeblendet – ein Tipp auf "Alles anzeigen" holt das volle CRM zurück.
  const links = user.beginnerMode
    ? [
        { href: "/namen", label: "Namen" },
        { href: "/heute", label: "Heute" },
        { href: "/leaderboard", label: "Wettbewerb" },
      ]
    : [
        { href: "/namen", label: "Namen" },
        { href: "/heute", label: "Heute" },
        { href: "/pipeline", label: "Pipeline" },
        { href: "/vorgaenge", label: "Vorgänge" },
        { href: "/contacts", label: "Kontakte" },
        { href: "/focus", label: "🎯 Fokus" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/trichter", label: "Trichter" },
        { href: "/leaderboard", label: "Wettbewerb" },
        ...(user.role === "ADMIN"
          ? [{ href: "/team", label: "Team" }, { href: "/report", label: "Bericht" }]
          : []),
      ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Wordmark onDark sub="Beraterbereich" />
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <CommandPalette searchAction={searchContacts} />
            <form action={logout}>
              {/* Am Handy nur das Symbol – der Text sprengt sonst die Kopfzeile. */}
              <button
                type="submit"
                aria-label="Abmelden"
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-2 text-sm font-medium text-slate-300 transition hover:bg-white/6 hover:text-white sm:px-3.5"
              >
                <LogoutIcon className="h-4.5 w-4.5 sm:hidden" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </form>
          </div>
        </div>
        {/* Navigation ueber die volle Breite: neben der Wortmarke wird es fuer
            zehn Eintraege zu eng, dann scrollt die Leiste unnoetig. */}
        <div className="mx-auto flex max-w-6xl items-center gap-2 border-t border-white/10 px-4 pb-1.5 pt-0.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <NavLinks links={links} />
          </div>
          <form action={setBeginnerMode} className="shrink-0">
            <input type="hidden" name="on" value={user.beginnerMode ? "0" : "1"} />
            <button
              type="submit"
              className={`min-h-11 whitespace-nowrap rounded-full px-3 text-xs font-medium text-slate-400 transition hover:bg-white/6 hover:text-white ${
                user.beginnerMode ? "" : "hidden sm:inline-flex sm:items-center"
              }`}
            >
              {user.beginnerMode ? "Alles anzeigen" : "Einfache Ansicht"}
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      {/* Liegt ueber allem und meldet sich nur, wenn es etwas zurueckzunehmen gibt. */}
      <UndoBar />
    </div>
  );
}
