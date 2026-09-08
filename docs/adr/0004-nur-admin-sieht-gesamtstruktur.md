# Nur der Admin sieht die Gesamtstruktur, jede Führungskraft nur den eigenen Ast

Status: supersedes ADR-0001. Adrien entscheidet (29.08.2026): Die gesamte Instanz-Struktur sehen darf ausschließlich der Admin — unbedingt, unabhängig von dessen eigener Struktur. Jede andere Führungskraft, auch eine organisatorisch weit oben stehende wie Emil, sieht ausschließlich den eigenen Ast: sich selbst und alles darunter, nie die Struktur daneben oder darüber.

## Kontext

ADR-0001 hatte entschieden, dass jede Person die gesamte Instanz sehen darf und nur das Führen (Umhängen, Einladen, Schritte setzen) auf den eigenen Ast beschränkt bleibt. Nach einem Tag im echten Betrieb war das zu weit gefasst: Eine Führungskraft, die organisatorisch weit oben steht, hätte damit auch parallele, sie nichts angehende Strukturen gesehen. Gewollt war von Anfang an eine engere Grenze — nur die Systemverwaltung braucht den Überblick über alles, jede Führungsposition braucht nur ihren eigenen Ast.

## Entscheidung

Der Admin (Rolle `ADMIN`, in dieser Instanz Adrien) sieht auf `/mannschaft` immer die gesamte Instanz, unabhängig davon, ob er selbst gerade jemanden führt. Jede andere Person — jede Führungskraft, egal wie viele Ebenen unter ihr hängen oder wie weit oben sie in der Struktur steht — sieht ausschließlich den eigenen Ast: sich selbst und alles, was unter ihr hängt. Die eigene Führungskette darüber bleibt als reine Namens-Auskunft ohne Kennzahlen sichtbar (`oben`-Feld, `istUeber`-Kästen im Organigramm) — das war schon vor ADR-0001 so und gilt wieder.

## Konsequenzen

- `mannschaftsLage()` fragt für den Umfang immer `sichtbarkeit(betrachter, "ALLE")` ab: Für den Admin liefert das bedingungslos die ganze Instanz; für alle anderen fällt „ALLE" in `lib/scope.ts` von selbst auf „STRUKTUR" (den eigenen Ast) zurück — dieselbe Sicherung wie vor ADR-0001, nur ohne die Sonderbedingung „nur wenn der Admin selbst niemanden führt".
- `fuehrtNiemanden` fragt jetzt danach, ob der Betrachter in `baum` selbst jemanden unter sich hat (Pfad-Präfix-Test), nicht mehr danach, ob `baum` leer ist. Vorher lag hier eine stille Kopplung: Für einen Admin ohne eigene Leute wurde `baum` durch die Eskalation auf die ganze Instanz nie leer, wodurch „führt niemanden" fälschlich `false` blieb. Mit der jetzt unbedingten Instanzsicht wäre diese Kopplung für JEDEN Admin falsch gewesen — die Loslösung war notwendig, nicht nur eine Aufräumarbeit.
- Fremde Detailseiten (`/mannschaft/[id]`) sind für Nicht-Admins wieder nicht erreichbar (`notFound()`) statt read-only einsehbar; der Admin sieht und bedient jede Person weiter uneingeschränkt (unverändert gegenüber ADR-0001 — das war schon vorher so).
- Die Kontaktnamen-Regeln (`lib/einblick.ts`) verlieren die durch ADR-0001 gewachsene Reichweite wieder: Sie wirken wieder nur innerhalb der eigenen Führungskette, nicht instanzweit.
- Der Team-Schnitt im Trichter (ADR unabhängig, `app/(app)/trichter/page.tsx`) bleibt unberührt — das ist eine anonyme Summen-Kennzahl ohne Einzelidentität, keine Struktursicht.
