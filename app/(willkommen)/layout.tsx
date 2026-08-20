// Der Willkommens-Ablauf hat bewusst KEINE App-Navigation: die zehn
// Eintraege der Kopfzeile sind genau das, was im ersten Moment nicht zu sehen
// sein soll. Ganzflaechig Navy, Gold als einziger Akzent - dieselbe Sprache
// wie Kopfzeile und Wortmarke, nur einmal als ganze Buehne.
export default function WillkommenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 text-white">
      {children}
    </div>
  );
}
