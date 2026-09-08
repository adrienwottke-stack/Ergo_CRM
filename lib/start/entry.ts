import { prisma } from "@/lib/prisma";
import { startRoute } from "@/lib/start/model";
import { startOptions } from "@/lib/start/settings";

export async function entryRoute(userId: string) {
  if (!(await startOptions()).guidance) return "/heute";
  const state = await prisma.startProgress.findUnique({ where: { userId } });
  return startRoute(state);
}
