// Ausbau: wie viel vom Werkzeug fuer eine Person offen ist
// (docs/ausbau-plan.md, docs/adr/0005-ausbau-durch-die-fuehrungskraft.md).
//
// Hier steht der Teil, der die DATENBANK braucht. Die Regeln selbst - welche
// Adresse zu welchem Bereich gehoert und wer sie sehen darf - liegen in
// lib/ausbauSicht.ts, weil der Wegweiser sie im Browser braucht und Prisma
// dort nicht hingehoert.
//
// Nicht verwechseln mit "Aufbau" (CONTEXT.md): dort waechst die STRUKTUR, hier
// waechst das WERKZEUG.
//
// Zwei Regeln, die den Rest erklaeren:
//
// 1. NUR AUFWAERTS. Was offen ist, bleibt offen. Gleiche Regel wie in
//    lib/stufen.ts ("eine Stufe soll monoton sein"): jemandem wegzunehmen, was
//    er gestern benutzt hat, ist der schnellste Weg, ihn zu verlieren.
// 2. KEIN WORT IN DER OBERFLAECHE. "Ausbau" steht nirgends auf dem Bildschirm,
//    es gibt keinen Zaehler und keinen Fortschrittsbalken. Die App spricht
//    ueber ihn an genau einer Stelle: in dem Moment, in dem etwas aufgeht. Eine
//    vierte Zahl neben Stufe, Karrierestufe und Platz wuerde den Start weiter
//    aufladen - und genau der ist das Problem.

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { einstellungen, ganzzahl } from "@/lib/einstellungen";
import { AUSBAU_ANFANG, AUSBAU_VOLL, type Ausbaustand } from "@/lib/ausbauSicht";

export {
  AUSBAU_ANFANG,
  AUSBAU_VOLL,
  bereichVon,
  titelVon,
  darfSehen,
  sperreFuer,
  sperrgrund,
  type Ausbaustand,
  type Bereich,
} from "@/lib/ausbauSicht";

/** Ab hier schlaegt die App der Fuehrungskraft vor freizuschalten. */
export const SCHWELLEN_PLATZHALTER = { anrufe: 20, termine: 3 } as const;

// --- Der Stand einer Person --------------------------------------------------

/**
 * Ausbau und Fuehrung fuer ein Konto.
 *
 * `fuehrt` wird bei JEDEM Aufruf gezaehlt statt mitgefuehrt: ein gespeichertes
 * Flag muesste bei jedem Umhaengen fortgeschrieben werden und stuende ab dem
 * ersten verpassten Fall dauerhaft falsch da (dieselbe Begruendung wie bei der
 * Team-Summe, docs/einheiten-plan.md Abschnitt 10).
 *
 * PLATZHALTER ZAEHLEN MIT. Das ist die Zaehlung, die /heute fuer das Lagebild
 * schon immer benutzt (leaderId, nicht deaktiviert) und die hinter dem
 * _count.team in lib/fuehrung.ts steht - und sie ist die richtige: wer zwei
 * Leute eingeladen hat, die noch nicht angenommen haben, BAUT ein Team, und
 * /mannschaft ist der Ort, an dem er sie aufnimmt und ihnen die Einladung
 * schickt. Zaehlte man hier nur einloggbare Konten, zeigte /heute das Lagebild
 * samt Links auf eine Seite, die die Leiste gar nicht mehr fuehrt - genau das
 * ist beim ersten Durchlauf am 30.08. passiert.
 *
 * Die andere Richtung ist eine andere Frage: WER FREISCHALTET, muss sich
 * anmelden koennen. Dort wird der Platzhalter sehr wohl uebersprungen, siehe
 * naechsteFkOberhalb weiter unten.
 *
 * cache(): eine Abfrage je Anfrage. Die Schale, der Waechter und die Seite
 * fragen nacheinander dasselbe.
 */
// Der gecachte Kern. Schluessel sind PRIMITIVE, nicht das User-Objekt:
// React cache() vergleicht die Argumente mit ===, und Layout und Seite laden
// den Benutzer je einmal frisch (requireOnboardedUser bzw. requireUser rufen
// beide currentUser auf). Mit dem Objekt als Schluessel lief die Zaehlung
// deshalb zweimal je Aufruf von /heute.
const standFuer = cache(
  async (
    userId: string,
    role: string,
    ausbau: number,
  ): Promise<Ausbaustand> => {
    const direkte = await prisma.user
      .count({ where: { leaderId: userId, deactivatedAt: null } })
      .catch(() => 0);

    return { stufe: ausbau, fuehrt: direkte > 0, istAdmin: role === "ADMIN" };
  },
);

export function ausbaustand(user: {
  id: string;
  role: string;
  ausbau?: number | null;
}): Promise<Ausbaustand> {
  // ?? AUSBAU_ANFANG ist reine Typ-Absicherung, KEIN Schutz gegen eine noch
  // nicht gefahrene Migration: fehlt die Spalte, scheitert schon
  // currentUser() (prisma.user.findUnique liest alle Skalarfelder) und damit
  // jede angemeldete Seite. Migration also vor dem Deploy fahren.
  return standFuer(user.id, user.role, user.ausbau ?? AUSBAU_ANFANG);
}

// --- Wer freischalten darf ---------------------------------------------------

