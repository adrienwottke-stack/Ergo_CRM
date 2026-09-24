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
- **AI CRM Add-on:** eigene Kontakte per Text oder Push-to-Talk suchen und
  pflegen, Gespräche dokumentieren, Notizen und Follow-ups anlegen sowie Heute-
  und Pipeline-Fragen beantworten. Jede schreibende AI-Aktion wird protokolliert;
  einfache Änderungen lassen sich über das vorhandene Rückgängig-System
  zurücknehmen. Freischaltung erfolgt zentral per Beta-Schalter oder Stripe-Abo.
  Eine bewusst gestartete „Jarvis Live“-Runde ist lokal als klar markierte
  Simulation testbar; sie speichert weder Audio noch unvollständige Transkripte
  und startet ohne explizite Freigabe keinen echten OpenAI- oder Spotify-Provider.
  Die integrierte Führungserweiterung ergänzt private 1:1-Notizen, belegte
  Vorbereitung, Tages-/Führungsrunden, bearbeitbare Vorschläge sowie GPT-Live
  und einen lokalen Musikplayer. Jede fachliche Änderung benötigt einen
  sichtbaren Bestätigungsklick. Konfiguration, additive Migration, sichere
  Prüfpfade und noch offene Live-Nachweise: [Jarvis-Pilot](docs/jarvis-pilot.md).

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
| `AI_CRM_ENABLED` | Globaler Not-Aus; für die Nutzung auf `true` setzen |
| `OPENAI_API_KEY` | Serverseitiger Schlüssel für Responses API und Transkription |
| `AI_MODEL` | Austauschbares Text-/Tool-Modell, Standard `gpt-4o-mini` |
| `AI_TRANSCRIPTION_MODEL` | Austauschbares Speech-to-Text-Modell, Standard `gpt-4o-mini-transcribe` |
| `AI_CRM_PRICE_CENTS` | Produktpreis in Cent; Standard `1500` |
| `STRIPE_SECRET_KEY` | Serverseitiger Stripe-Schlüssel |
| `STRIPE_AI_PRICE_ID` | Monatlicher Stripe Price für das AI-Add-on |
| `STRIPE_WEBHOOK_SECRET` | Signaturprüfung für `/api/webhooks/stripe` |
| `APP_URL` | Kanonische App-URL für Checkout und Customer Portal |
| `AI_MAX_MONTHLY_REQUESTS` | Fair-Use: Provider-Aufrufe je Nutzer/Monat |
| `AI_MAX_MONTHLY_AUDIO_SECONDS` | Fair-Use: Sprachsekunden je Nutzer/Monat |
| `AI_MAX_MONTHLY_TOOL_CALLS` | Fair-Use: CRM-Tool-Aufrufe je Nutzer/Monat |
| `AI_MAX_AUDIO_BYTES` / `AI_MAX_AUDIO_SECONDS` | Uploadgrenzen; Standard 5 MiB / 60 Sekunden |
| `AI_CONVERSATION_RETENTION_DAYS` | Feste Aufbewahrung ab Gesprächsbeginn; Standard 7 Tage |
| `AI_CONVERSATION_MAX_MESSAGES` | Nachrichten je Unterhaltung; Standard 20 |
| `AI_PROVIDER_TIMEOUT_MS` / `AI_PROVIDER_MAX_RETRIES` | OpenAI-Timeout und begrenzte SDK-Retries |
| `AI_LIVE_PROVIDER` | Live-Modus: `disabled`, lokale `mock`-Simulation oder `live` für GPT-Live; in Production wird `mock` sicher deaktiviert |
| `AI_LIVE_MODEL` | serverseitige GPT-Live-Modellwahl; Standard `gpt-live-1` |
| `AI_LIVE_MAX_SESSION_SECONDS` / `AI_LIVE_RECONNECT_LIMIT` | serverseitige Sessionschranke und begrenzte Wiederherstellung |
| `AI_LIVE_REALTIME_APPROVED` / `AI_LIVE_SIDEBAND_URL` | nur für den alten, weiterhin gesperrten Realtime-Adapter; GPT-Live braucht diese Variablen nicht |
| `SPOTIFY_LOCAL_ENABLED` | ausschließlich lokalen Spotify-Smoke aktivieren; in Vercel immer weglassen oder `false` setzen |
| `SPOTIFY_ENABLED` | nur in der Vercel-**Production** nach vollständiger Einrichtung `true`; Preview bleibt immer aus |
| `SPOTIFY_APP_URL` | kanonische HTTPS-Origin der Production, derzeit `https://ergo-crm.vercel.app` |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | serverseitige Credentials der Spotify-Developer-App, nie `NEXT_PUBLIC_` |
| `SPOTIFY_REDIRECT_URI` | exakt registrierte Callback-URI; lokal z. B. `http://127.0.0.1:3132/api/ai-crm/music/spotify/callback`, Production `https://ergo-crm.vercel.app/api/ai-crm/music/spotify/callback` |
| `SPOTIFY_TOKEN_SECRET` | separater AES-256-GCM-Schlüssel für nutzerbezogene Spotify-Refresh-Tokens, mindestens 32 Zeichen |
| `STRIPE_PROVIDER_TIMEOUT_MS` / `STRIPE_PROVIDER_MAX_RETRIES` | Stripe-Timeout und begrenzte Netzwerk-Retries |

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

