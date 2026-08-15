# Struktur-Plan (Ergo CRM)

Stand: 15.08.2026 — Planungsdokument, noch nicht implementiert.

Ziel: Aus dem Einzelplatz-CRM wird ein Werkzeug für **Führung im Strukturvertrieb**.
Eine Führungskraft soll morgens in einem Blick sehen, **wo sie gebraucht wird**, und dafür
dieselbe Mechanik benutzen, die im CRM schon für Kunden funktioniert: einen nächsten
Schritt mit Frist — nur eben für Menschen statt für Verträge.

Der Leitsatz dabei: **Das Werkzeug muss zuerst dem Berater nutzen und nebenbei Führung
ermöglichen, nicht umgekehrt.** Ein System, das sich wie Überwachung anfühlt, wird nicht
sabotiert — es wird frisiert. Dann stehen schöne Zahlen drin, die nichts wert sind.

---

## 1. Grundentscheidungen

| Thema | Entscheidung |
|---|---|
| Struktur | **Ein Baum** (wer führt wen), als Selbstreferenz am `User`. Werbung wird als reines Infofeld mitgeführt |
| Baum-Technik | **Materialisierter Pfad** (`path`), kein rekursives CTE — Prisma kann keins |
| Führungskraft | **Keine Rolle, sondern eine Position.** Wer Direkte unter sich hat, ist Führungskraft — und bleibt gleichzeitig Berater mit eigenen Kunden |
| Sichtbarkeit | **Stufe 2: Zahlen + Pipeline, keine Kundennamen.** Namen nur über befristete Einzelfreigabe je Kontakt |
| Tiefe | Zahlen über die **ganze Struktur**, Details nur **eine Ebene tief** |
| Zugänge | **Einladungslink mit Code**, Selbstregistrierung unterhalb der einladenden Führungskraft |
| Reichweite | Erst **du + 2–3 Testleute**. Eine Instanz, ein Baum. Mehrmandanten-Fähigkeit ist ausdrücklich kein Ziel dieser Ausbaustufe |
| Kalender | **Das CRM ist die einzige Wahrheit.** TimeTree lässt sich nicht anbinden (kein ICS-Abo, kein Export) — das CRM schreibt, TimeTree liest. Preis: private Blocker gehören mit rein |
| Provision | **Wird nicht gebaut.** Falsche Zahlen zu Geld sind teurer als kein Feature |

---

## 2. Der Struktur-Baum

### 2.1 Modell

```prisma
model User {
  // bestehend: id, email, name, passwordSalt, passwordHash, role, createdAt

  leaderId      String?
  leader        User?   @relation("Struktur", fields: [leaderId], references: [id], onDelete: SetNull)
  team          User[]  @relation("Struktur")

  // Materialisierter Pfad, führende und schließende Schrägstriche inklusive:
  // "/clx1/clx7/clx9/". "Alle unter mir" = path startsWith "<mein pfad>".
  path          String  @default("/")

  recruitedById String? // wer hat geworben — Information, keine Logik
  startedAt     DateTime? // Eintritt, Grundlage für "neu" und die 90-Tage-Sicht
  careerLevel   String?
  visibility    TeamVisibility @default(PIPELINE)
  deactivatedAt DateTime?

  @@index([leaderId])
  @@index([path])
}

enum TeamVisibility {
  ZAHLEN   // nur Aktivitäten, Quoten, Summen
  PIPELINE // zusätzlich Phasenverteilung, Fristen, Überfälligkeiten — nie Namen
}
```

`UserRole` bleibt unverändert (`ADMIN` | `MEMBER`). Ob jemand führt, ergibt sich aus dem
Baum — kein zweites Flag, das falsch stehen kann.

### 2.2 Der Pfad ist die einzige Stelle mit Fallstrick

