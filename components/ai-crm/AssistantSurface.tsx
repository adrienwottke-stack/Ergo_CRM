"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAssistant } from "@/components/ai-crm/AssistantProvider";
import AssistantView, { AssistantConversationList } from "@/components/ai-crm/AssistantView";

export default function AssistantSurface({ userId }: { userId: string }) {
  const assistant = useAssistant();
  const { register, showWorkspace, visible, mode, close } = assistant;
  const pathname = usePathname();
  useEffect(() => register(userId), [userId, register]);
  useEffect(() => { if (pathname === "/assistent") showWorkspace(); }, [pathname, showWorkspace]);
  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    const main = document.getElementById("hauptinhalt");
    const originalOverflow = document.body.style.overflow;
    const sync = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      root.style.setProperty("--assistant-viewport-height", `${height}px`);
      root.style.setProperty("--assistant-viewport-top", `${top}px`);
      root.style.setProperty("--assistant-keyboard-bottom", `${Math.max(0, window.innerHeight - height - top)}px`);
      const header = document.querySelector(".crm-header");
      root.style.setProperty("--assistant-header-bottom", `${header?.getBoundingClientRect().bottom ?? 122}px`);
      const full = window.innerWidth < 1100 || mode === "workspace";
      if (main) main.inert = full;
      document.body.style.overflow = full ? "hidden" : originalOverflow;
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) close();
      if (event.key === "F6" && window.innerWidth >= 1100 && mode === "panel") {
        event.preventDefault(); const inAssistant = document.activeElement?.closest("#crm-assistant-surface");
        if (inAssistant) { main?.setAttribute("tabindex", "-1"); main?.focus(); }
        else document.querySelector<HTMLButtonElement>(".assistant-header button")?.focus();
      }
    };
    sync(); window.addEventListener("resize", sync); window.visualViewport?.addEventListener("resize", sync); window.visualViewport?.addEventListener("scroll", sync); window.addEventListener("keydown", keyboard);
    const headerObserver = new ResizeObserver(sync);
    const header = document.querySelector(".crm-header");
    if (header) headerObserver.observe(header);
    return () => {
      if (main) main.inert = false; document.body.style.overflow = originalOverflow;
      headerObserver.disconnect();
      window.removeEventListener("resize", sync); window.visualViewport?.removeEventListener("resize", sync); window.visualViewport?.removeEventListener("scroll", sync); window.removeEventListener("keydown", keyboard);
      root.style.removeProperty("--assistant-keyboard-bottom");
    };
  }, [visible, mode, close]);
  if (!assistant.visible) return null;
  return <aside id="crm-assistant-surface" className="assistant-surface" data-mode={assistant.mode} aria-label="Assistent Arbeitsbereich"><div className="assistant-workspace-list"><AssistantConversationList /><button className="assistant-workspace-details" onClick={() => assistant.setSection("details")}>Speicherung und Zugang</button></div><AssistantView /></aside>;
}
