import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  CONTACT_STAGES,
  contactStageLabels,
  isContactStage,
} from "@/lib/pipeline";
import { berlinToday, dueState, hasTimeOfDay } from "@/lib/dates";
import StageBadge from "@/components/StageBadge";
import NextStepBadge from "@/components/NextStepBadge";
import { BellIcon, PlusIcon, UsersIcon } from "@/components/icons";
import { btnPrimary, btnSecondary, card, filterPill, pageTitle, td, th } from "@/components/ui";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; verloren?: string }>;
}) {
  const user = await requireUser();
  const { stage, verloren } = await searchParams;
  const stageFilter = stage && isContactStage(stage) ? stage : undefined;
  const showLost = verloren === "1";

  const contacts = await prisma.contact.findMany({
    where: {
      ...eigene(user.id).kontakte,
      ...(stageFilter ? { stage: stageFilter } : {}),
      ...(showLost ? { outcome: "VERLOREN" as const } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { activities: true, deals: true } } },
  });
  const today = berlinToday();

  const query = (next: { stage?: string; verloren?: boolean }) => {
    const params = new URLSearchParams();
    const nextStage = next.stage ?? stageFilter;
    const nextLost = next.verloren ?? showLost;
    if (nextStage) params.set("stage", nextStage);
    if (nextLost) params.set("verloren", "1");
    const search = params.toString();
    return search ? `/contacts?${search}` : "/contacts";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Kontakte</h1>
          <p className="mt-1 text-sm text-slate-500">
            {contacts.length} {contacts.length === 1 ? "Kontakt" : "Kontakte"}
            {stageFilter ? ` in „${contactStageLabels[stageFilter]}“` : " insgesamt"}
            {showLost ? " · nur verlorene" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/contacts/import" className={btnSecondary}>
            CSV Import
          </Link>
          <Link href="/contacts/new" className={btnPrimary}>
            <PlusIcon className="h-4 w-4" />
            Neuer Kontakt
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        <Link href={query({ stage: "" })} className={filterPill(!stageFilter)}>
          Alle
        </Link>
        {CONTACT_STAGES.map((value) => (
          <Link
            key={value}
            href={query({ stage: value })}
            className={filterPill(stageFilter === value)}
          >
            {contactStageLabels[value]}
          </Link>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        <Link href={query({ verloren: !showLost })} className={filterPill(showLost)}>
          Verlorene
        </Link>
      </div>

      {contacts.length === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-16 text-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-600">
            <UsersIcon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-900">
            {stageFilter || showLost
              ? "Keine Kontakte in dieser Auswahl"
              : "Noch keine Kontakte"}
          </p>
          <Link href="/contacts/new" className={`${btnPrimary} mt-6`}>
            <PlusIcon className="h-4 w-4" />
            Kontakt anlegen
          </Link>
        </div>
      ) : (
        <>
          {/* Handy: Karten statt seitwärts scrollender Tabelle. */}
          <ul className="space-y-3 sm:hidden">
            {contacts.map((contact) => (
              <li key={contact.id} className={`${card} p-4`}>
                <Link href={`/contacts/${contact.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      {contact.name}
                    </span>
                    <StageBadge stage={contact.stage} outcome={contact.outcome} />
                  </div>
                  {contact.phone && (
                    <p className="mt-1 text-sm text-slate-600">{contact.phone}</p>
                  )}
                  {contact.nextStepType && contact.nextStepAt && (
                    <div className="mt-2">
                      <NextStepBadge
                        type={contact.nextStepType}
                        at={contact.nextStepAt}
                        state={dueState(contact.nextStepAt, today)}
                        withTime={hasTimeOfDay(contact.nextStepAt)}
                      />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {contact._count.activities} Aktivitäten ·{" "}
                    {contact._count.deals} Vorgänge
                    {contact.source ? ` · ${contact.source}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className={`${card} hidden overflow-x-auto sm:block`}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/60">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Kontakt</th>
                  <th className={th}>Phase</th>
                  <th className={th}>Nächster Schritt</th>
                  <th className={`${th} text-right`}>Vorgänge</th>
                  <th className={th}>
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="group transition hover:bg-navy-50/40">
                    <td className={td}>
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
                          {initials(contact.name)}
                        </span>
                        <span className="font-medium text-slate-900 group-hover:text-navy-700">
                          {contact.name}
                        </span>
                        {contact.nextStepAt &&
                          contact.outcome !== "VERLOREN" &&
                          dueState(contact.nextStepAt, today) === "overdue" && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20"
                              title="Schritt überfällig"
                            >
                              <BellIcon className="h-3 w-3" />
                              fällig
                            </span>
                          )}
                      </Link>
                    </td>
                    <td className={`${td} text-slate-600`}>
                      <div className="space-y-0.5">
                        {contact.phone && <p>{contact.phone}</p>}
                        {contact.email && (
                          <p className="text-xs text-slate-500">{contact.email}</p>
                        )}
                        {!contact.phone && !contact.email && "–"}
                      </div>
                    </td>
                    <td className={td}>
                      <StageBadge stage={contact.stage} outcome={contact.outcome} />
                    </td>
                    <td className={td}>
                      {contact.nextStepType && contact.nextStepAt ? (
                        <NextStepBadge
                          type={contact.nextStepType}
                          at={contact.nextStepAt}
                          state={dueState(contact.nextStepAt, today)}
                          withTime={hasTimeOfDay(contact.nextStepAt)}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">–</span>
                      )}
                    </td>
                    <td className={`${td} text-right tabular-nums text-slate-600`}>
                      {contact._count.deals}
                    </td>
                    <td className={`${td} text-right`}>
                      <Link
                        href={`/contacts/${contact.id}/edit`}
                        className="text-sm font-medium text-navy-600 hover:underline"
                      >
                        Bearbeiten
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
