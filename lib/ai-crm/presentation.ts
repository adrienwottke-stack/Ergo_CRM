import type { PrismaClient } from "@/lib/generated/prisma/client";
import { conversationHistory } from "@/lib/ai-crm/conversations";
import { actionReceipts, hydrateUndo } from "@/lib/ai-crm/action-plans";
import { AiCrmError } from "@/lib/ai-crm/errors";
import type { ActionReceipt, Entry, ReadResult } from "@/lib/ai-crm/contracts";

export async function conversationView(db: PrismaClient, userId: string, id: string) {
  const conversation = await conversationHistory(db, userId, id);
  const messages: Entry[] = await Promise.all(conversation.messages.map(async message => {
    const envelope = message.actions as unknown as { requestId?: string; actions?: ActionReceipt[]; results?: ReadResult[] } | null;
    const saved = Array.isArray(message.actions) ? message.actions as unknown as ActionReceipt[] : envelope?.actions ?? [];
    const actions = envelope?.requestId ? await actionReceipts(db, userId, envelope.requestId) : await hydrateUndo(db, userId, saved);
    return { id: message.id, role: message.role === "user" ? "user" : "assistant", content: message.content,
      source: message.source === "VOICE" ? "voice" : message.source === "TEXT" ? "text" : message.source === "LIVE" ? "live" : undefined,
      createdAt: message.createdAt.toISOString(), actions, results: envelope?.results, requestId: envelope?.requestId };
  }));
  return { ...conversation, messages, messageCount: messages.length };
}

export async function requestView(db: PrismaClient, userId: string, clientRequestId: string) {
  const request = await db.aiRequest.findFirst({ where: { userId, OR: [{ id: clientRequestId }, { clientRequestId }], kind: { in: ["CHAT", "LIVE_TURN"] }, expiresAt: { gt: new Date() }, status: { not: "TOMBSTONED" } } });
  if (!request) throw new AiCrmError("REQUEST_NOT_FOUND", "Diese Anfrage ist noch nicht verfügbar oder bereits abgelaufen.", 404);
  const actions = await actionReceipts(db, userId, request.id);
  const response = request.response && typeof request.response === "object" ? request.response as Record<string, unknown> : null;
  return { id: request.id, status: request.status, errorCode: request.errorCode, actions, response: response ? { ...response, actions } : null, conversationId: request.conversationId };
}
