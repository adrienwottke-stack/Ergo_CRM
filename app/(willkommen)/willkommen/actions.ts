"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import { berlinLocalToUtc, berlinToday, shiftDay, startOfWeek, utcToBerlinLocalInput } from "@/lib/dates";
import { isListKind } from "@/lib/namelist";
import { quotaTypePoints } from "@/lib/labels";

// --- Messen statt hoffen ------------------------------------------------------
// Je Akt ein Zeitstempel. Ohne das laesst sich am Montag nach dem Launch nie
// sagen, WO die Leute ausgestiegen sind. Fire-and-forget vom Client - ein
// verlorener Stempel ist egal, ein blockierter Ablauf nicht.
export async function aktErreicht(akt: string) {
  const user = await requireUser();
  const key = akt.slice(0, 24).replace(/[^a-zA-Z]/g, "");
  if (!key) return;

  const bisher =
    user.onboardingSteps && typeof user.onboardingSteps === "object"
      ? (user.onboardingSteps as Record<string, string>)
      : {};
  // Nur der erste Stempel je Akt zaehlt - sonst verfaelscht ein Wiederaufruf
  // des Ablaufs die Messung des ersten Durchlaufs.
  if (bisher[key]) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingSteps: { ...bisher, [key]: new Date().toISOString() },
      ...(user.onboardingStartedAt ? {} : { onboardingStartedAt: new Date() }),
    },
  });
}

// --- Die Weiche ---------------------------------------------------------------
export async function trackWaehlen(track: string) {
  const user = await requireUser();
  if (!isListKind(track)) return;
  await prisma.user.update({ where: { id: user.id }, data: { startTrack: track } });
}

// --- Der Brief an sich selbst -------------------------------------------------
export async function briefSpeichern(text: string) {
  const user = await requireUser();
  const inhalt = text.trim().slice(0, 2000);
  if (!inhalt) return;
  await prisma.user.update({
    where: { id: user.id },
    // Ein neuer Brief oeffnet den Rueckgabe-Moment wieder: wer den Ablauf
    // erneut durchlaeuft und neu schreibt, meint es neu.
    data: { whyLetter: inhalt, whyShownAt: null },
  });
}

// --- Das Foto -----------------------------------------------------------------
// Kommt als kleine, clientseitig verkleinerte JPEG-Data-URL (~10 KB). Die
// Grenze hier ist die zweite Verteidigungslinie, nicht die erste.
export async function fotoSpeichern(dataUrl: string) {
  const user = await requireUser();
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) return;
  if (dataUrl.length > 120_000) return;
  await prisma.user.update({ where: { id: user.id }, data: { photoDataUrl: dataUrl } });
  revalidatePath("/leaderboard");
}

// --- Das 30-Tage-Versprechen ---------------------------------------------------
export async function versprechenSetzen(termine: number) {
  const user = await requireUser();
  const ziel = Math.round(termine);
  if (!Number.isFinite(ziel) || ziel < 1 || ziel > 50) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { pledgeTarget: ziel, pledgeSetAt: new Date(), pledgeShownAt: null },
  });
  revalidatePath("/heute");
}

