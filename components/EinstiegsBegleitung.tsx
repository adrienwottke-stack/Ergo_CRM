import Link from "next/link";
import { ladeBegleitung } from "@/lib/begleitung";
import Fortschritt from "@/components/Fortschritt";

export default async function EinstiegsBegleitung({
  userId,
  warum,
  kompakt = false,
}: {
  userId: string;
  warum?: string | null;
  kompakt?: boolean;
}) {
  const schritte = await ladeBegleitung(userId);
  const geschafft = schritte.filter((s) => s.fertig).length;
  const naechster = schritte.find((s) => !s.fertig);
  if (!naechster)
    return (
      <p className="rounded-xl bg-sunken p-4 text-sm">
        Deine erste Runde ist geschafft. Neue Empfehlungen starten die nächste.
      </p>
    );
  if (kompakt) return (
    <section className="rounded-2xl border border-line bg-surface p-4" aria-labelledby="erste-runde">
      <h2 id="erste-runde" className="text-base font-semibold">Deine erste Runde · {geschafft} von {schritte.length}</h2>
      <div className="mt-3"><Fortschritt anteil={geschafft / schritte.length} beschriftung={`${geschafft} von ${schritte.length} Einstiegsschritten geschafft`} /></div>
      <Link href={naechster.href} className="mt-2 inline-flex min-h-11 items-center text-base font-medium text-link">{naechster.titel} →</Link>
      <details className="mt-1 border-t border-line">
        <summary className="min-h-11 cursor-pointer py-3 text-sm text-ink-muted">Alle Einstiegsschritte</summary>
        <ol className="space-y-2 text-sm text-ink-muted">{schritte.map(s => <li key={s.titel}>{s.fertig ? "✓" : "○"} {s.titel}</li>)}</ol>
        <p className="mt-3 text-sm text-ink-muted">In deinem Tempo. Ein gehaltener Termin zählt auch ohne Abschluss.</p>
        {warum && <p className="mt-3 text-sm text-ink-muted">Dafür machst du es: {warum.slice(0, 180)}{warum.length > 180 ? " …" : ""}</p>}
        <Link href="/fortschritt/warum" className="mt-2 inline-flex min-h-11 items-center text-sm text-link">Mein Warum ansehen →</Link>
      </details>
    </section>
  );
  return (
    <details className="rounded-2xl border border-line bg-surface p-5" open>
      <summary className="min-h-11 cursor-pointer font-semibold">
        Deine erste Runde · {geschafft} von {schritte.length}
      </summary>
      <div className="mt-2 space-y-3">
        <Fortschritt
          anteil={geschafft / schritte.length}
          beschriftung={`${geschafft} von ${schritte.length} Einstiegsschritten geschafft`}
        />
        <Link
          href={naechster.href}
          className="inline-flex min-h-11 items-center font-medium text-link"
        >
          {naechster.titel} →
        </Link>
        <ol className="space-y-2 text-sm text-ink-muted">
          {schritte.map((s) => (
            <li key={s.titel}>
              {s.fertig ? "✓" : "○"} {s.titel}
            </li>
          ))}
        </ol>
        <p className="text-sm text-ink-muted">
          In deinem Tempo. Ein gehaltener Termin zählt auch ohne Abschluss.
        </p>
        {warum && (
          <p className="text-sm text-ink-muted">
            Dafür machst du es: {warum.slice(0, 180)}
            {warum.length > 180 ? " …" : ""}
          </p>
        )}
        <Link
          href="/fortschritt/warum"
          className="inline-flex min-h-11 items-center text-sm text-link"
        >
          Mein Warum ansehen →
        </Link>
      </div>
    </details>
  );
}
