import { logout } from "@/app/login/actions";
import { requireOnboardedUser } from "@/lib/auth";
import { Wordmark } from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import { LogoutIcon } from "@/components/icons";

export default async function TeamLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Auch hier die Willkommens-Weiche - sonst umgeht /leaderboard den Start.
  const user = await requireOnboardedUser();
  // Arena und Rangliste stehen bewusst nebeneinander: welche der beiden Ansichten
  // bleibt, entscheidet die Werkstatt und nicht wir (docs/wettbewerb-plan.md,
  // Abschnitt 14).
  const links = [
    { href: "/log", label: "Meine Aktivitäten" },
    { href: "/arena", label: "Arena" },
    { href: "/leaderboard", label: "Rangliste" },
    { href: "/werkstatt", label: "Werkstatt" },
    { href: "/dashboard", label: "CRM" },
    ...(user.role === "ADMIN" ? [{ href: "/team", label: "Team" }] : []),
  ];
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Wordmark sub="Team-Wettbewerb" />
            <div className="hidden min-w-0 sm:block"><NavLinks links={links} /></div>
          </div>
          <form action={logout} className="shrink-0">
            <button
              type="submit"
              aria-label="Abmelden"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:px-3"
            >
              <LogoutIcon className="h-4.5 w-4.5 sm:hidden" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </form>
        </div>
        <div className="px-4 sm:hidden"><NavLinks links={links} /></div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
