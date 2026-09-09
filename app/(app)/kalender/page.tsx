import Link from "next/link";
import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addMonths,
  berlinToday,
  dayToUtcDate,
  isValidDay,
  mondayOf,
  shiftDay,
  startOfMonth,
  tageImRaster,
} from "@/lib/dates";
import { eintraegeImZeitraum } from "@/lib/kalender/laden";
import { faelligeQuellenAbgleichen } from "@/lib/kalender/abgleich";
import {
  shell,
  btnPrimary,
  btnSecondary,
  flaeche,
  punkt,
} from "@/components/ui";
import { ArrowRightIcon, CalendarCheckIcon, PlusIcon } from "@/components/icons";
import SeitenKopf from "@/components/SeitenKopf";
import { Umschalter, type Ansicht } from "@/components/kalender/Umschalter";
import { Zeitraster } from "@/components/kalender/Zeitraster";
import { Monatsraster } from "@/components/kalender/Monatsraster";
import { Agenda } from "@/components/kalender/Agenda";
import { jetztAbgleichen } from "./actions";

export const dynamic = "force-dynamic";

// Der Kalender im Werkzeug (docs/audit-kernmodell.md 10.3, docs/struktur-plan.md 7).
//
// Vier Ansichten auf denselben Daten - Monat, Woche, Tag, Liste. Vorher war es
// nur die Liste, mit der Begruendung, ein Monatsgitter sei am Handy unlesbar.
// Das stimmt weiterhin, war aber die falsche Schlussfolgerung: die Antwort ist
// nicht, das Gitter wegzulassen, sondern es nicht zur Voreinstellung am Handy
// zu machen. Am Schreibtisch ist die Woche die Arbeitsflaeche.
//
// Alles laeuft ueber Links und searchParams, ohne Client-Javascript: die
// Anwendung faellt ohne JS auf Server-Navigation zurueck, und Blaetterpfeile,
// die dann tot sind, waeren die auffaelligste Luecke darin.

const ANSICHT_COOKIE = "kalender_ansicht";

const monatFormat = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const tagTitelFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});
const kurzFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

// Fuer die Sync-Status-Zeile - dieselben Feldoptionen wie das
// "zuletzt"-Datum auf /kalender/quellen, nur in dieser Datei noch einmal
// angelegt: page.tsx-Module exportieren ihre internen Konstanten nicht.
const zuletztFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

function istAnsicht(wert: string | undefined): wert is Ansicht {
  return wert === "monat" || wert === "woche" || wert === "tag" || wert === "liste";
}

type QuellenZeile = { name: string; letzterLauf: Date | null; letzterFehler: string | null };

/**
 * Der Sync-Zustand als ein Satz fuer die kompakte Statuszeile.
 *
 * "Gestoert" heisst hier: der letzte Lauf dieser Quelle ist fehlgeschlagen
 * (letzterFehler gesetzt). Das trifft sowohl die Quelle, die nach drei
 * Fehllaeufen stillgelegt wurde, als auch die, die es noch einmal versucht -
 * quelleAbgleichen setzt letzterFehler und fehlerZaehler immer gemeinsam
 * (lib/kalender/abgleich.ts), nie eines ohne das andere.
 */
