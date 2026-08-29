"use client";

// Der Trichter als gezeichnete Grafik statt vier nuechterner Balken.
//
// Vier Festlegungen, die den Rest erklaeren (Vorlage: components/VerlaufsChart.tsx):
//
// 1. DIE FORM STEHT FEST, DIE FUELLUNG TRAEGT DIE ZAHL. Die vier Trapeze und
//    ihre drei Verbindungsstuecke haben immer dieselbe Geometrie - egal ob
//    eine Stufe bei 0 oder bei 400 steht. Waere die Form selbst die Auskunft
//    (schmaler = weniger), saehe der Trichter am ersten Arbeitstag wie kaputt
//    aus, und zwei Berater mit unterschiedlich viel Volumen waeren nicht mehr
//    vergleichbar - der eine haette einen Pfeil, der andere ein Fass. Die
//    Menge steckt stattdessen allein in `fillOpacity` (0.15 + 0.65 * anteil)
//    und in der Zahl daneben. Bei anteil 0 bleibt eine Mindestfuellung von
//    0.15 - der Trichter kollabiert nicht bei Nullen.
// 2. KEINE SCHRIFT, KEIN HEX IN DER ZEICHNUNG. Dieselbe Ueberlegung wie im
//    Verlauf: Text im SVG skaliert falsch, und ein Hex-Wert wuerde den
//    Dunkelmodus nicht mitbekommen. Jede Farbe kommt ueber `currentColor` von
//    einer Tailwind-Textklasse (text-akzent, text-red-500), jede Beschriftung
//    steht als HTML ueber der Zeichnung.
// 3. HTML UND SVG TEILEN SICH DIESELBEN KONSTANTEN. Die Positionen der
//    tippbaren Reihen werden nicht geschaetzt, sondern aus genau denselben
//    Zahlen gerechnet, die auch die Pfade zeichnen (STUFEN_BAENDER,
//    GAP_BAENDER). Zwei getrennte Rechnungen liefen frueher oder spaeter
//    auseinander.
// 4. EIN TIPP OEFFNET EIN PANEL, ER NAVIGIERT NICHT WEG. Wer wissen will,
//    woran eine Stufe hakt, soll es unter der Grafik lesen koennen, ohne die
//    Uebersicht zu verlassen - Titel, Wert, Hinweis, eigene Quote gegen Team,
//    Drop-off.

import { Fragment, useState } from "react";
import { chip, cn, kicker } from "@/components/ui";

/** Die Quote einer Stufe zu ihrer Vorstufe - alles fertig formatiert vom
 *  Server (Muster SchnellStand, lib/stats.ts). Diese Komponente rechnet
 *  selbst nichts nach, sie zeigt nur an. */
export type TrichterUebergang = {
  /** Eigene Quote, z. B. "72 %" - oder "–", wenn die Vorstufe bei 0 stand. */
  quote: string;
  /** Dieselbe Quote aus den SUMMEN der ganzen Mannschaft - kein Schnitt aus
   *  Einzelquoten, siehe astVergleich in lib/fuehrung.ts. */
  teamQuote: string;
  /** vorher − wert, Vorzeichen als echtes Minuszeichen (U+2212). "±0" bei
   *  keiner Bewegung, "+N" bei einem Zuwachs. */
  dropOff: string;
  /** Diese Stufe hat von allen Uebergaengen die schwaechste Quote. */
  engpass: boolean;
};

export type TrichterStufe = {
  key: string;
  titel: string;
  wert: number;
  /** wert / groesste. Bestimmt NUR die Fuellung - nie die Form, siehe Kopf. */
  anteil: number;
  hinweis: string;
  /** null nur bei der ersten Stufe - sie hat keine Vorstufe, aus der sich
   *  eine Quote bilden liesse. */
  uebergang: TrichterUebergang | null;
};

