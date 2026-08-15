import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  berlinToday,
  dueState,
  hasTimeOfDay,
  utcToBerlinLocalInput,
} from "@/lib/dates";
import {
  ACQUISITION_STAGES,
  CARE_STAGES,
  CONTACT_STAGES,
} from "@/lib/pipeline";
import PipelineBoard, { type BoardContact } from "@/components/PipelineBoard";
import { btnPrimary, filterPill, pageTitle } from "@/components/ui";
import { PlusIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const views = {
  akquise: { label: "Akquise", stages: ACQUISITION_STAGES },
  betreuung: { label: "Betreuung", stages: CARE_STAGES },
  alle: { label: "Alle", stages: CONTACT_STAGES },
} as const;

type ViewKey = keyof typeof views;

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; verloren?: string }>;
}) {
  const user = await requireUser();
  const { view, verloren } = await searchParams;
  const viewKey: ViewKey = view && view in views ? (view as ViewKey) : "akquise";
  const stages = [...views[viewKey].stages];
  const showLost = verloren === "1";

  const contacts = await prisma.contact.findMany({
    where: {
      ...eigene(user.id).kontakte,
      stage: { in: stages },
      ...(showLost ? {} : { outcome: { not: "VERLOREN" } }),
    },
    orderBy: [{ nextStepAt: "asc" }, { updatedAt: "desc" }],
    include: {
      deals: { where: { outcome: "OFFEN" }, select: { units: true } },
    },
  });

  const today = berlinToday();
  const items: BoardContact[] = contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    stage: contact.stage,
    outcome: contact.outcome,
    appointmentLocal: contact.appointmentAt
      ? utcToBerlinLocalInput(contact.appointmentAt)
      : null,
    hasStep: contact.nextStepType !== null,
    nextStepType: contact.nextStepType,
    nextStepAt: contact.nextStepAt?.toISOString() ?? null,
    nextStepDue: contact.nextStepAt ? dueState(contact.nextStepAt, today) : null,
    nextStepWithTime: contact.nextStepAt ? hasTimeOfDay(contact.nextStepAt) : false,
    openDeals: contact.deals.length,
    openUnits: contact.deals.reduce((sum, deal) => sum + (deal.units ?? 0), 0),
  }));

  const withoutStep = items.filter(
    (item) => !item.hasStep && item.outcome !== "VERLOREN"
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items.length} {items.length === 1 ? "Kontakt" : "Kontakte"} in dieser
            Ansicht
            {withoutStep > 0 ? ` · ${withoutStep} ohne nächsten Schritt` : ""}
          </p>
        </div>
        <Link href="/contacts/new" className={btnPrimary}>
          <PlusIcon className="h-4 w-4" />
          Neuer Kontakt
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        {(Object.keys(views) as ViewKey[]).map((key) => (
          <Link
            key={key}
            href={`/pipeline?view=${key}${showLost ? "&verloren=1" : ""}`}
            className={filterPill(viewKey === key)}
          >
            {views[key].label}
          </Link>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        <Link
          href={`/pipeline?view=${viewKey}${showLost ? "" : "&verloren=1"}`}
          className={filterPill(showLost)}
        >
          Verlorene {showLost ? "ausblenden" : "einblenden"}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-900">
            Keine Kontakte in dieser Ansicht
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Wechsle die Ansicht oder leg einen neuen Kontakt an.
          </p>
        </div>
      ) : (
        <PipelineBoard contacts={items} stages={stages} />
      )}

      <p className="text-xs text-slate-500 md:hidden">
        Am Handy änderst du die Phase über den Button „Phase“ – Drag &amp; Drop
        gibt es ab Tablet-Breite.
      </p>
    </div>
  );
}
