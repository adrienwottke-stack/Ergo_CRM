import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import FocusDialer from "@/components/FocusDialer";
import { pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const user = await requireUser();
  const today = berlinToday();
  const todayDate = dayToUtcDate(today);

  // Load contacts that need attention today: due follow ups or new contacts without follow-up
  const queueContacts = await prisma.contact.findMany({
    where: {
      ownerId: user.id,
      status: { notIn: ["CLOSED", "REJECTED"] },
      OR: [
        { nextFollowUp: { lte: todayDate } },
        { status: "NEW" },
      ],
    },
    orderBy: [
      { nextFollowUp: "asc" },
      { updatedAt: "desc" },
    ],
    include: {
      activities: {
        orderBy: { date: "desc" },
        take: 3,
      },
    },
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={pageTitle}>🎯 Fokus-Modus (Anruftag)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Arbeite deine Tagesliste Schritt für Schritt effizient ab.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          ✕ Beenden
        </Link>
      </div>

      <FocusDialer queue={queueContacts} />
    </div>
  );
}
