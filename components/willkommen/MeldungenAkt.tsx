"use client";

// Der Willkommens-Akt fuer die Meldungen-Erlaubnis (Ausbau-Plan, Zug 1).
// Laeuft in AKTE UND LEADER_AKTE direkt nach "boot" (lib/willkommen.ts) - der
// Wecker braucht Empfaenger, und der erste Moment in der installierten App
// ist auf iOS die einzige Stelle, an der die Erlaubnis ueberhaupt erteilt
// werden kann.
//
// Dieselben zwei Regeln wie in components/Meldungen.tsx, dessen Knopf und
// Abo-Logik dieser Akt eins zu eins wiederverwendet:
//
// 1. NIE ungefragt nach der Erlaubnis fragen. Erst der eigene Knopf, der
//    erklaert wofuer - erst der Tipp darauf fragt den Browser.
// 2. Wer schon zugestimmt hat oder fuer den es technisch nicht geht, sieht
//    diesen Akt gar nicht: er ueberspringt sich selbst per onDone.
//
// Kein eigener Speicherzustand fuer "Spaeter" - die Wiederkehr uebernimmt die
// Karte auf /heute (dieselbe components/Meldungen.tsx, jetzt ganz oben statt
// hinter vollerUmfang versteckt).

import { useEffect, useState } from "react";
import { aboSpeichern } from "@/app/(app)/pushActions";
import { BellIcon } from "@/components/icons";

// Identisch zu components/Meldungen.tsx - der VAPID-Schluessel kommt
// Base64-URL-kodiert, der Browser will Bytes.
function schluesselZuBytes(base64: string): ArrayBuffer {
  const auffuellen = "=".repeat((4 - (base64.length % 4)) % 4);
  const roh = atob((base64 + auffuellen).replace(/-/g, "+").replace(/_/g, "/"));
  const puffer = new ArrayBuffer(roh.length);
  const bytes = new Uint8Array(puffer);
  for (let i = 0; i < roh.length; i += 1) bytes[i] = roh.charCodeAt(i);
  return puffer;
}

type Stand = "prüft" | "geht nicht" | "aus" | "blockiert" | "an" | "lädt";

export default function MeldungenAkt({ onDone }: { onDone: () => void }) {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const [stand, setStand] = useState<Stand>("prüft");
  const [fehler, setFehler] = useState<string | null>(null);

  // Prueft den vorhandenen Stand - exakt wie in components/Meldungen.tsx.
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !vapidKey
    ) {
      setStand("geht nicht");
      return;
    }
    if (Notification.permission === "denied") {
      setStand("blockiert");
      return;
    }

    let abgebrochen = false;
    void navigator.serviceWorker.ready.then(async (registrierung) => {
      const vorhanden = await registrierung.pushManager.getSubscription();
      if (abgebrochen) return;
      setStand(vorhanden ? "an" : "aus");
    });
    return () => {
      abgebrochen = true;
    };
  }, [vapidKey]);

  // Schon erledigt oder geht technisch nicht: dieser Akt hat dann nichts zu
  // tun und zeigt sich nicht erst kurz, bevor er wieder verschwindet.
  useEffect(() => {
    if (stand === "an" || stand === "geht nicht" || stand === "blockiert") {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stand]);

  const einschalten = async () => {
    setFehler(null);
    setStand("lädt");
    try {
      const erlaubnis = await Notification.requestPermission();
      if (erlaubnis !== "granted") {
        setStand(erlaubnis === "denied" ? "blockiert" : "aus");
        return;
      }

      const registrierung = await navigator.serviceWorker.ready;
      const abo =
        (await registrierung.pushManager.getSubscription()) ??
        (await registrierung.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: schluesselZuBytes(vapidKey),
        }));

      const daten = abo.toJSON();
      await aboSpeichern({
        endpoint: abo.endpoint,
        p256dh: daten.keys?.p256dh ?? "",
        auth: daten.keys?.auth ?? "",
      });
      setStand("an");
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Das hat nicht geklappt.");
      setStand("aus");
    }
  };

  // Waehrend geprueft wird oder der Akt sich sowieso gleich selbst
  // ueberspringt: nichts zeigen, kein Aufblitzen einer Karte, die im nächsten
  // Augenblick schon wieder weg ist.
  if (stand === "prüft" || stand === "an" || stand === "geht nicht" || stand === "blockiert") {
    return null;
  }

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div className="space-y-2">
        <p className="text-2xl font-bold leading-snug text-white">Sag mir Bescheid.</p>
        <p className="text-sm leading-relaxed text-slate-300">
          Jeden Morgen meldet sich die App mit dem einen Namen, der wartet —
          sonst musst du selbst dran denken.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={einschalten}
          disabled={stand === "lädt"}
          className="inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-akzent text-15 font-bold text-white transition hover:bg-akzent-stark active:scale-[0.98] disabled:opacity-40"
        >
          <BellIcon className="h-4 w-4" />
          {stand === "lädt" ? "Moment …" : "Einschalten"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="block w-full text-center text-sm text-slate-400 hover:text-white"
        >
          Später
        </button>
        {fehler && <p className="text-center text-xs text-red-400">{fehler}</p>}
      </div>
    </div>
  );
}
