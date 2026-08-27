import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  LIST_KINDS,
  andereListe,
  isListKind,
  listKindHints,
  listKindLabels,
  listKindListLabels,
} from "@/lib/namelist";
import NamenSammeln from "@/components/NamenSammeln";
import {
  card,
  cardInteractive,
  chip,
  pageTitle,
  columnNarrow,
} from "@/components/ui";
import { ChevronRightIcon, XIcon } from "@/components/icons";
import type { ListKind } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

// Der Kopf ist fuer beide Zustaende derselbe - nur die Unterzeile wechselt.
function Kopf({ unterzeile, zurueck }: { unterzeile: string; zurueck: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className={pageTitle}>Namen sammeln</h1>
        <p className="mt-1 text-sm text-ink-muted">{unterzeile}</p>
      </div>
      <Link
        href={zurueck}
        className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
      >
        <XIcon className="h-4 w-4" />
        Beenden
      </Link>
    </div>
  );
}

export default async function SammelnPage({
  searchParams,
}: {
  searchParams: Promise<{ liste?: string }>;
}) {
  const user = await requireUser();
  const { liste } = await searchParams;

  // Hier bewusst NICHT listeAus: die anderen Namens-Seiten zeigen nur an und
  // duerfen deshalb eine Liste vorschlagen. Diese hier SCHREIBT zwanzig Namen
  // am Stueck - und was geschrieben wird, soll niemand geraten bekommen.
  //
  // Steht die Liste in der Adresse, ist die Wahl schon getroffen: dann kam der
  // Aufruf aus einem Reiter, aus dem Nachfuell-Hinweis der Liste oder aus dem
  // Abschluss der letzten Runde. Noch einmal zu fragen waere ein
  // Entscheidungspunkt ohne Entscheidung (docs/audit-kernmodell.md, 1.5).
  const kind: ListKind | null = liste && isListKind(liste) ? liste : null;

  if (!kind) {
    // Die Zahlen gehoeren zur Frage: "auf Verkauf stehen schon 14, auf
    // Recruiting keiner" beantwortet sie oft von allein.
    const zaehle = (wert: ListKind) =>
      prisma.contact.count({
        where: { ...eigene(user.id).kontakte, listKinds: { has: wert } },
      });
    const [recruiting, verkauf] = await Promise.all([
      zaehle("RECRUITING"),
      zaehle("VERKAUF"),
    ]);
    const anzahl: Record<ListKind, number> = {
      RECRUITING: recruiting,
      VERKAUF: verkauf,
    };

    // Was er sich beim Start vorgenommen hat, steht oben. Kein Vorbelegen,
    // keine Vorauswahl - nur die Reihenfolge und ein Etikett. Getippt werden
    // muss trotzdem.
    const reihenfolge: ListKind[] = user.startTrack
      ? [user.startTrack, andereListe(user.startTrack)]
      : LIST_KINDS;

    return (
      <div className={`${columnNarrow} space-y-5`}>
        <Kopf unterzeile="Zuerst: für welche Liste?" zurueck="/namen" />

        <div className="space-y-3">
          {reihenfolge.map((wert) => (
            <Link
              key={wert}
              href={`/namen/sammeln?liste=${wert}`}
              className={`${cardInteractive} flex items-center gap-4 p-5`}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-ink">
                    {listKindListLabels[wert]}
                  </span>
                  {user.startTrack === wert && (
                    <span className={chip("info")}>Dein Ziel</span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-ink-muted">
                  {listKindHints[wert]}
                </span>
                <span className="mt-2 block text-13 text-ink-soft">
                  {anzahl[wert] === 0
                    ? "Noch keine Namen"
                    : `${anzahl[wert]} ${anzahl[wert] === 1 ? "Name steht" : "Namen stehen"} schon dort`}
                </span>
              </span>
              <ChevronRightIcon className="h-5 w-5 shrink-0 text-ink-soft" />
            </Link>
          ))}
        </div>

        {/* Der Satz nimmt der Frage das Gewicht: falsch tippen kostet hier
            keinen Abend mehr, seit der Abschluss die ganze Runde umhaengt. */}
        <p className={`${card} px-4 py-3 text-13 text-ink-muted`}>
          Zehn Fragen, danach stehen die Namen auf dieser Liste. Vertippt? Am
          Ende der Runde hängst du alle mit einem Tipp um.
        </p>
      </div>
    );
  }

  const vorhanden = await prisma.contact.count({
    where: { ...eigene(user.id).kontakte, listKinds: { has: kind } },
  });

  return (
    <div className={`${columnNarrow} space-y-5`}>
      <Kopf
        unterzeile={`${listKindLabels[kind]} · alles aufschreiben, nichts aussortieren`}
        zurueck={`/namen?liste=${kind}`}
      />

      <NamenSammeln kind={kind} vorhanden={vorhanden} />
    </div>
  );
}
