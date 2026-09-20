"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAssistant } from "@/components/ai-crm/AssistantProvider";
import type { ActionReceipt, Entry } from "@/lib/ai-crm/contracts";

function Receipt({ action, now }: { action: ActionReceipt; now: number }) {
  const assistant = useAssistant();
  const remaining = action.undoExpiresAt ? Math.max(0, Math.ceil((Date.parse(action.undoExpiresAt) - now) / 1000)) : 0;
  const undone = action.undoStatus === "UNDONE";
  const pending = action.status === "PENDING";
  const success = !action.status || action.status === "COMPLETED";
  const label = undone ? "Rückgängig gemacht" : pending ? "Bitte prüfen · noch nicht gespeichert" : success ? "Gespeichert" : action.status === "FAILED" ? "Nicht gespeichert" : action.status === "CANCELED" ? "Abgebrochen · nicht gespeichert" : action.status === "EXPIRED" ? "Vorschau abgelaufen" : "Wird gespeichert …";
  const error = assistant.actionErrors[action.id ?? action.undoEntryId ?? ""];
  return <article className={`assistant-receipt ${success && !undone ? "assistant-receipt-success" : ""}`} aria-label={`${label}: ${action.summary}`}>
    <p className="assistant-receipt-state" role="status"><span aria-hidden>{success && !undone ? "✓" : pending ? "○" : "—"}</span> <span>{label}</span></p>
    <p className="assistant-receipt-title">{action.summary}</p>
    {action.contactName && <p>{action.contactName}</p>}
    {action.details?.map((detail, index) => <p className="assistant-caption" key={index}>{detail}</p>)}
    {action.changes?.map(change => <div className="assistant-change" key={change.label}><strong>{change.label}</strong><p>Bisher: {change.before}</p><p>Neu: {change.after}</p></div>)}
    {action.error && <p role="alert" className="assistant-error">{action.error}</p>}
    <div className="assistant-button-row">
      {action.link && !undone && <Link href={action.link}>Kontakt öffnen <span aria-hidden>↗</span></Link>}
      {success && action.undoable && remaining > 0 && !undone && <button disabled={Boolean(assistant.actionBusy)} onClick={() => void assistant.undo(action)}>{assistant.actionBusy === action.undoEntryId ? "Wird zurückgenommen …" : `Rückgängig · ${remaining} s`}</button>}
    </div>
    {success && action.undoEntryId && !undone && (!remaining || action.undoStatus === "CONFLICT") && <p className="assistant-caption">{action.undoStatus === "CONFLICT" ? "Der Eintrag wurde inzwischen verändert. Eine sichere Rücknahme ist nicht mehr möglich." : "Die kurze Rücknahmefrist ist vorbei. Du kannst den Eintrag im Kontakt bearbeiten."}</p>}
    {error && <p role="alert" className="assistant-error">{error}</p>}
  </article>;
}

function MessageActions({ entry, now }: { entry: Entry; now: number }) {
  const assistant = useAssistant();
  const pending = entry.actions?.filter(action => action.status === "PENDING") ?? [];
  const requestId = entry.requestId ?? entry.actions?.[0]?.requestId;
  const busy = assistant.actionBusy === requestId;
  return <div className="assistant-actions">
    {entry.actions?.map((action, index) => <Receipt key={action.id ?? `${action.entityId}-${index}`} action={action} now={now} />)}
    {pending.length > 0 && requestId && <div className="assistant-confirmation" aria-label="Änderungen bestätigen">
      <p>{pending.length > 1 ? `${pending.length} Änderungen prüfen und gemeinsam bestätigen.` : "Speichern erst nach deiner Bestätigung."}</p>
      <div className="assistant-button-row"><button className="assistant-primary" disabled={Boolean(assistant.actionBusy) || assistant.working} onClick={() => void assistant.changePlan(requestId, "confirm", pending.map(action => action.id!))}>{busy ? "Wird gespeichert …" : pending.length === 1 ? pending[0].confirmLabel ?? "Änderung speichern" : `${pending.length} Änderungen speichern`}</button>
      <button disabled={Boolean(assistant.actionBusy) || assistant.working} onClick={() => void assistant.changePlan(requestId, "cancel")}>Abbrechen</button></div>
    </div>}
    {requestId && assistant.actionErrors[requestId] && <div className="assistant-recovery" role="alert"><p>{assistant.actionErrors[requestId]}</p><button onClick={() => void assistant.refreshActions(requestId)}>Ergebnis prüfen</button></div>}
  </div>;
}

