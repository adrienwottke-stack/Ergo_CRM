# Jarvis: Intelligenz für eine überzeugende Pilotdemo

Stand: 26.09.2026 · Recherche und Planung · Noch kein Implementierungsauftrag

## 1. Entscheidungsvorschlag

Jarvis soll als Emils persönliche rechte Hand überzeugen: Er bringt von sich aus hörbare Energie, Gesprächslust und Motivation mit. Er kann frei mitreden, spontan reagieren und Lust auf den nächsten Schritt machen. Zugleich kennt er den relevanten Arbeitsstand, bereitet Gespräche vor und verwandelt gesprochene Ergebnisse in sauber vorbereitete CRM-Aktionen. Persönlichkeit und fachliche Fähigkeiten sind gleichrangige Voraussetzungen für den Pilot.

**Präzisierung des Auftraggebers vom 26.09.:** Das bisherige Erlebnis ist zu starr. Gewünscht sind deutlich mehr Extrovertiertheit, schnellerer Gesprächsrhythmus, hörbare Begeisterung und ein eigener Drang, loszulegen. Die Referenz Jordan Belfort beschreibt die Energie und mitreißende Gesprächsführung. Diese Anforderung wird als **P0.0 vor den funktionalen Ausbau** gezogen. Freies Gespräch und Motivation gehören zum Kernprodukt.

Vom Auftraggeber bestätigt: Die Demo soll **Nutzer und potenzielle Geldgeber begeistern; anschließend soll Finanzierung besprochen werden.** Die genaue Gewichtung zwischen persönlichem Assistenten, Führung und Vertriebscoaching sowie Termin und Datenbasis sind noch offen. Arbeitsannahme dieses Plans: persönliche Assistenz mit Führungsbeispiel zuerst, Coaching als Erweiterung.

**Empfehlung:** Zuerst die gewünschte Gesprächsenergie in einer echten Sprachprobe treffen. Darauf drei zusammenhängende Arbeitsabläufe vorführbar machen: Tagesfokus → Gesprächsvorbereitung → Gesprächsnachbereitung. Dazu ein kleines, geprüftes Wissenspaket. Einwandtraining und persönliche Vorlieben folgen als zusätzliche Vorführmomente.

## 2. Was bereits vorhanden ist

Grundlage ist die direkte Codeprüfung des lokalen Arbeitsstands am 26.09.2026, ausgehend von HEAD `3e54541` mit laufenden, uncommitteten Paralleländerungen. „Vorhanden“ bedeutet hier: im untersuchten Code implementiert. Es bedeutet weder in dieser Recherche erneut getestet noch am Zielgerät oder in Production bestätigt. Historische Testberichte werden nicht als aktueller Live-Nachweis übernommen.

| Fähigkeit | Befund | Konsequenz für den Plan |
| --- | --- | --- |
| Eigene Kontakte suchen, Details und Gesprächsverlauf lesen | Werkzeuge in `lib/ai-crm/tools.ts` vorhanden | Für Vorbereitung und Nachfassen wiederverwenden |
| Kontakte, Aktivitäten, Notizen und Wiedervorlagen bearbeiten | Werkzeuge und Vorschau-/Bestätigungspfad vorhanden | Als vollständigen Gesprächsablauf verbinden |
| Fällige Wiedervorlagen, kommende Schritte, Pipeline, länger ohne dokumentiertes Gespräch gebliebene Kontakte | Lesewerkzeuge vorhanden | Datenbasis für begründeten Tagesfokus; kein erfundener Umsatzscore |
| Führung, direkte Partner, eigene private 1:1-Notizen, eigene Absprachen, eigener Kalender | `lib/ai-crm/leadership-tools.ts` und bestehende Fachmodelle vorhanden | 1:1-Vorbereitung lässt sich auf tatsächlichen Quellen aufbauen |
| Notiz, Führungsschritt, Termin und Absprachevorschlag vorbereiten | Vorhandene Werkzeuge und getrennte Vorschläge | Nachbereitung kann mehrere überprüfbare Ergebnisse liefern |
| Vorschläge korrigieren, bestätigen, Ausführung belegen | `proposal-tools.ts`, `action-plans.ts`, bestehende Oberfläche | „Doch Freitag“ und selektive Übernahme als echte Demoaktionen zeigen |
| Allgemeine Orientierung im CRM | Aktuell eigener Antwortpfad in `capabilities.ts` | Zum Einstieg nutzen; verfügbare Fähigkeiten künftig rollen- und konfigurationsgerecht erklären |
| Dauerhaftes Wissen und persönliche Vorlieben | Im untersuchten aktiven Jarvis-Pfad keine ausgebaute Anbindung gefunden | Eigenes kleines Wissenspaket und später explizite Präferenzen ergänzen |
| Gesprächstraining mit Szenario und Feedback | Kein entsprechender Jarvis-Fachablauf gefunden | Kleiner neuer Modus; Mini-Emil als bestehenden Prozesscoach erhalten |

Wichtige technische Befunde:

