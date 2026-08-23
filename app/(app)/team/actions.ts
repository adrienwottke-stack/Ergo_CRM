"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { umhaengen } from "@/lib/struktur";
import { ablaufDatum, neuerCode } from "@/lib/einladung";

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
