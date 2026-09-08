# Storno im Onboarding und geführter Start mit Namensammlung

Stand: 08.09.2026. Vollständiger Planungsentwurf; keine Implementierung.

Der Nutzer hat zwei Funktionen beauftragt: das bestehende Storno-Spiel in den Einstieg integrieren und neue Nutzer nach dem Onboarding direkt zur bestehenden geführten Namensammlung führen. Bestätigt ist eine kurze Storno-Runde mit etwa fünf Entscheidungen. Die weiteren Festlegungen dieses Dokuments sind konkrete Umsetzungsvorschläge innerhalb dieses Auftrags. Eine Freigabe zum Programmieren oder Veröffentlichen liegt noch nicht vor.

## 1. Ergebnis und Umfang

Ein neuer Berater soll beim ersten App-Start einen zusammenhängenden Weg erleben: persönlich begrüßt werden, Storno kurz spielen, das bestehende Onboarding durchlaufen und anschließend weitere echte Namen sammeln. Die App bietet danach anhand der vorhandenen Daten einen ausführbaren nächsten Schritt an. Ein Teamleiter muss den Weg nicht erklären.

Der Ablauf richtet sich an neue Berater am Handy. Bestehende Konten werden bei der Einführung der Funktion oder einer erneuten Installation nicht automatisch neu eingewiesen. Der vorhandene separate Führungsablauf bleibt erhalten. Ein neuer Nutzer mit dem Ziel „Team aufbauen“ ist weiterhin im Beraterablauf; die Wahl der Recruiting-Liste macht ihn nicht automatisch zum Nutzer des Führungsablaufs.

Zum Umfang gehören die Storno-Kurzrunde, der direkte Übergang zur Sammlung, kurze Hilfen während der Benutzung, das Fortsetzen nach Unterbrechungen und der Anschluss an Nummernergänzung und Heute. Der vollständige Navigations- und Gestaltungsumbau gehört zur parallelen Planung „Plan Ergo CRM Redesign“. Bestehende Komponenten und Gedächtnisstützen bilden die Grundlage.

Nicht Bestandteil dieser ersten Umsetzung sind eine neue Spiel-Engine, ein neuer KI-Assistent, ein automatischer Telefonbuchimport, zusätzliche Gamification oder eine vollständige Neufassung der vorhandenen Onboarding-Texte.

## 2. Relevanter Bestand

| Bereich | Beobachteter Stand | Konsequenz für die Planung |
|---|---|---|
| Onboarding | Boot, Chat, Hochrechnung, Einwandtest, Brief, 60-Sekunden-Sprint, Einstufung, Rangliste, Ankunft | Storno als eigenen Akt nach dem Chat einfügen; vorhandene Reihenfolge danach erhalten |
| Abschluss | Hauptaktion führt zu `/namen?liste=…`; „Erst mal umschauen“ zu `/heute` | Hauptaktion auf die konkrete Sammlung richten |
| App-Start | `/start`, Startseite und Anmeldung führen regulär zu Heute; unvollständiges Onboarding wird abgefangen | Neutrale Einstiege müssen einen aktiven Startdurchgang berücksichtigen |
| Namensammlung | `/namen/sammeln`; zehn Szenen; ohne explizite Liste zunächst Listenauswahl | Bekannte Onboarding-Wahl mitgeben; nur bei unbekannter Wahl einmal fragen |
| Weiterarbeit | Nummernergänzung und Anrufdurchlauf existieren | Bestehende Abläufe verbinden |
| Fortschritt | `onboardingSteps` misst erreichte Akte; laufender Akt und Sammelszene sind lokal | Einen echten Fortsetzungsstand getrennt von Messdaten vorsehen |
| Speicherung | Sprint zählt vor Speicherbestätigung; Sammlung zeigt Eingaben optimistisch | Abschlusszahlen und Übergänge auf bestätigte Ergebnisse stützen |
| Heute | Nachfüllhinweis unter fünf offenen Namen; Starterpass nennt 20 Namen | Für neue Nutzer eine eindeutige nächste Aktion; 20 bleibt ein freiwilliges Etappenziel |
| Ankunft | Plant beim Anzeigen bis zu drei Anrufe, auch ohne Telefonnummer; wiederholte Aufrufe können weitere Kandidaten erwischen | Durch einen einmaligen, passenden Planvorschlag nach der Vorbereitung ersetzen |
| Storno | Lokale HTML-Datei; reguläre Runde mit 24 Karten; Kachel ab Stufe 2; Rücklink zu `/spiel` | Eigenen Einstiegsmodus mit fünf Karten und Rückgabe an das Onboarding vorsehen |

Die Quelle dieser Bestandsaufnahme ist der lokale Projektstand. Der alte Willkommen-Plan beschreibt teilweise frühere Annahmen; im Konfliktfall gelten die hier geprüften Abläufe und die aktuellen Nutzerentscheidungen.

## 3. Vollständiger Nutzerweg

1. Bestehende Installation, Kontoanlage und vorgeschaltete Zustimmung abschließen.
2. Persönliche Begrüßung und bisherige Zielauswahl: Kunden gewinnen oder Team aufbauen.
3. Storno-Kurzrunde spielen oder ausschließlich diesen Spielakt überspringen.
4. Bestehende Hochrechnung, Einwandtest und Brief durchlaufen.
5. Namen-Sprint mit echten Kontakten durchführen; bisherige Einstufung und Ranglistenmoment folgen.
6. Bisheriges freiwilliges Terminziel wählen. Die Ankunft bietet als Hauptaktion direkt die geführte Sammlung an.
7. Lebensbereiche durchgehen und zusätzliche Namen speichern.
8. Sammlung ausdrücklich beenden oder für später unterbrechen.
9. Bei Bedarf Telefonnummern ergänzen; bei anrufbaren Kontakten erste Anrufe anbieten.
10. Auf Heute die tatsächlich anstehende nächste Aktion sehen.

