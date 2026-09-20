# AI CRM Add-on – V1.2

## Produktgrenze

Das Add-on erweitert das bestehende Cockpit. Es ersetzt weder Kontakte noch
Pipeline, Kalender oder die Heute-Liste. Der einzige Schreibweg bleibt:

`Text/Voice → OpenAI Function Call → validiertes CRM-Tool → vorhandene Prisma-Entität → Aktionsbeleg`

Es gibt keine freie SQL- oder Datenbankausführung, kein RAG, keine
Vektordatenbank, keine Daueraufnahme außerhalb einer bewusst gestarteten
Live-Session und keine destruktiven AI-Tools.

## Reale CRM-Zuordnung

- Kontakt/Lead: `Contact`
- Pipeline: `Contact.stage` und `Contact.outcome`
- Gespräch/Aktivität: `Activity`
- Wiedervorlage: `ContactFollowUp`; die früheste offene Zeile wird als
  „Nächster Schritt“ auf `Contact.nextStep*` gespiegelt
- Notiz: additiv in `Contact.note`
- Rückgängig: vorhandenes `UndoEntry`-Format und `lib/undo.ts`
- Feature-Schalter: `Feature` mit Schlüssel `aiCrm`, zusätzlich globaler
  Not-Aus `AI_CRM_ENABLED`

V1 arbeitet absichtlich nur mit `Contact.ownerId = aktuell eingeloggter User`.
Führungskräfte erhalten über den AI-Agenten keinen zusätzlichen Einblick in
Kontaktnamen, Notizen oder Telefonnummern anderer Berater.

## Module und Routen

- `lib/ai-crm/config.ts`: Modelle, Preis, Limits und optionale Kostensätze
- `lib/ai-crm/entitlement.ts`: zentrale Beta-/Abo-/Limit-Prüfung
- `lib/ai-crm/tools.ts`: Zod-validierte, owner-scoped CRM-Tools
- `lib/ai-crm/agent.ts`: Responses-API-Loop mit maximalen Tool-Runden
- `lib/ai-crm/prompt.ts`: serverseitiger Systemprompt
- `lib/ai-crm/billing.ts`: Stripe-Preisprüfung und Subscription-Synchronisation
- `lib/ai-crm/conversations.ts`: owner-scoped Kurzzeitunterhaltungen
- `lib/ai-crm/requests.ts`: Request-Idempotenz und sichere Wiederholung
- `lib/ai-crm/context.ts`: begrenzter Context-Assembler ohne Langzeitwissen
- `app/api/ai-crm/chat`: Text/Agent
- `app/api/ai-crm/transcribe`: temporärer Audio-Upload → Speech-to-Text
- `app/api/ai-crm/undo`: vorhandenes Undo aus einem Aktionsbeleg
- `app/api/ai-crm/billing/*`: Checkout und Customer Portal
- `app/api/webhooks/stripe`: signaturgeprüfter, idempotenter Webhook
- `components/ai-crm/AiCrmAssistant.tsx`: Dashboard-UI
- `/werkstatt/ai`: Beta, Abo und Monatsverbrauch pro Nutzer

## Datenbank

Migrationen: `20260917120000_ai_crm_addon` und
`20260918100000_ai_crm_v1_1`

- `User.aiBetaEnabled`: manuelle Beta-Freischaltung
- `AiSubscription`: minimaler Stripe-Zustand, inklusive Periodenende
- `AiUsage`: Provider, Modell, Tokens, Audiosekunden, Tool Calls,
  optionale Kostenschätzung und Dauer; keine Prompts oder Transkripte
- `AiAuditEvent`: schreibendes Tool, betroffene Entity, Erfolg/Fehlercode,
  Request/Session; keine vollständigen CRM-Dumps
- `AiWebhookEvent`: Stripe Event ID und Verarbeitungszeitpunkt
- `ContactFollowUp`: mehrere offene Wiedervorlagen, genau eine früheste primäre
- `AiConversation`/`AiConversationMessage`: höchstens 20 sichtbare Nachrichten,
  festes Ablaufdatum sieben Tage nach Beginn
