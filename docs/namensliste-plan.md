# Namensliste (Ergo CRM)

Stand: 15.08.2026 — **umgesetzt**, Bauabschnitte 1–6 sind gebaut.

Ziel: Ein Einsteiger legt am ersten Tag 20 Namen an, sortiert sie nach Nähe (A/B/C) und
telefoniert sie ab — **anrufen, Ergebnis, anrufen, Ergebnis**, ohne einmal ein Formular zu
sehen. Das vollständige CRM bleibt unangetastet daneben stehen und übernimmt, sobald aus
einem Namen ein Termin wird.

---

## 1. Grundentscheidungen

| Thema | Entscheidung | Woher |
|---|---|---|
| Verhältnis zum CRM | **Dieselbe `Contact`-Tabelle**, nur eine schlanke Ansicht darauf | von dir bestätigt |
| A / B / C | **Nähe zur Person**: A = enger Kreis, B = Bekannte, C = lose Kontakte | von dir bestätigt |
| Leitfäden | Startversion fest eingebaut, **je Berater überschreibbar** | von dir bestätigt |
| Geräte | **Handy und Rechner gleichwertig** — `tel:`-Link *und* Kopier-Knopf | von dir bestätigt |
| Zwei Listen | Reiter **Recruiting** / **Verkauf**, ein Name darf in beiden stehen | ⚠️ Annahme |
| Die 20 | **Ziel mit Fortschrittsbalken**, mehr Namen sind erlaubt | ⚠️ Annahme |
| Ergebnisse | Termin · Nicht erreicht · Später nochmal · Kein Interesse | ⚠️ Annahme |
| Einsteiger-Modus | Ausgedünnte Navigation, umschaltbar — **eigener Bauabschnitt, streichbar** | ⚠️ Annahme |

Die vier Annahmen stammen aus der zweiten Fragerunde, die du übersprungen hast. Sag
einfach, was du davon anders willst — keine davon greift tief ins Fundament.

**Warum dieselbe Tabelle und nicht eine zweite:** Ein Name auf der Liste *ist* schon ein
Kontakt, er wird nur minimal angezeigt. Damit zählt jeder Anruf sofort für den Wettbewerb,
beim „Hochstufen" wird nichts kopiert und nichts geht verloren, und es gibt keine zweite
Wahrheit, die auseinanderlaufen kann. Der Unterschied zwischen Namensliste und CRM ist
**allein die Oberfläche**, nicht die Daten.

---

## 2. Der Alltag in drei Schritten

### Schritt 1 — Namen sammeln (einmalig, ~10 Minuten)

Ein einziges Eingabefeld, mehr nicht:

```
┌─────────────────────────────────────────┐
│  Name                          [+ ]     │   ← tippen, Enter, nächster Name
└─────────────────────────────────────────┘
     14 von 20 Namen  ████████████░░░░  70 %
```

Enter legt den Namen an und lässt den Cursor stehen — 20 Namen in zwei Minuten. Nummer und
A/B/C kommen danach, nicht dazwischen; wer beim Sammeln über Details nachdenkt, kommt nicht
auf 20. Drei Zusatzwege ohne Mehraufwand:

- **CSV-Import** — gibt es bereits unter `/contacts/import`, bekommt nur einen Knopf hier
- **Aus dem Handy-Adressbuch** — Chrome auf Android kann einen Kontaktwähler öffnen
  (`navigator.contacts`); Safari auf dem iPhone kann es nicht. Deshalb: Knopf erscheint nur,
  wenn das Gerät es kann, sonst gar nicht. Nettes Extra, kein tragender Teil
- **Aus dem Wettbewerbszähler** — wer schon Namen im CRM hat, hakt sie hier an

### Schritt 2 — Sortieren (~2 Minuten)

Jede Zeile trägt rechts einen Buchstaben. Tippen zykelt **A → B → C → A**. Kein Menü, kein
Dialog, ein Tipp pro Name.

| | Bedeutung | Farbe |
|---|---|---|
| **A** | Enger Kreis: Familie, beste Freunde | Grün |
| **B** | Bekannte: Kollegen, Verein, Nachbarn | Bernstein |
| **C** | Lose Kontakte: Zufallsbekanntschaften | Grau |

Die Liste sortiert von sich aus A → B → C. Darüber drei Filter-Pillen (`filterPill` aus
`components/ui.ts`, wie schon auf `/contacts`), damit man einen reinen A-Durchlauf machen
kann.

### Schritt 3 — Durchtelefonieren

Der Kern. Ein Bildschirm, ein Name, große Knöpfe:

