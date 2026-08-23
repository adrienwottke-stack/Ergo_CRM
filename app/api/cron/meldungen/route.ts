import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import { SCHWELLEN } from "@/lib/signale";
import { NACHFUELL_SCHWELLE } from "@/lib/namelist";
import { pushEingerichtet, sendeMeldung } from "@/lib/push";

export const dynamic = "force-dynamic";

// Der taegliche Anstoss (docs/audit-kernmodell.md, 10.4 und 10.5).
//
// Bis hierhin war alles Erinnernde eine Holschuld. Die Fruehwarn-Ampel der
// Fuehrungskraft war fachlich stark und trotzdem wirkungslos: sie musste
// aufgerufen werden. Genau die Leute, die ein Signal ausloesen, rufen nichts
// auf.
//
// Zwei Meldungen, mehr nicht:
//   1. An den Berater: was heute auf ihn wartet.
//   2. An die Fuehrungskraft: wer heute still ist oder leer laeuft.
//
// HOECHSTENS EINE Meldung je Kopf und Lauf. Wer morgens drei Benachrichtigungen
// bekommt, schaltet sie ab - und dann ist auch die wichtige weg.

const TAG_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  // Vercel schickt den Cron mit diesem Kopf; von aussen ist der Endpunkt
  // damit nicht ausloesbar. Ohne gesetztes Geheimnis laeuft er gar nicht.
  const geheim = process.env.CRON_SECRET;
  const mitgebracht =
    request.headers.get("authorization") ??
    `Bearer ${request.nextUrl.searchParams.get("token") ?? ""}`;
  if (!geheim || mitgebracht !== `Bearer ${geheim}`) {
    return new NextResponse("Nicht erlaubt.", { status: 401 });
  }
  if (!pushEingerichtet()) {
    return NextResponse.json({ uebersprungen: "keine VAPID-Schluessel" });
  }

  const heute = berlinToday();
  const heuteStart = dayToUtcDate(heute);
  const stilleGrenze = new Date(Date.now() - SCHWELLEN.stilleTage * TAG_MS);

  const [konten, faellig, offeneNamen, aktivHeute] = await Promise.all([
    prisma.user.findMany({
      where: { deactivatedAt: null },
      select: { id: true, name: true, leaderId: true },
    }),
    // Offen und faellig: ueberfaellig plus heute.
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: {
        outcome: "OFFEN",
        nextStepType: { not: null },
        nextStepAt: { lt: new Date(heuteStart.getTime() + TAG_MS) },
      },
      _count: { _all: true },
    }),
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: {
        listKinds: { isEmpty: false },
        outcome: "OFFEN",
        stage: { in: ["NEU", "KONTAKTIERT"] },
      },
      _count: { _all: true },
    }),
    // Wer sich seit der Stille-Grenze ueberhaupt geruehrt hat.
    prisma.dailyLog.groupBy({
      by: ["personId"],
      where: { date: { gte: dayToUtcDate(berlinToday()) } },
      _count: { _all: true },
    }),
  ]);

  const personen = await prisma.person.findMany({
    where: { userId: { not: null } },
    select: { id: true, userId: true },
  });
  const userVonPerson = new Map(
    personen.filter((p) => p.userId).map((p) => [p.id, p.userId!])
  );
  const heuteAktiv = new Set(
    aktivHeute
      .map((zeile) => userVonPerson.get(zeile.personId))
      .filter((id): id is string => Boolean(id))
  );

  const faelligJe = new Map(
    faellig.map((zeile) => [zeile.ownerId ?? "", zeile._count._all ?? 0])
  );
  const namenJe = new Map(
    offeneNamen.map((zeile) => [zeile.ownerId ?? "", zeile._count._all ?? 0])
  );

  // Letzte Aktivitaet je Konto, fuer die Stille-Erkennung.
  const letzte = await prisma.dailyLog.groupBy({
    by: ["personId"],
    _max: { date: true },
  });
  const letzteJe = new Map<string, Date>();
  for (const zeile of letzte) {
    const userId = userVonPerson.get(zeile.personId);
    if (userId && zeile._max.date) letzteJe.set(userId, zeile._max.date);
  }

  // --- 1. An den Berater: was heute wartet ---------------------------------
  const anBerater: string[] = [];
  for (const konto of konten) {
    if (heuteAktiv.has(konto.id)) continue;
    const anzahl = faelligJe.get(konto.id) ?? 0;
    const namen = namenJe.get(konto.id) ?? 0;
    if (anzahl === 0 && namen >= NACHFUELL_SCHWELLE) continue;
    anBerater.push(konto.id);

    const meldung =
      anzahl > 0
        ? {
            titel: `${anzahl} ${anzahl === 1 ? "Schritt" : "Schritte"} heute`,
            text: "Überfällig und heute fällig. Der Reihe nach von oben.",
            url: "/heute",
            kennung: "tagespensum",
          }
        : {
            titel: "Deine Liste läuft leer",
            text: `Nur noch ${namen} offene Namen. Zehn Fragen, und du hast wieder welche.`,
            url: "/namen/sammeln",
            kennung: "tagespensum",
          };
    await sendeMeldung([konto.id], meldung);
  }

  // --- 2. An die Fuehrungskraft: wer sie heute braucht ----------------------
  const gefuehrte = new Map<string, string[]>();
  for (const konto of konten) {
    if (!konto.leaderId || konto.leaderId === konto.id) continue;
    const liste = gefuehrte.get(konto.leaderId) ?? [];
    liste.push(konto.id);
    gefuehrte.set(konto.leaderId, liste);
  }

  const nameVon = new Map(konten.map((konto) => [konto.id, konto.name]));
  let anFuehrung = 0;

  for (const [leaderId, mitglieder] of gefuehrte) {
    const auffaellig = mitglieder.filter((id) => {
      const zuletzt = letzteJe.get(id);
      const still = !zuletzt || zuletzt < stilleGrenze;
      const leer = (namenJe.get(id) ?? 0) < NACHFUELL_SCHWELLE;
      return still || leer;
    });
    if (auffaellig.length === 0) continue;

    const namen = auffaellig.map((id) => nameVon.get(id) ?? "Unbekannt");
    const zusammen =
      namen.length <= 2
        ? namen.join(" und ")
        : `${namen.slice(0, 2).join(", ")} und ${namen.length - 2} weitere`;

    await sendeMeldung([leaderId], {
      titel: `${zusammen} ${namen.length === 1 ? "braucht" : "brauchen"} dich`,
      // Der Schritt gehoert in die Meldung, nicht nur die Zahl: sonst ist es
      // eine Sorge ohne Griff.
      text: "Still oder ohne Nachschub. Anrufen — nicht nach Zahlen fragen.",
      url: "/mannschaft",
      kennung: "fruehwarnung",
    });
    anFuehrung += 1;
  }

  return NextResponse.json({
    berater: anBerater.length,
    fuehrung: anFuehrung,
  });
}
