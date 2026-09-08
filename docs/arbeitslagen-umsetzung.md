# Ergo CRM – Umsetzung der Arbeitslagen V1

Stand: 08.09.2026. Dieses Dokument beschreibt den tatsächlich implementierten Nutzerplan einschließlich der integrierten Startführung. Frühere Bildentwürfe dokumentieren die Gestaltungssuche; maßgeblich ist dieser Umsetzungsstand. Die automatisierte technische Prüfung ist abgeschlossen; Geräte- und Nutzerabnahme stehen noch aus.

## Orientierung und Arbeitslagen

Die Hauptnavigation hat fünf feste Bereiche: **Heute, Kontakte, Kalender, Fortschritt, Team**. Unterseiten bleiben ihrem Bereich zugeordnet; Suche und Profil sind über die Kopfzeile erreichbar. Fortschritt bündelt Ziele, Einheiten, Wettbewerb, Trichter und das persönliche Warum. Team bündelt Partner, Absprachen und Auswertung. Die Gestaltung verwendet Navy, Blau und Weiß, klare Flächen, große Aktionen und vertikale Listen.

„Heute“ ordnet dieselben Funktionen nach der Arbeitssituation:

- **Ich starte:** eigene Kontakte, Anrufe, Termine und persönlicher Fortschritt.
- **Ich baue auf:** eigene Arbeit plus Begleitung der eigenen Partner.
- **Ich führe:** Partner, Absprachen und Teamentwicklung zuerst; das eigene Geschäft bleibt erreichbar.

Im automatischen Modus führt der erste aktive direkte Partner mit aktiviertem Zugang zur Aufbauansicht. Platzhalter und deaktivierte Konten lösen diesen Wechsel nicht aus. Eine bewusst gewählte Ansicht wird am eigenen Konto gespeichert und bleibt erhalten. Die Ansicht ändert die Reihenfolge, niemals die Berechtigung.

## Integrierter Einstieg

Die separate Onboarding-Umsetzung wurde gezielt zusammengeführt; die vereinfachte mobile Namensliste blieb erhalten. „Namen sammeln“ ist direkt erreichbar. Fehlende Nummern und erste Anrufe folgen als eigene Schritte. Die kurze Storno-Runde umfasst fünf Entscheidungen; das reguläre Spiel bleibt eigenständig.

Checkpoints speichern den bestätigten Fortschritt. Unerwartetes Schließen setzt den Ablauf beim neutralen App-Start fort; bewusstes Vertagen führt zu Heute mit einer Fortsetzen-Aktion. Bestandskonten bekommen keinen neuen Pflichtstart. Kontakte werden bei wiederholten Speicheranfragen nicht doppelt angelegt. Eine vorgeschlagene Anrufplanung wird erst nach bewusster Bestätigung gespeichert und überschreibt keine vorhandenen nächsten Schritte.

Auf Heute stehen fällige Anrufe, Termine und Betreuungsaufgaben vor der Startführung. Bei freiem Tag ersetzt der konkrete Fortsetzen-Schritt die allgemeine Hauptaktion. Der Einstiegspass ist untergeordnet; in der Führungsansicht ist er ausgeblendet, ein offener Start bleibt aufklappbar erreichbar. Details: [Onboarding-Integration](onboarding-implementierung.md).

## Ziele und gespeicherte Ergebnisse

Wochen- und Monatsziele sind für Anrufe, vereinbarte beziehungsweise gehaltene Termine und Einheiten frei definierbar. Kalenderwochen beginnen montags; Kalendergrenzen beziehen sich auf Europe/Berlin. Der Anfang zählt zum Zeitraum, das Ende nicht mehr. Ein Ziel gehört genau einer Person und zählt ausschließlich deren vorhandene DailyLogs oder Einheitenbuchungen. Beteiligung erzeugt keine summierte Gruppenproduktion.

