# Cockpit

Cockpit begleitet drei Geschäftssituationen: das eigene Geschäft, den Aufbau
mit dem ersten eigenen Partner und die Führung direkter Partner mit ihren Teams.
Der gemeinsame Geschäftsablauf führt von Namen und Telefonnummer über den Anruf
zum Termin, zum Ergebnis und gegebenenfalls zu Einheiten. Neue Empfehlungen
starten die nächste Runde. Ein gehaltener Termin zählt auch ohne Abschluss.

Die fünf Hauptbereiche bleiben fest: **Heute, Kontakte, Kalender, Fortschritt,
Team**. Die Startseite beginnt mit einer konkreten Handlung und einem kurzen
Zielstand. Ziele, Wettbewerb, Zuspruch und Einstieg gehören zum Kern der
Begleitung. Für Führungskräfte gehören Teamauswertung und Partnerentwicklung
zum Kerngeschäft.

Der aktuelle Produktmaßstab und die Umsetzung stehen in
[Geschäftssituationen](docs/geschaeftssituationen-umsetzung.md) und
[Arbeitslagen](docs/arbeitslagen-umsetzung.md). Das ältere
[Audit des Kernmodells](docs/audit-kernmodell.md) bleibt eine historische
Bestandsaufnahme.

## Funktionen

- **Kontakte:** Namen aufnehmen, Nummern ergänzen, Gesprächshilfe beim ersten
  Anruf; Termin, nicht erreicht, später und kein Interesse direkt im Durchlauf.
- **Heute:** nächste Handlung, persönlicher oder gemeinsamer Zielstand und
  höchstens drei Aufgaben beziehungsweise Partner pro Vorschau. Der Schwerpunkt
  wird im Profil gespeichert. Automatisch entscheidet der erste aktive direkte
  Partner zwischen eigenem Geschäft und Aufbau; Teamführung wird bewusst gewählt.
- **Kalender:** eigene und bestätigte gemeinsame Termine, Terminergebnisse und
  Übergabe in den Handy-Kalender.
- **Fortschritt:** persönliche Ziele und Wünsche, Einheiten, Entwicklung,
  Wettbewerb und Mein Warum. Jede Einheitenbuchung bestätigt gespeicherten Betrag,
  Monats- und Gesamtstand sowie den persönlichen Zielbalken.
- **Begleitung:** die erste Geschäftsablaufrunde bleibt ohne Ablauf nach sieben
  Tagen sichtbar und freiwillig einklappbar. Erste Einheiten und erreichte Ziele
  können bewusst geteilt werden; persönliche Nachrichten werden nie automatisch gesendet.
- **Team:** Begleiten, Auswertung, Struktur. Je Partner letzter Stand, eigene
  gemeinsame Absprache, nächster Schritt, erlaubter Zielstand und Unterstützung.
  Eigenleistung und Teilteamleistung bleiben getrennt.
- **Teamziele:** Wochen- oder Monatsziele für Anrufe, vereinbarte und gehaltene
  Termine sowie Einheiten. Sie zählen aktive Nachfahren ohne die Eigenleistung
  der Teamleitung. Mitglieder sehen den gemeinsamen Gesamtstand.
- **Auswertung:** gemeinsamer Zeitraum und Teamumfang für Aktivitäten,
  Einheitenkurve, Trichter und Teammeeting. Periodensummen sind keine
  nachgewiesenen Abschlusswahrscheinlichkeiten.
- **Netzwerkabend:** gemeinsamer Wettbewerb und geteilte Erfolge der gesamten
  Instanz, zusätzlich zur Auswertung des eigenen Teams.
- **Erinnerungen:** fällige eigene Arbeit, gemeinsame Absprachen, offene Einheiten
  und belegte Führungsfälle. Im Führungsfokus löst eine leere eigene Kontaktliste
  keinen allgemeinen Inaktivitäts- oder Nachfüllhinweis aus.

## Stack

Next.js 15 (App Router, Server Components/Actions), TypeScript, Tailwind CSS,
Prisma 7 und PostgreSQL via Supabase.

## Ersteinrichtung und Migration

1. `npm install`
2. `.env` aus `.env.example` erstellen und die Werte setzen.
3. Migration gegen die Ziel-Datenbank ausführen:

   ```bash
   npx prisma migrate deploy
   ```

4. App lokal starten:

   ```bash
   npm run dev
   ```

Beim ersten Aufruf von `/login` wird einmalig das Admin-Konto angelegt. Dafür
Name und E-Mail-Adresse eingeben und als Passwort das bisherige `APP_PASSWORD`
verwenden. Alle bisher vorhandenen Kontakte werden dabei diesem Admin-Konto
zugeordnet. Danach ist das Admin-Passwort das persönliche Passwort dieses
Kontos.

Danach lädt der Admin unter `/team` oder jeder Partner unter `/einladen` weitere
Mitglieder per Link oder QR-Code ein. Wer den Link einlöst, setzt Name und
Passwort selbst und hängt automatisch unter dem Einladenden.

## Vercel-Deployment

In Vercel für **Production** setzen:

| Variable | Zweck |
| --- | --- |
| `DATABASE_URL` | Supabase Transaction Pooler (Port 6543, inklusive `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Session Pooler (Port 5432) für Migrationen |
| `APP_PASSWORD` | Einmaliges Bootstrap-Passwort für das erste Admin-Konto |
| `SESSION_SECRET` | Langes zufälliges Geheimnis für signierte Sitzungen |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Öffentlicher Web-Push-Schlüssel (optional) |
| `VAPID_PRIVATE_KEY` | Privater Web-Push-Schlüssel (optional) |
| `VAPID_SUBJECT` | `mailto:`-Adresse für den Push-Dienst (optional) |
| `CRON_SECRET` | Schützt `/api/cron/meldungen` und `/api/cron/kalender`; die Läufe stehen in `vercel.json` |
| `KALENDER_SECRET` | Verschlüsselt die Zugangsdaten angebundener Kalender (optional) |

`KALENDER_SECRET` verschlüsselt **umkehrbar** (AES-256-GCM), anders als
`SESSION_SECRET`: TimeTree hat seine offizielle Schnittstelle am 22.12.2023
abgeschaltet, und die verbliebene Anmeldung verlangt das Passwort im Klartext.
Wer Datenbank *und* diesen Schlüssel hat, hat die TimeTree-Passwörter. Ein
Wechsel des Schlüssels macht alle gespeicherten Zugänge unlesbar. Ohne den Wert
läuft die App vollständig — nur das Anbinden fremder Kalender ist gesperrt.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Ohne die VAPID-Werte läuft die App vollständig — nur ohne Meldungen. Ein
Schlüsselpaar erzeugt:

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Wichtig: Bei einem bestehenden Vercel-Deployment zuerst `npx prisma migrate deploy`
gegen dieselbe Produktionsdatenbank ausführen und erst danach den Code deployen.
Ohne Migration gibt es die Tabellen für die Benutzerkonten noch nicht.

## Zugriffsmodell

- **Mitglied:** eigene Namensliste und Kontakte, Team-Log und Rangliste
- **Führungskraft:** wer Berater unter sich hat, sieht deren Zahlen unter
  `/mannschaft` – eine Position im Strukturbaum, keine Rolle
- **Admin:** zusätzlich Teamverwaltung

Die früheren globalen Zugänge `TEAM_PASSWORD`, `REPORT_PASSWORD` und das
gemeinsame CRM-Passwort werden nicht mehr verwendet.
