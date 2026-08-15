"use client";

// Der Rueckgaengig-Streifen unten am Bildschirm.
//
// Bewusst ereignisgesteuert statt ueber die Server-Revalidierung: wer eine
// Schnellaktion ausloest, ruft `undoMoeglich()` auf, der Streifen holt sich
// den Eintrag selbst. Damit haengt die Anzeige nicht davon ab, ob Next das
// Layout mit neu rendert.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOpenUndo, undoLast } from "@/app/(app)/contacts/results";
import { UNDO_WINDOW_SECONDS } from "@/lib/undo";
import { UndoIcon } from "@/components/icons";

const UNDO_EVENT = "crm:undo";

/** Nach einer zuruecknehmbaren Aktion aufrufen. */
export function undoMoeglich() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNDO_EVENT));
  }
}

type Eintrag = { id: string; label: string; createdAt: Date | string };

function verbleibend(createdAt: Date | string): number {
  const start = new Date(createdAt).getTime();
  return Math.max(0, Math.ceil((start + UNDO_WINDOW_SECONDS * 1000 - Date.now()) / 1000));
}

export default function UndoBar() {
  const [eintrag, setEintrag] = useState<Eintrag | null>(null);
  const [rest, setRest] = useState(0);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const laden = useCallback(async () => {
    try {
      const offen = await getOpenUndo();
      if (offen && verbleibend(offen.createdAt) > 0) {
        setEintrag(offen);
        setRest(verbleibend(offen.createdAt));
      }
    } catch {
      // Kein Rueckgaengig anzubieten ist kein Fehler, den der Nutzer sehen muss.
    }
  }, []);

  useEffect(() => {
    window.addEventListener(UNDO_EVENT, laden);
    return () => window.removeEventListener(UNDO_EVENT, laden);
  }, [laden]);

  // Herunterzaehlen, danach verschwindet der Streifen von selbst.
  useEffect(() => {
    if (!eintrag) return;
    const timer = setInterval(() => {
      const links = verbleibend(eintrag.createdAt);
      setRest(links);
      if (links <= 0) setEintrag(null);
    }, 1000);
    return () => clearInterval(timer);
  }, [eintrag]);

  if (!eintrag) return null;

  const zurueck = async () => {
    setPending(true);
    try {
      const data = new FormData();
      data.set("entryId", eintrag.id);
      await undoLast(data);
      setEintrag(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-navy-950 py-2 pl-4 pr-2 text-white shadow-lg">
        <p className="min-w-0 flex-1 truncate text-sm">{eintrag.label}</p>
        <span className="shrink-0 text-xs tabular-nums text-slate-400">{rest}s</span>
        <button
          type="button"
          onClick={zurueck}
          disabled={pending}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-gold-400 transition hover:bg-white/10 disabled:opacity-50"
        >
          <UndoIcon className="h-4 w-4" />
          {pending ? "…" : "Rückgängig"}
        </button>
      </div>
    </div>
  );
}
