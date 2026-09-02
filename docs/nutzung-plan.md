# Nutzungs-Plan — von einem aktiven Nutzer auf drei

Stand: 01.09.2026, spät — **Fassung 2, gebaut in drei Commits** (9cc6069 Wecker · bc05321 Akt + Brücke · c8920bb Bitte/Schwelle/Verdient), voller `next build` grün, Branch gepusht, Preview steht. **Migration `20260902120000_bitte` ist auf der Live-DB — eingespielt durch den Vercel-Preview-Build (`npm run build` = `prisma migrate deploy`), nicht von Hand. Offen: Fast-Forward von `main` = Production-Deploy, nur durch Adrien.**
Fassung 1 vom 31.08. ist durch die Nachprüfung überholt; die Kontext-Tabelle unten sagt, was sich gedreht hat.
Quelle der Entscheidungen: Frage-Runden mit Adrien am 31.08. und 01.09.


## Kontext

Die Nutzung des Cockpits flacht nicht ab — sie ist nie angesprungen. Aus der Prod-DB, 31.08./01.09.2026, alles lesend erhoben:

- **12 Konten**, davon 6 Platzhalter ohne Zugangsdaten. 156 Einträge in drei Wochen, beste Woche 3 Köpfe.
- Die Messlatte aus dem Glossar (*Aktiver Nutzer* = Einträge an ≥3 Tagen einer Woche, ohne Admin) stand **nie höher als 1**.
- Timo, Jonathan, Jonas: null Einträge. Emil: ein Log-Tag. **nick** ist der Einzige, der arbeitet — und der, von dem „zu viel" kam.

**Was nick wirklich tut** (Fassung 1 hatte das falsch gelesen):

| | Strichliste (`+`) | Pipeline (am Namen) |
|---|---|---|
| Nummern gezogen | 32 | 32 Namen angelegt |
| Anrufe | 3 | 2 Aktivitäten |
| Termine vereinbart | **6** | 1 |
| Termine gehalten | 1 | 1 |
| Abschluss gewonnen | **1** — der einzige der Instanz | 1 |
| Namen auf `NEU` | — | **28** |

Sechs Termine aus drei Anrufen gibt es nicht. nick telefoniert; er **trägt die Anrufe nicht ein** und hängt Ergebnisse fast nie an den Namen. Sein Mangel ist Buchführung, nicht Telefonieren. Und: mindestens 5 seiner 28 „liegengebliebenen" Namen hat er längst bearbeitet.

**Die drei Funde, die den Plan tragen:**

1. **Der Anlass ist gebaut und erreicht einen Menschen.** Cron Mo–Fr 6:00 (`vercel.json` → `app/api/cron/meldungen/route.ts`), VAPID-Schlüssel und `CRON_SECRET` stehen in Vercel Production. Die Meldung ist richtig formuliert (*„Marco liegt seit 6 Tagen. Anrufen oder von der Liste nehmen."*). Push-Abos: **nick 1, alle anderen 0** — obwohl alle sechs die App installiert haben. Der Schalter (`components/Meldungen.tsx`) hängt tief auf `/heute` hinter `{vollerUmfang && …}` und wurde in `docs/ausbau-plan.md` **absichtlich** für Ausbau 1 versteckt („Verschwindet: … Push-Aufforderung"). Ausbau-Plan und Wecker widersprechen sich.
2. **Zwei Wahrheiten.** Die Strichliste (`app/(team)/log/quickLogAction.ts`, per `+` in `components/Schnellzugriff.tsx`) kennt keinen Namen. Der Wecker liest nur die Pipeline (`Contact.lastProgressAt`). Er würde nick Namen melden, die er erledigt hat — und wer morgens Falschmeldungen bekommt, schaltet sie ab.
3. **Der Wecker zeigt auf eine Seite, die auf Ausbau 1 nichts zeigt.** Push-URL ist `/heute`; dort hängen Liegenbleiber-Streifen, Namen ohne Schritt und Push-Schalter an `vollerUmfang`. `/namen` ist auf Ausbau 1 offen und zeigt `liegtTage` je Name schon heute.

