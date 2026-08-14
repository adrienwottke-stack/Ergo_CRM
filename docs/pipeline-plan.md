# Pipeline-Plan (Ergo CRM)

Stand: 14.08.2026 — **umgesetzt**. Abweichungen und Nacharbeiten stehen in Abschnitt 12.

Ziel: Aus dem heutigen Status-Trichter (`NEW → CONTACTED → APPOINTMENT → CLOSED → REJECTED`)
wird ein Kreislauf, der nach dem Abschluss weiterläuft: **Abschluss → Empfehlungen → Checkup → Bestand → neuer Bedarf**.
Zu jedem offenen Kontakt und jedem offenen Vorgang ist jederzeit sichtbar, **was als Nächstes zu tun ist und wann**.

---

## 1. Grundentscheidungen

| Thema | Entscheidung |
|---|---|
| Ebenen | **Zweistufig**: Kontakt (Person) durchläuft die Akquise- und Betreuungsphasen, Vorgänge (Deals) entstehen erst ab dem gehaltenen Termin |
| Termine | Getrennte Phasen *Termin vereinbart* / *Termin gehalten*, Datum **mit Uhrzeit** |
| Nächster Schritt | Playbook schlägt Typ + Frist vor, Bestätigung ist **Pflicht** beim Phasenwechsel |
| Absagen | Phase bleibt stehen, zusätzlich `outcome = VERLOREN` + Grund |
| Empfehlung / Checkup | **Am Kunden**, einmal — nicht je Vertrag |
| Wert | Interne Einheiten (BWS). Basis: **100 € Monatsbeitrag = 82 Einheiten**. Laufzeitfaktoren später |
| Punkte (Wettbewerb) | Neu: *Termin gehalten* (1 Punkt), *Abschluss* (**5 Punkte**). Empfehlungen geben keine Punkte |
| Sichtbarkeit | Jeder sieht seine Kontakte, `ADMIN` zusätzlich eine Team-Auswertung |
| Migration | Bestandskontakte werden automatisch abgebildet |
| Sparten | Nur zwei: **PAV** (Private Altersvorsorge) und **BU/Grundfähigkeit** |
| Checkup-Intervall | **6 Monate** |
| Endgerät | **Mobil-first.** Handy: Heute-Liste + Listenansicht. Board erst ab Tablet |

---

## 2. Phasenmodell

### 2.1 Kontakt-Phasen (`ContactStage`)

Der Kontakt ist die Person. Seine Phase beschreibt die **Beziehung**, nicht den Vertrag.

| # | Phase | Bedeutung | Standard-Folgeschritt |
|---|---|---|---|
| 1 | `NEU` | Nummer gezogen, noch kein Kontakt | Erstanruf, heute |
| 2 | `KONTAKTIERT` | Erreicht, kein Termin | Wiedervorlage-Anruf, +3 Tage |
| 3 | `TERMIN_VEREINBART` | Termindatum steht | Termin durchführen, am Termindatum |
| 4 | `IN_BERATUNG` | Termin gehalten, Bedarf erkannt, ≥1 Vorgang offen | Vorgang bearbeiten (Schritt liegt am Vorgang) |
| 5 | `KUNDE` | ≥1 Vorgang gewonnen | **Empfehlungen erfragen, +3 Tage** |
| 6 | `EMPFEHLUNG_ERFRAGT` | Abgehakt — mit oder ohne Ergebnis | Checkup terminieren, +7 Tage |
| 7 | `CHECKUP_GEPLANT` | Checkup-Termin steht (Datum + Uhrzeit) | Checkup durchführen, am Termindatum |
| 8 | `BESTAND` | Betreut, ruhend | Nächster Checkup, **+6 Monate** |

**Der Kreislauf:** Aus `BESTAND` wird bei Fälligkeit wieder `CHECKUP_GEPLANT`. Ergibt der Checkup neuen
Bedarf, legt man einen neuen Vorgang an und der Kontakt geht zurück auf `IN_BERATUNG` — und kann
erneut `KUNDE` werden. Die Empfehlungsfrage wird beim Checkup optional erneut angeboten, ist aber
kein Pflicht-Durchlauf mehr.

### 2.2 Ausgang (`ContactOutcome`), orthogonal zur Phase

