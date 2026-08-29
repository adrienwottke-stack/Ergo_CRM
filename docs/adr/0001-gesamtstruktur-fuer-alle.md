# Jeder sieht die Gesamtstruktur, geführt wird weiter nur der eigene Ast

Status: superseded by ADR-0004 (29.08.2026) — nach einem Tag im echten Betrieb zurückgenommen: Sehen war zu weit gefasst, Adrien wollte nur sich selbst instanzweit, jede Führungskraft ausschließlich den eigenen Ast.

Bisher zeigte die Struktur-Ansicht jeder Person nur den eigenen Ast; ab 28.08.2026 sieht jede Person die gesamte Instanz-Struktur samt Kennzahlen, während Führen serverseitig weiter auf den eigenen Ast beschränkt bleibt.

## Kontext

Die bisherige, dokumentierte Absicht war das Gegenteil der heutigen Entscheidung. Der Typ `Mannschaftslage` in `lib/fuehrung.ts` gab als `baum` nur den eigenen Ast des Betrachters zurück — mit der Begründung im Code, fremde Äste gingen eine Führungskraft nichts an; nur ein Admin ohne eigene Leute sah ausnahmsweise die gesamte Instanz. Die eigene Führungskette darüber (Feld `oben`) wurde bewusst auf reine Namen ohne jede Kennzahl reduziert, weil die Leistung der eigenen Führungskraft laut Kommentar nicht Sache des Betrachters sei.

`docs/struktur-plan.md` zieht dieselbe Grenze für Kontakte (Abschnitt 3.2): Zahlen reichen über die eigene Struktur, Pipelinedetails nur eine Ebene tief — nie in fremde Äste hinein. Die dort offene Frage, ob sich Berater untereinander sehen (Abschnitt 10), wurde default-mäßig mit „Zahlen ja, über den Wettbewerb — Pipeline nein" beantwortet, ausdrücklich ohne eine für alle einsehbare Gesamtstruktur mit Kennzahlen.

## Entscheidung

Adrien entscheidet (28.08.2026): Jede Person sieht die gesamte Instanz-Struktur inklusive aller Kennzahlen, nicht mehr nur den eigenen Ast. Alle Karten in der Struktur-Ansicht sind klickbar; fremde Detailseiten sind read-only.

## Konsequenzen

- Kennzahlen sowie die Einheiten-Tabelle und -Matrix sind instanzweit sichtbar — vorher galt das nur für den eigenen Ast bzw. ausnahmsweise für einen Admin ohne eigene Leute.
- Die Kontaktnamen-Regeln (`lib/einblick.ts`) ändern sich inhaltlich nicht, wirken aber jetzt gegenüber jedem Betrachter der Instanz statt nur gegenüber der eigenen Führungskette — ihre Reichweite wächst, ohne dass die Regeln selbst angefasst werden.
- Einladungscodes verlassen weiterhin nicht den eigenen Ast.
- Coaching und „Heute dran" bleiben Aufgabenliste des eigenen Asts: Sehen wird instanzweit, Arbeiten bleibt am eigenen Ast.
- Führen — umhängen, einladen, Schritte setzen — bleibt serverseitig auf den eigenen Ast beschränkt, unabhängig davon, was clientseitig sichtbar ist.
