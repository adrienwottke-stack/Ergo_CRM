"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/icons";

// Dialog-Huelle: auf dem Handy ein Bottom-Sheet (Daumen-Reichweite),
// ab Tablet ein zentriertes Fenster.
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // Scrollsperre ohne Sprung: die Breite der verschwindenden Scrollleiste
    // wird als Innenabstand ersetzt, sonst wird die Seite kurz breiter und
    // das sieht aus, als wuerde alles hineinzoomen.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Direkt an <body>: so liegt der Dialog garantiert ueber dem
  // ganzen Bildschirm und nicht in irgendeinem Layout-Container fest.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overscroll-contain bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:max-w-lg sm:rounded-xl"
      >
        {/* Grabber: signalisiert am Handy "das hier ist ein Sheet, zieh mich
            runter". Rein optisch - gezogen wird noch nicht, das Schliessen
            laeuft weiter ueber Backdrop, X oder Escape. */}
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-line-strong" aria-hidden />
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-soft transition hover:text-ink"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