`OFFEN` | `GEWONNEN` | `VERLOREN`

Bei `VERLOREN` bleibt die Phase stehen, in der es gescheitert ist. Dadurch ist auswertbar:
*"60 % meiner Absagen passieren zwischen Termin vereinbart und Termin gehalten."*

**Verlustgründe** (`LostReason`): `KEIN_BEDARF`, `KEIN_INTERESSE`, `UNERREICHBAR`, `KONKURRENZ`,
`PREIS`, `TERMIN_GEPLATZT`, `SPAETER_NOCHMAL`, `SONSTIGES`.

`SPAETER_NOCHMAL` setzt zusätzlich einen nächsten Schritt in der Zukunft (Default +6 Monate) — der
Kontakt taucht dann automatisch wieder in der Heute-Liste auf, bleibt aber aus dem Kanban raus.

### 2.3 Vorgangs-Phasen (`DealStage`)

Ein Vorgang = ein Produkt / eine Sparte. Entsteht in Phase 4 (`IN_BERATUNG`).

| # | Phase | Standard-Folgeschritt |
|---|---|---|
| 1 | `BEDARF` | Angebot erstellen, +2 Tage |
| 2 | `ANGEBOT` | Nachfassen, +3 Tage |
| 3 | `ANTRAG` (unterschrieben, beim Versicherer) | Policierung prüfen, +14 Tage |
| 4 | `GEWONNEN` | — löst am Kontakt `KUNDE` + Empfehlungsschritt aus |
| — | `VERLOREN` | mit Grund, optional Empfehlungsschritt |

Ein Vorgang trägt: Sparte, Monatsbeitrag, Einheiten, Abschlussdatum, nächster Schritt.

**Sparten** (`DealLine`) — bewusst nur zwei, keine Freitextliste:

| Wert | Bezeichnung |
|---|---|
| `PAV` | Private Altersvorsorge |
| `BU` | Berufsunfähigkeit / Grundfähigkeit |

---

## 3. Der „nächste Schritt" (Herzstück)

Kontakt **und** Vorgang tragen jeweils höchstens **einen** offenen nächsten Schritt:

- `nextStepType` (`NextStepType`): `ANRUF`, `TERMIN`, `TERMIN_VORBEREITEN`, `ANGEBOT_ERSTELLEN`,
  `NACHFASSEN`, `ANTRAG_EINREICHEN`, `EMPFEHLUNG_ERFRAGEN`, `CHECKUP_TERMINIEREN`, `SONSTIGES`
- `nextStepAt` (DateTime, mit Uhrzeit)
- `nextStepNote` (Freitext, optional)

**Regeln:**
1. Jeder Phasenwechsel öffnet einen kleinen Dialog mit vorbelegtem Typ und Frist aus der Playbook-Tabelle
   oben. Bestätigen oder ändern — leer lassen geht nicht, solange der Ausgang `OFFEN` ist.
2. Ein Schritt wird **abgehakt**, nicht gelöscht: erledigen erzeugt automatisch eine `Activity`
   (Historie bleibt) und fragt direkt nach dem darauffolgenden Schritt.
3. Kontakte in `IN_BERATUNG` führen ihren Schritt am Vorgang, nicht am Kontakt — sonst doppelte Fristen.
4. Kontakte ohne nächsten Schritt (z. B. nach Migration) landen auf einer Warnliste im Dashboard.

**Ableitung: die Heute-Liste.** Alle fälligen Schritte aus Kontakten + Vorgängen, sortiert nach
Fälligkeit, gruppiert in *überfällig / heute / diese Woche*. Das ist die eigentliche Arbeitsansicht —
das Kanban ist nur die Übersicht.

---

## 4. Empfehlungen

- **Erfassung:** Button am Kunden → Formular für mehrere Namen + Telefon auf einmal.
  Jeder Name wird ein neuer Kontakt in `NEU`, `source = "Empfehlung"`, `referredById = <Kunde>`,
  nächster Schritt „Erstanruf, heute".
- **Baum:** Am Kontakt sichtbar „empfohlen von X" und „hat empfohlen: A, B, C" (inkl. Abschlussquote
  der Empfohlenen) — zeigt die stärksten Multiplikatoren.
