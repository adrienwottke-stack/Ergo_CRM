# Assistent: Redesign vom 24. September 2026

## Ergebnis

Die vorhandene Assistentenoberfläche verwendet eine neutrale Chatgestaltung in Hell und Dunkel. Gespräch und Composer teilen sich eine maximal 760 px breite Spalte. Der leere Chat zeigt eine zentrierte Begrüßung, die gemeinsame Eingabefläche und drei bearbeitbare Gesprächseinstiege. Im laufenden Gespräch bleibt die Eingabe unten.

Die 248 px breite Desktop-Seitenleiste ist einklappbar; mobil und im kompakten Panel öffnet sie als Navigation mit Hintergrundabdeckung, Fokusführung und Escape-Unterstützung. Gespräche sind nach Heute, Gestern und Letzte 7 Tage gruppiert. Ablaufdatum und Löschen stehen im Gesprächsmenü.

Diktieren, Sprachstart, Senden und Stoppen verwenden einheitliche beschriftete SVG-Symbole. Die Eingabe wächst bis 160 px. Die bestehende mobile Navigation und Namen sammeln bleiben erreichbar.

## Sprache und Zustand

`AssistantVoiceSurface` stellt die kompakte Sprachsteuerung und die aufklappbaren Sprachoptionen dar. Die vorhandenen Live- und Mock-Controller behalten Verantwortung für Verbindungen, Medien und Anfragen. Musik, Begrüßungsoptionen und Textfortsetzung stehen in den Sprachoptionen. Verbindungsfehler, Wiederherstellung und notwendige Bestätigungen bleiben direkt sichtbar. Simulation wird ausdrücklich gekennzeichnet.

Der Composer bleibt während der Sprachsitzung eingehängt, aber ausgeblendet und gesperrt. Nach dem Ende kehrt der Entwurf zurück. Panel-/Workspace-Wechsel starten keine zweite Live-Verbindung und unterbrechen keine Diktieraufnahme. Schließen beendet weiterhin die Mediennutzung. Die bereits vorhandene Wiederherstellung einer blockierten vorherigen Sitzung wurde erhalten.

Im Provider wurden zwei zusammenhängende Initialisierungsfälle korrigiert: Die erste Benutzerregistrierung setzt eine bereits früh geöffnete Oberfläche nicht mehr zurück; der initiale Pfad-Effekt schließt die mobile Oberfläche nicht nach einem frühen Klick. Tatsächliche Kontowechsel behalten die bisherige Rücksetzung. Absichtlich ausgelöste reine Ansichtswechsel sind von normaler Navigation getrennt.

Keine Änderungen an öffentlichen APIs, Datenbankschema, Speicherfristen, Schreibbestätigungen oder Zugriffsregeln. Keine neuen Abhängigkeiten. Das Redesign wird gemeinsam mit den bereits integrierten Sprachkorrekturen veröffentlicht.

## Nachweise

Alle Tests verwendeten isolierte lokale Datenbanken und kontrollierte Anbieter-/Medien-Fixtures.

| Prüfung | Ergebnis |
| --- | --- |
| `npm run test:ai` | 109 Tests bestanden |
| ESLint für alle geänderten Assistentenkomponenten | bestanden |
| `npm run build:ai:ux:check` | optimierter Build einschließlich Typprüfung bestanden; keine produktive Migration |
| `npm run test:ai:ux:browser` | bestanden |
| `npm run test:ai:ux:production` | 18 Abnahmeszenarien bestanden |
| `npm run test:ai:live:browser` | lokaler Mock-Sprachablauf bestanden |
| `node --import ./scripts/alias-hook.mjs scripts/jarvis-pilot-browser.mjs` | kontrollierter WebRTC-/Sprachablauf bestanden |
| `git diff --check` | bestanden |

Visuell geprüft: leere Unterhaltung und aktiver Sprachchat bei 320, 390, 768, 1440 und 1920 px jeweils in Hell und Dunkel; zusätzlich kompaktes Desktop-Panel, geringe Fensterhöhe, lange Antworten, CRM-Vorschläge und Belege, Navigation, Löschen, Aufnahme, Fehler sowie 200 % Textvergrößerung. Die Geometrieprüfung bestätigt deckungsgleiche horizontale Grenzen von Verlauf und Sprachsteuerung.

Die Funktionsprüfungen umfassen Entwurferhalt und weiterlaufende Diktieraufnahme beim Ansichtswechsel, Bestätigen und Undo mit tatsächlichen lokalen HTTP-/Datenbankzugriffen, Wiederherstellung verlorener Antworten, Gesprächsgrenzen und Ablauf, Mikrofonverweigerung, Stummschalten, Unterbrechen, Wiederverbinden, blockierte vorherige Sitzungen und verspätete Startantworten. Beide Browser-Sprachprüfungen melden keine JavaScript-Seitenfehler.

Die Text-/Linkfarben erreichen auf den beiden Hauptflächen mindestens 5,01:1 Kontrast; Tastaturfokus ist sichtbar. Reale Smartphones mit Bildschirmtastatur, Screenreader, echte Mikrofon-/Lautsprecherhardware und externe Live-Anbieter wurden nicht geprüft.

Berichte und Screenshots:

- `test-results/ai-crm-ux/result.json` — Production-Browserabnahme und Screenshots `redesign-empty-*`.
- `test-results/ai-crm-live/result.json` — lokaler simulierter Sprachablauf.
- `test-results/jarvis-pilot/report.json` — kontrollierte Sprachabnahme und Screenshots `redesign-live-*`, `redesign-start-desktop.png`, `redesign-start-mobile.png`.

## Integration des separaten Sprach-Hotfixes

Der separate Sprach-Hotfix wurde auf `797be9e2d6acf3f6d19e2cf46e3555b2792c48aa` integriert, während die lokalen UI-Änderungen erhalten blieben. Die Pilot-Fixture verwendet nun das gegen das installierte OpenAI-SDK typgeprüfte Transkriptereignis mit `delta`. Anschließend wurde die kombinierte Redesign-Sprachbrowserprüfung erneut erfolgreich ausgeführt: ein Transport beim Ansichtswechsel, Entwurferhalt, Mikrofonverweigerung, beide Farbschemata und fünf Bildschirmbreiten, gemeinsame Antworten und Quellen, Musikentscheidung, Stummschalten, Unterbrechen, Wiederverbinden, Wiederholung mit unveränderter Operationskennung und Medienbereinigung.

Diese Nachprüfung änderte keinen Backend-Code. Sie verwendete kontrollierte WebRTC-/Audio-Fixtures und belegt weiterhin keine Funktion des externen Sprachdienstes oder echter Mikrofon-/Lautsprecherhardware.

## Gemeinsamer Release

Der freigegebene Stand enthält das vollständige Assistenten-Redesign, die Wiederherstellung blockierter Sprachsitzungen und die Korrektur des Live-Transkriptformats. Vor dem gemeinsamen Push auf `main` werden die vollständige Testsuite, der isolierte Produktionsbuild und die Browserabnahme dieses Builds geprüft. Für das Redesign kommen keine Datenbankmigrationen hinzu.
