import { logout } from "@/app/login/actions";
import { requireUser } from "@/lib/auth";
import { Wordmark } from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import CommandPalette from "@/components/CommandPalette";
import { searchContacts } from "@/app/(app)/contacts/actions";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/focus", label: "🎯 Fokus" },
    { href: "/contacts", label: "Kontakte" },
    { href: "/leaderboard", label: "Wettbewerb" },
    ...(user.role === "ADMIN"
      ? [{ href: "/team", label: "Team" }, { href: "/report", label: "Bericht" }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Wordmark onDark sub="Beraterbereich" />
            <div className="hidden sm:block"><NavLinks links={links} /></div>
          </div>
          <div className="flex items-center gap-3">
            <CommandPalette searchAction={searchContacts} />
            <form action={logout}>
              <button type="submit" className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/6 hover:text-white">Abmelden</button>
            </form>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 pb-2 pt-1 sm:hidden"><NavLinks links={links} /></div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