Und ein Fund, der den Bau **verkleinert**: die „erste echte Aufgabe" existiert. `/namen/anrufen` (`components/NameDialer.tsx` → `recordCallResult` → `quickLogCall`) loggt den Anruf, hebt `NEU` auf `KONTAKTIERT`, setzt `lastProgressAt`, zeigt den Leitfaden aus `lib/guides.ts`.

**Ziel:** 3 aktive Nutzer bis 30.09.2026 (nick, Jonathan, Emil), montags gemessen mit `node scripts/nullmessung-aufbau.mjs`. 10 bis 31.12. bleibt das Fernziel.

---

## Entschieden

| Frage | Entscheidung |
|---|---|
| Ursache | Kein Anlass **und** zu viel auf einmal |
| „Verlorener RG/VG" | Ein **liegengebliebener Name** auf Recruiting- oder Verkaufsliste |
| Wer zuerst | Emil als **Führungskraft**, nick festhalten, dann Breite (die sechs Platzhalter) |
| Vier Reiter | Ausrollen. nick **nicht** automatisch hochstufen |
| Weg zu mehr | Der Betroffene stellt eine **Bitte**, FK **oder** Admin gibt frei; immer leise auffindbar |
| Wo landet die Bitte | Lagebild der FK **und** Werkstatt. Kein Push, keine Frist |
| Schwelle für den Vorschlag | **Ergebnisse statt Anrufe: 5 Termine vereinbart ODER 1 gehaltener Termin** (Fassung 2 — 10 Anrufe hätte nick nie erreicht) |
| Tutorial | **Eigener Willkommens-Akt**, der den vorhandenen Durchlauf mit genau einem Namen einbettet |
| Wer bekommt ihn | Alle sechs mit Zugang |
| Zwei Wahrheiten | **Die Strichliste fragt „mit wem?"** — ein Tipp hängt das Ergebnis an den Namen, „ohne Namen" bleibt möglich (Fassung 2) |
| Push für Neue | Harte Stufe im Willkommens-Ablauf, mit „später", das wiederkommt |
| Push für Bestehende | Nachfrage beim nächsten Öffnen |
| Wortkollision | „Freischalten" bleibt der Griff am Ausbau; Karrierestufen-Belohnungen heißen **Verdient** |
| Reihenfolge | Wecker → Reiter + Aufgabe + Brücke → Bitte |

---

## Zug 1 — Der Wecker bekommt Empfänger und ein Ziel

Kein neuer Inhalt, nur Empfänger und eine Adresse. **Vor** dem Ausrollen der vier Reiter.

1. **`app/(app)/heute/page.tsx`** (~Z. 883): `<Meldungen>` aus `vollerUmfang` lösen und **nach oben** — als Karte, nicht als Fußnote unter dem Tagespensum. Die Selbstblendung in `components/Meldungen.tsx` bleibt (`stand === "an"` → nichts), ebenso Regel 1 im Dateikopf: nie ungefragt fragen, erst der eigene Knopf, der erklärt, wofür.
2. **`docs/ausbau-plan.md`**: „Push-Aufforderung" von *Verschwindet* nach *Bleibt* — der Widerspruch muss im Dokument stehen, nicht nur im Code.
3. **Neuer Akt in `lib/willkommen.ts`** (`AKTE` und `LEADER_AKTE`, direkt nach `boot`): Erlaubnis für Meldungen, mit einem Satz warum. „Später" erlaubt; taucht danach bei jedem Öffnen wieder auf, bis erteilt. **Nicht** nach `/einladung/[code]` — die Einlösung endet mit `redirect("/willkommen")`, und erst dort läuft man in der installierten App, auf iOS die einzige Stelle, an der die Erlaubnis erteilt werden kann. Rendern wie die anderen Akte in `components/willkommen/Willkommen.tsx` (`{akt === "…" && <… onDone={weiter} />}`), den Knopf aus `Meldungen.tsx` wiederverwenden.
4. **Push-Ziel je Ausbau** in `app/api/cron/meldungen/route.ts`: Liegenbleiber-Meldung → `url: "/namen"` für Ausbau 1, `/heute` für voll. Der Cron liest den Ausbau bisher nicht; `ausbaustand()` aus `lib/ausbau.ts` liefert ihn. Rule 1 in `lib/push.ts` — *eine Meldung führt auf eine Seite, auf der es getan werden kann* — gilt wieder.
5. **Empfehlung, nicht entschieden:** den Liegenbleiber-Streifen (Z. 823) auf Ausbau 1 als **eine Zeile** mit Link auf `/namen` stehen lassen. Der Wecker verspricht ihn; die Seite sollte ihn halten.
6. **Nachweis**: der Cron protokolliert nichts. Nach dem ersten Lauf die Vercel-Function-Logs des Cron lesen (Rückgabe enthält die Zählwerte). Reicht das nicht, später eine kleine Sendetabelle — nicht jetzt.

