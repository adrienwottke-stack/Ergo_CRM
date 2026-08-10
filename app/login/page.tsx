import { login } from "./actions";
import { LogoMark } from "@/components/Logo";
import { LockIcon } from "@/components/icons";
import { btnPrimary, input, label } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 40rem at 70% -10%, rgb(58 107 164 / 0.35), transparent 60%), radial-gradient(40rem 30rem at 10% 110%, rgb(169 127 36 / 0.18), transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="h-12 w-12" />
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
              Ergo CRM
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Kontakt-Tracking & Team-Wettbewerb
            </p>
          </div>

          <form action={login} className="mt-8 space-y-4">
            <div>
              <label htmlFor="password" className={label}>
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                placeholder="••••••••••••"
                className={input}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/10"
              >
                Falsches Passwort, bitte erneut versuchen.
              </p>
            )}

            <button type="submit" className={`${btnPrimary} w-full`}>
              <LockIcon className="h-4 w-4" />
              Anmelden
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Mit dem Team-Passwort geht es direkt zum Wettbewerb.
        </p>
      </div>
    </main>
  );
}
