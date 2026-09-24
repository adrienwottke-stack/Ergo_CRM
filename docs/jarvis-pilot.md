# Jarvis V1 – Führungspilot

Stand: 25.09.2026. Erweiterung des bestehenden Cockpits, kein zweites CRM.

Aktueller Spracheinstieg: Jarvis begrüßt unmittelbar nach bestätigtem Start
über GPT-Live mit dem angeforderten „Hallo, Meister Emil.“. Keine erste
Nutzeraussage, separate TTS-Erzeugung oder Musikentscheidung erforderlich.
Kurze natürliche Rückmeldungen sind im Prompt vorgesehen und bleiben während
CRM-Abfragen hörbar. Die Sprechpausenfrist beträgt jetzt 900 statt 1400 ms.
Die folgenden historischen Abnahmeangaben vom 24.09. bleiben als Verlauf
erhalten; aktueller Sprachvertrag und Nachweisgrenzen stehen in
[jarvis-voice-api.md](jarvis-voice-api.md).

## Bestand und Integrationsplan

Die lesenden Teilanalysen Sprache/KI, CRM/Rechte und Oberfläche/Audio/Betrieb wurden getrennt durchgeführt. Anschließend waren Dateizuständigkeiten fest: Sprachbackend und Tests, Führungsadapter und Fachtests, Live-Oberfläche/Player und Audiotests; zentrale Verträge, Migration, Bestätigungen und Integration beim Hauptagenten. Keine AGENTS.md im Projekt oder in seinen übergeordneten Verzeichnissen gefunden. Die zu Beginn vorgemerkten fremden Änderungen wurden nicht überschrieben; sie wurden während der Bestandsanalyse durch den fremden Commit `564be41` Bestandteil des Bestands.

| Funktion | Bestand | Codepfade | Ergänzung | Abnahme |
| --- | --- | --- | --- | --- |
| Login, Navigation, Teamstruktur | vorhanden | `lib/auth.ts`, `lib/scope.ts`, `lib/struktur.ts` | unverändert verwenden | bestehende Tests, Browser |
| Jarvis Text und eigene Kundenkontakte | vorhanden | `lib/ai-crm/ux-agent.ts`, `tools.ts`, Chatroute | Führungswerkzeuge in gleichen Agenten | isolierte DB und Provider-Mocks |
| Echte Live-Sprache | fehlend; bisher Simulation | `JarvisLive.tsx`, Live-Routen | GPT-Live WebRTC, serverseitige Delegation | Protokolltests; echte Freigabe separat |
| Tages-/Wochenüberblick | teilweise, nur Follow-ups | `leadership-tools.ts` | Absprachen, eigene Schritte, Kalender, Quellen | echte isolierte Datensätze |
| 1:1-Vorbereitung | fehlend in Jarvis | `leadership-tools.ts` | eigene Notizen, Verlauf, offene Zusagen, Lücken | Quellen-/Rechtetests |
| Gemeinsame Vereinbarungen | vorhanden | `lib/vereinbarungen.ts`, `PartnerVereinbarung` | transaktionsfähige Wiederverwendung | bestehende Fachtests + Jarvis |
| Private 1:1-Notizen | fehlend | `LeadershipNote`, `/mannschaft/notizen/[id]` | minimale eigene Notizpersistenz | Autorgrenze und Strukturwechsel |
| Aufgaben und interne Termine | vorhanden, nicht in Jarvis | `LeadershipTask`, `Termin` | vorbereiten/ändern/erledigen/verknüpfen | Versionen, Idempotenz, keine Einladungen |
| Sichtbare Freigaben | teilweise | `action-plans.ts`, `AssistantTimeline.tsx` | jede Aktion, Einzelauswahl, Bearbeitung, revisionsgebundene Freigabe | kein Schreiben vor Klick, veralteter Stand |
| Tier-3-Runde | fehlend in Jarvis | `get_leadership_round` | eigene Beteiligungen mit direkten Führungskontakten | keine privaten Unterteamnotizen |
| Automatischer Einstieg | vorhanden | Live-Session/Intro-Route | native Live-Begrüßung nach Verbindung, persistenter einmaliger Zustand | Once-/Reconnect-/Fehlertests; hörbarer Wortlaut benötigt echte Abnahme |
| Musik/Audiokoordination | Spotify teilweise vorhanden | `local-audio.ts`, geschützte Musikroute, `private-music.ts` | lokale Datei oder privater Blob, echte Playerzustände, Ducking | Player-/Rechtetests und echte MP3-Decodierung; siehe Musikbereitstellung unten |

