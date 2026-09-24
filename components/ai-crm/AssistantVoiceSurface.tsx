"use client";

import { useEffect, useRef, type ReactNode } from "react";
import AssistantIcon from "./AssistantIcon";

/** Presentation only: the mounted live controller continues to own media and requests. */
export default function AssistantVoiceSurface({ active, status, muted, canMute, onMute, onInterrupt, onEnd, composer, options, notices, simulation = false }: {
  active: boolean;
  status: string;
  muted: boolean;
  canMute: boolean;
  onMute: () => void;
  onInterrupt: () => void;
  onEnd: () => void;
  composer: ReactNode;
  options: ReactNode;
  notices?: ReactNode;
  simulation?: boolean;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const surface = useRef<HTMLElement>(null);
  const previousActive = useRef(active);
  useEffect(() => {
    if (active !== previousActive.current) {
      if (active) surface.current?.querySelector<HTMLButtonElement>(".assistant-voice-controls button:not(:disabled)")?.focus();
      else {
        if (details.current) details.current.open = false;
        surface.current?.querySelector<HTMLTextAreaElement>("#assistant-message")?.focus({ preventScroll: true });
      }
    }
    previousActive.current = active;
  }, [active]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (details.current?.open && !details.current.contains(event.target as Node)) details.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !details.current?.open) return;
      event.preventDefault(); event.stopPropagation();
      details.current.open = false; details.current.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape, true); };
  }, []);
  return <section ref={surface} className="assistant-voice-surface" aria-label="Chat und Sprache">
    <div hidden={active}>{composer}</div>
    {active && <div className="assistant-voice-bar" aria-label="Jarvis Sprache">
      <div className="assistant-voice-status" role="status"><AssistantIcon name="voice" /><span><span>{status}</span>{simulation && <small>Lokale Simulation · kein Audiostream</small>}</span></div>
      <div className="assistant-voice-controls">
        <button type="button" className="assistant-icon-button" disabled={!canMute} onClick={onMute} aria-label={muted ? "Mikrofon einschalten" : "Stumm"} title={muted ? "Mikrofon einschalten" : "Stumm"} aria-pressed={muted}><AssistantIcon name={muted ? "muted" : "mic"} /></button>
        <button type="button" className="assistant-icon-button" onClick={onInterrupt} aria-label="Sprachausgabe unterbrechen" title="Sprachausgabe unterbrechen"><AssistantIcon name="stop" /></button>
        <details ref={details} className="assistant-voice-options" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); event.preventDefault(); if (details.current) { details.current.open = false; details.current.querySelector("summary")?.focus(); } } }}>
          <summary aria-label="Sprachoptionen" title="Sprachoptionen"><AssistantIcon name="more" /></summary>
          <div className="assistant-voice-popover"><h3>Sprachoptionen</h3>{options}</div>
        </details>
        <button type="button" className="assistant-icon-button assistant-voice-end" onClick={onEnd} aria-label="Sitzung beenden" title="Sitzung beenden"><AssistantIcon name="close" /></button>
      </div>
    </div>}
    <div className="assistant-voice-notices">{notices}</div>
  </section>;
}
