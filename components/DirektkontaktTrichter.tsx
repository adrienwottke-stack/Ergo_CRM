"use client";

// Der Direktkontakttrichter als gezeichnete Grafik (AP-21).
//
// Bewusst eine EIGENE Komponente neben components/TrichterGrafik.tsx und keine
// Erweiterung von ihr. Zwei Gruende:
//
//   1. Die Geometrie dort ist auf VIER Stufen festgenagelt (HOEHE = 4 * SEG_H
//      + 3 * GAP_H). Mit fuenf Stufen faellt das unterste Band aus dem
//      viewBox - die Zahl stuende unter der Karte statt in ihr.
//   2. Der Verkaufs-Trichter zeigt neben jeder Quote den Team-Schnitt. Den gibt
//      es hier nicht und soll es nicht geben: Direktansprache machen heute eine
//      Handvoll Leute, ein "Team 12 %" aus drei Koepfen ist ein Zufall, kein
//      Massstab.
//
// Die vier Festlegungen von TrichterGrafik gelten unveraendert weiter:
// die Breite ist die Aussage (die Schraege IST die Quote), keine Schrift und
// kein Hex im SVG (Farbe ueber currentColor, damit der Dunkelmodus mitkommt),
// HTML und SVG lesen dieselbe Rechnung, und ein Tipp oeffnet ein Panel statt
// wegzunavigieren.

import { Fragment, useState } from "react";
import { chip, cn, kicker } from "@/components/ui";

// --- Die Ansicht -------------------------------------------------------------
// Die Typen stehen HIER und werden nicht aus lib/direktkontakt.ts geholt,
// obwohl sie dort dasselbe beschreiben. Grund: diese Datei ist eine
// Client-Komponente, und lib/direktkontakt.ts zieht Prisma herein. Ein
// `import type` waere zwar erasable - aber genau dieser Griff hat die Trennung
// lib/ausbauSicht.ts / lib/ausbau.ts noetig gemacht, und ein Tippfehler
// (`import` statt `import type`) faellt beim Lesen niemandem auf. Laufen die
// beiden Formen auseinander, meldet es tsc an der Seite, die sie verbindet.
//
// Alles hier ist FERTIG FORMATIERT vom Server (Muster TrichterGrafik,
// SchnellStand): diese Komponente rechnet nichts nach, sie zeigt nur an.

export type DirektkontaktUebergangAnsicht = {
  /** Quote zur Vorstufe, z. B. "12 %" - oder "–", wenn die Vorstufe bei 0 stand. */
  quote: string;
  /** vorher − wert, mit echtem Minuszeichen (U+2212). "±0" bei keiner Bewegung. */
  dropOff: string;
  /** Diese Stufe hat von allen Uebergaengen die schwaechste Quote. */
  engpass: boolean;
};

export type DirektkontaktStufeAnsicht = {
  key: string;
  titel: string;
  wert: number;
  /** wert / groesste (0..1). Bestimmt die BREITE des Bandes. */
  anteil: number;
  hinweis: string;
  /** null nur bei der ersten Stufe - sie hat keine Vorstufe. */
  uebergang: DirektkontaktUebergangAnsicht | null;
};

// --- Die Geometrie -----------------------------------------------------------
// BREITE und die Hoehen sind ein Rechenraster, keine Pixelangabe: das SVG wird
// per CSS auf die Kartenbreite und eine feste Hoehe gezogen
// (preserveAspectRatio="none").
const BREITE = 360;
const SEG_H = 56;
const GAP_H = 26;

// Die groesste Stufe fuellt die Breite fast aus, die kleinste behaelt eine
// sichtbare Spitze. HALB_MIN ist keine Kosmetik: ohne sie waere eine Stufe auf
// 0 gar nicht mehr da, und der Trichter endete im Nichts statt in einem
// erkennbaren "hier kommt nichts an".
const HALB_MAX = 172;
const HALB_MIN = 22;

function halbFuer(anteil: number): number {
  const sicher = Math.max(0, Math.min(1, anteil));
  return HALB_MIN + (HALB_MAX - HALB_MIN) * sicher;
}

/** Ein um die Mittelachse gespiegeltes Trapez. Gleiche Breiten = Rechteck. */
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

/**
 * Aus den Stufen die Geometrie: je Stufe ein Trapez von der eigenen Breite auf
 * die der naechsten, dazwischen die Naht als Rechteck in genau dieser
 * naechsten Breite. So ist die Schraege eines Bandes die Quote zur Folgestufe.
 *
 * Die HOEHE faellt hier mit ab und steht nicht als Konstante daneben: sie
 * haengt an der Anzahl der Stufen, und eine Konstante daneben liefe beim
 * naechsten Stufenwechsel auseinander.
 */
