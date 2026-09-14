"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SparkIcon } from "@/components/icons";

export default function NamenSammelnLink({ className }: { className: string }) {
  const pathname = usePathname();
  if (pathname === "/namen/sammeln") return null;

  return (
    <Link
      href="/namen/sammeln"
      prefetch={false}
      className={`crm-collection-action ${className}`}
    >
      <SparkIcon className="h-5 w-5 shrink-0" />
      Namen sammeln
    </Link>
  );
}
