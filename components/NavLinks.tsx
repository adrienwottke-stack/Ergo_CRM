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
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
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
