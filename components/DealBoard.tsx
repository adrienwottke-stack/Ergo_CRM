"use client";

import { useState } from "react";
import Link from "next/link";
import type { DealStage, NextStepType } from "@/lib/generated/prisma/enums";
import type { DueState } from "@/lib/dates";
import {
  DEAL_STAGES,
  dealLineLabels,
  dealStageLabels,
  dealStagePalette,
  formatEuro,
} from "@/lib/pipeline";
import DealActionDialog, { type DealLite } from "@/components/DealActionDialog";
import DealActions from "@/components/DealActions";
import NextStepBadge from "@/components/NextStepBadge";

export type BoardDeal = DealLite & {
  monthlyPremiumCents: number | null;
  nextStepType: NextStepType | null;
  nextStepAt: string | null;
  nextStepDue: DueState | null;
};

function Card({
  deal,
  onDrag,
}: {
  deal: BoardDeal;
  onDrag?: (event: React.DragEvent) => void;
}) {
  return (
    <div
      draggable={Boolean(onDrag)}
      onDragStart={onDrag}
      className={`rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-slate-300 ${
        onDrag ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <Link
        href={`/contacts/${deal.contactId}`}
        className="text-sm font-semibold text-slate-900 hover:text-navy-700"
      >
        {deal.contactName}
      </Link>
      <p className="mt-0.5 text-xs text-slate-500">
        {dealLineLabels[deal.line]}
        {deal.title ? ` · ${deal.title}` : ""}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">
        {deal.units ?? 0} Einheiten
        {deal.monthlyPremiumCents != null && (
          <span className="ml-2 text-xs font-normal text-slate-500">
            {formatEuro(deal.monthlyPremiumCents)} / Monat
          </span>
        )}
      </p>

      {deal.nextStepType && deal.nextStepAt && deal.nextStepDue && (
        <div className="mt-2">
          <NextStepBadge
            type={deal.nextStepType}
            at={deal.nextStepAt}
            state={deal.nextStepDue}
          />
        </div>
      )}

      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <DealActions deal={deal} compact />
      </div>
    </div>
  );
}

export default function DealBoard({ deals }: { deals: BoardDeal[] }) {
  const [dialog, setDialog] = useState<{ deal: BoardDeal; stage: DealStage } | null>(
    null
  );

  const byStage = new Map<DealStage, BoardDeal[]>(
    DEAL_STAGES.map((stage) => [
      stage,
      deals.filter((deal) => deal.stage === stage && deal.outcome !== "VERLOREN"),
    ])
  );
  const lost = deals.filter((deal) => deal.outcome === "VERLOREN");

  const unitsOf = (items: BoardDeal[]) =>
    items.reduce((sum, deal) => sum + (deal.units ?? 0), 0);

  const handleDrop = (event: React.DragEvent, stage: DealStage) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("dealId");
    const deal = deals.find((entry) => entry.id === id);
    if (deal) setDialog({ deal, stage });
  };

  return (
    <>
      <div className="hidden overflow-x-auto pb-4 md:block">
        <div className="flex gap-4">
          {DEAL_STAGES.map((stage) => {
            const items = byStage.get(stage) ?? [];
            const palette = dealStagePalette[stage];
            return (
              <div
                key={stage}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, stage)}
                className={`flex w-72 shrink-0 flex-col rounded-xl border ${palette.border} ${palette.bg} p-3`}
              >
                <div
                  className={`rounded-lg px-3 py-2 ${palette.headerBg}`}
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-[11px] font-semibold uppercase tracking-wider ${palette.text}`}
                    >
                      {dealStageLabels[stage]}
                    </h3>
                    <span
                      className={`rounded-full bg-white px-2 py-0.5 text-xs font-semibold ${palette.text} ring-1 ring-slate-900/5`}
                    >
                      {items.length}
                    </span>
                  </div>
                  <p className={`mt-0.5 text-xs font-medium ${palette.text}`}>
                    {unitsOf(items)} Einheiten
                  </p>
                </div>
                <div className="mt-3 flex min-h-[400px] flex-1 flex-col gap-3">
                  {items.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-4">
                      <p className="text-xs text-slate-400">Leer</p>
                    </div>
                  ) : (
                    items.map((deal) => (
                      <Card
                        key={deal.id}
                        deal={deal}
                        onDrag={(event) => event.dataTransfer.setData("dealId", deal.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {DEAL_STAGES.map((stage) => {
          const items = byStage.get(stage) ?? [];
          const palette = dealStagePalette[stage];
          return (
            <details
              key={stage}
              open={items.length > 0}
              className={`overflow-hidden rounded-xl border ${palette.border} ${palette.bg}`}
            >
              <summary
                className={`flex min-h-12 cursor-pointer list-none items-center justify-between px-4 ${palette.headerBg}`}
              >
                <span
                  className={`text-[13px] font-semibold uppercase tracking-wider ${palette.text}`}
                >
                  {dealStageLabels[stage]}
                </span>
                <span
                  className={`rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold ${palette.text} ring-1 ring-slate-900/5`}
                >
                  {items.length} · {unitsOf(items)} Einh.
                </span>
              </summary>
              <div className="space-y-3 p-3">
                {items.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-400">
                    Keine Vorgänge in dieser Phase
                  </p>
                ) : (
                  items.map((deal) => <Card key={deal.id} deal={deal} />)
                )}
              </div>
            </details>
          );
        })}
      </div>

      {lost.length > 0 && (
        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[13px] font-semibold text-slate-600">
            Verlorene Vorgänge
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-900/5">
              {lost.length}
            </span>
          </summary>
          <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {lost.map((deal) => (
              <Card key={deal.id} deal={deal} />
            ))}
          </div>
        </details>
      )}

      <DealActionDialog
        open={dialog !== null}
        mode="stage"
        deal={dialog ? { ...dialog.deal, stage: dialog.stage } : null}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
