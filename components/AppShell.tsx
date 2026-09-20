import Link from "next/link";
import { Suspense } from "react";
import MiniEmil from "@/components/coach/MiniEmil";
import { ladeCoach } from "@/lib/coach/server";
import { Wordmark } from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import NamenSammelnLink from "@/components/NamenSammelnLink";
import UndoBar from "@/components/UndoBar";
import EinheitenNachAbschluss from "@/components/EinheitenNachAbschluss";
import InstallationMelder from "@/components/InstallationMelder";
import { HAUPTNAVIGATION } from "@/lib/navigation";
import { shell, gutter } from "@/components/ui";
import type { User } from "@/lib/generated/prisma/client";
import AssistantEntry from "@/components/ai-crm/AssistantEntry";
import AssistantSurface from "@/components/ai-crm/AssistantSurface";

export function navigationFuer() {
  return HAUPTNAVIGATION;
}

export default async function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const coach = await ladeCoach(user.id).catch(() => null);
  const initialen = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((teil) => teil[0])
    .join("");
  return (
    <div className="crm-shell flex min-h-dvh flex-col">
      <a
        href="#hauptinhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-4"
      >
        Zum Inhalt
      </a>
      <header className="crm-header sticky top-0 z-20 border-b border-line bg-canvas pt-[env(safe-area-inset-top)]">
        <div
          className={`${shell} ${gutter} flex h-16 items-center justify-between gap-3`}
        >
          <Link href="/heute" aria-label="Cockpit · Heute">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2">
            <NamenSammelnLink className="crm-collection-header" />
            <AssistantEntry />
            <Link
              href="/suche"
              aria-label="Suchen"
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink-muted hover:bg-surface hover:text-ink"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
              <span className="assistant-search-label">Suchen</span>
            </Link>
            <Link
              href="/profil"
              aria-label="Profil und Einstellungen"
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-line-strong bg-surface px-2 text-sm font-semibold text-ink"
            >
              {initialen}
            </Link>
          </div>
        </div>
        <div className={`${shell} md:px-6 lg:px-8`}>
          <NavLinks links={navigationFuer()} />
        </div>
      </header>
      <main
        id="hauptinhalt"
        className={`${shell} ${gutter} crm-main flex-1 pt-6 md:py-10`}
      >
        {children}
      </main>
      <UndoBar />
      <AssistantSurface userId={user.id} />
      <EinheitenNachAbschluss />
      <InstallationMelder melden={user.installedAt === null} />
      <Suspense fallback={null}><MiniEmil initial={coach} /></Suspense>
    </div>
  );
}
