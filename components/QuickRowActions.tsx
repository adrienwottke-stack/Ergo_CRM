"use client";

// Die Schnellaktionen einer Zeile in der Heute-Liste.
//
// Bisher fuehrte hier jeder Ausgang ueber "Erledigt" -> Dialog -> Pflicht-
// Freitext -> speichern. Der haeufigste Fall des Tages (nicht erreicht) kostete
// drei Tipps und vierzehn Anschlaege. Jetzt ist er ein Tipp.
//
// Drei Modi, weil nicht jeder faellige Schritt ein Anruf ist:
//   Anruf-Schritt   -> die drei Gespraechsergebnisse
//   Termin-Schritt  -> gehalten (mit Empfehlungsfrage) oder geplatzt
//   anderer Schritt -> Erledigt plus Verschiebe-Chips
// Alles Seltenere liegt hinter "…".
//
// Dazu die Frage nach dem Anruf, die es vorher nur im Durchlauf gab: wer aus
// dieser Zeile heraus telefoniert und zurueckkommt, findet die Ergebnisleiste
// genau dieser Zeile hervorgehoben vor - in einer Liste mit zwanzig Namen ist
// das der Unterschied zwischen "eintragen" und "suchen, wo ich war".

import { useEffect, useRef, useState } from "react";
import {
  completeStepQuick,
  recordAppointmentMissed,
  recordAppointmentResult,
  recordCallResult,
  snoozeStepQuick,
} from "@/app/(app)/contacts/results";
import ContactActionDialog, {
  type ActionMode,
  type ContactLite,
} from "@/components/ContactActionDialog";
import { frageNachEinheiten } from "@/components/EinheitenNachAbschluss";
import {
  AppointmentDialog,
  AppointmentHeldDialog,
  SpaeterDialog,
} from "@/components/ResultDialogs";
import { undoMoeglich } from "@/components/UndoBar";
import {
  CalendarCheckIcon,
  CheckIcon,
  ClockIcon,
  PhoneIcon,
  PhoneOffIcon,
  XIcon,
} from "@/components/icons";

const knopf =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-13 font-medium transition active:scale-[0.98] disabled:opacity-50";

const stil = {
  call: `${knopf} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`,
  primaer: `${knopf} bg-akzent text-white hover:bg-akzent-stark`,
  erfolg: `${knopf} bg-fest-erfolg text-white hover:bg-fest-erfolg-stark`,
  neutral: `${knopf} border border-line-strong bg-surface text-ink hover:bg-sunken`,
  weich: `${knopf} bg-sunken text-ink-muted hover:bg-line`,
  warm: `${knopf} bg-amber-100 text-amber-900 hover:bg-amber-200`,
};

const SNOOZE_CHIPS = [
  { label: "Morgen", days: "1" },
  { label: "+3 Tage", days: "3" },
  { label: "Nächste Woche", days: "7" },
];

