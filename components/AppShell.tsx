import { logout } from "@/app/login/actions";
import { Wordmark } from "@/components/Logo";
import NavLinks, { type NavLink } from "@/components/NavLinks";
import UndoBar from "@/components/UndoBar";
import EinheitenNachAbschluss from "@/components/EinheitenNachAbschluss";
import InstallationMelder from "@/components/InstallationMelder";
import AppInstallieren from "@/components/AppInstallieren";
import Schnellzugriff from "@/components/Schnellzugriff";
import { LogoutIcon } from "@/components/icons";
import ThemaSchalter from "@/components/ThemaSchalter";
import RueckmeldungGeben from "@/components/RueckmeldungGeben";
import { schalter } from "@/lib/features";
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
    {
      href: "/arena",
      label: "Wettbewerb",
      match: ["/leaderboard", "/log", "/spiel"],
    },
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
  // Ein Schalter, eine Abfrage, auf jeder Seite. Sie steht hier und nicht im
  // Schnellzugriff selbst: der ist eine Client-Komponente und kann die
  // Feature-Tabelle nicht lesen.
  const { wegweiser: wegweiserAn } = await schalter("wegweiser");

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Kopfzeile aus Glas mit Haarlinie darunter.
          Vorher war sie "buehne": dauerhaft dunkles Navy mit Gold-Akzent,
          unabhaengig vom Hell/Dunkel-Stand der Seite - ein fester Anker, egal
          wie der Rest gerade stand. Jetzt ist sie echtes Glas (glas-stark:
          Weichzeichner samt Saettigung, siehe globals.css) und kippt mit dem
          Rest der Oberflaeche mit - hell auf hell, dunkel auf dunkel.
          Das Polster oben faengt die Statusleiste ab, wenn die App vom
          Startbildschirm laeuft. */}
      <header className="glas-stark sticky top-0 z-20 border-b border-line pt-[env(safe-area-inset-top)] schatten-karte">
        <div
          className={`${shell} ${gutter} flex h-14 items-center justify-between gap-4`}
        >
          <Wordmark sub="Beraterbereich" />
          <div className="flex shrink-0 items-center gap-1">
            {/* Das Plus steht ganz links in der Gruppe - am weitesten weg von
                "Abmelden" und als einziges mit Flaeche: es ist die einzige
                Handlung hier, alles andere daneben ist Einstellung.
                Warum kein Navigationspunkt "Aktivitaeten": ein Tab wechselt die
                Seite, und wer zwischen zwei Anrufen +1 tippt, will genau das
                nicht - er will dort bleiben, wo er ist. Die Leiste traegt
                ausserdem schon acht Punkte.
                Hinter demselben Plus haengen inzwischen auch die Einheiten und
                der Wegweiser (docs/findbarkeit-plan.md) - aus demselben Grund
                und an derselben Stelle statt als zweites Symbol daneben. */}
            <Schnellzugriff istAdmin={user.role === "ADMIN"} wegweiserAn={wegweiserAn} />
            {/* Nur am Rechner und nur im Browser-Tab: das Symbol erklaert, wie
                Ergo CRM hier in ein eigenes Fenster kommt. Am Handy erscheint
                es nie - dort ist die Installation Pflicht und laengst
                erledigt, bevor jemand diese Kopfzeile ueberhaupt sieht. */}
            <AppInstallieren />
            {/* Das Megafon steht in der Kopfzeile und NICHT in der Navigation:
                ein Navigationspunkt kostet einen Platz und damit
                Aufmerksamkeit von allen - auch von denen, die nie etwas melden
                wollen (docs/audit-kernmodell.md, 5.14). Und kein schwebender
                Knopf unten rechts: dort liegt bereits die Undo-Leiste. */}
            <RueckmeldungGeben />
            <ThemaSchalter />
            <form action={logout}>
              {/* Am Handy nur das Symbol – der Text sprengt sonst die Kopfzeile. */}
              <button
                type="submit"
                aria-label="Abmelden"
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-muted transition hover:bg-sunken hover:text-ink sm:px-3"
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
      {/* Aus demselben Grund hier und nicht an der Zeile: ein Abschluss laesst
          die Zeile aus der Heute-Liste verschwinden, und mit ihr waere das
          Fenster weg, bevor jemand antworten konnte. */}
      <EinheitenNachAbschluss />
      {/* Haelt einmalig fest, wer die App wirklich vom Startbildschirm startet. */}
      <InstallationMelder melden={user.installedAt === null} />
    </div>
  );
}
