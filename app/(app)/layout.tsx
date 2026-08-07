import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-6">
            <span className="text-sm font-semibold tracking-tight">
              Ergo CRM
            </span>
            <Link
              href="/dashboard"
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Dashboard
            </Link>
            <Link
              href="/contacts"
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Kontakte
            </Link>
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
