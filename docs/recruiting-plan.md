# Recruiting-Plan (Ergo CRM)

Stand: 20.08.2026 — Planungsdokument.

Ausgangsthese (von dir, 20.08.): **Verkauf ist der Anlauf, Aufbau ist das Geschäft.**
Am Anfang schreibt man mit überschaubar vielen Verkaufsgesprächen seine ~500 Einheiten
Eigenumsatz — danach besteht der Alltag aus Rekrutierung. Das Werkzeug ist heute aber zu
neun Zehnteln ein Verkaufswerkzeug: es zeigt Verkauf, es misst Verkauf, es belohnt Verkauf.

Dieser Plan zieht die Konsequenz daraus, ersetzt Abschnitt 6 von
[struktur-plan.md](struktur-plan.md) und holt ihn von Bauabschnitt 10 nach vorn.

---

## 0. Was die These für das Werkzeug bedeutet — und was nicht

**Nicht:** Die Verkaufspipeline abreißen. Sie verschwindet nicht, sie **wechselt den
Besitzer**. Jeder Geworbene fängt wieder bei Namensliste und Verkaufstrichter an. Wer
aufbaut, braucht die Verkaufspipeline weiterhin — nur nicht mehr für sich, sondern damit
sie beim Neuen funktioniert. Ein Aufbauer, der selbst nicht mehr verkauft, verliert
außerdem das Vorbild: die Mannschaft macht nicht, was gesagt wird, sondern was vorgemacht
wird.

**Doch:** Wer aufbaut, findet im Werkzeug **nichts von seiner Arbeit** wieder. Es gibt
keinen Kandidaten-Trichter, keine Kennzahl, keinen Punkt, keine Frist. Seine
Recruiting-Namen laufen durch dieselben Phasen wie Kunden und enden auf `KUNDE` —
fachlich Unsinn. Der Aufbauer pflegt also ein System, das seine Haupttätigkeit nicht
kennt. Das pflegt niemand lange.

**Und der Punkt, den beide bisherigen Pläne übersehen:** Ein Verkauf ist mit der
Unterschrift fertig. Eine Werbung ist es **erst rund 90 Tage später**. Zwischen „sagt zu"
und „läuft" liegt die Strecke, auf der Rekrutierung tatsächlich gewonnen oder verloren
wird — und genau diese Strecke ist im Werkzeug ein weißer Fleck.

```
Verkauf   Name ──▶ Anruf ──▶ Termin ──▶ Beratung ──▶ Abschluss ──▶ fertig
                                                                   └─ Betreuung (Bonus)

Aufbau    Name ──▶ Anruf ──▶ Info ──▶ Entscheidung ──▶ Zusage ──▶ ░░░░░░░░░░░░░░░░░░
                                                                  90 Tage Aktivierung
                                                                  ▲ hier entscheidet
                                                                    sich alles
```

Der Leitsatz für alles Folgende:

> **Zwei Personas, ein Werkzeug.**
> Der Neue (Monat 0–6) braucht Namen, Anrufe, Verkaufstrichter, eigene Zahlen.
> Der Aufbauer braucht Kandidaten, Fristen an Menschen, den Zustand seiner Gestarteten.
> Heute bedient das CRM ausschließlich Persona 1 — und `beginnerMode` ist bereits die
> halbe Erkenntnis, nur in die falsche Richtung ausgebaut.

---

## 1. Grundentscheidungen

| Thema | Entscheidung |
|---|---|
| Zwei Trichter | Verkauf und Aufbau laufen **getrennt**, mit eigenen Phasen, eigenem Playbook, eigener Auswertung |
| Datenmodell | Neue Zeile **`Kandidatur`** am bestehenden `Contact` — genau die Rolle, die `Deal` im Verkauf spielt. **Abweichung von struktur-plan §6**, Begründung in Abschnitt 6.1 |
| Ende des Trichters | **Nicht die Zusage, sondern Tag 90.** Ein Start, der nie aktiv wird, hat denselben Aufwand gekostet und bringt nichts |
| Wettbewerb | Punkte für **Gespräche**, nie für Köpfe. Der Punkt für einen Geworbenen fällt erst, wenn der Geworbene **selbst liefert** |
| Bestehende Gewichte | Werden **nicht angefasst**. Punkte werden bei der Anzeige gerechnet — jede Änderung schreibt Historie um (Regel vom 20.08.) |
| Höhenlage | **Kein neuer Modus-Schalter.** Wer Direkte hat oder eine offene Kandidatur, bekommt den Aufbau-Block. Position statt Rolle — wie beim Struktur-Baum |
| Abbauen | Was der Aufbau an Platz gewinnt, gibt der Verkauf ab — abgerissen wird aber **nur nach Zahl**, nicht nach Meinung (Werkstatt-Regel) |
| Reihenfolge | Vorderer Trichter zuerst, er erzeugt Einladungen. Aktivierung danach, sie braucht Gestartete |
| ⚠️ Gesprächsablauf | Angenommen: **ein Infogespräch, danach Entscheidung**, Hospitation optional. Ist dein Ablauf anders, ändern sich die Phasen in Abschnitt 2 |
| ⚠️ „Gestartet" | Angenommen: Zugang angelegt **und** App installiert — nicht das Vertragsdatum. Das ist die einzige Schwelle, die das Werkzeug selbst sehen kann |

