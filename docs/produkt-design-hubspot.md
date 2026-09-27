# Verbindliche Produktgestaltung: HubSpot als Hauptreferenz

Stand: 27. September 2026. Grundlage ist die ausdrückliche Produktvorgabe für Ergo_CRM. Sie hat Vorrang vor früheren allgemeinen ChatGPT-/Claude-Referenzen. Diese bleiben allenfalls für einzelne Gesprächsinteraktionen relevant.

## Produktprinzip und Bestand

Manuelle Bedienung, Jarvis und der Wechsel zwischen beiden sind gleichberechtigte Wege zu denselben CRM-Daten. Der Arbeitsbereich bleibt ohne KI vollständig nutzbar. Navy, Blau, Cockpit-Identität und die bestehende Fachsprache bleiben erhalten.

Die Bestandsaufnahme fand eine gemeinsame AppShell, NavLinks, SeitenKopf und semantische Farbtokens vor. Kontakte verwenden die bestehenden Namenslisten Verkauf/Recruiting, Kontaktformulare, Ergebnisaktionen und Wiedervorlagen. Jarvis besitzt bereits einen globalen Provider, ein Panel, Gesprächsansicht, Sprachcontroller sowie serverseitige Vorschläge, Bestätigungen, Belege und Rücknahme. Diese Bausteine werden weiterverwendet.

Bereits vor dieser Umsetzung bestanden lokale Änderungen an Jarvis-Berechtigungen, Ausführungsmodi, Werkzeugen, Datenbankkontext und Prisma. Sie wurden nicht verworfen. Die hier beschriebenen Änderungen sind lokale Weiterentwicklung auf diesem Arbeitsstand und keine Aussage über eine veröffentlichte Version. An der externen Datenbank wurde keine Migration ausgeführt.

## Referenzen und bewusste Auswahl

Die offiziellen Artikel und ihre verlinkten UI-Abbildungen wurden geprüft:

