# Vorbereitetes Preview-Release: HubSpot und Jarvis

## Umfang

Branch: `codex/hubspot-jarvis-preview`, Ausgangsstand `435b3f92fd43b57cc447a45d3e344b43fd264103`.

Das Paket umfasst die HubSpot-Ausrichtung, den vollständigen Kontaktablauf, Rechner-/Hilfeübergaben, Jarvis-Kontext und Sprachoberfläche, die fertige Erweiterung der Backend-Funktionen einschließlich Zugriffsmodi sowie die vorhandenen Verbesserungen von Stimme und Verhalten. Die älteren Sprach-Hotfixes sind im Ausgangsstand bereits enthalten und wurden nicht doppelt übernommen. Die beteiligten Chats waren bei der Vorbereitung nicht mehr aktiv.

## Prüfung

- Vollständige Projektsuite am 27. September 2026 erneut ausgeführt: **249 Tests bestanden, 0 fehlgeschlagen**.
- Zusätzlich zuvor fünf neue Arbeitsbereichstests bestanden.
- Arbeitsbereich-Browserprüfung: sieben Seiten bei 320/390/768/1440 Pixeln; manuelle, Jarvis- und gemischte Abläufe; keine Konsolenfehler.
- Sprachoberfläche: lokale Simulation auf Desktop/Mobil, Unterbrechen, Verlauf, Sitzungsende und Mikrofonbereinigung bestanden.
- Isolierter Build inklusive Typprüfung und Seitenerzeugung bestanden. Kein Build gegen die externe Datenbank ausgeführt.
- Gestagte Dateien auf typische Schlüssel und Zugangsdaten geprüft; keine Treffer, keine vertraulichen Umgebungsdateien enthalten.

Ansichten und Nachweise: [HubSpot-Abnahme](hubspot-workspace-abnahme-2026-09-27.md). Fachlicher Umfang: [Jarvis-Backendzugriffe](jarvis-backend-zugriffe.md).

## Konkrete Veröffentlichung

Zielprojekt: `ergo-crm` (`prj_sY1VWrwitKb5lWrZNQAM0uCyJC1M`), ausschließlich Vercel **Preview**. Vorgesehen ist `AI_CRM_EXECUTION_MODES=true` nur für diesen Preview-Branch. Die Production-Version und ihre Funktionskonfiguration werden nicht umgestellt.

Die aktuelle Vercel-Konfiguration verwendet für `DATABASE_URL` und `DIRECT_URL` jeweils denselben sensitiven Eintrag mit den Zielen `production` und `preview`; es gibt dafür keine branchspezifische Trennung. Die Preview ist deshalb hinsichtlich ihrer Datenbank nicht isoliert. Sensible Werte wurden weder in dieses Dokument noch in Git übernommen.

Die schreibgeschützte Prüfung der lokal konfigurierten Projekt-Datenbank zeigt genau eine ausstehende Migration:

`20260927140000_jarvis_execution_modes`

Sie legt den Typ `AiExecutionMode` mit `READ_ONLY`, `CONFIRM`, `AUTONOMOUS` an und ergänzt:

- `AiConversation.executionMode`, Standard `CONFIRM`;
- `AiConversation.executionVersion`, Standard `0`;
- `AiRequest.executionMode`, optional.

Es werden keine Tabellen, Datensätze oder bestehenden Felder gelöscht. Bestehende Chats erhalten den Bestätigungsmodus. Die Änderung betrifft dennoch das gemeinsame Datenbankschema und kann während ihrer Ausführung kurzzeitige Tabellensperren benötigen.

Der normale Vercel-Build führt `prisma migrate deploy && next build` aus. Ein Push mit automatischem Deployment könnte daher diese Migration bereits auslösen. **Bis zur ausdrücklichen Freigabe der gemeinsamen Datenbankänderung bleiben Push und Deployment ausstehend.** Das lokal fertige Release-Paket ist der überprüfbare Freigabestand.

Nach dieser Freigabe: gemeinsamen Datenbankstand unmittelbar erneut prüfen, ausschließlich die additive Migration anwenden, Preview-Branch konfigurieren und veröffentlichen, Deployment-Ziel/Commit/Ready-Status und ausgelieferte Seiten kontrollieren. Ein echter angemeldeter Sprachtest und physische Geräteabnahme werden gesondert ausgewiesen.