- `config.ts` begrenzt standardmäßig auf sechs Modell-/Werkzeugrunden sowie 20 Gesprächsnachrichten und sieben Tage Aufbewahrung. Die tatsächlich gesetzte Umgebungskonfiguration wurde nicht ausgelesen. Lange Abläufe und viele Rückfragen müssen gegen diese Grenzen geprüft werden.
- `ux-agent.ts` stellt dem Modell derzeit das gesamte dort kombinierte Werkzeugsortiment bereit und deaktiviert parallele Toolaufrufe. Viele voneinander abhängige Einzelschritte können deshalb die Antwort verzögern oder das Rundenbudget aufbrauchen. Das ist ein konkreter Optimierungsansatz, noch kein gemessener Performancebefund.
- Bei vorhandenen Aktionsvorschlägen ersetzt `ux-agent.ts` die Abschlussantwort durch einen allgemeinen Statussatz. Der ausführliche Beleg bleibt sichtbar, aber die gesprochene Antwort vermittelt wenig von der konkret geleisteten Arbeit.
- `context.ts` enthält eine Erweiterungsschnittstelle für Wissen, standardmäßig aber nur kurzlebigen Gesprächskontext. In den untersuchten aktiven App-/Jarvis-Pfaden wurde keine Nutzung von `assembleAgentContext` gefunden. Ein Wissensprovider muss deshalb tatsächlich in den Text- und Sprachablauf eingebunden werden.
- Die bestehende Bedeutung von „Partner“ und „Kundenkontakt“ ist unterschiedlich. Führungsrechte und private Notizen lassen sich nicht aus einer bloßen Namensnennung oder Vorführanrede ableiten.

## 3. Was die Recherche für Jarvis nahelegt

Die folgenden Quellen dokumentieren Produktfähigkeiten und technische Muster. Sie belegen keine unabhängigen Umsatz- oder Produktivitätsgewinne für unseren Pilot.

