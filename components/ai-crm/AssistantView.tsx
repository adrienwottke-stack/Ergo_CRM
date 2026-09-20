"use client";
import { useEffect, useRef, useState } from "react";
import { useAssistant } from "@/components/ai-crm/AssistantProvider";
import AssistantComposer from "@/components/ai-crm/AssistantComposer";
import AssistantTimeline from "@/components/ai-crm/AssistantTimeline";
import JarvisLive from "@/components/ai-crm/JarvisLive";

export function AssistantConversationList() {
  const assistant = useAssistant();
  const [loading, setLoading] = useState(false);
  const groups = Map.groupBy([...assistant.conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), item => new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: "Europe/Berlin" }).format(new Date(item.updatedAt)));
  return <div className="assistant-conversation-list"><h2>Unterhaltungen</h2><button className="assistant-new-conversation" disabled={assistant.locked || assistant.loading} onClick={assistant.startNew}>＋ Neue Unterhaltung</button>{assistant.locked && <p className="assistant-caption">Beende zuerst die laufende Anfrage und prüfe ihr Ergebnis.</p>}
    {[...groups].map(([day, items]) => <section key={day}><h3>{day}</h3>{items.map(item => <div className="assistant-conversation-row" key={item.id}><button disabled={assistant.locked || assistant.loading} aria-current={assistant.conversationId === item.id ? "true" : undefined} onClick={() => void assistant.selectConversation(item.id)}><strong>{item.title}</strong><span>Verfügbar bis {new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.expiresAt))}</span></button><button disabled={assistant.locked || assistant.loading} onClick={() => assistant.setDeleteTarget(item)} aria-label={`Unterhaltung löschen: ${item.title}`}>×</button></div>)}</section>)}
    {assistant.nextCursor && <button disabled={loading} onClick={async () => { setLoading(true); try { await assistant.loadList(assistant.nextCursor!); } catch { assistant.setError("Weitere Unterhaltungen konnten nicht geladen werden."); } finally { setLoading(false); } }}>{loading ? "Wird geladen …" : "Weitere laden"}</button>}
    {!assistant.conversations.length && <p className="assistant-caption">Gesendete Gespräche findest du hier bis sieben Tage nach ihrem Beginn.</p>}
  </div>;
}

function Details() {
  const assistant = useAssistant();
  const access = assistant.access;
  return <div className="assistant-details"><h2>Speicherung und Zugang</h2><h3>Deine Unterhaltungen</h3><p>Gespräche bleiben sieben Tage ab Beginn verfügbar. Weitere Nachrichten verlängern diese Zeit nicht.</p>{assistant.active && <p>Verfügbar bis {new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeStyle: "short" }).format(new Date(assistant.active.expiresAt))}.</p>}<p>Nach dem Ablauf wird das Gespräch nicht mehr verwendet und automatisch bereinigt. Gespeicherte Kontakte, Notizen und Wiedervorlagen bleiben im CRM.</p><p>Eine Unterhaltung enthält höchstens 20 Nachrichten, also normalerweise zehn Fragen und Antworten. Danach beginnt ein neues Gespräch ohne den alten Kontext.</p><h3>Diktieren</h3><p>Audio wird in der Anwendung nicht dauerhaft gespeichert. Das Transkript wird kurzzeitig für eine sichere Wiederholung vorgehalten. Erst mit „Senden“ wird es an den Chat übergeben.</p><h3>Nutzung und Zugang</h3>{access && <><p>{access.monthlyRequests} von {access.monthlyRequestLimit} Anfragen in diesem Monat · {Math.ceil(access.monthlyAudioSeconds / 60)} von {Math.ceil(access.monthlyAudioSecondsLimit / 60)} Sprachminuten.</p>{access.hasBillingAccount && <button disabled={assistant.billing} onClick={() => void assistant.openBilling("portal")}>Abo verwalten</button>}{!access.enabled && access.reason === "NO_ENTITLEMENT" && access.billingConfigured && <button className="assistant-primary" disabled={assistant.billing} onClick={() => void assistant.openBilling("checkout")}>Zugang für {access.priceLabel}/Monat ansehen</button>}</>}{assistant.active && <button className="assistant-delete-link" disabled={assistant.locked} onClick={() => assistant.setDeleteTarget(assistant.active)}>Diese Unterhaltung löschen</button>}</div>;
}

