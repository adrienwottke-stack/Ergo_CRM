import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { berlinToday, dayToUtcDate, startOfWeek } from "@/lib/dates";
import { ladePuls, ladeRangliste } from "@/lib/arena";
import { strukturKonten } from "@/lib/struktur";
import { ladeFeed } from "@/lib/feed";
import { ladeTitelStaende } from "@/lib/titel";
import { rueckblickKarten } from "@/lib/rueckblick";
import { aktiveKonten, indexkurveFuer, produktionsmonat } from "@/lib/einheiten";
import { istAn, merkeNutzung } from "@/lib/features";
import IndexKurve from "@/components/IndexKurve";
import LeerZustand from "@/components/LeerZustand";
import RueckblickKarten from "@/components/RueckblickKarten";
import { MonitorIcon } from "@/components/icons";
import { card, cn, kicker } from "@/components/ui";

export const dynamic = "force-dynamic";

// Der eine Bildschirm fuer den woechentlichen Teamtermin (Beamer oder ein
// herumgereichtes Handy) - siehe docs/emil-feedback-plan.md, Multiplikations-
// Runde vom 29.08.2026.
//
// ZUM ZEIGEN, NICHT ZUM BEDIENEN: kein Postfach, kein Zweikampf, kein
// Sprint-Startknopf, kein eigener Hinweis ("du wurdest ueberholt") und keine
// lastRank-Schreiblogik - all das haengt an EINER Person vor dem Bildschirm,
// hier steht aber die ganze Runde davor. Wer etwas bedienen will, geht auf
// /arena.
//
// Grosse, aber bestehende Textklassen statt eigenem Zoom-Code: die Karten
// sind dieselben wie in der Arena, nur mit mehr Schriftgroesse - kein
// Sonderlayout, das getrennt gepflegt werden muesste.
//
// NUR DIE EIGENE STRUKTUR, seit D20 ("Tabelle zeigt je Person nur die eigene
// Struktur", docs/emil-feedback-runde-2.md). Vor dem Bildschirm steht der
// eigene Ast, und eine Rangliste mit Namen aus einer fremden Struktur ist
// dort nicht falsch, sondern gegenstandslos - niemand im Raum kann etwas
// damit anfangen. Betroffen sind Top 3 und Puls; die WOCHENTITEL bleiben
// bewusst netzwerkweit (siehe der Block weiter unten und lib/rueckblick.ts:
// ein Titel, den die Arena nicht zeigt, waere eine Unwahrheit an der Wand).

const vollDatumFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const zeitFormat = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

