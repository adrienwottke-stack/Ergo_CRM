# Jarvis: CRM-Zugriffe und Arbeitsabläufe

Stand: 27. September 2026. Implementierung im gemeinsamen lokalen Checkout; keine Aussage über eine bereits veröffentlichte Version.

## Bedienung

Unten links im Chat und im Sprachchat steht **Zugriffe**. Die Einstellung gehört ausschließlich zum jeweiligen Chat und wird dort gespeichert. Neue Chats beginnen mit **Änderungen bestätigen**.

| Auswahl | Verhalten |
| --- | --- |
| Nur lesen | Daten suchen, lesen und erklären. Schreibwerkzeuge sind ausgeblendet; auch manipulierte Schreibaufrufe werden serverseitig gesperrt. |
| Änderungen bestätigen | Jarvis bereitet Änderungen mit sichtbarem Ergebnis vor. Erst die Bestätigung führt sie aus. |
| Selbstständig arbeiten | Eindeutige Aufträge werden unmittelbar ausgeführt, einschließlich Löschungen, interner Nachrichten, Sammeländerungen und berechtigter Verwaltungsaktionen. Fehlende Angaben oder Mehrdeutigkeiten müssen geklärt werden. |

Jarvis verwendet die vorhandenen Rechte des angemeldeten Kontos. Der Modus verleiht keine zusätzlichen Kontorechte. Emil kann damit die angebundenen Arbeitsfunktionen in seinem berechtigten Bereich verwenden; Verwaltungsfunktionen erscheinen nur für Administratoren.

## Angebundene Funktionen

`lib/ai-crm/work-registry.ts` enthält 61 explizit definierte Arbeitsfunktionen mit Eingabeprüfung. Sie ergänzen die bestehenden Kontakt-, Such-, Kalender-, Aufgaben-, Vereinbarungs- und Führungswerkzeuge. `discover_crm_functions` liefert den jeweils erlaubten Katalog und die genauen Eingabefelder. `read_crm_data` erschließt 13 Datenbereiche und kennzeichnet die Abdeckung paginierter Ergebnisse.

| Bereich | Beispiele |
| --- | --- |
| Kontakte und Namen | Anlegen, bearbeiten, bewerten, Listen verschieben, löschen, Kandidaturen und Zusagen |
| Pipeline | Phasen, Anruf- und Terminergebnisse, Absagen, Wiederaufnahme, Empfehlungen, nächste Schritte und Wiedervorlagen |
| Kalender | Bestehende Terminwerkzeuge, eigene Termine löschen, Kalenderquellen lesen und entfernen |
| Mannschaft | Struktur lesen, Personen aufnehmen/bearbeiten/austragen/reaktivieren/löschen, Platzhalter einladen, Berichtslinks verwalten |
| Ziele | Eigene Ziele und berechtigte Vorschläge, Antworten, Hauptziele, Archivierung, Teilen und Teamziele |
| Leistung | Einheiten buchen/löschen, Startbestand, manuelle Aktivitätszahlen, eigene Stände und berechtigte Teamberichte |
| Kommunikation | Eigene Nachrichten lesen, Empfänger finden, interne Nachrichten senden, als gelesen markieren, Einladungen verwalten |
| Profil | Arbeitsfokus, Telefonnummer und persönliches Warum |
| Verwaltung | KI-Freigaben, Funktionen, Einladungen, Browserfreigaben, Passwortreset, Karriere-/Ampel-/Fokuseinstellungen |
| Zinsrechner | Eigene gespeicherte Szenarien lesen, speichern und löschen; bestehende Versionsprüfung bleibt wirksam |
| Feed und Einstieg | Feed lesen/reagieren, Sprint starten, Einstieg fortsetzen oder pausieren |
| Export | Authentifizierte Links zu den bestehenden eigenen Exporten |

Die Registry ist die verbindliche Liste der angebundenen Aktionen. Sie stellt keinen beliebigen Datenbank-, SQL-, Dateisystem- oder Routenzugriff bereit. Neue externe Konto-/Kalenderverbindungen und die Eingabe von Zugangsdaten erfolgen weiterhin auf den vorgesehenen Seiten. Exportdateien und sensible Passwortreset-Ergebnisse werden über geschützte Seiten ausgeliefert. Passwörter, Sitzungsschlüssel, Reset-Codes und Verbindungstoken werden nicht als Werkzeugergebnis an das Modell gegeben.

