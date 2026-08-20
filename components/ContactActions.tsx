"use client";

import { useState } from "react";
import ContactActionDialog, {
  type ActionMode,
  type ContactLite,
} from "@/components/ContactActionDialog";
import { reopenContact, snoozeContactStep } from "@/app/(app)/pipeline/actions";
import { CheckIcon, PhoneIcon } from "@/components/icons";

// Alle Tap-Ziele mindestens 44 px hoch – das Board wird am Handy bedient.
const action =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition";

const variants = {
  call: `${action} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`,
  done: `${action} bg-navy-900 text-white hover:bg-navy-950`,
  stage: `${action} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`,
  soft: `${action} bg-slate-100 text-slate-600 hover:bg-slate-200`,
  danger: `${action} text-red-600 hover:bg-red-50`,
};

export default function ContactActions({
  contact,
  compact = false,
}: {
  contact: ContactLite;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<ActionMode>("stage");
  const [open, setOpen] = useState(false);

  const openWith = (next: ActionMode) => {
    setMode(next);
    setOpen(true);
  };

  const lost = contact.outcome === "VERLOREN";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className={variants.call}>
            <PhoneIcon className="h-4 w-4" />
            Anrufen
          </a>
        )}

        {!lost && contact.hasStep && (
          <button type="button" onClick={() => openWith("complete")} className={variants.done}>
            <CheckIcon className="h-4 w-4" />
            Erledigt
          </button>
        )}

        {!lost && (
          <button type="button" onClick={() => openWith("stage")} className={variants.stage}>
            Phase
          </button>
        )}

        {!lost && contact.stage === "KUNDE" && (
          <button type="button" onClick={() => openWith("referral")} className={variants.stage}>
            Empfehlungen
          </button>
        )}

        {!lost &&
          (contact.stage === "EMPFEHLUNG_ERFRAGT" || contact.stage === "BESTAND") && (
            <button type="button" onClick={() => openWith("checkup")} className={variants.stage}>
              Checkup planen
            </button>
          )}

        {!compact && !lost && contact.hasStep && (
          <form action={snoozeContactStep}>
            <input type="hidden" name="contactId" value={contact.id} />
            <input type="hidden" name="days" value="3" />
            <button type="submit" className={variants.soft}>
              +3 Tage
            </button>
          </form>
        )}

        {!compact && !lost && (
          <button type="button" onClick={() => openWith("lost")} className={variants.danger}>
            Verloren
          </button>
        )}

        {lost && (
          <form action={reopenContact}>
            <input type="hidden" name="contactId" value={contact.id} />
            <button type="submit" className={variants.stage}>
              Reaktivieren
            </button>
          </form>
        )}
      </div>

      <ContactActionDialog
        open={open}
        mode={mode}
        contact={contact}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
