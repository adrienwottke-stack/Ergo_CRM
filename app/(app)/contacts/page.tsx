import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  allContactStatuses,
  contactStatusLabels,
  isContactStatus,
} from "@/lib/labels";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

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

  const filterLinkClasses = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm ${
      active
        ? "bg-stone-900 text-white"
        : "bg-white text-stone-600 border border-stone-300 hover:bg-stone-100"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kontakte</h1>
        <Link
          href="/contacts/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Neuer Kontakt
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/contacts" className={filterLinkClasses(!statusFilter)}>
          Alle
        </Link>
        {allContactStatuses.map((s) => (
          <Link
            key={s}
            href={`/contacts?status=${s}`}
            className={filterLinkClasses(statusFilter === s)}
          >
            {contactStatusLabels[s]}
          </Link>
        ))}
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
          {statusFilter
            ? `Keine Kontakte mit Status „${contactStatusLabels[statusFilter]}“.`
            : "Noch keine Kontakte. Leg den ersten an!"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">E-Mail</th>
                <th className="px-4 py-3">Quelle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aktivitäten</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="hover:underline"
                    >
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {contact.phone ?? "–"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {contact.email ?? "–"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {contact.source ?? "–"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={contact.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-stone-600">
                    {contact._count.activities}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/contacts/${contact.id}/edit`}
                      className="text-sm text-blue-600 hover:underline"
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