Eigene Ziele sind sofort bestätigt. Eine aktuell berechtigte Führungskraft kann ein Ziel vorschlagen; erst die inhabende Person aktiviert es durch Bestätigung. Die Hauptzielwahl ist persönlich gespeichert; ohne gültige Auswahl erscheint das jüngste aktive bestätigte Eigenziel. Ein Wunsch kann ergänzt werden. Erreichte Meilensteine werden nur durch eine ausdrückliche Teilen-Aktion im bestehenden Feed veröffentlicht.

Vorhandene Versprechen werden einmalig aus ihrem ursprünglichen `pledgeSetAt` für genau 30 Tage übernommen, einschließlich des historischen Endstands. Es gibt keine rückwirkende Verlängerung und keine zweite Anzeige desselben Versprechens. Korrekturen und negative Einheiten können einen zuvor erreichten Zielstand zurücknehmen.

Ein Terminergebnis schreibt Meeting, Phase, Punkte, Empfehlungen und Abschluss-Erinnerung gemeinsam in einer Transaktion unter einer Kontakt-Zeilensperre. Dasselbe gespeicherte Ergebnis erneut abzusenden ist wirkungslos. Ein neu vereinbarter Termin kann später erneut erfasst werden; die bestehenden einmaligen Kontakt-Punktestempel bleiben maßgeblich. Unveränderte historische Abschlüsse erzeugen keinen scheinbar heute gehaltenen Termin.

Direkte Phasenwechsel und zusammengesetzte Ergebnisaktionen besitzen jeweils eine passende Rückgängig-Operation. Bei einem Abschluss wird die Einheiten-Wiedervorlage bereits serverseitig für den nächsten Kalendertag gesichert. „Später“ verliert sie deshalb auch beim Schließen des Browsers nicht. Nur eine ausdrücklich zugeordnete Einheitenbuchung erledigt sie; eine beliebige freie Buchung tut das nicht. Rücknahme entfernt die zum Abschluss gehörenden Einträge einschließlich ausdrücklich zugeordneter Einheiten; unabhängige Buchungen bleiben erhalten. Speicherbestätigungen zeigen das Ergebnis und, soweit vorhanden, den aktuellen Zielstand.

## Zusammenarbeit, Berichte und Erinnerungen

Absprachen sind ausdrücklich geteilte Aufgaben oder Termine zwischen berechtigten Beteiligten. Private Betreuungsnotizen werden nicht automatisch zu gemeinsamen Inhalten. Vorschläge benötigen die Bestätigung der anderen Seite. Änderungen erzeugen eine neue Version und erneuten Bestätigungsbedarf; veraltete Formulare können keinen neueren Stand überschreiben. Bestätigte Termine erscheinen im Kalender, fällige bestätigte Aufgaben und zu beantwortende Vorschläge auf Heute.

Teamberichte unterstützen direkte Partner, die eigene Struktur und ein berechtigtes Teilteam. Eigenleistung und Teamleistung sind getrennt, jeder aktive Partner wird einmal gezählt. Einheiten und Korrekturen gelten am Buchungstag. Der mitgebrachte Einheiten-Startbestand bleibt von der Entwicklungskurve getrennt. Fehlende Aktivitätsprofile und unvollständige Daten werden als Lücken beziehungsweise Teilmengen angezeigt, nicht als erfundene Nullleistung.

Die Zuordnung richtet sich nach der **aktuellen** Struktur; historische Teamwechsel werden nicht rekonstruiert. Gleichrangigkeit, eine fremde ID oder eine geteilte URL erweitern den Zugriff nicht. Aktivitätssummen folgen der vorhandenen Zahlenfreigabe; Pipelinehinweise beachten die gesonderte Pipelinefreigabe. Berichte lesen keine Kunden-, Telefon-, Motivations- oder Buchungsnotizen. Die Teammeeting-Ansicht vergrößert dieselbe berechtigte Auswahl und erweitert deren Umfang nicht.

