# Review: Arbeitslagen und Onboarding

Review-Branch: `codex/review-arbeitslagen-onboarding`.

Die Arbeitslagen-Umsetzung und der vollständige Onboarding-Flow sind gemeinsam enthalten. Der reguläre Merge führt den Onboarding-Commit `422ef706445c66a2b1becedcdca5254be33d13aa` in die Review-Historie ein. Seine Inhalte waren zuvor gezielt in den Arbeitslagen-Stand übernommen worden.

Zusätzlich ist `main` bis `ad63a1a71772660f65325c59f9d2f971cf7f57ea` enthalten: die 61 seit der gemeinsamen Basis `07b9798` hinzugekommenen Commits sind regulär in diesen Review-Branch gemergt. Die beiden Quellhistorien bleiben nachvollziehbar.

## Zusammenführung

- Die fünf Hauptbereiche, drei Arbeitslagen und blickdichten Navy-Flächen bleiben maßgeblich. Neue semantische Farben aus `main` sind übernommen; Links erhalten ein eigenes lesbares Hellblau, Hauptknöpfe bleiben sattblau mit weißer Schrift. Der ältere Liquid-Glass-Entwurf ist damit für die App-Oberfläche abgelöst. Der Produktname aus `main` lautet Cockpit.
- Routing, Checkpoints, Sammlung, Nummern, Anrufvorbereitung und Storno-Flow bleiben erhalten. Die zusätzliche Karrierestufen-Szene speichert über den bestehenden Schreibweg; eine Bestandskonto-Vorschau schreibt nichts. Einladungsplatzhalter lösen keinen Aufbau- oder Führungsstart aus.
- Kontaktresultate bleiben atomar und wiederholbar. Kandidaturen sind im Recruiting-Profil erreichbar. Einheiten verbinden die präzise Mengenprüfung aus `main` mit zugeordneten Erinnerungen, Rücknahme und Zielrückmeldung.
- Strukturkurve, Matrix und Monatsvergleich liegen unter Team → Überblick. Teamabend und Berichts-Link sind von Team erreichbar; Datenexport und Rückmeldungen liegen im Profil. Die aggregierte Teammeeting-Ansicht behält ihren gewählten Zeitraum und Umfang.
- Team- und Einheitenansichten schließen Platzhalter und deaktivierte Konten aus. Aktive Nachfahren unter solchen Zwischenknoten zählen weiter zum nächsten enthaltenen Vorfahren. Startbestände, Korrekturen und doppelt übergebene IDs sind durch eine Datenbankregression abgedeckt.
- ADR-0004 gilt auch für den historischen Geschwistervergleich: benannte Parallelstrukturen bleiben Admins vorbehalten. Führungshinweise beachten die gespeicherten Ampelkriterien und aktuelle, initialisierte Strukturpfade.

## Prüfung

Prüfstand am 09.09.2026: **51 automatisierte Tests grün**, TypeScript und isolierter Produktionsbuild erfolgreich. ESLint meldet keine Fehler und eine vorbestehende Warnung im lokalen Audit-Skript. Beide Browserdurchläufe sind bestanden; der Arbeitslagenlauf verwendet den Produktionsbuild und enthält 17 Screenshots für 320/390/430/1440 px. Der vollständige Kontakt- und Einheitenablauf, Ziele, bestätigte Partnerabsprachen mit Verlauf, Suchberechtigungen, Team-Auswertung, Teammeeting und die ergänzten Team-/Profil-Einstiege sind geprüft. Keine Clientfehler im Arbeitslagenlauf.

Eine zusätzliche echte Cron-Routenprüfung fängt Pushes ausschließlich lokal ab und prüft Zugriff, Berliner Tagesgrenzen sowie die Bündelung von Termin, Führung und Einheiten. Details und verbleibende Geräte-/Nutzerabnahme stehen in [Umsetzung](arbeitslagen-umsetzung.md) und [Onboarding](onboarding-implementierung.md).

Die Migrationen aus allen drei Entwicklungsständen werden zusammen in einer neuen Speicherdatenbank angewendet. Der Review-Push verändert `main` nicht und führt selbst keine produktive Datenbankmigration aus.
