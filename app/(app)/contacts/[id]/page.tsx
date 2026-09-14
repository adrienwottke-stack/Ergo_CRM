import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import { istAn, merkeNutzung } from "@/lib/features";
import { kandidaturKarteSelect, type KandidaturKarteDaten } from "@/lib/kandidatur";
import {
  berlinToday,
  dueState,
  hasTimeOfDay,
  utcToBerlinLocalInput,
} from "@/lib/dates";
import type { ActivityType } from "@/lib/generated/prisma/enums";
import StageBadge from "@/components/StageBadge";
import NextStepBadge, { formatDue } from "@/components/NextStepBadge";
import ContactActions from "@/components/ContactActions";
import ZinsrechnerEinstieg from "@/components/zinsrechner/Einstieg";
import QuickRowActions from "@/components/QuickRowActions";
import DeleteContactButton from "@/components/DeleteContactButton";
import KandidaturKarte from "@/components/KandidaturKarte";
import QrCode from "@/components/schleuse/QrCode";
import type { ContactLite } from "@/components/ContactActionDialog";
import { contactStageHints, lostReasonLabels } from "@/lib/pipeline";
import { activityTypeLabels } from "@/lib/labels";
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  ClipboardIcon,
  PhoneIcon,
} from "@/components/icons";
import { btnSecondary, card, kicker, pageTitle, sectionTitle } from "@/components/ui";

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
  CALL: "bg-navy-50 text-navy-700",
  MEETING: "bg-teal-50 text-teal-700",
  EMAIL: "bg-sunken text-ink-muted",
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

  // Aufbau-Trichter (docs/recruiting-plan.md, §2.1): die Kandidatur-Karte
  // erscheint NUR, wenn der Kontakt auf der Recruiting-Liste steht - Position
  // statt Rolle, kein zweiter Modus-Schalter. Der Baustein-Schalter kommt
  // trotzdem oben drauf: AUS heisst, hier taucht nichts auf.
  const zeigtAufbau =
    contact.listKinds.includes("RECRUITING") && (await istAn("aufbau"));

  let kandidatur: KandidaturKarteDaten | null = null;
  let herkunft = "";
  let qrCode: ReactNode = null;
  if (zeigtAufbau) {
    const [gefundeneKandidatur, kopfzeilen, person] = await Promise.all([
      prisma.kandidatur.findFirst({
        where: { contactId: contact.id, ownerId: user.id, outcome: "OFFEN" },
        select: kandidaturKarteSelect,
      }),
      headers(),
      // Weich statt requireUserPerson: eine fehlende Zaehlstelle darf diese
      // Seite nicht zum Absturz bringen (Regel 2, lib/features.ts).
      prisma.person.findUnique({ where: { userId: user.id }, select: { id: true } }),
    ]);
    kandidatur = gefundeneKandidatur;
    herkunft = `${kopfzeilen.get("x-forwarded-proto") ?? "http"}://${kopfzeilen.get("host") ?? ""}`;
    // Die Herkunft kommt vom Server, nicht aus window.location - sonst zeigt
    // der erste Frame einen halben Link (dasselbe Muster wie in
    // app/(app)/einladen/page.tsx und components/PersonAufnehmen.tsx).
    if (kandidatur?.invite) {
      qrCode = <QrCode text={`${herkunft}/einladung/${kandidatur.invite.code}`} />;
    }
    await merkeNutzung("aufbau", person?.id ?? null);
  }

  const today = berlinToday();
  const istOffen = contact.outcome === "OFFEN";
  // Ein geplatzter Termin bleibt in der Phase TERMIN_VEREINBART, verliert
  // aber appointmentAt und erhält einen Anrufschritt. Dann führt die nächste
  // Aktion wieder zur Terminvereinbarung statt erneut zu „Gehalten“.
  const istTermin = istOffen && (contact.nextStepType === "TERMIN"
    || (contact.stage === "TERMIN_VEREINBART" && contact.appointmentAt !== null));
  const istAnruf = istOffen && !istTermin && (contact.nextStepType === "ANRUF"
    || contact.stage === "NEU" || contact.stage === "KONTAKTIERT");
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
    referralsAsked: contact.referralsAskedAt !== null,
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/heute"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zurück zu Heute
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
              <p className="mt-0.5 text-sm text-ink-muted">
                {contact.source ? `${contact.source} · ` : ""}
                Kontakt seit {dateFormat.format(contact.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/contacts/${contact.id}/edit`} className={btnSecondary}>
              Bearbeiten
            </Link>
            <DeleteContactButton
              contactId={contact.id}
              contactName={contact.name}
              activityCount={contact.activities.length}
              referralCount={contact.referrals.length}
            />
          </div>
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
                  <span className="text-sm text-ink-muted">{contact.nextStepNote}</span>
                )}
              </div>
            ) : contact.outcome === "VERLOREN" ? (
              <p className="mt-2 text-sm text-ink-muted">
                Verloren
                {contact.lostReason ? ` · ${lostReasonLabels[contact.lostReason]}` : ""}
                {contact.lostAt ? ` am ${dateFormat.format(contact.lostAt)}` : ""}
              </p>
            ) : contact.stage === "ABSCHLUSS" ? (
              <p className="mt-2 text-sm text-ink-muted">
                Schleife durchlaufen – abgeschlossen.
              </p>
            ) : (
              <p className="mt-2 text-sm font-medium text-red-700">
                Kein nächster Schritt gesetzt.
              </p>
            )}
            <p className="mt-2 text-xs text-ink-muted">
              {contactStageHints[contact.stage]}
            </p>
          </div>
        </div>
        <div className="mt-4 border-t border-line pt-4">
          {(istTermin || istAnruf) && <div className="space-y-3">
            <p className="text-base font-semibold text-ink">{istTermin ? "Wie ist der Termin gelaufen?" : "Anrufergebnis festhalten"}</p>
            <QuickRowActions contact={lite} istAnruf={istAnruf} istTermin={istTermin} zeigeWeitere={false} />
          </div>}
          <details className={istTermin || istAnruf ? "mt-4 border-t border-line pt-2" : ""}>
            <summary className="flex min-h-12 cursor-pointer list-item items-center py-3 text-base font-medium text-ink-muted">Weitere Kontaktaktionen</summary>
            <div className="pb-2 pt-2"><ContactActions contact={lite} /></div>
          </details>
        </div>
      </section>

      <ZinsrechnerEinstieg contactId={contact.id} userId={user.id} />

      {/* Aufbau-Trichter: nur fuer Kontakte auf der Recruiting-Liste, gut
          sichtbar direkt unter dem Verkaufs-Schritt, aber ohne ihn zu
          verdraengen - Verkauf bleibt fuer jeden Kontakt der erste Block. */}
      {zeigtAufbau && (
        <section id="kandidatur" className="scroll-mt-24">
          <KandidaturKarte
            contactId={contact.id}
            contactName={contact.name}
            kandidatur={kandidatur}
            herkunft={herkunft}
            qrCode={qrCode}
          />
        </section>
      )}

      {/* Was vor einem Anruf zaehlt - mehr nicht. Alles Weitere stand hier
          frueher, weil es das Feld gab, nicht weil es jemand braucht. */}
      <div className={`${card} grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2 sm:p-8`}>
        <div>
          <p className={kicker}>Telefon</p>
          <p className="mt-1 text-sm text-ink">
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
          <p className={kicker}>Beruf</p>
          <p className="mt-1 text-sm text-ink">{contact.job ?? "–"}</p>
        </div>
        {contact.appointmentAt && (
          <div>
            <p className={kicker}>Termin</p>
            <p className="mt-1 text-sm text-ink">
              {formatDue(contact.appointmentAt, hasTimeOfDay(contact.appointmentAt))}
            </p>
          </div>
        )}
        {/* Nur noch Bestand: neu erfasst wird keine E-Mail mehr. */}
        {contact.email && (
          <div>
            <p className={kicker}>E-Mail</p>
            <p className="mt-1 text-sm text-ink">
              <a
                href={`mailto:${contact.email}`}
                className="font-medium text-navy-600 hover:underline"
              >
                {contact.email}
              </a>
            </p>
          </div>
        )}
        {contact.note && (
          <div className="sm:col-span-2">
            <p className={kicker}>Notiz</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
              {contact.note}
            </p>
          </div>
        )}
      </div>

      {/* Die Empfehlungsfrage ist der Motor - fehlt sie nach einem gehaltenen
          Termin, steht das hier und nicht in einer Auswertung. */}
      {contact.stage !== "NEU" &&
        contact.stage !== "KONTAKTIERT" &&
        contact.referralsAskedAt === null && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Nach diesem Termin wurde noch nicht nach Empfehlungen gefragt.
          </p>
        )}

      {/* Empfehlungsbaum */}
      {(contact.referredBy || contact.referrals.length > 0) && (
        <section className={`${card} space-y-4 p-6 sm:p-8`}>
          <h2 className={sectionTitle}>Empfehlungen</h2>
          {contact.referredBy && (
            <p className="text-sm text-ink-muted">
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
              <ul className="mt-2 divide-y divide-line">
                {contact.referrals.map((referral) => (
                  <li key={referral.id}>
                    <Link
                      href={`/contacts/${referral.id}`}
                      className="flex min-h-11 items-center justify-between gap-3"
                    >
                      <span className="text-sm font-medium text-ink">
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

      {/* Vorgeschichte: entsteht aus den Ergebnis-Knoepfen, nicht aus einem
          Formular. Hier wird nur gelesen. */}
      <div className="space-y-5">
        <h2 className={sectionTitle}>
          Vorgeschichte{" "}
          <span className="font-normal text-ink-soft">
            ({contact.activities.length})
          </span>
        </h2>

        {contact.activities.length === 0 ? (
          <div className={`${card} px-6 py-12 text-center`}>
            <p className="text-sm font-medium text-ink">Noch nichts passiert</p>
            <p className="mt-1 text-sm text-ink-muted">
              Jeder Anruf und jeder Termin landet hier automatisch.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-0 pl-2">
            {contact.activities.map((activity, index) => (
              <li key={activity.id} className="relative flex gap-4 pb-6">
                {index < contact.activities.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[calc(1rem-1px)] top-9 h-[calc(100%-1.5rem)] w-px bg-line"
                  />
                )}
                <span
                  className={`relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activityDotStyles[activity.type]}`}
                >
                  <ActivityIcon type={activity.type} />
                </span>
                <div className={`${card} flex-1 px-5 py-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-13 font-semibold text-ink">
                      {activityTypeLabels[activity.type]}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {dateTimeFormat.format(activity.date)}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
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
