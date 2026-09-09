import Link from "next/link";
import { Wordmark } from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import UndoBar from "@/components/UndoBar";
import EinheitenNachAbschluss from "@/components/EinheitenNachAbschluss";
import InstallationMelder from "@/components/InstallationMelder";
import SuchTastatur from "@/components/suche/SuchTastatur";
import { HAUPTNAVIGATION } from "@/lib/navigation";
import { shell, gutter } from "@/components/ui";
import type { User } from "@/lib/generated/prisma/client";
import SeitenWerkzeuge, { ProfilProvider } from "@/components/SeitenWerkzeuge";

export function navigationFuer() {
  return HAUPTNAVIGATION;
}

export default function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const initialen = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((teil) => teil[0])
    .join("").toLocaleUpperCase("de-DE");
  return (
    <ProfilProvider initialen={initialen}>
    <div className="crm-shell flex min-h-dvh flex-col">
      <a
        href="#hauptinhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-4"
      >
        Zum Inhalt
      </a>
      <header className="crm-header sticky top-0 z-20 border-b border-line bg-canvas pt-[env(safe-area-inset-top)]">
        <div
          className={`${shell} ${gutter} crm-brand-row flex h-16 items-center justify-between gap-3`}
        >
          <Link href="/heute" aria-label="Cockpit · Heute">
            <Wordmark />
          </Link>
          <SeitenWerkzeuge />
        </div>
        <div className={`${shell} md:px-6 lg:px-8`}>
          <NavLinks links={navigationFuer()} />
        </div>
      </header>
      <main
        id="hauptinhalt"
        className={`${shell} ${gutter} crm-main flex-1 pt-5 md:py-8`}
      >
        {children}
      </main>
      <UndoBar />
      <SuchTastatur />
      <EinheitenNachAbschluss />
      <InstallationMelder melden={user.installedAt === null} />
    </div>
    </ProfilProvider>
  );
}