Der Pfad wird **nie direkt gesetzt**, sondern ausschließlich über zwei Server-Actions:
`beraterAnlegen` und `beraterUmhaengen`. Beim Umhängen müssen die Pfade des gesamten
Astes neu geschrieben werden — in einer Transaktion, ein `UPDATE` mit `replace()` auf dem
Präfix. Bei euren Größenordnungen ist das eine Anweisung, kein Problem.

Was der Pfad kauft: „alle unter mir" ist ein `startsWith` mit Index statt einer rekursiven
Abfrage, die Prisma nicht kann und die per `$queryRaw` an der Typprüfung vorbeiläuft.

---

## 3. Zugänge und Sichtbarkeit

### 3.1 Eine Funktion, nicht vierzig Prüfungen

Heute steht die Zugriffsgrenze als `ownerId`-Filter in jeder einzelnen Abfrage. Sobald es
mehr als eine Grenze gibt, leckt genau dort etwas. Deshalb **eine** zentrale Stelle:

```ts
// lib/scope.ts
type Umfang = "EIGENE" | "DIREKTE" | "STRUKTUR";

async function sichtbareBerater(betrachterId: string, umfang: Umfang): Promise<string[]>
```

Jede Ansicht sagt, welchen Umfang sie will. Kein Aufruf darf `ownerId` mehr selbst bauen.
Bauabschnitt 0 ist deshalb ein Audit: **jede** bestehende Abfrage auf diese Funktion
umstellen, auch die, die vorerst nur `EIGENE` zurückgibt.

Zwei Details, die dabei auffallen werden:

- `Contact.ownerId` ist **nullable**. Kontakte ohne Eigentümer (Altdaten, gelöschte Konten)
  dürfen in keiner Struktur-Abfrage auftauchen — explizit ausschließen, nicht dem Zufall
  überlassen.
- Deaktivierte Konten (`deactivatedAt`) bleiben im Baum, damit die Historie stimmt, zählen
  aber in keiner laufenden Auswertung mit.

### 3.2 Die Stufen

| Stufe | Führungskraft sieht | Status |
|---|---|---|
| **1 · `ZAHLEN`** | Anrufe, Termine, gehaltene Termine, Abschlüsse, Einheiten, Quoten | Minimum, nicht abschaltbar |
| **2 · `PIPELINE`** | zusätzlich: wie viele in welcher Phase, was überfällig ist, wie lange etwas liegt — **ohne jeden Namen** | **Voreinstellung** |
| **3 · Namen** | einzelne Kontakte, per Freigabe | über `ContactShare`, siehe 3.3 |
| **4 · Vertretung** | Vollzugriff auf ein Konto | **nicht in dieser Ausbaustufe** |

Stufe 2 trägt die Führung. „Du hast 14 Kontakte in *Termin vereinbart*, davon 9 überfällig"
ist eine vollständige Coaching-Grundlage — dafür braucht niemand einen Kundennamen.

Der Berater darf auf Stufe 1 heruntergehen. Stufe 1 ist das Minimum und nicht abwählbar,
sonst wäre die Mannschafts-Übersicht löchrig und damit wertlos.

### 3.3 Freigabe statt Pauschale

Für Doppelbesuch und Fallberatung braucht es doch einen Namen. Dafür ein Knopf am Kontakt —
*„Zum Coaching freigeben"* — statt einer pauschalen Berechtigung:

```prisma
model ContactShare {
  id             String   @id @default(cuid())
  contactId      String
  contact        Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
  sharedWithId   String
  sharedWith     User     @relation(fields: [sharedWithId], references: [id], onDelete: Cascade)
  reason         String?
  expiresAt      DateTime
  createdAt      DateTime @default(now())

  @@unique([contactId, sharedWithId])
  @@index([sharedWithId, expiresAt])
}
```

Voreinstellung 14 Tage, danach fällt der Zugriff von selbst weg. Der Berater bleibt Herr
seiner Daten, die Führungskraft bekommt genau das, was sie für den Termin braucht, und es
steht nachvollziehbar da, wer wann was gesehen hat.

