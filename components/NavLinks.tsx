"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLink {
  href: string;
  label: string;
  exact?: boolean;
  // Weitere Pfade, die zu diesem Punkt gehoeren. "Pipeline" bleibt markiert,
  // waehrend man in den Unterreitern Vorgaenge oder Kontakte steht – sonst
  // faellt die Markierung weg und man weiss nicht mehr, wo man ist.
  match?: string[];
}

export default function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    // Seitlich scrollbar statt umbrechend – die Kopfzeile bleibt einzeilig.
    // Ohne sichtbaren Balken, der wuerde die Leiste optisch zerschneiden.
    // Aktiv ist ein 2-px-Unterstrich auf der Haarlinie der Kopfzeile
    // (der Container zieht sich per -mb-px auf sie drauf), keine Pille.
    <nav className="no-scrollbar -mb-px flex items-center gap-4 overflow-x-auto sm:gap-5">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : [link.href, ...(link.match ?? [])].some(
              (path) => pathname === path || pathname.startsWith(`${path}/`)
            );
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-0.5 text-sm font-medium transition ${
              active
                ? "border-navy-800 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
