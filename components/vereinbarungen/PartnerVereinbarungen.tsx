import Link from "next/link";
import { ladeVereinbarungen, vereinbarungspartner } from "@/lib/vereinbarungen";
import VereinbarungsEditor from "./VereinbarungsEditor";
import VereinbarungsKarte from "./VereinbarungsKarte";
import { vereinbarungStatusTexte } from "@/lib/vereinbarungen-regeln";

export default async function PartnerVereinbarungen({
  userId,
  partnerId,
  kompakt = false,
}: {
  userId: string;
  partnerId: string;
  kompakt?: boolean;
}) {
  const partner = await vereinbarungspartner(userId, partnerId);
  if (!partner) return null;
  const vereinbarungen = await ladeVereinbarungen(userId, partnerId);
  const offen = vereinbarungen.filter(
    (stand) =>
      stand.status === "VORGESCHLAGEN" || stand.status === "BESTAETIGT",
  );
  const abgeschlossen = vereinbarungen.filter(
    (stand) =>
      stand.status !== "VORGESCHLAGEN" && stand.status !== "BESTAETIGT",
  );
  if (kompakt) {
    const datum = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", timeZone: "Europe/Berlin" });
    const href = `/mannschaft/vereinbarungen?partner=${partnerId}`;
    return <section className="space-y-3" aria-labelledby="gemeinsame-absprachen">
      <div className="flex items-center justify-between gap-3">
        <h2 id="gemeinsame-absprachen" className="text-xl font-semibold text-ink">Unsere Absprachen</h2>
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-link">Alle {vereinbarungen.length}</Link>
      </div>
      {offen.length ? <div className="crm-list">
        {offen.slice(0, 3).map(stand => <Link key={stand.id} href={`${href}#absprache-${stand.id}`} className="crm-list-row">
          <span className="min-w-0 flex-1"><span className="block text-base font-semibold text-ink">{stand.titel}</span><span className="mt-1 block text-sm text-ink-muted">{stand.verantwortlichName} · {datum.format(stand.faelligAm)}</span><span className="mt-1 block text-sm text-ink-muted">{vereinbarungStatusTexte[stand.status]}</span></span><span aria-hidden className="text-xl text-ink-muted">›</span>
        </Link>)}
      </div> : <p className="text-base text-ink-muted">Noch keine offene Absprache.</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1"><Link href={href} className="inline-flex min-h-11 items-center text-sm font-medium text-link">Absprache vorschlagen →</Link><Link href={`/fortschritt/neu?partner=${partnerId}`} className="inline-flex min-h-11 items-center text-sm font-medium text-link">Ziel vorschlagen →</Link></div>
    </section>;
  }
  return (
    <section className="space-y-4" aria-labelledby="gemeinsame-absprachen">
      <div>
        <h2
          id="gemeinsame-absprachen"
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          Unsere Absprachen
        </h2>
        <p className="mt-1 text-base text-slate-600">
          Was wir gemeinsam vorhaben und wer sich darum kümmert.
        </p>
      </div>
      {offen.length === 0 && (
        <p className="text-base text-slate-600">
          Noch keine offene Absprache. Schlage einen gemeinsamen nächsten
          Schritt vor.
        </p>
      )}
      {offen.map((stand) => (
        <VereinbarungsKarte key={stand.id} stand={stand} userId={userId} />
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <VereinbarungsEditor userId={userId} partner={partner} />
        <Link
          href={`/fortschritt/neu?partner=${partnerId}`}
          className="min-h-12 rounded-xl px-4 py-3 text-base font-semibold text-navy-800"
        >
          Gemeinsames Ziel vorschlagen
        </Link>
      </div>
      {abgeschlossen.length > 0 && (
        <details>
          <summary className="min-h-12 cursor-pointer py-3 text-base font-semibold text-slate-700">
            Abgeschlossene Absprachen ({abgeschlossen.length})
          </summary>
          <div className="mt-3 space-y-4">
            {abgeschlossen.map((stand) => (
              <VereinbarungsKarte
                key={stand.id}
                stand={stand}
                userId={userId}
              />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
