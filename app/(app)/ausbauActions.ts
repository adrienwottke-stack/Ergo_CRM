"use server";

// Die Bitte: der Betroffene darf um mehr Ausbau bitten
// (docs/adr/0007-die-bitte-um-ausbau.md). Eigene Datei, wie pushActions.ts
// und kontoActions.ts - ein Thema, eine Datei.
//
// Freigeben bleibt Sache der Fuehrungskraft oder des Admins (ausbauFreischalten
// in app/(app)/mannschaft/actions.ts, ausbauNachziehen in
// app/(team)/werkstatt/actions.ts) - diese Datei tut das NICHT. Sie setzt nur
// den Zeitstempel, den lib/ausbau.ts vorschlaegeFuer() danach mitliest.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AUSBAU_VOLL } from "@/lib/ausbauSicht";

/**
 * Setzt die Bitte fuer den eingeloggten Nutzer.
 *
 * NUR EINMAL UND NUR UNTERHALB VOLL: die Where-Klausel deckt beides ab - ein
 * zweiter Tipp auf "Ich bitte darum" aendert nichts, genau wie ausbauFreischalten
 * in app/(app)/mannschaft/actions.ts kein zweites Freischalten kennt. Keine
 * ID als Parameter: die Bitte gilt immer fuer sich selbst, nie fuer jemand
 * anderen.
 */
export async function bitten() {
  const user = await requireUser();

  await prisma.user.updateMany({
    where: { id: user.id, ausbau: { lt: AUSBAU_VOLL }, bitteAm: null },
    data: { bitteAm: new Date() },
  });

  revalidatePath("/mehr");
  revalidatePath("/heute");
  revalidatePath("/werkstatt");
}
