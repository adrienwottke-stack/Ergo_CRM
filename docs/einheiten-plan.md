# Einheiten und Karrierestufe

Stand: 25.08.2026. Gebaut in einem Zug, weil die Zahl fehlt, an der der Beruf
tatsächlich gemessen wird.

---

## 1. Warum

Das Werkzeug zählt bis hierhin **Tätigkeiten**: Anrufe, gezogene Nummern,
vereinbarte und gehaltene Termine, Abschlüsse. Das ist die richtige Währung für
den Anfang — wer noch nichts erreicht hat, kann wenigstens fleißig sein.

Es ist aber nicht die Währung, in der der Betrieb rechnet. Dort zählen
**Einheiten**, und an ihnen hängt die **Karrierestufe**: wer wo steht, wer wohin
kommt, wer wann Stufe 2 erreicht. Diese Zahl steht heute nirgends im Werkzeug —
sie liegt in einem Portal daneben, und wer sie sehen will, verlässt die App.

Zweiter Punkt, und der eigentliche Grund für die Dringlichkeit: **eine Zahl
allein bewegt niemanden.** Die Rangliste funktioniert, weil danebensteht, was
die anderen geschafft haben. Für Einheiten fehlt genau das. Deshalb ist die
Sichtbarkeit unter Gleichgestuften kein Zusatz, sondern der Kern des Features.

### Was hier bewusst NICHT zurückkommt

`docs/audit-kernmodell.md`, 3.11 hat die alte Einheiten-Rechnung abgeräumt:
Vorgänge, Sparten, Monatsbeiträge, `unitFactorPermille`, 100 € = 82 Einheiten,
Euro-Summen. Begründung damals: „Umsatzbewertung ist Reporting."

Das gilt weiter. Was hier entsteht, ist **keine zweite Pipeline und keine
Umsatzrechnung**, sondern eine selbst gemeldete Zahl mit einem Datum daran —
näher an einem Tacho als an einer Buchhaltung. Wer aus einem Abschluss
automatisch Einheiten rechnen will, braucht Sparte, Beitrag, Laufzeit und
Faktoren. Genau der Apparat ist rausgeflogen und kommt nicht wieder.

---

## 2. Was gebaut wird

| # | Sache | Kurz |
|---|---|---|
| 1 | **Karrierestufe am Konto** | Eine Zahl, selbst eingetragen. NULL = nicht gesetzt |
| 2 | **Einheiten buchen** | Menge, Tag, optionale Notiz. Auch negativ (Storno) |
| 3 | **Zwei Zahlen** | Eigeneinheiten gesamt (→ Schritte Richtung Stufe 2) und Einheiten im laufenden Produktionsmonat |
| 4 | **Die Stufenrunde** | Wer dieselbe Karrierestufe hat, sieht die Einheiten der anderen — Name und Zahl, sonst nichts |
| 5 | **Seite `/einheiten`** | Fünfter Reiter im Wettbewerb, neben „Meine Aktivitäten" |

### Explizit nicht gebaut

- **Keine Einheiten in der Rangliste.** Punkte bleiben Tätigkeit. Einheiten in
  die Arena-Wertung zu kippen hieße: Verkauf schlägt Aufbau, und die gesamte
  Punktehistorie wäre rückwirkend eine andere. Dieselbe Überlegung wie bei der
  Anwesenheit, die deshalb kein sechster `QuotaType` wurde.
- **Keine Automatik aus Abschlüssen.** Siehe oben.
- **Keine Meldung an den Feed, kein Push.** Erst laufen lassen.

> **Nachgetragen 26.08.2026:** Der Punkt „kein Einheiten-Blick für
> Führungskräfte in `/mannschaft`" ist eingelöst — siehe Abschnitt 10.

---

## 3. Datenmodell

Am `User`, nicht an der `Person`:

```prisma
karrierestufe      Int?          // NULL = nicht eingetragen
einheitenStart Int @default(0)   // Hundertstel, Bestand vor der App
```

