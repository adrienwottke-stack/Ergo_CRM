# Zeitersparnis-Plan (Ergo CRM)

Stand: 15.08.2026 — Planungsdokument, noch nicht implementiert.

Vorstufe zum [Assistenten](assistent-plan.md): **Wie sparen wir Zeit, ohne KI?**
Jede Sekunde, die hier eingespart wird, kostet keine API-Gebühr, wartet nicht auf eine
Antwort und funktioniert auch im Funkloch.

Der Leitsatz: **Der Assistent soll die unordentlichen 20 % übernehmen, nicht die
routinierten 80 %.** Wenn „nicht erreicht" ein Tipp ist, muss niemand dafür diktieren.

---

## 1. Methode

Gezählt wurden die tatsächlichen Interaktionen im Code — Tipps, Tastenanschläge,
Seitenwechsel — für die Abläufe, die am häufigsten vorkommen. Zugrunde gelegter Tag:

> 25–30 Anrufversuche, davon ~20 nicht erreicht oder kurz abgewimmelt, 3–5 echte
> Gespräche, 1–3 Termine, dazu abends Nacharbeit.

Diese Annahme ist der wackeligste Teil der Rechnung. Wenn dein Tag anders aussieht,
verschieben sich die Prioritäten — sag es, dann rechne ich neu.

---

## 2. Wo die Zeit hingeht

### 2.1 Der teuerste Befund: Pflicht-Freitext bei jedem erledigten Schritt

[`ContactActionDialog.tsx:182`](../components/ContactActionDialog.tsx) — das Feld
„Was ist passiert? *" ist **Pflicht**, und es gibt dort **keine Textbausteine**. Die
Bausteine aus [`NoteTemplates.tsx`](../components/NoteTemplates.tsx) hängen nur am
Kontakt-Formular und am Aktivitäts-Formular, nicht im meistgenutzten Dialog.

Der häufigste Vorgang des Tages sieht damit so aus:

| Schritt | Interaktion |
|---|---|
| „Erledigt" tippen | 1 Tipp |
| ins Textfeld tippen | 1 Tipp |
| „nicht erreicht" schreiben | ~14 Anschläge |
| „Erledigt & weiter" | 1 Tipp |

**3 Tipps + 14 Anschläge, etwa 12 Sekunden.** Zwanzigmal am Tag: 60 Tipps, 280 Anschläge,
**rund 4–5 Minuten** — für eine Information, die vier Knöpfe abbilden könnten.

### 2.2 Der schnelle Weg existiert, steht aber an der falschen Stelle

Zwei Stellen im System machen fast dasselbe, mit unterschiedlichem Tempo:

| Ansicht | Weg für „Anruf ohne Erfolg" | Dauer |
|---|---|---|
| **Fokus-Modus** (`/focus`) | Ein Knopf „Mailbox / +2d", Notiztext voreingestellt über `quickLogCall` | **1 Tipp** |
| **Heute-Liste** (`/heute`) | „Erledigt" → Dialog → Freitext → speichern | 3 Tipps + Tippen |

Der schnelle Weg ist der versteckte. `/heute` ist die Startseite und die Hauptarbeitsfläche
— dort fehlt genau das Muster, das im Fokus-Modus schon funktioniert.

**Und es gibt ihn inzwischen ein drittes Mal.**
[`app/(app)/namen/actions.ts`](../app/\(app\)/namen/actions.ts) enthält bereits
`recordNameCall` mit genau den vier Ergebnissen — sauber gebaut, als Verkettung der
bestehenden Server-Actions (`quickLogCall`, `createActivity`, `setContactStage`,
`markContactLost`), mit 2 Tagen Wiedervorlage bei „nicht erreicht" und 7 bei „später".

Damit ist die Lage: **die Fachlogik für den schnellen Weg ist fertig geschrieben, hat aber
noch keine Oberfläche — und `/heute` weiß nichts von ihr.** Das ist kein Vorwurf, das ist
Glück: die teure Hälfte der wichtigsten Maßnahme existiert schon.

