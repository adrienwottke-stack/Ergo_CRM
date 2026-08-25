import { logout } from "@/app/login/actions";
import { Wordmark } from "@/components/Logo";
import NavLinks, { type NavLink } from "@/components/NavLinks";
import UndoBar from "@/components/UndoBar";
import InstallationMelder from "@/components/InstallationMelder";
import { LogoutIcon } from "@/components/icons";
import ThemaSchalter from "@/components/ThemaSchalter";
import { shell, gutter } from "@/components/ui";
import type { User } from "@/lib/generated/prisma/client";

// Eine Schale fuer alle angemeldeten Seiten.
//
// Vorher hatten der Beraterbereich und der Wettbewerb je eine eigene Kopfzeile
// mit eigener Navigation, eigener Unterzeile und unterschiedlichem Aufbau. Der
// Sprung von /heute nach /arena wechselte damit die gesamte Umgebung - der
// Nutzer musste sich zweimal zurechtfinden und wusste nach dem Wechsel nicht
// mehr, wo er ist. docs/audit-kernmodell.md, 10.9: die Navigation darf das
// Versprechen "keine Entscheidung beim Oeffnen" nicht wieder einreissen.
//
// Jetzt gibt es eine Leiste, an einer Stelle definiert. Was innerhalb des
// Wettbewerbs zusammengehoert (Arena, Rangliste, eigene Aktivitaeten), verlinkt
// sich auf den Seiten selbst - eine Ebene tiefer, wo es hingehoert.

export function navigationFuer(user: User): NavLink[] {
  return [
    { href: "/namen", label: "Namen" },
    { href: "/heute", label: "Heute" },
    { href: "/kalender", label: "Kalender" },
    { href: "/trichter", label: "Trichter" },
    // "Mannschaft" steht bei jedem, auch bei dem, der noch niemanden fuehrt.
    // Vorher hing der Punkt daran, ob schon jemand unter einem haengt - damit
    // blieb der Weg genau dem verborgen, der ihn zuerst braucht: Wer seine
    // Struktur eintragen will, fand die Seite dafuer erst, wenn die Struktur
    // schon stand. Die Seite faengt den leeren Fall selbst ab und zeigt dann
    // das Aufnehmen statt einer leeren Liste.
    { href: "/mannschaft", label: "Mannschaft" },
    // "Einladen" kann jeder: Werben ist der Kern des Berufs, nicht die Kuer.
    { href: "/einladen", label: "Einladen" },
    // Ein Punkt fuer den ganzen Wettbewerb. Rangliste und eigene Aktivitaeten
    // haengen darunter und markieren denselben Punkt mit.
    { href: "/arena", label: "Wettbewerb", match: ["/leaderboard", "/log", "/spiel"] },
    ...(user.role === "ADMIN"
      ? [{ href: "/team", label: "Team", match: ["/werkstatt"] }]
      : []),
  ];
}

export default async function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const links = navigationFuer(user);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Dunkle Kopfzeile mit Gold-Haarlinie.
          Vorher war sie weiss auf hellgrauem Grund - dadurch war die Marke
          praktisch unsichtbar und die App las sich wie ein Formular. Jetzt
          traegt die Leiste das Navy, und darunter beginnt das Blatt.
          "buehne" nimmt sie vom Dunkelmodus aus: sie ist in beiden Ansichten
          dieselbe: ein fester Anker, egal wie der Rest gerade steht.
          Das Polster oben faengt die Statusleiste ab, wenn die App vom
          Startbildschirm laeuft (statusBarStyle black-translucent). */}
      <header className="buehne sticky top-0 z-20 border-b border-navy-800 bg-navy-950 pt-[env(safe-area-inset-top)] schatten-karte">
        <div
          className={`${shell} ${gutter} flex h-14 items-center justify-between gap-4`}
        >
          <Wordmark sub="Beraterbereich" onDark />
          <div className="flex shrink-0 items-center gap-1">
            <ThemaSchalter />
            <form action={logout}>
              {/* Am Handy nur das Symbol – der Text sprengt sonst die Kopfzeile. */}
              <button
                type="submit"
                aria-label="Abmelden"
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-navy-200 transition hover:bg-white/10 hover:text-white sm:px-3"
              >
                <LogoutIcon className="h-4.5 w-4.5 sm:hidden" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </form>
          </div>
        </div>
        {/* Navigation ueber die volle Breite, der aktive Unterstrich liegt
            direkt auf der Haarlinie der Kopfzeile. */}
        <div className={`${shell} ${gutter} flex items-center gap-2`}>
          <NavLinks links={links} />
        </div>
      </header>

      <main className={`${shell} ${gutter} flex-1 py-8 sm:py-10`}>
        {children}
      </main>

      {/* Liegt ueber allem und meldet sich nur, wenn es etwas zurueckzunehmen gibt. */}
      <UndoBar />
      {/* Haelt einmalig fest, wer die App wirklich vom Startbildschirm startet. */}
      <InstallationMelder melden={user.installedAt === null} />
    </div>
  );
}