**Warum nicht einfach Stufe 3 als Standard:** Jeder Vermittler ist für seine Kundendaten
selbst verantwortlich; Downline-Kundendaten pauschal nach oben zu geben ist eine
Übermittlung an Dritte und braucht eine Rechtsgrundlage. Ob dein Netzwerk oder die ERGO
dazu eigene Vorgaben haben, kann ich nicht klären — das musst du dort abfragen.

### 3.4 Einladungslinks

```prisma
model Invite {
  id        String   @id @default(cuid())
  code      String   @unique  // kurz, sprechbar, nicht erratbar
  leaderId  String              // unter wem hängt der Neue
  leader    User     @relation(fields: [leaderId], references: [id], onDelete: Cascade)
  note      String?             // "Max aus dem Infoabend"
  expiresAt DateTime
  usedById  String?  @unique
  usedAt    DateTime?
  createdAt DateTime @default(now())
}
```

Ablauf: Führungskraft erzeugt den Link → Neuer öffnet ihn, setzt Name, E-Mail und Passwort
selbst → Konto entsteht mit `leaderId` und korrektem `path`, dazu automatisch die
Wettbewerbs-`Person`. Ein Code, eine Nutzung, Ablauf nach 14 Tagen.

Das ersetzt für Neuzugänge die heutige Admin-Seite `/team` — die bleibt als Verwaltung
(Rollen, Umhängen, Deaktivieren) bestehen.

### 3.5 Berichts-Link nach oben

Dein heutiger `REPORT_PASSWORD`-Zugang ist im Kern schon richtig: Zahlen für Vorgesetzte,
keine Kundendaten, kein Konto nötig. Was fehlt, ist der Bezug auf einen Ast:

```prisma
model ReportLink {
  id          String   @id @default(cuid())
  token       String   @unique
  scopeUserId String   // Wurzel des sichtbaren Astes
  createdById String
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}
```

„Meine Mannschaftszahlen, 30 Tage gültig, keine Kundendaten." Dein Chef klickt, sieht,
fertig. Das globale `REPORT_PASSWORD` läuft parallel weiter, bis alle Empfänger einen Link
haben — dann fällt es raus.

---

## 4. Mannschafts-Übersicht und Frühwarnung

### 4.1 Die Übersicht

Eine Zeile je Berater — die Antwort auf die einzige Frage, die eine Führungskraft morgens
hat: *wo muss ich hin?*

| Spalte | Quelle |
|---|---|
| Name, Ebene, dabei seit | `User` |
| Aktivität diese Woche (Anrufe / Termine / gehalten) | `DailyLog` |
| Offene Einheiten | `Deal` über `sichtbareBerater` |
| Abschlüsse Monat | `Deal.wonLoggedAt` |
| Letzte Aktivität | `Activity.date` |
| **Ampel** | aus den Signalen unten |

Klick auf eine Zeile → Detailsicht mit Trichter und Quoten dieses Beraters, im Rahmen
seiner Sichtbarkeitsstufe. Bei Stufe 2 zusätzlich die Phasenverteilung und die überfälligen
Schritte — als **Zahlen**, nie als Kontaktliste.

### 4.2 Die Signale

Alle aus vorhandenen Daten ableitbar, keine neue Erfassung:

