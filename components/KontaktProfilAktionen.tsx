"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ContactActionDialog, {
  type ContactLite,
} from "@/components/ContactActionDialog";
import { CalendarCheckIcon, ClipboardIcon, PhoneIcon } from "@/components/icons";

const basis =
  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-akzent";
const aktion = `${basis} border border-line-strong bg-surface text-ink hover:bg-sunken`;
const hauptaktion = `${basis} bg-akzent text-white hover:bg-akzent-stark`;

export default function KontaktProfilAktionen({
  contact,
}: {
  contact: ContactLite;
}) {
  const [terminOffen, setTerminOffen] = useState(false);
  const anrufGestartet = useRef(false);
  const bearbeiten = `/contacts/${contact.id}/edit`;

  useEffect(() => {
    const ergebnisOeffnen = () => {
      if (!anrufGestartet.current || document.visibilityState === "hidden") return;
      anrufGestartet.current = false;
      const details = document.getElementById("anrufergebnis") as HTMLDetailsElement | null;
      if (!details) return;
      details.open = true;
      details.scrollIntoView({ behavior: "smooth", block: "center" });
      details.querySelector<HTMLElement>("button, a, summary")?.focus({ preventScroll: true });
    };

    window.addEventListener("focus", ergebnisOeffnen);
    document.addEventListener("visibilitychange", ergebnisOeffnen);
    return () => {
      window.removeEventListener("focus", ergebnisOeffnen);
      document.removeEventListener("visibilitychange", ergebnisOeffnen);
    };
  }, []);

  return (
    <>
      <div className="grid grid-cols-3 gap-2" aria-label="Kontaktaktionen">
        {contact.phone ? (
          <a
            href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
            className={hauptaktion}
            onClick={() => {
              anrufGestartet.current = true;
            }}
          >
            <PhoneIcon className="h-5 w-5" />
            Anrufen
          </a>
        ) : (
          <Link href={`${bearbeiten}#phone`} className={hauptaktion}>
            <PhoneIcon className="h-5 w-5" />
            <span>Anrufen</span>
            <span className="text-[11px] font-normal text-white">
              Nummer ergänzen
            </span>
          </Link>
        )}
        <button
          type="button"
          className={aktion}
          onClick={() => setTerminOffen(true)}
        >
          <CalendarCheckIcon className="h-5 w-5 text-link" />
          Termin
        </button>
        <Link href={`${bearbeiten}#note`} className={aktion}>
          <ClipboardIcon className="h-5 w-5 text-link" />
          Notiz
        </Link>
      </div>

      <ContactActionDialog
        open={terminOffen}
        mode="stage"
        targetStage="TERMIN_VEREINBART"
        contact={contact}
        onClose={() => setTerminOffen(false)}
      />
    </>
  );
}
