# Personen direkt aus der Struktur verwalten

Die Kästen im Organigramm öffnen `/mannschaft/[id]`. Dort stehen Bearbeiten,
Austragen/Zurückholen und endgültiges Löschen direkt unter dem Namen. Der
Leistungsverlauf verwendet das bestehende `VerlaufsChart` mit denselben Farben,
Zeiträumen und Gesten wie die Teamansicht. Einheiten, Anrufe und vereinbarte
Termine sind umschaltbar; bei Führungskräften sind Eigenleistung und Team ohne
Eigenleistung getrennt. Kundennamen und aktuelle Vorgänge folgen weiterhin den
bestehenden Einblick-Regeln.

`/mannschaft/verwalten` ist die gemeinsame, auf den eigenen Ast begrenzte
Personenauswahl mit Aktiv-/Ausgetragen-Filter. Sie ist von Team und Profil aus
erreichbar, auch wenn alle eigenen Partner ausgetragen wurden. `/team` bleibt
der Einstieg für zusätzliche Admin-Funktionen. Beide Verwaltungswege benutzen
dieselben Schreiboperationen in `lib/struktur-verwaltung.ts`.

## Berechtigungen und Verhalten

- Die aktuelle Rolle und Struktur werden serverseitig aus der Datenbank geladen.
  Führungskräfte verwalten Nachfahren auf jeder Ebene, einschließlich Platzhaltern
  und ausgetragenen Personen. Eigene Konten, Vorfahren, parallele Äste und
  Admin-Konten sind für sie ausgeschlossen. Admins behalten die Instanzverwaltung.
- Bearbeitbar: Name, Telefonnummer, Karrierestufe, Eintrittsdatum, Führungskraft.
  Name und Ranglistenprofil werden gemeinsam geändert. Optionale Angaben können
  entfernt werden. Eintrittsdatum und Karrierestufe wirken auf die bestehenden
  Startfenster, Vergleichsgruppen und Auswertungen.
- Teamleiter können Personen innerhalb ihres eigenen Astes verschieben; eine
  neue Wurzel oder Zuordnung unter den eigenen Nachfahren ist nicht zulässig.
  Der bisherige Admin-Sonderfall zum Hochrücken eines Nachfahren bleibt erhalten.
- Austragen sperrt auch bestehende Sitzungen und erneutes Anmelden. Push-Abos
  werden entfernt, offene Passwort-Links und Einladungen entwertet. Zurückholen
  aktiviert das Konto wieder, ohne alte Einladungen erneut gültig zu machen.
- Endgültiges Löschen benötigt die Bestätigung des aktuellen Namens. Direkte
  Nachfahren ziehen samt ihrem Ast zur bisherigen Führungskraft des gelöschten
  Kontos. Kontakte, Ranglistenprofil und die abhängigen Kontodaten werden entfernt.
- Strukturänderungen werden in einer Datenbanktransaktion unter einer
  Schreibsperre der User-Tabelle ausgeführt. Die Sperre wird vor der Prüfung
  erworben; auch der bestehende Admin-Weg zum Umhängen nutzt sie. Damit laufen
  gleichzeitige Verwaltungsänderungen nacheinander, und Fehler rollen den ganzen
  Vorgang einschließlich aller Pfade zurück.

Keine neue Rolle, keine zusätzlichen Datenfelder und keine Migration.

## Navigation im Produktionsbuild

Die Browserprüfung reproduzierte zwei unterschiedliche Probleme: Das
Organigramm fing den Zeiger bereits beim Drücken auf dem Rahmen ein und
verschluckte dadurch Link-Klicks. Es fängt ihn jetzt erst nach Überschreiten
der Ziehschwelle ein; Tastatur und Touch öffnen die Person, Ziehen verschiebt
weiter den Baum.

Zusätzlich blieb die clientseitige RSC-Navigation im lokalen Produktionsbuild
bei erfolgreicher HTTP-Antwort hängen. Personenlinks verwenden deshalb
`PersonLink` als normale Dokumentnavigation. Nach bestätigtem Speichern lädt
die Personenverwaltung die aktuelle Akte ebenfalls als Dokument. Die Mutation
wird dabei genau einmal ausgeführt. Der bestehende Server-Action-Schutz bleibt
erhalten; kein Timer und kein automatisches Wiederholen von Schreibvorgängen.
Diese Anpassung ist auf den Personen-/Verwaltungsablauf begrenzt.

## Prüfung

`npm run test:struktur` prüft die öffentlichen Verwaltungs- und Verlaufsfunktionen
gegen die isolierte Testdatenbank einschließlich Rücknahme bei Datenbankfehlern.
`npm run test:struktur:browser` prüft den gesamten Weg vom Organigramm bis zum
Bearbeiten/Löschen, die Kurven, die Sitzungssperre sowie die Handyansicht.
Mit `CRM_TEST_PRODUCTION=1` läuft derselbe Browserablauf gegen einen zuvor mit
`npm run build:check` erzeugten Produktionsbuild. Alle Testkonten sind synthetisch.

Stand 14.09.2026: 72 automatische Tests bestanden, darunter 11 neue Prüfungen
für Strukturverwaltung und Personenverlauf. Produktionsbuild, Typprüfung und
Lint-Prüfung der betroffenen Dateien bestanden. Der vollständige Browserablauf
bestand im Entwicklungsmodus und zweimal im Produktionsmodus nach der
Navigationskorrektur: Ziehen, Tastatur, Touch, Kurvenwechsel, Bearbeiten,
Austragen, Sitzungssperre, Zurückholen, bestätigtes Löschen und Erhalt des Teams.
Geprüft wurden 320 und 390 Pixel breite Handyansichten, Desktop sowie heller
und dunkler Modus. Bildschirmaufnahmen liegen unter
`test-results/struktur-production/`. Keine Live-Veröffentlichung und keine
Abnahme auf einem physischen Handy durchgeführt.
