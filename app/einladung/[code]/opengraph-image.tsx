import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { normalisiereCode } from "@/lib/einladung";

// Das Vorschaubild, das WhatsApp unter den Einladungslink haengt. Der wahre
// erste Eindruck passiert VOR dem ersten Klick - eine nackte URL wirbt fuer
// nichts. Navy, Gold, der Name des Einladenden: mehr braucht es nicht.

export const alt = "Einladung ins Team";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgBild({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: codeRaw } = await params;
  const code = normalisiereCode(decodeURIComponent(codeRaw));

  const invite = await prisma.invite.findUnique({
    where: { code },
    select: { leader: { select: { name: true } } },
  });
  const name = invite?.leader.name ?? "Dein Team";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(160deg, #0a1628 0%, #12233c 60%, #1a3253 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Signet: aufsteigender Kurs im Rondell, wie in der Wortmarke. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "48px",
          }}
        >
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="#1a3253" />
            <path
              d="M8 20.5 13.5 15l3.5 3.5 7-7.5"
              stroke="#d4a942"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.5 11h3.5v3.5"
              stroke="#d4a942"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: "36px", fontWeight: 600, color: "#93b4d9" }}>
            Ergo CRM
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ fontSize: "72px", fontWeight: 700, lineHeight: 1.1 }}>
            {name} lädt dich ins Team ein.
          </span>
          <span style={{ fontSize: "34px", color: "#bed3ea" }}>
            Dein Zugang dauert 3 Minuten — danach steht deine erste Liste.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "56px",
            width: "220px",
            height: "10px",
            borderRadius: "5px",
            background: "#d4a942",
          }}
        />
      </div>
    ),
    size
  );
}
