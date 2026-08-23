"use server";

// Fuehrungsaufgaben: vornehmen, erledigen, verschieben.
//
// Die eine Regel, die hier hart durchgesetzt wird: eine Aufgabe entsteht NUR
// durch einen Tipp der Fuehrungskraft. docs/audit-kernmodell.md, Abschnitt 9,
// nennt automatisch aus Signalen erzeugte Aufgaben ausdruecklich als "bewusst
// nicht gebaut" - nach zwei Wochen haette man zweihundert davon und schaut nie
// wieder hin. Es gibt deshalb in der ganzen Anwendung keinen zweiten Weg, eine
// LeadershipTask anzulegen.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { strukturKonten } from "@/lib/struktur";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import { artFuerSignal, istFrist, tageFuerFrist } from "@/lib/fuehrungsaufgaben";

const TAG_MS = 24 * 60 * 60 * 1000;

function feld(formData: FormData, name: string): string {
  const wert = formData.get(name);
  return typeof wert === "string" ? wert.trim() : "";
}

function neuRechnen() {
  revalidatePath("/mannschaft");
  revalidatePath("/heute");
}

/**
 * Prueft, dass der Betrachter diese Person ueberhaupt fuehrt.
 *
 * Ohne das koennte jeder eine Aufgabe an jedes Konto haengen - und weil die
 * Aufgabe den Namen auf der Heute-Liste zeigt, waere das ein Weg, Namen aus
 * fremden Strukturen abzufragen.
 */
async function inMeinerStruktur(leaderId: string, memberId: string): Promise<boolean> {
  if (leaderId === memberId) return false;
  const konten = await strukturKonten(leaderId);
  return konten.includes(memberId);
}

/** „Ich kümmere mich" – der eine Tipp, der aus einem Signal eine Sache macht. */
export async function aufgabeVornehmen(formData: FormData) {
  const user = await requireUser();
  const memberId = feld(formData, "memberId");
  const fristRoh = feld(formData, "frist");
  const anlass = feld(formData, "anlass").slice(0, 200) || null;
  const notiz = feld(formData, "notiz").slice(0, 200) || null;
  if (!memberId) return;
  if (!(await inMeinerStruktur(user.id, memberId))) return;

  // Die Kette bleibt auch in der Aufgabe erhalten.
  //
  // Ohne das stuende bei Timo in drei Tagen "Anruf · Nick Ahrens" auf der
  // Heute-Liste - und er ruft Nick an, an Jonathan vorbei. Die Unterscheidung
  // zwischen einem Direkten und jemandem tiefer im Ast ist der einzige Grund,
  // warum drei Ebenen anders sind als zwei; sie darf nicht auf halbem Weg
  // verloren gehen.
  const betroffener = await prisma.user.findUnique({
    where: { id: memberId },
    select: { leaderId: true },
  });
  const dazwischen =
    betroffener?.leaderId && betroffener.leaderId !== user.id
      ? await prisma.user.findUnique({
          where: { id: betroffener.leaderId },
          select: { name: true },
        })
      : null;
  const kettenNotiz = dazwischen
    ? `Mit ${dazwischen.name.split(" ")[0]} besprechen, nicht daran vorbei.`
    : null;

  const tage = tageFuerFrist(istFrist(fristRoh) ? fristRoh : "drei");
  // Ende des Zieltages: eine Aufgabe „in 3 Tagen" ist an diesem Tag faellig,
  // nicht in dem Moment, in dem sie angelegt wurde.
  const faellig = new Date(
    dayToUtcDate(berlinToday()).getTime() + tage * TAG_MS + (TAG_MS - 1000)
  );

  // Nur eine offene Sache je Person. Ein zweiter Tipp verschiebt die Frist,
  // statt einen Stapel anzulegen.
  const vorhanden = await prisma.leadershipTask.findFirst({
    where: { leaderId: user.id, memberId, doneAt: null },
    select: { id: true },
  });
  if (vorhanden) {
    await prisma.leadershipTask.update({
      where: { id: vorhanden.id },
      data: { dueAt: faellig, ...(notiz ? { note: notiz } : {}) },
    });
  } else {
    await prisma.leadershipTask.create({
      data: {
        leaderId: user.id,
        memberId,
        // Bei jemandem tiefer im Ast ist die Aufgabe ein Gespraech mit der
        // Fuehrungskraft dazwischen, kein Anruf beim Betroffenen.
        type: dazwischen ? "EINS_ZU_EINS" : artFuerSignal(anlass),
        dueAt: faellig,
        signal: anlass,
        note: notiz ?? kettenNotiz,
      },
    });
  }
  neuRechnen();
}

/** Erledigt. Die Aufgabe verschwindet, das Signal steht wieder fuer sich. */
export async function aufgabeErledigt(formData: FormData) {
  const user = await requireUser();
  const id = feld(formData, "aufgabeId");
  if (!id) return;
  await prisma.leadershipTask.updateMany({
    where: { id, leaderId: user.id, doneAt: null },
    data: { doneAt: new Date() },
  });
  neuRechnen();
}

/** Nochmal Zeit geben, ohne die Sache aus den Augen zu verlieren. */
export async function aufgabeVerschieben(formData: FormData) {
  const user = await requireUser();
  const id = feld(formData, "aufgabeId");
  const fristRoh = feld(formData, "frist");
  if (!id) return;
  const tage = tageFuerFrist(istFrist(fristRoh) ? fristRoh : "drei");
  const faellig = new Date(
    dayToUtcDate(berlinToday()).getTime() + tage * TAG_MS + (TAG_MS - 1000)
  );
  await prisma.leadershipTask.updateMany({
    where: { id, leaderId: user.id, doneAt: null },
    data: { dueAt: faellig },
  });
  neuRechnen();
}
