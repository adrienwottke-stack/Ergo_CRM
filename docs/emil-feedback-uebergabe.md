# Übergabe: Emil-Feedback umsetzen (Orchestrator-Anleitung)

Stand: 27.08.2026
Auftrag: Setze [docs/emil-feedback-plan.md](emil-feedback-plan.md) um — alle vier Wellen, mit Subagents je Arbeitspaket. Diese Datei ist deine Betriebsanleitung; der Plan ist die Quelle der Wahrheit für das WAS, diese Datei für das WIE.

> **Bei Widerspruch zwischen Plan und Code gilt der Code.** Dann nicht raten: AP stoppen, Widerspruch im Bericht nennen, weiter mit dem nächsten AP.

---

## 1. Deine Rolle

Du bist Orchestrator. Du liest den Plan, startest Subagents für die Arbeitspakete, prüfst deren Ergebnis gegen die „Fertig wenn:"-Kriterien, committest je AP und berichtest je Welle. Du schreibst selbst nur, wenn ein AP zu klein für einen Subagent ist oder eine Nacharbeit ansteht.

Vor dem Start EINMAL lesen: [emil-feedback-plan.md](emil-feedback-plan.md) komplett — besonders Abschnitt 2 (Glossar), 3 (Entscheidungen), 6 (Bewusst nicht gebaut), 8 (Wellen-Plan).

## 2. Umfeld — zwei Züge im selben Baum

- Branch: `redesign/liquid-glass`. Basis-Commit der Pakete: `07b9798`.
- **Parallel läuft die Liquid-Glass-Redesign-Session** (eigener Wellen-Plan, betrifft u. a. Heute, Namen, Mannschaft, Wettbewerb). Regeln:
  - Vor JEDER Welle: `git pull`, dann `git status` LESEN. Fremde uncommittete Änderungen: nie anfassen, nie mitcommitten.
  - Dieselbe Seite nie in beiden Zügen gleichzeitig. Wenn `git status` oder frische Commits zeigen, dass das Redesign gerade an einer Seite deines nächsten AP arbeitet: AP zurückstellen, anderes AP der Welle vorziehen, im Zweifel Adrien fragen.
  - `git add` nur mit expliziten Pfaden. **NIE `git add -A`** — das hat hier schon zweimal fremde Arbeit in falsche Commits gezogen.

## 3. Ablauf je Welle

Wellen und Parallelität stehen in Plan-Abschnitt 8. Kurzform: Welle 1 = AP-01·03·11·14 → Welle 2 = (AP-02+10 in EINEM Agent)·04 → Welle 3 = 07·05·12 → Welle 4 = 06→08 nacheinander·09·13.

1. `git pull` + `git status` lesen (siehe oben).
2. Subagents für die Welle parallel starten — nur die im Plan als parallel markierten APs. Prompt-Vorlage: Abschnitt 4.
3. Ergebnisse einsammeln: jede „Fertig wenn:"-Zeile des AP gegen den Code prüfen (stichprobenartig selbst nachlesen, nicht nur dem Bericht glauben).
4. Je Welle einmal verifizieren: `npx tsc --noEmit`, `npx eslint .`, dann `npx next build`. **Vorher einen laufenden Dev-Server beenden** (`.next`-Kollision). Build-Fehler gehören zur Welle — erst fixen, dann committen.
5. Je AP ein Commit: gezielt stagen (`git add <genau die Pfade des AP>`), Message deutsch, ein Satz mit Haltung — Haus-Stil siehe `git log --oneline -10`.
6. Kurzbericht an Adrien: was gebaut, was abweicht, was offen.

## 4. Subagent-Prompt (Vorlage, `XX` ersetzen)

> Lies `docs/emil-feedback-plan.md` — Abschnitt „AP-XX" plus Abschnitte 2 (Glossar), 3 (Entscheidungen) und 6 (Bewusst nicht gebaut). Setze NUR AP-XX um. Halte dich exakt an die „Regeln:"-Punkte; bei Widerspruch zwischen Plan und Code gilt der Code — dann abbrechen und den Widerspruch melden statt raten. Keine neuen npm-Pakete, keine technischen Schlüssel umbenennen, kein zweiter DB-Weg, jede Ein-Tipp-Aktion braucht `withUndo`. **Committe NICHT.** Melde am Ende: geänderte Dateien (vollständige Liste), erfüllte „Fertig wenn:"-Kriterien, Abweichungen vom Plan, offene Fragen.

Modellwahl je AP (Plan-Abschnitt 10): Sonnet reicht für 03/04/05/10/11/13/14; für 01/02/06/12 Sonnet mit strikten Regeln; **07/08/09 eher Opus** — wenn kein Opus verfügbar ist, diese drei zuletzt und mit doppelter Prüfung durch dich.

## 5. Harte Hausregeln (hart erarbeitet — nicht neu verhandeln)

- **Build:** `next build` OHNE `--turbopack` (Turbopack-Prod bricht den No-JS-Fallback von Server Actions hinter der Middleware). Vor jedem Push ein voller Build, auch wenn tsc/eslint grün sind.
- **`"use server"`-Dateien exportieren AUSSCHLIESSLICH async Funktionen.** Eine exportierte Konstante daneben bricht den Build — und tsc/eslint sehen es NICHT. Konstanten nach `lib/`.
- **Server Actions nie mit `.bind()`** an Formulare — IDs als `<input type="hidden">`.
- **Migrationen (relevant für AP-07):** idempotent (`IF NOT EXISTS`, `DO $$`-Wächter), KEIN eigenes `BEGIN;`/`COMMIT;` in der .sql (Prisma fährt schon eine Transaktion — ein COMMIT mittendrin hinterlässt bei Fehlern eine halb migrierte DB), REVOKE-Block für anon/authenticated, Muster: `prisma/migrations/20260825235000_einheiten/`. Vor `migrate deploy` ein Probelauf gegen die echte DB in EINER Transaktion mit `ROLLBACK`. Nach Fehlschlag: `npx prisma migrate resolve --rolled-back <name>`.
- **Die DB-Spalte hinter `User.karrierestufe` heißt `kernstufe`** — jedes rohe SQL nutzt den alten Namen.
- Die Migration `20260826200000_wegweiser` ist committet, aber noch nicht deployt — sie läuft beim nächsten Build/Deploy automatisch mit (`package.json:8`).
- **Platzhalter** (User ohne `passwordHash`) fallen aus jeder neuen Summe, Ampel und Liste.

## 6. Prüfen hinter dem Login

Alles hinter dem Login ist ohne Zugangsdaten nicht klickbar. Wenn ein AP eine echte Sichtprüfung braucht (AP-01 Matrix, AP-02 Karte, AP-09 Tabelle): **Adrien nach einem laufenden Localhost mit Login fragen** — er stellt das bereit. Mobile zuerst prüfen (375 px), die App lebt am Handy; danach Desktop. Screenshot ins Ergebnis.

## 7. Wann du Adrien fragst (und sonst nicht)

- Redesign-Session arbeitet erkennbar an derselben Seite wie dein nächstes AP.
- Ein AP-07/08/09 soll laufen und du bist unsicher, ob deine Sorgfalt reicht.
- Ein „Fertig wenn:"-Kriterium ist ohne Login nicht prüfbar (→ Localhost erbitten).
- Emil-Werte treffen ein (Schwellen, 50%-Regel) → gehören in die Werkstatt-Konfig, nicht in den Code.

Alles andere: entscheiden, bauen, im Wellen-Bericht dokumentieren.
