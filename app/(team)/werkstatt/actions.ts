"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  KARRIERESTUFE_MAX,
  KARRIERESTUFE_MIN,
  parseEinheiten,
  schwellenSchluessel,
} from "@/lib/einheiten";
import { einstellungSetzen } from "@/lib/einstellungen";
import type { FeatureState } from "@/lib/generated/prisma/enums";

const zustaende: FeatureState[] = ["TEST", "LAEUFT", "AUS", "ABGERISSEN"];

// Der Schalter. Liegt beim Admin, nicht bei der Mehrheit: eine bindende
// Abstimmung wird zur Fessel, eine folgenlose wird nicht mehr benutzt. Wer
// gegen die Stimmen entscheidet, hinterlaesst einen Grund.
export async function schalten(formData: FormData) {
  await requireAdmin();
  const key = (formData.get("key") as string | null)?.trim();
  const state = (formData.get("state") as string | null)?.trim();
  const grund = (formData.get("grund") as string | null)?.trim() || null;
  if (!key || !state || !zustaende.includes(state as FeatureState)) return;

  await prisma.feature.update({
    where: { key },
    data: { state: state as FeatureState, grund },
  });

  revalidatePath("/werkstatt");
  revalidatePath("/arena");
  revalidatePath("/leaderboard");
  revalidatePath("/log");
}

// Emils Werte, ohne Deploy (docs/emil-feedback-plan.md, AP-07 und D4).
//
// EIN Formular fuer alle sechs Stufen und nicht sechs einzelne wie beim
// Schalter darueber: Emil schickt seine Liste am Stueck, und der Admin traegt
// sie am Stueck ein.
//
// Drei Festlegungen, die den Rest erklaeren:
//
// 1. LEERES FELD = KEINE SCHWELLE fuer diese Stufe. Das ist eine Aussage und
//    kein Versehen - fuer Stufe 2 aufwaerts gibt es bis heute keine Zahl, und
//    eine erfundene ist schlimmer als keine. Deshalb wird die Zeile geloescht
//    und nicht als "" gespeichert.
// 2. NUR EINE POSITIVE ZAHL IST EINE SCHWELLE. Die 0 waere keine Grenze,
//    sondern eine Division durch null im Fortschrittsbalken.
// 3. WAS KEINE ZAHL IST, LAESST DIE GESPEICHERTE ZEILE IN RUHE - weder
//    geloescht noch mit Muell ueberschrieben. Nach dem revalidatePath steht im
//    Feld wieder der gespeicherte Wert und nicht der Tippfehler: die Eingabe
//    verschwindet sichtbar, statt still uebernommen zu werden.
//
// Gelesen wird die Menge mit parseEinheiten - derselbe Weg wie jede andere
// Einheiten-Eingabe im Haus, also komma-sicher ("1.250,50") und mit derselben
// Obergrenze.
export async function schwellenSpeichern(formData: FormData) {
  await requireAdmin();

  for (let stufe = KARRIERESTUFE_MIN; stufe <= KARRIERESTUFE_MAX; stufe++) {
    const roh = formData.get(`schwelle-${stufe}`);
    if (typeof roh !== "string") continue;

    const schluessel = schwellenSchluessel(stufe);
    if (!roh.trim()) {
      await einstellungSetzen(schluessel, null);
      continue;
    }

    const hundertstel = parseEinheiten(roh);
    if (hundertstel === null || hundertstel <= 0) continue;
    await einstellungSetzen(schluessel, String(hundertstel));
  }

  revalidatePath("/werkstatt");
  revalidatePath("/einheiten");
  revalidatePath("/heute");
}
