"use client";

// Die Unterebene des Wettbewerbs.
//
// In der Hauptnavigation steht ein einziger Punkt ("Wettbewerb"). Was darunter
// zusammengehoert, verlinkt sich hier: die Arena als Ort des Geschehens, die
// Rangliste als Tabelle, die eigenen Aktivitaeten zum Nachtragen. Drei Seiten,
// eine Sache - das gehoert eine Ebene tiefer und nicht in die Kopfzeile.

import Link from "next/link";
import { usePathname } from "next/navigation";

const PUNKTE = [
  { href: "/arena", label: "Arena" },
  { href: "/leaderboard", label: "Rangliste" },
  { href: "/log", label: "Meine Aktivitäten" },
];

export default function WettbewerbNav() {
  const pathname = usePathname();

  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
      {PUNKTE.map((punkt) => {
        const aktiv = pathname === punkt.href;
        return (
          <Link
            key={punkt.href}
            href={punkt.href}
            aria-current={aktiv ? "page" : undefined}
            className={`flex min-h-11 flex-1 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${
              aktiv
                ? "bg-white text-navy-900 ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {punkt.label}
          </Link>
        );
      })}
    </div>
  );
}
