import Link from "next/link";
import { cn, card } from "@/components/ui";
import { berlinDayOf, dayToUtcDate, shiftDay } from "@/lib/dates";
import type { KalenderEintrag } from "@/lib/kalender/laden";
import { CalendarCheckIcon, PhoneIcon } from "@/components/icons";
import { beschriftung, stilFuer } from "./eintrag-stil";
import { kalenderEintragHref } from "./kontakt-link";

// Die Liste - was hier vorher die ganze Seite war.
//
// Sie bleibt die Voreinstellung am Handy, und zwar aus dem Grund, der im alten
// Kommentar stand und weiter gilt: die Frage lautet unterwegs nicht "wie sieht
// der Mai aus", sondern "was steht als Naechstes an". Neu ist nur, dass sie
// nicht mehr die einzige Antwort ist - und dass fremde Termine mitlaufen.

const tagFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});

const zeitFormat = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export function Agenda({
  eintraege,
  heute,
  rueckweg,
}: {
  eintraege: KalenderEintrag[];
  heute: string;
  rueckweg: string;
}) {
  const tage = new Map<string, KalenderEintrag[]>();
  for (const eintrag of eintraege) {
    const tag = berlinDayOf(eintrag.von);
    const liste = tage.get(tag) ?? [];
    liste.push(eintrag);
    tage.set(tag, liste);
  }

  if (tage.size === 0) {
    return (
      <div className={`${card} px-6 py-12 text-center`}>
        <p className="text-sm font-medium text-ink">Nichts eingetragen</p>
        <p className="mt-1 text-sm text-ink-muted">
          Termine entstehen im Gespräch — der Knopf „Termin“ im{" "}
          <Link href="/namen" className="font-medium text-navy-600 hover:underline">
            Durchlauf
          </Link>{" "}
          legt sie an. Alles andere — Schulung, Begleitung, ein privater Blocker —
          trägst du hier selbst ein.
        </p>
      </div>
    );
  }

  const morgen = shiftDay(heute, 1);
  const gestern = shiftDay(heute, -1);
  const tagName = (tag: string) => {
    if (tag === heute) return "Heute";
    if (tag === morgen) return "Morgen";
    if (tag === gestern) return "Gestern";
    return tagFormat.format(dayToUtcDate(tag));
  };

  return (
    <div className="space-y-6">
      {[...tage.entries()].map(([tag, liste]) => (
        <section key={tag} className="space-y-2">
          <h2
            className={cn(
              "text-base font-semibold",
              tag < heute ? "text-ink-soft" : "text-ink"
            )}
          >
            {tagName(tag)}
            <span className="ml-2 text-sm font-normal text-ink-soft">{liste.length}</span>
          </h2>
          <ul className={`${card} divide-y divide-line overflow-hidden`}>
            {liste.map((eintrag) => {
              const stil = stilFuer(eintrag);
              const ziel = kalenderEintragHref(eintrag, rueckweg);
              const vergangen = tag < heute;
              const zeile = (
                <>
                  <span className="flex w-14 shrink-0 items-center gap-1.5">
                    <span
                      className={cn("h-2 w-2 shrink-0 rounded-full", stil.punkt)}
                    />
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        vergangen ? "text-ink-muted" : "text-navy-800",
                      )}
                    >
                      {eintrag.ganztags ? "—" : zeitFormat.format(eintrag.von)}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-base font-semibold",
                        vergangen ? "text-ink-muted" : "text-ink",
                        ziel && "group-hover:text-link",
                      )}
                    >
                      {ziel ? eintrag.titel : beschriftung(eintrag)}
                    </span>
                    {(eintrag.zusatz || eintrag.quelleName) && (
                      <span className="block truncate text-xs text-ink-muted">
                        {[eintrag.quelleName && `aus ${eintrag.quelleName}`, eintrag.zusatz]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </>
              );
              return (
                <li
                  key={eintrag.id}
                  className="flex min-h-16 items-center gap-3 px-4 py-3"
                >
                  {ziel ? (
                    <Link
                      href={ziel}
                      className="group flex min-h-11 min-w-0 flex-1 items-center gap-3"
                    >
                      {zeile}
                    </Link>
                  ) : (
                    <div className="flex min-h-11 min-w-0 flex-1 items-center gap-3">
                      {zeile}
                    </div>
                  )}

                  <div className="flex shrink-0 items-center gap-1">
                    {eintrag.telefon && !eintrag.kontaktId && (
                      <a
                        href={`tel:${eintrag.telefon.replace(/\s/g, "")}`}
                        aria-label={`${eintrag.titel} anrufen`}
                        className="flex min-h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <PhoneIcon className="h-4 w-4" />
                      </a>
                    )}
                    {eintrag.kontaktId && (
                      <a
                        href={`/kalender/${eintrag.kontaktId}.ics`}
                        aria-label={`Termin mit ${eintrag.titel} in den Kalender übernehmen`}
                        title="Einzeln in den Kalender des Handys übernehmen"
                        className="flex min-h-11 w-11 items-center justify-center rounded-lg text-ink-soft transition hover:bg-sunken hover:text-navy-700"
                      >
                        <CalendarCheckIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
