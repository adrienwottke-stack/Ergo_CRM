"use client";

import { useState, useTransition } from "react";
import { resetGuide, saveGuide } from "@/app/(app)/namen/actions";
import { countPlaceholders } from "@/lib/guides";
import GuideBody from "@/components/GuideBody";
import { btnPrimary, btnSecondary, card } from "@/components/ui";
import { ChevronDownIcon, ChevronRightIcon } from "@/components/icons";

export default function GuidePanel({
  guideKey,
  title,
  body,
  isCustom,
  isDraft,
}: {
  guideKey: string;
  title: string;
  body: string;
  isCustom: boolean;
  isDraft: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const placeholders = countPlaceholders(body);

  const save = () => {
    setError(null);
    const data = new FormData();
    data.set("key", guideKey);
    data.set("title", title);
    data.set("body", draft);
    startTransition(async () => {
      try {
        await saveGuide(data);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Speichern hat nicht geklappt.");
      }
    });
  };

  const reset = () => {
    setError(null);
    const data = new FormData();
    data.set("key", guideKey);
    startTransition(async () => {
      try {
        await resetGuide(data);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Das hat nicht geklappt.");
      }
    });
  };

  return (
    <div className={`${card} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left"
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          {open ? (
            <ChevronDownIcon className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-slate-400" />
          )}
          {title}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {isDraft && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              Gerüst
            </span>
          )}
          {isCustom && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              angepasst
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {editing ? (
            <>
              <p className="text-xs text-slate-500">
                Eine Zeile je Gedanke. <code className="text-slate-700"># Text</code>{" "}
                wird zur Überschrift, <code className="text-slate-700">&gt; Text</code>{" "}
                zu dem, was du wörtlich sagst.
              </p>
              <textarea
                rows={18}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 font-mono text-[13px] leading-relaxed focus:border-navy-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className={btnPrimary}
                >
                  {pending ? "Speichert…" : "Speichern"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(body);
                    setEditing(false);
                  }}
                  className={btnSecondary}
                >
                  Abbrechen
                </button>
                {isCustom && (
                  <button
                    type="button"
                    onClick={reset}
                    disabled={pending}
                    className="min-h-11 px-2 text-sm font-medium text-slate-500 hover:text-red-700"
                  >
                    Auf Standard zurücksetzen
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {isDraft && placeholders > 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                  Das ist nur ein Gerüst: die Struktur steht, der Wortlaut
                  fehlt. Trag in die {placeholders} Stellen in [eckigen
                  Klammern] deine eigenen Sätze ein – ein ausgedachter
                  Leitfaden hilft niemandem.
                </p>
              )}
              <GuideBody body={body} />
              <button
                type="button"
                onClick={() => {
                  setDraft(body);
                  setEditing(true);
                }}
                className={btnSecondary}
              >
                Leitfaden bearbeiten
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
