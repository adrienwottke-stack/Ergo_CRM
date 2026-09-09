# Audit: CaM CRM gegen das Kern-Geschäftsmodell

> **Aktualisierter Produktmaßstab vom 09.09.2026:** Die unten dokumentierte Bestandsaufnahme bleibt historisch. Für Einsteiger gehören Ziele, Wettbewerb, Zuspruch, Mindset und durchgehende Begleitung zum Kern; für Führungskräfte auch Reporting und Partnerentwicklung. Die damalige pauschale Einordnung indirekter Unterstützung als Ablenkung ist damit überholt. Maßgeblich ist die [Umsetzung der drei Geschäftssituationen](geschaeftssituationen-umsetzung.md).

Stand: 23.08.2026 — **reine Bestandsaufnahme.** Nichts gebaut, nichts gelöscht,
nichts umgebaut. Grundlage für den nächsten Schritt.

Maßstab ist die eine Schleife:

> **Namen sammeln → anrufen → Termin machen → Termin halten → daraus neue Namen +
> Abschluss/Rekrut → von vorn.**

Was diese Schleife nicht direkt beschleunigt, ist Ablenkung. Bewertet wurde hart:
im Zweifel „Unklar", nicht „Bleibt". Dass etwas schon gebaut ist, zählt hier nicht.

---

## 0. Was gemessen wurde

104 unterscheidbare Funktionen in 8 Modulgruppen, dazu 3 geplante Bausteine aus
den Plan-Dokumenten. Basis: 19.164 Zeilen Anwendungscode (`app/`, `components/`,
`lib/` ohne generierten Prisma-Code), 16 Migrationen, 22 Datenbank-Tabellen.

---

## 1. Namensliste und Durchlauf — Ebene 1

Das ist der stärkste Teil des Werkzeugs. Hier stimmt der Kern.

| # | Feature/Modul | Zustand | Ebene | Einordnung | Kurzbegründung |
|---|---|---|---|---|---|
| 1.1 | `/namen` — zwei Listen (Recruiting/Verkauf) als Reiter, serverseitig gefiltert | fertig | 1 | **Bleibt** | Der Trichter selbst. Beide Spuren an einem Kontakt, keine Doppelerfassung |
| 1.2 | Schnellerfassung Name + Nummer, optimistisch, Enter legt an | fertig | 1 | **Bleibt** | Schnellste vorhandene Erfassung. Fehlt: die geführte Erinnerungshilfe (§10.1) |
| 1.3 | A/B/C-Einstufung, ein Tipp zykelt – → A → B → C → – | fertig | 1 | **Bleibt** | Nähe statt Erfolgsaussicht — genau die Sortierung, die den Durchlauf trägt |
| 1.4 | Fortschrittsbalken „x von 20 Namen" | fertig | 1 | **Bleibt** | Macht das Ziel sichtbar, ohne zu sperren |
| 1.5 | Filterleiste nach A/B/C mit Zählern | fertig | 1 | **Unklar** | Ein Entscheidungspunkt, den der Nutzer nicht treffen sollte. Das System soll priorisieren |
| 1.6 | Abschnitte Offen / Geschafft / Raus, eingeklappt | fertig | 1 | **Bleibt** | Arbeitsliste bleibt kurz, Erfolg bleibt sichtbar |
| 1.7 | Von der Liste nehmen (Kontakt bleibt erhalten) | fertig | 1 | **Bleibt** | Notwendiges Gegenstück zum schnellen Sammeln |
| 1.8 | Ein Name auf beiden Listen (`listKinds[]`) | fertig | 1 | **Bleibt** | Explizite Forderung des Kernmodells |
| 1.9 | `/namen/anrufen` — Durchlauf, ein Name je Karte, eingefrorene Warteschlange | fertig | 1 | **Bleibt** | Das Herzstück. „Anrufen, Ergebnis, anrufen" ohne Formular |
| 1.10 | `tel:`-Link, Nummer kopieren, Rückkehr-Erkennung nach dem Telefonat | fertig | 1 | **Bleibt** | Die Ergebnisfrage steht da, wenn man zurückkommt. Genau die Sorte Mitdenken, die gemeint ist |
| 1.11 | Vier Ergebnis-Knöpfe (Termin / Nicht erreicht / Später / Kein Interesse) + Folgedialoge | fertig | 1 | **Bleibt** | Erfassung in zwei Tipps, nächster Schritt wird automatisch gesetzt |
| 1.12 | Überspringen, optionale Notiz | fertig | 1 | **Bleibt** | Kein Freitextzwang |
| 1.13 | Durchlauf-Bilanz am Ende | fertig | 1 | **Bleibt** | Belohnung am Ende der Arbeit, nicht in einem Report |
| 1.14 | Gesprächsleitfaden aufklappbar im Durchlauf + Panel auf `/namen` | fertig | 2 | **Bleibt** | Wörtlich gefordert: Leitfaden im Ablauf, nicht als PDF |
| 1.15 | Leitfaden je Berater überschreibbar (`Guide`-Tabelle, Editor, Zurücksetzen) | fertig | 2 | **Unklar** | Der Standardtext ist der Wert. Ein Editor ist Pflegearbeit für den Nutzer — und die Leitfäden sind heute noch Gerüste mit Platzhaltern |

**Gruppe: 13 Bleibt · 2 Unklar · 0 Raus**

---

