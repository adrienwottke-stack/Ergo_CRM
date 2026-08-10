import Link from "next/link";
import { cookies } from "next/headers";
import { logout } from "@/app/login/actions";
import { authCookieName, authTokenValue } from "@/lib/auth";

export default async function TeamLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const fullToken = cookieStore.get(authCookieName)?.value;
  const hasFullAccess = !!fullToken && fullToken === (await authTokenValue());

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-6">
            <span className="text-sm font-semibold tracking-tight">
              Ergo Wettbewerb
            </span>
            <Link
              href="/log"
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Loggen
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Rangliste
            </Link>
            {hasFullAccess && (
              <Link
                href="/dashboard"
                className="text-sm text-stone-600 hover:text-stone-900"
              >
                CRM
              </Link>
            )}
          </nav>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-stone-500 hover:text-stone-900"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