Storno erhält die Anzeige „Karte 1 von 5“, die Sammlung „Bereich 1 von 10“. Ein gemeinsamer Prozentbalken für Spiel, Sprint und beliebig lange Sammlung würde eine unzutreffende Dauer suggerieren. Der bestehende Onboarding-Balken umfasst seine eigenen Akte einschließlich Storno; die anschließende echte Arbeit erhält ihren eigenen Fortschritt.

Planungsziel für Storno: ungefähr 60–120 Sekunden. Die Sammlung ist ohne Zeitlimit. Eine feste Gesamtdauer wird erst nach einem Durchlauf mit neuen Testnutzern angegeben; durch das zusätzliche Spiel verlängert sich der bestehende Einstieg.

## 4. Storno-Kurzrunde: Bildschirm und Inhalt

### 4.1 Einstieg

Textvorschlag: „Fünf Situationen aus dem Vertriebsalltag. Wie entscheidest du?“

Hauptaktion: „Kurze Runde spielen“. Nebenaktion: „Spiel überspringen“. Ein kurzer Hinweis benennt das Format als satirisches Spiel. Die vier bekannten Spielwerte Provision, Zeit, Familie und Storno bleiben sichtbar und knapp erklärt.

Der bekannte Vorname kann für die Ansprache übernommen werden. Es gibt keine erneute Namenseingabe. Der Tutorial-Modus verändert nicht den gespeicherten Namen oder die Rekorde der regulären Spielrunde.

### 4.2 Feste Kartenauswahl

Für die erste Fassung wird folgende Auswahl aus den vorhandenen Karten vorgesehen. Situation, zwei Antworten und Folgen stammen aus dem bestehenden Spiel; an den Texten ist höchstens eine Kürzung für kleine Bildschirme nötig.

| Reihenfolge | Vorhandene Karten-ID | Situation | Funktion im Einstieg |
|---|---|---|---|
| 1 | `navi` | Der Kundentermin liegt hinter einem von mehreren Silos | Leichter, humorvoller Einstieg und Bedienung lernen |
| 2 | `doppelt` | Kundentermin und Elternabend kollidieren | Die Auswirkungen auf Zeit, Arbeit und Privatleben erleben |
| 3 | `kuend` | Ein langjähriger Kunde will kündigen | Storno und Kontaktpflege im Spiel sichtbar machen |
| 4 | `kaffee` | Beim dritten Termin wird noch ein Kaffee angeboten | Eine kurze Alltagssituation vor dem Abschluss |
| 5 | `leads` | Die gekaufte Kontaktliste enthält unbrauchbare Einträge | Thematische Vorbereitung auf die eigene Namensliste |

Die ersten fünf zufälligen Karten des Hauptspiels sind hierfür ungeeignet: Länge und Reihenfolge müssen für den Einstieg verlässlich sein. Die erste Karte hat den Hinweis „Wische oder tippe auf eine Antwort“. Beide Antwortbuttons funktionieren auch ohne Wischgeste. Nach einer Entscheidung bleibt ihre Folge lesbar; die nächste Entscheidung wird erst danach freigegeben.

Im Tutorial gibt es keinen vorzeitigen Game-over-Abbruch. Nach fünf gültigen Entscheidungen ist die Runde abgeschlossen. Die Auswirkungen auf die vier Werte werden angezeigt, aber es gibt keine Prüfung, die bestanden werden muss. Eine fehlende Audiofunktion oder ausgeschaltete Animationen verhindern das Weiterspielen nicht. Ton startet nur aus einer Nutzeraktion heraus und lässt sich ausschalten.

Die im Hauptspiel erzeugten Vergleichsprozente über angebliche Entscheidungen anderer Spieler werden im Tutorial ausgeblendet. Das Tutorial zeigt die konkrete Spielfolge, ohne eine neue Datengrundlage für Spielervergleiche zu behaupten.

### 4.3 Abschluss und Rückkehr

Textvorschlag: „Runde geschafft. Im Alltag hilft dir eine gute Vorbereitung. Wir bauen jetzt deine Grundlage auf.“ Hauptaktion: „Weiter mit deinem Start“.

Der Button führt zum nächsten bisherigen Onboarding-Akt, der Hochrechnung. Die letzte Chatzeile davor und die Einleitung danach werden an diesen Übergang angepasst. Der direkte Übergang zum ausführlichen Namensammeln erfolgt erst nach dem bestehenden Onboarding einschließlich Namen-Sprint.

Im Tutorial erscheinen weder der reguläre Rücklink zu `/spiel` noch „Nochmal von vorn“ oder Teilen als Hauptaktion. Die vollständige Spielrunde bleibt später über den bestehenden Spielbereich erreichbar. Die Kurzrunde benötigt keine Stufe 2 und vergibt keine CRM-Punkte, Aktivitäten, Einheiten oder regulären Spielrekorde.

### 4.4 Überspringen, Fehler und Wiederaufnahme

„Spiel überspringen“ setzt nur diesen Akt auf übersprungen und führt weiter zur Hochrechnung. „Ohne Einführung starten“ ist eine separate Aktion für das gesamte Onboarding und führt zur Namensammlung; bei fehlender Zielauswahl wird einmal nach der Liste gefragt.

Bei Unterbrechung nach Karte drei werden die ersten drei bestätigten Entscheidungen wiederhergestellt. Bei fünf gespeicherten Entscheidungen erscheint nach dem Neustart der Abschluss. Es wird kein neuer Zufallsstapel gestartet.

Lädt das Spiel nicht oder meldet es sich nicht betriebsbereit, zeigt der Rahmen nach spätestens zehn Sekunden „Das Spiel lädt gerade nicht“ mit „Erneut versuchen“ und „Ohne Spiel weiter“. Dieser Zustand darf die Kontoanlage oder die weitere App-Nutzung nicht blockieren.

## 5. Ankunft und direkter Übergang

Die Ankunft verwendet den bestätigten Bestand auf der gewählten Liste, nicht den lokalen Sprintzähler und nicht die Summe beider Listen.

