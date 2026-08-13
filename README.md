# Ergo CRM

Persönliches Kontakt-CRM für ein Ergo-Team: Jedes Teammitglied hat ein eigenes
Konto und sieht ausschließlich die eigenen Kontakte. Die Rangliste ist
teamweit, enthält aber nur Namen und aggregierte Aktivitätszahlen.

## Funktionen

- Private Kontakte mit Status, Wiedervorlagen und Aktivitäten
- Admin-verwaltete persönliche Benutzerkonten
- Automatische Rangliste: neuer Kontakt = Nummer gezogen, Anruf-Aktivität =
  Anruf, erster Statuswechsel auf `Termin` = Termin vereinbart
- Manuelles Nachloggen für Aktivitäten außerhalb eines CRM-Kontakts
- Aggregierter Bericht für Admins bzw. den separaten Berichtszugang – ohne
  Kunden-, Kontakt- oder Notizdaten

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

Danach legt der Admin unter `/team` die Konten für alle weiteren Mitglieder an.
Ein neues Konto verknüpft automatisch ein Ranglistenprofil mit dem gewählten
Namen.

## Vercel-Deployment

In Vercel für **Production** setzen:

| Variable | Zweck |
| --- | --- |
| `DATABASE_URL` | Supabase Transaction Pooler (Port 6543, inklusive `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Session Pooler (Port 5432) für Migrationen |
| `APP_PASSWORD` | Einmaliges Bootstrap-Passwort für das erste Admin-Konto |
| `SESSION_SECRET` | Langes zufälliges Geheimnis für signierte Sitzungen |
| `REPORT_PASSWORD` | Optionaler, separater Nur-Lese-Zugang zum Bericht |

Wichtig: Bei einem bestehenden Vercel-Deployment zuerst `npx prisma migrate deploy`
gegen dieselbe Produktionsdatenbank ausführen und erst danach den Code deployen.
Ohne Migration gibt es die Tabellen für die Benutzerkonten noch nicht.

## Zugriffsmodell

- **Mitglied:** eigenes Dashboard und eigene Kontakte, Team-Log und Rangliste
- **Admin:** zusätzlich Teamverwaltung und Gesamtbericht
- **Berichts-Passwort:** ausschließlich den aggregierten Bericht

Die früheren globalen Zugänge `TEAM_PASSWORD` und das gemeinsame CRM-Passwort
werden nicht mehr für den täglichen Zugang verwendet.