/**
 * Die naechste EINLOGGBARE Fuehrungskraft oberhalb im Pfad.
 *
 * Platzhalter werden uebersprungen: ein Konto ohne Passwort kann sich nie
 * anmelden und damit nie jemanden freischalten. Genau dieser Fall entsteht ueber
 * Invite.fuerId regelmaessig - jemand haengt unter einem Knoten, den es als
 * Menschen noch gar nicht gibt.
 *
 * null heisst "niemand darueber". Wer dort steht, braucht keine Freischaltung
 * (die Migration setzt ihn auf 2) - er wartete sonst auf jemanden, den es nicht
 * gibt.
 *
 * Die Pfad-Lesart ist die aus lib/struktur.ts: Segmente zwischen den
 * Schraegstrichen, die eigene Id zuletzt.
 */
export async function naechsteFkOberhalb(
  pfad: string,
  eigeneId: string,
): Promise<{ id: string; name: string } | null> {
  const segmente = pfad.split("/").filter(Boolean);
  const oberhalb = segmente.slice(0, -1).filter((id) => id !== eigeneId);
  if (oberhalb.length === 0) return null;

  const konten = await prisma.user.findMany({
    where: {
      id: { in: oberhalb },
      deactivatedAt: null,
      passwordHash: { not: null },
    },
    select: { id: true, name: true },
  });
  if (konten.length === 0) return null;

  // Von unten nach oben: die naechste, nicht die oberste. Wer direkt darueber
  // steht, kennt den Menschen; der Chef vier Ebenen hoeher nicht.
  const jeId = new Map(konten.map((k) => [k.id, k]));
  for (let i = oberhalb.length - 1; i >= 0; i -= 1) {
    const treffer = jeId.get(oberhalb[i]!);
    if (treffer) return treffer;
  }
  return null;
}

// --- Der Vorschlag -----------------------------------------------------------

export type Schwellen = { anrufe: number; termine: number };

/** Die zwei Schwellen aus der Werkstatt, sonst die Platzhalter. */
export async function schwellen(): Promise<Schwellen> {
  const werte = await einstellungen();
  if (werte === null) return { ...SCHWELLEN_PLATZHALTER };
  return {
    anrufe: ganzzahl(werte.get("ausbau.anrufe")) ?? SCHWELLEN_PLATZHALTER.anrufe,
    termine:
      ganzzahl(werte.get("ausbau.termine")) ?? SCHWELLEN_PLATZHALTER.termine,
  };
}

export type Vorschlag = {
  userId: string;
  name: string;
  anrufe: number;
  gehalten: number;
  /** Der Grund, so wie er der Fuehrungskraft danebensteht. */
  grund: string;
};

/**
 * Wen diese Fuehrungskraft heute freischalten koennte.
 *
 * GERECHNET, NICHT GESPEICHERT. Es gibt heute keinen Erzeuger fuer
 * LeadershipTask - die einzige create-Stelle ist die Fuehrungskraft selbst
 * (app/(app)/mannschaft/actions.ts). Ein gespeicherter Vorschlag muesste beim
 * Freischalten, beim Umhaengen und beim Deaktivieren aufgeraeumt werden;
 * gerechnet verschwindet er von selbst, sobald ausbau === 2 steht.
 *
 * Gezaehlt wird ueber die GESAMTE Zeit, nicht ueber die Woche: die Rangliste
 * faengt montags bei null an, der Ausbau darf das nicht - sonst haenge der
 * Vorschlag vom Wochentag ab.
 */
export async function vorschlaegeFuer(leaderId: string): Promise<Vorschlag[]> {
  // EINE Abfrage statt zwei: die Direkten und ihr Ausbaustand kommen zusammen.
  // Vorher stand daneben noch ein eigenes findMany auf /heute - das war die
  // vierte Runde derselben Frage auf derselben Seite.
  const [konten, grenzen] = await Promise.all([
    prisma.user.findMany({
      where: {
        leaderId,
        ausbau: { lt: AUSBAU_VOLL },
        deactivatedAt: null,
        passwordHash: { not: null },
      },
      select: { id: true, name: true, person: { select: { id: true } } },
    }),
    schwellen(),
  ]);
  if (konten.length === 0) return [];

  const personIds = konten
    .map((k) => k.person?.id)
    .filter((id): id is string => Boolean(id));
  if (personIds.length === 0) return [];

  const summen = await prisma.dailyLog.groupBy({
    by: ["personId", "type"],
    where: {
      personId: { in: personIds },
      type: { in: ["CALL", "APPOINTMENT_HELD"] },
    },
    _sum: { count: true },
  });

  const jePerson = new Map<string, { anrufe: number; gehalten: number }>();
  for (const zeile of summen) {
    const stand = jePerson.get(zeile.personId) ?? { anrufe: 0, gehalten: 0 };
    const wert = zeile._sum.count ?? 0;
    if (zeile.type === "CALL") stand.anrufe += wert;
    else stand.gehalten += wert;
    jePerson.set(zeile.personId, stand);
  }

  const offen: Vorschlag[] = [];
  for (const konto of konten) {
    const personId = konto.person?.id;
    if (!personId) continue;
    const stand = jePerson.get(personId) ?? { anrufe: 0, gehalten: 0 };
    if (stand.anrufe < grenzen.anrufe || stand.gehalten < grenzen.termine) {
      continue;
    }
    offen.push({
      userId: konto.id,
      name: konto.name,
      anrufe: stand.anrufe,
      gehalten: stand.gehalten,
      grund: stand.anrufe + " Anrufe, " + stand.gehalten + " gehaltene Termine",
    });
  }
  return offen;
}
