"use client";

// Der kurze Weg zur eigenen Zahl.
//
// Bisher lag das Zaehlen drei Tipps und einen Seitenwechsel tief: Wettbewerb ->
// Meine Aktivitaeten -> warten -> +1. Fuer die haeufigste Handlung des Tages
// ist das der falsche Preis. Wer zwischen zwei Anrufen steht, macht das nicht -
// und die Rangliste zeigt am Abend weniger, als tatsaechlich passiert ist.
//
// Bewusst KEIN neunter Navigationspunkt: die Kopfzeile traegt schon acht, und
// ein Tab wechselt die Seite - man verliert, wo man war, und muss zurueck.
// Dasselbe Muster wie beim Megafon (components/RueckmeldungGeben.tsx,
// docs/audit-kernmodell.md 5.14): ein Symbol kostet nur den Aufmerksamkeit,
// der es benutzt, und ist von ueberall aus einen Daumen entfernt.
//
// Drei Zaehler, mehr nicht. Gehaltene Termine, Abschluesse und Empfehlungen
// entstehen am Kontakt (lib/labels.ts, manualQuotaTypes) - hier waeren sie
// doppelt.

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  quickLog,
  quickLogZurueck,
  standHeute,
} from "@/app/(team)/log/quickLogAction";
import type { SchnellStand } from "@/lib/stats";
import Modal from "@/components/Modal";
import {
  CalendarCheckIcon,
  FlameIcon,
  HashIcon,
  MinusIcon,
  PhoneIcon,
  PlusIcon,
} from "@/components/icons";
import { manualQuotaTypes, quotaTypeLabels, quotaTypePoints } from "@/lib/labels";
import type { QuotaType } from "@/lib/generated/prisma/enums";
import { cn, flaeche } from "@/components/ui";

const symbolFarbe: Partial<Record<QuotaType, string>> = {
  CALL: "bg-navy-50 text-navy-700",
  NUMBERS_PULLED: "bg-navy-50 text-navy-600",
  APPOINTMENT_SET: "bg-emerald-50 text-emerald-600",
};

function ArtSymbol({ type, className }: { type: QuotaType; className?: string }) {
  if (type === "CALL") return <PhoneIcon className={className} />;
  if (type === "NUMBERS_PULLED") return <HashIcon className={className} />;
  return <CalendarCheckIcon className={className} />;
}

