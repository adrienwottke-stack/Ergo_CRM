# Jarvis V1 – Sprachprotokoll und Nachweisgrenzen

Stand: 24.09.2026. Untersuchung und Umsetzung im vorhandenen Next.js-CRM;
keine Bestandsdaten geändert, keine Providerverbindung durch die Tests erzeugt.

## Verifizierter Bestand

`package.json`, Lockfile und installiertes Paket enthalten OpenAI SDK **7.18.0**.
Das Paket enthält `live.create`, `SessionConfig`, `SidebandWS` und die hier
verwendeten Eventtypen. Node auf dem Entwicklungsrechner: **24.16.0**.
`lib/ai-crm/openai.ts` hält den langfristigen Schlüssel serverseitig.
Der vorherige Live-Weg war eine ausdrücklich markierte Simulation mit
Texteingabe, Mikrofonfreigabe und `speechSynthesis`. Der alte `realtime`-Adapter
wirft weiterhin seine konkreten Konfigurations-/Implementierungsfehler.

Die bestehende Textanbindung nutzt Responses mit serverseitigen Tools,
Usage-Limits, kurzlebigen Conversations und persistenten Requests. Echte
Live-Fachfragen verwenden jetzt denselben `runUxCrmAgent`; der Mock-Reminder
bereitet lediglich eine Bestätigungsvorschau vor.

## Offiziell geprüfte API