**Bis Zug 2 steht, meldet der Wecker nick gelegentlich Erledigtes.** Tage sind hinnehmbar, Wochen nicht — deshalb Zug 1 und 2 in derselben Woche.

---

## Zug 2 — Vier Reiter, die Aufgabe, die Brücke

Gehen **zusammen** live.

1. **Merge** `redesign/liquid-glass` nach `main` — **Fast-Forward** (lokales `main` 07b9798 ist Vorfahr von `origin/main` ad63a1a, der Branch ist `origin/main` + 2). Die Migration läuft bereits auf der Prod-DB.
2. **Willkommens-Akt „anruf"** in `lib/willkommen.ts`, in `AKTE` zwischen `sprint` und `einstufung`: bettet `components/NameDialer.tsx` mit **genau einem Namen** ein — dem ersten aus dem Sprint, sonst dem ältesten `NEU` mit Nummer. Muster `components/willkommen/NamenSprint.tsx` (`onDone`, Überspringen, `aktErreicht`-Messstempel). Ergebnis fließt über `recordCallResult` an den Namen — **kein zweiter Schreibpfad.** Für die sechs Bestehenden ein einmaliger Wiedereintritt über denselben Mechanismus, der Neue nach `/willkommen` schickt (`startedAt` in `app/login/actions.ts` — beim Bau prüfen, wie das Tor heute steht).
3. **Die Brücke** in `app/(team)/log/quickLogAction.ts` + `components/Schnellzugriff.tsx`: nach einem Tipp auf *Anruf* oder *Termin* erscheint die eigene Namensliste (`NEU`/`KONTAKTIERT`, mit Nummer — dieselbe Auswahl wie `/namen/anrufen`). Ein Tipp ruft `quickLogCall` bzw. `setContactStage` + `fortschrittJetzt` aus `lib/liegenbleiber.ts`; der Strich bleibt, der Name bewegt sich, der Wecker schweigt zu Recht. **„Ohne Namen" bleibt ein Tipp** — kein Zwang. Nummern gezogen bleibt ohne Frage, das ist schon der Name.

**Prüfen vor dem Deploy:** voller `next build` (`"use server"`-Dateien brechen erst im echten Bau), `node scripts/ausbau-probe.mjs`, den Akt auf dem Handy bis zum echten `CALL`-Eintrag durchspielen.

---

## Zug 3 — Bitte, Schwelle, Verdient

