# Wettbewerbs-Plan (Ergo CRM)

Stand: 20.08.2026 — Planungsdokument, noch nicht implementiert.

Ziel: Aus einer Tabelle mit Namen und Zahlen wird ein Ort, an dem man die anderen
**spürt**. Heute beantwortet die Rangliste genau eine Frage: *wer ist vorn.* Sie beantwortet
nicht *was hat das mit mir zu tun*, nicht *was passiert gerade* und nicht *was mache ich
jetzt damit*. Genau diese drei Lücken werden gefüllt.

Zwei Leitsätze tragen den ganzen Plan:

> **Der Witz geht auf den Beruf, nie auf den Letzten.**
> Satire über Storno, Strukki und den Außendienst — ja. Ein Mensch, der öffentlich als
> Schlusslicht dasteht — nie. Der Tag, an dem sich jemand hier ausgelacht fühlt, ist der
> Tag, an dem er aufhört zu loggen. Und dann ist der Wettbewerb tot.

> **Was gemessen wird, wird frisiert, sobald es zählt.**
> Deshalb kommt Fairness *vor* den Duellen, nicht danach. Ein Duell um selbst getippte
> Zahlen ist kein Wettbewerb, sondern ein Tippwettbewerb.

---

## 0. Ausgangslage

| Was es gibt | Wo |
|---|---|
| `/log` — eigene Zahlen, drei Schnellzähler, Serie | `app/(team)/log/page.tsx` |
| `/leaderboard` — Podium, Tabelle, Heute/Woche/Monat, Serien-Flamme | `app/(team)/leaderboard/page.tsx` |
| `Person` (Wettbewerbs-Identität, 1:1 zum Konto) + `DailyLog` (Tag, Art, Anzahl) | `prisma/schema.prisma` |
| Punkte: Abschluss ×5, alles andere ×1 | `lib/labels.ts` |
| Struktur-Baum, Mannschaft, Frühwarn-Signale | Bauabschnitte 0–4 aus `struktur-plan.md` |
| Storno-Spiel unter `/storno`, bewusst öffentlich | `public/storno.html` |

Was fehlt, ist nicht Grafik, sondern **Gegenüber**: Es gibt niemanden, gegen den man gerade
spielt, nichts, was zwischen zwei Aufrufen passiert, und keine Möglichkeit, auf das zu
antworten, was ein anderer geleistet hat. Eine Rangliste ohne diese drei Dinge liest man
zweimal und danach nie wieder.

---

## 1. Grundentscheidungen

| Thema | Entscheidung |
|---|---|
| Register | **Sportreportage, trocken.** Anpfiff, Spieltag, Zwischenstand, Abpfiff. Kein Gamer-Vokabular — kein XP, kein Level-up, keine Combo |
| Humor | Geht auf **den Beruf**, nie auf eine Person. Der Kommentator ist eine neutrale Stimme; „Strukki" bleibt im Storno-Spiel, wo er hingehört |
| Optik | **Keine Emojis, kein Konfetti.** Stilisierte Linienzeichen wie bisher. Den Spaß macht der Ton, nicht die Deko |
| Gegner | **Der Nachbar in der Tabelle**, nicht der Erste. Vier Punkte auf Platz 5 sind ein Rennen; 300 Punkte auf Platz 1 sind eine Mauer |
| Rhythmus | **Woche = Spieltag** (Montag Anpfiff, Freitag 18 Uhr Abpfiff), **Monat = Saison**. Ohne Abpfiff gewinnt auf Dauer, wer im Januar am fleißigsten war |
| Sichtbarkeit | Unverändert: **nur Namen und Zahlen.** Keine Kundendaten, keine Euro-Beträge, keine Provision |
| Teilnahme | Wer nichts loggt, taucht **nicht** auf. Kein Pranger, keine Abwesenheitsmeldung |
| Live-Gefühl | **Nachladen im Takt** (30 s, nur bei sichtbarem Tab). Bewusst **kein Supabase Realtime**: das hieße Anon-Key im Browser plus RLS — eine neue Angriffsfläche für ein Gefühl, dem 30 Sekunden Verzögerung nichts ausmachen |
| Texte | **Feste Bausteine mit Platzhaltern**, regelbasiert ausgewählt. Kein LLM zur Laufzeit: Kosten, Wartezeit — und ein Modell, das über echte Kollegen witzelt, ist genau einmal daneben zu viel |
| Freitext zwischen Partnern | **Gibt es nicht.** WhatsApp ist da. Wer Kommentare einbaut, hat Moderation am Hals — für immer |

---

## 2. Die fünf Hebel

### 2.1 Der Nachbar statt das Podium

Das Podium zeigt drei Leute. Für alle anderen ist es eine Wand. Der Umbau:

- **Deine Zeile klebt.** Sie bleibt beim Scrollen sichtbar, egal auf welchem Platz.
- **Der Zweikampf-Block:** *über dir · du · unter dir* — mit dem einen Satz, der zählt:
  „**7 Punkte auf Sarah. Das sind sieben Anrufe.**" Der Abstand wird in *Handlungen*
  umgerechnet, nicht in Punkten. Punkte sind abstrakt, sieben Anrufe sind ein Nachmittag.
- **Überholt.** Wer vorbeigezogen wird, sieht es beim nächsten Aufruf — einmal, ruhig, ohne
  Ausrufezeichen. Wer überholt hat, sieht es auch.
- **Persönliche Bestmarke** als zweite Messlatte: „Beste Woche: 84. Aktuell: 71." Wer nie
  Erster wird, kann trotzdem gewinnen — gegen sich selbst.

### 2.2 Der Puls

