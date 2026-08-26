import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { berlinToday, dayDisplayFormat } from "@/lib/dates";
import {
  KARRIERESTUFE_MAX,
  KARRIERESTUFE_MIN,
  formatEinheiten,
  ladeEinheiten,
  produktionsmonat,
  teamEinheiten,
} from "@/lib/einheiten";
import { merkeNutzung, schalter } from "@/lib/features";
import WettbewerbNav from "@/components/WettbewerbNav";
import Fortschritt from "@/components/Fortschritt";
import {
  btnPrimary,
  btnSecondary,
  card,
  input,
  kicker,
  label,
  pageTitle,
  sectionTitle,
  td,
  th,
} from "@/components/ui";
import { buchungLoeschen, einheitenBuchen, standSpeichern } from "./actions";

export const dynamic = "force-dynamic";

// Die Zahl, in der der Betrieb rechnet (docs/einheiten-plan.md).
//
// Zwei Werte, mehr steht hier nicht: was in diesem Produktionsmonat
// zusammengekommen ist, und was insgesamt steht - das sind die Schritte
// Richtung Karrierestufe 2. Daneben die Runde: wer dieselbe Karrierestufe traegt,
// steht mit Namen und Zahl in derselben Liste.
//
// Was NICHT hier steht: Sparten, Beitraege, Euro, Kunden. Eine Einheit ist
// eine gemeldete Zahl mit einem Datum daran, keine Umsatzrechnung.