export default function QuickRowActions({
  contact,
  istAnruf,
  istTermin = false,
}: {
  contact: ContactLite;
  /** Anruf-Schritt? Dann die vier Ergebnisse statt "Erledigt". */
  istAnruf: boolean;
  /** Termin-Schritt? Dann gehalten/geplatzt statt "Erledigt". */
  istTermin?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [dialog, setDialog] = useState<
    null | "appointment" | "later" | "gehalten"
  >(null);
  const [mehr, setMehr] = useState<ActionMode | null>(null);

  // Rueckkehr nach dem Telefonat - dasselbe Muster wie im Durchlauf
  // (components/NameDialer.tsx): der "Anrufen"-Link merkt sich, dass gewaehlt
  // wurde, und `visibilitychange` meldet die Rueckkehr in den Browser.
  //
  // Bewusst nur Zustand im Browser und kein Feld in der Datenbank: wer die App
  // wegwischt, verliert die Frage. Das ist die Grenze zu L2 (docs/emil-
  // feedback-runde-2.md) und kein Versehen - ein persistenter Zustand
  // "Anruf laeuft" braucht auch einen Weg, ihn wieder loszuwerden.
  const [zurueck, setZurueck] = useState(false);
  const angerufen = useRef(false);

  useEffect(() => {
    const beiSichtbar = () => {
      if (document.visibilityState === "visible" && angerufen.current) {
        setZurueck(true);
      }
    };
    document.addEventListener("visibilitychange", beiSichtbar);
    return () => document.removeEventListener("visibilitychange", beiSichtbar);
  }, []);

  const senden = async (
    action: (data: FormData) => Promise<unknown>,
    felder: Record<string, string>
  ) => {
    setPending(true);
    setFehler(null);
    try {
      const data = new FormData();
      data.set("contactId", contact.id);
      Object.entries(felder).forEach(([schluessel, wert]) => data.set(schluessel, wert));
      await action(data);
      undoMoeglich();
      setDialog(null);
      // Ergebnis steht - die Frage hat sich damit erledigt.
      angerufen.current = false;
      setZurueck(false);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Das hat nicht geklappt.");
    } finally {
      setPending(false);
    }
  };

  const verloren = contact.outcome === "VERLOREN";
  // Hervorgehoben wird nur die Anruf-Leiste: dort stehen die drei Ergebnisse,
  // nach denen nach einem Telefonat gefragt wird.
  const frage = zurueck && !verloren && istAnruf;

  return (
    <>
      {/* Der Ring liegt auf der Leiste selbst, die Frage als volle Zeile
          darin: so wandert beim Hervorheben nichts in der Zeile, und der
          negative Aussenabstand faengt den Innenabstand des Rings wieder auf. */}
      <div
        className={
          frage
            ? "-m-1.5 flex flex-wrap items-center gap-1.5 rounded-2xl p-1.5 ring-2 ring-navy-500"
            : "flex flex-wrap items-center gap-1.5"
        }
      >
        {frage && (
          <p className="w-full text-13 font-semibold text-ink">
            {`Wie lief's mit ${contact.name}?`}
          </p>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            onClick={() => {
              angerufen.current = true;
            }}
            className={stil.call}
          >
            <PhoneIcon className="h-4 w-4" />
            Anrufen
          </a>
        )}

        {!verloren && istAnruf && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => senden(recordCallResult, { result: "unreachable" })}
              className={stil.weich}
            >
              <PhoneOffIcon className="h-4 w-4" /> Nicht erreicht
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDialog("later")}
              className={stil.warm}
            >
              <ClockIcon className="h-4 w-4" /> Später
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDialog("appointment")}
              className={stil.erfolg}
            >
              <CalendarCheckIcon className="h-4 w-4" /> Termin
            </button>
          </>
        )}

        {!verloren && !istAnruf && istTermin && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDialog("gehalten")}
              className={stil.erfolg}
            >
              <CheckIcon className="h-4 w-4" /> Gehalten
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => senden(recordAppointmentMissed, {})}
              className={stil.weich}
            >
              <XIcon className="h-4 w-4" /> Geplatzt
            </button>
          </>
        )}

        {!verloren && !istAnruf && !istTermin && contact.hasStep && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => senden(completeStepQuick, {})}
              className={stil.primaer}
            >
              <CheckIcon className="h-4 w-4" />
              Erledigt
            </button>
            {SNOOZE_CHIPS.map((chip) => (
              <button
                key={chip.days}
                type="button"
                disabled={pending}
                onClick={() => senden(snoozeStepQuick, { days: chip.days })}
                className={stil.weich}
              >
                {chip.label}
              </button>
            ))}
          </>
        )}

        <button
          type="button"
          onClick={() => setMehr("stage")}
          aria-label="Weitere Aktionen"
          className={`${stil.neutral} px-3.5`}
        >
          …
        </button>
      </div>

      {fehler && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{fehler}</p>
      )}

      <AppointmentDialog
        open={dialog === "appointment"}
        name={contact.name}
        pending={pending}
        onClose={() => setDialog(null)}
        onSave={(when) =>
          senden(recordCallResult, { result: "appointment", appointmentAt: when })
        }
      />

      <AppointmentHeldDialog
        open={dialog === "gehalten"}
        name={contact.name}
        pending={pending}
        onClose={() => setDialog(null)}
        onSave={(data) => {
          // Das FormData kommt fertig aus dem Dialog: Ergebnis und
          // Empfehlungszeilen als Wiederholungsfelder, dieselbe Form, die auch
          // das Nachtragen am Kontakt benutzt. Hier fehlt nur noch, um WEN es
          // geht.
          data.set("contactId", contact.id);
          setPending(true);
          setFehler(null);
          void (async () => {
            try {
              await recordAppointmentResult(data);
              undoMoeglich();
              setDialog(null);
              // Der Abschluss steht jetzt in der Datenbank. Erst danach die
              // Frage nach der Zahl - sie darf das Speichern nie aufhalten.
              // Als Ereignis, weil diese Zeile gleich aus der Heute-Liste
              // faellt: das Fenster haengt in der Schale, nicht an ihr.
              if (data.get("result") === "abschluss") {
                frageNachEinheiten(contact.name);
              }
            } catch (err) {
              setFehler(err instanceof Error ? err.message : "Das hat nicht geklappt.");
            } finally {
              setPending(false);
            }
          })();
        }}
      />

      {/* Zwei Wege in einem Dialog: der grobe Abstand kostet weiter einen
          Tipp, der genaue Zeitpunkt schreibt die Wiedervorlage MIT Uhrzeit -
          und nur die landet danach im Kalender. */}
      <SpaeterDialog
        open={dialog === "later"}
        name={contact.name}
        pending={pending}
        onClose={() => setDialog(null)}
        onTage={(tage) => senden(recordCallResult, { result: "later", days: tage })}
        onZeitpunkt={(wann) =>
          senden(recordCallResult, { result: "later", followUpAt: wann })
        }
      />

      <ContactActionDialog
        open={mehr !== null}
        mode={mehr ?? "stage"}
        contact={contact}
        onClose={() => setMehr(null)}
        onSuccess={({ stage }) => {
          if (stage === "ABSCHLUSS") frageNachEinheiten(contact.name);
        }}
      />
    </>
  );
}
