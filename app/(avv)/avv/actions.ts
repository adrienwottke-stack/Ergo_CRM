"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserOhneAvv } from "@/lib/auth";
import { AVV_VERSION } from "@/lib/avv";
import { avvBestaetigungSenden } from "@/lib/avv/mail";

// Aus x-forwarded-for wird die ERSTE Adresse genommen: die Kette waechst nach
// rechts, links steht der Absender. Und sie wird geprueft, bevor sie in die
// INET-Spalte geht - eine kaputte Kopfzeile darf die Zustimmung nicht zum
// Absturz bringen. Im Zweifel lieber keine Adresse als kein Eintrag.
function ipAdresse(kopf: Headers): string | null {
  const roh =
    kopf.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    kopf.get("x-real-ip")?.trim() ||
    "";
  if (!roh) return null;

  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const v6 = /^[0-9a-fA-F:]+$/;
  if (v4.test(roh)) {
    return roh.split(".").every((n) => Number(n) <= 255) ? roh : null;
  }
  return v6.test(roh) && roh.includes(":") ? roh : null;
}

export async function avvAkzeptieren(formData: FormData) {
  const user = await requireUserOhneAvv();

  // Gate aus: kein Eintrag mit leerer Fassung. Der waere fuer immer da und
  // wuerde gegen nichts pruefen.
  if (!AVV_VERSION) redirect("/heute");

  // Der Haken wird serverseitig geprueft, nicht nur im Browser. Ein
  // deaktivierter Knopf ist Bedienkomfort, keine Absicherung.
  if (formData.get("avv") !== "on") redirect("/avv?fehler=haken");

  const kopf = await headers();

  // 1. SCHREIBEN. Das ist der rechtlich erhebliche Akt und er passiert zuerst.
  //    Der eindeutige Index faengt den Doppelklick ab; ein zweiter Versuch auf
  //    dieselbe Fassung ist kein Fehler, sondern schon erledigt.
  try {
    await prisma.avvAcceptance.create({
      data: {
        userId: user.id,
        avvVersion: AVV_VERSION,
        ipAddress: ipAdresse(kopf),
        userAgent: kopf.get("user-agent")?.slice(0, 1000) ?? null,
      },
    });
  } catch (fehler) {
    const code = (fehler as { code?: string }).code;
    if (code !== "P2002") throw fehler;
  }

  // 2. MAILEN. Bewusst DANACH und bewusst ohne Netz: der Vertrag ist
  //    geschlossen, sobald die Zeile steht. Faellt der Mailversand aus
  //    (Anbieter weg, Schluessel fehlt), darf das die Zustimmung nicht
  //    zurueckdrehen - sonst haengt ein rechtlicher Vorgang an einem
  //    fremden Dienst. Der Fehler wird protokolliert, nicht geworfen.
  await avvBestaetigungSenden(user).catch((fehler) => {
    console.error("AVV-Bestaetigung konnte nicht gesendet werden:", fehler);
  });

  redirect("/heute");
}
