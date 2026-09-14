# Mini-Emil: erste Arbeitsrunde und Hilfe auf Abruf

## Vereinbartes Verhalten

Die vollständige App bleibt erreichbar. Nach dem Berater-Onboarding öffnet sich die Namensammlung. Mini-Emil erklärt mit einer kurzen, stummen Beispielanimation die nächste Funktion. 20 Namen sind ein freiwilliges Ziel; eine Nummer genügt für den ersten Anruf. Die Runde reicht bis zum gehaltenen Termin, dem Ergebnis und der Empfehlungsfrage sowie bei einem Abschluss den zugehörigen Einheiten. Auch null Empfehlungen und kein Abschluss sind gültige Ergebnisse.

Vorschauen und Arbeitsfortschritt sind getrennt. Beispieldaten sind reine Darstellung und rufen keine CRM-Actions auf. Die acht Erklärungen decken Sammeln, Telefonnummer, Anruf, Anrufergebnis, Termin, Ergebnis/Empfehlungen, Einheiten und den Rundenabschluss ab. Reduzierte Bewegung zeigt dieselben Inhalte als manuell schaltbare Bilder.

## Zustand und Integrationen

- `StartProgress.version = 2` nutzt die vorhandene Phase und Pausierung. `coachSeen` merkt eingeführte Erklärungen geräteübergreifend; `coachContactId` hält den aktuellen Arbeitsbezug. Die neue additive Migration ist `20260914160000_mini_emil`.
- `lib/coach/service.ts` berechnet den nächsten Schritt aus eigenen Kontakten und deren tatsächlichen Anruf-, Termin-, Empfehlungs- und Einheitenzuständen. Manuelle Summenzähler allein erledigen keinen Schritt. Neuberechnung berücksichtigt Rückgängig und zwischenzeitlich geänderte Kontakte.
- Öffnen des Anrufdurchlaufs und Planen eines Anrufs beenden Version 2 nicht. Zukünftige Anrufe und Termine öffnen bei neutralem App-Start Heute. Eine bewusst pausierte Sammlung bleibt pausiert; ein leer beendeter Sammeldurchgang bleibt als offene Aufgabe erhalten.
- Die AppShell und Heute teilen die Berechnung innerhalb eines Server-Renderings. Der Client aktualisiert zusätzlich nach bestätigter Arbeit, Rückgängig, Seitenwechsel und Rückkehr zur sichtbaren App. Die vorhandenen Formulare bleiben die einzigen Schreibwege für Arbeit.
- Hintergrundabfragen und Demoquittierungen laufen über die authentifizierte `/api/emil`-Route, unabhängig von der React-Navigationswarteschlange. Demoquittierungen verlangen denselben Origin und gültige Demo-IDs; sie ändern ausschließlich den eigenen Erklärungsstand. Pause und Aktivierung bleiben ausdrückliche Server-Actions.
- Die Figur weicht Eingabefokus, echten Dialogen und der Rückgängig-Anzeige. Navigation bleibt sichtbar. Die Hilfe lässt sich in der Figur, im Profil und über die Suche aufrufen.
- Neue und noch offene Beraterstarts werden automatisch aufgenommen. Pausierung bleibt erhalten. Abgeschlossene Bestandskonten und der separate Führungsstart sind ausschließlich opt-in. Eine manuelle Aktivierung berücksichtigt vorhandene Arbeit und setzt keine Geschäftsdaten zurück.
- Nach dem Abschluss erscheint die Abschluss-Erklärung einmal; danach bleibt Emil auf Abruf. Erklärungen lassen sich unabhängig vom fachlichen Stand wiederholen.
- Konten mit aktivierter Emil-Begleitung erhalten auf Heute keine zusätzliche alte Einstiegsliste. So zeigt die App keinen konkurrierenden Rundenstand oder widersprüchlichen nächsten Schritt; bei ausgeschaltetem Emil und Bestandskonten ohne Aktivierung bleibt die bisherige Liste erhalten.

## Gestaltung und Bildherkunft

Die drei Cartoonposen wurden mit dem integrierten Bildwerkzeug aus den fünf vom Nutzer bereitgestellten Emil-Fotos erzeugt. Foto 5 dient als Hauptreferenz, Foto 1 und 2 ergänzen Ausdruck und Perspektive. Originalfotos werden nicht in `public` kopiert.

Die verwendeten Dateien sind `public/emil/begruessen-v1.png`, `erklaeren-v1.png` und `bestaetigen-v1.png`. Die genaue Promptfolge steht in `mini-emil-bildprompts.json`. Das Bildwerkzeug lieferte bei der angefragten Alpha-Freistellung ein gezeichnetes Transparenzmuster. Diese Varianten werden nicht verwendet. Die finalen Figuren haben einen weißen Hintergrund und sitzen in hellen, abgerundeten Portraitflächen, auch im Dunkelmodus. Next Image liefert größenangepasste Versionen aus.

