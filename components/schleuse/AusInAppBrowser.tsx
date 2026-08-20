"use client";

import { useState } from "react";
import Rahmen, { Schritt } from "./Rahmen";
import { istApple } from "@/lib/geraet";

// Der wichtigste Zweig: Der Einladungslink kommt per WhatsApp und oeffnet sich
// im eingebauten Browser von WhatsApp. Aus dem heraus laesst sich auf KEINEM
// Handy eine App installieren. Hier geht es also nur darum, ihn in seinen
// echten Browser zu bringen.
//
// Ein Fehlalarm darf nicht schaden: der Link ist kopierbar, weiter geht es
// immer (docs/willkommen-plan.md, Abschnitt 7.2).
export default function AusInAppBrowser({ link }: { link: string }) {
  const [kopiert, setKopiert] = useState(false);
  const apple = typeof navigator !== "undefined" && istApple();
  const browser = apple ? "Safari" : "Chrome";

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(link);
      setKopiert(true);
      window.setTimeout(() => setKopiert(false), 2500);
    } catch {
      // Ohne Zwischenablage-Recht bleibt der Link im Feld darunter zum
      // Markieren stehen. Kein Grund, hier eine Fehlermeldung zu bauen.
    }
  }

  return (
    <Rahmen
      kicker="Kurzer Umweg"
      titel={`Öffne das hier in ${browser}`}
      text={
        <p>
          Du bist gerade im Browser von WhatsApp. Der kann keine App auf dein Handy
          legen – und genau dort gehört Ergo CRM hin.
        </p>
      }
      fuss={
        <>
          <p className="mb-2 font-medium text-white">Falls der Menüpunkt anders heißt:</p>
          <p className="break-all rounded-lg bg-white/5 px-3 py-2 font-mono text-[12px] text-navy-200 ring-1 ring-inset ring-white/10">
            {link}
          </p>
          <p className="mt-2">
            Link kopieren, {browser} öffnen, einfügen. Dauert zehn Sekunden.
          </p>
        </>
      }
    >
      <ol className="space-y-4 rounded-2xl bg-white/5 p-5 ring-1 ring-inset ring-white/10">
        {apple ? (
          <>
            <Schritt nummer={1}>
              Tippe unten rechts auf die <strong>drei Punkte</strong>
            </Schritt>
            <Schritt nummer={2}>
              Wähle <strong>„In Safari öffnen“</strong>
            </Schritt>
          </>
        ) : (
          <>
            <Schritt nummer={1}>
              Tippe oben rechts auf die <strong>drei Punkte</strong> ⋮
            </Schritt>
            <Schritt nummer={2}>
              Wähle <strong>„In Chrome öffnen“</strong> oder{" "}
              <strong>„Im Browser öffnen“</strong>
            </Schritt>
          </>
        )}
        <Schritt nummer={3}>Dort geht es genau hier weiter</Schritt>
      </ol>

      <button
        type="button"
        onClick={kopieren}
        className="mt-4 min-h-12 w-full rounded-xl bg-amber-300 px-6 text-[15px] font-semibold text-navy-950 transition hover:bg-amber-200 active:scale-[0.99]"
      >
        {kopiert ? "Link kopiert" : "Link kopieren"}
      </button>
    </Rahmen>
  );
}
