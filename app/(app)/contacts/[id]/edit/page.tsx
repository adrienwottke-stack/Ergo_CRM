import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/ContactForm";
import { updateContact } from "../../actions";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({ where: { id } });

  if (!contact) {
    notFound();
  }

  const updateContactWithId = updateContact.bind(null, contact.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kontakt bearbeiten</h1>
        <Link
          href={`/contacts/${contact.id}`}
          className="text-sm text-stone-500 hover:text-stone-900"
        >
          Zurück zum Kontakt
        </Link>
      </div>
      <ContactForm
        action={updateContactWithId}
        contact={contact}
        submitLabel="Änderungen speichern"
      />
    </div>
  );
}