| Bestand | Textvorschlag | Hauptaktion |
|---|---|---|
| Keine Namen | „Wir gehen gemeinsam durch, wen du kennst. Ein Name nach dem anderen.“ | Erste Namen sammeln |
| Ein bis 19 Namen | „Deine {n} Namen stehen. Jetzt schauen wir, wer dir noch einfällt.“ | Weitere Namen sammeln |
| Mindestens 20 Namen | „Deine ersten {n} Namen stehen. Geh deine Lebensbereiche durch — vielleicht fällt dir noch jemand ein.“ | Weitere Namen sammeln |

Singular und Plural werden korrekt ausgegeben. Ab 20 Namen ist zusätzlich „Mit meinen Namen weiter“ sichtbar; auch vorher bleibt ein ausdrücklicher früher Abschluss möglich. Die Zahl 20 erzeugt weder einen Pflichtdurchgang noch einen automatischen Abbruch der Sammlung.

Die Hauptaktion speichert den Onboarding-Abschluss und den anschließenden Startzustand zusammen und öffnet `/namen/sammeln?liste=VERKAUF` beziehungsweise `RECRUITING`. Es gibt keinen Zwischenhalt auf der Namensübersicht. „Erst mal umschauen“ beendet die Einführung, merkt den offenen nächsten Schritt als zurückgestellt und öffnet Heute. Es startet beim nächsten Öffnen keine erzwungene Sammlung.

Der bestehende optionale Rückmelde-Link kann nachrangig erhalten bleiben. Ein Wechsel in WhatsApp vor Abschluss der Speicherung darf keine Namen oder den Übergang verlieren. Die App versendet selbst keine Rückmeldung.

## 6. Namensammlung als Tutorial während der Benutzung

### 6.1 Darstellung

Die vorhandene Sammelkomponente erhält einen geführten Einstiegskontext. Auf dem Handy stehen ein großer Titel, die Ziel-Liste und die aktuelle Erinnerungsfrage im Vordergrund. Haupttext als Entwurfswert 16–17 Pixel, primäre Buttons ungefähr 52–56 Pixel hoch. Die endgültigen Farben, Abstände und Navigation werden aus der parallelen Gestaltung übernommen. Eingabefeld und Speichern müssen auch bei geöffneter Bildschirmtastatur erreichbar sein.

Eine Szene zeigt zunächst die erste konkrete Frage und bietet die weiteren vorhandenen Fragen über „Mehr Gedächtnisstützen“ an. Damit bleibt der volle Inhalt erhalten, ohne drei gleichgewichtige Aufforderungen nebeneinander zu stellen.

Beispiel:

> **Familie** · Bereich 1 von 10<br>
> Wer saß bei deiner letzten Familienfeier mit am Tisch?<br>
> **[Name eingeben] [Hinzufügen]**<br>
> Gespeichert: Lisa, Mehmet<br>
> **[Nächster Bereich]**<br>
> Mehr Gedächtnisstützen · Für heute fertig · Später fortsetzen

Beim allerersten Namen steht kurz: „Name eingeben und auf Hinzufügen tippen. Telefonnummern kommen danach.“ Nach erfolgreichem Speichern folgt einmalig: „Gespeichert. Du kannst direkt den nächsten Namen eingeben.“ Danach bleiben nur funktionale Speicherhinweise.

Die Übersicht über Bereiche muss ohne vorgeschalteten Rundgang erreichbar sein. Im geführten Kontext werden zusätzliche globale Schnellaktionen zurückgenommen; eine sichtbare Möglichkeit zum Verlassen bleibt vorhanden. Es gibt keine Folge von Tooltip-Fenstern, deren Position von der späteren Navigation abhängt.

### 6.2 Die zehn Bereiche

| Bereich | Erste Gedächtnisstütze aus dem Bestand |
|---|---|
| Familie | Wer saß bei der letzten Familienfeier mit am Tisch? |
| Enge Freunde | Wen rufst du an, wenn etwas richtig Gutes passiert ist? |
| Arbeit heute | Wer sitzt mit dir im Raum oder in der Schicht? |
| Frühere Arbeit | Mit wem hast du deine Ausbildung gemacht? |
| Schule und Studium | Wer saß in deiner Klasse neben dir? |
| Verein und Sport | Wer trainiert mit dir oder steht in deiner Mannschaft? |
| Nachbarn | Wer wohnt links, rechts und gegenüber? |
| Über die Kinder | Welche Eltern kennst du aus Kita oder Schule? |
| Leute, die für dich arbeiten | Wer schneidet dir die Haare? |
| Dein Handy | Geh deine Kontakte durch, von A bis Z. |

„Fällt mir niemand ein“ führt ohne Wertung zur nächsten Szene. Bei Kindern ist das beispielsweise eine normale, vollständige Antwort. Zurückgehen bleibt möglich. Die gespeicherten Namen werden dadurch weder entfernt noch erneut angelegt.

Die gewählte Verkaufs- oder Recruiting-Liste steht sichtbar über dem Feld. Eine Auswahl wird nicht durch eine Vermutung ersetzt. Vor dem ersten Namen kann die Liste direkt gewechselt werden. Danach bleibt die Ziel-Liste dieses Durchgangs fest; der vorhandene Weg zum nachträglichen Umhängen wird im Abschluss unter „Liste ändern“ angeboten.

### 6.3 Drei klar unterschiedliche Ausgänge

| Aktion | Bedeutung | Folgezustand |
|---|---|---|
| Nächster Bereich | Diese Szene ist durchgesehen, auch ohne neue Namen | Nächste Szene; nach der letzten Szene Abschluss |
| Für heute fertig | Der Nutzer beendet diese Sammelrunde bewusst, unabhängig von der Anzahl | Ergebnis und passender nächster Arbeitsschritt |
| Später fortsetzen | Der Nutzer unterbricht die Runde und möchte frei in die App | Heute; Fortsetzen wird angeboten, aber nicht erzwungen |

Die letzte Szene endet mit „Sammlung abschließen“. Eine Szene oder die ganze Sammlung gilt durch bloßes Anzeigen nicht als erledigt. Ein unerwartetes Schließen der App unterscheidet sich vom ausdrücklichen Zurückstellen: Der noch aktive Durchgang darf bei einem neutralen App-Start wieder erscheinen.

