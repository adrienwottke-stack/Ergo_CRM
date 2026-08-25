# Rückmeldung — ein privater Rückkanal an den Admin

Stand: 25.08.2026. Gebaut in einem Zug, weil der einzige Weg für Kritik bisher
eine WhatsApp-Nachricht an Adrien war.

---

## 1. Warum

Wer etwas an der App scheiße findet oder ein Feature braucht, muss heute Adrien
persönlich schreiben. Das filtert hart, und zwar an der falschen Stelle: es
filtert nicht nach Wichtigkeit, sondern nach Mut und Gelegenheit. Wer sich nicht
traut, wer gerade unterwegs ist, wer denkt „dafür schreibe ich jetzt keine
Nachricht" — der schluckt es. Und was geschluckt wird, kommt nie an.

Zweiter Punkt: **am Handy tippt niemand einen Absatz.** Genau von dort kommt die
Rückmeldung aber, weil die App dort benutzt wird. Ein Kommentarfeld wäre ein
Kanal, den keiner benutzt. Deshalb ist die Sprachnachricht nicht die Kür,
sondern der Hauptweg.

### Was hier ausdrücklich NICHT zurückkommt

`docs/audit-kernmodell.md`, 5.14 hat die Wunschliste und die
„Taugt das?"-Abstimmung gestrichen:

> Produktverwaltung im Produkt. Kostet den Partner Aufmerksamkeit und bringt ihm
> keinen Termin.

**Das Urteil bleibt richtig und wird hier nicht angetastet.** Der Unterschied
liegt nicht im Thema, sondern in der Richtung:

| Damals (raus) | Jetzt |
|---|---|
| Öffentliches Gremium: Liste, Stimmen, Friedhof | Privater Rückkanal an genau eine Person |
| Kostet **jeden** Partner Aufmerksamkeit — die Liste stand da und wollte gelesen werden | Kostet nur den, der von sich aus etwas sagen will |
| Produktarbeit **im** Produkt, für alle sichtbar | Produktarbeit bleibt in der Werkstatt, beim Admin |
| Ein neuer Ort, den man besuchen muss | Ein Symbol in der Kopfzeile, das man übersehen kann |

Es gibt weiterhin **keine Abstimmung, keine öffentliche Liste, keine Roadmap im
Produkt.** Der Baustein erzeugt keine neue Pflicht — er ersetzt eine Nachricht,
die es ohnehin schon gibt.

Und er ersetzt die Nutzungsmessung nicht. Die Werkstatt sagt, **was** keiner
anfasst; die Rückmeldung sagt, **warum**. „Nutzung statt Meinung" bleibt der
Maßstab für Abschaltungen — die Rückmeldung ist kein Stimmzettel.

---

## 2. Der Trichter

Zwei Bildschirme in einem Bottom-Sheet (`components/Modal.tsx`), erreichbar über
das Megafon in der Kopfzeile.

1. **Stimmung** — „Ärgert mich" / „Geht so" / „Läuft gut".
2. **Alles Weitere ist freiwillig** — Anliegen als Chip, Sprachnachricht, Text.
   Abschicken geht sofort, auch ohne ein einziges davon.

Jede Pflichtangabe wäre eine weitere Hürde hinter der ersten, und hinter der
letzten Hürde steht niemand mehr. Deshalb ist **nur die Stimmung Pflicht** — in
der Datenbank genauso wie in der Oberfläche.

**Drei Flächen statt fünf Sternen.** Am Daumen ist eine große Fläche schneller
als das Zielen auf Stern drei, und die drei bilden genau die Töne
`gefahr / warnung / erfolg` aus `components/ui.ts` ab — dieselbe Tonleiter wie im
Rest der Anwendung.