Der [Namensliste-Plan](namensliste-plan.md) beschreibt dasselbe Muster für Einsteiger.
**Es gehört in den Kern, nicht in eine Einsteiger-Nische.** Ein erfahrener Berater mit 30
Anrufen am Tag braucht es dringender als ein Einsteiger mit 20 Namen.

### 2.3 Sechs Knöpfe pro Zeile, und der häufigste fehlt

Eine Zeile in `/heute` trägt über [`ContactActions.tsx`](../components/ContactActions.tsx)
bis zu sechs Knöpfe: Anrufen · Erledigt · Phase · Empfehlungen · Checkup · +3 Tage ·
Verloren. Der mit Abstand häufigste Ausgang — nicht erreicht — ist **keiner davon**, er
versteckt sich hinter „Erledigt".

Am Handy ist das doppelt teuer: mehr Auswahl heißt längeres Zielen und mehr Fehlgriffe.

### 2.4 Termin eintragen dauert länger als das Telefonat rechtfertigt

Der Termin läuft über ein `datetime-local`-Feld. Am Handy heißt das: nativer Datumswähler
(3–4 Tipps), Zeitwähler (2–3 Tipps), bestätigen. Zusammen mit Dialog öffnen und Phase
wählen sind das **10–12 Interaktionen für „Dienstag 14 Uhr"**.

Dabei liegen 90 % aller Termine in den nächsten 14 Tagen und auf einer halben Stunde.

### 2.5 Wiedervorlage kennt genau eine Dauer

`+3 Tage` steht als fester Wert im Code. Alles andere — morgen, nächste Woche, in einem
Monat — braucht den vollen Dialog mit Datumswähler. Die drei häufigsten Fristen sind
verschieden, der Schnellweg deckt eine davon ab.

### 2.6 Der Kontext steht im Profil, nicht in der Zeile

Vor einem Anruf will man wissen, was beim letzten Mal war. In `/heute` steht der nächste
Schritt und dessen Notiz — **die letzte Aktivität und die Kontaktnotiz stehen nicht da**.
Wer sie braucht, öffnet das Profil, liest, geht zurück: zwei Seitenwechsel je Anruf.

Bei 10 solchen Anrufen sind das 20 Navigationen, die nichts erfassen.

### 2.7 Kein Rückgängig

Es gibt keinen Weg, einen Fehlgriff in einem Zug zurückzunehmen. Eine falsch gesetzte Phase
korrigiert man über: Kontakt öffnen → Phase-Dialog → alte Phase wählen → speichern → zur
Aktivität scrollen → löschen. Der Wettbewerbspunkt aus `APPOINTMENT_SET` bleibt dabei
stehen; nur Punkte aus Anruf-Aktivitäten verschwinden per Cascade mit.

**Das ist der eigentliche Grund, warum Ein-Tipp-Knöpfe heute nicht gebaut werden können.**
Schnelle Knöpfe ohne Rückgängig sind gefährlich — man tippt daneben und hat eine falsche
Zahl im Wettbewerb. Rückgängig ist deshalb keine Politur, sondern **Voraussetzung** für
alles andere in diesem Plan.

### 2.8 Neuer Kontakt: zehn Felder für zwei Angaben

[`ContactForm.tsx`](../components/ContactForm.tsx) zeigt Name, Telefon, E-Mail, Quelle,
Phase, Termin, Schritt-Typ, Schritt-Datum, Schritt-Notiz und Notiz. Pflicht ist einer davon.
Wer unterwegs „Peter Schmidt, 0171…" erfassen will, tippt zwei Felder und scrollt an acht
vorbei — plus Navigation hin und Weiterleitung zurück.

### 2.9 Am Rechner geht alles über die Maus

Die Befehlspalette (⌘K) kann **suchen**, sonst nichts. Wer abends 20 Gespräche nacharbeitet,
klickt sich durch. Für genau diese Sitzung wäre Tastaturbedienung der größte Hebel — und sie
kostet fast nichts, weil die Aktionen schon existieren.

### 2.10 Keine Massenaktion

Zwölf nicht erreichte Kontakte sind zwölfmal derselbe Vorgang. Es gibt keine Möglichkeit,
mehrere Zeilen zu markieren und gemeinsam zu behandeln — außer beim CSV-Import, der nur
anlegt.

