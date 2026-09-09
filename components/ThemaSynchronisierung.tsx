"use client";

import { useEffect } from "react";

/** Next kann Metadaten nach dem frühen Theme-Skript erneut einsetzen. */
export default function ThemaSynchronisierung() {
  useEffect(() => {
    const synchronisieren = () => {
      const farbe = document.documentElement.classList.contains("dark") ? "#0c131e" : "#eef2f8";
      document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
        if (meta.getAttribute("content") !== farbe) meta.setAttribute("content", farbe);
      });
    };
    const beobachter = new MutationObserver(synchronisieren);
    beobachter.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["content"] });
    beobachter.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    synchronisieren();
    return () => beobachter.disconnect();
  }, []);
  return null;
}
