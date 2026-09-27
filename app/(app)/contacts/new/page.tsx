import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import ContactForm from "@/components/ContactForm";
import { pageTitle, columnNarrow } from "@/components/ui";
import { createContact } from "../actions";

export default async function NewContactPage({ searchParams }: { searchParams: Promise<{ liste?: string }> }) {
  const listKind = (await searchParams).liste === "RECRUITING" ? "RECRUITING" : "VERKAUF";
  return (
    <div className={`${columnNarrow} space-y-6`}>
      <div>
        <Link
          href={`/namen?liste=${listKind}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zur Namensliste
        </Link>
        <h1 className={`${pageTitle} mt-2`}>Neuer Kontakt</h1>
      </div>
      <ContactForm action={createContact} listKind={listKind} returnTo={`/namen?liste=${listKind}`} submitLabel="Kontakt anlegen" />
    </div>
  );
}
