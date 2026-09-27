# Ergo_CRM: Masterplan für den nächsten HubSpot-orientierten UI-Ausbau

**Stand:** 27. September 2026 · **Status:** anschließend ausdrücklich zur Implementierung freigegeben · **Ziel:** verbindliche Grundlage und nachvollziehbare Übergabe.

Der folgende Text bewahrt den ursprünglichen Planungsstand. Die spätere Umsetzung, Abnahme und Preview sind in [Umsetzung und Übergabe](hubspot-ui-mobile-umsetzung-2026-09-27.md) dokumentiert; historische Aussagen über fehlende Freigabe oder unveränderte Dateien gelten nur für die ursprüngliche Planungsrunde.

## 1. Auftrag und Leitentscheidung

Die aktuelle Aufteilung ist ein guter Ausgangspunkt. Der Nutzer möchte die fünf Bereiche **Heute, Kontakte, Kalender, Fortschritt und Team** deutlich näher an die Arbeitsweise und die visuelle Klarheit von HubSpot bringen. Das gilt ausdrücklich auch für Mobile. Gewünscht ist eine zusammenhängende, hochwertige Arbeitsoberfläche mit klar priorisierten Inhalten, kompakten Listen und direkten Aktionen.

Diese Sitzung hat ausschließlich recherchiert, den Bestand untersucht und diesen Plan erstellt. **Das Vorliegen dieser Datei allein ist keine Freigabe zur Implementierung.** Nach einem ausdrücklichen Umsetzungsauftrag kann die nächste Sitzung die beschriebenen Pakete selbstständig abarbeiten. Zusätzliche Freigaben pro Paket sind nicht vorgesehen.

**Die zentrale Designentscheidung:** Die gemeinsame Navigation bleibt bestehen. Innerhalb jeder Seite rücken die tatsächlichen Arbeitsobjekte nach vorn: Aufgaben auf Heute, Personen unter Kontakte, Termine im Kalender, Ziele unter Fortschritt und Partner unter Team. Große Einleitungskarten und Werkzeugverzeichnisse werden durch kompakte Seitenköpfe, Listen, Abschnittsüberschriften und kontextbezogene Aktionen ersetzt.

„Wie HubSpot Mobile“ bedeutet hier eine gezielte Übertragung auf die bestehende mobile Webanwendung. Eine eigene native iOS-/Android-App oder eine technische HubSpot-Anbindung gehört nicht zum Auftrag.

### Verbindlich zu erhalten

- Die fünf Navigationsziele, ihre Reihenfolge und die vorhandenen Routen.
- „Namen sammeln“ als dauerhaft erreichbarer Kernablauf; die geführte Sammlung und die einzelne Kontakterstellung bleiben unterscheidbar.
- Mini-Emil in seiner vereinbarten Rolle als eingebetteter Coach.
- Die eigene Navy-/Blau-Farbwelt, Identität und deutsche Fachsprache.
- Die drei Arbeitsweisen: vollständig manuell, mit Jarvis und im Wechsel zwischen beiden.
- Bestehende Berechtigungen, Datenabgrenzungen, Ergebnisaktionen, Wiedervorlagen und die bereits integrierten Jarvis-Verbesserungen.

Die aktuelle HubSpot-Vorgabe hat Vorrang vor älteren allgemeinen Empfehlungen, das Gesamtprodukt an ChatGPT oder Claude auszurichten. Einzelne Gesprächsinteraktionen können weiterhin davon profitieren.

## 2. Belastbare Ausgangsbasis und Grenzen der Prüfung

