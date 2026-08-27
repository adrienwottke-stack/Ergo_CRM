# Findbarkeit-Plan (Ergo CRM)

Stand: 26.08.2026

Anlass: Ein Partner hat „Einheiten eintragen" nicht gefunden. Das ist kein Einzelfall,
sondern ein Muster — und das Muster ist beschreibbar.

---

## 1. Die Diagnose

Der Weg zu den Einheiten war: Kopfzeile → **Wettbewerb** → (landet auf `/arena`) →
Unterleiste → **Einheiten**. Drei Tipps, und der erste ist eine Kategorie, an die
niemand denkt, der eine Produktionszahl melden will. „Wettbewerb" heißt Spiel,
Rangliste, Punkte. Einheiten sind Geschäft.

Das stand schon im Code, in [`lib/features.ts`](../lib/features.ts):

> „Die Zahl, in der der Betrieb rechnet – **kein Wettbewerbsbaustein**, aber im selben
> Bereich"

Und die Lösung stand ebenfalls schon da, im Schnellzähler der Kopfzeile
([`components/Schnellzugriff.tsx`](../components/Schnellzugriff.tsx)), für das
identische Problem eine Ebene daneben:

> „Bisher lag das Zaehlen drei Tipps und einen Seitenwechsel tief: Wettbewerb → Meine
> Aktivitaeten → warten → +1. Fuer die haeufigste Handlung des Tages ist das der
> falsche Preis."

Derselbe Satz gilt für Einheiten. Das Muster war gelöst, nur nicht auf diese Seite
angewendet.

### Der allgemeine Satz dahinter

> **Die Navigation ist nach Orten sortiert. Der Nutzer sucht nach Verben.**

Namen, Heute, Kalender, Trichter, Mannschaft, Einladen, Wettbewerb — das sind Orte.
Gedacht wird aber in *eintragen, nachtragen, anrufen, einladen, umhängen, nachschauen*.
Eine Navigationsleiste kann nicht gleichzeitig nach Orten und nach Verben sortiert
sein. Ein Suchindex kann beides halten.

Deshalb schlägt Suche das Umsortieren der Leiste: Man kann die acht Punkte dreimal
umstellen — irgendein Nutzer sucht immer unter dem anderen Wort.

---

## 2. Was gebaut wird

| # | Punkt | Kern |
|---|---|---|
| 1 | Einheiten ins Schnellfenster | Die Zahl ist von jeder Seite aus einen Daumen entfernt |
| 2 | Frage nach dem Abschluss | Die Funktion kommt zum Nutzer, statt gesucht zu werden |
| 3 | Wegweiser: Filterfeld + Verbliste, Strg+K | Ein Index, der Orte *und* Verben hält |
| 4 | Wörterbuch + Treffer-los-Log | Die Sprache des Nutzers, und die Messung, wo sie fehlt |

Was **nicht** gebaut wird, siehe Abschnitt 7.

---

## 3. Punkt 1 — Einheiten ins Schnellfenster

Das Plus in der Kopfzeile öffnet bereits ein Fenster mit drei Zählern. Es steht auf
jeder Seite, ist von überall einen Daumen entfernt und kostet keinen neunten
Navigationspunkt. Dort kommen die Einheiten dazu.