## Schalter und Einführung

`miniEmil` wird in der Werkstatt durch die Migration als **AUS** angelegt. Sowohl `miniEmil` als auch `startfuehrung` müssen TEST oder LAEUFT sein. Fehlende Einträge aktivieren Emil nicht. Ausschalten erhält alle Kontakte und Checkpoints.

Für die Einführung zuerst die additive Migration im Zielsystem ausrollen, dann die Funktion in einer Testumgebung aktivieren und die unten genannten Geräteprüfungen ausführen. Kein reguläres `npm run build` als lokaler Prüfweg: dieses Skript führt auch `prisma migrate deploy` aus.

## Prüfwege

- `npm run test:emil`: Zustandsentscheidungen, Zielgruppen, Pause, parallele Demoquittierung und echte Ergebnis-Actions inklusive Rückgängig und zugeordneter Einheiten gegen eine frische Speicherdatenbank.
- `npm run test:emil:browser`: isolierter Browserdurchlauf mit fiktiven Kontakten und Bildschirmbildern unter `test-results/emil`.
- `npm run build:emil:check`: migrationsfreier Produktionsbuild gegen eine isolierte Datenbank. Cache und temporäre TypeScript-Konfiguration liegen unter `.cache`, getrennt vom laufenden Entwicklungsserver.
- Nach dem Build kann derselbe Browserlauf mit `CRM_TEST_PRODUCTION=1` gegen den Produktionsserver ausgeführt werden.
- Ergänzend bleiben die bestehenden Start-, Ergebnis- und Gesamtregressionen relevant.

Vor öffentlicher Freigabe bleiben die reale Installation auf iPhone/Android, native Tastatur-/Telefon-App-Rückkehr und eine Produktprobe mit neuen Mitgliedern erforderlich. Automatisierte Chromium-Prüfungen ersetzen diese Abnahme nicht.

## Verifiziert am 14.09.2026

- `npm test`: **78/78 bestanden**, einschließlich der sechs neuen Emil-Fachtests. Darin enthalten sind echte Ergebnis-Actions, Rückgängig, zugeordnete Einheiten, Eigentümer-/Listengrenzen, Origin-/Demo-Prüfung der Hintergrundroute sowie vorhandene Start- und Strukturregressionen.
- `npm run build:emil:check`: **bestanden**, einschließlich TypeScript- und Lint-Prüfung, gegen die isolierte Testdatenbank. Keine Migration auf einer bestehenden Datenbank ausgeführt.
- Browserdurchlauf im Entwicklungsmodus: **bestanden** für Sammeln, Telefonnummer, Anruf, zukünftigen Termin, gehaltenen Termin ohne Abschluss, Pausieren/Fortsetzen, Abschluss-Erklärung und Hilfe auf Abruf.
- Erweiterter Browserdurchlauf mit `CRM_TEST_PRODUCTION=1`: **zweimal unmittelbar hintereinander bestanden**, mit der finalen Hintergrundroute und der auf den Schreibvorgang begrenzten Formularsperre. Zusätzlich einen echten Abschluss über die Oberfläche gespeichert, Einheiten auf später verschoben, die Runde weiterhin offen vorgefunden und anschließend **12,50 Einheiten** über die zugehörige Erinnerung gebucht. Die Runde wird erst nach dieser Buchung beendet. Die konkurrierende alte Einstiegsliste bleibt ausgeblendet.
- Chromium mit 390 × 844 und 320 × 568 Pixeln sowie Desktop mit 1440 × 1000 Pixeln; reduzierte Bewegung und Hell-/Dunkelmodus geprüft. Beispiele erzeugen keine Kontakte oder Buchungen. Das Ausschalten entfernt Emil aus der Oberfläche.
- Mobile und Desktop-Bildschirmbilder: `test-results/emil/01-collection-mobile-dark.png` bis `08-win-round-complete.png`. Visuell geprüft: Einstieg, kleine Bildschirmbreite, Desktop-Hilfe und Abschluss mit Einheiten.

Die Bilddateien sind für die Next-Bildoptimierung öffentlich abrufbar. Die mobilen Abstände folgen der bestehenden Navigationshöhe einschließlich des Sammelbuttons. Beim Schließen einer Vorschau wird dieselbe Seite nicht unnötig erneut geöffnet.

Die Ladeanzeige in Sammlung und Nummerneingabe gehört zum jeweiligen bestätigten Schreibvorgang. Parallele Aktualisierungen der Begleitung verlängern diese Sperre nicht. Damit bleibt der nächste Formularschritt nach erfolgreichem Speichern bedienbar.

Stand: lokal umgesetzt und geprüft; kein Commit, Push oder Deployment durch diese Umsetzung. `miniEmil` bleibt in der neuen Migration standardmäßig AUS.
