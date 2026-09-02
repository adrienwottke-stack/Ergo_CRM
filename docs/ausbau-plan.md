# Ausbau: das Cockpit öffnet sich stufenweise

Stand: 30.08.2026. Anlass ist Rückmeldung von mehreren Nutzern, nicht eine Idee:
**der Start in die App überfordert.**

---

## 1. Warum

Nachgefasst zerfällt „too much" in drei Teile, alle drei bestätigt:

1. **Zu viele Reiter.** Sieben Navigationspunkte ab der ersten Sekunde (acht für
   Admins). Der Code weiss es selbst — in `components/AppShell.tsx` steht als
   Begründung, warum Neues ins Plus-Menü wandert: *„Die Leiste traegt ausserdem
   schon acht Punkte."*
2. **Seiten zu voll.** `/heute` rendert 18 Blöcke. Ein Neuling ohne Daten sieht
   davon sieben — darunter eine Einheiten-Karte, die ihm zwei Nullen und einen
   Balken ohne Ziel zeigt.
3. **Zu viele Begriffe.** Trichter, Engpass, Lagebild, Arena, Griff, Ast, Puls,
   Einheiten, Karrierestufe, Stufe — alle gleichzeitig da.

Ziel: Wer neu anfängt, soll sich auf **Namen aufnehmen, anrufen, Termine legen**
konzentrieren können.

### Was hier bewusst NICHT passiert

- **Kein Umbenennen.** Die Begriffe stehen in `CONTEXT.md` und achtzehn
  Plan-Dokumenten und sind gut. Sie waren nur alle gleichzeitig da. Mit dem
  Schnitt verschwinden Trichter, Engpass, Arena, Puls, Lagebild, Griff und Ast
  von selbst vom Anfang; jeder kommt später einmal mit einem Satz daneben.
- **Keine Kopplung an Einheiten.** Siehe `docs/adr/0005`, Abschnitt Kontext.
- **Kein sichtbarer Zähler.** Es gibt keine „Stufe 1 von 2"-Anzeige und nirgends
  das Wort „Ausbau" auf dem Bildschirm. Eine vierte Zahl neben Stufe,
  Karrierestufe und Platz würde den Start weiter aufladen — genau das ist das
  Problem.

---

## 2. Das Modell: zwei Achsen, keine Leiter

| Achse | Werte | Woher |
|---|---|---|
| **Ausbau** | 1 (Anfang) → 2 (voller Umfang) | Die Führungskraft setzt ihn. Gespeichert. Nur aufwärts. |
| **Führung** | offen / zu | Abgeleitet: hängt ein einloggbares Konto unter mir? Nie gespeichert. |

Sie kreuzen sich frei. Eine Führungskraft auf Ausbau 1 sieht die Mannschaft,
aber keinen Trichter. Das ist gewollt: wer führt, muss führen können.

Nicht zu verwechseln mit **Aufbau** (`CONTEXT.md`): dort wächst die Struktur,
hier das Werkzeug.

### Der Schnitt

| Ausbau 1 | + Ausbau 2 | + Führung | + Admin |
|---|---|---|---|
| Namen · Heute · Kalender · Einladen | Trichter · Wettbewerb | Mannschaft | Team |
| **4 Reiter** | 6 | 7 | 8 |

Alle Adressen:

| Ausbau 1 | Ausbau 2 | Führung | Admin |
|---|---|---|---|
| `/heute`, `/namen/*`, `/contacts/*`, `/kalender/*`, `/einladen`, `/konto/export` | `/trichter`, `/arena`, `/leaderboard`, `/log`, `/spiel`, `/einheiten` | `/mannschaft`, `/mannschaft/[id]`, `/mannschaft/bericht`, `/teamabend` | `/team`, `/werkstatt/*` |

Alles, was nicht in `BEREICHE` (`lib/ausbauSicht.ts`) steht, gilt als „anfang" —
dieselbe Regel wie bei den Feature-Schaltern. Eine vergessene Adresse darf
niemals versehentlich eine Seite verstecken; sie darf höchstens eine zu früh
zeigen, und das fällt beim Hinsehen auf.

---

## 3. Die Mechanik

**Freischalten darf** das nächste einloggbare Konto oberhalb im `User.path`.
Platzhalter werden übersprungen — sie können sich nie anmelden. Wer niemanden
über sich hat, braucht keine Freischaltung.

