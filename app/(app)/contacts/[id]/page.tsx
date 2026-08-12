import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import type { ActivityType } from "@/lib/generated/prisma/enums";
import StatusBadge from "@/components/StatusBadge";
import { activityTypeLabels, allActivityTypes } from "@/lib/labels";
import {
  CalendarCheckIcon,
  ClipboardIcon,
  PhoneIcon,
} from "@/components/icons";
import {
  btnPrimary,
  btnSecondary,
  card,
  input,
  label,
  pageTitle,
  sectionTitle,
} from "@/components/ui";
import { createActivity } from "../actions";

const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});
const dateFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const className = "h-4 w-4";
  if (type === "CALL") return <PhoneIcon className={className} />;
  if (type === "MEETING") return <CalendarCheckIcon className={className} />;
  return <ClipboardIcon className={className} />;
}

const activityDotStyles: Record<ActivityType, string> = {
  CALL: "bg-blue-50 text-blue-600 ring-blue-600/15",
  MEETING: "bg-violet-50 text-violet-600 ring-violet-600/15",
  EMAIL: "bg-slate-100 text-slate-500 ring-slate-500/15",
};

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

  const todayDate = dayToUtcDate(berlinToday());

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/contacts"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Alle Kontakte
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-100 text-lg font-semibold text-navy-700">
              {initials(contact.name)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className={pageTitle}>{contact.name}</h1>
                <StatusBadge status={contact.status} />
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {contact.source ? `${contact.source} · ` : ""}
                Kontakt seit {dateFormat.format(contact.createdAt)}
              </p>
            </div>
          </div>
          <Link href={`/contacts/${contact.id}/edit`} className={btnSecondary}>
            Bearbeiten
          </Link>
        </div>
      </div>

      <div className={`${card} grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2 sm:p-8`}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Telefon
          </p>
          <p className="mt-1 text-sm text-slate-900">
            {contact.phone ? (
              <a
                href={`tel:${contact.phone}`}
                className="font-medium text-navy-600 hover:underline"
              >
                {contact.phone}
              </a>
            ) : (
              "–"
            )}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            E-Mail
          </p>
          <p className="mt-1 text-sm text-slate-900">
            {contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="font-medium text-navy-600 hover:underline"
              >
                {contact.email}
              </a>
            ) : (
              "–"
            )}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Quelle
          </p>
          <p className="mt-1 text-sm text-slate-900">{contact.source ?? "–"}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Zuletzt aktualisiert
          </p>
          <p className="mt-1 text-sm text-slate-900">
            {dateTimeFormat.format(contact.updatedAt)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Wiedervorlage
          </p>
          <p className="mt-1 text-sm text-slate-900">
            {contact.nextFollowUp ? (
              <>
                {dateFormat.format(contact.nextFollowUp)}
                {contact.nextFollowUp <= todayDate &&
                  contact.status !== "CLOSED" &&
                  contact.status !== "REJECTED" && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                      fällig
                    </span>
                  )}
              </>
            ) : (
              "–"
            )}
          </p>
        </div>
        {contact.note && (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Notiz
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {contact.note}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <h2 className={sectionTitle}>
          Aktivitäten{" "}
          <span className="font-normal text-slate-400">
            ({contact.activities.length})
          </span>
        </h2>

        <form
          action={createActivity}
          className={`${card} space-y-5 p-6 sm:p-8`}
        >
          <input type="hidden" name="contactId" value={contact.id} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className={label}>
                Typ
              </label>
              <select id="type" name="type" className={input}>
                {allActivityTypes.map((type) => (
                  <option key={type} value={type}>
                    {activityTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className={label}>
                Datum (leer = jetzt)
              </label>
              <input
                id="date"
                name="date"
                type="datetime-local"
                className={input}
              />
            </div>
          </div>
          <div>
            <label htmlFor="text" className={label}>
              Was ist passiert? *
            </label>
            <textarea
              id="text"
              name="text"
              rows={3}
              required
              placeholder="z. B. Telefonat: Interesse an Beratungstermin, meldet sich nächste Woche"
              className={input}
            />
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button type="submit" className={btnPrimary}>
              Aktivität speichern
            </button>
          </div>
        </form>

        {contact.activities.length === 0 ? (
          <div className={`${card} px-6 py-12 text-center`}>
            <p className="text-sm font-medium text-slate-900">
              Noch keine Aktivitäten
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Halte hier Anrufe, Meetings und E-Mails fest.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-0 pl-2">
            {contact.activities.map((activity, index) => (
              <li key={activity.id} className="relative flex gap-4 pb-6">
                {index < contact.activities.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-slate-200"
                  />
                )}
                <span
                  className={`relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${activityDotStyles[activity.type]}`}
                >
                  <ActivityIcon type={activity.type} />
                </span>
                <div className={`${card} flex-1 px-5 py-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-slate-900">
                      {activityTypeLabels[activity.type]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {dateTimeFormat.format(activity.date)}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {activity.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
