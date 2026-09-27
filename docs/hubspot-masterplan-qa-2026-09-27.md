# HubSpot-Masterplan: unabhängige lokale UI-Abnahme

Stand: 27. September 2026. Der Bericht dokumentiert tatsächliche Prüfungen gegen eine kurzlebige lokale Testdatenbank. Eine veröffentlichte Preview, echte Provider, reale Mikrofone und physische Geräte sind eigene Abnahmestufen.

Versionierte Übergabe: [56 Originalbilder in der Vergleichsgalerie](design/hubspot-mobile-2026-09-27/index.html), [zusammengeführte Abnahme](design/hubspot-mobile-2026-09-27/evidence/acceptance.json), [finale Messmatrix](design/hubspot-mobile-2026-09-27/evidence/after/result.json) und [weitere Prüfungen](design/hubspot-mobile-2026-09-27/evidence/validation-summary.json). Die weiter unten verlinkten lokalen Rohaufnahmen und Logs bleiben ergänzende Detailbelege.

## Ausgangsbasis

Der vollständige Masterplan, die Produktgestaltung und der Preview-Release-Kontext wurden vor der Prüfung gelesen. Die Baseline wurde vor den App-Änderungen auf Commit `57548123c1edeb2a45320d1fe2f05cb60f229506` aufgenommen.

Die reproduzierbare Umgebung verwendet `scripts/test-db.mjs`: eigene PGlite-Instanz im Arbeitsspeicher, zufälliger lokaler Port, eigener Next-Cache, synthetische Sitzungen und lokale Modellantworten. Die externe Projektdatenbank und echte KI-Anbieter werden dabei nicht verwendet. `npm run build` wird nicht ausgeführt.

Feste Vergleichsdaten: je 16 Kontakte für eine arbeitsbereite Person im eigenen Geschäft und für eine Führungskraft, einschließlich Langname und fehlender Nummer; jeweils ein persönliches Ziel und drei Termine; vier direkte Partner und drei bestätigte Vereinbarungen; ein getrenntes Teamziel. Alle Vergleichsaufnahmen entstehen vor den mutierenden Funktionsprüfungen.

Die Baseline enthält sieben Ansichten – alle fünf Hauptseiten sowie Kontaktdetail und Bearbeiten – für beide Rollen bei 390 × 844 und 1440 × 900, jeweils hell und dunkel sowie helle Vollseiten. Die Aufnahme meldete **keinen Browserfehler und keinen KI-Aufruf**. Die ergänzenden damaligen Leerbilder sind ausschließlich Leerzustandsbelege; der erste Seed hatte dafür noch keinen regulären Startphasenwert. Die eigentliche Onboarding-Abnahme verwendet anschließend `COLLECTION` und die aktivierte lokale Startführung.

Belege: [Baseline-Ergebnis](../test-results/hubspot-masterplan/before/result.json), [Kontakte mobil vorher](../test-results/hubspot-masterplan/before/ready-contacts-390-light.png), [Fortschritt mobil vorher](../test-results/hubspot-masterplan/before/ready-progress-390-light.png), [Team mobil vorher](../test-results/hubspot-masterplan/before/leader-team-390-light.png).

Die Baseline reproduziert den Platzverlust: Der erste Kontakt-Namenslink liegt bei 390 Pixeln Breite bei y = 724,5 und auf Desktop bei y = 659,7. Die mobile feste untere Fläche misst rund 147,4 Pixel. Fortschritt zeigt zuerst Teamziel und Werkzeuge; Team zeigt allgemeine Verwaltungslinks vor der Personenarbeit.

## Prüfmethode

- Browsermatrix: 320 × 568, 390 × 844, 768 × 900, 1024 × 900 und 1440 × 900; identische Daten für Hell/Dunkel; zwei Arbeitsrollen.
- Messungen: Dokumentbreite, Kopf-/Fußflächen, erste nächste Handlung, erster Kontaktdatensatz, vollständig sichtbare Zeilen, sichtbare Touchflächen und berechnete Text-/Hintergrundkontraste.
- Kontaktablauf: Filter abbrechen/anwenden, Fokus, Kontaktsuche, Bearbeiten/Speichern und Rückkehr zur erhaltenen Liste; fehlende Nummer, Langname, keine Treffer und Detailreiter.
- Fachliche Abläufe: Ergebnis von Heute, Terminanlage mit Europe/Berlin-Zeit und Wiederfinden, getrennte persönliche und Teamwerte sowie Partnervereinbarungen.
- Assistent: Öffnen ohne Mikrofon, gemischte Vorschlagsbearbeitung mit Datenbankprüfung, manueller Ersatzweg bei lokalem Providerfehler und Abbruch einer verzögerten Mikrofonfreigabe.
- Zugänglichkeit: Menüs in zwei Betätigungen, Tab/Escape/Fokusrückgabe, kurzer mobiler Viewport und 200 Prozent Textskalierung. Die kurze Höhe simuliert den verfügbaren Platz; eine reale Bildschirmtastatur ist damit nicht abgenommen.
- Vorführmodus: sichtbare Textknoten werden pro Browserframe während verzögerter Hydration erfasst, anschließend Navigation und neue Kontakt-/Partnerdetails geprüft.

