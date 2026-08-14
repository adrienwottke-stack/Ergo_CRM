"use client";

import { useEffect, useState, useTransition } from "react";
import Modal from "@/components/Modal";
import type { ContactStage, Outcome } from "@/lib/generated/prisma/enums";
import {
  ALL_LOST_REASONS,
  CONTACT_STAGES,
  contactStageHints,
  contactStageLabels,
  lostReasonLabels,
} from "@/lib/pipeline";
import NextStepFields, { contactStepDefaults } from "@/components/NextStepFields";
import { btnPrimary, btnSecondary, input, label } from "@/components/ui";
import {
  addReferrals,
  completeContactStep,
  markContactLost,
  scheduleCheckup,
  setContactStage,
} from "@/app/(app)/pipeline/actions";

export type ContactLite = {
  id: string;
  name: string;
  phone: string | null;
  stage: ContactStage;
  outcome: Outcome;
  appointmentLocal: string | null;
  hasStep: boolean;
};

export type ActionMode = "stage" | "complete" | "lost" | "referral" | "checkup";

const STAGES_NEEDING_APPOINTMENT: ContactStage[] = [
  "TERMIN_VEREINBART",
  "CHECKUP_GEPLANT",
];

export default function ContactActionDialog({
  open,
  mode,
  contact,
  targetStage,
  onClose,
  onSuccess,
}: {
  open: boolean;
  mode: ActionMode;
  contact: ContactLite | null;
  targetStage?: ContactStage;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<ContactStage>(targetStage ?? "NEU");
  const [appointment, setAppointment] = useState("");
  const [referralRows, setReferralRows] = useState(3);

  useEffect(() => {
    if (!open || !contact) return;
    setStage(targetStage ?? contact.stage);
    setAppointment(contact.appointmentLocal ?? "");
    setReferralRows(3);
    setError(null);
  }, [open, contact, targetStage]);

  if (!contact) return null;

  const submit = (action: (data: FormData) => Promise<void>) =>
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setError(null);
      startTransition(async () => {
        try {
          await action(formData);
          onSuccess?.();
          onClose();
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : "Das hat nicht geklappt."
          );
        }
      });
    };

  const footer = (submitLabel: string) => (
    <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className={btnSecondary}>
        Abbrechen
      </button>
      <button type="submit" disabled={pending} className={`${btnPrimary} disabled:opacity-60`}>
        {pending ? "Speichert …" : submitLabel}
      </button>
    </div>
  );

  const errorBox = error && (
    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  );

  if (mode === "stage") {
    const needsAppointment = STAGES_NEEDING_APPOINTMENT.includes(stage);
    return (
      <Modal open={open} onClose={onClose} title="Phase ändern" subtitle={contact.name}>
        <form onSubmit={submit(setContactStage)}>
          <input type="hidden" name="contactId" value={contact.id} />
          <div>
            <label htmlFor="stage" className={label}>
              Phase
            </label>
            <select
              id="stage"
              name="stage"
              value={stage}
              onChange={(event) => setStage(event.target.value as ContactStage)}
              className={input}
            >
              {CONTACT_STAGES.map((value) => (
                <option key={value} value={value}>
                  {contactStageLabels[value]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">{contactStageHints[stage]}</p>
          </div>

          {needsAppointment && (
            <div className="mt-4">
              <label htmlFor="appointmentAt" className={label}>
                Termin (Datum und Uhrzeit) *
              </label>
              <input
                id="appointmentAt"
                name="appointmentAt"
                type="datetime-local"
                required
                value={appointment}
                onChange={(event) => setAppointment(event.target.value)}
                className={input}
              />
            </div>
          )}

          <div className="mt-4">
            <NextStepFields
              defaults={contactStepDefaults(stage, needsAppointment ? appointment : null)}
              hint={
                stage === "IN_BERATUNG"
                  ? "In der Beratung führt der Vorgang den nächsten Schritt."
                  : undefined
              }
            />
          </div>
          {errorBox}
          {footer("Phase speichern")}
        </form>
      </Modal>
    );
  }

  if (mode === "complete") {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Schritt erledigt"
        subtitle={contact.name}
      >
        <form onSubmit={submit(completeContactStep)}>
          <input type="hidden" name="contactId" value={contact.id} />
          <div>
            <label htmlFor="text" className={label}>
              Was ist passiert? *
            </label>
            <textarea
              id="text"
              name="text"
              rows={3}
              required
              placeholder="z. B. erreicht, Termin für Dienstag vereinbart"
              className={input}
            />
          </div>
          <div className="mt-4">
            <NextStepFields
              defaults={contactStepDefaults(contact.stage, contact.appointmentLocal)}
              hint="Damit der Kontakt nicht ohne Fälligkeit liegen bleibt."
            />
          </div>
          {errorBox}
          {footer("Erledigt & weiter")}
        </form>
      </Modal>
    );
  }

  if (mode === "lost") {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Kontakt verloren"
        subtitle={`${contact.name} · Phase bleibt auf „${contactStageLabels[contact.stage]}“`}
      >
        <form onSubmit={submit(markContactLost)}>
          <input type="hidden" name="contactId" value={contact.id} />
          <div>
            <label htmlFor="lostReason" className={label}>
              Grund *
            </label>
            <select id="lostReason" name="lostReason" required className={input}>
              {ALL_LOST_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {lostReasonLabels[reason]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Die Phase bleibt stehen – so ist später auswertbar, wo Kontakte
              verloren gehen. „Später nochmal“ meldet sich in 6 Monaten von selbst zurück.
            </p>
          </div>
          <label className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3">
            <input type="checkbox" name="askReferral" className="h-4 w-4" />
            <span className="text-sm text-slate-700">
              Trotzdem nach Empfehlungen fragen (Schritt in 2 Tagen)
            </span>
          </label>
          {errorBox}
          {footer("Als verloren speichern")}
        </form>
      </Modal>
    );
  }

  if (mode === "referral") {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Empfehlungen erfassen"
        subtitle={contact.name}
      >
        <form onSubmit={submit(addReferrals)}>
          <input type="hidden" name="contactId" value={contact.id} />
          <p className="text-sm text-slate-600">
            Jeder Name wird ein neuer Kontakt in „Neu“ mit Erstanruf für heute –
            verknüpft mit {contact.name}.
          </p>
          <div className="mt-4 space-y-3">
            {Array.from({ length: referralRows }, (_, index) => (
              <div key={index} className="grid grid-cols-2 gap-3">
                <input
                  name="referralName"
                  type="text"
                  placeholder={`Name ${index + 1}`}
                  className={input}
                />
                <input
                  name="referralPhone"
                  type="tel"
                  placeholder="Telefon"
                  className={input}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setReferralRows((rows) => rows + 1)}
            className="mt-3 min-h-11 text-sm font-medium text-navy-600 hover:underline"
          >
            + weitere Zeile
          </button>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Auch ohne Namen speichern: die Frage gilt dann als gestellt und der
            Kontakt rückt auf „Empfehlung erfragt“.
          </p>
          {errorBox}
          {footer("Speichern")}
        </form>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Checkup planen" subtitle={contact.name}>
      <form onSubmit={submit(scheduleCheckup)}>
        <input type="hidden" name="contactId" value={contact.id} />
        <div>
          <label htmlFor="checkupAt" className={label}>
            Termin (Datum und Uhrzeit) *
          </label>
          <input
            id="checkupAt"
            name="appointmentAt"
            type="datetime-local"
            required
            defaultValue={contact.appointmentLocal ?? ""}
            className={input}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Der Kontakt rückt auf „Checkup geplant“, der Termin wird zum
            nächsten Schritt.
          </p>
        </div>
        {errorBox}
        {footer("Checkup speichern")}
      </form>
    </Modal>
  );
}