| Quelle | Übertragenes Muster | Entscheidung für Ergo |
| --- | --- | --- |
| [Navigation](https://knowledge.hubspot.com/help-and-resources/a-guide-to-hubspots-navigation) | Verlässliche globale Werkzeuge und klare Bereichsnavigation | Desktop-Seitenleiste ab 1100px; Suche, Namen sammeln, Jarvis, Hilfe und Profil in der Kopfzeile. |
| [Listen und Filter](https://knowledge.hubspot.com/records/view-and-filter-records) | Ansichtsreiter, Suche, Filter, Datensatzlink, sichtbare Zeilenaktionen | Vorhandene Reiter Recruiting/Verkauf, Suche nach Name/Telefon, Status- und Telefonfilter, bestehende Mehr-Aktionen. Filter bleiben in der URL. |
| [Aktualisierte Detailansicht](https://knowledge.hubspot.com/records/understand-the-default-record-layout) | Datensatzkopf mit wichtigen Angaben, Arbeitsbereich und Kontextspalte | Fester Kontaktkopf mit Name, Status, Telefon und Aktionen; nächste Schritte und Verlauf; Kontaktdaten seitlich, solange genug Arbeitsbreite bleibt. |
| [Klassische Detailansicht](https://knowledge.hubspot.com/records/work-with-records) | Trennung von Eigenschaften, Aktivitäten und ergänzendem Kontext | Inhaltliche Gruppierung übernommen, keine zusätzliche permanente linke Datensatzspalte neben der globalen Navigation. |
| [Breeze Assistant](https://knowledge.hubspot.com/ai/use-breeze-assistant) | Globaler Einstieg, Kontext und integrierter Assistent | Ein vorhandenes Jarvis-Panel; aktueller Kontakt als Bezug, Wechsel bewusst über „Diesen Kontakt verwenden“. |

Der verlinkte aktualisierte Datensatzartikel bezeichnet die „Universal record page“ ausdrücklich als private Beta. Die klassische Ansicht hat drei Bereiche; die Beta zieht wesentliche Informationen in den Kopf. Ergo verwendet eine feste eigene Übertragung mit Kopf und zwei Inhaltsbereichen. Es gibt keinen Beta-/Klassisch-Umschalter, keine HubSpot-Abhängigkeit und keine Übernahme fachfremder Module. Beta-Filter über Beziehungen werden nicht eingeführt.

Die betrachteten Abbildungen zeigen unter anderem die Kontaktfilter über der Liste, den Breeze-Seitenbereich und die hervorgehobenen Eigenschaften im Datensatzkopf. Die orangefarbenen Markierungen und HubSpot-Markenfarben sind Dokumentationshilfen der Quelle; sie werden nicht Teil unserer Oberfläche.

## Gemeinsame Seitentypen

| Seitentyp | Vorhandene Seiten und Abläufe | Gemeinsame Regeln |
| --- | --- | --- |
| Arbeitsübersicht | Heute, Fortschritt, Team | Eindeutiger Kopf, nächste Handlungen, bestehende Arbeits-/Teamdaten. Heute behält den sichtbaren Jarvis-Einstieg. |
| Liste | Kontakte, Suche, Kalender-Agenda, bestehende Aufgabenlisten | Filter und Aktionen vor den Einträgen, lesbare Statusangaben, direkter Datensatzbezug. |
| Detailansicht | Kontakt, vorhandene Team-/Vorgangsdetails | Name und Aktionen zuerst; Arbeitsinhalt und Zusatzinformationen getrennt. Kontakt ist der umgesetzte Referenzablauf. |
| Formular | Kontakt anlegen/bearbeiten, Kalendereintrag, Jarvis-Vorschlagsbearbeitung | Sichtbare Beschriftungen, erreichbare Aktionen, voller Platz bei umfangreicher Bearbeitung, gemeinsame Fachregeln. |
| Werkzeug | Zinsrechner, Hilfe/Support | Bestehende Funktionen bleiben direkt nutzbar; Jarvis unterstützt mit denselben Quellen bzw. Berechnungen. |

Die Gestaltung liegt in `app/workspace.css` auf den vorhandenen Komponenten. Neue Regeln verwenden semantische Tokens statt einer zweiten Farbpalette. Bestehende Spezialansichten bekommen die gemeinsame Navigation, Typografie, Konturen und Formularbegrenzungen. Ihre fachliche Struktur wird nicht ohne Bedarf ersetzt.

Farben: Canvas hell `#eef2f8`, Surface hell `#ffffff`, Ink hell `#0b1220`, Akzent `#2465d1`; Dunkelmodus folgt den vorhandenen Navy-Tokens. Inter/Systemschrift trägt Überschriften und Fließtext, die vorhandene Monospace-Schrift bleibt für technische Daten verfügbar. Titel werden kompakter, die Arbeitsflächen ruhiger und die meisten Inhaltskonturen auf 10px Radius vereinheitlicht.

## Umgesetzte Abläufe

- **Navigation:** Desktop-Seitenleiste mit aktivem Bereich und eigenen Werkzeuglinks. Auf Mobilgeräten unverändert fünf Hauptziele: Heute, Kontakte, Kalender, Fortschritt, Team. Namen sammeln bleibt über den vorhandenen Kopf-/Dock-Einstieg erreichbar. Mini-Emil verwendet weiterhin seinen bisherigen Coach und wird nicht durch Jarvis ersetzt.
- **Kontaktliste:** Die bestehenden Listen bleiben erhalten. Suchbegriff, Status und Telefonfilter stehen in der URL. Datensatz- und Bearbeitungslinks tragen eine auf `/namen` beschränkte Rücksprungadresse. Statuschips verwenden die vorhandenen tatsächlichen Kontaktphasen. Mehrfachauswahl bezieht sich auf die sichtbaren offenen Kontakte.
- **Kontaktdetail:** Kontaktkopf mit Telefonnummer und Aktionen; Sprungnavigation zu nächsten Schritten, Kontaktdaten/Notiz und Verlauf. Eine Kontextspalte entsteht nur ab ausreichender tatsächlicher Inhaltsbreite. Öffnet Jarvis daneben, wechseln die Datensatzinformationen automatisch in eine lesbare einspaltige Anordnung.
- **Bearbeiten:** Das vorhandene Kontaktformular speichert mit bestehenden Rechten und Regeln. Danach führt der Rückweg zur gefilterten Liste. Neue Kontakte aus der Listenaktion werden der ausgewählten Verkauf-/Recruiting-Liste zugeordnet.
- **Heute, Kalender, Aufgaben:** Gemeinsame Shell und Kopfgestaltung; vorhandene Termin-/Wiedervorlagenaktionen bleiben direkt erreichbar. Aufgaben werden nicht als zusätzliches Fachmodul dupliziert.
- **Jarvis-Kontext:** Globales Öffnen auf einem Kontakt kann den Kontakt als Bezug übernehmen. Ein bereits ausgewählter Gesprächsbezug wird nicht still durch Seitennavigation überschrieben. Auf einer anderen Kontaktseite kann der Nutzer den angezeigten Bezug bewusst wechseln oder entfernen.
- **Gemischte Bearbeitung:** Telefon-/Namens-/weitere unterstützte Kontaktvorschläge lassen sich im bestehenden Entwurfsformular bearbeiten. Nur tatsächlich vorgeschlagene Änderungsfelder werden angeboten. Der Server ersetzt den alten Vorschlag durch einen neuen; die alte Bestätigung gilt nicht mehr. Das bestehende Aktionsprotokoll und die Rücknahme bleiben maßgeblich.
- **Rechner:** Das neue lesende Werkzeug `calculate_interest` verwendet `pruefeRechnerWerte` und `berechne` aus dem vorhandenen Rechner. Es speichert kein Szenario. Der Ergebnislink übergibt Startkapital, Monatsrate, Laufzeit und angenommene Rendite an denselben manuellen Rechner. Ungültige oder unvollständige Werte werden sichtbar abgewiesen. Manuell geänderte aktuelle Werte können über „Aktuelle Berechnung mit Jarvis besprechen“ wieder ins Gespräch übernommen werden. Gespeicherte Szenarien behalten Vorrang vor URL-Eingaben.
- **Hilfe:** `/hilfe` nutzt hinterlegte Anleitungen und die vorhandene Rückmeldefunktion. `get_crm_help` liest dieselbe Quelle. Keine erfundenen Supportkontakte.

## Sprachintegration

Es gibt weiterhin genau einen Öffnungsweg und die bestehenden Sprachcontroller. Öffnen fordert kein Mikrofon an. „Sprachchat starten“ und „Nachricht diktieren“ bleiben getrennt. Mikrofonfreigabe, Verbindungsaufbau, aktive Sitzung, Stumm und Bearbeitung folgen den vorhandenen tatsächlichen Zuständen. Abbrechen, Sperre gegen Doppelstart und Bereinigung verspäteter Starts bleiben Controller-Aufgaben. Eine fehlende KI-Verbindung blockiert weder Kontaktformulare noch Kalender oder Rechner.

Die Browserabnahme hat zwei vorhandene Darstellungsprobleme an diesem Übergang aufgedeckt und behoben: Die große Sprachstartansicht darf den Verlauf nur bei einem leeren Gespräch ausblenden; nach einer Sprachrunde bleibt der Verlauf sichtbar und der erneute Start kompakt. Außerdem übernimmt die sichtbare Startschaltfläche jetzt die vorhandene Sperre während des Ladens oder bei einer blockierenden Sitzung, damit ein angezeigter Klick nicht wirkungslos bleibt.

## Prüfungen und Abnahme

Die reproduzierbare lokale Browserprüfung liegt in `scripts/hubspot-workspace-browser.mjs`. Sie startet echte Next-Routen mit einer ausschließlich lokalen, kurzlebigen PostgreSQL-kompatiblen Testdatenbank. Die Modellantworten kommen aus einer kontrollierten lokalen Simulation. Die Bilder enthalten synthetische Personen.

Nachgewiesene Kernwege:

1. Kontakt suchen/filtern, öffnen, Telefon manuell ändern und speichern; derselbe Such-/Filterzustand wird beim Rückweg angezeigt. Keine Jarvis-Anfrage wird dabei erzeugt.
2. Jarvis bereitet eine Telefonänderung vor; die Bestätigung führt die echte Serveraktion aus. Der neue Wert ist anschließend in Datenbank und CRM-Ansicht sichtbar.
3. Einen Jarvis-Vorschlag manuell ändern, neue Vorschau übernehmen und bestätigen. Der manuell gewählte Wert wird gespeichert. Ein zusätzlicher Transaktionstest bestätigt: Der alte Vorschlag bleibt wirkungslos, zwei Bestätigungen des neuen Vorschlags erzeugen nur einen erfolgreichen Audit-Eintrag.

Weitere Prüfpunkte: 320/390/768/1440px, Hell-/Dunkelmodus, horizontale Überläufe, bestehende mobile Navigation, Öffnen ohne Mikrofon, Panelbreite neben dem Kontakt, Tastaturreihenfolge/Fokus, Formular- und Rechnerübergaben. Finale Ausgänge und Bildschirmansichten stehen im [ergänzenden Abnahmebericht](hubspot-workspace-abnahme-2026-09-27.md).

Sichere Befehle:

```text
node --import ./scripts/alias-hook.mjs --test scripts/hubspot-workspace.test.mjs
node --import ./scripts/alias-hook.mjs scripts/hubspot-workspace-browser.mjs
npm run test:ai:ux
npm run test:ai:live:browser
npm run build:ai:ux:check
```

`npm run build` wird hierfür nicht verwendet, weil es eine Datenbankmigration ausführt. Der isolierte Build-Prüfer verwendet eine Testdatenbank und einen eigenen Cache.

## Getrennte Ergebnisstufen

- **Lokale Umsetzung:** Arbeitsdateien im bestehenden Checkout; vorherige Änderungen bleiben erhalten.
- **Automatische Prüfung:** Lokale Serveraktionen, simulierte Modell-/Sprachpfade und emulierte Bildschirmgrößen; genaue Ergebnisse im Abnahmebericht.
- **Echte Sprach- und Geräteabnahme:** Nicht aus Simulationen ableitbar. Externes OpenAI, reale Mikrofone/Lautsprecher, physische Mobilgeräte und Screenreader müssen separat abgenommen werden.
- **Veröffentlichung:** Kein Commit, Push, Preview-Deployment oder Production-Deployment durch diese Umsetzung. Ein erfolgreicher lokaler Build ist keine Veröffentlichung.
