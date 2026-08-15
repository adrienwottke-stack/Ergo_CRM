import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  addDays,
  berlinToday,
  dayToUtcDate,
  dueState,
  hasTimeOfDay,
  utcToBerlinLocalInput,
  type DueState,
} from "@/lib/dates";
import { dealLineShortLabels, formatEuro } from "@/lib/pipeline";
import StageBadge from "@/components/StageBadge";
import NextStepBadge from "@/components/NextStepBadge";
import ContactActions from "@/components/ContactActions";
import DealActions from "@/components/DealActions";
import type { ContactLite } from "@/components/ContactActionDialog";
import type { DealLite } from "@/components/DealActionDialog";
import { card, pageTitle } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function HeutePage() {
  const user = await requireUser();
  const sicht = eigene(user.id);
  const today = berlinToday();
  const horizon = addDays(dayToUtcDate(today), 8);

  const [contacts, deals, stepless] = await Promise.all([
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: { not: null },
        nextStepAt: { lt: horizon },
      },
      orderBy: { nextStepAt: "asc" },
    }),
    prisma.deal.findMany({
      where: {
        ...sicht.ueberKontakt,
        outcome: "OFFEN",
        nextStepType: { not: null },
        nextStepAt: { lt: horizon },
      },
      orderBy: { nextStepAt: "asc" },
      include: { contact: { select: { id: true, name: true, phone: true } } },
    }),
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: null,
        outcome: { not: "VERLOREN" },
      },
      orderBy: { updatedAt: "asc" },
      include: { deals: { where: { outcome: "OFFEN" }, select: { id: true } } },
    }),
  ]);

  type Row =
    | { kind: "contact"; at: Date; due: DueState; data: (typeof contacts)[number] }
    | { kind: "deal"; at: Date; due: DueState; data: (typeof deals)[number] };

  const rows: Row[] = [
    ...contacts.map((data) => ({
      kind: "contact" as const,
      at: data.nextStepAt!,
      due: dueState(data.nextStepAt!, today),
      data,
    })),
    ...deals.map((data) => ({
      kind: "deal" as const,
      at: data.nextStepAt!,
      due: dueState(data.nextStepAt!, today),
      data,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  const groups: { key: DueState; title: string; hint: string; rows: Row[] }[] = [
    {
      key: "overdue",
      title: "Überfällig",
      hint: "Zuerst abarbeiten",
      rows: rows.filter((row) => row.due === "overdue"),
    },
    {
      key: "today",
      title: "Heute",
      hint: "Dein Tagespensum",
      rows: rows.filter((row) => row.due === "today"),
    },
    {
      key: "week",
      title: "Diese Woche",
      hint: "Kommt auf dich zu",
      rows: rows.filter((row) => row.due === "week"),
    },
  ];

  // In Beratung liegt der Schritt am Vorgang – das ist kein Versäumnis.
  const orphans = stepless.filter(
    (contact) => !(contact.stage === "IN_BERATUNG" && contact.deals.length > 0)
  );

  const openCount = groups[0]!.rows.length + groups[1]!.rows.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>Heute</h1>
        <p className="mt-1 text-sm text-slate-500">
          {openCount === 0
            ? "Nichts offen – alles abgearbeitet."
            : `${openCount} ${openCount === 1 ? "Schritt" : "Schritte"} offen (überfällig und heute).`}
        </p>
      </div>

      {rows.length === 0 && orphans.length === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-16 text-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckIcon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-900">
            Keine offenen Schritte
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Neue Kontakte legst du unter{" "}
            <Link href="/contacts/new" className="font-medium text-navy-600 hover:underline">
              Neuer Kontakt
            </Link>{" "}
            an.
          </p>
        </div>
      ) : (
        groups
          .filter((group) => group.rows.length > 0)
          .map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">
                  {group.title}
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    {group.rows.length}
                  </span>
                </h2>
                <span className="text-xs text-slate-500">{group.hint}</span>
              </div>

              <ul className="space-y-3">
                {group.rows.map((row) => {
                  if (row.kind === "contact") {
                    const contact = row.data;
                    const lite: ContactLite = {
                      id: contact.id,
                      name: contact.name,
                      phone: contact.phone,
                      stage: contact.stage,
                      outcome: contact.outcome,
                      appointmentLocal: contact.appointmentAt
                        ? utcToBerlinLocalInput(contact.appointmentAt)
                        : null,
                      hasStep: true,
                    };
                    return (
                      <li key={`c-${contact.id}`} className={`${card} p-4`}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-navy-700"
                          >
                            {contact.name}
                          </Link>
                          <StageBadge stage={contact.stage} outcome={contact.outcome} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <NextStepBadge
                            type={contact.nextStepType!}
                            at={contact.nextStepAt!}
                            state={row.due}
                            withTime={hasTimeOfDay(contact.nextStepAt!)}
                          />
                          {contact.nextStepNote && (
                            <span className="text-xs text-slate-500">
                              {contact.nextStepNote}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <ContactActions contact={lite} />
                        </div>
                      </li>
                    );
                  }

                  const deal = row.data;
                  const lite: DealLite = {
                    id: deal.id,
                    contactId: deal.contactId,
                    contactName: deal.contact.name,
                    line: deal.line,
                    title: deal.title,
                    stage: deal.stage,
                    outcome: deal.outcome,
                    hasStep: true,
                    monthlyPremiumInput:
                      deal.monthlyPremiumCents != null
                        ? (deal.monthlyPremiumCents / 100).toFixed(2).replace(".", ",")
                        : "",
                    units: deal.units,
                  };
                  return (
                    <li key={`d-${deal.id}`} className={`${card} p-4`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <Link
                          href={`/contacts/${deal.contactId}`}
                          className="text-sm font-semibold text-slate-900 hover:text-navy-700"
                        >
                          {deal.contact.name}
                        </Link>
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
                          Vorgang {dealLineShortLabels[deal.line]}
                          {deal.units ? ` · ${deal.units} Einh.` : ""}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <NextStepBadge
                          type={deal.nextStepType!}
                          at={deal.nextStepAt!}
                          state={row.due}
                          withTime={hasTimeOfDay(deal.nextStepAt!)}
                        />
                        {deal.nextStepNote && (
                          <span className="text-xs text-slate-500">{deal.nextStepNote}</span>
                        )}
                        {deal.monthlyPremiumCents != null && (
                          <span className="text-xs text-slate-500">
                            {formatEuro(deal.monthlyPremiumCents)} / Monat
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                        {deal.contact.phone && (
                          <a
                            href={`tel:${deal.contact.phone}`}
                            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Anrufen
                          </a>
                        )}
                        <DealActions deal={lite} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
      )}

      {orphans.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Ohne nächsten Schritt
              <span className="ml-2 text-sm font-normal text-slate-400">
                {orphans.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500">Fällt sonst durchs Raster</span>
          </div>
          <ul className="space-y-3">
            {orphans.slice(0, 25).map((contact) => (
              <li key={contact.id} className={`${card} border-red-200 p-4`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="text-sm font-semibold text-slate-900 hover:text-navy-700"
                  >
                    {contact.name}
                  </Link>
                  <StageBadge stage={contact.stage} outcome={contact.outcome} />
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <ContactActions
                    contact={{
                      id: contact.id,
                      name: contact.name,
                      phone: contact.phone,
                      stage: contact.stage,
                      outcome: contact.outcome,
                      appointmentLocal: contact.appointmentAt
                        ? utcToBerlinLocalInput(contact.appointmentAt)
                        : null,
                      hasStep: false,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {orphans.length > 25 && (
            <p className="text-xs text-slate-500">
              … und {orphans.length - 25} weitere. Über{" "}
              <Link href="/pipeline" className="font-medium text-navy-600 hover:underline">
                Pipeline
              </Link>{" "}
              nacharbeiten.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
