export const authCookieName = "ergo_crm_auth";

// Edge-kompatibel (Web Crypto), damit es auch in der Middleware läuft.
export async function authTokenValue(): Promise<string> {
  const data = new TextEncoder().encode(
    `ergo-crm:${process.env.APP_PASSWORD ?? ""}`
  );
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