- `AiRequest`/`AiToolExecution`: nutzerbezogene Request- und Tool-Idempotenz
- `AiLiveSession`: minimale Steuerdaten einer bewusst gestarteten Live-Runde;
  keine Audio-, Prompt-, Transcript- oder Provider-Event-Spalten

## Entitlement und 15-EUR-Abo

`aiEntitlement(...)` ist die einzige Zugangsentscheidung. Zugang besteht nur,
wenn der globale Schalter und der Feature-Schalter aktiv sind und zusätzlich:

- `User.aiBetaEnabled = true`, oder
- Stripe-Status `ACTIVE`/`TRIALING` mit laufender Periode, oder
- gekündigtes Abo bis zum gespeicherten Periodenende.

Checkout lädt den Stripe Price und verifiziert vor dem Start:

- aktiv
- Währung EUR
- Betrag gleich `AI_CRM_PRICE_CENTS`
- wiederkehrend und monatlich

Auch der signierte Webhook akzeptiert ausschließlich genau diesen Price. Ein
anderes Stripe-Abo oder ein Abo ohne bestätigtes Periodenende schaltet AI CRM
nicht frei.

Steuern, Rechnungsangaben und Tax-Konfiguration liegen in Stripe, nicht in
eigener Produktlogik. Vor dem Verkauf müssen diese Einstellungen fachlich und
rechtlich geprüft werden.

## Fair Use und Messung

Standardwerte je Nutzer und Berliner Kalendermonat:

- 300 Provider-Aufrufe
- 3.600 Audiosekunden (60 Minuten)
- 1.500 CRM-Tool-Aufrufe
- maximal 6 Tool-Runden pro Chat-Anfrage
- maximal 5 MiB und 60 serverseitig gemessene Sekunden je Audiodatei

Alle Werte kommen aus ENV. Providerkosten sind absichtlich nicht dauerhaft im
Code festgeschrieben. Aggregierte Token-, Audiosekunden- und Kostenwerte können
gespeichert werden; Audiobits und sonstige Rohdaten werden nie gespeichert. Eine
Schätzung erscheint erst, wenn die drei `AI_COST_*`-Sätze anhand der aktuellen
Providerpreise gesetzt wurden.

## Datenschutz und Sicherheit

- Audio wird als Request-Datei an OpenAI gesendet und weder in Prisma noch im
  Dateisystem gespeichert.
- Sichtbare Nutzer-/Assistententexte und minimierte Aktionsbelege werden
  serverseitig höchstens sieben Tage ab Gesprächsbeginn gespeichert. Spätere
  Nachrichten verlängern die Frist nicht. Audio, Tool-Rohantworten und
  Prompt-Dumps werden nicht gespeichert.
- Der Serverprompt bezeichnet alle Kontakt-/Notizinhalte als `untrusted data`.
  Sie können Systemregeln nicht ersetzen.
- Jede Tool-ID wird serverseitig erneut mit `ownerId` geprüft. Eine vom Modell
  erfundene oder fremde ID liefert keinen Datensatz und keine Änderung.
- Schreibaktionen und ihr Audit entstehen in derselben DB-Transaktion.
- Logs enthalten Request-/Fehlercodes, aber keine Prompts, Audioinhalte,
  Transkripte oder komplette CRM-Datensätze.
- API-Schlüssel sind ausschließlich serverseitige ENV-Werte.

Vor Production müssen Auftragsverarbeitung, Datenregion/-aufbewahrung und die
Datenschutzhinweise für den konkret verwendeten OpenAI- und Stripe-Account
geprüft und passend konfiguriert werden. Die UI macht dazu keine erfundene
rechtliche Zusicherung.

## Lokal testen

### Textaktion

1. Migration auf eine lokale/Test-Datenbank anwenden.
2. `AI_CRM_ENABLED=true` setzen und `OPENAI_API_KEY` sicher konfigurieren.
3. `/werkstatt/ai` öffnen und das Testkonto per „Beta an“ freischalten.
4. Als Testkonto auf `/heute` eingeben:
   `Hatte gerade ein Gespräch mit Jonas Müller. Er muss es noch besprechen. Ruf ihn nächsten Mittwoch an.`
