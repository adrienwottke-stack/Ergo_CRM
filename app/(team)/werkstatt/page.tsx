import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { berlinToday, dayToUtcDate, shiftDay } from "@/lib/dates";
import { merkeNutzung } from "@/lib/features";
import Taugt from "@/components/Taugt";
import { card, input, kicker, pageTitle, sectionTitle, td, th } from "@/components/ui";
import { WUNSCH_STIMMEN, schalten, wunschAnlegen, wunschStimme } from "./actions";

export const dynamic = "force-dynamic";

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

// Nutzung schlaegt Stimmen: darunter fliegt ein Baustein nach drei Wochen raus.
const ABRISS_KOEPFE = 3;

export default async function WerkstattPage() {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  await merkeNutzung("werkstatt", person.id);

  const sieben = dayToUtcDate(shiftDay(berlinToday(), -7));

  const [features, nutzung, koepfe, wuensche, meineWunschStimmen] = await Promise.all([
    prisma.feature.findMany({
      orderBy: { titel: "asc" },
      include: { votes: { select: { urteil: true, personId: true } } },
    }),
    prisma.featureUse.findMany({
      where: { day: { gte: sieben } },
      select: { featureKey: true, personId: true },
    }),
    prisma.person.count(),
    prisma.wunsch.findMany({
      where: { stand: "OFFEN" },
      include: { _count: { select: { votes: true } } },
    }),
    prisma.wunschVote.findMany({
      where: { personId: person.id },
      select: { wunschId: true },
    }),
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

  const gestimmt = new Set(meineWunschStimmen.map((v) => v.wunschId));
  const restStimmen = Math.max(0, WUNSCH_STIMMEN - meineWunschStimmen.length);

  const lebend = features.filter((f) => f.state !== "ABGERISSEN");
  const friedhof = features.filter((f) => f.state === "ABGERISSEN");

  // Ein Satz zur Lage - dieselbe Stimme wie in der Rangliste, nur ueber
  // Funktionen statt ueber Menschen.
  const bester = [...lebend]
    .map((f) => ({
      titel: f.titel,
      stark: f.votes.filter((v) => v.urteil === "STARK").length,
    }))
    .sort((a, b) => b.stark - a.stark)[0];
  const abstieg = lebend.find(
    (f) => f.state === "TEST" && (kopfZahl.get(f.key)?.size ?? 0) < ABRISS_KOEPFE
  );

  const sortierteWuensche = [...wuensche].sort(
    (a, b) => b._count.votes - a._count.votes || a.titel.localeCompare(b.titel)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Werkstatt</h1>
        <p className="mt-1 text-sm text-slate-500">
          Was bleibt, entscheidet ihr. Jeder Baustein steht zur Abstimmung — und
          was keiner benutzt, fliegt nach drei Wochen raus.
        </p>
        {bester && bester.stark > 0 && (
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-medium">{bester.titel}</span> führt
            {abstieg ? (
              <>
                {" "}
                — <span className="font-medium">{abstieg.titel}</span> steht auf
                Abstieg.
              </>
            ) : (
              "."
            )}
          </p>
        )}
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/60">
            <tr>
              <th className={th}>Baustein</th>
              <th className={th}>Stimmen</th>
              <th className={`${th} text-right`}>Benutzt von</th>
              <th className={th}>Stand</th>
              <th className={th}>Dein Urteil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lebend.map((feature) => {
              const stark = feature.votes.filter((v) => v.urteil === "STARK").length;
              const gehtSo = feature.votes.filter((v) => v.urteil === "GEHT_SO").length;
              const weg = feature.votes.filter((v) => v.urteil === "WEG_DAMIT").length;
              const benutzt = kopfZahl.get(feature.key)?.size ?? 0;
              const meine =
                feature.votes.find((v) => v.personId === person.id)?.urteil ?? null;
              return (
                <tr key={feature.key} className="align-top">
                  <td className={`${td} font-medium text-slate-900`}>
                    {feature.titel}
                    {feature.grund && (
                      <p className="mt-1 max-w-xs text-xs font-normal text-slate-500">
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
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    <span
                      className={
                        benutzt < ABRISS_KOEPFE ? "text-amber-600" : "text-slate-900"
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
                    <Taugt featureKey={feature.key} stimme={meine} kompakt />
                    {user.role === "ADMIN" && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] text-slate-400">
                          Schalter
                        </summary>
                        <form action={schalten} className="mt-2 space-y-2">
                          <input type="hidden" name="key" value={feature.key} />
                          <select
                            name="state"
                            defaultValue={feature.state}
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
                            className="min-h-9 w-full rounded-lg border border-slate-300 px-2 text-xs"
                          />
                          <button
                            type="submit"
                            className="min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Übernehmen
                          </button>
                        </form>
                      </details>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={sectionTitle}>Wunschzettel</h2>
          <span className={kicker}>
            {restStimmen} von {WUNSCH_STIMMEN} Stimmen frei
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Was als Nächstes gebaut wird. Drei Stimmen pro Kopf — nochmal tippen
          nimmt sie zurück. Neue Wünsche in die Gruppe schreiben.
        </p>
        <ul className={`${card} divide-y divide-slate-100`}>
          {sortierteWuensche.map((wunsch) => {
            const dabei = gestimmt.has(wunsch.id);
            return (
              <li
                key={wunsch.id}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
              >
                <span className="text-slate-800">{wunsch.titel}</span>
                <form action={wunschStimme} className="flex shrink-0 items-center gap-3">
                  <input type="hidden" name="wunschId" value={wunsch.id} />
                  <span className="w-6 text-right tabular-nums text-slate-500">
                    {wunsch._count.votes}
                  </span>
                  <button
                    type="submit"
                    disabled={!dabei && restStimmen === 0}
                    className={`min-h-9 rounded-full px-3 text-xs font-semibold transition disabled:opacity-40 ${
                      dabei
                        ? "bg-navy-800 text-white"
                        : "border border-slate-300 text-slate-600 hover:border-navy-300 hover:text-navy-700"
                    }`}
                  >
                    {dabei ? "Dabei" : "Will ich"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>

        {user.role === "ADMIN" && (
          <form action={wunschAnlegen} className="flex gap-2">
            <input
              name="titel"
              placeholder="Neuer Wunsch aus der Gruppe …"
              className={`${input} mt-0`}
            />
            <button
              type="submit"
              className="min-h-11 shrink-0 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Eintragen
            </button>
          </form>
        )}
      </div>

      {friedhof.length > 0 && (
        <div className="space-y-3">
          <h2 className={sectionTitle}>Friedhof</h2>
          <ul className={`${card} divide-y divide-slate-100`}>
            {friedhof.map((feature) => (
              <li
                key={feature.key}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm text-slate-500"
              >
                <span>{feature.titel}</span>
                <span className="tabular-nums">
                  {feature.votes.filter((v) => v.urteil === "STARK").length} von{" "}
                  {koepfe} fanden es gut
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Gezählt wird, von wie vielen Köpfen ein Baustein benutzt wurde — nie, von
        wem. Was von weniger als {ABRISS_KOEPFE} Personen benutzt wird, steht nach
        drei Wochen zur Abschaltung.
      </p>
    </div>
  );
}
