import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  allContactStatuses,
  contactStatusLabels,
  isContactStatus,
} from "@/lib/labels";
import StatusBadge from "@/components/StatusBadge";
import { PlusIcon, UsersIcon } from "@/components/icons";
import { btnPrimary, card, filterPill, pageTitle, td, th } from "@/components/ui";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter = status && isContactStatus(status) ? status : undefined;

  const contacts = await prisma.contact.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { activities: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Kontakte</h1>
          <p className="mt-1 text-sm text-slate-500">
            {contacts.length}{" "}
            {contacts.length === 1 ? "Kontakt" : "Kontakte"}
            {statusFilter
              ? ` mit Status „${contactStatusLabels[statusFilter]}“`
              : " insgesamt"}
          </p>
        </div>
        <Link href="/contacts/new" className={btnPrimary}>
          <PlusIcon className="h-4 w-4" />
          Neuer Kontakt
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/contacts" className={filterPill(!statusFilter)}>
          Alle
        </Link>
        {allContactStatuses.map((s) => (
          <Link
            key={s}
            href={`/contacts?status=${s}`}
            className={filterPill(statusFilter === s)}
          >
            {contactStatusLabels[s]}
          </Link>
        ))}
      </div>

      {contacts.length === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-16 text-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-600">
            <UsersIcon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-900">
            {statusFilter
              ? `Keine Kontakte mit Status „${contactStatusLabels[statusFilter]}“`
              : "Noch keine Kontakte"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {statusFilter
              ? "Wähle einen anderen Filter oder leg einen neuen Kontakt an."
              : "Leg deinen ersten Kontakt an und starte dein Netzwerk."}
          </p>
          <Link href="/contacts/new" className={`${btnPrimary} mt-6`}>
            <PlusIcon className="h-4 w-4" />
            Kontakt anlegen
          </Link>
        </div>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/60">
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Kontakt</th>
                <th className={th}>Quelle</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Aktivitäten</th>
                <th className={th}>
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="group transition hover:bg-navy-50/40">
                  <td className={td}>
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
                        {initials(contact.name)}
                      </span>
                      <span className="font-medium text-slate-900 group-hover:text-navy-700">
                        {contact.name}
                      </span>
                    </Link>
                  </td>
                  <td className={`${td} text-slate-600`}>
                    <div className="space-y-0.5">
                      {contact.phone && <p>{contact.phone}</p>}
                      {contact.email && (
                        <p className="text-xs text-slate-400">{contact.email}</p>
                      )}
                      {!contact.phone && !contact.email && "–"}
                    </div>
                  </td>
                  <td className={`${td} text-slate-600`}>
                    {contact.source ?? "–"}
                  </td>
                  <td className={td}>
                    <StatusBadge status={contact.status} />
                  </td>
                  <td className={`${td} text-right tabular-nums text-slate-600`}>
                    {contact._count.activities}
                  </td>
                  <td className={`${td} text-right`}>
                    <Link
                      href={`/contacts/${contact.id}/edit`}
                      className="text-sm font-medium text-navy-600 opacity-0 transition group-hover:opacity-100 hover:underline focus-visible:opacity-100"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
