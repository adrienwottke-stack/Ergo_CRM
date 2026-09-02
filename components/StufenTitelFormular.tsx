"use client";

// Die drei Vorschlags-Saetze plus freie Bearbeitung fuer die sechs
// Stufennamen (docs/emil-feedback-runde-2.md, AP-25 und D18).
//
// Eine Client-Insel wie EinheitenEintragen.tsx: ein Knopf soll alle sechs
// Felder auf einen Schlag fuellen, dafuer braucht es Zustand im Browser -
// eine Server-Komponente kann das nicht. Die Rueckmeldung beim Speichern
// laeuft ueber denselben Weg wie dort: awaiten, `.ok` pruefen, Zustand von
// Hand setzen - kein `useActionState`-Praezedenzfall im Projekt.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { stufenTitelSpeichern } from "@/app/(team)/werkstatt/actions";
import type { TitelSatz } from "@/lib/stufen";
import { btnPrimary, btnSecondary, cn, inputBlank, label } from "@/components/ui";

export default function StufenTitelFormular({
  initial,
  saetze,
  gesperrt,
}: {
  /** Die sechs Namen, wie sie gerade gelten - Werkstatt-Wert oder Mix-Fallback. */
  initial: string[];
  /** Die Vorschlags-Saetze fuer die Knoepfe, Stufe 1 zuerst je Satz. */
  saetze: readonly TitelSatz[];
  /** true, solange die Tabelle "Einstellung" auf dieser Datenbank noch fehlt. */
  gesperrt: boolean;
}) {
  const router = useRouter();
  const [titel, setTitel] = useState<string[]>(initial);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  const anwenden = useCallback((satz: TitelSatz) => {
    setTitel([...satz.titel]);
    setFehler(null);
    setGespeichert(false);
  }, []);

  const aendern = useCallback((index: number, wert: string) => {
    setTitel((alt) => alt.map((name, i) => (i === index ? wert : name)));
    setFehler(null);
    setGespeichert(false);
  }, []);

  const speichern = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (laeuft) return;
      setLaeuft(true);
      setFehler(null);
      setGespeichert(false);
      try {
        const antwort = await stufenTitelSpeichern(titel);
        if (!antwort.ok) {
          setFehler(antwort.fehler);
          return;
        }
        setGespeichert(true);
        // Arena und /spiel sind Server-Komponenten - ohne Refresh zeigen sie
        // bis zum naechsten eigenen Aufruf noch die alten Namen.
        router.refresh();
      } catch {
        setFehler("Kam nicht durch. Tipp es nochmal.");
      } finally {
        setLaeuft(false);
      }
    },
    [titel, laeuft, router]
  );

  return (
    <form onSubmit={speichern} className="mt-4 space-y-4">
      <div>
        <span className={label}>Vorschlag übernehmen</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {saetze.map((satz) => (
            <button
              key={satz.name}
              type="button"
              onClick={() => anwenden(satz)}
              className={btnSecondary}
            >
              {satz.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {titel.map((name, index) => (
          <div key={index}>
            <label htmlFor={`stufe-titel-${index}`} className={label}>
              Stufe {index + 1}
            </label>
            <input
              id={`stufe-titel-${index}`}
              type="text"
              maxLength={40}
              value={name}
              onChange={(event) => aendern(index, event.target.value)}
              aria-label={`Name für Stufe ${index + 1}`}
              className={cn(inputBlank, "mt-1.5")}
            />
          </div>
        ))}
      </div>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      {gespeichert && !fehler && (
        <p className="text-sm text-emerald-700">Übernommen.</p>
      )}

      <div className="flex justify-end border-t border-line pt-4">
        <button
          type="submit"
          disabled={laeuft || gesperrt}
          className={cn(btnPrimary, "disabled:cursor-not-allowed disabled:opacity-40")}
        >
          {laeuft ? "…" : "Übernehmen"}
        </button>
      </div>
    </form>
  );
}
