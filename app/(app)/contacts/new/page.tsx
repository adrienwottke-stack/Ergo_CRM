import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import ContactForm from "@/components/ContactForm";
import { pageTitle, columnNarrow } from "@/components/ui";
import { createContact } from "../actions";

export default function NewContactPage() {
  return (
    <div className={`${columnNarrow} space-y-6`}>
      <div>
        <Link
          href="/namen"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zur Namensliste
        </Link>
        <h1 className={`${pageTitle} mt-2`}>Neuer Kontakt</h1>
      </div>
      <ContactForm action={createContact} submitLabel="Kontakt anlegen" />
    </div>
  );
}
