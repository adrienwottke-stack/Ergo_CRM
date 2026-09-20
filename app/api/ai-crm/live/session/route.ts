import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiCrmConfig } from "@/lib/ai-crm/config";
import { claimAiUsage, requireAiEntitlement } from "@/lib/ai-crm/entitlement";
import { AiCrmError } from "@/lib/ai-crm/errors";
import { aiErrorResponse, sameOrigin } from "@/lib/ai-crm/http";
import { musicProviderForLive } from "@/lib/ai-crm/live-music";
import { endLiveSession, startLiveSession } from "@/lib/ai-crm/live-sessions";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    clientSessionId: z.uuid(),
    conversationId: z.string().trim().min(8).max(120).optional(),
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

function assertMockTransport() {
  const config = aiCrmConfig();
  if (config.liveProvider === "disabled") {
    throw new AiCrmError(
      "LIVE_NOT_AVAILABLE",
      "Live mit Jarvis ist in dieser Umgebung noch nicht eingerichtet.",
      503,
    );
  }
  if (config.liveProvider === "realtime") {
    if (!config.liveRealtimeApproved) {
      throw new AiCrmError(
        "LIVE_REALTIME_NOT_APPROVED",
        "Der echte Live-Betrieb ist noch nicht freigegeben.",
        503,
      );
    }
    if (!config.liveSidebandUrl) {
      throw new AiCrmError(
        "LIVE_SIDEBAND_REQUIRED",
        "Der echte Live-Betrieb ist noch nicht vollständig eingerichtet.",
        503,
      );
    }
    // Do not silently fall back to a browser-controlled tool path. A durable
    // trusted sideband service is required before any Realtime call is made.
    throw new AiCrmError(
      "LIVE_REALTIME_NOT_IMPLEMENTED",
      "Der echte Live-Betrieb ist noch nicht vollständig eingerichtet.",
      503,
    );
  }
  return config;
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
    const config = assertMockTransport();
    const now = new Date();
    await requireAiEntitlement(prisma, user.id, now, config);
    const started = await startLiveSession(prisma, {
      userId: user.id,
      provider: "mock",
      clientSessionId: parsed.data.clientSessionId,
      conversationId: parsed.data.conversationId,
      now,
      retentionDays: config.conversationRetentionDays,
      maxMessages: config.conversationMaxMessages,
      maxSessionSeconds: config.liveMaxSessionSeconds,
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
          data: { provider: "local-mock", model: "local-mock" },
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
    const music = await musicProviderForLive(prisma).state({
      userId: user.id,
      sessionId: session.id,
    });
    const messageCount = await prisma.aiConversationMessage.count({
      where: { conversationId: started.conversation.id },
    });
    return Response.json(
      {
        mode: "simulation",
        session: {
          id: session.id,
          expiresAt: session.expiresAt.toISOString(),
          reconnectLimit: config.liveReconnectLimit,
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
