import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  compareByRating,
  isContactRating,
  isListKind,
  listKindLabels,
  ratingLabels,
} from "@/lib/namelist";
import { DEFAULT_GUIDES, guideKeyForList } from "@/lib/guides";
import NameDialer, { type DialerEntry } from "@/components/NameDialer";
import { pageTitle } from "@/components/ui";
import { XIcon } from "@/components/icons";
import type { ContactRating, ListKind } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function AnrufenPage({
  searchParams,
}: {
  searchParams: Promise<{ liste?: string; stufe?: string }>;
}) {
  const user = await requireUser();
  const { liste, stufe } = await searchParams;
  const kind: ListKind = liste && isListKind(liste) ? liste : "RECRUITING";
  const rating: ContactRating | null =
    stufe && isContactRating(stufe) ? stufe : null;

  const guideKey = guideKeyForList[kind];
  const [contacts, customGuide] = await Promise.all([
    prisma.contact.findMany({
      where: {
        ...eigene(user.id).kontakte,
        listKinds: { has: kind },
        outcome: "OFFEN",
        stage: { in: ["NEU", "KONTAKTIERT"] },
        // Ohne Nummer laesst sich nicht anrufen – solche Namen bleiben auf
        // der Liste, aber nicht im Durchlauf.
        phone: { not: null },
        ...(rating ? { rating } : {}),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        rating: true,
        note: true,
        stage: true,
        activities: {
          orderBy: { date: "desc" },
          take: 2,
          select: { id: true, text: true, date: true },
        },
      },
    }),
    prisma.guide.findUnique({
      where: { ownerId_key: { ownerId: user.id, key: guideKey } },
      select: { title: true, body: true },
    }),
  ]);

  // Hier zaehlt die Reihenfolge: enger Kreis zuerst.
  const queue: DialerEntry[] = contacts
    .map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone!,
      rating: contact.rating,
      note: contact.note,
      isFirstCall: contact.stage === "NEU",
      lastActivity: contact.activities[0]?.text ?? null,
    }))
    .sort(compareByRating);

  const standard = DEFAULT_GUIDES[guideKey];
  const guide = customGuide
    ? { ...standard, ...customGuide, isDraft: false }
    : standard;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className={pageTitle}>Durchlauf · {listKindLabels[kind]}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {rating
              ? `Nur ${rating} · ${ratingLabels[rating]}`
              : "Enger Kreis zuerst"}
          </p>
        </div>
        <Link
          href={`/namen?liste=${kind}`}
          className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <XIcon className="h-4 w-4" />
          Beenden
        </Link>
      </div>

      <NameDialer
        queue={queue}
        kind={kind}
        guideTitle={guide.title}
        guideBody={guide.body}
        guideIsDraft={guide.isDraft}
      />
    </div>
  );
}