- **Pflicht nach Abschluss:** Beim ersten `GEWONNEN` setzt das System automatisch den Schritt
  *Empfehlungen erfragen* (+3 Tage). Abhaken auch mit „keine erhalten" möglich — dann wandert der
  Kontakt trotzdem auf `EMPFEHLUNG_ERFRAGT` weiter.
- **Auch bei Verlust:** Wird ein Kontakt auf `VERLOREN` gesetzt, wird ein optionaler Empfehlungsschritt
  angeboten (vorausgewählt bei Grund `KEIN_BEDARF`).

---

## 5. Wert in Einheiten

- `monthlyPremium` (Monatsbeitrag in €) und `units` (Einheiten) am Vorgang.
- Umrechnung Version 1: `units = round(monthlyPremium * 0,82)` — also 100 € → 82 Einheiten.
- Feld `unitFactor` (Default `1.0`) wird schon jetzt mitgeführt und in die Formel eingebaut
  (`units = round(monthlyPremium * 0,82 * unitFactor)`), damit Laufzeit-/Spartenfaktoren später
  ohne Datenmigration ergänzt werden können.
- `units` bleibt immer manuell überschreibbar; überschriebene Werte werden nicht neu berechnet.
- Auswertung: Einheiten offen je Phase, Einheiten gewonnen je Monat.

---

## 6. Datenmodell (Prisma, Delta zum Ist)

```
model Contact {
  // bestehend: id, name, phone, email, source, note, ownerId, createdAt, updatedAt
  stage           ContactStage   @default(NEU)
  outcome         ContactOutcome @default(OFFEN)
  lostReason      LostReason?
  lostAt          DateTime?

  nextStepType    NextStepType?
  nextStepAt      DateTime?
  nextStepNote    String?

  appointmentAt   DateTime?      // nächster Termin, mit Uhrzeit
  checkupDueAt    DateTime?      // fällig ab (Bestandskunden)

  referredById    String?
  referredBy      Contact?  @relation("Empfehlung", fields: [referredById], references: [id], onDelete: SetNull)
  referrals       Contact[] @relation("Empfehlung")

  deals           Deal[]
  stageEvents     StageEvent[]

  @@index([ownerId, nextStepAt])
  @@index([ownerId, stage, outcome])
}

model Deal {
  id             String     @id @default(cuid())
  contactId      String
  contact        Contact    @relation(fields: [contactId], references: [id], onDelete: Cascade)
  line           String                 // Sparte
  title          String?
  stage          DealStage  @default(BEDARF)
  outcome        ContactOutcome @default(OFFEN)
  lostReason     LostReason?
  monthlyPremium Decimal?   @db.Decimal(10,2)
  unitFactor     Decimal    @default(1.0) @db.Decimal(5,3)
  units          Int?
  closedAt       DateTime?
  nextStepType   NextStepType?
  nextStepAt     DateTime?
  nextStepNote   String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  stageEvents    StageEvent[]

  @@index([contactId])
}

model StageEvent {           // Historie für Conversion & Durchlaufzeiten
  id         String   @id @default(cuid())
  contactId  String?
  dealId     String?
  fromStage  String?
  toStage    String
  at         DateTime @default(now())
  userId     String?
}
```

Zusätzlich: `enum QuotaType` um `APPOINTMENT_HELD` und `DEAL_WON` erweitern,
`ContactStatus` entfällt (ersetzt durch `ContactStage` + `ContactOutcome`).

---

## 7. Oberfläche

**Leitsatz: mobil-first.** Auf dem Handy ist die Heute-Liste die Startseite, nicht das Board.

1. **Heute (`/heute`)** — die Arbeitsliste: überfällig / heute / diese Woche, je Zeile 1-Klick
   „erledigt + nächster Schritt". Auf dem Handy die Standardansicht nach dem Login.
