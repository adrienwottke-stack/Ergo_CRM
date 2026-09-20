"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MikrofonIcon } from "@/components/icons";
import { assistantFetch, useAssistant } from "@/components/ai-crm/AssistantProvider";

export default function AssistantComposer() {
  const assistant = useAssistant();
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const frame = useRef(0);
  const started = useRef(0);
  const version = useRef(0);
  const discard = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const release = useCallback(() => {
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    cancelAnimationFrame(frame.current); void audio.current?.close().catch(() => undefined); audio.current = null;
  }, []);
  const cancel = useCallback(() => {
    version.current++; discard.current = true; abort.current?.abort();
    if (recorder.current?.state === "recording") recorder.current.stop();
    recorder.current = null; release(); setRecording(false); setRequesting(false); setTranscribing(false); setLevel(0);
  }, [release]);
  useEffect(() => { cancel(); return cancel; }, [assistant.captureEpoch, cancel]);
  useEffect(() => {
    const hide = () => { if (document.visibilityState !== "visible") cancel(); };
    document.addEventListener("visibilitychange", hide); window.addEventListener("pagehide", cancel);
    return () => { document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", cancel); };
  }, [cancel]);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - started.current) / 1000); setSeconds(elapsed);
      if (elapsed >= 60 && recorder.current?.state === "recording") recorder.current.stop();
    }, 250);
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    const input = textarea.current;
    if (!input) return;
    input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
  }, [assistant.draft, recording, requesting, transcribing]);

  async function start() {
    if (assistant.locked || requesting || transcribing || recording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { assistant.setError("Dieser Browser unterstützt Diktieren nicht. Du kannst deine Nachricht schreiben."); return; }
    const current = ++version.current;
    setRequesting(true); assistant.setError(null); discard.current = false;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (current !== version.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const recording = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorder.current = recording;
      const chunks: BlobPart[] = [];
      recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recording.onerror = () => { cancel(); assistant.setError("Die Aufnahme wurde unterbrochen. Bitte versuche es erneut oder schreibe."); };
      recording.onstop = async () => {
        const duration = (Date.now() - started.current) / 1000;
        release(); setRecording(false);
        if (discard.current || current !== version.current) return;
        const blob = new Blob(chunks, { type: recording.mimeType || mimeType || "audio/webm" });
        if (!blob.size || duration < .2) { assistant.setError("Die Aufnahme war zu kurz. Bitte versuche es noch einmal."); return; }
        const form = new FormData();
        form.set("audio", new File([blob], blob.type.includes("mp4") ? "diktat.m4a" : "diktat.webm", { type: blob.type }));
        form.set("durationSeconds", String(duration)); form.set("clientRequestId", crypto.randomUUID());
        abort.current = new AbortController(); setTranscribing(true);
        try {
          const result = await assistantFetch<{ transcript: string }>("/api/ai-crm/transcribe", { method: "POST", body: form, signal: abort.current.signal });
          if (current !== version.current) return;
          assistant.setDraft(text => text ? `${text}\n${result.transcript}` : result.transcript); assistant.setSource("voice");
        } catch (reason) { if (current === version.current) assistant.setError(reason instanceof Error ? reason.message : "Die Aufnahme konnte nicht erkannt werden."); }
        finally { if (current === version.current) setTranscribing(false); }
      };
      media.getTracks().forEach(track => { track.onended = () => { cancel(); assistant.setError("Die Mikrofonverbindung wurde beendet. Bitte starte eine neue Aufnahme."); }; });
      try {
        audio.current = new AudioContext();
        const analyser = audio.current.createAnalyser(); analyser.fftSize = 256;
        audio.current.createMediaStreamSource(media).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        const measure = () => { analyser.getByteTimeDomainData(samples); setLevel(Math.min(1, Math.sqrt(samples.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / samples.length) * 4)); frame.current = requestAnimationFrame(measure); };
        measure();
      } catch { /* Recording is usable when the optional level meter is unavailable. */ }
      started.current = Date.now(); setSeconds(0); recording.start(); setRecording(true);
    } catch (reason) {
      release(); if (current === version.current) assistant.setError(reason instanceof DOMException && reason.name === "NotAllowedError" ? "Das Mikrofon ist nicht freigegeben. Du kannst die Freigabe im Browser ändern oder schreiben." : "Das Mikrofon konnte nicht geöffnet werden. Bitte versuche es erneut oder schreibe.");
    } finally { if (current === version.current) setRequesting(false); }
  }

  if (recording || requesting || transcribing) return <div className="assistant-composer assistant-recording">
    <p role="status">{recording ? "Aufnahme läuft" : transcribing ? "Deine Aufnahme wird in Text umgewandelt …" : "Mikrofon wird geöffnet …"}</p>
    {recording && <div className="assistant-meter-row"><span aria-label={`${seconds} Sekunden aufgenommen`}>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span><div className="assistant-meter" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(.02, level)})` }} /></div></div>}
    <div className="assistant-button-row"><button type="button" onClick={cancel}>{recording ? "Aufnahme verwerfen" : "Abbrechen"}</button>{recording && <button type="button" className="assistant-primary" onClick={() => recorder.current?.stop()}>Aufnahme beenden</button>}</div>
    {recording && <p className="assistant-caption">Danach kannst du den Text prüfen.</p>}
  </div>;

  return <form className="assistant-composer" onSubmit={event => { event.preventDefault(); void assistant.send(); }}>
    {assistant.source === "voice" && <p className="assistant-transcript-hint" role="status">Bitte prüfe den Text, besonders Namen und Termine.</p>}
    <label htmlFor="assistant-message" className="sr-only">Nachricht an den Assistenten</label>
    <textarea ref={textarea} id="assistant-message" placeholder="Nachricht an den Assistenten …" rows={1} maxLength={4000} value={assistant.draft} onChange={event => assistant.setDraft(event.target.value)}
      onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia("(min-width: 768px)").matches) { event.preventDefault(); void assistant.send(); } }} />
    <div className="assistant-button-row"><button type="button" disabled={assistant.locked || assistant.loading} onClick={() => void start()} aria-label="Nachricht diktieren"><MikrofonIcon className="h-5 w-5" />{assistant.source === "voice" ? "Weiter diktieren" : "Diktieren"}</button>
      {assistant.working ? <button type="button" onClick={() => void assistant.stop()} disabled={Boolean(assistant.actionBusy)}>Stoppen</button> : <button type="submit" className="assistant-primary" disabled={!assistant.draft.trim() || assistant.locked || assistant.loading}>Senden <span aria-hidden>↑</span></button>}
    </div>
  </form>;
}