function kalenderSyncZustand(
  quellen: QuellenZeile[]
): { zeitText: string; gestoerte: QuellenZeile[] } | null {
  if (quellen.length === 0) return null;

  const gestoerte = quellen.filter((quelle) => quelle.letzterFehler);

  const laeufe = quellen
    .map((quelle) => quelle.letzterLauf)
    .filter((datum): datum is Date => datum !== null);
  const letzterLauf =
    laeufe.length > 0
      ? new Date(Math.max(...laeufe.map((datum) => datum.getTime())))
      : null;

  if (!letzterLauf) {
    return { zeitText: "Noch nicht abgeglichen", gestoerte };
  }

  const minuten = Math.floor((Date.now() - letzterLauf.getTime()) / 60_000);
  const zeitText =
    minuten < 1
      ? "Zuletzt abgeglichen gerade eben"
      : minuten < 60
        ? `Zuletzt abgeglichen vor ${minuten} Min.`
        : `Zuletzt abgeglichen ${zuletztFormat.format(letzterLauf)}`;

  return { zeitText, gestoerte };
}

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ ansicht?: string; tag?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const heute = berlinToday();

  const tag = params.tag && isValidDay(params.tag) ? params.tag : heute;

  // Voreinstellung, in dieser Reihenfolge: Adresszeile, dann die zuletzt
  // gewaehlte Ansicht, dann das Geraet.
  //
  // Die Geraetefrage wird ueber Kopfzeilen entschieden und nicht ueber eine
  // Medienabfrage im Browser: die Seite wird auf dem Server gerendert, und ein
  // Umschalten nach dem ersten Bild waere ein sichtbarer Sprung. Sec-CH-UA-
  // Mobile schicken die Chromium-Browser von sich aus; wer es nicht schickt,
  // wird ueber die Kennung geprueft. Bleibt beides stumm, gewinnt die Liste -
  // sie traegt auf jedem Bildschirm, das Wochenraster nicht.
  const [kekse, kopfzeilen] = await Promise.all([cookies(), headers()]);
  const gemerkt = kekse.get(ANSICHT_COOKIE)?.value;
  const amHandy =
    kopfzeilen.get("sec-ch-ua-mobile") === "?1" ||
    /Android|iPhone|iPod|Mobile/i.test(kopfzeilen.get("user-agent") ?? "");

  const ansicht: Ansicht = istAnsicht(params.ansicht)
    ? params.ansicht
    : istAnsicht(gemerkt)
      ? gemerkt
      : amHandy
        ? "liste"
        : "woche";

  // Welcher Zeitraum geladen wird, und wohin die Pfeile springen.
  let von: Date;
  let bis: Date;
  let zurueck: string;
  let vor: string;
  let titel: string;

  if (ansicht === "monat") {
    const raster = tageImRaster(tag);
    von = dayToUtcDate(raster[0]!);
    bis = dayToUtcDate(shiftDay(raster[raster.length - 1]!, 1));
    const ersterDesMonats = startOfMonth(tag);
    zurueck = addMonths(ersterDesMonats, -1).toISOString().slice(0, 10);
    vor = addMonths(ersterDesMonats, 1).toISOString().slice(0, 10);
    titel = monatFormat.format(ersterDesMonats);
  } else if (ansicht === "woche") {
    const montag = mondayOf(tag);
    von = dayToUtcDate(montag);
    bis = dayToUtcDate(shiftDay(montag, 7));
    zurueck = shiftDay(montag, -7);
    vor = shiftDay(montag, 7);
    titel = `${kurzFormat.format(dayToUtcDate(montag))} – ${kurzFormat.format(
      dayToUtcDate(shiftDay(montag, 6))
    )}`;
  } else if (ansicht === "tag") {
    von = dayToUtcDate(tag);
    bis = dayToUtcDate(shiftDay(tag, 1));
    zurueck = shiftDay(tag, -1);
    vor = shiftDay(tag, 1);
    titel = tagTitelFormat.format(dayToUtcDate(tag));
  } else {
    // Die Liste blickt nach vorn, nimmt aber die letzte Woche mit: ein Termin
    // von gestern ist die haeufigste Frage am Morgen danach.
    von = dayToUtcDate(shiftDay(tag, -7));
    bis = dayToUtcDate(shiftDay(tag, 60));
    zurueck = shiftDay(tag, -30);
    vor = shiftDay(tag, 30);
    titel = tag === heute ? "Nächste Wochen" : `Ab ${kurzFormat.format(dayToUtcDate(tag))}`;
  }

  // Die Zeitzonen-Falle: dayToUtcDate liefert UTC-Mitternacht, der Berliner Tag
  // beginnt aber ein bis zwei Stunden frueher. Das Fenster wird deshalb an
  // beiden Enden grosszuegig aufgemacht; die Ansichten ordnen jeden Eintrag
  // danach ueber berlinDayOf dem richtigen Tag zu.
  const puffer = 12 * 60 * 60 * 1000;
  const eintraege = await eintraegeImZeitraum(
    user.id,
    new Date(von.getTime() - puffer),
    new Date(bis.getTime() + puffer)
  );

  // Fuer die Raster wieder auf das eigentliche Fenster eingrenzen, damit der
  // Puffer nicht als zusaetzlicher Tag durchschlaegt.
  const imFenster = eintraege.filter(
    (eintrag) => eintrag.von < bis && eintrag.bis > von
  );

  const wochentage = Array.from({ length: 7 }, (_, i) => shiftDay(mondayOf(tag), i));

  // Sync-Zustand der angebundenen Quellen. Fehler stehen vor dem Kalender;
  // der unauffaellige Erfolgszustand folgt erst unter seinem Inhalt.
  // Eine kleine, gezielte Abfrage extra zu den Kalendereintraegen oben: nur
  // die drei Felder, die der Satz braucht, keine Fremdtermine mitgeladen.
  const quellenZeilen = await prisma.kalenderquelle.findMany({
    where: { ownerId: user.id },
    select: { name: true, letzterLauf: true, letzterFehler: true },
  });
  const syncZustand = kalenderSyncZustand(quellenZeilen);
  const kalenderRueckweg = `/kalender?ansicht=${ansicht}&tag=${tag}`;

  // Angebundene Kalender nachfassen - NACH der Antwort, nicht davor.
  //
  // Vor dem Rendern haette der Aufruf jeden Seitenaufruf um die Anmeldung bei
  // TimeTree verlaengert, also um Sekunden, die niemand fuer fremde Termine
  // ausgeben will. So ist das Ergebnis erst beim naechsten Aufruf da - dafuer
  // ist die Seite sofort da. Wer nicht warten will, tippt unter dem Kalender
  // "Jetzt nachsehen" (haelt sich weiter an die 15-Minuten-Drossel) oder geht auf
  // die Quellen-Seite und drueckt dort "Jetzt holen" (bricht die Drossel
  // bewusst, siehe dort).
  //
  // Der Cron in vercel.json reicht dafuer nicht: auf dem Hobby-Tarif darf er
  // nur einmal am Tag laufen.
  after(async () => {
    try {
      await faelligeQuellenAbgleichen(user.id);
    } catch {
      // Der Abgleich schreibt seine Fehler selbst an die Quelle. Hier darf
      // nichts mehr nach oben - die Antwort ist zu diesem Zeitpunkt raus.
    }
  });

  return (
    <div className={`${shell} space-y-6`}>
      <SeitenKopf
        titel="Kalender"
        werkzeuge
        aktion={
          <Link href={`/kalender/neu?tag=${tag}`} className={btnPrimary}>
            <PlusIcon className="h-4 w-4" />
            Termin anlegen
          </Link>
        }
      />

      {syncZustand && syncZustand.gestoerte.length > 0 && (
        <div
          className={`${flaeche("gefahr")} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
        >
          <p className="flex items-center gap-2 text-sm text-red-900">
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${punkt.gefahr}`}
            />
            {syncZustand.zeitText}
            {` · ${
              syncZustand.gestoerte.length === 1
                ? `${syncZustand.gestoerte[0]!.name} gestört`
                : `${syncZustand.gestoerte.length} Quellen gestört`
            }`}
          </p>
          <Link
            href="/kalender/quellen"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-fest-gefahr px-4 text-sm font-semibold text-white transition hover:bg-fest-gefahr-stark"
          >
            Reparieren
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      )}

      <section aria-label="Kalenderansicht" className="space-y-4">
        <Umschalter
          ansicht={ansicht}
          tag={tag}
          heute={heute}
          zurueck={zurueck}
          vor={vor}
          titel={titel}
        />

        {ansicht === "monat" && (
          <Monatsraster
            tag={tag}
            eintraege={imFenster}
            heute={heute}
            rueckweg={kalenderRueckweg}
          />
        )}
        {ansicht === "woche" && (
          <Zeitraster
            tage={wochentage}
            eintraege={imFenster}
            heute={heute}
            rueckweg={kalenderRueckweg}
          />
        )}
        {ansicht === "tag" && (
          <Zeitraster
            tage={[tag]}
            eintraege={imFenster}
            heute={heute}
            rueckweg={kalenderRueckweg}
          />
        )}
        {ansicht === "liste" && (
          <Agenda
            eintraege={imFenster}
            heute={heute}
            rueckweg={kalenderRueckweg}
          />
        )}
      </section>

      {syncZustand && syncZustand.gestoerte.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${punkt.erfolg}`}
            />
            {syncZustand.zeitText}
          </p>
          <form action={jetztAbgleichen}>
            <button type="submit" className={btnSecondary}>
              Jetzt nachsehen
            </button>
          </form>
        </div>
      )}

      <details className="group border-t border-line pt-1">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink">
          Kalender verwalten
          <span
            aria-hidden
            className="text-xl font-normal text-ink-muted transition-transform group-open:rotate-45 motion-reduce:transition-none"
          >
            +
          </span>
        </summary>
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          <Link
            href="/kalender/abo"
            className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition hover:bg-sunken"
          >
            <span className="flex items-center gap-3">
              <CalendarCheckIcon className="h-5 w-5 text-link" />
              <span>
                <span className="block text-base font-medium text-ink">
                  Auf dem Handy
                </span>
                <span className="block text-sm text-ink-muted">
                  Termine im Telefon abonnieren
                </span>
              </span>
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
          </Link>
          <Link
            href="/kalender/quellen"
            className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition hover:bg-sunken"
          >
            <span>
              <span className="block text-base font-medium text-ink">Kalenderquellen</span>
              <span className="block text-sm text-ink-muted">TimeTree und Abgleich verwalten</span>
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
          </Link>
        </div>
      </details>
    </div>
  );
}