## AI CRM lokal einrichten

1. Die beiden AI-CRM-Migrationen ausschließlich auf einer ausdrücklich benannten
   lokalen/Test-Datenbank ausrollen und `OPENAI_API_KEY` setzen.
2. `AI_CRM_ENABLED=true` setzen.
3. Als Admin unter `/werkstatt/ai` für ein Testkonto „Beta an“ wählen. Dafür
   wird kein Stripe-Abo benötigt.
4. `npm run dev` starten, als dieses Konto anmelden und auf `/heute` Text oder
   „Halten und sprechen“ verwenden. Der Browser braucht Mikrofonzugriff;
   `localhost` gilt als sicherer Kontext.

Für die lokale, deterministische Live-Demo kann in einer ausschließlich lokalen
`.env` zusätzlich `AI_LIVE_PROVIDER=mock` gesetzt werden. „Live sprechen ·
lokale Demo“ fragt das Mikrofon erst nach einem Klick an. Es gibt keinen echten
Realtime-Audio-Stream, keine gespeicherte Audiodatei und keine Spotify-
Wiedergabe. `AI_LIVE_PROVIDER=realtime` ist bewusst nicht implementiert und
scheitert ohne ausdrückliche Freigabe und serverseitige Sideband-Verbindung.

### Spotify lokal mit dem eigenen Konto testen

Spotify bleibt von der Live-Sprachsimulation getrennt: Die Sprachrunde ist
weiterhin lokal simuliert, aber ein bewusst verbundenes Spotify-Konto kann
innerhalb dieser Runde einen realen Start-/Pause-Befehl erhalten. Der lokale
Testpfad führt weder eine Migration gegen `.env` noch einen Preview- oder
Production-Zugriff aus. Der Adapter wird zusätzlich nur freigeschaltet, wenn
`DATABASE_URL` auf `127.0.0.1` oder `[::1]` zeigt. Dadurch kann ein normaler
lokaler Dev-Start mit einer versehentlich entfernten `.env`-Datenbank keine
Spotify-Tokens dort ablegen.

