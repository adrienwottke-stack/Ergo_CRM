import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { berlinToday } from "@/lib/dates";
import Teamziele from "@/components/ziele/Teamziele";
import TeamzielFormular from "@/components/ziele/TeamzielFormular";
import { column, card } from "@/components/ui";
import SeitenKopf from "@/components/SeitenKopf";

export default async function TeamzielePage() {
  const user = await requireUser();
  const direkte = await prisma.user.count({
    where: {
      leaderId: user.id,
      deactivatedAt: null,
      passwordHash: { not: null },
    },
  });
  return (
    <div className={`${column} space-y-6`}>
      <SeitenKopf titel="Teamziele" zurueck={{ href: "/mannschaft", label: "Team" }} className="crm-page-head-with-tools" unterzeile="Was ihr gemeinsam schaffen wollt." />
      <Teamziele userId={user.id} verwalten />
      {direkte > 0 && (
        <section className={`${card} space-y-4 p-5`}>
          <h2 className="text-xl font-semibold">Ein Teamziel setzen</h2>
          <TeamzielFormular heute={berlinToday()} />
        </section>
      )}
      <p className="text-sm text-ink-muted">
        Ein Teamwechsel verändert, wessen Buchungen zum Teamziel zählen.
        Einheiten werden am Buchungstag berücksichtigt; Startbestände zählen
        nicht zum Wochen- oder Monatsziel.
      </p>
    </div>
  );
}
