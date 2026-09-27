# HubSpot UI und Mobile: Umsetzung und Übergabe

Stand: 27. September 2026. Die ausdrückliche Nutzerfreigabe umfasst alle fünf Hauptbereiche, die gemeinsame Oberfläche, Kontakte einschließlich Detail/Bearbeiten, isolierte Prüfung sowie Commit, Push und eine gemeinsame Vercel-Preview. Production und Datenbankmigrationen sind ausgeschlossen.

## Ausgangsbasis

- Branch `codex/hubspot-jarvis-preview`, Ausgangscommit `57548123c1edeb2a45320d1fe2f05cb60f229506`.
- Beim Start lag ausschließlich der noch unversionierte Masterplan vor. Er wurde erhalten und wird mit dieser Übergabe versioniert.
- Die integrierten Such-, Jarvis-, Backend-/Modus- und Sprachverbesserungen sind Vorfahren dieses Standes. Die relevanten anderen Chats waren bei der Prüfung inaktiv. Kein älterer Reviewentwurf wurde darüberkopiert.
- Vor der Implementierung wurden alle fünf Hauptbereiche und Kontakt/Editor für arbeitsbereite Eigengeschäft- und Führungsrollen bei 390×844 und 1440×900 in Hell/Dunkel aufgenommen, außerdem leere/Onboarding-Zustände. Ausschließlich synthetische Personen in einer flüchtigen lokalen Testdatenbank.
- Baseline: erste Kontaktfläche bei 390px auf y724,5; der mobile Fußbereich belegte 147,4px. Team und Fortschritt verdrängten Personen und eigene Ziele durch Verwaltungs-/Werkzeugbereiche.

## Gemeinsame Gestaltung und Zuständigkeiten

Die freigegebene HubSpot-Richtung bleibt verbindlich: Navy/Blau, bestehende semantische Tokens, System-/Inter-Schrift, kompakte Datensätze, 8px Bedienelemente und 10px Inhaltsflächen. Die Hauptaufgabe wird durch ihre Position und eine einzelne klare Aktion sichtbar. Keine neue Fachlogik oder zusätzliche Datenbankobjekte.

Root verantwortet AppShell, Navigation, gemeinsame Kopf-/Dialogelemente, Tokens, Vorführschutz, Heute und Integration. Ein Agent verantwortet Kontakte einschließlich NameList, Detail/Bearbeiten und lokale Zustände. Ein weiterer verantwortet Kalender, Fortschritt, Team und die dafür verwendeten Partner-/Zielkomponenten. Der Prüfagent bearbeitet ausschließlich seine neuen Prüfroutinen und Nachweise. Parallele App-Edits begannen erst nach gesicherter Baseline und festgelegten Schnittstellen.

## Umsetzung

- Gemeinsame Oberfläche: mobile Bereichstitel in der 56px-Kopfzeile, globale Suche, beschrifteter Jarvis-Zugang und echtes Werkzeugmenü. Fünf unveränderte Hauptziele, kompakte Namen-sammeln-Zeile, beschriftete Seitenleiste ab 1100px. Formulare berücksichtigen den sichtbaren Bereich bei Bildschirmtastatur.
- Kontakte: kompakte mobile Personenliste und eigene Desktop-Tabelle, Suche und Filterfläche mit Entwurf/Anwenden/Abbrechen. Vorhandene Bewertung, Schnellerfassung, Nummernergänzung, Mehrfachauswahl und Rücknahme bleiben Bestandteil desselben Ablaufs.
- Kontaktdetail: Identität und Aktionen zuerst; Übersicht, Aktivitäten und Details. Löschen unter Mehr mit bestehender Bestätigung; erhaltene Such-/Filterrückwege und Jarvis-Kontext.
- Heute: bestehende priorisierte nächste Handlung vorn, direkte Aufgabenarbeit, maximal zwei kommende Kalendereinträge und danach Fortschritt/Partner/Coaching. Die große Sammelkarte erscheint ausschließlich bei aktivem Sammeleinstieg; Namen sammeln bleibt dauerhaft erreichbar.
- Kalender: Datum und Eintrag vorn, gemeinsame Ansichtsreiter, Agenda und kompakter Leerzustand. Kalenderanbindung aufklappbar, Herkunft/Bearbeitbarkeit externer Einträge sichtbar; Datumslogik unverändert.
- Fortschritt: eigene aktive Ziele mit realem Ist/Ziel/Zeitraum zuerst. Partnerziele und Teamziele bleiben getrennt; Einheiten, Trichter, Wettbewerb, Warum und frühere Ziele erreichbar.
- Team: kompakte direkte Partnerzeilen vor Verwaltung, zunächst drei mit Zugang zu allen berechtigten Partnern. Vorhandene Absprachen und Detailaktionen bleiben erhalten.
- Zugänglichkeit: native Filter-/Werkzeugdialoge, Fokusführung und Rückgabe auch in bestehenden Ergebnisdialogen. Vorführmaskierung wird vor Hydration angewandt, damit bei Navigation kein Klarnamen-Blitz entsteht.

