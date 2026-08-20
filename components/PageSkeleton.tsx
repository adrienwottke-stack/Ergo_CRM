export default function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-slate-200/80" />
        <div className="h-4 w-72 rounded bg-slate-200/60" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-36 rounded-xl bg-slate-200/60" />
        <div className="h-36 rounded-xl bg-slate-200/60" />
        <div className="h-36 rounded-xl bg-slate-200/60" />
      </div>
      <div className="h-72 rounded-xl bg-slate-200/60" />
    </div>
  );
}
