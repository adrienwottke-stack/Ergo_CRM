import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import { isListKind, listKindLabels } from "@/lib/namelist";
import NamenSammeln from "@/components/NamenSammeln";
import { pageTitle } from "@/components/ui";
import { XIcon } from "@/components/icons";
import type { ListKind } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function SammelnPage({
  searchParams,
}: {
  searchParams: Promise<{ liste?: string }>;
}) {
  const user = await requireUser();
  const { liste } = await searchParams;
  const kind: ListKind = liste && isListKind(liste) ? liste : "RECRUITING";

  const vorhanden = await prisma.contact.count({
    where: { ...eigene(user.id).kontakte, listKinds: { has: kind } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className={pageTitle}>Namen sammeln</h1>
          <p className="mt-1 text-sm text-slate-500">
            {listKindLabels[kind]} · alles aufschreiben, nichts aussortieren
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

      <NamenSammeln kind={kind} vorhanden={vorhanden} />
    </div>
  );
}