Vor einem Szenenwechsel wird eine angefangene Eingabe nicht still verworfen. Der bereits eingetippte Name wird gespeichert, bevor die Navigation ausgeführt wird. Bei einem Fehler bleibt die Eingabe sichtbar; erst ausdrückliches Verwerfen verwirft sie. Beim App-Schließen bleibt ein noch ungesendeter Entwurf, soweit lokaler Speicher verfügbar ist, nutzerbezogen auf diesem Gerät erhalten. Gerätewechsel und Neuinstallation garantieren nur bereits serverseitig bestätigte Daten.

### 6.4 Ergebnis und Zähler

Beispiel: „12 Namen dazu. Jetzt stehen 19 Namen auf deiner Verkaufsliste.“ Dabei wird zwischen Kontakten unterschieden, die diese Runde neu auf die Liste gebracht hat, und Namen, die bereits dort standen. Ein vorhandener Kontakt, der erstmals mit dieser Liste verknüpft wird, zählt als zusätzlich auf der Liste, nicht als neu angelegte Person.

Der gespeicherte Gesamtbestand wird aus den echten Kontakten berechnet. Eine Dublette zeigt „Steht schon auf deiner Liste“ und erhöht keinen Erfolgszähler. Ein ausstehender Speichervorgang darf als „Wird gespeichert“ erscheinen; er ist noch kein bestätigter Erfolg. Fehlgeschlagene Einträge bleiben einzeln wiederholbar.

Bei 20 Namen erscheint ein kurzer Hinweis „20 Namen stehen. Du kannst weiter sammeln oder mit ihnen loslegen“. Die Szenen springen nicht automatisch weiter. Eine neue freiwillige Runde verwendet den aktuellen Gesamtbestand als Grundlage; die Basismenge aus einer vorherigen Runde wird nicht erneut addiert.

## 7. Nummern ergänzen und erste Anrufe

Der Anschluss verwendet die bestehende Nummernergänzung. Er verlangt nicht, dass alle gesammelten Menschen schon eine Telefonnummer haben.

| Tatsächliche Situation nach der Sammlung | Hauptaktion | Weiteres Verhalten |
|---|---|---|
| Keine Namen vorhanden | Namen sammeln | Heute bleibt über eine Nebenaktion erreichbar; keine Behauptung, die Liste sei einsatzbereit |
| Namen vorhanden, keiner anrufbar | Nummern ergänzen | Personen ohne Nummer einzeln durchgehen; unbekannte Nummern überspringbar |
| Mindestens ein offener Name anrufbar | Erste Anrufe vorbereiten | Fehlende Nummern können daneben später ergänzt werden |
| Alle geeigneten Namen bereits bearbeitet oder mit nächsten Schritten versehen | Zu Heute | Keine künstliche neue Anrufaufgabe |

Die erste Vorbereitung schlägt bis zu drei geeignete offene Kontakte aus der gewählten Liste vor. Bereits vereinbarte Schritte werden nicht überschrieben. Die bereits vorhandene A/B/C-Einstufung kann die Reihenfolge beeinflussen; fehlende Einstufung blockiert niemanden. Die ausführliche Sammlung fügt keine weitere Pflicht zur Einstufung hinzu.

Der Vorschlag wird sichtbar, bevor Termine gespeichert werden. Hauptaktion „Jetzt ersten Anruf starten“ öffnet den bestehenden Anrufdurchlauf; die App wählt niemanden selbstständig an. Nebenaktion „Für später einplanen“ zeigt den vorhandenen Zeitvorschlag in Berliner Zeit sowie eine Möglichkeit, die Zeit zu ändern. Erst dessen Bestätigung speichert die ausgewählten Anrufaufgaben. Dieser Schritt ist eine Produktentscheidung, keine zusätzliche technische Genehmigungsanforderung.

Die automatische Planung beim Anzeigen der bisherigen Ankunft entfällt im neuen Ablauf. Ein erneutes Laden oder Wiederholen des Einstiegs erzeugt keine zusätzlichen Anrufpläne. Der Einführungsteil ist abgeschlossen, sobald die Vorbereitung durchlaufen oder bewusst beendet wurde; ein tatsächlich geführtes Gespräch ist keine Zugangsvoraussetzung für die normale App. Der Starterpass misst anschließend die echte Arbeit weiter.

## 8. Heute, Startwege und Auffindbarkeit

Die parallele Startseitenplanung sieht eine Hauptfläche „Dein nächster Schritt“ vor. Dieser Plan liefert dafür Zustand, Text, Aktion und Zielroute. Es wird kein zweites gleichrangiges Onboarding-Dashboard eingeführt.

Für einen neutralen App-Einstieg über Startseite, Anmeldung oder `/start` gilt nach den bestehenden Zugangsvoraussetzungen:

1. Offene Einladung und richtige Kontozuordnung behalten Vorrang vor der Startlogik.
2. Eine aktive, unvollständige Einführung wird am gespeicherten Akt fortgesetzt.
3. Eine nach der Einführung aktiv begonnene Sammlung oder Nummernergänzung wird fortgesetzt, wenn sie nicht ausdrücklich zurückgestellt wurde.
4. Nach ausdrücklichem „Später“ oder „Erst mal umschauen“ öffnet sich Heute.
5. Nach Abschluss der Einführung öffnet sich Heute wie gewohnt.

Ein Klick auf Kalender, einen konkreten Kontakt oder einen anderen bewusst gewählten App-Bereich wird nach den bestehenden Zugangsregeln nicht ständig auf die Sammlung zurückgebogen. Die Fortsetzungslogik sitzt an den neutralen Einstiegen, nicht als allgemeine Weiterleitung in jedem App-Layout. Eine aktive Sammlung auf dem Server darf dadurch keine Weiterleitungsschleife erzeugen.

Für die Hauptfläche auf Heute gelten folgende Prioritäten: Ein tatsächlich anstehender oder überfälliger Termin nach der Tageslogik der Parallelplanung geht vor. Fehlt ein solcher Anlass, erscheint bei neu gestarteten Konten die offene Sammlung, Nummernergänzung oder Anrufvorbereitung. Der vorhandene allgemeine Nachfüllhinweis wird unterdrückt, wenn er dieselbe Aktion nochmals anzeigen würde. Der Starterpass zeigt darunter den realen Fortschritt.