---

## 2. Der Aufbau-Trichter

Sieben Phasen, bewusst dieselbe Mechanik wie im Verkauf: Phase + `outcome` +
`lostReason` + genau ein nächster Schritt mit Frist. Wer die Verkaufspipeline bedienen
kann, kann diese sofort.

| # | Phase | Was sie bedeutet | Nächster Schritt (Playbook) |
|---|---|---|---|
| 1 | `KONTAKT` | Steht auf der Recruiting-Namensliste | Anruf, heute |
| 2 | `ANGESPROCHEN` | Erstes Gespräch gelaufen, Interesse offen | Nachfassen, +3 Tage |
| 3 | `INFO_VEREINBART` | Infotermin steht, mit Uhrzeit | Termin vorbereiten, am Termintag |
| 4 | `INFO_GEHALTEN` | Er weiß, worum es geht | Nachfassen, +2 Tage |
| 5 | `ENTSCHEIDUNG` | Zweitgespräch, Hospitation oder Bedenkzeit läuft | Nachfassen, +3 Tage |
| 6 | `ZUSAGE` | Er will — ab hier wird eingeladen | **Einladung verschicken, heute** |
| 7 | `GESTARTET` | Konto existiert, App ist auf dem Handy | geht über in die 90-Tage-Ampel |

**Bewusst keine eigene Phase „Hospitation":** nicht jeder macht das, und eine Phase, durch
die niemand läuft, ist Ballast. Sie wird als Aktivität am Kandidaten gebucht. Wenn die
Messung nach vier Wochen zeigt, dass die Hospitation der eigentliche Knick ist, wird sie
nachgezogen — dann mit Beleg.

**Verloren** funktioniert wie im Verkauf: Phase bleibt stehen, dazu `outcome = VERLOREN`
plus Grund. Damit ist ablesbar, **wo** der Trichter leckt — bei „will gar nicht erst
reden" oder bei „war da und hat sich anders entschieden". Das sind zwei völlig
verschiedene Probleme mit zwei völlig verschiedenen Antworten.

### 2.1 Der Übergang, an dem heute alles hängen bleibt

`ZUSAGE → GESTARTET` ist die teuerste Stelle im ganzen Ablauf, weil sie aus dem Werkzeug
herausführt: Einladung erzeugen (`/einladen`), Link per WhatsApp schicken, hoffen,
nachfragen. Der Kandidat verschwindet dabei aus jeder Liste.

Künftig: Ein Knopf **„Zusage"** am Kandidaten erzeugt die `Invite` direkt — mit
vorbelegtem `greeting` aus Name und Gesprächsverlauf — und legt einen nächsten Schritt
„nachfassen, ob installiert" auf +2 Tage. Die Kandidatur bleibt sichtbar, bis der Zugang
wirklich läuft. `Invite`, `Invite.greeting` und `User.installedAt` existieren bereits; es
fehlt allein die Verbindung.

---

## 3. Die 90 Tage — der weiße Fleck

Der gesamte hintere Trichter lässt sich aus Daten bauen, die **schon vorhanden sind**.
Nichts davon muss jemand von Hand pflegen:

| Meilenstein | Quelle im Bestand |
|---|---|
| Zugang angelegt | `Invite.usedAt`, `User.createdAt` |
| App installiert | `User.installedAt` |
| Willkommen durch | `User.onboardingDoneAt`, `onboardingSteps` |
| 20 Namen stehen | `count(Contact)` je `ownerId` |
| Erster Anruf | erster `DailyLog` mit `CALL` |
| Erster Termin gehalten | erster `DailyLog` mit `APPOINTMENT_HELD` |
| Erster Abschluss | erster `DailyLog` mit `DEAL_WON` |
| Noch dabei | `DailyLog` in den letzten 7 Tagen |

