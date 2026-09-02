# Emils Feedback-Runde (Cockpit)

Stand: 27.08.2026 — **Nachtrag 29.08.2026: ALLE 14 Arbeitspakete sind umgesetzt und committet** (AP-01 `3bd1014`, AP-02/10 `91c106d`, AP-03 `8a26117`, AP-04 `8e86da4`, AP-05 `0214ff1`, AP-06 `71f1ed5`, AP-07 `0762ab6`, AP-08 `5ba9858`, AP-09 `257ec6e`, AP-11 `7be6b1b`, AP-12 `a6e422c`, AP-13 `da26756`, AP-14 `ea48cc5`). Offen sind nur noch die fünf fachlichen Rückfragen an Emil in Abschnitt 7 — alles Konfigurierbare läuft bis dahin mit Platzhaltern.
Anlass: Emils Brainstorming-Feedback vor dem Teamabend — ausgewertet, gegen die Codebasis geprüft und in Arbeitspakete geschnitten, die eine frische Session ohne Vorwissen umsetzen kann.
Nachfolger: **Runde 2 vom 31.08.2026** steht in [emil-feedback-runde-2.md](emil-feedback-runde-2.md) — Emils Rückmeldung auf genau diesen umgesetzten Stand.

> **Emil beschreibt selten fehlende Features — meist beschreibt er Features, die er nicht gefunden hat. Erst prüfen, dann bauen.**

Basis: Branch `redesign/liquid-glass`, Commit `07b9798` (sichert den Wegweiser-Stand). Es laufen parallele Sessions auf diesem Branch — jede Umsetzer-Session beginnt mit `git pull` und einem Blick auf den Wellen-Plan in Abschnitt 8. Die Migration `20260826200000_wegweiser` läuft erst beim nächsten Deploy; bis dahin fangen [`app/wegweiserAction.ts`](../app/wegweiserAction.ts) (Zeile 60) und [`app/(team)/werkstatt/page.tsx`](../app/(team)/werkstatt/page.tsx) (Zeile 78) die fehlende Tabelle per `catch` ab.

---

## 1. Was Emil sagte — und was davon schon steht

✅ schon da · 🟡 teilweise · ❌ fehlt

| # | Notiz (sinngemäß) | Befund | Status |
|---|---|---|---|
| F1 | Multiplizierbar, „einmal einladen und Person weiß, was zu tun ist" | Kompletter Flow existiert: Schleuse (Installation Pflicht am Handy) → Einladung einlösen → Willkommen mit zwei Drehbüchern ([`lib/willkommen.ts`](../lib/willkommen.ts):20–39) → ErsteWoche auf /heute. Lücke: Karrierestufe/Einheiten kommen darin nicht vor → **AP-12** | 🟡 |
| F2 | „32,67 muss eintragbar sein" | Geht bereits: `parseEinheiten` ([`lib/einheiten.ts`](../lib/einheiten.ts):60–72) akzeptiert Komma, speichert Int-Hundertstel. Echte Lücken: Formular schluckt Fehler stumm, „32 67" wird still zu 3267,00, Anzeige mal „12,5" mal „32,67" → **AP-03** | 🟡 |
| F3 | Fragezeichen „Wo finde ich meine Einheiten?" → „Ergo protek" oder FK fragen | Fehlt. Gemeinte App: **ERGO Prothek** (App Store, verifiziert) → **AP-03** | ❌ |
| F4 | „Woher kommen die Einheiten, aus welcher Struktur" | Rechenwerk existiert (`einheitenFuerStruktur`, [`lib/einheiten.ts`](../lib/einheiten.ts):400–453; Tabelle auf [/mannschaft](../app/(app)/mannschaft/page.tsx):713–783). Fehlt: Anteils-/Fokus-Sicht → **AP-06** | 🟡 |
| F5 | Stufen-Schwellen, „selbst eintragbar, richtig krass promotebar" — Werte schickt Emil | Hart codiert: `SCHWELLEN = { 1: 500*100 }` ([`lib/einheiten.ts`](../lib/einheiten.ts):149), Balken nur Stufe 1, kein Konfig-Modell in der Werkstatt → **AP-07** | 🟡 |
| F6 | Einheitenaufteilung, 50%-Regel einer Struktur — Details schickt Emil | Fehlt; Datenbasis (Ast-Summen) vorhanden → **AP-06** | ❌ |
| F7 | Trade-Republic-Chart (W/M/6M/J/Gesamt, Tagesdurchschnitt) für Einheiten/Aktivitäten/GP | Fehlt. Keine Chart-Library (Hausregel), keine Einheiten-Tages-Aggregation → **AP-08** | ❌ |
| F8 | „Eintragen größer, direkt am Anfang, nicht unter Wettbewerb" | [/heute](../app/(app)/heute/page.tsx) zeigt null Einheiten; Eingabe nur Kopfzeilen-Plus, /einheiten (Unterreiter von Wettbewerb), Nach-Abschluss-Modal → **AP-02** | ❌ |
| F9 | „Bei Wettbewerb muss Statistik und Einheiten raus" | „Einheiten" ist Reiter in [`components/WettbewerbNav.tsx`](../components/WettbewerbNav.tsx):14–22; /arena selbst ist bereits nur Team-Geschehen → **AP-04** | 🟡 |
| F10 | „Statistik ist Hauptpunkt für Führungskräfte" | `mannschaftsLage` ([`lib/fuehrung.ts`](../lib/fuehrung.ts):218) liefert je Person Ampel + Werte, aber verstreut über 800 Zeilen /mannschaft; /heute zeigt FK nur „X braucht dich" → **AP-01, AP-05** | 🟡 |
| F11 | „Ab Stufe 2 andere Ansicht, Stufe 1 sehr simpel" | Ansatz existiert: /heute verzweigt auf `gefuehrte > 0` (:126, :148) — Position statt Stufe ist bewusstes Hausprinzip ([`prisma/schema.prisma`](../prisma/schema.prisma):252–254) → **AP-05** | 🟡 |
| F12 | „Namen-Tab: Tabelle, eine Seite, keine Excel sondern geil" | Heute Card-Zeilen ([`components/NameList.tsx`](../components/NameList.tsx)), kein Tabellen-Layout → **AP-09** | ❌ |
| F13 | „Timetree muss funktionieren, also der Kalender-Sync" | Vollständig gebaut, beide Richtungen ([`lib/kalender/`](../lib/kalender/abgleich.ts)), manueller Abgleich-Knopf existiert ([`app/(app)/kalender/quellen/actions.ts`](../app/(app)/kalender/quellen/actions.ts):126–147). Schwächen: Cron 1×/Tag (Vercel Hobby), inoffizielle API bricht leise, Apple/Google-Login bei TimeTree ausgeschlossen, auf /kalender selbst kein Status sichtbar → **AP-13** | 🟡 |
| F14 | „Ergo muss aus Kopf raus" | Bestätigt: Branding aus Kopfzeile/App-Titel. Neuer Name (entschieden): **Cockpit**. ~27 nutzersichtbare Fundstellen kartiert → **AP-14** | ❌ |
| F15 | „Heute Abend geile Übersicht, Ampeln, beieinander" | Bausteine da (`ampel` je Person aus `ampelVon`, [`lib/signale.ts`](../lib/signale.ts):223; `Werte`-Typ), aber keine dichte Matrix → **AP-01** | 🟡 |
| F16 | „Auf Kerngeschäft fokussieren, da trage ich ein, da geht das" | Querschnittsziel — fließt in F8/F9/F11 ein | — |
| F17 | „Website fragt: wie war der Termin? Du musst eintragen" | Halb da: Zeilen-Aktion Gehalten/Geplatzt + Dialog „Und? Was kam raus?" ([`components/ResultDialogs.tsx`](../components/ResultDialogs.tsx):148–213). Fehlt: proaktive Karte für vergangene Termine → **AP-10** | 🟡 |
| F18 | „Kein-Interesse-Button raus" | Button an zwei Stellen: [`components/QuickRowActions.tsx`](../components/QuickRowActions.tsx):139–146 + [`components/NameDialer.tsx`](../components/NameDialer.tsx):359–366 → **AP-11** | ❌ |