export default function AktivitaetZaehlen() {
  const router = useRouter();

  const [offen, setOffen] = useState(false);
  const [stand, setStand] = useState<SchnellStand | null>(null);
  // Derselbe Wert noch einmal als Referenz: eine Zustandsfunktion laeuft erst
  // beim naechsten Rendern, die Antwort des Servers braucht die Auskunft
  // "steht der Stand schon?" aber sofort.
  const standRef = useRef<SchnellStand | null>(null);
  // Was der Daumen schon getippt hat, bevor der Server geantwortet hat. Die
  // Zahl darf nicht auf die Leitung warten - sonst tippt man zweimal.
  const [delta, setDelta] = useState<Partial<Record<QuotaType, number>>>({});
  const [gezaehlt, setGezaehlt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const oeffnen = useCallback(() => {
    setOffen(true);
    setFehler(null);
    // Erst beim Oeffnen laden: die Kopfzeile steht auf jeder Seite und soll
    // niemanden etwas kosten, der nie zaehlt.
    void standHeute()
      .then((geladen) => {
        standRef.current = geladen;
        setStand(geladen);
      })
      .catch(() => setFehler("Der Stand kam nicht durch. Zählen geht trotzdem."));
  }, []);

  const schliessen = useCallback(() => {
    setOffen(false);
    // Die Seite im Hintergrund traegt die neue Zahl sofort mit - sonst steht
    // auf /heute oder in der Arena noch der Stand von vorhin.
    if (gezaehlt) router.refresh();
    setTimeout(() => {
      standRef.current = null;
      setStand(null);
      setDelta({});
      setGezaehlt(false);
      setFehler(null);
    }, 200);
  }, [gezaehlt, router]);

  const zaehlen = useCallback(
    async (type: QuotaType, richtung: 1 | -1) => {
      setFehler(null);
      setDelta((alt) => ({ ...alt, [type]: (alt[type] ?? 0) + richtung }));
      setGezaehlt(true);

      try {
        const neu =
          richtung === 1 ? await quickLog(type, 1) : await quickLogZurueck(type);
        if (neu === null) return;
        // Der Server hat das letzte Wort: greift die Tageskappe, steht danach
        // wieder die wahre Zahl da statt der erhofften - und die Punktzeile
        // waechst um genau das, was wirklich gebucht wurde.
        //
        // Laedt der Stand noch, bleibt der Tipp im Zwischenspeicher liegen und
        // wird spaeter auf den geladenen Stand draufgezaehlt: sonst verschwaende
        // er optisch, bis das Fenster das naechste Mal aufgeht.
        const alt = standRef.current;
        if (!alt) return;
        const vorher = alt.stand[type] ?? 0;
        const neuerStand: SchnellStand = {
          ...alt,
          stand: { ...alt.stand, [type]: neu },
          punkte: alt.punkte + (neu - vorher) * quotaTypePoints[type],
        };
        standRef.current = neuerStand;
        setStand(neuerStand);
        // Nur diesen einen Tipp aus dem Zwischenspeicher nehmen, nicht alles auf
        // null setzen: wer dreimal schnell hintereinander tippt, hat noch zwei
        // Antworten unterwegs - die Zahl darf zwischendurch nicht zurueckfallen.
        setDelta((vorherige) => ({
          ...vorherige,
          [type]: (vorherige[type] ?? 0) - richtung,
        }));
      } catch {
        // Funkloch im Treppenhaus. Die Zahl geht zurueck, damit niemand mit
        // einem Punkt rechnet, der nie ankam.
        setDelta((alt) => ({ ...alt, [type]: (alt[type] ?? 0) - richtung }));
        setFehler("Kam nicht durch. Tipp es nochmal.");
      }
    },
    []
  );

  const zahlVon = (type: QuotaType): number | null =>
    stand === null ? null : (stand.stand[type] ?? 0) + (delta[type] ?? 0);

  // Die Punktzeile zaehlt die noch nicht bestaetigten Tipps mit - sonst tippt
  // man dreimal und unten bewegt sich nichts.
  const punkte =
    stand === null
      ? null
      : stand.punkte +
        manualQuotaTypes.reduce(
          (summe, art) => summe + (delta[art] ?? 0) * quotaTypePoints[art],
          0
        );

  return (
    <>
      <button
        type="button"
        onClick={oeffnen}
        aria-label="Aktivität zählen"
        title="Aktivität zählen"
        // Leichte Flaeche statt nur Umriss: daneben stehen Einstellungen
        // (Thema, Abmelden), das hier ist die eine Handlung in der Leiste.
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
      >
        <PlusIcon className="h-5 w-5" />
      </button>

      <Modal
        open={offen}
        onClose={schliessen}
        title="Was hast du gemacht?"
        subtitle="Zählt für heute."
      >
        <div className="space-y-2.5">
          {manualQuotaTypes.map((type) => {
            const zahl = zahlVon(type);
            return (
              <div
                key={type}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    symbolFarbe[type] ?? "bg-navy-50 text-navy-700"
                  )}
                >
                  <ArtSymbol type={type} className="h-4.5 w-4.5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-13 font-medium text-slate-600">
                    {quotaTypeLabels[type]}
                  </span>
                  <span className="block text-2xl font-semibold tabular-nums leading-tight text-slate-900">
                    {zahl === null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span key={zahl} className="inline-block animate-tick">
                        {zahl}
                      </span>
                    )}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void zaehlen(type, -1)}
                    disabled={zahl === null || zahl <= 0}
                    aria-label={`${quotaTypeLabels[type]} eins zurück`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line-strong text-slate-500 transition hover:border-slate-400 hover:text-slate-900 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line-strong disabled:hover:text-slate-500 disabled:active:scale-100"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void zaehlen(type, 1)}
                    aria-label={`${quotaTypeLabels[type]} plus eins`}
                    className="inline-flex h-11 w-16 items-center justify-center gap-1 rounded-lg bg-akzent text-sm font-semibold text-white transition hover:bg-akzent-stark active:scale-[0.97]"
                  >
                    <PlusIcon className="h-4 w-4" />1
                  </button>
                </span>
              </div>
            );
          })}
        </div>

        {fehler && (
          <p className={cn(flaeche("gefahr"), "mt-3 px-3 py-2 text-[13px] text-red-800")}>
            {fehler}
          </p>
        )}

        {/* Der Grund zum Tippen, in einer Zeile. Kein zweiter Bildschirm. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-13 text-slate-500">
          <span>
            <span className="font-semibold tabular-nums text-slate-900">
              {punkte === null ? "—" : punkte}
            </span>{" "}
            Punkte heute
          </span>
          {stand !== null && stand.serie >= 2 && (
            <span className="inline-flex items-center gap-1 font-medium text-gold-600">
              <FlameIcon className="h-3.5 w-3.5" />
              {stand.serie} Tage Serie
            </span>
          )}
        </div>
      </Modal>
    </>
  );
}
