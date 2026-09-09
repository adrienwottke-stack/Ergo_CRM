import Link from "next/link";
import type { ZielStand } from "@/lib/ziele";
import { zielPruefzeit, formatZielwert } from "@/lib/ziele-modell";
import {
  hauptzielWaehlen,
  zielAntworten,
  zielArchivieren,
  zielErfolgTeilen,
} from "@/app/(app)/fortschritt/actions";
import { btnSecondary, btnPrimary, card } from "@/components/ui";
import Fortschritt from "@/components/Fortschritt";

const datum = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default function ZielKarte({
  ziel,
  userId,
  hauptzielId,
}: {
  ziel: ZielStand;
  userId: string;
  hauptzielId: string | null;
}) {
  const eigen = ziel.inhaberId === userId;
  const vorgeschlagen = ziel.zusage === "OFFEN" && !ziel.archiviertAt;
  const ende = new Date(ziel.ende.getTime() - 1);
  return (
    <article className={`${card} space-y-4 p-5`}>
      <div>
        <p className="text-sm text-ink-muted">
          {eigen ? "Dein Ziel" : `Für ${ziel.inhaber.name}`}
          {ziel.id === hauptzielId ? " · Auf Heute" : ""}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">{ziel.titel}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {datum.format(ziel.start)} – {datum.format(ende)}
        </p>
      </div>
      {vorgeschlagen ? (
        <p>
          Vorschlag von {ziel.erstelltVon.name}.{" "}
          {eigen ? "Passt dieses Ziel für dich?" : "Wartet auf Bestätigung."}
        </p>
      ) : (
        <>
          <p className="text-2xl font-semibold tabular-nums">
            {ziel.standText}{" "}
            <span className="text-base font-normal">{ziel.kennzahlText}</span>
          </p>
          <Fortschritt
            anteil={ziel.anteil}
            hoehe="kraeftig"
            beschriftung={`${ziel.standText} ${ziel.kennzahlText}`}
            ton={ziel.geschafft ? "erfolg" : "info"}
          />
        </>
      )}
      {vorgeschlagen && (
        <p className="text-lg font-semibold">
          Ziel: {formatZielwert(ziel.zielwert, ziel.kennzahl)}{" "}
          {ziel.kennzahlText}
        </p>
      )}
      {ziel.wunsch && <p className="text-base text-ink-muted">{ziel.wunsch}</p>}
      {ziel.zusage === "ABGELEHNT" && (
        <p className="text-sm">Vorschlag abgelehnt.</p>
      )}
      {ziel.archiviertAt && <p className="text-sm">Von dir beendet.</p>}
      {eigen && vorgeschlagen && ziel.ende > zielPruefzeit(ziel.zeitraum) && (
        <form action={zielAntworten} className="flex flex-wrap gap-3">
          <input type="hidden" name="zielId" value={ziel.id} />
          <button name="antwort" value="ja" className={btnPrimary}>
            Ziel bestätigen
          </button>
          <button name="antwort" value="nein" className={btnSecondary}>
            Passt nicht
          </button>
        </form>
      )}
      {eigen && ziel.zusage === "BESTAETIGT" && (
        <div className="flex flex-wrap gap-3">
          {ziel.aktiv && ziel.id !== hauptzielId && (
            <form action={hauptzielWaehlen}>
              <input type="hidden" name="zielId" value={ziel.id} />
              <button className={btnSecondary}>Auf Heute zeigen</button>
            </form>
          )}
          {!ziel.archiviertAt && ziel.zeitraum !== "ALT_30_TAGE" && (
            <Link className={btnSecondary} href={`/fortschritt/${ziel.id}`}>
              Bearbeiten
            </Link>
          )}
          {!ziel.archiviertAt && (
            <form action={zielArchivieren}>
              <input type="hidden" name="zielId" value={ziel.id} />
              <button className={btnSecondary}>Ziel beenden</button>
            </form>
          )}
        </div>
      )}
      {eigen && ziel.zusage === "BESTAETIGT" && ziel.geschafft && (
        <div className="space-y-2 border-t border-line pt-4">
          <p className="font-medium">
            Ziel erreicht: {ziel.standText} {ziel.kennzahlText}.
          </p>
          <form action={zielErfolgTeilen}>
            <input type="hidden" name="zielId" value={ziel.id} />
            <button className={btnSecondary}>Erfolg ans Netzwerk melden</button>
          </form>
          <p className="text-xs text-ink-muted">
            Du teilst nur den erreichten Stand. Dein persönlicher Wunsch bleibt
            hier.
          </p>
        </div>
      )}
    </article>
  );
}
