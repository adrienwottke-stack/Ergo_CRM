"use client";

import { useState } from "react";
import Link from "next/link";
import { quickLogCall, quickSetStatus } from "@/app/(app)/contacts/actions";
import type { ContactStatus } from "@/lib/generated/prisma/enums";
import StatusBadge from "@/components/StatusBadge";
import { PhoneIcon, CalendarCheckIcon, ChevronRightIcon } from "@/components/icons";
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
  source?: string | null;
  status: ContactStatus;
  note?: string | null;
  nextFollowUp?: string | Date | null;
  activities: Activity[];
}

export default function FocusDialer({ queue }: { queue: Contact[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (queue.length === 0 || currentIndex >= queue.length) {
    return (
      <div className={`${card} p-10 text-center space-y-4`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
          🎉
        </div>
        <h2 className="text-xl font-bold text-slate-900">Klasse gemacht!</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Du hast alle fälligen Kontakte für deinen heutigen Fokus-Durchlauf abgearbeitet.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link href="/dashboard" className={btnPrimary}>
            Zurück zum Dashboard
          </Link>
          <Link href="/leaderboard" className={btnSecondary}>
            Rangliste ansehen 🏆
          </Link>
        </div>
      </div>
    );
  }

  const current = queue[currentIndex]!;
  const progressPercent = Math.round(((currentIndex) / queue.length) * 100);

  const handleAction = async (actionFn: (formData: FormData) => Promise<void>, extraFields?: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("contactId", current.id);
      if (extraFields) {
        Object.entries(extraFields).forEach(([k, v]) => formData.set(k, v));
      }
      await actionFn(formData);
      setNoteText("");
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Progress Bar */}
      <div className={`${card} p-4 space-y-2`}>
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Fortschritt: {currentIndex + 1} von {queue.length} Kontakten</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-navy-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Focus Card */}
      <div className={`${card} p-6 sm:p-8 space-y-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{current.name}</h2>
              <StatusBadge status={current.status} />
            </div>
            {current.source && (
              <p className="mt-1 text-xs text-slate-500">Quelle: {current.source}</p>
            )}
          </div>
          <Link
            href={`/contacts/${current.id}`}
            target="_blank"
            className="text-xs font-medium text-navy-600 hover:underline flex items-center gap-1"
          >
            Vollständiges Profil ↗
          </Link>
        </div>

        {/* Quick Call Header */}
        <div className="grid gap-4 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Telefon</span>
            {current.phone ? (
              <div className="mt-1 flex items-center gap-3">
                <a
                  href={`tel:${current.phone}`}
                  className="text-lg font-bold text-navy-700 hover:underline flex items-center gap-2"
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">E-Mail</span>
            {current.email ? (
              <p className="mt-1 text-sm font-medium text-slate-800">
                <a href={`mailto:${current.email}`} className="hover:underline text-navy-600">
                  {current.email}
                </a>
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">–</p>
            )}
          </div>
        </div>

        {/* Notes & Context */}
        {current.note && (
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Notiz zum Kontakt</span>
            <p className="mt-1 text-sm text-amber-900 whitespace-pre-wrap">{current.note}</p>
          </div>
        )}

        {/* Last Activities */}
        {current.activities.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Letzte Aktivitäten</h4>
            <div className="space-y-2">
              {current.activities.map((act) => (
                <div key={act.id} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between">
                  <span className="font-medium text-slate-700">{act.text}</span>
                  <span className="text-slate-400">
                    {new Date(act.date).toLocaleDateString("de-DE")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Panel */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Gesprächsergebnis / Notiz eintragen:
          </label>
          <textarea
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
              onClick={() => handleAction(quickLogCall, { note: noteText || "Anruf getätigt (Fokus-Modus)", followUpDays: "7" })}
              className="flex items-center justify-center gap-2 rounded-lg bg-navy-600 px-4 py-3 text-sm font-semibold text-white hover:bg-navy-700 transition disabled:opacity-50"
            >
              <PhoneIcon className="h-4 w-4" /> Anruf geloggt & +7d
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction(quickSetStatus, { status: "APPOINTMENT" })}
              className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
            >
              <CalendarCheckIcon className="h-4 w-4" /> 📅 Termin vereinbart 🎉
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction(quickLogCall, { note: noteText || "Mailbox besprochen / Nicht erreicht", followUpDays: "2" })}
              className="flex items-center justify-center gap-2 rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-200 transition disabled:opacity-50"
            >
              🗣️ Mailbox / +2d
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Überspringen <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
