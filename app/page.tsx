import { redirect } from "next/navigation";

export default function Home() {
  // Startseite ist die Arbeitsliste, nicht die Auswertung.
  redirect("/heute");
}