export default async function EinheitenPage() {
  const user = await requireUser();
  const heute = berlinToday();

  const [seite, person, an, team] = await Promise.all([
    ladeEinheiten(
      {
        id: user.id,
        name: user.name,
        karrierestufe: user.karrierestufe,
        einheitenStart: user.einheitenStart,
      },
      heute
    ),
    prisma.person.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
    schalter("einheiten"),
    teamEinheiten(user.id, produktionsmonat(heute)),
  ]);

  const buchungen = await prisma.einheitenbuchung.findMany({
    where: { userId: user.id },
    orderBy: [{ tag: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  await merkeNutzung("einheiten", person?.id ?? null);

  const { ich, monat, schwelle } = seite;
  const offen = schwelle === null ? null : schwelle - ich.gesamt;
  const naechsteStufe = user.karrierestufe === null ? null : user.karrierestufe + 1;

  return (
    <div className="space-y-8">
      <WettbewerbNav />

      <div>
        <h1 className={pageTitle}>Einheiten</h1>
        <p className="mt-1 text-sm text-slate-500">
          Deine Zahl, selbst gemeldet.{" "}
          {user.karrierestufe === null
            ? "Trag deine Karrierestufe ein — dann siehst du, wer sonst noch auf deiner Stufe steht."
            : `Karrierestufe ${user.karrierestufe}. Wer dieselbe Stufe hat, sieht deine Einheiten — Name und Zahl, sonst nichts.`}
        </p>
      </div>

      {/* --- Die zwei Zahlen -------------------------------------------------
          Links das Laufende, rechts das Erarbeitete. Der Balken haengt bewusst
          nur an der rechten Zahl: der Monat hat kein Ziel, die Stufe schon. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${card} p-5`}>
          <span className={kicker}>Produktionsmonat {monat.label}</span>
          <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
            {formatEinheiten(ich.monat)}
          </p>
          <p className="mt-1 text-13 font-medium text-slate-600">
            Einheiten diesen Monat
          </p>
        </div>

        <div className={`${card} p-5`}>
          <span className={kicker}>
            {naechsteStufe === null
              ? "Gesamt"
              : `Schritte Richtung Karrierestufe ${naechsteStufe}`}
          </span>
          <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
            {formatEinheiten(ich.gesamt)}
          </p>
          <p className="mt-1 text-13 font-medium text-slate-600">
            Eigeneinheiten insgesamt
          </p>

          {schwelle !== null && offen !== null && (
            <div className="mt-4">
              <Fortschritt
                anteil={ich.gesamt / schwelle}
                ton={offen <= 0 ? "erfolg" : "info"}
                hoehe="kraeftig"
                beschriftung={`${formatEinheiten(ich.gesamt)} von ${formatEinheiten(schwelle)} Einheiten`}
              />
              <p className="mt-2 text-xs text-slate-500">
                {offen <= 0
                  ? `${formatEinheiten(schwelle)} sind geschafft — trag deine neue Karrierestufe ein.`
                  : `noch ${formatEinheiten(offen)} von ${formatEinheiten(schwelle)} bis Karrierestufe ${naechsteStufe}`}
              </p>
            </div>
          )}
          {schwelle === null && user.karrierestufe !== null && (
            // Lieber nichts als ein Balken auf ein erfundenes Ziel: eine
            // falsche Schwelle sagt jemandem, er sei fast da.
            <p className="mt-4 text-xs text-slate-400">
              Für Karrierestufe {naechsteStufe} ist noch keine Schwelle hinterlegt.
            </p>
          )}
        </div>
      </div>

      {/* --- Was das Team darunter geschrieben hat ---------------------------
          Steht nur da, wenn jemand unter dir haengt. Getrennt von den eigenen
          Zahlen und nicht dazuaddiert: die Karrierestufe misst, was du selbst
          geschrieben hast - eine verschmolzene Summe koennte das nie mehr
          auseinandernehmen. */}
      {team !== null && (
        <div className={`${card} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className={kicker}>Dein Team</span>
            <span className="text-xs text-slate-500">
              alles unter dir, über alle Ebenen
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <p className="text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
                {formatEinheiten(team.monat)}
              </p>
              <p className="mt-1 text-13 font-medium text-slate-600">
                Team-Einheiten im {monat.label}
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
                {formatEinheiten(team.gesamt)}
              </p>
              <p className="mt-1 text-13 font-medium text-slate-600">
                Team-Einheiten insgesamt
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-tight tabular-nums text-navy-900">
                {formatEinheiten(ich.gesamt + team.gesamt)}
              </p>
              <p className="mt-1 text-13 font-medium text-slate-600">
                Du und dein Team zusammen
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Zählt nicht auf deine Karrierestufe — dafür zählen deine
            Eigeneinheiten. Wer unter dir einträgt, läuft hier automatisch mit
            hoch.
          </p>
        </div>
      )}

      {/* --- Eintragen ------------------------------------------------------ */}
      <form action={einheitenBuchen} className={`${card} space-y-5 p-6 sm:p-8`}>
        <div>
          <h2 className={sectionTitle}>Einheiten eintragen</h2>
          <p className="mt-1 text-sm text-slate-500">
            Was dazugekommen ist. Ein Storno trägst du mit Minus ein
            (&bdquo;-12,5&ldquo;).
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="menge" className={label}>
              Einheiten
            </label>
            <input
              id="menge"
              name="menge"
              type="text"
              inputMode="decimal"
              placeholder="z. B. 12,5"
              required
              className={input}
            />
          </div>
          <div>
            <label htmlFor="tag" className={label}>
              Tag
            </label>
            <input
              id="tag"
              name="tag"
              type="date"
              defaultValue={heute}
              max={heute}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="notiz" className={label}>
              Notiz (optional)
            </label>
            <input
              id="notiz"
              name="notiz"
              type="text"
              maxLength={120}
              placeholder="z. B. BU Schmidt"
              className={input}
            />
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button type="submit" className={btnPrimary}>
            Speichern
          </button>
        </div>
      </form>

      {/* --- Karrierestufe und Startbestand --------------------------------------
          Steht offen, solange keine Stufe eingetragen ist - ohne sie ist die
          halbe Seite leer. Danach klappt es zu und ist einen Tipp entfernt. */}
      <details open={user.karrierestufe === null} className={`${card} p-6 sm:p-8`}>
        <summary className="cursor-pointer list-none">
          <span className={sectionTitle}>Deine Karrierestufe</span>
          <span className="ml-2 text-sm text-slate-500">
            {user.karrierestufe === null
              ? "noch nicht eingetragen"
              : `Stufe ${user.karrierestufe}`}
          </span>
        </summary>

        <form action={standSpeichern} className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="karrierestufe" className={label}>
                Karrierestufe
              </label>
              <input
                id="karrierestufe"
                name="karrierestufe"
                type="number"
                min={KARRIERESTUFE_MIN}
                max={KARRIERESTUFE_MAX}
                step={1}
                defaultValue={user.karrierestufe ?? ""}
                placeholder="1"
                className={input}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Entscheidet, mit wem du in einer Runde stehst. Leer lassen heißt:
                keine Runde.
              </p>
            </div>
            <div>
              <label htmlFor="einheitenStart" className={label}>
                Einheiten vor der App
              </label>
              <input
                id="einheitenStart"
                name="einheitenStart"
                type="text"
                inputMode="decimal"
                defaultValue={
                  user.einheitenStart ? formatEinheiten(user.einheitenStart) : ""
                }
                placeholder="0"
                className={input}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Dein Stand beim Start. Zählt zu &bdquo;insgesamt&ldquo; dazu,
                nicht zum Monat.
              </p>
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button type="submit" className={btnSecondary}>
              Übernehmen
            </button>
          </div>
        </form>
      </details>

      {/* --- Die Runde ------------------------------------------------------- */}
      {an.einheiten && user.karrierestufe !== null && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={sectionTitle}>
              Karrierestufe {user.karrierestufe} — {seite.runde.length}{" "}
              {seite.runde.length === 1 ? "Person" : "Leute"}
            </h2>
            <span className="text-xs text-slate-500">
              sortiert nach {monat.label}
            </span>
          </div>

          {seite.runde.length === 1 ? (
            <div className={`${card} px-6 py-10 text-center`}>
              <p className="text-sm font-medium text-slate-900">
                Noch niemand sonst auf Karrierestufe {user.karrierestufe}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Sobald jemand seine Stufe einträgt, steht er hier neben dir.
              </p>
            </div>
          ) : (
            <div className={`${card} overflow-x-auto`}>
              <table className="w-full min-w-120 text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/60">
                  <tr>
                    <th className={th}>Name</th>
                    <th className={`${th} text-right`}>{monat.label}</th>
                    <th className={`${th} text-right`}>Insgesamt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seite.runde.map((stand) => (
                    <tr
                      key={stand.userId}
                      className={stand.istDu ? "bg-navy-50/40" : undefined}
                    >
                      <td className={`${td} font-medium text-slate-900`}>
                        {stand.istDu ? "Du" : stand.name}
                      </td>
                      <td
                        className={`${td} text-right font-semibold tabular-nums text-slate-900`}
                      >
                        {formatEinheiten(stand.monat)}
                      </td>
                      <td className={`${td} text-right tabular-nums text-slate-600`}>
                        {formatEinheiten(stand.gesamt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Die eigenen letzten Meldungen ----------------------------------- */}
      <div className="space-y-4">
        <h2 className={sectionTitle}>Deine letzten Einträge</h2>
        {buchungen.length === 0 ? (
          <div className={`${card} px-6 py-10 text-center`}>
            <p className="text-sm font-medium text-slate-900">
              Noch nichts eingetragen
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Die erste Meldung dauert zehn Sekunden.
            </p>
          </div>
        ) : (
          <ul className={`${card} divide-y divide-slate-100`}>
            {buchungen.map((buchung) => (
              <li
                key={buchung.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
              >
                <span className="min-w-0">
                  <span
                    className={`font-semibold tabular-nums ${
                      buchung.hundertstel < 0 ? "text-red-600" : "text-slate-900"
                    }`}
                  >
                    {buchung.hundertstel > 0 ? "+" : ""}
                    {formatEinheiten(buchung.hundertstel)}
                  </span>{" "}
                  <span className="text-slate-600">Einheiten</span>
                  {buchung.notiz && (
                    <span className="block truncate text-xs text-slate-500">
                      {buchung.notiz}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-4">
                  <span className="text-xs tabular-nums text-slate-500">
                    {dayDisplayFormat.format(buchung.tag)}
                  </span>
                  <form action={buchungLoeschen}>
                    <input type="hidden" name="buchungId" value={buchung.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-slate-500 transition hover:text-red-600"
                    >
                      Löschen
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Einheiten sind selbst gemeldet und zählen in keiner Rangliste mit —
        Punkte bleiben Tätigkeit. Sichtbar sind nur Namen und Zahlen.
      </p>
    </div>
  );
}
