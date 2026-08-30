import { card } from "@/components/ui";

// "Etwas von der Rangliste" - eine Zeile, kein Reiter
// (docs/ausbau-plan.md, Abschnitt 4).
//
// Auf Ausbau 1 ist der ganze Wettbewerbsbereich zu: keine Arena, kein Sprint,
// kein Puls, kein Spiel. Was bleibt, ist der Grund, warum die Rangliste
// ueberhaupt zieht - danebensteht, was die anderen geschafft haben.
//
// KEIN LINK. Das Ziel ist auf dieser Stufe gesperrt; ein Link fuehrte in die
// Sperrseite und damit ins Leere. Eine Zeile, die nur dasteht, ist hier
// ehrlicher als eine, die etwas verspricht.
//
// Und bewusst keine Punktzahl der anderen: der Platz genuegt. Wer am ersten
// Tag anfaengt, soll sehen, dass es ein Feld gibt - nicht, wie weit vorne es
// ohne ihn schon laeuft.

export default function RanglisteZeile({
  platz,
  koepfe,
  ueberMir,
}: {
  /** Eigener Platz, 1-basiert. null = diese Woche noch nichts getan. */
  platz: number | null;
  koepfe: number;
  /** Die Namen direkt ueber einem, hoechstens zwei. Von unten nach oben. */
  ueberMir: string[];
}) {
  // Unter drei Koepfen ist ein Platz keine Auskunft, sondern eine Peinlichkeit
  // fuer alle Beteiligten. Dann steht hier gar nichts.
  if (koepfe < 3) return null;

  return (
    <div className={`${card} px-4 py-3`}>
      {platz === null ? (
        <p className="text-sm text-ink-muted">
          Diese Woche steht noch nichts von dir in der Rangliste.{" "}
          <span className="text-ink-soft">
            Ein Anruf genügt, um drin zu sein.
          </span>
        </p>
      ) : (
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">
            Platz {platz} von {koepfe}
          </span>{" "}
          diese Woche
          {ueberMir.length > 0 && (
            <>
              {" — über dir "}
              <span className="text-ink">{ueberMir.join(" und ")}</span>
            </>
          )}
          .
        </p>
      )}
    </div>
  );
}
