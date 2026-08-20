"use client";

import { useState, useTransition } from "react";
import { briefSpeichern } from "@/app/(willkommen)/willkommen/actions";
import { briefFrage } from "@/lib/willkommen";

// Der Brief an sich selbst. Zwei Saetze, dann wird er weggelegt - und kommt
// genau einmal zurueck: in dem Moment, in dem er hinschmeissen will
// (/heute zeigt ihn nach 14 Tagen Dabeisein und einer Woche Stille).
// Die Leute gehen nicht, weil die Software schlecht ist.

export default function BriefAkt({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const weglegen = () => {
    const inhalt = text.trim();
    if (!inhalt) return;
    startTransition(async () => {
      await briefSpeichern(inhalt);
      onDone();
    });
  };

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div className="space-y-2">
        {briefFrage.map((zeile, index) => (
          <p
            key={index}
            className={
              index === 0
                ? "text-2xl font-bold leading-snug text-white"
                : "text-sm leading-relaxed text-slate-300"
            }
          >
            {zeile}
          </p>
        ))}
      </div>

      <textarea
        rows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={2000}
        placeholder="Ich mach das, weil …"
        className="w-full rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-[15px] leading-relaxed text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
      />

      <div className="space-y-3">
        <button
          type="button"
          onClick={weglegen}
          disabled={pending || text.trim().length === 0}
          className="min-h-12 w-full rounded-xl bg-gold-400 text-[15px] font-bold text-navy-950 transition hover:bg-gold-100 active:scale-[0.98] disabled:opacity-40"
        >
          {pending ? "Wird weggelegt …" : "Weglegen"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="block w-full text-center text-sm text-slate-400 hover:text-white"
        >
          Lieber nicht
        </button>
      </div>
    </div>
  );
}
