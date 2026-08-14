"use client";

import { useEffect, useState, useTransition } from "react";
import Modal from "@/components/Modal";
import type { DealLine, DealStage, Outcome } from "@/lib/generated/prisma/enums";
import {
  ALL_LOST_REASONS,
  DEAL_STAGES,
  SELECTABLE_DEAL_LINES,
  UNITS_PER_EURO,
  dealLineLabels,
  dealStageLabels,
  lostReasonLabels,
} from "@/lib/pipeline";
import NextStepFields, { dealStepDefaults } from "@/components/NextStepFields";
import { btnPrimary, btnSecondary, input, label } from "@/components/ui";
import {
  completeDealStep,
  createDeal,
  markDealLost,
  setDealStage,
  updateDeal,
} from "@/app/(app)/pipeline/actions";

export type DealLite = {
  id: string;
  contactId: string;
  contactName: string;
  line: DealLine;
  title: string | null;
  stage: DealStage;
  outcome: Outcome;
  hasStep: boolean;
  monthlyPremiumInput: string;
  units: number | null;
};

export type DealMode = "create" | "stage" | "complete" | "lost" | "edit";

function ValueFields({ deal }: { deal?: DealLite }) {
  const [premium, setPremium] = useState(deal?.monthlyPremiumInput ?? "");
  const preview = (() => {
    const parsed = Number(premium.replace(/\./g, "").replace(",", "."));
    if (!premium.trim() || !isFinite(parsed) || parsed < 0) return null;
    return Math.round(parsed * UNITS_PER_EURO);
  })();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="monthlyPremium" className={label}>
          Monatsbeitrag (€)
        </label>
        <input
          id="monthlyPremium"
          name="monthlyPremium"
          type="text"
          inputMode="decimal"
          value={premium}
          onChange={(event) => setPremium(event.target.value)}
          placeholder="z. B. 100"
          className={input}
        />
        <p className="mt-1.5 text-xs text-slate-500">
          {preview !== null
            ? `ergibt ${preview} Einheiten`
            : "100 € entsprechen 82 Einheiten"}
        </p>
      </div>
      <div>
        <label htmlFor="units" className={label}>
          Einheiten (überschreiben)
        </label>
        <input
          id="units"
          name="units"
          type="number"
          min={0}
          step={1}
          defaultValue={deal?.units ?? ""}
          placeholder="automatisch"
          className={input}
        />
      </div>
    </div>
  );
}

export default function DealActionDialog({
  open,
  mode,
  deal,
  contactId,
  contactName,
  onClose,
}: {
  open: boolean;
  mode: DealMode;
  deal?: DealLite | null;
  contactId?: string;
  contactName?: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<DealStage>(deal?.stage ?? "BEDARF");

  useEffect(() => {
    if (!open) return;
    setStage(deal?.stage ?? "BEDARF");
    setError(null);
  }, [open, deal]);

  const submit = (action: (data: FormData) => Promise<void>) =>
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setError(null);
      startTransition(async () => {
        try {
          await action(formData);
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

  const lineField = (current?: DealLine) => (
    <div>
      <label htmlFor="line" className={label}>
        Sparte *
      </label>
      <select
        id="line"
        name="line"
        required
        defaultValue={current && current !== "UNBEKANNT" ? current : "PAV"}
        className={input}
      >
        {SELECTABLE_DEAL_LINES.map((value) => (
          <option key={value} value={value}>
            {dealLineLabels[value]}
          </option>
        ))}
      </select>
    </div>
  );

  const titleField = (current?: string | null) => (
    <div>
      <label htmlFor="title" className={label}>
        Bezeichnung (optional)
      </label>
      <input
        id="title"
        name="title"
        type="text"
        defaultValue={current ?? ""}
        placeholder="z. B. Riester, Zusatzbaustein"
        className={input}
      />
    </div>
  );

  if (mode === "create") {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Vorgang anlegen"
        subtitle={contactName}
      >
        <form onSubmit={submit(createDeal)} className="space-y-4">
          <input type="hidden" name="contactId" value={contactId ?? ""} />
          {lineField()}
          {titleField()}
          <ValueFields />
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Der Vorgang startet bei „Bedarf erkannt“ mit dem Schritt „Angebot
            erstellen“ in 2 Tagen. Der Kontakt rückt auf „In Beratung“.
          </p>
          {errorBox}
          {footer("Vorgang anlegen")}
        </form>
      </Modal>
    );
  }

  if (!deal) return null;

  if (mode === "edit") {
    return (
      <Modal open={open} onClose={onClose} title="Vorgang bearbeiten" subtitle={deal.contactName}>
        <form onSubmit={submit(updateDeal)} className="space-y-4">
          <input type="hidden" name="dealId" value={deal.id} />
          {lineField(deal.line)}
          {titleField(deal.title)}
          <ValueFields deal={deal} />
          {errorBox}
          {footer("Speichern")}
        </form>
      </Modal>
    );
  }

  if (mode === "stage") {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Vorgang: Phase ändern"
        subtitle={`${deal.contactName} · ${dealLineLabels[deal.line]}`}
      >
        <form onSubmit={submit(setDealStage)}>
          <input type="hidden" name="dealId" value={deal.id} />
          <div>
            <label htmlFor="dealStage" className={label}>
              Phase
            </label>
            <select
              id="dealStage"
              name="stage"
              value={stage}
              onChange={(event) => setStage(event.target.value as DealStage)}
              className={input}
            >
              {DEAL_STAGES.map((value) => (
                <option key={value} value={value}>
                  {dealStageLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <NextStepFields
              defaults={dealStepDefaults(stage)}
              hint={
                stage === "GEWONNEN"
                  ? "Nach dem Abschluss übernimmt der Kontakt: Empfehlungen erfragen."
                  : undefined
              }
            />
          </div>
          {stage === "GEWONNEN" && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Abschluss zählt 5 Punkte im Wettbewerb und macht den Kontakt zum Kunden.
            </p>
          )}
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
        subtitle={`${deal.contactName} · ${dealLineLabels[deal.line]}`}
      >
        <form onSubmit={submit(completeDealStep)}>
          <input type="hidden" name="dealId" value={deal.id} />
          <div>
            <label htmlFor="dealText" className={label}>
              Was ist passiert? *
            </label>
            <textarea
              id="dealText"
              name="text"
              rows={3}
              required
              placeholder="z. B. Angebot verschickt, Rückmeldung bis Freitag"
              className={input}
            />
          </div>
          <div className="mt-4">
            <NextStepFields defaults={dealStepDefaults(deal.stage)} />
          </div>
          {errorBox}
          {footer("Erledigt & weiter")}
        </form>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vorgang verloren"
      subtitle={`${deal.contactName} · Phase bleibt auf „${dealStageLabels[deal.stage]}“`}
    >
      <form onSubmit={submit(markDealLost)}>
        <input type="hidden" name="dealId" value={deal.id} />
        <div>
          <label htmlFor="dealLostReason" className={label}>
            Grund *
          </label>
          <select id="dealLostReason" name="lostReason" required className={input}>
            {ALL_LOST_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {lostReasonLabels[reason]}
              </option>
            ))}
          </select>
        </div>
        {errorBox}
        {footer("Als verloren speichern")}
      </form>
    </Modal>
  );
}
