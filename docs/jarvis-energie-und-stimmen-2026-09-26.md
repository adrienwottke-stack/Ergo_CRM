# Jarvis: mehr Energie und Stimmenvergleich

Stand: 26.09.2026. Umsetzung der Rückmeldung zu zu starrer Ansprache und fehlendem Tatendrang. Die folgenden Klangbeschreibungen sind Gestaltungsziele, keine bereits gehörten Ergebnisse.

## Gesprächsstil

Die gemeinsame Persona in `lib/ai-crm/voice-style.ts` gilt für den CRM-Agenten und GPT-Live. Nach dem ersten Hörfeedback ist Energielevel 9 von 10 das Gestaltungsziel: kurze kräftige Sätze, eigene passende Gesprächsimpulse, konkrete nächste Schritte und lockere Reaktionen. Neugierige Rückfragen, hörbare Begeisterung und trockene Pointen sollen sich abwechseln. Humor ist regelmäßig erwünscht, wenn die Situation passt. Bei Motivation und gemeinsamem Loslegen sind drei bis sechs kurze Sätze erlaubt. Fachfragen beginnen weiterhin mit dem belegten Ergebnis. „Bruder“ passt, wenn die Person diese Ansprache selbst verwendet oder wünscht. „Geil“, „bam“ und „zack“ sind mögliche Akzente, kein ständig wiederholtes Skript.

Der native Einstieg lautet mit der Demoanrede: „Hey, Meister Emil! Ich bin da. Los geht's — was packen wir zuerst an?“ Er wird weiterhin nur einmal angestoßen und entfällt, wenn die Person schon spricht. Gespräch, Begrüßung und CRM-Ergebnisse verwenden denselben Stil. Während einer Fachabfrage haben die vorhandenen kurzen Zwischenmeldungen Vorrang vor längeren Motivationspassagen.

Die Sprechvorgaben verlangen deutlich zügigeren Rhythmus, hörbare Vorfreude, prägnante Konsonanten und kompakte Satzenden. Der Zielklang bleibt tief und dezent synthetisch, mit lebendiger Betonung. Das geprüfte Live-Schema bietet keinen numerischen `speed`-Regler; Tempo wird über die Modellanweisung beeinflusst. Es gibt keine garantierte Prozentsteigerung und keinen zusätzlichen Audiofilter. „Bitte ruhiger“ hat für das weitere Gespräch Vorrang. Berechtigungen, Quellen und sichtbare Schreibbestätigungen bleiben maßgeblich.

## Stimmen

| Auswahl | Offizielle Beschreibung beziehungsweise vorhandene Option | Rolle im Vergleich |
| --- | --- | --- |
| Vesper | Männlich geprägt, britischer Einfluss | Bestehender Standard; Kandidat für den technischen britischen Assistenten |
| Meridian | Männlich geprägt, nordamerikanischer Einfluss | Neuer Kandidat für die gewünschte amerikanische Vertriebscoach-Richtung |
| Cinder | Männlich geprägt, Einfluss der US-Südstaaten | Weiterer neuer Vergleichskandidat |
| Cedar | Bereits vorhandene Live-Stimme | Bisherige Alternative |
| Ash | Bereits vorhandene Live-Stimme | Bisherige Alternative |

Die Rollen sind Gestaltungshypothesen. Regionale Prägung garantiert weder einen bestimmten Klang auf Deutsch noch eine Ähnlichkeit zu einer realen Person oder Filmfigur. Der Stimmenwähler und die serverseitige Freigabeliste verwenden dieselben Werte; die eingebauten Namen werden gegen das installierte OpenAI-SDK geprüft. Stimmenwechsel erfolgen vor dem Start einer neuen Sitzung.

Eine eigene deutsche Sprecherstimme ist eine mögliche spätere Alternative, wenn Standardstimmen nicht ausreichen. OpenAI dokumentiert Custom Voices auch für GPT-Live; dafür sind Projektfreigabe, passende Zugriffsrechte und separate Einwilligungs- und Stimmaufnahmen erforderlich. Diese Änderung legt keine Custom Voice an.

## Hörvergleich

Jede Stimme in einer neuen Sitzung mit denselben Aussagen vergleichen:

