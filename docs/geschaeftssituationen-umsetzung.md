# Cockpit nach drei Geschäftssituationen

Stand: 09.09.2026. Umsetzung des freigegebenen Nutzerplans auf dem bestehenden Cockpit. Der Schwerpunkt liegt auf Geschäftsabläufen, Führung und Daten; die gemeinsame Gestaltung wird separat im Redesign zusammengeführt.

## Produktmaßstab und Anordnung

Die fünf Hauptbereiche Heute, Kontakte, Kalender, Fortschritt und Team bleiben fest. Auf Heute stehen ausführbare nächste Handlung und kurzer Zielstand direkt zusammen. Eigene Tagesaufgaben und Partner werden zunächst auf höchstens drei Einträge begrenzt; vollständige Listen bleiben erreichbar. Das Profil speichert den Arbeitsfokus. Automatisch zählt ausschließlich ein aktiver direkter Partner mit eigenem Zugang für den Wechsel in den Aufbau.

| Situation | Reihenfolge und passende Handlung |
| --- | --- |
| Eigenes Geschäft | Eigener nächster Schritt, persönliches Ziel mit Einheitenzugang, Tagesarbeit, erste Runde und Wettbewerb, weitere Aufgaben |
| Geschäft und Partneraufbau | Eigene Arbeit; ein gerade stattfindender gemeinsamer Termin darf vorgehen. Persönliches Ziel und kompakter Teamzielstand, dann direkte Partner mit Absprachen |
| Team führen | Fällige gemeinsame Absprache oder direkter Ansprechpartner für belegten Unterstützungsbedarf, Teamziel und Entwicklung, Partner mit Teilteams, Teammeeting; eigenes Geschäft bleibt kompakt erreichbar |

Ziele, Wünsche, Wettbewerb, Zuspruch und Einstieg gehören zum Kern der Begleitung. Auswertung und die Entwicklung der direkten Partner samt deren Teams gehören zum Kerngeschäft einer Führungskraft. Die frühere pauschale Einschränkung auf unmittelbar eigene Vertriebsaktivitäten gilt nicht mehr.

## Durchgehende eigene Arbeit und Rückmeldung

`lib/begleitung.ts` leitet die erste Runde aus gespeicherten Namen, Telefonnummern, Aktivitätsbuchungen, Empfehlungen und Einheiten ab. Sie endet nicht nach sieben Tagen, lässt sich einklappen und verlangt keinen Abschluss. Nur wenn ein Abschluss vorliegt, kommt die Einheitenetappe hinzu. Mein Warum bleibt unter Fortschritt bearbeitbar und wird in der Begleitung beziehungsweise der vorhandenen Wiedereinstiegsansprache aufgegriffen.

Der erste Anruf öffnet die Gesprächshilfe. Ein konkreter Anrufen-Knopf auf Heute führt zum bezeichneten eigenen Kontakt. Kein Interesse ist direkt im Durchlauf erreichbar, schreibt eine rücknehmbare Ergebnisaktion und entfernt die weitere Wiedervorlage. Nicht erreichte Anrufe zählen in der Bilanz als Anrufversuche.

Alle vier Einheitenzugänge verwenden `EinheitenErfolg`: gespeicherter Betrag, Monats- und Gesamtstand sowie persönlicher Zieltext und Zielbalken. Ein Refresh aktualisiert die übrigen Zielanzeigen. Erst eine erfolgreiche Speicherantwort löst den Erfolg aus; Validierungsfehler lassen die Eingabe stehen. Bei einer wiederholten Abschlusszuordnung bestätigt die App den tatsächlich gespeicherten Betrag, auch wenn ein veraltetes Formular inzwischen einen anderen Betrag enthält.

Erste Einheiten und erreichte persönliche Ziele lassen sich freiwillig im bestehenden Feed teilen. Das erste Einheitenereignis besitzt einen stabilen Schlüssel je Konto; Wiederholungen erzeugen keinen zweiten Beitrag. Ein direkter Partner bekommt bei einem geteilten oder berechtigt sichtbaren Erfolg einen Gratulationsanlass. Eine persönliche Nachricht wird ausschließlich nach einer bewussten Sendeaktion verschickt.

## Partner und Führung

Die Partnervorschau verbindet zuletzt passiert, gemeinsam vereinbart, nächster Schritt, erlaubten Zielstand und passende Unterstützung. Im bestehenden Startfenster nutzt sie dieselbe erste Runde wie der neue Partner. Aktivitätsdaten und Kundenprozessdetails werden nur innerhalb ihrer bisherigen Freigaben geladen; private Kunden- und Betreuungsnotizen werden nicht übernommen. Gemeinsame Absprachen stammen ausschließlich aus der bestehenden Beteiligtenprüfung.

Ein direkter Partner mit aktivem Team zeigt Eigenleistung und Teamleistung separat für die laufende Woche und führt in die passende Teilteamauswertung. Belegte tiefere Fälle werden dem direkten Partner zugeordnet. Ein Hinweis erzeugt keine Aufgabe von selbst.

Der gespeicherte Führungsfokus unterdrückt die Bewertung anhand fehlender eigener Anrufe und leerer eigener Pipeline. Das gilt für die Mannschaftssignale und den Morgen-Cron. Tatsächlich fällige eigene Verpflichtungen, gemeinsame Absprachen und belegte Teamfälle bleiben erhalten. Die Morgenmeldung verweist bei tieferen Fällen auf den zuständigen direkten Ansprechpartner.