## 2. Heute und erste Woche — Ebene 1/2

| # | Feature/Modul | Zustand | Ebene | Einordnung | Kurzbegründung |
|---|---|---|---|---|---|
| 2.1 | `/heute` — Überfällig / Heute / Diese Woche, nach Frist sortiert | fertig | 1 | **Bleibt** | „Beim Öffnen steht da, was heute zu tun ist" — die Startseite leitet hierher |
| 2.2 | Gruppe „Ohne nächsten Schritt" | fertig | 1 | **Bleibt** | Fängt genau die Namen, die sonst durchs Raster fallen |
| 2.3 | `QuickRowActions` — Ein-Tipp-Aktionen direkt in der Zeile | fertig | 1 | **Bleibt** | Erfassung ohne Seitenwechsel |
| 2.4 | Vorgeschichte in der Zeile (letzte Aktivität + Notiz) | fertig | 1 | **Bleibt** | „Pro Name sichtbar: letzter Kontakt, was dabei rauskam" |
| 2.5 | `/focus` — zweiter Durchlauf über die Heute-Liste (`FocusDialer`, 386 Zeilen) | fertig | 1 | **Raus** | Zweite Umsetzung derselben Idee wie 1.9, mit eigener Logik und eigenen Dialogen. Zwei Dialer sind einer zu viel |
| 2.6 | Starterpass: 5 Missionen in den ersten 7 Tagen | fertig | 2 | **Bleibt** | Geführter Start über Tag 1 hinaus |
| 2.7 | Der Brief an sich selbst kommt zurück (14 Tage dabei, eine Woche Stille) | fertig | 2 | **Bleibt** | Greift genau im Abbruchmoment. Billig gebaut, hoher Hebel |
| 2.8 | Wiedereinstieg nach zwei Wochen Stille | fertig | 2 | **Bleibt** | Hält die Schleife am Laufen, statt sie auslaufen zu lassen |
| 2.9 | 30-Tage-Versprechen mit Countdown und Abrechnung | fertig | 2 | **Bleibt** | Selbst gesetztes Terminziel, sichtbarer Fortschritt |

**Gruppe: 8 Bleibt · 0 Unklar · 1 Raus**

---

## 3. Pipeline, Vorgänge, Kontakte — der CRM-Kern

Hier sitzt die Masse dessen, was rausfällt. Das ist das klassische Vollwert-CRM,
das um die Schleife herumgewachsen ist.

