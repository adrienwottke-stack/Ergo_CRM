import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  berlinToday,
  dueState,
  hasTimeOfDay,
  utcToBerlinLocalInput,
} from "@/lib/dates";
import type { ActivityType } from "@/lib/generated/prisma/enums";
import StageBadge, { DealStageBadge } from "@/components/StageBadge";
import NextStepBadge, { formatDue } from "@/components/NextStepBadge";
import ContactActions from "@/components/ContactActions";
import DealActions, { CreateDealButton } from "@/components/DealActions";
import type { ContactLite } from "@/components/ContactActionDialog";
import type { DealLite } from "@/components/DealActionDialog";
import {
  contactStageHints,
  dealLineLabels,
  formatEuro,
  lostReasonLabels,
} from "@/lib/pipeline";
import { activityTypeLabels, allActivityTypes } from "@/lib/labels";
import {
  CalendarCheckIcon,
  ClipboardIcon,
  PhoneIcon,
  PlusIcon,
} from "@/components/icons";
import {
  btnPrimary,
  btnSecondary,
  card,
  input,
  kicker,
  label,
  pageTitle,
  sectionTitle,
} from "@/components/ui";
import NoteTemplates from "@/components/NoteTemplates";
import { createActivity, deleteActivity } from "../actions";

const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});
const dateFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeZone: "Europe/Berlin",
});

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
  const user = await requireUser();
  const contact = await prisma.contact.findFirst({
    where: { id, ...eigene(user.id).kontakte },
    include: {
      activities: { orderBy: { date: "desc" } },
      deals: { orderBy: { createdAt: "desc" } },
      referredBy: { select: { id: true, name: true } },
      referrals: {
        select: { id: true, name: true, stage: true, outcome: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contact) {
    notFound();
  }

  const today = berlinToday();
  const lite: ContactLite = {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    stage: contact.stage,
    outcome: contact.outcome,
    appointmentLocal: contact.appointmentAt
      ? utcToBerlinLocalInput(contact.appointmentAt)
      : null,
    hasStep: contact.nextStepType !== null,
  };

  const openDeals = contact.deals.filter((deal) => deal.outcome === "OFFEN");
  const wonUnits = contact.deals
    .filter((deal) => deal.outcome === "GEWONNEN")
    .reduce((sum, deal) => sum + (deal.units ?? 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/pipeline"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Zur Pipeline
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-100 text-lg font-semibold text-navy-700">
              {initials(contact.name)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className={pageTitle}>{contact.name}</h1>
                <StageBadge stage={contact.stage} outcome={contact.outcome} />
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

      {/* Was als Nächstes zu tun ist, steht ganz oben. */}
      <section className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={kicker}>Nächster Schritt</p>
            {contact.nextStepType && contact.nextStepAt ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <NextStepBadge
                  type={contact.nextStepType}
                  at={contact.nextStepAt}
                  state={dueState(contact.nextStepAt, today)}
                  withTime={hasTimeOfDay(contact.nextStepAt)}
                />
                {contact.nextStepNote && (
                  <span className="text-sm text-slate-600">{contact.nextStepNote}</span>
                )}
              </div>
            ) : contact.outcome === "VERLOREN" ? (
              <p className="mt-2 text-sm text-slate-500">
                Verloren
                {contact.lostReason ? ` · ${lostReasonLabels[contact.lostReason]}` : ""}
                {contact.lostAt ? ` am ${dateFormat.format(contact.lostAt)}` : ""}
              </p>
            ) : contact.stage === "IN_BERATUNG" && openDeals.length > 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Liegt am Vorgang – siehe unten.
              </p>
            ) : (
              <p className="mt-2 text-sm font-medium text-red-700">
                Kein nächster Schritt gesetzt.
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {contactStageHints[contact.stage]}
            </p>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <ContactActions contact={lite} />
        </div>
      </section>

      <div className={`${card} grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2 sm:p-8`}>
        <div>
          <p className={kicker}>Telefon</p>
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
          <p className={kicker}>E-Mail</p>
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
          <p className={kicker}>Termin</p>
          <p className="mt-1 text-sm text-slate-900">
            {contact.appointmentAt
              ? formatDue(contact.appointmentAt, hasTimeOfDay(contact.appointmentAt))
              : "–"}
          </p>
        </div>
        <div>
          <p className={kicker}>Checkup fällig</p>
          <p className="mt-1 text-sm text-slate-900">
            {contact.checkupDueAt ? dateFormat.format(contact.checkupDueAt) : "–"}
          </p>
        </div>
        {wonUnits > 0 && (
          <div>
            <p className={kicker}>Einheiten gewonnen</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{wonUnits}</p>
          </div>
        )}
        <div>
          <p className={kicker}>Zuletzt aktualisiert</p>
          <p className="mt-1 text-sm text-slate-900">
            {dateTimeFormat.format(contact.updatedAt)}
          </p>
        </div>
        {contact.note && (
          <div className="sm:col-span-2">
            <p className={kicker}>Notiz</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {contact.note}
            </p>
          </div>
        )}
      </div>

      {/* Vorgaenge */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitle}>
            Vorgänge{" "}
            <span className="font-normal text-slate-400">({contact.deals.length})</span>
          </h2>
          <CreateDealButton
            contactId={contact.id}
            contactName={contact.name}
            className={btnPrimary}
          >
            <PlusIcon className="h-4 w-4" />
            Vorgang anlegen
          </CreateDealButton>
        </div>

        {contact.deals.length === 0 ? (
          <div className={`${card} px-6 py-10 text-center`}>
            <p className="text-sm font-medium text-slate-900">Noch kein Vorgang</p>
            <p className="mt-1 text-sm text-slate-500">
              Nach dem gehaltenen Termin legst du je erkanntem Bedarf einen Vorgang an.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {contact.deals.map((deal) => {
              const dealLite: DealLite = {
                id: deal.id,
                contactId: deal.contactId,
                contactName: contact.name,
                line: deal.line,
                title: deal.title,
                stage: deal.stage,
                outcome: deal.outcome,
                hasStep: deal.nextStepType !== null,
                monthlyPremiumInput:
                  deal.monthlyPremiumCents != null
                    ? (deal.monthlyPremiumCents / 100).toFixed(2).replace(".", ",")
                    : "",
                units: deal.units,
              };
              return (
                <li key={deal.id} className={`${card} p-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {dealLineLabels[deal.line]}
                      </p>
                      {deal.title && (
                        <p className="text-xs text-slate-500">{deal.title}</p>
                      )}
                    </div>
                    <DealStageBadge stage={deal.stage} outcome={deal.outcome} />
                  </div>

                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold">{deal.units ?? 0} Einheiten</span>
                    {deal.monthlyPremiumCents != null && (
                      <span className="text-slate-500">
                        {" "}
                        · {formatEuro(deal.monthlyPremiumCents)} / Monat
                      </span>
                    )}
                  </p>

                  {deal.nextStepType && deal.nextStepAt && (
                    <div className="mt-2">
                      <NextStepBadge
                        type={deal.nextStepType}
                        at={deal.nextStepAt}
                        state={dueState(deal.nextStepAt, today)}
                      />
                    </div>
                  )}
                  {deal.outcome === "VERLOREN" && deal.lostReason && (
                    <p className="mt-2 text-xs text-slate-500">
                      Verloren: {lostReasonLabels[deal.lostReason]}
                    </p>
                  )}

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <DealActions deal={dealLite} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Empfehlungsbaum */}
      {(contact.referredBy || contact.referrals.length > 0) && (
        <section className={`${card} space-y-4 p-6 sm:p-8`}>
          <h2 className={sectionTitle}>Empfehlungen</h2>
          {contact.referredBy && (
            <p className="text-sm text-slate-600">
              Empfohlen von{" "}
              <Link
                href={`/contacts/${contact.referredBy.id}`}
                className="font-medium text-navy-600 hover:underline"
              >
                {contact.referredBy.name}
              </Link>
            </p>
          )}
          {contact.referrals.length > 0 && (
            <div>
              <p className={kicker}>Hat empfohlen ({contact.referrals.length})</p>
              <ul className="mt-2 divide-y divide-slate-100">
                {contact.referrals.map((referral) => (
                  <li key={referral.id}>
                    <Link
                      href={`/contacts/${referral.id}`}
                      className="flex min-h-11 items-center justify-between gap-3"
                    >
                      <span className="text-sm font-medium text-slate-900">
                        {referral.name}
                      </span>
                      <StageBadge stage={referral.stage} outcome={referral.outcome} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Aktivitaeten */}
      <div className="space-y-5">
        <h2 className={sectionTitle}>
          Aktivitäten{" "}
          <span className="font-normal text-slate-400">
            ({contact.activities.length})
          </span>
        </h2>

        <form action={createActivity} className={`${card} space-y-5 p-6 sm:p-8`}>
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
              <input id="date" name="date" type="datetime-local" className={input} />
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
            <NoteTemplates targetInputId="text" />
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
              Halte hier Anrufe, Termine und E-Mails fest.
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
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {dateTimeFormat.format(activity.date)}
                      </span>
                      <form action={deleteActivity}>
                        <input type="hidden" name="activityId" value={activity.id} />
                        <input type="hidden" name="contactId" value={contact.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 transition hover:text-red-800 hover:underline"
                          aria-label={`Aktivität vom ${dateTimeFormat.format(activity.date)} löschen`}
                        >
                          Löschen
                        </button>
                      </form>
                    </div>
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
