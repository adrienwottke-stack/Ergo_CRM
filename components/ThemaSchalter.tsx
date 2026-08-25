"use client";

import { useEffect, useState } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";

// Hell, dunkel oder das, was das Geraet sagt.
//
// Ein einziger Knopf, der weiterschaltet - kein Menue. In der Kopfzeile ist
// Platz knapp, und die Entscheidung ist so klein, dass ein Menue mehr Aufwand
// waere als die Sache wert. Was gerade gilt, steht im Symbol; was als
// Naechstes kaeme, im Tooltip.
//
// Gesetzt wird die Klasse "dark" am <html>-Element. Beim ersten Laden macht
// das schon das Inline-Skript in app/layout.tsx - hier wird nur noch
// umgeschaltet und gemerkt.

const THEMEN = ["system", "hell", "dunkel"] as const;
type Thema = (typeof THEMEN)[number];

export const THEMA_SCHLUESSEL = "ergo-thema";

const beschriftung: Record<Thema, string> = {
  system: "Systemvorgabe",
  hell: "Helle Ansicht",
  dunkel: "Dunkle Ansicht",
};

function istDunkel(thema: Thema) {
  if (thema === "dunkel") return true;
  if (thema === "hell") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function anwenden(thema: Thema) {
  document.documentElement.classList.toggle("dark", istDunkel(thema));
}

export default function ThemaSchalter() {
  // Beim Serverdurchlauf gibt es kein localStorage. Wir starten deshalb auf
  // "system" und holen die echte Einstellung im ersten Effekt nach - sonst
  // wuerde React ueber unterschiedliches Markup meckern.
  const [thema, setThema] = useState<Thema>("system");
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    const gemerkt = localStorage.getItem(THEMA_SCHLUESSEL) as Thema | null;
    if (gemerkt && THEMEN.includes(gemerkt)) setThema(gemerkt);
    setBereit(true);
  }, []);

  // Wer "system" gewaehlt hat, soll mitkippen, wenn das Geraet abends
  // umschaltet - ohne die Seite neu zu laden.
  useEffect(() => {
    if (!bereit) return;
    anwenden(thema);
    if (thema !== "system") return;
    const abfrage = window.matchMedia("(prefers-color-scheme: dark)");
    const reagieren = () => anwenden("system");
    abfrage.addEventListener("change", reagieren);
    return () => abfrage.removeEventListener("change", reagieren);
  }, [thema, bereit]);

  function weiter() {
    const naechstes = THEMEN[(THEMEN.indexOf(thema) + 1) % THEMEN.length]!;
    setThema(naechstes);
    localStorage.setItem(THEMA_SCHLUESSEL, naechstes);
  }

  const Symbol =
    thema === "hell" ? SunIcon : thema === "dunkel" ? MoonIcon : MonitorIcon;

  return (
    <button
      type="button"
      onClick={weiter}
      title={`Ansicht: ${beschriftung[thema]}`}
      aria-label={`Ansicht umschalten. Aktuell: ${beschriftung[thema]}`}
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-navy-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
    >
      {/* Bis die gemerkte Einstellung da ist, bleibt das Symbol unsichtbar -
          sonst blitzt kurz das falsche auf. Der Platz wird trotzdem gehalten,
          damit die Kopfzeile nicht springt. */}
      <Symbol className={`h-4.5 w-4.5 ${bereit ? "" : "opacity-0"}`} />
    </button>
  );
}