---

## 3. Die Maßnahmen

Sortiert nach Nutzen je Aufwand. Die Zeitangaben beziehen sich auf den Tag aus Abschnitt 1.

### M0 · Rückgängig (30-Sekunden-Fenster) — **Voraussetzung**

Nach jeder schreibenden Aktion erscheint unten ein Streifen: *„Nicht erreicht bei Peter
Schmidt · Rückgängig"*. Ein Tipp nimmt **alles** zurück: Aktivität, Phasenwechsel,
Wettbewerbspunkt, Fristenänderung.

Technisch: Jede Aktion schreibt einen `UndoEntry` mit dem Vorzustand der geänderten Felder
und den IDs der erzeugten Zeilen. Rückgängig spielt ihn zurück und löscht den Eintrag.
Nach 30 Sekunden verfällt er.

> Ohne M0 darf keine der folgenden Maßnahmen gebaut werden. Ein-Tipp-Aktionen brauchen ein
> Ein-Tipp-Zurück, sonst wird aus jedem Fehlgriff eine Aufräumaktion.

**Aufwand:** mittel · **Spart:** direkt wenig, ermöglicht den Rest

### M1 · Vier Ergebnis-Knöpfe in der Heute-Liste

Das Muster aus dem Namensliste-Plan in den Kern gezogen. Je Zeile:

| Knopf | Was passiert | Tipps |
|---|---|---|
| 📵 **Nicht erreicht** | Aktivität, Wiedervorlage +2 Tage | 1 |
| ⏳ **Später** | Auswahl 1 Woche / 1 Monat / 3 Monate | 2 |
| ✅ **Termin** | Termin-Schnellwahl (M2) | 3 |
| ✕ **Kein Interesse** | Grund wählen, `outcome = VERLOREN` | 2 |

Dahinter ein unauffälliges **„…"** für alles Seltenere (Phase frei wählen, Empfehlungen,
Checkup, Vorgang). Die sechs gleichrangigen Knöpfe von heute werden zu vier häufigen plus
einem Menü.

Der Freitext bleibt — aber **eingeklappt und freiwillig**. Wer tippen will, tippt.

**Die Fachlogik ist bereits fertig:** `recordNameCall` aus `app/(app)/namen/actions.ts`
macht genau das. Zu tun ist zweierlei — die Funktion an eine gemeinsame Stelle heben (sie
ist nicht namenslisten-spezifisch, der Name führt in die Irre) und eine Knopfleiste bauen,
die sie aufruft. Beides ist überschaubar.

**Aufwand:** klein — Fachlogik existiert, es fehlt die Oberfläche · **Spart:** ~4–5 Min/Tag

### M2 · Termin-Schnellwahl statt Datumswähler

Zwei Reihen Chips statt eines nativen Wählers:

```
Heute   Morgen   Di 19.   Mi 20.   Do 21.   Fr 22.   ▸ anderes Datum
09:00   10:00    11:00    14:00    15:00    16:00    17:00   ▸ andere Zeit
```

Zwei Tipps für den Normalfall, der volle Wähler bleibt einen Tipp entfernt. Die Uhrzeiten
sollten nach dem ersten echten Monat aus den tatsächlich vergebenen Terminen abgeleitet
werden statt geraten.

**Aufwand:** klein · **Spart:** ~6–8 Interaktionen je Termin

### M3 · Kontext in der Zeile

Die Heute-Zeile bekommt zwei Zeilen mehr: **letzte Aktivität** (Text, gekürzt, mit Datum)
und die **Kontaktnotiz**, sofern vorhanden. Beides liegt bereits in der Datenbank und
kostet nur eine erweiterte Abfrage.

Damit entfällt der Sprung ins Profil vor dem Anruf.

**Aufwand:** klein · **Spart:** ~2 Navigationen je Anruf mit Vorgeschichte

### M4 · Wiedervorlage-Chips statt einer festen Dauer

`+3 Tage` wird zu `morgen · +3 Tage · nächste Woche`. Drei Chips statt einem Wert und einem
Dialog dahinter.