Abhängigkeiten: zentrale Verträge und additive Tabellen zuerst; danach Fachadapter und Sprach-/Playerpakete; gemeinsame Vorschauoberfläche; Integration, unabhängige Prüfung und Betriebshandoff. Baseline: `npm run test:ai` bestand vor den Änderungen mit 57/57 Tests.

## Fachliche Annahmen und Grenzen

- Ruben ist Vorführer, kein angenommener Admin. „Meister Emil“ ist ausschließlich eine konfigurierbare Ansprache.
- Es gibt kein Mandantenfeld und kein zeitliches Mehrfach-Führungsbeziehungsmodell. Die bestehende Instanz nutzt `User.leaderId` und `User.path` als aktuelle Struktur. Jarvis führt keine neue Rolle ein, interpretiert Rekrutierung oder Rang nicht als Zugriff und prüft die aktuelle Beziehung erneut vor Abruf und Ausführung. Frühere oder zusätzliche Beziehungen werden nicht erfunden; deren Darstellung erfordert einen gesondert abgestimmten Ausbau des vorhandenen Strukturmodells.
- Private Gesprächsnotizen gehören ihrem Verfasser. Weder Adminstatus noch höhere Führungsebene geben Zugriff. Auch Quelle, Auszug und UI-Link prüfen erneut.
- Aufgaben eines Partners sind gemeinsame Absprachevorschläge. Ein Jarvis-Klick speichert `VORGESCHLAGEN`; die vorhandene Gegenbestätigung bleibt erforderlich. „Berichtet vereinbart“ ist kein technischer Nachweis einer zweiten Zustimmung.
- Notiz und Aufgaben bleiben getrennt selektierbar. Kein Rohtranskript wird automatisch zur Fachnotiz. Herkunft über Notizbezug beziehungsweise vorhandene Audit-/Operationskennung; gespeicherte CRM-Einträge bleiben nach Ablauf des Chats bestehen.
- Europe/Berlin ist der dokumentierte Pilotstandard. Unklare relative Angaben werden geklärt. Kalenderbelegung anderer Personen wird nicht behauptet. Terminanlage schreibt nur den internen `Termin`, ohne Nachrichten/Einladungen.
- Keine Ranglisten, Versicherungsberatung, Mehrpersonenaufzeichnung, Wake-Word-Funktion oder Computersteuerung.

## Datenbank und Rückweg

Additive Migration `prisma/migrations/20260924120000_jarvis_leadership/migration.sql`: private `LeadershipNote`, optionale Notiz-/Terminverknüpfungen an bestehenden Vereinbarungen, Versions-/Herkunftsfelder an Führungsschritten sowie Intro-/Revision-/Limitmetadaten an `AiLiveSession`. Fremdschlüssel erhalten referenzielle Integrität. Bestehende Daten werden weder geseedet noch gelöscht.

Die Migration wird ausschließlich gegen isolierte PGlite-Testdatenbanken geprüft. Keine Anwendung auf die konfigurierte Bestandsdatenbank. Für den späteren Einsatz: gesichertes Backup und Zielbestätigung, dann den vorhandenen `prisma migrate deploy`-Schritt im freigegebenen Deploymentweg ausführen. Datenerhaltender Rückweg: neue Live-Funktion deaktivieren und vorherige App-Version betreiben; neue Tabellen/optionale Spalten stehen lassen. Kein DROP/Reset zum Rückbau. Neue private Notizen vor einem eventuellen späteren Tabellenabbau separat gesichert exportieren.