## Quellenabgleich

Am 27. September erneut geprüft: [mobile Datensätze](https://knowledge.hubspot.com/records/work-with-records-in-the-hubspot-mobile-app), [Listen/Filter](https://knowledge.hubspot.com/records/view-and-filter-records), [mobiler Action Feed](https://knowledge.hubspot.com/prospecting/use-the-action-feed-in-the-hubspot-mobile-app) einschließlich der verlinkten UI-Abbildungen. Die [aktualisierte Datensatzansicht](https://knowledge.hubspot.com/records/understand-the-default-record-layout) ist weiterhin als private Beta gekennzeichnet. Ergo verwendet seine eigene feste Struktur und benötigt diese Beta nicht.

## Sicherer Veröffentlichungsweg

Live geprüftes Zielprojekt: `ergo-crm`, `prj_sY1VWrwitKb5lWrZNQAM0uCyJC1M`; Production-Branch `main`. Production-Ausgangsdeployment: `dpl_F7GRPW8PjJcNyammhRTSxxH5yxXT`.

Preview und Production verwenden weiterhin gemeinsam konfigurierte Datenbankvariablen. Deshalb wird der normale `npm run build` mit `prisma migrate deploy` nicht ausgeführt. Der Quellstand unterbindet automatische Git-Deployments ausschließlich für `codex/hubspot-jarvis-preview`. Die autorisierte manuelle Preview verwendet eine lokale Vercel-Konfigurationskopie mit `buildCommand: next build`. Die Konfiguration des Production-Projekts und dessen Variablen werden nicht verändert. [Vercel: branchbezogene Git-Deployments](https://vercel.com/docs/project-configuration/git-configuration).

Die Veröffentlichung schließt lokale Umgebungsdateien, Caches, Prüfaufnahmen, Anhänge und Arbeitsunterlagen explizit über `.vercelignore` aus. Das Uploadmanifest wurde vor dem Upload mit Vercels Dry Run kontrolliert; damit gelangen ausschließlich die vorgesehenen Projektdateien in das Deployment. [Vercel: Uploadausschlüsse](https://vercel.com/docs/deployments/vercel-ignore).

Die schreibgeschützte Prüfung der lokal konfigurierten Projektdatenbank am 27. September ergab keine ausstehenden oder fehlgeschlagenen Migrationen. Es wurden keine Migrationen ausgeführt. Der geschützte Preview-Browsercheck verwendete eine normale vorhandene Anmeldung und lesende Fachaktionen. Personenbezogene Remote-Aufnahmen sind nicht Bestandteil der Galerie.

## Prüfstand

Die Umsetzung wurde mit wegwerfbaren lokalen Testdaten geprüft. Die schreibenden Abläufe liefen ausschließlich dort.

| Prüfung | Ergebnis |
| --- | --- |
| Fach-/API-/Berechtigungsprüfungen | 264 Prüfungen aus `scripts/*.test.mjs` sowie 16 ergänzende Ziel-, Absprache- und Teamzeitraumprüfungen bestanden; zusammen 280, keine fehlgeschlagen oder übersprungen. |
| Hauptmatrix | 140 Ansichten: sieben Seiten × zwei Rollen × fünf Breiten × Hell/Dunkel. Keine horizontale Seitenausdehnung; interne Kalenderflächen dürfen gezielt scrollen. |
| Zusammenhängende Bedienung | 17 Szenarien bestanden: Heute-Ergebnis, Kontakte suchen/filtern/bearbeiten/zurückkehren, Terminarbeit, Ziele/Partner, Jarvis und gemischtes Bearbeiten, Ausfall-/Ladezustände, Vorführschutz und Tastatur. Detaillierte Einzelbelege im unabhängigen Bericht. |
| Bestehende Arbeitsbereichsregression | Sieben reale Seiten einschließlich Hilfe/Rechner bei 320/390/768/1024/1440px; manuelles Anlegen, bestätigte KI-Änderung und manuell überarbeiteter Vorschlag mit Datenbanknachweis, F6-Fokuswechsel und Quellenübergaben bestanden. |
| Bestehende Sprachoberfläche | Lokale Simulation auf Desktop/Mobil einschließlich Unterbrechen, Sitzungsende, verspäteter Mikrofonfreigabe und Bereinigung bestanden. Öffnen startet kein Mikrofon. |
| Große Schrift und Dialoge | 200% Text für alle sieben Ansichten; zusätzliche 12 Kontakt- und 18 Planungs-/Teamansichten. Die gefundenen Überläufe, Dialogbreiten und Fokusgrenzen wurden korrigiert und erneut geprüft. |
| Bildschirmtastatur | `visualViewport` mit 430px sichtbarer Höhe simuliert: feste Navigation wird bei Texteingabe ausgeblendet, Dialog passt in die sichtbare Höhe, Navigation kehrt nach Schließen zurück. |
| Kalender-Randfall | Drei aufeinanderfolgende 15-Minuten-Termine sind in Tag/Woche getrennt bedienbar; Mindestziele und Rasterende geprüft. |
| Build/Typen/Lint | Isolierter optimierter Next-Build einschließlich Typprüfung und 19 statischen Seiten bestanden. Alle geänderten TypeScript-/TSX-Dateien ohne ESLint-Befund. Kein Migrations-Build. |
| Veröffentlichte Preview | Normale Anmeldung und alle fünf Hauptbereiche bei 390/1440px erfolgreich gerendert: zehn angemeldete Seitenprüfungen mit HTTP 200, richtiger Navigation und ohne horizontalen Überlauf. Kontaktfilter und Werkzeugdialog bedienbar; keine Browserfehler oder blockierten Schreibversuche. |

Die vollständige Abnahmemethode, Befunde und korrigierten Testannahmen stehen im [unabhängigen Prüfbericht](hubspot-masterplan-qa-2026-09-27.md). Die [versionierte Vorher-/Nachher-Galerie](design/hubspot-mobile-2026-09-27/index.html) enthält 56 Originalbilder für alle fünf Bereiche und den vollständigen Kontaktweg.

## Verbliebene Prüfgrenzen

- Die responsive Abnahme verwendet Chromium-Emulation. Ein physisches iPhone/Android-Gerät, mobile Safari-Eigenheiten, die reale Bildschirmtastatur und ein Screenreader wurden nicht praktisch abgenommen.
- Jarvis-Text-/Sprachabläufe sind lokal simuliert. Ein echter OpenAI-/Sprachprovider, Mikrofonhardware und Audioausgabe wurden im Rahmen dieses UI-Auftrags nicht abgenommen. Die vorhandene Provider-/Sprachintegration bleibt bestehen.
- Preview und Production besitzen keine getrennte Datenbankkonfiguration. Daher keine schreibenden Remote-Testkontakte, Termine oder Ziele; die funktionalen Schreibnachweise kommen aus der isolierten Umgebung.

## Veröffentlichung

Die gemeinsame Preview ist veröffentlicht und nach normaler Anmeldung geprüft:

- **Preview:** [Ergo_CRM HubSpot-Mobile-Preview öffnen](https://ergo-exgfu4k49-adrienwottke-7137s-projects.vercel.app).
- **Anwendungscommit:** `aff9233192d0d903fb2bbe05b450cefe162d2765`, auf `origin/codex/hubspot-jarvis-preview` gepusht.
- **Deployment:** `dpl_HNQeHzFuDcu3Ce4XvtjETPNRptpv`, Status **READY**, Ziel **Preview**, Buildkommando **`next build`**. Commit und Branch wurden aus dem veröffentlichten Deployment gelesen, das Ziel zusätzlich mit Vercel Inspect bestätigt. Die API bildet dieses Preview-Ziel als `target: null` ab.
- **Angemeldete Prüfung:** 27. September 2026, 18:21 Uhr Europe/Berlin. Heute, Kontakte, Kalender/Agenda, Fortschritt und Team jeweils bei 390 und 1440px; tatsächliche Anwendungsinhalte statt nur Login-/Schutzseite. Filter öffnen/abbrechen, Werkzeuge öffnen/Escape sowie feste Navigationsreihenfolge erfolgreich. [Bereinigter Browsernachweis](design/hubspot-mobile-2026-09-27/evidence/preview-authenticated.json).
- **Production unverändert:** weiterhin `dpl_F7GRPW8PjJcNyammhRTSxxH5yxXT`. Production-URL, Branch, Buildkommando, Installkommando, Framework und Schutzkonfiguration stimmen mit dem Ausgangssnapshot überein. Es wurden keine Production-Variablen geändert. [Deployment- und Vergleichsnachweis](design/hubspot-mobile-2026-09-27/evidence/deployment-proof.json).

Für die Übergabe gilt bewusst die eindeutige Deployment-Adresse oben. Der ältere Branch-Alias `ergo-crm-git-codex-hubspot-j-40b920-adrienwottke-7137s-projects.vercel.app` verweist derzeit auf das bestehende Production-Deployment. Er wurde weder verändert noch als Preview-Nachweis verwendet.

Der Remotecheck legte keine Fachdatensätze an und rief keine Modellanbieter auf. Die gewöhnliche serverseitige Anwesenheitsmetadatenpflege beim Aufruf von Heute kann stattfinden. Schreibende Funktionsprüfungen, künstliche Fehler und Sprachsimulationen stammen ausschließlich aus der isolierten lokalen Umgebung.

Der nachfolgende reine Dokumentationscommit ergänzt diese Releasezuordnung und die bereinigten Nachweise. Er enthält keine weiteren Anwendungsänderungen; der veröffentlichte Anwendungsstand bleibt exakt `aff9233192d0d903fb2bbe05b450cefe162d2765`.