```
┌───────────────────────────────────────────┐
│  Name 7 von 20        ██████░░░░░░  35 %  │
├───────────────────────────────────────────┤
│                                           │
│   Peter Schmidt                    [A]    │
│   0171 2345678                            │
│                                           │
│   ┌─────────────────┐  ┌───────────────┐  │
│   │  📞  ANRUFEN    │  │  Nummer 📋    │  │
│   └─────────────────┘  └───────────────┘  │
│                                           │
│   ▸ Leitfaden Recruiting (TVB)            │  ← aufklappbar, merkt sich den Zustand
│                                           │
├───────────────────────────────────────────┤
│   Wie lief's?                             │
│   ┌────────────────┐ ┌──────────────────┐ │
│   │ ✅ Termin!     │ │ 📵 Nicht erreicht│ │
│   ├────────────────┤ ├──────────────────┤ │
│   │ ⏳ Später      │ │ ✕ Kein Interesse │ │
│   └────────────────┘ └──────────────────┘ │
│              [ Überspringen → ]           │
└───────────────────────────────────────────┘
```

Nach jedem Ergebnis springt die Karte automatisch zum nächsten Namen. Kein Speichern-Knopf,
kein Zurück zur Liste. Am Ende die Erfolgsseite mit der Tagesbilanz (das Muster steht schon
im `FocusDialer`).

**Der Trick beim Zurückkommen:** Wer auf „Anrufen" tippt, verlässt den Browser. Die App
merkt sich das lokal, und beim Zurückkehren steht die Ergebnisauswahl oben und größer da —
*„Wie lief's mit Peter Schmidt?"*. Kein Suchen, wo man war. Der Fortschritt hängt zusätzlich
am Server (wer ist noch offen), die App überlebt also auch einen kompletten Neustart.

---

## 3. Die vier Ergebnisse

| Knopf | Was passiert im CRM | Wettbewerb |
|---|---|---|
| ✅ **Termin vereinbart** | Dialog mit Datum + Uhrzeit → Phase `TERMIN_VEREINBART`, nächster Schritt „Termin durchführen" am Termindatum. Der Name **wandert aus der Arbeitsliste** in den Bereich „Geschafft" | `CALL` + `APPOINTMENT_SET` |
| 📵 **Nicht erreicht** | Ein Tipp. Aktivität „Nicht erreicht", Wiedervorlage in 2 Tagen, weiter | `CALL` |
| ⏳ **Später nochmal** | Auswahl 1 Woche / 1 Monat / 3 Monate. Phase `KONTAKTIERT`, Wiedervorlage gesetzt — ab jetzt taucht er in `/heute` auf | `CALL` |
| ✕ **Kein Interesse** | Grund wählen (kein Bedarf / kein Interesse / schon versorgt), `outcome = VERLOREN`. Bleibt für die Statistik erhalten | `CALL` |

Alle vier rufen **die bestehenden Server-Actions** auf — `quickLogCall`, `setContactStage`,
`markContactLost`. Es entsteht kein zweiter Weg in die Datenbank, der eigene Fehler machen
kann. Dieselbe Regel wie im Assistent-Plan, Abschnitt 3.

Ein Notizfeld gibt es, aber **eingeklappt**. Wer tippen will, tippt; wer 20 Namen abarbeiten
will, sieht es nicht.

---

## 4. Anrufen — was technisch wirklich geht

**Der Weg, den wir bauen:** Ein `tel:`-Link öffnet die Telefon-App mit vorgewählter Nummer.
Der Nutzer tippt einmal auf den grünen Hörer. Das Betriebssystem lässt kein Wählen ohne
diese Bestätigung zu — weder iOS noch Android, und das aus gutem Grund. Praktisch heißt das:

> tippen → Handy wählt → auflegen → zurück zur App → Ergebnis → nächster Name

Zwei Tipps mehr als „vollautomatisch", dafür keine Kosten, keine fremde Rufnummer, kein
Datenschutz-Thema. Am Rechner tut der `tel:`-Link meist nichts — deshalb steht dort der
**Kopier-Knopf** gleich daneben, und die Nummer ist groß und abtippbar gesetzt.

**Was wir nicht bauen (und warum):** Echtes Auto-Wählen bräuchte einen Telefonie-Dienst wie
Twilio oder Sipgate. Das Gespräch liefe dann über den Anbieter statt über dein Handy —
monatliche Grundgebühr plus Minutenpreis, eigene Rufnummer, ein Auftragsverarbeitungsvertrag
mehr, und der Angerufene sieht eine fremde Nummer im Display. Beim Bekanntenkreis, wo die
gespeicherte Nummer im Display der halbe Erfolg ist, wäre das sogar ein Rückschritt. Falls
das später doch Thema wird: Der Knopf ist die einzige Stelle, die sich ändern müsste.

