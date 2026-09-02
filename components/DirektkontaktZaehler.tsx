"use client";

// Die Zaehlerreihe des Direktkontakttrichters (AP-21).
//
// Der Bildschirm, der auf der Strasse in einer Hand liegt. Daraus folgt alles
// andere:
//
// 1. EIN DAUMEN, EIN TIPP. Der Plus-Knopf ist der breiteste Griff der Karte
//    und hoeher als die Mindestgroesse (min-h-11 = 44 px); das Minus steht
//    daneben, quadratisch und blass - es ist der Vertipper-Knopf, nicht die
//    halbe Bedienung.
// 2. DIE ZAHL SPRINGT SOFORT. useOptimistic wie im QuickCounter: wer im Gehen
//    dreimal tippt, darf nicht auf drei Serverrunden warten. Die Aktion gibt
//    den wahren Tagesstand zurueck, die Seite rechnet sich danach nach.
// 3. KEIN FORMULAR, KEIN SPEICHERN. Ein Tipp ist gebucht. Ein Speichern-Knopf
//    waere der zweite Griff, den auf der Strasse niemand macht.

import { useOptimistic, useTransition } from "react";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { card, kicker } from "@/components/ui";

export type DirektkontaktZaehlerStufe = {
  /** Der Enum-Wert - geht unveraendert an die Server-Action. */
  key: string;
  titel: string;
  /** Stand von heute, vom Server. */
  anzahl: number;
};

/** +1 / −1 fuer genau eine Stufe. Zurueck kommt der wahre Tagesstand. */
type Zaehlen = (stufe: string, delta: number) => Promise<unknown>;

function Stufe({
  stufe,
  zaehlen,
}: {
  stufe: DirektkontaktZaehlerStufe;
  zaehlen: Zaehlen;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimistisch, addOptimistic] = useOptimistic(
    stufe.anzahl,
    (jetzt, schritt: number) => Math.max(0, jetzt + schritt)
  );

  const tippe = (delta: 1 | -1) => {
    startTransition(async () => {
      addOptimistic(delta);
      await zaehlen(stufe.key, delta);
    });
  };

  return (
    <div className={`${card} p-4`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-13 font-medium text-ink-muted">{stufe.titel}</span>
        <span className={kicker}>Heute</span>
      </div>
      <p className="mt-2 overflow-hidden text-4xl leading-none font-semibold tracking-tight tabular-nums text-ink">
        <span key={optimistisch} className="inline-block animate-tick">
          {optimistisch}
        </span>
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => tippe(-1)}
          disabled={optimistisch <= 0}
          aria-label={`${stufe.titel} eins zurück`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line text-ink-muted transition hover:border-line-strong hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-ink-muted disabled:active:scale-100"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => tippe(1)}
          // Der Riegel gegen den durchgedrueckten Daumen: mehr als drei Tipps
          // Vorsprung vor dem Server nimmt der Knopf nicht an.
          disabled={isPending && optimistisch - stufe.anzahl > 3}
          aria-label={`${stufe.titel} eins mehr`}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-sunken px-3 text-base font-semibold text-ink transition hover:border-navy-300 hover:bg-navy-50 hover:text-navy-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />1
        </button>
      </div>
    </div>
  );
}

export default function DirektkontaktZaehler({
  stufen,
  zaehlen,
}: {
  stufen: DirektkontaktZaehlerStufe[];
  zaehlen: Zaehlen;
}) {
  // Zwei Spalten am Handy, fuenf am Schreibtisch: fuenf nebeneinander sind auf
  // 375 px Breite je 70 px - kein Griff mehr, sondern ein Nadelkissen.
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stufen.map((stufe) => (
        <Stufe key={stufe.key} stufe={stufe} zaehlen={zaehlen} />
      ))}
    </div>
  );
}