**Aufwand:** sehr klein · **Spart:** den Dialog in den meisten Fällen

### M5 · Schnell-Erfassung: Name und Nummer in einer Zeile

Oben in der Kontaktliste ein Feld-Paar mit Enter-Bestätigung — Cursor bleibt stehen, nächster
Name. Das volle Formular bleibt als „Mehr Felder" erreichbar.

Deckungsgleich mit Schritt 1 des Namensliste-Plans; wird einmal gebaut und an beiden
Stellen verwendet.

**Aufwand:** klein · **Spart:** 8 übersprungene Felder plus zwei Seitenwechsel je Kontakt

### M6 · Tastaturbedienung am Rechner

Für die abendliche Nacharbeit: `J`/`K` zwischen den Zeilen, `1`–`4` für die vier Ergebnisse,
`T` für Termin, `Leertaste` klappt den Kontext auf, `Z` für Rückgängig. Eine Hilfezeile mit
`?`.

Die Aktionen existieren nach M1 bereits — es kommt nur eine Tastenzuordnung dazu.

**Aufwand:** klein · **Spart:** die Maus bei ~20 Nacherfassungen

### M7 · Rückkehr-Erkennung nach dem Telefonat

Wer auf „Anrufen" tippt, verlässt den Browser. Beim Zurückkommen steht oben groß
*„Wie lief's mit Peter Schmidt?"* mit den vier Ergebnis-Knöpfen — statt der Liste, in der
man sich neu zurechtfinden muss.

Erkennung über `visibilitychange` plus lokal gemerkter letzter Anruf.

**Aufwand:** klein–mittel (Sorgfalt bei den Sonderfällen) · **Spart:** das Wiederfinden nach
jedem Anruf

### M8 · Massenaktion in der Heute-Liste

Mehrere Zeilen markieren → *„Nicht erreicht"* oder *„+3 Tage"* für alle. Der typische Fall
ist der Anrufblock, bei dem die Hälfte nicht rangeht.

**Aufwand:** mittel · **Spart:** bei Blöcken viel, sonst nichts

### M9 · Fokus-Modus und Heute-Liste zusammenführen