---

## 2. Glossar

- **Einheit (EH):** ERGO-Bewertungseinheit der Produktion, 2 Nachkommastellen. Gespeichert als Int-Hundertstel (`Einheitenbuchung.hundertstel`) — bewusst kein Prisma-Decimal (übersteht die Server→Client-Grenze nicht). Einzige Umrechnungsstelle: [`lib/einheiten.ts`](../lib/einheiten.ts).
- **Karrierestufe:** Betriebs-Laufbahnstufe 1–6, selbst eingetragen, `User.karrierestufe` — **die DB-Spalte heißt weiter `kernstufe`**. NICHT verwechseln mit der **Wettbewerbsstufe** ([`lib/stufen.ts`](../lib/stufen.ts), Anwärter…Veteran, gerechnet) und NICHT mit der Willkommen-Szene „einstufung" (= Kontakt-Rating A/B/C).
- **Führungskraft (FK):** keine Rolle, eine Position — wer Direkte unter sich hat (`leaderId`-Count), führt. Das Rollen-Enum kennt nur ADMIN/MEMBER.
- **Struktur:** der User-Baum (`leaderId` + materialisierter `path`). Ein „Ast" = Unterbaum eines Direkten. Benannte Strukturen („Direktion X") gibt es nicht.
- **Schwelle:** EH-Grenze für die Beförderung zur nächsten Karrierestufe. Werte liefert Emil; bis dahin Platzhalter, konfigurierbar. Achtung: [`lib/signale.ts`](../lib/signale.ts):18 exportiert ein ZWEITES, fachfremdes `SCHWELLEN` (Ampel-Werte).
- **50%-Regel / Einheitenaufteilung:** ERGO-interne Regel, wie viel ein einzelner Ast beitragen darf. Details liefert Emil; als konfigurierbarer Prozentsatz bauen.
- **Geschäftspartner (GP):** neue Vertriebspartner in der Struktur (User mit `startedAt`), dritte Chart-Metrik neben Einheiten und Aktivitäten.
- **Ampel:** Grün/Gelb/Rot/Grau je Person (`ampelVon`, [`lib/signale.ts`](../lib/signale.ts):223; [`components/Ampel.tsx`](../components/Ampel.tsx)). Grau = Platzhalter.
- **Werkstatt:** Admin-Prüfstand für Feature-Schalter ([/werkstatt](../app/(team)/werkstatt/page.tsx)); bekommt die Schwellen-Pflege.
- **Wegweiser:** Verb-Suchindex im Schnellzugriff ([`lib/wegweiser.ts`](../lib/wegweiser.ts), seit `07b9798` im Repo).
- **Platzhalter:** User ohne `passwordHash` — fällt aus jeder Summe, Ampel und Rangliste.

---

## 3. Entscheidungen

