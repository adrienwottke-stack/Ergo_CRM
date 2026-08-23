"use client";

// Die Rueckmeldung an jedem Baustein (docs/wettbewerb-plan.md, Abschnitt 14.1).
//
// Drei Woerter, ein Tipp, kein Freitext. Wer tippen muss, tippt nicht - und
// Freitext hiesse Moderation, dauerhaft.
//
// Einmal je Kopf und Baustein: nach der Stimme verschwindet die Frage
// rueckstandslos. Sie ist kein Dauermoebel, sondern eine Frage - und eine
// beantwortete Frage, die stehen bleibt, ist wieder eine Zeile Oberflaeche,
// die den Partner keinen Termin naeher bringt. Ausgewertet wird sie auf dem
// Pruefstand, nicht hier.

import { useState, useTransition } from "react";
import { urteilen } from "@/app/(team)/werkstatt/urteilAction";

const antworten = [
  { wert: "STARK", text: "Stark" },
  { wert: "GEHT_SO", text: "Geht so" },
  { wert: "WEG_DAMIT", text: "Weg damit" },
] as const;

export default function Taugt({
  featureKey,
  schonGestimmt,
  kompakt = false,
}: {
  featureKey: string;
  /** Vom Server: liegt fuer diesen Kopf schon eine Stimme vor? */
  schonGestimmt: boolean;
  kompakt?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  // Sofort weg, ohne auf den Server-Refresh zu warten. Einmal abgegeben gibt
  // es keinen Weg zurueck - deshalb genuegt ein Schalter in eine Richtung.
  const [abgegeben, setAbgegeben] = useState(false);

  if (schonGestimmt || abgegeben) return null;

  const waehle = (wert: string) => {
    setAbgegeben(true);
    startTransition(async () => {
      await urteilen(featureKey, wert);
    });
  };

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