| Signal | Bedingung (Vorschlag) | Was es bedeutet |
|---|---|---|
| **Stille** | keine `Activity` seit 5 Werktagen | **Alarm Nr. 1.** Stille geht der Kündigung voraus, nicht schlechte Zahlen |
| Termine ohne Durchführung | `APPOINTMENT_SET` ≫ `APPOINTMENT_HELD` über 14 Tage | No-Show-Problem oder Vermeidung |
| Termine ohne Abschluss | ≥ 6 gehaltene Termine, 0 `DEAL_WON` im Monat | Abschlussschwäche → Begleitung |
| Leere Pipeline | < 5 Kontakte in `NEU`/`KONTAKTIERT` | Neukundenproblem → gemeinsam telefonieren |
| Systembruch | > 10 überfällige nächste Schritte | Kein Verkaufs-, sondern ein Disziplinproblem |
| Onboarding kippt | `startedAt` < 8 Wochen, 0 Abschlüsse | Der teuerste Moment im Strukturvertrieb |
| Keine Empfehlungen | Kunden ohne `EMPFEHLUNG_ERFRAGT` seit 30 Tagen | Der billigste ungenutzte Hebel |

**Signale werden berechnet, nicht gespeichert.** Gespeichert wird erst, was du daraus
machst: ein Knopf *„Aufgabe daraus machen"* erzeugt eine Führungs-Aufgabe. Sonst hättest du
nach zwei Wochen 200 automatisch erzeugte Aufgaben und schaust nie wieder hin.

Die Schwellwerte gehören als Konstanten an eine Stelle, damit sie nach dem ersten echten
Monat justierbar sind, ohne im Code zu suchen.

---

## 5. Führung als nächster Schritt

Das CRM kennt „nächster Schritt" für Kunden. Menschen brauchen exakt dasselbe.

```prisma
model LeadershipTask {
  id        String   @id @default(cuid())
  leaderId  String
  leader    User     @relation("Fuehrt", fields: [leaderId], references: [id], onDelete: Cascade)
  memberId  String
  member    User     @relation("Betrifft", fields: [memberId], references: [id], onDelete: Cascade)
  type      LeadershipTaskType
  dueAt     DateTime
  note      String?
  signal    String?   // aus welchem Frühwarn-Signal entstanden
  doneAt    DateTime?
  createdAt DateTime @default(now())

  @@index([leaderId, dueAt])
  @@index([memberId])
}

enum LeadershipTaskType {
  EINS_ZU_EINS
  BEGLEITUNG
  ANRUF
  SCHULUNG
  VEREINBARUNG_NACHFASSEN
  ONBOARDING_CHECK
  SONSTIGES
}
```

**Der entscheidende Punkt: dieselbe Heute-Liste.** Führungs-Aufgaben erscheinen auf
`/heute` zwischen den Kundenschritten, nur anders markiert. Eine Führungskraft hat **eine**
Liste, nicht zwei. Genau das macht aus einem Berichts-Werkzeug ein Führungs-Werkzeug.

### 5.1 Das 1:1-Journal

```prisma
model CoachingEntry {
  id        String   @id @default(cuid())
  leaderId  String
  memberId  String
  at        DateTime
  snapshot  Json     // Kennzahlen zum Zeitpunkt des Gesprächs, eingefroren
  topic     String?
  note      String?
  createdAt DateTime @default(now())

  @@index([memberId, at])
}
```

Beim Öffnen erzeugt das System die Gesprächsgrundlage automatisch: Zahlen seit dem letzten
Mal, was war vereinbart, wurde es erreicht. Vereinbarungen im Gespräch werden zu
`LeadershipTask` mit Frist — sichtbar bei beiden.

Der `snapshot` ist bewusst eingefroren. Sonst steht in einem halben Jahr in der Historie
der heutige Stand, und das Gespräch von damals ergibt keinen Sinn mehr.

Das löst das größte Führungsproblem überhaupt: **Führung ohne Gedächtnis.**

---

## 6. Rekrutierungs-Pipeline

Die zweite Pipeline im Strukturvertrieb, mechanisch fast identisch zur Kundenpipeline —
nur mit anderen Phasen und anderem Playbook.