| # | Entscheidung | Warum |
|---|---|---|
| D1 | **Keine Typ-Migration bei Einheiten.** Int-Hundertstel bleibt; nur Eingabe-Härtung + konsistente Anzeige (2 Nachkommastellen überall). | Emils „32,67 geht nicht" beruht auf altem Stand/Findbarkeit; der Speicherweg ist bewusst so gebaut. |
| D2 | **„Kein Interesse":** Schnell-Button raus (beide Stellen), der bewusste Weg „Verloren" im ContactActionDialog bleibt. Enum, Statistik, Altdaten unangetastet. | Emil will die Ein-Tipp-Absage weg; die dokumentierte Verlust-Erfassung bleibt möglich. |
| D3 | **Wettbewerb = Team-Geschehen.** Reiter „Einheiten" raus; /einheiten wird über /heute-Karte + Wegweiser erreicht. KEIN neuer Haupt-Nav-Punkt. | Die Kopfzeile ist voll (8 Punkte, [`components/AppShell.tsx`](../components/AppShell.tsx):88–95). |
| D4 | **Alles Konfigurierbare in die DB:** Schwellen, Fokus-Prozentsatz, später Ampel-Kriterien — Pflege in der Werkstatt (ADMIN), Platzhalter klar markiert. DB-Lesungen mit `.catch`-Fallback auf die Konstante. | Emil liefert Werte nach; nichts darf am Deploy hängen. Fallback-Muster: [`app/(team)/werkstatt/page.tsx`](../app/(team)/werkstatt/page.tsx):70–78. |
| D5 | **FK-Ansicht hängt an der Position (`gefuehrte > 0`), nicht an der Karrierestufe.** | Hausprinzip („Führungskraft ist keine Rolle, sondern eine Position") und bestehender /heute-Zweig. Emils „ab Stufe 2" ist damit abgedeckt: wer führt, sieht mehr. |
| D6 | **Nach-Termin-Prompt** als proaktive Karte oben auf /heute über die BESTEHENDE Datenladung und Dialoge. | Kein zweiter DB-Weg, keine neue Query — Hausregel. |
| D7 | **Kalender:** Der gebaute inoffizielle TimeTree-Weg + ICS-Abo bleibt; das Paket macht den Sync-Zustand sichtbar. | Die offizielle TimeTree-API ist seit 22.12.2023 abgeschaltet (verifiziert) — es gibt keinen besseren Weg zu erfinden. |
| D8 | **Branding:** Neuer Name **„Cockpit"** (entschieden). Nur nutzersichtbare Strings; technische Schlüssel bleiben byte-identisch. | Cookie/Cache/UID/localStorage/`__ergoInstall` umbenennen loggt alle aus, spaltet PWA-Installationen oder dupliziert Kalendereinträge. |
| D9 | **Keine Chart-Library.** Verlaufs-Chart als eigene SVG-Komponente. | Hausregel, vorgemacht vom [`components/Organigramm.tsx`](../components/Organigramm.tsx):10–13. |

---

## 4. Arbeitspakete — Übersicht

| AP | Titel | Prio | Größe | Kern-Dateien |
|---|---|---|---|---|
| 00 | ~~Vorbedingung: Wegweiser-Stand committen~~ **erledigt: `07b9798`** | — | — | Basis aller Pakete |
| 01 | Team-Cockpit: Ampel-Matrix auf /mannschaft | P0 | M | mannschaft/page.tsx, neue Komponente |
| 02 | Einheiten-Karte oben auf /heute | P0 | S–M | heute/page.tsx, neue Client-Komponente, einheiten/actions.ts, lib/einheiten.ts |
| 03 | Eingabe-Härtung + ?-Hilfe (ERGO Prothek) | P0 | S–M | lib/einheiten.ts, einheiten/page.tsx, Schnellzugriff, EinheitenNachAbschluss |
| 04 | Wettbewerb entrümpeln: Einheiten-Reiter raus | P1 | S | WettbewerbNav.tsx, AppShell.tsx (match), einheiten/page.tsx, lib/wegweiser.ts |
| 05 | FK-Zeile auf /heute („Deine Struktur heute") | P1 | S | heute/page.tsx |
| 06 | Einheiten-Herkunft: Anteile je Ast + Fokus-Marker | P1 | M | mannschaft/page.tsx, lib/einheiten.ts |
| 07 | Schwellen konfigurierbar + Beförderungs-Fortschritt | P1 | M–L | schema.prisma, Migration, werkstatt/, lib/einheiten.ts |
| 08 | Verlaufs-Chart (Trade-Republic-Stil) | P2 | L | neue SVG-Komponente, neue Aggregation, einheiten/page.tsx |
| 09 | Namen-Liste als dichte Tabelle | P2 | M | NameList.tsx |
| 10 | „Wie war der Termin?"-Karte auf /heute | P1 | S | heute/page.tsx, QuickRowActions-Wiederverwendung |
| 11 | „Kein Interesse"-Button raus + Totholz | P1 | S | QuickRowActions.tsx, NameDialer.tsx, results.ts, ResultDialogs.tsx |
| 12 | Onboarding: neue Karrierestufen-Szene im Willkommen | P1 | M | lib/willkommen.ts, components/willkommen/ |
| 13 | Kalender-Status auf /kalender + Diagnose | P2 | S–M | kalender/page.tsx, quellen/page.tsx |
| 14 | ERGO raus → „Cockpit" | P1 | S–M | Logo.tsx, layout.tsx (nur Metadaten!), manifest.ts, ~27 Fundstellen |

---

## 5. Die Pakete im Einzelnen

### AP-01 — Team-Cockpit: Ampel-Matrix (Demo-Paket)

**Anlass:** „Muss Emil heute Abend noch geile Übersicht geben […] im Sinne von Ampeln, beieinander."

**Ist:** Alles vorhanden, aber verstreut. `mannschaftsLage` ([`lib/fuehrung.ts`](../lib/fuehrung.ts):218) liefert je Person `ampel` („grau/gruen/gelb/rot", berechnet Zeile 610 via `ampelVon`) und den `Werte`-Typ (Zeile 46: `anrufeWoche`, `vereinbart14`, `gehalten14`, `abschluesseMonat`, `punkteWoche`). Die Einheiten-Map wird auf der Seite schon geladen ([`app/(app)/mannschaft/page.tsx`](../app/(app)/mannschaft/page.tsx):195–202).

**Bau:** Neue Komponente `MannschaftsMatrix` als ERSTER Block auf /mannschaft — eine dichte Zeile pro Person: Ampel-Punkt, Name, Anrufe Woche, Termine vereinbart 14T (`vereinbart14`), Abschlüsse Monat, Einheiten Monat, Punkte Woche. Sortiert rot → gelb → grün → grau, Summenzeile oben, `tabular-nums`.

**Regeln:**
- NUR die bereits geladenen Daten: `lage` + die vorhandene `einheitenFuerStruktur`-Map wiederverwenden. Keine neuen Queries, erst recht keine je Zeile.
- Einheiten-Spalte hinter demselben `zeigeEinheiten`-Schalter wie die bestehende Tabelle (Zeile 206).
- Platzhalter zeigen „—" und Ampel grau — wie die bestehende Einheiten-Tabelle.
- Bestehende Sektionen („Heute dran", Organigramm, …) bleiben unverändert darunter.

**Fertig wenn:** Die FK sieht die ganze Mannschaft mit Ampeln und Kernzahlen ohne Scrollen durch Sektionen; nichts Bestehendes ist entfernt.

### AP-02 — Einheiten-Karte oben auf /heute

**Anlass:** „Einheiten eingeben muss einfacher sein, direkt eingebbar, als Dashboard. Eintragen muss größer sein, also direkt am Anfang, nicht unter Wettbewerb."

**Ist:** [/heute](../app/(app)/heute/page.tsx) zeigt null Einheiten. Import-Präzedenz existiert: [`components/Schnellzugriff.tsx`](../components/Schnellzugriff.tsx):44 und [`components/EinheitenNachAbschluss.tsx`](../components/EinheitenNachAbschluss.tsx):32 importieren `einheitSchnellBuchen` aus [`app/(team)/einheiten/actions.ts`](../app/(team)/einheiten/actions.ts) — Route-Gruppen sind für Imports egal.

**Bau:** Neue Client-Karte `EinheitenKarte` direkt nach dem Postfach: Monatsstand + GESAMT-Stand groß, Fortschritts-Balken zur Schwelle ([`components/Fortschritt.tsx`](../components/Fortschritt.tsx)), Inline-Feld + Buchen über `einheitSchnellBuchen` (Fehlertext anzeigen!), Link „Alle Einträge → /einheiten".

**Regeln:**
- Der Schwellen-Fortschritt misst GESAMT (`einheitenStart` + alle Buchungen, vgl. [`app/(team)/einheiten/page.tsx`](../app/(team)/einheiten/page.tsx):119), nicht den Monat. Die Karte braucht eine kleine Gesamt-Aggregation — NICHT `ladeEinheiten`, das lädt die ganze Runde.
- `einheitSchnellBuchen`-Rückgabe um formatiertes `gesamt` erweitern, damit der Balken nach einer Inline-Buchung stimmt.
- Server→Client nur fertig formatierte Strings (Muster `SchnellStand`, [`lib/stats.ts`](../lib/stats.ts):27–40).
- KEIN `neuRechnen`-Umbau nötig: /heute ist force-dynamic; das Hausmuster ist Client-Update aus dem Action-Rückgabewert.
- `schwelleFuer` ist hier zunächst sync — AP-07 zieht diesen Aufrufer beim Async-Umbau mit um.
- Kein zweiter DB-Weg: buchen ausschließlich über die bestehende Action.

**Fertig wenn:** 32,67 ist auf /heute eintragbar, Monats- und Gesamtstand aktualisieren sich sofort, eine Fehleingabe zeigt einen Text.

### AP-03 — Eingabe-Härtung + ?-Hilfe

**Anlass:** „32,67 ist ein Thema, muss genauso eintragbar sein!" + „Fragezeichen-Symbol: Wo finde ich meine Einheiten? → Ergo protek im App Store oder FK fragen."

**Ist:** Drei echte Fallen. (1) `einheitenBuchen` ([`app/(team)/einheiten/actions.ts`](../app/(team)/einheiten/actions.ts):79–87) verwirft das `buchen()`-Ergebnis — das Formular schweigt bei Müll. (2) `parseEinheiten` ([`lib/einheiten.ts`](../lib/einheiten.ts):60–72) löscht ALLE Leerzeichen — „32 67" wird stumm zu 3267,00 (Faktor 100). (3) `formatEinheiten` ohne `minimumFractionDigits` — „12,5" steht neben „32,67", Kommas springen in Tabellen.

**Bau:**
1. Formularblock [`app/(team)/einheiten/page.tsx`](../app/(team)/einheiten/page.tsx):189–244 wird kleine Client-Insel mit Action-Rückgabewert (Hausmuster; es gibt keinen `useActionState`-Präzedenzfall im Projekt).
2. `parseEinheiten`: Leerzeichen-DREIERGRUPPEN als Tausender akzeptieren („1 000,50", analog zur Punkt-Regel; NBSP/schmales Leerzeichen normalisieren) — andere Ziffer-Leerzeichen-Muster („32 67") sind ein Fehler.
3. `formatEinheiten` auf `minimumFractionDigits: 2`.
4. Neue Mini-Komponente `EinheitenHilfe` (?-Icon + Popover): „Deine Einheiten findest du in der ERGO Prothek-App (App Store) — oder frag deine Führungskraft."

**Regeln:**
- Der `minimumFractionDigits`-Sweep trifft ALLE Aufrufer: `mannschaft/page.tsx` 755/761/769 · `einheiten/page.tsx` 96/110/122/126/127/157/165/173/291/354/357/394 · `einheiten/actions.ts` 113 · [`app/(team)/log/quickLogAction.ts`](../app/(team)/log/quickLogAction.ts) 153. Alle nachsehen, nicht raten.
- Sonderfall `einheiten/page.tsx:291`: dort füllt `formatEinheiten` das EINGABEFELD `einheitenStart` vor — aus „500" wird „500,00". Parst weiter korrekt; bewusste, akzeptierte Anzeigeänderung.
- `EinheitenHilfe` an ALLEN VIER Einheiten-Feldern: `einheiten/page.tsx:202` (Menge), `:285` (Einheiten vor der App), `Schnellzugriff.tsx:466`, `EinheitenNachAbschluss.tsx:110`.

**Fertig wenn:** Fehleingaben scheitern sichtbar; „32 67" verhundertfacht nicht mehr still; „1 000,50" geht weiterhin; alle EH-Anzeigen sind zweistellig; die ?-Hilfe hängt an allen vier Feldern.

### AP-04 — Wettbewerb entrümpeln

**Anlass:** „Bei Wettbewerb muss Statistik und Einheiten raus. Da muss man wirklich nur sehen, was macht der Rest."

**Ist:** [`components/WettbewerbNav.tsx`](../components/WettbewerbNav.tsx) wird von fünf Seiten gerendert (arena:173, spiel:22, log:79, leaderboard:152, einheiten:77). Es existiert sonst KEIN harter `href="/einheiten"`-Link im Code.

**Bau:** Reiter „Einheiten" aus `WettbewerbNav.tsx:14–22` entfernen; `"/einheiten"` aus der `match`-Liste des Wettbewerb-Punkts ([`components/AppShell.tsx`](../components/AppShell.tsx):46–50) entfernen; in [`app/(team)/einheiten/page.tsx`](../app/(team)/einheiten/page.tsx) den `WettbewerbNav` (Zeile 77) UND den bestehenden h1-Block (79–87) durch einen `SeitenKopf` ersetzen (sonst Doppeltitel).

**Regeln:**
- [`lib/wegweiser.ts`](../lib/wegweiser.ts):43: `bereich: "Wettbewerb"` am Eintrag `einheiten-eintragen` würde danach lügen → eigener Bereich (z. B. „Einheiten"). Der `bereich` wird als „wo hätte ich suchen sollen" angezeigt.
- Veraltende Kommentare mitziehen: `wegweiser.ts:4–6`, `EinheitenNachAbschluss.tsx:9`.
- Bewusste Konsequenz: Auf /einheiten leuchtet danach kein Nav-Punkt. Die Zugänge sind /heute-Karte (AP-02), Schnellzugriff/Wegweiser und das Kopfzeilen-Plus.

**Fertig wenn:** Der Wettbewerbsbereich zeigt nur Team-Geschehen; /einheiten ist über alle drei Wege erreichbar; kein Nav-Punkt leuchtet falsch; der Wegweiser-Bereichstext stimmt.

### AP-05 — FK-Zeile auf /heute

**Anlass:** „Statistik ist erstmal Hauptpunkt für Führungskräfte. Ab bspw. Stufe 2 hast du eine andere Ansicht; Stufe 1 sehr simpel."

**Ist:** Der `gefuehrte > 0`-Zweig lädt `lage` bereits ([`app/(app)/heute/page.tsx`](../app/(app)/heute/page.tsx):148–151); `lage.leute` trägt die fertige `ampel` je Person — die Summenzeile ist reines Zählen, keine zweite Rechnung.

**Bau:** Kompakte Zeile unter dem FK-Banner: „Deine Struktur: 🟢 X · 🟡 Y · 🔴 Z" → Link auf /mannschaft.

**Regeln:**
- Ausgetretene ausnehmen (Muster [`lib/fuehrung.ts`](../lib/fuehrung.ts):689); Platzhalter (grau) nicht mitzählen oder getrennt ausweisen.
- Gestaltung MIT dem bestehenden Rot-Banner (:248–279) abstimmen — nicht zwei rote Signale übereinander. Das Banner bleibt der Alarm, die Zeile ist der neutrale Überblick.
- Wer niemanden führt, sieht exakt nichts Neues — Stufe 1 bleibt simpel.

**Fertig wenn:** Die FK sieht die Lage in einer Zeile; die Nicht-FK-Ansicht ist unverändert.

### AP-06 — Einheiten-Herkunft: Anteile je Ast + Fokus-Marker

**Anlass:** „Woher kommen die Einheiten, also aus welcher Struktur" + „Einheitenaufteilung, eine Struktur erfüllt die 50%, damit du siehst, wo der Fokus drauf liegt."

**Ist:** `einheitenFuerStruktur` ([`lib/einheiten.ts`](../lib/einheiten.ts):400–453) liefert je Knoten `astGesamt`/`astMonat`; direkte Äste erkennbar über `istDirekt` bzw. `path === ich.path + id + "/"`; die Struktur-Summe ist der Eintrag des Betrachters. NICHT `astSummen` aus [`lib/fuehrung.ts`](../lib/fuehrung.ts) verwenden — das summiert nur Tätigkeits-Werte, keine Einheiten.

**Bau:** In der Einheiten-Tabelle auf [/mannschaft](../app/(app)/mannschaft/page.tsx) je direktem Ast den Anteil an der Struktur-Summe zeigen (Balken + Prozent); liegt ein Ast über dem konfigurierten Fokus-Prozentsatz (Default 50), erscheint der Marker „Fokus liegt auf X".

**Regeln:**
- Basis des Anteils: Produktionsmonat (Default). Ob Emils Regel auf Monat oder Gesamt zielt → offener Punkt #3.
- Der Fokus-Prozentsatz kommt aus dem AP-07-Konfigmodell; bis dahin Konstante mit `TODO-Emil`-Kommentar.
- Keine neue Query — alles aus der vorhandenen Map.

**Fertig wenn:** Die FK sieht je Ast Anteil und Balken und ob einer dominiert.

### AP-07 — Schwellen konfigurierbar + „promotebar"

**Anlass:** „Stufen-Schwellen einbauen — dafür schickt mir Emil was, soll dann selbst eintragbar und richtig krass promotebar sein."

**Ist:** `SCHWELLEN = { 1: 500 * 100 }` ([`lib/einheiten.ts`](../lib/einheiten.ts):149–151); `schwelleFuer` (:153–156) hat GENAU EINEN Aufrufer (`ladeEinheiten`:323) — plus, nach AP-02, die EinheitenKarte. Die Werkstatt kann heute nur Feature-Zustände ([`app/(team)/werkstatt/actions.ts`](../app/(team)/werkstatt/actions.ts):13–29), es gibt kein Konfig-Modell.

**Bau:** Neues Prisma-Modell `StufenSchwelle { stufe Int @id, hundertstel Int }` — wäre das erste Int-@id im Schema (erlaubtes Novum). Alternative im Muster von `Feature.key`: generisches `Einstellung { schluessel String @id, wert String }`, das auch den Fokus-Prozentsatz für AP-06 trägt. Der Umsetzer entscheidet — aber EIN Muster für beide Werte. Dazu: Werkstatt-Block „Karrierestufen-Schwellen" (Zeile je Stufe 1–6, leer = keine Schwelle), `schwelleFuer` wird async mit DB-Lesung, Fortschritt „noch X bis Stufe Y" überall am Monats-/Gesamtstand, Feier-Banner bei erreichter Schwelle.

**Regeln:**
- Migration idempotent nach Hauskonvention: kein eigenes BEGIN/COMMIT, `IF NOT EXISTS`, REVOKE-Block für anon/authenticated — Muster `prisma/migrations/20260825235000_einheiten/`.
- Werkstatt-Action nach dem Muster `schalten`: `requireAdmin` + FormData + `revalidatePath`.
- DB-Lesung mit `.catch`-Fallback auf die Konstante (Migration-unterwegs-Fall, Muster [`app/(team)/werkstatt/page.tsx`](../app/(team)/werkstatt/page.tsx):70–78).
- Beide `schwelleFuer`-Aufrufer umziehen (async): `ladeEinheiten` UND die EinheitenKarte aus AP-02.
- VORSICHT: [`lib/signale.ts`](../lib/signale.ts):18 exportiert ein zweites, fachfremdes `SCHWELLEN` (Ampel; importiert in `fuehrung.ts:18` und [`app/api/cron/meldungen/route.ts`](../app/api/cron/meldungen/route.ts):4) — bei grep-basiertem Umbau nicht anfassen.
- Kopf-Kommentare in `lib/einheiten.ts` (Regel 3, Doku 139–151) mitziehen.
- Seed: Stufe 1 = 500,00 — klar als Platzhalter markiert, bis Emil liefert.

**Fertig wenn:** Der Admin trägt Emils Werte ohne Deploy selbst ein; Balken erscheinen für jede Stufe mit Schwelle; die Ampel-Logik ist unberührt.

### AP-08 — Verlaufs-Chart (Trade-Republic-Stil)

**Anlass:** „Diagramm Einheiten → alles: Tagesdurchschnitt, wie viel pro Woche, Erfolgsdiagramm. Wie so ETF-Chart, über Woche, Monat, 6 Monate, Jahr und Insgesamt."

**Ist:** Keine Chart-Library (Hausregel, [`components/Organigramm.tsx`](../components/Organigramm.tsx):10–13). `groupBy` auf einem DateTime-Feld hat Präzedenz (`dailyLog.groupBy(by:[…,"date"])`, [`lib/fuehrung.ts`](../lib/fuehrung.ts):289). `Einheitenbuchung.tag` ist die UTC-Mitternacht des Berliner Kalendertags, Index `[userId, tag]` existiert.

**Bau:** Eigene SVG-Komponente `VerlaufsChart` (Linie/Fläche, Theme-Farben, ohne Bibliothek); neue Lade-Funktion mit `groupBy` auf `Einheitenbuchung.tag` bzw. `DailyLog.date`; kumulierte Gesamt-Kurve; Umschalter W/M/6M/J/Gesamt; Kennzahlen daneben: Tagesdurchschnitt, Wochensumme. Platz: eigener Abschnitt auf [/einheiten](../app/(team)/einheiten/page.tsx).

**Regeln:**
- Die kumulierte Kurve braucht `einheitenStart` als Sockel — sonst widerspricht sie „insgesamt" auf derselben Seite.
- Storni (negative Buchungen) machen die Kurve nicht-monoton — einplanen, nicht wegglätten.
- Anzeige zwingend mit `timeZone:"UTC"`-Formatern (`dayDisplayFormat`/`monatsFormat`); Zeitraum-Grenzen über `startOfWeek`/`produktionsmonat`.
- FK-Variante (Struktur-Summe, Serie „neue Partner" über `User.startedAt`) ist eine ZWEITE Ausbaustufe — erst die eigene Kurve.

**Fertig wenn:** Der eigene Verlauf steht über alle fünf Zeiträume, funktioniert in beiden Themes, und `package.json` ist unverändert.

**Nachtrag 29.08.2026 — die zweite Ausbaustufe ist gebaut (Lagebild-Plan):** Struktur-Kurve auf /mannschaft (Abschnitt „Verlauf deiner Struktur", Anker `#verlauf`, `strukturVerlauf()` in `lib/einheiten.ts`, Commits `ff43ccf`+`6869bc9`) und der FK-Erstblick „Lagebild" auf /heute (`327e3f7`: Ampel-Bilanz + Gesamtstand mit Vormonats-Delta und MiniVerlauf + Schwellen-Zeile, Griff-Karten, Direkten-Liste; ersetzt dort die AP-05-Zeile und das rote Banner). Dazu Stufen-Spalte in der Mannschafts-Einheiten-Tabelle und der Vorführ-Schalter (Namen→Initialen) auf /heute und /mannschaft (`b60f15a`, `d976277`, `7fc37a3`). Die Serie „neue GP" über `User.startedAt` am Struktur-Chart bleibt als dritte Ausbaustufe offen.

### AP-09 — Namen-Liste als dichte Tabelle

**Anlass:** „Namen (Tab) muss übersichtlicher sein! Am besten Tabelle, muss auf einer Seite sein. Keine Excel, sondern geil."

**Ist:** [/namen](../app/(app)/namen/page.tsx) rendert Card-Zeilen ([`components/NameList.tsx`](../components/NameList.tsx):469–497, `NameRow`:643–805). NameList wird NUR von `namen/page.tsx:108` gerendert; GuidePanel ist ein unabhängiges Geschwister; es gibt keine Tests. Die Sortierung liegt serverseitig (`namen/page.tsx:58`, `createdAt asc`) und ist Fachlogik: Zeilen dürfen beim Einstufen nicht unter dem Finger wegspringen; optimistisches Hinzufügen hängt ans Ende — passt zu asc.

**Bau:** Dichte Tabellen-Optik: kompakte Zeilenhöhe, Spalten Name / Nummer / Rating / Liegt-seit, sticky Kopf, `tabular-nums`, Zebra.

**Regeln:**
- KEIN Funktionsverlust: Inline-Nummer-Edit, Rating-Zyklus, Umhängen, Auswahlmodus, Undo, Ziel-Balken, Schnell-Erfassung bleiben vollständig bedienbar.
- Sortierung unangetastet.
- Mobile first — die App lebt am Handy.

**Fertig wenn:** Die Liste wirkt wie eine Tabelle statt eines Karten-Stapels; alle Aktionen funktionieren unverändert.

### AP-10 — „Wie war der Termin?"-Karte

**Anlass:** „Am besten fragt dich die Website noch: wie war der Termin. Du musst eintragen."

**Ist:** Die bestehende /heute-Datenladung REICHT: Die contacts-Query ([`app/(app)/heute/page.tsx`](../app/(app)/heute/page.tsx):74–90, `nextStepAt < horizon` ohne Untergrenze) enthält die Fälle, weil das Playbook bei TERMIN_VEREINBART `nextStepType=TERMIN` mit `nextStepAt=appointmentAt` setzt ([`lib/pipeline.ts`](../lib/pipeline.ts):166–171; [`app/(app)/pipeline/actions.ts`](../app/(app)/pipeline/actions.ts):77–82). Die Ergebnis-Dialoge existieren ([`components/ResultDialogs.tsx`](../components/ResultDialogs.tsx):148–213).

**Bau:** Karte oben auf /heute: Filter `nextStepType === "TERMIN" && appointmentAt < jetzt` → „Wie war der Termin mit {Name}?" + die bestehenden [`components/QuickRowActions.tsx`](../components/QuickRowActions.tsx) im Termin-Modus (Gehalten/Geplatzt → bestehende Dialoge).

**Regeln:**
- KEIN Dedup über `appointmentHeldLoggedAt` — das ist ein Einmal-Stempel gegen Doppel-Punkte; beim zweiten Termin desselben Kontakts bliebe die Karte fälschlich aus. Der Filter reinigt sich selbst: „Gehalten" → Playbook NACHFASSEN, „Geplatzt" → `appointmentAt = null`.
- Doppelpräsenz lösen: Kontakte der Karte aus der „Überfällig"-Gruppe herausfiltern.
- Setzt den QuickRowActions-Stand NACH AP-11 voraus (kein „Kein Interesse" mehr).
- Kein zweiter DB-Weg, keine neue Query.

**Fertig wenn:** Ein vergangener Termin erzeugt genau EINE sichtbare Frage ganz oben; ein Tipp führt zum bestehenden Ergebnis-Dialog.

### AP-11 — „Kein Interesse"-Button raus + Totholz

**Anlass:** „Kein-Interesse-Button raus."

**Ist:** Der Button steht in [`components/QuickRowActions.tsx`](../components/QuickRowActions.tsx):139–146 UND [`components/NameDialer.tsx`](../components/NameDialer.tsx):359–366. `recordCallResult` wird NUR von diesen beiden aufgerufen.

**Bau:** Beide Buttons entfernen (nur einen = Drift zwischen Heute-Liste und Durchlauf). Danach totes Aufräumen: `case "lost"` ([`app/(app)/contacts/results.ts`](../app/(app)/contacts/results.ts):252–268), beide „Woran lag's?"-ChoiceDialoge (`QuickRowActions`:266–277, `NameDialer`:420–430), `LOST_CHIPS` ([`components/ResultDialogs.tsx`](../components/ResultDialogs.tsx):42), die `CallResult`-Variante „lost", `RESULT_NOTES.lost`/`RESULT_LABELS.lost`, Dialer-`EMPTY_TALLY.lost` samt `done`-Summe (:147) und Bilanz-Stat (:147, :173).

**Regeln:**
- Bleibt lebendig: der ChoiceDialog selbst („Wann nochmal?"), `markContactLost`/`isLostReason` — der bewusste Weg „…" → ContactActionDialog „Verloren" (8 Gründe) funktioniert weiter, ebenso `results.ts:115–120`.
- Layout: das Dialer-Grid ist `grid-cols-2` mit vier Knöpfen — drei hinterlassen ein Loch, Grid anpassen.
- Bewusste Folge (kein Bug): die Verlustgründe-Statistik im [/trichter](../app/(app)/trichter/page.tsx) wird dünner, weil die Schnellerfassung keine Verluste mehr schreibt.

**Fertig wenn:** Kein „Kein Interesse" mehr in den Schnellaktionen; „…" → Verloren funktioniert; Dialer-Bilanz und -Layout stimmen; kein toter Code bleibt zurück.

### AP-12 — Onboarding: neue Karrierestufen-Szene

**Anlass:** „Einmal hinsetzen und dann bam — Einladung raus, er kann loslegen. Jeder Neue muss das sehen, sichten, ab geht's."

**Ist:** Die bestehende Willkommen-Szene „einstufung" ([`lib/willkommen.ts`](../lib/willkommen.ts):20–30, [`components/willkommen/Einstufung.tsx`](../components/willkommen/Einstufung.tsx)) ist die Blitz-Einstufung der KONTAKTE nach Nähe A/B/C — sie hat mit der Karrierestufe NICHTS zu tun. Karrierestufe + Einheitenstart werden heute nur versteckt auf [/einheiten](../app/(team)/einheiten/page.tsx):249–308 erfasst — genau Emils Findbarkeitsproblem.

**Bau:** NEUE Szene (AKTE-Eintrag + eigene Komponente nach dem Szenen-Muster): Karrierestufe 1–6 wählen oder „weiß nicht" (= null — wird nie geraten, Hausprinzip), optional Einheiten-Start mit der ?-Hilfe aus AP-03.

**Regeln:**
- Die Kontakt-„einstufung"-Szene NICHT erweitern — Begriffsvermischung.
- `standSpeichern` ([`app/(team)/einheiten/actions.ts`](../app/(team)/einheiten/actions.ts):143–165) ist direkt nutzbar: Stufe via `Number()`+`istKarrierestufe` (Ganzzahl, leer → null), `einheitenStart` via `parseEinheiten` (Komma-sicher); läuft über `requireUser`, also im Willkommen-Ablauf aufrufbar.
- Auch in die `LEADER_AKTE` (:37) aufnehmen — FKs haben selbst Stufe und Einheiten.

**Fertig wenn:** Ein frisch Eingeladener hat nach dem Willkommen seine Stufe (oder ein bewusstes „weiß nicht") gesetzt und sieht auf /heute sofort seinen Fortschritt.

### AP-13 — Kalender-Status sichtbar

**Anlass:** „Timetree muss funktionieren, also der Kalender-Sync!"

**Ist:** MEHR gebaut als gedacht. `Kalenderquelle` trägt `letzterLauf`/`letzterFehler`/`fehlerZaehler`/`aktiv` ([`prisma/schema.prisma`](../prisma/schema.prisma):947–952). Eine manuelle Abgleich-Action existiert (`quelleAktualisieren`, [`app/(app)/kalender/quellen/actions.ts`](../app/(app)/kalender/quellen/actions.ts):126–147) — sie ignoriert die 15-Minuten-Drossel BEWUSST („von Hand = Passwort gerade berichtigt"). [/kalender/quellen](../app/(app)/kalender/quellen/page.tsx) zeigt „zuletzt …" + Fehler (:131–143); [/kalender](../app/(app)/kalender/page.tsx) stößt fällige Abgleiche beim Seitenbesuch per `after()` an (:164–171). Die offizielle TimeTree-API ist seit 22.12.2023 tot; der inoffizielle Weg kann leise brechen, Apple-/Google-Login bei TimeTree geht prinzipbedingt nicht ([`lib/kalender/timetree.ts`](../lib/kalender/timetree.ts):19–20).

**Bau:**
1. Status-Zeile auf /kalender SELBST (neu): „Zuletzt abgeglichen vor N Min · Quelle X gestört → Reparieren" (Link auf /kalender/quellen).
2. Diagnose-Verfeinerung auf /kalender/quellen: `fehlerZaehler`/`aktiv`/`unvollstaendig` klartextlich erklären; Hinweis auf die Login-Einschränkung.
3. Optional: „Jetzt abgleichen"-Knopf auf /kalender als Wrapper um `faelligeQuellenAbgleichen` ([`lib/kalender/abgleich.ts`](../lib/kalender/abgleich.ts):145, respektiert die Drossel) — Semantik sauber getrennt von der drossel-freien Hand-Action auf /quellen.

**Fertig wenn:** Emil SIEHT auf /kalender, ob der Sync läuft, statt es zu raten; eine gestörte Quelle erklärt sich selbst. (Offene Frage an Emil bleibt: was genau ging nicht?)

### AP-14 — ERGO raus → „Cockpit"

**Anlass:** „Ergo muss aus Kopf raus!" — bestätigt: Branding aus Kopfzeile und App-Titel. Neuer Name (entschieden): **Cockpit**.

**Ist:** ~27 nutzersichtbare Fundstellen, kartiert. Die Wortmarke selbst: [`components/Logo.tsx`](../components/Logo.tsx):42 (Signatur `Wordmark({ sub?, onDark? })` bleibt).

**Bau:** Nutzersichtbare Strings auf „Cockpit" umbenennen — [`app/layout.tsx`](../app/layout.tsx) NUR die Metadaten-Zeilen 32/33/42 · [`app/manifest.ts`](../app/manifest.ts):12–14 · [`app/login/page.tsx`](../app/login/page.tsx):27 · [`app/offline/page.tsx`](../app/offline/page.tsx):3 · [`components/AppInstallieren.tsx`](../components/AppInstallieren.tsx) (6 Stellen) · [`components/schleuse/`](../components/schleuse/Schleuse.tsx) (4 Dateien) · [`components/willkommen/Willkommen.tsx`](../components/willkommen/Willkommen.tsx):182 · [`app/einladung/[code]/opengraph-image.tsx`](../app/einladung/[code]/opengraph-image.tsx):69 · [`app/kalender/feed/[token]/route.ts`](../app/kalender/feed/[token]/route.ts):49 (Abo-Name im Handy) · [`lib/ics.ts`](../lib/ics.ts):61, 148 (nur PRODID) · [`lib/avv/mail.ts`](../lib/avv/mail.ts):61 (nur Absender) · [`public/sw.js`](../public/sw.js) NUR Zeile 123 (Push-Titel) · README-/docs-Titel.

**Regeln:**
- FALLE `app/layout.tsx`: Die Datei enthält inline die technischen Schlüssel — localStorage `'ergo-thema'` (Zeile 19) und `__ergoInstall`/`'ergo-install-bereit'` (Zeile 11). NICHT anfassen.
- Ebenso tabu: [`lib/session.ts`](../lib/session.ts):3 (Cookie — Umbenennen loggt ALLE aus), `sw.js:15` (Cache-Name) und `:131` (`tag`), `manifest.id`, ICS-`UID@ergo-crm` (Duplikate in abonnierten Kalendern), `package.json`, [`lib/push.ts`](../lib/push.ts):22 (VAPID-mailto — bewusst belassen).
- Das Einladungs-Manifest ([`app/einladung/[code]/manifest.webmanifest/route.ts`](../app/einladung/[code]/manifest.webmanifest/route.ts)) erbt name/short_name automatisch aus `app/manifest.ts`.
- Hinweis: Installierte PWAs zeigen „Cockpit" erst nach Neuinstallation — kein Fehler.

**Fertig wenn:** Kein nutzersichtbares „Ergo" mehr; alle technischen Schlüssel byte-identisch; die App läuft bei Bestandsnutzern weiter.

---

## 6. Bewusst nicht gebaut

- **Keine Chart-Library, kein neues npm-Paket.** Das Organigramm zeigt, wie es ohne geht.
- **Kein neunter Haupt-Nav-Punkt.** Die Kopfzeile ist voll; die Begründung steht in [`components/AppShell.tsx`](../components/AppShell.tsx):88–95.
- **Keine Rolle FUEHRUNGSKRAFT.** Position bleibt Position — dokumentierter Entscheid am Modell.
- **Kein Zwei-Wege-Kalender-Sync, kein neuer TimeTree-Zugriffsweg.** Die offizielle API ist tot; der inoffizielle Weg bleibt, wird nur sichtbar gemacht.
- **Keine Umbenennung technischer Schlüssel** (Cookie, Cache, UID, localStorage, `__ergoInstall`).
- **Keine Punktewertung für Einheiten.** Dokumentierter Entscheid am Modell — Einheiten zählen in keiner Rangliste.
- **Keine Erweiterung der Kontakt-„einstufung"-Szene um Karrierestufen.** Zwei verschiedene Begriffe, zwei verschiedene Szenen.

---

## 7. Offene Punkte an Emil

| # | Frage | Angenommener Default bis zur Antwort |
|---|---|---|
| 1 | Schwellenwerte je Karrierestufe (F5) | Nur Stufe 1 = 500,00 — als Platzhalter markiert |
| 2 | Details der Einheitenaufteilung / 50%-Regel (F6) | Marker ab 50 % Ast-Anteil, nur Anzeige, keine Sperre |
| 3 | Anteils-Basis der Regel: Produktionsmonat oder Gesamt? | Monat |
| 4 | Ampel-Kriterien für die Team-Matrix | Bestehende `ampelVon`-Logik |
| 5 | Was genau hakt bei TimeTree (Login-Art? Verzögerung? Richtung)? | Sync-Status sichtbar machen (AP-13), dann erneut fragen |

---

## 8. Wellen-Plan für parallele Sessions

Es laufen mehrere Sessions auf `redesign/liquid-glass`. Jede Umsetzer-Session zieht vor Start den frischen Stand und committet klein. Merkregel: **„Eine Datei, eine Session"** — /heute, /mannschaft, `lib/einheiten.ts` und die AppShell sind die Engpässe.

**Zweiter Wellen-Zug im selben Baum:** Parallel läuft das genehmigte Liquid-Glass-Redesign (eigener Plan, wird als `docs/liquid-glass-plan.md` übertragen) mit eigenen Wellen über dieselben Seiten (u. a. Heute, Namen, Mannschaft, Wettbewerb). Vor dem Start eines AP kurz klären, ob die Redesign-Welle für diese Seite gerade offen ist — dieselbe Seite nie in beiden Zügen gleichzeitig.

| Welle | Pakete (untereinander parallel möglich) | Begründung |
|---|---|---|
| 1 | AP-01 · AP-03 · AP-11 · AP-14 | Disjunkte Dateien: mannschaft / einheiten-lib+page / QuickRowActions+Dialer / Branding-Strings |
| 2 | AP-02 + AP-10 in EINER Session · AP-04 | 02+10 teilen /heute; AP-10 braucht den QuickRowActions-Stand nach AP-11; AP-04 ist disjunkt |
| 3 | AP-07 · AP-05 · AP-12 | AP-07 zieht beim Async-Umbau den AP-02-Aufrufer mit um (deshalb NACH Welle 2); /heute ist nach Welle 2 frei für AP-05 |
| 4 | AP-06 → AP-08 nacheinander · AP-09 · AP-13 | AP-06 braucht die AP-07-Konfig; AP-06 und AP-08 fassen beide `lib/einheiten.ts` an |

Sequenzielle Mehrfachanfasser (Rebase-Aufwand einplanen): `einheiten/page.tsx` ← AP-03/04/08 · `lib/einheiten.ts` ← AP-03/07/06/08 · `heute/page.tsx` ← AP-02+10/05 · `mannschaft/page.tsx` ← AP-01/06 · Willkommen-Umfeld ← AP-14 (`Willkommen.tsx:182`) / AP-12.

---

## 9. Woran man misst, ob es geholfen hat

| Frage | Wo sie beantwortet wird |
|---|---|
| Trägt jemand außer Adrien/Emil Einheiten ein? | `Einheitenbuchung.userId` distinct |
| Sucht niemand mehr vergeblich nach „Einheiten"? | `Suchbegriff`-Tabelle — Werkstatt-Block „Gesucht, nichts gefunden" |
| Bleiben Termine ohne Ergebnis liegen? | Die AP-10-Karte bleibt leer |
| Nutzt die FK die Matrix? | `merkeNutzung`-Muster wie beim Wegweiser ([`lib/features.ts`](../lib/features.ts):82, Aufruf-Vorbild [`app/wegweiserAction.ts`](../app/wegweiserAction.ts):41) |

---

## 10. Umsetzung mit Sonnet — Modell-Empfehlung und Start-Prompt

Die Pakete sind so geschrieben, dass eine frische Session OHNE die Entstehungs-Konversation loslegen kann: Ist-Zustand mit Datei und Zeile, Regeln, Fertig-wenn-Kriterien.

| Modell | Pakete | Warum |
|---|---|---|
| **Sonnet reicht** | 03, 04, 05, 10, 11, 13, 14 | Eng umrissen; Aufrufer-, Fundstellen- und Totholz-Listen stehen vollständig im Paket |
| **Sonnet ok, Regeln strikt befolgen** | 01, 02, 06, 12 | Wiederverwenden statt neu bauen — die Regeln nennen die exakten Quellen (`mannschaftsLage`, `einheitenFuerStruktur`, `standSpeichern`) |
| **Eher Opus** | 07, 08, 09 | Schema + Migration + Async-Kette (07), gestalterischer Neubau SVG-Chart (08), 800-Zeilen-Komponente ohne Funktionsverlust umbauen (09) |

Start-Prompt-Vorlage (Copy-Paste, `XX` ersetzen):

> Lies `docs/emil-feedback-plan.md` — Abschnitt „AP-XX" plus die Abschnitte 2 (Glossar), 3 (Entscheidungen) und 6 (Bewusst nicht gebaut). Setze NUR AP-XX um. Halte dich exakt an die „Regeln:"-Punkte des Pakets; bei Widerspruch zwischen Plan und Code gilt der Code — dann kurz im Ergebnis vermerken. Vorher `git pull` (Branch `redesign/liquid-glass`, parallele Sessions!). Keine neuen npm-Pakete, keine technischen Schlüssel umbenennen, kein zweiter DB-Weg. Fertig ist es erst, wenn alle „Fertig wenn:"-Kriterien erfüllt sind. Ein Commit, Commit-Message im Haus-Stil (deutsch, ein Satz mit Haltung).

**Guardrail:** Referenziert ein Paket eine Stelle, die es so nicht mehr gibt (eine Parallel-Session war schneller), NICHT raten — Paket abbrechen und den Widerspruch melden.
