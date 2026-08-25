"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLink {
  href: string;
  label: string;
  exact?: boolean;
  // Weitere Pfade, die zu diesem Punkt gehoeren – sonst faellt die Markierung
  // auf Unterseiten weg und man weiss nicht mehr, wo man ist.
  match?: string[];
}

export default function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    // Seitlich scrollbar statt umbrechend – die Kopfzeile bleibt einzeilig.
    // Ohne sichtbaren Balken, der wuerde die Leiste optisch zerschneiden.
    // Aktiv ist ein 2-px-Unterstrich auf der Haarlinie der Kopfzeile
    // (der Container zieht sich per -mb-px auf sie drauf), keine Pille.
    //
    // Die Leiste steht auf dem dunklen Navy der Kopfzeile, deshalb die
    // hellen Farben. Der aktive Punkt ist der einzige Ort, an dem Gold
    // traegt statt nur zu schmuecken: man findet sich damit sofort wieder.
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
                ? "border-gold-400 text-white"
                : "border-transparent text-navy-200 hover:border-navy-600 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
