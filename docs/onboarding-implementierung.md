# Onboarding: Umsetzung und Integration

Arbeitszweig: `codex/onboarding-storno-namensfuehrung`, Ausgangspunkt `07b9798`.
Die Umsetzung liegt im eigenen Worktree `Ergo_CRM_onboarding`. Der Hauptworkspace wurde nicht verändert.

## Verhalten

- Neue Mitglieder durchlaufen nach der Listenwahl eine kurze Storno-Runde mit fünf festen Karten. Überspringen führt zum nächsten Onboarding-Akt. Entscheidungen und Fortschritt werden pro Konto gespeichert.
- Nach dem bestehenden Onboarding führt „Jetzt Namen sammeln“ direkt zur geführten Sammlung auf der gewählten Liste. Wer vorher überspringt und noch keine Liste gewählt hat, bekommt die Listenauswahl.
- Die Sammlung speichert Durchgang, Liste und Gedächtnisbereich. 20 Namen bleiben ein weiches Ziel; „Für heute fertig“ funktioniert bei jeder Anzahl.
- Nach dem Sammeln folgen fehlende Nummern und die Vorbereitung des ersten Anrufs. Eine vorhandene Nummer reicht zum Weitergehen. Die App wählt keine Telefonnummer selbst.
- „Für später einplanen“ zeigt die betroffenen Kontakte und eine editierbare Berliner Uhrzeit. Erst die Bestätigung plant maximal drei Anrufe. Bereits vorhandene nächste Schritte werden nicht überschrieben.
- Unerwartetes Schließen setzt beim nächsten neutralen App-Start den bestätigten Schritt fort. Bewusstes Vertagen führt zu Heute; dort bleibt eine Fortsetzen-Aktion.
- Abgeschlossene Bestandskonten bekommen keinen neuen Pflichtstart. Ein erneuter Aufruf von Willkommen ist eine Vorschau; Sprint, Brief, Einstufung, Ziel und Spiel schreiben darin keine CRM-Daten. Der ausdrückliche Wechsel aus der Vorschau in die normale Sammlung bleibt möglich.
- Der Führungsablauf bleibt getrennt. Das normale Storno-Spiel behält seine vollständigen Runden und Rekorde.

## Schnittstellen für das Redesign

`lib/start/model.ts` enthält die Reihenfolge und Zielrouten. `lib/start/service.ts` kapselt Speicherung und Zustandsübergänge; `app/startActions.ts` authentifiziert alle Aufrufe.

Wichtige Zustände in `StartProgress.phase`: `INTRO`, `COLLECTION`, `PHONES`, `CALLS`, `DONE`. `paused` unterscheidet bewusstes Vertagen vom unerwarteten Schließen. `onboardingDoneAt` bleibt der bestehende Abschluss der Einführung; es bedeutet nicht, dass auch die nachfolgende Startführung abgeschlossen ist.

Gemeinsame Integrationsstellen:

- `/start`, `/` und erfolgreiche Anmeldung verwenden `entryRoute`. Explizite Navigation zu Heute oder anderen Arbeitsbereichen bekommt keine zusätzliche Weiterleitungsschleife.
- Die Heute-Seite verwendet `StartHinweis`, wenn ein offener Start vorliegt. Echte heute fällige oder überfällige Aufgaben haben Vorrang. Der bisherige Nachfüllhinweis wird für diesen Zustand unterdrückt; die erste Woche steht in einer aufklappbaren Sektion.
- Für das Redesign die Aktion `startFortsetzen()` und die fachlichen Zustände übernehmen. Die hier kleine Änderung von Heute kann durch dessen neue Arbeitslagen ersetzt werden.
- AppShell und Navigation wurden wegen der parallelen Umsetzung nicht geändert. Die neuen Sammel-, Nummern- und Startklar-Seiten sollten dort eine ruhige Darstellung mit direkter Hauptaktion bekommen.
- Der permanente Link „Namen sammeln“ darf in der neuen Oberfläche unmittelbar erreichbar bleiben. Der Erststart führt direkt dorthin.
- `/namen/sammeln?liste=VERKAUF&runde=…` ist der gespeicherte Sammeldurchgang; `/namen/nummern?liste=VERKAUF&start=1` ergänzt Nummern; `/namen/startklar?liste=VERKAUF` bereitet Anrufe vor. Recruiting verwendet dieselben Routen mit `RECRUITING`.
- `offeneNamenOhneNaehe` akzeptiert jetzt optional eine Liste. Die bisherige implizite `ersterTagPlanen`-Action wurde entfernt; stattdessen `startAnrufePlanen` mit angezeigten Kontakt-IDs und bestätigter Uhrzeit verwenden.

