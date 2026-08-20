"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addName } from "@/app/(app)/namen/actions";
import { SPRINT_SEKUNDEN, SPRINT_VERGLEICH, sprintIntro } from "@/lib/willkommen";
import type { ListKind } from "@/lib/generated/prisma/enums";

// Der 60-Sekunden-Sprint: aus der laestigsten Pflicht ("trag mal Namen ein")
// wird der beste Moment. Jeder Name laeuft sofort ueber die echte
// addName-Action - dieselbe Dublettenpruefung, derselbe Wettbewerbszaehler.
// Kein zweiter Schreibpfad.
//
// Einfuegen zaehlt auch: wer 30 Namen aus den Notizen kopiert hat, fuegt sie
// in dasselbe Feld ein - Zeilen und Kommas trennen. Und wo der Browser
// Spracherkennung kann, gibt es ein Mikrofon; getippt werden kann immer.

type SprintPhase = "intro" | "lauf" | "ergebnis";

type Erkennung = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function erkennungAnlegen(): Erkennung | null {
  if (typeof window === "undefined") return null;
  const fenster = window as unknown as {
    SpeechRecognition?: new () => Erkennung;
    webkitSpeechRecognition?: new () => Erkennung;
  };
  const Klasse = fenster.SpeechRecognition ?? fenster.webkitSpeechRecognition;
  return Klasse ? new Klasse() : null;
}

