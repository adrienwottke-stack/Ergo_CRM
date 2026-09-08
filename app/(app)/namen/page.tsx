import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  LIST_KINDS,
  listKindHints,
  listKindLabels,
  listeAus,
  sectionOf,
} from "@/lib/namelist";
import { DEFAULT_GUIDES, guideKeyForList } from "@/lib/guides";
import { liegtSeit } from "@/lib/liegenbleiber";
import { lostReasonLabels } from "@/lib/pipeline";
import NameList, { type NameEntry } from "@/components/NameList";
import GuidePanel from "@/components/GuidePanel";
import { cn, pageTitle, column, segmentGruppe, segmentKnopf } from "@/components/ui";

export const dynamic = "force-dynamic";

const appointmentFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export default async function NamenPage({
  searchParams,
}: {
  searchParams: Promise<{ liste?: string; stufe?: string }>;
}) {
  const user = await requireUser();
  const { liste } = await searchParams;
  const kind = listeAus(liste, user.startTrack);

  const guideKey = guideKeyForList[kind];
  const contacts = await prisma.contact.findMany({
    where: { ...eigene(user.id).kontakte, listKinds: { has: kind } },
    select: {
      id: true,
      name: true,
      phone: true,
      rating: true,
      listKinds: true,
      stage: true,
      outcome: true,
      lostReason: true,
      appointmentAt: true,
      // Fuer die Liegenbleiber-Plakette. Bis hierhin lud diese Seite gar kein
      // Datum - man sah zwanzig Namen und keinem davon an, dass die Haelfte
      // seit Wochen nichts gehoert hat.
      lastProgressAt: true,
      nextStepAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Bewusst in Eingabe-Reihenfolge, nicht nach Naehe: beim Einstufen wuerden
  // sonst die Zeilen unter dem Finger wegspringen. Sortiert wird im Durchlauf,
  // wo die Reihenfolge zaehlt.
  const entries: NameEntry[] = contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    rating: contact.rating,
    listKinds: contact.listKinds,
    section: sectionOf(contact),
    lostLabel: contact.lostReason ? lostReasonLabels[contact.lostReason] : null,
    liegtTage: liegtSeit(contact),
    appointmentLabel: contact.appointmentAt
      ? appointmentFormat.format(contact.appointmentAt)
      : null,
  }));

  const guide = DEFAULT_GUIDES[guideKey];

  return (
    <div className={`${column} space-y-6`}>
      <div>
        <h1 className={pageTitle}>Kontakte</h1>
        <p className="mt-1 text-sm text-ink-muted">{listKindHints[kind]}</p>
      </div>

      {/* Reiter: serverseitig gefiltert, damit der Zustand in der Adresse steht
          und ein Neuladen nichts verliert. Dieselbe Segmented-Control wie im
          Rest der App (components/ui.ts), statt einer eigenen Pillengruppe. */}
      <div className={cn(segmentGruppe, "w-full")}>
        {LIST_KINDS.map((value) => {
          const active = value === kind;
          return (
            <Link
              key={value}
              href={`/namen?liste=${value}`}
              className={cn(segmentKnopf(active), "flex-1")}
            >
              {listKindLabels[value]}
            </Link>
          );
        })}
      </div>

      <NameList entries={entries} kind={kind} />

      <GuidePanel title={guide.title} body={guide.body} kind={kind} />
    </div>
  );
}