| # | Feature/Modul | Zustand | Ebene | Einordnung | Kurzbegründung |
|---|---|---|---|---|---|
| 3.1 | Acht Kontaktphasen (`NEU` … `BESTAND`) | fertig | 1 (teilweise) | **Unklar** | Das Kernmodell verlangt fünf: Name → kontaktiert → Termin vereinbart → Termin gehalten → Ergebnis. Die Akquisephasen bleiben, `KUNDE`/`EMPFEHLUNG_ERFRAGT`/`CHECKUP_GEPLANT`/`BESTAND` sind Bestandsbetreuung |
| 3.2 | Playbook: nächster Schritt + Frist beim Phasenwechsel vorbelegt | fertig | 1 | **Bleibt** | „Das System denkt mit." Der wichtigste Mechanismus nach dem Durchlauf |
| 3.3 | Bestätigungspflicht des nächsten Schritts | fertig | 1 | **Bleibt** | Verhindert Kontakte ohne Anschluss |
| 3.4 | `/pipeline` — Kanban-Board, Drag & Drop, drei Ansichten, Verlorene ein/aus | fertig | 1 | **Raus** | Ein Board ist eine Liste, aus der der Nutzer wählen muss. Das Kernmodell will das Gegenteil: das System sagt, wer dran ist. `/heute` macht das bereits |
| 3.5 | Empfehlungen erfassen → neue Kontakte fallen in den Trichter, mit Erstanruf-Frist | fertig | 1 | **Bleibt** | Der Motor. Technisch sauber gelöst (`referredById`, Zähler, Stage-Event) — aber am falschen Punkt verankert (§10.2) |
| 3.6 | Empfehlungsbaum am Kontakt (wer hat wen empfohlen) | fertig | 1 | **Bleibt** | Macht den Motor sichtbar |
| 3.7 | Checkup-Terminierung, 6-Monats-Zyklus, `BESTAND` | fertig | keine | **Raus** | Bestandsbetreuung. Ein Partner in Stufe 1 hat keinen Bestand |
| 3.8 | `/vorgaenge` — Vorgangs-Board mit Kennzahlkacheln | fertig | keine | **Raus** | Zweite Pipeline neben der ersten. Klassisches Deal-Management |
| 3.9 | Vorgangsphasen `BEDARF → ANGEBOT → ANTRAG → GEWONNEN` + eigenes Playbook | fertig | keine | **Raus** | Das Kernmodell kennt ein Ergebnis, keinen zweiten Trichter |
| 3.10 | Sparten PAV / BU je Vorgang | fertig | keine | **Raus** | Produktverwaltung, nicht Schleife |
| 3.11 | Einheiten-Rechnung (100 € = 82 Einheiten, `unitFactorPermille`, manuelle Übersteuerung), Euro-Summen | fertig | keine | **Raus** | Umsatzbewertung ist Reporting. Für „Abschluss ja/nein" braucht es das nicht |
| 3.12 | `/contacts` — Kontaktliste, Phasenfilter, Tabelle, Initialen-Avatare | fertig | keine | **Raus** | Genau die generische Kontaktdatenbank, die als Anti-Ziel benannt ist |
| 3.13 | `/contacts/[id]` — Kontaktprofil mit Aktivitäts-Zeitstrahl, Vorgängen, Empfehlungen (510 Zeilen) | fertig | 1 (Teil) | **Unklar** | „Letzter Kontakt, was kam raus, nächster Schritt" wird gebraucht. Die anderen vier Fünftel der Seite nicht |
| 3.14 | `/contacts/new` und `/contacts/[id]/edit` — Formulare mit neun Feldern | fertig | keine | **Unklar** | Erfassung soll über die Namensliste laufen. Ein reduziertes Formular (Name, Nummer, Notiz) bleibt denkbar |
| 3.15 | `/contacts/import` — CSV-Massenimport mit Vorschau | fertig | keine | **Raus** | Explizites Anti-Ziel. Widerspricht außerdem dem Sinn des Sammelns: Namen aus dem Kopf holen, nicht aus einer Datei |
| 3.16 | Kontakt löschen (mit Bestätigungsdialog) | fertig | keine | **Unklar** | „Von der Liste nehmen" (1.7) deckt den Alltagsfall ab. Löschen ist Datenschutz-Restfunktion |
| 3.17 | Aktivitäten manuell anlegen/löschen (CALL / MEETING / EMAIL + Freitext) | fertig | keine | **Raus** | Freitext-Protokollierung. Die vier Ergebnis-Knöpfe erledigen das in zwei Tipps |
| 3.18 | `NoteTemplates` — fünf Notiz-Bausteine | fertig | keine | **Raus** | Pflaster auf dem Freitextzwang, der wegfällt |
| 3.19 | Beruf-Feld mit Bausteinleiste (`JOB_BLOCKS`) | fertig | keine | **Unklar** | Nettes Detail, zahlt auf keine Stufe der Schleife ein |
| 3.20 | Acht Verlustgründe + Kontakt wiedereröffnen | fertig | 1 | **Unklar** | „Kein Interesse / Wiedervorlage" reicht dem Kernmodell. Acht Gründe sind Auswertungsdenken |
| 3.21 | `CommandPalette` (Strg+K Kontaktsuche) | fertig | keine | **Raus** | Schreibtisch-Funktion in einer Mobile-first-App. Bei 40 Namen sucht niemand |
| 3.22 | Rückgängig-Leiste (`UndoBar`, `withUndo`, `UndoEntry`) | fertig | 1 | **Bleibt** | Voraussetzung dafür, dass Ein-Tipp-Aktionen überhaupt erlaubt sind |
| 3.23 | `formToken` — Dublettenschutz beim Anlegen | fertig | 1 | **Bleibt** | Stille Qualitätssicherung, kostet den Nutzer nichts |
| 3.24 | `StageEvent` — Phasenhistorie | fertig | 1/3 | **Bleibt** | Datengrundlage für die vier harten Kennzahlen |

**Gruppe: 6 Bleibt · 6 Unklar · 12 Raus**

---

## 4. Zahlen und Berichte

| # | Feature/Modul | Zustand | Ebene | Einordnung | Kurzbegründung |
|---|---|---|---|---|---|
| 4.1 | `/dashboard` — Kennzahlkacheln, Phasenverteilung, fällige Schritte | fertig | 1 | **Raus** | Zeigt dasselbe wie `/heute` und `/trichter`, nur ohne Handlungsmöglichkeit |
| 4.2 | `DailyTargetCard` — Tagesziel 10/15/20 | fertig | 1 | **Raus** | Das Ziel lebt nur im Browser-Zustand, wird nirgends gespeichert und nirgends nachgehalten. Eine Kachel, die nichts weiß |
| 4.3 | `SparkBars` — Aktivitäten über acht Wochen | fertig | keine | **Raus** | Verlaufsgrafik ohne Handlung dahinter |
| 4.4 | `/trichter` — Trichter über acht Phasen, Übergangsquoten, Durchlaufzeiten, Verlustgründe, Vorgangstrichter | fertig | 1/3 | **Unklar** | Die Frage „woran hakt es" ist richtig. Die Antwort braucht vier Zahlen (Anrufe → Termine → gehalten → Abschlüsse), nicht acht Phasen mit Durchlaufzeiten |
| 4.5 | `/trichter` Team-Ansicht für Admins | fertig | 3 | **Raus** | Doppelt zu `/mannschaft`, das dieselbe Frage handlungsnäher beantwortet |
| 4.6 | `/report` — Tätigkeitsbericht, aggregiert, Druckansicht (420 Zeilen) | fertig | keine | **Raus** | Komplexes Reporting für Vorgesetzte. Kein Bezug zur Schleife |
| 4.7 | Getrennter Berichts-Zugang per `REPORT_PASSWORD` (eigenes Layout, eigene Middleware-Regel) | fertig | keine | **Raus** | Eigene Zugangsart für eine Seite, die selbst raus soll |

**Gruppe: 0 Bleibt · 1 Unklar · 6 Raus**

---

## 5. Wettbewerb / Arena — Ebene 3

Der Wettbewerbsgedanke ist gefordert und gut umgesetzt. Der Aufbau ist aber
breiter als der Zweck: sieben Bausteine für aktuell eine Handvoll Köpfe.