## Start, Build und Deployment

Repository: Next.js 15.5.25, Prisma 7.10, React 19.1, OpenAI SDK 7.18.0, Playwright 1.62; lokale Shell hier Windows/PowerShell. Vorhandener Deploymentanbieter ist laut README und `vercel.json` Vercel. Die erste Implementierungsphase blieb lokal; der anschließende ausdrückliche Auftrag „alles inkl. der anderen Session auf den Live-Build“ autorisiert den gemeinsamen Produktionsrelease einschließlich der geprüften additiven Migration. Der konkrete Deploymentstatus wird separat gegen Vercel und die öffentliche Alias-Adresse geprüft.

- `npm install` installiert Projektabhängigkeiten; `postinstall` generiert Prisma-Typen.
- `npm run dev` startet das vorhandene CRM. Vorher muss die additive Migration auf einer ausdrücklich freigegebenen Entwicklungsdatenbank verfügbar sein.
- `npm run typecheck`, `npm run lint`, `npm test` sind die vorhandenen Prüfpfade.
- `npm run build:ai:ux:check` ist der sichere Buildnachweis: temporäre PGlite-Datenbank, getrennte Ausgabe, keine Providerzugänge und keine Migration der Bestandsdatenbank.
- `npm run build:check` führt nur `next build` aus, isoliert die Datenbank aber nicht selbst.
- **`npm run build` führt zuerst `prisma migrate deploy` aus.** Diesen Releasebefehl nicht gegen ein unklares Datenbankziel ausführen.
- `npm run start` startet den zuvor gebauten Next-Server.
- `.vercel` und `vercel.json` bleiben bestehender Releaseweg. Lokale Prüfung beweist keine Vercel-Deploymentfreigabe oder Zielrechnerabnahme.

## Konfiguration ohne Geheimnisse

Vorhandene Gates bleiben erforderlich: `AI_CRM_ENABLED=true`, Feature `aiCrm` verfügbar und autorisierte Beta-/Abo-Freischaltung. Keine Kontoerstellung oder Freischaltung zur Vorführung vorgenommen.

| Name | Zweck |
| --- | --- |
| `OPENAI_API_KEY` | vorhandener serverseitiger API-Zugang; nie im Browser |
| `AI_MODEL` | vorhandenes Jarvis-Text-/Toolmodell |
| `AI_LIVE_PROVIDER=live` | neue echte GPT-Live-Anbindung; `mock` bleibt ausdrücklich Simulation, `disabled` deaktiviert |
| `AI_LIVE_MODEL` | dokumentierte GPT-Live-Modellkennung; standardmäßig `gpt-live-1` |
| `AI_LIVE_VOICE` | unterstützte KI-Stimme |
| `AI_LIVE_SPEECH_MODEL` | ehemaliger TTS-Pfad; für den nativen Live-Einstieg nicht mehr verwendet |
| `JARVIS_DEMO_ENABLED` | konfigurierte Vorführ-Anrede statt Profilvorname verwenden; Live begrüßt in beiden Fällen |
| `JARVIS_GREETING_NAME` | im Vorführmodus `Meister Emil`; kein Rechtebezug |
| `AI_LIVE_MUSIC_FILE` | absoluter Pfad einer vorhandenen, freigegebenen AC/DC-Datei auf dem Server des lokalen Piloten |
| `AI_LIVE_MUSIC_TITLE` | sichtbarer Titel der tatsächlich konfigurierten Datei |
| `AI_LIVE_MUSIC_BLOB_PATH` | Produktionsquelle im privaten Vercel Blob Store, z. B. `jarvis/acdc-highway-to-hell.mp3`; keine öffentliche URL. Ein gesetzter lokaler Dateipfad hat Vorrang. |
| `BLOB_STORE_ID` | verbundener privater Store; Vercel verwaltet das kurzlebige `VERCEL_OIDC_TOKEN` automatisch |
| `AI_LIVE_MAX_SESSION_SECONDS` | maximale Dauer |
| `AI_LIVE_INACTIVITY_SECONDS` / `AI_LIVE_WARNING_SECONDS` | Inaktivität und Vorwarnung |
| `AI_LIVE_MAX_TURNS` / `AI_LIVE_RECONNECT_LIMIT` | persistente Sitzungsgrenzen |
| `AI_MAX_TOOL_ROUNDS`, `AI_MAX_MONTHLY_REQUESTS`, `AI_MAX_MONTHLY_AUDIO_SECONDS`, `AI_MAX_MONTHLY_TOOL_CALLS` | bestehende Verbrauchsgrenzen |