**Zusätzlich:** Die App bekommt ein Web-App-Manifest, damit „Zum Startbildschirm hinzufügen"
ein richtiges Symbol ergibt und die Adressleiste verschwindet. Das ist eine Datei plus zwei
Symbole — kein echter App-Store-Aufwand, aber es fühlt sich am Handy sofort anders an.

---

## 5. Gesprächsleitfäden

Auf der Anrufkarte aufklappbar, passend zum Reiter (Recruiting oder Verkauf). Einmal
aufgeklappt bleibt er offen, bis man ihn schließt — wer den Leitfaden braucht, braucht ihn
bei allen 20 Namen.

**Aufbau je Leitfaden** — kurze Blöcke, keine Textwand:

```
Einstieg      „Hallo Peter, hier ist Adrien — hast du zwei Minuten?"
Aufhänger     ...
Terminfrage   ...
Einwände      „Keine Zeit"  →  ...
              „Kein Interesse"  →  ...
              „Schick mir was per Mail"  →  ...
Abschluss     Termin bestätigen, Adresse, Wiederholung
```

**Wie das Überschreiben funktioniert.** Die Standardtexte liegen als Konstante im Code
(`lib/guides.ts`). Wer auf „Bearbeiten" tippt, bekommt eine **persönliche Kopie** in der
Datenbank; alle anderen sehen weiter den Standard. Beim Anzeigen gilt: persönliche Fassung,
sonst Standard. „Zurücksetzen" löscht die Zeile wieder. Vorteil gegenüber einem Seeding:
Verbesserst du den Standardtext, erreicht das sofort jeden, der nichts eigenes gespeichert
hat — ohne Migration.

**Stand der Leitfäden.** Der **TVB-Leitfaden** liegt vollständig im Wortlaut vor und hängt
an der **Verkauf**-Liste — inhaltlich ist er ein Terminierungsleitfaden fürs Finanzthema
(Smalltalk → Aufhänger Geld → Bedarfsfrage → Verzweigung A/B/C → Alternativtechnik →
Checkliste), kein Recruiting-Gespräch. Für **Recruiting** steht weiter ein Gerüst mit
Platzhaltern; es ist in der Oberfläche als „Gerüst“ gekennzeichnet, damit niemand einen
halbfertigen Text für einen fertigen hält. Sobald jemand selbst hineinschreibt, verschwindet
die Kennzeichnung.

Die eckigen Klammern im TVB (`[Haus]`, `[Tätigkeit]`, `[Vorteile unseres Produkts nennen]`)
sind kein Mangel, sondern Einsetzstellen je Gespräch — deshalb lösen sie keinen Hinweis aus.

---

## 6. Datenmodell

Vier neue Felder, zwei neue Enums, eine kleine Tabelle. Nichts Bestehendes ändert sich.

```prisma
enum ContactRating {
  A // enger Kreis: Familie, beste Freunde
  B // Bekannte: Kollegen, Verein, Nachbarn
  C // lose Kontakte
}

enum ListKind {
  RECRUITING
  VERKAUF
}

model Contact {
  // ... alles Bestehende bleibt

  rating    ContactRating?
  listKinds ListKind[]      // leer = steht nicht auf der Namensliste

  @@index([ownerId, rating])
}

// Persoenlich ueberschriebener Leitfaden. Fehlt die Zeile, gilt der
// Standardtext aus lib/guides.ts.
model Guide {
  id        String   @id @default(cuid())
  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  key       String   // "RECRUITING_TVB", "VERKAUF_ERSTKONTAKT", ...
  title     String
  body      String
  updatedAt DateTime @updatedAt

  @@unique([ownerId, key])
}
```

`listKinds` als Liste statt zweier Ja/Nein-Felder: Ein Name darf gleichzeitig auf beiden
Listen stehen — der typische Fall ist, dass aus einem guten Verkaufsgespräch ein
Recruiting-Gespräch wird. Ist die Liste leer, ist der Kontakt ein ganz normaler
CRM-Kontakt und die Namensliste kennt ihn nicht.

**Eine wichtige Feinheit:** Namen von der Liste bekommen **keinen** nächsten Schritt
(`nextStepAt = null`). Sonst stünden 20 frische Namen sofort in `/heute` und würden die
Terminliste eines erfahrenen Beraters zumüllen. Die Namensliste ist ihr eigener
Arbeitsvorrat; erst „Später nochmal" oder ein Termin erzeugt eine echte Wiedervorlage. Das
weicht bewusst von `bulkImportContacts` ab, das heute jeden Import auf „heute anrufen"
setzt.