1. Im [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   eine Web-API-App anlegen. Im Entwicklungsmode braucht das Eigentümerkonto
   Spotify Premium; weitere Testkonten müssen auf der Allowlist stehen.
2. In der App exakt eine Loopback-Redirect-URI registrieren, etwa
   `http://127.0.0.1:3132/api/ai-crm/music/spotify/callback`. Spotify erlaubt
   dafür `127.0.0.1`, nicht `localhost`; Port und Pfad müssen später bytegenau
   mit `SPOTIFY_REDIRECT_URI` übereinstimmen.
3. Ausschließlich in der nicht versionierten lokalen `.env.local` setzen:
   `SPOTIFY_LOCAL_ENABLED=true`, Client-ID, Client-Secret, die Redirect-URI und
   einen eigenen mindestens 32 Zeichen langen `SPOTIFY_TOKEN_SECRET`. Den
   Token-Schlüssel beispielsweise mit `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   erzeugen. Keine Werte in `.env.example`, Git, Screenshots oder Chat kopieren.
4. `npm run smoke:spotify:local` starten. Der Runner verwendet eine frische
   In-Memory-PGlite-Datenbank und eine sichtbar bereits angemeldete Testperson;
   er überschreibt für seinen Prozess die in `.env` vorhandene Datenbank-URL,
   bevor Spotify überhaupt aktiviert werden kann. Im geöffneten Fenster
   Assistent → Live sprechen → **Mit Spotify verbinden** wählen und die
   Spotify-Zustimmung selbst abschließen.
5. Spotify auf dem gewünschten Gerät öffnen und dort ein steuerbares aktives
   Gerät haben. Dann im Live-Modus „Hey Jarvis, spiel AC/DC.“ und anschließend
   „Pause.“ senden. Ein erfolgreicher 204-Befehl wird als echte Wiedergabe
   markiert; ohne Gerät, Premium oder Berechtigung zeigt die Oberfläche die
   tatsächliche Ursache statt eine Wiedergabe vorzutäuschen.

Beim Beenden des Smoke-Runners werden Datenbank und darin gespeicherte lokale
OAuth-Verbindung verworfen. Der Runner startet keinen Spotify-Request, bis der
Nutzer im sichtbaren Browser explizit auf **Mit Spotify verbinden** klickt.

### Spotify mit Vercel Production verbinden

Die gehostete Verbindung verwendet denselben serverseitigen Authorization-Code-
Flow, ist aber absichtlich noch strenger: Sie wird nur aktiv, wenn Vercel die
Funktion als Production ausführt (`VERCEL=1`, `VERCEL_ENV=production`),
`SPOTIFY_ENABLED=true` gesetzt ist und die registrierte HTTPS-Callback-URI
origin-genau zu `SPOTIFY_APP_URL` passt. Eine Preview-URL wird nie als
Spotify-Redirect verwendet.

1. Im [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   die exakte Production-Callback-URI registrieren:
   `https://ergo-crm.vercel.app/api/ai-crm/music/spotify/callback`.
2. Ausschließlich für Vercel **Production** setzen: `SPOTIFY_APP_URL=https://ergo-crm.vercel.app`,
   `SPOTIFY_REDIRECT_URI=https://ergo-crm.vercel.app/api/ai-crm/music/spotify/callback`,
   Client-ID, Client-Secret und einen eigenen mindestens 32 Zeichen langen
   `SPOTIFY_TOKEN_SECRET`. Diese Werte gehören weder in Git noch in Preview.
3. Erst wenn alle Werte vorhanden sind, in Production `SPOTIFY_ENABLED=true`
   setzen und einen neuen Production-Deploy auslösen. Fehlt etwas oder stimmen
   Origins/Umgebung nicht, bleibt die Route sicher deaktiviert.
4. Mit dem berechtigten CRM-Konto **Mit Spotify verbinden** wählen und die
   Zustimmung in Spotify selbst abschließen. Das API-Endpunktpaar bleibt an
   Anmeldung, AI-Entitlement, Same-Origin und das eigene CRM-Konto gebunden.

Die aktuelle Production-Basis enthält noch keinen echten OpenAI-Realtime-
Transport. Eine gespeicherte Spotify-Verbindung bereitet die spätere
Wiedergabesteuerung vor, ersetzt aber weder die separate Live-Voice-Freigabe
noch Spotify Premium und ein steuerbares aktives Gerät.

Für ein bezahltes Abo in Stripe ein Produkt mit einem aktiven monatlichen
EUR-Price über `AI_CRM_PRICE_CENTS` (Standard 15,00 EUR) anlegen. Dessen ID als
`STRIPE_AI_PRICE_ID` setzen und den Webhook auf
`/api/webhooks/stripe` konfigurieren. Mindestens diese Events abonnieren:
`checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated` und `customer.subscription.deleted`.

Die vollständige Architektur, Datenschutzgrenzen und V1.1-Härtung stehen in
[docs/ai-crm-v1.md](docs/ai-crm-v1.md). Die Trennung zwischen siebentägigem
Kurzzeitkontext und einem späteren Wissenspaket ist in
[ADR 0005](docs/adr/0005-kurzzeit-unterhaltungen-getrennt-vom-wissensgedaechtnis.md)
festgehalten. Die Live-Session-/Tool-Grenze und die Ein-Session-pro-Nutzer-
Entscheidung stehen in
[ADR 0006](docs/adr/0006-live-voice-servergrenze-und-eine-aktive-session.md).

Wichtig: `npm run build` führt in diesem Repository Migrationen aus. Vor Preview
oder Production müssen `DATABASE_URL` und `DIRECT_URL` auf gemeinsame Nutzung
geprüft und das konkrete Datenbankziel ausdrücklich freigegeben werden. Für die
lokale migrationsfreie Prüfung dient `npm run build:check`.

## Zugriffsmodell

- **Mitglied:** eigene Namensliste und Kontakte, Team-Log und Rangliste
- **Führungskraft:** wer Berater unter sich hat, sieht deren Zahlen unter
  `/mannschaft` – eine Position im Strukturbaum, keine Rolle
- **Admin:** zusätzlich Teamverwaltung

Die früheren globalen Zugänge `TEAM_PASSWORD`, `REPORT_PASSWORD` und das
gemeinsame CRM-Passwort werden nicht mehr verwendet.
