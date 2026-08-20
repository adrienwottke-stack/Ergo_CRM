"use client";

import { useEffect } from "react";
import { laeuftAlsApp } from "@/lib/geraet";
import { installationMelden } from "@/app/(app)/actions";

// Meldet einmalig, dass dieses Konto die App vom Startbildschirm startet.
// Ob das so ist, weiss nur der Browser - deshalb diese Zeile Client-Code
// statt einer Serverpruefung (docs/willkommen-plan.md, Abschnitt 7.7).
export default function InstallationMelder({ melden }: { melden: boolean }) {
  useEffect(() => {
    if (!melden || !laeuftAlsApp()) return;
    void installationMelden();
  }, [melden]);

  return null;
}
