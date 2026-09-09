import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import ContactForm from "@/components/ContactForm";
import DeleteContactButton from "@/components/DeleteContactButton";
import { card, kicker, pageTitle, columnNarrow } from "@/components/ui";
import { updateContact } from "../../actions";
import { internerRueckweg } from "@/lib/rueckweg";

export default async function EditContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ zurueck?: string }>;
}) {
  const { id } = await params;
  const parameter = await searchParams;
  const rueckweg = internerRueckweg(parameter.zurueck, "/namen");
  const kontaktRueckweg = `/contacts/${id}?zurueck=${encodeURIComponent(rueckweg)}`;
  const user = await requireUser();
  const contact = await prisma.contact.findFirst({
    where: { id, ...eigene(user.id).kontakte },
    include: {
      _count: { select: { activities: true, referrals: true } },
    },
  });

  if (!contact) {
    notFound();
  }

  return (
    <div className={`${columnNarrow} space-y-6`}>
      <div>
        <Link
          href={kontaktRueckweg}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
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
        zurueck={rueckweg}
      />

      <section className={`${card} border-red-200/70 p-6`}>
        <p className={kicker}>Gefahrenzone</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-sm text-sm text-ink-muted">
            Kontakt mitsamt Aktivitäten entfernen. Nicht rückgängig zu
            machen.
          </p>
          <DeleteContactButton
            contactId={contact.id}
            contactName={contact.name}
            activityCount={contact._count.activities}
            referralCount={contact._count.referrals}
          />
        </div>
      </section>
    </div>
  );
}