function geometrieVon(stufen: DirektkontaktStufeAnsicht[]) {
  const hoehe = Math.max(
    1,
    stufen.length * SEG_H + Math.max(0, stufen.length - 1) * GAP_H
  );
  const kanten = stufen.map((stufe) => halbFuer(stufe.anteil));
  const letzte = kanten[kanten.length - 1] ?? HALB_MIN;
  const baender = stufen.map((_, i) => {
    const yOben = i * (SEG_H + GAP_H);
    return {
      yOben,
      yUnten: yOben + SEG_H,
      halbOben: kanten[i] ?? HALB_MIN,
      halbUnten: kanten[i + 1] ?? letzte,
    };
  });
  const naehte = stufen.slice(0, -1).map((_, i) => {
    const yOben = i * (SEG_H + GAP_H) + SEG_H;
    return { yOben, yUnten: yOben + GAP_H, halb: kanten[i + 1] ?? letzte };
  });
  return { hoehe, baender, naehte };
}

export default function DirektkontaktTrichter({
  stufen,
}: {
  stufen: DirektkontaktStufeAnsicht[];
}) {
  const { hoehe, baender, naehte } = geometrieVon(stufen);
  const [ausgewaehlt, setAusgewaehlt] = useState<string | null>(null);

  const gewaehlteStufe = stufen.find((stufe) => stufe.key === ausgewaehlt) ?? null;
  const engpassStufe = stufen.find((stufe) => stufe.uebergang?.engpass) ?? null;

  return (
    <div>
      {/* Breite gedeckelt und mittig: ueber die volle Kartenbreite gezogen
          wuerde aus dem Trichter ein Stapel flacher Baender. Am Handy greift
          der Deckel nicht - dort ist w-full ohnehin schmaler. */}
      <div className="relative mx-auto h-[26rem] w-full max-w-lg sm:h-[28rem]">
        <svg
          viewBox={`0 0 ${BREITE} ${hoehe}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="block h-full w-full text-akzent"
        >
          {baender.map((band, i) => {
            const stufe = stufen[i];
            if (!stufe) return null;
            const istGewaehlt = stufe.key === ausgewaehlt;
            // Gleichmaessige Fuellung: die Menge steht schon in der Breite.
            // Waere die Deckkraft dasselbe noch einmal, waeren die unteren
            // Stufen doppelt bestraft - schmal UND blass.
            return (
              <path
                key={stufe.key}
                d={trapezPfad(band.yOben, band.yUnten, band.halbOben, band.halbUnten)}
                fill="currentColor"
                fillOpacity={istGewaehlt ? 0.7 : 0.5}
                stroke={istGewaehlt ? "currentColor" : "none"}
                strokeWidth={istGewaehlt ? 2 : 0}
                vectorEffect="non-scaling-stroke"
                className={cn(stufe.uebergang?.engpass && "text-red-500 animate-engpass")}
              />
            );
          })}
          {naehte.map((naht, i) => (
            // Die Naht faerbt sich wie die Stufe, in die sie muendet - ein
            // durchgehender Umriss statt eines Bruchs an der Kante.
            <path
              key={`naht-${i}`}
              d={trapezPfad(naht.yOben, naht.yUnten, naht.halb, naht.halb)}
              fill="currentColor"
              fillOpacity={0.5}
              className={cn(stufen[i + 1]?.uebergang?.engpass && "text-red-500")}
            />
          ))}
        </svg>

        {/* HTML-Overlay: fuenf tippbare Reihen, dazwischen vier
            Uebergangszeilen. Die Beschriftung steht MITTIG auf der Achse und
            nicht im Band - bei 40 Ansprachen auf 1 Rekrutierten ist das
            unterste Band schmaler als das Wort. */}
        {stufen.map((stufe, i) => {
          const band = baender[i];
          if (!band) return null;
          const naechste = stufen[i + 1];
          const gapBand = naehte[i];
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
                  top: `${(band.yOben / hoehe) * 100}%`,
                  height: `${((band.yUnten - band.yOben) / hoehe) * 100}%`,
                  animationDelay: `${i * 90}ms`,
                }}
                className="animate-rise absolute inset-x-0 flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-3 text-center transition hover:bg-sunken/25 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-akzent"
              >
                <span className="text-xs font-medium text-ink-muted">{stufe.titel}</span>
                <span className="text-2xl leading-none font-semibold tabular-nums text-ink">
                  {stufe.wert}
                </span>
              </button>

              {naechste?.uebergang && gapBand && (
                <div
                  className="pointer-events-none absolute inset-x-0 flex justify-center px-2"
                  style={{
                    top: `${((gapBand.yOben + gapBand.yUnten) / 2 / hoehe) * 100}%`,
                    transform: "translateY(-50%)",
                  }}
                >
                  {/* Eigener Grund unter der Naht-Zeile. Ohne ihn steht sie je
                      nach Trichterbreite halb auf der Form und halb daneben. */}
                  <span className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-full border border-line bg-surface px-3 py-1">
                    <span className="text-xs font-semibold tabular-nums text-ink">
                      {naechste.uebergang.quote}
                    </span>
                    <span className={cn(chip("neutral"), "tabular-nums")}>
                      {naechste.uebergang.dropOff}
                    </span>
                    {naechste.uebergang.engpass && (
                      <span className={chip("gefahr")}>Engpass</span>
                    )}
                  </span>
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
                <dt className={kicker}>Quote zur Vorstufe</dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
                  {gewaehlteStufe.uebergang.quote}
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
            <span className="font-semibold">Engpass: {engpassStufe.titel}.</span>{" "}
            {engpassStufe.hinweis}
          </p>
        )
      )}
    </div>
  );
}
