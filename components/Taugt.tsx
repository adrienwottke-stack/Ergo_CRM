"use client";

// Die Rueckmeldung an jedem Baustein (docs/wettbewerb-plan.md, Abschnitt 14.1).
//
// Drei Woerter, ein Tipp, kein Freitext. Wer tippen muss, tippt nicht - und
// Freitext hiesse Moderation, dauerhaft. Nach der Stimme verschwindet die
// Frage: sie ist kein Dauermoebel, sondern eine Frage.
//
// Bewusst useState statt useOptimistic: der "aendern"-Griff braucht einen
// Zustand, der auch AUSSERHALB einer laufenden Transition gesetzt werden darf.
// Ein useOptimistic-Setter ausserhalb einer Transition wird von React sofort
// verworfen - der Knopf sah aus wie tot (im Live-Test am 20.08. bestaetigt).

import { useState, useTransition } from "react";
import { urteilen } from "@/app/(team)/werkstatt/urteilAction";

const antworten = [
  { wert: "STARK", text: "Stark" },
  { wert: "GEHT_SO", text: "Geht so" },
  { wert: "WEG_DAMIT", text: "Weg damit" },
] as const;

export default function Taugt({
  featureKey,
  stimme,
  kompakt = false,
}: {
  featureKey: string;
  stimme: string | null;
  kompakt?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  // Lokal getroffene Wahl. Faellt nach dem Server-Refresh mit `stimme`
  // zusammen; bis dahin traegt sie die Anzeige.
  const [wahl, setWahl] = useState<string | null>(null);
  const [offen, setOffen] = useState(false);

  const anzeige = offen ? null : (wahl ?? stimme);

  const waehle = (wert: string) => {
    setWahl(wert);
    setOffen(false);
    startTransition(async () => {
      await urteilen(featureKey, wert);
    });
  };

  if (anzeige) {
    return (
      <p className="text-[11px] text-slate-400">
        Dein Urteil: {antworten.find((a) => a.wert === anzeige)?.text}
        {" · "}
        <button
          type="button"
          onClick={() => setOffen(true)}
          className="underline transition hover:text-slate-600"
        >
          ändern
        </button>
      </p>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${kompakt ? "" : "mt-3 border-t border-slate-100 pt-3"}`}
    >
      <span className="text-[11px] font-medium text-slate-400">Taugt das?</span>
      {antworten.map((antwort) => (
        <button
          key={antwort.wert}
          type="button"
          disabled={pending}
          onClick={() => waehle(antwort.wert)}
          className="min-h-8 rounded-full border border-slate-200 px-2.5 text-[11px] font-medium text-slate-500 transition hover:border-navy-300 hover:bg-navy-50 hover:text-navy-700 disabled:opacity-50"
        >
          {antwort.text}
        </button>
      ))}
    </div>
  );
}
