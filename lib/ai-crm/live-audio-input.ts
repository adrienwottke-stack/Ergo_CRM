/** WebAudio analysis only. The microphone graph is never connected to speakers/music. */
export function monitorAudio(stream: MediaStream, onActivity: (active: boolean) => void): { close(): void; resume(): Promise<void>; state(): string } {
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  let lastActive = 0;
  let previous = false;
  const check = () => {
    if (closed) return;
    analyser.getFloatTimeDomainData(samples);
    let square = 0;
    for (const sample of samples) square += sample * sample;
    if (Math.sqrt(square / samples.length) > 0.018) lastActive = Date.now();
    const active = Date.now() - lastActive < 180;
    if (active !== previous) { previous = active; onActivity(active); }
    timer = setTimeout(check, 70);
  };
  check();
  return {
    state: () => context.state,
    resume: () => context.resume(),
    close() { if (closed) return; closed = true; if (timer) clearTimeout(timer); source.disconnect(); analyser.disconnect(); void context.close().catch(() => undefined); onActivity(false); },
  };
}

export type LiveTranscriptDelta = { content: string; eventId: string; startMs: number; endMs: number };
export function inputTranscriptDelta(value: unknown): LiveTranscriptDelta | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (item.type !== "session.input_transcript.delta" || typeof item.content !== "string" || typeof item.event_id !== "string") return null;
  if (typeof item.start_ms !== "number" || typeof item.end_ms !== "number" || item.start_ms < 0 || item.end_ms < item.start_ms) return null;
  return { content: item.content, eventId: item.event_id, startMs: item.start_ms, endMs: item.end_ms };
}

/** Deduplicates retries; finalization is driven by audio activity, never text gaps alone. */
export class LiveUtteranceBuffer {
  private events = new Set<string>();
  private text = "";
  private observedSpeech = false;
  private lastAudioAt = 0;
  private lastDeltaAt = 0;
  private maximumEndMs = -1;
  private finalizedBeforeMs = -1;
  append(delta: LiveTranscriptDelta, now = Date.now()): "added" | "duplicate" | "late" {
    if (this.events.has(delta.eventId)) return "duplicate";
    this.events.add(delta.eventId); if (this.events.size > 1000) this.events.delete(this.events.values().next().value!);
    // Timeline timestamps survive network lag. A fragment belonging before the
    // last completed audio boundary must never prefix a newly selected person.
    if (delta.startMs <= this.finalizedBeforeMs) return "late";
    this.maximumEndMs = Math.max(this.maximumEndMs, delta.endMs);
    this.lastDeltaAt = now; this.text += delta.content; return "added";
  }
  activity(now: number) { this.observedSpeech = true; this.lastAudioAt = now; }
  ready(now: number, pauseMs = 1400) { return this.observedSpeech && this.text.trim().length > 0 && now - this.lastAudioAt >= pauseMs && now - this.lastDeltaAt >= 500; }
  take() { const result = this.text.trim(); this.finalizedBeforeMs = Math.max(this.finalizedBeforeMs, this.maximumEndMs + 1000); this.text = ""; this.observedSpeech = false; return result; }
  clear() { if (this.maximumEndMs >= 0) this.finalizedBeforeMs = Math.max(this.finalizedBeforeMs, this.maximumEndMs + 1000); this.text = ""; this.observedSpeech = false; }
  resetTimeline() { this.events.clear(); this.text = ""; this.observedSpeech = false; this.lastAudioAt = 0; this.lastDeltaAt = 0; this.maximumEndMs = -1; this.finalizedBeforeMs = -1; }
  preview() { return this.text.trim(); }
}

export function sessionTiming(now: number, lastActivity: number, expiresAt: number, idleSeconds: number, warningSeconds: number, processing = false) {
  const remaining = Math.max(0, (Math.min(expiresAt, (processing ? now : lastActivity) + idleSeconds * 1000) - now) / 1000);
  return { remaining: Math.ceil(remaining), warn: remaining > 0 && remaining <= warningSeconds, expired: remaining <= 0 };
}

/** An offer is sent only after local candidates are gathered; failure stays visible. */
export function waitForIceGathering(peer: RTCPeerConnection, signal: AbortSignal, timeoutMs = 10_000): Promise<void> {
  if (peer.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); peer.removeEventListener("icegatheringstatechange", check); signal.removeEventListener("abort", abort); };
    const check = () => { if (peer.iceGatheringState === "complete") { cleanup(); resolve(); } };
    const abort = () => { cleanup(); reject(new DOMException("Verbindungsstart abgebrochen.", "AbortError")); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("Der Browser konnte die Audioverbindung nicht vorbereiten. Netzwerk und Firewall prüfen.")); }, timeoutMs);
    peer.addEventListener("icegatheringstatechange", check); signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort(); else check();
  });
}
