// Schalter und Zaehlstelle der Arena (docs/wettbewerb-plan.md, Abschnitt 14).
//
// Drei Regeln, die den Rest erklaeren:
//
// 1. Kein Baustein ohne Schluessel, Schalter und Zaehlstelle. Sonst stehen nach
//    drei Wochen zwanzig Funktionen da und Messwerte fuer sieben.
// 2. Fehlt die Zeile in der Tabelle, gilt der Baustein als AN. Ein vergessener
//    Datensatz darf niemals funktionierende Oberflaeche verstecken - am Abend
//    eines Starts erst recht nicht.
// 3. Die Messung zeigt nie auf eine Person. Gespeichert wird je Kopf, angezeigt
//    wird ausschliesslich die Summe ueber Koepfe.

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import type { FeatureState } from "@/lib/generated/prisma/enums";

export type ArenaKey =
  | "puls"
  | "zweikampf"
  | "kommentator"
  | "bestmarke"
  | "duell"
  | "sprint"
  | "werkstatt";

// Eine Abfrage je Anfrage, danach beantwortet der Cache alle weiteren Fragen.
export const featureStates = cache(async (): Promise<Map<string, FeatureState>> => {
  try {
    const rows = await prisma.feature.findMany({
      select: { key: true, state: true },
    });
    return new Map(rows.map((row) => [row.key, row.state]));
  } catch {
    // Steht die Tabelle noch nicht (erster Deploy, Migration unterwegs), laeuft
    // die Arena trotzdem. Ein Schalter, der die Seite abstuerzen laesst, ist
    // schlimmer als kein Schalter.
    return new Map();
  }
});

export async function istAn(key: ArenaKey): Promise<boolean> {
  const state = (await featureStates()).get(key);
  if (state === undefined) return true; // siehe Regel 2
  return state === "TEST" || state === "LAEUFT";
}

// Bequemer Sammelaufruf: ein Objekt mit allen Schaltern fuer eine Seite.
export async function schalter<K extends ArenaKey>(
  ...keys: K[]
): Promise<Record<K, boolean>> {
  const states = await featureStates();
  const out = {} as Record<K, boolean>;
  for (const key of keys) {
    const state = states.get(key);
    out[key] = state === undefined || state === "TEST" || state === "LAEUFT";
  }
  return out;
}

// Zaehlstelle. Schlaegt sie fehl, passiert nichts weiter - eine Messung darf
// nie die gemessene Sache kaputtmachen.
export async function merkeNutzung(key: ArenaKey, personId: string | null) {
  if (!personId) return;
  const day = dayToUtcDate(berlinToday());
  try {
    await prisma.featureUse.upsert({
      where: { featureKey_personId_day: { featureKey: key, personId, day } },
      create: { featureKey: key, personId, day, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    // bewusst still
  }
}
