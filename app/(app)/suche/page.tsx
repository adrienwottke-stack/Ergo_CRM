import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eigene } from "@/lib/scope";
import { sucheImWegweiser } from "@/lib/wegweiser";
import { schalter } from "@/lib/features";
import { btnPrimary, column, inputBlank, pageTitle } from "@/components/ui";

export default async function SuchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q: raw } = await searchParams;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 100);
  const [kontakte, flags] = await Promise.all([
    q
      ? prisma.contact.findMany({
          where: {
            ...eigene(user.id).kontakte,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          },
          select: { id: true, name: true, phone: true },
          orderBy: { name: "asc" },
          take: 40,
        })
      : [],
    schalter("wegweiser"),
  ]);
  const funktionen =
    q && flags.wegweiser
      ? sucheImWegweiser(q, user.role === "ADMIN").slice(0, 8)
      : [];
  return (
    <div className={`${column} space-y-6`}>
      <h1 className={pageTitle}>Suchen</h1>
      <form className="flex flex-col gap-3 sm:flex-row" role="search">
        <label htmlFor="crm-suche" className="sr-only">
          Name, Telefonnummer oder Funktion
        </label>
        <input
          id="crm-suche"
          name="q"
          defaultValue={q}
          placeholder="Name, Telefonnummer oder Funktion"
          className={inputBlank}
          maxLength={100}
          autoComplete="off"
        />
        <button className={btnPrimary}>Suchen</button>
      </form>
      {!q && (
        <p className="text-ink-muted">
          Finde einen Kontakt oder suche nach einer Handlung, zum Beispiel
          „Einheiten eintragen“.
        </p>
      )}
      {q && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Kontakte</h2>
          {kontakte.length ? (
            <div className="crm-list">
              {kontakte.map((k) => (
                <Link
                  key={k.id}
                  className="crm-list-row"
                  href={`/contacts/${k.id}`}
                >
                  <span>
                    <span className="block font-semibold">{k.name}</span>
                    {k.phone && (
                      <span className="mt-1 block text-sm text-ink-muted">
                        {k.phone}
                      </span>
                    )}
                  </span>
                  <span className="ml-auto">›</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              Kein Kontakt gefunden. Prüfe die Schreibweise oder sammle einen
              neuen Namen.
            </p>
          )}
          {kontakte.length === 40 && (
            <p className="text-sm text-ink-muted">
              Die ersten 40 Treffer. Grenze deine Suche weiter ein.
            </p>
          )}
        </section>
      )}
      {funktionen.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Funktionen</h2>
          <div className="crm-list">
            {funktionen.map((f) => (
              <Link key={f.id} href={f.href} className="crm-list-row">
                {f.titel}
                <span className="ml-auto">›</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <Link
        href="/namen/sammeln"
        className="inline-flex min-h-11 items-center font-medium text-navy-700"
      >
        Namen sammeln →
      </Link>
    </div>
  );
}
