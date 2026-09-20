import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiCrmConfig } from "@/lib/ai-crm/config";
import { requireAiEntitlement } from "@/lib/ai-crm/entitlement";
import { AiCrmError } from "@/lib/ai-crm/errors";
import { aiErrorResponse, sameOrigin } from "@/lib/ai-crm/http";
import { musicProviderForLive } from "@/lib/ai-crm/live-music";
import {
  prepareLiveTurnConversation,
  requireLiveSession,
} from "@/lib/ai-crm/live-sessions";
import { runLocalLiveTurn } from "@/lib/ai-crm/live-turn";
import { actionReceipts } from "@/lib/ai-crm/action-plans";
import { persistConversationExchange } from "@/lib/ai-crm/conversations";
import { claimAiRequest, failAiRequest, hashAiRequestInput } from "@/lib/ai-crm/requests";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sessionId: string }> };
const bodySchema = z
  .object({
    clientTurnId: z.uuid(),
    transcript: z.string().trim().min(1).max(4000),
  })
  .strict();

export async function POST(request: Request, context: RouteContext) {
  let aiRequestId: string | null = null;
  let userId: string | null = null;
  try {
    if (!sameOrigin(request)) {
      throw new AiCrmError("ORIGIN_DENIED", "Nicht erlaubt.", 403);
    }
    const user = await requireUser();
    userId = user.id;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AiCrmError(
        "INVALID_REQUEST",
        "Die Live-Zeile ist leer, zu lang oder unvollständig.",
        400,
      );
    }
    const { sessionId: routeSessionId } = await context.params;
    const config = aiCrmConfig();
    await requireAiEntitlement(prisma, user.id, new Date(), config);
    if (config.liveProvider !== "mock") {
      throw new AiCrmError(
        "LIVE_TRANSPORT_UNAVAILABLE",
        "Die Live-Verbindung ist gerade nicht verfügbar.",
        503,
      );
    }
    const now = new Date();
    // Claim first so a lost response can replay its already-completed result
    // without allocating an empty successor conversation at the 20-message
    // boundary. A valid owner session is still required before that lookup.
    const currentSession = await requireLiveSession(prisma, {
      userId: user.id,
      sessionId: routeSessionId,
      now,
    });
    const claimed = await claimAiRequest(prisma, {
      userId: user.id,
      clientRequestId: parsed.data.clientTurnId,
      kind: "LIVE_TURN",
      inputHash: hashAiRequestInput({
        sessionId: routeSessionId,
        transcript: parsed.data.transcript,
      }),
      now,
      expiresAt: currentSession.conversation!.expiresAt,
      staleAfterMs: config.providerTimeoutMs + 15_000,
    });
    aiRequestId = claimed.request.id;
    if (claimed.kind === "REPLAY") {
      return Response.json(claimed.response, {
        headers: { "Cache-Control": "no-store", "X-AI-Replayed": "1" },
      });
    }
    if (claimed.kind === "IN_PROGRESS") {
      throw new AiCrmError(
        "REQUEST_IN_PROGRESS",
        "Diese Live-Zeile wird bereits verarbeitet. Bitte warte einen Moment.",
        409,
      );
    }
    // Reserve both final-message slots only for a new turn. If the existing
    // short-term conversation just reached its boundary, the active Live
    // session is rebound to a fresh one instead of being ended.
    const prepared = await prepareLiveTurnConversation(prisma, {
      userId: user.id,
      sessionId: routeSessionId,
      now,
      retentionDays: config.conversationRetentionDays,
      maxMessages: config.conversationMaxMessages,
    });
    const conversation = prepared.conversation;
    if (prepared.restarted) {
      const updated = await prisma.aiRequest.updateMany({
        where: { id: claimed.request.id, userId: user.id, status: "IN_PROGRESS" },
        data: { expiresAt: conversation.expiresAt },
      });
      if (updated.count !== 1) {
        throw new AiCrmError(
          "REQUEST_STATE_CHANGED",
          "Die Live-Zeile konnte nicht sicher vorbereitet werden.",
          409,
        );
      }
    }
    const result = await runLocalLiveTurn({
      db: prisma,
      userId: user.id,
      sessionId: routeSessionId,
      aiRequestId: claimed.request.id,
      requestId: claimed.request.id,
      transcript: parsed.data.transcript,
      now,
      music: musicProviderForLive(prisma),
    });
    const actions = await actionReceipts(prisma, user.id, claimed.request.id);
    const messageCount = await prisma.aiConversationMessage.count({
      where: { conversationId: conversation.id },
    });
    const response = {
      mode: "simulation" as const,
      requestId: claimed.request.id,
      answer: result.answer,
      actions,
      music: result.music,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        expiresAt: conversation.expiresAt.toISOString(),
        updatedAt: now.toISOString(),
        messageCount: messageCount + 2,
        restarted: prepared.restarted,
        restartReason: prepared.restartReason,
      },
    };
    await persistConversationExchange(prisma, {
      userId: user.id,
      conversationId: conversation.id,
      userMessage: parsed.data.transcript,
      source: "LIVE",
      assistantMessage: result.answer,
      actions,
      presentation: { requestId: claimed.request.id, results: [] },
      now,
      completeRequest: { id: claimed.request.id, response },
    });
    if (result.actions.length > 0) {
      revalidatePath("/heute");
      revalidatePath("/namen");
      revalidatePath("/trichter");
      for (const action of result.actions) {
        if (action.link?.startsWith("/contacts/")) revalidatePath(action.link);
      }
    }
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const errorCode = error instanceof AiCrmError ? error.code : "INTERNAL_ERROR";
    if (aiRequestId && userId) {
      await failAiRequest(prisma, aiRequestId, userId, errorCode, "FAILED").catch(
        () => undefined,
      );
    }
    return aiErrorResponse(error, aiRequestId ?? undefined);
  }
}
