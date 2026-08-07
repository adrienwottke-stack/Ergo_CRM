import type { Contact } from "@/lib/generated/prisma/client";
import { allContactStatuses, contactStatusLabels } from "@/lib/labels";

const inputClasses =
  "mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

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
    <form
      action={action}
      className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-stone-700"
        >
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={contact?.name ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-stone-700"
          >
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={contact?.phone ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-700"
          >
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={contact?.email ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="source"
            className="block text-sm font-medium text-stone-700"
          >
            Quelle
          </label>
          <input
            id="source"
            name="source"
            type="text"
            placeholder="z. B. Empfehlung, Messe, Bestandskunde"
            defaultValue={contact?.source ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-stone-700"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={contact?.status ?? "NEW"}
            className={inputClasses}
          >
            {allContactStatuses.map((status) => (
              <option key={status} value={status}>
                {contactStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="note"
          className="block text-sm font-medium text-stone-700"
        >
          Notiz
        </label>
        <textarea
          id="note"
          name="note"
          rows={4}
          defaultValue={contact?.note ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