Daraus wird pro Gestartetem eine Zeile mit Ampel — dasselbe Muster wie `/mannschaft`, nur
auf die ersten 90 Tage zugeschnitten:

```
┌──────────────────────────────────────────────────────────┐
│  Max Müller          Tag 12          ● gelb              │
│  ✓ installiert   ✓ 20 Namen   ✓ 34 Anrufe                │
│  ✗ noch kein gehaltener Termin                           │
│  ▸ seit 5 Tagen nichts geloggt                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Nächster Schritt: gemeinsam telefonieren · Do.   │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

Der Kasten unten ist der **nächste Schritt an einem Menschen** — genau das, was
struktur-plan §5 als `LeadershipTask` beschreibt und was dort auf Bauabschnitt 5 liegt. Er
wird hierher vorgezogen, aber **nur für Gestartete in den ersten 90 Tagen**. Der volle
Führungs-Aufgabenbereich bleibt, wo er ist.

**Warum keine automatisch erzeugten Aufgaben:** steht schon in struktur-plan §9 und gilt
weiter — automatisch erzeugtes Rauschen wird nach zwei Wochen ignoriert. Das Signal wird
angezeigt, die Aufgabe entsteht mit einem Tipp.

---

## 4. Wettbewerb — was gemessen wird, wird gemacht

Heute sind **alle** fünf Zählarten Verkauf: `CALL`, `NUMBERS_PULLED`, `APPOINTMENT_SET`,
`APPOINTMENT_HELD`, `DEAL_WON`. Ein Aufbauer kann eine perfekte Woche haben — vier
Infogespräche, zwei Zusagen — und steht in der Arena bei **null**. Das Werkzeug sagt ihm
jeden Tag, dass seine Hauptarbeit nicht zählt. Das ist der teuerste Fehler im aktuellen
Stand, und er kostet zwei Zählarten, ihn zu beheben.

| Neue Zählart | Ausgelöst durch | Gewicht | Warum so |
|---|---|---|---|
| `RECRUIT_TALK` | Phase erreicht `INFO_GEHALTEN` | **5** | Entspricht dem gehaltenen Verkaufstermin: vergleichbarer Aufwand, vergleichbarer Wert |
| `RECRUIT_ACTIVATED` | **Der Geworbene** bucht seinen ersten `APPOINTMENT_HELD` | **10** | Der Punkt fällt nicht für einen Kopf, sondern für einen Kopf, **der läuft** |

`RECRUIT_ACTIVATED` ist der wichtigste Entwurf in diesem Plan. Ein Punkt für „geworben"
belohnt warme Körper und produziert Karteileichen — nach der Hausregel *„was gemessen
wird, wird frisiert, sobald es zählt"* würde genau das passieren. Ein Punkt, der erst
fällt, wenn der Neue selbst einen Termin hält, lässt sich **von einer Person allein nicht
erzeugen**. Er belohnt exakt das, was der Aufbauer wirklich tun soll: nicht anwerben,
sondern zum Laufen bringen.

Zusätzlich, aber **ohne Punkte**, als ehrliche Zahl in Arena und `/mannschaft`:

> **Gestartet: 4 · davon nach 30 Tagen aktiv: 1**

Eine Quote ohne Punktwert kann niemand hochtreiben, und sie beantwortet die einzige Frage,
die im Aufbau zählt.

**⚠️ Eine Wertung, nicht zwei.** Bei aktuell einem Kopf würde ein zweites Ranking den
Wettbewerb halbieren. Aufbau-Punkte laufen in dieselbe Wertung, dazu ein kleiner
Aufbau-Streifen in der Arena. Getrennte Wertungen frühestens, wenn zehn Köpfe loggen.

---

## 5. Höhenlage — was Platz macht

Optimieren heißt nicht nur bauen. Wenn Aufbau nach vorn rückt, muss Verkauf Platz
abgeben — aber nach Zahl, nicht nach Gefühl. Kandidaten; jeder bekommt vorher eine
Zählstelle in `lib/features.ts`:

| Kandidat | Verdacht | Messung vor dem Abriss |
|---|---|---|
| `EMPFEHLUNG_ERFRAGT`, `CHECKUP_GEPLANT`, `BESTAND` | Bei ~500 Einheiten Eigenumsatz entsteht kaum ein Bestand, der eine Betreuungsstrecke trägt | Wie viele Kontakte haben eine dieser Phasen **je** erreicht? |
| `/vorgaenge` und `/trichter` als eigene Navigationspunkte | Zwei Auswertungsseiten für einen Trichter, den ein Neuer noch gar nicht gefüllt hat | `FeatureUse` je Seite, 3 Wochen |
| `DealLine` PAV/BU als Pflichtangabe | Kostet einen Tipp pro Abschluss, ausgewertet wird sie nirgends | Wie oft steht `UNBEKANNT`? |

Und die dritte Stufe der Persona-Frage: heute gibt es `beginnerMode` (an/aus). Künftig
ergibt sich die Höhenlage aus der **Position** — wer Direkte oder eine offene Kandidatur
hat, sieht den Aufbau-Block oben auf `/heute`, die eigene Verkaufspipeline darunter. Kein
Schalter, keine Rolle, nichts, was falsch stehen kann.

---

## 6. Datenmodell

```prisma
model Kandidatur {
  id        String  @id @default(cuid())
  contactId String                     // die Person steht weiter im Contact
  contact   Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  ownerId   String                     // der Werbende
  owner     User    @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  phase      KandidaturPhase @default(KONTAKT)
  outcome    Outcome         @default(OFFEN)
  lostReason LostReason?

  // Was im Gespraech wirklich zaehlt - und was in KEINEN Kundenexport gehoert.
  motiv     String?                    // "will raus aus dem Lager"
  situation String?                    // Beruf, Zeitfenster, Familie

  nextStepType NextStepType?
  nextStepAt   DateTime?
  nextStepNote String?

  inviteId String? @unique             // beim Zusage-Knopf erzeugt
  invite   Invite? @relation(fields: [inviteId], references: [id], onDelete: SetNull)

  becameUserId String? @unique         // die Naht zur Mannschaft
  becameUser   User?   @relation("Geworben", fields: [becameUserId], references: [id], onDelete: SetNull)

  talkLoggedAt      DateTime?          // gegen doppelte Wettbewerbspunkte
  activatedLoggedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stageEvents StageEvent[]

  @@index([ownerId, nextStepAt])
  @@index([ownerId, phase, outcome])
  @@index([contactId])
}

