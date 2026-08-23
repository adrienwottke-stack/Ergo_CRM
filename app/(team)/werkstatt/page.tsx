import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { berlinToday, dayToUtcDate, shiftDay } from "@/lib/dates";
import { card, kicker, pageTitle, td, th } from "@/components/ui";
import { schalten } from "./actions";

export const dynamic = "force-dynamic";

// Der Pruefstand. Bewusst nur fuer den Admin: die Abstimmung selbst laeuft
// unauffaellig in der Arena ("Taugt das?", eine Stimme je Kopf, danach weg).
// Die Auswertung ist Produktarbeit und gehoert nicht in den Alltag eines
// Partners - der soll Termine machen, nicht Software verwalten.
//
// Was hier zusammenkommt, sind zwei getrennte Fragen an jeden Baustein:
// Was sagen die Leute? Und - unabhaengig davon - benutzt ihn ueberhaupt jemand?
// Nutzung schlaegt Stimmen: was keiner anfasst, kann noch so gut gefallen.

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

  const [features, nutzung, koepfe] = await Promise.all([
    prisma.feature.findMany({
      orderBy: { titel: "asc" },
      include: { votes: { select: { urteil: true } } },
    }),
    prisma.featureUse.findMany({
      where: { day: { gte: sieben } },
      select: { featureKey: true, personId: true },
    }),
    prisma.person.count(),
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
          Nur für dich. Was die Leute über jeden Baustein gesagt haben — und
          davon getrennt, wie viele ihn in den letzten sieben Tagen überhaupt
          benutzt haben.
        </p>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/60">
            <tr>
              <th className={th}>Baustein</th>
              <th className={th}>Stimmen</th>
              <th className={`${th} text-right`}>Benutzt von</th>
              <th className={th}>Stand</th>
              <th className={th}>Schalter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {features.map((feature) => {
              const stark = feature.votes.filter((v) => v.urteil === "STARK").length;
              const gehtSo = feature.votes.filter((v) => v.urteil === "GEHT_SO").length;
              const weg = feature.votes.filter((v) => v.urteil === "WEG_DAMIT").length;
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
                  <td className={`${td} tabular-nums text-slate-600`}>
                    {feature.votes.length === 0 ? (
                      <span className="text-slate-400">noch keine</span>
                    ) : (
                      <span className="whitespace-nowrap">
                        {stark} stark · {gehtSo} geht so · {weg} weg
                      </span>
                    )}
                    <span className="mt-0.5 block text-xs text-slate-400">
                      {feature.votes.length} von {koepfe} haben geantwortet
                    </span>
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
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${standStile[feature.state]}`}
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
                        className="min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs"
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
                        className="min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
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
        drei Wochen zur Abschaltung. Gestimmt wird einmal je Kopf; danach
        verschwindet die Frage aus der Arena.
      </p>
    </div>
  );
}
