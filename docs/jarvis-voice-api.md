# Jarvis V1 – Sprachprotokoll und Nachweisgrenzen

Stand: 26.09.2026. Untersuchung und Umsetzung im vorhandenen Next.js-CRM;
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
  Für einen Einstieg ohne Nutzeraussage: nach `session.started` einmalig
  `session.instructions.append` mit `delegation_id:null`, Mikrofontrack aktiv
  lassen. Ein Append-Ack beweist keine erfolgte oder wortgetreue Wiedergabe.
  Die Begrüßung erfolgt auf Nutzerwunsch direkt durch Live statt über einen
  getrennten, wortgetreu gerenderten Clip.

Die eingebauten SDK-Typen sind die zusätzliche compile-time Prüfung; keine
aus älteren Realtime-Beispielen übernommenen Fantasieevents.

## Serververtrag

- `GET /api/ai-crm/live/session`: authentifizierte, berechtigungsgeprüfte
  Transport-/Pilotkonfiguration ohne Schlüssel.
- `POST` derselben Route: `clientSessionId`, optional `conversationId`,
  für Live `sdp`, optional `voice` aus `vesper`, `cedar`, `ash`; bewusster Reconnect mit `reconnect:true`. Ein Reconnect
  behält die logische CRM-Sitzung und Introphase, schließt die bisherige
  Providerverbindung und zählt gegen das Wiederverbindungslimit.
- `POST /api/ai-crm/live/session/:id/turn`: `clientTurnId`, `transcript`,
  optional `context`, `revision`, `delegationId`. Identität und Rechte werden
  aus der Serversitzung ermittelt. Modell-/Tool-/Promptfelder werden verworfen
  durch strikte Eingabevalidierung. Ergebnis enthält echte `results`,
  Bestätigungskarten, `requestId`, `revision` und `audioDelivered`.
  Mit `Accept: application/x-ndjson` kommen flüchtige Fortschrittsereignisse
  und abschließend ein Ergebnis mit eigenem HTTP-Statusfeld im Stream;
  ältere Clients erhalten weiter JSON. Der Stream startet keine zweite Anfrage.
- `PATCH /api/ai-crm/live/session/:id`: `{}` als Heartbeat oder
  `{revision:n}` zum Verwerfen veralteter laufender Antworten. Bei bereits
  nativ erkannter Sprachunterbrechung verhindert `interruptAudio:false` einen
  zusätzlichen verspäteten Stop-Befehl, der die neue Rückmeldung abschneiden
  würde. Manuelles Unterbrechen sendet weiterhin den Stop-Befehl. Stale
  Ergebnisse überschreiben keine aktuelle Vorschau und werden nicht vorgelesen.
- `DELETE`: Session beenden und Provider über Sideband schließen.
- `POST /api/ai-crm/live/session/:id/intro`: direkt nach `session.started` `{}`;
  serverseitiger Sprachauftrag „Hallo, Meister Emil.“ per Sideband. Antwort
  ist JSON `{introState:"DONE",accepted:true}` nach passendem Instruction-Ack.
  CAS-Status `WAITING -> PLAYING` verhindert parallele automatische Starts;
  `DONE` bedeutet Annahme des Auftrags, keine gemessene Audiofertigstellung.
  Unklare Zustellung bleibt beansprucht, Reconnect wiederholt sie nicht.
  `POST {replay:true}` ist ausschließlich ein bewusster Wiederholungswunsch.
  `PATCH {state:"DONE"}` überspringt einen noch offenen Einstieg, wenn die
  Person bereits spricht. Es gibt keinen Clipcache und keine TTS-Anfrage.

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
`AI_LIVE_MODEL=gpt-live-1`, `AI_LIVE_VOICE=vesper`,
`JARVIS_DEMO_ENABLED=true`,
`JARVIS_GREETING_NAME=Meister Emil`, `AI_LIVE_MAX_SESSION_SECONDS`,
`AI_LIVE_INACTIVITY_SECONDS`, `AI_LIVE_WARNING_SECONDS`,
`AI_LIVE_MAX_TURNS`, `AI_LIVE_RECONNECT_LIMIT`.
Bestehende AI-Feature-/Entitlement- und Monatslimits bleiben erforderlich.
Die Anrede gewährt keine Rechte. Musikquelle und Player sind separat
konfiguriert; dazu die Pilotanleitung beachten.

## Stimme und störungsarme Wiedergabe

Die frühere Rückmeldung führte zunächst zum Wechsel von `marin` auf `cedar`.
Seit 26.09. ist Vesper der Standard; Details zur Persona und Auswahl stehen
im folgenden Abschnitt. Begrüßung und Gespräch laufen über dieselbe Live-Stimme und verwenden
denselben Wiedergabepegel von 0,8; Musik behält ihre separate Steuerung.
Die Auswahl beschreibt ein eigenes technisches Assistentenprofil; ein
identischer Filmklang oder ein bereits bestandener Hörtest wird nicht behauptet.
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

Der kontrollierte Browser-Nachweis prüft Geräusch ohne Unterbrechung, neue
Sprache mit Widerruf alter CRM-Arbeit und durchgehend freigegebener Live-Ausgabe.
Die eigentliche hörbare Unterbrechung übernimmt GPT-Live. Der Test ersetzt
keinen Hörtest am physischen Zielgerät.
Die genaue Ursache eines dort wahrgenommenen Rauschens ist damit nicht
abschließend geklärt; Bluetooth-Geräteprofil, Lautsprecher-Echo und die
Provideraufnahme sind in diesen Tests nicht enthalten.

## Direkter Einstieg und Reaktionszeit

