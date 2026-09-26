import type { LiveProgress } from "@/lib/ai-crm/live-progress";

type WorkPhase = "accepted" | "searching" | "preparing" | "composing";
export type SpokenProgress = WorkPhase | "slow" | "checkIn";

/** Speakable context, never invented results or a new CRM instruction. */
export function spokenProgress(phase: SpokenProgress, variation = 0): string {
  const lines: Record<SpokenProgress, readonly [string, string]> = {
    accepted: ["Alles klar, ich kümmere mich darum. Gib mir einen Moment.", "Klar, bin dran. Ich schaue mir deine Frage gerade an."],
    searching: ["Ich schaue gerade in die passenden CRM-Einträge. Gib mir kurz einen Moment.", "Ich prüfe gerade die Einträge, die zu deiner Frage passen."],
    preparing: ["Ich bereite dir gerade einen Vorschlag vor. Den kannst du gleich in Ruhe prüfen.", "Ich stelle dir gerade die Vorschau zusammen. Du entscheidest danach, was gespeichert wird."],
    composing: ["Die Abfrage ist zurück. Ich bringe die Antwort gerade für dich auf den Punkt.", "Ich sortiere gerade die Rückmeldung, damit du direkt etwas damit anfangen kannst."],
    slow: ["Ich bin noch dran, das braucht gerade etwas länger. Ich habe deine Frage weiter auf dem Schirm.", "Gib mir noch einen Moment, ich warte gerade noch auf die Rückmeldung."],
    checkIn: ["Ich bin weiter dran. Währenddessen: Wie läuft dein Tag bisher?", "Die Anfrage läuft noch. Wie geht’s dir heute eigentlich?"],
  };
  return lines[phase][Math.abs(variation) % 2];
}

/** Coalesce actual work phases; never queue a backlog of spoken status messages. */
export function startLiveBackchannel(options: {
  signal: AbortSignal;
  variation?: number;
  speak: (content: string, signal: AbortSignal) => Promise<void>;
  onSlow?: () => void;
  onFailure?: () => void;
}) {
  const controller = new AbortController();
  const signal = AbortSignal.any([options.signal, controller.signal]);
  const started = Date.now();
  let phase: WorkPhase = "accepted", lastPhase: SpokenProgress | null = null;
  let lastSpokenAt = started - 7000, count = 0, inFlight = false, slowEmitted = false, checkedIn = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => { if (timer) clearTimeout(timer); options.signal.removeEventListener("abort", stop); controller.abort(); };
  const tick = () => {
    if (signal.aborted) return;
    const elapsed = Date.now() - started;
    if (!slowEmitted && elapsed >= 8000) { slowEmitted = true; options.onSlow?.(); }
    if (!inFlight && count < 4 && Date.now() - lastSpokenAt >= 7000) {
      let next: SpokenProgress | null = phase !== lastPhase && lastPhase !== "slow" && lastPhase !== "checkIn" ? phase : null;
      // A changed work phase takes precedence; otherwise fill a long silence.
      if (elapsed >= 18000 && !checkedIn) { next = "checkIn"; checkedIn = true; }
      else if (!next && elapsed >= 8000) next = "slow";
      if (next) {
        lastPhase = next; lastSpokenAt = Date.now(); count++; inFlight = true;
        void options.speak(spokenProgress(next, options.variation), signal).catch(() => { if (!signal.aborted) options.onFailure?.(); }).finally(() => { inFlight = false; });
      }
    }
    timer = setTimeout(tick, 1000);
  };
  if (options.signal.aborted) stop();
  else { options.signal.addEventListener("abort", stop, { once: true }); timer = setTimeout(tick, 1200); }
  return {
    advance(next: LiveProgress) {
      if (["accepted", "searching", "preparing", "composing"].includes(next)) {
        phase = next as WorkPhase;
        // Remember only the newest phase even when a previous line is in flight.
        if (lastPhase === "slow" || lastPhase === "checkIn") lastPhase = null;
      }
    },
    stop,
  };
}
