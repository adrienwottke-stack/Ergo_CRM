import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { berlinToday, dayToUtcDate, startOfWeek } from "@/lib/dates";
import {
  MAX_DUELLE,
  SPRINT_MINUTEN,
  abpfiffDieserWoche,
  duellStand,
  duelleAbschliessen,
  ladeBestmarke,
  ladePuls,
  ladeRangliste,
  sprintStand,
  stundenBis,
} from "@/lib/arena";
import { abstandInHandlungen, eigenerHinweis, kommentar, punkteText } from "@/lib/kommentator";
import { merkeNutzung, schalter } from "@/lib/features";
import { quotaTypeLabels } from "@/lib/labels";
import ArenaTakt from "@/components/ArenaTakt";
import SprintUhr from "@/components/SprintUhr";
import Taugt from "@/components/Taugt";
import { FlameIcon, TrophyIcon } from "@/components/icons";
import { btnPrimary, btnSecondary, card, kicker, pageTitle, sectionTitle } from "@/components/ui";
import { duellAntwort, duellFordern, sprintStarten } from "./actions";

export const dynamic = "force-dynamic";

const zeitFormat = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

function vorMinuten(at: Date): string {
  const min = Math.floor((Date.now() - at.getTime()) / 60_000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  return zeitFormat.format(at) + " Uhr";
}

export default async function ArenaPage() {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);

  // Abpfiff ohne Cron: wer als Erster nach Ablauf hereinkommt, schliesst ab.
  await duelleAbschliessen();

  const heute = berlinToday();
  const heuteDatum = dayToUtcDate(heute);
  const wochenStart = startOfWeek(heute);
  const abpfiff = abpfiffDieserWoche(heute);
  const stunden = stundenBis(abpfiff);

  const an = await schalter("puls", "zweikampf", "kommentator", "bestmarke", "duell", "sprint");

  const [zeilen, puls, bestmarke, personen, meineVotes, duelle, sprint, abschluss] =
    await Promise.all([
      ladeRangliste(wochenStart),
      ladePuls(),
      ladeBestmarke(person.id),
      prisma.person.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.featureVote.findMany({
        where: { personId: person.id },
        select: { featureKey: true, urteil: true },
      }),
      prisma.duel.findMany({
        where: {
          OR: [{ challengerId: person.id }, { opponentId: person.id }],
          status: { in: ["OFFEN", "LAEUFT", "ENTSCHIEDEN"] },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          challenger: { select: { id: true, name: true } },
          opponent: { select: { id: true, name: true } },
        },
      }),
      prisma.sprint.findFirst({
        where: { endAt: { gt: new Date() } },
        orderBy: { startAt: "desc" },
        include: { teilnahmen: { include: { person: { select: { id: true, name: true } } } } },
      }),
      prisma.dailyLog.findFirst({
        where: { type: "DEAL_WON", date: heuteDatum },
        include: { person: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const stimmen = new Map(meineVotes.map((v) => [v.featureKey, v.urteil as string]));
  const gesehen: Promise<void>[] = [];
  if (an.puls) gesehen.push(merkeNutzung("puls", person.id));
  if (an.zweikampf) gesehen.push(merkeNutzung("zweikampf", person.id));
  if (an.kommentator) gesehen.push(merkeNutzung("kommentator", person.id));
  await Promise.all(gesehen);

  // --- eigene Lage ---------------------------------------------------------
  const platzIndex = zeilen.findIndex((z) => z.personId === person.id);
  const meine = platzIndex >= 0 ? zeilen[platzIndex] : null;
  const platz = platzIndex >= 0 ? platzIndex + 1 : null;
  const vorMir = platzIndex > 0 ? zeilen[platzIndex - 1] : null;
  const hinterMir =
    platzIndex >= 0 && platzIndex < zeilen.length - 1 ? zeilen[platzIndex + 1] : null;

  const ueberholtVon =
    person.lastRank !== null && platz !== null && platz > person.lastRank && vorMir
      ? vorMir.name
      : null;

  if (platz !== null && platz !== person.lastRank) {
    await prisma.person.update({
      where: { id: person.id },
      data: { lastRank: platz, lastRankAt: new Date() },
    });
  }

  const laengsteSerie = zeilen.reduce<{ name: string; tage: number } | null>(
    (best, z) => (z.serie > (best?.tage ?? 0) ? { name: z.name, tage: z.serie } : best),
    null
  );

  const spruch = kommentar({
    spitze: zeilen.slice(0, 3).map((z) => ({ name: z.name, punkte: z.punkte })),
    heuteAktiv: puls.aktiv,
    koepfe: puls.koepfe,
    stundenBisAbpfiff: stunden,
    serie: laengsteSerie,
    abschlussHeute: abschluss ? { name: abschluss.person.name } : null,
  });

  const hinweis = eigenerHinweis({
    heuteGeloggt: puls.zuletzt.some((z) => z.name === person.name),
    punkte: meine?.punkte ?? 0,
    bestmarke: an.bestmarke ? bestmarke : null,
    platz,
    ueberholtVon,
  });

  // --- Duelle --------------------------------------------------------------
  const offeneAnMich = duelle.filter((d) => d.status === "OFFEN" && d.opponentId === person.id);
  const offeneVonMir = duelle.filter((d) => d.status === "OFFEN" && d.challengerId === person.id);
  const laufende = duelle.filter((d) => d.status === "LAEUFT");
  const entschieden = duelle.filter((d) => d.status === "ENTSCHIEDEN");

  const staende = await Promise.all(
    [...laufende, ...entschieden.slice(0, 3)].map(async (d) => ({
      id: d.id,
      stand: await duellStand(d),
    }))
  );
  const standById = new Map(staende.map((s) => [s.id, s.stand]));

  const bilanz = new Map<string, { name: string; siege: number; niederlagen: number }>();
  for (const d of entschieden) {
    const stand = standById.get(d.id);
    if (!stand) continue;
    const ichBinLinks = d.challengerId === person.id;
    const gegner = ichBinLinks ? d.opponent : d.challenger;
    const meinScore = ichBinLinks ? stand.links : stand.rechts;
    const seinScore = ichBinLinks ? stand.rechts : stand.links;
    const eintrag = bilanz.get(gegner.id) ?? { name: gegner.name, siege: 0, niederlagen: 0 };
    if (meinScore > seinScore) eintrag.siege += 1;
    else if (meinScore < seinScore) eintrag.niederlagen += 1;
    bilanz.set(gegner.id, eintrag);
  }

  const belegt = new Set<string>();
  for (const d of [...offeneAnMich, ...offeneVonMir, ...laufende]) {
    belegt.add(d.challengerId === person.id ? d.opponentId : d.challengerId);
  }
  const forderbar = personen.filter((p) => p.id !== person.id && !belegt.has(p.id));
  const duellePlatz = offeneVonMir.length + laufende.length < MAX_DUELLE;

  // --- Sprint --------------------------------------------------------------
  const sprintIds = sprint?.teilnahmen.map((t) => t.personId) ?? [];
  const sprintZahlen = sprint ? await sprintStand(sprint, sprintIds) : new Map<string, number>();
  const binDabei = sprintIds.includes(person.id);

  return (
    <div className="space-y-8">
      <ArenaTakt sekunden={sprint ? 10 : 30} />

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className={pageTitle}>Arena</h1>
          <span className={kicker}>
            {stunden > 0 ? `Abpfiff in ${stunden} ${stunden === 1 ? "Stunde" : "Stunden"}` : "Spieltag vorbei"}
          </span>
        </div>
        {an.kommentator && <p className="mt-2 text-sm text-slate-700">{spruch}</p>}
        {hinweis && (
          <p className="mt-1 text-sm font-medium text-navy-700">{hinweis}</p>
        )}
      </div>

      {/* --- Sprint: das Ereignis, das ab zwei Koepfen funktioniert --------- */}
      {an.sprint && (
        <div className={`${card} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={sectionTitle}>Gemeinsamer Sprint</h2>
              <p className="mt-1 text-sm text-slate-500">
                {SPRINT_MINUTEN} Minuten, alle gleichzeitig. Gezählt wird, was in
                dieser Zeit dazukommt.
              </p>
            </div>
            {sprint ? (
              <SprintUhr ende={sprint.endAt.toISOString()} />
            ) : (
              <form action={sprintStarten}>
                <button type="submit" className={btnPrimary}>
                  Sprint starten
                </button>
              </form>
            )}
          </div>

          {sprint && (
            <div className="mt-4 space-y-2">
              {sprint.teilnahmen.map((teilnahme) => {
                const wert = sprintZahlen.get(teilnahme.personId) ?? 0;
                const hoechst = Math.max(1, ...sprintZahlen.values());
                return (
                  <div key={teilnahme.id} className="flex items-center gap-3 text-sm">
                    <span
                      className={`w-32 shrink-0 truncate ${
                        teilnahme.personId === person.id
                          ? "font-semibold text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      {teilnahme.person.name}
                    </span>
                    <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-navy-100">
                      <span
                        className="block h-full rounded-full bg-navy-600 transition-all"
                        style={{ width: `${Math.max((wert / hoechst) * 100, 3)}%` }}
                      />
                    </span>
                    <span className="w-8 text-right tabular-nums font-semibold text-slate-900">
                      {wert}
                    </span>
                  </div>
                );
              })}
              {!binDabei && (
                <form action={sprintStarten} className="pt-2">
                  <button type="submit" className={btnSecondary}>
                    Mitmachen
                  </button>
                </form>
              )}
            </div>
          )}
          <Taugt featureKey="sprint" stimme={stimmen.get("sprint") ?? null} />
        </div>
      )}

      {/* --- Duelle -------------------------------------------------------- */}
      {an.duell && (
        <div className={`${card} p-5`}>
          <h2 className={sectionTitle}>Duelle</h2>

          {offeneAnMich.length > 0 && (
            <div className="mt-4 space-y-3">
              {offeneAnMich.map((duel) => (
                <div
                  key={duel.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gold-100/50 px-4 py-3"
                >
                  <p className="text-sm">
                    <span className="font-semibold text-slate-900">{duel.challenger.name}</span>{" "}
                    fordert dich —{" "}
                    {duel.metric ? quotaTypeLabels[duel.metric] : "Gesamtpunkte"}, bis{" "}
                    {duel.endDay.toISOString().slice(8, 10)}.
                    {duel.endDay.toISOString().slice(5, 7)}.
                  </p>
                  <div className="flex gap-2">
                    <form action={duellAntwort}>
                      <input type="hidden" name="duelId" value={duel.id} />
                      <input type="hidden" name="antwort" value="ja" />
                      <button type="submit" className={btnPrimary}>
                        Annehmen
                      </button>
                    </form>
                    <form action={duellAntwort}>
                      <input type="hidden" name="duelId" value={duel.id} />
                      <input type="hidden" name="antwort" value="nein" />
                      <button type="submit" className={btnSecondary}>
                        Nicht heute
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {laufende.map((duel) => {
            const stand = standById.get(duel.id) ?? { links: 0, rechts: 0 };
            const gesamt = Math.max(1, stand.links + stand.rechts);
            return (
              <div key={duel.id} className="mt-4">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-slate-900">{duel.challenger.name}</span>
                  <span className="text-xs text-slate-500">
                    {duel.metric ? quotaTypeLabels[duel.metric] : "Gesamtpunkte"}
                  </span>
                  <span className="font-semibold text-slate-900">{duel.opponent.name}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="w-8 text-right tabular-nums text-lg font-semibold">
                    {stand.links}
                  </span>
                  <span aria-hidden className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className="block h-full bg-navy-700"
                      style={{ width: `${(stand.links / gesamt) * 100}%` }}
                    />
                    <span
                      className="block h-full bg-gold-400"
                      style={{ width: `${(stand.rechts / gesamt) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 tabular-nums text-lg font-semibold">{stand.rechts}</span>
                </div>
              </div>
            );
          })}

          {offeneVonMir.length > 0 && (
            <p className="mt-4 text-sm text-slate-500">
              Deine Forderung an{" "}
              {offeneVonMir.map((d) => d.opponent.name).join(", ")} steht. 24 Stunden
              Zeit.
            </p>
          )}

          {forderbar.length === 0 && laufende.length === 0 && offeneAnMich.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">
              {personen.length < 2
                ? "Noch seid ihr zu wenige. Sobald der zweite Geschäftspartner drin ist, geht das hier los."
                : "Gerade niemand frei zum Fordern."}
            </p>
          )}

          {duellePlatz && forderbar.length > 0 && (
            <form action={duellFordern} className="mt-4 flex flex-wrap items-end gap-2">
              <select
                name="opponentId"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {forderbar.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                name="metric"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">Gesamtpunkte</option>
                <option value="CALL">Anrufe</option>
                <option value="APPOINTMENT_SET">Termine vereinbart</option>
              </select>
              <select
                name="dauer"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="woche">bis Freitag</option>
                <option value="tag">heute</option>
              </select>
              <button type="submit" className={btnPrimary}>
                Fordern
              </button>
            </form>
          )}

          {bilanz.size > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              Bilanz:{" "}
              {[...bilanz.values()]
                .map((b) => `${b.siege}:${b.niederlagen} gegen ${b.name}`)
                .join(" · ")}
            </p>
          )}

          <Taugt featureKey="duell" stimme={stimmen.get("duell") ?? null} />
        </div>
      )}

      {/* --- Puls ---------------------------------------------------------- */}
      {an.puls && (
        <div className={`${card} p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">
              Heute schon dran: {puls.aktiv} von {puls.koepfe}
            </p>
            <span className={kicker}>Puls</span>
          </div>
          {puls.zuletzt.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {puls.zuletzt.map((eintrag) => (
                <li key={eintrag.name} className="flex justify-between text-sm">
                  <span className="text-slate-700">{eintrag.name}</span>
                  <span className="text-xs text-slate-400">{vorMinuten(eintrag.at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Taugt featureKey="puls" stimme={stimmen.get("puls") ?? null} />
        </div>
      )}

      {/* --- Zweikampf ----------------------------------------------------- */}
      {an.zweikampf && meine && (
        <div className={`${card} p-5`}>
          <h2 className={sectionTitle}>Dein Zweikampf</h2>
          <div className="mt-4 space-y-2">
            {vorMir && (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                <span className="text-slate-600">{vorMir.name}</span>
                <span className="tabular-nums text-slate-600">{vorMir.punkte}</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl bg-navy-800 px-4 py-3 text-sm text-white">
              <span className="font-semibold">
                {platz}. {meine.name}
              </span>
              <span className="tabular-nums font-semibold">{meine.punkte}</span>
            </div>
            {hinterMir && (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                <span className="text-slate-600">{hinterMir.name}</span>
                <span className="tabular-nums text-slate-600">{hinterMir.punkte}</span>
              </div>
            )}
          </div>
          {vorMir && (
            <p className="mt-3 text-sm text-slate-700">
              <span className="font-semibold">
                {punkteText(vorMir.punkte - meine.punkte)} auf {vorMir.name}.
              </span>{" "}
              {abstandInHandlungen(vorMir.punkte - meine.punkte)}
            </p>
          )}
          {!vorMir && (
            <p className="mt-3 text-sm text-slate-700">
              Du führst. {hinterMir ? `${punkteText(meine.punkte - hinterMir.punkte)} Vorsprung auf ${hinterMir.name}.` : ""}
            </p>
          )}
          <Taugt featureKey="zweikampf" stimme={stimmen.get("zweikampf") ?? null} />
        </div>
      )}

      {/* --- Tabelle ------------------------------------------------------- */}
      <div className={`${card} divide-y divide-slate-100`}>
        {zeilen.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-600">
              <TrophyIcon className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-900">
              Diese Woche hat noch keiner etwas geloggt
            </p>
            <Link href="/log" className={`${btnPrimary} mt-5`}>
              Jetzt loggen
            </Link>
          </div>
        ) : (
          zeilen.map((zeile, index) => (
            <div
              key={zeile.personId}
              className={`flex items-center gap-3 px-5 py-3 text-sm ${
                zeile.personId === person.id ? "bg-navy-50/60" : ""
              }`}
            >
              <span className="w-6 text-right tabular-nums text-slate-400">{index + 1}</span>
              <span className="flex-1 truncate font-medium text-slate-900">
                {zeile.name}
                {zeile.serie >= 2 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-600">
                    <FlameIcon className="h-3.5 w-3.5" />
                    {zeile.serie}
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-400">
                {zeile.ausCrm > 0 && `${Math.round((zeile.ausCrm / zeile.punkte) * 100)}% aus dem CRM`}
              </span>
              <span className="w-10 text-right tabular-nums font-semibold text-slate-900">
                {zeile.punkte}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Woche ab Montag, Abpfiff Freitag 18 Uhr. Sichtbar sind nur Namen und
          Zahlen — keine Kontaktdaten.
        </p>
        <Link
          href="/werkstatt"
          className="text-sm font-medium text-navy-600 underline transition hover:text-navy-800"
        >
          Was taugt, entscheidet ihr → Werkstatt
        </Link>
      </div>
    </div>
  );
}