Die Audiodatei bleibt außerhalb des öffentlichen Repositorys. Lokal kann ein absoluter Serverpfad verwendet werden; in Produktion liegt die vom Nutzer gelieferte Datei im privaten Vercel Blob Store. Die Musikroute prüft Login, KI-Berechtigung und eigene aktive Sitzung, bevor sie den Speicher anspricht. Sie liefert Status oder Audiobytes mit `private, no-store`, ohne Speicher-URL oder Token an den Browser weiterzugeben. Byte-Ranges und ETag-Prüfung sichern konsistente Teilabrufe. Kein Streamingabo ist erforderlich.

## Test- und Live-Nachweis

Abschließender Gesamtlauf am 24.09.2026: `npm test` **181/181 bestanden**, `npm run typecheck` bestanden, `npm run lint` ohne Fehler. Eine unveränderte Warnung liegt in `scripts/_audit/probe.mjs` (ungenutzte Variable). Der isolierte Produktionsbuild `npm run build:ai:ux:check` wurde erfolgreich ausgeführt. Die Migration wurde dabei ausschließlich in temporären Testdatenbanken angewandt.

| Abnahmegruppe | Konkreter Nachweis | Ergebnis / Grenze |
| --- | --- | --- |
| 1 Rechte | Führungsadapter, Integration, bestehende Scope-/Vereinbarungstests; Quellenaufruf mit fremdem Konto im Browser | Direkte Beziehungen, Autorenrechte, manipulierte IDs und entzogene Rechte geprüft. Kein eigenständiges Mandantenmodell im Bestand; keine erfundene Mandantentrennung. |
| 2 Datenqualität | Fehlende Notizen, vollständige Offen-Zähler über die sichtbare Teilmenge hinaus, sichtbare Abdeckung; Inhaltsanweisungen bleiben Daten | Bestanden. Faktische Quellen und Datenlücken werden im selben Ergebnis angezeigt; offene Angaben dürfen nicht erfunden werden. |
| 3 Kontext | Gemischte IDs, Partnerwechsel/Pronomen, aktuelle Liste offener Vorschläge, ungültige alte Auswahl | Bestanden; unklare Zuordnung benötigt Auswahl. |
| 4 Vorschläge | Kein Direkt-Schreibweg, bearbeitbarer Ersatzentwurf, separate Notiz-/Aufgabenbestätigung und Verwerfen | Bestanden; jede Fachänderung benötigt die sichtbare aktuelle Freigabe. |
| 5 Speicherung | Konkurrierende Bestätigungen, echte isolierte Datensätze, Reload und neue Unterhaltung | Bestanden; keine Duplikate oder externen Nachrichten. |
| 6 Änderungen | Veraltete Aufgaben/Termine, Rechteentzug, ungültige alte Revision, Korrektur während laufendem Backend; Datumsfelder in Berliner Zeit einschließlich Sommer-/Winterzeit | Bestanden; kein stilles Überschreiben, kein verspätetes Vorlesen der alten Antwort. Doppelte oder nicht existente Uhrzeiten bei der Umstellung benötigen Klärung. |
| 7 Fehler | Ungültige Modellargumente, API-Fehler, verlorene Antwort und Abfrage derselben Operationskennung, Sideband-Fehler vor ACK | Bestanden in kontrollierten Fehlerfällen; tatsächlicher Providerzugriff noch offen. |
| 8 Sprache | WebRTC-/ICE-Vertrag, Transkriptgrenzen, Denkpausen, Unterbrechung, erhaltene erste Fachfrage, getrennter Aufgaben-/Audiostatus | Automatisiert bestanden; reale deutsche Gespräche, Stimme und Echo nicht geprüft. |
| 9 Intro | Exakter TTS-Eingabetext, einmalige persistente Claim-Phase, bewusstes Replay, verspäteter Clip verworfen, Retry nach TTS-Fehler | Automatisiert bestanden; exakte hörbare Ausgabe benötigt echte TTS-Abnahme. |
| 10 Musik | Fehlende Quelle, Ja/Nein, Wiedergabe-Promise, blockierter Start, Lautstärke, Pause/Stopp und Race-Tests | Player/API bestanden mit synthetischer Testquelle; keine AC/DC-Datei vorhanden oder beschafft. |
| 11 Audiokoordination | Weiches Absenken, Pause/Stopp gewinnen gegen automatische Wiederaufnahme, mobile Mic-/Ende-Bedienelemente im sichtbaren Bereich | Automatisiert bestanden; akustische Rückkopplung am Zielgerät offen. |
| 12 Sitzungen | Mikrofonfehler, Stumm/Ende, Inaktivität, Dauerlimit, Reconnect, Nutzergrenzen, Track-/Transport-/Timer-Cleanup | Automatisiert geprüft; harte Providerabschaltung bei manipuliertem Browser siehe Betriebsgrenze unten. |
| 13 Sicherheit | Promptinhalte ohne Ausführungsrechte, Scope-Fingerprint, erneute Quellenautorisierung auch für ältere gespeicherte Antworten, private Tier-3-Abgrenzung | Bestanden; kein Rohaudio als CRM-Notiz, kein API-Schlüssel im Browser. |
| 14 Regression/Betrieb | Gesamttest, Typprüfung, Lint, isolierter Build, vorhandene UX-Browserprüfung und neue Führungs-/Sprach-Browserprüfungen | Lokale automatische Abnahme; keine Veröffentlichung und keine Änderung laufender Bestandsdaten. |

