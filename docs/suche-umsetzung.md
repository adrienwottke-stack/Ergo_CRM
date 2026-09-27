# Globale Suche

Die Suche unter `/suche` verbindet Kontakte, Funktionen, Termine, Teammitglieder,
persönliche Ziele und gemeinsame Absprachen. Sie verwendet die bestehenden
Gestaltungselemente. Der sichtbare Einstieg bleibt der Suchen-Link im Seitenkopf;
`SuchTastatur` ergänzt ausschließlich Strg/Cmd+K.

## Verhalten

- Funktionen erscheinen während des Tippens lokal. Nach 150 ms Eingabepause
  lädt die Suche passende gespeicherte Inhalte. Alte Anfragen werden abgebrochen;
  verspätete Antworten dürfen einen neueren Suchstand nicht ersetzen.
- Kontakte werden über Name, E-Mail, normalisierte Telefonnummer, Beruf,
  Herkunft, Notiz, nächsten Schritt und den Aktivitätsverlauf gefunden.
  Passende Notiz- oder Verlaufsausschnitte erklären den Treffer.
- Wortreihenfolge, Großschreibung, Umlaute und Akzente werden vereinheitlicht.
  Ab vier Buchstaben wird höchstens ein Tippfehler pro Wort toleriert.
  Wörter mit Ziffern und Telefonnummern erhalten keine Tippfehlertoleranz.
- Die Funktionen verwenden den erweiterten Wegweiser. Exakte Treffer und
  Wortanfänge stehen vor unscharfen Treffern; alle wesentlichen Suchwörter müssen
  passen. Funktionsschalter und Admin-Sichtbarkeit gelten auch in der Suche.
- `Termine morgen`, `Termine diese Woche`, `überfällige Rückrufe`,
  `Kontakte ohne Telefonnummer` und `Absprache mit Max` werden als Arbeitsanfragen
  erkannt. Die abgeleiteten Filter werden angezeigt und können zurückgesetzt
  werden. Zeiträume folgen Europe/Berlin, einschließlich Sommerzeitwechseln.
- Kalenderquellen: Kundentermine, eigene Einträge, aktive Fremdkalender und
  bestätigte gemeinsame Betreuungstermine. Eigene und fremde Kalendereinträge
  öffnen den passenden Tag und den Eintrag in der Agenda. Absprachen erhalten
  eine direkt erreichbare Detailseite mit den bestehenden Aktionen.
- 20 Ergebnisse pro Seite, weitere per Schaltfläche. Bewertung und Filterung
  erfolgen in PostgreSQL vor der Begrenzung. Mehrere passende Verlaufseinträge
  erzeugen keinen mehrfachen Kontakt in der Liste.
- Suchtext und Kategorie stehen in der URL und bleiben beim Zurückgehen erhalten.
  Der Verlauf enthält höchstens acht IDs im Sitzungsspeicher pro Nutzerkonto.
  Die aktuellen Rechte werden beim erneuten Laden jedes Treffers geprüft.
- Pfeiltasten wählen Ergebnisse; Enter öffnet; Escape führt aus der Ergebnisliste
  ins Feld und leert dort zunächst die Eingabe. Funktionen bleiben bei einem
  Fehler der Inhaltssuche verfügbar; erneutes Laden ist ausdrücklich möglich.

## Schnittstelle und Zugriffe

`GET /api/suche?q=…&typ=…&seite=…` liefert `treffer`, `mehr` und `filter`.
`typ` ist `alle`, `kontakte`, `funktionen`, `termine`, `team`, `ziele` oder
`absprachen`. Seiten beginnen bei null; die Eingabe ist auf 100 Zeichen begrenzt.
Ohne Suchtext können bis zu acht gespeicherte Treffer-IDs über `zuletzt`
als JSON-Liste erneut aufgelöst werden. Antworten sind privat und `no-store`.

Jeder Treffer enthält ID, Typ, Titel, Kontext, optional einen kurzen Fundhinweis,
Zieladresse und Relevanz. Vollständige Notizen und interne Kontofelder gelangen
nicht in die Antwort. Der Endpunkt verlangt ein angemeldetes, aktives Konto mit
abgeschlossenem Einstieg und geltender AVV-Zustimmung.

Kontakte, deren Verlauf, eigene Termine, Kalenderquellen und persönliche Ziele
bleiben auf den Inhaber beschränkt. Teammitglieder verwenden die bestehende
Struktursicht; nur Admins erhalten die bestehende Gesamtsicht auf Partner.
Absprachen bleiben den Beteiligten innerhalb ihrer aktuellen Führungskette
vorbehalten. Höhere Führung oder Admin-Status erweitern diesen Zugriff nicht.

Bei Auswahl eines Treffers wird nur die bestehende Wegweiser-Nutzung gezählt.
Suchbegriffe werden nicht in das allgemeine Suchbegriffslog geschrieben.
Neue Suchtabellen, Migrationen, npm-Abhängigkeiten oder externe Suchdienste
sind nicht erforderlich.

## Prüfung und Integration

- `npm run test:suche`: 25 Funktionsaufgaben sowie Normalisierung, Telefonnummern,
  SQL/JavaScript-Konsistenz, Ranking, Verlauf, Pagination, Zugriffsgrenzen,
  Funktionsschalter, Teamwechsel und Kalendergrenzen mit einer Wegwerfdatenbank.
- `npm run test:suche:browser`: Browserabnahme mit synthetischen Konten,
  einschließlich 320/390 px, Desktop, Rückweg, Verlauf, Detailnavigation,
  Tastatur, Fehlerwiederholung und verspäteter Antwort.
- `npm run typecheck`, gezieltes ESLint und `npm run build:check` prüfen die
  Integration. Keine produktive Datenbank ist für diese Prüfungen erforderlich.

Die parallele Redesign-Arbeit übernimmt den kleinen `SuchTastatur`-Anschluss in
AppShell und erhält den Link nach `/suche`. Die lokale Kontaktlistenfilterung
bleibt eigenständig. Neu entstehende Teamziele werden nach Abschluss ihres
Fachmodells ergänzt; sie sind nicht mit persönlichen Zielen gleichzusetzen.
Für neue Funktionen gehören Bezeichnung, Synonyme, Zielseite und gegebenenfalls
Funktionsschalter direkt in den Wegweiser. Neue Datenquellen müssen zuerst ihre
Zugriffsgrenzen bestimmen und anschließend in die gemeinsame Bewertung eingehen.

Die Browserprüfung ersetzt keine Abnahme der Bildschirmtastatur auf einem echten
iPhone oder Android-Gerät. Semantische KI-Suche und automatische Schreibaktionen
sind nicht Bestandteil dieser Umsetzung.
