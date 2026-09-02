# Der Betroffene darf um Ausbau bitten, und der Vorschlag kommt aus Ergebnissen

Status: entschieden 01.09.2026. Ergänzt [ADR-0005](0005-ausbau-durch-die-fuehrungskraft.md), hebt es nicht auf.

## Kontext

ADR-0005 legte fest: den Ausbau hebt die Führungskraft, nie der Betroffene, und die App schlägt ihn vor, sobald 20 Anrufe und 3 gehaltene Termine stehen. Zwei Wochen später zeigte der Bestand zwei Löcher. Erstens hängt der einzige aktive Nutzer unter einer Führungskette, die zusammen null Einträge hat — ein Vorschlag an sie wäre dort versandet, und der Betroffene hatte keinen Weg, sich bemerkbar zu machen. Zweitens misst eine Schwelle aus Anrufen nicht Reife, sondern Buchführung: derselbe Nutzer hatte sechs Termine und den einzigen Abschluss der Instanz, aber drei eingetragene Anrufe. Auf Anrufe gerechnet hätte er die Schwelle nie erreicht, egal wie viel er telefoniert.

## Entscheidung

- Es gibt die **Bitte**: der Betroffene darf um mehr bitten. Freigeben kann weiterhin nur die Führungskraft — **oder der Admin**, damit die Bitte an einem stillen Ast nicht liegen bleibt. Die Bitte ist immer leise auffindbar, die App drängt nicht.
- Der Vorschlag der App kommt aus **Ergebnissen**: 5 vereinbarte Termine **oder** 1 gehaltener Termin, gerechnet über die ganze Zeit. Anrufe zählen nicht.
- „Selbstauswahl beim ersten Start", die ADR-0005 verwarf, bleibt verworfen: die Bitte ist ein Anstoß von unten, keine Entscheidung von unten.

## Verworfen

- **Bitte nur an die Führungskraft.** Sauberer, aber am toten Ast wirkungslos — genau der Fall, der den Bau ausgelöst hat.
- **Gewohnheit als Maß** (drei Log-Tage in einer Woche). Misst Dranbleiben statt Leistung und wäre nicht zu erschleichen; verworfen, weil die Schwelle beschreiben soll, wann jemand im Vertrieb so weit *ist*, nicht ob er die App bedient.

## Folgen

- Das Wort „Freischalten" gehört allein dem Ausbau. Was ab einer Karrierestufe aufgeht (`lib/freischaltung.ts`), heißt **Verdient**.
- Die Schwellen-Zeilen `ausbau.anrufe` / `ausbau.termine` in der `Einstellung`-Tabelle werden durch `ausbau.termine_vereinbart` / `ausbau.termine_gehalten` ersetzt.