Die Vorher-/Nachher-Galerie liegt in [vergleich.html](../test-results/hubspot-masterplan/vergleich.html). Die Baseline bleibt unverändert. Ein früher Zwischenlauf für die bereits fertigen Hauptseiten wurde beim noch laufenden Umbau der Kontaktliste durch eine temporär fehlende Datei beendet; dieser Zwischenstand wird nicht als finaler Produktfehler gewertet.

## Ergebnisse und sichtbarer Unterschied

Die abschließende Matrix umfasst **140 Ansichten**: sieben Bereiche, zwei Rollen, fünf Breiten und zwei Darstellungen. Dazu gehören 70 helle Vollseiten und vier aktuelle Leer-/Onboarding-Aufnahmen. Alle Größenkriterien sind erfüllt; in der finalen vollständigen Matrix entstanden **keine Browserfehler und keine horizontale Seitenausdehnung**. Die Kontaktansicht wurde nach einer abschließenden Kontrastkorrektur separat aufgefrischt; die übrigen 120 Messungen bleiben aus dem vollständigen finalen Lauf erhalten.

Die zusammengeführte Abnahme meldet **keine offenen Befunde**, keine zu kleinen gemessenen zentralen Bedienflächen und keine Unterschreitung der gemessenen Textkontraste. Die Berechnung verwendet die tatsächlich gerenderten Vorder-/Hintergründe einschließlich Transparenz und unterscheidet kleine und große Schrift. Beispielsweise erreicht der gefüllte Termin-Knopf im finalen Datensatz **5,35:1** bei benötigten 4,5:1.

| Prüfpunkt | Vorher | Nachher | Ziel |
| --- | --- | --- | --- |
| Heute, 390 px, nächste konkrete Handlung | Allgemeiner Einstieg verdrängt Tagesarbeit | Beginn bei **156,6 px** | ≤ 240 px |
| Kontakte, 390 px, erste Person | Erster Namenslink bei 724,5 px | Ganze erste Zeile ab **274 px**, **4** vollständige Zeilen | ungefähr ≤ 300 px, mindestens 3 Zeilen |
| Kontakte, 1440 px, erste Person | Erster Namenslink bei 659,7 px | Tabellenzeile ab **273,6 px**, **10** vollständige Zeilen | ungefähr ≤ 280 px, mindestens 8 Zeilen |
| Kontakte, 320 × 568 px | Kein belegtes Mengenziel der alten Ansicht | **1** vollständige Zeile; Suche, Filter, Navigation bedienbar | mindestens 1 Zeile |
| Fester mobiler unterer Bereich | rund 147,4 px | **117 px** | ungefähr ≤ 120 px |
| Mobiler Kopf | mehrere konkurrierende Einstiege | **57 px** einschließlich Linie | ungefähr 56 px |

Die Vorher-Werte bei Kontakten beziehen sich auf den damals gemessenen Namenslink; die Nachher-Werte auf den Beginn der vollständigen Personenzeile. Die Screenshots ermöglichen zusätzlich den direkten visuellen Vergleich. Der Desktop verwendet eine seitliche Navigation von 220 px. Bei 768 px sind fünf vollständige Kontaktzeilen sichtbar, bei 1024 px neun.

