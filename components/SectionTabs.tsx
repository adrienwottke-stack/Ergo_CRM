"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Unterreiter eines Bereichs. Pipeline, Vorgaenge und Kontakte sind drei
// Sichten auf dieselben Daten – sie gehoeren nebeneinander statt als drei
// gleichrangige Punkte in die Kopfzeile. Bewusst als Unterstrich-Reiter und
// nicht als Pillen: die Pillen auf den Seiten filtern, diese Reiter wechseln
// die Ansicht. Zweierlei Aufgabe, zweierlei Aussehen.
export default function SectionTabs({
  tabs,
}: {
  tabs: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((tab) => {
        const base = tab.href.split("?")[0]!;
        const active = pathname === base || pathname.startsWith(`${base}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition ${
              active
                ? "border-navy-800 text-navy-900"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
