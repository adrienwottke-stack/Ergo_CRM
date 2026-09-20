# AI-CRM UX: Umsetzung und Prüfung

Stand: 19. September 2026. Grundlage: `docs/ai-crm-ux-uebergabe.md`, empfohlene Umsetzung in sechs Phasen. Der Auftrag „nutz das dokument und setz alles um“ wurde als Freigabe des hybriden Assistenten und der abgestuften Schreibbestätigung umgesetzt.

## Umgesetztes Verhalten

| Phase | Ergebnis | Zentrale Dateien |
| --- | --- | --- |
| 1: Gemeinsame Struktur | Globaler Einstieg in der bestehenden AppShell; kleiner Heute-Einstieg; bewusste Kontextübergabe aus Kontakt, Wiedervorlage, Namen sammeln und Mini-Emil. | `app/layout.tsx`, `components/AppShell.tsx`, `components/ai-crm/AssistantEntry.tsx` |
| 2: Gespräch und Diktat | Einheitliche Nachrichtenfläche und Composer; Mikrofon starten, stoppen und verwerfen; editierbares Transkript; nur Senden löst Chat aus. | `AssistantView.tsx`, `AssistantTimeline.tsx`, `AssistantComposer.tsx` |
| 3: Unterhaltungen | Erstellung erst beim Senden; feste sieben Tage ab Beginn; höchstens 20 Nachrichten; weitere Gespräche nachladbar; bestätigtes Löschen; Kontextwechsel erklärt. | `AssistantProvider.tsx`, `lib/ai-crm/conversations.ts`, `chat-conversation.ts`, Conversation-APIs |
| 4: Ergebnisse und Undo | Gelesene CRM-Ergebnisse mit Abrufzeit; eigene Belege für einzelne Änderungen; tatsächlicher Undo-Status, Frist und Konflikte; Wiederherstellung nach verlorener Antwort. | `presentation.ts`, `action-plans.ts`, `undo-guard.ts`, `lib/undo.ts` |
| 5: Bestätigung und Abbruch | Serverseitig gespeicherte, unveränderliche Vorschauen; Eigentümerprüfung und erneute Datensatzprüfung vor Ausführung; idempotente Bestätigung; Stop beendet ausstehende Schritte und zeigt bereits gespeicherte Ergebnisse. | `ux-agent.ts`, `action-plans.ts`, Request-API |
| 6: Desktop-Arbeitsbereich | Rechtes Panel, eigene Route `/assistent` und mobile Ansicht verwenden denselben Zustand oberhalb beider Layoutgruppen. Entwurf, Gespräch und laufende Anfrage bleiben bei unterstützten Ansichtswechseln erhalten. | `AssistantProvider.tsx`, `AssistantSurface.tsx`, `app/(app)/assistent/page.tsx`, `app/assistant.css` |

Desktop verwendet ein 432-Pixel-Panel; der CRM-Inhalt bleibt daneben bedienbar. Die große Ansicht enthält eine Gesprächsliste. Mobil bleibt der bestehende Fünf-Punkte-Dock mit Namen sammeln erreichbar; der Composer berücksichtigt den sichtbaren Viewport. Fokus kehrt beim Schließen zum Einstieg zurück, Escape schließt, F6 wechselt im Desktop-Panel zwischen CRM und Assistent. Der Vorführmodus sperrt die Assistenten-Einstiege. Mini-Emil pausiert seine Vorschau, während der Assistent geöffnet ist.

Die vorhandene Navy/Blau-Farbwelt und semantischen Theme-Farben gelten auch für den Assistenten. Die Spracherkennung sendet Audio nur an den bestehenden Transkriptionsendpunkt. Beim Verlassen, Abbrechen, Browserwechsel und bei einer verspäteten Mikrofonfreigabe werden die Media-Tracks beendet.

## Serverseitige Verträge