| Bereich | Geprüfte Verbesserung |
| --- | --- |
| Heute | Konkrete nächste Handlung zuerst, höchstens drei fällige Aufgaben mit funktionierendem Zugang zu allen, Kalenderzugang und kommende Termine im Arbeitsbereich. Eigengeschäft, Führung, gemischter Fokus und reguläre Startphase unterscheiden sich innerhalb derselben Oberfläche. |
| Kontakte | Kompakte mobile Personenzeilen und Desktop-Tabelle. Suche und Filter stehen direkt über Daten; fehlende Nummer und Status sind beschriftet. Lange Namen umbrechen. |
| Kontaktdetail und Bearbeiten | Name, Status und Kontaktaktionen erscheinen zuerst. Übersicht/Aktivitäten/Details, Kontaktbezug, Speicherung und Rückkehr in die erhaltene Suche funktionieren. |
| Kalender | Zeitraum und Eintrag sind im ersten Bildschirm sichtbar; Monat/Woche/Tag/Agenda bleiben erreichbar. Terminanlage, Berliner Zeit und Kontaktbezug wurden mit gespeicherten Daten verglichen. |
| Fortschritt | Persönliches Ziel vor Werkzeugverzeichnis. Eigene Leistung und Teamwert bleiben getrennt: im Ausgangsfall 6 von 20 gegenüber 6 von 100. |
| Team | Drei konkrete Partner samt nächster Absprache vor allgemeinen Werkzeugen; Zugang zu allen vier direkten Partnern. Begleiten/Auswertung/Struktur sowie Vorführmodus bleiben erreichbar. |

## Funktionsabnahme

**17 unterschiedliche Szenarien sind nachweislich bestanden.** Die fünf Pflichtabläufe des Masterplans sind enthalten: Heute zum gespeicherten Ergebnis, gefilterter Kontaktablauf mit erhaltenem Rückweg, Termine einschließlich Kontaktbezug, getrennte Ziele/Partner/Vereinbarungen sowie Jarvis mit manueller Vorschlagskorrektur.

Zusätzlich geprüft wurden: Laden und keine Suchtreffer; fehlende Telefonnummer und Langname; fehlgeschlagener Speicherversuch mit erhaltenen Eingaben und erfolgreichem einmaligem Retry; alle fünf Navigationsziele; Werkzeuge in zwei Betätigungen; Fokusschleife, Escape und Fokusrückgabe; geschützter Zugriff auf fremden Kontakt; maximal drei Aufgaben und die echte vollständige Aufgabenliste. Der native Filterdialog und der bestehende Termindialog halten den Fokus und stellen ihn wieder her.

Bei 200 Prozent Textgröße bleiben die primären Aktionen in allen sieben Bereichen erreichbar. Die zusätzliche kurze Höhe wurde bei 320 × 380 geprüft. Eine gezielte Simulation setzte `visualViewport.height` auf 430 px: Eingabefokus blendete das Dock aus, die Dialoghöhe blieb höchstens 430 px, nach Verlassen und Wiederherstellen erschien das Dock wieder. Das ist ausdrücklich eine **Browser-Simulation der Bildschirmtastatur**, keine Prüfung auf Hardware.

Der Vorführmodus wurde während verzögerter Hydration pro Browserframe auf sichtbar gerenderte Klarnamen geprüft, danach auf Heute, Kontaktliste, Kontaktdetail, Team und Partnerdetail. Dabei wurde kein sichtbarer Namensblitz festgestellt. Jarvis öffnete ohne Mikrofonanforderung. Die manuell korrigierte Vorschau speicherte den kontrollierten Wert; bei lokal simuliertem Providerfehler blieb die manuelle Kontaktbearbeitung nutzbar. Ein erst nach Abbruch zurückkehrender synthetischer Mikrofonstream wurde beendet.

Die erwarteten Fehlerantworten der Ausfalltests sind in den Belegen als solche markiert: lokaler HTTP 503 sowie absichtlich abgebrochener Speicherrequest. Es wurden keine unerwarteten Browserfehler beobachtet. Im frühen Zwischenlauf auftretende Testfehler wurden transparent eingeordnet: falscher Radio-/Regionsselektor, falsche erste Erwartung zur Zwei-Tage-Wiedervorlage und nicht als primär markierte ursprüngliche Screenshot-Wiedervorlage. Nur für den mutierenden Heute-Test wird diese Aufgabe als primär markiert; die Vergleichsdaten und die Baseline werden dabei nicht verändert.

Die tatsächlichen Produktbefunde – Dialogfokus an der Tab-Kante, 200-Prozent-Breite der Heute-Spalte und Textkontraste im Datensatz – wurden an die jeweiligen Verantwortlichen gegeben und gezielt nachgeprüft. Die historischen Fehlstände bleiben in den früheren Ergebnisdateien erhalten. Die abschließende Übersicht schließt einen benannten Befund nur, wenn ein späterer Bericht genau dieses Szenario bestanden hat.

