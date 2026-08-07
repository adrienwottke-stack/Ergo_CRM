# Ergo CRM

Kleine CRM-Web-App zum Tracken von Ergo-Netzwerk-Kontakten: Kontakte anlegen,
Status pflegen (Neu → Kontaktiert → Termin → Abgeschlossen/Abgelehnt) und
Aktivitäten (Anruf, Meeting, E-Mail) protokollieren. Kein Vertragsabschluss-Tool.

**Stack:** Next.js 15 (App Router, Server Components/Actions), TypeScript,
Tailwind CSS 4, Prisma 7 (pg-Adapter), Postgres via Supabase.

## Lokales Setup

```bash
npm install
```

`.env` anlegen (Vorlage: `.env.example`) und ausfüllen, dann Migration einspielen:

```bash
npx prisma migrate deploy
```

Dev-Server starten:

```bash
npm run dev
```

Login unter `http://localhost:3000` mit dem Passwort aus `APP_PASSWORD`.

## Environment-Variablen (auch in Vercel setzen)

| Variable       | Zweck                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Supabase **Transaction Pooler** (Port 6543, `?pgbouncer=true`) – wird von der App genutzt |
| `DIRECT_URL`   | Supabase **Session Pooler** (Port 5432) – nur für `prisma migrate`                        |
| `APP_PASSWORD` | Passwort für den Login der App                                                            |

Beide URLs stehen im Supabase-Dashboard unter **Connect → ORMs → Prisma**.

## Deployment (Vercel)

1. Repo pushen und in Vercel importieren.
2. Die drei Env-Variablen oben setzen (Production + Preview).
3. Deploy – `postinstall` führt `prisma generate` automatisch aus.

Migrationen laufen nicht automatisch beim Deploy; bei Schemaänderungen einmal
lokal `npx prisma migrate deploy` gegen die Supabase-DB ausführen.

## Seiten

- `/dashboard` – Kontakte je Status als Kacheln
- `/contacts` – Liste mit Status-Filter
- `/contacts/new` – Kontakt anlegen
- `/contacts/[id]` – Detailseite mit Aktivitäten-Log
- `/contacts/[id]/edit` – Kontakt bearbeiten
- `/login` – Passwortschutz (Single-User)
