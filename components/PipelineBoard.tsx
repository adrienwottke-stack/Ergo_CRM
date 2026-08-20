"use client";

import { useState } from "react";
import Link from "next/link";
import type { ContactStage, NextStepType } from "@/lib/generated/prisma/enums";
import type { DueState } from "@/lib/dates";
import { contactStageLabels, contactStagePalette } from "@/lib/pipeline";
import ContactActionDialog, {
  type ActionMode,
  type ContactLite,
} from "@/components/ContactActionDialog";
import ContactActions from "@/components/ContactActions";
import NextStepBadge from "@/components/NextStepBadge";
import { PhoneIcon } from "@/components/icons";

export type BoardContact = ContactLite & {
  nextStepType: NextStepType | null;
  nextStepAt: string | null;
  nextStepDue: DueState | null;
  nextStepWithTime: boolean;
  openDeals: number;
  openUnits: number;
};

function Card({
  contact,
  onStageDrag,
}: {
  contact: BoardContact;
  onStageDrag?: (event: React.DragEvent) => void;
}) {
  return (
    <div
      draggable={Boolean(onStageDrag)}
      onDragStart={onStageDrag}
      className={`rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-slate-300 ${
        onStageDrag ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <Link
        href={`/contacts/${contact.id}`}
        className="text-sm font-semibold text-slate-900 hover:text-navy-700"
      >
        {contact.name}
      </Link>

      {contact.phone && (
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <PhoneIcon className="h-3 w-3 text-slate-400" />
          {contact.phone}
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {contact.nextStepType && contact.nextStepAt && contact.nextStepDue ? (
          <NextStepBadge
            type={contact.nextStepType}
            at={contact.nextStepAt}
            state={contact.nextStepDue}
            withTime={contact.nextStepWithTime}
          />
        ) : contact.outcome !== "VERLOREN" ? (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            Kein nächster Schritt
          </span>
        ) : null}

        {contact.openDeals > 0 && (
          <span className="inline-flex items-center rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700 ring-1 ring-inset ring-navy-600/15">
            {contact.openDeals} {contact.openDeals === 1 ? "Vorgang" : "Vorgänge"}
            {contact.openUnits > 0 ? ` · ${contact.openUnits} Einh.` : ""}
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <ContactActions contact={contact} compact />
      </div>
    </div>
  );
}

export default function PipelineBoard({
  contacts,
  stages,
}: {
  contacts: BoardContact[];
  stages: ContactStage[];
}) {
  const [dialog, setDialog] = useState<{
    contact: BoardContact;
    stage: ContactStage;
    mode: ActionMode;
  } | null>(null);

  const byStage = new Map<ContactStage, BoardContact[]>(
    stages.map((stage) => [stage, contacts.filter((c) => c.stage === stage)])
  );

  const handleDrop = (event: React.DragEvent, stage: ContactStage) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("contactId");
    const contact = contacts.find((entry) => entry.id === id);
    // Der Playbook-Dialog bestaetigt den Wechsel – kein stiller Drop.
    if (contact) setDialog({ contact, stage, mode: "stage" });
  };

  return (
    <>
      {/* Ab Tablet: Spalten nebeneinander mit Drag & Drop. */}
      <div className="hidden overflow-x-auto pb-4 md:block">
        <div className="flex gap-4">
          {stages.map((stage) => {
            const items = byStage.get(stage) ?? [];
            const palette = contactStagePalette[stage];
            return (
              <div
                key={stage}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, stage)}
                className={`flex w-72 shrink-0 flex-col rounded-xl border ${palette.border} ${palette.bg} p-3`}
              >
                <div
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${palette.headerBg}`}
                >
                  <h3
                    className={`text-[11px] font-semibold uppercase tracking-wider ${palette.text}`}
                  >
                    {contactStageLabels[stage]}
                  </h3>
                  <span
                    className={`rounded-full bg-white px-2 py-0.5 text-xs font-semibold ${palette.text} ring-1 ring-slate-900/5`}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="mt-3 flex min-h-[400px] flex-1 flex-col gap-3">
                  {items.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-4">
                      <p className="text-xs text-slate-400">Leer</p>
                    </div>
                  ) : (
                    items.map((contact) => (
                      <Card
                        key={contact.id}
                        contact={contact}
                        onStageDrag={(event) =>
                          event.dataTransfer.setData("contactId", contact.id)
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Handy: gleiche Phasen als aufklappbare Listen, Wechsel über den Dialog. */}
      <div className="space-y-3 md:hidden">
        {stages.map((stage) => {
          const items = byStage.get(stage) ?? [];
          const palette = contactStagePalette[stage];
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
                  {contactStageLabels[stage]}
                </span>
                <span
                  className={`rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold ${palette.text} ring-1 ring-slate-900/5`}
                >
                  {items.length}
                </span>
              </summary>
              <div className="space-y-3 p-3">
                {items.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-400">
                    Keine Kontakte in dieser Phase
                  </p>
                ) : (
                  items.map((contact) => <Card key={contact.id} contact={contact} />)
                )}
              </div>
            </details>
          );
        })}
      </div>

      <ContactActionDialog
        open={dialog !== null}
        mode={dialog?.mode ?? "stage"}
        contact={dialog?.contact ?? null}
        targetStage={dialog?.stage}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