export default function AssistantTimeline() {
  const assistant = useAssistant();
  const container = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [newResponse, setNewResponse] = useState(false);
  const [now, setNow] = useState(Date.now());
  const previousLast = useRef<string | undefined>(undefined);
  const previousConversation = useRef(assistant.conversationId);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const element = container.current;
    if (element) element.scrollTop = assistant.scrollTop < 0 ? element.scrollHeight : assistant.scrollTop;
    // Only restore on mount; updates must respect somebody reading earlier text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const element = container.current;
    const last = assistant.entries.at(-1)?.id;
    if (element && (!assistant.entries.length || previousConversation.current !== assistant.conversationId)) {
      element.scrollTop = assistant.entries.length ? element.scrollHeight : 0;
      following.current = true; setNewResponse(false); previousLast.current = last; previousConversation.current = assistant.conversationId;
      return;
    }
    if (element && previousLast.current !== last) {
      if (following.current) { element.scrollTop = element.scrollHeight; setNewResponse(false); }
      else setNewResponse(true);
      previousLast.current = last;
    }
  }, [assistant.entries, assistant.conversationId]);
  return <div className="assistant-timeline-wrap">
    <div className="assistant-timeline" ref={container} onScroll={event => { const element = event.currentTarget; following.current = element.scrollHeight - element.scrollTop - element.clientHeight < 70; assistant.setScrollTop(element.scrollTop); if (following.current) setNewResponse(false); }}>
      {assistant.notice && <p className="assistant-notice" role="status">{assistant.notice}</p>}
      {!assistant.entries.length && !assistant.loading && <div className="assistant-empty"><span className="assistant-empty-symbol" aria-hidden>↳</span><h2>Was möchtest du heute erledigen?</h2><p>Frag nach deinen Kontakten, plane einen nächsten Schritt oder halte ein Gespräch fest.</p><div className="assistant-starters">{["Was steht heute an?", "Hilf mir, einen Kontakt zu finden.", "Ich möchte ein Gespräch dokumentieren."].map(text => <button key={text} onClick={() => assistant.setDraft(text)}>{text}<span aria-hidden>↗</span></button>)}</div><p className="assistant-caption">Gespräche bleiben sieben Tage ab Beginn verfügbar.</p><button className="assistant-quiet-link" onClick={() => assistant.setSection("details")}>Mehr erfahren</button></div>}
      {assistant.loading && <p role="status">Unterhaltung wird geladen …</p>}
      <ol className="assistant-messages" aria-label="Gesprächsverlauf">{assistant.entries.map(entry => <li className={`assistant-message assistant-message-${entry.role}`} key={entry.id}>
        {entry.source === "voice" && <p className="assistant-caption">Diktiert und gesendet</p>}
        {entry.source === "live" && <p className="assistant-caption">Live-Transkript · lokale Demo</p>}
        <p className="assistant-message-text">{entry.content}</p>
        {entry.role === "user" && entry.delivery && <span className="assistant-delivery">{entry.delivery === "sending" ? "Wird gesendet …" : entry.delivery === "unknown" ? "Abschluss noch unklar" : "Gesendet"}</span>}
        {entry.results?.map(result => <section className="assistant-read-result" key={result.id} aria-label="Aus deinen CRM-Daten"><p className="assistant-caption">Aus deinen CRM-Daten · {new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(result.readAt))}</p><p>{result.summary}</p>{result.items.slice(0, 5).map(item => <div key={item.id} className="assistant-result-row"><strong>{item.title}</strong>{item.detail && <p className="assistant-caption">{item.detail}</p>}<div className="assistant-button-row">{item.link && <Link href={item.link}>Kontakt öffnen ↗</Link>}{item.context && <button disabled={assistant.locked} onClick={() => { assistant.setAttachment(item.context!); assistant.setDraft(result.ambiguous ? "Diesen Kontakt meine ich." : ""); }}>{result.ambiguous ? "Diesen Kontakt wählen" : "Als Bezug verwenden"}</button>}</div></div>)}{result.items.length > 5 && <details><summary>Weitere {result.items.length - 5} Ergebnisse</summary>{result.items.slice(5).map(item => <div key={item.id} className="assistant-result-row"><strong>{item.title}</strong><p>{item.detail}</p>{item.link && <Link href={item.link}>Kontakt öffnen ↗</Link>}{item.context && <button onClick={() => assistant.setAttachment(item.context!)}>Als Bezug verwenden</button>}</div>)}</details>}</section>)}
        {!!entry.actions?.length && <MessageActions entry={entry} now={now} />}
      </li>)}</ol>
      {assistant.working && <p className="assistant-working" role="status">Deine Anfrage wird bearbeitet …</p>}
      <div className="sr-only" aria-live="polite">{!assistant.working && assistant.entries.at(-1)?.role === "assistant" ? assistant.entries.at(-1)?.content : ""}</div>
      {assistant.active?.messageCount === 18 && <p className="assistant-notice">Nach der nächsten Antwort ist dieses Gespräch voll. Danach geht es in einer neuen Unterhaltung weiter.</p>}
      {assistant.active && assistant.active.messageCount >= 20 && <p className="assistant-notice">Diese Unterhaltung hat 20 Nachrichten erreicht. Deine nächste Nachricht beginnt ein neues Gespräch.</p>}
      {assistant.recovery && <div className="assistant-recovery" role="alert"><strong>Abschluss prüfen</strong><p>Ich konnte den Abschluss nicht abrufen. Eine Änderung könnte bereits gespeichert sein.</p>{assistant.recovery.error && <p className="assistant-caption">{assistant.recovery.error}</p>}<div className="assistant-button-row"><button className="assistant-primary" disabled={Boolean(assistant.actionBusy)} onClick={() => void assistant.recover()}>Ergebnis prüfen</button>{assistant.recovery.status === "NOT_FOUND" ? <button disabled={assistant.working} onClick={() => void assistant.retryOriginal()}>Senden erneut versuchen</button> : <button disabled={Boolean(assistant.actionBusy)} onClick={() => void assistant.stop()}>Verarbeitung beenden</button>}</div></div>}
    </div>
    {newResponse && <button className="assistant-new-response" onClick={() => { container.current?.scrollTo({ top: container.current.scrollHeight }); following.current = true; setNewResponse(false); }}>Neue Antwort ↓</button>}
  </div>;
}
