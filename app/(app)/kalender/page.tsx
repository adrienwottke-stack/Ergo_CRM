import Link from "next/link";
import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
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
import { kicker, pageTitle, shell, btnPrimary, btnSecondary } from "@/components/ui";
import { CalendarCheckIcon, PlusIcon } from "@/components/icons";
import { Umschalter, type Ansicht } from "@/components/kalender/Umschalter";
import { Zeitraster } from "@/components/kalender/Zeitraster";
import { Monatsraster } from "@/components/kalender/Monatsraster";
import { Agenda } from "@/components/kalender/Agenda";

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

function istAnsicht(wert: string | undefined): wert is Ansicht {
  return wert === "monat" || wert === "woche" || wert === "tag" || wert === "liste";
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

  // Angebundene Kalender nachfassen - NACH der Antwort, nicht davor.
  //
  // Vor dem Rendern haette der Aufruf jeden Seitenaufruf um die Anmeldung bei
  // TimeTree verlaengert, also um Sekunden, die niemand fuer fremde Termine
  // ausgeben will. So ist das Ergebnis erst beim naechsten Aufruf da - dafuer
  // ist die Seite sofort da. Wer nicht warten will, hat auf der Quellen-Seite
  // den Knopf "Jetzt holen".
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
    <div className={`${shell} space-y-5`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Kalender</h1>
          <p className="mt-1 text-sm text-slate-500">
            {imFenster.length === 0
              ? "Nichts in diesem Zeitraum."
              : `${imFenster.length} ${imFenster.length === 1 ? "Eintrag" : "Einträge"}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/kalender/abo" className={btnSecondary}>
            <CalendarCheckIcon className="h-4 w-4" />
            Auf dem Handy
          </Link>
          <Link href={`/kalender/neu?tag=${tag}`} className={btnPrimary}>
            <PlusIcon className="h-4 w-4" />
            Eintrag
          </Link>
        </div>
      </div>

      <Umschalter
        ansicht={ansicht}
        tag={tag}
        heute={heute}
        zurueck={zurueck}
        vor={vor}
        titel={titel}
      />

      {ansicht === "monat" && (
        <Monatsraster tag={tag} eintraege={imFenster} heute={heute} />
      )}
      {ansicht === "woche" && (
        <Zeitraster tage={wochentage} eintraege={imFenster} heute={heute} />
      )}
      {ansicht === "tag" && (
        <Zeitraster tage={[tag]} eintraege={imFenster} heute={heute} />
      )}
      {ansicht === "liste" && <Agenda eintraege={imFenster} heute={heute} />}

      <p className={kicker}>
        „Auf dem Handy“ legt den Kalender in dein Telefon — dann weckt dich dein
        Telefon, auch wenn die App zu ist. Umgekehrt holt{" "}
        <Link
          href="/kalender/quellen"
          className="font-medium text-navy-600 hover:underline"
        >
          TimeTree hereinholen
        </Link>{" "}
        deine dortigen Termine hierher, damit niemand in belegte Zeit plant.
      </p>
    </div>
  );
}
