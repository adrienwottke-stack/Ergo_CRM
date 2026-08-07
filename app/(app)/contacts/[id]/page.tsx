import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import { activityTypeLabels, allActivityTypes } from "@/lib/labels";
import { createActivity } from "../actions";

const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const inputClasses =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { activities: { orderBy: { date: "desc" } } },
  });

  if (!contact) {
    notFound();
  }

  const createActivityForContact = createActivity.bind(null, contact.id);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/contacts"
            className="text-sm text-stone-500 hover:text-stone-900"
          >
            ← Alle Kontakte
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{contact.name}</h1>
            <StatusBadge status={contact.status} />
          </div>
        </div>
        <Link
          href={`/contacts/${contact.id}/edit`}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          Bearbeiten
        </Link>
      </div>

      <div className="grid gap-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">
            Telefon
          </p>
          <p className="mt-1 text-sm">{contact.phone ?? "–"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">
            E-Mail
          </p>
          <p className="mt-1 text-sm">{contact.email ?? "–"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">
            Quelle
          </p>
          <p className="mt-1 text-sm">{contact.source ?? "–"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">
            Angelegt / Aktualisiert
          </p>
          <p className="mt-1 text-sm">
            {dateTimeFormat.format(contact.createdAt)} /{" "}
            {dateTimeFormat.format(contact.updatedAt)}
          </p>
        </div>
        {contact.note && (
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-stone-500">
              Notiz
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{contact.note}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Aktivitäten ({contact.activities.length})
        </h2>

        <form
          action={createActivityForContact}
          className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-stone-700"
              >
                Typ
              </label>
              <select id="type" name="type" className={inputClasses}>
                {allActivityTypes.map((type) => (
                  <option key={type} value={type}>
                    {activityTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-stone-700"
              >
                Datum (leer = jetzt)
              </label>
              <input
                id="date"
                name="date"
                type="datetime-local"
                className={inputClasses}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="text"
              className="block text-sm font-medium text-stone-700"
            >
              Was ist passiert? *
            </label>
            <textarea
              id="text"
              name="text"
              rows={3}
              required
              placeholder="z. B. Telefonat: Interesse an Beratungstermin, meldet sich nächste Woche"
              className={inputClasses}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Aktivität speichern
            </button>
          </div>
        </form>

        {contact.activities.length === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
            Noch keine Aktivitäten für diesen Kontakt.
          </p>
        ) : (
          <ul className="space-y-3">
            {contact.activities.map((activity) => (
              <li
                key={activity.id}
                className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                    {activityTypeLabels[activity.type]}
                  </span>
                  <span className="text-xs text-stone-500">
                    {dateTimeFormat.format(activity.date)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {activity.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
