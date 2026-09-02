"use client";

// Die Rueckblick-Karten des Teamabends, plus die Kuratierung davor
// (docs/emil-feedback-runde-2.md, AP-24, D20: "Auto-Rueckblick-Karten, von
// Emil kuratiert").
//
// WARUM ES DIESE KOMPONENTE UEBERHAUPT GIBT: die Karten selbst sind reiner
// Server-Text und braeuchten kein Javascript. Client wird sie allein wegen
// des Ausblendens - die Fuehrungskraft geht vor dem Abend einmal durch und
// nimmt heraus, was sie nicht ansprechen will.
//
// KEIN SERVER-ZUSTAND, KEINE PERSISTENZ. Der Abend ist ein Browser-Tab: die
// ausgeblendeten Ids liegen in sessionStorage unter "tracker-rueckblick-aus"
// und sterben mit dem Tab. Eine gespeicherte Kuratierung waere eine stille
// Dauer-Einstellung ("warum steht Nick nie im Rueckblick?"), die niemand mehr
// zurueckdreht - siehe "bewusst nicht gebaut" in
// docs/emil-feedback-runde-2.md, Abschnitt 8.
//
// Start immer mit "nichts ausgeblendet" und erst in useEffect nachgezogen:
// der Server kennt sessionStorage nicht, ein abweichender Startwert braeche
// die Hydration. Dasselbe Muster wie VorfuehrProvider.tsx, dieselben
// try/catch um jeden Zugriff - im privaten Modus wirft der Speicher, und ein
// Anzeige-Schalter soll daran nicht den Bildschirm reissen. Ohne Speicher
// zeigt der Abend eben alles.
//
// REGISTER: trocken, sportreportagenhaft (docs/wettbewerb-plan.md, 1). Keine
// Emojis, kein Konfetti, keine Farbe, die eine Karte lauter macht als die
// andere - auch die Team-Karte ("Woran wir arbeiten") sieht aus wie jede
// andere. Der Ton macht den Unterschied, nicht die Deko. Was hakt, traegt
// ohnehin keinen Namen; dafuer sorgt lib/rueckblick.ts.

import { useEffect, useState } from "react";
import { card, kicker } from "@/components/ui";
import type { Rueckblickkarte } from "@/lib/rueckblick";

const SPEICHER_SCHLUESSEL = "tracker-rueckblick-aus";

export default function RueckblickKarten({ karten }: { karten: Rueckblickkarte[] }) {
  const [aus, setAus] = useState<string[]>([]);

  useEffect(() => {
    try {
      const roh = sessionStorage.getItem(SPEICHER_SCHLUESSEL);
      if (!roh) return;
      const gelesen: unknown = JSON.parse(roh);
      if (!Array.isArray(gelesen)) return;
      setAus(gelesen.filter((eintrag): eintrag is string => typeof eintrag === "string"));
    } catch {
      // Kein Speicher oder ein kaputter Eintrag - dann zeigt der Abend alles.
    }
  }, []);

  const merken = (naechste: string[]) => {
    setAus(naechste);
    try {
      sessionStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(naechste));
    } catch {
      // Der Zustand gilt trotzdem fuer diese Seite - er ueberlebt nur kein
      // Neuladen.
    }
  };

  const sichtbar = karten.filter((karte) => !aus.includes(karte.id));
  const versteckt = karten.length - sichtbar.length;

  return (
    <div className="space-y-4">
      {sichtbar.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {sichtbar.map((karte) => (
            <li key={karte.id} className={`${card} flex flex-col p-6`}>
              <div className="flex items-start justify-between gap-3">
                <span className={kicker}>{karte.marke}</span>
                {/* Klein und leise: das Ausblenden gehoert zur Vorbereitung,
                    nicht auf den Beamer. 44 px hoch bleibt es trotzdem - am
                    Handy wird es getippt. */}
                <button
                  type="button"
                  onClick={() => merken([...aus, karte.id])}
                  className="-my-3 -mr-2 inline-flex min-h-11 items-center px-2 text-xs font-medium text-ink-soft transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-akzent"
                >
                  Ausblenden
                </button>
              </div>
              <p className="mt-3 text-4xl font-bold tabular-nums leading-none tracking-tight text-ink sm:text-5xl">
                {karte.zahl}
              </p>
              <p className="mt-3 text-base text-ink-muted sm:text-lg">{karte.text}</p>
            </li>
          ))}
        </ul>
      )}

      {sichtbar.length === 0 && (
        <p className="text-base text-ink-muted">Alle Karten sind ausgeblendet.</p>
      )}

      {versteckt > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-ink-soft">
            {versteckt} {versteckt === 1 ? "Karte" : "Karten"} ausgeblendet
          </span>
          <button
            type="button"
            onClick={() => merken([])}
            className="inline-flex min-h-11 items-center text-xs font-medium text-akzent transition hover:text-akzent-stark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-akzent"
          >
            Alle wieder zeigen
          </button>
        </div>
      )}
    </div>
  );
}