Ein schmaler Streifen über der Tabelle: **„Heute schon dran: 6 von 11."** Dazu die letzten
Zeitstempel („vor 4 Minuten"). Das ist der ganze Grund, warum man zweimal am Tag reinschaut:
Man will wissen, ob die anderen gerade arbeiten.

Die Seite lädt sich alle 30 Sekunden selbst nach, solange der Tab sichtbar ist. Wandert die
Zahl während man draufschaut von 6 auf 7, entsteht genau das Gefühl, um das es in diesem
Plan geht — und es kostet keine Zeile Infrastruktur.

### 2.3 Das Echo

Ein Feed: **was heute lief.** Nicht jeder Klick — das wäre Rauschen —, sondern nur
Ereignisse: Tagesziel erreicht, Abschluss, Serie erreicht, Rangwechsel, Duell entschieden,
Titel vergeben, Rückkehr nach stillen Tagen.

Darauf kann man **antworten, ohne zu tippen**: vier feste Reaktionen.

| Reaktion | Wofür |
|---|---|
| **Respekt** | die neutrale, immer passende |
| **Stark** | die begeisterte |
| **Konter** | „Das hol ich mir zurück" — der kompetitive Knopf |
| **Kopf hoch** | für Storno und geplatzte Termine |

Feste Bausteine statt Freitext lösen drei Probleme auf einmal: keine Moderation, keine
Rechtschreibung, keine Missverständnisse — und sie sind mit dem Daumen in einer Sekunde
gedrückt. **Konter** ist dabei der wichtigste Knopf des ganzen Plans: er verwandelt eine
fremde Bestleistung in eine eigene Ansage.

### 2.4 Das Duell

Der Kern. **A fordert B**, auf eine Art oder auf Gesamtpunkte, für einen Tag oder eine
Woche. B nimmt an oder lässt es verfallen. Läuft ein Duell, steht es über allem: zwei Namen,
ein Balken, eine Restzeit.

Was das ändert: In einer Rangliste mit elf Leuten hat man zehn Gegner und deshalb keinen. Im
Duell hat man **einen** — und ein Ergebnis mit Datum. Die Head-to-Head-Bilanz („**4:2 gegen
Marc**") bleibt über Saisons hinweg stehen. Das ist die Zeile, über die im Auto geredet wird.

Regeln: 24 Stunden zum Annehmen, sonst verfällt die Forderung geräuschlos. Höchstens zwei
laufende Duelle je Person — sonst ist es kein Duell mehr, sondern wieder eine Rangliste. Der
Stand wird während des Duells live gerechnet und beim Abpfiff **eingefroren** (dasselbe
Prinzip wie der `snapshot` im 1:1-Journal: ein Nachtrag darf kein Ergebnis kippen).

### 2.5 Die Dramaturgie

Ohne Zeitdruck ist eine Rangliste eine Statistik.

- **Anpfiff Montag**, Punkte auf null, Kommentator eröffnet den Spieltag.
- **Abpfiff Freitag 18 Uhr**, ab Donnerstag läuft die Restzeit sichtbar mit.
- **Wochenkarte** danach: dein Spieltag in fünf Zahlen, dein Duell-Ergebnis, dein Titel.
- **Saison = Monat.** Zum Monatswechsel: Punkte zurück auf null, Titel und Head-to-Head
  bleiben. Jeder startet wieder bei null — der stärkste Motivationsmechanismus, den es gibt.

---

## 3. Titel: mehrere Wege, vorn zu sein

Punkte belohnen Volumen. Wer zwölf Stunden telefoniert, gewinnt — und wer gut ist, aber
weniger Zeit hat, hört auf mitzuspielen. Dagegen helfen wöchentliche Titel, die **andere
Fähigkeiten** messen. Vergeben beim Abpfiff, gültig eine Woche, danach wieder frei.

| Titel | Bedingung | Was er sagt |
|---|---|---|
| **Türöffner** | beste Quote Anruf → Termin (min. 20 Anrufe) | Du kannst Gespräche |
| **Der Hartnäckige** | meiste Anrufe an einem einzigen Tag | Du hast durchgezogen |
| **Frühschicht** | am häufigsten die erste Aktivität des Tages im Netzwerk | Du fängst an, wenn andere Kaffee holen |
| **Der Verlässliche** | fünf von fünf Werktagen geloggt | Nicht spektakulär. Entscheidend |
| **Abschlussstark** | beste Quote gehaltener Termin → Abschluss (min. 4 Termine) | Du machst es fertig |
| **Aufsteiger** | größter Ranggewinn zur Vorwoche | Du hast den Schalter umgelegt |
| **Stehaufmännchen** | nach mindestens drei stillen Tagen wieder eine volle Woche | Der ehrlichste Titel von allen |

Die Mindestmengen sind kein Detail: ohne sie gewinnt „Türöffner", wer zwei Anrufe gemacht
und einen Termin bekommen hat. Sie gehören als Konstanten an **eine** Stelle, genau wie die
Schwellwerte in `lib/signale.ts`.

---

## 4. Fairness — vor allem anderen

Sobald eine Zahl etwas wert ist, wird sie schöner. Das ist keine Unterstellung, sondern der
Normalfall — und es zerstört den Wettbewerb lautlos, weil niemand widerspricht.

| Maßnahme | Umsetzung |
|---|---|
| **Herkunft sichtbar machen** | `DailyLog.activityId` ist bereits gesetzt, wenn der Eintrag aus einer echten CRM-Aktivität entstanden ist. Also: „71 Punkte, **davon 58 aus dem CRM**". Kein Vorwurf, nur Licht — und das reicht vollkommen |
| **Tageskappen** | Anrufe 120, Nummern 200, Termine vereinbart 15 je Tag. Alles darüber ist kein Fleiß, sondern ein Tippfehler oder ein Spiel |
| **Nachtragsfenster** | Manuelles Loggen nur für **heute und die zwei Vortage**. Heute steht im Formular jedes beliebige vergangene Datum offen — damit lässt sich am Freitagabend eine ganze Woche erfinden |
| **Quoten statt nur Volumen** | Die Titel aus Abschnitt 3 messen Verhältnisse. Wer Anrufe erfindet, ruiniert damit die eigene Türöffner-Quote |
| **Duell-Stand einfrieren** | Nach dem Abpfiff ändert kein Nachtrag mehr ein Ergebnis |

**Was ausdrücklich nicht gebaut wird:** Sperren, Prüfroutinen, eine Meldefunktion,
Auffälligkeits-Warnungen an die Führungskraft. Das Werkzeug wird kein Aufpasser. Sichtbare
Herkunft erledigt das sozial — und zwar besser.

---

## 5. Die Punktegewichte gehören auf den Prüfstand

Heute: Anruf 1, Nummer 1, Termin vereinbart 1, Termin gehalten 1, **Abschluss 5**.

Damit sind fünf Anrufe so viel wert wie ein Abschluss, und ein gehaltener Termin so viel wie
eine gezogene Nummer. Das steuert in die falsche Richtung: Die Rangliste belohnt den Anfang
des Trichters, während die eigentliche Arbeit hinten passiert.

**Vorschlag:**

| Art | heute | Vorschlag |
|---|---|---|
| Anruf | 1 | 1 |
| Nummer gezogen | 1 | 1 |
| Termin vereinbart | 1 | **3** |
| Termin gehalten | 1 | **5** |
| Abschluss | 5 | **10** |

**Achtung, technischer Nebeneffekt:** Punkte werden nirgends gespeichert, sondern bei jeder
Anzeige aus `quotaTypePoints` gerechnet. Eine Änderung schreibt also **alle vergangenen
Ranglisten rückwirkend um.** Deshalb: einmal umstellen, **vor** dem ersten Spieltag mit
Duellen — und danach nicht mehr anfassen. Wer später nachjustieren will, braucht Gewichte mit
Gültigkeitsdatum; das ist Aufwand für ein Problem, das man vermeiden kann.

---

## 6. Der Kommentator

Eine Stimme, die den Stand in einem Satz zusammenfasst. Regelbasiert aus festen Bausteinen —
zur Lage passend ausgewählt, mit Platzhaltern gefüllt. So klingt es:

- „Neuer Erster: **Marc**. Sarah hatte die Woche über geführt — bis 14:20 Uhr."
- „Zwischen Platz 1 und Platz 3 liegen **9 Punkte**. Das entscheidet ein einziger Nachmittag."
- „**Sarah** loggt den **12. Tag** in Folge. Irgendwann ist das keine Serie mehr, sondern ein
  Charakterzug."
- „Erster Abschluss für **Jonas**. Den zweiten vergisst man, den ersten nie."
- „**Abpfiff in 3 Stunden.** Wer noch was vorhat, hat noch was vor."
- „**Marc** fordert **Sarah**. Bis Freitag 18 Uhr, Anrufe zählen. Sarah hat 24 Stunden."
- „Ruhiger Vormittag im Netzwerk: **4 von 11** waren schon dran."
- „**71 Punkte** diese Woche — deine beste Woche stand bei 84. Fehlen 13."

Eine Regel steht über allen:

> **Der Kommentator nennt nie jemanden, der nichts getan hat.**
> Er berichtet Ereignisse, niemals Abwesenheit. „X war heute noch nicht da" gibt es in genau
> einer Variante — als Satz an **X selbst**, auf dessen eigener Seite. Das ist exakt die
> Grenze zwischen witzig und Pranger.

---

## 7. Datenmodell

Vier neue Modelle, zwei Felder mehr an `Person`. Alles andere wird aus `DailyLog` gerechnet.

```prisma
// Kuratierter Ereignis-Strom. Bewusst NICHT jeder Klick: der eindeutige Index
// laesst je Person, Art und Tag genau eine Zeile zu. Ohne das ist der Feed nach
// einer Woche Rauschen, und Reaktionen darauf sind wertlos.
model FeedEvent {
  id        String     @id @default(cuid())
  personId  String
  person    Person     @relation(fields: [personId], references: [id], onDelete: Cascade)
  kind      FeedKind
  day       DateTime   // Berliner Kalendertag, wie DailyLog.date
  value     Int?       // die Zahl im Text ("3 Termine", "12 Tage")
  meta      Json?      // Gegner-Id beim Duell, Titel-Schluessel, alter/neuer Rang
  createdAt DateTime   @default(now())
  reactions Reaction[]

  @@unique([personId, kind, day])
  @@index([createdAt])
}

enum FeedKind {
  TAGESZIEL     // Soll erfuellt
  ABSCHLUSS
  ERSTER_ABSCHLUSS
  SERIE         // 5 / 10 / 25 Tage
  UEBERHOLT     // Rangwechsel
  DUELL_START
  DUELL_ENDE
  TITEL         // Wochen-Auszeichnung
  RUECKKEHR     // nach stillen Tagen wieder geloggt
  BESTMARKE     // eigene beste Woche uebertroffen
}

// Eine Reaktion je Person und Ereignis. Kein Freitext - siehe Abschnitt 1.
model Reaction {
  id           String       @id @default(cuid())
  eventId      String
  event        FeedEvent    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  fromPersonId String
  from         Person       @relation(fields: [fromPersonId], references: [id], onDelete: Cascade)
  kind         ReactionKind
  createdAt    DateTime     @default(now())

  @@unique([eventId, fromPersonId])
  @@index([eventId])
}

enum ReactionKind {
  RESPEKT
  STARK
  KONTER
  KOPF_HOCH
}

model Duel {
  id              String     @id @default(cuid())
  challengerId    String
  challenger      Person     @relation("Fordert", fields: [challengerId], references: [id], onDelete: Cascade)
  opponentId      String
  opponent        Person     @relation("Gefordert", fields: [opponentId], references: [id], onDelete: Cascade)

  metric          QuotaType? // null = Gesamtpunkte
  startDay        DateTime
  endDay          DateTime
  status          DuelStatus @default(OFFEN)

  // Beim Abpfiff eingefroren. Danach aendert kein Nachtrag mehr das Ergebnis.
  challengerScore Int?
  opponentScore   Int?

  acceptedAt      DateTime?
  decidedAt       DateTime?
  createdAt       DateTime   @default(now())

  @@index([challengerId, status])
  @@index([opponentId, status])
  @@index([status, endDay])
}

enum DuelStatus {
  OFFEN        // Forderung steht, 24 h
  LAEUFT
  ENTSCHIEDEN
  ABGELEHNT
  VERFALLEN    // nicht angenommen
}

// Wochentitel. Der eindeutige Index verhindert Doppelvergabe, wenn zwei Leute
// gleichzeitig die Seite oeffnen und beide den Wochenabschluss ausloesen.
model Award {
  id        String   @id @default(cuid())
  personId  String
  person    Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  key       String   // "tueroeffner", "hartnaeckig", ...
  weekStart DateTime
  value     Int?     // die Zahl hinter dem Titel (Quote in Promille, Anzahl, ...)
  createdAt DateTime @default(now())

  @@unique([key, weekStart])
  @@index([personId, weekStart])
}

model Person {
  // bestehend: id, name, userId, createdAt, dailyLogs

  lastRank    Int?      // fuer "du wurdest ueberholt" - ohne Cron erkennbar
  lastRankAt  DateTime?
  motto       String?   // aus fester Liste WAEHLBAR, nicht tippbar
  feedSeenAt  DateTime? // fuer den Punkt am Feed-Reiter
}
```

**Kein Cron.** Vercel Hobby kann nur täglich, und ein Lauf, der einmal ausfällt, verschluckt
einen ganzen Spieltag. Stattdessen **beim ersten Aufruf nach Ablauf**: Wer nach Freitag
18 Uhr als Erster die Seite öffnet, löst den Wochenabschluss aus — Duelle entscheiden, Titel
vergeben, Ereignisse schreiben, alles in einer Transaktion. Die eindeutigen Indizes machen
den Doppelaufruf harmlos. Dasselbe Muster für den Saisonwechsel.

**Der Punktestand selbst wird weiterhin nicht gespeichert**, sondern aus `DailyLog`
gerechnet. Eingefroren wird nur, was ein Ergebnis ist: Duell-Stände und Titel.

---

## 8. Oberfläche

**`/leaderboard` — von oben nach unten:**

1. Kommentator-Zeile + Restzeit bis zum Abpfiff
2. Laufendes Duell (falls vorhanden) — zwei Namen, ein Balken, Restzeit
3. Puls-Streifen: „Heute schon dran: 6 von 11"
4. Podium (bleibt)
5. **Zweikampf-Block:** über dir · du · unter dir, mit Abstand in Handlungen
6. Volle Tabelle
7. Feed „Was heute lief" mit Reaktionsknöpfen
8. **Deine Zeile klebt** am unteren Rand, solange sie nicht sichtbar ist

**`/log` — bleibt die Arbeitsfläche**, bekommt drei Ergänzungen: Puls-Streifen, „Fordern"-Knopf
neben jedem Namen aus der Rangliste, und die eigene Bestmarke als zweite Messlatte.

Mobil zuerst: Alles muss mit dem Daumen erreichbar sein, die Reaktionsknöpfe mindestens
44 px hoch — wie im restlichen CRM (`min-h-11`).

---

## 9. Bauabschnitte

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 0 | **Fairness**: Tageskappen, Nachtragsfenster, Herkunft aus dem CRM sichtbar | Zahlen, auf die man wetten kann |
| 1 | **Punktegewichte** umstellen (Abschnitt 5) | Einmalig, vor allem anderen |
| 2 | **Rangliste, die dich meint**: Ich-Zeile klebt, Zweikampf-Block, Bestmarke, Kommentator, Abpfiff-Restzeit | Ohne Schema-Änderung sofort spürbar |
| 3 | **Puls**: „heute schon dran", Selbst-Nachladen | Man merkt, dass da andere sind |
| 4 | **Feed** (`FeedEvent`) + Wochenabschluss beim ersten Aufruf | Es passiert etwas |
| 5 | **Echo**: Reaktionen auf Ereignisse | Man antwortet einander |
| 6 | **Duelle** (`Duel`), Head-to-Head-Bilanz | **Hier wird aus Vergleich ein Spiel** |
| 7 | **Spieltag & Titel** (`Award`), Wochenkarte, Saisonwechsel | Mehrere Wege, vorn zu sein |
| 8 | **Mannschaftswertung** über den Struktur-Baum, Schnitt je Kopf | Teams gegen Teams |
| 9 | **Storno-Andockung**: getrennte Spaß-Liga, Duell-Link | Der Spaßteil dockt an |
| 10 | **Ligen/Divisionen**, erst ab ~16 aktiven Köpfen | Platz 14 ist wieder ein Platz 3 |

**Nach Schritt 6 ist es ein anderes Produkt.** 0–1 sind Hausaufgaben, 2–3 sind billig und
wirken sofort, 4–6 sind der eigentliche Bau. Alles ab 7 macht aus einem Spiel eine Saison.

> **Kurswechsel 20.08.:** Diese Reihenfolge bleibt als **Bau**-Reihenfolge gültig, nicht mehr
> als **Ausliefer**-Reihenfolge. Ausgeliefert wird nach Abschnitt 14: alles auf einmal,
> gemeinsam eröffnet, danach entscheidet die Mannschaft, was bleibt.

---

## 10. Bewusst nicht gebaut

| Was | Warum |
|---|---|
| Freitext-Kommentare, Chat | Moderation wird unser Problem — dauerhaft. WhatsApp existiert |
| Öffentliche Schlusslicht-Anzeige, Abstiegs-Pranger | Siehe Leitsatz. Der untere Tabellenteil bleibt sichtbar, aber ohne Zuspitzung |
| Push-Benachrichtigungen | Braucht Web-Push-Dienst und Einwilligung. Der Puls im Tab reicht |
| Euro-Beträge, Provisionsvergleich | Wie im `struktur-plan`: falsche Zahlen zu Geld sind teurer als kein Feature |
| Wetten mit Einsatz | Glücksspiel-Nähe und arbeitsrechtlich heikel. Duelle gehen um Ehre |
| Emojis, Konfetti, XP-Balken, Level | Der Ton macht den Spaß. Storno hat gezeigt, dass Emojis hier kindisch wirken |
| LLM-Sprüche zur Laufzeit | Kosten, Wartezeit, und ein daneben liegender Witz über einen echten Kollegen |
| Supabase Realtime | Anon-Key im Browser plus RLS für 30 Sekunden Vorsprung |
| Automatische Meldung an die Führungskraft („X hat sein Duell verloren") | Macht aus dem Wettbewerb ein Kontrollinstrument. Dafür gibt es `/mannschaft` |
| Wettbewerbs-Zahlen im Bericht nach oben | `/report` bleibt, wie es ist |

---

## 11. Offene Punkte

| # | Frage | Angenommener Default |
|---|---|---|
| 1 | Punktegewichte umstellen? | **Ja**, einmalig auf 1/1/3/5/10, vor dem ersten Spieltag |
| 2 | Eine Liga oder Divisionen? | Eine Liga. Divisionen ab ~16 aktiven Köpfen (Schritt 10) |
| 3 | Wer darf wen fordern? | Jeder jeden — auch quer durch die Struktur |
| 4 | Duell-Dauer | Woche (Mo–Fr) **und** Tagesduell bis Mitternacht |
| 5 | Unbeantwortete Forderung | Verfällt nach 24 h, geräuschlos, kein Feed-Eintrag |
| 6 | Wer sieht Reaktionen? | Alle. Zähler an der Zeile, Namen beim Aufklappen |
| 7 | Anstupsen („fehlst du heute?") | **Erst mal nicht.** Kippt zu leicht in Kontrolle. Wenn, dann höchstens 1 × je Empfänger und Tag, fester Text, abschaltbar |
| 8 | Spruch am eigenen Namen | Aus fester Liste **wählbar**, nicht tippbar — Spaß ohne Moderation |
| 9 | Was überlebt den Saisonwechsel? | Titel und Head-to-Head-Bilanz. Punkte gehen auf null |
| 10 | Mannschaftswertung: Summe oder Schnitt? | **Schnitt je aktivem Kopf** — sonst gewinnt immer die größte Mannschaft |
| 11 | Storno-Punkte in die Arbeitswertung? | **Nein.** Getrennte Spaß-Liga, sonst ist die Arbeitswertung wertlos |
| 12 | Wochen-Zusammenfassung per Mail | Später, wenn ein Versandweg steht. Die Wochenkarte in der App kommt zuerst |
| 13 | Darf jemand ganz aussteigen? | Loggen ist freiwillig, wer nichts loggt, steht nicht drin. Ein Extra-Schalter wäre eine Ausrede mehr |

---

## 12. Risiken

| Risiko | Gegenmittel im Plan |
|---|---|
| Der Wettbewerb belohnt Volumen statt Qualität | Neue Gewichte (5), Quoten-Titel (3) |
| Wer hinten liegt, hört auf zu loggen | Nachbar statt Podium (2.1), eigene Bestmarke, Divisionen (Schritt 10), Saison-Reset |
| Die Rangliste wird zum Druckmittel der Führungskraft | Wettbewerb bleibt unter Kollegen; Führung arbeitet mit den Signalen in `/mannschaft`, nicht mit Platzierungen |
| Zahlen werden frisiert | Bauabschnitt 0 kommt zuerst, Herkunft ist sichtbar |
| Das Spiel wird wichtiger als die Arbeit | Storno bleibt getrennte Wertung (Schritt 9) |
| Der Ton trifft daneben | Feste, geprüfte Textbausteine statt Generierung; nie über Abwesenheit berichten (6) |

---

## 13. Ideen-Vorrat

Abschnitte 1–12 sind der Bau. Was hier steht, ist durchdacht, aber noch nicht eingeplant —
sortiert danach, was es kostet und was es bringt. Zwei davon sind stärker als die Hälfte
dessen, was oben steht.

### 13.1 Erste Reihe

**Die Schicht** — gemeinsam telefonieren, ohne im selben Raum zu sitzen.

Ein Knopf: *„Ich telefoniere heute 17–18 Uhr."* Man sieht, wer sich sonst noch eingetragen
hat, und währenddessen laufen die Zähler der Mitmachenden nebeneinander. Das ist das
digitale Großraumbüro — und der einzige Grund, warum Telefonpartys im Strukturvertrieb
überhaupt funktionieren: Man ruft nicht an, weil man Lust hat, sondern weil der andere
gerade auch anruft. Von allen Ideen in diesem Dokument ist das die mit dem größten Effekt
auf die **tatsächliche Arbeit**, nicht nur auf das Gefühl.

Aufwand: klein. Ein Modell (`Shift`: Tag, Zeitfenster, Teilnehmer), Zählung kommt aus
`DailyLog.createdAt`.

**Der Sprint** — die scharfe Variante davon.

25 Minuten, Startknopf, ein Live-Zähler je Teilnehmer, danach ein Ergebnis. „Sprint startet
in 3 Minuten — 4 machen mit." Während des Sprints lädt die Seite alle 10 Sekunden nach. Das
ist der Moment, in dem der Wettbewerb aufhört, eine Tabelle zu sein, und zu einem Spiel
wird, das man *jetzt gerade* spielt.

Aufwand: klein bis mittel. Nutzt dieselben Daten wie die Schicht, braucht nur ein engeres
Zeitfenster und schnelleres Nachladen.

**Die Ansage** — Selbstverpflichtung als Spielelement.

Montag: *„Was sagst du an?"* Eine Zahl, öffentlich sichtbar, kein Freitext. Freitag steht
daneben, ob sie gehalten wurde. Wer seine eigene Ansage trifft, bekommt einen Titel.
Psychologisch ist das der stärkste Hebel überhaupt — eine öffentlich gemachte Zusage wird
eingehalten, eine gedachte nicht.

**Wichtige Feinheit:** Eine **gehaltene** Ansage ist öffentlich, eine **verfehlte**
verschwindet still und ist nur für einen selbst sichtbar. Sonst wird aus einem Antrieb ein
Pranger, und der Leitsatz ist verletzt. Der Verzicht auf die Schadenfreude kostet nichts —
die Wirkung kommt aus dem Versprechen, nicht aus der Strafe.

Aufwand: klein. Ein Feld je Person und Woche.

**Der Tagesmodifikator** — jeder Tag bekommt ein Gesicht.

Aus einer festen Liste, deterministisch aus dem Datum gewählt (kein Zufall zur Laufzeit —
sonst zeigt die Seite bei zwei Aufrufen zwei verschiedene Regeln an):

- „Heute zählt jeder vereinbarte Termin doppelt."
- „Frühschicht: Alles vor 9 Uhr zählt doppelt."
- „Heute zählen nur Gespräche, keine Nummern."
- „Ruhiger Freitag: Heute zählt nur, was fertig wird."

Kostet fast nichts und beantwortet die Frage, warum man **heute** reinschaut und nicht
irgendwann. Wichtig: der Modifikator verändert die **Anzeige**, nicht die gespeicherten
Zahlen — sonst ist die Historie hinüber.

**Ewige Tabelle und Rekordtafel** — Gedächtnis.

Wer eine Saison gewonnen hat, steht für immer da. Dazu eine Rekordtafel: „Meiste Anrufe an
einem Tag: **87**, Marc, 14.03." Rekorde zu brechen ist ein eigener Antrieb, völlig
unabhängig von der laufenden Tabelle — und der Einzige, der auch für den funktioniert, der
diese Woche keine Zeit hat.

Aufwand: klein. Reine Auswertung über `DailyLog`, ein Modell für Saisonsieger.

**Teilen statt Benachrichtigen.**

Das Benachrichtigungsproblem ist gelöst, ohne Push zu bauen: Der Kanal existiert bereits und
heißt WhatsApp.

| Was | Wie |
|---|---|
| Duell-Forderung | Vorformulierter Text plus Link, ein Tipp, ab in den Chat |
| Wochenkarte | Bild 1080×1350 aus dem Canvas — **die Technik steht schon**, das Storno-Dienstzeugnis macht genau das |
| Titel, Rekord, Saisonsieg | dasselbe Bild-Muster |

Aufwand: klein, weil das Canvas-Muster aus `public/storno.html` übernommen werden kann. Das
ist die Stelle, an der der Wettbewerb den Weg aus der App heraus findet — und damit
Menschen erreicht, die noch gar nicht drin sind.

### 13.2 Zweite Reihe

| Idee | Was es ist | Warum |
|---|---|---|
| **Der Pokal** | Monatliches K.-o.-Turnier: acht Leute, Viertelfinale Mo–Di, Halbfinale Mi–Do, Finale Fr | Die einzige Form, in der es wirklich *um etwas* geht. Ein Turnierbaum erzeugt Spannung, die eine Tabelle nie erzeugt |
| **Einwand-Bingo** | Feste Kachelkarte mit Kundensätzen: „Schicken Sie mir mal was per Mail", „Ich muss erst mit meiner Frau reden", „Ich hab schon einen Berater". Antippen, was heute kam | Der lustigste Punkt im ganzen Dokument — und nebenbei entsteht eine echte **Einwand-Statistik** fürs Coaching. Keine Kundendaten, nur Kategorien |
| **Das Doppel** | Zwei Partner koppeln sich für eine Woche, ihre Zahlen zählen zusammen gegen ein anderes Paar | Bindet die, die im Einzel chancenlos wären. Und man lässt einen Partner nicht hängen — das zieht stärker als jeder Punktestand |
| **Der Steckbrief** | Seite je Geschäftspartner: Titelsammlung, Rekorde, Head-to-Head gegen dich, Bestmarken. Keine Kundendaten | Aus einem Namen in einer Zeile wird eine Person mit Geschichte |
| **Die Kette** | „Das Netzwerk telefoniert seit **23 Tagen** ohne Lücke." Reißt, wenn an einem Werktag niemand loggt | Kollektive Verantwortung ohne auf jemanden zu zeigen. Niemand will derjenige sein, bei dem die Kette reißt — aber es steht nie ein Name daran |
| **Das gemeinsame Ziel** | Ein Balken für alle: „Gemeinsam 1000 Anrufe diese Woche — 740 stehen" | Für die, die Wettbewerb hassen. Jede Rangliste verliert ein Drittel der Leute; der gemeinsame Balken holt sie zurück |
| **Wer schaut gerade** | „3 schauen gerade auf die Tabelle" | Billigste Zeile des ganzen Plans, größte Wirkung fürs Gefühl. Ein Zeitstempel an `Person`, mehr nicht |
| **Eröffnung und Schlusspfiff** | „**Marc** hat den Tag um 8:04 eröffnet." / „**Sarah** macht um 20:12 zu." | Zwei Rituale am Rand des Tages, aus `DailyLog.createdAt`. Kostet nichts, gibt dem Tag Anfang und Ende |
| **Die Revanche** | Nach einem verlorenen Duell ein Knopf, der dasselbe Duell erneut vorschlägt | Die Niederlage ist der beste Moment für die nächste Forderung. Ein Tipp statt fünf |
| **Der Wanderpokal** | Der Wochensieg steht sichtbar beim aktuellen Halter, bis ihn jemand holt | Etwas zu **verteidigen** motiviert stärker als etwas zu gewinnen |

### 13.3 Die Substanz-Schicht

Damit aus dem Spiel Nutzen wird und nicht nur Beschäftigung. Alle vier aus vorhandenen
Daten, keine neue Erfassung:

| Idee | Inhalt |
|---|---|
| **Benchmark statt Rangliste** | „Im Netzwerk führt die Quote Anruf → Termin bei **18 %**. Deine liegt bei 11 %." Ein Vergleich, der niemanden bloßstellt und trotzdem trifft |
| **Wann es läuft** | Verteilung über die Uhrzeit: wann im Netzwerk tatsächlich Termine entstehen. „Dienstag 17–19 Uhr ist die stärkste Stunde der Woche." Das ist eine Erkenntnis, für die andere Firmen Berater bezahlen |
| **Der Tipp des Siegers** | Wer die Woche gewinnt, wählt aus einer festen Liste, was geholfen hat („früher angefangen", „kürzer telefoniert", „nach dem Nein weitergefragt"). Kein Freitext, kein Moderationsproblem, trotzdem Wissenstransfer |
| **Einwand-Statistik** | Fällt aus dem Bingo heraus: Welcher Einwand kommt im Netzwerk am häufigsten — und wer hat die beste Quote **trotz** dieses Einwands. Direktes Schulungsmaterial |

### 13.4 Geprüft und verworfen

| Idee | Warum nicht |
|---|---|
| **Handicap für Neulinge** (Vorgabe wie beim Golf) | Gut gemeint, wirkt bevormundend: „Du zählst nur mit Rabatt." Divisionen lösen dasselbe Problem, ohne jemanden zu markieren |
| **Trostpreise, Rote Laterne, Trostmütze** | Zeigt auf den Letzten. Leitsatz |
| **Töne und Signale** | Wird am Handy im Kundengespräch benutzt. Ein Jubelton zur falschen Sekunde ist ein Schaden, kein Feature |
| **Abzeichen-Sammlung ohne Ablauf** | Nach acht Wochen hat jeder alles, und nichts bedeutet mehr etwas. Titel **laufen ab** — genau das hält sie wertvoll |
| **Einsätze, Wetten, Kasse** | Glücksspiel-Nähe, arbeitsrechtlich heikel. Duelle gehen um Ehre, und das ist teurer |
| **Freitext-Tipps und Erfahrungsberichte** | Moderation. Feste Auswahl deckt 90 % ab |
| **Storno-Punkte in der Arbeitswertung** | Bleibt dabei: getrennte Liga, sonst ist die Arbeitswertung wertlos |

### 13.5 Wohin das im Bauplan gehört

| Idee | Andocken an |
|---|---|
| Wer schaut gerade, Eröffnung, Schlusspfiff | Schritt 3 (Puls) — dieselbe Mechanik |
| Die Schicht, Der Sprint | direkt nach Schritt 3, **vor** den Duellen |
| Die Ansage, Tagesmodifikator | Schritt 7 (Spieltag & Titel) |
| Ewige Tabelle, Rekordtafel, Wanderpokal, Steckbrief | Schritt 7 |
| Teilen per Bild und WhatsApp | Schritt 9 (Storno-Andockung) — dieselbe Canvas-Technik |
| Pokal, Doppel | nach Schritt 8 |
| Kette, gemeinsames Ziel | jederzeit, hängt an nichts |
| Benchmark, Uhrzeit-Verteilung, Einwand-Bingo | eigener Zweig — nützlich auch ohne Wettbewerb |

---

## 14. Der Kurs: alles rein, dann abstimmen

Entscheidung vom 20.08.: Es wird nicht vorsichtig ausgerollt. **Alles wird gebaut, alles
geht gleichzeitig live, und die Mannschaft entscheidet, was bleibt.** Nicht ich rate, was
gut ankommt — sie sagen es.

Der ehrliche Preis dieser Entscheidung, in einem Satz: Wenn zwanzig Dinge am selben Tag
starten, lässt sich hinterher nicht mehr sagen, *welches* davon gewirkt hat. Das ist bei elf
Leuten verkraftbar — die sagen es einem ohnehin ins Gesicht — und dafür kauft man Tempo,
ein Ereignis und eine Mannschaft, die das Ding mitgebaut hat. Angenommen und weiter.

Aber: Mut ohne Rückwärtsgang ist kein Mut, sondern ein Sturz. Deshalb gehören **drei Teile
Infrastruktur** zwingend in denselben Bau — sie sind der Bauabschnitt 0 des neuen Kurses.

| Teil | Wofür |
|---|---|
| **Schalter** | Jede Funktion lässt sich ohne Deployment abschalten. Ohne das ist „abstimmen" gelogen |
| **Messung** | Was wirklich benutzt wird, nicht was gesagt wird. Beides zusammen ergibt erst ein Bild |
| **Rückmeldung** | Die Frage muss im Werkzeug stehen, nicht in einer Umfrage, die keiner ausfüllt |

### 14.1 Die Rückmeldung: drei Wörter, ein Tipp

An jedem neuen Baustein sitzt unauffällig in der Ecke eine Frage: **„Taugt das?"**

| Antwort | |
|---|---|
| **Stark** | |
| **Geht so** | |
| **Weg damit** | |

Eine Stimme je Person und Funktion, jederzeit änderbar. Nach dem Tippen verschwindet die
Frage für diese Person — sie ist kein Dauermöbel. Kein Freitext, aus demselben Grund wie
überall in diesem Dokument: Wer tippen muss, tippt nicht.

Wer mehr sagen will, sagt es in der Gruppe. Genau dafür ist die Gruppe da.

### 14.2 Die Werkstatt

Eine eigene Seite `/werkstatt` — und der Witz daran: **die Funktionen stehen selbst in einer
Rangliste.** Dieselbe Tabelle, dieselbe Sprache, nur dass diesmal das Duell gegen das Bingo
antritt.

| Spalte | Inhalt |
|---|---|
| Funktion | „Das Duell", „Der Sprint", „Einwand-Bingo" … |
| Stimmen | 7 Stark · 2 Geht so · 1 Weg damit |
| Benutzt von | 4 von 11 in den letzten 7 Tagen |
| Stand | Test · Läuft · Abgeschaltet · Abgerissen |
| Schalter | nur für dich sichtbar |

Die beiden mittleren Spalten sind der eigentliche Wert, weil sie sich oft widersprechen:
**„8 × Stark, benutzt von 2."** Das ist keine gute Funktion, das ist eine gute Idee. Der
Unterschied kostet sonst Monate.

Dazu auf derselben Seite:

- **Der Wunschzettel** — Ideen, die noch nicht gebaut sind. Jeder hat drei Stimmen. Damit
  entscheidet die Mannschaft nicht nur über das Bestehende, sondern über das Nächste. Neue
  Wünsche trägst du ein, gemeldet werden sie in der Gruppe — kein Freitextfeld, keine
  Moderation.
- **Der Friedhof** — was abgerissen wurde, mit Datum und Stimmenstand. Verhindert die Frage
  „wo ist eigentlich X hin?" und beweist bei jedem Besuch, dass Abstimmen etwas ändert.
- Ein Kommentator-Satz, wie überall: „Das Duell führt. Das Doppel steht auf Abstieg."

### 14.3 Die Abrissbirne

Regeln, damit „wir schauen mal" nicht in einer Wohnung voller Kisten endet:

| Regel | |
|---|---|
| Prüfung nach **drei Wochen** | vorher ist alles nur neu |
| Raus fliegt, was **von weniger als drei Personen** benutzt wurde | Nutzung schlägt Stimmen |
| **Ein „Weg damit" allein reißt nichts ab** | sonst kippt eine Einzelmeinung Arbeit |
| **Abriss wird angekündigt** | „Diese Woche abgerissen: Das Doppel. 2 von 11 fanden es gut. Danke fürs Ausprobieren" |
| **Einspruch ist erlaubt — von dir** | Es ist dein Werkzeug. Eine Funktion darf einmal überleben, wenn du sie für richtig hältst — dann aber mit sichtbarer Begründung: „Bleibt drin, weil …" |

Die letzte Regel ist die wichtigste. Eine Abstimmung, die bindend ist, wird zur Fessel; eine
Abstimmung, die nirgends hinführt, wird nicht mehr benutzt. Der ehrliche Mittelweg ist:
**Die Stimme ist ein Rat, kein Befehl — und man sieht, wann du dagegen entschieden hast.**

### 14.4 Der Eröffnungstag

Zwanzig Funktionen still live zu schalten heißt: niemand findet sie, alle Ranglisten sind
leer, das erste Duell fordert keiner, weil keiner der Erste sein will. Sozialer Leerstand
ist die häufigste Todesursache solcher Features — nicht schlechte Ideen.

Deshalb ein **Termin**, angekündigt in der Gruppe:

1. **Datum zuerst festlegen, dann bauen.** Ein Datum liefert aus, eine Liste nicht.
2. **Alles am selben Tag live**, ein Ankündigungsbild aus dem Canvas (Storno-Muster).
3. **Der Spielplan:** Für den ersten Spieltag werden Duelle **vorgemischt** — jeder findet
   eine fertige Paarung vor und muss nur annehmen. Niemand muss der Erste sein.
4. **Erster gemeinsamer Sprint** zu einer festen Uhrzeit am Eröffnungstag, in der Gruppe
   angesetzt. 25 Minuten, alle gleichzeitig. Das ist der Moment, in dem sich die Sache das
   erste Mal echt anfühlt.
5. **Alles vorgefüllt:** Bingo-Karte gefüllt, Ansage mit Vorschlag aus der Vorwoche,
   gemeinsames Netzwerk-Ziel schon gesetzt. Kein leerer Bildschirm am ersten Tag.
6. **Nachschub in Wellen:** Was nach der Eröffnung dazukommt, kommt gebündelt mit einer
   „Neu diese Woche"-Karte. Sonst findet es wieder keiner.

### 14.5 Was heilig bleibt

Beim Reinkippen darf genau dreierlei nicht verrutschen:

| | |
|---|---|
| **Die Arbeitsfläche** | `/log` bleibt, was es ist: drei Zähler und Ruhe. Alles Neue lebt in der Arena und ist abschaltbar. Wenn Loggen langsamer wird, war alles umsonst |
| **Der Leitsatz** | Auch die Nutzungsmessung zeigt nie auf eine Person. In der Werkstatt stehen Zahlen („benutzt von 4"), nie Namen |
| **Der Einsteiger** | Wer in Woche 6 dazukommt, sieht nicht zwanzig Funktionen. Die Arena bekommt dieselbe Zweiteilung wie das CRM (`beginnerMode`): erst drei Dinge, dann alles |

### 14.6 Die eine Zahl, die entscheidet

Stimmen sagen, was Spaß macht. Ob es **etwas gebracht** hat, sagt genau eine Zahl:

> **Aktive Logger pro Woche** und **Anrufe je aktivem Kopf.**

Wenn die Arena nach vier Wochen beides nicht bewegt, ist sie Unterhaltung und kein Werkzeug.
Das ist kein Weltuntergang — aber man sollte es wissen, statt es sich schönzureden.

**Deshalb vor der Eröffnung eine Nullmessung:** die vier Wochen davor festhalten und
einfrieren. Ohne Vorher-Wert ist jedes Nachher eine Meinung. Das ist eine Abfrage über
`DailyLog`, zehn Minuten Arbeit — und ohne sie diskutiert man in zwei Monaten über Gefühle.

### 14.7 Datenmodell für die Werkstatt

```prisma
model Feature {
  key     String       @id      // "duell", "sprint", "bingo"
  titel   String
  state   FeatureState @default(TEST)
  seit    DateTime     @default(now())
  grund   String?               // "Bleibt drin, weil ..." - sichtbar in der Werkstatt
  votes   FeatureVote[]
}

enum FeatureState {
  TEST
  LAEUFT
  AUS          // abgeschaltet, Daten bleiben
  ABGERISSEN   // Friedhof
}

model FeatureVote {
  id         String   @id @default(cuid())
  featureKey String
  feature    Feature  @relation(fields: [featureKey], references: [key], onDelete: Cascade)
  personId   String
  person     Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  urteil     Urteil
  createdAt  DateTime @default(now())

  @@unique([featureKey, personId])
}

enum Urteil {
  STARK
  GEHT_SO
  WEG_DAMIT
}

// Nutzung, nicht Meinung. Ein Zaehler je Funktion, Person und Tag - angezeigt
// wird ausschliesslich die Summe ueber Personen, nie eine einzelne Zeile.
model FeatureUse {
  featureKey String
  personId   String
  day        DateTime
  count      Int      @default(1)

  @@id([featureKey, personId, day])
  @@index([featureKey, day])
}

// Was noch nicht gebaut ist. Eingetragen wird von dir, abgestimmt von allen.
model Wunsch {
  id        String   @id @default(cuid())
  titel     String
  stand     String   @default("OFFEN") // OFFEN | GEBAUT | VERWORFEN
  createdAt DateTime @default(now())
  votes     WunschVote[]
}

model WunschVote {
  id        String @id @default(cuid())
  wunschId  String
  wunsch    Wunsch @relation(fields: [wunschId], references: [id], onDelete: Cascade)
  personId  String
  createdAt DateTime @default(now())

  @@unique([wunschId, personId])   // drei Stimmen je Person werden in der Action geprueft
}
```

Der Schalter kommt aus einer einzigen Funktion — `istAn("duell")` —, die einmal je Anfrage
lädt und danach überall abgefragt wird. Wichtig ist nur die Disziplin: **kein neuer Baustein
ohne Schlüssel, ohne Schalter, ohne Zählstelle.** Sonst hat man nach drei Wochen zwanzig
Funktionen und Messwerte für sieben.

### 14.8 Die neue Reihenfolge

| Paket | Inhalt | Warum in dieser Reihenfolge |
|---|---|---|
| **A · Werkstatt** | Schalter, Zählung, Abstimmung, `/werkstatt`, Nullmessung | Ohne das ist der ganze Kurs eine Behauptung |
| **B · Fundament** | Fairness, Punktegewichte, Rangliste-Umbau, Puls | Betrifft alle anderen Bausteine, muss vorher stehen |
| **C · Gefühl** | Schicht, Sprint, Feed, Reaktionen, „wer schaut gerade", Eröffnung/Schlusspfiff | Der Teil, der aus Zahlen Menschen macht |
| **D · Wettkampf** | Duelle, Ansage, Tagesmodifikator, Titel, Spieltag, Wanderpokal | Der eigentliche Wettbewerb |
| **E · Tiefe** | Ewige Tabelle, Rekorde, Steckbrief, Kette, gemeinsames Ziel, Doppel, Pokal | Alles, was über die Woche hinaus trägt |
| **F · Substanz** | Benchmark, Uhrzeit-Verteilung, Bingo, Einwand-Statistik, Tipp des Siegers | Der Teil, der auch ohne Wettbewerb Wert hat |
| **G · Verbreitung** | Teilen als Bild, Forderung per WhatsApp, Storno-Andockung | Zuletzt, weil es die anderen Teile mitnimmt |

Danach: **Eröffnungstag.** Und ab da entscheidet nicht mehr dieses Dokument, sondern die
Werkstatt.

---

## 15. Umsetzungsstand (20.08.2026)

### 15.1 Nullmessung — der Vorher-Wert

Gemessen am 20.08.2026, 12:35 Uhr, mit `scripts/nullmessung.mjs` (wiederholbar, liest nur):

| | |
|---|---|
| Aktive Konten | **1** |
| Wettbewerbs-Personen | **1** |
| Einträge in `DailyLog` | **33**, Zeitraum 12.–16.08. |
| Beste Woche (ab 10.08.) | 1 Kopf · 13 Anrufe · 16 Nummern · 4 Termine · 13,0 Anrufe/Kopf |
| Anteil aus dem CRM | **9 %** |

**Die wichtigste Zahl in dieser Tabelle ist die Eins.** Die Arena ist am Starttag kein
Feature-Problem, sondern ein Menschen-Problem: Duelle brauchen zwei, der Puls braucht
Publikum, die Werkstatt braucht Stimmen. Wie gut der Start wird, entscheidet die Zahl der
Einladungen, nicht die Zahl der Funktionen.

Daraus folgt für die Reihenfolge am Starttag: Der **Sprint** ist wichtiger als das Duell —
er funktioniert ab zwei Köpfen und ist ein Termin, kein Feature.

### 15.2 Gebaut

| Baustein | Stand | Commit |
|---|---|---|
| Schalter und Zählstelle (`lib/features.ts`) | **fertig** | `574c4fe` |
| Werkstatt: Funktions-Rangliste, Stimmen neben Nutzung, Wunschzettel, Friedhof | **fertig** | `574c4fe` |
| „Taugt das?" an jedem Baustein | **fertig** | `574c4fe` |
| Fairness: Tageskappen, Nachtragsfenster zwei Tage | **fertig** | `574c4fe` |
| Punktegewichte 1/1/3/5/10 | **fertig** | `574c4fe` |
| Nullmessung | **fertig** | `574c4fe` |
| Arena: Kommentator, Abpfiff-Restzeit | **fertig** | `123dfaf` |
| Arena: Puls mit Selbst-Nachladen (30 s, im Sprint 10 s) | **fertig** | `123dfaf` |
| Arena: Zweikampf-Block, Abstand in Handlungen, Bestmarke | **fertig** | `123dfaf` |
| Arena: Duelle inkl. Abpfiff ohne Cron | **fertig** | `123dfaf` |
| Arena: gemeinsamer Sprint | **fertig** | `123dfaf` |
| Navigation auf `/arena` und `/werkstatt` | geschrieben, **nicht committet** — siehe 15.4 |

Geprüft: `prisma validate`, `tsc --noEmit`, `eslint` — alle sauber. `/arena` und `/werkstatt`
antworten am laufenden Dev-Server mit 307 auf `/login`, kompilieren also.

**Nicht geprüft:** die Ansicht hinter dem Login. Dafür wäre ein Passwort nötig, und die
Arena-Tabellen stehen noch nicht in der Datenbank.

### 15.3 Bewusste Abweichungen

| Thema | Plan | Umgesetzt | Warum |
|---|---|---|---|
| Ort | Umbau von `/leaderboard` | **neue Seite `/arena`**, `/leaderboard` bleibt unverändert | An `/leaderboard` wird parallel gearbeitet. Zwei Sitzungen in einer Datei zerstören sich gegenseitig |
| Zwei Ranglisten | eine | Arena **und** Rangliste stehen nebeneinander in der Navigation | Passt zum Kurs: welche bleibt, entscheidet die Werkstatt — nicht wir |
| Reihenfolge | A → G | A, B, C, D teilweise; E, F, G offen | Ein Abend ist ein Abend |
| Feed und Reaktionen | Paket C | **nicht gebaut**, steht als Wunsch Nr. 1 auf dem Wunschzettel | Mit drei Köpfen erzeugt ein Feed keine Ereignisse |

### 15.4 Ausgeliefert am 20.08.2026

Alles live auf https://ergo-crm.vercel.app, Commit `c833806`.

| | |
|---|---|
| Arena, Werkstatt, Fairness, neue Gewichte | live |
| Willkommen-Zweig, Start-Schleuse, Einladen-Seite, Service Worker | live (parallele Arbeit, mit ausgeliefert) |
| Navigation auf `/arena` und `/werkstatt` | live |
| Migrationen | 15 von 15 angewandt |
| Startprobe `scripts/arena-check.mjs` | 8 von 8 Tabellen, 7 Bausteine, 13 Wünsche |

**Ein Fehler auf dem Weg dahin, als Lehre notiert:** Der erste Deploy (`d81459f`) ist
gescheitert, weil in den `"use server"`-Dateien Konstanten neben den Aktionen standen —
dort sind ausschließlich async Funktionen erlaubt. `tsc` und `eslint` prüfen diese
Next-Regel **nicht**, nur `next build` fällt darüber. Behoben in `c61a098`. Regel für
künftige Abende: **vor jedem Push ein vollständiger `next build`**, auch wenn Typprüfung
und Lint sauber sind.

### 15.5 Was jetzt noch fehlt — und es ist kein Code

Die Startprobe sagt es in einer Zeile: **ein Kopf.** Bausteine, Tabellen und Wünsche stehen,
aber Duelle brauchen zwei, der Puls braucht Publikum und die Werkstatt braucht Stimmen.

1. **Einladungen verschicken.** `/einladen` ist live, jeder kann Codes erzeugen.
2. **Erster gemeinsamer Sprint** zu einer festen Uhrzeit, in der Gruppe angesagt.
3. **Nach drei Wochen die Werkstatt lesen** und abreißen, was von weniger als drei Köpfen
   benutzt wurde.
4. **Nach vier Wochen `scripts/nullmessung.mjs` erneut laufen lassen** und gegen 15.1
   halten. Aktive Logger pro Woche und Anrufe je aktivem Kopf — bewegt sich das nicht, ist
   die Arena Unterhaltung und kein Werkzeug.

### 15.6 Historie: was vor dem Start noch offen war

1. **Migration einspielen.** Vier Migrationen stehen offen, alle additiv:
   `npx prisma migrate deploy`. Ohne sie stürzt `/arena` hinter dem Login ab. Der
   Vercel-Build macht das ohnehin — vorher lokal laufen zu lassen ist die Probe, ob die
   Migration sauber durchläuft.
2. **Der Willkommen-Zweig muss fertig sein.** Er blockiert den Start doppelt:
   `app/(willkommen)/willkommen/page.tsx` kompiliert noch nicht (fehlende Komponente), und
   `requireOnboardedUser` schickt jedes Konto mit `onboardingDoneAt = NULL` dorthin — nach
   der Migration ist das **jedes bestehende Konto**. Deploy ohne fertige Seite heißt: alle
   landen auf 404.
3. **Navigation committen.** Die zwei Zeilen liegen in `app/(team)/layout.tsx` und
   `app/(app)/layout.tsx` — beides Dateien der parallelen Arbeit. Sie fahren mit deren
   Commit mit.
4. **Einladungen verschicken.** Siehe 15.1.
5. **Sprint ansetzen.** Feste Uhrzeit in der Gruppe, alle gleichzeitig.
