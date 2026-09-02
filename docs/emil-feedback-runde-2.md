# Emils Feedback-Runde 2 (Cockpit → Tracker)

Stand: 01.09.2026 — Notizen vom 31.08. (Zoom-Vorführung), Klärungen von Adrien per Sprachnotiz am 01.09., alle Deutungsfragen in drei Fragerunden entschieden. **Dieses Dokument ist jetzt der Umsetzungsplan**: 14 Arbeitspakete (AP-15 bis AP-28, fortlaufend nach Runde 1), fünf Wellen, ein Commit je Paket.

**Nachtrag 01.09.2026 abends: ALLE 14 Pakete sind umgesetzt und committet** — Commit-Tabelle, Prüfstand und Restpunkte in Abschnitt 13. Der Branch ist **nicht gepusht**: ein Push löst den Vercel-Build aus, und der fährt die Direktkontakt-Migration gegen die geteilte Produktions-Datenbank.

Runde 1 steht in [emil-feedback-plan.md](emil-feedback-plan.md) — deren 14 Pakete sind umgesetzt; was hier steht, ist Emils Reaktion auf genau diesen Stand. Basis: Branch `redesign/liquid-glass`, Commit `a875807`.

> Die Hausregel aus Runde 1 gilt weiter: **Emil beschreibt selten fehlende Features — meist beschreibt er Features, die er nicht gefunden hat. Erst prüfen, dann bauen.** Zwei der siebzehn Notizen waren genau das (N3, N17).

---

## 1. Die Notizen, unverändert

Wortlaut wie mitgeschrieben — die Deutung steht in Abschnitt 2.

| # | Notiz |
|---|---|
| N1 | „EIGENEINHEITEN 2. linie, also team + EE getrennt" |
| N2 | „für telefonate und termine auch eine linie als etf chart, und v.A. auch für GP aufgeteilt" |
| N3 | „wenn du über etf charts drauf gehst, muss der aktuelle stand gesehen werden, also einheitenstand pro tag" |
| N4 | „ETF chart hier nach oben, aber tabelle behalten" |
| N5 | „Wenn emil öffnet, ihn interessiert, Aktivitäten und Einheiten (chart)" |
| N6 | „Emil muss das nicht direkt von jeden sehen, aber als untermenü, er kann auf das profil drücken, da sieht er alles. Er sieht quasi als erstes team übersicht, kann dann auf unter profil gehen, und wiederrum etf chart sehen für die aktivität der einzelnen person" |
| N7 | „Empfehlungen für 1zu1 coachings dafür" |
| N8 | „für FK ist nicht mehr so wichtig namensliste als, einfacher gestalten viele kontakte aufzunehmen" |
| N9 | „Namen noch mehr ausdünnen" |
| N10 | „Timetree Kalender, unbedingt!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! wenn nachfrage nach, was ist nach anruf passiert -> rückmeldung, 15 uhr, landet im kalender" |
| N11 | „Mannschaft neuordnen" |
| N12 | „Cockpit umbennen" |
| N13 | „Teammeeting -> Kommunikation ist das wichtig, Tabelle reicht aus, dort soll nicht sichtbar sein, was das team hat, sondern nur sein eigene struktur" |
| N14 | „Direkt kontakt Trichter, als verstecktes FK-Tool" |
| N15 | „Wettbewerb arena überdenken" |
| N16 | „titel überdenken" |
| N17 | „Einfaches feedbacktool für EMIL" |

---

## 2. Klärungen vom 01.09.

Adriens Sprachnotiz, sinngemäß je Notiz — plus die Antworten aus den drei Fragerunden derselben Sitzung.

