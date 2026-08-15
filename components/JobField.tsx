"use client";

import { useState } from "react";
import { JOB_BLOCKS, isJobBlock } from "@/lib/jobs";
import { input, label } from "@/components/ui";

/**
 * Beruf-Feld mit Baustein-Leiste.
 *
 * Ein Tipp setzt den Beruf, ein zweiter Tipp auf denselben Baustein nimmt ihn
 * wieder zurueck. Danach kann im Feld weitergeschrieben werden ("Student, BWL"),
 * ohne dass die Bausteine dazwischenfunken.
 */
export default function JobField({ defaultValue }: { defaultValue?: string | null }) {
  const [job, setJob] = useState(defaultValue ?? "");

  return (
    <div>
      <label htmlFor="job" className={label}>
        Beruf
      </label>
      <input
        id="job"
        name="job"
        type="text"
        value={job}
        onChange={(event) => setJob(event.target.value)}
        placeholder="z. B. Student, Pflegefachkraft, Elektriker"
        className={input}
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-slate-500">Bausteine:</span>
        {JOB_BLOCKS.map((block) => {
          const active = isJobBlock(job, block);
          return (
            <button
              key={block}
              type="button"
              aria-pressed={active}
              onClick={() => setJob(active ? "" : block)}
              className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium transition ${
                active
                  ? "bg-navy-800 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-navy-50 hover:text-navy-700"
              }`}
            >
              {block}
            </button>
          );
        })}
      </div>
    </div>
  );
}
