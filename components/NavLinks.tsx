"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({
  links,
}: {
  links: { href: string; label: string; exact?: boolean }[];
}) {
  const pathname = usePathname();

  return (
    // Am Handy seitlich scrollbar statt umbrechend – die Kopfzeile bleibt einzeilig.
    <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
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
