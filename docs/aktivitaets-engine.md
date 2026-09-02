# Aktivitäts-Engine — Bestand, Zielbild, Umsetzungsplan

> Stand: 25.08.2026. Bestandsaufnahme gegen den Zweig `struktur-und-einblick`,
> Commit `6345b98`. Jede Aussage über den Bestand ist mit Datei und Zeile belegt.
> **Es wurde kein Produktivcode geschrieben.**

---

## Vorbemerkung: das hier ist kein leeres Feld

Die Codebasis hat bereits ein vollständiges Punkte-, Ranglisten-, Serien- und
Meldungssystem. Vier Dokumente in `docs/` beschreiben es, und der Code verweist
laufend auf sie. Der Auftrag lautet also nicht „Aktivitäts-Engine bauen", sondern
**„vorhandene Engine gegen ein neues Zielbild prüfen und umbauen"**.

Das ist wichtig, weil das Zielbild an sechs Stellen dem widerspricht, was heute
läuft — teils dem, was **heute Vormittag** gebaut wurde. Diese Stellen stehen in
Abschnitt 3.1 unter „vorhanden aber widerspricht dem Zielbild" und sind der
eigentliche Kern der Arbeit.

---

# Bestand

## 1.1 Event- und Datenmodell

### Gibt es ein zentrales, unveränderliches Ereignis-Log?

**Teilweise — es gibt ein zentrales Log, aber es ist nicht unveränderlich.**

Es existieren **drei** parallele Ereignisspuren, nicht eine:

| Modell | Ort | Was es festhält |
|---|---|---|
| `DailyLog` | `prisma/schema.prisma:541` | Der Aktivitätszähler. `personId`, `type`, `count`, `date`, `createdAt`, optional `activityId` |
| `Activity` | `prisma/schema.prisma:495` | Die Handlung am Kontakt. `contactId`, `type`, `text`, `date` |
| `StageEvent` | `prisma/schema.prisma:181` | Der Phasenwechsel. `fromStage`, `toStage`, `at`, `userId` |

`DailyLog` ist die Wertungswährung und kommt dem geforderten Ereignis-Log am
nächsten. Es ist **append-only im Normalbetrieb** — es gibt keinen einzigen
`update`-Aufruf darauf im Produktivcode.

Aktivitäten sind **nicht** als Felder am Kontakt verstreut. Die einzige
Ausnahme sind vier Anti-Doppelzähl-Stempel am `Contact`
(`appointmentLoggedAt`, `appointmentHeldLoggedAt`, `wonLoggedAt`,
`referralsAskedAt`) — sie halten fest, dass für diesen Kontakt bereits gebucht
wurde, sie sind kein zweites Aktivitätsprotokoll.

`DailyLog.activityId` ist `@unique` (`prisma/schema.prisma:545`) und verknüpft
einen Zähler mit der CRM-Handlung, aus der er entstand. Daraus entsteht die
„% aus dem CRM"-Anzeige — Herkunft sichtbar machen statt Prüfroutinen.

### Welche Aktivitätstypen werden erfasst?

`QuotaType`, `prisma/schema.prisma:510`, fünf Werte. Gewichte in
`lib/labels.ts:34`:

| Typ | AP heute | Belegstelle |
|---|---|---|
| `CALL` | 1 | `lib/labels.ts:35` |
| `NUMBERS_PULLED` | 1 | `lib/labels.ts:36` |
| `APPOINTMENT_SET` | 3 | `lib/labels.ts:37` |
| `APPOINTMENT_HELD` | 5 | `lib/labels.ts:38` |
| `DEAL_WON` | **10** | `lib/labels.ts:39` |

Daneben `ActivityType` (`prisma/schema.prisma:52`): `CALL`, `MEETING`, `EMAIL`.

**Alle neun Schreibstellen für `DailyLog`:**

| Datei:Zeile | Auslöser |
|---|---|
| `app/(app)/contacts/actions.ts:115` | Kontakt angelegt |
| `app/(app)/contacts/actions.ts:207` | Aktivität am Kontakt |
| `app/(app)/contacts/actions.ts:248` | Schnell-Anruf |
| `app/(app)/namen/actions.ts:98` | Name auf die Liste |
| `app/(app)/pipeline/actions.ts:110` | Phasenwechsel |
| `app/(app)/pipeline/actions.ts:216` | Schritt erledigt |
| `app/(team)/log/actions.ts:36` | Manuelles Nachtragen |
| `app/(team)/log/quickLogAction.ts:23` | Schnellzähler |
| `lib/empfehlungen.ts:68` | Empfehlung erhalten |

**Wichtig für die Punktetabelle:** Eine erhaltene Empfehlung bucht heute
`NUMBERS_PULLED` mit `count: 1` (`lib/empfehlungen.ts:68`) — sie ist **kein
eigener Typ**, sondern zählt als gezogene Nummer.

### Zeitstempel und Tagesdefinition

**Vorhanden, an genau einer Stelle, aber fest auf Europe/Berlin.**

`lib/dates.ts:1-2` erklärt die Regel: Tagesgrenzen laufen über den Berliner
Kalendertag, gespeichert als UTC-Mitternacht. `berlinToday()`
(`lib/dates.ts:8`), `berlinDayOf()` (`lib/dates.ts:13`), `dayToUtcDate()`
(`lib/dates.ts:28`), `mondayOf()` (`lib/dates.ts:24`).

Die Zeitzone ist **hart kodiert** (`lib/dates.ts:5`). Eine nutzerbezogene
Zeitzone existiert **nicht** — kein Feld an `User`, nirgends.

### Können Einträge verändert oder gelöscht werden?

**Ja, an zwei Stellen. Das ist der schärfste Widerspruch zum Zielbild.**

1. **`deleteLog`**, `app/(team)/log/actions.ts:51-70`. Hartes
   `deleteMany` (Zeile 59). Eingegrenzt auf eigene, manuelle Einträge von
   **heute** (`activityId: null`, `date: dayToUtcDate(berlinToday())`,
   Zeilen 61-65) — aber es ist eine Löschung, keine Gegenbuchung.

2. **Rückgängig-Funktion**, `lib/undo.ts:187-196`. Löscht innerhalb von
   30 Sekunden (`lib/undo-window.ts:6`) `Activity`, `DailyLog` und
   `StageEvent` hart (Zeilen 189, 192, 195).

Es gibt **keine Gegenbuchung, kein Storno-Ereignis, kein `deletedAt`.** Ein
gelöschter Eintrag hinterlässt keine Spur.

