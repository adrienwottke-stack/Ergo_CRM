# Übergabe: UI/UX des AI-CRM-Assistenten

Stand: 19. September 2026. Repository: `C:\Users\adrie\Desktop\Business\Ergo_CRM`.

Dieses Dokument enthält die vollständige im Ursprungstask erarbeitete Konzeption einschließlich Research, Entscheidungsmatrix, aller 18 Wireframes, Nutzerflüssen, deutschen UX-Texten, Komponentenmodell, Umsetzungsetappen und späteren Paketen. Der Originalauftrag ist zusätzlich als Referenz enthalten. Die nächste Session benötigt dafür keinen Zugriff auf den bisherigen Chat oder den ursprünglichen Anhang.

## A. Einstieg für die nächste Session

**Arbeitskopie:** Zum Übergabezeitpunkt war `codex/review-arbeitslagen-onboarding` auf Commit `bc646dc` aktiv. Umfangreiche Änderungen der technischen AI-V1.1 sind bewusst noch nicht committet. Sie gehören zum aktuellen Arbeitsstand und sind zu erhalten.

**Die neue Session im bestehenden Projekt lokal in dieser Arbeitskopie starten.** Ein neuer Worktree nur vom letzten Commit enthält wesentliche Teile der AI-V1.1 und dieses neue Übergabedokument nicht. Falls Isolation nötig wird, zuerst eine bewusste vollständige Übernahme des aktuellen Arbeitsstands planen und prüfen. Keine vorhandenen Änderungen verwerfen, bereinigen, zurücksetzen oder ungeprüft stagen.

**Freigabestand:** Der Nutzer hat die Konzeption positiv aufgenommen und ausdrücklich dieses Übergabedokument beauftragt. Damit ist die ursprüngliche Einschränkung gegen das Anlegen einer Konzeptdatei für dieses Dokument aufgehoben. Eine Implementierung, Datenbankänderung oder Veröffentlichung wurde damit noch nicht ausdrücklich beauftragt. Die zwei in Abschnitt B.12 aufgeführten Produktentscheidungen sind Empfehlungen; ihre konkrete Auswahl wurde bisher nicht einzeln bestätigt. Eine spätere eindeutige Nutzerfreigabe in der neuen Session ist maßgeblich und darf nicht erneut abgefragt werden.

### Modell-Empfehlung

Für die separate Session: **GPT-6 Astra (`gpt-6-astra`), Denkaufwand Extra high (`xhigh`)**.

Begründung: Die Aufgabe verbindet Produktdesign, responsive Frontend-Architektur, gemeinsam verwalteten Gesprächszustand, verbindliche Schreibbestätigungen, Wiederholungs- und Abbruchlogik sowie den Schutz bestehender CRM-Abläufe. Die Wahl von `xhigh` ist eine auf diese Aufgabe bezogene Empfehlung, keine allgemeine Pflicht. Sie betrifft das Modell der Codex-Arbeitssession; das in der CRM-Anwendung konfigurierte Provider-Modell soll dadurch nicht geändert werden.

