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
import QuickRowActions from "@/components/QuickRowActions";
import DeleteContactButton from "@/components/DeleteContactButton";
import KontaktProfilAktionen from "@/components/KontaktProfilAktionen";
import KandidaturKarte from "@/components/KandidaturKarte";
import QrCode from "@/components/schleuse/QrCode";
import type { ContactLite } from "@/components/ContactActionDialog";
import { contactStageHints, lostReasonLabels } from "@/lib/pipeline";
import { activityTypeLabels } from "@/lib/labels";
import { CalendarCheckIcon, ClipboardIcon, PhoneIcon } from "@/components/icons";
import { btnSecondary, card, kicker, sectionTitle } from "@/components/ui";
import { internerRueckweg } from "@/lib/rueckweg";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ zurueck?: string }>;
}) {
  const { id } = await params;
  const parameter = await searchParams;
  const rueckweg = internerRueckweg(parameter.zurueck, "/namen");
  const bearbeiten = `/contacts/${id}/edit?zurueck=${encodeURIComponent(rueckweg)}`;
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

  const letzteAktivitaet = contact.activities[0] ?? null;

  return (
    <div className="space-y-6">
      <header className="crm-page-head crm-page-head-with-tools flex min-h-11 items-center justify-between gap-3">
        <Link href={rueckweg} className="inline-flex min-h-11 items-center gap-2 text-base font-medium text-link">
          <span aria-hidden>‹</span> Zurück
        </Link>
        <Link href={bearbeiten} className={`${btnSecondary} shrink-0`}>
          Bearbeiten
        </Link>
      </header>

      <section className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-akzent text-xl font-semibold text-white">
          {initials(contact.name)}
        </span>
        <div className="mt-3 min-w-0">
          <h1 className="[overflow-wrap:anywhere] text-[32px] font-semibold leading-tight tracking-[-0.035em] text-ink">
            {contact.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <StageBadge stage={contact.stage} outcome={contact.outcome} />
            <p className="text-sm text-ink-muted">
              {contact.source ? `${contact.source} · ` : ""}
              seit {dateFormat.format(contact.createdAt)}
            </p>
          </div>
        </div>
      </section>

      <KontaktProfilAktionen contact={lite} zurueck={rueckweg} />

      {/* Nächster Schritt und letzter Kontakt gehören in denselben Lageblock. */}
      <section className={`${card} p-5 sm:p-6`}>
        <div className="grid gap-5 sm:grid-cols-2">
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
          <div className="border-t border-line pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <p className={kicker}>Letzter Kontakt</p>
            {letzteAktivitaet ? (
              <>
                <p className="mt-2 text-base font-medium text-ink">
                  {activityTypeLabels[letzteAktivitaet.type]}
                  <span className="font-normal text-ink-muted">
                    {` · ${dateTimeFormat.format(letzteAktivitaet.date)}`}
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                  {letzteAktivitaet.text}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">Noch kein Kontakt festgehalten.</p>
            )}
          </div>
        </div>
        {istTermin && (
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <p className="text-base font-semibold text-ink">Wie ist der Termin gelaufen?</p>
            <QuickRowActions contact={lite} istAnruf={false} istTermin zeigeWeitere={false} zeigeAnrufen={false} />
          </div>
        )}
        {istAnruf && (
          <details id="anrufergebnis" className="group mt-4 border-t border-line pt-2">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-semibold text-ink">
              Anrufergebnis festhalten
              <span aria-hidden className="text-ink-muted transition group-open:rotate-90">›</span>
            </summary>
            <div className="pb-1 pt-3">
              <QuickRowActions contact={lite} istAnruf zeigeWeitere={false} zeigeAnrufen={false} />
            </div>
          </details>
        )}
      </section>

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
                className="inline-flex min-h-11 items-center font-medium text-link hover:underline"
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
      {contact.activities.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Noch kein Verlauf. Anrufe und Termine erscheinen hier automatisch.
        </p>
      ) : (
        <details className={`${card} group p-5 sm:p-6`}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-semibold text-ink">
            Verlauf ansehen · {contact.activities.length}
            <span aria-hidden className="text-ink-muted transition group-open:rotate-90">›</span>
          </summary>
          <ol className="relative mt-4 space-y-0 border-t border-line pt-4 pl-2">
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
        </details>
      )}

      <details className={`${card} group p-5 sm:p-6`}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg font-semibold text-ink">
          Kontaktdetails
          <span className="text-ink-muted transition group-open:rotate-90" aria-hidden>›</span>
        </summary>
        <div className="mt-5 grid gap-x-8 gap-y-5 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <p className={kicker}>Telefon</p>
            <p className="mt-1 text-sm text-ink">
              {contact.phone ? <a href={`tel:${contact.phone}`} className="inline-flex min-h-11 items-center font-medium text-link hover:underline">{contact.phone}</a> : "–"}
            </p>
          </div>
          <div><p className={kicker}>Beruf</p><p className="mt-1 text-sm text-ink">{contact.job ?? "–"}</p></div>
          {contact.appointmentAt && <div><p className={kicker}>Termin</p><p className="mt-1 text-sm text-ink">{formatDue(contact.appointmentAt, hasTimeOfDay(contact.appointmentAt))}</p></div>}
          {contact.email && <div><p className={kicker}>E-Mail</p><p className="mt-1 text-sm text-ink"><a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center font-medium text-link hover:underline">{contact.email}</a></p></div>}
          {contact.note && <div className="sm:col-span-2"><p className={kicker}>Notiz</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">{contact.note}</p></div>}
        </div>
      </details>

      <details className={`${card} group p-5 sm:p-6`}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-semibold text-ink">
          Weitere Aktionen
          <span className="text-ink-muted transition group-open:rotate-90" aria-hidden>›</span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <ContactActions contact={lite} />
          <div className="border-t border-line pt-4">
            <DeleteContactButton contactId={contact.id} contactName={contact.name} activityCount={contact.activities.length} referralCount={contact.referrals.length} />
          </div>
        </div>
      </details>
    </div>
  );
}
