/** Ein Rückweg bleibt in der Anwendung, auch bei direkt eingegebenen URLs. */
export function internerRueckweg(value: string | undefined, fallback: string): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const url = new URL(value, "https://cockpit.invalid");
    return url.origin === "https://cockpit.invalid" ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch { return fallback; }
}
