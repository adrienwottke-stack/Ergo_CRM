"use client";

// Der Name eines gefuehrten Beraters im Fuehrungsbereich: zeigt `kurz`
// (Zaehlname, vom Server via lib/vorfuehren.ts vorgerechnet), solange der
// Vorfuehr-Schalter an ist - sonst den echten Namen (Lagebild-Plan).
//
// Die Zaehlnamen rechnet idealerweise die Server-Seite: zaehlnamen() braucht
// die ganze Namensliste einer Seite auf einmal, um durchzuzaehlen - eine
// einzelne GpName-Instanz kennt nur sich selbst und koennte keine zur Seite
// passende Nummer vergeben.
//
// `kurz` ist trotzdem optional: ein Aufrufer ohne Server-Map (z. B. die
// MannschaftsMatrix, bis die Mannschafts-Seite die Map durchreicht) zeigt
// beim Vorfuehren nur unnummeriertes "GP" - unnummeriert, weil ohne Map
// keine stabile Nummer moeglich ist. Aufrufer sollen die Map reichen, sobald
// sie GpName einbauen.

import { useVorfuehren } from "@/components/VorfuehrProvider";

export default function GpName({ name, kurz }: { name: string; kurz?: string }) {
  const { aktiv } = useVorfuehren();
  if (!aktiv) return <>{name}</>;
  return <>{kurz ?? "GP"}</>;
}