```prisma
model Recruit {
  id           String  @id @default(cuid())
  name         String
  phone        String?
  email        String?
  source       String?
  note         String?
  ownerId      String                 // die werbende Führungskraft
  stage        RecruitStage @default(KONTAKT)
  outcome      Outcome      @default(OFFEN)
  lostReason   LostReason?

  nextStepType NextStepType?
  nextStepAt   DateTime?
  nextStepNote String?

  becameUserId String? @unique        // wird beim Start zum Konto

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([ownerId, nextStepAt])
  @@index([ownerId, stage, outcome])
}

enum RecruitStage {
  KONTAKT
  INFOGESPRAECH
  ZWEITGESPRAECH
  HOSPITATION
  VERTRAG
  START
  ERSTER_ABSCHLUSS
}
```

**Warum eine eigene Entität statt `Contact` mit einem Typ-Feld:** Bewerberdaten sind keine
Kundendaten. Sie haben andere Aufbewahrungsfristen, andere Empfänger und dürfen nicht in
derselben Suche, demselben Export und derselben Freigabe-Logik landen. Die Trennung im
Modell kostet einmal Schreibarbeit und erspart dauerhaftes Aufpassen.

Wiederverwendet werden: `NextStepType`, `Outcome`, `LostReason` und — über ein zusätzliches
`recruitId` an `StageEvent` — die komplette Trichter-Auswertung. Der Rekrutierungs-Trichter
entsteht dadurch fast von selbst.

Beim Übergang `VERTRAG → START` bietet das System an, aus dem Bewerber einen Zugang zu
machen: erzeugt den Einladungslink (Abschnitt 3.4) und setzt `becameUserId`. Damit ist der
Baum an der richtigen Stelle verbunden und `recruitedById` gesetzt.

---

## 7. Kalender

Wichtigster Grundsatz bleibt: **kein zweiter Datenspeicher.** Der Kalender ist eine Ansicht
auf `Contact.appointmentAt`, `nextStepAt` (Kontakt und Vorgang), `checkupDueAt` und
`LeadershipTask.dueAt`.

### 7.1 Ausgangslage: TimeTree

Das entscheidet mehr, als es zunächst aussieht. Die TimeTree-Hilfe ist an dem Punkt
eindeutig:

| Was | Geht das? |
|---|---|
| Externe Termine **anzeigen** (Home-Kalender) | Ja, aktualisiert sich automatisch — aber **nur für dich sichtbar** |
| Externe Termine in einen **geteilten** Kalender | Nur **von Hand kopiert**, Termin für Termin, ohne Auto-Update |
| Termine **aus** TimeTree herausholen | **Nein** — Export gibt es nicht |
| Externe Kalender in der Web-Version | Nein, nur in der App |

TimeTree kann außerdem **keine ICS-Adresse direkt abonnieren.** Es zeigt nur an, was im
Kalender des Handys steht — iOS- bzw. Android-Kalender und alles, was dort bereits
synchronisiert ist.

Daraus folgen drei Dinge:

**1. Die Kalenderansicht im CRM ist die Arbeitsfläche, nicht TimeTree.**
Es gibt keinen automatischen Weg, Termine der Mannschaft nach TimeTree zu bringen. Damit
ist die Ansicht im CRM kein Komfort, den man später nachrüstet, sondern die einzige Stelle,
an der Termine zusammenlaufen können. Sie rückt in der Reihenfolge nach vorn.

