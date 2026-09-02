// Lesende Probe fuer den Ausbau (docs/ausbau-plan.md, docs/adr/0007-die-bitte-
// um-ausbau.md). Schreibt nichts.
//
// Beantwortet drei Fragen, bevor die Schwellen als Vorschlag greifen:
//   1. Wie viele Konten wuerden die Schwellen 5 vereinbarte ODER 1 gehaltener
//      Termin am ersten Tag reissen? Sind es null, schlaegt die App niemandem
//      etwas vor und jede Freischaltung ist Handarbeit - dann ist die
//      Schwelle falsch kalibriert (gleiche Falle wie bei lib/stufen.ts, 25.08.).
//   2. Wer hat keine einloggbare Fuehrungskraft ueber sich? Der bekommt Ausbau 2
//      ohne Freischaltung - sonst wartete er auf jemanden, den es nicht gibt.
//   3. Wer fuehrt (Direkte mit Zugang) und bekommt die Mannschaft von selbst?
//
// Ergebnisse statt Anrufe (ADR-0007, Fassung 2 nach Nachpruefung 01.09.):
// gezaehlt wird APPOINTMENT_SET + APPOINTMENT_HELD, und die Schwelle ist
// gerissen, sobald EINE der beiden Zahlen ihre Grenze erreicht (ODER, nicht
// UND) - Anrufe messen nur, wer sie eintraegt.
//
// Bewusst OHNE die Bitte (User.bitteAm): die fragt erst ab der Migration
// 20260902120000_bitte etwas ab, und dieses Skript soll auch VOR ihrem Deploy
// laufen - derselbe Grund, aus dem lib/einstellungen.ts einen Faenger fuer die
// noch nicht deployte Migration hat.
//
// Schwellen als Argumente uebersteuerbar:  node scripts/ausbau-probe.mjs 10 1

import "dotenv/config";
import pg from "pg";

const VEREINBART = Number(process.argv[2] ?? 5);
const GEHALTEN = Number(process.argv[3] ?? 1);

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
         COALESCE(t."vereinbart", 0)::int AS vereinbart,
         COALESCE(t."gehalten", 0)::int   AS gehalten,
         COALESCE(d."direkte", 0)::int    AS direkte
    FROM "User" u
    LEFT JOIN (
      SELECT p."userId",
             SUM(CASE WHEN l."type" = 'APPOINTMENT_SET'  THEN l."count" ELSE 0 END) AS vereinbart,
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

function trifftSchwelle(r) {
  return r.vereinbart >= VEREINBART || r.gehalten >= GEHALTEN;
}

const mitZugang = rows.filter((r) => r.hat_zugang);
const platzhalter = rows.length - mitZugang.length;

const reissen = mitZugang.filter(trifftSchwelle);
const fuehren = mitZugang.filter((r) => r.direkte > 0);
const ohneFk = mitZugang.filter((r) => r.role !== "ADMIN" && naechsteFkOberhalb(r) === null);
const handarbeit = mitZugang.filter(
  (r) => r.role !== "ADMIN" && naechsteFkOberhalb(r) !== null && !trifftSchwelle(r),
);

console.log(`Schwellen: ${VEREINBART} Termine vereinbart ODER ${GEHALTEN} gehalten\n`);
console.log(`Konten aktiv:         ${rows.length}  (davon Platzhalter ohne Zugang: ${platzhalter})`);
console.log(`Mit Zugang:           ${mitZugang.length}`);
console.log(`Reissen die Schwelle: ${reissen.length}  -> stehen ab Tag 1 als Vorschlag bei ihrer FK`);
console.log(`Fuehren (Direkte>0):  ${fuehren.length}  -> Mannschaft geht von selbst auf`);
console.log(`Ohne einloggbare FK:  ${ohneFk.length}  -> starten direkt auf Ausbau 2\n`);

console.log("Je Kopf (vereinbart / gehalten / direkte / faellt auf):");
for (const r of mitZugang) {
  const fk = naechsteFkOberhalb(r);
  const trifft = trifftSchwelle(r);
  const wohin =
    r.role === "ADMIN"
      ? "2 (Admin)"
      : fk === null
        ? "2 (niemand darueber)"
        : trifft
          ? "1, Vorschlag sofort"
          : "1, wartet auf Handarbeit";
  console.log(
    `  ${r.name.padEnd(20)} ${String(r.vereinbart).padStart(4)} ${String(r.gehalten).padStart(3)} ` +
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
    console.log("Gegenprobe mit weicheren Werten:  node scripts/ausbau-probe.mjs 3 1");
  }
}

await client.end();
