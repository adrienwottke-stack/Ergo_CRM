# Assistent-Plan (Ergo CRM)

Stand: 14.08.2026 — Planungsdokument, noch nicht implementiert.

Ziel: weniger händisches Eintragen. Du sagst in einem Satz, was passiert ist; der Assistent
schlägt die passenden CRM-Einträge vor; du bestätigst mit einem Tipp. Er ist kein Chatbot,
der über das CRM redet, sondern einer, der **die Formulare ausfüllt**.

---

## 1. Grundentscheidungen

| Thema | Entscheidung |
|---|---|
| Kanal | **Diktat am Handy** (großes Feld mit Mikrofon) + **Chat-Panel am Desktop** — dieselbe Komponente, zwei Platzierungen |
| Freigabe | **Immer bestätigen.** Schreibende Aktionen werden nur *vorgeschlagen*, nie automatisch ausgeführt |
| Umfang | Eintragen, Fragen beantworten, mehrere Kontakte auf einmal, täglicher Tagesplan |
| Datenschutz | **Klarnamen** an die API, abgesichert über einen AV-Vertrag mit Anthropic |
| Modell | `claude-sonnet-5`, als eine Konstante im Code — Wechsel auf `claude-opus-5` ist eine Zeile |
| Sprache | Deutsch, Du-Form, knapp — wie der Rest der Anwendung |

---

## 2. Was der Assistent kann

### 2.1 Eintragen (der Kern)

> „Grad mit Frau Weber telefoniert, Termin Dienstag 14 Uhr bei ihr zuhause,
> sie will was zur Altersvorsorge wissen"

Vorschlag:

| Feld | Wert |
|---|---|
| Kontakt | Anna Weber (Treffer aus der Suche) |
| Aktivität | Anruf · „Termin vereinbart, Interesse PAV, Termin beim Kunden" |
| Phase | Kontaktiert → **Termin vereinbart** |
| Termin | Di, 18.08.2026, 14:00 |
| Nächster Schritt | Termin durchführen · 18.08., 14:00 |

Du tippst auf **Übernehmen**. Fertig — statt vier Formularen.

Das Playbook aus [pipeline-plan.md](pipeline-plan.md) ist dabei der entscheidende Vorteil:
Der Assistent muss Fristen nicht erfinden, er kennt die Regeln. „Termin vereinbart" heißt
immer „nächster Schritt = Termin am Termindatum", nicht irgendwas Ausgedachtes.

### 2.2 Fragen beantworten

> „Wen muss ich heute noch anrufen?"
> „Was war der Stand bei Müller?"
> „Wie viele Einheiten hab ich offen?"

Lesende Fragen laufen **ohne Bestätigung** durch — sie ändern nichts.

### 2.3 Mehrere Kontakte auf einmal

> „Heute 12 Leute angerufen. Schmidt und Klein nicht erreicht, Bauer will nächste Woche
> nochmal, mit Hoffmann hab ich Donnerstag 10 Uhr ausgemacht, der Rest war nix."

