import { headers } from "next/headers";
import { requireOnboardedUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import NochZu from "@/components/NochZu";
import { ausbaustand, sperreFuer, titelVon } from "@/lib/ausbau";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Wer den Start noch nie gesehen hat, wird von hier einmalig nach
  // /willkommen geschickt - die Route liegt in ihrer eigenen Gruppe und laeuft
  // deshalb nicht durch dieses Layout.
  const user = await requireOnboardedUser();

  // Der Ausbau-Waechter (docs/ausbau-plan.md, Abschnitt 3). Er steht HIER und
  // nicht in jeder einzelnen Seite: ein Waechter je Seite waere zehnmal
  // dieselbe Zeile und beim elften Mal vergessen. Die Adresse kommt als
  // Kopfzeile aus der Middleware - eine Server-Komponente kennt ihre eigene
  // nicht.
  //
  // Die Schale bleibt stehen. Wer auf einer gesperrten Adresse landet, soll
  // nicht in einer leeren Seite sitzen, sondern seine Leiste behalten und
  // weiterklicken koennen.
  const [stand, kopfzeilen] = await Promise.all([
    ausbaustand(user),
    headers(),
  ]);
  const pfad = kopfzeilen.get("x-pfad") ?? "/";
  const gesperrt = sperreFuer(pfad, stand);

  return (
    <AppShell user={user}>
      {gesperrt ? (
        <NochZu titel={titelVon(pfad)} bereich={gesperrt} />
      ) : (
        children
      )}
    </AppShell>
  );
}
