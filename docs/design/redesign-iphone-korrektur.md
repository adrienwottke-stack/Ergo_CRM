# iPhone-Korrektur für die fünf Arbeitsbereiche

Verbindliche Richtung: die ruhigen Listen aus [Kontakte V3](iphone-kontakte-v3.png) und der Listenvariante der [drei Anordnungen](iphone-anordnungen-v3.png). Die Bilder sind Gestaltungsvorbilder; Daten, Funktionen und Freigaben kommen weiterhin aus dem CRM.

## Darstellung

| Zweck | Dunkle Ansicht |
| --- | --- |
| Hintergrund | `#0c131e` |
| Gruppierte Fläche | `#141d2b` |
| Hervorgehobenes Navy | `#1a3253` |
| Hauptaktion | `#2f6bb0` |
| Haupttext | `#eaf0f7` |
| Nebeninformation | `#a9b5c6` |

Deckende Flächen ersetzen Filtereffekte. Die iPhone-Systemschrift steht an erster Stelle. Seitentitel sind 32 px, Abschnittstitel 20 px und Kontaktzeilen 17 px. Der Seitenrand beträgt am Handy 20 px, bei 320 px Bildschirmbreite 16 px. Hauptaktionen sind mindestens 56 px hoch, sonstige Bedienelemente mindestens 44 px.

Auf den fünf Hauptseiten ersetzt ein Seitenkopf die zusätzliche mobile Logozeile. Suchen und Profil bleiben dort erreichbar. Die fünf Navigationspunkte heißen **Heute · Kontakte · Kalender · Fortschritt · Team**. Ein aktiver Punkt trägt weiße Schrift; die Navigation berücksichtigt den unteren sicheren Bereich des Geräts. Auf dem Desktop bleibt die Markenleiste erhalten.

## Anordnung

- **Kontakte:** Kopf → Anzahl und Name hinzufügen → Recruiting/Verkauf → eine nächste Aktion → Suche in dieser Liste → Kontaktzeilen. Die ganze Zeile öffnet das Profil. Einstufung, Verschieben und Mehrfachauswahl stehen unter „Liste organisieren“.
- **Kontaktprofil:** Rückweg/Bearbeiten → Name → Anrufen/Termin/Notiz → nächster und letzter Kontakt → erforderliches Ergebnis → Kandidatur → Verlauf und weitere Aktionen.
- **Heute:** nächste Handlung → Ziele und kompakter Stand → eigene Arbeit und Begleitung passend zur Arbeitslage → Einstieg/Erfolge → weitere Schritte. Die hervorgehobene Person wird in den Tagesaufgaben nicht wiederholt. Gruppen zeigen höchstens drei Einträge. „Alle Aufgaben“ führt zur vollständigen Tagesliste, die auch Anruf-Wiedervorlagen enthält; der Rückweg aus einem Profil erhält diese Vollansicht. Ein gerade stattfindender bestätigter Betreuungstermin hat auch beim eigenen Geschäft Vorrang.
- **Kalender:** Kopf und Termin anlegen → Datum und Ansicht → Agenda. Verbindungen und Abonnements stehen unter „Kalender verwalten“. Ein tatsächlicher Synchronisationsfehler bleibt sichtbar. Die gespeicherte Ansicht hat Vorrang vor der Geräte-Voreinstellung.
- **Fortschritt:** Hauptziel → offene Bestätigungen und Einheiten-Nachträge → kompakte Einheiten mit Eintrag → weitere Ziele → Wettbewerb, Trichter und persönliches Warum.
- **Team:** Begleiten · Auswertung · Struktur. Gemeinsame Absprachen und Unterstützung stehen vor der Partnerliste. Die Strukturmatrix und der Monatsvergleich sind aufklappbar. Das Partnerprofil führt vom aktuellen Stand über Vereinbarung und Betreuung zu Kennzahlen und Verlauf.

Der Arbeitsfokus liegt im Profil. Teampräsentation und Netzwerkabend gehören in Team. Ein Rückweg im Parameter `zurueck` bleibt innerhalb der Anwendung und erhält die aufrufende Liste, deren Suchbegriff oder die Kalenderansicht; ungültige Werte fallen auf Kontakte beziehungsweise Team zurück. Auch Bearbeiten und Speichern eines Kontakts erhalten den Rückweg. Der Termineinstieg im Profil fragt direkt Datum und Uhrzeit ab und leitet den nächsten Schritt aus der bestehenden Terminlogik ab.

Die gemeinsamen Teamziele und die Begleitung der ersten Geschäftsrunde sind angebunden. Führung stellt das Teamziel voran, Aufbau ergänzt es zum eigenen Ziel. Partnerdetails und zusätzliche Aktionen bleiben in „Begleitung & Aktionen“ erreichbar. Fehlende Freigabe wird ausdrücklich angezeigt. Das Teammeeting zeigt weiterhin ausschließlich aggregierte Auswertungen ohne persönliche Ziele, Wünsche oder Betreuungsnotizen.

Der Vorführmodus wird weiterhin unter Team eingeschaltet. Beim Wechsel auf Heute schützt er die gesamte persönliche Tagesübersicht einschließlich Kontakten, Zielen, Wünschen, Betreuungsabsprachen und Nachrichten. Nur während des Vorführens erscheint dort ein Hinweis mit „Vorführen beenden“. Bis der gespeicherte Zustand beim Seitenaufbau gelesen ist, bleiben geschützte Inhalte verdeckt.

## Prüfung

`test:redesign:browser` erzeugt Ansichten mit isolierten Beispieldaten. Der Lauf benötigt `CRM_REDESIGN_EXCLUSIVE=1`; er darf nicht gleichzeitig mit einem Build oder einem anderen Next-Prozess in diesem Worktree laufen. Produktionsläufe verwenden den zuvor mit `build:start:check` geprüften Build. Kein Prüfschritt benötigt eine produktive Datenbank.

Die Abnahme misst unter anderem die tatsächlich gerenderten Farben und Textkontraste, die Größe der Navigation, horizontales Überlaufen und die Position ganzer Kontaktzeilen. Bei 390 × 844 müssen zwei Kontakte ohne Nummer vollständig oberhalb der Navigation stehen, bei 320 × 568 mindestens der erste. Lange Namen, leere Listen, Suche ohne Treffer, Rückwege und gespeicherte Darstellung sind eigene Fälle.

Screenshots und ein Prüfbericht entstehen unter `test-results/redesign/`. Automatisch erfolgreiche Messungen ersetzen keine Sichtprüfung. Ein echter Anrufwechsel und die Bildschirmtastatur auf physischer iPhone-Hardware sowie die Aufgabenrunde mit Starter, aufbauendem Partner und Führungskraft müssen zusätzlich auf den jeweiligen Geräten bzw. mit diesen Personen geprüft werden.