Gegen Manipulation wirken stattdessen zwei stumpfe Grenzen: Tageskappen
(`lib/labels.ts:45`, Anrufe 120 / Nummern 200 / Termine 15) und ein
Nachtragsfenster von zwei Tagen (`lib/labels.ts:55`, durchgesetzt in
`lib/fairness.ts:20`).

---

## 1.2 Vorhandene Gamification-Ansätze

**Umfangreich vorhanden und funktionsfähig.** Toter Code: keiner gefunden.

| Baustein | Ort | Zustand | Im UI sichtbar |
|---|---|---|---|
| **Punkte** | `lib/labels.ts:34` | Funktionsfähig | `/arena`, `/leaderboard` |
| **Rangliste** | `lib/arena.ts:54` `ladeRangliste` | Funktionsfähig | `/arena`, `/leaderboard` |
| **Serie (Streak)** | `lib/stats.ts:5` `streakDays` | Funktionsfähig | `/arena` (Flamme ab 2), `/log` |
| **Puls** | `lib/arena.ts:139` | Funktionsfähig | `/arena` |
| **Bestmarke** | `lib/arena.ts:166` | Funktionsfähig | `/arena` |
| **Zweikampf** | `app/(team)/arena/page.tsx` | Funktionsfähig | `/arena` |
| **Sprint (25 Min.)** | `lib/arena.ts:25`, `:189` | Funktionsfähig | `/arena` |
| **Kommentator** | `lib/kommentator.ts` | Funktionsfähig | `/arena` |
| **Starterpass** | `lib/starterpass.ts` | Funktionsfähig | `/heute`, `/mannschaft` |
| **Stufen** | `lib/stufen.ts` | Funktionsfähig, **25.08. gebaut** | `/arena`, `/spiel` |
| **Verdient** | `lib/verdient.ts` | Funktionsfähig, **25.08. gebaut, 02.09. umbenannt** | `/spiel` |
| **Wochentitel** | `lib/titel.ts` | Funktionsfähig, **25.08. gebaut** | `/arena` |
| **Feed + Reaktionen** | `lib/feed.ts`, `lib/meilensteine.ts` | Funktionsfähig, **25.08. gebaut** | `/arena`, `/log` |
| **Anwesenheits-Punkt** | `lib/anwesenheit.ts:30` | Funktionsfähig, **25.08. gebaut** | fließt in die Rangliste |
| **Peer-Nachrichten** | `lib/nachrichten.ts` | Funktionsfähig | `/arena`, `/heute`, `/mannschaft` |

