import { after } from "next/server";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { istAn, merkeNutzung } from "@/lib/features";
import { ladeZinsSzenarien } from "@/lib/zinsrechner-service";
import type { GespeichertesSzenario } from "@/lib/zinsrechner";
import Rechner from "@/components/zinsrechner/Rechner";

export const metadata = { title: "Zinsrechner · Cockpit" };
export const dynamic = "force-dynamic";
export default async function ZinsrechnerPage({
  searchParams,
}: {
  searchParams: Promise<{ kontakt?: string; szenario?: string }>;
}) {
  const user = await requireUser();
  if (!(await istAn("zinsrechner"))) notFound();
  const params = await searchParams;
  const contactId =
    typeof params.kontakt === "string" ? params.kontakt : undefined;
  const scenarioId =
    typeof params.szenario === "string" ? params.szenario : undefined;
  const contact = contactId
    ? await prisma.contact.findFirst({
        where: { id: contactId, ownerId: user.id },
        select: { id: true, name: true },
      })
    : null;
  if (contactId && !contact) notFound();
  let saved: GespeichertesSzenario[] = [],
    storageError = false;
  try {
    saved = await ladeZinsSzenarien(prisma, user.id);
  } catch {
    storageError = true;
  }
  const initial = scenarioId
    ? (saved.find((s) => s.id === scenarioId) ?? null)
    : null;
  if (scenarioId && !initial && !storageError) notFound();
  if (initial && contactId && initial.contactId !== contactId) notFound();
  after(async () => {
    const person = await prisma.person.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    await merkeNutzung("zinsrechner", person?.id ?? null);
  });
  return (
    <Rechner
      key={`${contactId ?? "frei"}:${scenarioId ?? "neu"}`}
      berater={{ name: user.name, phone: user.phone, email: user.email }}
      contact={contact}
      initial={initial}
      saved={saved}
      storageError={storageError}
    />
  );
}
