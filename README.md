# Ergo CRM

Führungssystem für eine Schleife: Namen sammeln → anrufen → Termin machen →
Termin halten → Ergebnis und neue Namen → von vorn. Jedes Teammitglied hat ein
eigenes Konto und sieht ausschließlich die eigenen Kontakte. Die Rangliste ist
teamweit, enthält aber nur Namen und aggregierte Aktivitätszahlen.

Maßgeblich für alle Entscheidungen: `docs/audit-kernmodell.md`.

## Die Schleife

Fünf Stufen, mehr gibt es nicht:

    Name → kontaktiert → Termin vereinbart → Termin gehalten → Abschluss

Nach **jedem** gehaltenen Termin wird nach Empfehlungen gefragt — daraus
entstehen die nächsten Namen. Das ist der Motor; alles andere bedient ihn.

## Funktionen

- **Namen sammeln:** geführt über zehn Szenen-Fragen (`/namen/sammeln`), dazu
  Schnellerfassung, A/B/C-Nähe und Nachfüll-Alarm bei leerlaufender Liste
- **Durchlauf:** ein Name je Karte, `tel:`-Link, Ergebnis in zwei Tipps,
  Gesprächsleitfaden und Einwandbehandlung direkt daneben
- **Heute:** führt mit dem Tagespensum („7 Anrufe heute“), darunter überfällig,
  heute und diese Woche
- **Kalender:** kommende Termine als Tage, Übernahme in den Handy-Kalender per
  ICS samt Erinnerung
- **Trichter:** vier Zahlen (Anrufe → Termine → gehalten → Abschlüsse) und der
  schwächste Übergang als benannter Engpass
- **Mannschaft:** je Berater letzter und nächster Schritt, Starterpass des
  Neuen, Frühwarn-Signale mit Ampel
- **Wettbewerb:** Rangliste, Puls, Zweikampf, gemeinsamer Sprint,
  Kurznachrichten zwischen Partnern
- **Meldungen:** Web-Push für Tagespensum, Frühwarnung, Abschlüsse und
  Nachrichten (optional, siehe unten)

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
| `CRON_SECRET` | Schützt `/api/cron/meldungen`; der Lauf steht in `vercel.json` |

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