## Belege und Reproduzierbarkeit

- [Abschließende zusammengeführte Abnahme](../test-results/hubspot-masterplan/acceptance.json): 17 Szenarien, 140 aktuelle Messungen und transparente Quellen.
- [Finale Bild-/Messmatrix](../test-results/hubspot-masterplan/after/result.json), [gezielte Restabnahme](../test-results/hubspot-masterplan/after-flows/result.json), [historischer erster Gesamtlauf](../test-results/hubspot-masterplan/first-combined-run.json).
- [Interaktive Vorher-/Nachher-Galerie](../test-results/hubspot-masterplan/vergleich.html): alle sieben Bereiche, beide Rollen, 390/1440 px, Hell/Dunkel und helle Vollseiten. Die `ready-*`-Bilder zeigen eigenes Geschäft, `leader-team-*` die Führungsperspektive.
- [Zusätzliche Kalender-/Ziel-/Team-Abnahme](../test-results/hubspot-masterplan/planning-accessibility/result.json): unter anderem 18 Ansichten bei 200 Prozent, kurze aufeinanderfolgende Termine, externer schreibgeschützter Eintrag und 16 Kontrastproben.
- [Bestehende Arbeitsbereich-Regression](../test-results/hubspot-workspace/result.json): sieben Bereiche einschließlich Hilfe/Rechner, fünf Breiten, manuelles Anlegen und gemischte Jarvis-Bearbeitung.
- [264 bestehende Fachprüfungen](../test-results/hubspot-masterplan/domain-tests.log), [16 ergänzende Fachprüfungen](../test-results/hubspot-masterplan/domain-supplement.log), [Live-Browserprüfung mit lokaler Simulation](../test-results/hubspot-masterplan/live-browser.log), [abschließender isolierter Build](../test-results/hubspot-masterplan/build-final.log) und [Lint](../test-results/hubspot-masterplan/lint-final.log). Der tatsächliche Buildausgang wurde gelesen: Kompilierung, Typprüfung, Seitengenerierung und Buildabschluss; keine bloße Wrapper-Erfolgsmeldung.

Der Browser-Harness liegt in `scripts/hubspot-masterplan-browser.mjs`; Funktionsfälle, Metriken, Galerie und Zusammenführung in den gleichnamig präfixierten zusätzlichen Skripten. Der normale Aufruf mit `node --import ./scripts/alias-hook.mjs scripts/hubspot-masterplan-browser.mjs` erstellt eine neue isolierte Umgebung und führt Matrix plus Abläufe aus. Mit `--matrix-only` entfallen Mutationsfälle; `--flows-only` prüft die Abläufe. Eng begrenzte Nachprüfungen können über `--scenario=` ausgewählt werden. Die bestehende Baseline wird nur mit ausdrücklich gesetztem `--baseline` angesprochen.

## Grenzen und Standzuordnung

Die lokale Abnahme bezieht sich auf den gemeinsam bearbeiteten Arbeitsstand auf Basis von `57548123c1edeb2a45320d1fe2f05cb60f229506`. Die Nachher-Berichte tragen deshalb **`workingTreeModified: true`**. Die Kennung ist die Ausgangsbasis, nicht die Behauptung eines bereits darin enthaltenen finalen UI-Commits. Die Integration hat den geprüften Stand anschließend als `aff9233192d0d903fb2bbe05b450cefe162d2765` veröffentlicht. [Umsetzung und Übergabe](hubspot-ui-mobile-umsetzung-2026-09-27.md#veröffentlichung) ordnet Preview-Adresse, fertiges Deployment und die zusätzlich erfolgreiche angemeldete Remoteprüfung aller fünf Hauptbereiche bei 390/1440px eindeutig zu.

Offen bleiben physische iOS-/Android-Geräte, deren tatsächliche Bildschirmtastaturen, Safari sowie reale Mikrofon-/Providerverbindungen. Gemessene Textkontraste und Fokusfälle sind konkrete Prüfbelege, keine vollständige WCAG-Zertifizierung. Die Termine der Vergleichsdaten liegen am Prüftag; mit fortschreitender Uhrzeit können sie auf Heute bereits vergangen sein, während der Kalender dieselben drei gespeicherten Einträge zeigt. Es wurden weder externe Kontaktdaten noch reale Modellanbieter für diese QA verwendet. Diese unabhängige Prüfung hat keine Veröffentlichung ausgelöst.
