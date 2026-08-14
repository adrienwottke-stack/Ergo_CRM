"use client";

import { useState } from "react";
import DealActionDialog, {
  type DealLite,
  type DealMode,
} from "@/components/DealActionDialog";
import { snoozeDealStep } from "@/app/(app)/pipeline/actions";
import { CheckIcon } from "@/components/icons";

const action =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition";

const variants = {
  done: `${action} bg-navy-800 text-white hover:bg-navy-900`,
  neutral: `${action} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`,
  soft: `${action} bg-slate-100 text-slate-600 hover:bg-slate-200`,
  danger: `${action} text-red-600 hover:bg-red-50`,
};

export default function DealActions({
  deal,
  compact = false,
}: {
  deal: DealLite;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<DealMode>("stage");
  const [open, setOpen] = useState(false);

  const openWith = (next: DealMode) => {
    setMode(next);
    setOpen(true);
  };

  const closed = deal.outcome !== "OFFEN";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {!closed && deal.hasStep && (
          <button type="button" onClick={() => openWith("complete")} className={variants.done}>
            <CheckIcon className="h-4 w-4" />
            Erledigt
          </button>
        )}
        {!closed && (
          <button type="button" onClick={() => openWith("stage")} className={variants.neutral}>
            Phase
          </button>
        )}
        <button type="button" onClick={() => openWith("edit")} className={variants.neutral}>
          Bearbeiten
        </button>
        {!compact && !closed && deal.hasStep && (
          <form action={snoozeDealStep}>
            <input type="hidden" name="dealId" value={deal.id} />
            <input type="hidden" name="days" value="3" />
            <button type="submit" className={variants.soft}>
              +3 Tage
            </button>
          </form>
        )}
        {!compact && !closed && (
          <button type="button" onClick={() => openWith("lost")} className={variants.danger}>
            Verloren
          </button>
        )}
      </div>

      <DealActionDialog
        open={open}
        mode={mode}
        deal={deal}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

// Eigener Auslöser zum Anlegen, damit die Karte den Kontakt kennt.
export function CreateDealButton({
  contactId,
  contactName,
  className,
  children,
}: {
  contactId: string;
  contactName: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? variants.neutral}>
        {children}
      </button>
      <DealActionDialog
        open={open}
        mode="create"
        contactId={contactId}
        contactName={contactName}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