Nach einer bewusst abgeschlossenen Sammlung mit beispielsweise acht Namen wird nicht erneut das Tutorial verlangt, nur weil das 20-Namen-Ziel offen ist. Ein späterer allgemeiner Vorschlag zum Nachfüllen ist eine normale Arbeitsaufgabe. Ein abgeschlossener Start wird auch durch Löschen von Kontakten nicht wieder geöffnet.

Auf der Namensübersicht steht „Namen sammeln“ dauerhaft klar beschriftet. Falls die parallele Navigation diesen Bereich in „Kontakte“ umbenennt, bleibt die Aktionsbeschriftung gleich. Beim ersten Rückweg aus der Sammlung kann ein einmaliger Hinweis stehen: „Weitere Namen sammelst du hier über Namen sammeln.“

## 9. Zustände und Speicherung

### 9.1 Grundmodell

Für die Implementierung ist ein eigener, versionierter Startfortschritt je Konto vorgesehen. Die vorhandenen Telemetrie-Zeitstempel `onboardingSteps` bleiben Messdaten. Sie sind kein zuverlässiger Beleg dafür, dass ein angezeigter Akt erfolgreich abgeschlossen wurde.

| Datenteil | Zweck |
|---|---|
| Konto, Ablaufversion, Revision | Eindeutige Zuordnung und Schutz vor einem älteren parallelen Speicherstand |
| Aktueller Onboarding-Akt und Abschlussart | Erreicht, bearbeitet und übersprungen unterscheiden; stabile Schlüssel statt Array-Index |
| Checkpoints bestehender Akte | Bereits beantwortete Chatfragen, Sprintzustand und relevante Unterphasen fortsetzen |
| Aktuelle Startphase | Einführung, Listenauswahl, Sammlung, Nummernergänzung, Anrufvorbereitung, abgeschlossen |
| Aktive oder zurückgestellte Führung | Unerwartete Unterbrechung von bewusstem Verlassen unterscheiden |
| Aktuelle Sammlung und Ziel-Liste | Fortsetzung ohne erneute Auswahl |
| Storno-Version, Entscheidungen, Abschlussart | Fünf Karten nachvollziehbar wiederherstellen |
| Zeitstempel wichtiger Übergänge | Wirkung und Abbrüche messbar machen |

Für Sammlungen sind eigene Durchgänge mit Nutzer, festgelegter Liste, Szenenschlüsseln, Abschlussart und Zeitstempeln vorgesehen. Verknüpfungen zu den bereits existierenden Kontakten halten fest, welche Namen zu diesem Durchgang gehören. Namen und Telefonnummern werden fachlich weiter in den bestehenden Kontakten gespeichert, nicht als zweite dauerhafte Namensliste im Startzustand.

Die Nummernergänzung merkt sich die Reihenfolge beziehungsweise bearbeitete und bewusst ausgelassene Kontakt-IDs. Beim Fortsetzen werden vorhandene Telefonnummern, gelöschte Kontakte und aktuelle Listenmitgliedschaften erneut berücksichtigt. „Später“ darf nicht bei jedem Start wieder dieselbe bewusst ausgelassene Person vorlegen.

### 9.2 Verbindliche Speicherregeln

- Erfolgreiche Namensanlage, Zuordnung zur Sammlung und Zählerbasis müssen zusammenpassen. Die bestehenden Server-Aktionen bleiben der gemeinsame Schreibweg.
- Ein eindeutiger Vorgangsschlüssel je Eingabe macht eine Wiederholung nach Verbindungsabbruch unschädlich. Die Wiederholung legt weder einen zweiten Kontakt noch einen zweiten Aktivitätseintrag an.
- Namens-Dublettenprüfung aus dem Bestand wird beibehalten. Für Wiederholsicherheit wird keine neue pauschale Eindeutigkeit aller Personennamen eingeführt.
- Kritische Übergänge warten auf bestätigte Änderungen; zusätzliche Nutzungsmessung darf dagegen ausfallen, ohne den Nutzer aufzuhalten.
- Pro Durchgang werden Schreibvorgänge in einer konsistenten Reihenfolge abgearbeitet. Eine ältere Revision darf einen abgeschlossenen oder neueren Zustand nicht zurücksetzen.
- Konto-Wechsel lädt ausschließlich den Fortschritt des angemeldeten Kontos. Ein rein geräteweiter Tutorial-Haken reicht nicht.
- Serverseitig gespeicherte Kontakte und Checkpoints überleben Browserwechsel und Neuinstallation nach Anmeldung. Lokal ungesendete Entwürfe sind ausdrücklich auf das jeweilige Gerät beschränkt.
- Ein Seitenaufruf führt nicht nebenbei zu neuen Anrufen, zurückgesetzten Terminzielen oder erneut gespeicherten Briefen.

Der 60-Sekunden-Sprint erhält einen gespeicherten Start- beziehungsweise Endzeitpunkt. Wird die App währenddessen geschlossen und später geöffnet, läuft kein neuer Sprint automatisch an. Ist seine Zeit abgelaufen, erscheint das Ergebnis der bestätigten Eingaben. Bereits eingegebene Namen bleiben bestehen. Offene Übertragungen werden vor einem endgültigen Ergebnis wiederholt oder als offen angezeigt.

Die vorhandene Bedeutung von `onboardingDoneAt` als Freigabe der normalen App bleibt erhalten: gesetzt nach abgeschlossener oder ausdrücklich übersprungener Einführung. Die anschließende Sammelführung ist ein eigener Zustand. Dadurch kann sie angeboten und wiederaufgenommen werden, ohne die App erneut zu sperren.

### 9.3 Bestandskonten und Wiedervorführung

