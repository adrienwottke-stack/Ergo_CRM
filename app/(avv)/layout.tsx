// Eigene Routengruppe, damit diese Seite NICHT durch app/(app)/layout.tsx
// laeuft - dort haengt die AppShell mit der kompletten Navigation dran. Wer
// hier steht, soll keinen Weg in die App sehen, weil es keinen gibt.
//
// Dieselbe Buehne wie der Willkommens-Ablauf: ganzflaechig Navy, kein Rahmen,
// keine Kopfzeile.
export default function AvvLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="buehne min-h-dvh bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 text-white">
      {children}
    </div>
  );
}
