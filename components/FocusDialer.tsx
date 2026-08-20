"use client";

import { useState } from "react";
import Link from "next/link";
import { quickLogCall } from "@/app/(app)/contacts/actions";
import type { ContactStage, Outcome } from "@/lib/generated/prisma/enums";
import StageBadge from "@/components/StageBadge";
import ContactActionDialog, {
  type ActionMode,
  type ContactLite,
} from "@/components/ContactActionDialog";
import {
  ArrowUpRightIcon,
  CalendarCheckIcon,
  CheckIcon,
  ChevronRightIcon,
  PhoneIcon,
  TrophyIcon,
  VoicemailIcon,
} from "@/components/icons";
import { btnPrimary, btnSecondary, card } from "@/components/ui";

interface Activity {
  id: string;
  type: string;
  text: string;
  date: string | Date;
}

interface Contact {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  job?: string | null;
  source?: string | null;
  stage: ContactStage;
  outcome: Outcome;
  note?: string | null;
  appointmentLocal: string | null;
  activities: Activity[];
}

const bigButton =
  "flex min-h-14 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50";

export default function FocusDialer({ queue }: { queue: Contact[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogMode, setDialogMode] = useState<ActionMode>("stage");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (queue.length === 0 || currentIndex >= queue.length) {
    return (
      <div className={`${card} space-y-4 p-10 text-center`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckIcon className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Alles abgearbeitet</h2>
        <p className="mx-auto max-w-md text-sm text-slate-600">
          Du hast alle fälligen Kontakte für deinen heutigen Fokus-Durchlauf
          abgearbeitet.
        </p>
        <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
          <Link href="/heute" className={btnPrimary}>
            Zur Heute-Liste
          </Link>
          <Link href="/leaderboard" className={btnSecondary}>
            <TrophyIcon className="h-4 w-4" />
            Rangliste ansehen
          </Link>
        </div>
      </div>
    );
  }

  const current = queue[currentIndex]!;
  const progressPercent = Math.round((currentIndex / queue.length) * 100);

  const lite: ContactLite = {
    id: current.id,
    name: current.name,
    phone: current.phone ?? null,
    stage: current.stage,
    outcome: current.outcome,
    appointmentLocal: current.appointmentLocal,
    hasStep: true,
  };

  const advance = () => {
    setNoteText("");
    setCurrentIndex((prev) => prev + 1);
  };

  const handleQuickCall = async (extraFields: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("contactId", current.id);
      Object.entries(extraFields).forEach(([key, value]) => formData.set(key, value));
      await quickLogCall(formData);
      advance();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDialog = (mode: ActionMode) => {
    setDialogMode(mode);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className={`${card} space-y-2 p-4`}>
        <div className="flex justify-between text-xs font-medium tabular-nums text-slate-600">
          <span>
            Fortschritt: {currentIndex + 1} von {queue.length} Kontakten
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-navy-700 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className={`${card} space-y-6 p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{current.name}</h2>
              <StageBadge stage={current.stage} outcome={current.outcome} />
              {/* Der Beruf ist der Gespraechsaufhaenger – er gehoert neben den Namen. */}
              {current.job && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {current.job}
                </span>
              )}
            </div>
            {current.source && (
              <p className="mt-1 text-xs text-slate-500">Quelle: {current.source}</p>
            )}
          </div>
          <Link
            href={`/contacts/${current.id}`}
            target="_blank"
            className="flex min-h-11 items-center gap-1 text-xs font-medium text-navy-600 hover:underline"
          >
            Vollständiges Profil
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Telefon
            </span>
            {current.phone ? (
              <div className="mt-1">
                <a
                  href={`tel:${current.phone}`}
                  className="flex min-h-11 items-center gap-2 text-lg font-semibold tabular-nums tracking-tight text-navy-800 hover:underline"
                >
                  <PhoneIcon className="h-5 w-5 text-emerald-600" />
                  {current.phone}
                </a>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-400">Keine Telefonnummer hinterlegt</p>
            )}
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              E-Mail
            </span>
            {current.email ? (
              <p className="mt-1 text-sm font-medium text-slate-800">
                <a href={`mailto:${current.email}`} className="text-navy-600 hover:underline">
                  {current.email}
                </a>
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">–</p>
            )}
          </div>
        </div>

        {current.note && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Notiz zum Kontakt
            </span>
            <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">
              {current.note}
            </p>
          </div>
        )}

        {current.activities.length > 0 && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Letzte Aktivitäten
            </h4>
            <div className="space-y-2">
              {current.activities.map((act) => (
                <div
                  key={act.id}
                  className="flex justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs"
                >
                  <span className="font-medium text-slate-700">{act.text}</span>
                  <span className="shrink-0 pl-2 text-slate-400">
                    {new Date(act.date).toLocaleDateString("de-DE")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <label
            htmlFor="focusNote"
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600"
          >
            Gesprächsergebnis / Notiz eintragen:
          </label>
          <textarea
            id="focusNote"
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="z. B. Erreicht, an Angebot interessiert, meldet sich am Freitag..."
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-navy-500 focus:ring-navy-500"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                handleQuickCall({
                  note: noteText || "Anruf getätigt (Fokus-Modus)",
                  followUpDays: "7",
                })
              }
              className={`${bigButton} bg-navy-600 text-white hover:bg-navy-700`}
            >
              <PhoneIcon className="h-4 w-4" /> Anruf geloggt & +7d
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => openDialog("stage")}
              className={`${bigButton} bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              <CalendarCheckIcon className="h-4 w-4" /> Termin vereinbart
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                handleQuickCall({
                  note: noteText || "Mailbox besprochen / Nicht erreicht",
                  followUpDays: "2",
                })
              }
              className={`${bigButton} bg-amber-100 text-amber-800 hover:bg-amber-200`}
            >
              <VoicemailIcon className="h-4 w-4" /> Mailbox / +2d
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => openDialog("lost")}
              className={`${bigButton} bg-slate-100 text-slate-700 hover:bg-slate-200`}
            >
              Kein Interesse
            </button>

            <button
              type="button"
              onClick={advance}
              className={`${bigButton} border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 sm:col-span-2`}
            >
              Überspringen <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <ContactActionDialog
        open={dialogOpen}
        mode={dialogMode}
        contact={lite}
        targetStage={dialogMode === "stage" ? "TERMIN_VEREINBART" : undefined}
        onClose={() => setDialogOpen(false)}
        onSuccess={advance}
      />
    </div>
  );
}