**Kein Abzeichen-/Badge-System.** Ausdrücklich geprüft und verworfen
(`docs/wettbewerb-plan.md` §13.4: „nach acht Wochen hat jeder alles").

**Kein `careerLevel` mehr.** Existierte als Feld, wurde in
`prisma/migrations/20260823120000_kernmodell_rueckbau/migration.sql` gelöscht —
„wird nie gelesen und nie geschrieben, totes Feld".

Alle Bausteine hängen an einem Schalter (`lib/features.ts`, `ArenaKey` ab
Zeile 18). Aktueller Stand in der Datenbank — neun Schlüssel, alle auf `TEST`:
`anwesenheit`, `bestmarke`, `feed`, `puls`, `spiel`, `sprint`, `stufen`,
`titel`, `zweikampf`.

**Der zentrale Architekturgrundsatz:** Punkte werden **nirgends gespeichert**,
sondern bei jeder Anzeige aus `quotaTypePoints` gerechnet. Der Warnkommentar
steht bei `lib/labels.ts:23-33`: *„Jede Änderung schreibt alle vergangenen
Ranglisten rückwirkend um."* Das deckt sich mit Leitplanke 2.9 — und macht
jede Änderung der Punktetabelle zu einem historischen Eingriff.

---

## 1.3 Zieldefinition und Fortschritt

**Kein Tagesziel in AP vorhanden.** Es gibt vier andere Zielarten:

| Ziel | Ort | Wer setzt es | Zeitraum |
|---|---|---|---|
| **Namensziel 20** | `lib/namelist.ts:80` `NAME_TARGET` | Hart kodiert | dauerhaft |
| **Nachfüllschwelle 5** | `lib/namelist.ts:85` | Hart kodiert | dauerhaft |
| **Anrufziel 5** (Starterpass) | `lib/starterpass.ts:31` `ANRUF_ZIEL` | Hart kodiert | erste Woche |
| **30-Tage-Versprechen** | `User.pledgeTarget`, gesetzt in `app/(willkommen)/willkommen/actions.ts:64` | **Partner selbst** | 30 Tage, einmalig |

Das 30-Tage-Versprechen ist heute die **einzige selbstgesetzte Zahl** und damit
der nächste Verwandte des geforderten Tagesziels — aber es zählt Termine, nicht
AP, und läuft einmalig statt täglich.

„Tagespensum" auf `/heute` (`app/(app)/heute/page.tsx:177`) ist **kein Ziel**,
sondern die Zahl der fälligen Schritte — eine Arbeitsliste, keine Vorgabe.

**Fortschritt wird durchgängig live berechnet, nie gespeichert.** Belege:
`lib/arena.ts:54`, `lib/starterpass.ts:33`, `lib/signale.ts` (Signale sind
laut Kopfkommentar „computed, never stored"). Das entspricht Leitplanke 2.9
bereits vollständig.

**Führungskräfte können heute kein Ziel setzen.** Nicht vorhanden.

---

## 1.4 Benachrichtigungen

**Push-Infrastruktur vollständig vorhanden.**

- Dienst: **Web-Push** über das Paket `web-push`, gekapselt in `lib/push.ts`.
- Abonnements: `PushAbo`, `prisma/schema.prisma:437`, ein Eintrag je Gerät.
- Client: `components/Meldungen.tsx` (Opt-in), `public/sw.js`,
  `components/ServiceWorkerRegistrierung.tsx`, Aktionen in
  `app/(app)/pushActions.ts`.
- `meldeNebenbei()` (`lib/push.ts:115`) wirft nie; tote Abos (404/410) fliegen
  automatisch raus.
- Ohne gesetzte VAPID-Schlüssel passiert schlicht nichts (`lib/push.ts:26`).

**Die vier Auslöser heute:**

| Auslöser | Art | Ort | Empfänger |
|---|---|---|---|
| Abschluss gemacht | ereignisgesteuert | `app/(app)/contacts/results.ts:141` | ganzes Netzwerk |
| Meilenstein gemeldet | ereignisgesteuert | `app/(team)/feedAction.ts:74` | alle außer Absender |
| Peer-Nachricht | ereignisgesteuert | `app/(team)/nachrichtAction.ts:29` | ein Empfänger |
| Tagespensum / Frühwarnung | **zeitgesteuert** | `app/api/cron/meldungen/route.ts:198` und `:281` | Berater bzw. Führungskraft |

Cron: `vercel.json`, `0 6 * * 1-5` — 06:00 UTC, Montag bis Freitag. Genau ein
Cron-Eintrag.

### Ratenbegrenzung und Ruhezeiten

**Teilweise vorhanden, und nur innerhalb des Cron-Laufs.**

`app/api/cron/meldungen/route.ts:21` hält die Regel fest: *„HÖCHSTENS EINE
Meldung je Kopf und Lauf. Wer morgens drei Benachrichtigungen bekommt, schaltet
sie ab — und dann ist auch die wichtige weg."* Durchgesetzt über
`continue`-Zweige (Zeilen 162, 163, 249, 260).

**Was fehlt:** Es gibt **keine globale Obergrenze über alle Kanäle** und
**keine Ruhezeit**. Die drei ereignisgesteuerten Auslöser laufen ungebremst —
ein Abschluss um 22:30 Uhr erreicht heute jedes Gerät im Netzwerk. Gegen das
Stapeln wirkt nur die `kennung` (`lib/push.ts:46`), mit der der Browser eine
noch offene Meldung ersetzt.

**Einzeln abschaltbar: nein.** Das Opt-in ist alles-oder-nichts
(`components/Meldungen.tsx`).

---

## 1.5 Teamebene (Ebene 3)

### Beziehung Führungskraft ↔ Downline

**Ein echter Baum, kein flaches Modell.**

`User.leaderId` als Selbstbeziehung (`prisma/schema.prisma`, Relation
`"Struktur"`) plus ein **materialisierter Pfad** `User.path` in der Form
`/rootId/leaderId/eigeneId/`. „Ich und alles unter mir" ist damit ein
indizierter `startsWith` statt einer rekursiven Abfrage, die Prisma nicht kann.

Geschrieben wird `path` ausschließlich über `lib/struktur.ts`:
`pfadUnter()` (Zeile 17), `strukturKonten()` (Zeile 44), `direkteKonten()`
(Zeile 62), `umhaengen()` (Zeile 84).

**„Führungskraft" ist keine Rolle, sondern eine Position:** wer Direkte unter
sich hat, führt. Abgeleitet über `prisma.user.count({ where: { leaderId } })`,
u. a. in `components/AppShell.tsx`. Die einzige echte Rolle ist
`UserRole` = `ADMIN | MEMBER` und betrifft nur die Systemverwaltung.

### Inaktivitäts-Erkennung

**Vorhanden.** `lib/signale.ts:19`: `stilleTage: 5`. Das Signal `stille`
(`lib/signale.ts:135-138`) feuert, wenn seit fünf Tagen keine Aktivität kam.
Der Kopfkommentar nennt es „das wichtigste Signal überhaupt: sie geht der
Kündigung voraus."

Die zugrundeliegende Zahl kommt aus `lib/fuehrung.ts:343` — ein `groupBy` mit
`_max: { date: true }` über `DailyLog`, **ohne Typfilter**. Das ist die Stelle,
die entscheidet, was „letzte Aktivität" heißt.

Signale werden **berechnet, nie gespeichert**. Eine `LeadershipTask` entsteht
ausschließlich durch ausdrückliches Antippen — nie automatisch.

### Leaderboard

**Vorhanden — und global.**

`app/(team)/leaderboard/page.tsx:100` lädt `prisma.person.findMany()` **ohne
jeden Filter**. Ebenso `lib/arena.ts:63`. Jeder sieht jeden im gesamten
Netzwerk. Es gibt **keine Team-Rangliste und keine Liga-Gruppen**.

Das einzige teambezogene Vergleichsmaß ist `astVergleich()` in
`lib/fuehrung.ts` — der eigene Ast gegen Geschwister-Äste, und nur für
Führungskräfte.

**Kein Team-Wochenziel.** Nicht vorhanden.

---

## 1.6 Startbildschirm

`app/page.tsx` leitet auf `/heute` um, mit dem Kommentar *„Startseite ist die
Arbeitsliste, nicht die Auswertung."* Ebenso `app/start/route.ts:25` für die
installierte App.

**Was ein Partner auf `/heute` in dieser Reihenfolge sieht**
(`app/(app)/heute/page.tsx`):

1. Seitenkopf „Heute" (Zeile 203)
2. Postfach, falls Nachrichten da sind (Zeile 209)
3. Frage nach der eigenen Nummer, einmalig (Zeile 224)
4. „X braucht dich" — nur für Führungskräfte, nur bei roter Ampel (Zeile 230)
5. **Die Pensum-Karte:** große Zahl plus „Anrufe heute" / „Schritte heute"
   (ab Zeile 266), darunter der Nachfüll-Alarm
6. Push-Opt-in (Zeile 351)
7. Erste Woche / Brief / Versprechen
8. Die Schrittliste, gruppiert in Überfällig / Heute / Diese Woche

### Beantwortet er „Was mache ich jetzt?"

**Weitgehend ja — aber als Arbeitsliste, nicht als Ziel.**

Die große Zahl oben ist bereits eine Antwort („7 Anrufe heute"), und die
Gruppierung nach Dringlichkeit führt von oben nach unten. Es ist **kein
Kachel-Dashboard und kein Diagramm** — Leitplanke 2.7 ist im Geist schon
erfüllt.

**Was fehlt gegenüber 2.7:** kein Streak-Zähler (steht nur auf `/log` und
`/arena`), kein Tagesziel-Fortschritt („12 / 20 AP"), keine Wochenliga-Position.
Die Zahl oben ist **Restarbeit** („noch 7 offen"), nicht **Fortschritt**
(„12 von 20 geschafft") — psychologisch der Unterschied zwischen Schuld und
Erfolg.

---

# Zielbild

*(Abschnitt 2 des Auftrags, wörtlich übernommen; Umsetzungsnotizen kursiv in
Blockzitaten.)*

## 2.1 Grundprinzip

Eine einzige Währung: **Aktivitätspunkte (AP)**. Streak, Wochenliga, Team-Ziel
und Push greifen alle auf diese eine Zahl zu. Kein getrennt laufendes Punkte-,
Badge- und Ranking-System.

Nur **Input-Metriken** werden bepunktet — also Handlungen, die der Partner zu
100 % selbst kontrolliert. Ergebnisse (Abschluss, Umsatz, Provision) fließen
**niemals** in AP ein.

> **Umsetzungsnotiz.** Der erste Teil ist bereits erfüllt: `DailyLog` ist heute
> schon die einzige Währung, und alles hängt daran. Der zweite Teil kollidiert
> frontal mit `DEAL_WON: 10` (`lib/labels.ts:39`). Siehe Gap G1.

## 2.2 Punktetabelle

| Ereignis | AP |
|---|---|
| Neuer Kontakt erfasst | 1 |
| Anruf durchgeführt (unabhängig vom Ergebnis) | 2 |
| Termin vereinbart | 5 |
| Termin gehalten | 8 |
| Empfehlung erhalten | 3 |

Die Werte gehören in **eine zentrale Konfigurationsdatei**, nicht verstreut in
die Logik. Sie werden später angepasst.

Wichtig: Ein durchgeführter Anruf gibt Punkte, auch wenn niemand abnimmt. Genau
das ist der Punkt — belohnt wird die Handlung, nicht das Glück.

> **Umsetzungsnotiz.** Die zentrale Datei existiert: `lib/labels.ts:34`.
> „Anruf unabhängig vom Ergebnis" ist bereits so gebaut — `CALL` wird bei jedem
> Anruf gebucht, ohne Erfolgsprüfung.
>
> **Die Tabelle hat fünf Zeilen, das System fünf Typen — sie decken sich aber
> nicht.** „Empfehlung erhalten" ist heute kein eigener Typ, sondern bucht
> `NUMBERS_PULLED` (`lib/empfehlungen.ts:68`). Und „Neuer Kontakt erfasst"
> entspricht `NUMBERS_PULLED`, während `DEAL_WON` in der Zieltabelle **fehlt** —
> was zur Streichung passt. Vorgeschlagene Abbildung:
>
> | Zielbild | Heute | AP neu | AP alt |
> |---|---|---|---|
> | Neuer Kontakt erfasst | `NUMBERS_PULLED` | 1 | 1 |
> | Anruf durchgeführt | `CALL` | 2 | 1 |
> | Termin vereinbart | `APPOINTMENT_SET` | 5 | 3 |
> | Termin gehalten | `APPOINTMENT_HELD` | 8 | 5 |
> | Empfehlung erhalten | **neuer Typ `REFERRAL`** | 3 | — (zählt als Nummer) |
> | — | `DEAL_WON` | **0 / entfernt** | 10 |

## 2.3 Tagesziel und Streak

- **Tagesziel:** Standard 20 AP. Vom Partner selbst anpassbar (Bereich 10–60),
  von der Führungskraft als Empfehlung setzbar, aber nicht erzwingbar.
- **Streak-Tag zählt**, wenn das Tagesziel erreicht wurde. Nicht: „App geöffnet".
- **Arbeitswoche:** Standard Montag–Freitag. Wochenenden brechen den Streak
  nicht. Konfigurierbar, falls jemand samstags arbeitet.
- **Freeze:** 2 automatische Freezes pro Monat, nicht kumulierbar. Werden ohne
  Nachfrage eingesetzt, wenn ein Werktag verfehlt wird. Der Partner sieht
  danach: „Freeze eingesetzt — noch 1 diesen Monat."
- **Reparatur:** Ein gebrochener Streak kann innerhalb von 24 Stunden durch das
  doppelte Tagesziel wiederhergestellt werden. Genau einmal pro Monat.
- **Urlaub/Krankheit:** Der Partner kann bis zu 14 Tage Abwesenheit eintragen.
  Streak pausiert, bricht nicht.

> **Umsetzungsnotiz — hier steckt der größte Konflikt.** „Streak-Tag zählt,
> wenn das Tagesziel erreicht wurde. **Nicht: App geöffnet**" widerspricht
> direkt dem Anwesenheits-Punkt, der am 25.08. gebaut wurde
> (`lib/anwesenheit.ts:30`, 1 AP fürs Öffnen). Siehe Gap G2 — das ist eine
> Produktentscheidung, keine technische.
>
> Heutige Serie (`lib/stats.ts:5`): „aufeinanderfolgende Tage mit mindestens
> einem Eintrag". Kein Ziel, keine Wochenendregel, kein Freeze, keine
> Reparatur, keine Abwesenheit. Der Kern ist brauchbar, die Regeln fehlen alle.
>
> **Spannung zu Leitplanke 2.9:** Freezes, Reparaturfenster und Abwesenheiten
> sind **verbrauchbare Zustände**, keine ableitbaren Tatsachen. Sie *müssen*
> gespeichert werden. „Alles ist abgeleitet" gilt also für Punkte, Streak-Länge
> und Rang — aber die *Eingaben* Freeze-Verbrauch und Abwesenheit sind
> eigenständige Ereignisse. Sauberste Lösung: sie **als Ereignisse ins selbe Log
> schreiben** (`FREEZE_EINGESETZT`, `ABWESEND`), dann bleibt die eine Wahrheit
> erhalten und der Streak bleibt ableitbar.

## 2.4 Wochenliga (Ebene 1 und 3)

- Gruppen aus **8–12 Partnern mit ähnlichem Aktivitätsniveau** der Vorwoche —
  nicht nach Team, nicht global.
- Rangfolge nach **Wochen-AP**. Reset montags 00:00 lokale Zeit.
- Auf-/Abstieg: obere 3 steigen auf, untere 3 steigen ab.
- Anzeige: nur der eigene Rang plus die zwei Plätze darüber und darunter. Nicht
  die ganze Tabelle.

> **Umsetzungsnotiz — nicht sinnvoll baubar, Stand heute.** In der Datenbank
> stehen **3 Personen und 3 aktive Konten** (gemessen am 25.08.). Eine Liga
> braucht 8–12 pro Gruppe. Bei drei Köpfen ist jede Gruppierung eine Fiktion,
> und „obere 3 steigen auf" bedeutet: alle steigen auf.
>
> Der vorhandene **Zweikampf** in `/arena` löst dasselbe Problem bereits für
> kleine Zahlen: eigener Rang plus einer darüber und einer darunter. Das ist
> 2.4 letzter Punkt, nur schmaler. **Empfehlung:** Zweikampf behalten, Liga
> erst ab ~24 aktiven Köpfen bauen (drei Gruppen zu acht). Siehe Gap G6.

## 2.5 Team-Wochenziel (Ebene 3)

- Führungskraft setzt ein gemeinsames Wochenziel in AP für das Team.
- Alle Teammitglieder sehen denselben Fortschrittsbalken.
- Die Führungskraft sieht zusätzlich die Aufschlüsselung pro Person — die
  Partner untereinander **nicht**.

> **Umsetzungsnotiz.** Kollidiert mit dem bestehenden **globalen** Leaderboard
> (`app/(team)/leaderboard/page.tsx:100`), auf dem die Partner einander längst
> voll aufgeschlüsselt sehen. Entweder das Leaderboard wird eingeschränkt, oder
> die Zusage „untereinander nicht" ist von Anfang an gebrochen. Siehe Gap G4.
>
> Der Baum (`User.path`) und `strukturKonten()` (`lib/struktur.ts:44`) tragen
> die Team-Abgrenzung bereits vollständig — das ist die billigste Zutat im
> ganzen Zielbild.

## 2.6 Benachrichtigungen

Nur diese Trigger. Keine weiteren:

| Trigger | Zeitpunkt | Empfänger |
|---|---|---|
| Streak in Gefahr, Tagesziel noch nicht erreicht | 17:00 lokal, nur an Werktagen | Partner |
| Wochenliga: Positionsverlust an Platzgrenze | max. 1× pro Woche | Partner |
| Team-Wochenziel zu 80 % erreicht | einmalig | ganzes Team |
| 2 aufeinanderfolgende Werktage ohne AP | 1× | Führungskraft, nicht der Partner |

- **Maximal 1 Push pro Tag pro Person.** Bei Konflikt gewinnt der Streak-Trigger.
- Ruhezeit 21:00–08:00.
- Alles einzeln abschaltbar.

> **Umsetzungsnotiz — „keine weiteren" heißt Rückbau.** Drei heute laufende
> Auslöser stehen nicht auf der Liste: Abschluss-Meldung ans Netzwerk
> (`app/(app)/contacts/results.ts:141`), Meilenstein-Meldung
> (`app/(team)/feedAction.ts:74`) und Peer-Nachricht
> (`app/(team)/nachrichtAction.ts:29`). Wörtlich genommen müssen alle drei weg.
> **Das halte ich bei der Peer-Nachricht für falsch** — sie ist eine
> Mensch-zu-Mensch-Antwort, keine Systemmeldung, und eine Nachricht, die erst
> beim nächsten Öffnen ankommt, ist keine Antwort. **Rückfrage R3.**
>
> „17:00 lokal, nur an Werktagen" braucht einen zweiten Cron-Eintrag. Auf dem
> Vercel-Hobby-Tarif ist die Cron-Auflösung begrenzt — **ANNAHME A2** unten.

## 2.7 Startbildschirm

Beim Öffnen sieht der Partner in dieser Reihenfolge:

1. Streak-Zähler
2. Heutiges Ziel als Fortschritt: „12 / 20 AP"
3. Die konkret nächste Handlung: „Noch 4 Anrufe bis zum Ziel" mit direktem
   Absprung in die Anrufliste
4. Erst darunter: Wochenliga-Position

Keine Diagramme, keine Kacheln, kein Dashboard.

> **Umsetzungsnotiz.** `/heute` ist bereits kein Dashboard und hat mit der
> Pensum-Karte (`app/(app)/heute/page.tsx:266`) die Anatomie von Punkt 3. Zu
> tun: Streak und Zielfortschritt nach oben holen, Formulierung von Restarbeit
> auf Fortschritt drehen. Punkt 4 entfällt, solange keine Liga existiert.
>
> Die vier Blöcke, die heute **vor** der Pensum-Karte stehen (Postfach,
> Nummernfrage, „X braucht dich", Zeilen 209-230), müssten darunter — sie
> erscheinen zwar nur bedingt, aber wenn sie erscheinen, verdrängen sie genau
> das, was 2.7 an Position 1 verlangt.

## 2.8 Anti-Ziele (explizit nicht bauen)

- **Keine Punkte auf Abschlüsse, Umsatz oder Provision.**
- **Keine Badges für Trivialitäten.**
- **Keine Level, keine Avatare, keine virtuelle Währung, keine Shops.**
- **Kein globales Leaderboard über alle Nutzer.**
- **Keine manuelle AP-Vergabe durch Führungskräfte.**
- **Kein nachträgliches Bearbeiten oder Löschen von Aktivitätsereignissen.**
  Korrekturen nur als Gegenbuchung, nachvollziehbar.

> **Umsetzungsnotiz — vier von sechs Anti-Zielen sind heute verletzt:**
> Abschlusspunkte (G1), Level/Stufen (G3), globales Leaderboard (G4), Löschen
> von Ereignissen (G5). Nicht verletzt: keine Badges, keine manuelle Vergabe —
> beides gibt es nicht und gab es nie.

## 2.9 Technische Leitplanken

- Ein unveränderliches Ereignis-Log als einzige Wahrheitsquelle. Streak, Liga,
  Ziele und Fortschritt sind **abgeleitet**, nicht separat gespeichert.
- „Tag" und „Woche" werden konsequent in der lokalen Zeitzone des Partners
  bestimmt, an genau einer Stelle im Code.
- Punktetabelle, Tagesziel-Standard und Freeze-Regeln in einer
  Konfigurationsdatei.
- Die Streak-Berechnung braucht Tests: Wochenende, Freeze-Verbrauch,
  Reparaturfenster, Urlaub, Zeitzonenwechsel, Sommerzeit.
- Mobile-first. Der Startbildschirm muss auch bei schlechter Verbindung sofort
  etwas anzeigen.

> **Umsetzungsnotiz.** „Abgeleitet, nicht gespeichert" ist bereits die gelebte
> Doktrin — an dieser Stelle muss nichts überzeugt werden.
>
> „Lokale Zeitzone des Partners" ist die einzige Leitplanke, der ich
> **widerspreche**: `lib/dates.ts` bestimmt den Tag an genau einer Stelle, aber
> fest als Europe/Berlin. Ein ERGO-Strukturvertriebsnetz arbeitet in einer
> Zeitzone. Mehrere Zeitzonen einzuführen macht jede Wochen- und Tagesgrenze,
> jede Liga-Zurücksetzung und jeden Cron-Lauf mehrdeutig — für null realen
> Nutzen. **Empfehlung: bei Europe/Berlin bleiben.** Rückfrage R1.
>
> **Es gibt keinen Test-Läufer im Projekt** (`package.json` hat kein
> `test`-Skript). „Braucht Tests" bedeutet hier entweder Vitest einführen oder
> das vorhandene Muster nutzen: reine Funktionen plus ein Prüfskript in
> `scripts/`, wie `scripts/logik-probe.mjs`. Rückfrage R2.

---

# Gap-Analyse und Plan

## 3.1 Gap-Tabelle

### Vorhanden aber widerspricht dem Zielbild — muss umgebaut oder entfernt werden

*Das ist der eigentliche Kern der Arbeit.*

| Nr. | Baustein | Status | Was konkret zu tun ist | Aufwand | Abhängigkeiten |
|---|---|---|---|---|---|
| **G1** | **Abschlusspunkte** `DEAL_WON: 10` (`lib/labels.ts:39`) | widerspricht (2.1, 2.8) | Auf 0 setzen oder Typ entfernen. **Achtung: schreibt die gesamte Historie rückwirkend um** — der Warnkommentar `lib/labels.ts:23-33` sagt genau das. Der bisher Führende verliert auf einen Schlag Punkte. Braucht eine Ansage an die Mannschaft, keinen stillen Deploy | S (Code) / L (sozial) | — |
| **G2** | **Anwesenheits-Punkt** (`lib/anwesenheit.ts:30`) | widerspricht (2.3) | 2.3 sagt ausdrücklich „nicht: App geöffnet". Entweder Punkt streichen (Tabelle `Anwesenheit` bleibt für den Puls nützlich) oder 2.3 anpassen. **Produktentscheidung — Rückfrage R4** | S | — |
| **G3** | **Stufen** (`lib/stufen.ts`, `/spiel`) | widerspricht (2.8 „keine Level") | Zurückbauen, inkl. Storno-Freischaltung, die daran hängt. **Beides am 25.08. gebaut und heute Abend vorgeführt** — Rückfrage R5 | M | Freischaltung |
| **G4** | **Globales Leaderboard** (`app/(team)/leaderboard/page.tsx:100`, `lib/arena.ts:63`) | widerspricht (2.8) | `person.findMany()` auf den Ast einschränken (`strukturKonten()`) oder auf Liga-Gruppen. Betrifft `/arena` und `/leaderboard` gleichermaßen | M | Liga (G6) oder Baum |
| **G5** | **Löschbare Ereignisse** (`app/(team)/log/actions.ts:59`, `lib/undo.ts:189-195`) | widerspricht (2.8, 2.9) | Löschen durch Gegenbuchung ersetzen (`count` negativ oder Storno-Zeile). Die 30-Sekunden-Rücknahme muss dabei erhalten bleiben — sie ist ein UI-Versprechen | M | Punktelogik |
| **G6** | **Wochenliga bei 3 Köpfen** | widerspricht der Realität | 8–12 pro Gruppe sind bei 3 aktiven Konten unerreichbar. Zurückstellen; der **Zweikampf** deckt die Absicht bereits ab | — | Wachstum auf ~24 Köpfe |
| **G7** | **Push ohne Ruhezeit und Tagesgrenze** (`contacts/results.ts:141`, `feedAction.ts:74`, `nachrichtAction.ts:29`) | teilweise widersprechend (2.6) | Zentrale Drossel in `lib/push.ts`: max. 1/Tag/Person, Ruhezeit 21–08. Drei nicht gelistete Auslöser prüfen — Rückfrage R3 | M | — |
| **G8** | **Feste Zeitzone** (`lib/dates.ts:5`) | widerspricht (2.9) | Ich empfehle, **nicht** umzubauen. Rückfrage R1 | L (falls doch) | alles Datumsbezogene |

### Nicht vorhanden — muss gebaut werden

| Nr. | Baustein | Was fehlt | Aufwand | Abhängigkeiten |
|---|---|---|---|---|
| **N1** | Tagesziel in AP | Feld an `User` (Standard 20, Bereich 10–60), Einstellfläche, Empfehlung durch die Führungskraft | S | — |
| **N2** | Streak nach Zielerreichung | `streakDays()` (`lib/stats.ts:5`) zählt Tage mit *irgendeinem* Eintrag. Muss auf „Tagesziel erreicht" umgestellt werden | M | N1 |
| **N3** | Werktagsregel | Wochenenden brechen den Streak nicht; konfigurierbar | S | N2 |
| **N4** | Freeze (2/Monat) | Verbrauchszustand + automatischer Einsatz + Anzeige | M | N2 |
| **N5** | Streak-Reparatur | 24-Stunden-Fenster, doppeltes Tagesziel, 1×/Monat | M | N2, N4 |
| **N6** | Abwesenheit (max. 14 Tage) | Eintragefläche, Streak pausiert | M | N2 |
| **N7** | Empfehlung als eigener Typ | Heute bucht `lib/empfehlungen.ts:68` als `NUMBERS_PULLED`. Braucht `REFERRAL` im Enum + Migration | S | Punktetabelle |
| **N8** | Team-Wochenziel | Ziel je Führungskraft und Woche, gemeinsamer Balken, Aufschlüsselung nur für die Führungskraft | M | Baum (vorhanden) |
| **N9** | Startbildschirm nach 2.7 | Streak + „12 / 20 AP" + nächste Handlung nach oben | S | N1, N2 |
| **N10** | Push „Streak in Gefahr" 17:00 | Zweiter Cron-Eintrag | S | N1, N2, A2 |
| **N11** | Push „2 Werktage ohne AP" an die Führungskraft | Nah an `stille` (5 Tage, `lib/signale.ts:19`), aber schärfer | S | — |
| **N12** | Push einzeln abschaltbar | Heute alles-oder-nichts | M | G7 |
| **N13** | Test-Läufer | Kein `test`-Skript vorhanden | S | R2 |

### Vorhanden und passt

| Baustein | Beleg |
|---|---|
| Zentrale Punktetabelle | `lib/labels.ts:34` |
| Punkte abgeleitet, nie gespeichert | `lib/arena.ts:54` |
| Tag/Woche an genau einer Stelle | `lib/dates.ts` |
| Push-Infrastruktur | `lib/push.ts`, `PushAbo` |
| Team-Baum | `lib/struktur.ts`, `User.path` |
| Inaktivitäts-Erkennung | `lib/signale.ts:19` |
| Anruf zählt unabhängig vom Ergebnis | `app/(app)/contacts/results.ts` |
| Kein Dashboard auf dem Startbildschirm | `app/page.tsx` |
| Keine Badges, keine manuelle Vergabe | nicht vorhanden |
| Schalter je Baustein | `lib/features.ts:18` |
| Mobile-first | `components/ui.ts`, durchgängig `min-h-11` |

---

## 3.2 Grundsatzfrage: Umbau oder neues Ereignis-Log?

**Entscheidung: Umbau. `DailyLog` bleibt das Ereignis-Log.**

Begründung, in der Reihenfolge des Gewichts:

1. **`DailyLog` ist bereits das, was gefordert wird — bis auf ein Merkmal.** Es
   ist zentral, es ist im Normalbetrieb append-only, es trägt `personId`, `type`,
   `count`, `date` und `createdAt`, und alle Auswertungen leiten sich daraus ab.
   Es fehlt genau eine Eigenschaft: Unveränderlichkeit. Die stellt man mit einer
   Gegenbuchung her — an **zwei** Stellen (`log/actions.ts:59`, `undo.ts:192`),
   nicht in einem Neubau.

2. **Neun Schreibstellen hängen daran** (Liste in 1.1). Ein zweites Log hieße:
   alle neun doppelt schreiben, oder alle neun umstellen und dabei die
   Doppelzähl-Sperren (`appointmentLoggedAt` & Co.) neu erfinden. Ein zweites
   Log, das eine Weile parallel läuft, ist genau die „zweite Wahrheit", vor der
   dieses Projekt an mehreren Stellen ausdrücklich warnt.

3. **Die Historie ist die Sache, um die es geht.** Ein neues Log startet leer.
   Serien, Bestmarken und die Rangliste wären auf null — bei einem System, dessen
   ganzer Zweck die *fortlaufende* Aktivität ist, ist das teurer als jeder
   technische Vorteil. `DailyLog` trägt die einzige Historie, die existiert.

4. **Der Umbau ist kleiner, als er klingt.** Konkret: `REFERRAL` ins Enum
   (Migration, additiv), `quotaTypePoints` neu belegen (fünf Zahlen),
   Gegenbuchung statt `deleteMany` (zwei Stellen), Zielfeld an `User`
   (additiv), Freeze/Abwesenheit als eigene Ereignisse. Kein einziger
   destruktiver Schritt.

**Ein Vorbehalt, der zum Umbau gehört:** `DailyLog.count` ist eine *Menge*, kein
Einzelereignis — eine Zeile kann „7 Anrufe" bedeuten. Für AP ist das
gleichwertig (7 × 2 AP), für „welcher Anruf genau wann" nicht. Das Zielbild
verlangt Letzteres nirgends. Sollte es später gebraucht werden, ist
`createdAt` je Zeile bereits da.

---

## 3.3 Umsetzungsreihenfolge

Ich weiche von der vorgeschlagenen Reihenfolge in **einem** Punkt ab: die
Widersprüche (Schritt 0) gehören **vor** alles andere. Ein Tagesziel auf einer
Punktetabelle zu bauen, die anschließend umgestellt wird, heißt zweimal bauen —
und die Umstellung schreibt die Historie ohnehin rückwirkend um.

### Schritt 0 — Widersprüche auflösen *(vor jeder neuen Funktion)*

Rein entscheidend, kaum Code. Betrifft G1–G5, G7.

- Punktetabelle neu belegen, `DEAL_WON` auf 0 oder raus (`lib/labels.ts:34`)
- `REFERRAL` ins Enum, `lib/empfehlungen.ts:68` umstellen (additive Migration)
- Löschen → Gegenbuchung (`app/(team)/log/actions.ts:59`, `lib/undo.ts:189-195`)
- Entscheidung zu Anwesenheits-Punkt (G2) und Stufen (G3) umsetzen
- Rangliste vom globalen auf den Ast einschränken (G4)

**Checkpoint:** `scripts/nullmessung.mjs` und ein neues `scripts/ap-probe.mjs`
zeigen für jeden Kopf die alten und die neuen AP nebeneinander. Kein
`DEAL_WON` mehr in der Wertung. Eine gelöschte Zeile hinterlässt eine
Gegenbuchung. `next build` grün.
**Aufwand: S–M. Risiko: sozial, nicht technisch** — die Rangliste sieht danach
anders aus.

### Schritt 1 — Punktelogik konsolidieren *(ohne UI)*

Betrifft N7 (Rest), Vorbereitung für alles Weitere.

- Eine Funktion `apFuer(logs)` als einzige Rechenstelle, ersetzt die verstreuten
  `count * quotaTypePoints[type]`-Ausdrücke (`lib/arena.ts:97`, `:151`, `:222`,
  `lib/fuehrung.ts:375`, `app/(team)/leaderboard/page.tsx`)
- Konfiguration bündeln: Punktetabelle, Tagesziel-Standard, Freeze-Regeln,
  Werktage — in `lib/labels.ts` oder einer neuen `lib/ap-konfig.ts`

**Checkpoint:** Kein Aufruf von `quotaTypePoints` mehr außerhalb der einen
Datei (per `grep` prüfbar). Rangliste zeigt dieselben Zahlen wie vorher.
**Aufwand: S.** Dateien: `lib/labels.ts`, `lib/arena.ts`, `lib/fuehrung.ts`,
`app/(team)/leaderboard/page.tsx`.

### Schritt 2 — Tagesziel und Streak *(mit Tests)*

Betrifft N1–N6, N13. **Der größte und heikelste Schritt.**

- `User.dailyGoal` (Standard 20, 10–60), Einstellfläche, Empfehlung der
  Führungskraft als separates Feld
- `streakDays()` (`lib/stats.ts:5`) ersetzen durch eine Funktion, die Tagesziel,
  Werktage, Freezes, Reparatur und Abwesenheit kennt
- Freeze-Verbrauch und Abwesenheit als **Ereignisse im selben Log**, nicht als
  Zähler an `User` — siehe Umsetzungsnotiz zu 2.3
- Test-Läufer einführen (R2)

**Checkpoint — hier ist der Test nicht verhandelbar.** Abgedeckt sein müssen:
Wochenende bricht nicht; Freeze wird automatisch verbraucht und ist bei 2/Monat
erschöpft; Reparaturfenster 24 h und 1×/Monat; Abwesenheit pausiert bis 14 Tage;
Sommerzeitumstellung (letzter Sonntag im März und Oktober) verschiebt keine
Tagesgrenze. Die Umstellungs-Fälle sind aus der Praxis der wichtigste Teil.
**Aufwand: L.** Dateien: `lib/stats.ts` (Ersatz), `prisma/schema.prisma`,
neue Migration, `lib/dates.ts` (unverändert, aber Grundlage).

### Schritt 3 — Startbildschirm

Betrifft N9.

- Streak-Zähler, dann „12 / 20 AP", dann die nächste Handlung mit Absprung
- Die vier bedingten Blöcke (`app/(app)/heute/page.tsx:209-230`) unter die
  Zielkarte
- Formulierung von Restarbeit auf Fortschritt drehen

**Checkpoint:** Auf 375 px Breite stehen Streak, Ziel und nächste Handlung
**ohne Scrollen** über der Falz. Bei leerem Datenstand keine leeren Kästen.
**Aufwand: S–M.** Dateien: `app/(app)/heute/page.tsx`.

### Schritt 4 — Team-Wochenziel und Inaktivitäts-Signal *(Ebene 3)*

Betrifft N8, N11. **Vorgezogen vor die Liga**, weil der Baum bereits steht und
die Liga bei 3 Köpfen nicht baubar ist.

- Wochenziel je Führungskraft, gemeinsamer Balken für alle im Ast
- Aufschlüsselung je Person nur für die Führungskraft
- „2 Werktage ohne AP" als schärferes Signal neben `stille` (5 Tage)

**Checkpoint:** Ein Partner sieht den Balken, aber keine Zahlen anderer.
Die Führungskraft sieht beides. `lib/scope.ts` durchgesetzt, nicht
handgeschriebene `where`-Klauseln.
**Aufwand: M.** Dateien: `prisma/schema.prisma`, `lib/fuehrung.ts`,
`lib/signale.ts`, `app/(app)/mannschaft/page.tsx`, `app/(app)/heute/page.tsx`.

### Schritt 5 — Benachrichtigungen

Betrifft G7, N10, N12. **Bewusst zuletzt** — erst muss es etwas zu verteidigen
geben.

- Zentrale Drossel in `lib/push.ts`: max. 1/Tag/Person, Ruhezeit 21–08,
  Streak-Trigger gewinnt bei Konflikt
- Zweiter Cron um 17:00 (A2)
- Einzeln abschaltbar

**Checkpoint:** Zwei Auslöser am selben Tag ergeben **eine** Zustellung, und
zwar die des Streaks. Eine Meldung um 21:30 wird nicht zugestellt. Prüfbar über
ein Skript gegen die echte Datenbank, ohne zu senden.
**Aufwand: M.** Dateien: `lib/push.ts`, `app/api/cron/meldungen/route.ts`,
`vercel.json`, `components/Meldungen.tsx`.

### Schritt 6 — Wochenliga *(zurückgestellt)*

Erst ab ~24 aktiven Köpfen. Bis dahin trägt der Zweikampf.
**Checkpoint für den Start:** `scripts/nullmessung.mjs` meldet ≥ 24 aktive
Logger pro Woche.

---

## Annahmen und Rückfragen

Ich habe nichts davon still entschieden.

### ANNAHME A1 — Abbildung der Punktetabelle
Die fünf Zielbild-Zeilen bilden auf die vorhandenen Typen ab wie in der Tabelle
unter 2.2. Insbesondere: „Neuer Kontakt erfasst" = `NUMBERS_PULLED`, und
„Empfehlung erhalten" wird ein **neuer** Typ statt wie heute als Nummer gebucht.

### ANNAHME A2 — Cron-Auflösung
Für „17:00 lokal an Werktagen" braucht es einen zweiten Eintrag in
`vercel.json`. Der Vercel-Hobby-Tarif begrenzt Crons; ob zwei Einträge zulässig
sind, habe ich **nicht verifiziert**. Falls nicht: ein Cron um 15:00 UTC, der
beide Aufgaben erledigt.

### RÜCKFRAGE R1 — Zeitzone
Leitplanke 2.9 verlangt die lokale Zeitzone je Partner. Heute ist Europe/Berlin
fest verdrahtet (`lib/dates.ts:5`). **Ich empfehle, dabei zu bleiben.** Mehrere
Zeitzonen machen jede Tages- und Wochengrenze mehrdeutig, für ein Netz, das in
einer Zeitzone arbeitet. Soll ich umbauen?

### RÜCKFRAGE R2 — Tests
Es gibt keinen Test-Läufer (`package.json`, kein `test`-Skript). Vitest
einführen, oder beim vorhandenen Muster bleiben (reine Funktionen plus
Prüfskript in `scripts/`, wie `scripts/logik-probe.mjs`)? Für die
Streak-Regeln empfehle ich **Vitest** — die Fälle sind zu viele für ein Skript.

### RÜCKFRAGE R3 — Welche Push-Auslöser fallen weg?
2.6 sagt „nur diese Trigger, keine weiteren". Damit fielen Abschluss-Meldung,
Meilenstein-Meldung und **Peer-Nachricht** weg. Bei der Peer-Nachricht halte
ich das für falsch: sie ist eine Antwort von Mensch zu Mensch, keine
Systemmeldung. Ausnehmen?

### RÜCKFRAGE R4 — Anwesenheits-Punkt *(entscheidet über Gebautes)*
2.3 sagt ausdrücklich „nicht: App geöffnet". Am 25.08. wurde genau das gebaut
(1 AP fürs Öffnen, `lib/anwesenheit.ts:30`) — auf deine Entscheidung hin.
Streichen, oder bleibt er als bewusste Abweichung?

### RÜCKFRAGE R5 — Stufen und Storno-Freischaltung *(entscheidet über Gebautes)*
2.8 sagt „keine Level". Am 25.08. wurden Stufen gebaut (`lib/stufen.ts`), und
die Storno-Freischaltung hängt daran (`lib/freischaltung.ts`, `/spiel`).
Zurückbauen? Falls ja: soll die Freischaltung an etwas anderem hängen — etwa an
der Streak-Länge statt an einer Stufe?

### RÜCKFRAGE R6 — Umgang mit der rückwirkenden Umschreibung
`DEAL_WON` auf 0 zu setzen ändert **jede vergangene Rangliste**. Wer heute
führt, führt danach vielleicht nicht mehr. Soll das angekündigt werden, und
soll ein Stichtag gelten (Gewichte mit Gültigkeitsdatum), oder ist der harte
Schnitt in Ordnung?

---

## Ende Schritt 3

Hier halte ich an, wie im Auftrag vorgesehen. **Kein Produktivcode geschrieben.**
Für Schritt 0 brauche ich die Antworten auf R4, R5 und R6 — sie entscheiden über
Code, der seit heute Vormittag läuft.
