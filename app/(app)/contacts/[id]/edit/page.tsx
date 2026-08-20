import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import ContactForm from "@/components/ContactForm";
import DeleteContactButton from "@/components/DeleteContactButton";
import { card, kicker, pageTitle } from "@/components/ui";
import { updateContact } from "../../actions";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const contact = await prisma.contact.findFirst({
    where: { id, ...eigene(user.id).kontakte },
    include: {
      _count: { select: { activities: true, deals: true, referrals: true } },
    },
  });

  if (!contact) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/contacts/${contact.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zurück zu {contact.name}
        </Link>
        <h1 className={`${pageTitle} mt-2`}>Kontakt bearbeiten</h1>
      </div>
      <ContactForm
        action={updateContact}
        contact={contact}
        submitLabel="Änderungen speichern"
      />

      <section className={`${card} border-red-200/70 p-6`}>
        <p className={kicker}>Gefahrenzone</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-sm text-sm text-slate-600">
            Kontakt mitsamt Aktivitäten und Vorgängen entfernen. Nicht
            rückgängig zu machen.
          </p>
          <DeleteContactButton
            contactId={contact.id}
            contactName={contact.name}
            activityCount={contact._count.activities}
            dealCount={contact._count.deals}
            referralCount={contact._count.referrals}
          />
        </div>
      </section>
    </div>
  );
}
