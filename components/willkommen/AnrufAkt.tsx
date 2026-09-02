"use client";

import { useEffect, useState } from "react";
import { anrufAktName, type AnrufAktName } from "@/app/(willkommen)/willkommen/actions";
import { DEFAULT_GUIDES, guideKeyForList } from "@/lib/guides";
import NameDialer from "@/components/NameDialer";

// Akt "anruf": der Sprint sammelt Namen, sagt aber nie "ruf einen davon an".
// Genau EIN Name, eingebettet in den vorhandenen Durchlauf (NameDialer) -
// dieselbe Aktion (recordCallResult), kein zweiter Schreibpfad. Muster wie
// NamenSprint.tsx: eine kurze Ansage, ein Start-Knopf, ein "spaeter"-Ausgang.
//
// Gibt es keinen erreichbaren Namen (kein NEU mit Nummer), ist dieser Akt fuer
// diesen Durchlauf einfach nicht da - sofort onDone, ohne etwas zu zeigen.
// Gleiches Muster wie Einstufung.tsx.

type Phase = "laedt" | "intro" | "anruf";

export default function AnrufAkt({ onDone }: { onDone: () => void }) {
  const [daten, setDaten] = useState<AnrufAktName | null>(null);
  const [phase, setPhase] = useState<Phase>("laedt");

  useEffect(() => {
    let aktiv = true;
    anrufAktName()
      .then((ergebnis) => {
        if (!aktiv) return;
        if (!ergebnis) {
          onDone();
          return;
        }
        setDaten(ergebnis);
        setPhase("intro");
      })
      .catch(() => onDone());
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "laedt" || !daten) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Dein erster Anruf kommt …</p>
      </div>
    );
  }

  const guide = DEFAULT_GUIDES[guideKeyForList[daten.kind]];

  if (phase === "intro") {
    return (
      <div className="flex h-full flex-col justify-center gap-6">
        <div className="space-y-2">
          <p className="text-3xl font-bold text-white">Ein Name, ein Anruf.</p>
          <p className="text-base leading-relaxed text-slate-300">
            {daten.eintrag.name} steht auf deiner Liste. Ruf jetzt an — der
            Leitfaden „{guide.title}“ liegt direkt daneben, falls dir die
            Worte fehlen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPhase("anruf")}
          className="min-h-14 w-full rounded-xl bg-akzent text-lg font-bold text-white transition hover:bg-akzent-stark active:scale-[0.98]"
        >
          Los
        </button>
        <button
          type="button"
          onClick={onDone}
          className="block w-full text-center text-sm text-slate-400 hover:text-white"
        >
          Mach ich später
        </button>
      </div>
    );
  }

  return (
    <NameDialer
      queue={[daten.eintrag]}
      kind={daten.kind}
      guideTitle={guide.title}
      guideBody={guide.body}
      onFertig={onDone}
    />
  );
}
