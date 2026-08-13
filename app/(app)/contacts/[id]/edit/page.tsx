import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import ContactForm from "@/components/ContactForm";
import { pageTitle } from "@/components/ui";
import { updateContact } from "../../actions";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const contact = await prisma.contact.findFirst({
    where: { id, ownerId: user.id },
  });

  if (!contact) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/contacts/${contact.id}`}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Zurück zu {contact.name}
        </Link>
        <h1 className={`${pageTitle} mt-2`}>Kontakt bearbeiten</h1>
      </div>
      <ContactForm
        action={updateContact}
        contact={contact}
        submitLabel="Änderungen speichern"
      />
    </div>
  );
}
