"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SparkIcon } from "@/components/icons";
import { useAssistant } from "@/components/ai-crm/AssistantProvider";

export default function NamenSammelnLink({ className }: { className: string }) {
  const pathname = usePathname();
  const assistant = useAssistant();
  if (pathname === "/namen/sammeln" && !assistant.visible) return null;

  return (
    <Link
      href="/namen/sammeln"
      prefetch={false}
      onClick={assistant.close}
      className={`crm-collection-action ${className}`}
    >
      <SparkIcon className="h-5 w-5 shrink-0" />
      Namen sammeln
    </Link>
  );
}
