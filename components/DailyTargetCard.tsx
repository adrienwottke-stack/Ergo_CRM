"use client";

// Tagesziel-Kachel nach der Werkzeug-Schule: Kicker-Zeile oben, eine grosse
// ruhige Zahl mit Tabellenziffern, ein 3-px-Balken, Haarlinien-Fusszeile.
// Kein Emoji, kein Konfetti - erreicht heisst: die Zahl steht auf Gruen.

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CalendarCheckIcon, CheckIcon } from "@/components/icons";
import { card, kicker } from "@/components/ui";

export default function DailyTargetCard({
  todayCallsCount,
  todayAppointmentsCount,
}: {
  todayCallsCount: number;
  todayAppointmentsCount: number;
}) {
  const [target, setTarget] = useState<number>(15);

  const percent = Math.min(100, Math.round((todayCallsCount / target) * 100));
  const isGoalReached = todayCallsCount >= target;

  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3">
        <span className={kicker}>Tagesziel</span>
        <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs font-medium text-slate-500">
          {[10, 15, 20].map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`min-w-9 rounded-md px-2 py-1 tabular-nums transition ${
                target === t
                  ? "bg-slate-100 font-semibold text-slate-900"
                  : "hover:text-slate-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={`text-[2.1rem] font-semibold leading-none tracking-tight tabular-nums ${
            isGoalReached ? "text-emerald-600" : "text-slate-900"
          }`}
        >
          {todayCallsCount}
        </span>
        <span className="text-base font-medium tabular-nums text-slate-400">
          / {target}
        </span>
        <span className="ml-auto text-sm font-medium tabular-nums text-slate-500">
          {isGoalReached ? (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckIcon className="h-4 w-4" />
              Ziel erreicht
            </span>
          ) : (
            `${percent} %`
          )}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-slate-500">Anrufe heute</p>

      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isGoalReached ? "bg-emerald-500" : "bg-navy-700"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 text-sm">
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <CalendarCheckIcon className="h-4 w-4 text-slate-400" />
          <span className="tabular-nums">{todayAppointmentsCount}</span>
          {todayAppointmentsCount === 1 ? "Termin heute" : "Termine heute"}
        </span>

        <Link
          href="/focus"
          className="inline-flex min-h-9 items-center gap-1 font-medium text-navy-700 transition hover:text-navy-900"
        >
          Anruftag starten
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