Browsernachweise liegen unter `test-results/` (lokale, isolierte Fixtures):

- `ai-crm-ux/result.json`: **16 Prüfgruppen bestanden**, keine Browserfehler; bestehende Bestätigung, Undo, verlorene Antwort, Wiederaufnahme, Diktat, 320/375 Pixel und 200 Prozent Text.
- `ai-crm-live/result.json`: **bestehende Sprachsimulation bestanden**, Desktop 1280×800 und Mobil 375×812; Unterbrechung, Verlauf, Mikrofon-/Session-Cleanup, Dock, Konsole und Netzwerkanfragen geprüft. Dieser Regressionstest ist ausdrücklich kein GPT-Live-Nachweis.
- `jarvis-leadership/result.json`: **6 vollständige Ablaufgruppen bestanden**, keine Browserfehler; Vorbereitung mit Quellen, privater Quellenzugriff, bearbeitete selektive Freigabe, separate Aufgabe mit Notizherkunft, Reload/neue Unterhaltung und Tier-3-Abgrenzung. Renderprüfung bei **320/390/768/1440 Pixeln** ohne horizontalen Überlauf. Screenshots wurden zusätzlich visuell geprüft.
- `jarvis-pilot/report.json`: **13 kontrollierte WebRTC-/Audio-Prüfungen bestanden**, einschließlich Reconnect ohne erneutes Intro/Musikstart. Erster Ausgabebeginn und sichtbares Fachresultat werden getrennt gemessen: **1,594 Sekunden bis zum simulierten Audiobeginn**, **1,562 Sekunden bis zum simulierten Fachresultat** bei den jeweiligen Testaussagen. Dies sind ausschließlich Ablaufzeiten des Testanbieters, keine echte Provider- oder Hardwarelatenz.

