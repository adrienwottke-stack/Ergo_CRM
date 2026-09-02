"use client";

// Jemanden aus der eigenen Mannschaft nehmen - der Griff, den bis hierhin nur
// die Systemverwaltung hatte.
//
// Zwei Wege, und der Unterschied steht ausgeschrieben im Dialog, nicht in
// einem "Sicher?":
//
//   Austragen  – jemand hoert auf. Bleibt im Baum, zaehlt nirgends mehr mit,
//                laesst sich zurueckholen.
//   Loeschen   – ein Vertipper oder ein Kasten, der nie ein Mensch war.
//                Alles geht mit, und zwar endgueltig.
//
// Vor dem Loeschen steht der Vorname als Tippprobe. Ein roter Knopf allein ist
// auf dem Handy einen Daumen weit weg von "aus Versehen" - und anders als beim
// Admin sitzt hier jemand, der diesen Bildschirm zum Arbeiten benutzt und
// nicht zum Verwalten.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import {
  personAustragen,
  personLoeschen,
} from "@/app/(app)/mannschaft/actions";
import { TrashIcon } from "@/components/icons";
import { btnSecondary, input, label } from "@/components/ui";

export default function PersonEntfernen({
  memberId,
  name,
  vorname,
  platzhalter,
  ausgetreten,
  kontakte,
  direkte,
  ueberName,
}: {
  memberId: string;
  name: string;
  vorname: string;
  /** Kein Konto, nur ein Knoten im Baum: dann gibt es nichts auszutragen. */
  platzhalter: boolean;
  ausgetreten: boolean;
  /** Eigene Kontakte, die beim Loeschen mitgehen. */
  kontakte: number;
  /** Direkte, die beim Loeschen eine Ebene hochruecken. */
  direkte: number;
  /** An wen die Direkten danach haengen. Null = sie werden Wurzel. */
  ueberName: string | null;
}) {
  const [offen, setOffen] = useState(false);
  const [probe, setProbe] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const passt = probe.trim().toLowerCase() === vorname.toLowerCase();

  const schliessen = () => {
    setOffen(false);
    setProbe("");
    setFehler(null);
  };

  const austragen = (wieder: boolean) => {
    startTransition(async () => {
      setFehler(null);
      const daten = new FormData();
      daten.set("memberId", memberId);
      daten.set("wieder", wieder ? "1" : "0");
      const ergebnis = await personAustragen(daten);
      if (ergebnis && "fehler" in ergebnis && ergebnis.fehler) {
        setFehler(ergebnis.fehler);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Ein Platzhalter hat nie gearbeitet - "austragen" waere ein Vermerk
          ueber jemanden, der nie dabei war. Fuer ihn gibt es nur den einen
          Weg: weg. */}
      {!platzhalter && (
        <button
          type="button"
          disabled={pending}
          onClick={() => austragen(ausgetreten)}
          className={`${btnSecondary} disabled:opacity-60`}
        >
          {ausgetreten
            ? `${vorname} zurückholen`
            : `${vorname} austragen`}
        </button>
      )}

      <button
        type="button"
        onClick={() => setOffen(true)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-13 font-medium text-ink-soft transition hover:bg-red-50 hover:text-red-700"
      >
        <TrashIcon className="h-4 w-4" />
        Löschen
      </button>

      {fehler && (
        <p className="w-full rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">
          {fehler}
        </p>
      )}

      <Modal
        open={offen}
        onClose={schliessen}
        title="Endgültig löschen?"
        subtitle={name}
      >
        <form
          action={(daten) => {
            startTransition(async () => {
              daten.set("memberId", memberId);
              await personLoeschen(daten);
            });
          }}
        >
          <p className="text-sm text-ink-muted">
            Das lässt sich nicht rückgängig machen.
          </p>

          <ul className="mt-3 space-y-1.5 text-sm text-ink-muted">
            <li className="flex gap-2">
              <span aria-hidden className="text-ink-soft">
                —
              </span>
              {kontakte === 0
                ? "Keine eigenen Kontakte vorhanden."
                : `${kontakte} ${kontakte === 1 ? "Kontakt geht" : "Kontakte gehen"} mit, samt Vorgeschichte.`}
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-ink-soft">
                —
              </span>
              Ranglisten-Einträge, Punkte und Einheiten verschwinden.
            </li>
            {direkte > 0 && (
              <li className="flex gap-2">
                <span aria-hidden className="text-ink-soft">
                  —
                </span>
                {direkte === 1 ? "Die Person" : `Die ${direkte} Personen`} unter{" "}
                {vorname} {direkte === 1 ? "rückt" : "rücken"} eine Ebene hoch
                {ueberName ? ` und hängt${direkte === 1 ? "" : "en"} dann unter ${ueberName}` : ""} —
                samt eigener Leute. Gelöscht wird nur {vorname}.
              </li>
            )}
          </ul>

          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Nur für Vertipper und Kästen, hinter denen nie jemand stand. Wer
            aufhört, gehört auf „Austragen“ — dann bleibt die Historie stehen.
          </p>

          <div className="mt-4">
            <label htmlFor={`probe-${memberId}`} className={label}>
              Zum Bestätigen „{vorname}“ tippen
            </label>
            <input
              id={`probe-${memberId}`}
              type="text"
              autoComplete="off"
              value={probe}
              onChange={(event) => setProbe(event.target.value)}
              className={input}
            />
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={schliessen} className={btnSecondary}>
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!passt || pending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-fest-gefahr px-5 text-sm font-medium text-white transition hover:bg-fest-gefahr-stark active:scale-[0.99] disabled:opacity-40"
            >
              {pending ? "Löscht …" : "Endgültig löschen"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
