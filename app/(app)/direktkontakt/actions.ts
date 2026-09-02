"use server";

// Der Schreibpfad des Direktkontakttrichters (AP-21).
//
// ACHTUNG: hier darf KEINE Konstante stehen. Eine "use server"-Datei darf
// ausschliesslich async Funktionen exportieren; eine Zeile daneben bricht den
// Produktionsbau - und nur den, tsc und eslint sehen die Regel nicht. Alles
// Feste liegt in lib/direktkontakt.ts.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import { istAn, merkeNutzung } from "@/lib/features";
import { istDirektkontaktStufe } from "@/lib/direktkontakt";

/**
 * Eine Stufe hoch- oder herunterzaehlen - immer fuer den eigenen Tag.
 *
 * NIEMALS FUER JEMAND ANDEREN. Es gibt keinen Parameter dafuer: der Besitzer
 * ist die angemeldete Person, Punkt. Der Trichter ist ein Werkzeug fuer die
 * eigene Strasse, keine Fremdbuchung.
 *
 * Das Minus ist KEIN Loeschen, sondern ein Dekrement mit Boden bei null: der
 * Knopf faengt den Vertipper ab, mehr soll er nicht. Der Boden sitzt in der
 * WHERE-Bedingung und nicht im Javascript davor - zwei Daumen kurz
 * hintereinander duerfen nicht unter null rutschen.
 *
 * Zurueck kommt der wahre Tagesstand, damit die optimistische Zahl im Browser
 * sich korrigieren kann (Muster quickLog, app/(team)/log/quickLogAction.ts).
 * null heisst: nichts gebucht - abgeschaltet, unbekannte Stufe, oder die
 * Tabelle steht noch nicht.
 */
export async function zaehlen(
  stufe: string,
  delta: number
): Promise<number | null> {
  const user = await requireUser();
  if (!istDirektkontaktStufe(stufe)) return null;
  if (delta !== 1 && delta !== -1) return null;
  // Der Schalter sitzt an der Seite UND hier: AUS heisst, es wird nichts mehr
  // gebucht (Muster app/anfrage/actions.ts).
  if (!(await istAn("direktkontakt"))) return null;

  const tag = dayToUtcDate(berlinToday());

  try {
    if (delta === 1) {
      await prisma.direktkontaktTag.upsert({
        where: { ownerId_tag_stufe: { ownerId: user.id, tag, stufe } },
        create: { ownerId: user.id, tag, stufe, anzahl: 1 },
        update: { anzahl: { increment: 1 } },
      });
    } else {
      await prisma.direktkontaktTag.updateMany({
        where: { ownerId: user.id, tag, stufe, anzahl: { gt: 0 } },
        data: { anzahl: { decrement: 1 } },
      });
    }
  } catch {
    // Steht die Tabelle noch nicht (Migration unterwegs), passiert nichts -
    // die Seite bleibt stehen statt abzustuerzen.
    return null;
  }

  // Die Zaehlstelle. Sie haengt an der Person, die Zaehler am Konto - deshalb
  // der eigene Nachschlag statt requireUserPerson(): ein Konto ohne
  // Teamprofil soll zaehlen duerfen, es wird dann eben nicht gemessen
  // (Muster app/wegweiserAction.ts).
  const person = await prisma.person
    .findUnique({ where: { userId: user.id }, select: { id: true } })
    .catch(() => null);
  await merkeNutzung("direktkontakt", person?.id ?? null);

  revalidatePath("/direktkontakt");

  const zeile = await prisma.direktkontaktTag
    .findUnique({
      where: { ownerId_tag_stufe: { ownerId: user.id, tag, stufe } },
      select: { anzahl: true },
    })
    .catch(() => null);
  return zeile?.anzahl ?? 0;
}
