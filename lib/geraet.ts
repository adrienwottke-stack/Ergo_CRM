// Die vier Erkennungen der Installations-Schleuse an genau einer Stelle
// (docs/willkommen-plan.md, Abschnitt 7.2).
//
// Alles hier laeuft im Browser - der Server kann keine dieser Fragen
// beantworten. Und alles hier ist Fuehrung, keine Sicherheitsgrenze: wer die
// Erkennung umgehen will, kann das. Fuer den Zweck reicht es.

export type Zweig =
  | "unbekannt" // noch nicht entschieden (erster Renderdurchlauf)
  | "inapp" // WhatsApp-/Instagram-Browser: kann nicht installieren
  | "rechner" // kein Handy: QR-Code, sonst nichts
  | "app" // laeuft schon vom Startbildschirm: freie Fahrt
  | "iphone"
  | "android";

function kennung(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

/** iPhone, iPad oder ein Mac mit Touch (iPadOS meldet sich als Mac). */
export function istApple(): boolean {
  const ua = kennung();
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
}

/**
 * Eingebettete Browser von WhatsApp, Instagram, Facebook und Co.
 *
 * Auf Android sind das WebViews, erkennbar am "; wv" in der Kennung. Auf iOS
 * sieht die Kennung fast aus wie Safari - dort verraet es sich anders:
 * navigator.standalone gibt es nur im echten Safari, in einer WKWebView ist es
 * undefined.
 *
 * Die Kennungen aendern sich staendig. Deshalb ist dieser Zweig so gebaut,
 * dass ein Fehlalarm nicht schadet: er zeigt den Weg in den echten Browser und
 * laesst den Link kopieren - weiter geht es immer.
 */
export function istInAppBrowser(): boolean {
  const ua = kennung();
  if (!ua) return false;
  if (/\bwv\b|FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Snapchat/i.test(ua)) {
    return true;
  }
  if (istApple() && /Mobile/i.test(ua)) {
    return (navigator as Navigator & { standalone?: boolean }).standalone === undefined;
  }
  return false;
}

/**
 * Handy oder Tablet. Ein Notebook mit Touchscreen faellt nicht darauf herein,
 * weil dessen Hauptzeiger die Maus ist und damit "fine" meldet.
 */
export function istHandy(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse) and (max-width: 1024px)").matches;
}

/** Laeuft die Seite vom Startbildschirm statt im Browser-Tab? */
export function laeuftAlsApp(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS kennt display-mode nicht zuverlaessig, dafuer aber diese Eigenschaft.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Die Reihenfolge ist Absicht: "kein Handy" wird vor "schon installiert"
 * geprueft. Sonst kaeme jemand durch, der die App am Rechner installiert hat -
 * und genau das wollen wir nicht.
 */
export function zweigErmitteln(): Zweig {
  if (istInAppBrowser()) return "inapp";
  if (!istHandy()) return "rechner";
  if (laeuftAlsApp()) return "app";
  return istApple() ? "iphone" : "android";
}