**Nicht** als vierter Zähler mit `+1`: eine Einheit ist keine Strichliste, sondern eine
Zahl mit Komma („12,5") und gelegentlich mit Minus (Storno). Also ein eigener Block
unter der Trennlinie: ein Feld, ein Knopf, daneben der Monatsstand.

**Kein zweiter Weg in die Datenbank.** Die Schnellbuchung ruft dieselbe Prüfung und
dieselbe Tabelle wie das Formular auf `/einheiten` — gemeinsamer Kern in
`app/(team)/einheiten/actions.ts`. Der Rückwert ist der neue Monatsstand, damit das
Fenster nach dem Tippen die wahre Zahl zeigt und nicht die erhoffte.

Der Navigationspunkt „Wettbewerb → Einheiten" bleibt. Er ist nicht falsch, er war nur
der einzige Weg.

## 4. Punkt 2 — Die Frage nach dem Abschluss

Der zuverlässigste Weg, eine Funktion zu finden, ist, sie nicht suchen zu müssen.

Wenn ein Kontakt auf `ABSCHLUSS` springt — über „Termin gehalten → Abschluss" in der
Heute-Liste oder über den Phasenwechsel am Kontakt — steht direkt danach die Frage:

> **Abschluss steht. Wie viele Einheiten?**
> [Feld] [Eintragen] [Später]

Das ist der Augenblick, in dem der Partner die Zahl im Kopf hat. Zwei Minuten später
hat er sie nicht mehr, und in zwei Wochen fehlt sie im Monat.

Regeln:

- „Später" ist gleichwertig und kostet nichts. Kein Zwang, keine Wiedervorlage, kein
  rotes Abzeichen. Wer Einheiten woanders pflegt, darf das.
- Der Abschluss ist **bereits gespeichert**, bevor gefragt wird. Die Frage hängt hinten
  dran, sie steht nicht davor. Ein Dialog, der einen Abschluss blockiert, wäre eine
  Verschlechterung.
- Die Buchung läuft über dieselbe Aktion wie Punkt 1.

## 5. Punkt 3 — Der Wegweiser

**Ein Fenster, zwei Zustände.** Das Schnellfenster bekommt oben ein Filterfeld:

- **Feld leer** → wie bisher: die drei Zähler und die Einheiten. Der häufige Fall
  bleibt unverändert schnell.
- **Feld gefüllt** → die Zähler weichen der Trefferliste. Ein Tipp führt hin.

Warum nicht ein eigenes Symbol in der Kopfzeile: die trägt am Handy schon fünf. Und
warum das Plus trägt, was nach Suche aussieht: jeder Eintrag im Wegweiser ist ein Verb.
„Ich will was machen" ist genau die Absicht, mit der man auf das Plus tippt.

Am Rechner öffnet **Strg+K** (bzw. **Cmd+K**) dasselbe Fenster mit dem Feld im Fokus.
Pfeiltasten wählen, Eingabetaste führt aus, Escape schließt.

Der Index steht in `lib/wegweiser.ts` und hält beides: die Orte der Navigation und die
Verben, die es dort zu tun gibt. Admin-Einträge (Team, Werkstatt) erscheinen nur beim
Admin.

## 6. Punkt 4 — Wörterbuch und Treffer-los-Log

### Das Wörterbuch

Jeder Eintrag trägt Synonyme in der Sprache, die im Betrieb tatsächlich gesprochen wird
— nicht in der, die in der Navigationsleiste steht:

```
Einheiten   → Produktion, Stück, Bewertungssumme, BWS, eingereicht, Umsatz, Storno
Trichter    → Pipeline, Vorgänge, offene Sachen, was läuft
Mannschaft  → Struktur, Downline, meine Leute, Organigramm
Namen       → Liste, Kontakte, Adressen, wen kann ich anrufen
```

Das ist die Arbeit, die den Unterschied macht — nicht das Suchfeld.

### Der Treffer-los-Log

Ein Suchbegriff ohne Treffer ist das ehrlichste Stück Produktforschung, das es gibt:
der Nutzer sagt in seinen eigenen Worten, was er erwartet hat und nicht fand.

Neue Tabelle `Suchbegriff`: Begriff, Tag, Anzahl. Aufgezeichnet wird **erst beim
Schließen** des Fensters und nur der letzte Begriff ohne Treffer — sonst steht jeder
Tipp-Präfix (`e`, `ei`, `ein`) einzeln in der Tabelle.

**Ohne Personenbezug.** Nicht wie `FeatureUse`, das je Kopf speichert und nur in Summe
anzeigt: ein Suchbegriff ist Freitext und kann verraten, woran jemand gerade sitzt. Der
Schlüssel ist `(begriff, tag)`, mehr steht nicht drin.

Angezeigt in der Werkstatt unter den Bausteinen: *„Gesucht, nichts gefunden"*, die
letzten 30 Tage. Das ist das Navigations-Backlog, direkt aus dem Nutzermund. Jede Zeile
ist entweder ein fehlendes Synonym (billig) oder eine fehlende Funktion (teuer, aber
wenigstens belegt).

### Schalter und Zählstelle

Nach der Regel aus `lib/features.ts`: kein Baustein ohne Schlüssel, Schalter und
Zählstelle. Schlüssel `wegweiser`, Feature-Zeile in der Migration, Nutzung wird je Kopf
gezählt und in Summe angezeigt. Steht der Schalter auf `AUS`, verschwindet das
Filterfeld und das Fenster ist wieder das, was es vorher war.

---

## 7. Was bewusst nicht gebaut wird

**Kein Bot, der Fragen zur Bedienung beantwortet.** Nicht jetzt.

Ein Bot, der „wo finde ich X" beantwortet, ist ein Pflaster auf einer Navigation, die
die Sprache des Nutzers nicht spricht. Jede solche Frage ist ein Navigationsfehler.
Baut man den Bot zuerst, verliert man das Signal: die Navigation bleibt kaputt, und man
merkt es nicht mehr, weil der Bot es zudeckt. Der Treffer-los-Log aus Punkt 4 macht
genau das Gegenteil — er legt die Fehler offen.

Kommt der Assistent aus [assistent-plan.md](assistent-plan.md), ist „wo ist das" ein
billiges Anhängsel: ein Lese-Werkzeug, das eine Route zurückgibt. Wichtig dann: **nicht
mit Text antworten, mit einem Knopf.** Ein Bot, der einen Weg beschreibt, den man
danach selbst klicken muss, ist schlechter als eine Suche.

**Kein Hilfe-Center, keine Q&A-Seite.** Hilfe steht am Ort der Arbeit — das Muster
dafür ist `GuidePanel`: aufklappbar, dort wo gearbeitet wird, kein PDF. Eine eigene
Hilfe-Seite wäre der erste Ort in dieser Anwendung, an dem man liest statt arbeitet.

**Kein neunter Navigationspunkt.** Die Kopfzeile trägt acht. Ein neunter macht die
anderen acht schlechter.

---

## 8. Woran man misst, ob es geholfen hat

| Frage | Wo sie beantwortet wird |
|---|---|
| Benutzt überhaupt jemand den Wegweiser? | Werkstatt, Baustein `wegweiser`, Köpfe/7 Tage |
| Wonach wird gesucht, ohne dass es etwas gibt? | Werkstatt, „Gesucht, nichts gefunden" |
| Tragen mehr Leute Einheiten ein? | Werkstatt, Baustein `einheiten` |
| Wird nach dem Abschluss gebucht? | Einheitenbuchungen am selben Tag wie ein `ABSCHLUSS` |

Bleibt die erste Zahl bei null, war das Suchen nicht das Problem — dann steht in Punkt
2 der eigentliche Hebel, und der Wegweiser fliegt nach drei Wochen nach derselben Regel
raus wie jeder andere Baustein.
