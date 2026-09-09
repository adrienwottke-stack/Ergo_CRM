"use client";

// Der Vorfuehr-Schalter: Namen werden verdeckt, Zahlen bleiben echt
// (Lagebild-Plan). Der Einstieg liegt unter Team; auf Heute lässt sich ein
// bereits aktiver Vorführmodus über den Hinweis wieder beenden.
//
// Kein Icon: components/icons.tsx hat kein Augen-/Sicht-Symbol, und ein neues
// Icon-Set fuer einen einzelnen Knopf anzulegen waere die falsche Reihenfolge
// (Hausregel: kein neues Icon-Set). Der Text traegt die Bedeutung allein.

import { filterPill } from "@/components/ui";
import { useVorfuehren } from "@/components/VorfuehrProvider";

export default function VorfuehrSchalter() {
  const { aktiv, bereit, umschalten } = useVorfuehren();

  return (
    <button
      type="button"
      onClick={umschalten}
      disabled={!bereit}
      aria-pressed={bereit && aktiv}
      aria-label="Namen verdecken fürs Vorführen — Zahlen bleiben echt"
      className={filterPill(bereit && aktiv)}
    >
      {bereit && aktiv ? "Namen verdeckt" : "Vorführen"}
    </button>
  );
}
