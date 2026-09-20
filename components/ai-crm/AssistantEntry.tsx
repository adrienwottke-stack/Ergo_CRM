"use client";
import { useAssistant } from "@/components/ai-crm/AssistantProvider";
import type { AssistantContext } from "@/lib/ai-crm/contracts";
export function AssistantSymbol() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-3 3V11.5A7.5 7.5 0 0 1 9.5 4h3a7.5 7.5 0 0 1 7.5 7.5Z"/><path d="M7 10h8M7 14h5"/></svg>; }
export default function AssistantEntry() {
  const assistant = useAssistant();
  return <button type="button" className="assistant-global-entry" aria-expanded={assistant.visible} aria-controls="crm-assistant-surface" disabled={assistant.presenting} onClick={() => assistant.visible ? assistant.close() : assistant.open()}><AssistantSymbol /><span>Assistent</span></button>;
}
export function AssistantTodayEntry() {
  const assistant = useAssistant();
  if (assistant.presenting) return null;
  return <button type="button" className="assistant-today-entry" onClick={() => assistant.open({ prompt: "Was steht heute an?" })}><AssistantSymbol /><span><strong>Deinen Tag besprechen</strong><span>Fragen stellen oder eine Nachricht diktieren.</span></span><span aria-hidden>↗</span></button>;
}
export function AssistantContextEntry({ context, prompt, label = "Mit Assistent besprechen" }: { context?: AssistantContext; prompt?: string; label?: string }) {
  const assistant = useAssistant();
  if (assistant.presenting) return null;
  return <button type="button" className="assistant-context-entry" disabled={assistant.locked} onClick={() => assistant.open({ context, prompt })}><AssistantSymbol />{label}</button>;
}
