"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "@/components/icons";

// Alles, was man selten braucht, liegt hinter den Initialen: Verwaltung,
// Ansichts-Schalter, Abmelden. Die Kopfzeile bleibt dadurch einzeilig und
// zeigt nur noch die Orte, an denen taeglich gearbeitet wird.
export default function UserMenu({
  name,
  subline,
  links,
  children,
}: {
  name: string;
  subline?: string;
  links: { href: string; label: string }[];
  // Serverseitig gerenderte Formulare (Ansicht umschalten, Abmelden).
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Nach einem Seitenwechsel darf das Menue nicht offen stehen bleiben.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

  return (
    <div ref={wrapper} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Konto und Einstellungen"
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full pl-1 pr-1.5 transition sm:pr-2 ${
          open ? "bg-white/12" : "hover:bg-white/6"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-[13px] font-semibold text-white">
          {initials || "?"}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_16px_40px_-12px_rgb(15_23_42/0.35)]"
        >
          <div className="border-b border-slate-100 px-4 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            {subline && (
              <p className="truncate text-xs text-slate-500">{subline}</p>
            )}
          </div>

          {links.length > 0 && (
            <div className="border-b border-slate-100 py-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  className="flex min-h-11 items-center px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          <div className="py-1 [&_button]:flex [&_button]:min-h-11 [&_button]:w-full [&_button]:items-center [&_button]:px-4 [&_button]:text-left [&_button]:text-sm [&_button]:font-medium [&_button]:text-slate-700 [&_button]:transition hover:[&_button]:bg-slate-50 hover:[&_button]:text-slate-900">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
