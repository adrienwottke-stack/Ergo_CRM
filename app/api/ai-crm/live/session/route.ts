import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { claimAiUsage, requireAiEntitlement } from "@/lib/ai-crm/entitlement";
import { AiCrmError } from "@/lib/ai-crm/errors";
import { aiErrorResponse, sameOrigin } from "@/lib/ai-crm/http";
import { musicProviderForLive } from "@/lib/ai-crm/live-music";
import { endLiveSession, startLiveSession } from "@/lib/ai-crm/live-sessions";
import { assertLiveAvailable, createProviderSession, livePublicConfig, sendProviderUpdate } from "@/lib/ai-crm/live-provider";
import { classifyOpenAiProviderError } from "@/lib/ai-crm/openai-errors";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    clientSessionId: z.uuid(),
    conversationId: z.string().trim().min(8).max(120).optional(),
    sdp: z.string().min(20).max(64_000).optional(),
    reconnect: z.boolean().optional(),
  })
  .strict();

function publicConversation(
  conversation: { id: string; title: string; expiresAt: Date; updatedAt: Date },
  restarted: boolean,
  restartReason: "expired" | "limit" | null,
  messageCount: number,
) {
  return {
    id: conversation.id,
    title: conversation.title,
    expiresAt: conversation.expiresAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messageCount,
    restarted,
    restartReason,
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const config = assertLiveAvailable();
    await requireAiEntitlement(prisma, user.id, new Date(), config);
    return Response.json({ mode: config.liveProvider === "live" ? "live" : "simulation", config: livePublicConfig(user.name, config) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return aiErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) {
      throw new AiCrmError("ORIGIN_DENIED", "Nicht erlaubt.", 403);
    }
    const user = await requireUser();
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AiCrmError(
        "INVALID_REQUEST",
        "Die Live-Session konnte nicht sicher gestartet werden.",
        400,
      );
    }
    const config = assertLiveAvailable();
    if (config.liveProvider === "live" && !parsed.data.sdp) throw new AiCrmError("LIVE_SDP_REQUIRED", "Die Audioverbindung benötigt ein Verbindungsangebot des Browsers.", 400);
    const now = new Date();
    await requireAiEntitlement(prisma, user.id, now, config);
    const started = await startLiveSession(prisma, {
      userId: user.id,
      provider: config.liveProvider === "live" ? "live" : "mock",
      clientSessionId: parsed.data.clientSessionId,
      conversationId: parsed.data.conversationId,
      now,
      retentionDays: config.conversationRetentionDays,
      maxMessages: config.conversationMaxMessages,
      maxSessionSeconds: config.liveMaxSessionSeconds,
      introEnabled: config.liveDemoEnabled,
    });
    let session = started.session;
    if (!started.reused) {
      try {
        const usage = await claimAiUsage(
          prisma,
          user.id,
          "LIVE_SESSION",
          now,
          config,
          `live:${started.session.id}`,
        );
        session = await prisma.aiLiveSession.update({
          where: { id: started.session.id },
          data: { usageId: usage.id },
        });
        await prisma.aiUsage.update({
          where: { id: usage.id },
          data: { provider: config.liveProvider === "live" ? "openai" : "local-mock", model: config.liveProvider === "live" ? config.liveModel : "local-mock" },
        });
      } catch (error) {
        await endLiveSession(prisma, {
          userId: user.id,
          sessionId: started.session.id,
          now,
          errorCode: "LIVE_USAGE_NOT_CLAIMED",
        }).catch(() => undefined);
        throw error;
      }
    }
    let transport: { type: "webrtc"; sdp: string } | undefined;
    if (config.liveProvider === "live") {
      // SDP is deliberately not persisted. A lost creation response needs a
      // deliberate new connection; never silently create a second billed call.
      if (started.reused && !parsed.data.reconnect) return Response.json({ error: "Die Sprachverbindung wurde bereits angelegt. Stelle die Verbindung bewusst wieder her.", code: "LIVE_RECONNECT_REQUIRED", session: { id: session.id, introState: session.introState } }, { status: 409, headers: { "Cache-Control": "no-store" } });
      if (started.reused) {
          if (!session.providerSessionRef) throw new AiCrmError("LIVE_START_IN_PROGRESS", "Die Sprachverbindung wird noch gestartet. Bitte warte auf den Abschluss.", 409);
          if (session.reconnectCount >= config.liveReconnectLimit) throw new AiCrmError("LIVE_RECONNECT_LIMIT", "Die maximale Zahl der Wiederverbindungen ist erreicht. Bitte beende die Runde.", 409);
          const reserved = await prisma.aiLiveSession.updateMany({ where: { id: session.id, userId: user.id, errorCode: null, revision: session.revision, reconnectCount: { lt: config.liveReconnectLimit } }, data: { errorCode: "LIVE_RECONNECTING", revision: { increment: 1 }, reconnectCount: { increment: 1 } } });
          if (!reserved.count) throw new AiCrmError("LIVE_RECONNECT_IN_PROGRESS", "Die Verbindung wird bereits wiederhergestellt.", 409);
      }
      let createdProviderRef: string | null = null;
      try {
        if (started.reused && session.providerSessionRef) await sendProviderUpdate(session.providerSessionRef, "", { close: true });
        const created = await createProviderSession({ sdp: parsed.data.sdp!, greetingPending: session.introState !== "DONE", profileName: user.name, config });
        createdProviderRef = created.session.id;
        transport = created.transport;
        session = await prisma.aiLiveSession.update({ where: { id: session.id }, data: { providerSessionRef: created.session.id, errorCode: null } });
      } catch (error) {
        if (createdProviderRef) await sendProviderUpdate(createdProviderRef, "", { close: true }).catch(() => undefined);
        await endLiveSession(prisma, { userId: user.id, sessionId: session.id, errorCode: "LIVE_PROVIDER_START_FAILED" });
        if (session.usageId) await prisma.aiUsage.updateMany({ where: { id: session.usageId, userId: user.id }, data: { status: "FAILED", errorCode: "LIVE_PROVIDER_START_FAILED" } });
        throw classifyOpenAiProviderError(error) ?? error;
      }
    }
    const music = await musicProviderForLive(prisma).state({
      userId: user.id,
      sessionId: session.id,
    });
    const messageCount = await prisma.aiConversationMessage.count({
      where: { conversationId: started.conversation.id },
    });
    return Response.json(
      {
        mode: config.liveProvider === "live" ? "live" : "simulation",
        transport,
        config: livePublicConfig(user.name, config),
        session: {
          id: session.id,
          expiresAt: session.expiresAt.toISOString(),
          reconnectLimit: config.liveReconnectLimit,
          introState: session.introState,
          revision: session.revision,
        },
        conversation: publicConversation(
          started.conversation,
          started.restarted,
          started.restartReason,
          messageCount,
        ),
        music,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return aiErrorResponse(error);
  }
}
