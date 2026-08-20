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
    <nav className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
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
            className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition sm:min-h-9 ${
              active
                ? "bg-white/12 text-white"
                : "text-slate-300 hover:bg-white/6 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