Die unabhängigen Reviews prüften CRM-Grenzen, Wiederaufnahme und Audiozustände. Bestätigte Befunde wurden behoben: alte Antworten nach Strukturwechsel, verspätete Ergebnisse nach Nutzerwechsel, unsichtbare Abdeckung, fehlgeschlagene Vorschlagsbearbeitung, falscher Partner bei Pronomen und bei gesprochener Entwurfskorrektur, private Vorschlagsdetails in fehlgeschlagenen Anfragen ohne gespeicherte Antwort, falsch akzeptierte Sideband-Fehler, verspätetes Intro, TTS-Retry, alte Transkriptfragmente und Inaktivität während laufender Arbeit. Zugehörige Regressionstests wurden ergänzt und die letzten beiden Rechtebefunde unabhängig erneut geprüft.

### Zugangsbefund vor dem Produktionsrelease und fehlender Live-Nachweis

Am 24.09.2026 wurde `OPENAI_API_KEY` in Vercel als **Sensitive Secret für Preview im Zweig `preview`** bestätigt. Der Schlüssel muss nicht erneut bereitgestellt werden. Vercel liefert ihn beim lokalen Export nur als `[SENSITIVE]`; eine kurzzeitig erzeugte Exportdatei wurde anschließend gelöscht. Es wurden keine Geheimnisse ausgegeben, verändert oder eingecheckt.

Lokal sind Sprache und Musikquelle nicht konfiguriert. Ein echter GPT-Live-/TTS-Aufruf wurde deshalb nicht durchgeführt. Das Vorhandensein des Secrets beweist weder Freischaltung von `gpt-live-1` noch funktionierende Audioausgabe. Der nächste echte Test braucht eine geschützte Preview mit ausdrücklich geeignetem Datenbankziel, der additiven Migration, `AI_LIVE_PROVIDER=live` und einem bereits berechtigten Vorführkonto. Wegen des bestehenden Build-Schritts `prisma migrate deploy` wurde keine Preview gegen ein ungeklärtes Datenbankziel veröffentlicht.

Zum ursprünglichen Pilotabschluss fehlte die Musikdatei. Die anschließende Bereitstellung der vom Nutzer gelieferten Datei ist im folgenden Abschnitt dokumentiert.

### Musikbereitstellung am 24.09.2026

Der Nutzer lieferte `ACDC Highway to Hell Audio.mp3`: 3.459.626 Bytes, MPEG-1 Layer 3, Stereo, 44,1 kHz, 128 kbit/s, rund 3:28 Minuten. Die unveränderte Datei wurde in den privaten Store `ergo-crm-jarvis-music` (Frankfurt, nur Production verbunden) unter `jarvis/acdc-highway-to-hell.mp3` geladen. Der sichtbare Titel lautet `AC/DC – Highway to Hell`. Die Datei und Zugangsdaten werden nicht eingecheckt.

Die echte Speicheranbindung wurde geprüft: unangemeldeter Direktzugriff HTTP 403; vollständiger Abruf bytegenau identisch; Anfangs- und Endbereich korrekt per HTTP 206; Chromium decodiert 208,24 Sekunden Stereo mit vorhandenem Audiosignal. SHA-256 der Originaldatei: `e321cf62b978841f114f7b00cb9dd7dcedf5e77fa3cdf9acb256243beafd3263`. Der lokale Nachweis liegt in `.cache/jarvis-real-music-report.json`. Zusätzliche API-Tests prüfen eigene/fremde/beendete Sitzungen, Berechtigungen, private Speicherpflicht, manipulierte Pfade, ungültige Ranges und fehlende Dateien.