// --- Die feste Geometrie ----------------------------------------------
// Vier Trapeze (die Stufen - sie verjuengen sich ueber ihre eigene Hoehe) und
// drei Verbindungsstuecke dazwischen (konstante Breite: die Naht, auf der die
// Uebergangszeile sitzt). BREITE und HOEHE sind ein Rechenraster, keine
// Pixelangabe - das SVG wird per CSS auf die Kartenbreite und eine feste
// Hoehe gezogen (preserveAspectRatio="none"), wie im Verlauf.
const BREITE = 360;
const SEG_H = 64;
const GAP_H = 28;
const HALBBREITEN = [170, 136, 104, 76, 58] as const;
const HOEHE = 4 * SEG_H + 3 * GAP_H;

/** Ein Trapez von (yOben, halbOben) nach (yUnten, halbUnten), um die
 *  Mittelachse gespiegelt. Mit halbOben === halbUnten wird daraus ein
 *  Rechteck - genau das sind die drei Verbindungsstuecke. */
function trapezPfad(
  yOben: number,
  yUnten: number,
  halbOben: number,
  halbUnten: number
): string {
  const mitte = BREITE / 2;
  return [
    `M ${mitte - halbOben} ${yOben}`,
    `L ${mitte + halbOben} ${yOben}`,
    `L ${mitte + halbUnten} ${yUnten}`,
    `L ${mitte - halbUnten} ${yUnten}`,
    "Z",
  ].join(" ");
}

const STUFEN_BAENDER = [0, 1, 2, 3].map((i) => {
  const yOben = i * (SEG_H + GAP_H);
  return {
    yOben,
    yUnten: yOben + SEG_H,
    halbOben: HALBBREITEN[i],
    halbUnten: HALBBREITEN[i + 1],
  };
});

const GAP_BAENDER = [0, 1, 2].map((i) => {
  const yOben = i * (SEG_H + GAP_H) + SEG_H;
  return { yOben, yUnten: yOben + GAP_H, halb: HALBBREITEN[i + 1] };
});

