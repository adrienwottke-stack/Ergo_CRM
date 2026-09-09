import type { KalenderEintrag } from "@/lib/kalender/laden";

/** Kontaktakten kehren in genau die Kalenderansicht zurück, aus der sie geöffnet wurden. */
export function kalenderEintragHref(
  eintrag: KalenderEintrag,
  rueckweg: string,
): string | null {
  if (eintrag.href) return eintrag.href;
  if (!eintrag.kontaktId) return null;
  return `/contacts/${eintrag.kontaktId}?zurueck=${encodeURIComponent(rueckweg)}`;
}
