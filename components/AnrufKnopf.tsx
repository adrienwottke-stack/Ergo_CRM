"use client";

// Anruf-Link mit Rueckkehr-Frage fuer die Kontaktakte.
//
// contacts/[id]/page.tsx ist eine Server-Komponente und kann
// "visibilitychange" nicht selbst hoeren - dafuer braucht es dieses kleine
// Client-Inselchen. Dasselbe Muster wie im Durchlauf
// (components/NameDialer.tsx:85-96) und in den Zeilen-Aktionen der
// Heute-Liste (components/QuickRowActions.tsx:84-103): der Link merkt sich
// den Klick, "visibilitychange" meldet die Rueckkehr aus der Telefon-App.
// Bewusst kein Datenbankfeld (L2, docs/emil-feedback-runde-2.md) - wer die
// Seite verlaesst, verliert die Frage.
//
// Die Akte hat aber keine eigene Ergebnisleiste wie QuickRowActions - die
// Knoepfe stehen schon weiter oben in "Naechster Schritt" (ContactActions).
// Diese Komponente schreibt deshalb selbst nichts und ruft keine Aktion auf;
// sie holt nach der Rueckkehr nur den Blick per Anker/Fokus dorthin, wo die
// Knoepfe bereits stehen.
import { useEffect, useRef, useState } from "react";

export default function AnrufKnopf({
  telefon,
  vorname,
  zielId,
}: {
  telefon: string;
  vorname: string;
  /** id der Sektion mit den vorhandenen Ergebnis-Knoepfen (ContactActions). */
  zielId: string;
}) {
  const [zurueck, setZurueck] = useState(false);
  const angerufen = useRef(false);

  useEffect(() => {
    const beiSichtbar = () => {
      if (document.visibilityState === "visible" && angerufen.current) {
        setZurueck(true);
      }
    };
    document.addEventListener("visibilitychange", beiSichtbar);
    return () => document.removeEventListener("visibilitychange", beiSichtbar);
  }, []);

  return (
    <div className="mt-1 text-sm text-ink">
      <a
        href={`tel:${telefon}`}
        onClick={() => {
          angerufen.current = true;
        }}
        className="font-medium text-navy-600 hover:underline"
      >
        {telefon}
      </a>

      {zurueck && (
        <p className="mt-1.5 text-sm text-ink">
          {`Wie lief's mit ${vorname}? `}
          <a
            href={`#${zielId}`}
            onClick={(event) => {
              event.preventDefault();
              const ziel = document.getElementById(zielId);
              ziel?.scrollIntoView({ behavior: "smooth", block: "start" });
              ziel?.focus();
            }}
            className="font-medium text-navy-600 hover:underline"
          >
            Ergebnis eintragen
          </a>
        </p>
      )}
    </div>
  );
}