enum KandidaturPhase {
  KONTAKT
  ANGESPROCHEN
  INFO_VEREINBART
  INFO_GEHALTEN
  ENTSCHEIDUNG
  ZUSAGE
  GESTARTET
}
```

Dazu: `StageEvent.kandidaturId` — damit entsteht die Trichter-Auswertung von selbst, wie
im Verkauf — und zwei Werte an `QuotaType`: `RECRUIT_TALK`, `RECRUIT_ACTIVATED`.

Migration: eine neue Tabelle anlegen und Enum-Werte ergänzen ist additiv und damit
gefahrlos — handgeschrieben bzw. per `prisma migrate diff --from-empty --to-schema`, wie
im Projekt üblich.

### 6.1 Abweichung von struktur-plan §6 — bewusst

Der Struktur-Plan sieht eine **eigenständige `Recruit`-Tabelle mit eigenem Namen und
eigener Nummer** vor, mit dem Argument: Bewerberdaten sind keine Kundendaten, andere
Fristen, andere Empfänger, dürfen nicht in derselben Suche und demselben Export landen.
Das Argument ist richtig — die Umsetzung ist inzwischen überholt:

Die Namensliste ist seit dem 15.08. gebaut und führt Recruiting-Namen **bereits als
`Contact`** mit `listKinds = [RECRUITING]`. Ihr tragender Satz lautet: *dieselbe
`Contact`-Tabelle, nur eine schlanke Sicht darauf — es gibt keine zweite Wahrheit, die
auseinanderlaufen kann.* Eine separate `Recruit`-Tabelle hieße: derselbe Mensch zweimal,
zwei Wählmasken, zwei Wahrheiten bei der Telefonnummer.

Der Kompromiss trennt an der richtigen Stelle: **Name und Nummer bleiben am `Contact`**
— das ist ohnehin dieselbe Nummer, die schon in der Namensliste steht —, **alles
Bewerberspezifische liegt in `Kandidatur`**: Motiv, Situation, Verlauf, Ablehnungsgrund.
Diese Tabelle taucht in keinem Kundenexport auf, hat eine eigene Löschregel und eine
eigene Sichtbarkeit. Das Schutzziel bleibt, die doppelte Pflege entfällt.

Damit ersetzt dieser Plan `model Recruit` und `enum RecruitStage` aus struktur-plan §6.

---

## 7. Bauabschnitte

Jeder Abschnitt ist für sich auslieferbar, und für jeden gilt die Hausregel aus der Arena:
**kein Baustein ohne Schlüssel, Schalter und Zählstelle** (`lib/features.ts`).

| # | Inhalt | Ergebnis |
|---|---|---|
| **0** | `scripts/nullmessung-aufbau.mjs`, lesend: Recruiting-Namen, erzeugte Einladungen, eingelöste, Gestartete, davon aktiv | Der Ausgangspunkt steht **vor** dem ersten Commit |
| **1** | `Kandidatur` + Aufbau-Phasen im Namenslisten-Wähler; die Ergebnis-Knöpfe bekommen Recruiting-Bedeutung; **„Zusage" erzeugt die Einladung** | Der vordere Trichter läuft und endet in einer verschickten Einladung |
| **2** | Aufbau-Block auf `/heute`: Kandidaten mit Frist, Gestartete mit Ampel | Aufbau wird tägliche Arbeit statt Nebenbei |
| **3** | `RECRUIT_TALK` + `RECRUIT_ACTIVATED`, Aufbau-Streifen in der Arena, Quote „gestartet / davon aktiv" | Aufbau zählt sichtbar |
| **4** | 90-Tage-Ampel je Gestartetem + nächster Schritt an einem Menschen | Der weiße Fleck ist zu |
| **5** | Aufbau-Trichter-Auswertung: Namen → Gespräch → Zusage → Start → aktiv, mit Quoten und Verlustgründen | Es ist ablesbar, **wo** es klemmt |
| **6** | Höhenlage: Betreuungsphasen und Nebenseiten messen, dann abräumen | Der Verkauf gibt Platz ab — nach Zahl |

**Nach Abschnitt 1 ist es bereits nützlich.** Und Abschnitt 1 steht bewusst vorn: Die
Nullmessung vom 20.08. sagt **1 Kopf, 33 Einträge** — der Engpass ist nicht Code, sondern
Einladungen. Abschnitt 1 ist der einzige Teil dieses Plans, der direkt auf diesen Engpass
zielt; er führt vom Namen zur verschickten Einladung, ohne dass jemand die Seite wechselt.
Alle anderen Abschnitte brauchen Menschen, die es erst gibt, wenn Abschnitt 1 wirkt.

---

## 8. Bewusst nicht gebaut

| Was | Warum |
|---|---|
| Bewerbermanagement mit Lebenslauf, Dateien, Terminvorschlägen | Das ist ein anderes Produkt. Hier geht es um sieben Phasen und eine Frist |
| Eigene `Recruit`-Tabelle mit doppelter Namenspflege | Siehe 6.1 — zwei Wahrheiten bei einer Telefonnummer |
| Punkte für geworbene Köpfe | Belohnt Karteileichen. Der Punkt fällt, wenn der Neue liefert |
| Getrennte Aufbau-Rangliste | Bei einstelliger Kopfzahl halbiert das den Wettbewerb |
| Automatische Nachrichten an Kandidaten | WhatsApp ist da. Automatisierter Kandidatenkontakt ist die schlechteste Version von Rekrutierung |
| Karrierestufen- und Provisionslogik | Bleibt Nicht-Ziel (struktur-plan §9). Falsche Zahlen zu Geld sind teurer als kein Feature |
| Verkaufspipeline abschalten | Sie wechselt den Besitzer, sie verschwindet nicht (Abschnitt 0) |

---

## 9. Offene Punkte

Defaults sind gesetzt, damit gebaut werden kann. Ist einer falsch, sag es — jeder kostet
später mehr als jetzt.

| # | Frage | Angenommener Default |
|---|---|---|
| 1 | Wie läuft dein Recruiting-Gespräch wirklich? Ein Termin oder zwei? Infoabend? | Ein Infogespräch, danach Entscheidungsphase; Hospitation als Aktivität, nicht als Phase |
| 2 | Ab wann gilt jemand als „gestartet"? | Zugang angelegt **und** App installiert — die einzige Schwelle, die das Werkzeug selbst sieht |
| 3 | Stimmen die ~500 Einheiten, und nach wie vielen Abschlüssen ist das erreicht? | Offen. Davon hängt ab, wie hart Abschnitt 6 abräumt |
| 4 | Wer darf Kandidaturen sehen? | Nur der Werbende. Die Führungskraft sieht **Zahlen**, keine Kandidatennamen — wie bei Kunden |
| 5 | Wie lange bleiben abgelehnte Kandidaten stehen? | 12 Monate, dann anonymisieren. `Kandidatur` ist dafür die richtige Stelle |
| 6 | Zählt eine Empfehlung aus dem Kundenkreis in den Aufbau-Trichter? | Ja, über `Contact.referredById` — kein zweiter Weg |
| 7 | Fällt `RECRUIT_ACTIVATED` rückwirkend für bereits Gestartete? | Nein. Punkte rückwirkend zu vergeben schreibt Historie um (Regel vom 20.08.) |