- [GPT-Live Einstieg](https://developers.openai.com/api/docs/guides/live):
  Sprachmodell `gpt-live-1`, unabhängiges Backend, WebRTC im Browser.
- [Client delegation](https://developers.openai.com/api/docs/guides/live-delegation):
  `delegation: { type: "client" }`; `session.delegation.created` liefert
  Metadaten, keinen Aufgabenwortlaut. Die Anwendung führt vorhandene
  Fachlogik aus. Ergebnisse werden mit `session.commentary.append` und
  vorhandener `delegation_id` oder `null` eingebracht. Commentary wird
  paraphrasiert und ist kein wortgetreuer Sprachbefehl.
- [WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc):
  `client.live.create({session, transport:{type:"webrtc",sdp}})` ruft
  `POST /v1/live/sessions` auf. Der Browser erhält die SDP-Antwort und wartet
  auf `session.started`. Er sendet kein `session.start`.
- [Sitzungen](https://developers.openai.com/api/docs/guides/live-conversations):
  Eingangs-/Ausgangstranskripte bestehen aus `delta`, `start_ms`, `end_ms`.
  Es gibt dabei kein `transcript.done` oder Realtime-`speech_started`.
  Audio, Transkript und Aufgaben müssen unabhängig erfasst werden.
  Für exakten Wortlaut empfiehlt die Dokumentation einen gerenderten Clip
  mit eigener Playbackkontrolle. Ein Append-Ack beweist keine erfolgte
  oder wortgetreue Wiedergabe.

Die eingebauten SDK-Typen sind die zusätzliche compile-time Prüfung; keine
aus älteren Realtime-Beispielen übernommenen Fantasieevents.

## Serververtrag

- `GET /api/ai-crm/live/session`: authentifizierte, berechtigungsgeprüfte
  Transport-/Pilotkonfiguration ohne Schlüssel.
- `POST` derselben Route: `clientSessionId`, optional `conversationId`,
  für Live `sdp`; bewusster Reconnect mit `reconnect:true`. Ein Reconnect
  behält die logische CRM-Sitzung und Introphase, schließt die bisherige
  Providerverbindung und zählt gegen das Wiederverbindungslimit.
- `POST /api/ai-crm/live/session/:id/turn`: `clientTurnId`, `transcript`,
  optional `context`, `revision`, `delegationId`. Identität und Rechte werden
  aus der Serversitzung ermittelt. Modell-/Tool-/Promptfelder werden verworfen
  durch strikte Eingabevalidierung. Ergebnis enthält echte `results`,
  Bestätigungskarten, `requestId`, `revision` und `audioDelivered`.
- `PATCH /api/ai-crm/live/session/:id`: `{}` als Heartbeat oder
  `{revision:n}` zum Verwerfen veralteter laufender Antworten. Stale Ergebnisse
  überschreiben keine aktuelle Vorschau und werden nicht vorgelesen.
- `DELETE`: Session beenden und Provider über Sideband schließen.
- `POST /api/ai-crm/live/session/:id/intro`: nach erster abgeschlossener
  Nutzeraussage `{}`; serverseitiger TTS-Clip, `audio/mpeg`. CAS-Status
  `WAITING -> PLAYING` verhindert parallele doppelte Erzeugung.
  `PATCH {state:"OFFERED"}` nach Playback, `PATCH {state:"DONE"}` nach
  Musikentscheidung oder Wechsel zur Fachfrage. Ein **bewusster**
  `POST {replay:true}` darf nur den im selben Serverprozess noch vorhandenen
  Clip erneut liefern. Ein Neustart des Prozesses erzeugt keinen Ersatzclip
  automatisch. Der Clipcache ist benutzer-/sitzungsgebunden und flüchtig.

Die Browser-Allowlist lässt nur Schließen sowie Input mute/unmute zu.
Vertrauenswürdige Anweisungen und Ergebnisse gelangen per kurzlebiger
serverseitiger `SidebandWS`-Verbindung in die Sitzung. Dafür wurde nur `ws`
ergänzt, kein zusätzlicher Dienst. Lange Antworten gehen vollständig in
konservativen UTF-8-begrenzten Abschnitten an Live; keine stille 1200-Zeichen-
Kürzung. Vollständige Quellen und Vorschläge bleiben im bestehenden Jarvis.

## Wiederanlauf nach unterbrochenem Start

`GET /api/ai-crm/live/session` liefert zusätzlich `activeSession: {id} | null`
für die eigene, noch nicht abgelaufene Sitzung. Providerkennung, Startkennung
und fremde Sitzungen werden dabei nicht offengelegt. Der Browser bietet bei
einer bestehenden Sperre „Vorherige Sitzung beenden“ an. Erst nach bestätigtem
Abschluss erscheint „Jarvis starten“; weder die Statusprüfung noch das
Beenden öffnet das Mikrofon. Eine fehlgeschlagene Beendigung bleibt sichtbar
wiederholbar. Der Schutz vor zwei gleichzeitig aktiven Tabs bleibt bestehen.

Ein lokal abgebrochener Start nimmt eine noch ausstehende Startantwort weiter
entgegen und beendet deren Sitzung sofort. Bei tatsächlich verlorener Antwort
wird die eigene aktive Sitzung erneut abgefragt und zum bewussten Beenden
angeboten. Serverseitige Abbrüche, unvollständige Providerantworten und Fehler
beim Zusammenstellen der Antwort geben die eigene Startreservierung frei und
schließen eine bereits erzeugte Providerverbindung. Eine zwischenzeitlich
beendete Sitzung darf durch die späte Providerantwort nicht wieder aktiv werden.

Die API-Tests decken Zugriffsschutz, erneuten Start, Abbruch während des
Providerstarts, unvollständige Antworten und Fehler nach dem Providerstart ab.
Der kontrollierte Browser-Test prüft zusätzlich eine vorhandene Sperre,
fehlgeschlagene Beendigung, verlorene Startantwort, späte Antwort nach Abbruch
und den anschließenden erfolgreichen Neustart.

## Konfiguration

Serverseitig: `OPENAI_API_KEY`, `AI_LIVE_PROVIDER=live`,
`AI_LIVE_MODEL=gpt-live-1`, `AI_LIVE_VOICE=cedar`,
`AI_LIVE_SPEECH_MODEL=gpt-4o-mini-tts`, `JARVIS_DEMO_ENABLED=true`,
`JARVIS_GREETING_NAME=Meister Emil`, `AI_LIVE_MAX_SESSION_SECONDS`,
`AI_LIVE_INACTIVITY_SECONDS`, `AI_LIVE_WARNING_SECONDS`,
`AI_LIVE_MAX_TURNS`, `AI_LIVE_RECONNECT_LIMIT`.
Bestehende AI-Feature-/Entitlement- und Monatslimits bleiben erforderlich.
Die Anrede gewährt keine Rechte. Musikquelle und Player sind separat
konfiguriert; dazu die Pilotanleitung beachten.

## Stimme und störungsarme Wiedergabe

Die Rückmeldung zur bisherigen Stimme führte zum Wechsel von `marin` auf
`cedar`, das sowohl GPT-Live als auch die Begrüßungs-TTS unterstützen.
`voice-style.ts` definiert dieselbe ruhige, tiefere und dezent synthetische
deutsche Sprechweise für beide Wege. Begrüßung und Live-Audio verwenden
denselben Wiedergabepegel von 0,8; Musik behält ihre separate Steuerung.
Die Auswahl beschreibt ein eigenes technisches Assistentenprofil; ein
identischer Filmklang oder ein bereits bestandener Hörtest wird nicht behauptet.
OpenAI empfiehlt `cedar` und `marin` für die TTS-Qualität:
[Text to speech](https://developers.openai.com/api/docs/guides/text-to-speech).
Eine andere Live-Stimme gilt erst in einer neu gestarteten Sitzung:
[Live-Konfiguration](https://developers.openai.com/api/docs/guides/live-conversations).

Ein konkreter Wiedergabefehler wurde vor der Korrektur im Browser reproduziert:
Eine Mikrofon-Pegelspitze ohne Transkript setzte `speaker.muted = true` und
widerrief die laufende Antwort. Kurzes Rauschen, Klicks oder Rest-Echo konnten
so die Ausgabe bis zur nächsten Fachantwort abschneiden. Pegel dienen jetzt
nur noch Aktivitätsanzeige, Musikabsenkung und Pausenerkennung. Erst neue
erkannte Wörter dürfen die Antwort unterbrechen, höchstens einmal pro
Äußerung. Duplikate, verspätete Fragmente und bloße Satzzeichen zählen nicht.
Der manuelle Unterbrechen-Knopf bleibt unmittelbar wirksam.

Der kontrollierte Browser-Nachweis prüft Geräusch ohne Unterbrechung, echte
Sprache mit Unterbrechung, die nächste hörbare Antwort und den gleichen
Pegel für Intro/Live. Er ersetzt keinen Hörtest am physischen Zielgerät.
Die genaue Ursache eines dort wahrgenommenen Rauschens ist damit nicht
abschließend geklärt; Bluetooth-Geräteprofil, Lautsprecher-Echo und die
Provideraufnahme sind in diesen Tests nicht enthalten.

## Prüfungen und Grenzen

Live-Transkripte tragen ihren Text in `delta`, nicht in `content`.
Der Parser verwendet den SDK-Typ `InputTranscriptDeltaEvent` und übernimmt
die Fragmente einschließlich Leerzeichen in den lokalen Äußerungspuffer.
Die Testereignisse sind ebenfalls gegen den SDK-Typ geprüft. Der Browser-Test
durchläuft mit diesem Ereignisformat die Begrüßung und die anschließende
CRM-Antwort; ein falsches Fixture darf den echten Eingabefehler nicht verdecken.
Referenz: [GPT-Live transcript deltas](https://developers.openai.com/api/docs/guides/live-conversations#transcript-deltas).

`scripts/jarvis-voice.test.mjs` verwendet eine isolierte PGlite-Datenbank
und kontrollierte SDK-/Sideband-Mocks. Geprüft werden Protokollkonfiguration,
Frontend-Allowlist, eigene/fremde Sessions, einmalige Intro-Erzeugung,
bewusstes Replay, Reconnect ohne erneute Begrüßung, bestehender Backendweg,
persistierte Quellen, Idempotenz und veraltete Revisionen.
Die vorhandenen Live-Session-/Turn-/API-Tests laufen zusätzlich; der
Reminder-Test erwartet jetzt korrekt eine ungespeicherte Vorschau.

Automatisierte Tests belegen **keinen** Projektzugriff auf GPT-Live, keine
echte Audioqualität, exakte Aussprache, Lautsprecherechovermeidung oder
Musikwiedergabe am Zielrechner. Dafür ist ein begrenzter echter Test nötig.

Die konkrete Zugangsprüfung durch den Hauptagenten fand `OPENAI_API_KEY`
als sensibles Vercel-Secret im Preview-Zweig `preview`. Vercel exportiert
dieses sensible Secret nicht in die lokale Umgebung (`[SENSITIVE]`).
Ein temporärer Export wurde wieder entfernt. Deshalb wurde kein echter
GPT-Live-/TTS-Aufruf ausgeführt und weder Modellzugriff noch ein
Providerfehler fälschlich behauptet. Die Prüfung benötigt einen zulässigen
Zugang in einer geschützten Umgebung mit passender Live-Konfiguration.

GPT-Live bietet in der geprüften SessionConfig keinen anwendungseigenen
Timeout. Das CRM begrenzt Fachaufträge, Reconnects und normale Browser-
Sitzungen. Ein manipulierter Browser, der trotz Ablauf die direkte
Providerverbindung offen hält, benötigt für eine harte serverseitige
Dauergrenze einen dauerhaft überwachten Schließpfad. Die kurzlebige
Sideband allein belegt diese Missbrauchsgrenze nicht. Für einen betreuten
Pilot ist die sichtbare Enden-Funktion verbindlich; eine unbeaufsichtigte
Freigabe benötigt den zusätzlichen Betriebsnachweis.
