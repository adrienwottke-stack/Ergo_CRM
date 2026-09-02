"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  FOKUS_PROZENTSATZ_SCHLUESSEL,
  KARRIERESTUFE_MAX,
  KARRIERESTUFE_MIN,
  parseEinheiten,
  schwellenSchluessel,
} from "@/lib/einheiten";
import { einstellungSetzen, ganzzahl } from "@/lib/einstellungen";
import { AMPEL_FELDER } from "@/lib/ampelKriterien";
import { AUSBAU_VOLL } from "@/lib/ausbauSicht";
import { STUFEN, STUFEN_TITEL_SCHLUESSEL } from "@/lib/stufen";
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

// Der Fokus-Prozentsatz der Einheitenaufteilung (docs/emil-feedback-plan.md,
// AP-06 und D4). Emils Satz: "Einheitenaufteilung, eine Struktur erfuellt die
// 50%, damit du siehst, wo der Fokus drauf liegt" - die 50 sind der
// angenommene Default (Plan, Abschnitt 7, Punkt 2), bis Emil seine eigene
// Zahl schickt.
//
// EIN Feld statt einer Reihe wie beim Schwellen-Formular oben: es gibt nur
// einen Prozentsatz, keinen je Karrierestufe.
//
// Ein leeres Feld heisst hier NICHT "keine Pruefung mehr" (anders als eine
// leere Schwelle oben) - fuer den Fokus-Marker gibt es keinen sinnvollen
// "aus"-Zustand, nur einen Prozentsatz. Leer und Uebernehmen loescht die
// Zeile und faellt auf den Platzhalter (50 %) zurueck.
// Emils Ampel-Kriterien, ohne Deploy (docs/emil-feedback-plan.md, D4 und
// Abschnitt 7, Punkt 4). Dieselben drei Festlegungen wie beim
// Schwellen-Formular oben: leeres Feld loescht die Zeile (zurueck auf den
// Platzhalter aus lib/signale.ts), nur eine Zahl im Sinnbereich wird
// gespeichert, und was keine ist, laesst die gespeicherte Zeile in Ruhe.
export async function ampelKriterienSpeichern(formData: FormData) {
  await requireAdmin();

  for (const eintrag of AMPEL_FELDER) {
    const roh = formData.get(`ampel-${eintrag.feld}`);
    if (typeof roh !== "string") continue;

    if (!roh.trim()) {
      await einstellungSetzen(eintrag.schluessel, null);
      continue;
    }

    const zahl = ganzzahl(roh);
    if (zahl === null) continue;
    if (eintrag.prozent) {
      if (zahl < 1 || zahl > 100) continue;
    } else if (zahl < (eintrag.nullErlaubt ? 0 : 1)) {
      continue;
    }
    await einstellungSetzen(eintrag.schluessel, String(zahl));
  }

  revalidatePath("/werkstatt");
  revalidatePath("/mannschaft");
  revalidatePath("/heute");
}

export async function fokusProzentsatzSpeichern(formData: FormData) {
  await requireAdmin();

  const roh = formData.get("fokus-prozentsatz");
  if (typeof roh !== "string") return;

  if (!roh.trim()) {
    await einstellungSetzen(FOKUS_PROZENTSATZ_SCHLUESSEL, null);
    revalidatePath("/werkstatt");
    revalidatePath("/mannschaft");
    return;
  }

  // Nur eine ganze Zahl zwischen 1 und 100 ist ein Prozentsatz - alles
  // andere laesst den gespeicherten Wert in Ruhe, statt ihn mit Muell zu
  // ueberschreiben (dieselbe Regel wie bei den Schwellen oben).
  const prozent = ganzzahl(roh);
  if (prozent === null || prozent <= 0 || prozent > 100) return;
  await einstellungSetzen(FOKUS_PROZENTSATZ_SCHLUESSEL, String(prozent));

  revalidatePath("/werkstatt");
  revalidatePath("/mannschaft");
}

/**
 * Der Notausgang der Ausbau-Mechanik (docs/ausbau-plan.md, Abschnitt 3).
 *
 * Freischalten ist Sache der Fuehrungskraft. Der Admin sammelt nach, wo sie
 * nicht reagiert - sonst haengt jemand an der Passivitaet eines anderen fest.
 * Ohne diesen Knopf waere die Migration, die alle auf Ausbau 1 setzt, eine
 * Einbahnstrasse in eine Warteschlange.
 *
 * Ein Konto oder alle: ohne "userId" gehen alle wartenden auf. Beides derselbe
 * Weg, damit es nicht zwei Fassungen derselben Regel gibt.
 *
 * NUR AUFWAERTS - das `lt: AUSBAU_VOLL` im Filter ist die Regel, kein
 * Wettlauf-Schutz. Platzhalter bleiben aussen vor: sie koennen sich nie
 * anmelden, und wird spaeter ein echtes Konto daraus, soll die Freischaltung
 * DANN entschieden werden.
 */
export async function ausbauNachziehen(formData: FormData) {
  const admin = await requireAdmin();
  const einzeln = formData.get("userId");

  await prisma.user.updateMany({
    where: {
      ausbau: { lt: AUSBAU_VOLL },
      deactivatedAt: null,
      passwordHash: { not: null },
      ...(typeof einzeln === "string" && einzeln ? { id: einzeln } : {}),
    },
    data: {
      ausbau: AUSBAU_VOLL,
      ausbauGesetztVon: admin.id,
      ausbauGesetztAm: new Date(),
    },
  });

  revalidatePath("/werkstatt");
  revalidatePath("/heute");
}

/**
 * Die sechs Stufennamen (docs/emil-feedback-runde-2.md, AP-25 und D18).
 *
 * Direkter Aufruf aus einer Client-Insel statt eines <form action> wie beim
 * Rest der Werkstatt: die drei Vorschlags-Knoepfe brauchen ohnehin Zustand
 * im Browser, und ein leeres Feld soll als Fehlertext sichtbar werden statt
 * nur die alte Zeile stehen zu lassen - Hausmuster wie bei einheitenBuchen()
 * in app/(team)/einheiten/actions.ts: awaiten, `.ok` pruefen, Zustand von
 * Hand setzen.
 *
 * Alle sechs oder keiner: eine Luecke waere eine Stufe ohne Namen, und das
 * ist kein Zustand, den Arena oder /spiel darstellen koennen.
 */
export async function stufenTitelSpeichern(
  titelRoh: string[]
): Promise<{ ok: true } | { ok: false; fehler: string }> {
  await requireAdmin();

  const titel = titelRoh.map((name) => name.trim());
  if (titel.length !== STUFEN.length || titel.some((name) => name.length === 0)) {
    return {
      ok: false,
      fehler: `Genau ${STUFEN.length} Namen, keiner davon leer.`,
    };
  }

  await einstellungSetzen(STUFEN_TITEL_SCHLUESSEL, JSON.stringify(titel));

  revalidatePath("/werkstatt");
  revalidatePath("/arena");
  revalidatePath("/spiel");
  return { ok: true };
}