**Kein Navigationspunkt und kein schwebender Knopf.** Ein Navigationspunkt kostet
einen Platz und damit Aufmerksamkeit von allen, auch von denen, die nie etwas
melden wollen — genau der Vorwurf aus 5.14. Unten rechts liegt bereits die
Undo-Leiste (`components/UndoBar.tsx`, `fixed bottom-0 z-40`).

**Mit Namen, und das steht auch da:** „Geht nur an Adrien — mit deinem Namen,
damit er nachfragen kann." Wer glaubt, anonym zu schreiben, und es dann nicht
ist, sagt beim nächsten Mal gar nichts mehr. Bei einer Sprachnachricht wäre
Anonymität ohnehin eine Illusion — man erkennt die Stimme.

---

## 3. Die Aufnahme

Halten und sprechen, loslassen und fertig — wie in WhatsApp.
`components/Sprachaufnahme.tsx`.

- **60 Sekunden**, harte Grenze, die Aufnahme stoppt sich selbst. Ein Deckel, auf
  den man sich verlassen muss, ist keiner.
- **Mono, 32 kbit/s.** 60 Sekunden sind damit rund 240 KB.
- **Format nach Browser:** Safari kann nur `audio/mp4`, Chrome und Firefox
  liefern `audio/webm`. Beide spielt der Admin-Browser ab.
- **Unter einer halben Sekunde** gilt als Fehltipp und wird verworfen.
- **Kein Sackgassen-Dialog:** kann der Browser keine Aufnahme oder verweigert
  jemand das Mikrofon, verschwindet der Knopf kommentarlos und das Textfeld
  bleibt. Dieselbe Haltung wie in `components/willkommen/NamenSprint.tsx`:
  „getippt werden kann immer."

### Warum die Aufnahme in der Datenbank liegt

`bytea`, kein Vercel Blob, kein Supabase Storage. Der Preis dafür ist die harte
Größengrenze; der Gegenwert ist, dass **kein neuer Dienst und kein neuer
Schlüssel** dazukommt und die Aufnahmen unter demselben Auftragsverarbeitungs-
vertrag liegen wie alles andere. Bei Sprachaufnahmen von Kollegen ist das der
Punkt, an dem man nicht sparen will.

Die Aufnahme liegt in einer **eigenen Tabelle** (`RueckmeldungAudio`) statt als
Spalte neben dem Text. Sonst zöge jede Listenabfrage im Postfach ohne
ausdrückliches `select` sämtliche Aufnahmen mit — eine eigene Tabelle macht
diesen Fehler unmöglich statt nur unwahrscheinlich.

Die Größengrenze steht **zusätzlich als `CHECK` in der Datenbank**. Eine Grenze,
die nur im Code steht, fällt beim nächsten Schreibpfad um.

---

## 4. Das Postfach

`/werkstatt/rueckmeldungen`, nur für den Admin — wie der Prüfstand nebenan:
Produktarbeit gehört nicht in den Alltag eines Partners.

- Filter nach Stand, Standardblick auf alles Offene.
- Je Meldung: Stimmung, Anliegen, Name, Zeit, **die Seite, von der aus gemeldet
  wurde**, Text, Abspieler, Statusauswahl und eine interne Notiz.
- Die Liste lädt die Aufnahme **nicht** mit, nur Länge und Größe. Die Bytes holt
  der Abspieler bei Bedarf über eine eigene Route (`preload="none"`).

Die Seite ist der Unterschied zwischen „irgendwas nervt" und „die
Mannschaftsliste nervt" — und sie kostet den Absender keinen Handgriff.

**Ein Postfach, in das keiner schaut, ist schlimmer als kein Postfach:** es sieht
nach einem Versprechen aus. Deshalb geht bei jeder Meldung ein Push an den Admin
(feste Kennung `rueckmeldung`, damit der Browser ersetzt statt zu stapeln), und
die Werkstatt zeigt den Zähler offener Meldungen.

---

## 5. Löschfrist