- `GET /api/ai-crm/access`: Zugang und Nutzung ohne Provideraufruf und ohne neue Unterhaltung.
- `POST /api/ai-crm/chat`: Nachricht, Quellenart, feste `clientRequestId`, optional bestehende Unterhaltung und explizit gewählte Kontakt-/Wiedervorlage-ID. Browserseitige Gesprächshistorie und ungeprüfte Kontaktlabels werden nicht akzeptiert.
- `GET /api/ai-crm/conversations?cursor=…`: jeweils zehn gültige, eigene Gespräche, nach letzter Aktivität sortiert, mit `nextCursor`.
- `GET /api/ai-crm/conversations/[id]`: gespeicherte Nachrichten, strukturierte Leseergebnisse und frisch aufgelöste Aktions-/Undo-Zustände.
- `DELETE /api/ai-crm/conversations/[id]`: löscht Gesprächsinhalt; eigene CRM-Daten bleiben erhalten. Laufende Vorgänge sperren das Löschen, abgelaufene Vorgänge werden bei der Bereinigung entwertet.
- `GET /api/ai-crm/requests/[id]`: aktueller Abschluss und Einzelbelege anhand der serverseitigen oder ursprünglichen Client-ID.
- `POST /api/ai-crm/requests/[id]`: ausschließlich `confirm` mit serverseitigen Aktions-IDs oder `cancel`. Neue Toolparameter sind in diesem Vertrag nicht zulässig.

Vorschauen liegen in der vorhandenen `AiToolExecution.result`-Struktur. **Die UX-Umsetzung benötigt keine zusätzliche Migration.** Sie setzt die bereits in der Arbeitskopie vorhandenen AI-V1.1-Tabellen voraus. Ein Browserklick bestätigt konkrete gespeicherte Parameter. Änderungen am zugrunde liegenden Datensatz führen zu einem sichtbaren Fehlerbeleg statt zum Überschreiben neuerer Werte. Konkurrierende Bestätigungen sperren denselben Request; jede Aktion und ihr Audit-Beleg werden atomar gespeichert.

Der neue Chatpfad verwendet `runUxCrmAgent`. Alle Modell-Schreibwünsche werden zunächst vorbereitet. Eine einzelne, ausdrücklich beauftragte kleine Notiz, Gesprächsdokumentation oder Wiedervorlage kann danach direkt ausgeführt werden. Kontaktanlage, Feldänderungen, Erledigen und mehrteilige Aufträge erfordern Bestätigung. Ein gescheiterter Teilschritt bleibt sichtbar und verhindert die automatische Ausführung übriger Schritte. Modellformulierungen gelten nicht als Speicherbeleg.

Die Wiederherstellung fragt den bestehenden Request ab. Nur wenn dessen Anlage nicht nachgewiesen werden kann, darf exakt derselbe Auftrag mit derselben ID erneut gesendet werden. Bereits abgeschlossene oder gescheiterte Chat-Requests werden nicht als vollständiger Modelllauf wiederholt. Stop versucht ausschließlich, denselben Request zu beenden; ein bereits gespeicherter Schritt wird dadurch nicht rückgängig gemacht.

## Reproduzierbare Prüfungen

- `npm run test:ai`: bestehende AI-/API-Tests und neue UX-Serverfälle gegen eine wegwerfbare lokale PostgreSQL-kompatible Testdatenbank. Aktueller Lauf: **32 bestanden**.
- `npm run test:ai:ux:browser`: Chromium mit realen Next-Routen, echten lokalen CRM-Schreibvorgängen und lokal simulierten Providerantworten. Mikrofon und Transkriptionsantwort sind Testfixtures. Screenshots und Ergebnis: `test-results/ai-crm-ux/`.
- `npm run test:ai:ux:production`: derselbe Durchlauf gegen den zuvor isoliert gebauten Stand mit `next start`. Der allgemeine Befehl `test:ai:browser` verweist jetzt auf die neue Oberfläche; das alte `ai-crm-browser.mjs` ist nur eine erhaltene V1.1-Referenz mit den früheren UI-Selektoren.
- `npm run build:ai:ux:check`: direkter Next-Produktionsbuild gegen eigene temporäre Testdatenbank, mit eigenem Cache und eigener TypeScript-Konfiguration. Führt **kein** `prisma migrate deploy` gegen die gemeinsame Datenbank aus.
- Zielgerichteter ESLint-Lauf der neuen UX-Komponenten und Servermodule: ohne Befunde.
- Bestehende Mini-Emil- und Kontakt-/Undo-Regressionen: **14 bestanden** (`scripts/coach.test.mjs` und `scripts/contact-result-review.test.mjs`). Der isolierte Produktionsbuild einschließlich Typprüfung ist erfolgreich.

