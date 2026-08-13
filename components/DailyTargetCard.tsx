"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneIcon, CalendarCheckIcon } from "@/components/icons";

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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-100 text-navy-700 font-bold text-sm">
            🎯
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dein Tagesziel</h3>
            <p className="text-xs text-slate-500">Heutige Anrufe & Erfolge</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg p-1">
          <span className="px-1.5 text-slate-500">Ziel:</span>
          {[10, 15, 20].map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`px-2 py-0.5 rounded transition ${
                target === t ? "bg-white text-navy-700 shadow-xs font-bold" : "hover:text-slate-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs font-bold mb-1.5">
          <span className="text-slate-700 flex items-center gap-1.5">
            <PhoneIcon className="h-3.5 w-3.5 text-navy-600" />
            {todayCallsCount} von {target} Anrufen
          </span>
          <span className={isGoalReached ? "text-emerald-600 font-extrabold" : "text-navy-600"}>
            {percent}%
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isGoalReached ? "bg-emerald-500" : "bg-navy-600"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-purple-700 font-semibold">
          <CalendarCheckIcon className="h-4 w-4 text-purple-600" />
          <span>{todayAppointmentsCount} {todayAppointmentsCount === 1 ? "Termin" : "Termine"} heute vereinbart</span>
        </div>

        <Link
          href="/focus"
          className="font-bold text-navy-600 hover:text-navy-800 hover:underline flex items-center gap-1"
        >
          Anruftag starten →
        </Link>
      </div>

      {isGoalReached && (
        <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-xs text-emerald-800 font-medium text-center">
          🎉 Stark! Du hast dein heutiges Tagesziel von {target} Anrufen erreicht!
        </div>
      )}
    </div>
  );
}