function vorMinuten(at: Date): string {
  const min = Math.floor((Date.now() - at.getTime()) / 60_000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  return `${zeitFormat.format(at)} Uhr`;
}

const blockTitel = "text-xl font-semibold tracking-tight text-ink sm:text-2xl";

/**
 * Die Personen-Ids der eigenen Struktur - oder undefined fuer "alle".
 *
 * Der Weg ist derselbe wie in lib/rueckblick.ts: strukturKonten() liefert die
 * KONTEN (ich und alles unter mir, Ausgetretene draussen), und EINE Abfrage
 * uebersetzt sie ueber die Relation User->Person in die Ids, mit denen die
 * Rangliste rechnet.
 *
 * undefined heisst "kein Filter" und ist kein Notausgang, sondern der Fall
 * "kein eigener Ast": ein Konto ist man selbst, wer niemanden unter sich hat,
 * sieht den Bildschirm netzwerkweit wie bisher. Das betrifft vor allem den
 * Admin, der ueber niemandem haengt - fuer ihn aendert sich nichts.
 */
async function strukturPersonIds(fkUserId: string): Promise<string[] | undefined> {
  const konten = await strukturKonten(fkUserId).catch(() => [] as string[]);
  if (konten.length <= 1) return undefined;

  const personen = await prisma.person
    .findMany({ where: { userId: { in: konten } }, select: { id: true } })
    .catch(() => [] as { id: string }[]);

  // Ein leeres Ergebnis kann es eigentlich nicht geben - der Betrachter hat
  // ein Teamprofil, sonst waere die Seite oben an requireUserPerson
  // ausgestiegen. Kommt trotzdem nichts zurueck, zeigt der Abend lieber das
  // Netzwerk als einen leeren Bildschirm vor versammelter Mannschaft.
  return personen.length > 0 ? personen.map((person) => person.id) : undefined;
}

export default async function TeamabendPage() {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);

  const an = await istAn("teamabend");
  if (!an) {
    return (
      <div className="space-y-6">
        <span className={kicker}>Teamabend</span>
        <LeerZustand
          symbol={<MonitorIcon className="h-6 w-6" />}
          titel="Teamabend ist gerade abgeschaltet"
          text="Dieser Bildschirm ist derzeit aus. Die Werkstatt schaltet ihn wieder an."
        />
      </div>
    );
  }

  const heute = berlinToday();
  const wochenStart = startOfWeek(heute);
  const monatStart = produktionsmonat(heute).start.toISOString().slice(0, 10);

  // Erst der eigene Ast, dann alles andere: Rangliste und Puls haengen daran
  // (D20). Der Rueckblick weiter unten ermittelt ihn ein zweites Mal selbst -
  // rueckblickKarten() soll fuer sich allein benutzbar bleiben, und die
  // Signatur von lib/rueckblick.ts anzufassen war nicht Teil dieses Pakets.
  const nurPersonIds = await strukturPersonIds(user.id);

  const [zeilen, puls, titel, feed, ids] = await Promise.all([
    ladeRangliste(wochenStart, { nurPersonIds }),
    ladePuls({ nurPersonIds }),
    ladeTitelStaende(heute),
    ladeFeed(person.id),
    aktiveKonten(),
  ]);
  // Die Titel-Staende gehen an den Rueckblick weiter, statt dass er sie ein
  // zweites Mal laedt - er braucht sie fuer seine erste Prioritaet
  // (lib/rueckblick.ts). Dieselbe Datenladung, keine zweite Runde.
  const [punkte, rueckblick] = await Promise.all([
    indexkurveFuer(ids, heute),
    rueckblickKarten(user.id, { heute, titel }),
  ]);

  await merkeNutzung("teamabend", person.id);

  const top3 = zeilen.slice(0, 3);
  const feedZeilen = feed.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* --- Kopf: Kicker + Datum, gross genug fuer den Beamer -------------- */}
      <div>
        <span className={kicker}>Teamabend</span>
        <h1 className="mt-1 text-5xl font-bold leading-[1.1] tracking-tight text-ink sm:text-6xl">
          {vollDatumFormat.format(dayToUtcDate(heute))}
        </h1>
      </div>

      {/* --- Rueckblick: die Karten, mit denen der Abend eroeffnet - was lief
          und was bei Einzelnen besonders gut lief (N13, D20). Steht deshalb
          als erster Block nach dem Kopf; alles darunter bleibt in seiner
          Reihenfolge. Ohne eigene Struktur entfaellt der Block still: ein
          Rueckblick auf sich selbst ist kein Teamabend. ------------------- */}
      {rueckblick.hatStruktur && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={blockTitel}>Rückblick</h2>
            <span className={kicker}>Diese Woche</span>
          </div>
          {rueckblick.karten.length > 0 ? (
            <RueckblickKarten karten={rueckblick.karten} />
          ) : (
            <p className="text-base text-ink-muted">
              Diese Woche noch kein Highlight — ab Montag wieder.
            </p>
          )}
        </div>
      )}

      {/* --- Titel: mehrere Wege, vorn zu sein - hier ohne "dein Titel",
          es geht um die Woche des Teams, nicht um die Person davor. -------- */}
      <div className={`${card} p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={blockTitel}>Titel dieser Woche</h2>
          <span className={kicker}>Stand jetzt</span>
        </div>
        <p className="mt-2 text-base text-ink-muted">
          Punkte belohnen Menge. Titel belohnen Können — vorn sein geht auch
          ohne die meisten Punkte.
        </p>

        <ul className="mt-5 space-y-4">
          {titel.map((stand) => (
            <li
              key={stand.schluessel}
              className="border-t border-line pt-4 first:border-0 first:pt-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-lg font-semibold text-ink">
                  {stand.titel}
                </span>
                {stand.haelter ? (
                  <span className="text-lg text-ink-muted">
                    {stand.haelter.name}{" "}
                    <span className="tabular-nums text-ink-soft">
                      {stand.haelter.wert}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm font-semibold uppercase tracking-wider text-ink-soft">
                    noch frei
                  </span>
                )}
              </div>
              <p className="mt-1 text-base text-ink-muted">
                {stand.haelter ? stand.sagt : stand.offenWeil}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* --- Team-Indexkurve: der Proof nach aussen, ohne Absolutwerte ------ */}
      <IndexKurve
        punkte={punkte}
        heute={heute}
        monatStart={monatStart}
        ueberschrift="Team-Kurve"
        startZeitraum="gesamt"
      />

      {/* --- Puls: wer heute schon dran war - beide Zahlen ueber die eigene
          Struktur (D20). "3 von 4" meint die vier Koepfe im Raum, nicht die
          elf im Netzwerk. ------------------------------------------------- */}
      <div className={`${card} p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-lg font-medium text-ink">
            Heute schon dran: {puls.aktiv} von {puls.koepfe}
          </p>
          <span className={kicker}>Puls</span>
        </div>
        {puls.zuletzt.length > 0 && (
          <ul className="mt-4 space-y-2">
            {puls.zuletzt.map((eintrag) => (
              <li key={eintrag.name} className="flex justify-between text-base">
                <span className="text-ink-muted">{eintrag.name}</span>
                <span className="text-sm text-ink-soft">
                  {vorMinuten(eintrag.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- Top 3 der Rangliste, kompakt - Gold nur fuer Platz 1, wie auf
          /leaderboard. Seit D20 aus der eigenen Struktur: die drei Namen
          gehoeren damit Leuten, die im Raum sitzen. Die Arena bleibt davon
          unberuehrt und zeigt weiter das ganze Netzwerk. ----------------- */}
      {top3.length > 0 && (
        <div className={`${card} p-6`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={blockTitel}>Rangliste — Top 3</h2>
            <span className={kicker}>Diese Woche</span>
          </div>
          <ul className="mt-5 divide-y divide-line">
            {top3.map((zeile, index) => (
              <li
                key={zeile.personId}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-xl px-3 py-3",
                  index === 0 && "bg-gold-100/30"
                )}
              >
                <span className="flex items-baseline gap-3">
                  <span
                    className={cn(
                      "w-6 text-lg font-semibold tabular-nums",
                      index === 0 ? "text-gold-600" : "text-ink-soft"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-semibold",
                      index === 0 ? "text-gold-600" : "text-ink"
                    )}
                  >
                    {zeile.name}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-lg font-semibold tabular-nums",
                    index === 0 ? "text-gold-600" : "text-ink"
                  )}
                >
                  {zeile.punkte}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Die letzten Feed-Meldungen, schlicht: Text + Zeit-Tag, keine
          Reaktionsknoepfe - hier drueckt niemand live mit ------------------ */}
      {feedZeilen.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={blockTitel}>Geschafft</h2>
            <span className={kicker}>Netzwerk</span>
          </div>
          <ul className="space-y-3">
            {feedZeilen.map((zeile) => (
              <li
                key={zeile.id}
                className={`${card} flex flex-wrap items-baseline justify-between gap-2 p-4`}
              >
                <p className="text-base text-ink">
                  <span className="font-semibold">{zeile.name}</span>{" "}
                  {zeile.text.charAt(0).toLowerCase() + zeile.text.slice(1)}
                </p>
                <span className="text-sm text-ink-soft">
                  {vorMinuten(zeile.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
