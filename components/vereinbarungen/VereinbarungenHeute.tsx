import Link from "next/link";
import { ladeHeuteVereinbarungen } from "@/lib/vereinbarungen";
import VereinbarungsKarte from "./VereinbarungsKarte";
import { vereinbarungStatusTexte } from "@/lib/vereinbarungen-regeln";

export default async function VereinbarungenHeute({
  userId,
  kompakt = false,
  auslassenId,
}: {
  userId: string;
  kompakt?: boolean;
  auslassenId?: string;
}) {
  const vereinbarungen = (await ladeHeuteVereinbarungen(userId)).filter((stand) => stand.id !== auslassenId);
  if (vereinbarungen.length === 0) return null;
  if (kompakt) {
    const datum = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", timeZone: "Europe/Berlin" });
    return <section className="space-y-3" aria-labelledby="absprachen-heute">
      <div className="flex items-center justify-between gap-3">
        <h2 id="absprachen-heute" className="text-xl font-semibold text-ink">Gemeinsam dran</h2>
        <Link href="/mannschaft/vereinbarungen" className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-link">Alle {vereinbarungen.length}</Link>
      </div>
      <div className="crm-list">
        {vereinbarungen.slice(0, 3).map((stand) => <Link key={stand.id} href={`/mannschaft/vereinbarungen?partner=${stand.partner.id}#absprache-${stand.id}`} className="crm-list-row">
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-ink">{stand.titel}</span>
            <span className="mt-1 block text-sm text-ink-muted">Mit {stand.partner.name} · {datum.format(stand.faelligAm)}</span>
            <span className="mt-1 block text-sm text-ink-muted">{vereinbarungStatusTexte[stand.status]}</span>
          </span>
          <span aria-hidden className="text-xl text-ink-muted">›</span>
        </Link>)}
      </div>
    </section>;
  }
  return (
    <section className="space-y-4" aria-labelledby="absprachen-heute">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="absprachen-heute"
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          Gemeinsam dran
        </h2>
        <Link
          href="/mannschaft/vereinbarungen"
          className="min-h-11 py-2 text-base font-medium text-navy-800"
        >
          Alle Absprachen
        </Link>
      </div>
      {vereinbarungen.slice(0, 3).map((stand) => (
        <VereinbarungsKarte
          key={stand.id}
          stand={stand}
          userId={userId}
          kompakt
        />
      ))}
      {vereinbarungen.length > 3 && (
        <p className="text-base text-slate-600">
          {vereinbarungen.length - 3} weitere unter „Alle Absprachen“.
        </p>
      )}
    </section>
  );
}
