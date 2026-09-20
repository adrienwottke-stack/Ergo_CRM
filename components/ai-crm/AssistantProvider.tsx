"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useVorfuehren } from "@/components/VorfuehrProvider";
import type { ActionReceipt, AssistantAccess, AssistantContext, ConversationSummary, Entry, ReadResult } from "@/lib/ai-crm/contracts";

type SendBody = { message: string; source: "text" | "voice"; conversationId?: string; clientRequestId: string; context?: { contactId: string; followUpId?: string } };
type Reply = { answer: string; requestId: string; actions: ActionReceipt[]; results?: ReadResult[]; conversation: ConversationSummary & { restartReason?: string | null } };
type Recovery = { body: SendBody; status: string; error?: string };
type LiveConversation = ConversationSummary & { restarted?: boolean; restartReason?: "expired" | "limit" | null };
type LiveTurn = { requestId: string; transcript: string; answer: string; actions: ActionReceipt[]; conversation: LiveConversation };
export class AssistantHttpError extends Error { constructor(message: string, public code: string, public status: number, public requestId?: string) { super(message); } }
export async function assistantFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AssistantHttpError(data.error ?? "Das hat gerade nicht geklappt. Bitte versuche es erneut.", data.code ?? "UNKNOWN", response.status, data.requestId);
  return data as T;
}
const post = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function useController() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = useRef(pathname);
  currentPath.current = pathname;
  const returnTo = useRef("/heute");
  const { aktiv: presenting } = useVorfuehren();
  const [mode, setMode] = useState<"closed" | "panel" | "workspace">("closed");
  const [section, setSection] = useState<"chat" | "conversations" | "details">("chat");
  const [access, setAccess] = useState<AssistantAccess | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [source, setSource] = useState<"text" | "voice">("text");
  const [attachment, setAttachment] = useState<AssistantContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null);
  const [billing, setBilling] = useState(false);
  const [captureEpoch, setCaptureEpoch] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const drafts = useRef(new Map<string, { text: string; source: "text" | "voice"; attachment: AssistantContext | null }>());
  const activeRequest = useRef<SendBody | null>(null);
  const initialized = useRef(false);
  const owner = useRef<string | null>(null);
  const loadVersion = useRef(0);
  const opener = useRef<HTMLElement | null>(null);
  const active = conversations.find(item => item.id === conversationId) ?? null;
  const locked = working || Boolean(recovery) || Boolean(actionBusy);
  const visible = mode !== "closed" && !presenting;

  const close = useCallback(() => {
    setMode("closed"); setCaptureEpoch(value => value + 1);
    if (currentPath.current === "/assistent") router.replace(returnTo.current, { scroll: false });
    requestAnimationFrame(() => opener.current?.isConnected && opener.current.focus({ preventScroll: true }));
  }, [router]);
  useEffect(() => { if (presenting) close(); }, [presenting, close]);
  useEffect(() => {
    setCaptureEpoch(value => value + 1);
    if (pathname !== "/assistent" && window.matchMedia("(max-width: 767px)").matches) setMode("closed");
  }, [pathname]);

  const register = useCallback((userId: string) => {
    if (owner.current === userId) return;
    owner.current = userId; initialized.current = false; loadVersion.current++;
    setAccess(null); setConversations([]); setEntries([]); setConversationId(null); setDraft(""); setAttachment(null); setError(null); setRecovery(null); setWorking(false); setMode("closed"); drafts.current.clear(); activeRequest.current = null;
  }, []);

  const loadList = useCallback(async (cursor?: string) => {
    const requestedOwner = owner.current;
    const data = await assistantFetch<{ conversations: ConversationSummary[]; nextCursor: string | null }>(`/api/ai-crm/conversations${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
    if (requestedOwner !== owner.current) return [];
    setConversations(current => cursor ? [...current, ...data.conversations.filter(item => !current.some(old => old.id === item.id))] : data.conversations);
    setNextCursor(data.nextCursor);
    return data.conversations;
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const version = ++loadVersion.current;
    setLoading(true); setError(null);
    try {
      const data = await assistantFetch<ConversationSummary & { messages: Entry[] }>(`/api/ai-crm/conversations/${encodeURIComponent(id)}`);
      if (version !== loadVersion.current) return;
      setConversationId(id); setEntries(data.messages); setScrollTop(-1); setNotice("Frühere Antworten beziehen sich auf den Zeitpunkt des Gesprächs.");
      setConversations(current => [{ id: data.id, title: data.title, expiresAt: data.expiresAt, updatedAt: data.updatedAt, messageCount: data.messageCount }, ...current.filter(item => item.id !== id)]);
    } catch (reason) { if (version === loadVersion.current) setError(reason instanceof Error ? reason.message : "Die Unterhaltung konnte nicht geladen werden."); }
    finally { if (version === loadVersion.current) setLoading(false); }
  }, []);

  const initialize = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true; setLoading(true); setError(null);
    try {
      const access = await assistantFetch<AssistantAccess>("/api/ai-crm/access");
      // The entry button can be clicked as soon as React has hydrated it,
      // while AssistantSurface's passive register effect is still queued. The
      // access endpoint is authenticated, so it is safe to bind that first
      // response to an as-yet-unset owner. We still discard a response after
      // an actual account switch, which is the cross-account guard this check
      // was introduced for.
      if (owner.current && access.userId !== owner.current) return;
      if (!owner.current) owner.current = access.userId;
      setAccess(access);
      if (access.enabled || access.reason?.startsWith("MONTHLY")) {
        const list = await loadList();
        if (list[0]) await loadConversation(list[0].id);
      }
    } catch (reason) { initialized.current = false; setError(reason instanceof Error ? reason.message : "Der Assistent ist gerade nicht erreichbar."); }
    finally { setLoading(false); }
  }, [loadList, loadConversation]);

  const open = useCallback((options?: { context?: AssistantContext; prompt?: string }) => {
    if (presenting) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMode(current => current === "workspace" ? current : "panel"); setSection("chat");
    if (options?.context) setAttachment(options.context);
    if (options?.prompt) setDraft(current => current || options.prompt!);
    void initialize();
  }, [initialize, presenting]);

  const expand = useCallback(() => {
    if (currentPath.current !== "/assistent") returnTo.current = currentPath.current;
    setMode("workspace"); router.push("/assistent", { scroll: false });
  }, [router]);
  const asPanel = useCallback(() => { setMode("panel"); if (currentPath.current === "/assistent") router.replace(returnTo.current, { scroll: false }); }, [router]);
  const showWorkspace = useCallback(() => { if (!presenting) { setMode("workspace"); void initialize(); } }, [presenting, initialize]);

  const selectConversation = useCallback(async (id: string) => {
    if (locked) return;
    drafts.current.set(conversationId ?? "new", { text: draft, source, attachment });
    const saved = drafts.current.get(id);
    setDraft(saved?.text ?? ""); setSource(saved?.source ?? "text"); setAttachment(saved?.attachment ?? null);
    setSection("chat"); setCaptureEpoch(value => value + 1);
    await loadConversation(id);
  }, [locked, conversationId, draft, source, attachment, loadConversation]);

  const startNew = useCallback(() => {
    if (locked) return;
    drafts.current.set(conversationId ?? "new", { text: draft, source, attachment });
    loadVersion.current++; setConversationId(null); setEntries([]); setDraft(""); setSource("text"); setAttachment(null); setNotice("Die neue Unterhaltung entsteht mit deiner ersten Nachricht."); setError(null); setSection("chat"); setScrollTop(0); setCaptureEpoch(value => value + 1);
  }, [locked, conversationId, draft, source, attachment]);

  useEffect(() => {
    if (!active) return;
    const expire = () => {
      if (Date.parse(active.expiresAt) > Date.now()) return;
      setConversations(current => current.filter(item => item.id !== active.id));
      setConversationId(null); setEntries([]); setNotice("Das vorherige Gespräch ist abgelaufen. Hier beginnt ein neues. Deine CRM-Einträge bleiben erhalten."); setCaptureEpoch(value => value + 1);
    };
    const timer = setTimeout(expire, Math.max(0, Date.parse(active.expiresAt) - Date.now()));
    document.addEventListener("visibilitychange", expire);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", expire); };
  }, [active]);

  const mergeActions = useCallback((requestId: string, actions: ActionReceipt[]) => {
    setEntries(current => current.map(entry => entry.requestId === requestId || entry.actions?.some(action => action.requestId === requestId) ? { ...entry, actions } : entry));
  }, []);

  const acceptReply = useCallback((data: Reply, body: SendBody) => {
    if (Date.parse(data.conversation.expiresAt) <= Date.now()) {
      setEntries([]); setConversationId(null); setRecovery(null); activeRequest.current = null;
      setNotice("Das vorherige Gespräch ist abgelaufen. Hier beginnt ein neues. Deine CRM-Einträge bleiben erhalten.");
      return;
    }
    const responseEntry: Entry = { id: `response-${body.clientRequestId}`, role: "assistant", content: data.answer, actions: data.actions, results: data.results, requestId: data.requestId, createdAt: new Date().toISOString() };
    setEntries(current => {
      const base = data.conversation.restartReason ? [{ id: body.clientRequestId, role: "user" as const, content: body.message, source: body.source, delivery: "sent" as const }] : current.map(entry => entry.id === body.clientRequestId ? { ...entry, delivery: "sent" as const } : entry);
      return [...base.filter(entry => entry.id !== responseEntry.id), responseEntry];
    });
    setConversationId(data.conversation.id);
    setConversations(current => [data.conversation, ...current.filter(item => item.id !== data.conversation.id)]);
    if (data.conversation.restartReason) setNotice(data.conversation.restartReason === "expired" ? "Das vorherige Gespräch ist abgelaufen. Hier beginnt ein neues." : "Hier beginnt eine neue Unterhaltung. Das vorherige Gespräch hat 20 Nachrichten erreicht.");
    setRecovery(null); setError(null); activeRequest.current = null;
    if (data.actions.some(item => item.status === "COMPLETED")) { router.refresh(); window.dispatchEvent(new Event("crm:work-saved")); }
  }, [router]);

  // A Live round shares the ordinary seven-day CRM conversation. The transport
  // is intentionally separate, but no second browser-only history is created.
  const acceptLiveConversation = useCallback((conversation: LiveConversation) => {
    setConversationId(conversation.id);
    setConversations(current => {
      const previous = current.find(item => item.id === conversation.id);
      const summary: ConversationSummary = {
        id: conversation.id,
        title: conversation.title,
        expiresAt: conversation.expiresAt,
        updatedAt: conversation.updatedAt ?? previous?.updatedAt ?? new Date().toISOString(),
        messageCount: conversation.messageCount ?? previous?.messageCount ?? 0,
      };
      return [summary, ...current.filter(item => item.id !== summary.id)];
    });
    if (conversation.id !== conversationId || conversation.restarted) {
      setEntries([]); setScrollTop(0);
    }
    if (conversation.restarted) {
      setNotice(conversation.restartReason === "expired" ? "Das vorherige Gespräch ist abgelaufen. Hier beginnt eine neue Live-Unterhaltung." : "Hier beginnt eine neue Live-Unterhaltung. Das vorherige Gespräch hat 20 Nachrichten erreicht.");
    }
  }, [conversationId]);

  const acceptLiveTurn = useCallback((turn: LiveTurn) => {
    const userEntry: Entry = {
      id: `live-${turn.requestId}`,
      role: "user",
      content: turn.transcript,
      source: "live",
      delivery: "sent",
      createdAt: new Date().toISOString(),
      requestId: turn.requestId,
    };
    const responseEntry: Entry = {
      id: `live-response-${turn.requestId}`,
      role: "assistant",
      content: turn.answer,
      actions: turn.actions,
      requestId: turn.requestId,
      createdAt: new Date().toISOString(),
    };
    setEntries(current => [
      ...(turn.conversation.restarted
        ? []
        : current.filter(entry => entry.id !== userEntry.id && entry.id !== responseEntry.id)),
      userEntry,
      responseEntry,
    ]);
    setConversationId(turn.conversation.id);
    setConversations(current => {
      const previous = current.find(item => item.id === turn.conversation.id);
      const summary: ConversationSummary = {
        id: turn.conversation.id,
        title: turn.conversation.title,
        expiresAt: turn.conversation.expiresAt,
        updatedAt: turn.conversation.updatedAt ?? new Date().toISOString(),
        messageCount: turn.conversation.messageCount ?? (previous?.messageCount ?? 0) + 2,
      };
      return [summary, ...current.filter(item => item.id !== summary.id)];
    });
    if (turn.conversation.restarted) {
      setScrollTop(0);
      setNotice(
        turn.conversation.restartReason === "expired"
          ? "Das vorherige Gespräch ist abgelaufen. Die Live-Runde läuft in einer neuen Unterhaltung weiter."
          : "Die vorherige Unterhaltung hat 20 Nachrichten erreicht. Die Live-Runde läuft in einer neuen Unterhaltung weiter.",
      );
    }
    if (turn.actions.some(action => action.status === "COMPLETED")) {
      router.refresh(); window.dispatchEvent(new Event("crm:work-saved"));
    }
  }, [router]);

  const send = useCallback(async () => {
    if (!draft.trim() || locked || loading || activeRequest.current || !access?.enabled) return;
    if (!navigator.onLine) { setError("Du bist gerade offline. Deine Nachricht wurde noch nicht gesendet."); return; }
    const full = active && active.messageCount >= 20;
    const body: SendBody = { message: draft.trim(), source, clientRequestId: crypto.randomUUID(), conversationId: conversationId ?? undefined, ...(attachment ? { context: { contactId: attachment.contactId, followUpId: attachment.followUpId } } : {}) };
    activeRequest.current = body; setWorking(true); setError(null); setNotice(full ? "Diese Nachricht beginnt eine neue Unterhaltung." : null);
    setEntries(current => [...(full ? [] : current), { id: body.clientRequestId, role: "user", content: body.message, source, delivery: "sending" }]); setDraft(""); setSource("text");
    try { const reply = await assistantFetch<Reply>("/api/ai-crm/chat", post(body)); if (activeRequest.current === body) acceptReply(reply, body); }
    catch (reason) {
      if (activeRequest.current === body) {
        if (reason instanceof AssistantHttpError && !reason.requestId && ["INVALID_REQUEST", "ORIGIN_DENIED", "AI_NOT_ENTITLED", "CONTACT_NOT_FOUND", "FOLLOW_UP_NOT_FOUND"].includes(reason.code)) {
          activeRequest.current = null; setDraft(body.message); setSource(body.source); setEntries(current => current.filter(entry => entry.id !== body.clientRequestId)); setError(reason.message); return;
        }
        setRecovery({ body, status: "UNKNOWN", error: reason instanceof Error ? reason.message : undefined });
        setEntries(current => current.map(entry => entry.id === body.clientRequestId ? { ...entry, delivery: "unknown" } : entry));
      }
    } finally { setWorking(false); }
  }, [draft, locked, loading, access, active, source, conversationId, attachment, acceptReply]);

  const recover = useCallback(async () => {
    const body = recovery?.body ?? activeRequest.current;
    if (!body) return;
    setActionBusy("recovery");
    try {
      const data = await assistantFetch<{ id: string; status: string; actions: ActionReceipt[]; response: Reply | null }>(`/api/ai-crm/requests/${body.clientRequestId}`);
      if (data.response) acceptReply(data.response, body);
      else if (["FAILED", "ABORTED"].includes(data.status)) {
        setEntries(current => [...current.filter(entry => entry.id !== `response-${body.clientRequestId}`), { id: `response-${body.clientRequestId}`, role: "assistant", content: data.status === "ABORTED" ? "Die Verarbeitung wurde beendet. Bereits gespeicherte Änderungen bleiben erhalten." : "Die Anfrage konnte nicht vollständig abgeschlossen werden. Prüfe die einzelnen Ergebnisse.", actions: data.actions, requestId: data.id }]);
        setRecovery(null); activeRequest.current = null; setWorking(false);
      } else setRecovery({ body, status: data.status, error: "Die Anfrage läuft noch. Bereits ausgeführte Schritte werden beim Abschluss angezeigt." });
    } catch (reason) { setRecovery({ body, status: reason instanceof AssistantHttpError && reason.status === 404 ? "NOT_FOUND" : "UNKNOWN", error: reason instanceof Error ? reason.message : "Der Status ist gerade nicht erreichbar." }); }
    finally { setActionBusy(null); }
  }, [recovery, acceptReply]);

  const retryOriginal = useCallback(async () => {
    if (recovery?.status !== "NOT_FOUND") return;
    const body = recovery.body; setWorking(true);
    try { const reply = await assistantFetch<Reply>("/api/ai-crm/chat", post(body)); acceptReply(reply, body); }
    catch (reason) { setRecovery({ body, status: "UNKNOWN", error: reason instanceof Error ? reason.message : "Die Anfrage ist noch nicht erreichbar." }); }
    finally { setWorking(false); }
  }, [recovery, acceptReply]);

  const stop = useCallback(async () => {
    const body = activeRequest.current;
    if (!body) return;
    setActionBusy("stop");
    try {
      const cancelRequest = async (): Promise<{ id: string; actions: ActionReceipt[] }> => {
        // Stop can arrive while the initial HTTP handler is still registering
        // its durable request. Retry only cancellation of that exact ID.
        for (let attempt = 0; ; attempt++) {
          try { return await assistantFetch<{ id: string; actions: ActionReceipt[] }>(`/api/ai-crm/requests/${body.clientRequestId}`, post({ action: "cancel" })); }
          catch (reason) {
            if (!(reason instanceof AssistantHttpError) || reason.status !== 404 || attempt >= 4) throw reason;
            await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
          }
        }
      };
      const data = await cancelRequest();
      setEntries(current => [...current.filter(entry => entry.id !== `response-${body.clientRequestId}`), { id: `response-${body.clientRequestId}`, role: "assistant", content: "Die Verarbeitung wurde beendet. Bereits gespeicherte Änderungen bleiben erhalten.", actions: data.actions, requestId: data.id }]);
      activeRequest.current = null; setRecovery(null); setWorking(false);
    } catch (reason) { setRecovery({ body, status: "UNKNOWN", error: reason instanceof Error ? reason.message : "Der Abbruch konnte nicht bestätigt werden." }); }
    finally { setActionBusy(null); }
  }, []);

  const changePlan = useCallback(async (requestId: string, action: "confirm" | "cancel", actionIds?: string[]) => {
    if (actionBusy || working) return;
    setActionBusy(requestId); setActionErrors(current => ({ ...current, [requestId]: "" }));
    try {
      const result = await assistantFetch<{ actions: ActionReceipt[] }>(`/api/ai-crm/requests/${requestId}`, post({ action, ...(actionIds ? { actionIds } : {}) }));
      mergeActions(requestId, result.actions); router.refresh(); window.dispatchEvent(new Event("crm:work-saved"));
    } catch (reason) { setActionErrors(current => ({ ...current, [requestId]: reason instanceof Error ? reason.message : "Der Abschluss ist unklar. Bitte prüfe das Ergebnis." })); }
    finally { setActionBusy(null); }
  }, [actionBusy, working, mergeActions, router]);

  const refreshActions = useCallback(async (requestId: string) => {
    try { const result = await assistantFetch<{ actions: ActionReceipt[] }>(`/api/ai-crm/requests/${requestId}`); mergeActions(requestId, result.actions); setActionErrors(current => ({ ...current, [requestId]: "" })); }
    catch { setActionErrors(current => ({ ...current, [requestId]: "Der aktuelle Status konnte nicht geladen werden." })); }
  }, [mergeActions]);
  useEffect(() => {
    if (!visible || working) return;
    const ids = [...new Set(entries.filter(entry => entry.actions?.some(action => action.status === "PENDING" || action.undoable)).flatMap(entry => entry.requestId ? [entry.requestId] : []))];
    if (!ids.length) return;
    const refresh = () => { if (document.visibilityState === "visible") ids.forEach(id => void refreshActions(id)); };
    const timer = setInterval(refresh, 15000); window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [visible, working, entries, refreshActions]);

  const undo = useCallback(async (receipt: ActionReceipt) => {
    if (!receipt.undoEntryId || actionBusy) return;
    setActionBusy(receipt.undoEntryId);
    try {
      await assistantFetch("/api/ai-crm/undo", post({ entryId: receipt.undoEntryId }));
      setEntries(current => current.map(entry => ({ ...entry, actions: entry.actions?.map(action => action.undoEntryId === receipt.undoEntryId ? { ...action, undoable: false, undoStatus: "UNDONE" } : action) })));
      router.refresh(); window.dispatchEvent(new Event("crm:undo"));
    } catch (reason) { setActionErrors(current => ({ ...current, [receipt.id ?? receipt.undoEntryId!]: reason instanceof Error ? reason.message : "Die Änderung konnte nicht zurückgenommen werden." })); if (receipt.requestId) void refreshActions(receipt.requestId); }
    finally { setActionBusy(null); }
  }, [actionBusy, refreshActions, router]);

  const removeConversation = useCallback(async () => {
    if (!deleteTarget || locked) return;
    setActionBusy("delete"); setError(null);
    try {
      const response = await fetch(`/api/ai-crm/conversations/${deleteTarget.id}`, { method: "DELETE", headers: { "X-AI-CRM-Request": "same-origin" } });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
      setConversations(current => current.filter(item => item.id !== deleteTarget.id));
      if (conversationId === deleteTarget.id) { setConversationId(null); setEntries([]); setDraft(""); setAttachment(null); }
      drafts.current.delete(deleteTarget.id); setDeleteTarget(null); setNotice("Unterhaltung gelöscht. Deine CRM-Einträge bleiben erhalten.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Die Unterhaltung konnte nicht gelöscht werden."); }
    finally { setActionBusy(null); }
  }, [deleteTarget, locked, conversationId]);

  const openBilling = useCallback(async (kind: "checkout" | "portal") => {
    setBilling(true); setError(null);
    try { const result = await assistantFetch<{ url: string }>(`/api/ai-crm/billing/${kind}`, post(kind === "checkout" ? { clientRequestId: crypto.randomUUID() } : {})); window.location.assign(result.url); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Der Zugang konnte nicht geöffnet werden."); setBilling(false); }
  }, []);

  return { mode, setMode, expand, asPanel, showWorkspace, visible, presenting, section, setSection, access, conversations, nextCursor, conversationId, active, entries, draft, setDraft, source, setSource, attachment, setAttachment, loading, working, locked, recovery, error, setError, notice, actionBusy, actionErrors, deleteTarget, setDeleteTarget, billing, captureEpoch, scrollTop, setScrollTop, register, open, close, initialize, loadList, selectConversation, startNew, send, recover, retryOriginal, stop, changePlan, refreshActions, undo, removeConversation, openBilling, acceptLiveConversation, acceptLiveTurn };
}

type Controller = ReturnType<typeof useController>;
const Context = createContext<Controller | null>(null);
export function useAssistant() { const value = useContext(Context); if (!value) throw new Error("AssistantProvider fehlt"); return value; }
export default function AssistantProvider({ children }: { children: ReactNode }) { const controller = useController(); return <Context.Provider value={controller}>{children}</Context.Provider>; }
