import { prisma } from "@/lib/prisma";
import { login } from "./actions";
import { LogoMark } from "@/components/Logo";
import { LockIcon } from "@/components/icons";
import { btnPrimary, input, label } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, userCount] = await Promise.all([
    searchParams,
    prisma.user.count(),
  ]);
  const isFirstSetup = userCount === 0;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f8f9] p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="h-12 w-12" />
            <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-slate-900">
              {isFirstSetup ? "Admin-Konto einrichten" : "Ergo CRM"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isFirstSetup
                ? "Nutze das bisherige APP_PASSWORD, um die vorhandenen Daten zu übernehmen."
                : "Melde dich mit deinem persönlichen Teamkonto an."}
            </p>
          </div>

          <form action={login} className="mt-8 space-y-4">
            {isFirstSetup && (
              <div>
                <label htmlFor="name" className={label}>
                  Dein Name
                </label>
                <input id="name" name="name" type="text" required maxLength={60} autoFocus className={input} />
              </div>
            )}
            <div>
              <label htmlFor="email" className={label}>
                E-Mail-Adresse
              </label>
              <input id="email" name="email" type="email" autoFocus={!isFirstSetup} autoComplete="email" className={input} />
            </div>
            <div>
              <label htmlFor="password" className={label}>
                Passwort
              </label>
              <input id="password" name="password" type="password" required autoComplete={isFirstSetup ? "new-password" : "current-password"} className={input} />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
                Anmeldedaten sind nicht korrekt. Bitte erneut versuchen.
              </p>
            )}

            <button type="submit" className={`${btnPrimary} w-full`}>
              <LockIcon className="h-4 w-4" />
              {isFirstSetup ? "Admin-Konto erstellen" : "Anmelden"}
            </button>
          </form>
          {!isFirstSetup && (
            <p className="mt-4 text-center text-xs text-slate-500">
              Für den separaten Berichtszugang genügt das Berichts-Passwort.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Neue Teamkonten werden von einem Admin angelegt.
        </p>
      </div>
    </main>
  );
}
