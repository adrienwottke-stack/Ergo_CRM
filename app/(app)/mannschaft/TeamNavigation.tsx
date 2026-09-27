import Link from "next/link";

export default function TeamNavigation({
  aktiv,
}: {
  aktiv: "begleiten" | "ueberblick" | "auswertung";
}) {
  return (
    <nav
      aria-label="Teamansichten"
      className="crm-view-tabs crm-team-views"
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
        >
          {eintrag.titel}
        </Link>
      ))}
    </nav>
  );
}