**Die Schwellen** stehen als `Einstellung`-Zeilen `ausbau.termine_vereinbart`
(5) und `ausbau.termine_gehalten` (1) — Ergebnisse statt Anrufe, seit
[ADR-0007](adr/0007-die-bitte-um-ausbau.md). Getroffen ist die Schwelle, sobald
eine der beiden Zahlen erreicht ist (**ODER**, nicht UND), gezählt über die
**gesamte Zeit**: die Rangliste fängt montags bei null an, der Ausbau darf das
nicht. Wer darunter liegt, darf zusätzlich selbst um mehr **bitten** — sichtbar
im Lagebild der Führungskraft und in der Werkstatt.

> **Kalibrierung nachgezogen (ADR-0007).** `node scripts/ausbau-probe.mjs`
> zeigt am 02.09.2026 gegen die echte Datenbank **3 Treffer** bei 5
> vereinbarten ODER 1 gehaltenem Termin (Jonathan, nick, plus der Admin) — bei
> der alten Anrufe-Schwelle (20/3) waren es am 30.08. **null**. Zwei Konten
> ohne Vorschlag (Timo, Jonas) können jetzt selbst um mehr **bitten**.

**Der Vorschlag** erscheint auf `/heute` zwischen den Führungsaufgaben, im
Aussehen von `FuehrungsAufgabe`, mit dem Grund daneben und einem Knopf. Er wird
**gerechnet, nicht gespeichert** — es gibt keinen `LeadershipTask`-Datensatz
dahinter. Grund: `app/(app)/mannschaft/actions.ts` hält fest, dass eine Aufgabe
ausschliesslich durch einen Tipp der Führungskraft entsteht, und
`docs/audit-kernmodell.md` §9 nennt automatisch erzeugte Aufgaben ausdrücklich
„bewusst nicht gebaut". Gerechnet verschwindet der Vorschlag von selbst, sobald
`ausbau === 2` steht.

Nur über die **eigenen Direkten**: wer tiefer im Ast hängt, wird von *seiner*
Führungskraft freigeschaltet, nicht über deren Kopf hinweg.

**Notausgang:** In der Werkstatt steht „Warten auf Freischaltung" mit einem
Sammelknopf. Der Block zeigt nebenbei, welche Führungskraft nicht hinschaut.

**Nie zurück.** Das `ausbau: { lt: AUSBAU_VOLL }` im Filter beider Aktionen ist
kein Wettlauf-Schutz, sondern die Regel selbst — dieser Weg kann nichts zumachen.

**Gesperrte Adresse aufgerufen:** `components/NochZu.tsx`, eine schlichte Seite
mit dem Satz, wer öffnet, und einem Zurück-Knopf. Kein 404, keine stumme
Weiterleitung — beides sagt „da ist ein Fehler", und der Nutzer versucht es noch
einmal. Der Wächter sitzt in den beiden Gruppen-Layouts und nicht in jeder Seite
(zehnmal dieselbe Zeile, beim elften Mal vergessen); die Adresse kommt als
Kopfzeile `x-pfad` aus der Middleware, weil eine Server-Komponente ihre eigene
nicht kennt. Entschieden wird trotzdem im Layout — die Middleware läuft auf der
Edge-Runtime und hat keine Datenbank, derselbe Grund, aus dem schon die
Willkommens-Weiche dort nicht sitzt.

**Der Moment des Aufgehens:** einmalig eine wegtippbare Karte ganz oben auf
`/heute` (`components/AusbauAufgegangen.tsx`), ein Satz je neuem Begriff.
Gemerkt über `User.ausbauGezeigtAm`, Muster wie `whyShownAt`/`pledgeShownAt`.
Konten, die die Migration hochgesetzt hat, tragen kein `ausbauGesetztAm` — für
sie ging nichts auf, und die Karte erscheint zu Recht nie.

---

## 4. `/heute` auf Ausbau 1 — vier Blöcke

Bleibt: **Tagespensum** (die grosse Zahl und die drei Kacheln), **die
Aufgabenlisten** (Überfällig / Heute / Diese Woche), **Starterpass** aus
`ErsteWoche`, **eine Rangliste-Zeile** — „Platz 7 von 14 diese Woche, über dir
Marc und Nick" (ohne Link, weil das Ziel auf dieser Stufe zu ist; unter drei
Köpfen steht sie gar nicht da), die **Push-Aufforderung** (der Wecker braucht
Empfänger, gerade am Anfang) und der **Liegenbleiber-Streifen** als eine Zeile
(nur der älteste Name mit Link auf `/namen`, ohne Zähler-Kasten und Liste).

Verschwindet: EinheitenKarte, Nachfüll-Alarm, „Ohne nächsten Schritt". Im
Schnellzugriff (`+`) verschwindet das Einheiten-Feld; die drei Zähler und die
Punktezeile bleiben.

