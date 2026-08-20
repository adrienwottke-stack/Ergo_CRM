import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ebene, liegtImAst } from "@/lib/struktur";
import { btnPrimary, card, input, label, pageTitle, sectionTitle, td, th } from "@/components/ui";
import {
  beraterUmhaengen,
  createTeamMember,
  einladungBrowserFreigabe,
  einladungErzeugen,
  einladungZuruecknehmen,
} from "./actions";

export const dynamic = "force-dynamic";

const createdFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

const fehlertexte: Record<string, string> = {
  exists: "E-Mail-Adresse oder Name ist bereits einem Konto zugeordnet.",
  invalid: "Bitte prüfe Name, E-Mail-Adresse und Passwort.",
  sich_selbst: "Ein Berater kann nicht seine eigene Führungskraft sein.",
  eigener_ast:
    "Das würde einen Kreis erzeugen: die gewählte Führungskraft hängt selbst unter diesem Berater.",
  unbekannt: "Konto nicht gefunden.",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    moved?: string;
    invited?: string;
    revoked?: string;
  }>;
}) {
  await requireAdmin();
  const [{ error, created, moved, invited, revoked }, kopfzeilen, users, invites] =
    await Promise.all([
      searchParams,
      headers(),
      prisma.user.findMany({
        // Nach Pfad sortiert steht der Baum von selbst richtig herum: jede
        // Führungskraft unmittelbar vor ihren Leuten.
        orderBy: { path: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          path: true,
          leaderId: true,
          startedAt: true,
          createdAt: true,
          visibility: true,
          deactivatedAt: true,
          person: { select: { _count: { select: { dailyLogs: true } } } },
          _count: { select: { contacts: true, team: true } },
        },
      }),
      prisma.invite.findMany({
        // "Noch Platz" laesst sich nicht als Spaltenvergleich abfragen
        // (usedCount < maxUses) - deshalb grob vorfiltern und unten in
        // JavaScript nachschaerfen. Die Tabelle ist klein.
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          code: true,
          note: true,
          expiresAt: true,
          maxUses: true,
          usedCount: true,
          browserFreigabe: true,
          leader: { select: { name: true } },
        },
      }),
    ]);

  const nameById = new Map(users.map((user) => [user.id, user.name]));
  // Nachschaerfen: nur Einladungen mit Restplaetzen (maxUses NULL = unbegrenzt).
  const offeneInvites = invites.filter(
    (invite) => invite.maxUses === null || invite.usedCount < invite.maxUses
  );
  // Der Link muss vollstaendig dastehen, damit er sich weiterschicken laesst.
  const herkunft = `${kopfzeilen.get("x-forwarded-proto") ?? "http"}://${kopfzeilen.get("host") ?? ""}`;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className={pageTitle}>Struktur verwalten</h1>
        <p className="mt-1 text-sm text-slate-500">
          Wer Berater unter sich hat, ist Führungskraft – eine eigene Rolle dafür gibt es
          nicht. Kontakte bleiben in jedem Fall privat; eine Führungskraft sieht Zahlen,
          keine Kundennamen.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
          {fehlertexte[error] ?? fehlertexte.invalid}
        </p>
      )}
      {created && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/10">
          Teamkonto wurde angelegt.
        </p>
      )}
      {moved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/10">
          Berater wurde umgehängt.
        </p>
      )}
      {invited && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/10">
          Einladung erzeugt – der Link steht unten.
        </p>
      )}
      {revoked && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/10">
          Einladung zurückgenommen.
        </p>
      )}

      <section className={`${card} space-y-5 p-6 sm:p-8`}>
        <div>
          <h2 className={sectionTitle}>Einladen</h2>
          <p className="mt-1 text-sm text-slate-500">
            Der Eingeladene setzt Name und Passwort selbst und hängt danach automatisch
            unter der gewählten Führungskraft. Ein Code, eine Nutzung, 14 Tage gültig.
            Er startet in der einfachen Ansicht – Namen, Heute, Wettbewerb – und holt
            sich den Rest mit einem Tipp auf „Alles anzeigen“.
          </p>
        </div>

        <form action={einladungErzeugen} className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="inviteNote" className={label}>Notiz (nur für dich)</label>
            <input
              id="inviteNote"
              name="note"
              type="text"
              maxLength={80}
              placeholder="Max aus dem Infoabend"
              className={input}
            />
          </div>
          <div>
            <label htmlFor="inviteLeaderId" className={label}>Hängt unter</label>
            <select id="inviteLeaderId" name="leaderId" className={input} defaultValue="">
              <option value="">Mir selbst</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className={`${btnPrimary} min-h-[44px]`}>Link erzeugen</button>
        </form>

        {offeneInvites.length > 0 && (
          <ul className="space-y-3 border-t border-slate-100 pt-5">
            {offeneInvites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <code className="block break-all text-sm font-medium text-slate-900">
                    {herkunft}/einladung/{invite.code}
                  </code>
                  <p className="mt-0.5 text-xs text-slate-500">
                    für {invite.leader.name}
                    {invite.note ? ` · ${invite.note}` : ""} · gültig bis{" "}
                    {createdFormat.format(invite.expiresAt)}
                    {invite.maxUses === null
                      ? ` · Mehrfach-Code, ${invite.usedCount}× eingelöst`
                      : invite.maxUses > 1
                        ? ` · ${invite.usedCount} von ${invite.maxUses} eingelöst`
                        : ""}
                    {invite.browserFreigabe ? " · ohne App-Pflicht" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {/* Notausgang: nur anfassen, wenn ein Geraet die Installation
                      wirklich nicht schafft. Sonst bleibt die Schleuse zu. */}
                  <form action={einladungBrowserFreigabe}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <input type="hidden" name="on" value={invite.browserFreigabe ? "0" : "1"} />
                    <button
                      type="submit"
                      className="min-h-[44px] rounded-lg px-3 text-xs font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    >
                      {invite.browserFreigabe ? "App-Pflicht zurück" : "Ohne App erlauben"}
                    </button>
                  </form>
                  <form action={einladungZuruecknehmen}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button
                      type="submit"
                      className="min-h-[44px] rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-red-700"
                    >
                      Zurücknehmen
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={createTeamMember} className={`${card} space-y-5 p-6 sm:p-8`}>
        <div>
          <h2 className={sectionTitle}>Teammitglied anlegen</h2>
          <p className="mt-1 text-sm text-slate-500">
            Das Mitglied meldet sich danach mit E-Mail-Adresse und dem hier gesetzten
            Startpasswort an.
          </p>
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
          <div>
            <label htmlFor="password" className={label}>Startpasswort (mindestens 8 Zeichen)</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={input} />
          </div>
          <div>
            <label htmlFor="leaderId" className={label}>Führungskraft</label>
            <select id="leaderId" name="leaderId" className={input} defaultValue="">
              <option value="">Ich selbst</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button type="submit" className={btnPrimary}>Konto anlegen</button>
        </div>
      </form>

      <section className={`${card} overflow-x-auto`}>
        <div className="p-6 pb-0 sm:p-8 sm:pb-0">
          <h2 className={sectionTitle}>Struktur ({users.length})</h2>
          <p className="mt-1 text-sm text-slate-500">
            Einrückung zeigt die Ebene. Umhängen schreibt den ganzen Ast mit.
          </p>
        </div>
        <table className="mt-4 w-full min-w-[760px] text-left text-sm">
          <thead className="border-y border-slate-200/80 bg-slate-50/60">
            <tr>
              <th className={th}>Name</th>
              <th className={th}>E-Mail</th>
              <th className={th}>Rolle</th>
              <th className={`${th} text-right`}>Eigene Kontakte</th>
              <th className={`${th} text-right`}>Ranglisten-Einträge</th>
              <th className={th}>Führungskraft</th>
              <th className={th}>Dabei seit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              // Kandidaten: alle ausser dem Berater selbst und allem, was unter
              // ihm haengt - sonst entstuende ein Kreis.
              const kandidaten = users.filter(
                (kandidat) =>
                  kandidat.id !== user.id && !liegtImAst(kandidat.path, user.path)
              );
              return (
                <tr key={user.id} className="transition hover:bg-navy-50/40">
                  <td className={`${td} font-medium text-slate-900`}>
                    <span style={{ paddingLeft: `${ebene(user.path) * 16}px` }} className="inline-block">
                      {user.name}
                      {user._count.team > 0 && (
                        <span className="ml-2 rounded-full bg-navy-50 px-2 py-0.5 text-xs font-normal text-navy-700">
                          führt {user._count.team}
                        </span>
                      )}
                      {user.deactivatedAt && (
                        <span className="ml-2 text-xs font-normal text-slate-400">ausgetreten</span>
                      )}
                    </span>
                  </td>
                  <td className={`${td} text-slate-600`}>{user.email}</td>
                  <td className={td}>{user.role === "ADMIN" ? "Admin" : "Mitglied"}</td>
                  <td className={`${td} text-right tabular-nums text-slate-600`}>{user._count.contacts}</td>
                  <td className={`${td} text-right tabular-nums text-slate-600`}>{user.person?._count.dailyLogs ?? 0}</td>
                  <td className={td}>
                    <form action={beraterUmhaengen} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="leaderId"
                        defaultValue={user.leaderId ?? ""}
                        aria-label={`Führungskraft von ${user.name}`}
                        className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700"
                      >
                        <option value="">— keine (Wurzel)</option>
                        {kandidaten.map((kandidat) => (
                          <option key={kandidat.id} value={kandidat.id}>{kandidat.name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="min-h-[44px] rounded-lg px-3 text-sm font-medium text-navy-700 hover:bg-navy-50"
                      >
                        Setzen
                      </button>
                    </form>
                    {user.leaderId && (
                      <span className="sr-only">{nameById.get(user.leaderId) ?? ""}</span>
                    )}
                  </td>
                  <td className={`${td} text-slate-500`}>
                    {createdFormat.format(user.startedAt ?? user.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
