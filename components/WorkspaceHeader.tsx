"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HAUPTNAVIGATION, navAktiv } from "@/lib/navigation";
import { contactListReturn } from "@/lib/contact-navigation";
import ArbeitsDialog from "@/components/ArbeitsDialog";

export function WorkspaceTitle() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = HAUPTNAVIGATION.find(link => navAktiv(link, pathname));
  if (/^\/contacts\/[^/]+/.test(pathname)) {
    return <Link href={contactListReturn(params.get("returnTo"))} className="crm-mobile-title crm-mobile-back" aria-label="Zurück zu Kontakten"><span aria-hidden>‹</span> Kontakte</Link>;
  }
  return <span className="crm-mobile-title">{current?.label ?? (pathname.startsWith("/profil") ? "Profil" : pathname.startsWith("/hilfe") ? "Hilfe" : pathname.startsWith("/zinsrechner") ? "Rechner" : "Cockpit")}</span>;
}

export function WorkspaceTools({ calculatorEnabled }: { calculatorEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".crm-header");
    const dock = document.querySelector<HTMLElement>(".crm-dock");
    const measure = () => {
      const root = document.documentElement;
      root.style.setProperty("--workspace-header-height", `${header?.getBoundingClientRect().height ?? 57}px`);
      root.style.setProperty("--workspace-measured-dock-height", `${window.innerWidth < 1100 ? dock?.getBoundingClientRect().height ?? 0 : 0}px`);
    };
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (dock) observer.observe(dock);
    window.addEventListener("resize", measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      const active = document.activeElement;
      const editable = active instanceof HTMLElement && active.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]');
      const keyboard = !!viewport && editable && window.innerHeight - viewport.height > 120;
      document.documentElement.dataset.workspaceKeyboard = String(keyboard);
      document.documentElement.style.setProperty("--workspace-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
      if (keyboard) active.scrollIntoView({ block: "nearest", behavior: "instant" });
    };
    viewport?.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    update();
    return () => { viewport?.removeEventListener("resize", update); document.removeEventListener("focusin", update); document.removeEventListener("focusout", update); delete document.documentElement.dataset.workspaceKeyboard; };
  }, []);
  return <>
    <button type="button" className="crm-icon-button crm-tools-button" aria-label="Werkzeuge und Profil" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <svg aria-hidden viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    </button>
    <ArbeitsDialog open={open} onClose={() => setOpen(false)} title="Werkzeuge und Profil">
      <nav aria-label="Weitere Werkzeuge" className="crm-tools-menu" onClick={event => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}>
        <Link href="/profil">Profil und Einstellungen <span aria-hidden>→</span></Link>
        <Link href="/hilfe">Hilfe und Support <span aria-hidden>→</span></Link>
        {calculatorEnabled && <Link href="/zinsrechner">Zinsrechner <span aria-hidden>→</span></Link>}
      </nav>
    </ArbeitsDialog>
  </>;
}
