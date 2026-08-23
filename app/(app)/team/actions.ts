"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { umhaengen } from "@/lib/struktur";
import { ablaufDatum, neuerCode } from "@/lib/einladung";
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
export async function einladungZuruecknehmen(formData: FormData) {
  await requireAdmin();
  const inviteId = value(formData, "inviteId");
  if (inviteId) {
    await prisma.invite.deleteMany({ where: { id: inviteId, usedCount: 0 } });
  }
  revalidatePath("/team");
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
// Der Normalfall, wenn jemand aufhoert. Das Konto bleibt im Baum stehen, damit
// die Historie stimmt - wer sechs Monate lang Termine gemacht hat, soll nicht
// rueckwirkend nie existiert haben. Es zaehlt nur in keiner laufenden
// Auswertung mehr mit und kann sich nicht mehr anmelden.
export async function benutzerAustragen(formData: FormData) {
  const admin = await requireAdmin();
  const userId = value(formData, "userId");
  const wieder = value(formData, "wieder") === "1";
  if (!userId) redirect("/team?error=invalid");
  // Sich selbst austragen hiesse, sich selbst aus der Verwaltung aussperren.
  if (userId === admin.id) redirect("/team?error=sich_selbst");

  const { count } = await prisma.user.updateMany({
    where: { id: userId },
    data: { deactivatedAt: wieder ? null : new Date() },
  });
  if (count === 0) redirect("/team?error=unbekannt");

  // Sitzungen sind signierte Cookies ohne Gegenstueck in der Datenbank - sie
  // laufen von selbst ab. Was sofort greift: Push-Meldungen hoeren auf.
  if (!wieder) {
    await prisma.pushAbo.deleteMany({ where: { userId } });
  }

  revalidatePath("/team");
  revalidatePath("/mannschaft");
  redirect(wieder ? "/team?zurueck=1" : "/team?ausgetragen=1");
}

// --- Konto endgueltig loeschen -----------------------------------------------
//
// Fuer Testkonten und Fehlgriffe, nicht fuer Austritte - dafuer gibt es
// "Austragen". Was hier mitgeht, steht im Bestaetigungsdialog; niemand soll
// hinterher ueberrascht sein.
//
// Der heikle Teil ist der Baum: "User.path" ist ein materialisierter Pfad. Wer
// eine Fuehrungskraft einfach loescht, laesst ihre Leute mit einem Pfad
// zurueck, der auf ein Konto zeigt, das es nicht mehr gibt - und ab da findet
// keine Sichtbarkeitsabfrage sie mehr. Deshalb ruecken die Direkten ZUERST
// eine Ebene hoch, mitsamt ihren eigenen Aesten.
export async function benutzerLoeschen(formData: FormData) {
  const admin = await requireAdmin();
  const userId = value(formData, "userId");
  if (!userId) redirect("/team?error=invalid");
  if (userId === admin.id) redirect("/team?error=sich_selbst");

  const konto = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, leaderId: true },
  });
  if (!konto) redirect("/team?error=unbekannt");

  // Erst umhaengen, dann loeschen. Bricht etwas dazwischen ab, steht der Baum
  // trotzdem richtig - nur das Konto ist noch da.
  const direkte = await prisma.user.findMany({
    where: { leaderId: userId },
    select: { id: true },
  });
  for (const kind of direkte) {
    await umhaengen(kind.id, konto.leaderId);
  }

  await prisma.$transaction([
    // Die privaten Kontakte gehen mit. Sie haetten sonst keinen Eigentuemer
    // mehr und waeren in keiner Ansicht je wieder sichtbar - Daten, die nur
    // noch Platz belegen.
    prisma.contact.deleteMany({ where: { ownerId: userId } }),
    // Das Ranglistenprofil mitsamt seinen Zaehlern. Ohne das bliebe ein Name
    // in der Rangliste stehen, hinter dem kein Konto mehr steckt.
    prisma.person.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

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
    select: { id: true },
  });
  if (!konto) redirect("/team?error=unbekannt");

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