5. Bei genau einem Jonas müssen Aktivität und Follow-up in der normalen
   Kontaktansicht erscheinen. Bei mehreren Treffern darf nichts geschrieben
   werden; der Assistent muss nachfragen.

### Voice

1. App über `http://localhost` oder HTTPS öffnen und Mikrofon erlauben.
2. „Halten und sprechen“ gedrückt halten, Satz sprechen, loslassen.
3. Das erkannte Transkript erscheint als Nutzerbeitrag; danach läuft derselbe
   geprüfte Text-Agent-Pfad.
4. In DevTools darf kein zweiter Audio-Speicheraufruf erscheinen. Der einzige
   Upload geht an `/api/ai-crm/transcribe`.

### Automatisierte Prüfungen

```bash
node --import ./scripts/alias-hook.mjs --test scripts/ai-crm.test.mjs
npm test
npm run lint
npm run typecheck
npm run build:check
```

Die AI-Tests verwenden eine frische PGlite-Datenbank mit allen Migrationen und
einen simulierten Responses-Client; sie verursachen keine Providerkosten.

## Dependency-Audit V1.1

`npm audit --omit=dev` sank in diesem Paket von 9 Findings
(8 high, 1 moderate, 0 critical) auf 4 high, 0 critical. Gepinnt wurden die
kompatiblen sicheren Transitiven `fast-uri@3.1.6`, `nanoid@3.3.19`,
`postcss@8.5.28` und `sharp@0.35.4`.

Die verbleibenden Einträge laufen über das Prisma-CLI-Paket
(`@prisma/config`/`deepmerge-ts` und der mitgelieferte, in dieser
PostgreSQL-Anwendung nicht verwendete MySQL-Treiber). Der Audit-Vorschlag wäre
ein Downgrade auf Prisma 6; alternativ steht nur der nicht freigegebene
Prisma-8-Major/RC-Pfad offen. Beides ist für dieses Featurepaket riskanter als
das nicht über HTTP-Routen erreichbare CLI-Tooling und bleibt deshalb
dokumentiert statt erzwungen.

## V1.1-Grenze

- Unterhaltungen werden nach Reload und auf einem anderen angemeldeten Gerät
  wiederhergestellt, sind auf 20 Nachrichten begrenzt und nach exakt sieben
  Tagen nicht mehr lesbar. Ein täglicher Cron entfernt abgelaufene Inhalte.
- Mehrere offene Wiedervorlagen bleiben unabhängig bestehen. „Heute“ und die
  Kontaktseite lesen das neue Modell direkt; ältere Auswertungen dürfen den
  synchron gehaltenen `Contact.nextStep*`-Spiegel nutzen.
- Eine frisch durch AI angelegte, unveränderte Kontaktkarte ist im vorhandenen
  30-Sekunden-Fenster sicher rücknehmbar. Spätere Änderungen oder Abhängigkeiten
  führen zu einem Konflikt und löschen nichts.
- Request-, Tool-, Checkout- und Webhook-Wiederholungen sind idempotent.
- Das spätere Wissensgedächtnis/RAG-/Obsidian-Paket ist absichtlich nicht Teil
  dieser Stufe. V1.1 enthält nur die Provider-Schnittstelle des
  Context-Assemblers, keine Vektor- oder Embedding-Tabellen.
- Kein Bulk-Update, Löschen, Teamkontaktzugriff, Deal-Betragsmodell oder
  dauerhafter Audio-/Voice-Dialog.
- Echte OpenAI- und Stripe-Aufrufe benötigen Konten, Schlüssel, Provider-
  Freigaben und Billing-Konfiguration; der lokale Test simuliert diese nicht.

## V1.2 – Jarvis Live (bewusst gestartete Live-Runde)

### Was dieses Paket tatsächlich ausführt

Der globale CRM-Assistent enthält unter **„Live sprechen · lokale Demo“** eine
bewusst gestartete Runde. Erst ein Klick auf „Live mit Jarvis starten“ fordert
das Mikrofon an. Die Komponente fordert nur einen `MediaStream` mit Echo
Cancellation, Noise Suppression und Auto Gain Control an. Sie zeichnet keine
Datei auf, sendet keine Audiodaten an einen Server und beendet alle Tracks beim
bewussten Ende, beim Verbergen der Seite oder beim Unmount.