Der Assistent arbeitet die Liste ab und legt **eine Vorschlagskarte pro Kontakt** an. Wo
er unsicher ist („der Rest" — welche?), fragt er nach, statt zu raten. Du kannst einzelne
Karten verwerfen und den Rest übernehmen.

### 2.4 Tagesplan

Beim ersten Öffnen von `/heute` am Tag erzeugt er eine kurze Einordnung: was ist überfällig,
wo hängt etwas, was wäre heute am wichtigsten. Wird **einmal pro Tag** erzeugt und
gespeichert, mit Knopf zum Neuberechnen — sonst kostet jeder Seitenaufruf Geld.

---

## 3. Architektur

```
Handy / Desktop
   │  Text (diktiert oder getippt)
   ▼
Server Action  ──►  Anthropic API (claude-opus-5)
   │                 mit Werkzeug-Katalog + Playbook im System-Prompt
   │
   ├── Lese-Werkzeug?  ──► sofort ausführen, Ergebnis zurück ans Modell
   │
   └── Schreib-Werkzeug? ──► NICHT ausführen, als Vorschlag speichern
                                    │
                                    ▼
                          Vorschlagskarte in der Oberfläche
                                    │  Nutzer bestätigt
                                    ▼
                          bestehende Server-Action ausführen
```

Der entscheidende Punkt: **der Assistent bekommt keine eigene Schreib-Logik.** Er ruft
exakt dieselben Server-Actions auf, die auch die Knöpfe im CRM aufrufen — mit denselben
Prüfungen, denselben Wettbewerbspunkten, denselben Phasenhistorie-Einträgen. Es gibt keinen
zweiten Weg in die Datenbank, der eigene Fehler machen kann.

---

## 4. Werkzeug-Katalog

### 4.1 Lesend — führt sofort aus

| Werkzeug | Zweck |
|---|---|
| `kontakt_suchen(suchbegriff)` | Findet Kontakte nach Name, Telefon, Notiz. Gibt ID, Name, Phase, nächsten Schritt zurück |
| `kontakt_details(kontaktId)` | Voller Stand: Phase, Termin, Vorgänge, letzte Aktivitäten, Empfehlungsbaum |
| `heute_liste()` | Fällige Schritte (überfällig / heute / diese Woche), aus `/heute` |
| `pipeline_zahlen()` | Verteilung je Phase, offene und gewonnene Einheiten |

### 4.2 Schreibend — wird nur vorgeschlagen

| Werkzeug | Ruft am Ende auf |
|---|---|
| `kontakt_anlegen` | `createContact` |
| `aktivitaet_erfassen` | `createActivity` |
| `phase_setzen` | `setContactStage` |
| `schritt_erledigen` | `completeContactStep` |
| `als_verloren_markieren` | `markContactLost` |
| `vorgang_anlegen` | `createDeal` |
| `vorgang_phase_setzen` | `setDealStage` |
| `empfehlungen_erfassen` | `addReferrals` |
| `checkup_planen` | `scheduleCheckup` |

Jedes Schreib-Werkzeug bekommt dasselbe Schema wie die Server-Action dahinter — was die
Action nicht annimmt, kann der Assistent nicht vorschlagen.

---

## 5. Kontakt-Erkennung

Der häufigste Stolperstein: „Frau Weber" — welche?

1. Der Assistent ruft `kontakt_suchen("Weber")` auf.
2. **Ein Treffer** → er verwendet ihn und zeigt den vollen Namen in der Vorschlagskarte,
   damit du den Fehlgriff siehst.
3. **Mehrere Treffer** → die Karte zeigt eine Auswahl („Anna Weber (Termin vereinbart)"
   oder „Bernd Weber (Neu)"), du tippst den richtigen an.
4. **Kein Treffer** → er schlägt `kontakt_anlegen` vor, mit dem Namen aus dem Diktat.

Die Regel im System-Prompt: **Bei Unsicherheit fragen, nicht raten.** Ein falsch
zugeordnetes Gespräch ist teurer als eine Rückfrage.

---

## 6. Der Bestätigungs-Fluss

1. Du diktierst oder tippst.
2. Der Assistent antwortet mit **einem Satz** („Anna Weber: Termin Dienstag eingetragen")
   plus einer oder mehreren Vorschlagskarten.
3. Jede Karte zeigt **alle** Feldänderungen im Klartext — vorher → nachher.
4. Knöpfe je Karte: **Übernehmen** · **Ändern** (öffnet den normalen Dialog mit den
   vorbelegten Werten) · **Verwerfen**.
5. Beim Übernehmen läuft die echte Server-Action, und die Karte wird zur Quittung.

Am Handy sitzen die Knöpfe unten, in Daumenreichweite, mindestens 44 px hoch — dieselben
Regeln wie im Pipeline-Plan, Abschnitt 7.1.

---

## 7. Datenmodell (Ergänzung)

```prisma
model AssistantMessage {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      String   // "user" | "assistant"
  content   Json     // vollständige Nachrichten-Blöcke, für den API-Verlauf
  createdAt DateTime @default(now())

  proposals AssistantProposal[]

  @@index([userId, createdAt])
}

// Ein vorgeschlagener Schreibvorgang. Auch der Verlauf: was hat der Assistent
// vorgeschlagen, was hast du übernommen, was verworfen.
model AssistantProposal {
  id        String         @id @default(cuid())
  messageId String
  message   AssistantMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  toolName  String
  input     Json
  status    ProposalStatus @default(OFFEN)
  contactId String?        // gesetzt, sobald zugeordnet
  appliedAt DateTime?
  createdAt DateTime       @default(now())

  @@index([messageId])
}

enum ProposalStatus {
  OFFEN
  UEBERNOMMEN
  VERWORFEN
}

// Tagesplan, einmal je Tag und Person erzeugt.
model DailyBrief {
  id        String   @id @default(cuid())
  userId    String
  day       DateTime // UTC-Mitternacht des Berliner Tages, wie DailyLog
  text      String
  createdAt DateTime @default(now())

  @@unique([userId, day])
}
```

Der Verlauf ist nicht nur Bequemlichkeit: Ohne ihn kann der Assistent auf „ach, und den
Termin doch lieber Mittwoch" nicht reagieren.

---

## 8. Technische Festlegungen

**Modell und Aufruf.** `claude-sonnet-5` über das offizielle SDK (`@anthropic-ai/sdk`),
aufgerufen aus einer Server-Action. Der API-Schlüssel liegt als `ANTHROPIC_API_KEY` in den
Vercel-Umgebungsvariablen und verlässt den Server nie.

**Warum Sonnet und nicht Opus.** Die Aufgabe ist kein tiefes Denken, sondern zuverlässiges
Regelbefolgen plus Werkzeugaufrufe — dafür erreicht Sonnet 5 inzwischen Qualität, die
vorher der Opus-Klasse vorbehalten war, und greift von sich aus bereitwillig zu Werkzeugen.
Es interpretiert Anweisungen zudem **wörtlicher** und schlussfolgert weniger hinzu: bei
unserer Regel „Bei Unsicherheit fragen, nicht raten" ist genau das erwünscht. Vorne bleibt
Opus beim **Sammel-Diktat mit Unschärfe** (mehrere Personen gleichzeitig verfolgen, „der
Rest" gegen eine Liste auflösen). Deshalb steht das Modell als eine Konstante im Code —
zeigt sich beim echten Diktieren, dass die Sammel-Eingabe hakt, ist der Wechsel auf
`claude-opus-5` eine Zeile.

**Denken eingeschaltet lassen.** Auf Claude Sonnet 5 ist das Denken standardmäßig an. Das
bleibt so — mit abgeschaltetem Denken sinkt die Bereitschaft, überhaupt Werkzeuge zu
benutzen, und das ist bei einem System, das ausschließlich über Werkzeugaufrufe arbeitet,
der Totalausfall. (Auf Opus 5 kommt derselbe Fehlermodus in anderer Form: Werkzeugaufrufe
landen dort gelegentlich als **Fließtext** statt als echter Aufruf, die Aktion passiert
dann stillschweigend nicht.) Gesteuert wird über `effort` — Standardwert `high` für die
Eingabe, `low` für den Tagesplan.

**Prompt-Caching.** System-Prompt und Werkzeug-Definitionen (~3.000 Token) sind bei jeder
Anfrage identisch und werden zwischengespeichert; das senkt die Eingabekosten dieses Teils
auf ein Zehntel. Wichtig: Das aktuelle Datum und der Kontakt-Kontext gehören **hinter** den
Zwischenspeicher-Punkt, nicht in den System-Prompt — sonst ist der Cache jeden Tag hinüber.

**Antwortlänge.** `max_tokens` auf 8.000, ohne Streaming. Die Antworten sind kurz; das
Streaming spart hier nichts und verkompliziert die Vorschlagskarten.

---

## 9. Datenschutz

**Was passiert:** Name, Telefonnummer, Gesprächsnotizen und der Pipeline-Stand des
betroffenen Kontakts gehen als Anfrage an die Anthropic-API. Ohne diese Daten kann der
Assistent seine Arbeit nicht tun.

**Was du vorher erledigen musst:**

1. **AV-Vertrag** (Auftragsverarbeitung nach Art. 28 DSGVO) mit Anthropic abschließen. Prüf
   das in der Anthropic Console unter den Organisationseinstellungen; wenn du dort nichts
   findest, per Support anfordern. **Ohne den Vertrag nicht mit echten Kundendaten
   starten.**
2. **Aufbewahrungsdauer** in der Console prüfen und bewusst einstellen.
3. **Verarbeitungsverzeichnis** ergänzen: neuer Empfänger, Zweck, Kategorien.
4. Falls der Wettbewerb über dein Netzwerk hinausgeht: die anderen Berater müssen wissen,
   dass ihre Kontaktdaten durch die API laufen, bevor sie den Assistenten nutzen.

**Was das System dazu beiträgt:** Der Assistent bekommt immer nur die Kontakte, die dem
angemeldeten Benutzer gehören — dieselbe `ownerId`-Grenze wie überall sonst. Es gibt keinen
Aufruf, der über alle Berater hinweg liest.

**Was ich nicht für dich klären kann:** ob dein Netzwerk oder die ERGO eigene Vorgaben zu
KI-Diensten und Kundendaten hat. Das musst du dort abfragen — es hilft nichts, wenn die
DSGVO-Seite sauber ist und die interne Richtlinie es trotzdem verbietet.

---

## 10. Kosten

Pro Eingabe mit `claude-sonnet-5`, mit Zwischenspeicherung:

| Posten | Menge | Kosten |
|---|---|---|
| System-Prompt + Werkzeuge (zwischengespeichert) | ~3.000 Token | ~0,09 ct |
| Kontext (Kontakt, Verlauf, Suchtreffer) | ~1.000 Token | ~0,3 ct |
| Antwort (Vorschläge + ein Satz) | ~400 Token | ~0,6 ct |
| **Summe** | | **~1,0 ct** |

Bei 30 Eingaben am Tag, 22 Arbeitstagen: **rund 6,50 US-Dollar im Monat**, etwa 6 €. Der
Tagesplan kommt mit ein paar Cent dazu.

Im Vergleich:

| Modell | pro Eingabe | im Monat |
|---|---|---|
| `claude-sonnet-5` | ~1,0 ct | ~6 € |
| `claude-opus-5` | ~1,7 ct | ~10 € |
| `claude-haiku-4-5` | ~0,3 ct | ~2 € |

**Der Kostenunterschied ist kein Argument für die Modellwahl** — vier bis fünf Euro im
Monat sollten keine Architekturentscheidung treiben. Entscheidend ist die Zuverlässigkeit
beim Sammel-Diktat (siehe Abschnitt 8).

Zwei Fußnoten: Sonnet 5 hat bis **31.08.2026** einen Einführungspreis (2 statt 3 US-Dollar
je Million Eingabe-Token), der die Rechnung vorübergehend auf etwa 4 € drückt — plan mit
den 6 €. Und `claude-haiku-4-5` versteht verschachtelte Ansagen deutlich schlechter; für
den Tagesplan, der nur zusammenfasst, ist es trotzdem eine Überlegung wert.

---

## 11. Bauabschnitte

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 1 | Schema (`AssistantMessage`, `AssistantProposal`, `DailyBrief`) + Migration | Datenbasis |
| 2 | Werkzeug-Katalog + System-Prompt mit Playbook-Regeln | Der Assistent „kennt" das CRM |
| 3 | Server-Action: API-Aufruf, Lese-Werkzeuge ausführen, Schreib-Werkzeuge als Vorschlag ablegen | Kern funktioniert |
| 4 | Vorschlagskarten mit Übernehmen / Ändern / Verwerfen | Der Kreis schließt sich |
| 5 | Eingabefeld: Diktat am Handy, Chat-Panel am Desktop | Bedienbar |
| 6 | Kontakt-Erkennung mit Rückfrage bei Mehrdeutigkeit | Alltagstauglich |
| 7 | Mehrere Kontakte je Eingabe | Abendliche Nacharbeit in einem Rutsch |
| 8 | Tagesplan auf `/heute`, einmal je Tag | Proaktiv |
| 9 | Verlauf-Ansicht: was wurde vorgeschlagen, was übernommen | Nachvollziehbar |

Nach Schritt 5 ist der Assistent bereits nützlich — der Rest ist Komfort.

---

## 12. Offene Punkte

1. **AV-Vertrag** — muss vor dem ersten echten Kontakt stehen (Abschnitt 9).
2. **Anthropic-Konto** — brauchst du ein eigenes für das CRM, getrennt von dem, über das
   Claude Code läuft? Sauberer wäre es, wegen Abrechnung und Schlüsselverwaltung.
3. **Sprechen statt tippen** — die Diktierfunktion des Handys reicht für den Anfang. Echte
   Sprachaufnahme mit Transkription im Server wäre komfortabler (Freisprechen im Auto),
   ist aber ein eigenes Thema.
4. **Antragsphase** — steht aus dem Pipeline-Plan noch offen und betrifft auch die
   Werkzeuge des Assistenten.
