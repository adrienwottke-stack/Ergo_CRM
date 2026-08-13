import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { btnPrimary, card, input, label, pageTitle, sectionTitle, td, th } from "@/components/ui";
import { createTeamMember } from "./actions";

export const dynamic = "force-dynamic";

const createdFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  await requireAdmin();
  const [{ error, created }, users] = await Promise.all([
    searchParams,
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: { person: { select: { _count: { select: { dailyLogs: true } } } }, _count: { select: { contacts: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className={pageTitle}>Team verwalten</h1>
        <p className="mt-1 text-sm text-slate-500">Nur Admins legen persönliche CRM-Konten an. Kontakte bleiben jeweils privat.</p>
      </div>

      <form action={createTeamMember} className={`${card} space-y-5 p-6 sm:p-8`}>
        <div>
          <h2 className={sectionTitle}>Teammitglied anlegen</h2>
          <p className="mt-1 text-sm text-slate-500">Das Mitglied meldet sich danach mit E-Mail-Adresse und dem hier gesetzten Startpasswort an.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={label}>Name</label>
            <input id="name" name="name" type="text" required maxLength={60} className={input} />
          </div>
          <div>
            <label htmlFor="email" className={label}>E-Mail-Adresse</label>
            <input id="email" name="email" type="email" required className={input} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="password" className={label}>Startpasswort (mindestens 8 Zeichen)</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={input} />
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
            {error === "exists" ? "E-Mail-Adresse oder Name ist bereits einem Konto zugeordnet." : "Bitte prüfe Name, E-Mail-Adresse und Passwort."}
          </p>
        )}
        {created && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/10">Teamkonto wurde angelegt.</p>}
        <div className="flex justify-end border-t border-slate-100 pt-5"><button type="submit" className={btnPrimary}>Konto anlegen</button></div>
      </form>

      <section className={`${card} overflow-x-auto`}>
        <div className="p-6 pb-0 sm:p-8 sm:pb-0"><h2 className={sectionTitle}>Konten ({users.length})</h2></div>
        <table className="mt-4 w-full min-w-[640px] text-left text-sm">
          <thead className="border-y border-slate-200/80 bg-slate-50/60"><tr><th className={th}>Name</th><th className={th}>E-Mail</th><th className={th}>Rolle</th><th className={`${th} text-right`}>Eigene Kontakte</th><th className={`${th} text-right`}>Ranglisten-Einträge</th><th className={th}>Angelegt</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => <tr key={user.id} className="transition hover:bg-navy-50/40"><td className={`${td} font-medium text-slate-900`}>{user.name}</td><td className={`${td} text-slate-600`}>{user.email}</td><td className={td}>{user.role === "ADMIN" ? "Admin" : "Mitglied"}</td><td className={`${td} text-right tabular-nums text-slate-600`}>{user._count.contacts}</td><td className={`${td} text-right tabular-nums text-slate-600`}>{user.person?._count.dailyLogs ?? 0}</td><td className={`${td} text-slate-500`}>{createdFormat.format(user.createdAt)}</td></tr>)}
          </tbody>
        </table>
      </section>
    </div>
  );
}