Der Lagebild-Block hängt weiter an `gefuehrte > 0` und damit an der
Führungs-Achse. Seine **Einheiten-Zeilen** (Team-Puls, Schwellen-Zeile in
`LageKopf`) brauchen zusätzlich Ausbau 2 — gesetzt an `einheitenAn`, damit auch
die teuren Abfragen darunter ausbleiben.

> **Bewusst in Kauf genommen:** Eine Führungskraft auf Ausbau 1 sieht die
> Ampel-Bilanz und ihre Direkten, aber keine Einheiten-Zahlen. Falls das im
> Betrieb stört, ist die Gegenmassnahme eine Zeile in der Migration:
> `ausbau = 2` für jeden mit Direkten.

---

## 5. Datenmodell

```prisma
// am User:
ausbau           Int       @default(1)
ausbauGesetztVon String?
ausbauGesetztAm  DateTime?
ausbauGezeigtAm  DateTime?
```

Migration `20260830120000_ausbau`: additiv, idempotent, kein eigenes
BEGIN/COMMIT. Sie ist die einzige im Repo, die etwas wegnimmt — **jedes
bestehende Konto fällt auf Ausbau 1**. Drei Ausnahmen: der Admin, wer keine
einloggbare Führungskraft über sich hat, und Platzhalter (die bleiben auf 1,
damit die Freischaltung entschieden wird, wenn ein Mensch daraus wird).

Warum überhaupt gespeichert, wo `lib/stufen.ts` mit „Eine Stufe wird NICHT
gespeichert" anfängt und `User.careerLevel` als totes Feld rausflog: dort rechnet
eine Formel, hier entscheidet ein Mensch — und dieses Feld wird auf jeder Seite
gelesen.

Die Führungs-Achse bleibt ungespeichert. Ein `fuehrt`-Flag müsste bei jedem
Umhängen fortgeschrieben werden — dieselbe Begründung wie bei der Team-Summe
(`docs/einheiten-plan.md` §10).

---

## 6. Wo es steht

| Datei | Was |
|---|---|
| `lib/ausbauSicht.ts` | Die Regeln. Rein, ohne Prisma und React — der Wegweiser braucht sie im Browser |
| `lib/ausbau.ts` | Was die Datenbank braucht: Stand, nächste FK oberhalb, Schwellen, Vorschläge |
| `components/NochZu.tsx` | Die Sperrseite |
| `components/AusbauVorschlag.tsx` | Der Vorschlag an die Führungskraft |
| `components/AusbauAufgegangen.tsx` | Die Karte im Moment des Aufgehens |
| `components/RanglisteZeile.tsx` | „Etwas von der Rangliste" für Ausbau 1 |
| `app/(app)/mannschaft/actions.ts` | `ausbauFreischalten` |
| `app/(team)/werkstatt/actions.ts` | `ausbauNachziehen` (einzeln oder alle) |
| `scripts/ausbau-probe.mjs` | Lesende Probe: wer wartet, wer reisst die Schwellen |
| `scripts/logik-probe.mjs` | 23 Prüfungen der reinen Regeln |

---

## 7. Offene Punkte

| # | Frage | Wer entscheidet |
|---|---|---|
| 1 | Stimmen **20 Anrufe / 3 gehaltene Termine**? Heute reisst sie niemand | Praxis. Zwei Zeilen in der Werkstatt |
| 2 | Braucht es eine dritte Ausbaustufe, wenn `/mannschaft` selbst zu voll ist? | Erst laufen lassen |
| 3 | Soll der Nutzer selbst um Freischaltung bitten können? | Offen. Heute geht der Zug nur von oben |
| 4 | **Latenter Fehler in der Migration:** Ausnahme 2 prueft `NOT EXISTS (o.path ist Praefix von u.path)`. `User.path` hat den Schema-Vorgabewert `/`. Traegt irgendein Konto diesen Wert, passt es als Praefix auf JEDES Konto und die Wurzel-Ausnahme greift fuer niemanden mehr — alle fielen auf Ausbau 1 und warteten auf eine Fuehrungskraft, die es nicht gibt. Gegen die Datenbank geprueft: 0 solcher Konten. Die Migration ist gefahren und traegt eine Pruefsumme, ihre Datei darf deshalb nicht mehr angefasst werden. Eine kuenftige Instanz braucht in ihrer Fassung zusaetzlich `AND o."path" <> '/'` | Beim naechsten Aufsetzen einer Instanz |
