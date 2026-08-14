import type { Contact } from "@/lib/generated/prisma/client";
import {
  ALL_NEXT_STEP_TYPES,
  CONTACT_STAGES,
  contactStageLabels,
  nextStepLabels,
} from "@/lib/pipeline";
import { utcToBerlinLocalInput } from "@/lib/dates";
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
      {contact && <input type="hidden" name="contactId" value={contact.id} />}
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
          <label htmlFor="stage" className={label}>
            Phase
          </label>
          <select
            id="stage"
            name="stage"
            defaultValue={contact?.stage ?? "NEU"}
            className={input}
          >
            {CONTACT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {contactStageLabels[stage]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="appointmentAt" className={label}>
            Termin
          </label>
          <input
            id="appointmentAt"
            name="appointmentAt"
            type="datetime-local"
            defaultValue={
              contact?.appointmentAt
                ? utcToBerlinLocalInput(contact.appointmentAt)
                : ""
            }
            className={input}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Pflicht für die Phasen „Termin vereinbart“ und „Checkup geplant“.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-[13px] font-semibold text-slate-900">Nächster Schritt</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Leer lassen: dann setzt das Playbook den passenden Schritt zur Phase.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nextStepType" className={label}>
              Was ist zu tun?
            </label>
            <select
              id="nextStepType"
              name="nextStepType"
              defaultValue={contact?.nextStepType ?? ""}
              className={input}
            >
              <option value="">Aus dem Playbook übernehmen</option>
              {ALL_NEXT_STEP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {nextStepLabels[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nextStepDate" className={label}>
              Fällig am
            </label>
            <input
              id="nextStepDate"
              name="nextStepDate"
              type="date"
              defaultValue={
                contact?.nextStepAt
                  ? contact.nextStepAt.toISOString().slice(0, 10)
                  : ""
              }
              className={input}
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="nextStepNote" className={label}>
            Notiz zum Schritt
          </label>
          <input
            id="nextStepNote"
            name="nextStepNote"
            type="text"
            defaultValue={contact?.nextStepNote ?? ""}
            className={input}
          />
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
