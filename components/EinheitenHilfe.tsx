"use client";

// Die ?-Hilfe an jedem Einheiten-Feld (docs/emil-feedback-plan.md, AP-03).
//
// Emils Notiz war kein fehlendes Feature, sondern eine fehlende Antwort:
// "Wo finde ich meine Einheiten?" Die Antwort steht jetzt genau dort, wo die
// Frage entsteht - am Feld selbst, nicht auf einer Hilfeseite, die niemand
// aufruft.
//
// Ueber ein Portal an <body> gehaengt und ueber die Position des Knopfs
// platziert (fixed, aus getBoundingClientRect()): so bleibt die Karte auch
// sichtbar, wenn der Knopf in einem Modal mit eigenem Scroll-Bereich sitzt
// (components/Schnellzugriff.tsx, components/EinheitenNachAbschluss.tsx) -
// ein Kind von overflow-y-auto wuerde eine nur absolut positionierte Karte
// sonst abschneiden.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const HILFE_TEXT =
  "Deine Einheiten findest du in der ERGO Prothek-App (App Store) — oder frag deine Führungskraft.";

const KARTEN_BREITE = 260;
const RAND = 8;

export default function EinheitenHilfe() {
  const id = useId();
  const [offen, setOffen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const knopfRef = useRef<HTMLButtonElement>(null);
  const karteRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const positionieren = useCallback(() => {
    const knopf = knopfRef.current;
    if (!knopf) return;
    const rect = knopf.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: Math.min(
        Math.max(RAND, rect.left + rect.width / 2 - KARTEN_BREITE / 2),
        window.innerWidth - KARTEN_BREITE - RAND
      ),
    });
  }, []);

  useEffect(() => {
    if (!offen) return;
    positionieren();

    const aussenklick = (event: MouseEvent) => {
      const ziel = event.target as Node;
      if (knopfRef.current?.contains(ziel) || karteRef.current?.contains(ziel)) {
        return;
      }
      setOffen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOffen(false);
    };

    window.addEventListener("mousedown", aussenklick);
    window.addEventListener("keydown", escape);
    window.addEventListener("resize", positionieren);
    // capture: faengt auch das Scrollen eines Modal-Innenraums ab, nicht nur
    // das Fenster selbst.
    window.addEventListener("scroll", positionieren, true);
    return () => {
      window.removeEventListener("mousedown", aussenklick);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("resize", positionieren);
      window.removeEventListener("scroll", positionieren, true);
    };
  }, [offen, positionieren]);

  return (
    <>
      <button
        ref={knopfRef}
        type="button"
        onClick={() => setOffen((wert) => !wert)}
        aria-label="Wo finde ich meine Einheiten?"
        aria-expanded={offen}
        aria-controls={id}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sunken text-[11px] font-semibold text-ink-muted transition hover:bg-line hover:text-ink"
      >
        ?
      </button>

      {offen &&
        mounted &&
        position &&
        createPortal(
          <div
            id={id}
            ref={karteRef}
            style={{ top: position.top, left: position.left, width: KARTEN_BREITE }}
            className="glas-stark fixed z-[60] rounded-xl border border-line p-3 text-13 leading-snug text-ink schatten-pop"
          >
            {HILFE_TEXT}
          </div>,
          document.body
        )}
    </>
  );
}
