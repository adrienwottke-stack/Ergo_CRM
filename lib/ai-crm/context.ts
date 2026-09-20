import type { PrismaClient } from "@/lib/generated/prisma/client";
import { conversationHistory } from "@/lib/ai-crm/conversations";
import type { AiChatMessage } from "@/lib/ai-crm/agent";

export type AiContextChunk = {
  kind: "conversation" | "knowledge";
  messages: AiChatMessage[];
  citations: Array<{ source: string; label: string }>;
};

export interface AiContextProvider {
  load(params: {
    db: PrismaClient;
    userId: string;
    conversationId: string;
    now: Date;
  }): Promise<AiContextChunk>;
}

/**
 * V1.1 liefert nur den zeitlich begrenzten Unterhaltungskontext. Ein spaeteres
 * Wissenspaket kann einen weiteren Provider mit nachvollziehbaren Quellen
 * ergaenzen, ohne die Aufbewahrung der Unterhaltung auszuweiten.
 */
export const shortTermConversationContext: AiContextProvider = {
  async load({ db, userId, conversationId, now }) {
    const conversation = await conversationHistory(db, userId, conversationId, now);
    return {
      kind: "conversation",
      messages: conversation.messages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
      citations: [],
    };
  },
};

export async function assembleAgentContext(params: {
  db: PrismaClient;
  userId: string;
  conversationId: string;
  now?: Date;
  providers?: AiContextProvider[];
}) {
  const now = params.now ?? new Date();
  const providers = params.providers ?? [shortTermConversationContext];
  const chunks = await Promise.all(
    providers.map((provider) =>
      provider.load({
        db: params.db,
        userId: params.userId,
        conversationId: params.conversationId,
        now,
      }),
    ),
  );
  return {
    messages: chunks.flatMap((chunk) => chunk.messages).slice(-20),
    citations: chunks.flatMap((chunk) => chunk.citations),
  };
}
