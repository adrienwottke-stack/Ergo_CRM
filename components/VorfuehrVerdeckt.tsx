"use client";

// Ganze Abschnitte ausblenden statt halb verdecken (Lagebild-Plan, Bauschritt
// 3b): das Organigramm (components/Organigramm.tsx) und die Struktur-Liste
// daneben zeigen Klarnamen tief im Markup, ohne GpName - eine nachtraegliche
// Umstellung war fuer diesen Bauschritt nicht vorgesehen. Halb verdeckt waere
// schlimmer als gar nicht: ein Kuerzel in der Matrix neben einem Klarnamen im
// Baum verraet die Zuordnung von selbst.
//
// "use client": nur useVorfuehren() weiss, ob gerade vorgefuehrt wird -
// `children` laeuft als bereits gerenderter Server-Baum unveraendert durch,
// solange der Schalter aus ist. Kostet dann nichts.

import { useVorfuehren } from "@/components/VorfuehrProvider";
import type { ReactNode } from "react";

export default function VorfuehrVerdeckt({
  children,
  hinweis,
}: {
  children: ReactNode;
  hinweis: string;
}) {
  const { aktiv } = useVorfuehren();
  if (aktiv) {
    return <p className="text-xs text-ink-soft">{hinweis}</p>;
  }
  return <>{children}</>;
}
