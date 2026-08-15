"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordCallResult } from "@/app/(app)/contacts/results";
import { ratingHints, ratingLabels, ratingPalette } from "@/lib/namelist";
import { countPlaceholders } from "@/lib/guides";
import GuideBody from "@/components/GuideBody";
import {
  AppointmentDialog,
  ChoiceDialog,
  LATER_CHIPS,
  LOST_CHIPS,
} from "@/components/ResultDialogs";
import { undoMoeglich } from "@/components/UndoBar";
import { ClipboardIcon, PhoneIcon } from "@/components/icons";
import { btnPrimary, btnSecondary, card } from "@/components/ui";
import type { ContactRating, ListKind } from "@/lib/generated/prisma/enums";

export type DialerEntry = {
  id: string;
  name: string;
  phone: string;
  rating: ContactRating | null;
  note: string | null;
  isFirstCall: boolean;
  lastActivity: string | null;
};

type Result = "appointment" | "unreachable" | "later" | "lost";

type Tally = Record<Result | "skipped", number>;

const EMPTY_TALLY: Tally = {
  appointment: 0,
  unreachable: 0,
  later: 0,
  lost: 0,
  skipped: 0,
};

const bigButton =
  "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50";

export default function NameDialer({
  queue,
  kind,
  guideTitle,
  guideBody,
  guideIsDraft,
}: {
  queue: DialerEntry[];
  kind: ListKind;
  guideTitle: string;
  guideBody: string;
  guideIsDraft: boolean;
}) {
  // Eingefroren: nach jedem Ergebnis laedt der Server die Liste neu, der
  // erledigte Name faellt heraus – ohne diese Kopie wuerde der Durchlauf
  // unter dem Finger verrutschen.
  const [items] = useState(queue);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState<Tally>(EMPTY_TALLY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialog, setDialog] = useState<null | "appointment" | "later" | "lost">(null);

  // Rueckkehr nach dem Telefonat: wer auf "Anrufen" tippt, verlaesst den
  // Browser. Kommt er zurueck, soll die Ergebnisfrage sofort da stehen –
  // ohne Suchen, wo man war.
  const [returned, setReturned] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && calledRef.current) {
        setReturned(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const current = items[index];

  const advance = useCallback((result: keyof Tally) => {
    setTally((prev) => ({ ...prev, [result]: prev[result] + 1 }));
    calledRef.current = false;
    setReturned(false);
    setNote("");
    setShowNote(false);
    setCopied(false);
    setDialog(null);
    setIndex((prev) => prev + 1);
  }, []);

  const submit = async (result: Result, extra?: Record<string, string>) => {
    if (!current) return;
    setPending(true);
    setError(null);
    try {
      const data = new FormData();
      data.set("contactId", current.id);
      data.set("result", result);
      if (note.trim()) data.set("note", note.trim());
      Object.entries(extra ?? {}).forEach(([key, value]) => data.set(key, value));
      await recordCallResult(data);
      undoMoeglich();
      advance(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Das hat nicht geklappt.");
    } finally {
      setPending(false);
    }
  };

  const copyPhone = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopieren hat nicht geklappt – Nummer bitte abtippen.");
    }
  };

  // --- Ende des Durchlaufs --------------------------------------------------

  if (!current) {
    const done = tally.appointment + tally.unreachable + tally.later + tally.lost;
    return (
      <div className={`${card} space-y-5 p-8 text-center`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          {tally.appointment > 0 ? "🎉" : "✅"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {done === 0 ? "Nichts zu tun" : "Durchlauf geschafft!"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {done === 0
              ? "In dieser Auswahl steht gerade kein Name mit Nummer."
              : `${done} ${done === 1 ? "Gespräch" : "Gespräche"} geführt.`}
          </p>
        </div>

        {done > 0 && (
          <dl className="grid grid-cols-2 gap-2 text-left sm:grid-cols-4">
            <Stat label="Termine" value={tally.appointment} tone="emerald" />
            <Stat label="Nicht erreicht" value={tally.unreachable} tone="slate" />
            <Stat label="Später" value={tally.later} tone="amber" />
            <Stat label="Kein Interesse" value={tally.lost} tone="slate" />
          </dl>
        )}

        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Link href={`/namen?liste=${kind}`} className={btnPrimary}>
            Zurück zur Liste
          </Link>
          <Link href="/leaderboard" className={btnSecondary}>
            Rangliste ansehen 🏆
          </Link>
        </div>
      </div>
    );
  }

  // --- Eine Karte je Name ---------------------------------------------------

  const palette = current.rating ? ratingPalette[current.rating] : null;
  const percent = Math.round((index / items.length) * 100);
  const placeholders = countPlaceholders(guideBody);

  return (
    <div className="space-y-4">
      <div className={`${card} space-y-2 p-4`}>
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>
            Name {index + 1} von {items.length}
          </span>
          <span>{percent} %</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-navy-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className={`${card} space-y-5 p-5 sm:p-6`}>
        <div className="flex items-start gap-3">
          {palette && (
            <span
              title={ratingHints[current.rating!]}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold ${palette.chip}`}
            >
              {current.rating}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-tight text-slate-900">
              {current.name}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {current.rating ? ratingLabels[current.rating] : "Nicht eingestuft"}
              {current.isFirstCall ? " · Erstanruf" : " · schon einmal versucht"}
            </p>
          </div>
        </div>

        {/* Die Nummer gross und ruhig – am Rechner wird sie abgetippt oder
            kopiert, am Handy angetippt. */}
        <a
          href={`tel:${current.phone.replace(/\s/g, "")}`}
          onClick={() => {
            calledRef.current = true;
          }}
          className="flex min-h-16 items-center justify-center gap-3 rounded-xl bg-emerald-600 text-xl font-bold tracking-wide text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
        >
          <PhoneIcon className="h-6 w-6" />
          {current.phone}
        </a>

        <button
          type="button"
          onClick={copyPhone}
          className={`${btnSecondary} w-full`}
        >
          <ClipboardIcon className="h-4 w-4" />
          {copied ? "Kopiert ✓" : "Nummer kopieren"}
        </button>

        {(current.note || current.lastActivity) && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3">
            {current.note && (
              <p className="whitespace-pre-wrap text-sm text-amber-900">
                {current.note}
              </p>
            )}
            {current.lastActivity && (
              <p className="mt-1 text-xs text-amber-800/80">
                Zuletzt: {current.lastActivity}
              </p>
            )}
          </div>
        )}

        {/* Einmal aufgeklappt bleibt der Leitfaden offen – wer ihn braucht,
            braucht ihn bei allen Namen. */}
        <div className="rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setShowGuide((value) => !value)}
            className="flex min-h-12 w-full items-center justify-between px-3.5 text-left"
          >
            <span className="text-sm font-semibold text-slate-700">
              {showGuide ? "▾" : "▸"} {guideTitle}
            </span>
            {guideIsDraft && !showGuide && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                Gerüst
              </span>
            )}
          </button>
          {showGuide && (
            <div className="border-t border-slate-100 px-3.5 py-3">
              <GuideBody body={guideBody} />
              {guideIsDraft && placeholders > 0 && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Nur ein Gerüst: die {placeholders} Stellen in [eckigen
                  Klammern] gehören durch deinen eigenen Wortlaut ersetzt –
                  auf der Namensliste unter „Leitfaden bearbeiten“.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ergebnis. Nach der Rueckkehr vom Telefonat hervorgehoben. */}
      <div
        className={`${card} space-y-3 p-4 transition ${
          returned ? "ring-2 ring-navy-500 ring-offset-2" : ""
        }`}
      >
        <p className="text-sm font-semibold text-slate-900">
          {returned ? `Wie lief's mit ${current.name}?` : "Ergebnis"}
        </p>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => setDialog("appointment")}
            className={`${bigButton} bg-emerald-600 text-white hover:bg-emerald-700`}
          >
            <span className="text-lg">✅</span> Termin!
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("unreachable")}
            className={`${bigButton} bg-slate-100 text-slate-700 hover:bg-slate-200`}
          >
            <span className="text-lg">📵</span> Nicht erreicht
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setDialog("later")}
            className={`${bigButton} bg-amber-100 text-amber-900 hover:bg-amber-200`}
          >
            <span className="text-lg">⏳</span> Später
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setDialog("lost")}
            className={`${bigButton} border border-slate-300 bg-white text-slate-600 hover:bg-slate-50`}
          >
            <span className="text-lg">✕</span> Kein Interesse
          </button>
        </div>

        {showNote ? (
          <textarea
            rows={2}
            autoFocus
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Was war noch wichtig?"
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-navy-500 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            + Notiz
          </button>
        )}

        <button
          type="button"
          onClick={() => advance("skipped")}
          className="min-h-11 w-full text-sm font-medium text-slate-400 transition hover:text-slate-700"
        >
          Überspringen →
        </button>
      </div>

      <AppointmentDialog
        open={dialog === "appointment"}
        name={current.name}
        pending={pending}
        onClose={() => setDialog(null)}
        onSave={(when) => submit("appointment", { appointmentAt: when })}
      />

      <ChoiceDialog
        open={dialog === "later"}
        title="Wann nochmal?"
        subtitle={current.name}
        pending={pending}
        choices={LATER_CHIPS.map((chip) => ({
          label: chip.label,
          onPick: () => submit("later", { days: chip.days }),
        }))}
        onClose={() => setDialog(null)}
      />

      <ChoiceDialog
        open={dialog === "lost"}
        title="Woran lag's?"
        subtitle={current.name}
        pending={pending}
        choices={LOST_CHIPS.map((chip) => ({
          label: chip.label,
          onPick: () => submit("lost", { lostReason: chip.reason }),
        }))}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

// --- Bausteine --------------------------------------------------------------

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "slate";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    slate: "bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl px-3 py-2.5 ${tones[tone]}`}>
      <dd className="text-xl font-bold tabular-nums">{value}</dd>
      <dt className="text-[11px] font-medium opacity-80">{label}</dt>
    </div>
  );
}
