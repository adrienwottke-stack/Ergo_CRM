"use client";

import Link from "next/link";
import { createContext, useContext } from "react";

const ProfilInitialen = createContext("");

export function ProfilProvider({ initialen, children }: { initialen: string; children: React.ReactNode }) {
  return <ProfilInitialen.Provider value={initialen}>{children}</ProfilInitialen.Provider>;
}

/** Die gleichen beiden Einstiege im mobilen Seitenkopf und in der Desktop-Leiste. */
export default function SeitenWerkzeuge() {
  const initialen = useContext(ProfilInitialen);
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Link href="/suche" aria-label="Suchen" className="crm-icon-action">
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" />
        </svg>
      </Link>
      <Link href="/profil" aria-label="Profil und Einstellungen" className="crm-profile-action">
        {initialen || <span aria-hidden>○</span>}
      </Link>
    </div>
  );
}