## Datenbank und Schalter

Additive Migration `20260908200000_startfuehrung`:

- `StartProgress`: Checkpoint, Revision, Antworten, Storno-Entscheidungen, Sprint-Endzeit, übersprungene Nummern und Meilensteine.
- `NameCollection`: Eigentümer, Liste, Gedächtnisbereich und Abschluss eines Durchgangs.
- `NameOperation`: Vorgangsschlüssel und Ergebnis bestätigter Namensspeicherungen. Wiederholte HTTP-Anfragen erzeugen dadurch keine zusätzlichen Kontakte oder Wettbewerbsaktivitäten.

Keine Bestandsdaten werden zurückgesetzt oder nachträglich in die neue Führung aufgenommen. Die Schema-Erweiterung mit den Änderungen der Redesign-Task zusammenführen, dann den Prisma-Client neu generieren. Generierte Dateien werden nicht committed.

Die Migration legt `startfuehrung` und `stornoStart` jeweils ausdrücklich als `TEST` an. Beide lassen sich in der Werkstatt getrennt schalten. Für diese beiden neuen Funktionen bedeutet ein fehlender Datensatz **aus**. `TEST` und `LAEUFT` bedeuten aktiv. Schalter deaktivieren entfernt keine gespeicherten Kontakte oder Checkpoints.

`DATABASE_POOL_MAX` begrenzt optional den Verbindungspool; ohne Angabe bleibt der bisherige Standard von zehn Verbindungen. Die isolierten Browserprüfungen setzen den Wert auf eins, da PGlite kein Ersatz für PostgreSQL mit mehreren parallelen Sitzungen ist.

## Prüfungen und Grenzen

Abschlussstand: acht automatisierte Fach-/Datenbanktests grün, alle 32 Spielverläufe geprüft, mobiler Browserdurchlauf einschließlich Sprint-Übertragungsfehler und Desktop-Regression grün. Prisma-Validierung, TypeScript, Lint und isolierter Produktionsbuild sind erfolgreich.

Automatisierte Prüfungen:

- `npm run test:start`: Routing und Übergänge, alle 32 Storno-Entscheidungsfolgen, vollständige Migrationen in einer neuen Testdatenbank, Wiederholungen, fremde Konten, alte Revisionen, Listenkorrektur, Nummern und bestätigte Planung.
- `npm run test:start:browser`: lokale Next-Instanz mit ausschließlich fiktiven Konten; mobiler Durchlauf einschließlich Pause, Neustart und Nummern, reguläres Spiel, Bestandskonto-Vorschau, früher Abbruch ohne Listenwahl sowie Sprint bei fehlgeschlagener Übertragung. Voraussetzung: Playwright und `npx playwright install chromium`; alternativ `BROWSER_EXECUTABLE` für einen installierten Chromium-Browser.
- `npm run build:check`: reiner Next-Produktionsbuild gegen eine neue isolierte Datenbank. Führt **kein** `prisma migrate deploy` gegen konfigurierte Datenbanken aus.

Browserbilder und Logs werden unter `test-results/start/` abgelegt und nicht committed. Testdatenbanken werden ausschließlich im Arbeitsspeicher erzeugt und nach dem Lauf geschlossen. Die Tests lesen keine Projekt-`.env`, um eine Datenbank auszuwählen.

Die Browserprüfung emuliert kleine und große Bildschirmgrößen in Chromium. Eine reale Installation auf iPhone/Android, deren Tastatur- und App-Wechselverhalten sowie echte gleichzeitige PostgreSQL-Sitzungen bleiben vor Veröffentlichung in der gemeinsamen Staging-Umgebung zu prüfen.

Es wurde keine produktive Migration und kein Deployment ausgeführt.
