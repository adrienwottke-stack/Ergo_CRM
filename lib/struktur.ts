// Der Struktur-Baum: die einzige Stelle, an der "User.path" entsteht oder sich
// aendert. Wer den Pfad woanders schreibt, zerlegt still die Sichtbarkeit.
//
// Format: fuehrender und schliessender Schraegstrich, die eigene Id am Ende.
//   Wurzel      "/clx1/"
//   darunter    "/clx1/clx7/"
//
// Der schliessende Schraegstrich ist kein Schoenheitsfehler, sondern verhindert,
// dass "/clx1/" auch auf "/clx1abc/" passt. "Ich und alles unter mir" ist damit
// ein startsWith auf dem eigenen Pfad - der eigene Pfad ist sein eigener Praefix.
//
// Siehe docs/struktur-plan.md, Abschnitt 2.

import { prisma } from "@/lib/prisma";

/** Pfad eines Kontos, das unter `leaderPath` haengt. Ohne Fuehrungskraft: Wurzel. */
export function pfadUnter(leaderPath: string | null, userId: string): string {
  const basis = leaderPath && leaderPath.startsWith("/") ? leaderPath : "/";
  return `${basis}${userId}/`;
}

/** Liegt `pfad` im Ast von `wurzelPfad` (inklusive der Wurzel selbst)? */
export function liegtImAst(pfad: string, wurzelPfad: string): boolean {
  return pfad.startsWith(wurzelPfad);
}

/** Ebene im Baum: Wurzel = 0. */
export function ebene(pfad: string): number {
  return Math.max(0, pfad.split("/").filter(Boolean).length - 1);
}

/** Ich und alles unter mir, ueber alle Ebenen. Ausgetretene bleiben draussen. */
export async function strukturKonten(userId: string): Promise<string[]> {
  const ich = await prisma.user.findUnique({
    where: { id: userId },
    select: { path: true },
  });
  if (!ich || ich.path === "/") return [userId];

  const konten = await prisma.user.findMany({
    where: { path: { startsWith: ich.path }, deactivatedAt: null },
    select: { id: true },
  });
  // Der Betrachter bleibt drin, auch wenn er selbst deaktiviert ist.
  return konten.some((konto) => konto.id === userId)
    ? konten.map((konto) => konto.id)
    : [userId, ...konten.map((konto) => konto.id)];
}

/** Ich und meine direkt Unterstellten - eine Ebene, nicht der ganze Ast. */
export async function direkteKonten(userId: string): Promise<string[]> {
  const konten = await prisma.user.findMany({
    where: { leaderId: userId, deactivatedAt: null },
    select: { id: true },
  });
  return [userId, ...konten.map((konto) => konto.id)];
}

export type UmhaengenFehler =
  | "unbekannt"
  | "sich_selbst"
  | "eigener_ast"
  | null;

/**
 * Haengt ein Konto unter eine neue Fuehrungskraft und schreibt die Pfade des
 * gesamten Astes mit. Beides zusammen oder gar nicht.
 *
 * Der teure Teil ist das Nachziehen der Nachfahren. Prisma kann in updateMany
 * nicht auf dem alten Spaltenwert rechnen, deshalb ein einzelnes SQL: den alten
 * Praefix abschneiden, den neuen davorsetzen. Eine Anweisung fuer den ganzen Ast.
 */
export async function umhaengen(
  userId: string,
  neueLeaderId: string | null
): Promise<UmhaengenFehler> {
  if (neueLeaderId === userId) return "sich_selbst";

  const ich = await prisma.user.findUnique({
    where: { id: userId },
    select: { path: true },
  });
  if (!ich) return "unbekannt";

  let leaderPath: string | null = null;
  if (neueLeaderId) {
    const leader = await prisma.user.findUnique({
      where: { id: neueLeaderId },
      select: { path: true },
    });
    if (!leader) return "unbekannt";
    // Jemanden unter seinen eigenen Nachfahren einzuhaengen wuerde den Ast vom
    // Baum abtrennen und einen Kreis erzeugen, aus dem keine Abfrage mehr
    // herausfindet.
    if (liegtImAst(leader.path, ich.path)) return "eigener_ast";
    leaderPath = leader.path;
  }

  const alt = ich.path;
  const neu = pfadUnter(leaderPath, userId);
  if (alt === neu) {
    await prisma.user.update({
      where: { id: userId },
      data: { leaderId: neueLeaderId },
    });
    return null;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { leaderId: neueLeaderId },
    }),
    prisma.$executeRaw`
      UPDATE "User"
      SET "path" = ${neu} || substring("path", ${alt.length + 1})
      WHERE "path" LIKE ${`${alt}%`}
    `,
  ]);
  return null;
}