**2. Der ICS-Feed bleibt sinnvoll — als Umweg und nur privat.**
Die Kette lautet: CRM-Feed → Handy-Kalender abonnieren (iOS: Abo-Kalender, Android: Google
Kalender „Über URL hinzufügen") → TimeTree zeigt ihn im Home-Kalender an. Aktualisiert sich
von selbst, ist aber nur für den Berater selbst sichtbar. Und **nicht sofort**: Google holt
abonnierte ICS-Adressen typischerweise nur alle paar Stunden. Ein Termin, den du um 10 Uhr
einträgst, steht nicht um 10:01 in TimeTree. Für „mein Tag im gewohnten Kalender" reicht
das, als Arbeitswerkzeug nicht.

**3. Der Rückweg TimeTree → CRM existiert nicht.**
Das CRM kann private Blocker nicht kennen. Wer Verfügbarkeit braucht — Begleitung planen,
später ein Buchungslink —, muss Blocker im CRM pflegen. Stufe 2 unten ist deshalb kein
Extra, sondern Voraussetzung.

### 7.2 Ausbaustufen

| Stufe | Inhalt | Aufwand |
|---|---|---|
| 1 | Ansicht Tag / Woche / Monat auf vorhandene Daten. Mobil: Tag plus Wochenstreifen | klein |
| 2 | Eigene Einträge ohne Kontakt (Schulung, Teammeeting, **privater Blocker**) → ein neues Modell | klein |
| 3 | **ICS-Abo-Link** je Berater, signiert — **ohne Kundennamen** | klein |
| 4 | Team-Kalender **im CRM**: belegte Slots der Mannschaft ohne Namen → Begleitung planen | mittel |
| 5 | Zwei-Wege-Sync mit Google / M365 | **groß, bewusst nicht** |
| 6 | Buchungslink für Kunden | später |

**Der Feed trägt keine Kundennamen.** Voreinstellung ist „Termin · Beratung" statt „Termin
Anna Weber" — aus demselben Grund wie Stufe 2 in Abschnitt 3.2, hier aber mit einer
zusätzlichen, sehr konkreten Gefahr: Wer einen CRM-Termin von Hand in einen **geteilten**
TimeTree-Kalender kopiert, macht den Kundennamen für alle Mitglieder dieses Kalenders
sichtbar. Wer Namen im eigenen Feed will, schaltet sie bewusst frei.

Falls sich später zeigt, dass ihr einen *gemeinsamen* Kalender mit automatisch
eingetragenen CRM-Terminen wirklich braucht: Das kann TimeTree nicht. Die Alternative wäre
ein geteilter Google-Kalender, der ICS abonnieren kann. Das ist eine Entscheidung über euer
Werkzeug, nicht über den Code — und sie sollte erst anstehen, wenn Stufe 4 im CRM nicht
reicht.

### 7.3 Konsequenz: das CRM ist die einzige Wahrheit

TimeTree lässt sich nicht anbinden, also bleibt der Termin im CRM der maßgebliche.
**Richtung: das CRM schreibt, TimeTree liest, nie umgekehrt.** Drei Dinge folgen daraus.

**1. Private Blocker müssen mit rein.** Sonst werden Begleitungen in Zeiten geplant, die
längst belegt sind. Das ist der häufigste Grund, warum solche Kalender kippen — nicht
Technik, sondern Pflegeaufwand. Entschärft wird es über die Genauigkeit: „Mi 14–18 belegt"
reicht. Ein Blocker braucht weder Titel noch Ort, und niemand muss seinen Zahnarzttermin im
Vertriebswerkzeug dokumentieren. Das Anlegen eines Blockers gehört auf **einen** Griff.

**2. Termin anlegen muss im CRM schneller gehen als in TimeTree.** Sonst gewinnt TimeTree,
weil es bequemer ist, und die einzige Wahrheit ist nach zwei Wochen löchrig. Das ist keine
Feinheit der Oberfläche, sondern die Bedingung, unter der diese Entscheidung überhaupt
trägt: mobil, Daumen, drei Sekunden. Der Assistent aus [assistent-plan.md](assistent-plan.md)
wird dadurch wichtiger, nicht unwichtiger — „Termin Dienstag 14 Uhr bei ihr zuhause" ist
genau der Weg, auf dem Erfassen schneller wird als Tippen im Kalender.

**3. Der ICS-Feed wird zum Sicherheitsnetz.** Ein System, das die einzige Wahrheit ist,
darf nicht die einzige Zugriffsmöglichkeit sein. Kein Netz oder ein schlechter Tag bei
Vercel hieße sonst: kein Kalender. Ein abonnierter Feed im Handykalender ist offline
lesbar. Deshalb gehört Stufe 3 in denselben Bauabschnitt wie Stufe 1 und 2, nicht später.

---

## 8. Bauabschnitte

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 0 | `lib/scope.ts` + Audit aller bestehenden `ownerId`-Abfragen | Es gibt nur noch **eine** Zugriffsgrenze |
| 1 | Baum am `User` (`leaderId`, `path`, `startedAt`, `visibility`) + Migration + Verwaltung auf `/team` | Struktur existiert |
| 2 | Einladungslinks und Selbstregistrierung | Neue kommen ohne dich rein |
| 3 | Mannschafts-Übersicht, Stufe 1 (Zahlen) | Erster sichtbarer Nutzen |
| 4 | Stufe 2 (Pipeline ohne Namen) + Frühwarn-Signale + Ampel | **Führung wird möglich** |
| 5 | `LeadershipTask`, gemischt in `/heute` | Führung wird zur Gewohnheit |
| 6 | 1:1-Journal mit automatischer Gesprächsgrundlage | Führung bekommt ein Gedächtnis |
| 7 | Kalender Stufe 1–3 (Ansicht, eigene Einträge und Blocker, ICS-Abo) | Termine und Verfügbarkeit an einer Stelle, offline lesbar |
| 8 | `ContactShare` — Einzelfreigabe für Begleitung | Der Sonderfall ist sauber gelöst |
| 9 | `ReportLink` nach oben, löst `REPORT_PASSWORD` ab | Deine Ebene darüber ist bedient |
| 10 | Rekrutierungs-Pipeline + Trichter | Die zweite Pipeline läuft |
| 11 | Kalender Stufe 4 (Team-Slots der Mannschaft) | Begleitung planbar ohne Nachfragen |

Der Kalender ist gegenüber der ersten Fassung von Platz 10 auf 7 gerückt: Weil TimeTree
gemeinsame Termine nicht automatisch aufnehmen kann, gibt es außerhalb des CRM keine Stelle
dafür — und die Blocker aus Stufe 2 sind Voraussetzung, um Begleitungen überhaupt planen zu
können (Abschnitt 7.1).

**Nach Schritt 4 ist das Ding bereits nützlich** — alles davor ist Fundament, alles danach
macht aus einer Übersicht ein Arbeitsmittel.

---

## 9. Bewusst nicht gebaut

| Was | Warum |
|---|---|
| Provisions- und Abrechnungslogik | Ist Sache der ERGO. Falsche Zahlen zu Geld sind teurer als kein Feature |
| Vertretungszugriff (Stufe 4) | Erst wenn es einen echten Anlass gibt. Vorher nur Angriffsfläche |
| Mehrmandanten-Betrieb | Fremde Strukturen bringen Trennung, Support und Haftung mit. Nicht in dieser Stufe |
| Zwei-Wege-Kalender-Sync | Siehe Abschnitt 7, Stufe 5 |
| Chat / Nachrichten im Tool | WhatsApp ist da und wird nicht ersetzt |
| Automatisch erzeugte Aufgaben aus Signalen | Erzeugt Rauschen, das man nach zwei Wochen ignoriert. Ein Klick dazwischen |

---

## 10. Offene Punkte

Nummerierung 5–14 entspricht den Fragen aus der Planungsrunde vom 15.08. Punkte 1–4 sind
entschieden und in Abschnitt 1 eingearbeitet.

| # | Frage | Angenommener Default |
|---|---|---|
| 5 | Tiefe und Größe der Struktur heute | 2 Ebenen, unter 20 Personen |
| 6 | Führungs- und Werbe-Baum identisch? | Ein Baum, `recruitedById` nur als Info |
| 7 | Sehen sich Berater untereinander? | Zahlen ja (macht der Wettbewerb ohnehin), Pipeline nein |
| 8 | Darf ein Berater die Sichtbarkeit senken? | Ja, bis Stufe 1. Stufe 1 ist nicht abwählbar |
| 9 | Enkel-Ebene | Zahlen über die ganze Struktur, Details eine Ebene tief |
| 10 | `Person` ohne Konto in der Team-Wertung? | Nein. Team-Wertung setzt ein Konto voraus |
| 11 | Rekrutierung im Tool? | Ja, aber erst Bauabschnitt 9 |
| 12 | Karrierestufen mit festen Kriterien | `careerLevel` als Freitext mitführen, keine Logik daran |
| 13 | Kontakte beim Austritt | Bleiben am Konto, Konto wird deaktiviert. Übertragung ist eine Entscheidung, kein Automatismus |
| 14 | Welcher Kalender wird heute benutzt? | **Beantwortet: TimeTree.** Konsequenzen in Abschnitt 7.1 |

Dazu zwei Punkte, die außerhalb des Codes liegen — am 15.08. bestätigt, du erledigst sie:

1. **Interne Vorgaben.** Ob dein Netzwerk oder die ERGO Regeln zu Kundendaten in
   eigenentwickelten Werkzeugen hat, musst du dort abfragen. Es hilft nichts, wenn die
   Technik sauber ist und eine interne Richtlinie es trotzdem verbietet.
2. **Ansage an die Mannschaft.** Bevor der erste Berater eingeladen wird, muss stehen, was
   die Führungskraft sieht und was nicht. Wenn das jemand später selbst herausfindet, ist
   das Vertrauen weg — und mit ihm die Datenqualität.

---

## 11. Umsetzungsstand (15.08.2026)

| Schritt | Stand | Commit |
|---|---|---|
| 0 · Zugriffsgrenze zentral | **fertig** | `a2cf4ec` |
| 1 · Struktur-Baum | **fertig** | `26208cf` |
| 2 · Einladungslinks | **fertig** | `3401067` |
| 3–11 | offen | |

**Bewusste Abweichungen vom Plan:**

| Thema | Plan | Umgesetzt | Warum |
|---|---|---|---|
| Umfang der Sichtbarkeit | `EIGENE`, `DIREKTE`, `STRUKTUR` | zusätzlich `ALLE` | Die Trichter-Team-Ansicht des Admins sah bisher alle Konten. Das als Sonderfall in `STRUKTUR` zu verstecken hätte Systemverwaltung und Führungsposition vermischt — als eigener Wert bleibt der Unterschied lesbar |
| `recruitedById` | Freitextfeld ohne Logik | echte Beziehung auf `User` | Kostet nichts und verhindert verwaiste IDs. Logik hängt weiterhin keine daran |
| Einladen | jede Führungskraft | vorerst nur Admin | Deckt die beschlossene Reichweite (du plus zwei, drei Testleute) vollständig ab. Öffnet sich in Bauabschnitt 3, wenn nachgeordnete Führungskräfte eine eigene Seite bekommen |
| `path` bei Bestandskonten | — | jedes wird eigene Wurzel | Wer unter wem hängt, weiß die Datenbank nicht. Das Einhängen passiert von Hand auf `/team` |

**Was noch aussteht:**

1. **Migrationen anwenden.** `20260815150000_struktur` und `20260815160000_einladungen` sind
   geschrieben, aber **nicht eingespielt**. Das passiert beim nächsten Deploy automatisch
   (`npm run build` führt `prisma migrate deploy` aus). Bis dahin läuft die Anwendung gegen
   die Live-Datenbank ins Leere, weil `User.path` und die Tabelle `Invite` dort fehlen.
2. **Kein Live-Test.** Weder der Baum noch der Einladungsweg wurden im Browser durchgeklickt
   — dafür müssten die Migrationen stehen. Geprüft ist bisher `prisma validate`, `tsc`,
   `eslint` und `next build`.