Musik startet weiterhin ausschließlich nach ausdrücklicher Zustimmung, mit 12 Prozent Lautstärke. Absenken bei Sprache sowie Pause, Stopp und Sitzungsende bleiben im bestehenden Player. Die Decodierung ist kein Hörtest am physischen Mikrofon-/Lautsprecheraufbau. Technische Grundlage: [Vercel Private Blob](https://vercel.com/docs/vercel-blob/private-storage) und [Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk).

### Betriebsgrenzen vor einer unbeaufsichtigten Freigabe

Der normale Browser beendet die Verbindung nach konfigurierter Dauer/Inaktivität; CRM-Aufträge, Reconnects und Verbrauch unterliegen serverseitigen Grenzen. Die geprüfte GPT-Live-SessionConfig bietet aber keinen anwendungseigenen Ablaufzeitpunkt. Ein manipulierter Browser könnte seine direkte Providerverbindung offen halten. Ein harter serverseitiger Kostenstopp braucht deshalb einen dauerhaft überwachten Schließpfad; die kurzlebige Sideband-Verbindung allein garantiert das nicht. Diese Grenze ist für den betreuten Pilot dokumentiert und vor einer unbeaufsichtigten Nutzung zusätzlich zu schließen.

Ebenfalls offen bleiben echte Mikrofon-/Lautsprecher-/Kopfhörerabnahme, Audiofreigaben im Zielbrowser, hörbar exakter Einstieg, natürliche deutsche Denkpausen, Echo und reale Antwortlatenz. Headless-Tests ersetzen diese Abnahme nicht. Details zum überprüften API-Vertrag: [jarvis-voice-api.md](jarvis-voice-api.md).

## Reproduzierbare Vorführung

Vorab: geeignete bereits existierende Vorführdaten, aktueller berechtigter Account, richtige direkte Partnerzuordnung, freigegebene Entwicklungsdatenbank mit Migration, API-Projektzugriff, HTTPS oder localhost, Mikrofonrechte, Audioausgang und erlaubte Musikdatei prüfen. Kopfhörer und Lautsprecher getrennt testen. Kein Konto oder Datensatz wird automatisch zur Demo angelegt.

1. Im bestehenden CRM anmelden und Jarvis öffnen; bewusst „Jarvis starten“ wählen.
2. Nach dem Start selbst noch nichts sagen: Jarvis soll von sich aus „Hallo, Meister Emil.“ sprechen. Danach direkt die erste Frage stellen und auf eine kurze Rückmeldung während der CRM-Abfrage achten.
3. Bei gewünschter Musik ausdrücklich „Musik an“ sagen – erst tatsächliches Player-Playback zählt. Bei Browserblockade manuell starten; bei fehlender Datei ist dieser Schritt offen.
4. „Etwas leiser. Was ist heute für mich offen?“ – Musikstatus und echte Quellen prüfen.
5. Berechtigten vorhandenen Partner auswählen, 1:1 vorbereiten und „Ausführlicher. Was habe ich selbst zugesagt, und wo steht das?“ fragen.
6. Quelle öffnen, Zeitpunkt/Autorzugriff prüfen, Leitfaden anfordern.
7. Nur ein ausdrücklich geeignetes Vorführgespräch nachbereiten. Notiz und berichtete Absprachen prüfen; KI-Empfehlungen getrennt halten. Unklare Zeiten/Verantwortliche klären.
8. Vorschläge bearbeiten, einzelne abwählen/verwerfen und konkreten aktuellen Stand sichtbar bestätigen. Gemeinsame Absprachevorschläge bleiben bis zur Gegenbestätigung offen.
9. Gespeicherte Einträge öffnen, neu laden und in neuer Unterhaltung wieder abrufen.
10. Mit geeignetem berechtigten Konto die Tier-3-Runde zeigen; private Unterteamnotizen dürfen nicht erscheinen.
11. „Musik aus“, Mikrofon bei Bedarf stummschalten und Sitzung beenden. Tracks, Player und Verbindung müssen beendet sein.

Technischer Reconnect darf weder erneut begrüßen noch Musik selbst starten. Nach unklarer Speicherantwort zuerst „Ergebnis prüfen“; nie aus dem gesprochenen „okay“ oder einer Musikzustimmung eine Fachfreigabe ableiten.
