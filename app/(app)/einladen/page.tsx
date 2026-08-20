import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import QrCode from "@/components/schleuse/QrCode";
import EinladungErstellen from "@/components/EinladungErstellen";
import { eigeneEinladungZuruecknehmen } from "./actions";
import { card, pageTitle, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const datumFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

// Einladen fuer JEDEN Berater, nicht nur den Admin: Werben ist der Kern des
// Berufs. Der Neue haengt automatisch unter dem Einladenden - wer einlaedt,
// wird damit Fuehrungskraft und bekommt die Mannschafts-Sicht.
export default async function EinladenPage() {
  const user = await requireUser();
  const [invites, kopfzeilen] = await Promise.all([
    prisma.invite.findMany({
      where: { leaderId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        code: true,
        note: true,
        greeting: true,
        stake: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        usedBy: { select: { name: true } },
      },
    }),
    headers(),
  ]);

  const herkunft = `${kopfzeilen.get("x-forwarded-proto") ?? "http"}://${kopfzeilen.get("host") ?? ""}`;
  const jetzt = Date.now();

  const offen = invites.filter(
    (invite) =>
      invite.expiresAt.getTime() > jetzt &&
      (invite.maxUses === null || invite.usedCount < invite.maxUses)
  );
  const eingeloest = invites.filter((invite) => invite.usedCount > 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className={pageTitle}>Einladen</h1>
        <p className="mt-1 text-sm text-slate-500">
          Wer deinen Link öffnet, wird von dir persönlich begrüßt, baut im
          Start seine Namensliste — und hängt danach in deiner Struktur. Du
          siehst Zahlen und Pipeline, nie Kundennamen.
        </p>
      </div>

      <EinladungErstellen />

      {offen.length > 0 && (
        <section className={`${card} space-y-5 p-6`}>
          <h2 className={sectionTitle}>Offene Einladungen</h2>
          <ul className="space-y-6">
            {offen.map((invite) => {
              const link = `${herkunft}/einladung/${invite.code}`;
              return (
                <li key={invite.id} className="space-y-3 border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <code className="block break-all text-sm font-medium text-slate-900">
                        {link}
                      </code>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {invite.note ? `${invite.note} · ` : ""}
                        gültig bis {datumFormat.format(invite.expiresAt)}
                        {invite.maxUses === null
                          ? ` · Mehrfach-Code, ${invite.usedCount}× eingelöst`
                          : ""}
                        {invite.stake ? ` · Einsatz: ${invite.stake}` : ""}
                      </p>
                      {invite.greeting && (
                        <p className="mt-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs italic text-slate-600">
                          „{invite.greeting}“
                        </p>
                      )}
                    </div>
                    <form action={eigeneEinladungZuruecknehmen}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <button
                        type="submit"
                        className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-red-700"
                      >
                        Zurücknehmen
                      </button>
                    </form>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Der QR-Code ist fuer den Infoabend: Beamer an, zwanzig
                        Handys scannen gleichzeitig. */}
                    <div className="w-36 shrink-0">
                      <QrCode text={link} />
                    </div>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `${invite.greeting ? `${invite.greeting}\n\n` : ""}Dein Zugang zu unserem Team-CRM – dauert 3 Minuten: ${link}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-lg bg-emerald-50 px-4 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Per WhatsApp verschicken
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {eingeloest.length > 0 && (
        <section className={`${card} space-y-3 p-6`}>
          <h2 className={sectionTitle}>Angekommen</h2>
          <ul className="space-y-2">
            {eingeloest.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">
                  {invite.usedBy?.name ?? `${invite.usedCount} Konten`}
                  {invite.maxUses === null && invite.usedCount > 1
                    ? ` und ${invite.usedCount - 1} weitere`
                    : ""}
                </span>
                <span className="text-xs text-slate-500">
                  {invite.note ?? invite.code}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
