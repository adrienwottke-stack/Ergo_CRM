"use client";

// Der Kurven-Block ganz oben auf /mannschaft: drei Mini-Kacheln nebeneinander
// (Einheiten, Anrufe, Termine), darunter EINE Kurve - die der angetippten
// Kachel (docs/emil-feedback-runde-2.md, D11/D12, AP-17).
//
// Emils Satz dazu: Chart oben, Tabelle behalten. Genau daran haengen die drei
// Festlegungen dieser Datei:
//
// 1. EIN CHART, NICHT DREI. Drei gestapelte Kurven schoeben die Matrix aus dem
//    Blick - und die ist der Grund, warum eine Fuehrungskraft die Seite
//    ueberhaupt oeffnet (D12). Die Kacheln zeigen trotzdem ALLE drei Zahlen:
//    umschalten muss man nur, wenn man den Weg dorthin sehen will, nicht um zu
//    erfahren, wo man steht.
// 2. DIE KACHELN RECHNEN AUS DEN SERIEN, NICHT AUS EIGENEN ZAHLEN. Endwert
//    und Monatszuwachs entstehen hier aus genau den Punkten, die auch die
//    Kurve zeichnet (Sockel plus Tagessummen). Eine zweite, danebenher
//    gereichte Zahl koennte von der Kurve abweichen - und eine Karte, die
//    ihrem eigenen Bild widerspricht, glaubt niemand mehr.
// 3. DIE WORTE STEHEN HIER, DIE DATEN KOMMEN VON AUSSEN. Beschriftung, Format
//    und Fussnote je Metrik liegen in METRIKEN; der Server reicht nur die
//    fertigen Serien durch. Damit bleibt die Grenze zur Server-Komponente
//    schmal (Serien sind reine Daten) und die Seite muss kein Format-Callback
//    ueber sie schicken - Funktionen kommen dort ohnehin nicht durch.
//
// Die Zeitraum-Wahl der Kurve (W/M/6M/J/Alles) lebt in VerlaufsChart und
// UEBERLEBT den Metrik-Wechsel bewusst: es ist dieselbe Komponente an
// derselben Stelle, React behaelt ihren Zustand. Wer die Anrufe im Halbjahr
// ansieht und auf Termine tippt, will die Termine im Halbjahr sehen - nicht
// wieder im Monat.

import { useState } from "react";
import VerlaufsChart, { type Verlaufsserie } from "@/components/VerlaufsChart";
import { formatEinheiten } from "@/lib/einheitenAnzeige";
import { cn } from "@/components/ui";

/** Was die Kurve gerade zeigt - zugleich der Schluessel in METRIKEN. */
export type Metrik = "einheiten" | "anrufe" | "termine";

/** Eine Metrik mit ihren fertigen Linien. Einheiten kommen mit zweien
 *  (Eigen und Team, disjunkt gerechnet), Anrufe und Termine mit einer. */
export type Kurvensatz = {
  id: Metrik;
  serien: Verlaufsserie[];
};

/** Anrufe und Termine sind ganze Stueck - kein Komma, keine Hundertstel. */
const ganzeZahl = (wert: number) => String(Math.round(wert));

const METRIKEN: Record<
  Metrik,
  {
    /** Was auf der Kachel steht. Kurz - am Handy sind es 110 Pixel. */
    kachel: string;
    /** Wie die Zahl heisst, fuer aria-label und Begleittexte der Kurve. */
    einheitWort: string;
    format: (wert: number) => string;
    fussnote: string;
  }
> = {
  einheiten: {
    kachel: "Einheiten",
    einheitWort: "Einheiten",
    format: formatEinheiten,
    // Der Sockel-/Storno-Satz der bisherigen Struktur-Kurve, unveraendert
    // uebernommen, plus zwei Saetze zu den beiden Linien. Der letzte klaert
    // den einzigen Punkt, an dem sich die Karte sonst selbst widerspraeche:
    // die grosse Zahl ueber der Kurve gehoert der FUEHRENDEN Serie (so
    // rechnet VerlaufsChart), die Kachel dagegen zeigt beide zusammen - und
    // genau die Summe ist der Stand, den auch die Zelle "Zusammen" in der
    // Einheiten-Tabelle weiter unten traegt.
    fussnote:
      "Kumuliert über deine ganze Struktur, inklusive der Einheiten von vor der App — die stehen als eine Zahl ohne Datum, davor läuft die Kurve flach. Ein Storno zieht die Kurve nach unten. Die große Zahl über der Kurve gehört zur Linie Eigen; die Kachel oben zeigt Eigen und Team zusammen — den Stand deiner ganzen Struktur.",
  },
  anrufe: {
    kachel: "Anrufe",
    einheitWort: "Anrufe",
    format: ganzeZahl,
    fussnote: "Kumuliert über deine Struktur; Termine = vereinbart.",
  },
  termine: {
    kachel: "Termine",
    einheitWort: "Termine",
    format: ganzeZahl,
    fussnote: "Kumuliert über deine Struktur; Termine = vereinbart.",
  },
};

