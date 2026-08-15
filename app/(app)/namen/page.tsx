import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  LIST_KINDS,
  isListKind,
  listKindHints,
  listKindLabels,
  sectionOf,
} from "@/lib/namelist";
import { DEFAULT_GUIDES, guideKeyForList } from "@/lib/guides";
import { lostReasonLabels } from "@/lib/pipeline";
import NameList, { type NameEntry } from "@/components/NameList";
import GuidePanel from "@/components/GuidePanel";
import { pageTitle } from "@/components/ui";
import type { ListKind } from "@/lib/generated/prisma/enums";

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
  const kind: ListKind = liste && isListKind(liste) ? liste : "RECRUITING";

  const guideKey = guideKeyForList[kind];
  const [contacts, customGuide] = await Promise.all([
    prisma.contact.findMany({
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
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.guide.findUnique({
      where: { ownerId_key: { ownerId: user.id, key: guideKey } },
      select: { title: true, body: true },
    }),
  ]);

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
    appointmentLabel: contact.appointmentAt
      ? appointmentFormat.format(contact.appointmentAt)
      : null,
  }));

  // Wer selbst geschrieben hat, ist kein Geruest mehr – der Hinweis auf
  // fehlenden Wortlaut verschwindet dann.
  const standard = DEFAULT_GUIDES[guideKey];
  const guide = customGuide
    ? { ...standard, ...customGuide, isCustom: true, isDraft: false }
    : { ...standard, isCustom: false };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className={pageTitle}>Namensliste</h1>
        <p className="mt-1 text-sm text-slate-500">{listKindHints[kind]}</p>
      </div>

      {/* Reiter: serverseitig gefiltert, damit der Zustand in der Adresse steht
          und ein Neuladen nichts verliert. */}
      <div className="flex gap-1 rounded-full bg-slate-100 p-1">
        {LIST_KINDS.map((value) => {
          const active = value === kind;
          return (
            <Link
              key={value}
              href={`/namen?liste=${value}`}
              className={`flex min-h-11 flex-1 items-center justify-center rounded-full text-sm font-semibold transition ${
                active
                  ? "bg-white text-navy-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {listKindLabels[value]}
            </Link>
          );
        })}
      </div>

      <NameList entries={entries} kind={kind} />

      <GuidePanel
        guideKey={guideKey}
        title={guide.title}
        body={guide.body}
        isCustom={guide.isCustom}
        isDraft={guide.isDraft}
      />
    </div>
  );
}