export default function NamenSprint({
  track,
  onDone,
}: {
  track: ListKind;
  /** Bekommt die Anzahl der im Sprint angelegten Namen. */
  onDone: (anzahl: number) => void;
}) {
  const [phase, setPhase] = useState<SprintPhase>("intro");
  const [rest, setRest] = useState(SPRINT_SEKUNDEN);
  const [anzahl, setAnzahl] = useState(0);
  const [zuletzt, setZuletzt] = useState<string[]>([]);
  const [hoert, setHoert] = useState(false);
  const [, startTransition] = useTransition();
  const eingabeRef = useRef<HTMLInputElement>(null);
  const erkennungRef = useRef<Erkennung | null>(null);
  const [mikrofonDa, setMikrofonDa] = useState(false);

  useEffect(() => {
    setMikrofonDa(erkennungAnlegen() !== null);
  }, []);

  // Der Countdown.
  useEffect(() => {
    if (phase !== "lauf") return;
    const timer = setInterval(() => {
      setRest((wert) => {
        if (wert <= 1) {
          clearInterval(timer);
          setPhase("ergebnis");
          erkennungRef.current?.stop();
          return 0;
        }
        return wert - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const anlegen = (roh: string) => {
    const name = roh.trim().slice(0, 60);
    if (name.length < 2) return;
    if (navigator.vibrate) navigator.vibrate(12);
    setAnzahl((wert) => wert + 1);
    setZuletzt((liste) => [name, ...liste].slice(0, 3));
    const data = new FormData();
    data.set("name", name);
    data.set("listKind", track);
    // Fire-and-forget: der Sprint wartet auf niemanden. Dubletten faengt die
    // Action selbst ("already" zaehlt dann eben nicht doppelt in der Liste).
    startTransition(async () => {
      try {
        await addName(data);
      } catch {
        // Ein verlorener Name ist aergerlich, ein eingefrorener Sprint schlimmer.
      }
    });
  };

  const eintragen = () => {
    const wert = eingabeRef.current?.value ?? "";
    if (eingabeRef.current) eingabeRef.current.value = "";
    // Auch getippte Kommas trennen - "Max, Lisa und Jonas" sind drei Namen.
    for (const teil of wert.split(/[\n,;]+| und /i)) anlegen(teil);
    eingabeRef.current?.focus();
  };

  const einfuegen = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text");
    if (!/[\n,;]/.test(text)) return; // einzelner Name: normal einfuegen lassen
    event.preventDefault();
    for (const teil of text.split(/[\n,;]+/)) anlegen(teil);
  };

  const mikrofon = () => {
    if (hoert) {
      erkennungRef.current?.stop();
      return;
    }
    const erkennung = erkennungAnlegen();
    if (!erkennung) return;
    erkennungRef.current = erkennung;
    erkennung.lang = "de-DE";
    erkennung.continuous = true;
    erkennung.interimResults = false;
    erkennung.onresult = (event) => {
      const letzte = event.results[event.results.length - 1];
      const transcript = letzte?.[0]?.transcript ?? "";
      for (const teil of transcript.split(/[\n,;]+| und /i)) anlegen(teil);
    };
    erkennung.onend = () => setHoert(false);
    try {
      erkennung.start();
      setHoert(true);
    } catch {
      setHoert(false);
    }
  };

  if (phase === "intro") {
    return (
      <div className="flex h-full flex-col justify-center gap-6">
        <div className="space-y-2">
          {sprintIntro.map((zeile, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? "text-3xl font-bold text-white"
                  : "text-base leading-relaxed text-slate-300"
              }
            >
              {zeile}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setPhase("lauf");
            setTimeout(() => eingabeRef.current?.focus(), 50);
          }}
          className="min-h-14 w-full rounded-xl bg-gold-400 text-lg font-bold text-navy-950 transition hover:bg-gold-100 active:scale-[0.98]"
        >
          Start
        </button>
        <button
          type="button"
          onClick={() => onDone(0)}
          className="block w-full text-center text-sm text-slate-400 hover:text-white"
        >
          Mach ich später
        </button>
      </div>
    );
  }

  if (phase === "ergebnis") {
    const stark = anzahl > SPRINT_VERGLEICH;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
        <p className="text-6xl font-bold tabular-nums text-gold-400">{anzahl}</p>
        <div>
          <p className="text-xl font-semibold text-white">
            {anzahl === 1 ? "Name" : "Namen"} in {SPRINT_SEKUNDEN} Sekunden.
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {anzahl === 0
              ? "Kein Problem — die Liste wartet in der App auf dich."
              : stark
                ? `Die meisten schaffen ${SPRINT_VERGLEICH}. Du nicht.`
                : `Die meisten schaffen ${SPRINT_VERGLEICH} — und jeder einzelne zählt schon für den Wettbewerb.`}
          </p>
        </div>
        {anzahl > 0 && (
          <p className="text-sm text-slate-300">
            Die stehen ab jetzt in deiner Liste — mit deinen Punkten.
          </p>
        )}
        <button
          type="button"
          onClick={() => onDone(anzahl)}
          className="min-h-12 w-full rounded-xl bg-gold-400 text-[15px] font-bold text-navy-950 transition hover:bg-gold-100 active:scale-[0.98]"
        >
          Weiter
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div className="flex items-center justify-between">
        <p
          className={`text-5xl font-bold tabular-nums ${rest <= 10 ? "text-red-400" : "text-white"}`}
        >
          {rest}
        </p>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-gold-400">{anzahl}</p>
          <p className="text-xs text-slate-400">{anzahl === 1 ? "Name" : "Namen"}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          ref={eingabeRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Name, Enter, nächster"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              eintragen();
            }
          }}
          onPaste={einfuegen}
          className="min-h-14 w-full flex-1 rounded-xl border border-white/25 bg-white/5 px-4 text-lg text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={eintragen}
          aria-label="Name eintragen"
          className="min-h-14 w-14 shrink-0 rounded-xl bg-gold-400 text-2xl font-bold text-navy-950 active:scale-[0.95]"
        >
          +
        </button>
        {mikrofonDa && (
          <button
            type="button"
            onClick={mikrofon}
            aria-label={hoert ? "Aufnahme stoppen" : "Namen einsprechen"}
            className={`min-h-14 w-14 shrink-0 rounded-xl text-xl transition active:scale-[0.95] ${
              hoert ? "animate-pulse bg-red-500 text-white" : "bg-white/10 text-white"
            }`}
          >
            🎤
          </button>
        )}
      </div>

      <div className="min-h-[72px]">
        {anzahl >= 3 && rest > 15 && (
          <p className="text-center text-sm font-medium text-slate-300">
            Weiter. Nicht nachdenken.
          </p>
        )}
        <ul className="mt-2 space-y-1 text-center">
          {zuletzt.map((name, index) => (
            <li
              key={`${name}-${index}`}
              className={`animate-tick text-sm ${index === 0 ? "text-white" : "text-slate-500"}`}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => {
          erkennungRef.current?.stop();
          setPhase("ergebnis");
        }}
        className="block w-full text-center text-sm text-slate-400 hover:text-white"
      >
        Mir fällt keiner mehr ein
      </button>
    </div>
  );
}