| # | Was gemeint ist |
|---|---|
| N1 | Im Strukturvertrieb gibt es die eigenen Einheiten und die aus dem Team. **Beides trennen** — zwei Linien. |
| N2 | Die ETF-Darstellung soll es **auch für Telefonate und Termine** geben: über die Zeit, wie telefoniert und wie viele Termine gemacht wurden. Einmal für das ganze Team in der Mannschaftsansicht (alle drei Kurven), und **pro Geschäftspartner** auf dessen Seite. Die Aufteilung je Person unter den Team-Kurven ist die Tabelle. Fragerunde: **kumuliert im ETF-Stil, eine Komponente für alles.** |
| N3 | Findbarkeit — der Stand steht am Kartenkopf statt am Finger. Bau: schwebendes Ablese-Badge. |
| N4 | Gemeint ist die **Mannschaftsansicht**, nicht der Teamabend. Chart ganz nach oben; die Tabelle („die ist geil") direkt darunter. |
| N5 | Wenn Emil — jede Führungskraft ab einem Geschäftspartner — die App öffnet, interessieren zuerst Aktivitäten und Einheiten. Fragerunde: **/heute bleibt Start, der FK-Kopf führt mit kompakten Kurven.** |
| N6 | Erst Team-Übersicht, dann auf die Person, dort die Kurven der Aktivität dieser Person. |
| N7 | Aus den Daten der Geschäftspartner **Empfehlungen für 1:1-Coachings** ableiten. Das heutige „Dein Schritt" ist nicht schlecht — aber ausführlicher. |
| N8 | Ab einem Geschäftspartner ist Führen wichtiger als die Namensliste. Die Ansicht soll sich aufs Führen konzentrieren. Fragerunde: **Mannschaft rückt in der Leiste nach vorn, Namen nach hinten, nichts fällt weg.** |
| N9 | Kürzel bringen nichts: „Jonas." bleibt Jonas, und wer „E. C." ist, weiß im Team jeder. Namen beim Vorführen **komplett raus**. Fragerunde: **Zählnamen „GP 1, GP 2, …".** |
| N10 | Nach einem Anruf über die App gefragt werden „was ist passiert?" — und wenn dort „Termin Dienstag 15 Uhr" eingetragen wird, soll das **automatisch im Kalender** stehen. Fragerunde: **strukturiert mit Wochentags- und Uhrzeit-Chips, kein Textparsen.** |
| N11 | Siehe N4. |
| N12 | Die App heißt ab jetzt **Tracker** — überall: Ladebildschirm, oben links, wo immer der Name steht. |
| N13 | Der Teamabend ist Kommunikation, nicht Auswertung: Wenn Emil im Meeting anspricht, was lief, was nicht und was bei Einzelnen besonders gut lief, soll er das sauber zeigen können. Tabelle reicht; niemand sieht dort die Zahlen des ganzen Teams, nur die eigene Struktur. Fragerunde: **Auto-Rückblick-Karten, von Emil kuratiert; Negatives nur aggregiert.** |
| N14 | Ein weiteres FK-Werkzeug: der **Direktkontakttrichter** zum Quoten-Tracken — angesprochen, Kontakt bekommen, angemeldet. Fragerunde: **fünf Stufen Angesprochen → Instagram → Nummer → Termin vereinbart → Rekrutiert, Schnell-Zähler je Stufe, Optik wie /trichter.** |
| N15 | Die Arena ist so „nicht schön" — kompetitiver machen, damit mehr Leute sie nutzen wollen. Fragerunde: **Team-Challenge, Streaks sichtbarer, Saison-Trophäen mit Vitrine; keine Liga vorerst; kein Wochen-Duell (Zweikampf existiert).** |
| N16 | Die Stufen-Titel sind nicht lustig, die will keiner sehen. Sie sollen so sein, dass jemand denkt „geil, ich hab den Titel" — zum Flexen. Fragerunde: **drei komplette Sätze zur Auswahl, konfigurierbar in der Werkstatt.** |
| N17 | Ein einfaches Feedback-Werkzeug für Emil und jede Führungskraft: „funktioniert gut / nervt / fehlt". Fragerunde: **existiert — Megafon bekommt ein Wort-Label und einen Ersthinweis.** |

---

## 3. Befund gegen den Code

✅ steht · 🟡 teilweise / an der falschen Stelle · ❌ fehlt

| # | Befund | Status |
|---|---|---|
| N1 | Zwei getrennte Kurven an zwei Orten, nicht zwei Linien in einem Bild: [`VerlaufsChart`](../components/VerlaufsChart.tsx) läuft auf [/mannschaft](../app/(app)/mannschaft/page.tsx):894 mit `strukturVerlauf()` und auf [/einheiten](../app/(team)/einheiten/page.tsx):162 mit `eigenerVerlauf()`. Die Komponente kennt genau eine Polylinie. | 🟡 |
| N2 | Kurven gibt es nur für Einheiten. Für Anrufe und Termine existiert keine Tages-Aggregation — ihre Zahlen stehen als Momentaufnahme in der Matrix (`Werte`, [`lib/fuehrung.ts`](../lib/fuehrung.ts):46) und im Trichter. | ❌ |
| N3 | Das Ablesen ist gebaut: Fadenkreuz, Punkt, Wert + Datum am Kartenkopf ([`VerlaufsChart`](../components/VerlaufsChart.tsx):357–364). Der Kopf liegt nur weit über dem Finger. | 🟡 |
| N4/N11 | Reihenfolge auf /mannschaft: Team-Cockpit (:423) → Deine Struktur diese Woche (:471) → Heute dran (:530) → Du kümmerst dich (:639) → Hakt (:677) → Ganze Struktur (:702) → **Verlauf (:880)** → Einheiten-Tabelle (:904) → Dein eigenes Geschäft (:1039). Die Kurve steht an achter Stelle. | 🟡 |
| N5 | /heute verzweigt für Führungskräfte auf `gefuehrte > 0` und zeigt den `LageKopf` mit Gesamtstand + Monats-Sparkline ([`components/LageKopf.tsx`](../components/LageKopf.tsx):155). Aktivitäten fehlen dort als Kurve. | 🟡 |
| N6 | Aus der Matrix führt der Name auf die Personenseite `app/(app)/mannschaft/[id]/page.tsx`: Kennzahlen, „Dein Schritt", Termine, Tages-Verlauf **als Liste** (`VerlaufsTag`, :128) — keine Kurve. Die Seite ist außerdem **nicht vorführfest** (kein `GpName`, siehe mannschaft/page.tsx:89). | 🟡 |
| N7 | `fuehrungsSchritt()` in [`lib/fuehrung.ts`](../lib/fuehrung.ts) liefert eine nächste Handlung; „Dein Schritt" auf der Personenseite (:335). Nichts liest aus Verlauf oder Trichter-Engpass der Person. | 🟡 |
| N8 | Navigation: eine Liste in [`components/AppShell.tsx`](../components/AppShell.tsx):32–66, gefiltert mit `darfSehen(href, stand)` aus [`lib/ausbauSicht.ts`](../lib/ausbauSicht.ts):42–66 (Bereiche anfang / voll / fuehrung / admin). Reihenfolge ist fix: Namen · Heute · Kalender · Einladen · Trichter · Wettbewerb · Mannschaft · Team. „Führt" = `direkte > 0` über `leaderId` ([`lib/ausbau.ts`](../lib/ausbau.ts):74–86), Platzhalter zählen mit. | 🟡 |
| N9 | [`lib/vorfuehren.ts`](../lib/vorfuehren.ts):22–71 `initialenKuerzel()` — „Marc Weber" → „M. W.", kollisionsauflösend; identische Namen wachsen bis zum vollen Wort („Jonas."). Angewendet über `GpName` auf /heute, /mannschaft, Matrix, GriffKarte, DirektenListe, LageKopf; Organigramm + Strukturliste werden per `VorfuehrVerdeckt` ganz ausgeblendet. Arena, Rangliste, Teamabend zeigen immer Klarnamen. Zustand: `sessionStorage`-Schlüssel `cockpit-vorfuehren` ([`VorfuehrProvider`](../components/VorfuehrProvider.tsx):20). | 🟡 |
| N10 | **Größer gebaut als vermutet, aber an den falschen Stellen.** Siehe Tabelle unten (L1–L9). | 🟡 |
| N12 | „Cockpit" ist seit AP-14 der nutzersichtbare Name (D8: technische Schlüssel blieben `__ergoInstall`, Cookie, Cache-Namen). „Team-Cockpit" ist außerdem die Überschrift der Matrix. | 🟡 |
| N13 | [/teamabend](../app/(team)/teamabend/page.tsx) zeigt: Wochentitel mit Klarnamen + Werten (:100–139), **indexierte** Team-Kurve ohne Absolutwerte (:142–148, `indexkurveFuer` [`lib/einheiten.ts`](../lib/einheiten.ts):764), Puls (:151–170), Top 3 mit **absoluten Wochenpunkten** (:174–219), die letzten fünf Feed-Zeilen (:223–246). Kein Rückblick, keine Kuratierung. Nicht in der Leiste — nur über den Link in der Arena (arena/page.tsx:263). | 🟡 |
| N14 | [/trichter](../app/(app)/trichter/page.tsx) ist der eigene Kundentrichter (Anrufe → vereinbart → gehalten → Abschlüsse) mit [`TrichterGrafik`](../components/TrichterGrafik.tsx). Für Direktansprache gibt es weder Zähler noch Trichter. Zähler-Muster: /log mit `QuotaType`-Tageszählern (`DailyLog`). | ❌ |
| N15 | [/arena](../app/(team)/arena/page.tsx) hat viel: Stufenzeile, Postfach, Wochentitel (Türöffner / Der Hartnäckige / Der Verlässliche, [`lib/titel.ts`](../lib/titel.ts) — nur Live-Stände, nie eingefroren), Feed, 25-Minuten-Sprint, Puls, Zweikampf mit Tabellennachbar, Wochentabelle mit Serien-Flamme. Punkte-Gewichte in [`lib/labels.ts`](../lib/labels.ts):41–48, Rangliste [`lib/arena.ts`](../lib/arena.ts):116–137. **Abzeichen bewusst nicht gebaut** ([wettbewerb-plan.md](wettbewerb-plan.md):571: „nach acht Wochen hat jeder alles"). Kein Team-Ziel, keine Saison-Ergebnisse, keine Vitrine. | 🟡 |
| N16 | [`lib/stufen.ts`](../lib/stufen.ts):38–45: Anwärter (0) · Anrufer (25) · Terminjäger (60) · Abschließer (150) · Routinier (350) · Veteran (750). Hart codiert, sichtbar in arena/page.tsx:191–202 und spiel/page.tsx:37–81. | 🟡 |
| N17 | **Gibt es vollständig:** Megafon in der Kopfzeile → [`RueckmeldungGeben`](../components/RueckmeldungGeben.tsx) (Stimmung Pflicht, Anliegen/Text/Sprachaufnahme optional) → [`app/rueckmeldungAction.ts`](../app/rueckmeldungAction.ts):97–117 speichert, :124–140 pusht an alle Admins → Auswertung [/werkstatt/rueckmeldungen](../app/(team)/werkstatt/rueckmeldungen/page.tsx) (nur ADMIN). Empfänger = ältester aktiver Admin ([`AppShell`](../components/AppShell.tsx):72–82), nicht anonym. Emil hat es nicht gefunden. | ✅ |

### N10 im Detail — was auf dem Weg „Anruf → Termin im Kalender" steht und fehlt

Schon gebaut: Rückkehr-Erkennung nach dem Telefonat im Durchlauf ([`NameDialer.tsx`](../components/NameDialer.tsx):88–96, Überschrift „Wie lief's mit …?" :311–318) · Datum-**und**-Uhrzeit-Chips bei „Termin vereinbart" ([`ResultDialogs.tsx`](../components/ResultDialogs.tsx):27–34, Voreinstellung morgen 18:00 :62, `datetime-local`-Rückfall :107) · `Contact.appointmentAt` trägt immer eine Uhrzeit (Pflicht in [`pipeline/actions.ts`](../app/(app)/pipeline/actions.ts):141–149) · Kundentermine landen im ICS-Feed ([`lib/kalender/feed.ts`](../lib/kalender/feed.ts):80–89) und in der Kalenderansicht ([`lib/kalender/laden.ts`](../lib/kalender/laden.ts):94–109) · Abo-Weg mit QR und Anleitung.

| # | Lücke | Beleg |
|---|---|---|
| L1 | Die Frage nach dem Anruf gibt es **nur im Durchlauf**. Heute-Liste und Kontaktakte haben den `tel:`-Link ohne Listener. | [`QuickRowActions.tsx`](../components/QuickRowActions.tsx):105–110, contacts/[id]/page.tsx:238 |
| L2 | Kein persistenter Zustand „Anruf gestartet, Ergebnis offen" — App zu, Frage weg. | schema.prisma Contact :112–193 |
| L3 | Kein Freitext→Struktur; der Notiztext bleibt Prosa. **Bleibt so (D15: kein Parsen).** | NameDialer.tsx:353 → results.ts:206 |
| L4 | Keine **Wochentags-Chips** — nur Morgen / Übermorgen / In 3 Tagen / Nächste Woche. | ResultDialogs.tsx:27–32 |
| L5 | „Später" / „Nicht erreicht" können **keine Uhrzeit**: Chips 7/30/90 Tage, `nextStepAt` wird als UTC-Mitternacht geschrieben. Genau Emils „Rückmeldung, 15 Uhr". | ResultDialogs.tsx:36–40, [`contacts/actions.ts`](../app/(app)/contacts/actions.ts):284–287 |
| L6 | **Wiedervorlagen erscheinen in keinem Kalender-Ausgang** — `nextStepAt` kommt in feed.ts, laden.ts und dem Download nicht vor. | feed.ts:64–105, laden.ts:61–90 |
| L7 | Aus dem Anruf entsteht nie ein `Termin`-Datensatz (Dauer pauschal 60 Min, kein Ort). Absicht: `appointmentAt` bleibt führend (laden.ts:10–12). **Bleibt so.** | laden.ts:19, feed.ts:88 |
| L8 | **Kein Schreiben nach TimeTree** — [`lib/kalender/timetree.ts`](../lib/kalender/timetree.ts) kennt nur GET; die offizielle API ist seit 22.12.2023 tot; TimeTree kann keine ICS-Adresse abonnieren ([struktur-plan.md](struktur-plan.md):394). Der Weg bleibt Feed → Google/iOS-Kalender → TimeTree, Latenz Stunden. **Nicht lösbar, nur zu erklären.** | timetree.ts:73–229, [kalender/abo/page.tsx](../app/(app)/kalender/abo/page.tsx):22–32 |
| L9 | Keine Erinnerung „Ergebnis fehlt noch". | results.ts:134–148 |

---

## 4. Glossar — Neuzugänge und Änderungen

Die verbindlichen Definitionen stehen in [CONTEXT.md](../CONTEXT.md); hier nur, was sich durch diese Runde ändert.

- **Tracker:** der neue nutzersichtbare Name der App (vorher Cockpit, davor Ergo CRM). Technische Schlüssel tragen weiter die alten Namen — siehe [ADR 0006](adr/0006-sichtbarer-name-wandert-schluessel-eingefroren.md).
- **Eigen / Team (Einheiten):** zwei disjunkte Linien derselben Kurve. Eigen = selbst gemeldet; Team = alles darunter ohne die eigenen. Summe = Gesamtstand.
- **Aktivitäts-Verlauf:** die kumulierte Kurve der Anrufe und der vereinbarten Termine — dieselbe Darstellung wie der Einheiten-Verlauf, dieselbe Rechnungsbasis wie die Matrix.
- **Zählname:** „GP 1", „GP 2", … — was beim Vorführen an der Stelle eines Namens steht.
- **Direktkontakt / Direktkontakttrichter:** die Ansprache fremder Menschen zur Gewinnung von Geschäftspartnern, fünfstufig gezählt.
- **Rückblick-Karte:** eine automatisch erzeugte Karte für den Teamabend mit genau einem Highlight einer Person oder einem Team-Befund.
- **Team-Challenge, Trophäe, Vitrine:** Wochenziel der ganzen Mannschaft; Saison-Auszeichnung mit Ablauf; Ort der vergangenen Trophäen.

---

## 5. Entscheidungen

| # | Entscheidung | Warum |
|---|---|---|
| D10 | **Die App heißt Tracker.** Nur nutzersichtbare Strings; technische Schlüssel bleiben byte-identisch (D8-Muster). Installierte PWAs zeigen den alten Namen bis zur Neuinstallation. | Emils Ansage. Schlüssel umbenennen loggt alle aus, spaltet PWA-Installationen und dupliziert Kalendereinträge — [ADR 0006](adr/0006-sichtbarer-name-wandert-schluessel-eingefroren.md). |
| D11 | **Eine Kurven-Komponente für alles**, kumuliert im ETF-Stil: Einheiten, Anrufe, Termine. Einheiten als zwei disjunkte Linien Eigen + Team. | Steigung = Schlagzahl, Kopf zeigt Zuwachs; ein Bauteil statt drei. Disjunkt, damit die Summe der Gesamtstand bleibt („eine Rechnungsbasis", CONTEXT.md). |
| D12 | **/mannschaft:** Chart-Block ganz oben mit Metrik-Umschalter (Einheiten \| Anrufe \| Termine, alle drei als Mini-Kacheln sichtbar), Matrix direkt darunter, der Rest dahinter. | Emil: Chart oben, Tabelle behalten. Drei große Charts gestapelt schöben die Matrix aus dem Blick. |
| D13 | **/heute bleibt Startseite**; der FK-Kopf führt mit kompakten Aktivitäts- + Einheiten-Kurven. | Postfach, Termine, Nach-Anruf-Fragen wohnen auf /heute — eine Führungskraft braucht sie genauso. |
| D14 | **Personenseite** bekommt Kurven (Einheiten Eigen/Ast, Aktivitäten) und einen ausführlicheren Coaching-Block; wird vorführfest. | Emils Weg Übersicht → Person. Regelbasiert, kein Sprachmodell (Hausregel). |
| D15 | **Kalender:** strukturierte Eingabe mit Wochentags- + Uhrzeit-Chips, kein Freitext-Parsen; Uhrzeit optional auch für Später/Nicht erreicht; Wiedervorlagen **mit Uhrzeit** in Feed und Kalenderansicht. TimeTree bleibt der Feed-Umweg. | Deterministisch statt geratener „Dienstag". Wiedervorlagen ohne Uhrzeit bleiben draußen — sonst 200 Mitternachtseinträge. L8 ist technisch nicht lösbar. |
| D16 | **Direktkontakttrichter:** fünf Stufen Angesprochen → Instagram → Nummer → Termin vereinbart → Rekrutiert, Schnell-Zähler je Stufe, Optik wie /trichter, nur für Führungskräfte, nicht in der Leiste. | „Zum Quote tracken" — dafür reichen Zähler; auf der Straße tippt niemand Namen. Kontakt anlegen bleibt jederzeit separat möglich. |
| D17 | **Vorführen:** Zählnamen „GP n" statt Initialen. | Kürzel anonymisieren vor Insidern nicht; Zeilen bleiben beim Zeigen ansprechbar. |
| D18 | **Titel:** drei komplette Sätze zur Auswahl, Default Mix, Pflege in der Werkstatt (`Einstellung` + Fallback auf `STUFEN`). | Emil pickt; das Team kann nachschärfen, ohne Deploy. |
| D19 | **Arena:** Team-Challenge, Streaks sichtbarer, Saison-Trophäen mit Vitrine. Keine Dauer-Abzeichen, keine Liga (vorerst), kein Wochen-Duell. Register „Sportreportage, trocken" bleibt. | Trophäen mit Ablauf lösen den Konflikt mit der Runde-1-Regel. Liga braucht ~10 Aktive — heute sind es fünf. Zweikampf existiert. |
| D20 | **Teamabend:** Auto-Rückblick-Karten (je Person ein Highlight; Negatives nur aggregiert als Team-Engpass), Emil kuratiert je Browser-Tab; Tabelle zeigt je Person nur die eigene Struktur. | Kommunikation statt Auswertung; kein Pranger (wettbewerb-plan.md:407–421). |
| D21 | **FK-Nav:** ab Führung rückt Mannschaft nach vorn, Namen nach hinten. Megafon bekommt Wort-Label „Feedback" + Ersthinweis. | Führen ist wichtiger als Verwalten; das Feedback-Werkzeug muss nur gefunden werden. |

---

## 6. Arbeitspakete — Übersicht

| AP | Titel | Prio | Größe | Welle | Modell | Kern-Dateien |
|---|---|---|---|---|---|---|
| 15 | VerlaufsChart: Mehrserien + Ablese-Badge + Zahlenformat | P0 | M | 1 | Opus | components/VerlaufsChart.tsx |
| 16 | Aktivitäts-Tagesaggregation | P0 | S–M | 1 | Sonnet | neue lib/aktivitaeten.ts |
| 20 | Kalender: Frage überall, Uhrzeit, Wiedervorlagen im Feed | P0 | M–L | 1 | Opus | QuickRowActions, ResultDialogs, contacts/actions+results, lib/kalender/feed+laden, kalender/page |
| 21 | Direktkontakttrichter | P1 | L | 1 | Opus | schema.prisma + Migration, app/(app)/direktkontakt/, ausbauSicht, wegweiser |
| 17 | /mannschaft neu geordnet | P0 | M | 2 | Opus | mannschaft/page.tsx |
| 18 | /heute-FK-Kopf mit Kompakt-Kurven | P1 | S–M | 2 | Sonnet | heute/page.tsx, LageKopf, MiniVerlauf |
| 19 | Personenseite: Kurven + Coaching + vorführfest | P1 | M | 2 | Sonnet | mannschaft/[id]/page.tsx, lib/fuehrung.ts (Anbau) |
| 24 | Teamabend-Rückblick | P1 | M | 2 | Opus | teamabend/page.tsx, neue lib/rueckblick.ts, Karten-Komponente |
| 25 | Titel konfigurierbar | P2 | S | 3 | Sonnet | lib/stufen.ts, werkstatt/, lib/einstellungen.ts |
| 22 | Vorführen: Zählnamen | P1 | S | 3 | Sonnet | lib/vorfuehren.ts, Hinweistexte |
| 26 | FK-Nav-Reihenfolge + Feedback-Label | P1 | S | 3 | Sonnet | AppShell.tsx, RueckmeldungGeben.tsx |
| 23 | Rename → Tracker | P1 | S–M | 4 | Sonnet | nutzersichtbare Fundstellen |
| 27 | Team-Challenge + Streak im Arena-Kopf | P2 | M | 5 | Opus | arena/page.tsx, lib/arena.ts, Werkstatt |
| 28 | Saison-Trophäen + Vitrine | P2 | M | 5 | Opus | neue lib/trophaeen.ts, spiel/page.tsx |

---

## 7. Die Pakete im Einzelnen

Für jedes Paket gilt: Datei-Eigentum wie in der Tabelle. Braucht ein Paket eine Datei außerhalb, stoppt es und meldet — es baut nicht um. Kein `npm run build` lokal (führt `prisma migrate deploy` gegen die echte Datenbank aus); Prüfung mit `npx tsc --noEmit` und `npx eslint .`. Bearbeitung mit Edit/Write, keine mehrzeiligen sed-Ersetzungen (CRLF-Falle).

### AP-15 — VerlaufsChart: Mehrserien, Ablese-Badge, Zahlenformat

**Anlass:** N1 (zwei Linien), N3 (Stand am Finger), N2 (dieselbe Optik für Anrufe/Termine).

**Ist:** [`components/VerlaufsChart.tsx`](../components/VerlaufsChart.tsx) zeichnet eine Polylinie aus `sockel` + `tage` (Hundertstel), liest per Pointer (:389–407), zeigt Wert + Datum im Kartenkopf (:357–364), formatiert fest mit `formatEinheiten`. Vier Festlegungen im Kopf der Datei (kumuliert auf Sockel, Storni sichtbar, keine Schrift im SVG, kein Hex).

**Bau:**
- Neue Prop `serien: { name: string; sockel: number; tage: Verlaufspunkt[] }[]` (bis 2 Serien). Die bisherigen Props `sockel`/`tage` bleiben als Einserien-Kurzform, damit beide Aufrufer (mannschaft:894, einheiten:162) unverändert weiterlaufen.
- Zweite Serie in eigener Tailwind-Textklasse (currentColor-Muster wie die erste), gemeinsame y-Skala, Legende als HTML unter dem Kopf: Farbpunkt · Name · aktueller Wert.
- `format?: (wert: number) => string` (Default `formatEinheiten`) und `einheitWort?: string` fürs aria-label, damit Anrufe/Termine ganzzahlig erscheinen.
- Ablese-Badge: schwebendes HTML-Element über der Fläche nahe dem Fadenkreuz (versetzt, damit der Finger es nicht verdeckt), zeigt Datum + Wert je Serie. Der Kartenkopf verhält sich weiter wie heute.

**Regeln:** D9 (keine Chart-Library) · keine Schrift im SVG, kein Hex · Storni bleiben sichtbar · [`IndexKurve`](../components/IndexKurve.tsx) und [`MiniVerlauf`](../components/MiniVerlauf.tsx) sind Kopien und werden **nicht** angefasst.

**Fertig wenn:** /einheiten und /mannschaft sehen mit einer Serie exakt aus wie vorher; die Komponente zeichnet zwei Serien mit Legende; das Badge folgt dem Finger; tsc grün.

### AP-16 — Aktivitäts-Tagesaggregation

**Anlass:** N2, N5, N6 — ohne Tageswerte keine Kurve.

**Ist:** `strukturVerlauf()` / `eigenerVerlauf()` in [`lib/einheiten.ts`](../lib/einheiten.ts) liefern Einheiten je Tag (eine Query, Sockel, Berliner Tagesgrenzen). Für Aktivitäten gibt es nur Zeitraum-Summen (`Werte` in [`lib/fuehrung.ts`](../lib/fuehrung.ts):46: `anrufeWoche`, `vereinbart14`, `gehalten14`).

**Bau:** Neue Datei `lib/aktivitaeten.ts` mit `eigeneAktivitaeten(userId)` und `strukturAktivitaeten(userId)` → `{ tage: { tag: string; anrufe: number; vereinbart: number; gehalten: number }[] }` (Tageswerte, nicht kumuliert — kumulieren macht der Aufrufer). Struktur = derselbe `path`-Unterbaum wie `strukturVerlauf`, Platzhalter fallen heraus.

**Regeln:** **Dieselbe Datenquelle wie `Werte`** — wo `anrufeWoche` herkommt, kommen die Tageswerte her; sonst widersprechen sich Kurve und Matrix auf einer Seite. Eine `groupBy`-Abfrage je Aufruf, keine Schleife über Personen. Tagesgrenzen aus [`lib/dates.ts`](../lib/dates.ts). Kein „use client".

**Fertig wenn:** Für eine Person und für eine Struktur stimmen die Summen der letzten 7 Tage mit `anrufeWoche` der Matrix überein (Stichprobe im Kommentar dokumentiert); tsc grün.

### AP-17 — /mannschaft neu geordnet

**Anlass:** N4, N11, N5, N1.

**Ist:** neun Abschnitte, Kurve an achter Stelle (:880), Einheiten-Tabelle danach (:904). Matrix (`MannschaftsMatrix`) ist der erste Block (:423).

**Bau:** Direkt nach dem Seitenkopf ein Chart-Block: drei Mini-Kacheln (Einheiten · Anrufe · Termine, jeweils Endwert + Zuwachs), darunter ein `VerlaufsChart` zur angetippten Metrik. Einheiten = zwei Serien (Eigen = `eigenerVerlauf(user)`, Team = `strukturVerlauf` minus Eigen), Anrufe/Termine aus `strukturAktivitaeten` kumuliert. Dann die Matrix, dann die übrigen Abschnitte in heutiger Reihenfolge; der bisherige Verlaufs-Abschnitt (:880–902) entfällt.

**Regeln:** Einheiten-Metrik hinter demselben `zeigeEinheiten`-Schalter wie bisher; Anrufe/Termine immer. Keine neuen Queries je Zeile — `strukturVerlauf` und `einheitenFuerStruktur` werden schon geladen (:265–273). Vorführen: der Chart-Block zeigt keine Namen.

**Fertig wenn:** Chart oben, Matrix darunter, kein Abschnitt verloren; „Zusammen" in der Tabelle = Endwert Eigen + Team; Handy-Breite geprüft.

### AP-18 — /heute-FK-Kopf mit Kompakt-Kurven

**Anlass:** N5, Foto-Befund 1 (flache Sparkline wirkt wie leerer Balken).

**Ist:** [`components/LageKopf.tsx`](../components/LageKopf.tsx) zeigt Gesamtstand + `MiniVerlauf` des Monats (:155); `monatsKurve()` in [`heute/page.tsx`](../app/(app)/heute/page.tsx):95.

**Bau:** Für `gefuehrte > 0` zwei kompakte Kurven nebeneinander im Kopf: Einheiten (wie heute) und Anrufe der Struktur (Monat, kumuliert, aus `strukturAktivitaeten`), jeweils mit Zahl + Richtung; Tipp führt auf /mannschaft. `MiniVerlauf` bekommt eine Darstellung für „keine Bewegung" (dünne Linie ohne Füllfläche), damit eine Gerade nicht wie ein Balken aussieht.

**Regeln:** `MiniVerlauf` bleibt Server-Komponente ohne Zustand. Keine neue Datenladung außer `strukturAktivitaeten` (einmal).

**Fertig wenn:** FK sieht beim Öffnen beide Kurven im Kopf; Neuling sieht nichts Neues; „+0,00 im August" zeichnet keine Fläche mehr.

### AP-19 — Personenseite: Kurven, Coaching-Block, vorführfest

**Anlass:** N6, N7.

**Ist:** `app/(app)/mannschaft/[id]/page.tsx` — Kennzahlen, „Dein Schritt" (:335) aus `fuehrungsSchritt()`, Termine, Tages-Verlauf als Liste (:451–500). Kein `GpName`.

**Bau:**
- Zwei `VerlaufsChart`: Einheiten (Eigen der Person; führt sie, zweite Serie Ast) und Aktivitäten (zwei Serien Anrufe + vereinbarte Termine) aus `eigeneAktivitaeten`.
- Coaching-Block „Fürs 1:1" unter „Dein Schritt": zwei bis vier Sätze mit Zahlen, regelbasiert aus (a) Trichter-Engpass der Person (kleinste Übergangsquote), (b) Kurventrend (letzte 14 Tage gegen die 14 davor), (c) Stillstand (`stillSeit`). Beispiel: „Seit 3 Wochen keine vereinbarten Termine bei 41 Anrufen — Terminierung üben." Reine Funktion in `lib/fuehrung.ts` als Anbau, keine bestehende Signatur ändern.
- Vorführfest: Namen der Seite über `GpName` mit der `kurzMap` (Muster mannschaft/page.tsx:395).

**Regeln:** kein Sprachmodell, keine Push-Nachricht; Platzhalter zeigen nichts Neues.

**Fertig wenn:** Kurven und Coaching-Block stehen, im Vorführmodus kein Klarname, tsc grün.

### AP-20 — Kalender: Frage überall, Uhrzeit für Rückmeldungen, Wiedervorlagen im Feed

**Anlass:** N10 — Emils stärkste Betonung.

**Ist:** siehe L1–L9 in Abschnitt 3.

**Bau:**
- **L1:** `calledRef` + `visibilitychange`-Muster aus [`NameDialer.tsx`](../components/NameDialer.tsx):85–96 in [`QuickRowActions.tsx`](../components/QuickRowActions.tsx): nach Rückkehr vom `tel:`-Link hebt sich die Ergebnisleiste hervor („Wie lief's mit …?"). Kontaktakte: Anruf-Link auf dieselbe Komponente lenken oder gleich verfahren.
- **L4:** In [`ResultDialogs.tsx`](../components/ResultDialogs.tsx) Wochentags-Chips (nächstes Mo–Fr) neben den relativen Tagen; Uhrzeit-Chips wie gehabt.
- **L5:** Der „Später"-Dialog bekommt optionale Uhrzeit-Chips; `quickLogCall`/`updateData` in [`contacts/actions.ts`](../app/(app)/contacts/actions.ts):284 und [`results.ts`](../app/(app)/contacts/results.ts) schreiben `nextStepAt` mit Uhrzeit (`berlinLocalToUtc`), ohne Uhrzeit weiter Mitternacht.
- **L6:** [`lib/kalender/feed.ts`](../lib/kalender/feed.ts) exportiert Wiedervorlagen **nur mit Uhrzeit** (`hasTimeOfDay`, [`lib/dates.ts`](../lib/dates.ts):133), Dauer 30 Min, Titel „Rückmeldung {Name}" bzw. Ersatztitel bei `feedNamen` aus, stabile UID `wiedervorlage-{contactId}`. [`lib/kalender/laden.ts`](../lib/kalender/laden.ts) bekommt `herkunft: "WIEDERVORLAGE"`, die Kalenderansicht rendert sie mit eigenem Chip.

**Regeln:** keine Migration (`nextStepAt` ist `DateTime`). Echo-Regel (Fremdtermine nie in den Feed) unangetastet. Kein Freitext-Parsen (D15). „Termin vereinbart" bleibt wie es ist.

**Fertig wenn:** Aus der Heute-Liste anrufen → zurückkommen → Frage steht; „Später, Di 15:00" → Eintrag in /kalender und im ICS-Feed; Wiedervorlagen ohne Uhrzeit tauchen nirgends neu auf.

### AP-21 — Direktkontakttrichter

**Anlass:** N14.

**Ist:** kein Zähler, kein Trichter für Direktansprache. Muster: [/log](../app/(team)/log/page.tsx) (Tageszähler `DailyLog` je `QuotaType`), [/trichter](../app/(app)/trichter/page.tsx) mit `TrichterGrafik` und Zeitraum-Pills.

**Bau:**
- Schema: `model DirektkontaktTag { id, ownerId, tag DateTime @db.Date, stufe DirektkontaktStufe, anzahl Int, @@unique([ownerId, tag, stufe]) }`, Enum `ANGESPROCHEN, INSTAGRAM, NUMMER, TERMIN, REKRUTIERT`. Migration **handgeschrieben** unter `prisma/migrations/<Stempel>_direktkontakt/migration.sql`, danach `npx prisma generate`. Kein `migrate dev`/`deploy` lokal — die Migration läuft beim Deploy; bis dahin `catch`-Fallback auf leere Daten (Muster [`app/wegweiserAction.ts`](../app/wegweiserAction.ts):60).
- Seite `app/(app)/direktkontakt/page.tsx` + Server Action `zaehlen(stufe, delta)`: Zähler-Reihe (fünf Stufen, +1 und −1 für Vertipper, heutige Zahl groß), darunter `TrichterGrafik` mit Übergangsquoten über Woche / Monat / Immer.
- Bereich „fuehrung" in [`lib/ausbauSicht.ts`](../lib/ausbauSicht.ts):42–66 (nicht in der Leiste — „verstecktes FK-Tool"); Zugang über eine Karte auf /mannschaft (gehört AP-17: nur ein Link, der Block darf leer bleiben bis AP-21 fertig ist) und einen Eintrag in [`lib/wegweiser.ts`](../lib/wegweiser.ts).

**Regeln:** nur eigene Zähler der Führungskraft, keine Kopplung an Punkte/Arena, keine Kontaktpflicht. Sprache der Stufen wie Emil sie sagt.

**Fertig wenn:** FK tippt fünf Zähler, Trichter zeigt Quoten, Neuling ohne Direkte bekommt die Seite nicht; ohne Tabelle in der DB rendert die Seite leer statt zu fallen.

### AP-22 — Vorführen auf Zählnamen

**Anlass:** N9.

**Ist:** [`lib/vorfuehren.ts`](../lib/vorfuehren.ts) `initialenKuerzel(namen) → Map<string, string>`.

**Bau:** Dieselbe Signatur, neue Zuordnung: Eingabereihenfolge → „GP 1", „GP 2", … Identische Namen erhalten dieselbe Nummer (bekannte Grenze, im Kommentar). Hinweistexte („Namen sind verdeckt, Zahlen echt") und der Kopfkommentar der Datei werden angepasst. Aufrufer bleiben unverändert.

**Fertig wenn:** Vorführen zeigt auf /heute und /mannschaft nur Zählnamen; die Reihenfolge ist innerhalb einer Seite stabil.

### AP-23 — Rename → Tracker

**Anlass:** N12, D10.

**Ist:** ~27 nutzersichtbare Fundstellen seit AP-14 (Logo, Metadaten, Manifest, Willkommen, Texte); Matrix-Kicker „Team-Cockpit".

**Bau:** `grep -rn "Cockpit" app components lib --include=*.ts --include=*.tsx` — jede nutzersichtbare Fundstelle → „Tracker"; Matrix-Kicker → „Teamübersicht". **Nicht anfassen:** `sessionStorage`-Schlüssel `cockpit-vorfuehren`, Cookie-/Cache-/UID-Namen, `__ergoInstall`, Kommentare (dürfen bleiben). Manifest-`name`/`short_name` ändern, `id`/`start_url` nicht.

**Fertig wenn:** kein „Cockpit" mehr auf einem Bildschirm; `grep` zeigt nur noch Schlüssel und Kommentare; Login bleibt erhalten.

### AP-24 — Teamabend-Rückblick

**Anlass:** N13, D20.

**Ist:** siehe Befund N13.

**Bau:**
- `lib/rueckblick.ts`: `rueckblickKarten(fkUserId, woche)` → Karten aus den Wochendaten der eigenen Struktur, **max. eine je Person**, Priorität: Wochentitel-Halter › beste Übergangsquote (Mindestbasis) › größter Sprung gegen die Vorwoche › Serie ≥ 3 Tage. Eine Team-Karte: der Übergang mit der schlechtesten Quote, als „Woran wir diese Woche arbeiten" — ohne Namen.
- Karten-Komponente (Client): Kuratierung an/aus je Karte, Zustand je Browser-Tab (`sessionStorage`, Muster Vorführen), keine Persistenz.
- Karten-Sektion oben auf /teamabend; die bestehenden Blöcke bleiben. Die Wochentabelle zeigt je Person nur Zahlen der eigenen Struktur.

**Regeln:** Negatives nie je Person; Register trocken (keine Emojis, kein Konfetti); dieselben Datenladungen wie Arena/Teamabend, keine neuen je Zeile.

**Fertig wenn:** Emil sieht vor dem Abend die Karten, schaltet zwei aus, zeigt den Rest groß.

### AP-25 — Titel konfigurierbar

**Anlass:** N16, D18.

**Ist:** [`lib/stufen.ts`](../lib/stufen.ts):38–45 `STUFEN` hart codiert; `Einstellung`-Muster in [`lib/einstellungen.ts`](../lib/einstellungen.ts) mit Werkstatt-Pflege.

**Bau:** Schlüssel `stufen.titel` (JSON-Array mit sechs Namen) mit Fallback auf die Konstante; `stufeVon()` liest die Namen über eine gecachte Funktion; Werkstatt-Formular mit den drei Vorschlags-Sätzen als Knöpfe + freier Bearbeitung. Default = Mix.

Die drei Sätze (Stufe 1 → 6):

| Satz | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| **Mix (Default)** | Frischling | Grinder | Terminjäger | Closer | Quotengott | Legende |
| Gaming-Flex | Rookie | Grinder | Hustler | Closer | Endboss | Legende |
| Vertriebs-Ironie | Kaltakquise-Küken | Wählscheiben-Warrior | Terminmaschine | Abschluss-Automat | Quotengott | Lebende Legende |

**Fertig wenn:** Arena und /spiel zeigen die konfigurierten Namen; Werkstatt kann wechseln; ohne DB-Zeile gilt der Mix-Satz.

### AP-26 — FK-Nav-Reihenfolge + Feedback-Label

**Anlass:** N8, N17, D21.

**Bau:** In [`components/AppShell.tsx`](../components/AppShell.tsx):32–66 zwei Reihenfolgen: ab Führung Heute · Mannschaft · Kalender · Namen · Einladen · Trichter · Wettbewerb (· Team); sonst wie heute. Das Megafon bekommt ab `sm` das Wort „Feedback" daneben, am Handy einen Hinweispunkt, der beim ersten Öffnen verschwindet (`localStorage`-Flag, Fehler abgefangen).

**Fertig wenn:** FK sieht Mannschaft an zweiter Stelle; Neuling unverändert; Feedback ist als Wort lesbar.

### AP-27 — Team-Challenge + Streak im Arena-Kopf

**Anlass:** N15, D19.

**Bau:** Schlüssel `challenge.wochenziel` (Anrufe je Woche, Team gesamt; Werkstatt-Pflege, Platzhalter 100). Arena-Block „Wochenziel" mit Fortschrittsbalken (Summe der Anrufe der Woche aus `ladeRangliste`), Satz „noch 37 bis Freitag 18 Uhr". Im Arena-Kopf die eigene Serie groß („4 Tage in Folge"). Kein Konfetti, keine Punkte fürs Ziel.

**Fertig wenn:** Balken läuft, Ziel änderbar, Register trocken.

### AP-28 — Saison-Trophäen + Vitrine

**Anlass:** N15, D19.

**Bau:** `lib/trophaeen.ts` rechnet je Saison (= Monat) **on-the-fly** aus `DailyLog`: Saisonsieger (meiste Punkte), Quotenkönig (beste Anruf→Termin-Quote bei Mindestbasis), Dauerläufer (meiste aktive Tage). Aktuelle Saison live in der Arena („führt die Saison an"), Vitrine der letzten drei Saisons auf /spiel mit Datum. Keine Migration, keine Persistenz — Regeländerungen wirken rückwirkend, das ist bewusst und im Kopfkommentar erklärt.

**Fertig wenn:** /spiel zeigt die Vitrine; ein leerer Monat zeigt „noch keine Saison".

---

## 8. Bewusst nicht gebaut

- **Freitext-Parsen von „Dienstag 15 Uhr"** — deterministische Chips statt geratener Termine (D15).
- **Schreiben nach TimeTree** — technisch nicht möglich (L8); der Feed-Umweg bleibt, die Latenz wird erklärt.
- **`Termin`-Datensatz aus dem Anruf** — `appointmentAt` bleibt die führende Spalte (laden.ts:10–12).
- **Dauer-Abzeichen** — Runde-1-Regel bleibt; Trophäen verfallen je Saison.
- **Liga mit Auf-/Abstieg** — erst ab ~10 aktiven Loggern sinnvoll; heute fünf. Vermerkt, nicht gebaut.
- **Wochen-Duell** — der Zweikampf mit dem Tabellennachbarn existiert (arena/page.tsx:361–398).
- **Persistente Kuratierung der Rückblick-Karten** — je Browser-Tab reicht für einen Abend.
- **Direktkontakte als echte Kontakte** — Zähler genügen zum Quoten-Tracken; ein Kontakt lässt sich jederzeit separat anlegen.

---

## 9. Offene Punkte an Emil

| # | Frage | Bis dahin |
|---|---|---|
| E1 | Welcher Titel-Satz (Mix / Gaming-Flex / Vertriebs-Ironie) — oder eigene Wörter? | Mix läuft; Werkstatt kann wechseln. |
| E2 | TimeTree bekommt Termine nur über den Handy-Kalender, mit Stunden Latenz. Reicht das, oder soll der Kalender der App selbst der Ort werden? | Feed-Umweg wie gehabt. |
| E3 | Wochenziel der Team-Challenge (Anrufe je Woche, Team gesamt)? | Platzhalter 100. |
| E4 | Liga erst ab ~10 aktiven Loggern — einverstanden? | Nicht gebaut. |
| E5 | Trophäen-Arten ergänzen oder streichen (Saisonsieger, Quotenkönig, Dauerläufer)? | Die drei. |

---

## 10. Wellen-Plan

Je Paket ein Subagent (Modell in Abschnitt 6) mit dem Text des Pakets als Auftrag und expliziter Datei-Eigentümerschaft. Innerhalb einer Welle laufen nur Pakete mit disjunkten Dateien parallel. Agenten committen nicht; nach jeder Welle `git status`, `npx tsc --noEmit`, `npx eslint .`, dann ein Commit je Paket.

| Welle | Pakete | Warum so |
|---|---|---|
| 1 | AP-15, AP-16, AP-20, AP-21 | Fundamente (Chart, Aggregation) und die zwei unabhängigen Stränge (Kalender, Direktkontakt). |
| 2 | AP-17, AP-18, AP-19, AP-24 | Alle Konsumenten von AP-15/16; vier verschiedene Seiten. |
| 3 | AP-25, AP-22, AP-26 | Kleine, unabhängige Pakete. |
| 4 | AP-23 | Rename zuletzt — fasst viele Dateien an. |
| 5 | AP-27, AP-28 | Arena-Erweiterungen nach Emils betonten Punkten. |

Sicht-Check nach Welle 2 und am Ende über die Vorschau (`.claude/launch.json` → `dev`, läuft ohne Migration): /mannschaft, /heute, /kalender, /direktkontakt, Arena, Teamabend — Desktop und Handy-Breite.

---

## 11. Gegencheck — jede Notiz hat eine Heimat

| Notiz | Heimat |
|---|---|
| N1 | D11, AP-15, AP-17 |
| N2 | D11, AP-16, AP-17, AP-19 |
| N3 | AP-15 (Badge) |
| N4 | D12, AP-17 |
| N5 | D13, AP-18 |
| N6 | D14, AP-19 |
| N7 | D14, AP-19 (Coaching-Block) |
| N8 | D21, AP-26 |
| N9 | D17, AP-22 |
| N10 | D15, AP-20; L8 → E2 |
| N11 | D12, AP-17 |
| N12 | D10, AP-23, ADR 0006 |
| N13 | D20, AP-24 |
| N14 | D16, AP-21 |
| N15 | D19, AP-27, AP-28; Liga → E4 |
| N16 | D18, AP-25; Satz → E1 |
| N17 | D21, AP-26 (existiert) |

---

## 12. Anhang — was die Bildschirmfotos vom 31.08. zeigten

1. **Der Monatsbalken im Lagebild wirkt wie ein Fehler.** „224,00 Einheiten · +0,00 im August" und darunter eine waagerechte blaue Linie mit Fläche — `MiniVerlauf` bei null Bewegung. → AP-18.
2. **Der abgelesene Stand steht außerhalb des Blickfelds.** Fadenkreuz mitten in der Kurve, Wert am Kartenkopf außerhalb des Ausschnitts. → AP-15.
3. **Die Matrix trägt viele „—"-Zeilen.** Sechs von elf Köpfen sind Platzhalter ohne Passwort — wie vorgesehen, aber der erste Eindruck ist halbleer. Kein Paket; erledigt sich mit echten Konten.
4. **Vorführen zeigte „Jonas." und „Timo."** — identische Vornamen wachsen bis zum vollen Wort. → AP-22 macht das gegenstandslos.

---

## 13. Umsetzung — Stand 01.09.2026 abends

Gebaut in einer Session über Sonnet-/Opus-Subagenten mit Datei-Eigentum, in fünf Wellen; jedes Paket einzeln geprüft (`tsc`, `eslint`) und committet. Zum Schluss ein echter `npx next build` (ohne Migrationsschritt): grün.

| Commit | Paket | Inhalt |
|---|---|---|
| `9788c51` | Doku | Dieser Plan, CONTEXT.md (Tracker, Zählname, Direktkontakt, Wettbewerb-Begriffe), ADR 0006 |
| `aca22ab` | AP-21 | Direktkontakttrichter: Schema + Migration `20260901120000_direktkontakt`, /direktkontakt, Zähler, eigener Trichter |
| `19ca8b5` | AP-16 | `lib/aktivitaeten.ts` — Tageswerte Anrufe/Termine, Quelle identisch mit der Matrix |
| `0e4e80a` | AP-20 | Frage nach dem Anruf in der Heute-Liste, Wochentags-Chips, Uhrzeit für „Später", Wiedervorlagen in Feed + Kalender |
| `67e7744` | AP-15 | VerlaufsChart: zwei Serien, Legende, Ablese-Badge, Formatter |
| `34efe78` | AP-17 | /mannschaft: Kurven-Block oben (Eigen/Team disjunkt), Matrix darunter, Link zum Direktkontakt |
| `e71a8fe` | AP-24 | Teamabend-Rückblick: Karten je Person, Team-Engpass ohne Namen, Kuratierung je Tab |
| `1ee6188` | AP-22 | Vorführen: Zählnamen „GP n" |
| `2c2d329` | AP-26 | FK-Nav-Reihenfolge, Megafon-Label „Feedback" + Hinweispunkt |
| `f2a4664` | AP-25 | Stufen-Titel konfigurierbar (Werkstatt), Default Mix |
| `a9b7a03` | AP-20b | Uhrzeit auch im Durchlauf, Anruf-Frage in der Kontaktakte, ICS-Knopf-Guard, Wiedervorlage-Stil |
| `aca984f` | AP-18 | /heute-FK-Kopf: Einheiten + Anrufe nebeneinander, Sparkline ohne Fläche bei Stillstand |
| `41c0f2b` | AP-28 | Saison-Trophäen + Vitrine auf /spiel, on-the-fly aus DailyLog |
| `e6e74a8` | AP-23 | Rename → Tracker: 40 Stellen in 23 Dateien, Schlüssel byte-identisch |
| `92a36a9` | AP-27 | Team-Challenge, eigene Serie im Arena-Kopf, Saison-Zwischenstand, Teamabend nur eigene Struktur (D20-Rest) |
| `c1a4d15` | Nachzügler | Vitrine-Schalter + Zählstelle, Feature-Zeilen für direktkontakt/challenge/trophaeen in der Migration |
| `e05f27a` | AP-19 | Personenseite: Kurven (Eigen/Ast, Anrufe/Termine), Block „Fürs 1:1", vorführfest |

Dazu `c4add9c` (`.codegraph/` ignoriert). Die Commits `37746aa`/`2547a15` stammen von einer parallelen Session (Konto austragen/löschen) und liegen dazwischen.

### Prüfstand

- `npx tsc --noEmit` grün, `npx eslint .` ohne Fehler (eine Warnung in einem gitignorierten Audit-Skript), `npx prisma validate` grün.
- `npx next build` grün — bewusst **nicht** `npm run build`: das Skript ist `prisma migrate deploy && next build` und würde die Migration gegen die geteilte Prod-DB fahren.
- `prisma migrate status`: genau eine offene Migration, `20260901120000_direktkontakt` (additiv, idempotent, ohne eigenes BEGIN/COMMIT). Bis zum Deploy fängt der Code die fehlende Tabelle ab.
- Sicht-Check hinter dem Login: nur mit Adriens Anmeldung in der Vorschau möglich (Passwörter gibt es hier nie) — offen, siehe unten.

### Bewusste Abweichungen und Restpunkte

- **Abweichung in AP-17:** Der Kartenkopf der Einheiten-Kurve zeigt die führende Serie (Eigen), die Kachel darüber Eigen + Team — in der Fußnote erklärt. Stört es Emil, zeigt die Kachel künftig nur Eigen.
- **Vorführen auf der Personenseite:** „Dein Schritt" (aus `fuehrungsSchritt()`), „Termine, die anstehen" und „Liegt länger" nennen im Fließtext weiter Klarnamen — bewusst nicht angefasst (Scope), meldenswert.
- **Trichter-Grafik dupliziert:** `components/TrichterGrafik.tsx` ist auf vier Stufen festgenagelt; der Direktkontakt hat eine eigene Kopie mit fünf. Ein Einzeiler (`HOEHE` aus `stufen.length`) würde die Kopie überflüssig machen.
- **`lib/rueckblick.ts`** ermittelt die Struktur auf /teamabend ein zweites Mal selbst (AP-27 filtert Rangliste/Puls separat). Ein optionaler `personIds`-Parameter würde eine Abfrage sparen.
- **Alte Zeilennummern** in den AP-Beschreibungen (Abschnitt 7) stimmen nach dem Umbau nicht mehr — sie beschreiben den Ist-Zustand vor der Umsetzung.
- **Liga** nicht gebaut (E4), **Wochenziel** Platzhalter 100 (E3), **Titel-Satz** Mix läuft (E1), **TimeTree-Latenz** zu erklären (E2), **Trophäen-Arten** die drei (E5).
- **Installierte PWAs** zeigen bis zur Neuinstallation „Cockpit" (ADR 0006).

### Wie es weitergeht

1. Adrien loggt sich in der Vorschau ein → Sicht-Check /mannschaft, /heute, /mannschaft/[id], /direktkontakt, /arena, /spiel, /teamabend, /kalender, Desktop und Handy-Breite.
2. Push nach `origin` — Vercel baut den Preview und fährt dabei die Migration auf der Prod-DB; vorher ein Probelauf der SQL in einer Transaktion mit Rollback (Repo-Regel).
3. Emil die fünf offenen Punkte E1–E5 stellen.