1. „Ey Bruder, ich habe richtig Bock. Bring mich ins Machen!“ — Ziel: schneller Rhythmus, hörbare Begeisterung, konkreter Startimpuls.
2. „Ich schiebe den nächsten Anruf vor mir her. Hilf mir beim Einstieg.“ — Ziel: ein brauchbarer Gesprächseinstieg, ermutigender Ton und Raum für eine Antwort.
3. Eine tatsächlich beantwortbare CRM-Frage — Ziel: korrekte Fakten und lebendiger Vortrag, ohne erfundene Erfolge oder übersprungene Bestätigung.
4. Während der Antwort unterbrechen — Ziel: Jarvis lässt die Person sprechen.
5. „Ab jetzt bitte ruhiger und sachlicher.“ Danach eine weitere Frage — Ziel: der ruhigere Stil bleibt bestehen.

Bewertung: Energie, deutsche Verständlichkeit, technische Klangfarbe und angenehmes Zuhören. Automatisierte Prüfungen können Auswahl, Übergabe, Sitzungsablauf und Darstellung absichern. Sie beweisen keine hörbare Stimmqualität oder erfolgreiche Befolgung der Persona durch den echten Provider.

## Gemeinsamer Chat und frühere Rückfragen

Die tatsächlichen Worte des Sprachproviders erscheinen direkt im normalen Chat. Eine schriftliche Backendantwort ersetzt diese Worte nicht mehr; sie bleibt als „CRM-Zusammenfassung“ aufklappbar. Quellen und Bestätigungskarten bleiben im selben Verlauf zugänglich. Die Mitschrift ist weiterhin lokal und vorübergehend: Nach Gesprächswechsel oder Neuladen bleibt die gespeicherte fachliche Zusammenfassung. Sie fließt nicht als zusätzliche Anweisung in CRM-Aufträge ein.

Bei weiterhin laufenden Anfragen wird die Gesprächsanregung früher angeboten: üblicherweise nach etwa sieben Sekunden statt frühestens 18 Sekunden. Neue Arbeitsphasen haben Vorrang. Folgeimpulse halten mindestens sechs Sekunden Abstand und enden bei Abschluss oder Abbruch. Die echte hörbare Verzögerung hängt weiterhin vom Sprachprovider ab.

Beim Start wird die Unterhaltung vor Öffnen des Audiostreams zugeordnet. Dadurch bleibt auch eine unmittelbar mit `session.started` eintreffende Begrüßung im Verlauf. Der kontrollierte Browsercheck reproduziert diesen frühen Eingang gezielt und prüft zusätzlich doppelte Ereignisse, Quellen, getrennte Zusammenfassungen, Unterbrechungen und den verzögerten Start mit erreichbarer Enden-Funktion bei 390 und 1440 Pixeln.

Validierung dieser Erweiterung: 221/221 Tests der vollständigen Suite, davon 85 Jarvis-Tests; kontrollierte Pilot-, Fortschritts- und allgemeine Assistant-UX-Browserprüfungen bestanden. Pilot-Darstellung bei 320/390/768/1440/1920 Pixeln in beiden Farbschemata geprüft. ESLint für die geänderten Quelldateien und der isolierte Produktionsbuild ohne Migration gegen die produktive Datenbank sind ebenfalls erfolgreich. Ein echter Provider-Hörtest bleibt offen.

## Lokale Prüfung der ersten Stimmenerweiterung

Nach der Änderung bestanden: 82 Jarvis-Tests, TypeScript ohne Fehler und der kontrollierte Pilot-Browsercheck bei 320, 390, 768, 1440 und 1920 Pixeln in beiden Farbschemata. Der Stimmenwähler enthält die neuen Optionen, übergibt Meridian beim Start und ist während der Sitzung gesperrt. Die API-Prüfung bestätigt die Übergabe beider neuen Namen an den kontrollierten Provider. Begrüßung, Wiederverbindung und Abbruch bleiben abgedeckt. Ein echter Provider-Hörtest wurde nicht durchgeführt.

## Quellen

- [GPT-Live Prompting](https://developers.openai.com/api/docs/guides/live-prompting): Rolle, Ton, Tempo und Gesprächsregeln über Anweisungen steuern.
- [GPT-Live Session-Konfiguration und Stimmen](https://developers.openai.com/api/docs/guides/live-conversations): verfügbare Stimmen, regionale Prägung und neue Sitzung beim Stimmenwechsel.
- [Custom Voices](https://developers.openai.com/api/docs/guides/custom-voices): Freigaben, Aufnahmen und GPT-Live-Anbindung.

Alle drei Quellen wurden am 26.09.2026 abgerufen und mit dem installierten SDK abgeglichen.
