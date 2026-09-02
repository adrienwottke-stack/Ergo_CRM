"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { umhaengen } from "@/lib/struktur";
import { kontoAustragen, kontoLoeschen } from "@/lib/kontoLoeschen";
import { ablaufDatum, neuerCode } from "@/lib/einladung";
import { einladungZurueck } from "@/lib/einladung-ruecknahme";
import { neuerResetCode, resetAblauf } from "@/lib/passwort";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

// Einladungslink erzeugen. Ein Code, eine Nutzung, 14 Tage gueltig - der Neue
// setzt sein Passwort selbst, damit keine Startpasswoerter durchs Netzwerk
// wandern.
export async function einladungErzeugen(formData: FormData) {
  const admin = await requireAdmin();
  const note = value(formData, "note").slice(0, 80) || null;
  const leaderId = value(formData, "leaderId") || admin.id;

  const leader = await prisma.user.findUnique({
    where: { id: leaderId },
    select: { id: true },
  });
  if (!leader) redirect("/team?error=invalid");

  await prisma.invite.create({
    data: { code: neuerCode(), leaderId: leader.id, note, expiresAt: ablaufDatum() },
  });

  revalidatePath("/team");
  redirect("/team?invited=1");
}

// Nur noch nicht eingeloeste Einladungen lassen sich zuruecknehmen - eine
// verbrauchte zu loeschen wuerde die Herkunft des Kontos verwischen.
//
// Ein Platzhalter, der mit dieser Einladung entstanden ist, geht mit: siehe
// lib/einladung-ruecknahme.ts.
export async function einladungZuruecknehmen(formData: FormData) {
  await requireAdmin();
  const inviteId = value(formData, "inviteId");
  if (inviteId) {
    await einladungZurueck(inviteId);
  }
  revalidatePath("/team");
  revalidatePath("/einladen");
  revalidatePath("/mannschaft");
  redirect("/team?revoked=1");
}

// Der Notausgang aus der Installations-Schleuse (docs/willkommen-plan.md, 7.6).
// Normalerweise erscheint das Anmeldeformular erst, wenn die Einladungsseite
// vom Startbildschirm laeuft. Laesst sich ein Geraet partout nicht dazu
// bewegen, gibt der Einladende diese eine Einladung frei - bewusst ein
// einzelner Griff und danach hier sichtbar.
export async function einladungBrowserFreigabe(formData: FormData) {
  await requireAdmin();
  const inviteId = value(formData, "inviteId");
  if (inviteId) {
    await prisma.invite.updateMany({
      where: { id: inviteId },
      data: { browserFreigabe: value(formData, "on") === "1" },
    });
  }
  revalidatePath("/team");
  redirect("/team");
}

// Prisma meldet einen verletzten Eindeutigkeits-Index als P2002.
function isDuplicate(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

const NAME_MAX = 60;

// Der Name steht an zwei Stellen: User fuers Konto, Person fuer die
// Rangliste (siehe app/login/actions.ts). Beide muessen gleichzeitig
// korrigiert werden, sonst laufen Struktur und Rangliste auseinander -
// Person.name ist ausserdem eindeutig, ein Zusammenstoss bricht sauber ab.
export async function namenAendern(formData: FormData) {
  await requireAdmin();
  const userId = value(formData, "userId");
  const name = value(formData, "name").slice(0, NAME_MAX);
  if (!userId || !name) redirect("/team?error=invalid");

  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { name } }),
      prisma.person.updateMany({ where: { userId }, data: { name } }),
    ]);
  } catch (fehler) {
    if (isDuplicate(fehler)) redirect("/team?error=name_vergeben");
    throw fehler;
  }

  revalidatePath("/team");
  revalidatePath("/mannschaft");
  revalidatePath("/leaderboard");
  redirect("/team?umbenannt=1");
}

// Berater unter eine andere Fuehrungskraft haengen. Leere Auswahl macht ihn zur
// eigenen Wurzel.
export async function beraterUmhaengen(formData: FormData) {
  await requireAdmin();
  const userId = value(formData, "userId");
  const leaderIdRaw = value(formData, "leaderId");
  if (!userId) redirect("/team?error=invalid");

  const fehler = await umhaengen(userId, leaderIdRaw || null);
  if (fehler) redirect(`/team?error=${fehler}`);

  revalidatePath("/team");
  redirect("/team?moved=1");
}

// --- Konto austragen ---------------------------------------------------------
//
// Der Normalfall, wenn jemand aufhoert. Der Vorgang selbst steht in
// lib/kontoLoeschen.ts - er gehoert nicht mehr allein der Systemverwaltung,
// seit auch eine Fuehrungskraft ihre eigene Struktur aufraeumen darf.
export async function benutzerAustragen(formData: FormData) {
  const admin = await requireAdmin();
  const userId = value(formData, "userId");
  const wieder = value(formData, "wieder") === "1";
  if (!userId) redirect("/team?error=invalid");
  // Sich selbst austragen hiesse, sich selbst aus der Verwaltung aussperren.
  if (userId === admin.id) redirect("/team?error=sich_selbst");

  const fehler = await kontoAustragen(userId, wieder);
  if (fehler) redirect("/team?error=unbekannt");

  revalidatePath("/team");
  revalidatePath("/mannschaft");
  redirect(wieder ? "/team?zurueck=1" : "/team?ausgetragen=1");
}

// --- Konto endgueltig loeschen -----------------------------------------------
//
// Fuer Testkonten und Fehlgriffe, nicht fuer Austritte - dafuer gibt es
// "Austragen". Was mitgeht, steht im Bestaetigungsdialog; niemand soll
// hinterher ueberrascht sein. Der Vorgang selbst: lib/kontoLoeschen.ts.
export async function benutzerLoeschen(formData: FormData) {
  const admin = await requireAdmin();
  const userId = value(formData, "userId");
  if (!userId) redirect("/team?error=invalid");
  if (userId === admin.id) redirect("/team?error=sich_selbst");

  const fehler = await kontoLoeschen(userId);
  if (fehler) redirect("/team?error=unbekannt");

  revalidatePath("/team");
  revalidatePath("/mannschaft");
  revalidatePath("/leaderboard");
  redirect("/team?geloescht=1");
}

// --- Passwort neu setzen lassen ----------------------------------------------
//
// Der Admin erzeugt den Link, der Betroffene setzt sein Passwort selbst. Der
// Admin bekommt es nie zu sehen - ein Startpasswort, das durch fremde Haende
// geht, ist keins.
//
// Aeltere offene Links desselben Kontos werden entwertet: sonst haetten nach
// drei Anlaeufen drei Links Gueltigkeit, und der aelteste liegt in irgendeinem
// Chatverlauf.
export async function passwortResetErzeugen(formData: FormData) {
  await requireAdmin();
  const userId = value(formData, "userId");
  if (!userId) redirect("/team?error=invalid");

  const konto = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!konto) redirect("/team?error=unbekannt");
  // Ein Platzhalter hat noch kein Passwort - es gibt also keins
  // zurueckzusetzen. Sein Weg ins Konto ist die Einladung, und nur die: ein
  // Reset-Link wuerde daran vorbei ein Konto oeffnen, das nie jemandem
  // gehoert hat.
  if (!konto.passwordHash) redirect("/team?error=platzhalter");

  const code = neuerResetCode();
  await prisma.$transaction([
    prisma.passwortReset.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwortReset.create({
      data: { code, userId, expiresAt: resetAblauf() },
    }),
  ]);

  revalidatePath("/team");
  redirect(`/team?reset=${encodeURIComponent(code)}`);
}