Die am 19.09.2026 geöffnete [offizielle Astra-Dokumentation](https://developers.openai.com/api/docs/models/gpt-6-astra) beschreibt das Modell für komplexes Reasoning, Coding und umfassende Arbeitsabläufe und dokumentiert `xhigh`. Die aktuelle Codex-App führt Astra und diesen Denkaufwand als verfügbar. Für später eng begrenzte Frontend-Etappen ist GPT-5.6 Sol mit `high` eine mögliche Alternative; für die gemeinsame Architektur- und Sicherheitsarbeit empfehle ich Astra. [Offizielle Sol-Dokumentation](https://developers.openai.com/api/docs/models/gpt-5.6-sol)

### Empfohlenes Zielbild in zehn Punkten

1. Ein gemeinsamer Assistent mit beschriftetem Einstieg im App-Kopf.
2. Auf Heute nur ein kleiner Gesprächseinstieg; kein dauerhaft eingebetteter Vollchat.
3. Desktop primär rechtes Panel, bei intensiver Nutzung dieselbe Unterhaltung als vollständige Arbeitsansicht.
4. Mobil fokussierte Arbeitsansicht mit weiterhin erreichbarem Namen sammeln direkt über dem unveränderten Fünf-Punkte-Dock.
5. Ein gemeinsamer Gesprächs-, Entwurfs- und Anfragestatus über alle Darstellungen hinweg.
6. Unterhaltungen, Speicherfrist, Löschen und Zugang in sekundären Ebenen.
7. Diktieren erzeugt ein prüfbares Transkript; erst Senden startet die Chatverarbeitung.
8. CRM-Information, Vorschlag, Bestätigung und ausgeführte Änderung sind sichtbar unterscheidbar.
9. Mini-Emil bleibt Begleiter der ersten Arbeitsrunden und verweist bei Bedarf auf den Assistenten.
10. Live Voice, proaktive Briefings und RAG/Obsidian bleiben spätere, getrennte Pakete.

### Zwei offene Produktentscheidungen

| Entscheidung | Empfehlung | Noch abzugrenzen |
|---|---|---|
| Grundmodell | Konzept C: ein Assistent mit Desktop-Panel, mobiler Arbeitsansicht und Erweiterung zur vollständigen Desktop-Seite | Alternative wäre nur eine eigene Assistenten-Seite mit geringerem Frontend-Aufwand. |
| Schreibpolitik | Klare kleine Aufträge direkt mit Beleg und brauchbarem Undo; vorherige Bestätigung für Kontaktanlage, bestehende Felder, Erledigen ohne Undo sowie abgeleitete und mehrteilige Änderungen | Alternative wäre die Bestätigung jeder einzelnen Schreibaktion. |

Diese Fragen sind keine Aufforderung, bekannte Produktregeln erneut zur Diskussion zu stellen. Namen sammeln, fünf Dock-Ziele, Eigentümerzugriff, Mini-Emils nicht blockierende Rolle und die Trennung von Kurzzeitkontext und Wissen sind gesetzt.

### Startauftrag zum Kopieren

```text
Arbeite im bestehenden Repository C:\Users\adrie\Desktop\Business\Ergo_CRM.

Lies docs/ai-crm-ux-uebergabe.md vollständig. Es enthält die vollständige Konzeption und den Originalauftrag. Verwende das Dokument als Arbeitsgrundlage und prüfe die beschriebenen Befunde gegen die aktuelle Arbeitskopie. Die vorhandenen uncommitteten Änderungen der AI-V1.1 gehören zum aktuellen Stand und müssen erhalten bleiben.

Übernimm die Rolle eines erfahrenen Senior Product Designers und Full-Stack-Entwicklers. Die Recherche und grundlegende Konzeption liegen vor; wiederhole sie nur, wenn neue Befunde dafür sprechen. Beachte die feste Rolle von Namen sammeln, das unveränderte mobile Fünf-Punkte-Dock, Mini-Emil, Vorführmodus und den ausschließlich eigenen Datenzugriff.

Kläre zunächst den aktuellen Freigabestand anhand meiner Nachricht in dieser Session. Falls ich die Umsetzung noch nicht beauftragt habe, prüfe den aktuellen Stand lesend und lege einen konkreten Arbeitsplan für die erste Umsetzungsetappe vor; benenne dabei nur die zwei noch offenen Produktentscheidungen. Falls meine Nachricht die Entscheidungen und Umsetzung bereits freigibt, behandle das als Freigabe und beginne die autorisierte Arbeit ohne erneute Bestätigungsschleife.

Trenne UI-Arbeit, zusätzliche Frontend-Logik und notwendige Backend-Erweiterungen. Bestätigungen, genaue Aktionsstatus, Abbruch, sichere Wiederholung und Undo dürfen nicht als bereits vorhandene Backend-Funktionen vorausgesetzt werden. Aufnahme bedeutet zunächst Diktieren mit Transkriptprüfung, nicht Live Voice.

Keine gemeinsam genutzte oder produktive Datenbank, echten OpenAI-/Stripe-Aufrufe, Migrationen, neuen Abhängigkeiten, Feature-Aktivierung oder Veröffentlichung ohne passende ausdrückliche Freigabe. Kein Commit, Push oder Deployment aus der bloßen Übergabe ableiten. Prüfe Skripte, bevor du sie ausführst: npm run build führt hier prisma migrate deploy aus. Nutze bei späterer Testfreigabe isolierte lokale Testdaten und die dokumentierten sicheren Prüfwege.

Das Zielbild ist in Etappen umzusetzen und bei 1280 × 800 sowie 375 × 812 einschließlich echter mobiler Tastatur, Safe Areas, langen Texten, Fehlern, Bestätigungen und Undo zu validieren. Nicht durchgeführte Prüfungen ehrlich offenlassen. Live Voice, proaktive Briefings und RAG/Obsidian gehören nicht zum ersten UI-Paket.
```

### Erste Schritte der nächsten Session

- Aktuelles `git status`, Branch, Commit und Worktrees lesen; mögliche Paralleländerungen berücksichtigen.
- Hauptdateien und alle sechs vorhandenen Screenshots mit dem Konzept abgleichen. Die Aussagen in Teil B sind ein Snapshot vom 19.09.2026.
- Nutzerfreigaben aus der neuen Session prüfen, bevor offene Punkte erneut angesprochen werden.
- Die nächste konkrete Etappe festlegen; vorhandene Sicherheitslogik additiv erweitern und keine neue Oberfläche auf angenommene Fähigkeiten bauen.
- Erst nach tatsächlicher Umsetzungsfreigabe produktiven Code ändern. Nach erfolgreicher Freigabe Routineentscheidungen selbst treffen und die vereinbarte Etappe abschließen.

### Technische Fakten, die beim Übernehmen leicht verloren gehen

- Die heutige UI sendet das Transkript sofort an den Chat-Agenten. Transkriptprüfung ist eine geplante Verhaltensänderung.
- Der Agent führt Schreibwerkzeuge heute direkt aus. Eine Karte allein erzwingt keine Bestätigung.
- Die Chatroute liefert abschließendes JSON; detaillierte laufende Zustände und Streaming sind nicht bereits vorhanden.
- Gespeicherte Belege werden beim Wiederöffnen mit deaktiviertem Undo geladen. Das kurze Undo-Fenster beträgt regulär 30 Sekunden ab Aktion, nicht ab Anzeigen der Antwort.
- Das Erledigen einer Wiedervorlage bietet aktuell kein Undo.
- Die Unterhaltungsliste lädt derzeit maximal zehn Gespräche.
- Sieben Tage bedeuten eine feste Frist ab Beginn. Zugriff und Modellkontext enden mit Ablauf; physische Bereinigung erfolgt getrennt über den Cron.
- Maximal 20 Nachrichten sind nicht 20 Nutzerfragen. Bei regulären erfolgreichen Wechseln sind es typischerweise zehn Frage-Antwort-Paare.
- Der automatische Gesprächsneustart ist in der aktuellen UI nicht ausreichend vom sichtbaren alten Verlauf getrennt.
- Der Vorführschutz liegt heute auf der Heute-Seite und muss beim globalen Einbau mitwandern.
- Mehrere Layoutgruppen verwenden AppShell. Gleiche Komponentenverwendung garantiert keine Zustandskontinuität beim Wechsel der Layoutgruppe.
- Die API zur Transkription hält ihr Ergebnis kurzzeitig für sichere Wiederholungen vor. Audio wird in der Anwendung nicht dauerhaft gespeichert. Nicht behaupten, ein noch nicht gesendeter Transkriptentwurf sei überhaupt nicht serverseitig verarbeitet worden.
- Die gespeicherten Browserergebnisse verwenden lokale Fixtures und simulierte Provider/Aufnahme. Sie belegen keinen echten Sprachlauf, kein reales Smartphone-Keyboard und keine produktive Abnahme.

### Nachgeprüfte Skripte und Prüfgrenzen

Am 19.09.2026 enthält package.json:

- `build`: `prisma migrate deploy && next build` — nicht als harmlose lokale Prüfung verwenden.
- `build:check`: `next build` — ohne Migrationsbefehl, aber Umgebung und mögliche Datenzugriffe trotzdem vor Ausführung prüfen.
- `typecheck`: `next typegen && tsc --noEmit`.
- `test:ai`: lokale AI-Domain-/API-Tests über den Alias-Hook.
- `test:ai:browser`: vorhandener lokaler Browserablauf.

Diese Angaben sind kein Auftrag zur sofortigen Ausführung. Im Analyse- und Übergabetask wurden keine dieser Prüfungen erneut gestartet. Vor späteren Testläufen die aktuelle Skriptfassung und die Isolation der Testdatenbank prüfen. Vor Preview-Veröffentlichung keinesfalls aus dem Namen Preview auf Datenbankisolation schließen; passende bestehende Release-Regeln gelten weiterhin.

### Lesefolge

- **Teil B:** vollständige Konzeption. Enthält alle zwölf Ergebnisabschnitte und 18 Wireframes.
- **Teil C:** Originalauftrag als Anforderungsreferenz. Seine ursprünglichen Ausführungsgrenzen sind historisch einzuordnen; die Dokumenterstellung wurde danach ausdrücklich erlaubt.
- **Teil D:** Abschluss- und Abnahmecheckliste für die spätere Umsetzung.

---

## B. Vollständige Konzeption aus dem Ursprungstask

Der folgende Text wird vollständig übernommen; nur die interne Memory-Zitationsmarkierung am Ende wurde nicht in die Projektdatei kopiert. Die Aussage „keine Dateien angelegt“ im historischen Konzept beschreibt den damaligen Analysetask. Im anschließenden Übergabetask wurde ausschließlich dieses neue Dokument erstellt.

**Ich empfehle ein hybrides Modell: einen einzigen CRM-Assistenten mit einem globalen Einstieg, einem rechten Panel am Desktop und einer fokussierten Arbeitsansicht auf dem Smartphone.** Auf „Heute“ bleibt eine kleine Einladung zum Gespräch. Für längere Arbeit lässt sich dasselbe Gespräch in eine vollständige Assistenten-Seite erweitern.

Die entscheidende Veränderung ist die Reihenfolge: **Zuerst sieht Emil das Gespräch und die Eingabe. Unterhaltungsverwaltung, Speicherfrist und Kontoinformationen erscheinen bei Bedarf.** CRM-Änderungen bekommen dagegen bewusst mehr Klarheit: Was ist vorgeschlagen, was wartet auf Bestätigung, was wurde gespeichert?

Zwei Punkte würde ich gegenüber deiner vorläufigen Hypothese verändern: Der globale Einstieg gehört zunächst **beschriftet in den App-Kopf**, weil ein weiterer schwebender Knopf unten rechts mit Mini-Emil konkurriert. Die mobile Arbeitsansicht behält **„Namen sammeln“ und das bestehende Fünf-Punkte-Dock**. Ein Vollbild, das diese Elemente verdeckt, würde eure bisherige Produktentscheidung aufheben.

Die folgende Konzeption basiert auf dem aktuellen, einschließlich der uncommitteten Änderungen gelesenen Repository, allen sechs genannten Screenshots und aktueller Recherche vom 19. September 2026. Ich habe keine Dateien verändert oder angelegt, keine Anwendung mit Datenbankzugriff gestartet und keine Provider-, Build-, Migrations- oder Release-Aktionen ausgeführt.

---

**1. Bestandsaufnahme**

Der vorhandene Assistent ist eine brauchbare technische Grundlage. Das Hauptproblem liegt in seiner Einbettung und in der fehlenden Trennung zwischen Gespräch, Verwaltung und Ausführung.

**Aktuelle Informationsarchitektur**

In [heute/page.tsx](C:/Users/adrie/Desktop/Business/Ergo_CRM/app/(app)/heute/page.tsx:542) steht der vollständige Assistent unmittelbar nach dem Seitenkopf – vor dem Einstieg in „Namen sammeln“ und der nächsten eigentlichen CRM-Handlung.

[AiCrmAssistant.tsx](C:/Users/adrie/Desktop/Business/Ergo_CRM/components/ai-crm/AiCrmAssistant.tsx:409) vereint derzeit:

- Produktüberschrift, Erklärung und Aktiv-Status;
- Unterhaltungswahl, neue Unterhaltung und Löschen;
- Ablaufdatum, Nachrichtenzähler und Aufbewahrungserklärung;
- Starter-Fragen;
- Chatverlauf und Aktionsbelege;
- Aufnahme, Audiowiedergabe, Transkription und Texteingabe;
- Fehler, Nutzungskontingent und Abonnementverwaltung.

Damit ist der Assistent gleichzeitig Produktwerbung, Verwaltungsoberfläche, Chat und Aktionskonsole. Diese Ebenen sind funktional nachvollziehbar, erhalten aber zu ähnliche visuelle Priorität.

**Was die Screenshots konkret zeigen**

| Beleg | Beobachtung | Konsequenz für das Konzept |
|---|---|---|
| [desktop-active.png](C:/Users/adrie/Desktop/Business/Ergo_CRM/test-results/ai-crm/desktop-active.png) | Bei 1280 × 800 beginnt die große Assistentenkarte ungefähr bei y = 282. Die Eingabe reicht bereits unter den sichtbaren Bildschirmrand. | Der Composer braucht einen eigenen, dauerhaft sichtbaren Bereich innerhalb der Assistentenansicht. |
| [desktop-result.png](C:/Users/adrie/Desktop/Business/Ergo_CRM/test-results/ai-crm/desktop-result.png) | Antwort und Beleg sind grundsätzlich gut zusammengeführt. Die Aussage „Gespräch dokumentiert und Follow-up angelegt“ ist allerdings umfangreicher als der sichtbare einzelne Beleg. | Erzählender Antworttext darf nicht als alleiniger Nachweis für Änderungen dienen. Jede tatsächlich ausgeführte Aktion braucht einen eigenen Status. |
| [desktop-contact-followups.png](C:/Users/adrie/Desktop/Business/Ergo_CRM/test-results/ai-crm/desktop-contact-followups.png) | Mehrere Wiedervorlagen sind in der normalen Kontaktansicht sichtbar; die früheste ist als nächster Schritt ausgezeichnet. | Diese normale CRM-Ansicht bleibt der Ort zum Weiterarbeiten. Der Chat zeigt kompakte Ergebnisse mit Verbindung dorthin. |
| [mobile-active.png](C:/Users/adrie/Desktop/Business/Ergo_CRM/test-results/ai-crm/mobile-active.png) | Bei 375 × 812 sind fast nur Assistentenüberschrift und Unterhaltungsverwaltung sichtbar. Gespräch und Composer liegen unterhalb des ersten Ausschnitts. | Verwaltung aus der Hauptfläche nehmen. Die erste sichtbare Assistentenansicht muss eine Eingabe ermöglichen. |
| [mobile-voice.png](C:/Users/adrie/Desktop/Business/Ergo_CRM/test-results/ai-crm/mobile-voice.png) | Der Screenshot zeigt nach dem Voice-Test wieder den oberen Verwaltungsbereich. Aufnahme und Transkript sind darin nicht sichtbar. | Der Dateiname ist kein visueller Nachweis für eine gut verständliche Aufnahmeoberfläche. Dafür fehlen eigene Zustandsaufnahmen. |
| [mobile-locked.png](C:/Users/adrie/Desktop/Business/Ergo_CRM/test-results/ai-crm/mobile-locked.png) | Der gesperrte Assistent nimmt mit Produktbeschreibung und Aktivierungsangebot einen großen Teil von „Heute“ ein. | Ein nicht nutzbares Zusatzprodukt sollte die tägliche CRM-Arbeit nicht dominieren. |

Die Screenshots stammen aus dem lokalen Testlauf vom 18. September. [result.json](C:/Users/adrie/Desktop/Business/Ergo_CRM/test-results/ai-crm/result.json) meldet erfolgreiche Prüfungen. Der zugehörige [Browser-Test](C:/Users/adrie/Desktop/Business/Ergo_CRM/scripts/ai-crm-browser.mjs) verwendet jedoch simulierte Chat-, Transkriptions- und Aufnahmeabläufe. Die Prüfung auf mindestens 44 Pixel Höhe betrifft ausdrücklich den primären Sendeknopf. Sie belegt nicht, dass sämtliche Interaktionen bereits ausreichend große Ziele haben.

**Stärken, die erhalten bleiben sollten**

- Der Assistent arbeitet an vorhandenen CRM-Entitäten und erzeugt keine parallele Aufgabenwelt.
- Schreibaktionen liefern bereits eigene Belege mit Links.
- Eigentümerprüfung, validierte Werkzeuge und Idempotenz sind serverseitig angelegt.
- Unterhaltungen liegen auf dem Server und sind nach erneutem Anmelden auf anderen Geräten verfügbar.
- Wiedervorlagen werden als einzelne Einträge behandelt.
- Das bestehende Farbsystem besitzt semantische Tokens für helle und dunkle Darstellung.
- Die heutige Einbettung berücksichtigt den Vorführmodus.

**Technische Realität mit unmittelbaren UX-Folgen**

| Befund im aktuellen Code | Bedeutung für die Konzeption |
|---|---|
| Nach erfolgreicher Transkription wird unmittelbar `sendMessage(...)` aufgerufen. | Eine Transkriptprüfung vor dem Absenden wäre eine echte Verhaltensänderung. |
| Der Agent ruft Schreibwerkzeuge direkt auf. Ein verbindlicher Zustand „wartet auf Bestätigung“ fehlt. | Bestätigungskarten benötigen eine serverseitig durchgesetzte Unterbrechung vor der Änderung. |
| Die Chatroute liefert die Antwort abschließend als JSON. | Tokenweises Streaming und genaue laufende Werkzeugstatus sind noch keine vorhandene UI-Funktion. |
| Der Server erhält ein Abbruchsignal; die Oberfläche hat keinen ausgearbeiteten Abbruchablauf. | Ein verlässlicher Stop-Knopf braucht definierte Ergebnisse für bereits ausgeführte Aktionen. |
| Beim Wiederöffnen werden gespeicherte Belege ausdrücklich mit `undoable: false` angezeigt. | „Rückgängig“ über Reload oder Gerätewechsel hinweg braucht eine erneute serverseitige Prüfung. |
| Das reguläre Undo-Fenster beträgt 30 Sekunden. | Ein Countdown darf nicht beim Anzeigen der Antwort neu beginnen. Maßgeblich ist die tatsächliche Aktion. |
| `complete_follow_up` liefert derzeit `undoable: false`. | „Wiedervorlage erledigen“ verdient eine Bestätigung, wenn es durch den Assistenten erfolgt. |
| Bei automatischem Neustart wird die Gesprächs-ID gewechselt, der sichtbare alte Verlauf aber nicht entsprechend getrennt. | Die Oberfläche kann Kontinuität suggerieren, obwohl der Server bereits einen neuen Gesprächskontext verwendet. |
| Die Unterhaltungsliste lädt maximal zehn Einträge. | „Alle Unterhaltungen der letzten sieben Tage“ würde eine Erweiterung der Liste bzw. Pagination erfordern. |
| Zugriff endet nach sieben Tagen; physische Bereinigung erfolgt durch einen täglichen Cron. | „Wird exakt um … gelöscht“ ist als UI-Zusage zu präzise. „Verfügbar bis …“ bildet den aktuellen Zugriff besser ab. |
| Die Oberfläche erhält vor allem `enabled`, obwohl die Berechtigungslogik unterschiedliche Sperrgründe kennt. | Nicht freigeschaltet, vorübergehend deaktiviert und Nutzungslimit müssen unterschiedlich erklärt werden. |
| Auch Lesen und Löschen von Unterhaltungen prüfen aktuell die AI-Berechtigung. | Soll ein Nutzer nach Ende des Zugangs seine Gespräche noch verwalten können, braucht das eine bewusste Backend-Anpassung. |

Grundlagen dafür sind insbesondere [Agent](C:/Users/adrie/Desktop/Business/Ergo_CRM/lib/ai-crm/agent.ts), [CRM-Werkzeuge](C:/Users/adrie/Desktop/Business/Ergo_CRM/lib/ai-crm/tools.ts), [Unterhaltungslogik](C:/Users/adrie/Desktop/Business/Ergo_CRM/lib/ai-crm/conversations.ts), [Chatroute](C:/Users/adrie/Desktop/Business/Ergo_CRM/app/api/ai-crm/chat/route.ts), [Berechtigungen](C:/Users/adrie/Desktop/Business/Ergo_CRM/lib/ai-crm/entitlement.ts) und [Undo-Fenster](C:/Users/adrie/Desktop/Business/Ergo_CRM/lib/undo-window.ts).

**Bestehende Flächenkonkurrenz**

[AppShell](C:/Users/adrie/Desktop/Business/Ergo_CRM/components/AppShell.tsx), [NavLinks](C:/Users/adrie/Desktop/Business/Ergo_CRM/components/NavLinks.tsx) und [MiniEmil](C:/Users/adrie/Desktop/Business/Ergo_CRM/components/coach/MiniEmil.tsx) zeigen, warum ein weiterer unabhängiger Launcher problematisch wäre:

- Das mobile Dock ist bereits ein fester Arbeitsbereich.
- „Namen sammeln“ liegt direkt darüber.
- Mini-Emil erscheint wiederum oberhalb dieses Bereichs.
- Die globale Undo-Leiste beansprucht bei Bedarf ebenfalls unteren Bildschirmraum.

Mini-Emil blendet sich schon heute bei bestimmten Vordergrundsituationen aus, etwa beim Bearbeiten eines Eingabefeldes oder bei modalen Dialogen. Ein dauerhaft offenes, nicht modales Assistentenpanel benötigt zusätzlich eine ausdrückliche Abstimmung mit Mini-Emil.

---

**2. Research: relevante Muster und konkrete Konsequenzen**

Die folgenden Beobachtungen stammen aus offiziellen Produktbeschreibungen und Dokumentationen. Ich habe keine angemeldeten Fremdprodukte selbst durchgetestet. Die rechte Spalte enthält meine Ableitung für dieses CRM.

| Produkt oder Quelle | Dokumentiertes Muster | Konsequenz für dieses CRM |
|---|---|---|
| **ChatGPT – Diktieren** | Eine einzelne Aufnahme wird in bearbeitbaren Text umgewandelt, den man vor dem Senden prüfen kann. [Offizielle Dokumentation](https://help.openai.com/en/articles/12168547-voice-dictation-faq) | Sprache zuerst als Entwurf behandeln. Emil kann Namen, Negationen und Zeitangaben korrigieren, bevor CRM-Aktionen ausgelöst werden. |
| **ChatGPT – Voice** | Voice und Text können innerhalb eines Chats zusammenarbeiten. Diktieren wird ausdrücklich vom laufenden Sprachgespräch unterschieden; Mikrofon und Beenden sind eigene Steuerelemente. [ChatGPT Voice](https://help.openai.com/en/articles/20001274) | Ein gemeinsames Gesprächsmodell vorbereiten, aber zwei eindeutig benannte Eingabearten: „Nachricht diktieren“ und später „Live sprechen“. |
| **Claude – Unterhaltungsverwaltung** | Gespräche liegen in einer separaten Liste; Löschen und Umbenennen sind sekundäre Aktionen. Löschen wird bestätigt. [Claude Help Center](https://support.claude.com/en/articles/8230524-delete-or-rename-a-conversation) | Gesprächswechsel über den Kopf der Ansicht, Löschen im Menü. Keine ständig sichtbare rote Löschaktion neben der Eingabe. Eine reine Hover- oder Langdruckbedienung würde ich nicht übernehmen. |
| **Dynamics 365 Sales Copilot** | Ein Eintrag in der Befehlsleiste öffnet ein Seitenpanel. Darin stehen natürliche Sprache und auf die Arbeit bezogene Starter zur Verfügung. [Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/sales/use-sales-copilot) | Der Assistent bleibt am Kontakt und an der Tagesarbeit erreichbar. Drei konkrete Einstiegsfragen genügen; eine umfangreiche Prompt-Bibliothek wäre für Emil zunächst zusätzliche Bedienlast. |
| **HubSpot Breeze – Desktop** | Globaler Einstieg, Chatverwaltung in einer zweiten Ebene, Erweiterung zur vollständigen Ansicht, Rückfragen im Gespräch und einsehbarer Kontext. [HubSpot-Dokumentation](https://knowledge.hubspot.com/ai/use-breeze-assistant) | Das hybride Modell ist für CRM-Arbeit plausibel. Übernehmen würde ich den Wechsel der Ansichtsgröße und expliziten Kontext. Projekte, Artefakte und viele Quellenoptionen gehören nicht in eure erste Ausbaustufe. |
| **HubSpot Breeze – Mobil und Voice** | Mobile Spracheingabe und echter Voice-Modus sind getrennte Funktionen. Der aktuelle Voice-Modus wird als Beta beschrieben. [Mobile Bedienung](https://knowledge.hubspot.com/ai/use-breeze-assistant-on-the-hubspot-mobile-app), [Voice-Modus](https://knowledge.hubspot.com/ai/use-breeze-assistant-voice-mode-on-mobile) | Eine spätere Live-Funktion kann neben dem Diktieren hinzukommen. Ein heutiger Mikrofonknopf darf nicht den Eindruck erwecken, bereits ein fortlaufendes Gespräch zu starten. |
| **Gemini Live** | Unterbrechen, Pausieren bzw. Stummschalten, Beenden und Wechsel zurück zum Text sind unterscheidbare Zustände. Für bestimmte Aktionen gibt es Undo. [Google-Hilfe](https://support.google.com/gemini/answer/15274899?hl=en) | „Mikrofon aus“ und „Gespräch beendet“ müssen später unterschiedliche Zustände sein. Die konkreten CRM-Belege bleiben auch nach dem Ende einer Sprachsession sichtbar. |
| **Siri** | Sprach- und Texteinstiege bestehen nebeneinander; das Aktivieren ist nicht ausschließlich an einen gesprochenen Aufruf gebunden. [Apple Support](https://support.apple.com/en-gb/105020) | Text bleibt vollständig bedienbar. Versteckte Gesten oder ein vorausgesetztes Aktivierungswort sind für die CRM-Webanwendung kein geeigneter Haupteinstieg. |
| **Microsoft Human–AI Interaction Guidelines** | Fähigkeiten erklären, relevante Informationen zeigen, einfache Korrektur ermöglichen und bei Unsicherheit den Handlungsumfang begrenzen. [Forschung und Leitlinien](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf) | Rückfragen bei ähnlichen Kontakten, editierbare Transkripte und nachvollziehbare Belege sind zentrale Interaktionen. Zusätzliche „AI-Dekoration“ trägt wenig dazu bei. |
| **Copilot Studio – Kontrollgrenzen** | Kritische Abläufe sollen durch fest definierte Regeln und Bestätigungsschritte abgesichert werden. [Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration) | Die Bestätigung wird an einen konkreten, serverseitig gespeicherten Aktionsplan gebunden. Ein freier Modelltext „Soll ich das machen?“ genügt nicht als technische Absicherung. |
| **ChatGPT – Gedächtnis** | Gesprächsverlauf, gespeichertes Wissen und dessen Quellen haben unterschiedliche Verwaltungs- und Löschregeln. [Memory-Dokumentation](https://help.openai.com/en/articles/8590148-memory-faq) | Eure bewusste Trennung ist richtig. Späteres Wissen braucht eine eigene Verwaltung; das Löschen eines Chats darf keine unklare Aussage über CRM-Daten oder dauerhaftes Wissen erzeugen. |
| **W3C – Barrierefreiheit** | Fixierte Elemente dürfen fokussierte Bedienung nicht verdecken; Statusänderungen müssen ohne Fokuswechsel wahrnehmbar sein. [Fokus](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [Statusmeldungen](https://www.w3.org/WAI/WCAG22/Understanding/status-messages) | Tastatur, Composer, Dock und Meldungen müssen gemeinsam geprüft werden. Ein visuell vorhandener Knopf unter der Smartphone-Tastatur ist praktisch nicht erreichbar. |

**Was daraus ausdrücklich nicht folgt:** Das CRM benötigt weder die gesamte Funktionsfülle dieser Produkte noch deren Speicherregeln oder visuelle Identität. Die geeigneten Muster sind die ruhige Gesprächsfläche, die klare Eingabe, sekundäre Verwaltung und nachvollziehbare Übergänge zwischen Fragen und Handeln.

---

**3. Vergleich der drei Konzepte**

**Konzept A – globaler Launcher mit Overlay**

Ein dauerhaft sichtbarer Knopf unten rechts öffnet am Desktop ein Panel und mobil eine große Gesprächsfläche.

Der Vorteil ist die schnelle Erreichbarkeit. Auf einer Kontaktseite bleibt der Hintergrund sichtbar. Der Nachteil ist hier besonders konkret: Mini-Emil, Undo und der neue Launcher benötigen denselben Raum. Mobil wird aus dem kleinen Einstieg eine zusätzliche schwebende Bedienebene über einem ohnehin belegten unteren Bereich.

Für kurze Fragen geeignet; für längere Verläufe, Quellen und umfangreiche Aktionen wird das reine Overlay schnell eng.

**Konzept B – eigener AI-Arbeitsbereich**

Eine eigene Seite bietet links Unterhaltungen, mittig den Chat und unten den Composer. Mobil wird die Unterhaltungsliste separat geöffnet.

Dieses Modell ist ruhig, gut verständlich und vergleichsweise einfach umzusetzen. Es eignet sich hervorragend für längere Gespräche und spätere Wissensarbeit. Sein Nachteil liegt im häufigen Wechsel zwischen Gespräch und CRM-Datensatz. Emil verlässt eine laufende Kontaktaufgabe, obwohl er möglicherweise nur eine kurze Rückfrage hat.

**Konzept C – ein Assistent mit Panel und Arbeitsbereich**

Ein globaler Eintrag sowie wenige kontextuelle Aktionen öffnen denselben Assistenten:

- Desktop: standardmäßig rechts neben der Arbeit.
- Mobil: als eigene fokussierte Arbeitsansicht.
- Intensive Desktop-Nutzung: Erweiterung zur vollständigen Seite.

Gespräch, Entwurf, Kontext und laufende Aktionen bleiben identisch. Die zusätzlichen Darstellungsformen erhöhen den Implementierungsaufwand, sind aber für den Nutzer keine separat zu erlernenden Produkte.

**Entscheidungsmatrix**

Bewertung von 1 = ungünstig bis 5 = günstig. Bei Aufwand bedeutet 5 „geringer Aufwand“, bei Störungsrisiko 5 „geringes Risiko“. Die Werte sind eine begründete Designbewertung, keine gemessenen Nutzertest-Ergebnisse.

| Kriterium | Gewicht | A: Launcher | B: Arbeitsbereich | C: Hybrid |
|---|---:|---:|---:|---:|
| Sofortige Verständlichkeit | 12 % | 4 | 4 | 5 |
| Auffindbarkeit | 8 % | 5 | 3 | 5 |
| Mobile Nutzbarkeit | 12 % | 3 | 5 | 4 |
| Geringe kognitive Belastung | 10 % | 3 | 5 | 4 |
| Nähe zur täglichen CRM-Arbeit | 12 % | 4 | 2 | 5 |
| Erweiterbarkeit für Live Voice | 7 % | 3 | 5 | 5 |
| Erweiterbarkeit für Wissensquellen | 6 % | 3 | 5 | 5 |
| Nachvollziehbare Schreibaktionen | 12 % | 4 | 4 | 4 |
| Anschluss an vorhandene Technik | 8 % | 4 | 4 | 4 |
| Umsetzungsaufwand | 6 % | 4 | 4 | 2 |
| Geringes Risiko für bestehende Abläufe | 7 % | 2 | 4 | 4 |
| **Gewichtetes Ergebnis** | **100 %** | **3,59** | **4,03** | **4,33** |

**Empfehlung: Konzept C.** Sein Vorsprung entsteht durch die Verbindung mit laufender CRM-Arbeit. Dafür müssen drei Regeln gelten:

1. Es existiert nur ein Gesprächszustand.
2. Die Ansichtsgröße verändert weder den Kontext noch die Fähigkeiten.
3. Zusätzliche Einstiege öffnen den Assistenten, erzeugen aber nicht jeweils einen eigenen Chatbot.

Die Sicherheit erhält absichtlich in allen Konzepten dieselbe Bewertung: Sie entsteht durch die Ausführungslogik und die Belege, nicht durch die Position des Fensters.

---

**4. Empfohlene Informationsarchitektur**

**Einstiege**

| Ort | Sichtbarer Einstieg | Verhalten |
|---|---|---|
| Globaler App-Kopf | **Assistent** mit Sprechblasen-Symbol | Öffnet das zuletzt verwendete, noch verfügbare Gespräch oder den leeren Zustand. |
| „Heute“ | **Deinen Tag besprechen** | Öffnet denselben Assistenten mit passendem Fragevorschlag. |
| Eigener Kontakt | **Mit Assistent besprechen** | Öffnet mit sichtbar angehängtem Kontaktbezug. |
| Einzelne Wiedervorlage | Im Aktionsmenü: **Mit Assistent besprechen** | Übergibt genau diese Wiedervorlage und ihren Kontakt als sichtbaren Bezug. |
| „Namen sammeln“ | Kleine Hilfeaktion **Assistent fragen** | Unterstützt bei einer Frage; übernimmt keine ungesendeten Namenslisten und erzeugt keine Kontakte ohne Auftrag. |
| Mini-Emil | Bei passender Erklärung: **Im Assistenten besprechen** | Schließt die Erklärung und öffnet den normalen Assistenten mit einer vorbereiteten Frage. |
| Geöffnetes Desktop-Panel | **Groß öffnen** | Wechselt mit demselben Gespräch und Entwurf zur vollständigen Ansicht. |

Der Produktname in der Oberfläche lautet zunächst **„Assistent“**, innerhalb erklärender Texte „CRM-Assistent“. Astra bleibt die Modellbezeichnung.

Auf schmalen Geräten kann die globale Suche als beschriftetes, barrierefrei benanntes Icon erscheinen, damit „Assistent“ sichtbar ausgeschrieben bleibt. Das Fünf-Punkte-Dock erhält keinen sechsten Eintrag.

**Was auf „Heute“ bleibt**

Eine einzelne ruhige Zeile, ungefähr 64–88 Pixel hoch:

> **Deinen Tag besprechen**
> Fragen stellen oder eine Nachricht diktieren. **Öffnen →**

Sie steht unter dem Seitenkopf. „Namen sammeln“, nächste Handlung und Tagesarbeit behalten ihre fachliche Bedeutung und ihre bestehenden Ziele.

Für den ersten Umbau empfehle ich **kein automatisch generiertes Tagesbriefing**. Ein solches Briefing würde zusätzliche Fragen nach Aktualität, Kosten, Wiederholungen und Priorisierung einführen. Der Einstieg „Was steht heute an?“ ist bereits nützlich und benötigt keine neue proaktive Produktlogik.

Wenn später eine kompakte Zahl angezeigt wird, stammt sie aus derselben CRM-Abfrage wie die Tagesliste. Zwei fällige Wiedervorlagen bei einem Kontakt bleiben zwei Aufgaben.

**Anatomie der Hauptansicht**

1. **Kopf:** Assistent, Gesprächsauswahl, neue Unterhaltung, Menü; am Desktop zusätzlich Groß öffnen und Schließen.
2. **Optionaler Kontext:** „Bezug: Jonas Müller ×“.
3. **Gesprächsverlauf:** ein vertikal scrollender Bereich.
4. **Composer:** Texteingabe, Diktieren, Senden.
5. **Sekundäre Ansichten:** Unterhaltungen, Angaben zur Speicherung, Nutzung und Zugang.

Die Hauptansicht zeigt keine ständige „Aktiv“-Plakette, keinen Nachrichtenzähler und keine Abonnementverwaltung.

**Kontextübernahme**

Die Seite im Hintergrund wird nicht automatisch als vollständiger Modellkontext eingelesen.

- Ein bewusster Einstieg aus einem Kontakt hängt diesen Kontakt sichtbar an.
- Der Server prüft die Eigentümerschaft erneut.
- Ein Wechsel der CRM-Seite verändert einen bereits geöffneten Gesprächsbezug nicht stillschweigend.
- Ein neuer Kontextbezug wird vor dem Senden sichtbar.
- Entfernen des Bezugs löscht keine CRM-Daten.
- Auf Teamseiten erhält der Assistent dadurch keinen Zugang zu fremden Kontakten.

Die aktuelle Chatroute akzeptiert noch keinen solchen strukturierten Kontextanhang. Das ist eine gezielte Erweiterung des API-Vertrags.

**Desktop: Panel und vollständiger Arbeitsbereich**

Bei 1280 × 800:

- Panel etwa **432 Pixel breit**.
- Verbleibender CRM-Bereich etwa **800 Pixel breit**, abhängig von Außenabständen.
- Panel unterhalb des globalen Kopfes; Composer am unteren Panelrand.
- Kein abdunkelnder Hintergrund: Das Panel ist eine ergänzende Arbeitsfläche.
- Seiteninhalt wird innerhalb des verbleibenden Raums neu angeordnet.
- Wenn eine Ansicht den Platz nicht sinnvoll teilen kann oder das Fenster schmaler wird, öffnet der Assistent als vollständige Arbeitsansicht.
- Der Wechsel zu „Groß öffnen“ ist jederzeit möglich, erfolgt aber nicht überraschend mitten im Gespräch.

**Mobil: fokussierte Arbeitsansicht mit bestehendem Dock**

Hier besteht ein echter Zielkonflikt zwischen maximaler Chatfläche und dauerhaft erreichbarem „Namen sammeln“. Ich würde eure bestehende Entscheidung priorisieren.

Die Reihenfolge lautet:

> Assistentenkopf → Verlauf → Composer → Namen sammeln → Fünf-Punkte-Dock

Die vorhandene Dockhöhe beträgt im Standardraster rund **147 Pixel zuzüglich Safe Area**. Bei 812 Pixel Gesamthöhe verbleibt mit einem 64-Pixel-Kopf und einem ungefähr 96-Pixel-Composer eine ausreichend große Gesprächsfläche.

Bei einer beispielhaften 300-Pixel-Tastatur bleiben ungefähr:

> 512 Pixel sichtbare Höhe − 64 Kopf − 80 Composer − 147 Dock = **221 Pixel Verlauf**

Ein Kontextstreifen reduziert diese Fläche zusätzlich. Deshalb:

- kein zweiter App-Kopf über dem Assistentenkopf;
- kein permanenter Speicherhinweis;
- kein großes Voice-Modul neben dem Composer;
- keine zweite horizontale Werkzeugleiste;
- Texteingabe bei geöffneter Tastatur zunächst kompakt, mit internem Wachstum;
- Größenberechnung anhand des tatsächlich sichtbaren Viewports.

**„Vollbild“ bedeutet hier die vollständige mobile Arbeitsfläche innerhalb des CRMs.** Ein späterer Modus, der Dock und Sammelaktion zeitweise verbirgt, wäre eine ausdrückliche Änderung dieser Produktregel und ist nicht Bestandteil meiner Empfehlung.

**Unterhaltungsverwaltung**

Ein Klick auf den Gesprächstítel öffnet:

- **Neue Unterhaltung**
- Gespräche nach letzter Aktivität, gruppiert nach Tagen
- Titel, letzte Aktivität und „Verfügbar bis …“
- pro Eintrag ein erreichbares Menü

Löschen liegt im Gesprächsmenü und im jeweiligen Listeneintrag. Keine Ordner, Tags, Projekte oder Archivierung in dieser Stufe.

Die Liste sollte alle noch verfügbaren Unterhaltungen zugänglich machen. Der bestehende Server lädt aktuell nur zehn; eine nachladbare Liste ist dafür die passende kleine Erweiterung.

**Mini-Emil**

| Option | Bewertung |
|---|---|
| Ausschließlich Onboarding und Motivation | Klare Rolle, bewahrt die vorhandene Führung. |
| Visueller Charakter des gesamten Assistenten | Emotional stärker, vermischt aber feste Lernführung mit offenen und potenziell schreibenden AI-Antworten. |
| Onboarding-Begleiter mit gezieltem Übergang zum Assistenten | **Beste Lösung:** klare Zuständigkeiten und ein verständlicher Übergang. |
| Vollständig getrennt ohne Verbindung | Technisch einfach, lässt passende Hilfesituationen ungenutzt. |

Meine Empfehlung lautet: **Mini-Emil erklärt die Arbeitsschritte; der Assistent unterstützt bei der konkreten Arbeit.**

Mini-Emil bleibt bei aktiver Assistentenansicht eingeklappt bzw. ausgeblendet, ohne seinen Fortschritt zu verlieren. Später können beide dieselbe Hilfe-Infrastruktur verwenden. Eine gemeinsame Figur sollte erst erwogen werden, wenn Nutzertests zeigen, dass dadurch keine falschen Erwartungen entstehen.

Der globale Assistent muss außerdem den bestehenden **Vorführmodus** respektieren. Der heutige Schutz liegt innerhalb der „Heute“-Seite. Beim Verschieben in die App-Shell darf er nicht versehentlich außerhalb dieses Schutzes landen.

---

**5. Konkrete Low-Fidelity-Wireframes**

Alle Namen, Aufgaben und Termine in den folgenden Wireframes sind illustrative Beispiele. Sie beschreiben das Zielbild; Bestätigungen, strukturierte Treffer und vollständige Statusanzeigen benötigen teilweise die später erläuterten Backend-Erweiterungen.

`[…]` bezeichnet eine bedienbare Fläche. Symbole erhalten ausgeschriebene zugängliche Namen.

**Desktop D0 – geschlossen, 1280 × 800**

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Cockpit        [Namen sammeln] [Assistent] [Suchen] [Profil]                 │
│ Heute     Kontakte     Kalender     Fortschritt     Team                  │
├───────────────────────────────────────────────────────────────────────────┤
│ Heute                                                                    │
│ Eigenes Geschäft                                                         │
│                                                                           │
│ Deinen Tag besprechen                                      [Öffnen →]     │
│ Fragen stellen oder eine Nachricht diktieren.                             │
│                                                                           │
│ Namen sammeln                                                            │
│ [Jetzt Namen sammeln]                                                    │
│                                                                           │
│ Deine nächste Handlung / Anrufe und Termine                               │
│ …                                                                         │
│                                              [Mini-Emil, falls relevant]  │
└───────────────────────────────────────────────────────────────────────────┘
```

Die Assistenten-Zeile enthält weder einen Chatverlauf noch ein scheinbares Eingabefeld.

**Desktop D1 – geöffnet, leer**

```text
┌───────────────────────────────────┬───────────────────────────────────────┐
│ CRM-Arbeit                        │ Assistent ▾      [Neu] [Groß] [×]     │
│                                   ├───────────────────────────────────────┤
│ Heute oder geöffneter Kontakt      │                                       │
│ bleibt bedienbar.                 │ Was möchtest du heute erledigen?      │
│                                   │                                       │
│                                   │ [Was steht heute an?]                 │
│                                   │ [Einen Kontakt finden]                │
│                                   │ [Ein Gespräch dokumentieren]          │
│                                   │                                       │
│                                   │ Gespräche bleiben sieben Tage         │
│                                   │ verfügbar. [Mehr erfahren]            │
│                                   ├───────────────────────────────────────┤
│                                   │ Nachricht an den Assistenten …        │
│                                   │ [Diktieren]                  [Senden] │
└───────────────────────────────────┴───────────────────────────────────────┘
```

Der Speicherhinweis erscheint beim ersten Einstieg und bleibt danach über das Menü erreichbar.

**Desktop D2 – normale Antwort und gefundene Information**

```text
│                         Was steht heute an? │
│                                             │
│ Heute sind drei Wiedervorlagen fällig.       │
│                                             │
│ Aus deinen CRM-Daten                        │
│ Jonas Müller · heute, 14:00                  │
│ Entscheidung besprechen       [Kontakt →]  │
│                                             │
│ Zwei weitere Wiedervorlagen   [Ansehen]     │
│                                             │
│ [Nachricht …] [Diktieren] [Senden]           │
```

„Aus deinen CRM-Daten“ bezeichnet gelesene Information. Ein grüner Erfolgsbeleg erscheint nur nach einer Änderung.

**Desktop D3 – ausgeführte Aktion**

```text
│ Die Wiedervorlage ist angelegt.              │
│                                             │
│ ✓ Gespeichert                               │
│ Jonas Müller · Anrufen                      │
│ Mittwoch, 23. September · 14:00              │
│ Entscheidung besprechen                     │
│                                             │
│ [Kontakt öffnen]        [Rückgängig · 24 s] │
```

Das verbleibende Undo-Fenster kommt vom Server. Der Beleg bleibt nach Ablauf bestehen.

**Desktop D4 – Bestätigung**

```text
│ Bitte prüfen                                │
│ Jonas Müller                                │
│                                             │
│ Telefonnummer ändern                        │
│ Bisher: +49 … 1234                           │
│ Neu:    +49 … 5678                           │
│                                             │
│ [Änderung speichern]       [Abbrechen]       │
```

Die Karte beschreibt den konkreten Unterschied. Der primäre Knopf heißt nicht nur „Ja“.

**Desktop D5 – Unterhaltungsübersicht**

```text
│ [← Gespräch]       Unterhaltungen            │
│ [Neue Unterhaltung]                         │
│                                             │
│ Heute                                       │
│ Jonas – nächster Anruf                 [⋯]  │
│ Verfügbar bis 26.09., 09:15                  │
│                                             │
│ Gestern                                     │
│ Meine offenen Wiedervorlagen           [⋯]  │
│ Verfügbar bis 25.09., 16:40                  │
│                                             │
│ [Weitere laden]                             │
```

Die Liste ersetzt im Panel vorübergehend die Gesprächsfläche. Sie öffnet kein weiteres seitliches Panel.

**Desktop D6 – Aufnahme**

```text
│ Aufnahme läuft · 00:12                       │
│ ━━ ▂ ▄ ▆ ▃ ▅ ━━                             │
│                                             │
│ [Verwerfen]           [Aufnahme beenden]     │
│ Danach kannst du den Text prüfen.            │
```

Diese Fläche ersetzt den Composer. Es gibt währenddessen keinen zweiten Sendeknopf.

**Desktop D7 – Verbindungsfehler mit unklarem Ergebnis**

```text
│ Verbindung unterbrochen                     │
│                                             │
│ Ich konnte den Abschluss nicht abrufen.     │
│ Eine Änderung könnte bereits gespeichert   │
│ sein.                                       │
│                                             │
│ [Ergebnis prüfen]       [Kontakt öffnen]     │
```

„Ergebnis prüfen“ setzt eine serverseitige Statusabfrage voraus. Ein blindes erneutes Ausführen ist hier ungeeignet.

**Desktop D8 – vollständiger Arbeitsbereich**

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Bestehender CRM-Kopf und Navigation                                       │
├───────────────────────┬───────────────────────────────────────────────────┤
│ [Neue Unterhaltung]   │ Assistent                         [Als Panel] [⋯] │
│                       ├───────────────────────────────────────────────────┤
│ Heute                 │                                                   │
│ Jonas vorbereiten     │ Gespräch, maximal etwa 720 px Lesebreite         │
│ Tagesplanung          │                                                   │
│                       │ Antworten, Rückfragen und Aktionsbelege          │
│ Gestern               │                                                   │
│ Offene Aufgaben       │                                                   │
│                       ├───────────────────────────────────────────────────┤
│ [Speicherung & Zugang]│ [Nachricht …]              [Diktieren] [Senden]   │
└───────────────────────┴───────────────────────────────────────────────────┘
```

Die Gesprächsliste ist ungefähr 240 Pixel breit. Ein zusätzlicher permanenter Quellenbereich ist in dieser Stufe unnötig.

**Mobil M0 – Einstieg aus „Heute“, 375 × 812**

```text
┌─────────────────────────────────┐
│ Cockpit [Assistent] [Suche] [AP] │
├─────────────────────────────────┤
│ Heute                           │
│ Eigenes Geschäft                │
│                                 │
│ Deinen Tag besprechen           │
│ [Assistent öffnen →]            │
│                                 │
│ Namen sammeln                   │
│ Wen kennst du noch?             │
│ [Jetzt Namen sammeln]           │
│                                 │
│ Nächste Handlung …              │
├─────────────────────────────────┤
│        [Namen sammeln]          │
│ Heute Kontakte Kalender         │
│       Fortschritt Team          │
└─────────────────────────────────┘
```

Die letzte Zeile steht schematisch für das unveränderte Dock mit fünf nebeneinanderliegenden Einträgen.

**Mobil M1 – fokussierter Chat**

```text
┌─────────────────────────────────┐
│ [←] Assistent ▾       [Neu] [⋯] │
├─────────────────────────────────┤
│ Bezug: Jonas Müller         [×]│
│                                 │
│      Ruf Jonas am Mittwoch      │
│      um 14 Uhr an.              │
│                                 │
│ ✓ Wiedervorlage gespeichert     │
│ Jonas Müller · Anrufen          │
│ Mi., 23.09. · 14:00             │
│ [Öffnen] [Rückgängig · 24 s]    │
│                                 │
├─────────────────────────────────┤
│ Nachricht …                     │
│ [Diktieren]            [Senden] │
├─────────────────────────────────┤
│        [Namen sammeln]          │
│ [Heute][Kont.][Kal.][Fort.][Team]│
└─────────────────────────────────┘
```

**Mobil M2 – geöffnete Tastatur**

```text
┌─────────────────────────────────┐
│ [←] Assistent ▾            [⋯] │
├─────────────────────────────────┤
│ Letzte Antwort                  │
│ … Verlauf bleibt scrollbar …    │
├─────────────────────────────────┤
│ Am Mittwoch um 14 Uhr│          │
│ [Mikrofon]             [Senden] │
├─────────────────────────────────┤
│        [Namen sammeln]          │
│ [Heute][Kont.][Kal.][Fort.][Team]│
├─────────────────────────────────┤
│                                 │
│       SYSTEMTASTATUR            │
│                                 │
└─────────────────────────────────┘
```

Composer und bestehendes Dock liegen im sichtbaren Viewport oberhalb der Tastatur. Die Safe Area wird dabei nur einmal berücksichtigt. Das ist ein zentraler Prüfpunkt auf echten Geräten.

**Mobil M3 – Spracheingabe**

```text
│ Aufnahme läuft · 00:12           │
│        ▂ ▄ ▆ ▃ ▅                │
│                                 │
│ [Verwerfen]  [Aufnahme beenden] │
│ Danach den Text prüfen.         │
├─────────────────────────────────┤
│ Namen sammeln + bestehendes Dock│
```

**Mobil M4 – Transkriptprüfung**

```text
│ Bitte prüfe den erkannten Text. │
│ ┌─────────────────────────────┐ │
│ │ Ruf Jonas am Mittwoch      │ │
│ │ um 14 Uhr an.              │ │
│ └─────────────────────────────┘ │
│ [Neu aufnehmen]       [Senden] │
├─────────────────────────────────┤
│ Namen sammeln + bestehendes Dock│
```

Das Textfeld ist direkt editierbar. Der Chat-Agent wird erst durch „Senden“ aufgerufen.

**Mobil M5 – mehrere Aktionsbelege**

```text
│ Zwei Änderungen gespeichert     │
│                                 │
│ ✓ Gespräch dokumentiert         │
│ Jonas Müller                    │
│ [Öffnen]       [Rückgängig]      │
│ ─────────────────────────────── │
│ ✓ Wiedervorlage angelegt        │
│ Mi., 23.09. · 14:00             │
│ [Öffnen]       [Rückgängig]      │
```

Kein gemeinsames „Alles rückgängig“, solange eine solche Gruppenaktion nicht technisch abgesichert ist.

**Mobil M6 – Unterhaltungswechsel**

```text
│ [←] Unterhaltungen              │
│ [Neue Unterhaltung]             │
│                                 │
│ Heute                           │
│ Jonas – nächster Anruf      [⋯]│
│ Bis 26.09., 09:15                │
│                                 │
│ Gestern                         │
│ Offene Wiedervorlagen       [⋯]│
│ Bis 25.09., 16:40                │
├─────────────────────────────────┤
│ Namen sammeln + bestehendes Dock│
```

**Mobil M7 – Löschen bestätigen**

```text
│ Unterhaltung löschen?           │
│                                 │
│ „Jonas – nächster Anruf“         │
│                                 │
│ Das Gespräch wird gelöscht.     │
│ Gespeicherte CRM-Änderungen      │
│ bleiben erhalten.               │
│                                 │
│ [Behalten]                      │
│ [Unterhaltung löschen]          │
```

Die Bestätigung erscheint als eigener klarer Dialog, mit Fokus auf „Behalten“. Hintergrundbedienung ist während dieser kurzen Entscheidung gesperrt.

**Mobil M8 – späterer Live-Modus**

```text
│ [← Zum Chat]     Live-Gespräch   │
│                                 │
│          kleine Wellenform      │
│                                 │
│ Ich höre zu.                    │
│                                 │
│ „Heute sind drei                │
│  Wiedervorlagen fällig …“        │
│                                 │
│ [Mikrofon aus] [Gespräch beenden]│
│ [Verlauf und Aktionen ansehen]  │
├─────────────────────────────────┤
│ Namen sammeln + bestehendes Dock│
```

Eine erforderliche CRM-Bestätigung erhält innerhalb dieses Modus Vorrang vor dekorativer Voice-Darstellung.

---

**6. Zentrale Nutzerflüsse**

| Ablauf | Schritte und erwartetes Ergebnis |
|---|---|
| **Erstmals öffnen** | 1. Emil wählt „Assistent“. 2. Er sieht einen kurzen Begrüßungstext, drei Beispiele und den Composer. 3. Er schreibt oder startet Diktieren. Keine Tour blockiert die Eingabe. |
| **Normale Textfrage** | 1. Eingeben. 2. Senden. 3. Die Nachricht erscheint mit eigenem Versandstatus. 4. Ein sachlicher Bearbeitungsstatus folgt. 5. Die Antwort erscheint im Verlauf. Es entsteht kein Änderungsbeleg, wenn nichts geschrieben wurde. |
| **Kontakt suchen** | 1. „Such Jonas Müller.“ 2. Eigentümergesicherte Suche. 3. Kompakte Treffer mit ausreichenden Unterscheidungsmerkmalen. 4. Kontakt öffnen oder zum Bezug der nächsten Frage machen. |
| **Wiedervorlage anlegen** | 1. Kontakt, Aufgabe und Termin nennen. 2. Fehlende oder mehrdeutige Angaben klären. 3. Konkretes Datum verwenden. 4. Gemäß Aktionsregel direkt ausführen oder Vorschau bestätigen. 5. Beleg und Link anzeigen. Bestehende Wiedervorlagen bleiben bestehen. |
| **Mehrdeutigen Kontakt klären** | 1. Zwei plausible Treffer. 2. „Welchen Jonas meinst du?“ 3. Emil wählt anhand vorhandener, zulässiger Merkmale. 4. Erst danach wird die konkrete Aktion vorbereitet. Die Auswahl ist noch keine pauschale Schreibfreigabe. |
| **Schreibaktion bestätigen** | 1. Vorschau mit betroffener Person und Änderung. 2. Emil wählt etwa „Telefonnummer ändern“. 3. Server prüft Berechtigung und Aktualität erneut. 4. Genau die bestätigte Änderung wird einmal ausgeführt. |
| **Erfolg nachvollziehen** | 1. Kurze Antwort. 2. Beleg nennt Person, Änderung und relevante Werte. 3. „Kontakt öffnen“ führt in das normale CRM. 4. Rückkehr stellt Gespräch und Scrollposition wieder her. |
| **Rückgängig machen** | 1. Emil wählt Undo am richtigen Beleg. 2. Dieser zeigt „Wird rückgängig gemacht“. 3. Server bestätigt Rücknahme oder Konflikt. 4. Nur bei bestätigter Rücknahme wird „Rückgängig gemacht“ angezeigt. |
| **Sprache aufnehmen** | 1. Mikrofon bewusst aktivieren. 2. Berechtigung gegebenenfalls erlauben. 3. Aufnahme mit Dauer und sichtbaren Steuerelementen. 4. Beenden oder verwerfen. Bei Verwerfen keine Übergabe an den Chat-Agenten. |
| **Transkript prüfen** | 1. Transkription endet. 2. Text erscheint editierbar. 3. Emil korrigiert beispielsweise Name oder Uhrzeit. 4. Erst „Senden“ startet die normale Verarbeitung. |
| **Neue Unterhaltung** | 1. „Neu“ wählen. 2. Leerer Entwurf; noch keine neue gespeicherte Unterhaltung. 3. Erstes Senden legt sie an. Das vorherige Gespräch bleibt bis zu seinem Ablauf auffindbar. |
| **Alte Unterhaltung öffnen** | 1. Gesprächsliste öffnen. 2. Unterhaltung auswählen. 3. Verlauf laden. 4. Alter, Speicherfrist und eventuell veränderte Aktionszustände berücksichtigen. Alte Aussagen über „heute“ werden nicht als aktuelle Tagesübersicht behandelt. |
| **Unterhaltung löschen** | 1. Menü → Löschen. 2. Wirkung auf Gespräch und CRM-Daten erklären. 3. Bestätigen. 4. Erst nach Servererfolg aus der Liste entfernen. Bei Fehler bleibt der Eintrag erhalten. |
| **Neustart nach sieben Tagen** | 1. Ablauf erkennen, auch bei lange offenem Tab. 2. Alten Verlauf nicht weiter als aktiven Kontext anbieten. 3. Neuen Gesprächsbereich mit Erklärung öffnen. 4. Aktuell eingegebenen Entwurf bewahren. 5. CRM-Daten bei Bedarf neu lesen. |
| **Neustart nach 20 Nachrichten** | 1. Bei voller Unterhaltung Ende markieren. 2. Die nächste Nachricht beginnt automatisch ein neues Gespräch. 3. Dieses wird visuell getrennt dargestellt. 4. Das volle alte Gespräch bleibt bis zum ursprünglichen Ablauf lesbar. |
| **Gesperrter Zustand** | 1. Assistent öffnen. 2. Konkreten Grund anzeigen. 3. Passende nächste Handlung anbieten: Zugang ansehen, später versuchen oder reguläres CRM nutzen. Kein funktionsfähiger Composer vortäuschen. |
| **Später Live starten und verlassen** | 1. „Live sprechen“ wählen. 2. Aktive Mikrofonverwendung eindeutig anzeigen. 3. Sprechen, unterbrechen, stummschalten oder Aktionen bestätigen. 4. „Gespräch beenden“ schließt die Sprachsession. 5. Textverlauf und Belege bleiben in derselben Unterhaltung. |

**Vier Regeln verhindern dabei schwer verständliche Randfälle**

**Nachrichtenlimit:** Die 20 Nachrichten umfassen Nutzer- und Assistentennachrichten, also bei regulären erfolgreichen Wechseln typischerweise zehn Frage-Antwort-Paare. Ein ständig sichtbares „2/20“ ist trotzdem nicht nötig. Bei 18 Nachrichten kann ein kurzer Hinweis auf den bevorstehenden Wechsel erscheinen.

**Bestätigungen:** Ein Klick auf eine Bestätigung ist im empfohlenen Modell ein Aktionsereignis zur bestehenden Antwort. Die Vorschau wird zum Ergebnis aktualisiert. Dadurch muss ein Bestätigungsklick nicht künstlich zwei weitere Chatnachrichten erzeugen. Eine frei getippte Nachricht zählt dagegen normal.

**Kein heimlicher Kontexttransport:** Beim automatischen Neustart werden alte Gesprächsinhalte nicht stillschweigend als Zusammenfassung mitgenommen. Das würde die vereinbarte Grenze verwischen. Ein gerade ausdrücklich ausgewählter CRM-Kontakt kann erneut serverseitig geladen werden.

**Laufende Anfragen:** Ein Gesprächswechsel darf die spätere Antwort nicht in das falsche Gespräch schreiben. Löschen einer Unterhaltung mit laufender Änderung wird zunächst gesperrt oder muss über einen ausdrücklich definierten Abbruchablauf erfolgen.

---

**7. Zustände, Aktionsregeln und konkrete UX-Texte**

**Darstellung der verschiedenen Ergebnisse**

| Zustand | Darstellung | Mögliche nächste Handlung |
|---|---|---|
| Normale Antwort | Ruhiger Text im Gespräch | Weiterfragen |
| Gefundene Information | Kompakte Ergebniszeile, bezeichnet als CRM-Information | Datensatz öffnen |
| Vorschlag | Klar mit „Vorschlag“ bezeichnet; kein Erfolgszeichen | Übernehmen oder weiter besprechen |
| Geplante Aktion | Vorschau mit Ziel und konkreten Angaben | Prüfen |
| Bestätigung erforderlich | Vorschau mit präzisem Aktionsknopf | Speichern oder abbrechen |
| Ausführung läuft | Status an genau dieser Aktion | Auf Ergebnis warten; später definierter Stop |
| Erfolgreich ausgeführt | Haken plus „Gespeichert“, relevante Werte und Link | Öffnen, gegebenenfalls Undo |
| Fehlgeschlagen | Fehlertext an der betroffenen Aktion | Korrigieren oder gezielt wiederholen |
| Teilweise erfolgreich | Jede Teilaktion erhält ihren eigenen Status | Nur offenen Teil bearbeiten |
| Ergebnis unbekannt | Neutraler Hinweis auf unklaren Abschluss | Ergebnis abfragen |
| Rückfrage erforderlich | Auswahl oder kurze Frage | Kontakt bzw. Wiedervorlage eindeutig bestimmen |
| Rückgängig gemacht | Beleg bleibt sichtbar, Status wechselt | Keine erneute Undo-Aktion |
| Undo abgelaufen oder Konflikt | Erklärung statt aktivem Undo-Knopf | Normalen Datensatz öffnen |

Ein pauschales „Erledigt“ über mehreren Werkzeugaufrufen ist ungeeignet, wenn einzelne Schritte fehlschlagen können.

**Empfohlene Bestätigungspolitik**

| Art der Handlung | Empfehlung |
|---|---|
| Lesen, suchen, zusammenfassen | Ohne Bestätigung. |
| Eindeutig beauftragte zusätzliche Wiedervorlage, Gesprächsdokumentation oder ergänzende Notiz | Direkt ausführbar, wenn Angaben eindeutig sind und ein sinnvoll nutzbarer Rückweg besteht; danach vollständiger Beleg. |
| Kontakt anlegen | Vorschau, insbesondere weil der aktuelle Workflow zusätzlich einen ersten Schritt und weitere CRM-Folgen erzeugt. |
| Vorhandene Kontaktfelder ändern | Vorher konkrete Änderung bestätigen. |
| Wiedervorlage als erledigt markieren | Vorher bestätigen, da aktuell kein Undo dafür angeboten wird. |
| Aus einer bloßen Erzählung abgeleitete Änderung | Zunächst Vorschlag; keine stillschweigende Interpretation als Schreibauftrag. |
| Mehrere zusammenhängende Änderungen | Gemeinsame übersichtliche Vorschau, anschließend einzelne Belege. |
| Mehrdeutige Person oder Aufgabe | Erst klären; keine Schreibaktion. |
| Löschen, Bulk-Aktionen, fremde Kontakte | Bleiben außerhalb des vorhandenen Assistenten. |

Diese Politik verändert das heutige Verhalten an einigen Stellen bewusst. Sie ist deshalb eine Produktentscheidung, nicht nur eine andere Gestaltung.

**Deutsche Beispieltexte**

| Situation | Text |
|---|---|
| Leerer Zustand | **„Was möchtest du heute erledigen?“** – „Frag nach deinen Kontakten, plane einen nächsten Schritt oder halte ein Gespräch fest.“ |
| Starter 1 | „Was steht heute an?“ |
| Starter 2 | „Hilf mir, einen Kontakt zu finden.“ |
| Starter 3 | „Ich möchte ein Gespräch dokumentieren.“ |
| Composer | „Nachricht an den Assistenten …“ |
| Sieben-Tage-Hinweis | „Gespräche bleiben sieben Tage ab Beginn verfügbar. Weitere Nachrichten verlängern diese Zeit nicht.“ |
| Konkrete Frist | „Verfügbar bis 26. September, 09:15 Uhr.“ |
| Erläuterung zur Speicherung | „Nach dem Ablauf wird das Gespräch nicht mehr verwendet und automatisch bereinigt. Gespeicherte Kontakte, Notizen und Wiedervorlagen bleiben im CRM.“ |
| Neustart nach Ablauf | „Das vorherige Gespräch ist abgelaufen. Hier beginnt ein neues. Deine CRM-Einträge bleiben erhalten.“ |
| Bevorstehendes Nachrichtenlimit | „Nach der nächsten Antwort ist dieses Gespräch voll. Danach geht es in einer neuen Unterhaltung weiter.“ |
| Neustart nach Limit | „Diese Unterhaltung hat 20 Nachrichten erreicht. Deine nächste Nachricht beginnt ein neues Gespräch.“ |
| Aufnahme läuft | „Aufnahme läuft · 00:12“ |
| Aufnahme beenden | „Aufnahme beenden“ |
| Aufnahme verwerfen | „Aufnahme verwerfen“ |
| Transkription | „Deine Aufnahme wird in Text umgewandelt …“ |
| Transkript bereit | „Bitte prüfe den Text, besonders Namen und Termine.“ |
| Mikrofon nicht erlaubt | „Das Mikrofon ist nicht freigegeben. Du kannst die Freigabe im Browser ändern oder schreiben.“ |
| Anfrage läuft, ohne genaue Werkzeugereignisse | „Deine Anfrage wird bearbeitet …“ |
| Vorbereitung, wenn serverseitig bestätigt | „Ich bereite die Änderung vor. Gespeichert ist noch nichts.“ |
| Schreibbestätigung | „Bei Jonas Müller die Telefonnummer auf +49 … ändern?“ – **„Telefonnummer ändern“** |
| Erfolg | „Wiedervorlage gespeichert: Jonas Müller, Mittwoch, 23. September, 14:00 Uhr.“ |
| Undo möglich | „Rückgängig · noch 24 Sekunden“ |
| Undo erfolgreich | „Die Wiedervorlage wurde wieder entfernt.“ |
| Undo abgelaufen | „Die kurze Rücknahmefrist ist vorbei. Du kannst den Eintrag im Kontakt bearbeiten.“ |
| Undo-Konflikt | „Der Eintrag wurde inzwischen verändert. Deshalb konnte ich ihn nicht sicher zurücknehmen.“ |
| Mehrdeutiger Kontakt | „Ich habe zwei Kontakte mit diesem Namen gefunden. Welchen meinst du?“ |
| Mehrere Wiedervorlagen | „Welche Wiedervorlage möchtest du erledigen?“ |
| Providerfehler, sicher ohne Änderung | „Ich konnte die Anfrage gerade nicht bearbeiten. Es wurde nichts gespeichert. Bitte versuche es erneut.“ |
| Unklarer Abschluss | „Ich konnte den Abschluss nicht abrufen. Eine Änderung könnte bereits gespeichert sein.“ – **„Ergebnis prüfen“** |
| Vor dem Senden offline | „Du bist gerade offline. Deine Nachricht wurde noch nicht gesendet.“ |
| Nicht freigeschaltet | „Der Assistent ist für dein Konto noch nicht freigeschaltet.“ |
| Vorübergehend deaktiviert | „Der Assistent ist vorübergehend nicht verfügbar.“ |
| Nutzungslimit | „Dein Nutzungslimit ist erreicht. Du kannst im CRM normal weiterarbeiten.“ |
| Fremder oder nicht verfügbarer Kontakt | „Diesen Kontakt kann ich in deinen eigenen CRM-Daten nicht öffnen.“ |
| Unterhaltung löschen | „Das Gespräch wird gelöscht. Bereits gespeicherte CRM-Änderungen bleiben erhalten.“ |
| Späterer Live-Einstieg | „Live sprechen“ – „Du sprichst mit dem Assistenten und hörst seine Antworten direkt.“ |

Die Aussage **„Es wurde nichts gespeichert“** darf ausschließlich nach gesichertem Serverstatus erscheinen. Ein HTTP-Fehler allein beweist das nicht.

**Aufnahmebedienung**

Ich empfehle als Standard **Antippen zum Starten und Antippen zum Beenden**. Das funktioniert mit einer Hand und lässt sich über Tastatur und assistive Technik klar abbilden.

Das bestehende „Halten und sprechen“ kann später als zusätzliche Kurzbedienung erhalten bleiben. Dann bedeutet Loslassen: Aufnahme beenden und Text prüfen. Es bedeutet nicht mehr automatisch „CRM-Auftrag absenden“.

Das ist auch deshalb relevant, weil die vorhandene Aufnahme-Komponente hauptsächlich Pointer-Ereignisse verwendet und bei verweigerter Mikrofonfreigabe kommentarlos verschwindet. Beides sollte für den Assistenten verbessert werden.

**Abbruch und Wiederholung**

Für das Zielbild gilt:

- Aufnahme verwerfen: lokale Aufnahme stoppen, keine Chatverarbeitung.
- Transkription abbrechen: Ergebnis nicht automatisch übernehmen oder senden.
- Textantwort stoppen: weitere Verarbeitung beenden lassen.
- Bereits gespeicherte Änderungen bleiben im Beleg sichtbar.
- Ein Abbruch ist keine Rücknahme.
- Eine Wiederholung verwendet die vorhandene Anfrageidentität und prüft zuerst, was bereits abgeschlossen ist.
- Nach teilweise ausgeführten Aktionen wird nicht der gesamte ursprüngliche Auftrag als neuer Auftrag wiederholt.

Die bestehende Idempotenz hilft dabei. Für verlässliche UI-Zustände nach Teilfehlern und Abbruch braucht es zusätzlich abrufbare Anfrage- und Aktionsergebnisse.

---

**8. Visuelle Richtung und Barrierefreiheit**

Die visuelle Mitte ist das Gespräch. Die AI-Präsenz entsteht durch eine konsistente Stimme, einen klaren Einstieg und verlässliche Rückmeldungen.

| Element | Gestaltungsregel |
|---|---|
| Grundflächen | Bestehende semantische Tokens `canvas`, `surface` und `sunken` verwenden; helle und dunkle Darstellung gleichwertig erhalten. |
| Navy | Für Identität und Orientierung; keine große Navy-Bühne innerhalb jeder Assistentenansicht. |
| Blau | Primäre Aktion, aktiver Fokus und relevante Links. |
| Statusfarben | Grün, Rot und Warnfarbe sparsam; stets zusammen mit Symbol und Text. |
| Schrift | Vorhandene System-/Inter-Schrift. Nachrichten 16 px, ungefähr 24 px Zeilenhöhe. Sekundärtexte 13–14 px. |
| Hierarchie | Aktuelle Frage bzw. nächster Handlungsschritt vor Metadaten. |
| Abstände | 8-Pixel-Grundraster; mobil 16 px Außenabstand, Desktop-Panel etwa 20–24 px. |
| Nutzernachrichten | Zurückhaltend getönte Fläche, rechts ausgerichtet, maximal etwa 85 % der Breite. |
| Assistentenantworten | Überwiegend auf der Gesprächsfläche, ohne zusätzliche umschließende Karte. |
| Aktionsbelege | Eine klar begrenzte Fläche mit Statuszeile, Inhalt und Aktionen. Keine weitere Karte darin. |
| Icons | Sprechblase für Assistent, Mikrofon für Diktieren, später Wellenform für Live. Das bereits bei „Namen sammeln“ verwendete Funkeln nicht zum einzigen AI-Erkennungszeichen machen. |
| Animation | Kurze Öffnungs- und Zustandsübergänge, ungefähr 150–200 ms. Keine dauerhafte schwebende Animation. |
| Laden | Sachlicher Status statt künstlich wechselnder Denksätze. Präzise Werkzeugmeldungen nur aus echten Ereignissen. |
| Voice | Kleine Pegelanzeige während tatsächlicher Aufnahme. Keine große dekorative Kugel im normalen Chat. |
| Fehler | Direkt am betroffenen Entwurf oder an der Aktion. Kein identischer Fehler zusätzlich als Assistentenantwort und globale Fehlermeldung. |

Die vorhandenen Werte wie `#2465d1` für den Hauptakzent, `#eef2f8` für die helle Grundfläche und `#0b1220` für dunklen Text sind eine passende Ausgangsbasis. Die endgültigen Kombinationen müssen gegen die tatsächliche CSS-Kaskade in beiden Themes geprüft werden.

**Lange Inhalte**

- Kontakt- und Gesprächstítel dürfen in Listen zweizeilig werden.
- Im schmalen Kopf kann ein Titel gekürzt werden; der vollständige Titel bleibt ohne Hover zugänglich.
- In Bestätigungskarten werden entscheidende Namen, Datumsangaben und geänderte Werte nicht abgeschnitten.
- Lange Antworten bleiben lesbar im Verlauf; nur ergänzende Details werden einklappbar.
- Kontaktlisten zeigen zunächst wenige relevante Treffer mit einem Weg zur vollständigen Liste.
- Mehrere erfolgreiche Belege dürfen kompakt gruppiert werden. Fehler und offene Bestätigungen bleiben sichtbar.
- URLs, E-Mail-Adressen und lange Wörter dürfen keine horizontale Überbreite erzeugen.
- Wenn Emil im Verlauf nach oben liest, springt die Ansicht bei einer neuen Antwort nicht automatisch nach unten. Stattdessen erscheint „Neue Antwort“.

**Bedienbarkeit**

- Sämtliche interaktiven Ziele mindestens **44 × 44 CSS-Pixel** als Produktstandard. Das liegt über dem allgemeinen WCAG-2.2-AA-Mindestmaß von 24 Pixeln. [W3C-Zielgrößen](https://www.w3.org/TR/WCAG22/#target-size-minimum)
- Desktop: Enter sendet, Shift+Enter erzeugt einen Absatz; während Texteingabekomposition kein versehentliches Senden.
- Mobil: expliziter Sendeknopf; kein automatisches Öffnen der Tastatur beim bloßen Aufruf.
- Ein nicht modales Desktop-Panel erhält keine Fokusfalle. Eine klare Tastaturmöglichkeit führt zwischen CRM und Assistent.
- Modale Löschbestätigung: Fokusfalle, Escape, Rückkehr zum auslösenden Element.
- Screenreader hören Statusänderungen und abgeschlossene Nachrichten, nicht jeden Token oder jede Sekunde einer Aufnahme.
- Normale Texte mindestens 4,5:1 Kontrast; wichtige Bedienelemente und Fokusdarstellung mindestens 3:1.
- Reduzierte Bewegung respektieren.
- Tastatur und Dock dürfen weder den Composer noch einen fokussierten Bestätigungsknopf verdecken.
- Prüfung mit 200 % Textvergrößerung, langen deutschen Bezeichnungen sowie VoiceOver und TalkBack.

---

**9. Komponentenmodell und notwendige Zustandsverträge**

Das vorhandene `AiCrmAssistant` sollte in eine gemeinsame Gesprächslogik und kleinere Darstellungskomponenten aufgeteilt werden.

```text
AssistantProvider / AssistantController
├─ AssistantEntry
├─ AssistantTodayEntry
├─ AssistantContextEntry
├─ AssistantPanel
├─ AssistantWorkspace
│  └─ gemeinsame AssistantView
│     ├─ AssistantHeader
│     ├─ ConversationSwitcher
│     ├─ ConversationList
│     ├─ ContextAttachment
│     ├─ ChatTimeline
│     │  ├─ UserMessage
│     │  ├─ AssistantMessage
│     │  ├─ ContactResult
│     │  ├─ ClarificationChoice
│     │  ├─ ActionConfirmation
│     │  ├─ ActionReceipt
│     │  └─ RequestRecovery
│     └─ ChatComposer
│        ├─ VoiceRecorder
│        └─ TranscriptReview
├─ ConversationDetails
├─ DeleteConversationDialog
└─ AssistantAccessState
```

`LiveVoiceMode` und `KnowledgeSources` kommen erst in den späteren Paketen hinzu. Heute gibt es dafür keine ausgegrauten Platzhalter.

**Umgang mit dem Bestand**

| Vorhandener Bereich | Empfehlung |
|---|---|
| `AiCrmAssistant.tsx` | Aufteilen. Netzwerkverhalten und Gesprächssteuerung aus der Darstellung herauslösen. |
| `Sprachaufnahme.tsx` | Aufnahmetechnik prüfen und möglichst wiederverwenden. Eine Assistenten-spezifische Bedienung ergänzen, ohne andere Einsatzorte ungefragt zu verändern. |
| `AppShell.tsx` | Globalen Einstieg und gemeinsame Assistentensteuerung integrieren. |
| `NavLinks.tsx` | Fünf Ziele und Sammelaktion bewahren. Höhen und Vordergrundzustände mit dem Composer abstimmen. |
| `NamenSammelnLink.tsx` | Weiterverwenden, einschließlich `prefetch={false}`. |
| `MiniEmil.tsx` | Rolle erhalten; aktive Assistentenansicht als weiteren Grund zum Zurücktreten berücksichtigen. |
| `VorfuehrProvider` / `VorfuehrVerdeckt` | Schutz auf die globale Assistentenfläche ausweiten. |
| `tools.ts`, `requests.ts`, `conversations.ts` | Fachliche Grundlage erhalten und gezielt um die notwendigen Zustandsverträge ergänzen. |
| Normale Kontakt- und Wiedervorlagenansichten | Weiterhin als verbindliche Bearbeitungsoberflächen verwenden. |

**Gemeinsamer Zustand**

Panel und Arbeitsbereich teilen:

- Gesprächs-ID;
- Nachrichten;
- noch nicht gesendeten Entwurf;
- expliziten Kontextbezug;
- Aufnahme-/Transkriptzustand;
- laufende Anfrage;
- Aktions- und Undo-Zustände;
- Rücksprungziel und Scrollposition.

Gesendete Nachrichten bleiben wie bisher serverseitig verfügbar. **Ungesendete Entwürfe werden dadurch nicht automatisch geräteübergreifend gespeichert.** Für den ersten Umbau genügt, sie bei Ansichts- und Routenumstellungen innerhalb der laufenden Sitzung zu erhalten. Eine dauerhafte Entwurfsspeicherung wäre eine weitere Funktion.

Die App verwendet die Shell in mehreren Layoutgruppen. Dieselbe importierte Komponente garantiert noch nicht, dass ihr Zustand bei jedem Wechsel erhalten bleibt. Die gemeinsame Steuerung muss deshalb an einer tatsächlich stabilen Stelle sitzen.

**Was der Server zusätzlich liefern müsste**

| Vertrag | Zweck |
|---|---|
| Strukturierte Leseresultate | Kontakt-Treffer, Quellenlinks und Wiedervorlagen verlässlich darstellen, ohne sie aus Modelltext herauszulesen. |
| Expliziter Kontextanhang | Kontakt- und Wiedervorlagenbezug sicher übernehmen. |
| Aktionsplan mit ID und Status | Bestätigung an genau eine konkrete Änderung binden. |
| Erneute Prüfung bei Bestätigung | Änderungen an inzwischen veränderten Datensätzen erkennen. |
| Einzelstatus je Aktion | Erfolg, Fehler und Teilabschluss unabhängig vom abschließenden Antworttext zeigen. |
| Abrufbarer Anfragestatus | Nach Netzwerkverlust feststellen, was bereits passiert ist. |
| Undo-Frist und aktueller Undo-Status | Countdown, Reload und Gerätewechsel korrekt behandeln. |
| Eindeutiger Neustartgrund | „Abgelaufen“ und „Nachrichtenlimit“ passend erklären. |
| Vollständig erreichbare Unterhaltungsliste | Mehr als zehn noch gültige Gespräche auffindbar machen. |
| Differenzierte Zugangszustände | Sperrgrund und passende Bedienung anzeigen. |

Aktionspläne sind an Nutzer, konkrete Parameter und Ablauf gebunden. Eine Änderung an der Vorschau macht die alte Freigabe ungültig. Offene Pläne dürfen die Sieben-Tage-Frist ihrer Unterhaltung nicht verlängern.

---

**10. Gestufte Umsetzung**

Die folgende Reihenfolge bezeichnet eine spätere Umsetzung. Sie ist keine Freigabe, in diesem Task Dateien oder Datenbanken zu verändern.

**Phase 1 – gemeinsame Struktur und neue Einstiege**

**Ziel:** Den vollständigen Chat aus „Heute“ herauslösen; globaler Einstieg, Desktop-Panel und mobile Arbeitsansicht.

**Betroffen:** App-Shell, Heute-Einstieg, AssistantController, Panel und mobile Ansicht.

**Art:** UI und zusätzliche Frontend-Logik; serverseitige Berechtigungsdaten passend bereitstellen.

**Risiken:** Verlust des Entwurfs beim Wechsel, Umgehung des Vorführmodus, Kollisionen mit Mini-Emil und Undo.

**Abnahme:** Assistent von allen fünf Hauptbereichen erreichbar; „Namen sammeln“ bleibt erhalten; keine neue Unterhaltung allein durch Öffnen; bestehende CRM-Formulare bleiben bedienbar.

**Desktop/Mobil:** 1280 × 800 mit geöffnetem Panel; 375 × 812 mit sichtbarem Composer und unverändertem Dock.

**Phase 2 – Gesprächsfläche, Composer und Aufnahmeprüfung**

**Ziel:** Schreiben und Diktieren werden gleichwertige, einfache Eingaben.

**Betroffen:** Timeline, Nachrichten, Composer, VoiceRecorder, TranscriptReview.

**Art:** UI und Frontend-Logik. Die vorhandene Transkriptionsroute kann grundsätzlich weiterverwendet werden.

**Risiken:** Automatisches Absenden bleibt versehentlich bestehen; Aufnahme läuft nach Navigation weiter; Mikrofonfehler sind unsichtbar.

**Abnahme:** Kein Chat-Aufruf vor „Senden“; Transkript editierbar; Abbrechen eindeutig; alle Mikrofonspuren werden beim Verlassen geschlossen.

**Desktop/Mobil:** Tastaturbedienung am Desktop; reale iPhone-/Android-Tastatur, Mikrofonfreigabe, Ablehnung und Unterbrechung auf Mobilgeräten.

Dabei muss der Speichertext präzise bleiben: Die aktuelle Transkriptionsroute speichert das Ergebnis kurzfristig für die sichere Wiederholung einer Anfrage. „Noch nicht an den Chat gesendet“ bedeutet daher nicht automatisch „noch nirgendwo serverseitig verarbeitet“.

**Phase 3 – Unterhaltungen und klare Kontextgrenzen**

**Ziel:** Wiederfinden, Wechseln, Löschen und automatische Neustarts ohne Verwirrung.

**Betroffen:** ConversationList, Switcher, Details, Löschdialog, Unterhaltungs-API.

**Art:** UI, Frontend-Logik und kleinere Backend-Erweiterungen.

**Risiken:** Alter Verlauf unter neuer Gesprächs-ID; Antworten landen nach einem Wechsel im falschen Gespräch; abgelaufener Kontext bleibt in einem offenen Tab sichtbar.

**Abnahme:** Ablauf ab Beginn, keine Fristverlängerung, maximal 20 Nachrichten, klarer neuer Verlauf, alle gültigen Gespräche erreichbar, Löschen verändert keine CRM-Einträge.

**Desktop/Mobil:** Wechsel während langsamer Anfrage, Reload, zweites angemeldetes Gerät, lange Titel und mehr als zehn gültige Unterhaltungen.

**Phase 4 – Ergebnisse, Belege und Undo**

**Ziel:** Lesen und Schreiben unterscheiden; reale Ergebnisse nachvollziehbar machen.

**Betroffen:** ContactResult, ActionReceipt, RequestRecovery, Agent- und Ergebnisverträge.

**Art:** UI, Frontend und Backend.

**Risiken:** Antworttext behauptet mehr als gespeichert wurde; Undo läuft vor Sichtbarkeit ab; Wiederholung führt zu doppelten Aktionen.

**Abnahme:** Jede Änderung hat einen eigenen Beleg; Teilfehler bleiben sichtbar; Undo-Frist kommt vom Server; Status nach Verbindungsabbruch abrufbar; keine pauschale Wiederholung bereits erledigter Schritte.

**Desktop/Mobil:** Mehrere Belege, lange Kontaktnamen, Undo-Erfolg, Ablauf, Konflikt und Wiederöffnen.

**Phase 5 – verbindliche Bestätigungen und sicherer Abbruch**

**Ziel:** Die beschlossene Aktionspolitik technisch durchsetzen.

**Betroffen:** ActionConfirmation, ActionPlan, bestätigender Ausführungspfad, Abbruch- und Statuslogik.

**Art:** Wesentliche Backend- und Frontend-Logik.

**Risiken:** Modell führt eine Änderung vor Bestätigung aus; doppelte Bestätigung; veraltete Vorschau; unklarer Teilabschluss.

**Abnahme:** Kein bestätigungspflichtiger Schreibzugriff ohne gültige Freigabe; Parameteränderung erfordert neue Prüfung; parallele Geräte lösen dieselbe Aktion nicht doppelt aus; Stop verschweigt keine bereits gespeicherten Änderungen.

**Desktop/Mobil:** Doppelklick, langsames Netz, Abbruch während einer Werkzeugfolge, Zustimmung auf einem zweiten Gerät, Kontakt zwischen Vorschau und Bestätigung manuell verändert.

**Phase 6 – vollständiger Desktop-Arbeitsbereich und gemeinsame Abnahme**

**Ziel:** Längere Nutzung ermöglichen und das Gesamtsystem zusammen prüfen.

**Betroffen:** AssistantWorkspace, Gesprächsliste, Navigation und gemeinsamer Zustand.

**Art:** Überwiegend Frontend.

**Risiken:** Panel und Seite entwickeln unterschiedliche Funktionen; Navigation setzt Zustand zurück; unnötige zusätzliche Seitenleisten.

**Abnahme:** Wechsel ohne Verlust von Gespräch oder Entwurf; nur eine laufende Anfrage je zugehörigem Vorgang; Rückkehr zum CRM-Datensatz funktioniert.

**Desktop/Mobil:** Beide Zielgrößen, helle/dunkle Darstellung, 200 % Textvergrößerung, Screenreader, reduzierte Bewegung, echte Geräte.

Für diese Abnahme würde ich zusätzlich kurze beobachtete Durchläufe mit fünf bis acht normalen Anwendern vorsehen. Die entscheidenden Aufgaben sind: den Assistenten finden, eine Wiedervorlage anlegen, ein falsches Transkript korrigieren und erklären, ob eine gezeigte Aktion bereits gespeichert ist. Das liefert belastbarere Erkenntnisse als eine reine Bewertung der Optik.

---

**11. Klar abgegrenzte spätere Pakete**

**Live Voice**

Die spätere Live-Unterhaltung verwendet dieselben Gespräche, Berechtigungen, Aktionspläne und Belege. Neu sind:

- fortlaufende Audioverbindung;
- Erkennen von Sprecherwechseln;
- Unterbrechen einer gesprochenen Antwort;
- getrennte Zustände für Zuhören, Antworten, stumm und beendet;
- gleichzeitige Textdarstellung;
- Umgang mit Netzverlust und Mikrofonwechsel;
- Begrenzung und Messung der Session;
- sichere Zuordnung gesprochener Bestätigungen.

Ein gesprochenes „Ja“ darf nur eine aktuell offene, konkret beschriebene Aktion bestätigen. Es ist keine allgemeine Erlaubnis für weitere Änderungen.

Für den ersten Live-Ausbau empfehle ich **nur bewusste Sessions im Vordergrund**. Hintergrundbetrieb, Aktivierungswort und automatisches Starten beim Öffnen des CRMs wären eigene Ausbauschritte.

Die laufende Sprachsession muss die bestehenden Gesprächsgrenzen respektieren. Ein längeres Gespräch darf weder unbemerkt über 20 Nachrichten hinauswachsen noch die Sieben-Tage-Frist verlängern. Bei einem erforderlichen Wechsel wird die Session verständlich unterbrochen bzw. in einen ausdrücklich neuen Gesprächskontext überführt.

Bis dieses Paket existiert, gibt es keinen sichtbaren Live-Knopf und keine Formulierung, die flüssige Sprachdialoge verspricht.

**Wissensgedächtnis, RAG und Obsidian**

Die Trennung aus [ADR 0005](C:/Users/adrie/Desktop/Business/Ergo_CRM/docs/adr/0005-kurzzeit-unterhaltungen-getrennt-vom-wissensgedaechtnis.md) und dem vorhandenen [Context-Assembler](C:/Users/adrie/Desktop/Business/Ergo_CRM/lib/ai-crm/context.ts) sollte erhalten bleiben.

Später unterscheidet die Oberfläche:

| Bereich | Bedeutung | Verwaltung |
|---|---|---|
| Aktuelles Gespräch | Vorübergehender Arbeitskontext | Gesprächsliste und Ablauf |
| CRM-Daten | Aktuelle Kontakte, Aktivitäten und Wiedervorlagen | Normale CRM-Ansichten |
| Persönlich gemerkte Angaben | Ausdrücklich gespeicherte Präferenzen oder Fakten | Eigene Ansicht zum Prüfen, Ändern und Löschen |
| Freigegebene Wissensquellen | Dokumente oder definierte Sammlungen | Quellenverwaltung mit Zugriffsregeln |
| Obsidian-Inhalte | Freigegebene Notizen aus einer angebundenen Quelle | Auswahl, Synchronisationsstatus und Widerruf |

Antworten zeigen bei Bedarf konkrete Quellen mit Titel, Herkunft und Aktualität. Der Nutzer kann unterscheiden, ob eine Aussage aus seinem CRM, aus dem aktuellen Gespräch oder aus einer Wissensquelle stammt.

Für den Start eines solchen Pakets empfehle ich:

- Quellenzugriff zunächst lesend;
- ausdrückliche Auswahl der freigegebenen Inhalte;
- keine automatische dauerhafte Erinnerung aus jedem Gespräch;
- eigenständige Lösch- und Widerrufsregeln;
- keine Übernahme von Anweisungen aus Dokumenten als Handlungsfreigabe;
- keine stillschweigende Verlängerung alter Chats.

Die laufende Unterhaltung braucht dafür später höchstens einen kleinen Quellenhinweis und einen Zugang zu Details. Sie braucht heute noch keinen leeren Wissensbereich.

**Proaktive Tagesbriefings**

Auch das ist ein separates Paket. Zunächst sollte Emil ein Briefing bewusst aufrufen können. Eine spätere proaktive Variante braucht mindestens:

- einen erkennbaren Aktualitätszeitpunkt;
- eine begrenzte Zahl relevanter Hinweise;
- eine ausdrückliche Einstellung zur Häufigkeit;
- eine Möglichkeit, Hinweise auszublenden;
- keine automatische Sprachwiedergabe;
- keine daraus abgeleiteten Schreibaktionen ohne Auftrag.

---

**12. Die noch notwendigen Produktentscheidungen**

Die Grundregeln zu „Namen sammeln“, Dock, Eigentümerzugriff, sieben Tagen und getrenntem Langzeitwissen sind bereits gesetzt. Sie müssen nicht erneut entschieden werden. Ebenso empfehle ich die Rollenverteilung mit Mini-Emil als Teil des Konzepts, ohne daraus eine zusätzliche blockierende Frage zu machen.

Für die anschließende Umsetzung bleiben aus meiner Sicht **zwei Entscheidungen**:

| Entscheidung | Optionen | Meine Empfehlung | Auswirkung |
|---|---|---|---|
| **Wo der Assistent lebt** | A: globales Overlay; B: nur eigene Seite; C: Panel plus gemeinsame Arbeitsansicht | **C**, mit beschriftetem Einstieg im App-Kopf und erhaltenem mobilen Dock | Höherer Frontend-Aufwand, dafür kurze Wege aus der CRM-Arbeit und eine tragfähige Grundlage für längere Gespräche. Die vollständige Desktop-Ansicht kann nach dem gemeinsamen Kern folgen. |
| **Welche Änderungen bestätigt werden** | Alle Schreibaktionen bestätigen; oder klare kleine Aufträge direkt ausführen und Änderungen mit höherem Fehlerrisiko vorher bestätigen | **Abgestufte Politik aus Abschnitt 7** | Weniger unnötige Klicks bei einfachen Aufträgen, dafür explizite Vorschauen bei Kontaktanlage, Feldänderungen, erledigten Wiedervorlagen, abgeleiteten und mehrteiligen Aktionen. Benötigt einen verbindlichen serverseitigen Ausführungspfad. |

Meine vorgeschlagene nächste Umsetzung umfasst den gemeinsamen Assistenten, den ruhigen Composer, die Transkriptprüfung, die verständliche Unterhaltungsverwaltung und die abgesicherte Darstellung von CRM-Aktionen. Live Voice, proaktive Briefings und Wissensgedächtnis bleiben jeweils eigenständig freizugebende Erweiterungen.

---

## C. Originalauftrag als Anforderungsreferenz

Der folgende Originalauftrag ist vollständig eingebettet. Er beschreibt die erste Analysephase. Spätere ausdrückliche Freigaben des Nutzers gehen dessen damaligen Arbeitsgrenzen vor. Insbesondere wurde dieses Dokument nach Abschluss der Analyse ausdrücklich angefordert. Die Modellbezeichnung Astra ist nicht der Name der Assistentenfigur.

Du bist das Modell Astra und arbeitest als sehr erfahrener Senior Product Designer, UX-Architekt und AI-Interface-Spezialist direkt in meinem bestehenden Git-Repository:

C:\Users\adrie\Desktop\Business\Ergo_CRM

Deine Aufgabe ist zunächst ausdrücklich NICHT, das bestehende UI umzubauen oder Code zu schreiben. Du sollst zuerst den aktuellen Zustand gründlich analysieren, relevante moderne AI-Oberflächen im Internet recherchieren und anschließend ein eigenständiges, belastbares UI-/UX-Konzept für den AI-Assistenten dieses CRMs entwickeln.

Wichtig: Mit „Astra“ ist das verwendete Modell gemeint – keine Person namens Astrid.

## Ausgangssituation

Im Repository existiert bereits ein umfangreicher AI-CRM-Assistent. Die technische V1.1 wurde lokal umgesetzt und getestet. Die Funktionalität ist bereits deutlich weiter als ein reines Mockup.

Der Assistent kann unter anderem:

- CRM-Fragen beantworten;
- Kontakte eigentümergesichert suchen und anzeigen;
- Kontakte anlegen;
- Aktivitäten dokumentieren;
- Wiedervorlagen anlegen und verwalten;
- mehrere offene Wiedervorlagen pro Kontakt verarbeiten;
- Tagesübersichten und anstehende Aufgaben liefern;
- konkrete CRM-Aktionen über Tool-Calling durchführen;
- sichtbare Aktionsbelege ausgeben;
- bestimmte AI-Aktionen innerhalb eines kurzen Zeitfensters rückgängig machen;
- Textnachrichten verarbeiten;
- aufgenommene Sprache transkribieren und anschließend als Eingabe verarbeiten;
- serverseitige Unterhaltungen speichern;
- nach einem Reload oder auf einem anderen angemeldeten Gerät wiederherstellen;
- zwischen Unterhaltungen wechseln;
- neue Unterhaltungen beginnen;
- Unterhaltungen löschen.

Die aktuelle Kurzzeitspeicherung funktioniert nach folgenden Regeln:

- Eine Unterhaltung läuft genau sieben Tage nach ihrem Beginn ab.
- Spätere Nachrichten verlängern diese Frist nicht.
- Eine Unterhaltung enthält höchstens 20 Nachrichten.
- Danach wird automatisch eine neue Unterhaltung begonnen.
- Abgelaufene Unterhaltungen werden nicht mehr an das Modell geschickt.
- Audio wird nicht dauerhaft gespeichert.
- Langfristiges Wissen, RAG, Embeddings und Obsidian-Anbindung sind bewusst noch nicht Teil dieser Stufe.

Die technische Grundlage für ein späteres Wissensgedächtnis wurde architektonisch vorbereitet, ohne bereits Vector-Tabellen oder eine langfristige Speicherung einzubauen.

## Das aktuelle UX-Problem

Der bestehende AI-Bereich ist funktional, wirkt aber visuell und konzeptionell noch zu kompliziert.

Momentan fühlt es sich teilweise so an, als wäre eine sehr große Funktionskarte direkt in die Seite „Heute“ eingebaut worden. Dadurch erscheinen viele Dinge gleichzeitig:

- Unterhaltungsverwaltung;
- Ablaufdatum;
- Chatverlauf;
- Eingabefeld;
- Voice-Aufnahme;
- Statusinformationen;
- Aktionsbelege;
- Löschen;
- neue Unterhaltung;
- Wechsel zwischen Unterhaltungen;
- eventuell Entitlement- oder Sperrhinweise.

Technisch ist das sinnvoll, aber für einen normalen CRM-Anwender kann es auf den ersten Blick überfordernd wirken.

Der gewünschte Eindruck ist eher:

„Ich öffne meinen Assistenten, schreibe oder spreche einfach los und verstehe sofort, was ich tun kann.“

Das Erlebnis soll vertraut, ruhig, intuitiv und fast selbstverständlich sein. Ein Nutzer wie Emil soll das CRM öffnen und nicht zuerst die Bedienlogik des AI-Bereichs lernen müssen.

## Produktvision

Der AI-Assistent soll sich langfristig zu einer Art persönlichem CRM-Begleiter entwickeln.

Kurzfristig:

- einfach Fragen stellen;
- Aufgaben und Kontakte besprechen;
- CRM-Aktionen sicher ausführen lassen;
- den Arbeitstag strukturieren;
- per Text oder Sprache arbeiten;
- Ergebnisse und ausgeführte Aktionen nachvollziehen können.

Langfristig:

- eine echte, flüssige Live-Unterhaltung per Sprache;
- ein „Jarvis“-ähnliches Erlebnis;
- proaktive, aber nicht nervige Tagesbriefings;
- kontextbezogene Hinweise;
- optionales langfristiges Wissensgedächtnis;
- RAG beziehungsweise kontrollierte Wissensquellen;
- möglicherweise eine Obsidian-Anbindung;
- eventuell Aktionen in weiteren freigegebenen Systemen.

Ein mögliches späteres Erlebnis wäre:

Emil öffnet das CRM und sagt:

„Jarvis, erzähl mal, was heute so geht.“

Der Assistent antwortet unmittelbar per Sprache, nennt die wichtigsten Wiedervorlagen, fragt bei Unklarheiten nach und kann nach Bestätigung konkrete CRM-Aktionen ausführen.

Diese Live-Voice-/Jarvis-Vision ist noch kein Teil der jetzigen Implementierung. Das neue UI-Konzept soll sie aber später ermöglichen, ohne dass die Oberfläche erneut komplett neu gedacht werden muss.

## Gestalterisches Ziel

Das UI darf und soll sich an der Vertrautheit moderner AI-Produkte orientieren, insbesondere an ChatGPT. Es soll aber keine bloße ChatGPT-Kopie werden.

Gewünscht sind insbesondere:

- eine sofort verständliche Chatfläche;
- eine klare visuelle Mitte;
- möglichst wenig gleichzeitig sichtbare Technik;
- ein vertrauter Composer am unteren Rand;
- natürliche Texteingabe;
- leicht auffindbare Spracheingabe;
- verständliche Unterhaltungsverwaltung;
- ruhige Darstellung von Assistenten- und Nutzernachrichten;
- klare, vertrauenswürdige Aktionsbelege;
- progressive Offenlegung zusätzlicher Funktionen;
- gute mobile Bedienung;
- ein eigenständiger CRM-Charakter;
- eine klare Verbindung zwischen Gespräch und tatsächlicher CRM-Arbeit.

Die bestehende Navy-/Blau-/Weiß-Designsprache des CRMs soll erhalten bleiben und verfeinert werden.

Der AI-Assistent darf moderner und etwas emotionaler wirken als normale Verwaltungsseiten. Er soll aber weiterhin seriös, vertrauenswürdig und geschäftstauglich bleiben.

## Wichtige bestehende Produktentscheidungen

Folgende bestehende Entscheidungen dürfen nicht versehentlich aufgehoben werden:

1. „Namen sammeln“ bleibt eine zentrale und dauerhaft erreichbare CRM-Aktion.

2. Auf dem Smartphone befindet sich „Namen sammeln“ direkt oberhalb des bestehenden Fünf-Punkte-Docks.

3. Das bestehende mobile Dock soll nicht ohne sehr guten Grund verändert oder erweitert werden.

4. Mini-Emil ist bereits als freundlicher, unten eingebetteter Begleiter für neue Nutzer beziehungsweise erste Arbeitsrunden gedacht.

5. Mini-Emil soll nicht zu einem blockierenden Chatbot werden.

6. Der neue AI-Assistent und Mini-Emil brauchen klar verständliche, unterschiedliche Rollen. Prüfe, ob und wie beide langfristig zusammengeführt werden könnten, ohne die aktuelle Nutzerführung zu zerstören.

7. CRM-Aktionen müssen weiterhin nachvollziehbar bleiben. Der Assistent darf nicht so „magisch“ wirken, dass der Nutzer nicht mehr erkennt, ob tatsächlich Daten verändert wurden.

8. Schreibende beziehungsweise riskante Aktionen benötigen weiterhin eine angemessene Bestätigung, einen klaren Aktionsbeleg oder – wo vorhanden – eine sichere Undo-Möglichkeit.

9. Der AI-Zugriff bleibt strikt auf die eigenen Kontakte und Daten des angemeldeten Nutzers begrenzt.

10. Die siebentägige Unterhaltung ist Kurzzeitkontext. Sie darf nicht mit einem späteren dauerhaften Wissensgedächtnis vermischt werden.

## Relevante Dateien und vorhandene Screenshots

Untersuche mindestens die folgenden Bereiche beziehungsweise Dateien:

- C:\Users\adrie\Desktop\Business\Ergo_CRM\components\ai-crm\AiCrmAssistant.tsx
- C:\Users\adrie\Desktop\Business\Ergo_CRM\app\(app)\heute\page.tsx
- C:\Users\adrie\Desktop\Business\Ergo_CRM\lib\ai-crm
- C:\Users\adrie\Desktop\Business\Ergo_CRM\docs\ai-crm-v1.md
- C:\Users\adrie\Desktop\Business\Ergo_CRM\docs\adr\0005-kurzzeit-unterhaltungen-getrennt-vom-wissensgedaechtnis.md

Sieh dir außerdem die vorhandenen Browser-Screenshots an:

- C:\Users\adrie\Desktop\Business\Ergo_CRM\test-results\ai-crm\desktop-active.png
- C:\Users\adrie\Desktop\Business\Ergo_CRM\test-results\ai-crm\desktop-result.png
- C:\Users\adrie\Desktop\Business\Ergo_CRM\test-results\ai-crm\desktop-contact-followups.png
- C:\Users\adrie\Desktop\Business\Ergo_CRM\test-results\ai-crm\mobile-active.png
- C:\Users\adrie\Desktop\Business\Ergo_CRM\test-results\ai-crm\mobile-voice.png
- C:\Users\adrie\Desktop\Business\Ergo_CRM\test-results\ai-crm\mobile-locked.png

Untersuche darüber hinaus das bestehende App-Shell-, Navigations-, Mobile-Dock-, Namen-sammeln- und Mini-Emil-Verhalten, damit das neue Konzept tatsächlich in die bestehende Anwendung passt.

Verlasse dich nicht allein auf diese Beschreibung. Prüfe den aktuellen Repository-Zustand selbst. Die Arbeitskopie enthält bewusst noch nicht committete Änderungen. Diese Änderungen gehören zum aktuellen Arbeitsstand und dürfen nicht verworfen, überschrieben oder bereinigt werden.

## Internetrecherche

Nutze aktuelle Quellen aus dem Internet und untersuche relevante Interaktionsmuster moderner AI-Produkte.

Betrachte unter anderem, sofern sinnvoll:

- ChatGPT;
- Claude;
- Gemini;
- Microsoft Copilot;
- Siri beziehungsweise aktuelle Voice-Assistenten;
- moderne CRM-Assistenten;
- mobile Chat-Interfaces;
- Conversational Action Interfaces;
- Voice- und Realtime-Interfaces;
- Confirmation- und Undo-Muster für AI-Aktionen;
- Darstellung von Tool- beziehungsweise Action-Ergebnissen;
- Vertrauen, Transparenz und Fehlervorbeugung bei agentischen Oberflächen.

Achte besonders auf:

- Einstieg in den Assistenten;
- Launcher versus eigene Seite;
- Seitenpanel versus Vollbild;
- Desktop-/Mobil-Unterschiede;
- Unterhaltungsverlauf;
- leere Zustände;
- Vorschläge beziehungsweise Starter-Prompts;
- Voice-Aufnahme;
- Übergang von Push-to-talk zu späterer Live-Unterhaltung;
- laufende Antworten;
- Abbruch;
- Lade- und Fehlerzustände;
- Tool-Ausführungen;
- Bestätigungen;
- Undo;
- Unterhaltungsverwaltung;
- langfristiges Gedächtnis;
- Datenschutz- und Aufbewahrungshinweise;
- Barrierefreiheit;
- Erreichbarkeit mit einer Hand auf dem Smartphone.

Nutze nach Möglichkeit primäre Quellen, offizielle Produktseiten, offizielle Dokumentationen oder belastbare UX-Quellen. Trenne klar zwischen beobachteten Mustern und deinen eigenen Schlussfolgerungen. Nenne die wichtigsten Quellen als anklickbare Links.

Die Recherche soll nicht in einem oberflächlichen „ChatGPT sieht so aus“ enden. Leite daraus konkrete Konsequenzen für dieses CRM und seine Nutzer ab.

## Zentrale UX-Fragen

Beantworte insbesondere diese Fragen:

1. Wo lebt der Assistent?

Soll er:

- als global erreichbarer Launcher unten rechts erscheinen;
- eine eigene zentrale CRM-Seite bekommen;
- als Seitenpanel über bestehenden Seiten geöffnet werden;
- auf Mobilgeräten als Vollbildansicht erscheinen;
- oder je nach Kontext unterschiedlich dargestellt werden?

2. Was bleibt auf „Heute“ sichtbar?

Soll dort:

- nur ein kleiner intelligenter Einstieg stehen;
- ein Tagesbriefing gezeigt werden;
- ein kompaktes Chatfenster bleiben;
- oder lediglich ein Launcher beziehungsweise eine Einladung zum Gespräch erscheinen?

3. Wie gelangt man während einer CRM-Aufgabe in den Assistenten?

Beispiele:

- aus einem Kontakt;
- aus einer Wiedervorlage;
- aus „Heute“;
- aus „Namen sammeln“;
- aus Mini-Emil;
- aus einer globalen Navigation.

4. Wie werden Unterhaltungen verwaltet?

Die Oberfläche muss ermöglichen:

- bestehende Unterhaltungen wiederzufinden;
- zwischen ihnen zu wechseln;
- eine neue Unterhaltung zu beginnen;
- eine Unterhaltung zu löschen;
- den Ablauf nach sieben Tagen zu verstehen;
- einen automatischen Neustart nach 20 Nachrichten zu verstehen.

Diese Verwaltung soll den Hauptdialog nicht unnötig dominieren.

5. Wie werden CRM-Aktionen dargestellt?

Unterscheide sinnvoll zwischen:

- einer normalen Antwort;
- einer gefundenen Information;
- einem Vorschlag;
- einer geplanten Aktion;
- einer Aktion, die noch bestätigt werden muss;
- einer erfolgreich ausgeführten Aktion;
- einer fehlgeschlagenen Aktion;
- einer Aktion mit Undo;
- einer Aktion, die wegen Mehrdeutigkeit eine Rückfrage benötigt.

6. Wie wird Sprache bedient?

Der heutige Stand ist Aufnahme, Transkription und anschließende Verarbeitung.

Das Konzept soll zeigen:

- wie die aktuelle Push-to-talk-/Aufnahmefunktion verständlich dargestellt wird;
- wann das Transkript sichtbar ist;
- wie der Nutzer Fehler im Transkript erkennt;
- wie Aufnahme, Abbruch und Verarbeitung aussehen;
- wie später ein echter Live-Voice-Modus ergänzt werden könnte;
- wie klar zwischen normaler Spracheingabe und einer laufenden Live-Unterhaltung unterschieden wird.

7. Welche Rolle hat Mini-Emil?

Prüfe mindestens diese Optionen:

- Mini-Emil bleibt ausschließlich Onboarding- und Motivationsbegleiter;
- Mini-Emil wird der visuelle Charakter des Assistenten;
- Mini-Emil führt nur in den Assistenten;
- Mini-Emil und der AI-Assistent bleiben vollständig getrennt.

Empfiehl eine klare Rollenverteilung und begründe sie.

8. Wie vermeiden wir visuelle und kognitive Überlastung?

Die wichtigsten Funktionen müssen sofort verständlich sein. Selten benötigte Funktionen sollen erst dann sichtbar werden, wenn sie gebraucht werden.

9. Wie schaffen wir Vertrauen?

Der Nutzer muss jederzeit verstehen:

- was der Assistent nur gelesen hat;
- was er vorschlägt;
- was tatsächlich verändert wurde;
- welche Daten betroffen sind;
- wie er eine Aktion rückgängig machen kann;
- warum eine Aktion nicht durchgeführt wurde;
- wie lange eine Unterhaltung gespeichert bleibt.

10. Wie bereiten wir das UI auf ein späteres Wissensgedächtnis vor?

Langfristiges Wissen darf später ergänzt werden, aber aktuell darf die Oberfläche keine Funktion vortäuschen, die technisch noch nicht existiert.

Das spätere Konzept sollte gegebenenfalls unterscheiden zwischen:

- aktuellem Gespräch;
- CRM-Daten;
- freigegebenem Langzeitwissen;
- externen Wissensquellen;
- Quellenangaben;
- persönlichen Erinnerungen;
- Obsidian-Inhalten.

## Entwickle mindestens drei unterschiedliche Konzepte

Entwickle mindestens diese drei Richtungen:

### Konzept A: Globaler Assistent

Ein dauerhaft erreichbarer Launcher öffnet den Assistenten als Overlay oder Seitenpanel.

Untersuche:

- Verhalten auf Desktop;
- Verhalten auf Mobilgeräten;
- Kontextübernahme aus der aktuellen CRM-Seite;
- Vor- und Nachteile für Fokus, Platz und Auffindbarkeit.

### Konzept B: Eigener AI-Arbeitsbereich

Der Assistent erhält eine eigene, vollständige CRM-Seite mit einer vertrauten Chat-Struktur.

Untersuche:

- Navigation;
- Unterhaltungsleiste;
- Hauptchat;
- mobile Darstellung;
- Wechsel zwischen Chat und CRM-Datensätzen;
- Vor- und Nachteile für intensive Nutzung.

### Konzept C: Hybrides Modell

Auf „Heute“ und anderen relevanten Seiten gibt es kleine kontextuelle Einstiege. Der eigentliche Assistent öffnet sich auf Desktop beispielsweise als rechtes Panel und auf Mobilgeräten als fokussierte Vollbildansicht. Für intensive Nutzung kann zusätzlich ein eigener AI-Arbeitsbereich existieren.

Untersuche:

- wann das Panel genügt;
- wann eine vollständige Seite benötigt wird;
- wie der Wechsel erfolgt;
- wie Unterhaltungen und Kontext konsistent bleiben;
- wie verhindert wird, dass sich Panel, eigene Seite und Mini-Emil wie drei verschiedene Assistenten anfühlen.

Du darfst weitere Konzepte ergänzen, falls du bei der Recherche eine bessere Lösung findest.

Bewerte die Konzepte nicht nur ästhetisch, sondern anhand konkreter Kriterien:

- sofortige Verständlichkeit;
- Auffindbarkeit;
- mobile Nutzbarkeit;
- geringe kognitive Belastung;
- Nähe zur täglichen CRM-Arbeit;
- Skalierbarkeit für Live Voice;
- Skalierbarkeit für RAG beziehungsweise Wissensgedächtnis;
- Sicherheit bei schreibenden Aktionen;
- technische Anschlussfähigkeit an den bestehenden Stand;
- Aufwand der Umsetzung;
- Risiko, bestehende CRM-Abläufe zu stören.

## Vorläufige Produkthypothese

Eine vorläufige, noch zu prüfende Hypothese lautet:

- Auf „Heute“ bleibt nur ein kleiner, intelligenter Einstieg beziehungsweise ein kompaktes Tagesbriefing.
- Der eigentliche Chat dominiert nicht dauerhaft das Dashboard.
- Auf Desktop öffnet der Assistent primär als ruhiges rechtes Panel.
- Bei intensiver Nutzung kann er in einen vollständigen AI-Arbeitsbereich erweitert werden.
- Auf Smartphones öffnet er als fokussierte Vollbildansicht.
- Unterhaltungsverwaltung, Löschen, Speicherfrist und Einstellungen liegen in einer sekundären Ebene.
- Der Composer bleibt immer klar und leicht erreichbar.
- Aktionsbelege erscheinen direkt im Gespräch, aber visuell kompakter als normale CRM-Karten.
- Ein späterer Live-Voice-Modus erhält einen bewusst anderen, fokussierten Zustand.
- Mini-Emil bleibt zunächst ein Onboarding- und Motivationsbegleiter und verweist bei Bedarf auf den Assistenten.

Behandle diese Hypothese nicht als bereits beschlossene Lösung. Prüfe sie kritisch und empfehle eine bessere Lösung, wenn deine Analyse dafür spricht.

## Anforderungen für Desktop und Mobil

Plane mindestens für:

- Desktop: 1280 × 800 Pixel;
- Smartphone: 375 × 812 Pixel.

Zusätzlich berücksichtigen:

- keine horizontale Überbreite;
- mindestens 44 × 44 Pixel große Touch-Ziele;
- Composer trotz mobiler Tastatur erreichbar;
- Berücksichtigung des bestehenden Mobile-Docks;
- Berücksichtigung von Safe Areas;
- klare Fokuszustände;
- Tastaturbedienung;
- Screenreader-taugliche Statusmeldungen;
- ausreichende Kontraste;
- kein rein farbbasiertes Statussystem;
- verständliches Verhalten bei langen Kontakt- oder Unterhaltungstiteln;
- verständliches Verhalten bei langen Assistentenantworten;
- gute Darstellung mehrerer Aktionsbelege;
- robuste Darstellung von Fehlern und Retries.

## Benötigtes Ergebnis

Erstelle eine fundierte UX-Konzeption mit mindestens folgenden Abschnitten:

### 1. Executive Summary

Fasse in verständlicher Sprache zusammen:

- was am aktuellen UI problematisch ist;
- welches Grundmodell du empfiehlst;
- warum dieses Modell am besten zum CRM passt;
- welche Auswirkungen es auf Desktop und Mobil hat.

### 2. Bestandsaufnahme

Dokumentiere:

- aktuelle Informationsarchitektur;
- aktuelle sichtbare Funktionen;
- Stärken des bestehenden UI;
- konkrete Schwachstellen;
- unnötige Komplexität;
- konkurrierende Einstiegspunkte;
- Probleme auf Desktop;
- Probleme auf Mobilgeräten;
- mögliche Verwechslung zwischen Mini-Emil und AI-Assistent.

Beziehe dich konkret auf die vorhandenen Dateien und Screenshots.

### 3. Research-Ergebnisse

Zeige:

- welche Produkte und Muster du untersucht hast;
- was davon für dieses CRM relevant ist;
- was bewusst nicht übernommen werden sollte;
- welche Rückschlüsse du daraus ziehst.

Verlinke die wichtigsten Quellen.

### 4. Vergleich der Konzepte

Stelle mindestens die drei Konzepte gegenüber:

- globaler Launcher;
- eigener AI-Arbeitsbereich;
- hybrides Modell.

Nutze eine nachvollziehbare Entscheidungsmatrix und gib eine eindeutige Empfehlung.

### 5. Empfohlene Informationsarchitektur

Beschreibe präzise:

- alle Einstiege in den Assistenten;
- Hauptansicht;
- Unterhaltungsnavigation;
- Chatverlauf;
- Composer;
- Spracheingabe;
- Aktionsbelege;
- Bestätigungen;
- Undo;
- Einstellungen;
- Aufbewahrungshinweis;
- Löschen;
- späteren Live-Voice-Einstieg;
- späteren Wissensbereich.

### 6. Zentrale Nutzerflüsse

Beschreibe mindestens folgende Abläufe Schritt für Schritt:

- Assistent erstmals öffnen;
- normale Textfrage stellen;
- Kontakt suchen;
- Wiedervorlage anlegen;
- mehrdeutigen Kontakt klären;
- schreibende Aktion bestätigen;
- erfolgreiche Aktion nachvollziehen;
- Aktion rückgängig machen;
- Spracheingabe aufnehmen;
- Transkript prüfen;
- neue Unterhaltung beginnen;
- alte Unterhaltung wieder öffnen;
- Unterhaltung löschen;
- automatischer Neustart nach sieben Tagen;
- automatischer Neustart nach 20 Nachrichten;
- gesperrten beziehungsweise nicht berechtigten Zustand verstehen;
- später eine Live-Unterhaltung starten und wieder verlassen.

### 7. Wireframes

Erstelle textuelle oder visuelle Low-Fidelity-Wireframes für mindestens:

Desktop:

- geschlossener Zustand;
- geöffneter Assistent;
- Chat mit Antwort;
- Chat mit Aktionsbeleg;
- Bestätigungszustand;
- Unterhaltungsübersicht;
- Voice-Zustand;
- Fehlerzustand;
- optionaler vollständiger AI-Arbeitsbereich.

Mobil:

- Einstieg aus „Heute“;
- Vollbild-Chat;
- Composer mit geöffneter Tastatur;
- Spracheingabe;
- Transkriptprüfung;
- Aktionsbeleg;
- Unterhaltungswechsel;
- Löschen-Bestätigung;
- späterer Live-Voice-Modus.

Die Wireframes müssen so konkret sein, dass ein Frontend-Entwickler daraus Komponenten und Layouts ableiten kann.

### 8. Visuelle Richtung

Definiere:

- Hierarchie;
- Flächen;
- Abstände;
- Typografie;
- Farben;
- Nachrichtenstil;
- AI-Präsenz;
- Icon-Verwendung;
- Animationen;
- Ladeverhalten;
- Voice-Visualisierung;
- Darstellung von Aktionsbelegen;
- Darstellung von Warnungen und Bestätigungen.

Bleibe in der bestehenden Navy-/Blau-/Weiß-Welt, entwickle sie aber sinnvoll weiter.

Vermeide:

- generische „AI-Gradient überall“-Optik;
- übermäßigen Glassmorphism;
- unnötige Neonfarben;
- große dekorative Flächen ohne Funktion;
- zu viele Karten ineinander;
- eine bloße ChatGPT-Kopie;
- einen verspielten Charakter, der die geschäftliche Vertrauenswürdigkeit beschädigt.

### 9. UX-Texte

Schreibe konkrete deutsche Beispieltexte für:

- leeren Zustand;
- Starter-Prompts;
- Sieben-Tage-Hinweis;
- Neustart nach Ablauf;
- Neustart nach Nachrichtenlimit;
- Aufnahme läuft;
- Transkript bereit;
- Aktion wird vorbereitet;
- Bestätigung einer schreibenden Aktion;
- Aktion erfolgreich;
- Undo möglich;
- Undo nicht mehr möglich;
- Mehrdeutigkeit;
- Providerfehler;
- Offline- beziehungsweise Netzwerkfehler;
- fehlende Berechtigung;
- Unterhaltung löschen;
- späteren Live-Voice-Einstieg.

Die Texte sollen menschlich, knapp und nicht technisch klingen.

### 10. Komponentenmodell

Leite ein mögliches Frontend-Komponentenmodell ab, beispielsweise:

- AssistantLauncher;
- AssistantPanel;
- AssistantWorkspace;
- ConversationSwitcher;
- ConversationList;
- ChatTimeline;
- AssistantMessage;
- UserMessage;
- ActionReceipt;
- ActionConfirmation;
- ChatComposer;
- VoiceRecorder;
- TranscriptReview;
- RetentionNotice;
- LiveVoiceMode.

Das sind nur Beispiele. Passe die Struktur an deine Empfehlung an.

Beschreibe außerdem, welche vorhandenen Komponenten:

- weiterverwendet;
- aufgeteilt;
- vereinfacht;
- neu angeordnet;
- oder später ersetzt werden sollten.

### 11. Umsetzungsvorschlag

Erstelle eine gestufte Reihenfolge für die spätere Implementierung.

Beispielsweise:

- Phase 1: Informationsarchitektur und neuer Einstieg;
- Phase 2: neue Chatfläche und Composer;
- Phase 3: Unterhaltungsverwaltung;
- Phase 4: kompakte Aktionsbelege und Bestätigungsmuster;
- Phase 5: Voice-UX;
- Phase 6: Vorbereitung auf Live Voice;
- Phase 7: späteres Wissensgedächtnis.

Für jede Phase:

- Ziel;
- betroffene Komponenten;
- wesentliche Risiken;
- Abnahmekriterien;
- Desktop-/Mobil-Prüfung.

Trenne klar:

- was nur UI-Umbau ist;
- was zusätzliche Frontend-Logik benötigt;
- was Backend-Änderungen erfordern würde;
- was erst zum späteren Live-Voice-Paket gehört;
- was erst zum späteren RAG-/Obsidian-Paket gehört.

### 12. Offene Produktentscheidungen

Liste nur Entscheidungen auf, die tatsächlich noch durch mich getroffen werden müssen.

Gib für jede Entscheidung:

- die verfügbaren Optionen;
- deine Empfehlung;
- den konkreten Unterschied für das Produkt;
- die Auswirkung auf Aufwand und Zukunftsfähigkeit.

Vermeide Fragen, die du durch Repository-Analyse oder UX-Recherche selbst beantworten kannst.

## Arbeitsweise

Arbeite evidenzbasiert und konkret.

- Analysiere zuerst den aktuellen Stand.
- Recherchiere anschließend aktuelle Muster.
- Entwickle daraus mehrere Konzepte.
- Entscheide dich danach für eine begründete Empfehlung.
- Zeige nicht nur schöne Oberflächen, sondern vollständige Nutzerabläufe und Zustände.
- Denke gleichermaßen an Desktop und Smartphone.
- Berücksichtige die bestehende technische Realität.
- Weise klar auf Annahmen hin.
- Stelle fehlende Informationen nicht einfach erfunden dar.
- Wenn eine Produktentscheidung nicht blockiert, triff eine vernünftige Annahme und kennzeichne sie.
- Beurteile die Oberfläche aus Sicht eines normalen CRM-Anwenders wie Emil, nicht nur aus Sicht eines Entwicklers.
- Verwende Alltagssprache statt technischer Begriffe, wo Nutzertexte betroffen sind.
- Erhalte die bereits funktionierenden CRM-Prozesse.

## Klare Ausführungsgrenze

In diesem ersten Task sollst du noch keinen produktiven Code verändern.

Du darfst:

- das Repository lesen;
- den aktuellen UI-Aufbau analysieren;
- Screenshots ansehen;
- lokale, nicht verändernde Prüfungen durchführen;
- im Internet recherchieren;
- Konzepte erstellen;
- Wireframes ausarbeiten;
- eine Umsetzungsreihenfolge empfehlen.

Du darfst in dieser Stufe nicht:

- bestehende Dateien umbauen;
- Datenbankmigrationen verändern oder ausführen;
- Abhängigkeiten installieren;
- Preview- oder Produktionsdatenbanken verwenden;
- echte OpenAI- oder Stripe-Provider aufrufen;
- Feature-Schalter aktivieren;
- committen;
- pushen;
- deployen;
- vorhandene uncommittete Änderungen verwerfen;
- die aktuelle Anwendung ungefragt strukturell erweitern.

Falls du zur Dokumentation neue Konzeptdateien im Repository anlegen möchtest, frage vorher. Standardmäßig soll das Ergebnis zunächst direkt als ausführliche Antwort im Task erscheinen.

## Erwartete Abschlussantwort

Deine Abschlussantwort soll kein loses Brainstorming sein, sondern eine klare Produktentscheidung ermöglichen.

Beginne mit einer eindeutigen Empfehlung in wenigen Sätzen.

Danach liefere:

1. Bestandsaufnahme;
2. Research mit Quellen;
3. Vergleich der Konzepte;
4. empfohlene Informationsarchitektur;
5. Desktop- und Mobil-Wireframes;
6. Nutzerflüsse;
7. Zustände und UX-Texte;
8. visuelle Richtung;
9. Komponentenmodell;
10. gestufte Umsetzungsreihenfolge;
11. klar abgegrenzte spätere Pakete für Live Voice und RAG/Obsidian;
12. die wenigen noch notwendigen Entscheidungen von mir.

Das Ziel ist, dass wir nach deiner Antwort genau wissen:

- wo der AI-Assistent im CRM lebt;
- wie Emil ihn öffnet;
- wie sich das Erlebnis auf Desktop und Smartphone verhält;
- wie normale Chats, Voice und CRM-Aktionen aussehen;
- wie Mini-Emil und der eigentliche Assistent voneinander abgegrenzt sind;
- wie wir später echten Jarvis-/Live-Voice-Modus ergänzen;
- und in welcher Reihenfolge das neue UI anschließend umgesetzt werden soll.

---

## D. Abnahmecheckliste für die spätere Umsetzung

Die folgenden Punkte sind Zielkriterien und wurden im Übergabetask nicht als erfüllt getestet.

### Bestehende CRM-Arbeit

- [ ] Namen sammeln bleibt dauerhaft erreichbar und mobil direkt über dem unveränderten Fünf-Punkte-Dock.
- [ ] Links nach /namen/sammeln behalten das erforderliche prefetch-Verhalten bei.
- [ ] Kontakte, Kalender, Tagesarbeit und bestehende Wiedervorlagen bleiben normal bedienbar.
- [ ] Mini-Emil bleibt nicht blockierender Begleiter; sein Fortschritt wird nicht durch das Öffnen des Assistenten verändert.
- [ ] Globaler Assistent, Kontext und Gesprächsliste respektieren Vorführmodus und Eigentümergrenzen.

### Gespräch und Navigation

- [ ] Öffnen allein erzeugt weder Provideraufruf noch neue gespeicherte Unterhaltung.
- [ ] Panel, Arbeitsbereich und mobile Ansicht verwenden dieselbe Unterhaltung.
- [ ] Entwurf und laufende Anfrage bleiben bei unterstützten Ansichtswechseln korrekt zugeordnet.
- [ ] Die 20-Nachrichten-Grenze zählt Nutzer- und Assistentennachrichten verständlich.
- [ ] Ablauf und Neustart erzeugen keinen Eindruck, alter Kontext werde weiterverwendet.
- [ ] Gespräche über die ersten zehn Einträge hinaus bleiben auffindbar.
- [ ] Löschen ist bestätigt, löscht keine CRM-Arbeit und erzeugt keine Race Condition mit laufenden Aktionen.
- [ ] Wiederherstellung gesendeter Nachrichten wurde nach Reload und auf einem zweiten angemeldeten Gerät geprüft.

### Aktionen und Vertrauen

- [ ] Gelesene Information, Vorschlag, Bestätigung, Ausführung, Erfolg, Fehler und unbekannter Abschluss sind unterscheidbar.
- [ ] Jede bestätigungspflichtige Änderung wartet serverseitig auf die konkrete Freigabe.
- [ ] Geänderte Parameter oder inzwischen veränderte Datensätze machen veraltete Vorschauen ungültig.
- [ ] Mehrdeutige Kontakte und mehrere passende Wiedervorlagen werden vor dem Schreiben geklärt.
- [ ] Teilweise erfolgreiche Aufträge zeigen alle relevanten Einzelzustände.
- [ ] Retry und Doppelbestätigung erzeugen keine ungewollten doppelten Änderungen.
- [ ] Undo wird nur mit tatsächlichem Serverstatus angeboten; Frist, Konflikt, Reload und Rücknahme sind korrekt.
- [ ] Stop wird nicht als Rollback dargestellt; bereits gespeicherte Aktionen bleiben sichtbar.

### Voice, Layout und Barrierefreiheit

- [ ] Diktat wird vor dem Absenden editierbar angezeigt.
- [ ] Aufnahme abbrechen, Freigabe verweigern, Browserwechsel und Verlassen schließen das Mikrofon zuverlässig.
- [ ] Diktieren kann ohne ausschließliches Gedrückthalten bedient werden.
- [ ] 1280 × 800 und 375 × 812 haben keine horizontale Überbreite.
- [ ] Composer, Dock, Namen sammeln und Safe Areas funktionieren mit echter mobiler Tastatur.
- [ ] Alle interaktiven Ziele sind mindestens 44 × 44 CSS-Pixel groß.
- [ ] Lange Titel, Antworten, Telefonnummern und mehrere Belege bleiben verständlich.
- [ ] Tastatur, Fokus, Screenreader, Kontraste, 200 % Textvergrößerung und reduzierte Bewegung sind geprüft.
- [ ] Netzwerk-/Providerfehler behaupten ohne verifizierten Status nicht, es sei nichts gespeichert worden.
- [ ] Die Oberfläche zeigt keine noch nicht vorhandenen Live-Voice- oder Wissensfunktionen.

### Übergabe nach einer späteren Umsetzung

- [ ] Tatsächlich geänderte Dateien und Backend-Verträge benannt.
- [ ] Ausgeführte Prüfungen getrennt von noch offenen Geräte-/Provider-/Produktionsprüfungen dokumentiert.
- [ ] Bestehende und neue uncommittete Änderungen nachvollziehbar unterschieden.
- [ ] Commit, Push, Preview, Datenbankmigration und Produktion nur bei entsprechender Freigabe; Status jeweils separat berichtet.

Erstellung dieses Dokuments: ausschließliche Dokumentationsänderung auf Nutzerwunsch. Kein produktiver UI-Umbau, keine Migration, keine Provider-Aufrufe, keine Installation, keine Feature-Aktivierung, kein Commit, Push oder Deployment.
