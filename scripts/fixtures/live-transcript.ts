import type { InputTranscriptDeltaEvent } from "openai/resources/live/live";

// Keep API fixtures checked against the installed SDK, not the local parser.
export function liveTranscriptEvent(delta: string, eventId = "fixture-transcript", startMs = 0, endMs = 100): InputTranscriptDeltaEvent {
  return { type: "session.input_transcript.delta", delta, event_id: eventId, start_ms: startMs, end_ms: endMs };
}