Die Zuordnung erfolgt anhand des vorhandenen Kontostands beim Start der neuen Version. Bereits abgeschlossene Einführungen erzeugen keine neue automatische Pflicht. Bereits begonnene, noch unvollständige Einführungen können in die neue Version übernommen werden: vorhandene Namen und Antworten bleiben, fehlende Checkpoints werden nicht als abgeschlossen erfunden. Nachträglich vorgeschaltetes Storno wird bei schon fortgeschrittenen Nutzern übersprungen, damit sie nicht zurückgesetzt werden.

Der freiwillige Wiederaufruf von Willkommen nach Abschluss dient zunächst der Vorführung. Er setzt den ursprünglichen Startfortschritt, Brief, Ziele oder Anrufplan nicht zurück. Aus einer Vorführung heraus echte Kontakte anzulegen muss ausdrücklich als echte Sammlung erkennbar sein; Beispielnamen gelangen nicht beiläufig ins CRM.

## 10. Einbindung des vorhandenen Spiels

Geplante technische Lösung: Die lokale Datei `/storno.html` bleibt die gemeinsame Spielgrundlage und erhält einen expliziten Tutorial-Modus. Der neue Onboarding-Akt zeigt diesen Modus in einem eingebetteten Spielrahmen innerhalb von Willkommen. Die vollständige Spielrunde nutzt weiterhin ihren bisherigen Modus. Es wird keine zweite unabhängige Spielkopie aufgebaut.

Der Rahmen übergibt die feste Kartenversion und den bestätigten Spielstand und übernimmt die Speicherung im angemeldeten Konto. Bis dieser Stand geladen ist, werden keine Entscheidungen freigegeben. Ein direkter Aufruf der öffentlichen HTML-Datei kann keine Einführung im Nutzerkonto als erledigt markieren.

Die Schnittstelle zwischen Rahmen und Spiel umfasst betriebsbereit, initialisieren, Entscheidung, fortsetzen, abgeschlossen, übersprungen und Fehler. Jede Meldung wird hinsichtlich Herkunft, sendendem eingebettetem Fenster, Instanz und erwartetem Schritt geprüft. Doppelte Abschlussmeldungen sind unschädlich. Der Server akzeptiert nur die erlaubte Kartenreihenfolge und die fünf zulässigen Links-/Rechts-Entscheidungen; Werte lassen sich aus diesen Entscheidungen rekonstruieren.

Authentifizierung, Weiterleitung und Kontakte liegen im CRM-Rahmen. Spielwerte bleiben Spielwerte. Der Tutorial-Modus schreibt weder Hauptspiel-Rekorde noch Sammlung oder CRM-Aktivitäten. Namen, Sitzungstoken oder Kontodaten werden nicht in die Spiel-URL geschrieben.

Der Dateikopf bezeichnet das Spiel als Kopie eines separaten Ursprungsprojekts. Daher muss eine spätere Aktualisierung dieser Datei den Tutorial-Modus und den bestehenden CRM-Rückweg erhalten. Das wird dokumentiert und durch gezielte Prüfungen abgesichert; eine Änderung des anderen Repositories gehört nicht zu diesem Auftrag.

## 11. Arbeitspakete und Zuständigkeiten

| Paket | Inhalt | Fertig, wenn |
|---|---|---|
| A: Ablauf und Daten | Zustandsübergänge, additive Datenbankerweiterung, Wiederholsicherheit, Zuordnung bestehender Konten | Ein unterbrochener oder doppelt gesendeter Vorgang setzt nichts zurück und erzeugt keine doppelten Namen oder Aktivitäten |
| B: Sammlung und Ankunft | Direkter Einstieg, richtige Liste, bestätigte Zähler, zehn Szenen, Pausieren, früher Abschluss | Nutzer kommt ohne Namensübersicht zur Sammlung und kann sie zuverlässig fortsetzen |
| C: Storno | Fester Stapel, eingebetteter Modus, Überspringen, Checkpoints, Abschluss | Alle fünf Entscheidungen führen unabhängig vom Ergebnis zurück ins Onboarding |
| D: Anschluss und Heute | Nummern, Anrufvorschlag, neutrale Startwege, eine nächste Aktion | Jeder Zustand bietet eine ausführbare Handlung; bewusste Navigation bleibt möglich |
| E: Prüfung | Übergangstests, Wiederholungen, kleine Bildschirme, PWA-Unterbrechungen, vollständiges Hauptspiel | Abnahmekriterien erfüllt und der bestehende Hauptspiel- sowie Führungsablauf funktioniert |

Die fachlichen Änderungen werden in dieser Reihenfolge aufgebaut; vor einer Veröffentlichung werden sie als ganzer Weg geprüft. Paket B löst bereits die wichtigste Orientierungslücke. Falls eine gestufte Veröffentlichung gewünscht wird, ist ein vollständiger Weg ohne Storno einer halbfertigen Spieleinbindung vorzuziehen; das ist eine Rückfalloption, keine Kürzung des beauftragten Endergebnisses.

| Vorhandene Dateien | Geplanter Berührungspunkt |
|---|---|
| `lib/willkommen.ts`, `components/willkommen/Willkommen.tsx` | Neuer Akt, Wiederaufnahme, Übergangstexte |
| `components/willkommen/Ankunft.tsx`, `NamenSprint.tsx` und Willkommen-Actions | Ankunft zur Sammlung, bestätigte Speicherung, Anrufplanung verlagern |
| `app/(app)/namen/sammeln/page.tsx`, `components/NamenSammeln.tsx` | Geführter Kontext, Szenenfortschritt, Abschluss und Fortsetzung |
| `lib/gedaechtnisstuetzen.ts` | Inhalte wiederverwenden, stabile Szenenschlüssel |
| Namen-Actions, `NummernNachtragen.tsx`, Nummern- und Anrufseiten | Gemeinsame Speicherung, Fortsetzung und geeignete Anschlussaktionen |
| `app/start/route.ts`, Anmeldung, Startseite und Zugangshelfer | Gemeinsame Entscheidung an neutralen Einstiegen, keine globale Weiterleitungsschleife |
| `app/(app)/heute/page.tsx`, `components/ErsteWoche.tsx` | Gemeinsame nächste Aktion und Abstimmung mit Starterpass |
| `public/storno.html` und neuer Onboarding-Spielrahmen | Tutorial-Modus, Kommunikation, Hauptspiel erhalten |
| `prisma/schema.prisma`, neue Migration, neue Startlogik | Persistenter Fortschritt und Sammlungsdurchgänge |
| `lib/features.ts` und bestehende Feature-Konfiguration | Getrennte Rückfallmöglichkeiten für Spielakt und Startführung |

