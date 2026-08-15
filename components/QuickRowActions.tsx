"use client";

// Die Schnellaktionen einer Zeile in der Heute-Liste.
//
// Bisher fuehrte hier jeder Ausgang ueber "Erledigt" -> Dialog -> Pflicht-
// Freitext -> speichern. Der haeufigste Fall des Tages (nicht erreicht) kostete
// drei Tipps und vierzehn Anschlaege. Jetzt ist er ein Tipp.
//
// Zwei Modi, weil nicht jeder faellige Schritt ein Anruf ist:
//   Anruf-Schritt  -> die vier Gespraechsergebnisse
//   anderer Schritt -> Erledigt plus Verschiebe-Chips
// Alles Seltenere liegt hinter "…".

import { useState } from "react";
import {
  completeStepQuick,
  recordCallResult,
  snoozeStepQuick,
} from "@/app/(app)/contacts/results";
import ContactActionDialog, {
  type ActionMode,
  type ContactLite,
} from "@/components/ContactActionDialog";
import {
  AppointmentDialog,
  ChoiceDialog,
  LATER_CHIPS,
  LOST_CHIPS,
} from "@/components/ResultDialogs";
import { undoMoeglich } from "@/components/UndoBar";
import { CheckIcon, PhoneIcon } from "@/components/icons";

const knopf =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition active:scale-[0.98] disabled:opacity-50";

const stil = {
  call: `${knopf} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`,
  primaer: `${knopf} bg-navy-800 text-white hover:bg-navy-900`,
  neutral: `${knopf} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`,
  weich: `${knopf} bg-slate-100 text-slate-600 hover:bg-slate-200`,
  warm: `${knopf} bg-amber-100 text-amber-900 hover:bg-amber-200`,
};

const SNOOZE_CHIPS = [
  { label: "Morgen", days: "1" },
  { label: "+3 Tage", days: "3" },
  { label: "Nächste Woche", days: "7" },
];

export default function QuickRowActions({
  contact,
  istAnruf,
}: {
  contact: ContactLite;
  /** Anruf-Schritt? Dann die vier Ergebnisse statt "Erledigt". */
  istAnruf: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | "appointment" | "later" | "lost">(null);
  const [mehr, setMehr] = useState<ActionMode | null>(null);

  const senden = async (
    action: (data: FormData) => Promise<unknown>,
    felder: Record<string, string>
  ) => {
    setPending(true);
    setFehler(null);
    try {
      const data = new FormData();
      data.set("contactId", contact.id);
      Object.entries(felder).forEach(([schluessel, wert]) => data.set(schluessel, wert));
      await action(data);
      undoMoeglich();
      setDialog(null);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Das hat nicht geklappt.");
    } finally {
      setPending(false);
    }
  };

  const verloren = contact.outcome === "VERLOREN";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {contact.phone && (
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className={stil.call}>
            <PhoneIcon className="h-4 w-4" />
            Anrufen
          </a>
        )}

        {!verloren && istAnruf && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => senden(recordCallResult, { result: "unreachable" })}
              className={stil.weich}
            >
              📵 Nicht erreicht
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDialog("later")}
              className={stil.warm}
            >
              ⏳ Später
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDialog("appointment")}
              className={stil.primaer}
            >
              ✅ Termin
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDialog("lost")}
              className={stil.neutral}
            >
              ✕ Kein Interesse
            </button>
          </>
        )}

        {!verloren && !istAnruf && contact.hasStep && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => senden(completeStepQuick, {})}
              className={stil.primaer}
            >
              <CheckIcon className="h-4 w-4" />
              Erledigt
            </button>
            {SNOOZE_CHIPS.map((chip) => (
              <button
                key={chip.days}
                type="button"
                disabled={pending}
                onClick={() => senden(snoozeStepQuick, { days: chip.days })}
                className={stil.weich}
              >
                {chip.label}
              </button>
            ))}
          </>
        )}

        <button
          type="button"
          onClick={() => setMehr("stage")}
          aria-label="Weitere Aktionen"
          className={`${stil.neutral} px-3.5`}
        >
          …
        </button>
      </div>

      {fehler && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{fehler}</p>
      )}

      <AppointmentDialog
        open={dialog === "appointment"}
        name={contact.name}
        pending={pending}
        onClose={() => setDialog(null)}
        onSave={(when) =>
          senden(recordCallResult, { result: "appointment", appointmentAt: when })
        }
      />

      <ChoiceDialog
        open={dialog === "later"}
        title="Wann nochmal?"
        subtitle={contact.name}
        pending={pending}
        choices={LATER_CHIPS.map((chip) => ({
          label: chip.label,
          onPick: () => senden(recordCallResult, { result: "later", days: chip.days }),
        }))}
        onClose={() => setDialog(null)}
      />

      <ChoiceDialog
        open={dialog === "lost"}
        title="Woran lag's?"
        subtitle={contact.name}
        pending={pending}
        choices={LOST_CHIPS.map((chip) => ({
          label: chip.label,
          onPick: () =>
            senden(recordCallResult, { result: "lost", lostReason: chip.reason }),
        }))}
        onClose={() => setDialog(null)}
      />

      <ContactActionDialog
        open={mehr !== null}
        mode={mehr ?? "stage"}
        contact={contact}
        onClose={() => setMehr(null)}
      />
    </>
  );
}
