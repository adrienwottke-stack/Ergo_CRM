import type { Contact } from "@/lib/generated/prisma/client";
import { allContactStatuses, contactStatusLabels } from "@/lib/labels";
import { btnPrimary, card, input, label } from "@/components/ui";
import NoteTemplates from "@/components/NoteTemplates";

export default function ContactForm({
  action,
  contact,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  contact?: Contact;
  submitLabel: string;
}) {
  return (
    <form action={action} className={`${card} space-y-5 p-6 sm:p-8`}>
      {contact && (
        <input type="hidden" name="contactId" value={contact.id} />
      )}
      <div>
        <label htmlFor="name" className={label}>
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Vor- und Nachname"
          defaultValue={contact?.name ?? ""}
          className={input}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={label}>
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+49 …"
            defaultValue={contact?.phone ?? ""}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="email" className={label}>
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="name@beispiel.de"
            defaultValue={contact?.email ?? ""}
            className={input}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="source" className={label}>
            Quelle
          </label>
          <input
            id="source"
            name="source"
            type="text"
            placeholder="z. B. Empfehlung, Messe, Bestandskunde"
            defaultValue={contact?.source ?? ""}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="status" className={label}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={contact?.status ?? "NEW"}
            className={input}
          >
            {allContactStatuses.map((status) => (
              <option key={status} value={status}>
                {contactStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nextFollowUp" className={label}>
            Wiedervorlage
          </label>
          <input
            id="nextFollowUp"
            name="nextFollowUp"
            type="date"
            defaultValue={
              contact?.nextFollowUp
                ? contact.nextFollowUp.toISOString().slice(0, 10)
                : ""
            }
            className={input}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            {"Ab diesem Tag erscheint der Kontakt im Dashboard unter „Heute dran“."}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="note" className={label}>
          Notiz
        </label>
        <textarea
          id="note"
          name="note"
          rows={4}
          placeholder="Gesprächsnotizen, Besonderheiten, nächste Schritte …"
          defaultValue={contact?.note ?? ""}
          className={input}
        />
        <NoteTemplates targetInputId="note" />
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button type="submit" className={btnPrimary}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
