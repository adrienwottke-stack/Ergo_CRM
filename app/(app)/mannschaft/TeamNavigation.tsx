import Link from "next/link";
import { cn, segmentGruppe, segmentKnopf } from "@/components/ui";

export default function TeamNavigation({
  aktiv,
}: {
  aktiv: "begleiten" | "ueberblick" | "auswertung";
}) {
  return (
    <nav
      aria-label="Teamansichten"
      className={cn(segmentGruppe, "w-full")}
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
          className={cn(segmentKnopf(aktiv === eintrag.key), "min-w-0 flex-1 !px-2")}
        >
          {eintrag.titel}
        </Link>
      ))}
    </nav>
  );
}
