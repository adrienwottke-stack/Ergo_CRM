import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  addDays,
  berlinToday,
  dayToUtcDate,
  utcToBerlinLocalInput,
} from "@/lib/dates";
import FocusDialer from "@/components/FocusDialer";
import { pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const user = await requireUser();
  const sicht = eigene(user.id);
  const tomorrow = addDays(dayToUtcDate(berlinToday()), 1);

  // Anruf-Warteschlange: alles, was heute faellig ist, plus unberuehrte Neue.
  const queueContacts = await prisma.contact.findMany({
    where: {
      ...sicht.kontakte,
      outcome: "OFFEN",
      OR: [{ nextStepAt: { lt: tomorrow } }, { stage: "NEU" }],
    },
    orderBy: [{ nextStepAt: "asc" }, { updatedAt: "desc" }],
    include: { activities: { orderBy: { date: "desc" }, take: 3 } },
  });

  const queue = queueContacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    job: contact.job,
    source: contact.source,
    stage: contact.stage,
    outcome: contact.outcome,
    note: contact.note,
    appointmentLocal: contact.appointmentAt
      ? utcToBerlinLocalInput(contact.appointmentAt)
      : null,
    activities: contact.activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      text: activity.text,
      date: activity.date.toISOString(),
    })),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className={pageTitle}>🎯 Fokus-Modus (Anruftag)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Arbeite deine Tagesliste Schritt für Schritt effizient ab.
          </p>
        </div>
        <Link
          href="/heute"
          className="flex min-h-11 items-center text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ✕ Beenden
        </Link>
      </div>

      <FocusDialer queue={queue} />
    </div>
  );
}
