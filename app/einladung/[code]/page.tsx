import type { Metadata } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalisiereCode, statusVon } from "@/lib/einladung";
import { btnPrimary, card, input, label, pageTitle } from "@/components/ui";
import Schleuse from "@/components/schleuse/Schleuse";
import QrCode from "@/components/schleuse/QrCode";
import { einladungEinloesen } from "./actions";

export const dynamic = "force-dynamic";

// Diese Seite bekommt ihr eigenes Manifest (docs/willkommen-plan.md, 7.3):
// Nur so traegt die frisch installierte App den Einladungscode mit und startet
// wieder hier statt vor einem Anmeldefenster ohne Konto.
//
// Titel und Beschreibung stehen hier fuer die WhatsApp-Vorschau: zusammen mit
// dem Bild aus opengraph-image.tsx ist der Link eine Einladung, keine URL.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code: codeRaw } = await params;
  const code = normalisiereCode(decodeURIComponent(codeRaw));
  const invite = await prisma.invite.findUnique({
    where: { code },
    select: { leader: { select: { name: true } } },
  });
  const titel = invite
    ? `${invite.leader.name} lädt dich ins Team ein`
    : "Einladung ins Team";
  return {
    manifest: `/einladung/${encodeURIComponent(code)}/manifest.webmanifest`,
    title: titel,
    description: "Dein Zugang dauert 3 Minuten — danach steht deine erste Liste.",
    openGraph: {
      title: titel,
      description: "Dein Zugang dauert 3 Minuten — danach steht deine erste Liste.",
    },
  };
}

const fehlertexte: Record<string, string> = {
  invalid: "Bitte prüfe Name, E-Mail-Adresse und Passwort (mindestens 8 Zeichen).",
  unbekannt: "Diesen Einladungscode gibt es nicht.",
  verbraucht: "Diese Einladung wurde bereits benutzt oder ist abgelaufen.",
  email_vergeben: "Für diese E-Mail-Adresse gibt es schon ein Konto. Melde dich einfach an.",
  name_vergeben: "Dieser Name ist in der Rangliste schon vergeben. Nimm eine andere Schreibweise.",
};

function Hinweis({ titel, text }: { titel: string; text: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className={`${card} w-full p-8 text-center`}>
        <h1 className={pageTitle}>{titel}</h1>
        <p className="mt-3 text-sm text-slate-600">{text}</p>
        <a href="/login" className="mt-6 inline-block text-sm font-medium text-navy-700 hover:underline">
          Zur Anmeldung
        </a>
      </div>
    </div>
  );
}

export default async function EinladungPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ code: codeRaw }, { error }] = await Promise.all([params, searchParams]);
  const code = normalisiereCode(decodeURIComponent(codeRaw));

  const [invite, kopfzeilen] = await Promise.all([
    prisma.invite.findUnique({
      where: { code },
      select: {
        usedCount: true,
        maxUses: true,
        expiresAt: true,
        note: true,
        browserFreigabe: true,
        leader: { select: { name: true } },
      },
    }),
    headers(),
  ]);

  if (!invite) {
    return (
      <Hinweis
        titel="Einladung nicht gefunden"
        text="Der Code stimmt nicht. Frag die Person, die dich eingeladen hat, nach einem neuen Link."
      />
    );
  }

  const status = statusVon(invite);
  if (status === "eingeloest") {
    return (
      <Hinweis
        titel="Einladung schon benutzt"
        text="Aus dieser Einladung ist bereits ein Konto entstanden. Melde dich mit deiner E-Mail-Adresse an."
      />
    );
  }
  if (status === "abgelaufen") {
    return (
      <Hinweis
        titel="Einladung abgelaufen"
        text="Der Link war 14 Tage gültig. Lass dir einfach einen neuen schicken."
      />
    );
  }

  // Der Link muss vollstaendig dastehen: er steht im QR-Code fuer den
  // Rechner-Zweig und laesst sich aus dem WhatsApp-Browser kopieren.
  const herkunft = `${kopfzeilen.get("x-forwarded-proto") ?? "http"}://${kopfzeilen.get("host") ?? ""}`;
  const link = `${herkunft}/einladung/${encodeURIComponent(code)}`;

  // Alles ab hier liegt hinter der Installations-Schleuse: das Formular
  // erscheint erst, wenn die Seite vom Startbildschirm laeuft (Akt 0).
  return (
    <Schleuse
      freigegeben={invite.browserFreigabe}
      link={link}
      qr={<QrCode text={link} />}
    >
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-6 text-center">
            <h1 className={pageTitle}>Willkommen im Team</h1>
            <p className="mt-2 text-sm text-slate-600">
              {invite.leader.name} hat dich eingeladen. Leg dir hier deinen Zugang an –
              deine Kontakte gehören danach dir allein.
            </p>
          </div>

          <form action={einladungEinloesen} className={`${card} space-y-5 p-6 sm:p-8`}>
            <input type="hidden" name="code" value={code} />

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
                {fehlertexte[error] ?? fehlertexte.invalid}
              </p>
            )}

            <div>
              <label htmlFor="name" className={label}>Dein Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={60}
                autoComplete="name"
                className={input}
              />
              <p className="mt-1 text-xs text-slate-500">
                So stehst du in der Rangliste.
              </p>
            </div>

            <div>
              <label htmlFor="email" className={label}>E-Mail-Adresse</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={input}
              />
            </div>

            <div>
              <label htmlFor="password" className={label}>Passwort (mindestens 8 Zeichen)</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={input}
              />
            </div>

            <button type="submit" className={`${btnPrimary} min-h-[44px] w-full justify-center`}>
              Zugang anlegen
            </button>

            <p className="text-center text-xs text-slate-500">
              {invite.leader.name} sieht deine Aktivitätszahlen und deine Pipeline –
              aber keine Namen deiner Kunden.
            </p>
          </form>
        </div>
      </div>
    </Schleuse>
  );
}