```prisma
model Einheitenbuchung {
  id          String   @id @default(cuid())
  userId      String
  hundertstel Int      // 350 = 3,50 Einheiten. Negativ = Storno
  tag         DateTime // Berliner Kalendertag als UTC-Mitternacht
  notiz       String?
  createdAt   DateTime @default(now())

  @@index([userId, tag])
}
```

Drei Festlegungen:

1. **Hundertstel als `Int`, kein `Decimal`.** Prismas `Decimal` ist eine
   Klasseninstanz und überlebt die Grenze zu einer Client-Komponente nicht
   („Only plain objects can be passed"). Ganze Zahlen rechnen exakt, wandern
   überall durch, und die einzige Stelle, an der aus „3,5" eine 350 wird, steht
   in `lib/einheiten.ts`.
2. **Am `User`, nicht an der `Person`.** `Person` ist die Wettbewerbs-Identität,
   an der `DailyLog` hängt — dort etwas anzubauen wäre der kurze Weg, Einheiten
   doch noch in die Punktewertung zu ziehen. Außerdem sitzt die Karrierestufe am
   Konto, und die Stufenrunde ist eine Abfrage über Konten.
3. **Ein Startbestand statt Altbuchungen.** Niemand tippt drei Jahre nach. Eine
   Zahl („was vor der App schon stand"), danach laufen die Buchungen.

`Gesamt = einheitenStart + Summe aller Buchungen.`

---

## 4. Der Produktionsmonat

Voreinstellung: **der Kalendermonat**, Europe/Berlin, wie alle anderen
Zeiträume im Werkzeug.

Ob der Betrieb anders schneidet (Stichtag 15., 20., „bis zum letzten
Arbeitstag") ist eine Frage an die Praxis, nicht an den Code. Deshalb steht der
Schnitt als **eine Konstante** in `lib/einheiten.ts`:

```ts
export const PRODUKTIONSMONAT_ERSTER_TAG = 1;
```

Auf 16 gesetzt, läuft der Monat vom 16. bis zum 15. — ohne dass eine
Aufrufstelle davon erfährt. Die Buchung trägt ein Datum, keine Monatszuordnung;
damit lässt sich der Schnitt später ändern, ohne Daten anzufassen.

---

## 5. Karrierestufe und Schwelle

**Warum „Karrierestufe" und nicht „Stufe":** `lib/stufen.ts` belegt das Wort schon
— Anwärter bis Veteran, gerechnet aus Wettbewerbspunkten, sichtbar auf
`/spiel`. Zwei Dinge im selben Bereich „Stufe" zu nennen wäre der sichere Weg
in die Verwechslung. Im Betrieb heißt es ohnehin Karrierestufe.

Die Schwelle zu Stufe 2: **500 Einheiten Eigenumsatz**. Die Zahl steht schon in
`docs/recruiting-plan.md` („nach ~500 Einheiten besteht der Alltag aus
Rekrutierung") und ist dort als offener Punkt markiert. Sie steht hier an einer
Stelle und ist eine Zeile weit von einer Korrektur entfernt.

Für Stufen ab 2 ist **keine Schwelle hinterlegt**. Dort zeigt die Seite die
zwei Zahlen und die Runde, aber keinen Balken auf ein erfundenes Ziel. Eine
falsche Schwelle ist schlimmer als keine: sie sagt jemandem, er sei fast da.

---

## 6. Sichtbarkeit: die Stufenrunde

Wer dieselbe Karrierestufe trägt, sieht die Einheiten der anderen — **über die
ganze Instanz, quer durch alle Äste.**

Das ist bewusst **nicht** `lib/scope.ts`. Dort liegt die Struktur-Grenze („ich
und alles unter mir"), und sie bleibt unangetastet. Die Stufenrunde ist eine
zweite, flache Grenze mit einer anderen Frage dahinter: nicht „wen führe ich",
sondern „wer ist so weit wie ich". Sie steht deshalb als eigene Funktion in
`lib/einheiten.ts` und nirgends sonst.

Sichtbar wird ausschließlich, was auch die Rangliste zeigt: **Name und Zahl.**
Keine Kontaktdaten, keine Pipeline, keine Namen von Kunden.

Wer keine Karrierestufe eingetragen hat, sieht keine Runde — und steht in keiner.
Kein Ratespiel, keine Voreinstellung auf 1: eine falsche Stufe würde jemanden
in die falsche Runde stellen, und dort stünde er dann mit fremden Zahlen.

Platzhalter (Konten ohne Zugangsdaten) und Ausgetretene stehen nie in einer
Runde. Wer nie gearbeitet hat, hat keine Einheiten.

---

## 7. Oberfläche

`/einheiten`, fünfter Reiter neben Arena / Rangliste / Meine Aktivitäten / Spiel.

```
  [ Arena ][ Rangliste ][ Meine Aktivitäten ][ Einheiten ][ Spiel ]

  Einheiten
  ─────────────────────────────────────────────
  Dieser Produktionsmonat        Eigeneinheiten gesamt
  12,5                           327,5
                                 ▓▓▓▓▓▓▓▓▓░░░░  noch 172,5 bis Karrierestufe 2

  [ Einheiten eintragen ]  Menge · Tag · Notiz

  Deine Karrierestufe: 1        [ ändern ]

  Karrierestufe 1 — 6 Leute
  ─────────────────────────────────────────────
  Du            12,5     327,5
  Marc           9,0     411,0
  Nick           4,5      88,0
```

Reihenfolge in der Runde: **nach dem laufenden Produktionsmonat**, nicht nach
Gesamt. Gesamt ist Biografie — wer lange dabei ist, steht dort immer vorn, und
die Liste wäre jeden Monat dieselbe. Der Monat ist das, was gerade läuft.

---

## 8. Bauabschnitte

| # | Schritt | Fertig, wenn |
|---|---|---|
| 1 | Schema + handgeschriebene Migration (additiv, idempotent) | Probelauf gegen die echte DB sauber, `ROLLBACK` |
| 2 | `lib/einheiten.ts` — Parsen, Formatieren, Produktionsmonat, Schwelle, Stufenrunde | rein und testbar, keine Datenbank in den Rechenfunktionen |
| 3 | `/einheiten` + Actions (buchen, löschen, Stand speichern) | eigene Zahlen stehen, Runde steht |
| 4 | Navigation + Feature-Schalter `einheiten` | fünfter Reiter, Zählstelle läuft |
| 5 | `next build`, `tsc`, `eslint` | grün |

---

## 9. Offene Punkte

| # | Frage | Wer entscheidet |
|---|---|---|
| 1 | Stimmen **500 Einheiten** als Schwelle zu Karrierestufe 2? | Praxis. Eine Zeile in `lib/einheiten.ts` |
| 2 | Läuft der **Produktionsmonat** wirklich vom 1. bis zum Monatsende? | Praxis. Eine Zeile ebenda |
| 3 | Schwellen für Karrierestufe 3 und höher | Offen, bis die Zahlen bekannt sind |
| 4 | ~~Soll die Führungskraft die Einheiten ihrer Leute sehen (`/mannschaft`)?~~ | **Entschieden 26.08.2026: ja.** Siehe Abschnitt 10 |
| 5 | **Die Tätigkeiten selbst sind noch nicht sauber** (Anmerkung des Users, 25.08.) | Eigener Durchgang — gehört nicht in dieses Feature |

---

## 10. Team-Einheiten (26.08.2026)

Eigeneinheiten trägt jeder selbst ein. Was darunter hängt, läuft **von allein
nach oben**: wer einen Geschäftspartner unter sich hat, sieht dessen Zahlen in
seiner Team-Summe — und der wiederum die seiner Leute, über alle Ebenen. Ein
Einser ohne jemanden unter sich trägt seine Eigeneinheiten ein, und sie zählen
bei jeder Führungskraft über ihm mit.

### Zwei Zahlen, nie eine

**Team ist exklusiv:** alles UNTER jemandem, ohne ihn selbst. Ein Blattknoten
hat Team = 0 und trotzdem Eigeneinheiten. Wer beides in eine Zahl wirft, kann
später nie mehr sagen, was jemand selbst geschrieben hat — und genau danach
fragt die Karrierestufe. Deshalb bleibt der Fortschrittsbalken zur nächsten
Karrierestufe unverändert an den **Eigeneinheiten** hängen (die Schwelle heißt „500
Einheiten Eigenumsatz", nicht Teamumsatz).

### Nichts wird gespeichert

Keine Migration, kein Feld, kein Propagieren. Die Summe entsteht bei jedem
Aufruf aus dem Struktur-Pfad (`User.path`, `lib/struktur.ts`). Ein
mitgeführtes Feld müsste bei jeder Buchung UND bei jedem Umhängen
fortgeschrieben werden — und stünde ab dem ersten verpassten Fall dauerhaft
falsch da.

Gerechnet wird von unten nach oben: absteigend nach Tiefe sortiert ist ein
Knoten immer fertig, bevor seine Führungskraft an die Reihe kommt. Dasselbe
Verfahren wie `astSummen` in `lib/fuehrung.ts` — dort für Tätigkeiten, hier für
Einheiten. Bewusst eine **eigene Fassung** in `lib/einheiten.ts` statt eines
gemeinsamen Bausteins: die beiden Zahlenwelten sollen sich nicht vermischen,
das ist der ganze Sinn der Trennung. (Bei einem dritten Verwender neu
bewerten.)

### Wo es steht

| Ort | Was |
|---|---|
| `/einheiten` | Eigene Team-Summe als eigene Karte — Monat, Insgesamt, „Du und dein Team zusammen". Fehlt komplett, wenn niemand unter dir hängt (eine 0 wäre dort keine Auskunft, sondern eine leere Karte für die Mehrheit ohne eigene Leute) |
| `/mannschaft` | Aufschlüsselung je Kopf: Eigene / Team / Zusammen, in Baumreihenfolge. Bei jemandem ohne Leute steht in der Team-Spalte „—", keine 0 |

**Keine neue `TeamVisibility`-Regel.** Reine Summen sind laut Enum-Kommentar
(`ZAHLEN // Aktivitaeten, Quoten, Summen`) auf jeder Sichtbarkeitsstufe
sichtbar; die bestehende STRUKTUR-Grenze aus `mannschaftsLage()` ist die
Autorisierung. `/mannschaft` respektiert denselben Feature-Schalter
`einheiten` wie `/einheiten` — sonst ließe sich die Sichtbarkeit an einer
Stelle abschalten und an der anderen nicht.

**Einheiten bleiben aus jeder Rangliste heraus**, Team-Einheiten erst recht.
Sonst schlüge Aufbau plötzlich doch Verkauf — nur andersherum als befürchtet.

### Karrierestufe geht bis 6

`KARRIERESTUFE_MAX` von 9 auf **6**: darüber gibt es im Betrieb keine Karrierestufe.
Eine Zeile in `lib/einheiten.ts`, keine Migration — in der Datenbank sitzt kein
Constraint, `istKarrierestufe()` und das `max`-Feld im Formular hängen beide an
dieser Konstante. Gegen die echte DB geprüft: niemand steht über Stufe 2, es
verliert also niemand seine Stufe.

### Geprüft

`scripts/einheiten-team-probe.mjs` (lesend, wiederholbar) rechnet den Rollup
auf zwei Wegen — per SQL über den Pfad-Präfix und per Faltung — und vergleicht.
Weil die echten Daten die Faltung nicht prüfen (nur ein Kopf hat Einheiten, und
der steht ganz oben), enthält die Probe zusätzlich einen erfundenen
vierstufigen Baum mit bekannten Zahlen.