Beide Ansichten machen nach M1 dasselbe, nur in unterschiedlicher Darstellung. Der
Fokus-Modus wird zum **Vollbild-Schalter** auf `/heute` („eine Karte nach der anderen")
statt zu einer eigenen Seite mit eigener Logik.

Spart keine Zeit im Alltag, aber es halbiert die Stellen, an denen dieselbe Logik gepflegt
werden muss — und es verschwindet ein Menüpunkt.

**Aufwand:** mittel · **Spart:** Wartung, nicht Alltagszeit

---

## 4. Was das zusammen bringt

| | Heute | Nach M0–M7 |
|---|---|---|
| 20× „nicht erreicht" | 60 Tipps, 280 Anschläge, ~4–5 Min | 20 Tipps, ~40 Sek |
| 3 Termine eintragen | ~33 Interaktionen, ~2 Min | ~9 Interaktionen, ~30 Sek |
| 10× Kontext nachsehen | 20 Navigationen | 0 |
| 5 Kontakte erfassen | 10 Felder + 2 Wechsel je Kontakt | 2 Felder, kein Wechsel |

**Grob 10–12 Minuten am Tag je Berater**, also etwa **vier Stunden im Monat**. Bei drei
Beratern in der Struktur ein halber Arbeitstag monatlich.

Die Zahl ist eine Schätzung auf Basis der gezählten Interaktionen, kein gemessener Wert —
gemessen wird sie erst, wenn du eine Woche damit gearbeitet hast.

---

## 5. Was das für den Assistenten bedeutet

Diese Maßnahmen machen den Assistenten **nicht überflüssig, sondern billiger und
zielgenauer**:

- Die Routine (nicht erreicht, +3 Tage, Standardtermin) läuft ohne API-Aufruf. Das senkt
  die laufenden Kosten deutlich unter die geschätzten 6 € im Monat.
- Was übrig bleibt, ist genau das, wofür sich ein Sprachmodell lohnt: **Sammel-Diktat**
  („12 angerufen, Schmidt und Klein nicht erreicht…"), unscharfe Zuordnung, mehrere
  Änderungen in einem Satz.
- Die Vorschlagskarten des Assistenten können dieselben Ergebnis-Knöpfe wiederverwenden.
  Was hier gebaut wird, wird dort nicht noch einmal gebaut.

Und ein Sicherheitsnetz: Wenn die API ausfällt, langsam ist oder du im Funkloch stehst,
bleibt das CRM vollständig bedienbar. Ein System, dessen schnellster Weg über einen
externen Dienst führt, ist an schlechten Tagen unbenutzbar.

---

## 6. Bauabschnitte

| # | Inhalt | Ergebnis |
|---|---|---|
| 0 | **M0 Rückgängig** | Voraussetzung für alles Weitere |
| 1 | M1 Ergebnis-Knöpfe + M4 Wiedervorlage-Chips | Der größte Einzelgewinn |
| 2 | M2 Termin-Schnellwahl | Termine kosten keine halbe Minute mehr |
| 3 | M3 Kontext in der Zeile | Kein Sprung ins Profil vor dem Anruf |
| 4 | M5 Schnell-Erfassung | Kontakte unterwegs anlegen |
| 5 | M7 Rückkehr-Erkennung | Der Anruf-Kreislauf schließt sich |
| 6 | M6 Tastaturbedienung | Abendliche Nacharbeit wird schnell |
| 7 | M8 Massenaktion | Anrufblöcke |
| 8 | M9 Zusammenführung Fokus / Heute | Eine Logik statt zwei |

**Nach Abschnitt 1 ist der Großteil der Ersparnis da.** Alles danach ist Feinschliff mit
klar abnehmendem Ertrag — ein guter Punkt, um zwischendurch eine Woche zu arbeiten und dann
neu zu entscheiden.

Abschnitt 0 bis 3 sind zusammen kleiner als der Pipeline-Umbau.

---

## 7. Bewusst nicht

| Was | Warum |
|---|---|
| Automatisches Wählen (Twilio/Sipgate) | Fremde Rufnummer im Display, laufende Kosten, ein AV-Vertrag mehr. Beim Bekanntenkreis sogar ein Rückschritt — siehe Namensliste-Plan, Abschnitt 4 |
| Spracherkennung im Server | Die Diktierfunktion des Handys reicht und kostet nichts |
| Offline-Betrieb mit Synchronisierung | Zwei Wahrheiten, die auseinanderlaufen können. Erst wenn Funklöcher echt stören |
| Automatisch erzeugte Notiztexte ohne KI | Vorgefertigte Sätze in der Historie sind wertlos. Lieber gar keine Notiz als eine erfundene |
| Anpassbare Tastenkürzel | Erst wenn jemand danach fragt |

---

## 8. Offene Punkte

1. **Stimmt der Tag aus Abschnitt 1?** Die ganze Priorisierung hängt daran. Wenn du eher
   5 lange Gespräche als 30 kurze Anrufe hast, rückt M3 (Kontext) vor M1.
2. **Welche vier Ergebnisse sind bei dir wirklich die häufigsten?** Der Namensliste-Plan
   nimmt Termin / Nicht erreicht / Später / Kein Interesse an — das ist eine Annahme aus der
   Fragerunde, die du übersprungen hast.
3. **Wiedervorlage-Standard bei „nicht erreicht"** — `recordNameCall` setzt heute 2 Tage
   (wie der Fokus-Modus) und 7 Tage bei „später". Passt das, oder anders?
4. **Reihenfolge gegenüber der Namensliste.** Die Fachlogik (`recordNameCall`) ist fertig,
   die Oberfläche fehlt an beiden Stellen. Mein Vorschlag: **die Knopfleiste einmal bauen
   und zuerst in `/heute` einhängen**, dann die Namensliste — sie bekommt dieselbe
   Komponente, statt eine zweite zu erzeugen. Dabei sollte `recordNameCall` aus
   `namen/actions.ts` an eine neutrale Stelle wandern; unter dem jetzigen Namen und Ort
   findet sie in `/heute` niemand.