export default function TrichterGrafik({ stufen }: { stufen: TrichterStufe[] }) {
  // Welche Stufe gerade aufgeklappt ist - antippen toggelt, nur eine auf
  // einmal.
  const [ausgewaehlt, setAusgewaehlt] = useState<string | null>(null);

  const gewaehlteStufe = stufen.find((stufe) => stufe.key === ausgewaehlt) ?? null;
  const engpassStufe = stufen.find((stufe) => stufe.uebergang?.engpass) ?? null;

  return (
    <div>
      <div className="relative h-84 w-full sm:h-96">
        <svg
          viewBox={`0 0 ${BREITE} ${HOEHE}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="block h-full w-full text-akzent"
        >
          {STUFEN_BAENDER.map((band, i) => {
            const stufe = stufen[i];
            if (!stufe) return null;
            const istGewaehlt = stufe.key === ausgewaehlt;
            // Zuschlag beim Antippen kommt oben drauf, nicht anstelle -
            // sonst wuerde eine leere Stufe beim Auswaehlen unveraendert
            // schwach bleiben, obwohl sie gerade im Fokus steht.
            const deckkraft = Math.min(
              1,
              0.15 + 0.65 * stufe.anteil + (istGewaehlt ? 0.15 : 0)
            );
            return (
              <path
                key={stufe.key}
                d={trapezPfad(band.yOben, band.yUnten, band.halbOben, band.halbUnten)}
                fill="currentColor"
                fillOpacity={deckkraft}
                stroke={istGewaehlt ? "currentColor" : "none"}
                strokeWidth={istGewaehlt ? 2 : 0}
                vectorEffect="non-scaling-stroke"
                className={cn(stufe.uebergang?.engpass && "text-red-500 animate-engpass")}
              />
            );
          })}
          {GAP_BAENDER.map((band, i) => {
            // Die Luecke faerbt sich wie die Stufe, in die sie muendet - ein
            // durchgehender Verlauf statt eines Bruchs an der Naht.
            const stufeDanach = stufen[i + 1];
            if (!stufeDanach) return null;
            return (
              <path
                key={`luecke-${i}`}
                d={trapezPfad(band.yOben, band.yUnten, band.halb, band.halb)}
                fill="currentColor"
                fillOpacity={0.15 + 0.65 * stufeDanach.anteil}
              />
            );
          })}
        </svg>

        {/* HTML-Overlay: vier tippbare Reihen, dazwischen drei
            Uebergangszeilen. Alles ausser den Knoepfen pointer-events-none -
            siehe Festlegung 2 im Kopf. */}
        {stufen.map((stufe, i) => {
          const band = STUFEN_BAENDER[i];
          if (!band) return null;
          const naechste = stufen[i + 1];
          const gapBand = GAP_BAENDER[i];
          return (
            <Fragment key={stufe.key}>
              <button
                type="button"
                aria-pressed={stufe.key === ausgewaehlt}
                aria-label={`${stufe.titel}: ${stufe.wert}`}
                onClick={() =>
                  setAusgewaehlt((vorher) => (vorher === stufe.key ? null : stufe.key))
                }
                style={{
                  top: `${(band.yOben / HOEHE) * 100}%`,
                  height: `${((band.yUnten - band.yOben) / HOEHE) * 100}%`,
                  animationDelay: `${i * 90}ms`,
                }}
                className="animate-rise absolute inset-x-0 flex min-h-11 items-center justify-between rounded-lg px-4 text-left transition hover:bg-sunken/40 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-akzent"
              >
                <span className="text-sm font-medium text-ink">{stufe.titel}</span>
                <span className="text-base font-semibold tabular-nums text-ink">
                  {stufe.wert}
                </span>
              </button>

              {naechste?.uebergang && gapBand && (
                <div
                  className="pointer-events-none absolute inset-x-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-2 text-center"
                  style={{
                    top: `${((gapBand.yOben + gapBand.yUnten) / 2 / HOEHE) * 100}%`,
                    transform: "translateY(-50%)",
                  }}
                >
                  <span className="text-xs font-semibold tabular-nums text-ink">
                    {naechste.uebergang.quote}
                  </span>
                  <span className="text-11 text-ink-soft">
                    Team {naechste.uebergang.teamQuote}
                  </span>
                  <span className={cn(chip("neutral"), "tabular-nums")}>
                    {naechste.uebergang.dropOff}
                  </span>
                  {naechste.uebergang.engpass && (
                    <span className={chip("gefahr")}>Engpass</span>
                  )}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {gewaehlteStufe ? (
        <div className="mt-6 border-t border-line pt-4">
          <p className="text-sm font-semibold text-ink">{gewaehlteStufe.titel}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {gewaehlteStufe.wert}
          </p>
          <p className="mt-2 text-sm text-ink-muted">{gewaehlteStufe.hinweis}</p>

          {gewaehlteStufe.uebergang && (
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              <div>
                <dt className={kicker}>Eigene Quote</dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
                  {gewaehlteStufe.uebergang.quote}
                </dd>
              </div>
              <div>
                <dt className={kicker}>Team-Schnitt</dt>
                <dd className="mt-0.5 text-sm tabular-nums text-ink-muted">
                  {gewaehlteStufe.uebergang.teamQuote}
                </dd>
              </div>
              <div>
                <dt className={kicker}>Drop-off</dt>
                <dd className="mt-0.5 text-sm tabular-nums text-ink-muted">
                  {gewaehlteStufe.uebergang.dropOff}
                </dd>
              </div>
            </dl>
          )}
        </div>
      ) : (
        engpassStufe && (
          <p className="mt-6 border-t border-line pt-4 text-sm text-ink-muted">
            {/* Nicht kleinschreiben: "Engpass: abschlüsse" ist ein
                Substantiv in Kleinschreibung und stand auf jeder
                Trichter-Seite. */}
            <span className="font-semibold">Engpass: {engpassStufe.titel}.</span>{" "}
            {engpassStufe.hinweis}
          </p>
        )
      )}
    </div>
  );
}
