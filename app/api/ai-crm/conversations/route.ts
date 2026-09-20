import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listConversations } from "@/lib/ai-crm/conversations";
import { aiErrorResponse } from "@/lib/ai-crm/http";
import { requireAiEntitlement } from "@/lib/ai-crm/entitlement";
import { aiCrmConfig } from "@/lib/ai-crm/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireAiEntitlement(prisma, user.id, new Date(), aiCrmConfig());
    const cursor = request ? new URL(request.url).searchParams.get("cursor") ?? undefined : undefined;
    if (cursor && !await prisma.aiConversation.findFirst({ where: { id: cursor, userId: user.id } })) return Response.json({ conversations: [], nextCursor: null }, { headers: { "Cache-Control": "no-store" } });
    const conversations = await listConversations(prisma, user.id, new Date(), cursor);
    return Response.json(
      {
        nextCursor: conversations.length === 10 ? conversations[9].id : null,
        conversations: conversations.map(({ _count, ...conversation }) => ({
          ...conversation,
          messageCount: _count.messages,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return aiErrorResponse(error);
  }
}