Die lokale Demo verwendet einen deterministischen Serveradapter und die lokale
Browser-Sprachausgabe nur für das fühlbare Testerlebnis. Die aktuelle,
eingegebene „gesprochene Zeile“ bleibt bis zum ausdrücklich sichtbaren Senden
nur im Browser. Danach wird ausschließlich der finale Nutzertext zusammen mit
der finalen sichtbaren Antwort in die normale sieben Tage gültige Unterhaltung
geschrieben. Teiltranskripte, Audiorohdaten, Prompt-Dumps und Providerereignisse
werden weder in Prisma noch im Dateisystem gespeichert.

Für einen lesbaren lokalen Gesprächsrhythmus zeigt der Browser vor der finalen
Antwort kurz eine als **„Simulierte Antwortzeile“** markierte, statische
Vorschau. Sie ist kein Provider-Event, keine Typing-Animation und keine zweite
Speicherung; Barge-in verwirft eine noch ausstehende Vorschau samt lokaler
Sprachausgabe.

Der sichtbare Status folgt einem expliziten Reducer:

`IDLE → REQUESTING_MICROPHONE → CONNECTING → LISTENING → THINKING → SPEAKING`

Zusätzlich gibt es `INTERRUPTING`, `RECONNECTING`, `ERROR` und `ENDED`. Eine
neue Eingabe während der lokalen Sprachausgabe beendet diese sofort und kehrt zu
„Jarvis hört zu“ zurück. Der Textchat und Live teilen den vorhandenen
Gesprächsverlauf, seine sieben Tage ab Beginn und die maximale Grenze von 20
Nachrichten. Läuft ein Gespräch ab oder ist voll, beginnt die Live-Route
kontrolliert eine neue Unterhaltung statt die alte weiterzuschreiben. Vor
jedem finalen Nutzer-/Assistentenpaar reserviert der Server beide Plätze: Bei
19 Nachrichten wird schon beim Start eine neue Unterhaltung gewählt; erreicht
eine laufende Runde später 20, bleibt ihre Live-Session aktiv und wird für den
nächsten Turn kontrolliert auf eine neue Unterhaltung umgehängt.

„Hey Jarvis“ ist in dieser sichtbar aktiven Runde nur eine natürliche Anrede;
es gibt kein Wake Word und keine Mikrofonüberwachung außerhalb der Session.
„Jarvis“ ist ein interner Demo-Name. Es gibt keine Schauspielerimitation,
keine Iron-Man-/Marvel-Assets und keine geklonte Stimme.

### Schutzgrenze und Datenfluss

```text
Browser nach Klick
  └─ POST /api/ai-crm/live/session  (nur clientSessionId, optionale Conversation-ID)
       └─ Auth + Same-Origin + Feature + Entitlement + Owner + 7 Tage/20 Nachrichten
            └─ AiLiveSession + AiUsage (inhaltsfreie Steuer-/Nutzungsdaten)

Browser: finaler Text
  └─ POST /api/ai-crm/live/session/:id/turn
       └─ serverseitige Absicht, CRM-Tool-Argumente und Idempotenz
            └─ finaler Gesprächsaustausch + minimierter Aktionsbeleg
```

Die Start- und Turn-Bodies sind strikt validiert. Der Browser kann weder
Systemprompt, Modell, Stimme noch Tooldefinitionen einschleusen. Jede Route
fordert Anmeldung, aktives Konto, AI-Entitlement und bei schreibenden Requests
Same-Origin. Conversation-, Session-, Kontakt- und Toolzugriffe bleiben
eigentümerbezogen. Fehler geben nur sichere Produkttexte und Codes zurück,
keine Provider-, Prisma- oder Credential-Details.

