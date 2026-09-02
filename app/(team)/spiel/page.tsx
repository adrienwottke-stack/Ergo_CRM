import { requireUser, requireUserPerson } from "@/lib/auth";
import { ladeGesamtpunkte } from "@/lib/arena";
import { ladeStufenTitel, stufeVon, STUFEN } from "@/lib/stufen";
import { FREISCHALTBAR, istFrei } from "@/lib/freischaltung";
import {
  QUOTENKOENIG_MINDEST_ANRUFE,
  TROPHAEEN_ARTEN,
  TROPHAEEN_ETIKETT,
  saisonTrophaeen,
} from "@/lib/trophaeen";
import { merkeNutzung, schalter } from "@/lib/features";
import WettbewerbNav from "@/components/WettbewerbNav";
import { LockIcon, TrophyIcon } from "@/components/icons";
import { btnGhost, card, kicker, pageTitle, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SpielPage() {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);

  // Frueh angestossen, spaet abgewartet: die Vitrine haengt an nichts hier
  // oben und braucht deshalb keine eigene Runde in der Kette. Sie kann nicht
  // scheitern - saisonTrophaeen faengt selbst ab und liefert dann leer.
  const vitrine = saisonTrophaeen();

  const an = await schalter("stufen", "spiel", "trophaeen");
  // Die sechs Stufennamen (AP-25, D18) - eigener Aufruf statt Prop-Umweg,
  // gecacht in lib/stufen.ts wie ladeGesamtpunkte je Anfrage einmal laeuft.
  const stufenTitel = await ladeStufenTitel();
  const stand = stufeVon(await ladeGesamtpunkte(person.id), stufenTitel);
  const stufenAnzeige = STUFEN.map((stufe, i) => ({
    ...stufe,
    name: stufenTitel[i] ?? stufe.name,
  }));
  await merkeNutzung("spiel", person.id);
  // Die Vitrine hat ihren eigenen Schluessel (Regel 1 in lib/features.ts):
  // ohne Schalter kein Baustein, ohne Zaehlstelle keine Werkstatt-Zahl.
  if (an.trophaeen) await merkeNutzung("trophaeen", person.id);
  const { abgeschlossen, laufend } = await vitrine;
  const fuehrt = laufend?.trophaeen.find((t) => t.art === "saisonsieger");

  return (
    <div className="space-y-8">
      <WettbewerbNav />

      <div>
        <h1 className={pageTitle}>Spiel</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Was du dir aufmachst, bleibt offen. Stufen fallen nie zurück — anders
          als die Wochentabelle.
        </p>
      </div>

      {/* --- Die eigene Stufe ------------------------------------------------ */}
      {an.stufen && (
        <div className={`${card} p-5`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className={kicker}>Stufe {stand.stufe.nummer}</span>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-ink">
                {stand.stufe.name}
              </p>
            </div>
            <span className="text-sm tabular-nums text-ink-muted">
              {stand.gesamt} Punkte gesamt
            </span>
          </div>

          {/* Kein Fortschrittsbalken. "XP-Balken, Level" stehen in
              docs/wettbewerb-plan.md, Abschnitt 10, ausdruecklich auf der Liste
              dessen, was bewusst nicht gebaut wird - der Ton macht den Spass.
              Ein Satz mit einer konkreten Zahl sagt dasselbe und passt zum Rest
              des Werkzeugs. */}
          <p className="mt-3 text-sm text-ink-muted">
            {stand.naechste ? (
              <>
                Noch{" "}
                <span className="font-semibold tabular-nums">
                  {stand.bisNaechste}
                </span>{" "}
                {stand.bisNaechste === 1 ? "Punkt" : "Punkte"} bis{" "}
                <span className="font-semibold">{stand.naechste.name}</span>.
              </>
            ) : (
              "Höchste Stufe erreicht."
            )}
          </p>

          <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3">
            {stufenAnzeige.map((stufe) => (
              <li
                key={stufe.nummer}
                className={`text-xs tabular-nums ${
                  stufe.nummer <= stand.stufe.nummer
                    ? "font-semibold text-navy-800"
                    : "text-ink-soft"
                }`}
              >
                {stufe.name}
                <span className="ml-1 font-normal text-ink-soft">{stufe.ab}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* --- Die Vitrine ----------------------------------------------------- */}
      {/* Bewusst ohne Gold und ohne Ton: Gold traegt in diesem Werkzeug genau
          eine Bedeutung, naemlich das Podium der Wochentabelle. Zwei goldene
          Stellen auf zwei Seiten heissen zwei verschiedene Dinge, und dann
          heisst Gold nichts mehr. Hier reichen Name und Zahl. */}
      {an.trophaeen && (
      <section className="space-y-3">
        <div>
          <h2 className={sectionTitle}>Vitrine</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Die Woche ist der Spieltag, der Monat die Saison. Drei Trophäen je
            Saison — jede trägt ihr Datum und wird im nächsten Monat neu
            vergeben.
          </p>
        </div>

        {laufend && (
          <p className="rounded-2xl border border-line bg-sunken px-4 py-3 text-sm text-ink-muted">
            {laufend.monat} läuft.{" "}
            {fuehrt ? (
              <>
                Zwischenstand:{" "}
                <span className="font-semibold text-ink">{fuehrt.halterName}</span>
                , <span className="tabular-nums">{fuehrt.wertText}</span>.
              </>
            ) : (
              "Noch keine Punkte in dieser Saison."
            )}
          </p>
        )}

        {abgeschlossen.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Noch keine abgeschlossene Saison — die erste Vitrine füllt sich zum
            Monatsende.
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {abgeschlossen.map((saison) => (
                <li key={saison.schluessel} className={`${card} p-5`}>
                  <p className={kicker}>{saison.label}</p>

                  <dl className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-3">
                    {TROPHAEEN_ARTEN.map((art) => {
                      const gewinner = saison.trophaeen.find((t) => t.art === art);

                      return (
                        <div key={art}>
                          <dt className="text-13 text-ink-soft">
                            {TROPHAEEN_ETIKETT[art]}
                          </dt>
                          <dd className="mt-0.5 text-sm">
                            {gewinner ? (
                              <>
                                <span className="font-semibold text-ink">
                                  {gewinner.halterName}
                                </span>{" "}
                                <span className="tabular-nums text-ink-muted">
                                  {gewinner.wertText}
                                </span>
                              </>
                            ) : (
                              <span className="text-ink-soft">—</span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </li>
              ))}
            </ul>

            <p className="text-xs text-ink-muted">
              Der Quotenkönig braucht mindestens {QUOTENKOENIG_MINDEST_ANRUFE}{" "}
              Anrufe in der Saison — darunter ist eine Quote Zufall. Ein Strich
              heißt: in diesem Monat hat die Trophäe niemand verdient.
            </p>
          </>
        )}
      </section>
      )}

      {/* --- Die Kacheln ----------------------------------------------------- */}
      {an.spiel && (
        <section className="space-y-3">
          <h2 className={sectionTitle}>Freigeschaltet</h2>

          <ul className="grid gap-3 sm:grid-cols-2">
            {FREISCHALTBAR.map((eintrag) => {
              const offen = istFrei(eintrag, stand.stufe.nummer);
              const noetig = stufenAnzeige.find((s) => s.nummer === eintrag.abStufe);
              const fehlt = noetig ? Math.max(0, noetig.ab - stand.gesamt) : 0;

              return (
                <li
                  key={eintrag.schluessel}
                  className={
                    offen
                      ? `${card} flex flex-col p-5`
                      : "flex flex-col rounded-2xl border border-dashed border-line-strong bg-sunken p-5"
                  }
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      offen
                        ? "bg-gold-100 text-gold-600"
                        : "border border-line-strong text-ink-soft"
                    }`}
                  >
                    {offen ? (
                      <TrophyIcon className="h-4.5 w-4.5" />
                    ) : (
                      <LockIcon className="h-4.5 w-4.5" />
                    )}
                  </span>

                  <p
                    className={`mt-3 text-base font-semibold ${
                      offen ? "text-ink" : "text-ink-soft"
                    }`}
                  >
                    {eintrag.name}
                  </p>
                  <p className="mt-1 flex-1 text-sm text-ink-muted">
                    {eintrag.beschreibung}
                  </p>

                  {offen ? (
                    <a
                      href={eintrag.url}
                      target={eintrag.extern ? "_blank" : undefined}
                      rel={eintrag.extern ? "noopener noreferrer" : undefined}
                      className={`${btnGhost} mt-4`}
                    >
                      Spielen
                    </a>
                  ) : (
                    <p className="mt-4 text-sm font-medium text-ink-soft">
                      Ab Stufe {eintrag.abStufe}
                      {noetig ? ` (${noetig.name})` : ""} — noch{" "}
                      <span className="tabular-nums">{fehlt}</span>{" "}
                      {fehlt === 1 ? "Punkt" : "Punkte"}.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-ink-muted">
            Storno ist eine eigene Liga: Punkte gehen von der Arbeit ins Spiel,
            nie zurück.
          </p>
        </section>
      )}
    </div>
  );
}
