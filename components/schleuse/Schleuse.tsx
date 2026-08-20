"use client";

import { useEffect, useState } from "react";
import { zweigErmitteln, type Zweig } from "@/lib/geraet";
import AndroidInstallieren from "./AndroidInstallieren";
import AusInAppBrowser from "./AusInAppBrowser";
import IphoneAnleitung from "./IphoneAnleitung";
import Rahmen from "./Rahmen";

// Die Installations-Schleuse (docs/willkommen-plan.md, Akt 0).
//
// Das Anmeldeformular erscheint erst, wenn die Seite vom Startbildschirm
// laeuft. Kein "Trotzdem weiter" - wenn ein Geraet wirklich nicht mitspielt,
// gibt der Einladende diese eine Einladung frei (Prop "freigegeben").
//
// Die Entscheidung faellt im Browser und ist damit keine Sicherheitsgrenze,
// sondern Fuehrung. Fuer den Zweck reicht das.
export default function Schleuse({
  freigegeben,
  link,
  qr,
  children,
}: {
  freigegeben: boolean;
  link: string;
  qr: React.ReactNode;
  children: React.ReactNode;
}) {
  const [zweig, setZweig] = useState<Zweig>("unbekannt");

  useEffect(() => {
    const pruefen = () => setZweig(zweigErmitteln());
    pruefen();

    // Wird die App waehrend des Lesens installiert, soll der Bildschirm
    // mitziehen, statt die Anleitung stehen zu lassen.
    const abfrage = window.matchMedia("(display-mode: standalone)");
    abfrage.addEventListener("change", pruefen);
    window.addEventListener("appinstalled", pruefen);
    return () => {
      abfrage.removeEventListener("change", pruefen);
      window.removeEventListener("appinstalled", pruefen);
    };
  }, []);

  if (freigegeben || zweig === "app") return <>{children}</>;

  // Erster Renderdurchlauf: noch nichts entschieden. Lieber eine ruhige
  // Flaeche als ein Formular, das gleich wieder verschwindet.
  if (zweig === "unbekannt") {
    return <div className="min-h-screen bg-navy-950" aria-hidden="true" />;
  }

  return (
    <div className="min-h-screen bg-navy-950">
      {zweig === "inapp" && <AusInAppBrowser link={link} />}
      {zweig === "android" && <AndroidInstallieren />}
      {zweig === "iphone" && <IphoneAnleitung />}
      {zweig === "rechner" && (
        <Rahmen
          kicker="Falsches Gerät"
          titel="Das gehört auf dein Handy"
          text={
            <p>
              Ergo CRM arbeitet dort, wo du telefonierst. Scann den Code mit deiner
              Handykamera – dann geht es dort weiter, wo es hingehört.
            </p>
          }
          fuss={
            <p className="break-all rounded-lg bg-white/5 px-3 py-2 font-mono text-[12px] text-navy-200 ring-1 ring-inset ring-white/10">
              {link}
            </p>
          }
        >
          {qr}
        </Rahmen>
      )}
    </div>
  );
}
