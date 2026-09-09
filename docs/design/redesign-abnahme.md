# Abnahme und Sicherung der iPhone-Korrektur

Stand: 9. September 2026. Reviewzweig: `codex/redesign-iphone-korrektur`.

Der Zweig führt Redesign, Onboarding, die erweiterten Geschäftsabläufe und die neue Suche zusammen. Auf ausdrücklichen Nutzerwunsch wurde die weitere Arbeit wegen aufgebrauchten Nutzungsguthabens beendet und der vorhandene Stand gesichert. Er ist ein Reviewstand mit offenen Abnahmepunkten.

## Umgesetzt

- Deckende Navy-Flächen, gut lesbare weiße Schrift, blaue Hauptaktionen und iPhone-Systemschrift.
- Ein gemeinsamer mobiler Seitenkopf mit Suche und Profil; feste Navigation Heute, Kontakte, Kalender, Fortschritt und Team.
- Ruhige Kontaktlisten mit einer nächsten Hauptaktion, ganzen Personenzeilen, lokalem Filter und getrennten Listen für Recruiting und Verkauf.
- Kontaktprofile mit Rückweg, Bearbeiten, Anrufen, direkter Terminvergabe und Notiz. Listenfilter und aufrufende Ansicht bleiben im Rückweg erhalten.
- Startansichten für Einstieg, Aufbau und Führung; laufende Ziele, Teamziele, Absprachen, Einheiten-Rückmeldungen und Onboarding-Anbindung.
- Kalender als mobile Agenda, Fortschritt mit Hauptziel und Team mit Begleiten, Auswertung und Struktur.
- Vorführschutz für persönliche Inhalte auf Heute und gemeinsame Wünsche unter Team. Der Schalter wird erst nach Lesen des gespeicherten Zustands bedienbar.
- Gespeicherte Darstellung und Browserfarbe bleiben synchron. Der Hover-Hintergrund der Navigation ist auf Geräte mit Mauszeiger begrenzt.
- Der belegbar überflüssige zusätzliche Client-Refresh nach einer Abspracheantwort wurde entfernt; die Serveraktion aktualisiert bereits die betroffenen Ansichten.

Gestaltungsvorgabe: [iPhone-Korrektur](redesign-iphone-korrektur.md). Die tatsächlichen Browserbilder wurden mit [Kontakte V3](iphone-kontakte-v3.png) verglichen. Gesichtet wurden Kontakte bei 320 und 390 Pixeln, lange Namen, Kontaktprofile, Heute, Kalender, Fortschritt, Team und Vorführschutz. Alle Testpersonen sind fiktiv.

## Nachgewiesene Prüfungen

Alle Prüfungen verwenden neu erzeugte lokale Testdatenbanken. Es wurde keine produktive Migration ausgeführt.

| Prüfung | Ergebnis |
| --- | --- |
| Fach- und Datenbanktests des zusammengeführten Stands | 71 von 71 bestanden |
| Isolierter Produktionsbuild mit Lint und Typprüfung | Bestanden; die letzten kleinen Änderungen nach diesem Build wurden nicht erneut vollständig geprüft |
| Vollständige Suchabnahme gegen den Produktionsbuild | Bestanden, `test-results/suche-redesign-integration/` |
| Vollständige Onboardingabnahme gegen den Produktionsbuild | Bestanden, `test-results/start-redesign-integration/` |
| Darstellungsmatrix auf Build `713fe54` | 112 von 132 bestanden; je 56 von 66 in Chromium und WebKit |
| Gespeicherte Darstellung und Browserfarbe | Alle acht Kombinationen der beiden Engines bestanden |
| Geschäftsabläufe im Produktionsbrowser | Eigener Anruf-/Termin-/Einheitenablauf, Zielbestätigung und Vorführschutz geprüft; vollständiger Lauf noch nicht grün |
| Zuletzt ergänzte Harness-Prüfungen | Syntax geprüft; zusätzliche Browser-Zurück/Vor-, Touch-Hover- und echte 320-px-Spielinteraktion noch nicht ausgeführt |

Die Suchabnahme umfasst mobile Größen und Desktop, Rückweg, Verlauf, Details, Pagination, Tastatur, Fehlerbehandlung, verspätete Antworten und Zugriffsschutz. Die Onboardingabnahme umfasst Spiel, Karriereangaben, absichtliche Offline-Fehler mit geprüftem Wiederholungsablauf, Sammlung, Pause/Fortsetzen, Telefon, Anrufplan und Idempotenz.

## Offene Punkte

Die vollständige Darstellungsmatrix zeigte unter anderem hängende Wechsel zwischen Tagesübersicht und vollständiger Aufgabenliste, zwei hängende Speicherrückmeldungen für Telefon beziehungsweise Notiz und einzelne Rückwegfehler in WebKit. Vollständiges Vorabladen löste diese Fehler nicht zuverlässig; die experimentellen Vorladeänderungen wurden deshalb entfernt.

Die Diagnose belegt: Auch bei einem hängenden Aufgabenwechsel liest der Browser die vollständige Antwort bis zum Ende. Flight-Decodierung, Router-Reducer und Server-Patch werden abgeschlossen, während der sichtbare Wechsel ausbleibt. Die zuvor beobachtete Netzwerkkennung `ERR_ABORTED` tritt auch bei erfolgreichen Navigationen auf und ist kein Ursachenbeweis. Ein unabhängiger Minimalvergleich ohne CRM-Komponenten bestand. Eine allgemeine Ursache im Framework ist damit nicht nachgewiesen.

Ein späterer Geschäftsablauf kam bis zur Bestätigung einer neuen Partnerabsprache; dort blieb die alte Ansicht sichtbar. Der danach entfernte doppelte Client-Refresh ist eine belegbare Vereinfachung, aber noch kein nachgewiesener Fix aller Speicherprobleme. Diese Befunde werden nicht durch automatische Schreibwiederholungen oder erzwungene Reloads als bestanden gewertet.

Das direkte lokale Aufklappen aller Aufgaben wurde als nächste Korrektur begonnen, beim Nutzerstopp aber noch nicht fertig integriert. Der konsistente bisherige Produktstand bleibt aktiv. Ein gegebenenfalls unter `entwuerfe/` gesicherter Entwurf ist ausdrücklich nicht ausgeführt und nicht abgenommen.

Die Diagnosebelege bleiben lokal unter `test-results/`, insbesondere `redesign-713fe54`, `redesign-reader-diagnose-2`, `redesign-router-marker-probe`, `next-navigation-repro` und `arbeitslagen-redesign-full-prefetch-2`.

## Noch erforderliche Praxisabnahme

Auf echten iPhones sind Bildschirmtastatur, native Anrufrückkehr, sicherer Bildschirmbereich und tatsächliche Erinnerungszustellung zu prüfen. Je ein Starter, aufbauender Partner und eine Führungskraft führen ihre normalen Aufgaben ohne Erklärung durch. Der kleine Spielbildschirm ist zusätzlich visuell zu prüfen; das bisherige 320-px-Bild zeigt die Entscheidungsknöpfe nicht vollständig und entstand vor der später bestandenen Frame-Lageprüfung.

Produktive Migration, Veröffentlichung und eine vollständige Geräte- beziehungsweise Nutzerabnahme sind nicht Bestandteil dieser Sicherung.
