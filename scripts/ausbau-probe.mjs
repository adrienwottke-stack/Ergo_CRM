// Lesende Probe fuer den Ausbau (docs/ausbau-plan.md). Schreibt nichts.
//
// Beantwortet drei Fragen, bevor die Migration laeuft:
//   1. Wie viele Konten wuerden die Schwellen 20 Anrufe / 3 gehaltene Termine
//      am ersten Tag reissen? Sind es null, schlaegt die App niemandem etwas
//      vor und jede Freischaltung ist Handarbeit - dann ist die Schwelle
//      falsch kalibriert (gleiche Falle wie bei lib/stufen.ts, 25.08.).
//   2. Wer hat keine einloggbare Fuehrungskraft ueber sich? Der bekommt Ausbau 2
//      ohne Freischaltung - sonst wartete er auf jemanden, den es nicht gibt.
//   3. Wer fuehrt (Direkte mit Zugang) und bekommt die Mannschaft von selbst?
//
// Schwellen als Argumente uebersteuerbar:  node scripts/ausbau-probe.mjs 10 1

import "dotenv/config";
import pg from "pg";

const ANRUFE = Number(process.argv[2] ?? 20);
const GEHALTEN = Number(process.argv[3] ?? 3);

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL/DATABASE_URL fehlt.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows } = await client.query(`
  SELECT u."id", u."name", u."path", u."role",
         (u."passwordHash" IS NOT NULL) AS hat_zugang,
         COALESCE(t."anrufe", 0)::int    AS anrufe,
         COALESCE(t."gehalten", 0)::int  AS gehalten,
         COALESCE(d."direkte", 0)::int   AS direkte
    FROM "User" u
    LEFT JOIN (
      SELECT p."userId",
             SUM(CASE WHEN l."type" = 'CALL'             THEN l."count" ELSE 0 END) AS anrufe,
             SUM(CASE WHEN l."type" = 'APPOINTMENT_HELD' THEN l."count" ELSE 0 END) AS gehalten
        FROM "DailyLog" l
        JOIN "Person" p ON p."id" = l."personId"
       WHERE p."userId" IS NOT NULL
       GROUP BY p."userId"
    ) t ON t."userId" = u."id"
    LEFT JOIN (
      SELECT k."leaderId", COUNT(*) AS direkte
        FROM "User" k
       WHERE k."leaderId" IS NOT NULL
         AND k."deactivatedAt" IS NULL
         AND k."passwordHash" IS NOT NULL
       GROUP BY k."leaderId"
    ) d ON d."leaderId" = u."id"
   WHERE u."deactivatedAt" IS NULL
   ORDER BY u."path"
`);

const jeId = new Map(rows.map((r) => [r.id, r]));

// Die naechste einloggbare Fuehrungskraft oberhalb, Platzhalter uebersprungen.
// Gleiche Lesart wie lib/struktur.ts: Segmente des Pfades, eigene id zuletzt.
function naechsteFkOberhalb(person) {
  const segmente = person.path.split("/").filter(Boolean);
  for (let i = segmente.length - 2; i >= 0; i -= 1) {
    const oben = jeId.get(segmente[i]);
    if (oben && oben.hat_zugang) return oben;
  }
  return null;
}

const mitZugang = rows.filter((r) => r.hat_zugang);
const platzhalter = rows.length - mitZugang.length;

const reissen = mitZugang.filter((r) => r.anrufe >= ANRUFE && r.gehalten >= GEHALTEN);
const fuehren = mitZugang.filter((r) => r.direkte > 0);
const ohneFk = mitZugang.filter((r) => r.role !== "ADMIN" && naechsteFkOberhalb(r) === null);
const handarbeit = mitZugang.filter(
  (r) =>
    r.role !== "ADMIN" &&
    naechsteFkOberhalb(r) !== null &&
    !(r.anrufe >= ANRUFE && r.gehalten >= GEHALTEN),
);

console.log(`Schwellen: ${ANRUFE} Anrufe UND ${GEHALTEN} gehaltene Termine\n`);
console.log(`Konten aktiv:         ${rows.length}  (davon Platzhalter ohne Zugang: ${platzhalter})`);
console.log(`Mit Zugang:           ${mitZugang.length}`);
console.log(`Reissen die Schwelle: ${reissen.length}  -> stehen ab Tag 1 als Vorschlag bei ihrer FK`);
console.log(`Fuehren (Direkte>0):  ${fuehren.length}  -> Mannschaft geht von selbst auf`);
console.log(`Ohne einloggbare FK:  ${ohneFk.length}  -> starten direkt auf Ausbau 2\n`);

console.log("Je Kopf (Anrufe / gehalten / direkte / faellt auf):");
for (const r of mitZugang) {
  const fk = naechsteFkOberhalb(r);
  const trifft = r.anrufe >= ANRUFE && r.gehalten >= GEHALTEN;
  const wohin =
    r.role === "ADMIN"
      ? "2 (Admin)"
      : fk === null
        ? "2 (niemand darueber)"
        : trifft
          ? "1, Vorschlag sofort"
          : "1, wartet auf Handarbeit";
  console.log(
    `  ${r.name.padEnd(20)} ${String(r.anrufe).padStart(4)} ${String(r.gehalten).padStart(3)} ` +
      `${String(r.direkte).padStart(3)}   ${wohin}` +
      (r.role !== "ADMIN" && fk ? `   FK: ${fk.name}` : ""),
  );
}

if (handarbeit.length > 0) {
  console.log(
    `\nWarnung: ${handarbeit.length} von ${mitZugang.length} Konten stehen auf Ausbau 1, ohne dass die App`,
  );
  console.log("ihrer Fuehrungskraft etwas vorschlaegt - jede Freischaltung ist Handarbeit.");
  if (reissen.length === 0) {
    console.log("Kein einziger Vorschlag: die Schwelle ist zu hoch fuer den heutigen Bestand.");
    console.log("Gegenprobe mit weicheren Werten:  node scripts/ausbau-probe.mjs 10 1");
  }
}

await client.end();