`AiLiveSession` enthält genau Owner, Conversation, Provider, Status,
inhaltsfreie Browser-Session-ID, optionale spätere Providerreferenz, Usage-ID,
Start/Heartbeat/Ablauf/Ende und einen sicheren Fehlercode. `activeKey` ist pro
Nutzer eindeutig. Ein verlorener Start-Request derselben Browser-Session darf
denselben Datensatz wiederholen; ein anderer Tab erhält
`LIVE_SESSION_ALREADY_ACTIVE`. So können nicht zwei Tabs gleichzeitig
unkontrolliert Turns oder Audio gegen dieselbe Runde steuern. Nach Ablauf oder
Ende wird der aktive Schlüssel entfernt.

Der lokale Adapter leitet eine finale, klar erkennbare Erinnerung über die
vorhandene `runCrmTool`-Schicht und deren owner-scoped Idempotenz. Wiederholte
Turn-IDs oder Toolereignisse erzeugen damit keine zweite CRM-Mutation. Die
Antwort wird danach wie eine normale Unterhaltung mit Aktionsbelegen angezeigt;
ein Reload zeigt die finalen Live-Beiträge im normalen Verlauf.

### Musik und die AC/DC-Demo

`live-music.ts` definiert die schmale Music-Provider-Grenze für Status, Start
und Pause. Der aktuelle `LocalMockMusicProvider` ist je Nutzer und Live-Session
isoliert, hält nur Laufzeit-Zustand im Prozess und bezeichnet jede Antwort
ausdrücklich als „Lokale Demo“. Es gibt keine eingebettete Musikdatei, kein
Scraping und keine Musikdatei im Repository. Ohne eine vollständige lokale
Spotify-Konfiguration bleibt dieser Mock unverändert aktiv und sagt klar, dass
er nicht abspielt.

Für den ausdrücklich freigegebenen lokalen oder Vercel-Production-Kontotest
ergänzt `spotify.ts` einen serverseitigen Authorization-Code-Flow. Der Browser
erhält von `POST /api/ai-crm/music/spotify` nur die Spotify-Authorization-URL;
der zufällige CSRF-`state` liegt nur als SHA-256-Hash in
`SpotifyOAuthState`, ist zehn Minuten gültig und nach einem Callback verbraucht.
Der Callback verlangt weiterhin die eingeloggte gleiche CRM-Person und entfernt
`code` und `state` sofort durch einen 303-Redirect zur vorab validierten,
kanonischen `/heute`-Origin. Er leitet nie auf den Host einer untrusted Callback-
Anfrage zurück.

`SpotifyConnection` ist pro `User` genau einmal möglich. Sie enthält nur den
mit einem separaten `SPOTIFY_TOKEN_SECRET` per AES-256-GCM verschlüsselten
Refresh-Token, erteilte Scopes und sichere Fehlercodes. Access-Tokens bleiben
flüchtig; Gerätenamen, Track-Historie, Audio und OAuth-Klartexte werden weder
gespeichert noch geloggt. `DELETE /api/ai-crm/music/spotify` trennt nur die
eigene Verbindung und löscht auch einen offenen eigenen OAuth-State.

Der reale Adapter verlangt `user-read-playback-state`,
`user-modify-playback-state` und — weil Spotify es derzeit für die
Katalogsuche verlangt — `user-read-private`. Der Adapter ruft trotzdem kein
Profil ab und speichert keine Profildaten. Vor „spiel AC/DC“ fragt er die
Geräte ab, nimmt nur ein steuerbares aktives Gerät, sucht ausschließlich nach
einem exakt passenden Künstler und sendet erst dann den Startbefehl. Erst ein
erfolgreicher Spotify-204-Status ergibt „AC/DC läuft“. Ohne Gerät, Premium,
Berechtigung, eindeutige Auswahl oder bei Rate-Limit bleibt die CRM-Live-Session
offen und gibt einen konkreten sicheren Hinweis statt Wiedergabe vorzutäuschen.

