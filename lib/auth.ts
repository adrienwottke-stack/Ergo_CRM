export const authCookieName = "ergo_crm_auth";
export const teamCookieName = "ergo_crm_team_auth";
export const personCookieName = "ergo_crm_person_id";

// Edge-kompatibel (Web Crypto), damit es auch in der Middleware läuft.
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Vollzugriff: privates Kontakt-CRM + Team-Wettbewerb.
export async function authTokenValue(): Promise<string> {
  return sha256Hex(`ergo-crm:${process.env.APP_PASSWORD ?? ""}`);
}

// Team-Zugang: nur Aktivitäten loggen + Rangliste ansehen, keine Kontaktdaten.
export async function teamTokenValue(): Promise<string> {
  return sha256Hex(`ergo-crm-team:${process.env.TEAM_PASSWORD ?? ""}`);
}
