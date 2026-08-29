# Der Berichts-Link: die Wiedergeburt des entfernten Berichts, diesmal als Token je Führungskraft

Der im Kernmodell-Rückbau bewusst entfernte `/report` (globales `REPORT_PASSWORD`) kommt in anderer Form zurück: je Führungskraft ein zurückziehbarer Token-Link mit ausschließlich indexierten Struktur-Zahlen — für die Runde nach oben.

## Kontext

`docs/audit-kernmodell.md` hat den alten Tätigkeitsbericht (`/report` mit eigenem Passwort) 2026-08 abgerissen: ein globales Passwort ließ sich nie zurückziehen, der Bericht diente einem Vorgesetzten-Reporting, das niemand nutzte, und er kostete einen eigenen Zugangsweg. Die Entscheidung war richtig und bleibt es.

Die Multiplikations-Runde (29.08.2026) hat einen anderen Bedarf ergeben: Emil als Führungskraft (Kernstufe 2) will mit dem Cockpit nach oben glänzen — eine Vorstellung in der Führungskraftrunde ist der wichtigste Multiplikations-Kanal. Dafür braucht er etwas Zeigbares, das er weitergeben kann, ohne jemandem einen Login zu geben. Gleichzeitig gilt Entscheidung 9 des Multiplikations-Plans: nach außen gehen nur indexierte Verläufe und Zählwerte, nie absolute Einheiten, nie Kundendaten.

## Entscheidung

Adrien entscheidet (29.08.2026): Es gibt wieder eine teilbare Berichts-Sicht — aber als `berichtToken` je Führungskraft (Bauart wie `feedToken` beim ICS-Feed: undurchsichtiges Zufallswort, Erneuern zieht den alten Link zurück), nicht als globales Passwort. Der Bericht zeigt ausschließlich: die indexierte Struktur-Kurve, Kopf-Zählwerte (aktive Köpfe, Starter der letzten 90 Tage) und Aktivitäts-Vergleiche in Prozent. Keine Namen, keine Kontaktdaten, keine absoluten Einheiten. Die öffentliche Seite trägt `noindex` und prüft den Token, bevor sie die Datenbank fragt.

## Konsequenzen

- Der alte Abriss bleibt gültig: es gibt weiterhin kein `REPORT_PASSWORD`, keinen dritten Zugangsweg und kein Druck-Reporting über Einzelpersonen.
- Jede Führungskraft entscheidet selbst, ob es ihren Link gibt, und kann ihn jederzeit töten (Token erneuern).
- Ein geteilter Link ist öffentlich im Wortsinn: wer ihn hat, sieht die indexierten Zahlen. Deshalb ist der Inhalt so geschnitten, dass auch der ungünstigste Empfänger nichts Verwertbares über Einzelpersonen oder Einkommen ablesen kann.
- Die Indexierung passiert serverseitig (`lib/einheiten.ts`); Absolutwerte verlassen den Server auch im Seiten-Payload nicht.