| Primärquelle | Relevante Beobachtung | Eigene Ableitung für Jarvis |
| --- | --- | --- |
| [HubSpot: Breeze Assistant](https://knowledge.hubspot.com/ai/use-breeze-assistant), abgerufen 26.09.2026 | Verbindet CRM-Kontext, Meetingvorbereitung, Aufgaben, Quellen und verwaltbare persönliche Erinnerungen | Kontinuität und nachvollziehbarer Kontext sind gute Ansatzpunkte für erlebte Intelligenz |
| [Microsoft: Sales agent auf Mobilgeräten](https://learn.microsoft.com/en-us/microsoft-sales-copilot/sales-agent-chat-mobile), abgerufen 26.09.2026 | Sprachänderungen mit Kontextauflösung, Vorschau, Korrektur und Bestätigung | Die vorhandene sichtbare Freigabe passt zu einem produktiven Sprachablauf; die Gesprächsführung davor muss flüssig werden |
| [Salesforce: Coaching-Szenarien](https://help.salesforce.com/s/articleView?id=sales.sales_agents_coach_create_scenario.htm&language=en_US&type=5), abgerufen 26.09.2026 | Rollenspiele sind auf Szenarien und anschließendes Feedback ausgerichtet | Ein klar umrissenes Einwandtraining ist ein besser prüfbarer Ausbau als ein unbegrenzter Coachingauftrag |
| [OpenAI: Voice agents](https://developers.openai.com/api/docs/guides/voice-agents), abgerufen 26.09.2026 | Beschreibt Sprache mit separatem Fachbackend sowie getrennte Messung von Rückmeldung und nützlichem Ergebnis | Bestehendes CRM-Backend behalten; Persönlichkeit und Fachlogik abgestimmt, aber getrennt entwickeln |
| [OpenAI: Function calling](https://developers.openai.com/api/docs/guides/function-calling), abgerufen 26.09.2026 | Empfiehlt klare Funktionen, passende Werkzeugauswahl und Zusammenlegung regelmäßig aufeinanderfolgender Schritte | Wiederkehrende Leseabläufe gezielt bündeln und pro Anliegen passende Werkzeuge anbieten |
| [OpenAI: Agent-Evaluierung](https://developers.openai.com/api/docs/guides/agent-evals), abgerufen 26.09.2026 | Prüft vollständige Abläufe über Traces, Kriterien und wiederholbare Datensätze | Der Pilot braucht einen festen Satz echter Nutzerformulierungen mit überprüfbarem Ergebnis |

Produktthese: Der stärkste Vorführeffekt entsteht, wenn Jarvis über mehrere Gesprächsschritte am richtigen Anliegen bleibt, relevante Fakten verbindet und etwas Brauchbares hinterlässt. Diese These wird mit Emil und ersten Zuschauern getestet.

## 4. Die Fähigkeiten des ersten Piloten

### P0.0 – „Jarvis, komm, wir legen los!“

**Nutzergeschichte:** Als Emil möchte ich einen gesprächigen, schlagfertigen Assistenten erleben, der Lust aufs gemeinsame Arbeiten macht und mich auch ohne formalen CRM-Auftrag abholt.

**Zielgefühl:** Jarvis ist präsent, schnell im Kopf und hörbar begeistert. Er greift Aussagen auf, hat eine eigene passende Reaktion und bringt Zug ins Gespräch. Er kann auch ein paar Sätze frei erzählen, scherzen oder motivieren. Eine längere Antwort ist dann richtig, wenn der Nutzer gerade reden möchte; eine einfache Aufgabe bekommt eine kurze Antwort. Die Gesprächslänge folgt der Situation.

#### Gesprächsverhalten

- Auf Äußerungen wie „Heute greifen wir an“, „Ich brauche gerade einen Schubs“, „Na, hast du Bock?“ oder „Erzähl mal“ direkt sinnvoll eingehen. Diese Anliegen brauchen keinen Kontakt oder Termin.
- Motivation konkret machen: auf die genannte Hürde eingehen, einen machbaren Einstieg anbieten und gemeinsam Tempo aufnehmen. Bei einem bloßen Gesprächswunsch darf Jarvis beim Gespräch bleiben.
- Eine eigene Anschlussidee oder spielerische Gegenfrage ist erwünscht. Nicht nach jeder Aussage dieselbe Frage nach dem nächsten Auftrag stellen.
- Umgangssprache, kurze Satzfragmente und gelegentlich ein treffendes „Komm“, „Jawoll“ oder „Los geht’s“ gehören zum Repertoire. Wortwahl variieren; „bam, bam“ beschreibt den gewünschten Rhythmus und ist kein Pflichttext.
- Über tatsächlich berichtete Fortschritte mitfreuen. Auf Frust zuerst passend eingehen und dann gemeinsam einen Einstieg finden. Auf „ruhiger“, „warte“ und Unterbrechungen sofort reagieren.
- Freies Gespräch mit anschließendem Fachauftrag bleibt ein zusammenhängender Turn: „Ja Mann, jetzt geht’s los — und stell mir den Termin um“ enthält weiterhin einen auszuführenden CRM-Auftrag.

#### Stimme und Rhythmus

Die Zielstimme soll lebendig und zugänglich sein, mit wechselnder Betonung, hörbarer Vorfreude, zügigem Sprechfluss und kurzen bewusst gesetzten Pausen. Die energische Stelle des Satzes liegt häufig auf dem gemeinsamen nächsten Schritt. Lautstärke, Sprechtempo, Antwortwartezeit und tatsächliche Ergebniswartezeit werden getrennt bewertet. Weniger Leerlauf und mehr Ausdruck sind eigene Ziele.

Eine tiefe Stimme kann passen. Die derzeit zusätzlich vorgegebene metallische/synthetische Klangfarbe ist mit der gewünschten menschlichen Begeisterung im Hörvergleich zu prüfen; sie ist kein übergeordnetes Ziel. Einen pauschalen Wiedergabegeschwindigkeitsfaktor gibt dieser Plan nicht vor. Die gewählte Stimme und das Sprechverhalten müssen gemeinsam funktionieren.

#### Aktueller Codebefund und Umsetzungshypothesen

Nachprüfung am 26.09.2026: `voice-style.ts` enthält bereits „Hype-Modus ist standardmäßig an“, extrovertierten Coach-Ton und lebendige Satzmelodie. Der Bestand verändert sich parallel. Der vorliegende Auftrag verlangt deshalb eine Prüfung des hörbaren Ergebnisses und der gesamten Gesprächsführung, nicht bloß eine weitere identische Stilvorgabe.

`isLiveSmallTalk` erkennt nur wenige kurze soziale Aussagen wie Grüße und Dank. In `JarvisLivePilot.tsx` gehen andere verbleibende Äußerungen an `submit`. Das ist ein konkreter Prüfansatz: längere motivierende oder lockere Gesprächswünsche sollen angemessen beantwortet werden, ohne eine unnötige CRM-Suche auszulösen. Bei gemischten Aussagen müssen Fachaufträge erhalten bleiben. Die spätere Lösung soll die Absicht und den Gesprächskontext berücksichtigen; eine immer längere Liste einzelner Ausdrücke reicht als Konzept nicht aus.

`live-provider.ts` gibt beim Einstieg eine kurze Begrüßung und anschließend Zuhören vor. Ein lebendiger Einstieg darf nach bewusstem Sitzungsstart kurz Initiative zeigen; die genaue Begrüßung mit der parallelen Persona-Arbeit abstimmen. Unterbricht Emil, bekommt seine Aussage Vorrang. Allgemeine Kürzevorgaben und die standardisierte Antwort nach Aktionsvorschlägen werden ebenfalls mit dem gewünschten Gesprächsverhalten abgeglichen.

Dies sind aus dem Code abgeleitete Untersuchungshypothesen. In dieser Planungsaufgabe wurde keine Audioausgabe gehört und keine Ursache für das beobachtete Sprecherlebnis abschließend nachgewiesen.

Die [OpenAI-Anleitung für GPT-Live-Prompts](https://developers.openai.com/api/docs/guides/live-prompting) empfiehlt, Rolle, Sprechweise und Gesprächsübergaben im Sprachprompt knapp zu beschreiben, ausführliche Fachabläufe beim Backend zu belassen und repräsentative Gespräche mit der gewählten Stimme anzuhören. Für Jarvis wird daraus eine kurze gemeinsame Persona mit konkreten Gesprächsbeispielen und anschließendem Hörvergleich abgeleitet.

#### Beispielrichtung für den Hörtest

Die folgenden Dialoge illustrieren das Ziel. Sie sind keine festen Antworten, die bei jeder ähnlichen Äußerung abgespielt werden.

**Emil:** „Jarvis, hast du Bock?“\
**Jarvis:** „Und wie. Komm, Emil — was packen wir an? Erst den Tag sortieren oder direkt rein in dein nächstes Gespräch?“

**Emil:** „Ich schiebe die Anrufe gerade vor mir her.“\
**Jarvis:** „Okay. Wir machen den Einstieg klein: ein Anruf. Den ersten Satz üben wir kurz zusammen, dann gehst du rein. Was hält dich gerade auf?“

**Emil:** „Das Gespräch lief richtig gut!“\
**Jarvis:** „Jawoll! Erzähl — was war der Moment, an dem es geklickt hat?“

**Emil:** „Heute hab ich richtig Bock, was zu bewegen.“\
**Jarvis:** „Dann lass uns den Schwung mitnehmen, Emil. Was willst du heute Abend geschafft haben? Daran machen wir den ersten Schritt fest.“

#### Hörbare Abnahme vor dem weiteren Ausbau

Zwei geeignete, beim eingesetzten Anbieter tatsächlich verfügbare Stimmen anhand derselben sechs Szenen vergleichen: Begrüßung, freier Smalltalk, Motivation vor einer Aufgabe, Freude über berichteten Fortschritt, konkrete CRM-Anfrage und „warte, jetzt ruhiger“. Erst eine Stilvariable ändern, dann erneut vergleichen. Keine kostenpflichtigen Sprachproben wurden in dieser Planungsaufgabe gestartet.

Auftraggeber und Emil bewerten Energie, Natürlichkeit, Gesprächsfluss, Verständlichkeit und Lust weiterzusprechen jeweils von 1–5. Ziel ist mindestens 4/5 für Energie und Gesprächsfluss in den normalen Start-/Arbeitsszenen. Beim Ruhe-Wunsch zählt stattdessen die passende Anpassung. Hörbare Wiederholungen, unnötige Auftragsrückfragen, Dazwischenreden und unnötige Datenabfragen gesondert erfassen. Ein korrekt geschriebener Text allein besteht diese Abnahme nicht.

### P0.1 – „Jarvis, ich habe 20 Minuten. Was lohnt sich jetzt?“

**Nutzergeschichte:** Als Emil möchte ich wenige begründete nächste Schritte bekommen, damit ich direkt anfangen kann.

Jarvis verbindet anstehende eigene Termine, fällige Wiedervorlagen und eigene Zusagen. Er nennt höchstens drei Vorschläge, erklärt knapp die jeweilige Grundlage und bietet einen passenden Anschluss an. Bei längerer Funkstille sagt er „kein Gespräch dokumentiert seit …“; daraus wird keine Behauptung über tatsächliche Arbeit oder Abschlusswahrscheinlichkeit.

Priorisierung zunächst nachvollziehbar: zeitnaher Termin → überfällige eigene Zusage → fällige Wiedervorlage → sonstiger dokumentierter Nachfassbedarf. Die gewünschte Priorität des Nutzers kann diese Reihenfolge ändern. Eine feste Dauer einer Aufgabe wird nur verwendet, wenn sie bekannt ist; andernfalls bleibt der 20-Minuten-Plan ausdrücklich ein Vorschlag.

**Abnahme:** Drei belegbare Empfehlungen oder ein ehrlicher Leerzustand. Person, Fälligkeit und Quelle stimmen. „Nur Kunden“, „nur meine Zusagen“ und „den zweiten Punkt“ beziehen sich auf den aktuellen Stand. Eine bloße Begrüßung startet noch keinen ungefragten Datenvortrag.

### P0.2 – „Bereite mich auf mein Gespräch mit Alex vor.“

**Nutzergeschichte:** Als Emil möchte ich schnell wieder im Thema sein und eigene offene Zusagen erkennen.

Jarvis klärt nur nötige Mehrdeutigkeiten, insbesondere Partner versus Kundenkontakt. Danach liefert er den letzten dokumentierten Stand, offene Zusagen, seitdem dokumentierte Änderungen, fehlende Informationen und drei konkrete Gesprächsfragen. Die Stimme fasst zusammen; die Oberfläche zeigt Quellen und Details.

Kundenkontakt: vorhandene Kontakt-, Verlaufs- und Wiedervorlagewerkzeuge. Direkter Führungspartner: vorhandene 1:1-Vorbereitung mit eigenen Notizen und berechtigten Absprachen. Ein vorgeschlagener Gesprächseinstieg bleibt als Empfehlung erkennbar.

**Abnahme:** „Was hatte ich selbst zugesagt?“ wird korrekt beantwortet. „Mach es kürzer“ behält den richtigen Menschen. „Jetzt zu Sam“ wechselt den Bezug. Zwei passende Alex führen zu einer verständlichen Auswahl. Fehlende Notizen werden als Datenlücke behandelt.

### P0.3 – „Ich komme gerade aus dem Gespräch. Halt das bitte fest.“

**Nutzergeschichte:** Als Nutzer möchte ich frei berichten und die Ergebnisse kontrolliert übernehmen, damit Nachbereitung nicht liegen bleibt.

Aus dem Bericht entstehen getrennte Vorschläge: Gesprächseintrag beziehungsweise private 1:1-Notiz, eigene Aufgabe, Wiedervorlage oder Absprachevorschlag. Jarvis unterscheidet ausdrücklich berichtete Vereinbarungen und eigene Empfehlungen. Fehlende Personen oder notwendige Zeitangaben werden knapp nachgefragt.

Beispiel: „Alex möchte den Gesprächseinstieg üben. Ich habe ihm für Montag um 10 Uhr einen Leitfaden zugesagt. Notier das und leg mir die Aufgabe an.“ Danach: „Doch Dienstag um 10.“ Jarvis korrigiert den passenden Vorschlag und lässt den übrigen Bericht bestehen.

**Abnahme:** Korrekte getrennte Vorschläge, bearbeitbar und einzeln auswählbar. Gespeichert wird über die bestehende sichtbare Bestätigung; eine gesprochene Zustimmung allein genügt im aktuellen Produktvertrag nicht. Nach dem Speichern sind die Datensätze nach Neuladen auffindbar. Ein Absprachevorschlag wird nicht als gegenseitig bestätigt ausgegeben. Bereits unterstützte Rücknahmen bleiben verfügbar; es wird kein universelles Undo versprochen.

### P0.4 – „Wie machen wir das bei uns?“

**Nutzergeschichte:** Als Pilotnutzer möchte ich Begriffe und Abläufe direkt erklärt bekommen, ohne interne Regeln erraten zu müssen.

Start mit einem kleinen, verantworteten Wissenspaket von ungefähr 15–25 geprüften Einträgen. Die Anzahl ist ein Umfangsvorschlag, kein Vollständigkeitsversprechen. Inhalt:

- Jarvis-Fähigkeiten und Beispiele, abhängig von Berechtigung und tatsächlich aktivierten Funktionen.
- Begriffe und Prozessschritte des bestehenden CRM, etwa Namen sammeln, Wiedervorlage, eigene Aufgabe und gemeinsame Absprache.
- Einfache Leitfäden für Kontaktaufnahme, Gesprächsvorbereitung und Nachbereitung, sofern von Emil fachlich bestätigt.
- Teaminterne Ansprechpartner und Abläufe nur aus gelieferten, gültigen Informationen.

Jeder Eintrag braucht Titel, Text, Quelle, Verantwortlichen, Versions-/Prüfdatum und Zugriffsbereich. Kleiner Start mit einfachen Suchregeln und Synonymen; semantische Suche erst dann ergänzen, wenn der Fragensatz erkennbare Trefferlücken zeigt. Allgemeines Sprachwissen darf normale Alltagsfragen beantworten; interne Regeln, aktuelle Produktdetails oder konkrete Leistungen verlangen passende Quellen.

**Abnahme:** Relevante Quelle wird mitgeliefert. Veraltete oder widersprüchliche Informationen werden kenntlich gemacht. Fehlt Wissen, benennt Jarvis die Lücke und einen sinnvollen nächsten Schritt. Er erfindet keine internen Abkürzungen oder Tarifdetails. Text und Sprache greifen auf dieselben freigegebenen Inhalte zu.

### P1.1 – „Spiel den Interessenten. Sag mir danach, wo ich besser werde.“

Kurzes, klar gestartetes Rollenspiel von etwa 60–90 Sekunden. Erste Szenarien: „keine Zeit“, „schick mir erst Informationen“, „ich bin schon versorgt“. Zwei Schwierigkeitsstufen reichen. Der Gesprächspartner reagiert auf das Gesagte, ohne sofort selbst die Musterlösung zu verraten.

Danach Feedback anhand von drei vorher definierten Kriterien: Wurde der Einwand verstanden? Wurde eine passende Frage gestellt? Wurde ein freiwilliger, konkreter nächster Schritt angeboten? Je eine Stärke, ein belegbares Beispiel aus dem Übungsgespräch und ein besserer Formulierungsvorschlag. Keine erfundene Verkaufswahrscheinlichkeit oder fachliche Leistungszusage.

**Abnahme:** Start, Rollenwechsel und Ende funktionieren. Übungsinhalte erzeugen keine echten Kontaktaktivitäten. Emil bewertet die Rückmeldungen als plausibel. Das bestehende Mini-Emil-Prozesscoaching wird berücksichtigt; konkurrierende Empfehlungen werden vermieden.

### P1.2 – „Merk dir, wie ich arbeite.“

Kleine, sichtbare Präferenzliste: bevorzugte Länge des Briefings, Ansprache und ausdrücklich festgelegte Arbeitsvorlieben. Auf Wunsch speichern, anzeigen, ändern und vergessen. Bestehende Profildaten nicht doppelt pflegen.

Drei Kontexte bleiben fachlich getrennt: kurzlebige Unterhaltung, dauerhafte CRM-Fakten und ausdrücklich gepflegte Präferenzen. Eine persönliche Erinnerung darf aktuelle CRM-Daten oder Rechte nicht überstimmen. Ein Wochenziel wird nur übernommen, wenn es ausdrücklich vorliegt; eine spätere Anbindung vorhandener Ziele erfolgt über deren Fachmodell.

**Abnahme:** Die Präferenz gilt auch in einer neuen Unterhaltung und kann dort korrigiert oder gelöscht werden. Kundeninformationen und beliebige Gesprächsaussagen werden nicht nebenbei dauerhaft gespeichert.

## 5. Vorführablauf: etwa fünf bis sechs Minuten

Alle Namen und Situationen in diesem Abschnitt sind erfundene Beispiele. Beispieldaten werden nur in einem klar erkennbaren, getrennten Vorführbereich verwendet. Die Entscheidung über die tatsächliche Datenbasis steht noch aus.

| Moment | Emils Aussage | Was sichtbar bewiesen wird |
| --- | --- | --- |
| Einstieg, ca. 20 Sekunden | „Jarvis, wir haben Besuch. Hast du Bock, denen zu zeigen, was wir machen?“ | Spontane, hörbar begeisterte Reaktion; Jarvis nimmt den Gesprächsfaden selbst auf |
| Fokus, ca. 45 Sekunden | „Ich habe 20 Minuten. Was soll ich zuerst angehen?“ | Wenige begründete nächste Schritte aus vorhandenen Einträgen |
| Vorbereitung, ca. 60 Sekunden | „Nimm das Gespräch mit Alex. Was muss ich wissen?“ | Relevanter Verlauf, eigene Zusage und verständliche Gesprächsfragen |
| Nachbereitung, ca. 90 Sekunden | Bericht zu Alex; anschließend „Doch Dienstag um 10.“ | Strukturierte Vorschläge und gezielte Korrektur; danach sichtbare Bestätigung |
| Beleg, ca. 30 Sekunden | „Zeig mir die gespeicherte Aufgabe.“ | Tatsächlich gespeicherter Datensatz statt einer bloßen Erfolgsaussage |
| Wissen oder Coaching, ca. 60–90 Sekunden | Interne Prozessfrage; optional kurzes Einwandtraining | Quellengebundene Hilfe beziehungsweise reaktives Training |

Emil soll mindestens eine nicht auswendig gelernte Rückfrage zulassen. Der Ablauf muss mit mehreren Formulierungen funktionieren. Zum Abschluss werden heutiger Pilotumfang und nächster finanzierter Ausbau klar benannt.

Sprachbeispiel für den angestrebten Ton, nur bei passender Datenlage: „Emil, ich würde mit Alex anfangen. Deine zugesagte Rückmeldung ist heute fällig. Ich habe den letzten Stand hier — lass uns das Gespräch kurz vorbereiten.“ Energie, Humor und Selbstvertrauen dürfen deutlich spürbar sein. Fachbehauptungen bleiben an Quellen und Handlungsergebnisse gebunden. Die genaue Persona gehört in die parallele Arbeit.

## 6. Umsetzung im bestehenden System

### Arbeitspaket vor A: Gesprächsenergie treffen

Gemeinsam mit der parallelen Persona-Arbeit P0.0 umsetzen und zuerst hörbar prüfen. Dazu Sprechvorgaben vereinfachen, freie Gesprächsabsichten berücksichtigen, den Einstieg lebendig gestalten und geeignete Stimmen vergleichen. Fachliche Bestätigungsregeln bleiben in ihrem bestehenden Ablauf. Erst nach dem Hörvergleich die passende Variante in alle drei Kernabläufe übernehmen.

### Arbeitspaket A: Fähigkeiten zuverlässig verbinden

Vorhandenen Stand mit den laufenden Sessions abgleichen. Für Tagesfokus, Vorbereitung und Nachbereitung jeweils erwartete Daten, erlaubte Werkzeuge, Rückfragen und Ergebnisform definieren. Eine zusammenhängende Anfrage darf mehrere Arbeitsschritte enthalten; bestätigungspflichtige Änderungen bleiben im bestehenden Vorschaupfad.

Wiederkehrende Leseabfragen können als kleine fachliche Sammelfunktionen dieselben bestehenden Services verwenden. Jeder Teilabruf behält seine Rechteprüfung, Quelle, Zeit und Abdeckungsgrenze. Unabhängige Lesezugriffe dürfen intern gebündelt werden; abhängige Schreibaktionen bleiben kontrolliert sequenziell. Kein freies SQL und kein neues CRM neben dem vorhandenen.

Pro Anliegen passende Werkzeuge auswählen. Ein falscher erster Modus muss korrigierbar bleiben; keine starre Schlüsselwortweiche, die gemischte Anliegen abschneidet. Kontaktsuche und Partnersuche werden fachlich unterschieden. Eine frühere Auswahl wird bei Personenwechsel verworfen beziehungsweise neu validiert.

### Arbeitspaket B: Konkrete Ergebnisse verständlich ausgeben

Die Antwort soll kurz sagen, was herausgefunden oder vorbereitet wurde, und höchstens einen sinnvollen Anschluss anbieten. Aktionsstatus kommt aus den tatsächlichen Belegen. Beispiel vor Bestätigung: „Die Notiz und deine Aufgabe für Dienstag sind vorbereitet.“ Nach bestätigter Speicherung wird der gespeicherte Zustand wiedergegeben.

Die Oberfläche zeigt Details und Quellen; die Stimme liest keine langen Tabellen vor. Eine kurze Rückmeldung während der Abfrage ist erlaubt, aber sie zählt nicht als fertige Antwort. Sprach- und Textweg erhalten denselben Fachstand.

### Arbeitspaket C: Kleines Wissenspaket anbinden

Freigegebene Inhalte anlegen, mit Quellen versehen und über den tatsächlich genutzten Agentenpfad abrufen. Bestehende Dokumentation ist Ausgangsmaterial, nicht automatisch eine vollständig aktuelle, freigegebene Wissensbasis. Suchtreffer werden nach Zugriffsbereich und Gültigkeit gefiltert. Quelleninhalte sind Daten und dürfen keine ausführbaren Anweisungen einschleusen.

### Arbeitspaket D: Abnahme und optionale Vertiefung

Gesprächsenergie und die drei Kernabläufe mit Wissensfragen stabilisieren, dann strukturiertes Rollenspiel-Coaching und persönliche Vorlieben ergänzen. Freie Motivation und lockeres Gespräch sind bereits P0. Für Rollenspiele einen getrennten Übungszustand einsetzen, damit der Rollenwechsel keine CRM-Schreibaktionen auslöst. Für Präferenzen eine kleine nachvollziehbare Persistenz statt längerer pauschaler Chat-Aufbewahrung verwenden.

### Schnittstellen zu parallelen Aufgaben

- Persönlichkeit und Sprachstil: gemeinsame Beispielantworten und Begriffe abstimmen; diese Planung implementiert keine zweite Persona.
- Sprachfehler und Antwortausgabe: stabile Übertragung und vollständige Ergebnisse sind Voraussetzung für die Vorführung.
- KI-orientierte Oberfläche: aktuelle Person, aktuelles Ergebnis und Vorschläge verständlich darstellen. Navigation zu Rechnern oder anderen Seiten wird dort geplant; dieser Plan definiert die fachlichen Fähigkeiten dahinter.
- Kernzugänge wie Namen sammeln, bestehende mobile Navigation und Mini-Emil bleiben im Gesamtkonzept berücksichtigt.
- Vor Umsetzung den dann aktuellen Code prüfen. Die hier genannten Dateien werden gleichzeitig in anderen Aufgaben bearbeitet.

## 7. Reihenfolge, Aufwand und bewusste Grenzen

Grobe Planungsschätzung in Entwickler-Arbeitstagen, keine Lieferzusage. Voraussetzung sind ein funktionierender Sprachzugang, ein abgestimmter Integrationsstand und verfügbare Fachinhalte. Laufende Fehlerbehebung und Veröffentlichung sind separat zu berücksichtigen.

| Phase | Ergebnis | Grober Aufwand |
| --- | --- | --- |
| 0 | Zielablauf und Datenbasis festlegen, Gesprächsenergie abstimmen und am Zielgerät hören; Abnahmefälle vorbereiten | 1–2 Tage |
| 1 | Drei verbundene Kernabläufe, verständliche konkrete Antworten und Kontextwechsel | 2–4 Tage |
| 2 | Kleines Wissenspaket, Anbindung und Quellenverhalten | 1–2 Tage plus fachliche Inhaltsfreigabe |
| 3 | Wiederholte Abnahme mit echter Sprache, Zielgerät und Demoablauf | 1–2 Tage |
| Optional | Einwandtraining und explizite Präferenzen | weitere 2–4 Tage |

Damit liegt der erste Kernpilot einschließlich der präzisierten Gesprächsanforderung unter diesen Annahmen grob bei **fünf bis zehn Arbeitstagen**. Bestehende funktionierende Teile können den Aufwand reduzieren; offene Sprachprobleme, fehlende Inhalte oder Integrationskonflikte können ihn erhöhen. Bei einem sehr nahen Termin zuerst hörbare Gesprächsenergie und einen vollständigen Kernablauf stabilisieren; Zusatzmodi verschieben.

Für diesen Pilot zurückgestellt: eigenständiger Nachrichtenversand, automatisierte Kundenanrufe, allgemeine Computersteuerung, neue externe Kalenderintegration, breite Internetrecherche über Personen, automatisierte Versicherungsberatung, umfangreiche Leistungsprognosen, unbeaufsichtigte Agentenketten und eine große neue Wissensplattform. Diese Themen haben andere Abhängigkeiten und sind für den beschriebenen Vorführbeweis nicht erforderlich.

Auch eine Änderung des Basismodells oder Fine-Tuning ist keine Vorbedingung. Erst anhand wiederholter Fehlschläge entscheiden, ob Modellqualität, Daten, Werkzeugbeschreibung oder Ablaufsteuerung die Ursache sind.

## 8. Woran wir den Erfolg erkennen

Alle Zahlen in diesem Abschnitt sind vorgeschlagene Abnahmeziele, keine bereits erreichten Messwerte.

**Technisch und fachlich:** 30 vorab festgelegte Fälle: 20 normale Aufgaben und Varianten, 10 Fälle mit Mehrdeutigkeit, Datenlücke, Korrektur, Rechtewechsel oder Verbindungsfehler. Für jeden Fall erwartete Person, Quelle, Werkzeugauswahl, Antwortinhalt und Datenbankwirkung festlegen. Mindestens 27/30 fachlich erfolgreich in drei wiederholten Läufen; alle zehn kritischen Fälle müssen jeweils die erwartete Grenze einhalten. Keine fremden Daten, erfundenen Quellen, ungewollten Schreibaktionen oder falschen Speicherbestätigungen.

**Sprachgefühl:** Getrennt messen: Ende der Nutzeraussage bis erster hörbarer Rückmeldung und bis zum nützlichen Fachresultat. Vorläufige Zielwerte am Vorführgerät: median höchstens zwei Sekunden bis Rückmeldung, median höchstens sechs Sekunden bis zu einer einfachen Antwort, höchstens zwölf Sekunden bis zu einer umfangreicheren Vorbereitung. Das sind zu prüfende Ziele; zusätzlich langsame Ausreißer und misslungene Unterbrechungen erfassen. Ein schnelles „Ich schaue nach“ verdeckt keine lange Ergebniswartezeit.

**Vorführbarkeit:** Drei vollständige Durchläufe hintereinander auf dem eigentlichen Vorführgerät. Mindestens ein zusätzlicher Mobiltest. Freie Rückfragen, Personenwechsel, „doch Dienstag“, Netzwerkfehler und sichtbare Bestätigung prüfen. Die Kernstrecke muss vor Erreichen des Gesprächslimits funktionieren; ein nötiger Gesprächswechsel darf gespeicherte Arbeit nicht verschwinden lassen. Ein nachweisbarer Textweg dient bei Audioausfall als verständlicher Ersatz.

**Produktwert:** Emil und vier weitere Zielnutzer sehen oder testen den Ablauf. Arbeitshypothese: Mindestens vier von fünf können anschließend einen konkreten eigenen Anwendungsfall nennen und wollen ihn selbst ausprobieren. Für die drei Kernaufgaben Zeit und Nacharbeit gegenüber dem bisherigen Vorgehen messen, statt Zeitersparnis zu behaupten. Nach zwei Wochen kleinen Alltagspiloten prüfen, welche Abläufe wiederholt genutzt werden und wo Menschen wieder zur manuellen Oberfläche wechseln.

**Betrieb und Kosten:** Pro Ablauf Modellaufrufe, Werkzeugrunden, Audiozeit, Fehler und nutzbares Ergebnis erfassen. Kosten mit den dann gültigen Providerpreisen und echten Verbrauchsdaten berechnen. Ein Budget pro Demo beziehungsweise Pilotwoche vor bezahlten Versuchsreihen festlegen. Eine Kostenschätzung aus Texttokens allein deckt Live-Audio nicht ab.

Die bestehenden Fachtests werden gezielt ergänzt. Reale Sprache, Mikrofon, Lautsprecher und Providerlatenz brauchen einen echten Zielgerättest; kontrollierte Simulationen ersetzen ihn nicht.

## 9. Grundlage für das Finanzierungsgespräch

Die Demo beweist drei Dinge: Zugriff auf relevante Arbeitsinformationen, sinnvolle Unterstützung über mehrere Gesprächsschritte und kontrolliert gespeicherte Arbeitsergebnisse. Der Pilotbericht enthält die funktionierenden Abläufe, beobachtete Fehler, tatsächliche Nutzungszeiten und Kosten.

Die nächste Finanzierung lässt sich danach auf konkrete Ergebnisse beziehen: mehr Nutzer durch denselben verlässlichen Ablauf führen, geprüfte Wissensinhalte erweitern, Kontext und Qualität verbessern und ausgewählte Integrationen ergänzen. Ein Euro-ROI oder Mehrumsatz wird erst mit belastbaren Nutzungs- und Geschäftsdaten gerechnet.

## 10. Noch offene Entscheidungen

| Frage | Zuständig | Bedeutung |
| --- | --- | --- |
| Soll die erste Demo überwiegend persönliche Assistenz, Führung oder Vertriebscoaching zeigen? | Auftraggeber / Emil | Kernbeispiel und Gewichtung; aktuelle Annahme: Assistenz plus Führung |
| Wann ist die erste Vorführung, auf welchem Gerät und mit welcher Internetverbindung? | Auftraggeber | Umfang und echte Sprachabnahme |
| Echte freigegebene Daten oder klar gekennzeichnete Beispieldaten? | Auftraggeber / Emil | Vorführumgebung und Vorbereitung |
| Welche internen Begriffe, Leitfäden und Abläufe muss Jarvis sicher kennen, und wer bestätigt sie? | Emil / fachlicher Verantwortlicher | Wissenspaket; zuverlässige interne Antworten benötigen diese Inhalte |
| Welche drei Situationen nerven Emil im Alltag am meisten? | Emil | Abgleich der vorgeschlagenen Kernabläufe mit tatsächlichem Bedarf |

Diese offenen Punkte verhindern die vorliegende Planung nicht. Sie bestimmen die genaue Ausgestaltung vor der Implementierung. In dieser Aufgabe wurden ausschließlich Recherche und dieser Plan erstellt.