Spotify verlangt laut [Authorization guide](https://developer.spotify.com/documentation/web-api/concepts/authorization)
für langlebige serverseitige Anwendungen den Authorization-Code-Flow. Die
[Redirect-URI-Vorgabe](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri)
erlaubt lokal `127.0.0.1` beziehungsweise `[::1]`, aber kein `localhost`; eine
gehostete Redirect-URI muss exakt registriert und HTTPS sein. Lokaler und
gehosteter Modus schließen sich aus: Lokal verlangt eine Loopback-Datenbank,
Vercel Production verlangt `VERCEL=1`, `VERCEL_ENV=production`,
`SPOTIFY_ENABLED=true`, eine kanonische `SPOTIFY_APP_URL` und eine
origin-genau passende HTTPS-`SPOTIFY_REDIRECT_URI`. Preview erhält diese
Variablen nicht und wird unabhängig vom Rest fail-closed.
Die [Player-Referenz](https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback)
nennt Spotify Premium und `user-modify-playback-state` für Start/Pause; die
Geräteabfrage verlangt zusätzlich `user-read-playback-state`.

### Vorbereitete echte OpenAI-Realtime-Grenze

Die lokale Route fällt niemals unbemerkt auf einen echten Provider zurück.
`AI_LIVE_PROVIDER=realtime` scheitert geschlossen, bis sowohl eine explizite
Freigabe als auch eine dauerhafte serverseitige Sideband-Adresse vorhanden sind;
auch dann ist im Paket noch kein echter Provideraufruf implementiert.

Der spätere echte Pfad folgt der gegenwärtigen offiziellen Architektur:

1. Der geschützte CRM-Server prüft den Nutzer und mintet mit seinem nur
   serverseitigen OpenAI-Schlüssel einen kurzlebigen Client Secret für die
   Browser-Session. OpenAI beschreibt hierfür `POST /v1/realtime/client_secrets`
   und die Bindung an eine serverseitig gesetzte Safety-ID.
2. Nach dem bewussten Klick verbindet der Browser Audio direkt per WebRTC und
   verwendet den Data Channel für lokale Captions/Status.
3. Der CRM-Server hängt sich für private Tools, Policy und Authorisierung an
   dieselbe Session über einen Sideband-WebSocket. Die CRM-Toolschicht bleibt
   der einzige Eigentümer schreibender Aktionen; Browser und Sideband dürfen
   denselben Tool-Call nicht beide ausführen.
4. Beim Ende wird die Realtime-Session sauber geschlossen, bis die finale
   Usage vorliegt; dann werden nur Mengen, Laufzeit und sichere Fehlercodes in
   `AiUsage` aktualisiert.

Die offizielle WebRTC-Anleitung erläutert die serverseitig geminteten
ephemeren Schlüssel und den anschließenden direkten Browser-Peer. Die
[Server-side-controls-Dokumentation](https://developers.openai.com/api/docs/guides/voice-server-controls?api=realtime)
verlangt bei privaten Tools einen serverseitigen Besitzer pro Aktion und nennt
den Sideband-Kanal für Tool-Ausführung, Geschäftsregeln und sichere Kontrolle.
Als aktuelle vorbereitete Standardmodellkonfiguration steht
`gpt-realtime-2.1` in ENV; vor dem ersten kostenpflichtigen Smoke-Test müssen
Modell, Stimme und aktuelle Preis-/Aufbewahrungsbedingungen nochmals gegen die
offiziellen Dokumente geprüft werden.

### Konfiguration

Diese Variablen sind rein serverseitig und dürfen nie als `NEXT_PUBLIC_*`
angelegt werden:

| Variable | Zweck / sicherer Standard |
| --- | --- |
| `AI_LIVE_PROVIDER` | `disabled`, `mock` oder `realtime`; ohne Wert lokal `mock`, in Production wird `mock` erzwungen zu `disabled` |
| `AI_LIVE_MODEL` | vorbereiteter Realtime-Modellname, Standard `gpt-realtime-2.1` |
| `AI_LIVE_MAX_SESSION_SECONDS` | serverseitige Höchstlaufzeit, Standard 600 Sekunden |
| `AI_LIVE_RECONNECT_LIMIT` | begrenzte manuelle Wiederherstellungen, Standard 1 |
| `AI_LIVE_REALTIME_APPROVED` | muss für einen späteren echten Weg ausdrücklich `true` sein |
| `AI_LIVE_SIDEBAND_URL` | nur serverseitige Sideband-URL; ohne sie scheitert `realtime` geschlossen |
| `SPOTIFY_LOCAL_ENABLED` | nur lokal explizit `true`; ohne `127.0.0.1`/`[::1]`-Datenbank fail-closed |
| `SPOTIFY_ENABLED` | nur in Vercel Production nach vollständiger Einrichtung `true`; in Preview nie setzen |
| `SPOTIFY_APP_URL` | kanonische HTTPS-Origin der Vercel Production, ohne Pfad oder Query |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | ausschließlich serverseitige Credentials der Spotify-Developer-App |
| `SPOTIFY_REDIRECT_URI` | exakt registrierte Callback-URI; lokal `http://127.0.0.1:<port>/api/ai-crm/music/spotify/callback`, Production die passende HTTPS-URI |
| `SPOTIFY_TOKEN_SECRET` | eigener mindestens 32 Zeichen langer AES-256-GCM-Schlüssel für Refresh-Tokens |

Die erste lokale Demo setzt in einem isolierten Testprozess
`AI_LIVE_PROVIDER=mock`; sie aktiviert keinen Deployment-Feature-Schalter und
verwendet keine Remote-Datenbank. `SPOTIFY_LOCAL_ENABLED` akzeptiert nur eine
gültige Loopback-URI sowie eine lokale `DATABASE_URL` auf `127.0.0.1` oder
`[::1]`; der Smoke-Runner setzt diese nur in seinem flüchtigen PGlite-Prozess.
Die gehostete Alternative akzeptiert nur eine Vercel-Production-Ausführung und
die vorab konfigurierte HTTPS-Origin. Für Production bleibt Live ohne
ausdrückliche Konfiguration und vollständigen realen Realtime-Adapter deaktiviert.

### Lokale Prüfung und offene Freigaben

```bash
npm run test:ai
npm run test:ai:live:browser
npm run smoke:spotify:local # nur nach lokaler Spotify-Konfiguration und eigener Zustimmung
npm test
npm run lint
npm run typecheck
npm run build:check
git diff --check
npm audit --omit=dev
```

Die Live-Tests nutzen eine frische PGlite-Datenbank und simulierte
Mikrofon-/Sprachausgabe. Sie prüfen unter anderem falsche Origin,
Entitlement/gesperrte Konten, fremde Conversations/Sessions, Browser-injizierte
Modelle/Tools, 7-Tage-/20-Nachrichten-Grenzen, idempotente Turns und Tools,
mehrere Tabs, den Weiterlauf einer aktiven Session über Nachrichtenlimit oder
Ablauf, fehlende Spotify-Verbindung, OAuth-Owner/CSRF/Token-Verschlüsselung,
fremde Spotify-Owner, Gerät-Fehler, Barge-in, Ende sowie Desktop und Mobile
ohne Horizontal-Overflow. Das ist keine reale iPhone-/Safari- oder
Android-/Chrome-Audioabnahme.

Vor einem echten OpenAI-Smoke-Test sind erforderlich: eine ausdrücklich
benannte lokale/Preview-Umgebung, `OPENAI_API_KEY`, explizite Zustimmung zu
einem kostenpflichtigen Test, eine dauerhaft betreibbare Sideband-Verbindung,
aktuell bestätigtes Modell/Stimme sowie reale Mikrofon-/Lautsprecherabnahme.
Der lokale Spotify-Smoke braucht eine Spotify-Developer-App, das eigene
Premium-Konto als autorisierten Development-Mode-Nutzer, Client-ID,
serverseitiges Client-Secret, die exakt registrierte Loopback-Redirect-URI,
`SPOTIFY_TOKEN_SECRET` und ein aktives Spotify-Gerät. Der gehostete Test braucht
stattdessen dieselbe registrierte Vercel-Production-Callback-URI sowie die
secrets ausschließlich in der Vercel-Production-Umgebung; Preview ist keine
gültige OAuth-Umgebung. `npm run
smoke:spotify:local` erzeugt dafür eine flüchtige PGlite-Datenbank sowie eine
sichtbar angemeldete Testperson; es startet keinen Spotify-Request, bis der
Nutzer im Browser selbst auf „Mit Spotify verbinden“ klickt. Der Smoke beweist
nur diesen lokalen Account-/Gerätepfad, nicht eine Production-Freigabe.