Die Begrüßung startet nach bestätigter Verbindung ohne vorheriges „Jarvis?“.
Der Einstieg enthält keine Musikfrage und hält die erste CRM-Frage nicht mehr
zurück. Musik bleibt auf ausdrücklichen Wunsch verfügbar. Der Prompt enthält
eine sparsame Backchannel-Policy: etwa „Klar, ich schaue kurz nach“, während
das Backend arbeitet; keine erfundenen Fortschritte oder Zeitversprechen.
Live darf diese kurzen Rückmeldungen sofort sprechen, der Browser lässt die
Ausgabe während der Abfrage offen. Fakten benötigen weiterhin Backendbelege.

Die lokale Sprechpausenfrist beträgt jetzt 750 ms (zuvor 900 ms). Ein noch
instabiles Transkript verhindert weiterhin frühes Absenden. Eine passende
Provider-Delegation kann den abgeschlossenen Satz auch bei Restgeräusch
freigeben. Fehlt ein brauchbarer Mikrofonpegel, greift nach 1800 ms stabiler
Mitschrift eine Rückfallebene. Der Schutz gegen alte Fragmente beträgt 500 ms,
damit eine nach der verkürzten Pause gesprochene neue Frage akzeptiert wird.
Kurze eigenständige Begrüßungen/Dankesworte bleiben bei Live;
kontextabhängige Antworten wie „Ja“ sowie Grüße mit einer CRM-Frage gehen
weiterhin an das Backend. Zusammengehörige kurze Sätze werden in einem
Sideband-Append gepackt, statt jede Satzgrenze als neue Anweisung zu senden.
Diese Änderungen belegen keine konkrete reale Gesamtlatenz; Netz, Modell
und benötigte CRM-Werkzeuge sind separat zu messen.

## Stimme, Persona und lesbarer Verlauf am 26.09.2026

`JARVIS_PERSONA` gilt für Sprache und CRM-Antworten: standardmäßig Hype-Modus,
extrovertiert, motivierend, konkrete nächste Schritte und gelegentlich trockener
Humor. Energie entsteht durch wechselnde Betonung und Rhythmus, nicht durch
höhere Lautstärke. Ein gewünschter ruhigerer Ton wird berücksichtigt. Die
Persona verändert weder Quellenpflicht noch die sichtbare Schreibfreigabe.

Vesper ist die neue Standardwahl. Die [offizielle Stimmenbeschreibung](https://developers.openai.com/api/docs/guides/live-conversations)
führt sie als männlich und britisch geprägt; die Eignung für den gewünschten
Jarvis-Charakter ist eine daraus abgeleitete Gestaltungsentscheidung. Die
konkrete deutsche Stimme wurde lokal nicht hörbar abgenommen. Vor Beginn
kann der Nutzer zu Cedar (bisherige Stimme) oder Ash wechseln. Der Server
akzeptiert ausschließlich diese drei Werte. Ein Stimmenwechsel benötigt eine
neue Live-Sitzung. Die Wiedergabe bleibt direkt, ohne zusätzliche Hall-,
Verzerrungs- oder Roboterfilter, um die frühere Rauschproblematik nicht durch
eine neue Effektkette zu verschärfen.

Assistentenantworten werden als eingeschränktes Markdown mit Absätzen,
Listen, Hervorhebungen und Tabellen dargestellt. Roh-HTML, Bilder und aktive
URL-Protokolle werden nicht ausgeführt. Neue lange Antworten öffnen am
Textanfang; wer ältere Beiträge liest, wird nicht automatisch weggezogen.

Die Ansicht „Live-Mitschrift“ zeigt echte Input-/Output-Transkriptfragmente mit
Sprecherzuordnung, einschließlich Begrüßung und kurzen Zwischenmeldungen.
Sie ist nur im aktuellen geöffneten Gespräch vorhanden, auf 50 Zeilen und
16000 Zeichen begrenzt und nach Neuladen weg. Sie wird nicht in Modellprompts,
Werkzeuge oder CRM-Notizen übernommen. Persistierte CRM-Fragen, Ergebnisse
und Freigabekarten bleiben in der Ansicht „Gespräch“. Bei offenen Vorschlägen
führt eine sichtbare Schaltfläche dorthin zurück.

## Fortschritte und begrenzte Wartezeit

Der gemeinsame Fix für „Was kann ich mit CM/CRM machen?“ beantwortet eng
erkannte Orientierungsfragen direkt aus einer festen Funktionsbeschreibung.
Konkrete Nachfragen, Namen und Schreibwünsche werden dadurch nicht geschluckt.
Für diesen Einstieg entfallen Modellaufruf und Kontaktsuche.

Der Live-Auftrag streamt tatsächliche Phasen: angenommen, Datensuche,
Vorschauvorbereitung, Zusammenfassung, längere Wartezeit und Sprachübergabe.
Eine kurze serverseitige Sprachmeldung kann beim Start und einmal nach acht
Sekunden ausbleibender Antwort erfolgen. Sie ist an Session und Revision
gebunden; beim Abschluss werden ausstehende Statusmeldungen abgebrochen.
Die Meldungen erfinden weder fachliche Fortschritte noch eine fertige Antwort.

Die komplette Agentenschleife teilt ein Zeitbudget von höchstens 40 Sekunden
(oder dem kleineren konfigurierten Providerlimit). Der Browser begrenzt seine
Wartezeit auf 65 Sekunden und bietet danach Ergebnisprüfung mit der originalen
Operationskennung an. Leere Modellantworten werden als Fehler gemeldet.
`FAILED`/`ABORTED` beendet die Ergebnisprüfung; nur nach 404 darf dieselbe
Kennung erneut gesendet werden. Neue Sprache und manuelles Unterbrechen
verhindern, dass alte Ergebnisse eine neue Frage verdrängen.

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
