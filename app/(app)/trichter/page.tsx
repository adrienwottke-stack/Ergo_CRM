import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sichtbarkeit } from "@/lib/scope";
import type { LostReason } from "@/lib/generated/prisma/enums";
import {
  CONTACT_STAGES,
  DEAL_STAGES,
  contactStageIndex,
  contactStageLabels,
  contactStagePalette,
  dealStageLabels,
  isContactStage,
  lostReasonLabels,
} from "@/lib/pipeline";
import { card, filterPill, kicker, pageTitle, td, th } from "@/components/ui";
import SectionTabs from "@/components/SectionTabs";
import { ZAHLEN_TABS } from "@/lib/nav";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function percent(part: number, whole: number): string {
  if (whole === 0) return "–";
  return `${Math.round((part / whole) * 100)} %`;
}

export default async function TrichterPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const user = await requireUser();
  const { team } = await searchParams;
  const isAdmin = user.role === "ADMIN";
  const teamView = isAdmin && team === "1";
  // Frueher stand hier `teamView ? {} : { ownerId: user.id }` – eine unbegrenzte
  // Abfrage ueber alle Konten inklusive der Kontakte ohne Eigentuemer.
  const sicht = await sichtbarkeit(user, teamView ? "ALLE" : "EIGENE");
  const scope = sicht.kontakte;

  const [contacts, events, deals, owners] = await Promise.all([
    prisma.contact.findMany({
      where: scope,
      select: {
        id: true,
        stage: true,
        outcome: true,
        lostReason: true,
        ownerId: true,
        createdAt: true,
      },
    }),
    prisma.stageEvent.findMany({
      where: { contactId: { not: null }, contact: { is: scope } },
      select: { contactId: true, toStage: true, at: true },
      orderBy: { at: "asc" },
    }),
    prisma.deal.findMany({
      where: { contact: { is: scope } },
      select: { stage: true, outcome: true, units: true, lostReason: true },
    }),
    teamView
      ? prisma.user.findMany({
          where: { id: { in: sicht.beraterIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  // Hoechste je erreichte Phase pro Kontakt – inklusive Rueckspruengen und
  // migrierter Altkontakte (die tragen ein Start-Ereignis aus der Migration).
  const maxReached = new Map<string, number>();
  const firstReachedAt = new Map<string, Map<number, Date>>();

  for (const contact of contacts) {
    maxReached.set(contact.id, contactStageIndex(contact.stage));
    firstReachedAt.set(contact.id, new Map());
  }
  for (const event of events) {
    if (!event.contactId || !isContactStage(event.toStage)) continue;
    const index = contactStageIndex(event.toStage);
    const current = maxReached.get(event.contactId);
    if (current === undefined) continue;
    if (index > current) maxReached.set(event.contactId, index);
    const perContact = firstReachedAt.get(event.contactId)!;
    if (!perContact.has(index)) perContact.set(index, event.at);
  }

  const createdAtById = new Map(contacts.map((c) => [c.id, c.createdAt]));

  const funnel = CONTACT_STAGES.map((stage, index) => {
    const reachedIds = contacts
      .filter((contact) => (maxReached.get(contact.id) ?? 0) >= index)
      .map((contact) => contact.id);

    const durations = reachedIds
      .map((id) => {
        const at = firstReachedAt.get(id)?.get(index);
        const created = createdAtById.get(id);
        if (!at || !created) return null;
        return (at.getTime() - created.getTime()) / DAY_MS;
      })
      .filter((value): value is number => value !== null && value >= 0);

    return {
      stage,
      index,
      reached: reachedIds.length,
      avgDays:
        durations.length > 0
          ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
          : null,
      lostHere: contacts.filter(
        (contact) => contact.outcome === "VERLOREN" && contact.stage === stage
      ).length,
    };
  });

  const lostByReason = new Map<LostReason, number>();
  for (const contact of contacts) {
    if (contact.outcome !== "VERLOREN" || !contact.lostReason) continue;
    lostByReason.set(
      contact.lostReason,
      (lostByReason.get(contact.lostReason) ?? 0) + 1
    );
  }
  const lostTotal = [...lostByReason.values()].reduce((sum, value) => sum + value, 0);

  const reachedAppointment = funnel[2]!.reached;
  const noShows = lostByReason.get("TERMIN_GEPLATZT") ?? 0;

  const dealFunnel = DEAL_STAGES.map((stage) => {
    const items = deals.filter((deal) => deal.stage === stage);
    return {
      stage,
      count: items.length,
      units: items.reduce((sum, deal) => sum + (deal.units ?? 0), 0),
    };
  });
  const dealsWon = deals.filter((deal) => deal.outcome === "GEWONNEN");
  const dealsLost = deals.filter((deal) => deal.outcome === "VERLOREN");

  const nameById = new Map(owners.map((owner) => [owner.id, owner.name]));
  const perOwner = teamView
    ? [...new Set(contacts.map((contact) => contact.ownerId))].map((ownerId) => {
        const own = contacts.filter((contact) => contact.ownerId === ownerId);
        const customers = own.filter(
          (contact) => contactStageIndex(contact.stage) >= 4
        ).length;
        return {
          ownerId,
          name: ownerId ? (nameById.get(ownerId) ?? "Unbekannt") : "Ohne Zuordnung",
          total: own.length,
          open: own.filter((contact) => contact.outcome === "OFFEN").length,
          customers,
          lost: own.filter((contact) => contact.outcome === "VERLOREN").length,
        };
      })
    : [];

  return (
    <div className="space-y-6">
      <SectionTabs tabs={ZAHLEN_TABS} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Trichter</h1>
          <p className="mt-1 text-sm text-slate-500">
            Wo Kontakte hängen bleiben – aus der Phasenhistorie berechnet.
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Link href="/trichter" className={filterPill(!teamView)}>
              Nur meine
            </Link>
            <Link href="/trichter?team=1" className={filterPill(teamView)}>
              Ganzes Team
            </Link>
          </div>
        )}
      </div>

      <section className={`${card} p-6 sm:p-7`}>
        <h2 className="text-sm font-semibold text-slate-900">Kontakt-Phasen</h2>
        <p className="mt-1 text-sm text-slate-500">
          „Erreicht“ zählt jeden Kontakt, der diese Phase mindestens einmal hatte.
        </p>

        <ul className="mt-5 space-y-4">
          {funnel.map((entry, index) => {
            const previous = index > 0 ? funnel[index - 1]! : null;
            const share = funnel[0]!.reached
              ? (entry.reached / funnel[0]!.reached) * 100
              : 0;
            return (
              <li key={entry.stage}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {contactStageLabels[entry.stage]}
                  </span>
                  <span className="text-sm tabular-nums text-slate-900">
                    <span className="font-semibold">{entry.reached}</span>
                    {previous && (
                      <span className="ml-2 text-xs text-slate-500">
                        {percent(entry.reached, previous.reached)} von zuvor
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${contactStagePalette[entry.stage].bar}`}
                    style={{ width: `${entry.reached > 0 ? Math.max(share, 2) : 0}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.avgDays !== null
                    ? `Ø ${entry.avgDays} Tage bis hierher`
                    : "Keine Zeitdaten"}
                  {entry.lostHere > 0 && ` · ${entry.lostHere} hier verloren`}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${card} p-6 sm:p-7`}>
          <h2 className="text-sm font-semibold text-slate-900">Verlustgründe</h2>
          {lostTotal === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Noch keine Absagen erfasst.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {[...lostByReason.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => (
                  <li key={reason}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-700">
                        {lostReasonLabels[reason]}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-slate-900">
                        {count}
                        <span className="ml-1.5 font-normal text-slate-400">
                          · {percent(count, lostTotal)}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-400"
                        style={{ width: `${Math.max((count / lostTotal) * 100, 2)}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          )}
          <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <span className="font-semibold">Geplatzte Termine:</span> {noShows} von{" "}
            {reachedAppointment} vereinbarten ({percent(noShows, reachedAppointment)}).
          </p>
        </section>

        <section className={`${card} p-6 sm:p-7`}>
          <h2 className="text-sm font-semibold text-slate-900">Vorgänge</h2>
          <div className="mt-4 space-y-3">
            {dealFunnel.map((entry) => (
              <div key={entry.stage} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-700">
                  {dealStageLabels[entry.stage]}
                </span>
                <span className="text-sm tabular-nums text-slate-900">
                  <span className="font-semibold">{entry.count}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {entry.units} Einheiten
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <p className={kicker}>Gewonnen</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
                {dealsWon.length}
              </p>
              <p className="text-xs text-slate-500">
                {dealsWon.reduce((sum, deal) => sum + (deal.units ?? 0), 0)} Einheiten
              </p>
            </div>
            <div>
              <p className={kicker}>Verloren</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
                {dealsLost.length}
              </p>
              <p className="text-xs text-slate-500">
                Abschlussquote{" "}
                {percent(dealsWon.length, dealsWon.length + dealsLost.length)}
              </p>
            </div>
          </div>
        </section>
      </div>

      {teamView && perOwner.length > 0 && (
        <section className={`${card} overflow-x-auto`}>
          <div className="p-6 pb-0 sm:p-8 sm:pb-0">
            <h2 className="text-sm font-semibold text-slate-900">Nach Person</h2>
          </div>
          <table className="mt-4 w-full min-w-[560px] text-left text-sm">
            <thead className="border-y border-slate-200/80 bg-slate-50/60">
              <tr>
                <th className={th}>Name</th>
                <th className={`${th} text-right`}>Kontakte</th>
                <th className={`${th} text-right`}>Offen</th>
                <th className={`${th} text-right`}>Kunden</th>
                <th className={`${th} text-right`}>Verloren</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perOwner
                .sort((a, b) => b.customers - a.customers)
                .map((row) => (
                  <tr key={row.ownerId ?? "none"}>
                    <td className={`${td} font-medium text-slate-900`}>{row.name}</td>
                    <td className={`${td} text-right tabular-nums`}>{row.total}</td>
                    <td className={`${td} text-right tabular-nums`}>{row.open}</td>
                    <td className={`${td} text-right tabular-nums`}>{row.customers}</td>
                    <td className={`${td} text-right tabular-nums`}>{row.lost}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
