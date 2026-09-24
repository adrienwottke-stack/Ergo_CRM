import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAiEntitlement } from "@/lib/ai-crm/entitlement";
import { AiCrmError } from "@/lib/ai-crm/errors";
import { aiErrorResponse, sameOrigin } from "@/lib/ai-crm/http";
import { requireLiveSession } from "@/lib/ai-crm/live-sessions";
import { livePublicConfig, renderGreeting, sendProviderUpdate } from "@/lib/ai-crm/live-provider";
import { aiCrmConfig } from "@/lib/ai-crm/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ sessionId: string }> };
const clips = new Map<string, { expiresAt: number; data: Promise<ArrayBuffer> }>();
const audioHeaders = { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" };

async function scope(request: Request, context: Context) {
  if (!sameOrigin(request)) throw new AiCrmError("ORIGIN_DENIED", "Nicht erlaubt.", 403);
  const user = await requireUser();
  const config = aiCrmConfig();
  await requireAiEntitlement(prisma, user.id, new Date(), config);
  const { sessionId } = await context.params;
  const session = await requireLiveSession(prisma, { userId: user.id, sessionId });
  return { user, config, session };
}

/** The browser invokes this after its first completed utterance, while remote
 * Live audio is muted. A durable claim survives reconnect and remount. */
export async function POST(request: Request, context: Context) {
  try {
    const { user, config, session } = await scope(request, context);
    const body = z.object({ replay: z.boolean().optional() }).strict().safeParse(await request.json().catch(() => null));
    if (!body.success) throw new AiCrmError("INVALID_REQUEST", "Die Begrüßung konnte nicht gestartet werden.", 400);
    if (session.provider !== "live" || !config.liveDemoEnabled) throw new AiCrmError("LIVE_INTRO_UNAVAILABLE", "Der Vorführmodus ist für diese Sprachrunde nicht aktiv.", 409);
    for (const [key, value] of clips) if (value.expiresAt <= Date.now()) clips.delete(key);
    const key = `${user.id}:${session.id}`;
    if (body.data.replay) {
      const cached = clips.get(key);
      if (session.introState !== "PLAYING" || !cached) throw new AiCrmError("LIVE_INTRO_REPLAY_UNAVAILABLE", "Der Begrüßungsclip ist nicht mehr im Speicher. Es wird keine zweite Begrüßung automatisch gestartet.", 409);
      return new Response(await cached.data, { headers: audioHeaders });
    }
    const claimed = await prisma.aiLiveSession.updateMany({ where: { id: session.id, userId: user.id, activeKey: user.id, introState: "WAITING" }, data: { introState: "PLAYING" } });
    if (!claimed.count) throw new AiCrmError("LIVE_INTRO_ALREADY_CLAIMED", "Die Begrüßung wurde in dieser Runde bereits gestartet.", 409);
    const data = renderGreeting(livePublicConfig(user.name, config).greetingText);
    clips.set(key, { expiresAt: session.expiresAt.getTime(), data });
    try {
      const bytes = await data;
      return new Response(bytes, { headers: audioHeaders });
    } catch {
      clips.delete(key);
      await prisma.aiLiveSession.updateMany({ where: { id: session.id, userId: user.id, introState: "PLAYING" }, data: { introState: "WAITING" } });
      throw new AiCrmError("LIVE_INTRO_AUDIO_FAILED", "Der Begrüßungsclip konnte nicht erzeugt werden. Du kannst den Start bewusst wiederholen.", 502);
    }
  } catch (error) { return aiErrorResponse(error); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { user, session } = await scope(request, context);
    const body = z.object({ state: z.enum(["OFFERED", "DONE"]) }).strict().safeParse(await request.json().catch(() => null));
    if (!body.success) throw new AiCrmError("INVALID_REQUEST", "Der Begrüßungsstatus ist ungültig.", 400);
    const from = body.data.state === "OFFERED" ? ["PLAYING", "OFFERED"] : ["WAITING", "PLAYING", "OFFERED", "DONE"];
    const updated = await prisma.aiLiveSession.updateMany({ where: { id: session.id, userId: user.id, activeKey: user.id, introState: { in: from } }, data: { introState: body.data.state } });
    if (!updated.count) throw new AiCrmError("LIVE_INTRO_STATE_CHANGED", "Die Begrüßung wurde bereits abgeschlossen.", 409);
    if (body.data.state === "DONE" && session.providerSessionRef) {
      await sendProviderUpdate(session.providerSessionRef, "Die Anwendung hat das Intro beendet. Keine weitere Begrüßung oder Musikfrage. Höre jetzt normal zu und delegiere alle CRM-Fragen. Wiedergabe und Musikzustand steuert allein die Anwendung.", { instruction: true });
    }
    return Response.json({ introState: body.data.state }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return aiErrorResponse(error); }
}