---

## 7. Die Übergabe ans CRM

Die Namensliste zeigt drei Abschnitte:

| Abschnitt | Was drin steht | Warum |
|---|---|---|
| **Offen** | Phase `NEU` oder `KONTAKTIERT` | Die Arbeitsliste — nur die zählt für den Durchlauf |
| **Geschafft** ✅ | `TERMIN_VEREINBART` und weiter | Sichtbarer Erfolg. Ein Tipp führt ins volle Profil |
| **Raus** | `outcome = VERLOREN` | Eingeklappt, mit Grund. Für die Quote, nicht für den Alltag |

Damit ist die „Vorstufe" kein Einbahnverkehr: Ein Name wandert von selbst nach oben, sobald
ein Termin steht, und der Einsteiger sieht am zweiten Tag, dass aus drei von zwanzig Namen
etwas geworden ist. Ein zusätzlicher Knopf „Ins CRM übernehmen" wäre überflüssige Arbeit —
die Daten sind ja schon da.

Der Wettbewerb läuft ohne eine Zeile Sonderlogik mit: `NUMBERS_PULLED` beim Anlegen, `CALL`
je Ergebnis, `APPOINTMENT_SET` beim Termin — genau wie über `createContact` und
`quickLogCall` heute schon.

---

## 8. Einsteiger-Modus (optional, streichbar)

Die Kopfzeile hat heute acht bis zehn Punkte. Für jemanden am ersten Tag ist das zu viel.

`User.beginnerMode` (Standard: aus, damit sich für dich nichts ändert). Ist er an, zeigt die
Navigation nur **Namen · Heute · Wettbewerb**, dahinter ein unauffälliges „Alles anzeigen".
Nichts wird gelöscht oder gesperrt, nur ausgeblendet — wer neugierig ist, tippt einmal und
sieht das ganze CRM.

Das ist der einzige Abschnitt, der ohne Verlust wegfallen kann. Wenn dir ein zusätzlicher
Menüpunkt „Namen" reicht, streich Bauabschnitt 6.

---

## 9. Bauabschnitte

| # | Inhalt | Ergebnis |
|---|---|---|
| 1 | Schema (`rating`, `listKinds`, `Guide`) + Migration | Datenbasis |
| 2 | `lib/namelist.ts`: A/B/C-Beschriftung, Farben, Sortierung, Ziel 20 | Eine Quelle für die Fachlogik, wie `lib/pipeline.ts` |
| 3 | `/namen`: Reiter, Schnell-Erfassung, A/B/C-Tippen, Filter, drei Abschnitte | Sammeln und sortieren geht |
| 4 | Anruf-Durchlauf: `tel:` + Kopieren, vier Ergebnis-Knöpfe, Rückkehr-Erkennung | **Ab hier ist es benutzbar** |
| 5 | Leitfäden: Standardtexte, Aufklapp-Panel, Bearbeiten und Zurücksetzen | Der Einsteiger weiß, was er sagen soll |
| 6 | Einsteiger-Modus + Web-App-Manifest | Aufgeräumt und wie eine App am Startbildschirm |

Nach Abschnitt 4 kann ein Einsteiger die Liste abtelefonieren. Abschnitt 5 ist der Teil, der
ihn das auch *trauen* lässt.

Aufwand grob: 1–3 an einem Abend, 4 ist das Herzstück und braucht Sorgfalt beim
Zurückkommen vom Telefonat, 5–6 sind überschaubar.

---

## 10. Was noch offen ist

1. **Der Recruiting-Leitfaden** — Struktur steht, Wortlaut fehlt. Direkt in der App unter
   „Leitfaden bearbeiten“ eintragbar, ohne Code-Eingriff.
2. **Heißt es „Namensliste" oder anders bei euch?** Die Beschriftung im Menü sollte das Wort
   benutzen, das ihr im Gespräch benutzt. Aktuell steht dort „Namen“.
3. **Zählt ein Recruiting-Gespräch bei euch anders für den Wettbewerb** als ein
   Verkaufsgespräch? Heute ist ein `CALL` ein `CALL`. Wenn du das getrennt sehen willst,
   ist es nachträglich eine Migration.
4. **Durchklick am echten Gerät** — Build, Typprüfung und Leitfaden-Zerlegung sind geprüft,
   der Ablauf am Handy noch nicht.