Team öffnet mit Begleiten, daneben Auswertung und Struktur. Zeitraum und Teamumfang steuern weiterhin gemeinsam Kurve, Aktivitätszahlen, Trichter und Meetingansicht. Der bestehende instanzweite Teamabend wird als Netzwerkabend mit Wettbewerb und geteilten Erfolgen bezeichnet; seine URL bleibt kompatibel.

## Teamziele und Berechnung

Die additive Migration `20260909120000_teamziele` legt `Teamziel` mit Verantwortlichem, Teamwurzel, Titel, Kennzahl, Zielwert, Zeitraum, Wunsch und Archivierung an. Persönliche Ziele werden nicht umgedeutet. Setzen und Beenden eines Teamziels sind auf dessen eigene verantwortliche Führungskraft begrenzt.

- Unterstützt: Kalenderwoche und Kalendermonat; Anrufe, vereinbarte Termine, gehaltene Termine und Einheiten.
- Gezählt: aktive Nachfahren mit eigenem Zugang, einschließlich tieferer Teams und ohne die Eigenleistung der Teamwurzel.
- Grundlage: vorhandene Aktivitäts- und Einheitenbuchungen mit deren Korrekturen. Einheiten-Startbestände zählen nicht als neue Leistung im Zielzeitraum.
- Sichtbarkeit: Mitglieder sehen ausschließlich Ziel und gemeinsamen Gesamtstand. Das eröffnet keine persönlichen Ziele oder fremden Kontaktinhalte.
- Zuordnung: aktuelle Struktur. Ein Teamwechsel verändert den Stand; historische Mitgliedschaften werden in dieser Version nicht rekonstruiert.
- Fehlende Aktivitätsprofile werden als Datenlücke markiert. In der Verwaltung bleiben geplante und vergangene, noch nicht beendete Ziele erreichbar.

Einheiten werden nicht in Verdienst, verfügbares Geld oder Renditen umgerechnet.

## Technische Abnahme und verbleibende Praxisprüfung

Die Fachtests verwenden frische Speicherdatenbanken mit allen Migrationen. Der Browserlauf verwendet fiktive Konten und prüft Nullstart, Namen und Nummern, Anrufresultate, Terminablauf mit Empfehlungen, Einheiten später, Zielaktualisierung, Teilen, Absprachen, gespeicherten Schwerpunkt, Teamzielzugriff und Meetingfilter bei 320, 390, 430 und 1440 Pixeln. Die vorhandene Onboardingabnahme bleibt ein eigener Browserlauf.

Gemessener Stand am 09.09.2026:

| Prüfung | Ergebnis |
| --- | --- |
| Fach- und Datenbanktests | 61 von 61 bestanden |
| TypeScript | Bestanden |
| ESLint | Keine Fehler; eine bereits bestehende Warnung in `scripts/_audit/probe.mjs` |
| Isolierter Produktionsbuild | Bestanden, einschließlich aller neuen Seiten |
| Start-Browserabnahme gegen Produktionsbuild | Bestanden, einschließlich Pause, Wiederaufnahme und Speicherfehler mit erneutem Versuch |
| Vollständige Browserabnahme im Entwicklungsbetrieb | Bestanden: alle drei Geschäftssituationen, Nullstart, Geschäftsablauf, Einheiten- und Zielstände, Anerkennung, Absprachen, Teamziele, Datenschutz und Meetingfilter |
| Vollständige Produktions-Browserabnahme | Offen: intermittierend bleibt die Oberfläche nach erfolgreicher Serverantwort im alten beziehungsweise ausstehenden Zustand |

Der offene Produktionsbefund tritt an wechselnden Abspracheaktionen und einem Meeting-Seitenwechsel auf. Im aufgezeichneten Absprachefall kamen sowohl Action-POST (200, etwa 64 ms) als auch anschließender Seitenabruf (200, etwa 13 ms) zurück; die Oberfläche aktualisierte sich innerhalb von 30 Sekunden nicht. Die isolierte Datenbank hatte keine wartenden Abfragen oder offene Transaktion. Getrennte Browsersitzungen je Testkonto beseitigten den Fehler nicht. Ein [vergleichbarer Next/React-Bericht](https://github.com/vercel/next.js/issues/96233) beschreibt denselben beobachteten Zustand, belegt aber noch nicht die Ursache in diesem Projekt. Das ist eine offene Freigabeprüfung; der Test wird nicht durch automatische Wiederholung der Schreibaktion oder einen erzwungenen Reload grün gemacht. Optional zeichnet `CRM_TEST_TRACE=1` Browser-Traces auf; `CRM_TEST_DB_DEBUG=1` ergänzt Datenbankdiagnostik.

Prüfbefehle:

```text
npm test
npm run lint
npm run build:start:check
CRM_TEST_PRODUCTION=0 npm run test:browser
CRM_TEST_PRODUCTION=1 npm run test:browser
CRM_TEST_PRODUCTION=1 npm run test:start:browser
```

Die Schreibweise der Umgebungsvariable ist shellabhängig; in PowerShell wird sie vor dem Browserbefehl über `$env:CRM_TEST_PRODUCTION = '1'` gesetzt. `build:start:check` baut gegen eine isolierte Testdatenbank. `npm run build` führt Migrationen aus und wird für diese Abnahme nicht verwendet.

Produktive Migration und Deployment sind nicht Bestandteil dieser lokalen Umsetzung. Noch ausstehend sind eine Bedienprüfung mit mindestens einer echten Person aus jeder Situation sowie native Anrufrückkehr, reale Bildschirmtastatur und tatsächliche Erinnerungszustellung auf dem Handy. Emulierte Viewports und ausgelöste Sichtbarkeitsereignisse belegen diese Geräteeigenschaften nicht.