| Gegenstand | Festgestellter Stand |
| --- | --- |
| Projekt | `C:\Users\adrie\Desktop\Business\Ergo_CRM` |
| Ausgangsbranch | `codex/hubspot-jarvis-preview` |
| Geprüfter Commit | `57548123c1edeb2a45320d1fe2f05cb60f229506` |
| Arbeitskopie vor dieser Planung | Sauber; keine offenen Änderungen im Arbeitsverzeichnis angezeigt. |
| Bestehende Preview | [Ergo_CRM Preview](https://ergo-crm-git-codex-hubspot-j-40b920-adrienwottke-7137s-projects.vercel.app) |
| Bestehende Gestaltungsgrundlage | `docs/produkt-design-hubspot.md` |
| Bestehende UI-Abnahme | `docs/hubspot-workspace-abnahme-2026-09-27.md` und zugehörige Abbildungen |
| Release-Kontext | `docs/preview-release-2026-09-27.md`; historische Aussagen anderer Dokumente über ausschließlich lokale Änderungen nicht als aktuellen Release-Status übernehmen. |

**Untersuchungsmethode:** Quelltextprüfung der gemeinsamen Oberfläche und aller fünf Hauptbereiche; visuelle Prüfung vorhandener Screenshots von Heute, Kontakte, Kontaktdetail und Kalender in mobilen und Desktop-Ansichten; erneute Recherche offizieller HubSpot-Dokumentation einschließlich ihrer UI-Abbildungen.

Die visuellen Befunde beziehen sich auf die lokalen Abnahmebilder vom 27. September. Die angemeldete aktuelle Preview wurde für diesen Plan nicht erneut vollständig durchgeklickt. **Fortschritt und Team wurden anhand des aktuellen Quelltexts beurteilt; für diese beiden Seiten fehlt in dieser Planungsrunde eine frische visuelle Abnahme.** Diese Lücke ist im ersten Umsetzungspaket zu schließen.

Beispielbelege im Repository:

- [Kontakte auf Mobile](design/hubspot-workspace-2026-09-27/contacts-390-light.png)
- [Kontakte auf Desktop](design/hubspot-workspace-2026-09-27/contacts-1440-light.png)
- [Heute auf Desktop](design/hubspot-workspace-2026-09-27/today-1440-light.png)
- [Kontaktdetail auf Desktop](design/hubspot-workspace-2026-09-27/record-1440-light.png)
- [Kalender auf Desktop](design/hubspot-workspace-2026-09-27/calendar-1440-light.png)

Zusätzlich betrachtet: `test-results/hubspot-workspace/today-390-light.png`, `calendar-390-light.png` und `record-390-light.png`. Diese lokalen Testartefakte sind möglicherweise nicht in einer anderen Arbeitskopie vorhanden. Die folgenden Befunde sind deshalb auch ohne diese Dateien beschrieben.

## 3. Was wir von HubSpot übernehmen

Die folgenden Beobachtungen stammen aus offiziellen Quellen. Die konkrete Gestaltung für Ergo in den späteren Kapiteln ist unsere eigene Übertragung. HubSpot-Oberflächen unterscheiden sich nach Plattform, Berechtigung und Produktstand; wir kopieren deshalb weder eine beliebige Screenshot-Navigation noch einzelne Beta-Ansichten als vermeintlich universellen Standard.

| Offizielle Referenz | Relevante Beobachtung | Konsequenz für Ergo |
| --- | --- | --- |
| [Datensätze in der HubSpot Mobile App](https://knowledge.hubspot.com/records/work-with-records-in-the-hubspot-mobile-app) | Mobile Listen verbinden Ansichten, Suche, Filter und Sortierung. Datensätze haben direkte Aktionen und getrennte Bereiche für Aktivitäten, Eigenschaften und Beziehungen. Abbildungen der Kontaktliste und Aktivitätsansicht wurden betrachtet. | Kompakte Kontaktliste; verständliche Reiter im Detail; Aktionen beim jeweiligen Datensatz. Keine Übernahme zusätzlicher CRM-Objekte. |
| [Mobiler Action Feed](https://knowledge.hubspot.com/prospecting/use-the-action-feed-in-the-hubspot-mobile-app) | Die mobile Arbeitsübersicht führt zu anstehenden Aufgaben und Terminen. Kontext kann in einer unteren Detailfläche erscheinen. Die Terminansicht wurde betrachtet. | Heute konzentriert sich auf konkrete Arbeit. Kurze Filter und Auswahlvorgänge können auf Mobile eine untere Bedienfläche verwenden. |
| [Datensätze anzeigen und filtern](https://knowledge.hubspot.com/records/view-and-filter-records) | Listenansichten kombinieren Datensatztabelle, Ansichten und Filter. Die abgebildete Desktop-Filteransicht wurde betrachtet. | Kontakte erhält auf Desktop eine echte Tabelle mit kompaktem Werkzeugbereich. Mobile verwendet dafür eine eigene Zeilendarstellung. |
| [Aktivitäten im aktualisierten Sales Workspace](https://knowledge.hubspot.com/sales-workspace/manage-sales-activities-in-the-updated-sales-workspace) | Zusammenfassung, Aufgabenbearbeitung und Terminplanung sind zusammenhängende Arbeitsbereiche. | Heute, Kontakte und Kalender erhalten nachvollziehbare Übergänge und zeigen denselben fachlichen Zustand. |
| [HubSpot-Navigation](https://knowledge.hubspot.com/help-and-resources/a-guide-to-hubspots-navigation) | Globale Werkzeuge und die Bereichsnavigation haben wiederkehrende Orte. | Eine gemeinsame Kopfzeile, fünf stabile Bereiche und verlässlich erreichbare Suche/Jarvis. |
| [Breeze Assistant](https://knowledge.hubspot.com/ai/use-breeze-assistant) | Ein global erreichbarer Assistent ergänzt die Arbeit im jeweiligen Kontext. | Der bestehende Jarvis-Einstieg und sein Panel werden in die neue Hierarchie eingebunden. |

Für die Datensatzansicht gelten weiterhin die in `docs/produkt-design-hubspot.md` dokumentierten Unterschiede zwischen klassischem Layout und damals beschriebener neuer Beta-Ansicht. Vor einer späteren Umsetzung ist der aktuelle Status erneut zu prüfen. Die hier vorgeschlagene Ergo-Struktur benötigt keine Beta-Funktion.

Nicht Bestandteil dieses Ausbaus sind ein allgemeiner Filterbaukasten, neue gespeicherte Ansichten in der Datenbank, frei verschiebbare Dashboard-Widgets oder zusätzliche HubSpot-Module. Ihr Nutzen ist für diesen Auftrag nicht belegt.

## 4. Diagnose: Wo der aktuelle Ausbau noch nicht trägt

**Was bereits funktioniert:** gemeinsame Navigation, wiedererkennbare Farben, vorhandener globaler Jarvis-Zugang, Kontaktabläufe und eine technische Basis für Listen, Kalender und unterschiedliche Arbeitslagen. Diese Grundlage wird weiterentwickelt.

| Bereich | Konkreter Befund | Auswirkung | Priorität |
| --- | --- | --- | --- |
| Gemeinsame Oberfläche | Kopfzeile, zusätzliche Seitentitel, große Karten, runde Reiter und Aktionsblöcke verwenden unterschiedliche Hierarchien. Die neue gemeinsame Gestaltung liegt über weitgehend bestehenden Seitenstrukturen. | Das Produkt wirkt beim Wechsel zwischen Bereichen noch uneinheitlich. | P0 |
| Heute, Mobile | Im untersuchten Bild folgen auf Kopf und Seitentitel ein Jarvis-Block und eine große Namen-sammeln-Karte. Die konkrete nächste Aktion beginnt erst weit unten; weitere Arbeit verschwindet hinter der unteren Navigation. | Ein arbeitsbereiter Nutzer muss zuerst an mehreren Einstiegen vorbei. | P0 |
| Kontakte, Mobile | Seiteneinleitung, Ansichten, großer Filterbereich und Anrufhinweis stehen vor der Liste. Im 390px-Bild beginnt der erste Kontakt ungefähr bei 714px. | Die wichtigste Information ist auf dem ersten Bildschirm kaum sichtbar. | P0 |
| Kontakte, Desktop | Der erste Datensatz beginnt im untersuchten Bild ungefähr bei 640px. Die Zeilen haben keine ausgeprägte tabellarische Vergleichsstruktur. | Viel Bildschirmfläche wird vor der eigentlichen Arbeit verbraucht. | P0 |
| Kontaktdetail | Auf Mobile konkurrieren Jarvis, Bearbeiten, prominent sichtbares Löschen und Sprunglinks. Nächste Aktion und Wiedervorlage können denselben Sachverhalt mehrfach darstellen. | Die primäre Kontaktarbeit hat keine eindeutige Reihenfolge. | P0 |
| Kalender | Große Bedienelemente, Leerzustand und erklärender Text beanspruchen viel Raum. Der zeitliche Kontext ist weniger dominant als die Seiteneinleitung. | Termine und Tagesplanung fühlen sich weniger unmittelbar an. | P1 |
| Fortschritt, Quelltextbefund | Mehrere große Werkzeuglinks stehen vor den persönlichen aktiven Zielen. | Die Seite startet als Auswahlmenü, obwohl der Titel einen Überblick über Fortschritt verspricht. | P1 |
| Team, Quelltextbefund | Teamziele, Struktur und Verwaltungslinks beanspruchen früh Platz. Partnerarbeit ist auf mehrere nachfolgende Abschnitte verteilt. | Führungskräfte müssen die relevante Person oder Vereinbarung erst suchen. | P1 |

Die Pixelangaben beschreiben einzelne vorhandene Testbilder, keine universellen Laufzeitmessungen. Sie begründen die Priorität; verbindliche neue Messungen erfolgen mit einheitlichen Testdaten.

## 5. Gemeinsame Oberfläche: konkrete Gestaltungsregeln

### 5.1 Mobile zuerst

**Kopfzeile:** ungefähr 56px hoch, mit Bereichstitel, globaler Suche, klar beschriftetem „Jarvis“ und einem echten Werkzeugmenü. Der Titel wird nicht direkt darunter noch einmal als großer Block wiederholt. Bei Kontaktdetails ersetzt eine Zurück-Aktion den Bereichseinstieg; der vollständige Kontaktname darf im Datensatzkopf umbrechen.

Das Werkzeugmenü enthält unter anderem Profil, Hilfe und Zinsrechner. Diese Ziele bleiben von jeder Hauptseite mit höchstens zwei bewussten Betätigungen erreichbar. Kein funktionsloses Menü-Icon. Die Kopfzeile muss bereits bei 320px ohne abgeschnittene Bedienelemente funktionieren.

**Untere Navigation:** Heute · Kontakte · Kalender · Fortschritt · Team. Beschriftungen bleiben sichtbar; ein einheitlicher Satz von Symbolen und eine ruhige aktive Markierung ersetzen konkurrierende Formen. Aktiver Zustand wird zusätzlich zur Farbe kenntlich gemacht.

**Namen sammeln:** eine dauerhafte, kompakte Aktionszeile direkt oberhalb der Navigation. Zielhöhe 44–48px. Die Navigation erhält ungefähr 64px; der gesamte untere Bereich soll bei normaler Schrift höchstens etwa 120px zuzüglich Geräte-Sicherheitsabstand benötigen. Der Seiteninhalt bekommt den passenden unteren Abstand. Keine zusätzliche große Sammlungskarte im Standardzustand eines arbeitsbereiten Nutzers.

Ein sachlich nötiger Onboarding-Hinweis bleibt bei Nutzern in der entsprechenden Startphase erhalten. Er orientiert sich am tatsächlichen Startzustand. Die bloße Existenz des Sammelablaufs rechtfertigt keine permanente zweite Werbekarte.

**Kurze Eingriffe:** Filter, Datumsauswahl und wenige zusätzliche Aktionen dürfen als untere Bedienfläche erscheinen. Sie brauchen eine Überschrift, eine sichtbare Schließen-Aktion, korrektes Fokusverhalten und eine sinnvolle Höhe bei Bildschirmtastatur. Umfangreiche Formulare und Kontaktarbeit erhalten eine vollständige Ansicht.

### 5.2 Desktop und mittlere Breiten

- Ab dem vorhandenen Desktop-Umschaltpunkt von 1100px bleibt eine sichtbare, beschriftete Seitenleiste. Richtwert für den nächsten Entwurf: 220px. Erst anhand echter Inhalte entscheiden, ob eine Änderung gegenüber den heutigen 196px nötig ist.
- Die globale Kopfzeile bleibt kompakt. Seitenköpfe zeigen Titel, kurzen Kontext und höchstens eine deutlich hervorgehobene Hauptaktion.
- Listen nutzen die Arbeitsbreite. Ein schmal zentrierter Kartenstapel ist kein Standard für Kontakte oder Tagesarbeit.
- Heute darf Aufgaben und Termine nebeneinander zeigen. Kontaktinformationen können neben dem Aktivitätsbereich stehen, solange beide lesbar bleiben.
- Bei geöffnetem Jarvis-Panel entscheidet die verbleibende Inhaltsbreite über das Layout. Ein bereits etwa 420px breites Panel darf keine unlesbare Dreifachspalte erzeugen. Zusätzliche Details weichen in Reiter oder eine überlagernde Ansicht aus.
- Zwischen Mobile und Desktop wird die Dichte nach verfügbarer Inhaltsbreite angepasst. Tablet ist ein eigener Prüffall; keine starre Annahme „768px ist Desktop“.

### 5.3 Visuelle Grammatik

Die folgenden Werte sind **Ergo-Entwurfsziele**, keine behaupteten HubSpot-Design-Tokens:

| Element | Zielregel |
| --- | --- |
| Flächen | Ruhiger neutraler Hintergrund, klar getrennte Inhaltsflächen, überwiegend feine Linien statt vieler gerahmter Einzelkarten. |
| Farbe | Vorhandenes Navy/Blau; Akzent für Auswahl und Hauptaktion. Statusfarben ausschließlich mit Text/Bedeutung. |
| Schrift | Mobile Seitentitel ungefähr 20px, Desktop 24–28px; regulärer Text und Eingaben ungefähr 16px; Zusatzinformationen 12–14px bei ausreichender Lesbarkeit. |
| Abstände | Gemeinsame Abstufung 4/8/12/16/24/32px; größere Abstände zwischen Aufgabenbereichen, kleinere innerhalb eines Datensatzes. |
| Formen | Bedienelemente ungefähr 6–8px, Flächen 8–10px Rundung. Vollständig runde Formen vor allem für kurze Statusmarkierungen. |
| Dichte | Desktop-Datensätze ungefähr 52–64px; mobile Personenzeilen ungefähr 80–96px bei normaler Schrift. Mehrzeilige Inhalte dürfen wachsen. |
| Bedienung | Touch-Flächen mindestens 44px; zentrale mobile Aktionen möglichst 48px. Sichtbarer Tastaturfokus und klare Beschriftung. |
| Bewegung | Kurze, zweckgebundene Übergänge; reduzierte Bewegung respektieren. Kein künstlicher Ladefortschritt. |
| Dunkle Darstellung | Gleichwertige semantische Farben für Text, Fläche, Rand, Fokus und Status. Keine verstreuten fest verdrahteten hellen Slate-Flächen. |

Gemeinsame Komponenten erhalten gezielte Varianten. Pauschale CSS-Regeln gegen Klassen wie `.rounded-2xl` sollen die neue Gestaltung nicht dauerhaft tragen. Bestehende Nutzereinstellungen zur Darstellung bleiben erhalten.

## 6. Die fünf Bereiche als fertiges Seitenkonzept

### 6.1 Heute: Tagesarbeit mit eindeutiger Reihenfolge

**Frage der Seite:** Was sollte ich als Nächstes erledigen, und was steht heute an?

Reihenfolge für einen arbeitsbereiten Nutzer:

1. Kompakter Tageskontext mit Datum und vorhandener Arbeitslage.
2. Konkrete nächste Aktion anhand der bestehenden fachlichen Priorisierung: Person, Anlass, Fälligkeit und direkte Handlung.
3. Arbeitsliste mit kurzen Kategorien, beispielsweise fällig/heute/später, soweit die bestehenden Daten diese zuverlässig liefern. Zunächst höchstens drei Einträge, darunter „Alle … anzeigen“ mit tatsächlicher Anzahl und erreichbarer Gesamtliste.
4. Nächste Termine, auf Mobile zunächst maximal zwei, mit direktem Übergang zum Kalender oder zu vorhandenen Kontaktaktionen.
5. Kompakter Fortschritt; bei relevanter Führungsrolle zusätzlich Partner, bei denen eine bestehende Vereinbarung oder Aufgabe ansteht.
6. Weiterführende Werkzeuge und Coaching im passenden Kontext.

Der ausdrücklich gewünschte Einstieg **„Mit Jarvis sprechen“** bleibt sichtbar, erhält aber eine kompakte Zeile statt einer dominanten zusätzlichen Karte. Er öffnet den bestehenden Weg; das Mikrofon startet weiterhin erst bewusst innerhalb der Gesprächsansicht.

Die bestehende Fachlogik für „nächste Aktion“ wird nicht durch eine neue UI-Sortierung ersetzt. Eigengeschäft, gemischte Arbeit und Führungsarbeit verwenden dieselben erkennbaren Inhaltszonen mit rollengerechtem Inhalt. Unpassende Bereiche entfallen; es entstehen keine leeren Dekorationskarten.

**Zielbild Mobile, schematisch:**

```text
[Menü] Heute                  [Suche] [Jarvis]
So., 27. September · bestehende Arbeitslage
Mit Jarvis sprechen                              >

ALS NÄCHSTES
Person · vorhandener Anlass
[Passende direkte Aktion]

DEINE AUFGABEN                       Alle 7 >
Person · konkrete Aufgabe · heute
Person · konkrete Aufgabe · heute
Person · konkrete Aufgabe · später

NÄCHSTE TERMINE                      Kalender >
Uhrzeit · Person · Anlass

[Namen sammeln]
[Heute] [Kontakte] [Kalender] [Fortschritt] [Team]
```

Die Namen, Zahlen und Inhalte im Schema sind Platzhalter. Produktiv werden ausschließlich echte vorhandene Daten angezeigt. Der Zinsrechner bleibt erreichbar, belegt aber keinen großen Standardblock vor den Tagesaufgaben.

### 6.2 Kontakte: sofort eine brauchbare Liste

**Frage der Seite:** Wen suche ich, wie ist der Stand und was kann ich direkt tun?

**Mobile:** Bereichskopf → bestehende Ansichten Verkauf/Recruiting → kompakte Suche und Filterknopf mit aktiver Filteranzahl → kurze Ergebnisanzahl → Personenliste. Die vorhandenen Status- und Telefonfilter wandern in eine kurze Filteransicht. „Anwenden“ gehört dorthin. Abbrechen verwirft die dort noch nicht angewendeten Änderungen.

Eine Personenzeile zeigt Name, verständlichen Status und die wichtigste vorhandene nächste Information. Anruf ist erreichbar, wenn eine nutzbare Nummer vorliegt. „Mehr“ und Datensatzöffnung bleiben getrennte, ausreichend große Ziele. Kein verschachteltes Button-in-Link-Verhalten.

**Desktop:** eine kompakte Werkzeugzeile und eine echte Tabelle. Vorgeschlagene Spalten: Name, Status, Telefon, nächster Schritt/Fälligkeit und Aktionen. Eine zusätzliche Spalte nur, wenn sie aus bestehenden Daten sinnvoll vergleichbar ist. Zeilen erhalten dezente Trennlinien und eindeutige Überschriften.

Die bestehende stabile Reihenfolge bleibt zunächst erhalten. Eine automatisch nach jeder Bewertung springende Liste wäre eine fachliche Verhaltensänderung und ist nicht Teil des UI-Ausbaus. Ein allgemeiner Sortier- oder Ansichtenbaukasten gehört ebenfalls nicht in dieses Paket.

**Verbindliche Zustände:** ungefiltert leer, keine Suchtreffer, aktive Filter, fehlende Telefonnummer, Laden, Ladefehler und lange Namen. Ein Filter-Reset ist direkt verständlich. Eine große allgemeine Anrufempfehlung steht nicht mehr zwischen Filtern und Datensätzen.

**Rückkehr:** Suche, Liste und Filter bleiben beim Öffnen eines Kontakts und beim Zurückgehen erhalten. Die bestehende URL-Prüfung in `lib/contact-navigation.ts` erlaubt nur definierte Parameter; zusätzliche Parameter erfordern eine bewusste Anpassung und einen passenden Verhaltenstest.

### 6.3 Kontaktdetail: Identität, Handlung, Verlauf

Dieser Ablauf gehört zum Kontakte-Paket und ist für die Glaubwürdigkeit des gesamten Ausbaus entscheidend.

- Oben: vollständiger Name, Status und relevante Kontaktinformation; klarer Rückweg zur vorherigen Liste.
- Direkte Aktionen: Anrufen, Notiz und Wiedervorlage, soweit im Bestand unterstützt. Bearbeiten und weitere Aktionen bleiben schnell erreichbar.
- Löschen wird in „Mehr“ eingeordnet und behält die vorhandene Bestätigung. Die destruktive Aktion prägt nicht mehr den ersten Bildschirm.
- Mobile erhält die nachvollziehbaren Bereiche **Übersicht, Aktivitäten, Details**. Der gewählte Bereich, Zurück-Navigation und Fokus verhalten sich konsistent. Noch nicht unterstützte Aktivitätstypen werden nicht als fertige Funktionen angeboten.
- Übersicht zeigt nächste Schritte und Termine. Aktivitäten bündelt vorhandenen Verlauf/Notizen. Details enthält vorhandene Eigenschaften und Bearbeitungszugänge.
- Desktop zeigt den Arbeitsbereich neben einer lesbaren Informationsspalte; die mobile Reiterstruktur kann bei wenig Restbreite wiederverwendet werden.
- Doppelte Darstellung desselben nächsten Schritts wird visuell zusammengeführt. Mehrere echte Wiedervorlagen bleiben einzeln erreichbar; keine Daten werden dafür gelöscht oder zusammengelegt.
- Vorhandene Phasen-, Ergebnis- und Abschlussaktionen bleiben vollständig erreichbar.
- Jarvis zeigt den tatsächlich verwendeten Kontaktkontext. Ein Wechsel des Kontakts darf nicht unbemerkt einen anderen Gesprächsbezug behaupten.

### 6.4 Kalender: Datum und Termine im Vordergrund

**Frage der Seite:** Wann ist mein nächster Termin, und wo kann ich etwas eintragen?

**Mobile:** kompakter Kopf mit „Eintrag“, gut lesbares ausgewähltes Datum, Vor/Zurück/Heute und darunter die Termine. Die bestehende Listenansicht kann sichtbar „Agenda“ heißen; ihre vorhandene URL-Bedeutung bleibt erhalten. Wochen-/Tagesauswahl wird kompakt dargestellt. Monats-, Wochen-, Tages- und Listenansicht bleiben erreichbar.

Die gespeicherte Ansicht wird respektiert. Eine neue kompakte mobile Voreinstellung darf keine bewusste Nutzerwahl bei jedem Besuch überschreiben. Eine Wochenleiste ist nur sinnvoll, wenn sie mit der vorhandenen Datumslogik und ausreichend großen Touch-Zielen umgesetzt werden kann; sie ist keine Voraussetzung für das erste Paket.

**Desktop:** Datum und Ansichtswechsel in einer gemeinsamen Werkzeugzeile, Kalenderfläche darunter. Bestehende Termine und freie Fläche haben Vorrang vor Erklärungskarten.

Leere Tage erhalten einen kurzen konkreten Zustand und die passende Eintragsaktion. Hinweise zur Handy-Kalenderanbindung oder TimeTree stehen in „Kalender verbinden“ beziehungsweise den zugehörigen Einstellungen. Sichtbare Herkunft und Bearbeitbarkeit externer Einträge bleiben korrekt.

Die bestehende Zeitzone Europe/Berlin, Tagesgrenzen, Sommerzeitbehandlung und Speicherung der Ansicht werden nicht verändert. Kein neuer Kalenderdienst, kein Drag-and-drop-Versprechen und keine vorgetäuschte Bearbeitung externer Termine.

### 6.5 Fortschritt: Ziele und tatsächlicher Stand zuerst

**Frage der Seite:** Wo stehe ich gegenüber meinen eigenen Zielen, und was trägt als Nächstes dazu bei?

Neue Reihenfolge:

1. Persönliche aktive Ziele mit tatsächlichem Ist, Ziel und vorhandenem Zeitraum.
2. Ein verständlicher nächster Schritt oder eine Meldung, sofern er aus bestehenden Funktionen ableitbar ist.
3. Relevante bestehende Einheiten-/Trichteransichten als kompakte Navigation oder Abschnitt.
4. Teamziele klar bezeichnet und getrennt von der persönlichen Leistung.
5. Wettbewerb, Mein Warum und frühere Ziele als weiterhin erreichbare ergänzende Bereiche.

Die heutigen großen Werkzeugkarten werden zu einer kompakten, konsistenten Bereichsnavigation. Vorhandene Zielkarten und Berechnungen werden wiederverwendet. Bei fehlenden Zielen erklärt die Seite den nächsten sinnvollen Schritt zur Zielanlage.

Keine erfundenen Trends, Prognosen oder dekorativen Kennzahlen. Verlaufsdiagramme werden nur dargestellt, wenn die Daten dafür bereits belastbar vorliegen. Persönliche Werte bleiben auf den Eigentümer begrenzt. Teamziele dürfen die persönliche Leistung nicht durch eine geänderte Darstellung doppelt einrechnen.

### 6.6 Team: Partnerarbeit vor Verwaltung

**Frage der Seite:** Mit wem sollte ich arbeiten und welche Vereinbarung steht an?

Die bestehenden Bereiche **Begleiten, Auswertung, Struktur** bleiben bestehen und verwenden dieselbe Reitergestaltung wie vergleichbare Seiten.

Unter Begleiten stehen zuerst relevante Partner beziehungsweise bestehende Vereinbarungen und nächste Aktionen. Eine Zeile verbindet Person, tatsächlichen Stand und passenden Einstieg. Zunächst maximal drei priorisierte Einträge, anschließend ein klarer Zugang zu allen berechtigten Partnern. Priorität beruht auf vorhandenen Fälligkeiten oder Regeln, nicht auf einer neu erfundenen KI-Bewertung.

Teamziele ergänzen die Arbeit darunter oder auf Desktop seitlich. Strukturmatrix und administrative Werkzeuge erhalten ihren sachlich passenden Bereich; bestehende Links zu Netzwerkabend, Meldungen und Strukturverwaltung bleiben erreichbar. Eine Verlagerung muss auch ihre bisherigen URLs und Rückwege erhalten.

Für Nutzer ohne eigene Partner zeigt Team den vorhandenen Führungskontakt oder die tatsächlich vorgesehenen nächsten Schritte. Eine Führungskraft sieht ihre zulässigen Partnerbereiche. Sichtbare Bezeichnungen machen den Unterschied zwischen direkten Partnern, weiterer Struktur und persönlicher Leistung verständlich.

Der Vorführmodus bleibt verfügbar. Bei erster Darstellung, Navigation und neu geöffneten Detailflächen dürfen dabei keine unmaskierten Namen kurz aufblitzen. Das ist ein gezielter Prüffall, kein in dieser Planung nachgewiesener neuer Fehler.

## 7. Jarvis und Mini-Emil in der neuen Hierarchie

Ein globaler, beschrifteter Jarvis-Einstieg bleibt auf allen Hauptseiten erreichbar. Kontextbezogene zusätzliche Einstiege werden sparsam dort eingesetzt, wo eine vorhandene Funktion die konkrete Arbeit erleichtert. Mehrere ähnlich gewichtete Jarvis-Karten auf derselben Seite entfallen.

Desktop verwendet das bestehende Panel; Mobile eine fokussierte Gesprächsansicht mit gut erreichbarem Schließen/Zurück. Der Arbeitszustand der aufrufenden Seite bleibt erhalten. Mini-Emil bleibt der eingebettete Coach; es entsteht kein weiterer konkurrierender schwebender Assistent.

Unverändert gelten:

- Öffnen aktiviert kein Mikrofon. „Sprachchat starten“ ist sofort sichtbar und klar von Diktieren unterschieden.
- Mikrofonfreigabe, Aufbau, aktive Sitzung, Stummschaltung und Bearbeitung bilden echte Zustände ab.
- Abbrechen funktioniert auch bei verzögerten Antworten; keine doppelten Starts.
- Bestehende Ausführungsmodi und Standardbestätigungen werden erhalten. Der UI-Ausbau ändert keine Ausführungsbefugnisse.
- Manuelle Änderungen und Jarvis arbeiten auf denselben Datensätzen. Bestätigungen, Belege und Rücknahme bleiben korrekt.
- Ein Providerfehler lässt die manuelle Arbeit weiterhin zu. Eine Simulation wird nicht als echter Provider- oder Mikrofontest ausgegeben.

Die bereits zusammengeführten Jarvis-Arbeiten aus anderen Chats bilden die Ausgangsbasis. Sie werden vor Beginn anhand des aktuellen Repository-Stands verifiziert. Ältere, unvollständige Redesign-Zweige werden nicht pauschal darübergelegt.

## 8. Umsetzung in aufeinander aufbauenden Paketen

Die Reihenfolge ist bewusst festgelegt: gemeinsame Regeln, ein vollständiger Referenzablauf, anschließend alle übrigen Hauptbereiche. Der Ausbau ist erst abgeschlossen, wenn auch Fortschritt und Team nach denselben Regeln überarbeitet wurden.

| Paket | Konkretes Ergebnis | Abhängigkeit und Abschlusskriterium |
| --- | --- | --- |
| 0 · Ausgangsbasis sichern | Aktuellen Branch, offene Änderungen und Arbeiten anderer Chats zuordnen. Alle fünf Bereiche plus Kontaktablauf mit vergleichbaren, anonymisierten Testdaten aufnehmen. Frische Ansichten für Fortschritt und Team ergänzen. | Vor Änderungen. Dokumentierte Bilder für mindestens eine arbeitsbereite Person und eine Führungskraft; Rollen-/Leerzustände benannt. |
| 1 · Gemeinsame Oberfläche | Farben, Abstände, Schrift, Reiter, Werkzeugleisten, Kopfzeile, Navigation und die kompakte Namen-sammeln-Zeile konsistent umsetzen. | Paket 0. Mobile 320/390px und Desktop geprüft; keine verdrängten Hauptfunktionen. |
| 2 · Kontakte vollständig | Liste, Filter, Detail, Bearbeiten und Rückkehr als zusammenhängenden Ablauf umsetzen. Muster für Zeilen, Reiter, Kontext und kurze Dialoge festigen. | Paket 1. Ein Kontakt kann manuell gefunden, geöffnet, bearbeitet und im erhaltenen Listenzustand wiedergefunden werden. |
| 3 · Heute | Tagesarbeit, nächste Aktion, Aufgaben und Termine nach vorn bringen; Rollen und Onboarding sauber unterscheiden. | Gemeinsame Muster aus 1/2. Sichtbare echte Arbeit im ersten Bildschirm; bestehende Priorisierungsregeln erhalten. |
| 4 · Kalender, Fortschritt, Team | Die drei beschriebenen Seitenkonzepte vollständig übertragen; vorhandene Funktionen und Rechte erhalten. | Paket 1/2; Verlinkung mit Heute abstimmen. Jede Seite besitzt eine klare primäre Aufgabe und vollständige Zustände. |
| 5 · Gemeinsame Abnahme | Manuelle, Jarvis- und gemischte Abläufe sowie responsive Ansichten, dunkle Darstellung und Tastaturbedienung prüfen. Vorher-/Nachher-Belege erstellen. | Pakete 2–4. Offene Einschränkungen konkret dokumentiert; keine bloße Aussage „Build grün“. |
| 6 · Übergabe und gegebenenfalls Preview | Änderungsumfang, Prüfergebnisse, Restpunkte und exakten Stand dokumentieren. Eine Preview nur im dann erteilten Veröffentlichungsumfang bereitstellen und prüfen. | Paket 5. Lokale Umsetzung, erfolgreicher Build, veröffentlichte Preview und echte Geräte-/Sprachabnahme getrennt ausweisen. |

Eine kleine Anpassung an einem lokalen Test oder einer gemeinsamen Komponente braucht innerhalb der freigegebenen Umsetzung keine neue Konzeptschleife. Wenn der aktuelle Bestand erheblich von dieser Ausgangsbasis abweicht, wird die Abweichung zuerst eingeordnet und der Plan gezielt angepasst.

### Verantwortungsgrenzen bei späterer Zusammenarbeit

Dieser Plan beauftragt keine neuen Chats oder Agenten. Falls der Nutzer später ausdrücklich parallele Arbeit beauftragt, erhält die gemeinsame Oberfläche genau einen Verantwortlichen. Weitere Arbeiten können danach auf Kontakte/Heute und Kalender/Fortschritt/Team verteilt werden. Gemeinsame Komponenten und Navigationsverträge müssen vor parallelen Änderungen abgestimmt sein. Eine Integration verantwortet anschließend den vollständigen Ablauf und die Abnahme.

## 9. Technische Anknüpfungspunkte im vorhandenen Projekt

Alle folgenden Pfade sind relativ zum oben genannten Projektordner. Sie dienen der nächsten Sitzung als Einstieg; vor Änderungen ist der tatsächliche aktuelle Inhalt zu lesen.

| Bereich | Bestehende Dateien | Geplanter Schwerpunkt |
| --- | --- | --- |
| Gemeinsame Oberfläche | `components/AppShell.tsx`, `components/NavLinks.tsx`, `components/SeitenKopf.tsx`, `components/ui.ts`, `app/workspace.css` | Gemeinsame Hierarchie und gezielte Komponentenvarianten; vorhandene Tokens wiederverwenden. |
| Routen und Listenzustand | `lib/navigation.ts`, `lib/contact-navigation.ts` | Aktive Navigation, erlaubte Rückwege und Filterzustände erhalten. |
| Namen sammeln | `components/NamenSammelnLink.tsx`, `components/NamenSammelnEinstieg.tsx`, `components/NamenSammeln.tsx` | Permanenten Einstieg kompakter einordnen; geführten Ablauf erhalten. |
| Heute | `app/(app)/heute/page.tsx` | Inhaltsreihenfolge und Dichte ändern; bestehende Arbeitslagen und Priorisierung erhalten. |
| Kontakte | `app/(app)/namen/page.tsx`, `app/(app)/contacts/[id]/page.tsx` und vorhandene zugehörige Formulare | Mobile Zeilen, Desktop-Tabelle, Filter, Detailhierarchie und Rückkehr. |
| Kalender | `app/(app)/kalender/page.tsx`, `components/kalender/Umschalter.tsx`, `Agenda.tsx`, `Monatsraster.tsx`, `Zeitraster.tsx` | Gemeinsamer Kopf, kompakte Steuerung und bessere Zustände; vorhandene Kalenderlogik weiterverwenden. |
| Fortschritt | `app/(app)/fortschritt/page.tsx` und dort eingebundene Zielkomponenten | Persönlichen Fortschritt zuerst; Werkzeuge kompakt, Teamwerte getrennt. |
| Team | `app/(app)/mannschaft/page.tsx`, `app/(app)/mannschaft/TeamNavigation.tsx` | Partnerarbeit priorisieren und gemeinsame Reiter nutzen. |
| Vorführmodus | `components/VorfuehrProvider.tsx`, `components/VorfuehrVerdeckt.tsx` | Bestehende Maskierung auf neue Flächen übertragen und früheste Darstellung prüfen. |
| Assistent und Coach | `components/ai-crm/`, `components/coach/MiniEmil.tsx` | Bestehende Öffnungswege, Kontext, Ausführungsmodi und Lebenszyklus bewahren. |
| Bestehende UI-Prüfung | `scripts/hubspot-workspace.test.mjs`, `scripts/hubspot-workspace-browser.mjs` | Aussagekräftige bestehende Prüfungen anpassen; fehlende Kernabläufe ergänzen. |

Mögliche gemeinsame Bausteine sind Bereichsreiter, Listen-Werkzeugleiste, kompakte Arbeitszeile, Leerzustand und mobile Filterfläche. Das sind konzeptionelle Vorschläge, keine Behauptung bereits vorhandener Komponenten. Erst vorhandene Bausteine prüfen, dann ergänzen. Kein paralleles zweites Designsystem.

Für diesen UI-Ausbau ist keine Datenbankmigration geplant. `npm run build` führt im aktuellen Projekt `prisma migrate deploy` aus und ist deshalb kein geeigneter beiläufiger lokaler Prüfschritt. Die nächste Sitzung verwendet den bestehenden isolierten Prüfweg `npm run build:ai:ux:check` nach Prüfung seines aktuellen Verhaltens oder einen ausdrücklich sicheren Projektprüfweg. Den tatsächlichen TypeScript-/Build-Ausgang auswerten; eine Erfolgsmeldung des Wrappers allein reicht nicht.

## 10. Messbare Abnahme

### 10.1 Sichtbarer Fortschritt gegenüber heute

Die folgenden Ziele gelten für feste, dokumentierte Testdaten, normale Schriftgröße und geschlossene Overlays. Bei Schriftvergrößerung hat die vollständige Bedienbarkeit Vorrang vor den Pixelzielen.

| Ansicht | Ziel |
| --- | --- |
| Heute, 390 × 844px, arbeitsbereit | Die erste konkrete nächste Handlung beginnt innerhalb der oberen 240px. Kein großer allgemeiner Einführungsblock verdrängt sie. |
| Kontakte, 390 × 844px, mindestens zwölf Datensätze | Erste Personenzeile beginnt spätestens bei ungefähr 300px; mindestens drei kompakte vollständige Zeilen sind oberhalb des festen unteren Bereichs sichtbar. |
| Kontakte, 1440 × 900px | Erste Tabellenzeile beginnt spätestens bei ungefähr 280px; bei genügend Daten sind mindestens acht Zeilen ohne Seitenscroll sichtbar. |
| Kontakte, 320 × 568px | Mindestens eine vollständige Personenzeile ist im ersten Bildschirm erreichbar/sichtbar; Suche, Filter und Navigation bleiben bedienbar. |
| Kontaktdetail, 390 × 844px | Name, Status und mindestens eine sinnvolle primäre Kontaktaktion erscheinen vor dem ersten längeren Inhaltsblock. |
| Kalender | Ausgewählter Zeitraum und Eintragsaktion sind sofort erkennbar; ein leerer Tag wird kurz und handlungsfähig dargestellt. |
| Fortschritt | Persönlicher Zielstand steht vor dem Verzeichnis der Werkzeuge. |
| Team | Im Bereich Begleiten erscheint relevante Partnerarbeit vor allgemeinen Verwaltungslinks. |

### 10.2 Geräte, Zustände und Zugänglichkeit

Prüfbreiten: **320, 390, 768, 1024 und 1440px**. Zusätzlich kurze mobile Höhe, Bildschirmtastatur und eine breite Ansicht mit geöffnetem Jarvis. Helle und dunkle Darstellung anhand derselben Inhalte vergleichen.

- Keine horizontale Seitenausdehnung; nur ausdrücklich dafür vorgesehene Kalender-/Tabellenflächen dürfen intern scrollen.
- Lange Namen, viele Einträge, kein Eintrag, keine Suchtreffer, fehlende Angaben, Fehler und Ladezustände prüfen.
- Schriftvergrößerung bis 200 Prozent darf keine primäre Aktion unerreichbar machen.
- Tastaturreihenfolge, sichtbarer Fokus, Escape/Schließen und Fokusrückgabe für Menüs, Filterflächen und Jarvis prüfen.
- Status nicht ausschließlich durch Farbe vermitteln; Kontrast der tatsächlich verwendeten Kombinationen messen.
- Feste Kopf-/Fußbereiche dürfen Inhalte, Validierungsfehler oder Formulare bei geöffneter Bildschirmtastatur nicht verdecken.
- Eigengeschäft, Führung, gemischte Arbeit und tatsächliche Onboarding-Zustände durchspielen. Berechtigungen dürfen nicht nur über ausgeblendete Oberfläche abgesichert sein.
- Vorführmodus in den neuen Listen, Details und zunächst gerenderten Ansichten prüfen.

### 10.3 Fünf Pflichtabläufe

1. **Manuell von Heute zum Ergebnis:** nächste Aufgabe öffnen, Person bearbeiten beziehungsweise vorhandene Aktion erledigen und aktualisierten Zustand auf Heute wiederfinden.
2. **Kontakt finden und zurückkehren:** Liste wählen, suchen/filtern, Datensatz öffnen, eine unterstützte Änderung speichern, zur unveränderten Suche zurückkehren.
3. **Terminarbeit:** vorhandenen Termin anlegen oder ändern, im richtigen Zeitraum wiederfinden, Kontaktbezug und Anzeige nach Navigation prüfen. Nur geeignete Testdaten verwenden.
4. **Ziele und Partner:** persönliche Ziele eindeutig von Teamwerten unterscheiden; berechtigte Partner/Vereinbarungen erreichen; Werkzeuge wie Einheiten, Trichter und Struktur weiterhin finden.
5. **Jarvis und gemischte Arbeit:** unterstützten Entwurf beginnen, manuell verändern und mit konsistentem Zustand weiterarbeiten. Öffnen ohne Mikrofonstart, Startabbruch und manuellen Ersatzweg bei Providerfehler prüfen.

Für datenverändernde Tests eine geeignete isolierte Testumgebung verwenden. Eine Preview-Adresse allein ist kein Nachweis für eine isolierte Datenbank. Echte Sprach-/Provider- und Gerätetests gesondert ausweisen; simulierte Browserabläufe ersetzen diese nicht.

### 10.4 Erforderliche Übergabe nach der späteren Umsetzung

- Vergleichbare Vorher-/Nachher-Bilder aller fünf Hauptbereiche sowie des Kontaktablaufs.
- Kurze Erklärung je Seite, welche Hierarchie konkret verbessert wurde.
- Ergebnisse der relevanten vorhandenen Domänen-, Zustands-, Build- und Browserprüfungen; zusätzliche Tests vor allem für geändertes Verhalten, nicht für triviale Stylingdetails.
- Genaue Auflistung ungeprüfter oder eingeschränkter Abläufe.
- Exakter Commit und gegebenenfalls verifizierte Preview-Adresse. Eine Veröffentlichung auf Production ist ein eigener Auftrag.

## 11. Umfang und Priorität

**P0, zuerst:** gemeinsame mobile Hierarchie, kompakte Navigation, Kontakte inklusive Detail/Bearbeiten und eine arbeitsfähige Heute-Seite. Hier ist der belegte Platzverlust am größten.

**P1, Bestandteil dieses Plans:** Kalender, Fortschritt und Team vollständig auf die gemeinsamen Muster bringen; dunkle Darstellung, Zustände und bereichsübergreifende Abnahme abschließen. „P1“ bedeutet nicht, dass diese drei Hauptseiten am Ende unverändert bleiben dürfen.

**Später separat bewerten:** frei konfigurierbare Widgets, neue gespeicherte Ansichten, umfassende Sortierung, Massenaktionen, neue Diagrammdaten, zusätzliche CRM-Objekte oder native Apps. Keines dieser Themen ist Voraussetzung für eine überzeugende nächste UI-Version.

**Fertig ist der Ausbau**, wenn ein arbeitsbereiter Nutzer in jedem der fünf Bereiche unmittelbar relevante Inhalte und passende Aktionen erkennt, die Gestaltung durchgehend zusammenpasst und die vorhandenen manuellen sowie Jarvis-Abläufe zuverlässig erhalten sind.

## 12. Übergabe an eine neue Sitzung

Die neue Sitzung soll diese Datei zuerst vollständig lesen und den aktuellen Projektzustand mit der Ausgangsbasis vergleichen. Zusätzlich sind `docs/produkt-design-hubspot.md`, `docs/preview-release-2026-09-27.md` und die für ihre Änderungen relevanten bestehenden Prüfungen heranzuziehen. Die alten Dokumente liefern Kontext; dieser Plan beschreibt den nächsten gestalterischen Ausbau. Tatsächliche Repository-Daten und neuere ausdrückliche Nutzerentscheidungen haben Vorrang vor historischen Zustandsangaben.

### Starttext für die Umsetzung — erst nach Freigabe verwenden

> Setze den Plan aus `docs/hubspot-ui-mobile-masterplan-2026-09-27.md` im bestehenden Ergo_CRM um. Beginne mit einer kurzen Prüfung des aktuellen Branches, offener Änderungen und der Ausgangsansichten. Erhalte die bereits integrierten Arbeiten aus den anderen Chats. Bearbeite anschließend die beschriebenen Pakete bis zur gemeinsamen Abnahme aller fünf Hauptbereiche und des Kontaktablaufs. HubSpot einschließlich der mobilen App ist die Hauptreferenz; unsere Farben, Fachsprache, Navigation, Namen sammeln, Mini-Emil und Jarvis-Regeln bleiben erhalten. Entwickle keine neue Fachlogik und keine Datenbankmigration als Nebeneffekt dieses UI-Auftrags. Dokumentiere reale Vorher-/Nachher-Ansichten und Prüfergebnisse. Veröffentliche nur in dem Umfang, den ich zusätzlich ausdrücklich beauftrage.

### Wenn diese Datei nur zur weiteren Planung übergeben wird

Ohne ausdrücklichen Umsetzungsauftrag bleibt die neue Sitzung bei Prüfung und Planung. Diese Datei dokumentiert eine konkrete Empfehlung und einen ausführbaren Ablauf, aber keine bereits erfolgte Implementierung oder Abnahme der vorgeschlagenen neuen Gestaltung.
