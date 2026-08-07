import ContactForm from "@/components/ContactForm";
import { createContact } from "../actions";

export default function NewContactPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Neuer Kontakt</h1>
      <ContactForm action={createContact} submitLabel="Kontakt anlegen" />
    </div>
  );
}
