"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import {
  AKTE,
  LEADER_AKTE,
  introChat,
  leaderChat,
  type Akt,
  type LeaderAkt,
} from "@/lib/willkommen";
import {
  aktErreicht,
  trackWaehlen,
  willkommenAbschliessen,
} from "@/app/(willkommen)/willkommen/actions";
import type { ListKind } from "@/lib/generated/prisma/enums";
import ChatFaden from "@/components/willkommen/ChatFaden";
import Hochrechnung from "@/components/willkommen/Hochrechnung";
import EinwandTest from "@/components/willkommen/EinwandTest";
import BriefAkt from "@/components/willkommen/BriefAkt";
import NamenSprint from "@/components/willkommen/NamenSprint";
import Einstufung from "@/components/willkommen/Einstufung";
import FotoAkt from "@/components/willkommen/FotoAkt";
import RanglisteMoment from "@/components/willkommen/RanglisteMoment";
import Ankunft from "@/components/willkommen/Ankunft";
import { FuehrungsKarten, EinladenAkt } from "@/components/willkommen/FuehrungsAkte";

// Die Regie des Willkommens-Ablaufs: welcher Akt laeuft, der duenne
// Fortschrittsbalken oben, das kleine Ueberspringen. Jeder Aktwechsel setzt
// einen Messstempel (fire-and-forget) - am Montag nach dem Launch soll
// niemand raten muessen, wo die Leute ausgestiegen sind.

export type Sozialbeweis = { name: string; tage: number; termine: number } | null;

export default function Willkommen({
  vorname,
  einlader,
  greeting,
  startTrack,
  leaderFlow,
  sozialbeweis,
  namenVorhanden,
  schonFertig,
}: {
  vorname: string;
  einlader: string;
  greeting: string | null;
  startTrack: ListKind | null;
  leaderFlow: boolean;
  sozialbeweis: Sozialbeweis;
  namenVorhanden: number;
  schonFertig: boolean;
}) {
  const router = useRouter();
  const akte: readonly string[] = leaderFlow ? LEADER_AKTE : AKTE;
  const [stufe, setStufe] = useState(0);
  const [track, setTrack] = useState<ListKind>(startTrack ?? "RECRUITING");
  const [sprintAnzahl, setSprintAnzahl] = useState(0);
  const [, startTransition] = useTransition();

  const akt = akte[stufe] as Akt | LeaderAkt;

  // Messstempel je Akt. Verloren ist egal, blockiert waere schlimm.
  useEffect(() => {
    startTransition(async () => {
      try {
        await aktErreicht(akt);
      } catch {
        // bewusst leer
      }
    });
  }, [akt]);

  // Das Hochfahren: zwei Sekunden Theater, dann geht es von selbst weiter.
  useEffect(() => {
    if (akt !== "boot") return;
    const sofort = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setStufe(1), sofort ? 150 : 2000);
    return () => clearTimeout(timer);
  }, [akt]);

  const weiter = () => setStufe((wert) => Math.min(wert + 1, akte.length - 1));

  const ueberspringen = () => {
    startTransition(async () => {
      await willkommenAbschliessen();
      router.replace(leaderFlow ? "/mannschaft" : "/namen");
      router.refresh();
    });
  };

  const chatAntwort = (frageId: string, optionId: string) => {
    if (frageId !== "track") return;
    const wahl: ListKind = optionId === "VERKAUF" ? "VERKAUF" : "RECRUITING";
    setTrack(wahl);
    startTransition(async () => {
      try {
        await trackWaehlen(wahl);
      } catch {
        // Die Weiche steht auch lokal - gespeichert wird beim naechsten Mal.
      }
    });
  };

  if (akt === "boot") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
        <LogoMark className="animate-rise h-16 w-16" />
        <p className="animate-rise text-center text-lg font-medium text-slate-300 [animation-delay:400ms]">
          {schonFertig ? "Einmal von vorn." : "Dein Werkzeug fährt hoch."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      {/* Duenner Fortschrittsbalken: er soll sehen, dass das hier endlich ist. */}
      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gold-400 transition-all duration-500"
            style={{ width: `${Math.round((stufe / (akte.length - 1)) * 100)}%` }}
          />
        </div>
        <button
          type="button"
          onClick={ueberspringen}
          className="shrink-0 py-2 text-xs text-slate-500 transition hover:text-white"
        >
          Überspringen
        </button>
      </div>

      <div className="min-h-0 flex-1 pt-2">
        {akt === "chat" && (
          <ChatFaden
            schritte={
              sozialbeweis
                ? [
                    ...introChat(vorname, greeting).slice(0, 1),
                    {
                      art: "blase",
                      text: `${sozialbeweis.name} ist vor ${sozialbeweis.tage} ${
                        sozialbeweis.tage === 1 ? "Tag" : "Tagen"
                      } gestartet — schon ${sozialbeweis.termine} Termine.`,
                    },
                    ...introChat(vorname, greeting).slice(1),
                  ]
                : introChat(vorname, greeting)
            }
            absender={einlader}
            onAntwort={chatAntwort}
            onDone={weiter}
          />
        )}
        {akt === "rechnung" && <Hochrechnung onDone={weiter} />}
        {akt === "einwand" && <EinwandTest track={track} onDone={weiter} />}
        {akt === "brief" && <BriefAkt onDone={weiter} />}
        {akt === "sprint" && (
          <NamenSprint
            track={track}
            onDone={(anzahl) => {
              setSprintAnzahl(anzahl);
              weiter();
            }}
          />
        )}
        {akt === "einstufung" && <Einstufung onDone={weiter} />}
        {akt === "foto" && <FotoAkt onDone={weiter} />}
        {akt === "rangliste" && <RanglisteMoment onDone={weiter} />}
        {akt === "ankunft" && (
          <Ankunft
            track={track}
            sprintAnzahl={sprintAnzahl > 0 ? sprintAnzahl : namenVorhanden}
          />
        )}

        {/* Der kurze Weg fuer Fuehrungskraefte. */}
        {akt === "chatLeader" && (
          <ChatFaden schritte={leaderChat(vorname)} absender="Ergo CRM" onDone={weiter} />
        )}
        {akt === "fuehrung" && <FuehrungsKarten onDone={weiter} />}
        {akt === "einladen" && <EinladenAkt onDone={weiter} />}
        {akt === "ankunftLeader" && (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">
              ✓
            </span>
            <div>
              <h2 className="text-3xl font-bold text-white">Deine Zentrale steht.</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-300">
                Jeder, der deinen Link öffnet, wird von dir persönlich begrüßt,
                baut im Start seine Namensliste — und taucht danach in deiner
                Mannschaft auf.
              </p>
            </div>
            <button
              type="button"
              onClick={ueberspringen}
              className="min-h-14 w-full rounded-xl bg-gold-400 text-lg font-bold text-navy-950 transition hover:bg-gold-100 active:scale-[0.98]"
            >
              Zur Mannschaft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
