"use client";

// Der Vorfuehr-Schalter als schmaler Client-Context (Lagebild-Plan): Namen
// werden verdeckt, Zahlen bleiben echt. Server-Komponenten laufen unveraendert
// als `children` durch dieses Provider - nur GpName und VorfuehrSchalter
// (beide Client) lesen den Kontext, der Rest der Seite bleibt Server-first.
//
// Zustand lebt in sessionStorage unter "cockpit-vorfuehren": ueberlebt
// Navigation und Reload, stirbt mit dem Tab - ein Vorfuehr-Schalter, der nach
// dem naechsten Termin noch an ist, waere die schlechtere Ueberraschung.
//
// Bis zum Lesen des Tab-Zustands bleiben Inhalte vorsorglich verdeckt. So
// blitzen bei Navigation oder Reload keine Namen auf, wenn bereits vorgeführt
// wird. Server und erster Client-Render verwenden denselben Startwert.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SPEICHER_SCHLUESSEL = "cockpit-vorfuehren";

type VorfuehrKontext = { aktiv: boolean; bereit: boolean; umschalten: () => void };

const Context = createContext<VorfuehrKontext>({ aktiv: false, bereit: true, umschalten: () => {} });

/** Ob gerade vorgefuehrt wird, und der Umschalter dafuer - fuer GpName und
 *  VorfuehrSchalter. Ausserhalb eines VorfuehrProvider bleibt `aktiv` false. */
export function useVorfuehren(): VorfuehrKontext {
  return useContext(Context);
}

export default function VorfuehrProvider({ children }: { children: ReactNode }) {
  const [aktiv, setAktiv] = useState(true);
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    try {
      setAktiv(sessionStorage.getItem(SPEICHER_SCHLUESSEL) === "1");
    } catch {
      // Kein Storage (privater Modus, Browser-Einstellung) - der Schalter
      // startet dann einfach aus, wie ohne gespeicherten Zustand.
      setAktiv(false);
    }
    setBereit(true);
  }, []);

  const umschalten = () => {
    if (!bereit) return;
    setAktiv((vorher) => {
      const naechster = !vorher;
      try {
        sessionStorage.setItem(SPEICHER_SCHLUESSEL, naechster ? "1" : "0");
      } catch {
        // Der Zustand gilt trotzdem fuer diese Seite - er ueberlebt nur
        // keinen Reload.
      }
      return naechster;
    });
  };

  return <Context.Provider value={{ aktiv, bereit, umschalten }}>{children}</Context.Provider>;
}
