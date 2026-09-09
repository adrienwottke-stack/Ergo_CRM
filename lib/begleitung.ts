import { prisma } from "@/lib/prisma";

export type Begleitungswerte = {
  namen: number;
  nummern: number;
  anrufe: number;
  vereinbart: number;
  gehalten: number;
  abschluesse: number;
  einheiten: number;
  empfehlungGefragt: boolean;
};
export function begleitungsSchritte(w: Begleitungswerte) {
  const schritte = [
    {
      titel: "Ersten Namen aufnehmen",
      fertig: w.namen > 0,
      href: "/namen/sammeln",
    },
    {
      titel: "Eine Telefonnummer ergänzen",
      fertig: w.nummern > 0,
      href: "/namen/nummern",
    },
    {
      titel: "Ersten Anruf machen",
      fertig: w.anrufe > 0,
      href: "/namen/anrufen",
    },
    {
      titel: "Ersten Termin vereinbaren",
      fertig: w.vereinbart > 0,
      href: "/namen/anrufen",
    },
    {
      titel: "Ersten Termin halten und Ergebnis eintragen",
      fertig: w.gehalten > 0,
      href: "/kalender",
    },
    {
      titel: "Nach Empfehlungen fragen",
      fertig: w.empfehlungGefragt,
      href: "/heute?alle=1",
    },
  ];
  if (w.abschluesse > 0)
    schritte.push({
      titel: "Erste Einheiten eintragen",
      fertig: w.einheiten > 0,
      href: "/fortschritt/einheiten-offen",
    });
  return schritte;
}

export async function ladeBegleitungen(userIds: string[]) {
  const ids = [...new Set(userIds)];
  if (ids.length === 0)
    return new Map<string, ReturnType<typeof begleitungsSchritte>>();

  const [namen, nummern, gefragt, personen, logs, einheiten] =
    await Promise.all([
      prisma.contact.groupBy({
        by: ["ownerId"],
        where: { ownerId: { in: ids } },
        _count: { _all: true },
      }),
      prisma.contact.groupBy({
        by: ["ownerId"],
        where: { ownerId: { in: ids }, phone: { not: null } },
        _count: { _all: true },
      }),
      prisma.contact.groupBy({
        by: ["ownerId"],
        where: { ownerId: { in: ids }, referralsAskedAt: { not: null } },
        _count: { _all: true },
      }),
      prisma.person.findMany({
        where: { userId: { in: ids } },
        select: { id: true, userId: true },
      }),
      prisma.dailyLog.groupBy({
        by: ["personId", "type"],
        where: { person: { userId: { in: ids } } },
        _sum: { count: true },
      }),
      prisma.einheitenbuchung.groupBy({
        by: ["userId"],
        where: { userId: { in: ids } },
        _sum: { hundertstel: true },
      }),
    ]);

  const werte = new Map<string, Begleitungswerte>(
    ids.map((id) => [
      id,
      {
        namen: 0,
        nummern: 0,
        anrufe: 0,
        vereinbart: 0,
        gehalten: 0,
        abschluesse: 0,
        einheiten: 0,
        empfehlungGefragt: false,
      },
    ]),
  );
  for (const zeile of namen) {
    if (zeile.ownerId) werte.get(zeile.ownerId)!.namen = zeile._count._all;
  }
  for (const zeile of nummern) {
    if (zeile.ownerId) werte.get(zeile.ownerId)!.nummern = zeile._count._all;
  }
  for (const zeile of gefragt) {
    if (zeile.ownerId)
      werte.get(zeile.ownerId)!.empfehlungGefragt = zeile._count._all > 0;
  }
  const userIdVonPerson = new Map(
    personen.flatMap((person) =>
      person.userId ? [[person.id, person.userId] as const] : [],
    ),
  );
  for (const zeile of logs) {
    const userId = userIdVonPerson.get(zeile.personId);
    if (!userId) continue;
    const wert = zeile._sum.count ?? 0;
    const stand = werte.get(userId)!;
    if (zeile.type === "CALL") stand.anrufe = wert;
    if (zeile.type === "APPOINTMENT_SET") stand.vereinbart = wert;
    if (zeile.type === "APPOINTMENT_HELD") stand.gehalten = wert;
    if (zeile.type === "DEAL_WON") stand.abschluesse = wert;
  }
  for (const zeile of einheiten) {
    werte.get(zeile.userId)!.einheiten = zeile._sum.hundertstel ?? 0;
  }

  return new Map(
    ids.map((id) => [id, begleitungsSchritte(werte.get(id)!)] as const),
  );
}

export async function ladeBegleitung(userId: string) {
  return (await ladeBegleitungen([userId])).get(userId)!;
}
