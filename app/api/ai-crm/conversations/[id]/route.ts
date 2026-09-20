import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteConversation,
} from "@/lib/ai-crm/conversations";
import { aiErrorResponse, sameOrigin } from "@/lib/ai-crm/http";
import { AiCrmError } from "@/lib/ai-crm/errors";
import { requireAiEntitlement } from "@/lib/ai-crm/entitlement";
import { aiCrmConfig } from "@/lib/ai-crm/config";
import { conversationView } from "@/lib/ai-crm/presentation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireAiEntitlement(prisma, user.id, new Date(), aiCrmConfig());
    const { id } = await params;
    const conversation = await conversationView(prisma, user.id, id);
    return Response.json(conversation, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    if (!sameOrigin(request)) {
      throw new AiCrmError("ORIGIN_DENIED", "Nicht erlaubt.", 403);
    }
    const user = await requireUser();
    await requireAiEntitlement(prisma, user.id, new Date(), aiCrmConfig());
    const { id } = await params;
    await deleteConversation(prisma, user.id, id);
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
