import Link from "next/link";

export default function TeamNavigation({
  aktiv,
}: {
  aktiv: "begleiten" | "ueberblick" | "auswertung";
}) {
  return (
    <nav
      aria-label="Teamansichten"
      className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1"
    >
      {[
        { key: "begleiten", titel: "Begleiten", href: "/mannschaft" },
        {
          key: "auswertung",
          titel: "Auswertung",
          href: "/mannschaft/auswertung",
        },
        {
          key: "ueberblick",
          titel: "Struktur",
          href: "/mannschaft?bereich=ueberblick",
        },
      ].map((eintrag) => (
        <Link
          key={eintrag.key}
          href={eintrag.href}
          aria-current={aktiv === eintrag.key ? "page" : undefined}
          className={`flex min-h-12 items-center justify-center rounded-xl px-2 py-3 text-sm font-semibold sm:text-base ${aktiv === eintrag.key ? "bg-surface text-ink" : "text-slate-700"}`}
        >
          {eintrag.titel}
        </Link>
      ))}
    </nav>
  );
}
