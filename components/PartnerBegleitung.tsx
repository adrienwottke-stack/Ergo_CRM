import Link from "next/link";
import { letzteSchritte, naechsteSchritte } from "@/lib/einblick";
import { ladeVereinbarungen } from "@/lib/vereinbarungen";
import { ladeZiele } from "@/lib/ziele";
import type { Mannschaftsperson } from "@/lib/fuehrung";
import Fortschritt from "@/components/Fortschritt";
import GpName from "@/components/GpName";
import VorfuehrVerdeckt from "@/components/VorfuehrVerdeckt";
import NachrichtSenden from "@/components/NachrichtSenden";
import { ladeBegleitungen } from "@/lib/begleitung";
import { internerRueckweg } from "@/lib/rueckweg";

const datum = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Berlin",
});

export default async function PartnerBegleitung({
  userId,
  personen,
  struktur = personen,
  limit,
  kompakt = false,
  rueckweg,
}: {
  userId: string;
  personen: Mannschaftsperson[];
  struktur?: Mannschaftsperson[];
  limit?: number;
  kompakt?: boolean;
  rueckweg?: string;
}) {
  const aktive = personen.filter((p) => !p.platzhalter && !p.ausgetreten);
  const auswahl = limit ? aktive.slice(0, limit) : aktive;
  const offeneIds = auswahl.filter((p) => p.einblick.offen).map((p) => p.id);
  const startfensterIds = auswahl
    .filter((p) => p.einblick.offen && p.einblick.grund === "startfenster")
    .map((p) => p.id);
  const [zuletzt, naechstes, absprachen, ziele, ersteRunden] =
    await Promise.all([
      letzteSchritte(offeneIds),
      naechsteSchritte(offeneIds),
      ladeVereinbarungen(userId),
      ladeZiele(userId),
      ladeBegleitungen(startfensterIds),
    ]);
  const profilRueckweg = internerRueckweg(rueckweg, "/mannschaft");

  return (
    <div
      className={
        kompakt
          ? "divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface"
          : "space-y-3"
      }
    >
      {auswahl.map((person) => {
        const letzter = zuletzt.get(person.id);
        const naechster = naechstes.get(person.id);
        const absprache = absprachen.find(
          (a) =>
            a.partner.id === person.id &&
            ["VORGESCHLAGEN", "BESTAETIGT"].includes(a.status),
        );
        const ziel = ziele.find((z) => z.inhaberId === person.id && z.aktiv);
        const team =
          person.path === "/"
            ? []
            : struktur.filter(
                (p) =>
                  p.id !== person.id &&
                  p.path.startsWith(person.path) &&
                  !p.platzhalter &&
                  !p.ausgetreten,
              );
        const teamAnrufe = team.reduce(
          (summe, p) => summe + p.werte.anrufeWoche,
          0,
        );
        const teamTermine = team.reduce(
          (summe, p) => summe + p.werte.vereinbartWoche,
          0,
        );
        const runde = ersteRunden.get(person.id);
        const einstieg = runde?.find((s) => !s.fertig);
        const letzteAktivitaet = letzter
          ? `${letzter.was} · ${datum.format(letzter.wann)}`
          : !person.einblick.offen
            ? person.werte.letzteAktivitaet
              ? `Aktivität eingetragen · ${datum.format(person.werte.letzteAktivitaet)} · Details nicht freigegeben`
              : person.einblick.hinweis
            : person.werte.letzteAktivitaet
              ? `Aktivität eingetragen · ${datum.format(person.werte.letzteAktivitaet)}`
              : "Noch kein Eintrag";
        const naechsterSchritt = !person.angekommen
          ? "Einstieg gemeinsam fortsetzen"
          : naechster
            ? `${naechster.istTermin ? "Termin" : naechster.art === "ANRUF" ? "Anruf" : "Kontaktschritt"} · ${datum.format(naechster.wann)}`
            : person.werte.naechsterSchritt && person.pipelineSichtbar
              ? `Nächster Kontaktschritt · ${datum.format(person.werte.naechsterSchritt)}`
              : "Nächsten gemeinsamen Schritt besprechen";
        const kurzeStaende = [
          ziel
            ? `${ziel.titel}: ${ziel.standText} ${ziel.kennzahlText}`
            : null,
          runde && einstieg
            ? `Erste Runde: ${runde.filter((s) => s.fertig).length} von ${runde.length} · ${einstieg.titel}`
            : null,
        ].filter((stand): stand is string => Boolean(stand));
        const profilHref = `/mannschaft/${person.id}?zurueck=${encodeURIComponent(profilRueckweg)}`;

        const abspracheInhalt = (
          <div>
            <dt className="text-ink-muted">Gemeinsam vereinbart</dt>
            <dd>
              {absprache ? (
                <Link
                  href={`/mannschaft/vereinbarungen?partner=${person.id}`}
                  className="text-link"
                >
                  {absprache.titel} · {datum.format(absprache.faelligAm)}
                  {absprache.status === "VORGESCHLAGEN"
                    ? " · Bestätigung offen"
                    : ""}
                </Link>
              ) : (
                "Noch keine offene gemeinsame Absprache"
              )}
            </dd>
          </div>
        );

        const weitereBegleitung = (
          <>
            {ziel && (
              <div className="space-y-2">
                <p className="text-sm">
                  {ziel.titel}: {ziel.standText} {ziel.kennzahlText}
                </p>
                <Fortschritt
                  anteil={ziel.anteil}
                  beschriftung={ziel.standText}
                />
              </div>
            )}
            {runde && einstieg && (
              <p className="text-sm text-ink-muted">
                Erste Runde: {runde.filter((s) => s.fertig).length} von{" "}
                {runde.length} Schritten geschafft
              </p>
            )}
            {einstieg && (
              <p className="text-sm">
                Nächster Einstiegsschritt: {einstieg.titel}
              </p>
            )}
            {team.length > 0 && (
              <div className="space-y-1 border-t border-line pt-3 text-sm">
                <p className="text-ink-muted">Diese Woche · aktive Partner</p>
                <p>
                  Eigenleistung: {person.werte.anrufeWoche} Anrufversuche ·{" "}
                  {person.werte.vereinbartWoche} vereinbarte Termine
                </p>
                <p>
                  Teamleistung ({team.length}): {teamAnrufe} Anrufversuche ·{" "}
                  {teamTermine} vereinbarte Termine
                </p>
                <Link
                  href={`/mannschaft/auswertung?teilteam=${person.id}&umfang=teilteam&zeit=woche`}
                  className="inline-flex min-h-11 items-center text-link"
                >
                  Teilteam auswerten →
                </Link>
              </div>
            )}
            <div>
              {person.signale[0] && (
                <p className="text-sm font-medium">
                  {person.signale[0].titel}
                </p>
              )}
              <p className="mt-1 text-sm text-ink-muted">
                {person.signale[0]?.schritt ??
                  "Nachfragen, was als Nächstes hilft, und Erfolge gemeinsam würdigen."}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5">
              <Link
                href={`/mannschaft/vereinbarungen?partner=${person.id}`}
                className="inline-flex min-h-11 items-center text-sm font-medium text-link"
              >
                Absprache ansehen
              </Link>
              {!ziel && (
                <Link
                  href={`/fortschritt/neu?partner=${person.id}`}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-link"
                >
                  Ziel vorschlagen
                </Link>
              )}
              <NachrichtSenden
                anId={person.id}
                name={person.name}
                variante="knopf"
              />
            </div>
          </>
        );

        if (kompakt) {
          return (
            <article key={person.id} className="px-4 py-3">
              <Link
                href={profilHref}
                className="flex min-h-11 w-full items-center justify-between gap-3 font-semibold"
              >
                <span className="text-[17px] leading-6">
                  <GpName name={person.name} />
                </span>
                <span aria-hidden className="shrink-0 text-link">
                  →
                </span>
              </Link>
              <VorfuehrVerdeckt hinweis="Persönliche Begleitung wird beim Vorführen ausgeblendet.">
                <dl className="space-y-2 pb-1 text-sm">
                  <div>
                    <dt className="text-xs text-ink-muted">Zuletzt</dt>
                    <dd>{letzteAktivitaet}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Als Nächstes</dt>
                    <dd>{naechsterSchritt}</dd>
                  </div>
                </dl>
                {kurzeStaende.length > 0 && (
                  <div className="mt-2 space-y-1 text-sm text-ink-muted">
                    {kurzeStaende.map((stand) => (
                      <p key={stand}>{stand}</p>
                    ))}
                  </div>
                )}
                <details className="mt-3 border-t border-line pt-1">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-medium text-link">
                    Begleitung &amp; Aktionen
                    <span aria-hidden>⌄</span>
                  </summary>
                  <div className="space-y-3 pb-2 pt-2">
                    <dl className="text-sm">{abspracheInhalt}</dl>
                    {weitereBegleitung}
                  </div>
                </details>
              </VorfuehrVerdeckt>
            </article>
          );
        }

        return (
          <article
            key={person.id}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <Link
              href={profilHref}
              className="inline-flex min-h-11 items-center text-xl font-semibold"
            >
              <GpName name={person.name} />{" "}
              <span className="ml-3 text-link">→</span>
            </Link>
            <VorfuehrVerdeckt hinweis="Persönliche Begleitung wird beim Vorführen ausgeblendet.">
              <dl className="mt-2 space-y-2 text-sm">
                <div>
                  <dt className="text-ink-muted">Zuletzt passiert</dt>
                  <dd>{letzteAktivitaet}</dd>
                </div>
                {abspracheInhalt}
                <div>
                  <dt className="text-ink-muted">Als Nächstes dran</dt>
                  <dd>{naechsterSchritt}</dd>
                </div>
              </dl>
              <div className="mt-3 space-y-3">{weitereBegleitung}</div>
            </VorfuehrVerdeckt>
          </article>
        );
      })}
      {limit && aktive.length > limit && (
        <Link
          href="/mannschaft"
          className={
            kompakt
              ? "flex min-h-11 items-center px-4 py-3 font-medium text-link"
              : "inline-flex min-h-11 items-center font-medium text-link"
          }
        >
          Alle {aktive.length} Partner ansehen →
        </Link>
      )}
    </div>
  );
}
