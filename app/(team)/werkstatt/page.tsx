import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { berlinToday, dayToUtcDate, shiftDay } from "@/lib/dates";
import { card, chip, cn, kicker, pageTitle, td, th } from "@/components/ui";
import { MegafonIcon } from "@/components/icons";
import { OFFENE_STAENDE } from "@/lib/rueckmeldung";
import { schalten } from "./actions";

export const dynamic = "force-dynamic";

// Der Pruefstand. Bewusst nur fuer den Admin: Produktarbeit gehoert nicht in
// den Alltag eines Partners - der soll Termine machen, nicht Software
// verwalten.
//
// Eine Frage an jeden Baustein: benutzt ihn ueberhaupt jemand? Die Abstimmung
// ("Taugt das?") stand frueher an jedem Block der Arena und ist raus
// (docs/audit-kernmodell.md, 5.14). Nutzung schlaegt Stimmen ohnehin - was
// keiner anfasst, kann noch so gut gefallen.

const standTexte: Record<string, string> = {
  TEST: "Test",
  LAEUFT: "Läuft",
  AUS: "Abgeschaltet",
  ABGERISSEN: "Abgerissen",
};

const standStile: Record<string, string> = {
  TEST: "bg-navy-50 text-navy-700 ring-navy-600/20",
  LAEUFT: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  AUS: "bg-slate-100 text-slate-600 ring-slate-400/20",
  ABGERISSEN: "bg-slate-100 text-slate-500 ring-slate-400/20",
};

// Darunter fliegt ein Baustein nach drei Wochen raus.
const ABRISS_KOEPFE = 3;

export default async function WerkstattPage() {
  await requireAdmin();

  const sieben = dayToUtcDate(shiftDay(berlinToday(), -7));

  const [features, nutzung, koepfe, offeneMeldungen] = await Promise.all([
    prisma.feature.findMany({ orderBy: { titel: "asc" } }),
    prisma.featureUse.findMany({
      where: { day: { gte: sieben } },
      select: { featureKey: true, personId: true },
    }),
    prisma.person.count(),
    prisma.rueckmeldung.count({ where: { stand: { in: [...OFFENE_STAENDE] } } }),
  ]);

  const kopfZahl = new Map<string, Set<string>>();
  for (const zeile of nutzung) {
    let set = kopfZahl.get(zeile.featureKey);
    if (!set) {
      set = new Set();
      kopfZahl.set(zeile.featureKey, set);
    }
    set.add(zeile.personId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>Werkstatt</h1>
        <p className="mt-1 text-sm text-slate-500">
          Nur für dich. Wie viele Köpfe jeden Baustein in den letzten sieben
          Tagen überhaupt benutzt haben.
        </p>
      </div>

      {/* Der Rueckkanal daneben. Nutzung sagt, WAS keiner anfasst - die
          Rueckmeldung sagt, WARUM. Das eine ersetzt das andere nicht. */}
      <Link
        href="/werkstatt/rueckmeldungen"
        className={cn(
          card,
          "flex items-center gap-3 p-4 transition hover:-translate-y-px hover:border-line-strong hover:schatten-hoch",
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600">
          <MegafonIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-slate-900">Rückmeldungen</span>
          <span className="block text-[13px] text-slate-500">
            Was die Leute von sich aus melden.
          </span>
        </span>
        <span className={cn(chip(offeneMeldungen > 0 ? "gefahr" : "neutral"), "ml-auto")}>
          {offeneMeldungen} offen
        </span>
      </Link>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/60">
            <tr>
              <th className={th}>Baustein</th>
              <th className={`${th} text-right`}>Benutzt von</th>
              <th className={th}>Stand</th>
              <th className={th}>Schalter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {features.map((feature) => {
              const benutzt = kopfZahl.get(feature.key)?.size ?? 0;
              return (
                <tr key={feature.key} className="align-top">
                  <td className={`${td} font-medium text-slate-900`}>
                    {feature.titel}
                    {feature.beschreibung && (
                      <p className="mt-1 max-w-sm text-xs font-normal leading-relaxed text-slate-500">
                        {feature.beschreibung}
                      </p>
                    )}
                    {feature.grund && (
                      <p className="mt-1 max-w-sm text-xs font-normal text-slate-500">
                        Bleibt drin, weil: {feature.grund}
                      </p>
                    )}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    {/* Warnfarbe erst, wenn die Schwelle ueberhaupt reissbar ist -
                        bei zwei Koepfen waere sonst alles orange. */}
                    <span
                      className={
                        koepfe >= ABRISS_KOEPFE && benutzt < ABRISS_KOEPFE
                          ? "text-amber-600"
                          : "text-slate-900"
                      }
                    >
                      {benutzt}
                    </span>
                    <span className="text-slate-400"> / {koepfe}</span>
                  </td>
                  <td className={td}>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-11 font-semibold ring-1 ring-inset ${standStile[feature.state]}`}
                    >
                      {standTexte[feature.state]}
                    </span>
                  </td>
                  <td className={td}>
                    <form action={schalten} className="space-y-2">
                      <input type="hidden" name="key" value={feature.key} />
                      <select
                        name="state"
                        defaultValue={feature.state}
                        aria-label={`Stand von ${feature.titel}`}
                        className="min-h-9 w-full rounded-lg border border-slate-300 bg-surface px-2 text-xs"
                      >
                        {Object.entries(standTexte).map(([wert, text]) => (
                          <option key={wert} value={wert}>
                            {text}
                          </option>
                        ))}
                      </select>
                      <input
                        name="grund"
                        defaultValue={feature.grund ?? ""}
                        placeholder="Bleibt drin, weil …"
                        aria-label={`Grund für ${feature.titel}`}
                        className="min-h-9 w-full rounded-lg border border-slate-300 px-2 text-xs"
                      />
                      <button
                        type="submit"
                        className="min-h-9 w-full rounded-lg border border-slate-300 bg-surface px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Übernehmen
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={kicker}>
        Gezählt wird, von wie vielen Köpfen ein Baustein benutzt wurde — nie, von
        wem. Was von weniger als {ABRISS_KOEPFE} Personen benutzt wird, steht nach
        drei Wochen zur Abschaltung. Nutzung statt Meinung: die Abstimmung in der
        Arena ist weg, sie kostete den Partner Aufmerksamkeit und brachte ihm
        keinen Termin.
      </p>
    </div>
  );
}