function DeleteDialog() {
  const assistant = useAssistant();
  const { deleteTarget, setError } = assistant;
  const dialog = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!deleteTarget) return;
    setError(null);
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal(); keep.current?.focus();
    return () => { element?.close(); if (previous?.isConnected) previous.focus(); };
  }, [deleteTarget, setError]);
  if (!deleteTarget) return null;
  return <dialog className="assistant-delete-dialog" ref={dialog} aria-labelledby="assistant-delete-title" onCancel={() => assistant.setDeleteTarget(null)}><h2 id="assistant-delete-title">Unterhaltung löschen?</h2><p>„{assistant.deleteTarget?.title}“</p><p>Das Gespräch wird gelöscht. Bereits gespeicherte CRM-Änderungen bleiben erhalten.</p>{assistant.error && <p className="assistant-error" role="alert">{assistant.error}</p>}<div className="assistant-button-row"><button ref={keep} disabled={assistant.actionBusy === "delete"} onClick={() => assistant.setDeleteTarget(null)}>Behalten</button><button className="assistant-danger" disabled={assistant.actionBusy === "delete"} onClick={() => void assistant.removeConversation()}>{assistant.actionBusy === "delete" ? "Wird gelöscht …" : "Unterhaltung löschen"}</button></div></dialog>;
}

export default function AssistantView() {
  const assistant = useAssistant();
  const header = useRef<HTMLHeadingElement>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  useEffect(() => { header.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    if (assistant.section !== "chat") setLiveOpen(false);
  }, [assistant.section]);
  return <section className="assistant-view" aria-label="CRM-Assistent">
    <header className="assistant-header"><button className="assistant-mobile-back" onClick={assistant.close} aria-label="Zurück zum CRM">←</button><h2 ref={header} tabIndex={-1}><button onClick={() => assistant.setSection(assistant.section === "conversations" ? "chat" : "conversations")} aria-label="Unterhaltungen öffnen">Assistent <span aria-hidden>⌄</span></button></h2><div className="assistant-header-actions"><button disabled={assistant.locked || assistant.loading} onClick={assistant.startNew} aria-label="Neue Unterhaltung">＋</button><button className="assistant-expand" onClick={() => assistant.mode === "workspace" ? assistant.asPanel() : assistant.expand()} aria-label={assistant.mode === "workspace" ? "Als Panel öffnen" : "Groß öffnen"}>{assistant.mode === "workspace" ? "↙" : "↗"}</button><button onClick={() => assistant.setSection(assistant.section === "details" ? "chat" : "details")} aria-label="Speicherung und Zugang">⋯</button><button className="assistant-desktop-close" onClick={assistant.close} aria-label="Assistent schließen">×</button></div></header>
    {assistant.section !== "chat" && <button className="assistant-back-to-chat" onClick={() => assistant.setSection("chat")}>← Zurück zum Gespräch</button>}
    {assistant.error && !assistant.deleteTarget && <div className="assistant-error-banner" role="alert"><p>{assistant.error}</p>{!assistant.access && <button onClick={() => void assistant.initialize()}>Erneut versuchen</button>}</div>}
    {assistant.section === "details" ? <Details /> : assistant.section === "conversations" ? <AssistantConversationList /> : !assistant.access ? <p className="assistant-loading" role="status">Assistent wird geöffnet …</p> : !assistant.access.enabled ? <div className="assistant-access"><span aria-hidden>○</span><h3>{assistant.access.reason === "NO_ENTITLEMENT" ? "Der Assistent ist für dein Konto noch nicht freigeschaltet." : assistant.access.reason?.startsWith("MONTHLY") ? "Dein Nutzungslimit ist erreicht." : "Der Assistent ist vorübergehend nicht verfügbar."}</h3><p>Du kannst im CRM normal weiterarbeiten.</p><div className="assistant-button-row"><button className="assistant-primary" onClick={assistant.close}>Zurück zum CRM</button><button onClick={() => assistant.setSection("details")}>Zugang ansehen</button></div></div> : <>
      {!liveOpen && assistant.attachment && <div className="assistant-context"><span>Bezug: <strong>{assistant.attachment.label}</strong>{assistant.attachment.followUpId && " · Wiedervorlage"}</span><button disabled={assistant.working} onClick={() => assistant.setAttachment(null)} aria-label="Bezug entfernen">×</button></div>}
      {!liveOpen && <AssistantTimeline />}
      {assistant.access.liveAvailable && <details className="assistant-live-entry"><summary>Live sprechen · lokale Demo</summary><JarvisLive
        conversationId={assistant.conversationId}
        disabled={assistant.locked}
        onActiveChange={setLiveOpen}
        onConversationStarted={assistant.acceptLiveConversation}
        onTurn={assistant.acceptLiveTurn}
      /></details>}
      {!liveOpen && <AssistantComposer />}
    </>}
    <DeleteDialog />
  </section>;
}
