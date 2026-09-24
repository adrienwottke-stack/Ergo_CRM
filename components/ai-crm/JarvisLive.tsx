"use client";
import { useEffect, useState } from "react";
import type { ActionReceipt, AssistantContext, ConversationSummary, ReadResult } from "@/lib/ai-crm/contracts";
import JarvisLiveMock from "@/components/ai-crm/JarvisLiveMock";
import JarvisLivePilot from "@/components/ai-crm/JarvisLivePilot";

export type JarvisLiveActionReceipt = ActionReceipt;
export type JarvisLiveConversation = ConversationSummary & { restarted?: boolean; restartReason?: "expired" | "limit" | null };
export type JarvisLiveProps = {
  conversationId: string | null;
  context?: AssistantContext | null;
  disabled?: boolean;
  onActiveChange?: (active: boolean) => void;
  onConversationStarted: (conversation: JarvisLiveConversation) => void;
  onTurn: (turn: { requestId: string; transcript: string; answer: string; actions: ActionReceipt[]; results?: ReadResult[]; conversation: JarvisLiveConversation }) => void;
};
export type JarvisLiveSettings = {
  demoEnabled: boolean;
  greetingText: string;
  inactivitySeconds: number;
  warningSeconds: number;
  maxSessionSeconds: number;
  reconnectLimit: number;
};

/** One entry in the existing assistant; mock mode remains explicitly labelled. */
export default function JarvisLive(props: JarvisLiveProps) {
  const [mode, setMode] = useState<"live" | "simulation" | null>(null);
  const [settings, setSettings] = useState<JarvisLiveSettings | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/ai-crm/live/session", { signal: controller.signal, cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok || !["live", "simulation"].includes(data.mode)) throw new Error(data.error || "Die Sprachkonfiguration konnte nicht geladen werden.");
      setMode(data.mode);
      setSettings(data.config);
      setActiveSessionId(typeof data.activeSession?.id === "string" ? data.activeSession.id : null);
      setError("");
    }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Die Sprachkonfiguration konnte nicht geladen werden."); });
    return () => controller.abort();
  }, [attempt]);
  if (error) return <div className="jarvis-live-body"><p role="alert" className="jarvis-live-error">{error}</p><button onClick={() => setAttempt(value => value + 1)}>Konfiguration erneut prüfen</button></div>;
  if (!mode || !settings) return <p className="assistant-caption" role="status">Sprachzugang wird geprüft …</p>;
  return mode === "simulation" ? <JarvisLiveMock {...props} /> : <JarvisLivePilot {...props} settings={settings} initialActiveSessionId={activeSessionId} />;
}
