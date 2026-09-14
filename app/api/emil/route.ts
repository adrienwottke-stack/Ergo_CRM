import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acknowledgeDemo, loadCoach } from "@/lib/coach/service";
import { isDemoId } from "@/lib/coach/model";

export const dynamic = "force-dynamic";

// Background guidance must not enqueue React router actions alongside real work.
export async function GET() {
  const user = await requireUser();
  return Response.json(await loadCoach(prisma, user.id), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return new Response("Nicht erlaubt.", { status: 403 });
  }
  const user = await requireUser();
  const body = await request.json().catch(() => null);
  if (!body || typeof body.demo !== "string" || !isDemoId(body.demo)) {
    return new Response("Unbekannte Erklärung.", { status: 400 });
  }
  await acknowledgeDemo(prisma, user.id, body.demo);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
