"use client";

// Der Name eines gefuehrten Beraters im Fuehrungsbereich: zeigt `kurz`
// (Initialen, vom Server via lib/vorfuehren.ts vorgerechnet), solange der
// Vorfuehr-Schalter an ist - sonst den echten Namen (Lagebild-Plan).
//
// Die Kuerzel rechnet die Server-Seite, nicht diese Komponente:
// initialenKuerzel() braucht die ganze Namensliste auf einmal, um
// Kollisionen zu erkennen - eine einzelne GpName-Instanz kennt nur sich
// selbst.

import { useVorfuehren } from "@/components/VorfuehrProvider";

export default function GpName({ name, kurz }: { name: string; kurz: string }) {
  const { aktiv } = useVorfuehren();
  return <>{aktiv ? kurz : name}</>;
}
