import { redirect } from "next/navigation";
import { requireUserOhneAvv } from "@/lib/auth";
import { avvAkzeptiert, AVV_VERSION, AVV_STAND } from "@/lib/avv";
import { AVV_ABSCHNITTE } from "@/lib/avv/text";
import AvvFormular from "@/components/AvvFormular";

// Kein Wegklicken: keine Navigation, kein Ueberspringen, keine Suchparameter,
// die etwas anderes bewirken. Die Seite hat genau zwei Ausgaenge - zustimmen
// oder abmelden.
export const metadata = { title: "Auftragsverarbeitung" };

// Der Volltext soll nicht aus dem Cache kommen, wenn die Fassung wechselt.
export const dynamic = "force-dynamic";

export default async function AvvSeite() {
  const user = await requireUserOhneAvv();

  // Gate aus (AVV_VERSION leer): es gibt keine Fassung, der man zustimmen
  // koennte. Ein Lesezeichen auf /avv landet dann einfach in der App.
  if (!AVV_VERSION) redirect("/heute");

  // Wer schon zugestimmt hat, hat hier nichts zu suchen. Verhindert, dass ein
  // Lesezeichen auf /avv eine zweite Zustimmung anbietet.
  if (await avvAkzeptiert(user.id)) redirect("/heute");

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-5 py-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-akzent">
          Fassung {AVV_VERSION} &middot; Stand {AVV_STAND}
        </p>
        <h1 className="text-2xl font-semibold">
          Vertrag zur Auftragsverarbeitung
        </h1>
        <p className="text-sm leading-relaxed text-white/70">
          Dieses CRM verarbeitet personenbezogene Daten Ihrer Kontakte in Ihrem
          Auftrag. Bevor Sie damit arbeiten koennen, muessen Sie diesem Vertrag
          nach Art.&nbsp;28 DSGVO zustimmen. Solange das nicht geschehen ist,
          koennen Sie in der Anwendung weder Daten anlegen noch einsehen.
        </p>
      </header>

      {/* Der Volltext, eingebettet und scrollbar - nicht als Link daneben.
          Wer zustimmt, soll gelesen haben koennen, was er unterschreibt, ohne
          die Seite zu verlassen. tabIndex, damit der Kasten auch per Tastatur
          scrollbar ist. */}
      <section
        aria-label="Volltext des Auftragsverarbeitungsvertrags"
        tabIndex={0}
        className="glas-dunkel h-[52vh] min-h-[280px] overflow-y-auto rounded-2xl border border-white/10 p-5 text-sm leading-relaxed text-white/80 focus:outline-none focus:ring-2 focus:ring-akzent"
      >
        {AVV_ABSCHNITTE.map((abschnitt) => (
          <article key={abschnitt.titel} className="mb-5 last:mb-0">
            <h2 className="mb-1 font-semibold text-white">{abschnitt.titel}</h2>
            {abschnitt.absaetze.map((absatz, i) => (
              <p key={i} className="mb-2 last:mb-0 whitespace-pre-line">
                {absatz}
              </p>
            ))}
          </article>
        ))}
      </section>

      <AvvFormular email={user.email} />
    </main>
  );
}