Der abschließende Browserlauf gegen den Produktionsbuild besteht vollständig: **16 Prüfgruppen, keine Browserfehler**. Er umfasst Panel-/Arbeitsbereich-Wechsel, Team-Navigation, Kontext, Vorschau/Bestätigung/Undo, Wiederöffnung, mehrteilige Änderungen, verlorene HTTP-Antwort, Stop, Vorführmodus, 375 × 812 und 320 Pixel, kurze Viewport-Höhe, Diktatkorrektur, verweigertes Mikrofon, Aufnahme verwerfen und schließen, Löschdialog und Hell-/Dunkeldarstellung. Zusätzliche Fälle prüfen die Rückkehr zu Namen sammeln, ein zweites angemeldetes Browserprofil, mehr als zehn Gespräche, die 20-Nachrichten-Grenze, Ablauf und 200 Prozent Textgröße. Der korrigierte Navigationsumbruch und ein ResizeObserver halten das Panel auch bei größerem App-Kopf an der richtigen Position. Verbindlicher Laufstatus steht in `test-results/ai-crm-ux/result.json` (`success: true`, `mode: production-build`). Die 13 Provider-HTTP-Aufrufe dieses Laufs gingen ausschließlich an den lokalen Testserver.

## Grenzen und verbleibende Abnahme

- Echtes iPhone/Safari und Android mit Bildschirmtastatur, Safe Areas und echtem Mikrofon stehen in der lokalen Testumgebung nicht zur Verfügung.
- VoiceOver/TalkBack und eine beobachtete Nutzerrunde mit fünf bis acht Personen sind noch offen. Semantik, Fokusbedienung, Tastatur, Ziele und reduzierte Bewegung sind technisch vorbereitet; eine vollständige Screenreader-Abnahme wird damit nicht behauptet.
- Es gab keine realen OpenAI-/Stripe-Aufrufe. Modellqualität, reale Transkriptionsqualität und ein produktiver Bezahlvorgang sind gesondert abzunehmen.
- Keine Preview, keine Produktionsveröffentlichung, keine gemeinsame Datenbankmigration. Kein Commit und kein Push in diesem UX-Auftrag.

## Abgrenzung vorhandener und paralleler Arbeit

Beim Start lagen bereits uncommittete AI-V1.1-Arbeiten vor: bestehende Tools, Chat-/Audio-/Billing-Bausteine, Wiedervorlagen, Schema und zwei AI-Migrationen. Diese wurden erhalten und an den benötigten Stellen erweitert. Neu aus diesem Auftrag stammen insbesondere die `Assistant*`-Oberfläche, ihre globale Integration, Aktionsvorschauen und deren API, Undo-Konfliktprüfung, strukturierte Darstellung sowie die UX-Test-/Buildskripte.

Parallel arbeitet der separate Task „Implementiere Jarvis Live Demo“ in derselben Arbeitskopie. Dessen Live-Module und zusätzliche Live-Migration gehören zu diesem anderen Auftrag und wurden nicht entfernt. Die UX-Oberfläche übernimmt die vorhandene Live-Anbindung als gesonderten, aufklappbaren Einstieg, sofern sie serverseitig verfügbar ist. Bei `AI_LIVE_PROVIDER=disabled` wird sie nicht angezeigt. Die im Übergabedokument als spätere Arbeit beschriebenen echten Live-Provider, Wissens-/RAG-Funktionen und proaktiven Briefings wurden durch diesen UX-Auftrag nicht implementiert oder aktiviert.