Der tägliche Lauf (`app/api/cron/meldungen/route.ts`) löscht Aufnahmen **90 Tage
nach Abschluss** (Stand `ERLEDIGT` oder `VERWORFEN`). Text, Stand und Notiz
bleiben — die kosten nichts und sind das Gedächtnis, warum etwas so entschieden
wurde.

Das Aufräumen steht **vor** der VAPID-Prüfung: ohne Push-Schlüssel bricht der
Lauf sonst gleich ab, und die Aufnahmen lägen für immer da. Löschen ist eine
Pflicht, Melden nur eine Funktion.

`erledigtAt` hängt am Abschluss, nicht am Speichern. Ein erneutes Öffnen setzt es
zurück, sonst wäre die Frist halb um, bevor die Arbeit wieder anfängt.

---

## 6. Was bewusst fehlt

- **Transkription.** Die Spalte `transkript` steht schon, bleibt aber leer. Eine
  Umwandlung in Text bräuchte einen AV-Vertrag mit dem Anbieter und einen Satz in
  der Datenschutzerklärung — das ist eine eigene Entscheidung, kein Nebeneffekt.
  Der Platz im Schema sorgt dafür, dass es später kein Umbau ist.
- **Rückmeldung an den Absender** („dein Vorschlag ist drin"). Wäre der stärkste
  Bindungseffekt und ist eine kleine Ergänzung an `stand === ERLEDIGT` — aber
  erst, wenn das Postfach im Alltag wirklich geleert wird. Ein Versprechen, das
  einmal nicht eingelöst wird, ist schlechter als keines.
- **Screenshots, Anhänge, Antworten.** Ein Rückkanal, kein Ticketsystem. Wer sich
  unterhalten will, hat WhatsApp — dieselbe Grenze wie in `lib/nachrichten.ts`.

---

## 7. Der Schalter

Schlüssel `rueckmeldung` in `lib/features.ts`, Zeile in der `Feature`-Tabelle,
Zählstelle über `merkeNutzung`. Regel 1: kein Baustein ohne Schlüssel, Schalter
und Zählstelle. Regel 3 gilt auch hier — gespeichert je Kopf, angezeigt
ausschließlich als Summe.

Bleibt die Zahl bei null, war nicht die Hürde das Problem, sondern es gibt nichts
zu sagen. Dann fliegt der Baustein nach derselben Regel raus wie jeder andere.

---

## 8. Dateien

| Datei | Rolle |
|---|---|
| `prisma/migrations/20260826100000_rueckmeldung/` | Tabellen, Aufzählungen, Rechteentzug, `CHECK` |
| `lib/rueckmeldung.ts` | Alles Feste: Listen, Grenzen, Prüfungen, Texte |
| `components/RueckmeldungGeben.tsx` | Der Trichter, zwei Bildschirme |
| `components/Sprachaufnahme.tsx` | Halten und sprechen |
| `app/rueckmeldungAction.ts` | Der einzige Schreibweg |
| `app/(team)/werkstatt/rueckmeldungen/` | Postfach, Statuspflege, Audio-Route |
| `scripts/rueckmeldung-probe.mjs` | Probe gegen die echte Datenbank, schreibt nichts |

---

## 9. Datenschutz

Eine Sprachaufnahme ist ein personenbezogenes Datum. Sie liegt in derselben
Datenbank wie alles andere, unter demselben AV-Vertrag, und verlässt sie nicht:
keine Weitergabe an Dritte, keine Transkription außer Haus, kein externer
Speicher.

Zugriff hat ausschließlich der Admin — geprüft in der Server-Action, in der
Postfach-Seite und noch einmal in der Audio-Route. `anon` und `authenticated`
haben auf beiden Tabellen keinerlei Rechte, damit die Supabase-Data-API sie nicht
offenlegt (Muster aus `20260825210000_avv_gate`). Die Audio-Route antwortet mit
`Cache-Control: private, no-store`.

Die Löschfrist aus §5 ist Teil davon, nicht nur Hausputz.
