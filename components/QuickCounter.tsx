"use client";

import { useOptimistic, useTransition } from "react";
import type { QuotaType } from "@/lib/generated/prisma/enums";
import {
  CalendarCheckIcon,
  HashIcon,
  PhoneIcon,
  PlusIcon,
} from "@/components/icons";
import { card, kicker } from "@/components/ui";

const iconStyles: Record<QuotaType, string> = {
  CALL: "bg-blue-50 text-blue-600",
  NUMBERS_PULLED: "bg-navy-50 text-navy-600",
  APPOINTMENT_SET: "bg-emerald-50 text-emerald-600",
};

function QuotaIcon({ type }: { type: QuotaType }) {
  const className = "h-4.5 w-4.5";
  if (type === "CALL") return <PhoneIcon className={className} />;
  if (type === "NUMBERS_PULLED") return <HashIcon className={className} />;
  return <CalendarCheckIcon className={className} />;
}

export default function QuickCounter({
  type,
  label,
  count,
  action,
}: {
  type: QuotaType;
  label: string;
  count: number;
  action: (type: string, count: number) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCount, addOptimistic] = useOptimistic(
    count,
    (current, increment: number) => current + increment
  );

  const handleClick = () => {
    startTransition(async () => {
      addOptimistic(1);
      await action(type, 1);
    });
  };

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${iconStyles[type]}`}
        >
          <QuotaIcon type={type} />
        </span>
        <span className={kicker}>Heute</span>
      </div>
      <p className="mt-4 overflow-hidden text-4xl font-semibold tracking-tight text-slate-900">
        <span key={optimisticCount} className="inline-block animate-tick">
          {optimisticCount}
        </span>
      </p>
      <p className="mt-1 text-[13px] font-medium text-slate-600">{label}</p>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending && optimisticCount - count > 3}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:border-navy-300 hover:bg-navy-50 hover:text-navy-700 active:scale-[0.97]"
      >
        <PlusIcon className="h-4 w-4" />1
      </button>
    </div>
  );
}