2. **Kanban (`/pipeline`)** — Spalten = Kontakt-Phasen, Filter-Chips *Akquise (1–4) / Betreuung (5–8) / Alle*,
   Default *Akquise*. Verlorene und Bestandskunden sind ausgeblendet, per Chip einblendbar.
   Karte zeigt: Name, nächster Schritt + Fälligkeit (rot wenn überfällig), Termin, Einheiten offen.
   - **Ab Tablet (`md`)**: Spalten nebeneinander, Drag & Drop, Playbook-Dialog beim Drop.
   - **Handy**: dieselben Phasen als aufklappbare Listen untereinander, Phasenwechsel über ein
     Bottom-Sheet („Phase ändern" → Auswahl → Playbook-Dialog). Kein Drag & Drop.
3. **Kontakt-Detail** — Kopf mit Phase, Ausgang, nächstem Schritt; darunter Vorgänge (Mini-Kanban),
   Empfehlungsbaum, Aktivitätshistorie.
4. **Vorgangs-Board (`/vorgaenge`)** — Spalten = Deal-Phasen, Summe Einheiten je Spalte im Kopf.
   Mobil ebenfalls als Listen.
5. **Auswertung (`/trichter`)** — Übergangsquoten zwischen den Phasen aus `StageEvent`,
   Durchlaufzeiten, Verlustgründe, No-Show-Quote. Für `ADMIN` zusätzlich je Person.

### 7.1 Mobil-Regeln (gelten für alles Neue)

- Alle Tap-Ziele mindestens **44 × 44 px** (heute sind die Quick-Actions ~24 px hoch).
- Keine Schrift unter **12 px** in bedienbaren Elementen.
- Keine feste `min-width` ohne Breakpoint; wenn seitliches Scrollen nötig ist, gehört
  `overflow-x-auto` auf den **Wrapper**, nicht auf dasselbe Element.
- Listen statt Tabellen: unter `sm` werden Datentabellen als Karten gerendert.
- Primäraktion („erledigt + weiter") am Daumen erreichbar, also unten.

---

## 8. Migration der Bestandsdaten

| alt (`ContactStatus`) | neu (`stage` / `outcome`) |
|---|---|
| `NEW` | `NEU` / `OFFEN` |
| `CONTACTED` | `KONTAKTIERT` / `OFFEN` |
| `APPOINTMENT` | `TERMIN_VEREINBART` / `OFFEN`, `appointmentAt` = `appointmentLoggedAt` |
| `CLOSED` | `KUNDE` / `GEWONNEN` + Platzhalter-Vorgang (`line = "unbekannt"`, `GEWONNEN`, ohne Beitrag) |
| `REJECTED` | Phase bleibt `KONTAKTIERT` / `VERLOREN`, `lostReason = SONSTIGES` |

`nextFollowUp` → `nextStepAt`, `nextStepType = ANRUF`. Kontakte ohne Wert bekommen keinen
Schritt und erscheinen in der Warnliste „ohne nächsten Schritt".

---

## 9. Bauabschnitte

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 0 | **Mobil-Schulden abtragen** (siehe Abschnitt 11) | Basis trägt die neuen Ansichten |
| 1 | Schema + Migration + Labels/Playbook-Konstanten | Datenbasis steht, alte Daten abgebildet |
| 2 | Server-Actions: Phasenwechsel mit Playbook, Schritt erledigen, Verlust mit Grund | Logik nutzbar |
| 3 | Kanban auf neue Phasen umbauen, Drop-Dialog | Übersicht funktioniert |
| 4 | Heute-Liste | Tägliches Arbeiten funktioniert |
| 5 | Vorgänge: Modell-UI, Anlage aus Termin, Einheiten-Rechner | Mehrfach-Sparten abbildbar |
| 6 | Empfehlungen: Mehrfach-Erfassung, Baum, Pflichtschritt | Kreislauf schließt sich |
| 7 | Checkup-Automatik (+12 Monate, Fälligkeit ins Kanban) | Bestand wird bewirtschaftet |
| 8 | Punkte `APPOINTMENT_HELD` / `DEAL_WON`, Leaderboard | Wettbewerb erweitert |
| 9 | Trichter-Auswertung + Admin-Sicht | Steuerung möglich |

---

## 10. Offene Punkte

1. **Antragsphase** — bleibt `ANTRAG` (unterschrieben, noch nicht policiert) als eigener Schritt
   erhalten, oder ist Abschluss = direkt `GEWONNEN`? Vorerst drin gelassen.
2. **Umrechnung Einheiten bei PAV vs. BU** — gilt der Faktor 0,82 für beide Sparten gleich?

---

## 11. Ist-Zustand Mobil (Prüfung 13.08.2026)

Grundlage geprüft im Code, nicht im laufenden Browser (Login nötig).

**Trägt bereits:**
- Viewport-Meta über Next-Default, kein Override in `app/layout.tsx`
- Eigene Mobil-Navigationsleiste (`app/(app)/layout.tsx:35`, `sm:hidden`)
- Formulare, Dashboard-Kacheln und Detailseiten brechen über `sm:`-Breakpoints sauber um

**Muss vor der Pipeline repariert werden (Bauabschnitt 0):**

| # | Fundstelle | Problem |
|---|---|---|
| 1 | `components/KanbanBoard.tsx:58` | `min-w-[900px]` ohne Breakpoint → bei 375 px scrollt die **gesamte Seite** seitlich; `overflow-x-auto` sitzt auf demselben Element und greift deshalb nicht |
| 2 | `components/KanbanBoard.tsx:38–55` | Drag & Drop über HTML5-Events (`dataTransfer`) — feuert auf Touch-Geräten **gar nicht**. Board am Handy unbedienbar |
| 3 | `KanbanBoard.tsx:121–156` | Quick-Action-Buttons ≈ 24 px hoch (`px-2 py-1 text-[11px]`), Ziel sind 44 px |
| 4 | `contacts/page.tsx:127`, `team/page.tsx:57`, `report/page.tsx:236,360`, `leaderboard/page.tsx:235` | Tabellen mit `min-w-[560–640px]`: technisch korrekt gekapselt, aber Status und Wiedervorlage liegen am Handy außerhalb des Sichtfelds → Kartenansicht unter `sm` |
| 5 | quer durch die App | `text-[10px]` / `text-[11px]` in bedienbaren Elementen |

---

## 12. Umsetzungsstand (14.08.2026)

Alle Bauabschnitte 0–9 sind umgesetzt. `npx tsc --noEmit`, `npx eslint .` und
`npx next build` laufen sauber durch.

**Bewusste Abweichungen vom Plan:**

| Thema | Plan | Umgesetzt | Warum |
|---|---|---|---|
| Sparte bei Altdaten | nur PAV/BU | zusätzlicher Wert `UNBEKANNT` | Die Platzhalter-Vorgänge aus der Migration brauchen eine Sparte. Im Anlegen-Formular sind nur PAV und BU wählbar |
| Geldbetrag | `Decimal` | `monthlyPremiumCents` als Integer | Prisma-`Decimal` ist zwischen Server- und Client-Komponenten nicht serialisierbar; Cent-Integer rechnet exakt |
| Laufzeitfaktor | `unitFactor` (Dezimal) | `unitFactorPermille` (1000 = 1,0) | Gleiche Erweiterbarkeit ohne Dezimaltyp |
| Punkte für Abschluss | `count = 5` | `count = 1`, Gewicht 5 in der Rangliste | Sonst stünde in der Spalte „Abschlüsse" eine 5 statt einer 1 |
| Termin gehalten | jedes Mal | einmal je Kontakt | Verhindert Punkte-Farming durch Hin- und Herschieben zwischen Phasen |
| Zeitzone | – | eigene Umrechnung Berlin ⇄ UTC in `lib/dates.ts` | Auf Vercel läuft der Server in UTC; `datetime-local` hätte sonst 1–2 Stunden Versatz |

**Neue Routen:** `/heute` (Startseite), `/pipeline`, `/vorgaenge`, `/trichter`.
Die alte Kanban-Ansicht unter `/contacts?view=kanban` ist entfallen.

**Was noch aussteht:**

1. **Migration anwenden.** `prisma/migrations/20260813000000_pipeline/` ist geschrieben,
   aber noch nicht auf die Datenbank gespielt. Das passiert beim nächsten Deploy
   automatisch (`npm run build` führt `prisma migrate deploy` aus) — vorher lohnt ein
   Backup, weil die Migration `Contact.status` und `Contact.nextFollowUp` entfernt.
2. **Kein Live-Test.** Die Anwendung wurde nicht im Browser durchgeklickt: dafür müsste
   die Migration eingespielt und ein Login verwendet werden.
3. Antragsphase (Abschnitt 10, Punkt 1) ist weiterhin offen.