## Ausführung und Berechtigungen

- Chatmodus und Version werden serverseitig gespeichert. Ein laufender Auftrag behält seine ursprüngliche Berechtigungsobergrenze. Eine Herabstufung wirkt vor dem nächsten Schreibzugriff; eine nachträgliche Hochstufung macht alte Aufträge nicht automatisch autonom.
- Eigentümer, Rolle, aktuelle Struktur, Aktivstatus und KI-Berechtigung werden vor der Ausführung erneut geprüft. Fremde Kontakte, fremde Chats und gemischte Listen mit fremden Kontakten sind gesperrt.
- Bestehende Fachfunktionen laufen mit ihrer normalen Anmeldung und Validierung innerhalb derselben Datenbanktransaktion wie Aktionsstatus und Audit. Benachrichtigungen werden erst nach erfolgreichem Abschluss ausgelöst.
- Jede Aktion besitzt eine stabile Ausführungskennung. Wiederholung nach verlorener Antwort erzeugt keine zweite Buchung, Nachricht oder Anlage.
- Neue Kontakte können als vorbereitete Abhängigkeit für Notizen, Aktivitäten, Bearbeitung und Wiedervorlagen dienen. Folgeaktionen werden erst nach der Anlage ausgeführt. Abbrechen der Anlage verwirft abhängige Vorschläge.
- Eine Aktionsquittung unterscheidet vorbereitet, abgeschlossen, fehlgeschlagen und abgebrochen. Nur tatsächlich abgeschlossene Aktionen werden als erledigt ausgegeben. Bestehende rücknehmbare Aktionen behalten ihre Rücknahmefunktion; neu angebundene Fachaktionen weisen keine pauschale Rücknahmefähigkeit aus.
- Bestätigungsstapel behandeln eigene vorherige Änderungen am selben Datensatz korrekt, während fremde zwischenzeitliche Änderungen weiterhin eine erneute Prüfung erfordern.

## Aktivierung einer Zielumgebung

1. Die Migration `prisma/migrations/20260927140000_jarvis_execution_modes/migration.sql` über den üblichen Releaseweg anwenden und den Prisma-Client erzeugen.
2. `AI_CRM_EXECUTION_MODES=true` setzen. Ohne dieses Flag bleiben selbstständige Ausführung und Moduswechsel abgeschaltet.
3. Die bestehenden Voraussetzungen gelten zusätzlich: KI global aktiv, CRM-Funktion verfügbar, Konto berechtigt und Modellanbieter funktionsfähig.
4. Nach Veröffentlichung mit einem berechtigten Testkonto die unten beschriebenen Abläufe prüfen. Die produktive Datenbank wurde während dieser Implementierung nicht migriert.

## Prüfung und Grenzen der Aussage

- Vollständige Regression: 248 Tests bestanden; anschließend wurde der neue Abbruchtest separat ergänzt und geprüft.
- `npm run test:jarvis:access`: 25 Datenbank-/Berechtigungsprüfungen mit jeweils isolierter PGlite-Datenbank. Enthält echte Fachaktionen, Moduswechsel, Rechteentzug, Fremdzugriff, Wiederholung, Abhängigkeiten, Nachrichtenzustellung, Adminaktionen und geschützte Ergebnisse.
- `npm run test:jarvis:access:browser`: bestanden, keine Browserfehler. Echte Next-Routen und Datenbank mit lokalem Modellanbieter-Simulator. Prüft autonome Ausführung, Sperre im Lesemodus, Schreiben erst nach Bestätigung sowie Zugriffsauswahl und Überlauf bei 320, 390, 768 und 1440 Pixeln.
- `npm run build:jarvis:access:check`: bestanden, einschließlich Typprüfung und Seitenerzeugung. Isolierter Produktionsbuild gegen eine Wegwerf-Datenbank, ohne `prisma migrate deploy` gegen die Projekt-Datenbank.

Ergebnisse stehen unter `test-results/jarvis-access.log`, `test-results/jarvis-full-tests.log`, `test-results/jarvis-build.log` und `test-results/jarvis-access/result.json`. Browserbilder liegen daneben. Ein erfolgreicher Simulatortest bestätigt keine echte OpenAI-Verbindung, kein physisches Mobilgerät und keinen Mikrofonlauf. Veröffentlichung und authentifizierte Abnahme in der Zielumgebung sind separate Schritte.
