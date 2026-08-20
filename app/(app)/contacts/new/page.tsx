import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import ContactForm from "@/components/ContactForm";
import { pageTitle } from "@/components/ui";
import { createContact } from "../actions";

export default function NewContactPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Alle Kontakte
        </Link>
        <h1 className={`${pageTitle} mt-2`}>Neuer Kontakt</h1>
      </div>
      <ContactForm action={createContact} submitLabel="Kontakt anlegen" />
    </div>
  );
}
