"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navAktiv, type NavLink, type NavSymbol } from "@/lib/navigation";
export type { NavLink } from "@/lib/navigation";

function Symbol({ name }: { name?: NavSymbol }) {
  const paths: Record<NavSymbol, React.ReactNode> = {
    heute: (
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
    ),
    kontakte: (
      <>
        <circle cx="10" cy="8" r="3.5" />
        <path d="M3 21v-2a7 7 0 0 1 14 0v2M18 6h4M20 4v4" />
      </>
    ),
    kalender: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2" />
      </>
    ),
    fortschritt: <path d="M4 4v16h17M7 15l4-4 4 2 6-8" />,
    team: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M2 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6M19 15a5 5 0 0 1 3 5" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 shrink-0"
    >
      {paths[name ?? "heute"]}
    </svg>
  );
}
export default function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Hauptnavigation" className="crm-navigation">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={navAktiv(link, pathname) ? "page" : undefined}
          className={`crm-nav-link ${navAktiv(link, pathname) ? "crm-nav-active" : ""}`}
        >
          <Symbol name={link.symbol} />
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
