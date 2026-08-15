// Zeigt einen Gespraechsleitfaden an: Abschnitte, woertliche Rede, Hinweise,
// Checkliste. Wird vom Durchlauf und vom Leitfaden-Panel gemeinsam benutzt.

import { parseGuide } from "@/lib/guides";

export default function GuideBody({ body }: { body: string }) {
  const blocks = parseGuide(body);

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "heading":
            return (
              <h4
                key={index}
                className="border-b border-slate-100 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-navy-700 first:pt-0"
              >
                {block.text}
              </h4>
            );

          case "subheading":
            return (
              <h5
                key={index}
                className="pt-2 text-[13px] font-semibold text-slate-800"
              >
                {block.text}
              </h5>
            );

          case "quote":
            // Das, was tatsaechlich gesagt wird, muss beim Ueberfliegen
            // sofort ins Auge springen – im Gespraech bleibt keine Zeit zum
            // Suchen.
            return (
              <p
                key={index}
                className="rounded-lg border-l-[3px] border-navy-400 bg-navy-50/60 px-3 py-2 text-[15px] font-medium leading-snug text-navy-900"
              >
                {block.text}
              </p>
            );

          case "bullet":
            return (
              <p
                key={index}
                className="flex gap-2 text-sm leading-relaxed text-slate-600"
              >
                <span aria-hidden className="text-slate-300">
                  •
                </span>
                <span>{block.text}</span>
              </p>
            );

          default:
            return (
              <p key={index} className="text-sm leading-relaxed text-slate-600">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