| # | Feature/Modul | Zustand | Ebene | Einordnung | Kurzbegründung |
|---|---|---|---|---|---|
| 5.1 | `/leaderboard` — Podium, Tabelle, Heute/Woche/Monat, Serien-Flamme | fertig | 3 | **Bleibt** | Wörtlich gefordertes Leaderboard, sichtbar für alle |
| 5.2 | Punktegewichtung (Abschluss ×5, Rest ×1) | fertig | 3 | **Bleibt** | Lenkt auf das, was zählt |
| 5.3 | Automatische Zählung aus dem CRM (Anruf, Termin vereinbart, gehalten, Abschluss) | fertig | 3 | **Bleibt** | Wettbewerb ohne Zusatzarbeit — die Bedingung dafür, dass er überlebt |
| 5.4 | Herkunftsanzeige „x % aus dem CRM" | fertig | 3 | **Bleibt** | Macht frisierte Zahlen sichtbar, ohne jemanden anzuklagen |
| 5.5 | Arena: Puls („heute schon dran: 4 von 7", zuletzt aktive Köpfe) | fertig | 3 | **Bleibt** | Sozialer Vergleich in Echtzeit, exakt der geforderte Effekt |
| 5.6 | Arena: Zweikampf (Platz davor/dahinter, Abstand in Handlungen) | fertig | 3 | **Bleibt** | Übersetzt die Rangliste in „was mache ich jetzt damit" |
| 5.7 | Arena: Kommentator (generierte Lage-Sprüche) | fertig | 3 | **Unklar** | Stimmung, kein Antrieb. Wird nach der dritten Woche zur Tapete |
| 5.8 | Arena: Bestmarke (persönlicher Rekord) | fertig | 3 | **Unklar** | Kleiner Zusatzreiz, eigener Ladepfad |
| 5.9 | Arena: Duelle (fordern, 24 h annehmen, Abpfiff, Bilanz, `Duel`-Tabelle mit fünf Zuständen) | fertig | 3 | **Unklar** | Der teuerste Wettbewerbsbaustein. Braucht Gegner, die es bei einstelliger Kopfzahl kaum gibt |
| 5.10 | Arena: gemeinsamer Sprint (25 Minuten, `Sprint` + `SprintTeilnahme`) | fertig | 3 | **Unklar** | Funktioniert ab zwei Köpfen und ist echtes Gemeinschaftsgefühl — aber zwei Tabellen für ein Ereignis |
| 5.11 | `ArenaTakt` — automatische Aktualisierung (10/30 s) | fertig | 3 | **Bleibt** | Ohne das fühlt sich nichts live an |
| 5.12 | `/log` — manuelles Nachloggen, drei Schnellzähler, Serie | fertig | 3 | **Unklar** | Zweiter Erfassungsweg neben dem Durchlauf. Lädt zum Frisieren ein und ist Doppelarbeit — aber nötig für Termine außerhalb des Werkzeugs |
| 5.13 | Fairness: Tageskappen je Art + Zwei-Tage-Nachtragsfenster | fertig | 3 | **Bleibt** | Notwendige Gegenmaßnahme, solange 5.12 existiert |
| 5.14 | `/werkstatt` — Abstimmung über Bausteine (stark/geht so/weg damit), Wunschzettel mit drei Stimmen, Friedhof | fertig | keine | **Raus** | Produktverwaltung im Produkt. Kostet den Partner Aufmerksamkeit und bringt ihm keinen Termin |
| 5.15 | Feature-Schalter + Nutzungsmessung (`Feature`, `FeatureUse`, `lib/features.ts`) | fertig | keine | **Unklar** | Entwicklerwerkzeug, für den Nutzer unsichtbar und billig. Sinnvoll vor allem, solange es die Werkstatt gibt |

**Gruppe: 8 Bleibt · 6 Unklar · 1 Raus**

> **Nachtrag 25.08.2026 zu 5.14.** Es gibt seit heute wieder einen Weg, Kritik
> loszuwerden: das Megafon in der Kopfzeile
> (`docs/rueckmeldung-plan.md`). Das Urteil oben bleibt davon unberührt und
> gilt weiter — was hier raus ist, kommt nicht zurück. Der Unterschied ist die
> Richtung: 5.14 war ein **öffentliches Gremium** (Liste, Stimmen, Friedhof) und
> kostete jeden Partner Aufmerksamkeit; das Megafon ist ein **privater Rückkanal
> an eine Person** und kostet nur den etwas, der von sich aus etwas sagen will.
> Keine Abstimmung, keine öffentliche Liste, keine Roadmap im Produkt. Für
> Abschaltungen gilt unverändert 5.15: Nutzung schlägt Meinung.

---

## 6. Struktur und Führung — Ebene 3

Der zweitstärkste Teil. Die Frühwarnung ist konzeptionell genau richtig.

| # | Feature/Modul | Zustand | Ebene | Einordnung | Kurzbegründung |
|---|---|---|---|---|---|
| 6.1 | `/mannschaft` — je Partner: Aktivität, Termine, Abschlüsse, Trichterstand | fertig | 3 | **Bleibt** | Genau die geforderte Aktivitätsübersicht: wer bewegt sich, wer steckt fest |
| 6.2 | Frühwarn-Signale + Ampel (sieben Regeln, u. a. Stille ≥ 5 Tage, leere Pipeline, Termine platzen, acht Wochen ohne Abschluss) | fertig | 3 | **Bleibt** | Der Kern von Ebene 3. Jedes Signal nennt den nächsten Schritt, nicht nur die Zahl. Fehlt: der Weg nach draußen (§10.4) |
| 6.3 | Struktur-Baum (`path`, `leaderId`, Werbung getrennt geführt, Ebenen) | fertig | 3 | **Bleibt** | Fundament für „meine Leute" ohne rekursive Abfragen |
| 6.4 | Sichtbarkeitsstufen `ZAHLEN` / `PIPELINE` | fertig | 3 | **Unklar** | Zwei Stufen sind gerade noch „das Nötigste". Jede weitere wäre Rechtematrix |
| 6.5 | `/einladen` — Links, QR-Code, Mehrfach-Codes, persönliche Begrüßung, Einsatz („Essen geht auf mich") | fertig | 2/3 | **Bleibt** | Der Weg, auf dem Ebene 2 überhaupt entsteht. Die persönliche Zeile im ersten Chat ist der stärkste Einzelbaustein des Onboardings |
| 6.6 | `/einladung/[code]` — Selbstregistrierung, eigenes OG-Bild, eigenes Manifest | fertig | 2 | **Bleibt** | Kein Startpasswort per WhatsApp, kein Admin-Nadelöhr |
| 6.7 | Installations-Schleuse (Android / iPhone / In-App-Browser) + Notausgang je Einladung | fertig | 2 | **Bleibt** | Ohne App auf dem Startbildschirm gibt es keine Gewohnheit. Mobile-first ernst genommen |
| 6.8 | `InstallationMelder` (`installedAt`, einmalig) | fertig | 2/3 | **Bleibt** | Die einzige harte Schwelle „wirklich angekommen", auch für die Mannschaftssicht |
| 6.9 | `/start` — Startweiche der installierten App | fertig | 2 | **Bleibt** | Verhindert, dass frisch Eingeladene vor einem Anmeldefenster stranden |
| 6.10 | `/team` — Admin: Konten anlegen, Berater umhängen, Einladungen verwalten | fertig | 3 | **Unklar** | Umhängen wird selten gebraucht, Kontoanlage per Admin ist neben 6.5 überflüssig |
| 6.11 | Rollen `ADMIN` / `MEMBER` | fertig | keine | **Unklar** | Minimum, das nötig ist — hängt aber heute an Seiten (`/team`, `/report`), die selbst raus sollen |
| 6.12 | `beginnerMode` — Navigation von zehn auf drei Punkte ausdünnen | fertig | 2 | **Unklar** | Pflaster auf zu vielen Bildschirmen. Nach dem Rückbau überflüssig — und das ist die eigentliche Antwort |

**Gruppe: 8 Bleibt · 4 Unklar · 0 Raus**

---

## 7. Willkommen / Onboarding — Ebene 2

| # | Feature/Modul | Zustand | Ebene | Einordnung | Kurzbegründung |
|---|---|---|---|---|---|
| 7.1 | `/willkommen` — Regie über neun Akte, Fortschrittsbalken, Überspringen | fertig | 2 | **Bleibt** | „Geführter Start" statt Dashboard. Genau die geforderte Form |
| 7.2 | Akt Chat: persönliche Begrüßung des Einladenden, Weiche Verkauf/Recruiting | fertig | 2 | **Bleibt** | Setzt die Spur für Liste, Leitfaden und Einwände |
| 7.3 | Akt Hochrechnung (Namen × Anrufe → Gespräche, Termine, Abschlüsse) | fertig | 2 | **Bleibt** | Erklärt das Geschäftsmodell in Zahlen, nicht in Text |
| 7.4 | Akt Einwand-Test (drei Einwände je Spur, mit Begründung) | fertig | 2 | **Bleibt** | Nimmt die eigentliche Angst an Tag 1: den ersten Anruf |
| 7.5 | Akt Brief an sich selbst (`whyLetter`) | fertig | 2 | **Bleibt** | Zahlt auf 2.7 ein — den Moment, in dem jemand aufhören will |
| 7.6 | Akt Namens-Sprint: 60 Sekunden, Spracheingabe, Einfügen mehrerer Namen, gleicher Schreibpfad wie die Liste | fertig | 1/2 | **Bleibt** | Macht aus der lästigsten Pflicht den besten Moment. Bester Baustein des Onboardings |
| 7.7 | Akt Einstufung (A/B/C für die frischen Namen) | fertig | 1/2 | **Bleibt** | Trennt Sammeln und Sortieren — richtig herum |
| 7.8 | Akt Foto (`photoDataUrl`) | fertig | 3 | **Raus** | Wird gespeichert und **nirgends angezeigt**. Ein Akt, der nichts bewirkt |
| 7.9 | Akt Ranglisten-Moment (erster Blick auf die Tabelle) | fertig | 3 | **Bleibt** | Verbindet Tag 1 mit Ebene 3 |
| 7.10 | Akt Ankunft: der erste Tag wird konkret geplant | fertig | 2 | **Bleibt** | Der Übergang vom Onboarding in die Schleife |
| 7.11 | Führungskraft-Zweig (eigener kurzer Ablauf, drei Karten, direkt zum Einladen) | fertig | 3 | **Bleibt** | Ebene 3 hat ein eigenes Erstverständnis-Problem |
| 7.12 | Sozialbeweis („Lisa ist seit 9 Tagen dabei und hat 4 Termine") aus echten Zahlen | fertig | 2 | **Bleibt** | Echte Zahlen statt Behauptung, fällt weg wenn es niemanden gibt |
| 7.13 | `onboardingSteps` — Messstempel je Akt | fertig | keine | **Unklar** | Instrumentierung, kein Nutzerwert. Nützlich für dich, solange am Ablauf geschraubt wird |

**Gruppe: 11 Bleibt · 1 Unklar · 1 Raus**

---

## 8. Fundament und Sonstiges

| # | Feature/Modul | Zustand | Ebene | Einordnung | Kurzbegründung |
|---|---|---|---|---|---|
| 8.1 | Anmeldung, signierte Sitzungen, einmaliges Admin-Bootstrap | fertig | keine | **Bleibt** | Ohne Zugang kein Werkzeug |
| 8.2 | `lib/scope.ts` — zentrale Zugriffsgrenze (eigene / Struktur / alle) | fertig | keine | **Bleibt** | Eine Stelle für „wer sieht was". Muss bleiben, egal wie der Rest schrumpft |
| 8.3 | Middleware mit Ausnahmeliste (Einladung, Installation, Symbole) | fertig | keine | **Bleibt** | Voraussetzung dafür, dass die Schleuse überhaupt funktioniert |
| 8.4 | PWA: Manifest, Service Worker, `/offline` | fertig | 2 | **Bleibt** | Mobile-first heißt: auf dem Startbildschirm, auch im Funkloch |
| 8.5 | Ladeskelette (`PageSkeleton`) | fertig | keine | **Bleibt** | Gefühlte Geschwindigkeit, kostet nichts |
| 8.6 | `/storno` — Swipe-Spiel (1.835 Zeilen HTML + Route) | fertig | keine | **Raus** | Ein anderes Produkt, das im selben Repo mitfährt. Gehört ausgelagert |
| 8.7 | `components/UserMenu.tsx` (105 Zeilen) | fertig, **ungenutzt** | keine | **Raus** | Wird nirgends importiert. Toter Code |
| 8.8 | `User.careerLevel` | fertig, **ungenutzt** | keine | **Raus** | Wird nie gelesen und nie geschrieben. Totes Feld |
| 8.9 | `scripts/nullmessung.mjs`, `scripts/arena-check.mjs` | fertig | keine | **Unklar** | Werkzeuge für dich, nicht für den Partner. Harmlos, aber Pflegelast |

**Gruppe: 5 Bleibt · 1 Unklar · 3 Raus**

---

## 9. Geplant, nicht gebaut

Nicht in die Prozentrechnung eingerechnet — es steht noch kein Code dahinter.

| Feature/Modul | Zustand | Ebene | Einordnung | Kurzbegründung |
|---|---|---|---|---|
| KI-Assistent: Diktat → vorausgefüllte CRM-Einträge (`docs/assistent-plan.md`) | Plan | 1 | **Unklar** | Zielt auf „nimmt Arbeit ab". Aber die vier Ergebnis-Knöpfe sind bereits zwei Tipps — der Assistent würde die routinierten 80 % nicht mehr verbessern |
| Aufbau-Trichter: `Kandidatur`, Recruiting-Phasen, „Zusage erzeugt die Einladung", 90-Tage-Ampel (`docs/recruiting-plan.md`) | Plan | 2/3 | **Bleibt** | Schließt die größte Modell-Lücke: Recruiting-Namen enden heute fachlich falsch auf `KUNDE`. Abschnitt 1 des Plans führt vom Namen zur verschickten Einladung — das ist Kernmodell |
| Kalender-Anbindung | in `docs/struktur-plan.md` **ausgeschlossen** („TimeTree lässt sich nicht anbinden") | 2 | **Bleibt** (als Anforderung) | Das Kernmodell verlangt Kalender im Tool. Die Ausschluss-Entscheidung stammt aus einem anderen Rahmen und ist neu zu treffen (§10.3) |

---

## 10. Lückenanalyse — was aus Teil A komplett fehlt

### 10.1 Geführte Namenssammlung — **fehlt**

Die Namensliste bietet ein leeres Feld „Name" und ein leeres Feld „Nummer".
Der 60-Sekunden-Sprint im Willkommen ist die einzige Hilfe — und auch er ist
ein leeres Feld mit Countdown. **Es gibt an keiner Stelle Gedächtnisstützen**
(Familie, Arbeit, Verein, Sport, Schule, Nachbarn, Handwerker, Ex-Kollegen,
Handy-Kontakte). Suche über den gesamten Code: keine Treffer außer den
A/B/C-Erklärtexten („Familie, beste Freunde" beschreibt dort die Stufe, es ist
keine Abfrage).

Das ist die größte Lücke des Werkzeugs, weil sie an der ersten Hürde sitzt:
Wer nach sechs Namen leer läuft, dreht die Schleife nie an.

### 10.2 Empfehlungs-Loop — **halb da, falsch verankert**

Der Mechanismus existiert und ist gut (3.5/3.6): Namen fallen mit Erstanruf-Frist
in den Trichter, der Wettbewerbszähler springt mit. Aber er hängt an der Phase
`KUNDE` — also **erst nach einem Abschluss**. Das Kernmodell verlangt ihn nach
**jedem gehaltenen Termin**. Wer zehn Termine hält und einen abschließt, wird
heute neunmal nicht gefragt.

Ebenso fehlt der Zwangspunkt: Nach „Termin gehalten" steht die Empfehlungsfrage
nur als Playbook-Vorschlag drei Tage später auf der Liste — sie ist damit
umgehbar, statt fest im Ablauf verankert.

### 10.3 Kalender — **fehlt vollständig**

Termine leben als `appointmentAt` am Kontakt. Es gibt **keine Kalenderansicht,
keinen ICS-Export, keine Google-/Outlook-Anbindung, keine Terminerinnerung.**
Wer wissen will, was morgen ansteht, sieht eine Liste nach Fristen — keinen Tag.
`docs/struktur-plan.md` hat die Anbindung ausdrücklich verworfen; gegen das
Kernmodell ist diese Entscheidung neu zu prüfen.

### 10.4 Push-Benachrichtigungen — **fehlen vollständig**

Der Service Worker existiert, kann aber nur offline ausliefern. Kein
`Notification`, kein `PushManager`, kein Web-Push, keine Subscriptions, kein
Cron. Alles Erinnernde im Werkzeug ist **Holschuld**: die Frühwarn-Ampel, der
Puls, das 30-Tage-Versprechen, der Wiedereinstieg nach Stille — alles wird erst
sichtbar, wenn jemand die Seite öffnet. Genau die Leute, die ein Signal
auslösen, öffnen sie nicht.

Damit fehlen alle drei geforderten Push-Fälle: Erinnerung an Aktivität, Feier
von Erfolgen, sozialer Vergleich.

### 10.5 Frühwarnung für Führungskräfte — **berechnet, aber passiv**

Die sieben Signale (6.2) sind fachlich stark. Sie sind aber bewusst als
Berechnung beim Seitenaufruf gebaut („Signale werden BERECHNET, nicht
gespeichert"). Das Kernmodell verlangt **aktive Meldung** — „die Führungskraft
soll nicht suchen müssen". Ohne 10.4 bleibt die Ampel eine Seite, die man
aufrufen muss.

### 10.6 Peer-Kommunikation — **fehlt vollständig**

Keine Nachrichten, keine Kommentare, keine Reaktionen, keine entsprechende
Tabelle. Partner sehen einander ausschließlich als Zeile mit Zahl. Der einzige
Berührungspunkt ist das Duell (5.9) — eine Herausforderung ohne ein Wort dabei.
„Das Team soll sich im Tool spüren" ist heute nicht eingelöst.

### 10.7 Sponsor bei Begleitterminen — **fehlt**

Die Führungskraft sieht Zahlen und Signale, kann aber **keinen Begleittermin
anlegen, zusagen oder nachhalten**. Es gibt keine gemeinsame Aktivität zwischen
zwei Konten.

### 10.8 Gesprächsleitfaden — **da, aber unfertig**

Vorhanden und richtig platziert (1.14). Aber: die Standardtexte sind
ausdrücklich Gerüste mit Platzhaltern in eckigen Klammern, und der
Recruiting-Leitfaden ist als Entwurf markiert. Einwandbehandlung existiert nur
im Willkommen-Test (7.4), **nicht am Kontakt während des Gesprächs**.

### 10.9 Priorisierung statt Liste — **nur halb**

`/heute` sortiert nach Frist und sagt damit tatsächlich, wer dran ist — gut.
Der Namens-Durchlauf sortiert nach Nähe — gut. Aber daneben stehen vier weitere
Listen (`/pipeline`, `/contacts`, `/vorgaenge`, `/trichter`), aus denen der
Nutzer selbst wählen muss. Das Versprechen „keine Entscheidung beim Öffnen"
wird von der Navigation wieder eingerissen.

### 10.10 Recruiting als eigener Trichter — **fehlt**

Recruiting-Namen laufen durch dieselben Phasen wie Kunden und enden auf `KUNDE`.
Es gibt keine Kandidatur, keinen Aufbau-Schritt, keine Kennzahl für Aufbau, und
der Übergang „Zusage → Einladung verschickt" ist ein Seitenwechsel. Ebene 2
beginnt heute erst, wenn jemand bereits eingeladen wurde — davor ist der Weg
nicht abgebildet. (`docs/recruiting-plan.md` beschreibt genau das, ungebaut.)

---

## 11. Abschluss

### 11.1 Wie viel fällt raus

| Einordnung | Anzahl | Anteil |
|---|---|---|
| **Bleibt** | 59 | **57 %** |
| **Unklar** | 21 | **20 %** |
| **Raus** | 24 | **23 %** |
| Summe | 104 | 100 % |

Nach Codegewicht statt nach Anzahl fällt mehr weg, weil die Raus-Kandidaten die
großen Bildschirme sind: die eindeutig zu streichenden Module umfassen
**rund 3.700 der 19.164 Zeilen Anwendungscode (≈ 19 %)** plus 1.835 Zeilen
`storno.html`.

Die Unklar-Fälle sind fast alle vom Typ „reduzierte Fassung behalten, 80 %
streichen" (`/trichter`, `/contacts/[id]`, `/log`, Verlustgründe) oder „hängt an
etwas, das selbst raus soll" (Feature-Schalter, Rollen, `beginnerMode`).
**Wenn diese Fälle so entschieden werden, landet der Rückbau bei 35–45 % der
Funktionen und über der Hälfte der Bildschirme.**

### 11.2 Module, die komplett gestrichen werden können

| Modul | Umfang | Warum vollständig |
|---|---|---|
| **Vorgänge / Deals** (`/vorgaenge`, `Deal`, `DealStage`, `DealLine`, Einheiten, Euro) | ~760 Zeilen + 1 Tabelle + 3 Aufzählungstypen | Zweite Pipeline. Das Kernmodell kennt genau ein Ergebnis je Name |
| **Bericht** (`/report`, Berichts-Layout, Berichts-Passwort, `PrintButton`) | ~470 Zeilen + eigene Zugangsart | Komplexes Reporting, ausdrückliches Anti-Ziel |
| **Dashboard** (`/dashboard`, `SparkBars`, `DailyTargetCard`) | ~430 Zeilen | Zeigt, was `/heute` schon zeigt — ohne Handlung |
| **Kontaktverwaltung** (`/contacts`-Liste, CSV-Import, Notiz-Bausteine, Command-Palette) | ~640 Zeilen | Generische Kontaktdatenbank + Massen-Import: zwei benannte Anti-Ziele |
| **Fokus-Modus** (`/focus`, `FocusDialer`) | ~390 Zeilen | Zweite Umsetzung des Durchlaufs |
| **Pipeline-Board** (`/pipeline`, `PipelineBoard`) | ~350 Zeilen | Der Nutzer soll nicht wählen, das System soll priorisieren |
| **Werkstatt** (`/werkstatt`, `Wunsch`, `WunschVote`, `FeatureVote`, `Taugt`) | ~400 Zeilen + 3 Tabellen | Produktverwaltung im Produkt |
| **Storno-Spiel** (`/storno`, `public/storno.html`) | ~1.850 Zeilen | Fremdes Produkt im Repo |
| **Betreuungs-Kreislauf** (Checkup, `BESTAND`, `checkupDueAt`, Sechs-Monats-Logik) | über mehrere Dateien verteilt | Bestandsgeschäft. Ein Partner in Stufe 1 hat keinen Bestand |

Dazu ersatzlos: `UserMenu.tsx`, `User.careerLevel`, Akt Foto / `photoDataUrl` —
alles gebaut und nirgends verwendet.

### 11.3 Ist die Architektur die richtige Basis? — Ja. Umbau, kein Neubau.

**Dafür spricht:**

1. **Das Datenmodell trägt das Kernmodell bereits.** Ein `Contact` mit
   `listKinds[]`, `rating`, `stage`, `nextStepType/At` und `referredById` ist
   genau der Name im Trichter mit beiden Spuren, Priorität, nächstem Schritt und
   Empfehlungsherkunft. Die Entscheidung „Namensliste ist dieselbe Tabelle, nur
   eine schlanke Sicht" war richtig und ist nicht zu verbessern.
2. **Die drei Ebenen existieren bereits im Fundament.** Struktur-Baum mit
   materialisiertem Pfad, zentrale Zugriffsgrenze in einer Datei, Einladungen mit
   Selbstregistrierung, `DailyLog` mit automatischer Zählung aus dem CRM. Das
   sind mehrere Wochen Arbeit, die ein Neubau eins zu eins wiederholen müsste.
3. **Die stärksten Teile sind genau die geforderten.** Durchlauf,
   Ergebnis-Knöpfe, Playbook, Willkommens-Ablauf, Frühwarn-Signale — vier von
   fünf Kernforderungen sind gebaut und nicht besser zu treffen.
4. **Der Rückbau ist überwiegend Löschen, nicht Umschreiben.** Die
   Raus-Kandidaten sind eigene Routen und eigene Komponenten. `/vorgaenge`,
   `/report`, `/dashboard`, `/focus`, `/werkstatt` lassen sich entfernen, ohne
   dass etwas anderes bricht. Nur zwei Eingriffe gehen tiefer: die Deal-Bezüge
   aus `app/(app)/pipeline/actions.ts` und `app/(app)/heute/page.tsx` herauslösen,
   und die Phasenliste von acht auf fünf kürzen.

**Was ein Neubau nicht lösen würde:** Alle sieben echten Lücken (§10.1–10.7) sind
**Zubauten, keine Umbauten**. Geführte Namenssammlung, Empfehlungsfrage nach
jedem Termin, Kalender, Push, Peer-Nachrichten, Begleittermine — jedes davon ist
auf der bestehenden Architektur genauso viel Arbeit wie auf einer neuen. Ein
Neubau würde die Lückenarbeit also nicht verkürzen, aber das funktionierende
Fundament noch einmal kosten.

**Die einzige offene Architekturfrage** ist die aus `docs/recruiting-plan.md` §6:
Recruiting-Namen laufen durch Verkaufsphasen und enden auf `KUNDE`. Das ist
fachlich falsch und der einzige Punkt, an dem am Modell selbst zu arbeiten ist —
lösbar über eine zusätzliche Phasenspur, nicht über eine neue Codebase.

**Empfehlung:** Umbau in drei Zügen — (1) streichen, was in §11.2 steht,
(2) die verbleibenden fünf Bildschirme auf die Schleife schärfen, (3) die Lücken
aus §10 in der Reihenfolge 10.1 → 10.2 → 10.4 → 10.10 zubauen. Die ersten beiden
Züge sind überwiegend Löscharbeit und machen das Werkzeug sofort verständlicher;
der dritte ist die eigentliche Produktarbeit.