/** Sockel plus alle Tagessummen - derselbe Endwert, auf dem die Kurve endet.
 *  Bei zwei Linien die Summe beider: Eigen und Team sind disjunkt gerechnet,
 *  zusammen sind sie der Stand der ganzen Struktur. */
function endstand(serien: Verlaufsserie[]): number {
  return serien.reduce(
    (summe, serie) =>
      summe + serie.sockel + serie.tage.reduce((teil, tag) => teil + tag.hundertstel, 0),
    0
  );
}

/** Was seit dem ersten Tag des laufenden Produktionsmonats dazugekommen ist.
 *  Ohne Sockel - der ist der Stand von VOR der App und waechst nicht. Der
 *  Vergleich laeuft auf den Tageszeichenketten ("2026-08-01"), die sind in
 *  ISO-Form von sich aus in der richtigen Reihenfolge. */
function monatsZuwachs(serien: Verlaufsserie[], monatStart: string): number {
  return serien.reduce(
    (summe, serie) =>
      summe +
      serie.tage.reduce((teil, tag) => (tag.tag >= monatStart ? teil + tag.hundertstel : teil), 0),
    0
  );
}

export default function MannschaftsKurven({
  saetze,
  heute,
  monatStart,
}: {
  /** Die Metriken in Anzeigereihenfolge; die erste ist die Voreinstellung.
   *  Ohne Einheiten-Schalter faellt der erste Eintrag weg und Anrufe stehen
   *  vorn - die Reihenfolge trifft also die Seite, nicht diese Komponente. */
  saetze: Kurvensatz[];
  /** Berliner Heute, "2026-08-28". */
  heute: string;
  /** Erster Tag des laufenden Produktionsmonats, "2026-08-01". */
  monatStart: string;
}) {
  const [metrik, setMetrik] = useState<Metrik>(saetze[0]?.id ?? "anrufe");
  // Faellt die gewaehlte Metrik weg (der Einheiten-Schalter geht waehrend der
  // Sitzung aus), zeigt die Kurve wieder die erste - lieber die falsche Kurve
  // als ein leeres Loch.
  const gewaehlt = saetze.find((satz) => satz.id === metrik) ?? saetze[0];
  if (!gewaehlt) return null;
  const gezeigt = METRIKEN[gewaehlt.id];

  return (
    <div className="space-y-3">
      {/* --- Die Kacheln --------------------------------------------------
          Segment-Optik aus components/ui.ts (eingesenkte Kapsel, die aktive
          Flaeche schwebt darauf), aber bewusst NICHT segmentKnopf(): der ist
          einzeilig und voll gerundet, hier stehen drei Zeilen in einer
          Kachel. Dieselben Tokens, andere Form - und cn() hat kein
          tailwind-merge, ein aufgesetztes rounded-xl setzte sich gegen das
          rounded-full des Knopfes ohnehin nicht durch.

          Drei nebeneinander AUCH am Handy: nebeneinander sind sie ein
          Vergleich, untereinander waeren sie eine Liste. Dafuer min-w-0 und
          truncate an jeder Zeile - ohne beides sprengt "1.234,50" die Spalte,
          statt abgeschnitten zu werden. */}
      <div
        className={cn(
          "grid gap-1 rounded-2xl bg-sunken p-1",
          saetze.length >= 3 ? "grid-cols-3" : "grid-cols-2"
        )}
      >
        {saetze.map((satz) => {
          const eintrag = METRIKEN[satz.id];
          const aktiv = satz.id === gewaehlt.id;
          const stand = endstand(satz.serien);
          const zuwachs = monatsZuwachs(satz.serien, monatStart);
          return (
            <button
              key={satz.id}
              type="button"
              onClick={() => setMetrik(satz.id)}
              aria-pressed={aktiv}
              className={cn(
                "min-w-0 rounded-xl px-2 py-2 text-left transition sm:px-3",
                aktiv
                  ? "bg-surface text-ink schatten-karte"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              <span className="block truncate text-11 font-medium">{eintrag.kachel}</span>
              <span className="mt-0.5 block truncate text-sm font-semibold tabular-nums tracking-tight text-ink sm:text-base">
                {eintrag.format(stand)}
              </span>
              <span className="mt-0.5 block text-11 leading-tight text-ink-soft">
                <span
                  className={cn(
                    "tabular-nums",
                    zuwachs > 0 ? "text-emerald-700" : zuwachs < 0 ? "text-red-600" : null
                  )}
                >
                  {zuwachs > 0 ? "+" : ""}
                  {eintrag.format(zuwachs)}
                </span>{" "}
                im Monat
              </span>
            </button>
          );
        })}
      </div>

      <VerlaufsChart
        serien={gewaehlt.serien}
        heute={heute}
        monatStart={monatStart}
        fussnote={gezeigt.fussnote}
        format={gezeigt.format}
        einheitWort={gezeigt.einheitWort}
      />
    </div>
  );
}
