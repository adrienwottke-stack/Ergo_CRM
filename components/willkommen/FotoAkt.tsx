"use client";

import { useRef, useState, useTransition } from "react";
import { fotoSpeichern } from "@/app/(willkommen)/willkommen/actions";

// Ein Selfie fuer die Rangliste. Mit Gesichtern ist der Wettbewerb ein
// anderes Ding als mit Textzeilen - Wettbewerb laeuft ueber Menschen.
// Das Bild wird im Browser auf 192 Pixel verkleinert und als kleine
// JPEG-Data-URL gespeichert: ein Feld, keine neue Infrastruktur.

const KANTE = 192;

async function verkleinern(datei: File): Promise<string | null> {
  try {
    const bild = await createImageBitmap(datei);
    const canvas = document.createElement("canvas");
    canvas.width = KANTE;
    canvas.height = KANTE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Mittig quadratisch zuschneiden ("cover"), dann verkleinern.
    const seite = Math.min(bild.width, bild.height);
    const sx = (bild.width - seite) / 2;
    const sy = (bild.height - seite) / 2;
    ctx.drawImage(bild, sx, sy, seite, seite, 0, 0, KANTE, KANTE);
    bild.close();
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return null;
  }
}

export default function FotoAkt({ onDone }: { onDone: () => void }) {
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const eingabeRef = useRef<HTMLInputElement>(null);

  const gewaehlt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const datei = event.target.files?.[0];
    if (!datei) return;
    const dataUrl = await verkleinern(datei);
    if (dataUrl) setVorschau(dataUrl);
  };

  const uebernehmen = () => {
    if (!vorschau) return;
    startTransition(async () => {
      await fotoSpeichern(vorschau);
      onDone();
    });
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div>
        <h2 className="text-2xl font-bold text-white">Ein Gesicht zur Nummer.</h2>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-300">
          Die Rangliste zeigt gleich deinen Namen. Mit Foto bist du drin ein
          Mensch, ohne eine Zeile.
        </p>
      </div>

      <button
        type="button"
        onClick={() => eingabeRef.current?.click()}
        className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/30 bg-white/5 transition hover:border-gold-400"
        aria-label="Foto aufnehmen"
      >
        {vorschau ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vorschau} alt="Dein Foto" className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl">📷</span>
        )}
      </button>
      <input
        ref={eingabeRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={gewaehlt}
        className="hidden"
      />

      <div className="w-full space-y-3">
        {vorschau ? (
          <button
            type="button"
            onClick={uebernehmen}
            disabled={pending}
            className="min-h-12 w-full rounded-xl bg-gold-400 text-[15px] font-bold text-navy-950 transition hover:bg-gold-100 active:scale-[0.98] disabled:opacity-40"
          >
            {pending ? "Wird gespeichert …" : "Passt, übernehmen"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => eingabeRef.current?.click()}
            className="min-h-12 w-full rounded-xl bg-gold-400 text-[15px] font-bold text-navy-950 transition hover:bg-gold-100 active:scale-[0.98]"
          >
            Foto machen
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="block w-full text-center text-sm text-slate-400 hover:text-white"
        >
          Später
        </button>
      </div>
    </div>
  );
}
