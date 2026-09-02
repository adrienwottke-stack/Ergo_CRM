import { readFile } from "node:fs/promises";
import path from "node:path";
import { AVV_VERSION, AVV_STAND, avvPdfPfad } from "@/lib/avv";

// --- Der Versand ---------------------------------------------------------------
// Resend ueber die HTTP-Schnittstelle, absichtlich OHNE zusaetzliches Paket:
// ein fetch reicht, und die Abhaengigkeitsliste bleibt so kurz wie bisher.
// Ein anderer Anbieter tauscht genau diese eine Funktion.
//
// Fehlt der Schluessel, passiert nichts und es wird protokolliert. Die
// Anwendung laeuft dann vollstaendig - nur ohne Belegmail. Derselbe Umgang
// wie bei Web-Push (siehe .env.example).
const ABSENDER = process.env.AVV_MAIL_FROM;
const SCHLUESSEL = process.env.RESEND_API_KEY;

export async function avvBestaetigungSenden(user: {
  name: string;
  email: string | null;
}): Promise<void> {
  if (!user.email) {
    console.warn("AVV-Bestaetigung: Konto ohne E-Mail-Adresse, kein Versand.");
    return;
  }
  if (!SCHLUESSEL || !ABSENDER) {
    console.warn(
      "AVV-Bestaetigung: RESEND_API_KEY oder AVV_MAIL_FROM fehlt, kein Versand."
    );
    return;
  }

  // Die PDF-Fassung, die zugestimmt wurde - nicht die jeweils neueste. Der
  // Dateiname traegt die Fassung, alte Dateien bleiben liegen.
  const datei = path.join(process.cwd(), avvPdfPfad());
  let pdf: Buffer;
  try {
    pdf = await readFile(datei);
  } catch {
    // Ohne Anhang keine Mail. Eine Bestaetigung ohne das Dokument, auf das sie
    // sich beruft, ist schlechter als keine.
    console.error(`AVV-Bestaetigung: ${datei} fehlt, kein Versand.`);
    return;
  }

  const antwort = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SCHLUESSEL}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ABSENDER,
      to: [user.email],
      subject: `Ihr Auftragsverarbeitungsvertrag (Fassung ${AVV_VERSION})`,
      text: [
        `Hallo ${user.name},`,
        "",
        `Sie haben soeben dem Vertrag zur Auftragsverarbeitung in der Fassung ${AVV_VERSION} vom ${AVV_STAND} zugestimmt.`,
        "",
        "Die angenommene Fassung liegt dieser Mail als PDF bei. Bitte bewahren Sie sie auf.",
        "",
        "Tracker",
      ].join("\n"),
      attachments: [
        {
          filename: `Auftragsverarbeitungsvertrag-${AVV_VERSION}.pdf`,
          content: pdf.toString("base64"),
        },
      ],
    }),
  });

  if (!antwort.ok) {
    throw new Error(
      `Resend antwortete mit ${antwort.status}: ${await antwort.text()}`
    );
  }
}