Die Parallelplanung verantwortet Farben, globale Navigation und die Gestaltung der Hauptfläche auf Heute. Dieser Plan verantwortet die Regeln, welche Aktion darin erscheint. Gemeinsame Dateien werden bei der späteren Umsetzung nacheinander integriert. Aus diesem Plan wurde keine andere Aufgabe gestartet oder angeschrieben.

Abgleich mit dem während dieser Planung hinzugekommenen mobilen Designentwurf `docs/mobile-design-entwurf.md`: Für eine leere Kontaktliste sieht er bisher „Kontakt hinzufügen“ als Hauptaktion vor und verortet „Namen sammeln“ innerhalb der Kontakterfassung. Für den hier beauftragten neuen Start gilt ausdrücklich die konkretere Regel dieses Plans: Die Hauptaktion ist direkt „Namen sammeln“, ohne Erfassungsmenü dazwischen. Die normale Einzelkontakterfassung bleibt daneben möglich. Auf der Kontaktübersicht bleibt die Sammlung auch nach dem Einstieg als direkt beschriftete Aktion erreichbar. Diese Anforderungen sind bei der Integration in den mobilen Entwurf zu übernehmen; die andere Planungsdatei wurde hier nicht verändert.

Der mobile Entwurf sieht für fokussierte Abläufe einen Rahmen ohne Hauptnavigation sowie eine Rückkehr zur vorherigen Seite vor. Diesen Rahmen nutzt die Sammlung mit. Beim Einstieg direkt aus Willkommen führen ihre ausdrücklich beschrifteten Aktionen „Später fortsetzen“ und „Zu Heute“ nach Heute; bei freiwilligem Sammeln aus Kontakte bleibt der normale Rückweg zum bisherigen Listenkontext erhalten. Der dort geplante schnelle Anruf startet durch einen bewussten Tipp auf „Anrufen“; der vorbereitende Einstieg aus diesem Plan erzeugt keinen zusätzlichen Bestätigungsdialog vor diesem Telefon-Link. Der Starterpass wird in der gemeinsamen Oberfläche nachrangig und erreichbar eingeordnet, ohne eine zweite konkurrierende Hauptaktion zu erzeugen.

## 12. Abnahme und gezielte Prüfungen

### 12.1 Funktionale Abnahme

| Fall | Erwartetes Ergebnis |
|---|---|
| Neues Konto, Verkauf gewählt, sieben Sprint-Namen gespeichert | Ankunft nennt sieben; ein Tipp öffnet die Verkaufssammlung |
| Recruiting gewählt | Gleicher Weg mit Recruiting-Kontext; kein unbeabsichtigter Führungsablauf |
| Einführung vor Zielauswahl übersprungen | Einmalige Listenwahl vor der ersten Schreibaktion |
| Sprint ohne Eingaben oder übersprungen | „Erste Namen sammeln“; keine Null-Erfolgsmeldung oder Sackgasse |
| Bereits 20 oder mehr Namen | Sammlung weiterhin möglich; Weiterarbeit auch ohne zusätzliche Namen |
| Gleicher Name erneut eingegeben | Bestehender Hinweis; Gesamtstand und Aktivitäten nicht doppelt erhöht |
| Netzwerkantwort verloren und Eingabe wiederholt | Genau ein fachlicher Eintrag; richtige Rückmeldung nach Wiederholung |
| Speichern schlägt fehl | Name bleibt als ungespeichert sichtbar und lässt sich wiederholen |
| Tastatur offen auf kleinem Handy | Eingabe, Speichern und nächster Schritt sind erreichbar |
| Alle Szenen ohne neuen Namen durchgesehen | Ehrlicher Abschluss mit passender Aktion anhand vorhandener Kontakte |
| Sammlung nach drei Bereichen unerwartet geschlossen | Neutraler App-Start setzt bei gespeichertem Bereich fort |
| „Später fortsetzen“ gewählt | Heute öffnet sich auch beim nächsten Start; Fortsetzen bleibt erreichbar |
| „Für heute fertig“ bei acht Namen | Nummern oder Anrufvorbereitung; keine Rückleitung wegen fehlender zwölf Namen |
| Wechsel zwischen Kontakten-App/WhatsApp und CRM | Bereits bestätigte Namen und aktuelle Szene bleiben erhalten |
| Eine Nummer vorhanden, viele fehlen | Erste Anrufe möglich; fehlende Nummern sind keine Pflichtschleife |
| Anrufvorschlag zweimal bestätigt oder Seite neu geladen | Kein zweiter Plan und keine überschriebenen bestehenden nächsten Schritte |
| Storno übersprungen | Nächster Onboarding-Akt statt Sprung zu Heute oder Spiel |
| Unterbrechung nach drei Storno-Karten | Karte vier mit korrekt rekonstruierten Werten |
| Spielrahmen lädt nicht | Wiederholen oder ohne Spiel weiter; kein blockierter Start |
| Reguläres Storno nach Tutorial | Bestehende vollständige Runde und Rekorde funktionieren |
| Bestehendes Konto, Neuinstallation oder Gerätewechsel | Kein erzwungener neuer Einstieg |
| Konto mit Führungsablauf | Vorhandener eigener Weg bleibt funktionsfähig |
| Neue Startfunktion abgeschaltet | Bereits gespeicherte Kontakte bleiben normal erreichbar |

### 12.2 Testumfang bei der Umsetzung

Die wesentliche automatisierte Prüfung gilt den Zustandsübergängen, Listenzuordnung, Wiederholsicherheit und Speicherung. Für fünf binäre Storno-Entscheidungen lassen sich alle 32 Folgen gezielt prüfen: korrekte Reihenfolge, Abschluss nach fünf Karten, keine CRM-Auswirkungen. Einige Datenbank-Integrationstests prüfen verlorene Antworten, konkurrierende Revisionen und einmalige Anlage des Anrufplans.

