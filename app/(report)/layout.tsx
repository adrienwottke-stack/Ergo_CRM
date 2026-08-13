import { logout } from "@/app/login/actions";
import { currentUser } from "@/lib/auth";
import { Wordmark } from "@/components/Logo";
import NavLinks from "@/components/NavLinks";

export default async function ReportLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-950 print:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Wordmark onDark sub="Tätigkeitsbericht" />
            {user?.role === "ADMIN" && <NavLinks links={[{ href: "/dashboard", label: "CRM" }]} />}
          </div>
          <form action={logout}>
            <button type="submit" className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/6 hover:text-white">Abmelden</button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
