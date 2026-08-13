"use client";

import Link from "next/link";
import type { ContactStatus } from "@/lib/generated/prisma/enums";
import { contactStatusLabels } from "@/lib/labels";
import { quickLogCall, quickSetStatus, quickSetFollowUp } from "@/app/(app)/contacts/actions";
import { PhoneIcon, CalendarCheckIcon, ClockIcon } from "@/components/icons";

interface ContactItem {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  status: ContactStatus;
  nextFollowUp?: string | Date | null;
  updatedAt: string | Date;
}

const COLUMNS: ContactStatus[] = ["NEW", "CONTACTED", "APPOINTMENT", "CLOSED", "REJECTED"];

const COLUMN_COLORS: Record<ContactStatus, { bg: string; border: string; text: string; headerBg: string }> = {
  NEW: { bg: "bg-blue-50/50", border: "border-blue-200", text: "text-blue-700", headerBg: "bg-blue-100" },
  CONTACTED: { bg: "bg-amber-50/50", border: "border-amber-200", text: "text-amber-700", headerBg: "bg-amber-100" },
  APPOINTMENT: { bg: "bg-purple-50/50", border: "border-purple-200", text: "text-purple-700", headerBg: "bg-purple-100" },
  CLOSED: { bg: "bg-emerald-50/50", border: "border-emerald-200", text: "text-emerald-700", headerBg: "bg-emerald-100" },
  REJECTED: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", headerBg: "bg-slate-200" },
};

const dateFormat = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });

export default function KanbanBoard({ contacts }: { contacts: ContactItem[] }) {

  const contactsByStatus = COLUMNS.reduce<Record<ContactStatus, ContactItem[]>>((acc, col) => {
    acc[col] = contacts.filter((c) => c.status === col);
    return acc;
  }, { NEW: [], CONTACTED: [], APPOINTMENT: [], CLOSED: [], REJECTED: [] });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("contactId", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: ContactStatus) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("contactId");
    if (!contactId) return;

    const formData = new FormData();
    formData.set("contactId", contactId);
    formData.set("status", targetStatus);
    await quickSetStatus(formData);
  };

  return (
    <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-4 md:grid-cols-5 min-w-[900px]">
      {COLUMNS.map((col) => {
        const items = contactsByStatus[col];
        const colors = COLUMN_COLORS[col];

        return (
          <div
            key={col}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col)}
            className={`flex flex-col rounded-xl border ${colors.border} ${colors.bg} p-3 min-h-[500px] transition`}
          >
            <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${colors.headerBg}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                {contactStatusLabels[col]}
              </h3>
              <span className={`rounded-full bg-white px-2 py-0.5 text-xs font-semibold ${colors.text} shadow-sm`}>
                {items.length}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-3 flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-400">Keine Kontakte</p>
                </div>
              ) : (
                items.map((contact) => {
                  const followUp = contact.nextFollowUp ? new Date(contact.nextFollowUp) : null;
                  const isDue = followUp && followUp <= new Date();

                  return (
                    <div
                      key={contact.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, contact.id)}
                      className="group relative rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-semibold text-slate-900 hover:text-navy-700 text-sm line-clamp-1"
                        >
                          {contact.name}
                        </Link>
                      </div>

                      {contact.phone && (
                        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                          <PhoneIcon className="h-3 w-3 text-slate-400" />
                          <a href={`tel:${contact.phone}`} className="hover:underline hover:text-navy-600">
                            {contact.phone}
                          </a>
                        </p>
                      )}

                      {followUp && (
                        <p className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${isDue ? "text-amber-700 font-semibold" : "text-slate-500"}`}>
                          <ClockIcon className="h-3 w-3" />
                          Wiedervorlage: {dateFormat.format(followUp)} {isDue && "(fällig!)"}
                        </p>
                      )}

                      <div className="mt-3 border-t border-slate-100 pt-2 flex flex-wrap items-center gap-1">
                        <form action={quickLogCall}>
                          <input type="hidden" name="contactId" value={contact.id} />
                          <button
                            type="submit"
                            title="Anruf loggen (+1 Punkt)"
                            className="rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition flex items-center gap-1"
                          >
                            <PhoneIcon className="h-3 w-3" /> Anruf
                          </button>
                        </form>

                        <form action={quickSetStatus}>
                          <input type="hidden" name="contactId" value={contact.id} />
                          <input type="hidden" name="status" value="APPOINTMENT" />
                          <button
                            type="submit"
                            title="Termin vereinbart"
                            className="rounded bg-purple-50 px-2 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-100 transition flex items-center gap-1"
                          >
                            <CalendarCheckIcon className="h-3 w-3" /> Termin
                          </button>
                        </form>

                        <form action={quickSetFollowUp}>
                          <input type="hidden" name="contactId" value={contact.id} />
                          <input type="hidden" name="days" value="7" />
                          <button
                            type="submit"
                            title="Wiedervorlage in 7 Tagen"
                            className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition"
                          >
                            +7d
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
