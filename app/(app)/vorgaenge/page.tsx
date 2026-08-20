import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import { berlinToday, dueState } from "@/lib/dates";
import { formatEuro } from "@/lib/pipeline";
import DealBoard, { type BoardDeal } from "@/components/DealBoard";
import { card, kicker, pageTitle } from "@/components/ui";
import SectionTabs from "@/components/SectionTabs";
import { PIPELINE_TABS } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function VorgaengePage() {
  const user = await requireUser();
  const sicht = eigene(user.id);
  const today = berlinToday();

  const deals = await prisma.deal.findMany({
    where: sicht.ueberKontakt,
    orderBy: [{ nextStepAt: "asc" }, { updatedAt: "desc" }],
    include: { contact: { select: { name: true } } },
  });

  const items: BoardDeal[] = deals.map((deal) => ({
    id: deal.id,
    contactId: deal.contactId,
    contactName: deal.contact.name,
    line: deal.line,
    title: deal.title,
    stage: deal.stage,
    outcome: deal.outcome,
    hasStep: deal.nextStepType !== null,
    monthlyPremiumInput:
      deal.monthlyPremiumCents != null
        ? (deal.monthlyPremiumCents / 100).toFixed(2).replace(".", ",")
        : "",
    units: deal.units,
    monthlyPremiumCents: deal.monthlyPremiumCents,
    nextStepType: deal.nextStepType,
    nextStepAt: deal.nextStepAt?.toISOString() ?? null,
    nextStepDue: deal.nextStepAt ? dueState(deal.nextStepAt, today) : null,
  }));

  const open = items.filter((deal) => deal.outcome === "OFFEN");
  const won = items.filter((deal) => deal.outcome === "GEWONNEN");
  const openUnits = open.reduce((sum, deal) => sum + (deal.units ?? 0), 0);
  const wonUnits = won.reduce((sum, deal) => sum + (deal.units ?? 0), 0);
  const wonPremium = won.reduce(
    (sum, deal) => sum + (deal.monthlyPremiumCents ?? 0),
    0
  );

  return (
    <div className="space-y-5">
      <SectionTabs tabs={PIPELINE_TABS} />

      <div>
        <h1 className={pageTitle}>Vorgänge</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ein Vorgang je Sparte. Entsteht nach dem gehaltenen Termin.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`${card} p-4`}>
          <p className={kicker}>Offen</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
            {open.length}
          </p>
        </div>
        <div className={`${card} p-4`}>
          <p className={kicker}>Einheiten offen</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
            {openUnits}
          </p>
        </div>
        <div className={`${card} p-4`}>
          <p className={kicker}>Abgeschlossen</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
            {won.length}
          </p>
        </div>
        <div className={`${card} p-4`}>
          <p className={kicker}>Einheiten gewonnen</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
            {wonUnits}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatEuro(wonPremium)} / Monat
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-900">Noch keine Vorgänge</p>
          <p className="mt-1 text-sm text-slate-500">
            Vorgänge legst du auf der Kontaktseite an, sobald der Termin gehalten ist.
          </p>
        </div>
      ) : (
        <DealBoard deals={items} />
      )}
    </div>
  );
}
