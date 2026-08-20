"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ersterTagPlanen,
  versprechenSetzen,
  willkommenAbschliessen,
} from "@/app/(willkommen)/willkommen/actions";
import type { ListKind } from "@/lib/generated/prisma/enums";

// Die Ankunft: erst das 30-Tage-Versprechen (selbst gesetzt, steht ab dann
// jeden Tag auf /heute), dann wird der erste Nachmittag GEPLANT statt nur
// gewuenscht - drei Anrufe stehen im Kalender, bevor er die App das erste Mal
// selbst bedient. Der Uebergang vom Start in die Arbeit ist die Stelle, an
// der die meisten verloren gehen; hier gibt es ihn nicht.

const ZIELE = [4, 8, 12];

export default function Ankunft({
  track,
  sprintAnzahl,
  onFertig,
}: {
  track: ListKind;
  sprintAnzahl: number;
  onFertig?: () => void;
}) {
  const router = useRouter();
  const [ziel, setZiel] = useState<number | null | "offen">("offen");
  const [plan, setPlan] = useState<{ anzahl: number; label: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Der Nachmittag wird im Hintergrund geplant, waehrend er sein Ziel waehlt.
  useEffect(() => {
    let aktiv = true;
    ersterTagPlanen()
      .then((ergebnis) => {
        if (aktiv) setPlan(ergebnis);
      })
      .catch(() => {
        if (aktiv) setPlan({ anzahl: 0, label: "" });
      });
    return () => {
      aktiv = false;
    };
  }, []);

  const zielWaehlen = (termine: number | null) => {
    if (navigator.vibrate) navigator.vibrate(12);
    setZiel(termine);
    if (termine !== null) {
      startTransition(async () => {
        await versprechenSetzen(termine);
      });
    }
  };

  const los = (zielPfad: string) => {
    startTransition(async () => {
      await willkommenAbschliessen();
      onFertig?.();
      router.replace(zielPfad);
      router.refresh();
    });
  };

  const teilenText = encodeURIComponent(
    sprintAnzahl > 0
      ? `Bin drin. ${sprintAnzahl} Namen stehen. 💪`
      : "Bin drin. Namensliste kommt heute noch. 💪"
  );

  if (ziel === "offen") {
    return (
      <div className="flex h-full flex-col justify-center gap-6">
        <div>
          <h2 className="text-2xl font-bold leading-snug text-white">
            Eine Zahl noch. Deine.
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            Wie viele Termine schaffst du in den nächsten 30 Tagen? Steht ab
            morgen jeden Tag auf deiner Heute-Seite. An Tag 30 rechnen wir ab —
            du gegen deine Zahl.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {ZIELE.map((wert) => (
            <button
              key={wert}
              type="button"
              onClick={() => zielWaehlen(wert)}
              className="min-h-20 rounded-2xl border border-white/25 bg-white/5 text-3xl font-bold text-white transition hover:border-gold-400 hover:bg-white/10 active:scale-[0.95]"
            >
              {wert}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => zielWaehlen(null)}
          className="block w-full text-center text-sm text-slate-400 hover:text-white"
        >
          Ohne Ziel starten
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-7">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">
          ✓
        </span>
        <h2 className="mt-4 text-3xl font-bold text-white">
          Fertig. Ab hier arbeitest du.
        </h2>
        <div className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-300">
          {sprintAnzahl > 0 && (
            <p>
              Deine {sprintAnzahl} Namen warten in der Liste
              {typeof ziel === "number" ? ` — dein Ziel: ${ziel} Termine in 30 Tagen.` : "."}
            </p>
          )}
          {sprintAnzahl === 0 && typeof ziel === "number" && (
            <p>Dein Ziel: {ziel} Termine in 30 Tagen.</p>
          )}
          {plan && plan.anzahl > 0 && (
            <p className="font-medium text-white">
              Deine ersten {plan.anzahl} Anrufe stehen {plan.label} in deiner
              Heute-Liste. Kein „was mach ich jetzt“.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => los(`/namen?liste=${track}`)}
          className="min-h-14 w-full rounded-xl bg-gold-400 text-lg font-bold text-navy-950 transition hover:bg-gold-100 active:scale-[0.98] disabled:opacity-40"
        >
          Zur Namensliste
        </button>
        <a
          href={`https://wa.me/?text=${teilenText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 bg-white/5 text-[15px] font-semibold text-white transition hover:bg-white/10"
        >
          Kurz zurückmelden — „Bin drin“
        </a>
        <button
          type="button"
          disabled={pending}
          onClick={() => los("/heute")}
          className="block w-full text-center text-sm text-slate-400 hover:text-white"
        >
          Erst mal umschauen
        </button>
      </div>
    </div>
  );
}
