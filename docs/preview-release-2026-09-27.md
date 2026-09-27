# Gemeinsames Preview-Release: HubSpot, Jarvis und globale Suche

## Umfang

Branch: `codex/hubspot-jarvis-preview`, Ausgangsstand `435b3f92fd43b57cc447a45d3e344b43fd264103`.

Das Paket umfasst die HubSpot-Ausrichtung, den vollständigen Kontaktablauf, Rechner-/Hilfeübergaben, Jarvis-Kontext und Sprachoberfläche, die fertige Erweiterung der Backend-Funktionen einschließlich Zugriffsmodi sowie die vorhandenen Verbesserungen von Stimme und Verhalten. Die älteren Sprach-Hotfixes sind im Ausgangsstand bereits enthalten und wurden nicht doppelt übernommen. Die beteiligten Chats waren bei der Vorbereitung nicht mehr aktiv.

## Abgleich mit anderen Chats und Arbeitsständen

- „Jarvis Backend-Zugriff erweitern“: 61 zusätzliche Arbeitsfunktionen, drei Zugriffsmodi, Berechtigungen und idempotente Abläufe sind im Sammelcommit `5291977` enthalten.
- „Jarvis-Stimme und Verhalten planen“: aktuelle Persona, Meridian als vorläufige Stimme, Souverän/Mehr Energie und ehrliche Mikrofonanzeige sind enthalten.
- „Jarvis-Sprachstart hervorheben“: Commit `435b3f9` ist enthalten.
- „Assistent für Emil freischalten“ und der Audio-Arbeitsbaum: Audio-Fallback ist über `0e2b43a` enthalten; die ältere Arbeitskopie wird nicht darüberkopiert.
- Frühere Jarvis-Chat-, Fortschritts-, Smalltalk- und Live-Änderungen sind Vorfahren des Release-Branches. Onboarding und die anderen sauberen Audio-/Diagnose-Arbeitsstände haben keine zusätzlichen Commits außerhalb des Release-Standes.
- Im separaten Such-Arbeitsstand lag dagegen noch ein nicht integriertes fertiges Paket (`ec7d98a`). Es ist jetzt einschließlich Such-API, sechs Datenbereichen, Funktionssuche, Tastatursteuerung, Pagination, Verlauf und Zugriffsprüfungen integriert. Die bestehende Rechner-Freigabe wird weiterhin berücksichtigt.
- Der ältere iPhone-Redesign-Branch ist ein ausdrücklich unvollständig abgenommener Reviewentwurf vom 9. September. Seine Gestaltung und abgebrochenen Entwürfe werden nicht über die neuere HubSpot-Umsetzung gelegt. Er bleibt erhalten.

## Prüfung

- Vollständige Projektsuite nach Suchintegration am 27. September 2026 erneut ausgeführt: **255 Tests bestanden, 0 fehlgeschlagen**.
- Such-Browserabnahme bestanden: 320/390/768/1440 Pixel, Suche nach Notizen, Kalender-/Absprachedetails, Browser-Rückweg, Verlauf, Pagination, Tastatur, verspätete Antworten, Fehlerbehandlung und Zugriffsschutz. Desktop- und Mobilbilder gesichtet.
- Zusätzlich zuvor fünf neue Arbeitsbereichstests bestanden.
- Arbeitsbereich-Browserprüfung: sieben Seiten bei 320/390/768/1440 Pixeln; manuelle, Jarvis- und gemischte Abläufe; keine Konsolenfehler.
- Sprachoberfläche: lokale Simulation auf Desktop/Mobil, Unterbrechen, Verlauf, Sitzungsende und Mikrofonbereinigung bestanden.
- Isolierter Build inklusive Typprüfung und Seitenerzeugung bestanden. Kein Build gegen die externe Datenbank ausgeführt.
- Gestagte Dateien auf typische Schlüssel und Zugangsdaten geprüft; keine Treffer, keine vertraulichen Umgebungsdateien enthalten.

Ansichten und Nachweise: [HubSpot-Abnahme](hubspot-workspace-abnahme-2026-09-27.md). Fachlicher Umfang: [Jarvis-Backendzugriffe](jarvis-backend-zugriffe.md).

## Konkrete Veröffentlichung

Zielprojekt: `ergo-crm` (`prj_sY1VWrwitKb5lWrZNQAM0uCyJC1M`), ausschließlich Vercel **Preview**. Branchspezifisch vorgesehen: `AI_CRM_ENABLED=true`, `AI_CRM_EXECUTION_MODES=true`, `AI_LIVE_PROVIDER=live`, `AI_LIVE_MODEL=gpt-live-1`, `AI_LIVE_VOICE=meridian`, `JARVIS_DEMO_ENABLED=true`. Die Production-Version und ihre Funktionskonfiguration werden nicht umgestellt.

Die aktuelle Vercel-Konfiguration verwendet für `DATABASE_URL` und `DIRECT_URL` jeweils denselben sensitiven Eintrag mit den Zielen `production` und `preview`; es gibt dafür keine branchspezifische Trennung. Die Preview ist deshalb hinsichtlich ihrer Datenbank nicht isoliert. Sensible Werte wurden weder in dieses Dokument noch in Git übernommen.

Die schreibgeschützte Prüfung der lokal konfigurierten Projekt-Datenbank zeigt genau eine ausstehende Migration:

`20260927140000_jarvis_execution_modes`

Sie legt den Typ `AiExecutionMode` mit `READ_ONLY`, `CONFIRM`, `AUTONOMOUS` an und ergänzt:

- `AiConversation.executionMode`, Standard `CONFIRM`;
- `AiConversation.executionVersion`, Standard `0`;
- `AiRequest.executionMode`, optional.

Es werden keine Tabellen, Datensätze oder bestehenden Felder gelöscht. Bestehende Chats erhalten den Bestätigungsmodus. Die Änderung betrifft dennoch das gemeinsame Datenbankschema und kann während ihrer Ausführung kurzzeitige Tabellensperren benötigen.

Der normale Vercel-Build führt `prisma migrate deploy && next build` aus. Ein Push mit automatischem Deployment kann daher diese Migration bereits auslösen. Nach der konkreten Freigabefrage antwortete der Nutzer: „grandios, auch die anderen chats/ ändreungen mit rein bringen“. Dies wurde als Zustimmung zum beschriebenen Release einschließlich der additiven gemeinsamen Datenbankerweiterung mit zusätzlichem Integrationsauftrag aufgenommen und im Chat ausdrücklich so angekündigt.

Die erneute Datenbankprüfung zeigte ausschließlich diese ausstehende Migration und keine fehlgeschlagenen Migrationen. Ein Transaktionsprobelauf prüfte alle drei neuen Felder und ihre Standardwerte erfolgreich; anschließend wurde vollständig zurückgerollt.

Veröffentlichung: finalen isolierten Build prüfen, Release committen und pushen, Preview-Branch konfigurieren und veröffentlichen, Migrationsergebnis sowie Deployment-Ziel/Commit/Ready-Status und ausgelieferte Seiten kontrollieren. Ein echter angemeldeter Sprachtest und physische Geräteabnahme werden gesondert ausgewiesen.
