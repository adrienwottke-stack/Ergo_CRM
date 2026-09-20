# Live Voice bleibt servergesteuert und ist pro Nutzer genau einmal aktiv

**Status:** angenommen für das lokale Jarvis-Live-Paket

## Kontext

Eine Live-Runde verbindet Browser-Mikrofon, sichtbare Transkripte, spätere
Realtime-Provider und potenziell schreibende CRM-Tools. Ohne eine klare
Eigentümerschaft könnten zwei Browser-Tabs dieselbe Unterhaltung gleichzeitig
verändern, oder ein Browser könnte Modell-, Prompt- und Toolparameter
einschleusen. Gleichzeitig dürfen Audio und Zwischenstände nicht zum zweiten
Gesprächsspeicher werden.

## Entscheidung

1. Eine `AiLiveSession` speichert nur inhaltsfreie Steuerdaten: Owner,
   Conversation, Provider, Status, Ablauf, Heartbeat, sichere Fehlercodes,
   Usage-Referenz, spätere Provider-Referenz und eine zufällige
   Browser-Session-ID. Audio, Teiltranskripte, Prompts und Provider-Events
   gehören nicht in dieses Modell.
2. `activeKey` ist pro Nutzer eindeutig. Nur derselbe `clientSessionId` darf
   einen verlorenen Session-Start wiederholen. Ein weiterer Tab erhält
   `LIVE_SESSION_ALREADY_ACTIVE` und kann keine offene Runde steuern.
3. Der Browser sendet nur einen finalen sichtbaren Text mit einer
   Idempotenz-ID. Serverrouten entscheiden über Entitlement, Owner,
   Conversation-Grenzen, Absicht und Toolargumente. Alle CRM-Mutationen gehen
   durch die bestehende owner-scoped Toolschicht.
4. Der lokale Sprachadapter bleibt deterministisch und kennt keine echten
   Realtime-Provider. Bei einem späteren OpenAI-Realtime-Pfad trägt der Browser
   Audio per WebRTC; der CRM-Server kontrolliert private Tools und Regeln über
   eine Sideband-Verbindung. Der Server ist der einzige Ausführer schreibender
   Tools.
5. Spotify kann entweder als expliziter lokaler Loopback-Adapter mit lokaler
   Loopback-Datenbank oder als Vercel-Production-Adapter mit kanonischer
   HTTPS-Origin ergänzt werden. Beide Modi schließen sich gegenseitig aus. Ein
   gehashter, zehn Minuten gültiger OAuth-`state` bindet die Zustimmung an das
   eingeloggte CRM-Konto; nur ein AES-GCM-verschlüsselter Refresh-Token wird
   pro Owner gespeichert. Access-Tokens, Geräte, Tracks und Audio bleiben
   flüchtig. Hosted OAuth wird nur mit `VERCEL=1`, `VERCEL_ENV=production`,
   `SPOTIFY_ENABLED=true` und einer origin-genau passenden Callback-URI
   aktiviert. Preview erhält keine Spotify-Secrets; ohne valide Konfiguration
   bleibt die vorhandene Music-Simulation aktiv.

## Konsequenzen

- Ein Nutzer kann nicht gleichzeitig aus zwei Tabs gegen dieselbe Live-Session
  sprechen. Das ist absichtlich strenger als „letzter Tab gewinnt“, damit keine
  doppelte Erinnerung oder unklare Audiohoheit entsteht.
- Ein Netzwerk-Retry derselben Browserinstanz bleibt ohne zusätzliche Usage-
  Reservierung möglich.
- Jede finale Live-Zeile benötigt zwei freie Nachrichtenplätze. Reicht der
  aktuelle Kurzzeitverlauf nicht mehr aus oder läuft er während einer aktiven
  Runde ab, hängt der Server dieselbe aktive Session kontrolliert an eine neue
  Unterhaltung, statt die alte weiterzuschreiben oder das Mikrofon abrupt zu
  beenden.
- Finalisierte Sätze leben ausschließlich in der vorhandenen sieben Tage
  gültigen `AiConversation`; ein Reconnect kann sie über `AiRequest` nicht
  doppelt schreiben.
- Spotify und OpenAI-Realtime erhalten keine Sonderrechte: Credentials,
  Entitlement, Owner-Prüfung und Toolausführung bleiben serverseitig.
- Eine reale Spotify-Antwort bedeutet nur nach einem erfolgreichen Web-API-
  Befehl „gestartet“ bzw. „pausiert“. Fehlt ein steuerbares aktives Gerät oder
  lehnt Spotify die Wiedergabe ab, bleibt die Live-Runde aktiv und erklärt
  konkret den nächsten Schritt statt eine Wiedergabe zu behaupten.
- Eine echte Realtime-Implementierung braucht vor Aktivierung eine dauerhaft
  betreibbare Sideband-Verbindung, eine klare Action-Owner-Regel und einen
  kostenpflichtigen, ausdrücklich freigegebenen Smoke-Test.

## Verworfene Alternativen

- **CRM-Tools im Browser ausführen:** verworfen, weil Toolargumente, Owner-
  Prüfung und Credentials nicht vertrauenswürdig wären.
- **Eine aktive Session pro Tab ohne zentrale Sperre:** verworfen, weil zwei
  Tabs dieselbe Conversation und dieselben idempotenten Toolabläufe
  konkurrierend bearbeiten könnten.
- **Audio- oder Provider-Events als Debug-Historie speichern:** verworfen,
  weil es die Datenschutz- und Aufbewahrungsgrenze der sichtbaren
  Kurzzeitunterhaltung unterläuft.