// --- Blitz-Einstufung ----------------------------------------------------------
// Der Sprint legt Namen ohne Naehe an. Diese Abfrage holt sie fuer die
// Einstufung zurueck - bewusst alle offenen ohne Naehe, nicht nur die aus dem
// Sprint: wer schon Namen hatte, stuft die gleich mit ein.
export async function offeneNamenOhneNaehe(): Promise<{ id: string; name: string }[]> {
  const user = await requireUser();
  return prisma.contact.findMany({
    where: {
      ...eigene(user.id).kontakte,
      listKinds: { isEmpty: false },
      rating: null,
      stage: { in: ["NEU", "KONTAKTIERT"] },
      outcome: { not: "VERLOREN" },
    },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

// --- Der erste Tag ist geplant --------------------------------------------------
// Das Onboarding endet nicht mit "viel Erfolg", sondern mit drei Anrufen, die
// heute Nachmittag in /heute stehen. Der Uebergang vom Start in die Arbeit ist
// die Stelle, an der die meisten verloren gehen - hier gibt es ihn nicht.
export async function ersterTagPlanen(): Promise<{ anzahl: number; label: string }> {
  const user = await requireUser();

  const kandidaten = await prisma.contact.findMany({
    where: {
      ...eigene(user.id).kontakte,
      listKinds: { isEmpty: false },
      stage: "NEU",
      outcome: "OFFEN",
      nextStepType: null,
    },
    select: { id: true },
    // A-Kontakte zuerst, dann die frischesten: der Sprint liegt Sekunden zurueck.
    orderBy: [{ rating: "asc" }, { createdAt: "desc" }],
    take: 3,
  });
  if (kandidaten.length === 0) return { anzahl: 0, label: "" };

  // Vor 15 Uhr Berliner Zeit: heute ab 16:00. Danach: morgen ab 10:00.
  const heute = berlinToday();
  const jetztLokal = utcToBerlinLocalInput(new Date());
  const nachmittags = jetztLokal.slice(11, 16) < "15:00";
  const tag = nachmittags ? heute : shiftDay(heute, 1);
  const startStunde = nachmittags ? 16 : 10;

  await prisma.$transaction(
    kandidaten.map((kontakt, index) =>
      prisma.contact.update({
        where: { id: kontakt.id },
        data: {
          nextStepType: "ANRUF",
          nextStepAt:
            berlinLocalToUtc(
              `${tag}T${String(startStunde).padStart(2, "0")}:${String(index * 15).padStart(2, "0")}`
            ) ?? undefined,
          nextStepNote: "Erster Anruf",
        },
      })
    )
  );

  revalidatePath("/heute");
  return {
    anzahl: kandidaten.length,
    label: nachmittags ? "heute ab 16:00" : "morgen ab 10:00",
  };
}

// --- Der Rangliste-Moment -------------------------------------------------------
// Wird NACH dem Sprint abgefragt, nicht beim Seitenaufruf: die Punkte aus dem
// Sprint sollen schon drinstehen, wenn die Rangliste hochfaehrt.
export type RanglisteMomentDaten = {
  eigenerRang: number;
  eigenePunkte: number;
  mitgliedNummer: number;
  spitze: { name: string; punkte: number; istIch: boolean }[];
};

export async function ranglisteDaten(): Promise<RanglisteMomentDaten> {
  const user = await requireUser();
  const wochenStart = startOfWeek(berlinToday());

  const [sums, persons, mitgliedNummer] = await Promise.all([
    prisma.dailyLog.groupBy({
      by: ["personId", "type"],
      where: { date: { gte: wochenStart } },
      _sum: { count: true },
    }),
    prisma.person.findMany({ select: { id: true, name: true, userId: true } }),
    prisma.user.count({ where: { createdAt: { lte: user.createdAt } } }),
  ]);

  const punkte = new Map<string, number>();
  for (const person of persons) punkte.set(person.id, 0);
  for (const sum of sums) {
    punkte.set(
      sum.personId,
      (punkte.get(sum.personId) ?? 0) +
        (sum._sum.count ?? 0) * quotaTypePoints[sum.type]
    );
  }

  const sortiert = persons
    .map((person) => ({
      name: person.name,
      punkte: punkte.get(person.id) ?? 0,
      istIch: person.userId === user.id,
    }))
    .sort((a, b) => b.punkte - a.punkte);

  const eigenerIndex = sortiert.findIndex((zeile) => zeile.istIch);
  // Die Spitze plus die eigene Zeile, falls sie nicht ohnehin drin ist.
  const spitze = sortiert.slice(0, 5);
  if (eigenerIndex >= 5) spitze.push(sortiert[eigenerIndex]!);

  return {
    eigenerRang: eigenerIndex < 0 ? sortiert.length : eigenerIndex + 1,
    eigenePunkte: eigenerIndex < 0 ? 0 : sortiert[eigenerIndex]!.punkte,
    mitgliedNummer,
    spitze,
  };
}

// --- Abschluss ------------------------------------------------------------------
export async function willkommenAbschliessen() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(user.onboardingDoneAt ? {} : { onboardingDoneAt: new Date() }),
      // Der Start endet in der einfachen Ansicht: drei Eintraege statt zehn.
      // Nur beim ersten Durchlauf - wer sich spaeter alles eingeblendet hat
      // und den Ablauf nochmal ansieht, verliert das nicht wieder.
      ...(user.onboardingDoneAt ? {} : { beginnerMode: true }),
    },
  });
  revalidatePath("/", "layout");
}
