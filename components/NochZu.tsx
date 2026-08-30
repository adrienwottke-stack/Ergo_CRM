import Link from "next/link";
import { sperrgrund, type Bereich } from "@/lib/ausbauSicht";
import { card, btnPrimary } from "@/components/ui";

// Was jemand sieht, der eine Adresse aufruft, die fuer ihn noch zu ist
// (docs/ausbau-plan.md, Abschnitt 3).
//
// Kein 404 und keine stumme Weiterleitung. Beides sagt "da ist ein Fehler",
// und der Nutzer versucht es dann noch einmal. Hier steht stattdessen, WER
// oeffnet - er hat nichts falsch gemacht, er ist nur noch nicht dran.
//
// Dass es diese Seite ueberhaupt gibt, heisst nicht, dass jemand hier landen
// soll: die Leiste zeigt gesperrte Punkte nicht, und der Wegweiser filtert sie
// heraus. Sie faengt Lesezeichen, getippte Adressen und alte Links ab.

export default function NochZu({
  titel,
  bereich,
}: {
  /** Wie der Bereich heisst, den er wollte. In seiner Sprache. */
  titel: string;
  bereich: Bereich;
}) {
  return (
    <div className={`${card} mx-auto max-w-md p-6 text-center sm:p-8`}>
      <h1 className="text-lg font-semibold text-ink">{titel} ist noch zu</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        {sperrgrund(bereich)}
      </p>
      <Link
        href="/heute"
        className={`${btnPrimary} mt-6`}
      >
        Zurück zu Heute
      </Link>
    </div>
  );
}