Der Morgen-Cron bündelt eigene Arbeit, Führungshinweise, Absprachen und offene Einheiten zu höchstens einer Tagesmeldung je Konto und Lauf. Auch hier gelten die aktuelle Struktur und die jeweiligen Freigaben. Das belegt noch keine tatsächliche Pushzustellung auf einem Gerät.

## Datenbank und Abnahme

Zwei additive Migrationen ergänzen den Bestand:

- `20260908190000_arbeitslagen`: Arbeitsfokus, Ziele, Einheiten-Erinnerungen und versionierte Partnerabsprachen.
- `20260908200000_startfuehrung`: Startfortschritt, Sammeldurchgänge und idempotente Namensvorgänge; `startfuehrung` und `stornoStart` werden als `TEST` angelegt. Bei diesen beiden Schaltern bedeutet ein fehlender Datensatz aus; `TEST` und `LAEUFT` sind aktiv.

Der Prisma-Client wurde regeneriert. Es wurde keine produktive Migration und kein Deployment ausgeführt. Fach- und Datenbanktests verwenden ausschließlich neue Speicherdatenbanken mit allen Migrationen.

Der Review enthält außerdem `main` bis `ad63a1a`, einschließlich `20260828120000_einstellungen` und `20260829120000_ausbau_buendel`. Konfigurierte Karrierestufen, Kandidaturen, Teamabend, Berichts-Link und Datenexport bleiben erhalten. Die Details der Konfliktauflösung stehen im [Review-Protokoll](review-arbeitslagen-onboarding.md).

| Prüfung | Aktueller Stand / Befehl |
| --- | --- |
| Gesamte automatisierte Suite | **51 Tests grün**, `npm test`; enthält die Onboardingtests |
| Onboarding separat | `npm run test:start` |
| TypeScript | **Grün**, `npm run typecheck` |
| ESLint | **0 Fehler**, eine vorbestehende Warnung in `scripts/_audit/probe.mjs`; `npm run lint` |
| Gemeinsamer Browserlauf | **Grün**, beide Durchläufe; Arbeitslagen zusätzlich gegen den Produktionsbuild, mit 17 Screenshots und 320/390/430/1440 px |
| Isolierter Produktionsbuild | **Grün**, `npm run build:start:check` |

Die Browserbefehle starten lokale Instanzen mit fiktiven Konten. `build:start:check` verwendet eine neue isolierte Datenbank. **`npm run build` enthält `prisma migrate deploy` und wird für diese Abnahme nicht verwendet.** Der finale Browserlauf verwendet `CRM_TEST_PRODUCTION=1 npm run test:browser` nach dem isolierten Build. Er prüft den vollständigen Anruf-/Termin-/Empfehlungs-/Einheitenablauf, vorgeschlagene Ziele, bestätigte Absprachen mit Verlauf, Suchberechtigungen, gespeicherten Schwerpunkt und Teammeeting. Ergebnis und Screenshots liegen in `test-results/arbeitslagen/`; es gab keine Clientfehler. Die integrierte Startstrecke wurde separat mit `npm run test:start:browser` geprüft, einschließlich Pause/Neustart, Nummern, bestätigter Planung und fehlgeschlagener Übertragung mit Wiederholung.

Nicht durchgeführt sind eine echte iPhone-Installation, die Prüfung der realen Bildschirmtastatur und nativer Anrufe, tatsächliche Pushzustellung, mehrere gleichzeitige PostgreSQL-Sitzungen sowie eine Bedienprüfung mit Menschen aus allen drei Arbeitslagen. Automatisierte Tests und emulierte Bildschirmgrößen ersetzen diese Prüfungen nicht; eine vollständige Geräte- und Nutzerabnahme wird deshalb nicht behauptet.

Die dargestellten Einheiten und Aktivitätswerte sind CRM-Fortschrittsdaten. Es wurden keine neue Finanzplanung, Renditeberechnung oder Provisionsversprechen eingeführt.