Für die Oberfläche reichen wenige vollständige Durchläufe mit echten Aktionen: neuer Nutzer bis Sammlung, Pause und Neustart, Speicherausfall, Sammlung bis Anrufvorbereitung und reguläres Hauptspiel. Ergänzend manuell auf iPhone-PWA und Android-PWA mit Tastatur, App-Wechsel, kleinen Displays und reduzierter Bewegung prüfen. Eine Desktop-Ansicht wird zur Regression mit geprüft.

Lint, Typprüfung und Build werden erst in der Implementierung ausgeführt. Das aktuelle `npm run build` startet auch `prisma migrate deploy`; für Prüfungen wird deshalb eine isolierte Testdatenbank verwendet beziehungsweise der reine Next-Build getrennt aufgerufen. Eine Prüfung darf nicht unbeabsichtigt die produktive Datenbank migrieren. Für diesen Plan wurden keine Tests oder Migrationen ausgeführt.

## 13. Erfolgsmessung

Erfolg bedeutet, dass Nutzer die erste reale Arbeit ohne mündliche Einweisung beginnen und nach einer Unterbrechung fortsetzen können. Als erste Abnahmehypothese sollen mindestens vier von fünf neuen Testpersonen den Weg bis zu einem zusätzlich gespeicherten Namen ohne Hilfe schaffen. Technische Datenverluste, falsche Listen und doppelte Aktivitäten sind unabhängig von dieser Quote Fehler.

Für die erste Auswertung werden die folgenden Übergänge mit Zeitstempeln beziehungsweise bestätigten Vorgängen erfasst: Einführung begonnen, Storno begonnen/abgeschlossen/übersprungen/fehlgeschlagen, Ankunft, Sammlung begonnen/fortgesetzt/zurückgestellt/abgeschlossen, erster zusätzlicher Name gespeichert, erste Nummer ergänzt und erstes tatsächliches Anrufergebnis erfasst. Eine geöffnete Anrufansicht zählt nicht als geführtes Gespräch.

Nach sieben und 30 Tagen werden Start der Sammlung nach Ankunft, mindestens ein zusätzlicher Name in derselben Nutzungssitzung, Nutzung der Nummernergänzung sowie Storno-Abbrüche ausgewertet. Die operativen Checkpoints und vorhandenen Nutzungsmessungen werden genutzt; ein zusätzliches externes Analysesystem ist dafür keine Voraussetzung. Kontaktnamen und Telefonnummern gehören nicht in solche Messereignisse.

Das 20-Namen-Ziel und die erste Anrufaktivität sind nachgelagerte Größen. Ein Anstieg der Spielabschlüsse allein wäre noch kein Erfolg. Numerische Steigerungsversprechen gegenüber dem bisherigen Ablauf lassen sich ohne Ausgangsmessung nicht belastbar festlegen.

## 14. Einführung und Rückfall

Die neue Speicherung wird additiv eingeführt. Bestehende Kontakt-, Ziel- und Spielstände werden nicht zurückgesetzt. Vor Aktivierung wird die Datenmigration mit neuen, begonnenen, abgeschlossenen und führenden Konten in einer Testumgebung geprüft.

Spielakt und Startführung erhalten getrennte Aktivierungsoptionen. Die bestehende Feature-Hilfe behandelt fehlende Schalter als eingeschaltet; ein neuer Schaltername allein reicht deshalb nicht für eine kontrollierte Einführung. Die Umsetzung muss vor Veröffentlichung explizite Zustände setzen oder für diese neuen Funktionen einen eindeutigen Standard definieren.

Bei einem Problem mit Storno kann der Spielakt entfallen, während die direkte Sammlung weiter funktioniert. Bei einem Problem mit der Fortsetzungsführung bleibt die normale Namensammlung erreichbar. Neue Tabellen werden beim Abschalten nicht entfernt; bestätigte Kontakte bleiben normale CRM-Daten.

Es ist derzeit kein Veröffentlichungstermin festgelegt. Der Umfang umfasst mehrere Bildschirme, eine Spielintegration und gespeicherte Zustände. Eine belastbare Zeitschätzung setzt die endgültige technische Zerlegung und den Abgleich mit der Parallelplanung voraus.

## 15. Modellwahl für die spätere Umsetzung

Empfehlung: GPT-6 Astra mit Reasoning-Einstellung `high` für die zusammenhängende Umsetzung und Integrationsprüfung. Die konkrete Schwierigkeit liegt in Übergängen, bestehenden Nebenwirkungen und wiederholsicherer Speicherung über mehrere Bereiche. Die bereits in dieser Aufgabe erarbeitete Kenntnis des Projekts kann hier weiterverwendet werden. Diese Empfehlung ist eine Einschätzung für diesen Auftrag, kein gemessener Leistungsvergleich am Repository.

OpenAI beschreibt Astra als leistungsfähigstes Modell für anspruchsvolle zusammenhängende Arbeit und nennt komplexes Programmieren ausdrücklich als Einsatzgebiet. Die Modellübersicht nennt GPT-5.6 Terra als Alternative für eine stärkere Gewichtung der Kosten. Quellen: [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra), [OpenAI-Modellübersicht](https://developers.openai.com/api/docs/models), geprüft am 08.09.2026.

Terra ist eine mögliche Alternative für klar begrenzte spätere Oberflächenkorrekturen, wenn die fachlichen Regeln bereits abgesichert sind. Für die Erstumsetzung empfiehlt dieser Plan, das Modell nicht zwischen den eng verbundenen Arbeitspaketen zu wechseln. Aussagen über API-Preise werden nicht in eine unbelegte Aussage über den konkreten Codex-Verbrauch dieses Kontos umgerechnet.

Die Modellfrage startet keine Implementierung. Es wurde kein Modell gewechselt, keine zusätzliche Aufgabe gestartet und keine Programmierarbeit delegiert.