1. **Schema**: `User.bitteAm: DateTime?`. Eine Bitte je Person, endet mit der Freischaltung. Handgeschriebene, idempotente Migration **ohne eigenes `BEGIN;`/`COMMIT;`**, Probelauf mit `ROLLBACK`.
2. **`lib/ausbauSicht.ts`**: leiser Eintrag am Ende der vier Reiter — *„Das Cockpit kann mehr."* Kein Banner. Regeln hier, nicht in `lib/ausbau.ts` (kein Prisma im Browser-Bündel).
3. **`lib/ausbau.ts` — Schwelle auf Ergebnisse**: `vorschlaegeFuer()` summiert statt `CALL` + `APPOINTMENT_HELD` künftig `APPOINTMENT_SET` + `APPOINTMENT_HELD`; Bedingung **ODER** statt UND. `schwellen()` liest `ausbau.termine_vereinbart` (5) und `ausbau.termine_gehalten` (1) aus der `Einstellung`-Tabelle; `SCHWELLEN_PLATZHALTER`, `Vorschlag.grund` („6 Termine vereinbart, 1 gehalten") und die Werkstatt-Einstellung ziehen mit. `scripts/ausbau-probe.mjs` auf die neuen Argumente umstellen. **nick reißt die Schwelle sofort** — als Vorschlag an Jonathan und in der Werkstatt, nie automatisch.
4. **Bitten in dieselbe Liste**: `vorschlaegeFuer()` liefert offene Bitten mit `grund: "hat gebeten"`; Anzeige als Griff-Karte im Lagebild (`app/(app)/heute/page.tsx`) und in `app/(team)/werkstatt/page.tsx` unter „Warten auf Freischaltung". Wer zuerst greift, gibt frei.
5. **`lib/freischaltung.ts`**: was ab einer Karrierestufe aufgeht, heißt **Verdient** — Datei und Kacheln, nicht das Modell.

---

## Daneben, ohne Code

- **nick anrufen, eine Frage:** „zu viel" — zu viel zu *sehen* oder zu viel *einzutragen*? Die Zahlen sagen: er trägt Ergebnisse ein und lässt die Anrufe weg. Wenn es das Eintragen ist, ist die Brücke wichtiger als die vier Reiter.
- **Emil lädt seine vier ein** (Justin, Eric, Gergo, Digo Tippgeber) — sie haben **keine Einladung**, Emil hat bisher genau eine erstellt. Sein erster Griff als Führungskraft. **Aber erst nach Zug 2**: Justin hat am 01.09. die volle App auf einem fremden Handy (Ausbau 2) gesehen und „zu viel Input" gemeldet — die dritte Bestätigung nach nick und Emils Runde 1. Er soll den Anfang auf seinem eigenen Handy zum ersten Mal sehen, nicht die sieben Reiter ein zweites Mal.
- **Nicht mehr vorführen auf dem eigenen Handy.** Wer die App eines Fortgeschrittenen sieht, sieht das Falsche. Bis zum Ausrollen: Einladung schicken oder warten.
- **Kai und Richard nachfassen** — Einladungen vom 27.08., **laufen am 10.09. ab**, nicht eingelöst.
- **Montags** `node scripts/nullmessung-aufbau.mjs`.

---

## Glossar (`CONTEXT.md`)

- **Bitte** (neu, Abschnitt Ausbau): Der Wunsch einer Person, mehr vom Werkzeug zu sehen. Sie stellt ihn selbst; freigeben kann ihn nur ihre Führungskraft oder der Admin. Nicht zu verwechseln mit der **Anfrage** — die kommt von außen und will erst einen Zugang.
- **Ausbau**: *„Die Führungskraft hebt ihn, nie der Betroffene"* bleibt — ergänzt um: der Betroffene darf darum **bitten**.
- **Freischalten**: dazu, dass der Vorschlag der App aus **Ergebnissen** kommt (Termine), nicht aus Anrufen.
- **Verdient** (neu): Was ab einer Karrierestufe aufgeht. Trennt sich vom **Freischalten**.

## ADR-0007 — Die Bitte um Ausbau

(0006 ist seit dem 01.09. belegt: „Sichtbarer Name wandert, Schlüssel eingefroren" — die App heißt für Nutzer jetzt **Tracker**. Dieser Plan sagt noch „Cockpit"; im Bau die Oberflächen-Texte in der neuen Sprache schreiben, `CONTEXT.md` trägt die Umbenennung bereits.)

ADR-0005 verwarf die „Selbstauswahl beim ersten Start". Die Bitte ist etwas anderes: die Entscheidung bleibt bei der Führungskraft, nur der Anstoß darf von unten kommen — weil nicks Führungskette (Jonathan → Timo) zusammen null Aktivitäten hat und seine Bitte dort versandet wäre. Zweiter Empfänger: die Werkstatt. Dazu die Abkehr von Anrufen als Maß: eine Schwelle, die Buchführung misst, hält den besten Verkäufer am längsten schmal.

---

## Prüfen

1. `npx tsc --noEmit`, `eslint`, dann **voller `next build`** (Dev-Server vorher beenden).
2. `node scripts/ausbau-probe.mjs 5 1` (neue Bedeutung: Termine vereinbart / gehalten) — muss nick zeigen.
3. Migration: ganze `.sql` in **einer** Transaktion, prüfen, `ROLLBACK`, erst dann `migrate deploy`.
4. Auf dem Handy hinter echtem Login (375px): vier Reiter, Push-Karte oben auf `/heute` **auf Ausbau 1**, Willkommens-Akt bis zum echten `CALL`-Eintrag, Strich auf *Termin* → „mit wem?" → Name steht auf `TERMIN_VEREINBART`.
5. Nach dem Deploy: `PushAbo` je Kopf (heute nick 1, Rest 0), Vercel-Cron-Log am nächsten Werktag, Push-URL für einen Ausbau-1-Kopf = `/namen`.

## Bewusst nicht in diesem Plan

| Nicht gebaut | Warum |
|---|---|
| Neue außerhalb der Struktur | `/anfrage` hat 0 Eingänge. Erst die sechs Platzhalter |
| Teamabend als Ritual | Wartet, bis drei Leute laufen |
| Sendeprotokoll für den Cron | Erst, wenn die Vercel-Logs nicht reichen |
| Nachziehen der Schwellen | Nach dem ersten echten Monat |

## Budget — muss ins heutige Kontingent passen

- **Drei Sonnet-Agenten, einer je Zug**, nacheinander. Jeder bekommt diesen Plan als Datei plus die drei bis fünf Dateipfade seines Zugs — keine eigene Erkundung, die ist erledigt.
- Die Hauptsession liest je Zug nur: Resümee des Agenten, `git diff --stat`, Ergebnis von `tsc`/`eslint`. Keine Dateien nachlesen, die der Agent selbst geprüft hat.
- **Ein** voller `next build` am Ende, nicht je Zug. Sicht-QA am Handy nur für Zug 2 (Willkommens-Akt), Rest per `tsc`.
- Commit je Zug durch den Agenten, gezielt gestagt. Kein Push ohne Adrien.

## Achtung beim Bauen

- Die Parallel-Session (Emil-Runde 2) ist abgeschlossen — vor dem ersten Agenten einmal `git status` und `git log`, damit die Agenten auf dem echten Stand aufsetzen. Danach gilt: nur eigene Dateien, `git add <pfade>`, **nie** `git add -A`.
- Die lokale `.env` zeigt auf **dieselbe Supabase wie Production**, und `package.json` sagt `"build": "prisma migrate deploy && next build"`. **Regel für jeden Agenten: lokal ausschließlich `npx next build`, nie `npm run build`.** Migrationen laufen nur ausdrücklich, nach dem `ROLLBACK`-Probelauf, in Zug 3.
- **Stand des Branches**: `redesign/liquid-glass` = `856c361`, sauber, gepusht, enthält die vier Reiter **und** Emils Runde 2 (AP-15 bis AP-28). Der Fast-Forward von `main` in Zug 2 nimmt beides mit — so wie am 29.08. verfahren.
- `docs/nutzung-plan.md` im Repo trägt noch Fassung 1 und wird als Erstes nachgezogen.
