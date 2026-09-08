"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addName } from "@/app/(app)/namen/actions";
import { sammlungVerschieben, sammlungSzene, sammlungStand, sammlungAbschliessen, sammlungBeginnen, startVertagen } from "@/app/startActions";
import { STUETZEN } from "@/lib/gedaechtnisstuetzen";
import { NAME_TARGET, andereListe, listKindListLabels } from "@/lib/namelist";
import type { collectionView } from "@/lib/start/service";
import { btnPrimary, btnSecondary, card, input } from "@/components/ui";

type Round = Awaited<ReturnType<typeof collectionView>>;

export default function NamenSammeln({ initial, userId, guided }: { initial: Round; userId: string; guided: boolean }) {
  const router = useRouter();
  const [round, setRound] = useState(initial);
  const [name, setName] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const operation = useRef<{ name: string; key: string; scene: string } | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const draftKey = `ergo.start.name.${userId}.${round.id}`;
  const sceneIndex = Math.max(0, STUETZEN.findIndex((s) => s.key === round.scene));
  const scene = STUETZEN[sceneIndex];
  const saved = round.operations.filter((o) => o.result !== "already" && o.contact && o.contact.listKinds.includes(round.kind));
  const inScene = saved.filter((o) => o.scene === round.scene);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) ?? "null");
      if (draft && typeof draft.name === "string" && typeof draft.key === "string") {
        setName(draft.name); operation.current = { ...draft, scene: draft.scene ?? round.scene };
      }
    } catch { /* Storage-disabled browsers still support normal entry. */ }
  // Restore once per collection. Moving to another scene must not replace an active draft.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  function changeName(value: string) {
    setName(value);
    const draft = { name: value, key: crypto.randomUUID(), scene:round.scene };
    operation.current = draft;
    try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* optional draft */ }
  }

  function run(work: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true; setError(null);
    startTransition(async () => {
      try { await work(); } catch (e) { setError(e instanceof Error ? e.message : "Speichern hat nicht geklappt. Bitte erneut versuchen."); }
      finally { busy.current = false; }
    });
  }

  async function saveDraft() {
    const value = name.trim();
    if (!value) return;
    const op = operation.current?.name === name ? operation.current : { name, key: crypto.randomUUID(), scene:round.scene };
    operation.current = op;
    try { localStorage.setItem(draftKey, JSON.stringify(op)); } catch { /* optional draft */ }
    const data = new FormData();
    data.set("name", value); data.set("listKind", round.kind);
    data.set("operationKey", op.key); data.set("collectionId", round.id); data.set("scene", op.scene);
    const result = await addName(data);
    // A lost reply is retried with the same key; only acknowledged input is cleared.
    setName(""); operation.current = null;
    try { localStorage.removeItem(draftKey); } catch { /* optional draft */ }
    setRound(await sammlungStand(round.id));
    setHint(result.status === "already" ? `${result.name} steht schon auf deiner Liste.` : "Gespeichert. Du kannst direkt den nächsten Namen eingeben.");
    field.current?.focus();
  }

  async function finish() {
    await saveDraft(); await sammlungAbschliessen(round.id);
    setRound(await sammlungStand(round.id));
  }

  const errors = error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}<button type="button" onClick={() => window.location.reload()} className="ml-2 min-h-11 underline">Stand neu laden</button>{name && <button type="button" disabled={pending} onClick={() => {changeName("");setError(null);}} className="ml-2 min-h-11 underline">Eingabe verwerfen</button>}</div>;

  if (round.completedAt) {
    const next = round.callable > 0 ? `/namen/startklar?liste=${round.kind}` : `/namen/nummern?liste=${round.kind}${guided ? "&start=1" : ""}`;
    return <div className={`${card} space-y-5 p-6`}>
      <p className="text-sm text-slate-500">Sammlung abgeschlossen</p>
      <h2 className="text-3xl font-semibold">{saved.length === 0 ? "Keine neuen Namen" : `${saved.length} ${saved.length === 1 ? "Name" : "Namen"} dazu`}</h2>
      <p className="text-base text-slate-600">Jetzt stehen {round.names} {round.names === 1 ? "Name" : "Namen"} auf deiner {listKindListLabels[round.kind]}.</p>
      {errors}
      {round.names > 0 ? <Link href={next} className={`${btnPrimary} min-h-14 w-full`}>{round.callable > 0 ? "Erste Anrufe vorbereiten" : "Nummern ergänzen"}</Link>
        : <button className={`${btnPrimary} min-h-14 w-full`} disabled={pending} onClick={() => run(async () => { router.replace(await sammlungBeginnen(round.kind, true)); })}>Namen sammeln</button>}
      <div className="flex flex-wrap gap-4">
        <button className="min-h-11 text-sm underline" disabled={pending} onClick={() => run(async () => { router.replace(await sammlungBeginnen(round.kind, true)); })}>Weitere Namen sammeln</button>
        <button className="min-h-11 text-sm underline" disabled={pending} onClick={() => run(async () => { if (guided) await startVertagen(); router.push("/heute"); })}>Zu Heute</button>
        <Link className="min-h-11 text-sm underline" href={`/namen?liste=${round.kind}`}>Zur Namensliste</Link>
      </div>
      {saved.length > 0 && <details className="border-t border-line pt-4">
        <summary className="cursor-pointer text-sm">Liste ändern</summary>
        <p className="mt-3 text-sm text-slate-600">Die {saved.length} zusätzlichen Namen dieser Runde auf die andere Liste verschieben.</p>
        <button disabled={pending} className={`${btnSecondary} mt-3`} onClick={() => run(async () => {
          const next = await sammlungVerschieben(round.id, andereListe(round.kind));
          setRound(next);
          router.replace(`/namen/sammeln?liste=${next.kind}&runde=${next.id}`);
        })}>Nach {listKindListLabels[andereListe(round.kind)]} verschieben</button>
      </details>}
    </div>;
  }

  return <div className="space-y-5">
    <div className="flex justify-between gap-3 text-sm text-slate-500"><span>Bereich {sceneIndex + 1} von {STUETZEN.length}</span><span>{round.names} Namen gespeichert</span></div>
    <div className={`${card} space-y-5 p-5 sm:p-6`}>
      <p className="text-sm font-medium text-slate-600">{listKindListLabels[round.kind]}</p>
      {round.operations.length === 0 && <button disabled={pending} className="text-sm underline" onClick={() => run(async () => { router.replace(await sammlungBeginnen(andereListe(round.kind))); })}>Andere Liste wählen</button>}
      <h2 className="text-3xl font-semibold tracking-tight">{scene.titel}</h2>
      <p className="text-lg leading-relaxed text-slate-700">{scene.fragen[0]}</p>
      <details className="text-sm text-slate-500"><summary className="min-h-11 cursor-pointer">Mehr Gedächtnisstützen</summary><ul className="space-y-2">{scene.fragen.slice(1).map(q => <li key={q}>{q}</li>)}</ul></details>
      {round.operations.length === 0 && <p className="text-sm text-slate-500">Name eingeben und auf Hinzufügen tippen. Telefonnummern kommen danach.</p>}
      <form onSubmit={e => { e.preventDefault(); run(saveDraft); }} className="flex flex-wrap gap-2">
        <label className="min-w-0 flex-1"><span className="sr-only">Name</span><input ref={field} value={name} onChange={e => changeName(e.target.value)} disabled={pending} maxLength={120} autoFocus autoComplete="off" enterKeyHint="done" placeholder="Name" className={`${input} min-h-14 w-full text-base`} /></label>
        <button type="submit" disabled={pending || !name.trim()} className={`${btnPrimary} min-h-14`}>{pending ? "Speichern …" : "Hinzufügen"}</button>
      </form>
      {hint && <p role="status" className="text-sm text-slate-600">{hint}</p>}
      {errors}
      {inScene.length > 0 && <ul aria-label="In diesem Bereich gespeichert" className="flex flex-wrap gap-2">{inScene.map(o => <li key={o.id} className="rounded-lg bg-sunken px-3 py-2 text-sm">{o.contact!.name}</li>)}</ul>}
    </div>
    {round.names >= NAME_TARGET && <p className="text-sm text-slate-600">{round.names} Namen stehen. Du kannst weiter sammeln oder mit ihnen loslegen.</p>}
    <div className="flex gap-3">
      {sceneIndex > 0 && <button className={btnSecondary} disabled={pending} onClick={() => run(async () => { await saveDraft(); const result = await sammlungSzene(round.id, round.revision, STUETZEN[sceneIndex - 1].key); setRound(r => ({ ...r, ...result })); setHint(null); })}>Zurück</button>}
      <button className={`${btnPrimary} min-h-14 flex-1`} disabled={pending} onClick={() => run(async () => {
        if (sceneIndex === STUETZEN.length - 1) return finish();
        await saveDraft();
        const result = await sammlungSzene(round.id, round.revision, STUETZEN[sceneIndex + 1].key);
        setRound(r => ({ ...r, ...result })); setHint(null);
      })}>{sceneIndex === STUETZEN.length - 1 ? "Sammlung abschließen" : inScene.length > 0 || name.trim() ? "Nächster Bereich" : "Fällt mir niemand ein"}</button>
    </div>
    <div className="flex flex-wrap justify-between gap-3 text-sm">
      <button disabled={pending} className="min-h-11 underline" onClick={() => run(finish)}>Für heute fertig</button>
      <button disabled={pending} className="min-h-11 underline" onClick={() => run(async () => { await saveDraft(); if (guided) await startVertagen(); router.push(guided ? "/heute" : `/namen?liste=${round.kind}`); })}>Später fortsetzen</button>
    </div>
  </div>;
}
