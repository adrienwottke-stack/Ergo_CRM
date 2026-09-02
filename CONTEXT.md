# Tracker

Der Tracker (früher „Cockpit", davor „Ergo CRM") ist ein Werkzeug für Vertrieb und Führung im Strukturvertrieb: Jede Person pflegt ihre eigene Kontakt-Pipeline, und dieselben Zahlen tragen die Führung der Struktur.

## Language

### Trichter

**Trichter**:
Die vier Aktivitätsstufen Anrufe → Termine vereinbart → Termine gehalten → Abschlüsse, gezählt aus den eigenen Einträgen.

**Übergangsquote**:
Der Anteil, den eine Stufe von ihrer Vorstufe im gewählten Zeitraum erreicht. Die Frage dahinter: woran hakt es?

**Engpass**:
Der Übergang mit der kleinsten Übergangsquote — gezählt nur dort, wo die Vorstufe überhaupt belegt ist.

**Team-Schnitt**:
Dieselbe Übergangsquote, aber gerechnet aus den Summen aller aktiven Personen der Instanz ohne Platzhalter im selben Zeitraum — bewusst kein Durchschnitt einzelner Quoten.

### Struktur

**Struktur / Gesamtstruktur**:
Der Baum aller Personen der Instanz — wer wen führt. Die gesamte Struktur sehen darf nur der Admin, unabhängig von dessen eigener Struktur. Jede Führungskraft — auch eine, die organisatorisch ganz oben steht — sieht ausschließlich die eigene Struktur: sich selbst und alles, was darunter hängt.

**Ast**:
Eine Person und alles, was unter ihr hängt.

**Führungskraft (FK)**:
Keine Rolle, sondern eine Position: Wer Direkte unter sich hat, führt. Damit ist
Führung zugleich die zweite Achse neben dem **Ausbau** — sie wird nie gesetzt,
sondern gezählt.

**Platzhalter**:
Ein angelegtes Konto ohne eigenen Zugang. Steht im Baum, zählt in keiner Summe und trägt keine Ampel.

**Instanz**:
Ein Deployment mit eigener Datenbank. Heute gilt: eine Instanz = eine Struktur, eine Rangliste, ein Admin.

**Mandant**:
Zielbild, noch nicht gebaut: eine abgegrenzte Struktur innerhalb einer gemeinsamen Instanz, die von anderen Mandanten nichts sieht. Bis dahin ist „Mandant" kein Wort der Oberfläche.

### Führung

**Lagebild**:
Der Erstblick der Führungskraft beim Öffnen — Ampel-Bilanz der eigenen Struktur, Gesamtstand mit Richtung, wer kurz vor der nächsten Karrierestufe steht, danach die Fälle, die heute einen Griff brauchen. Eine Arbeitsliste mit Kopf, keine Auswertung; „Reporting" ist im Tracker kein Wort der Oberfläche.

**Gesamtstand**:
Einheiten vor der App plus alles seither Gebuchte. Für eine Struktur gilt: eine Bedeutung, drei Anzeigen — Lagebild-Kopf, „Zusammen" in der Mannschaft, „Du und dein Team zusammen" bei den Einheiten — und eine Rechnungsbasis; weicht eine ab, glaubt niemand mehr den anderen beiden.

**Verlauf**:
Die kumulierte Kurve über die Zeit, im Stil eines Depot-Charts. Für Einheiten: die eigene auf der Einheiten-Seite, die der Struktur in der Mannschaft — dort als zwei Linien **Eigen** und **Team**, deren Summe der Gesamtstand ist. Für Aktivitäten: Anrufe und vereinbarte Termine, aus derselben Rechnungsbasis wie die Mannschafts-Tabelle. Vor dem ersten App-Tag läuft die Einheiten-Kurve flach, weil der Startbestand kein Datum trägt. Ein Storno zieht sie nach unten.

**Vorführen**:
Der Schalter fürs Zeigen vor Fremden: an der Stelle jedes Namens steht ein **Zählname** („GP 1", „GP 2", …), Zahlen und Kurven bleiben echt. Initialen taugen dafür nicht — wer das Team kennt, löst sie auf. Gilt je Browser-Tab und wird nie gespeichert.

### Direktkontakt

**Direktkontakt**:
Die Ansprache eines fremden Menschen — auf der Straße, über Instagram — mit dem Ziel, einen Geschäftspartner zu gewinnen. Kein Kontakt der Namensliste, solange keine Nummer da ist.

**Direktkontakttrichter**:
Die fünf Stufen Angesprochen → Instagram → Nummer → Termin vereinbart → Rekrutiert, von der Führungskraft selbst gezählt, mit Übergangsquoten wie beim Trichter. Ein Werkzeug der Führung, das in keiner Leiste steht.

### Ausbau

**Ausbau**:
Wie viel vom Werkzeug für eine Person offen ist. Zwei Stände: der Anfang —
Namen, Heute, Kalender, Einladen — und der volle Umfang. Die Führungskraft
hebt ihn, nie der Betroffene — der darf darum **bitten** —, und nur nach oben. Kein Wort der Oberfläche:
sichtbar wird er allein in dem Moment, in dem etwas aufgeht.

Nicht zu verwechseln mit **Aufbau**: dort wächst die Struktur, hier das
Werkzeug.

**Freischalten**:
Der eine Griff, mit dem eine Führungskraft den Ausbau einer ihrer Leute hebt.
Die App schlägt ihn vor, sobald die Ergebnisse stimmen — vereinbarte oder gehaltene Termine, nie Anrufe, denn Anrufe messen nur, wer sie einträgt — oder sobald jemand gebeten hat; sie tut ihn nie selbst.
Zurücknehmen lässt er sich nicht.

**Bitte**:
Der Wunsch einer Person, mehr vom Werkzeug zu sehen. Sie stellt ihn selbst; freigeben kann ihn nur ihre Führungskraft oder der Admin. Eine je Person, und sie endet mit dem Freischalten.
_Avoid_: Antrag, Anfrage — die Anfrage kommt von außen und will erst einen Zugang.

**Verdient**:
Was ab einer Karrierestufe von selbst aufgeht — heute das Spiel. Es kommt aus der eigenen Arbeit, nicht aus einer Freigabe.
_Avoid_: Freischalten, Belohnung, Prämie

**Die zwei Achsen**:
Ausbau und Führung stehen nebeneinander, nicht übereinander. Der Ausbau wird
gesetzt, die Führung ergibt sich — wer Direkte hat, führt. Sie kreuzen sich
frei: eine Führungskraft am Anfang sieht ihre Mannschaft, aber keinen Trichter.

### Aufbau

**Kandidatur**:
Das Bewerberspezifische an einem Kontakt der Recruiting-Liste — Motiv, Situation, Verlauf. Der Mensch bleibt derselbe Kontakt; die Kandidatur endet an Tag 90 nach dem Start, nicht an der Zusage.

**Zusage**:
Die Kandidatur-Phase, in der der Kandidat ja gesagt hat. Der Zusage-Knopf erzeugt im selben Zug die Einladung.

### Wettbewerb

**Saison**:
Ein Monat im Wettbewerb. Die Woche ist der Spieltag, die Saison das Turnier.

**Stufen-Titel**:
Der Name einer Wettbewerbsstufe — etwas, das man gern zeigt. Das Team darf die Namen selbst wählen. Nicht zu verwechseln mit dem **Wochentitel**, den jede Woche neu vergibt, wer die beste Zahl hat.

**Team-Challenge**:
Ein Wochenziel der ganzen Mannschaft, auf das alle einzahlen — gegen das Ziel, nicht gegeneinander.

**Trophäe**:
Eine Auszeichnung für eine abgeschlossene Saison. Sie wird nicht gesammelt, sondern verliehen, und trägt das Datum ihrer Saison.

**Vitrine**:
Der Ort der Trophäen vergangener Saisons.

### Multiplikation

**Multiplizierbar**:
Ein Berater, den der Betreiber nicht persönlich briefen muss, übernimmt den Tracker selbst und nutzt es danach von sich aus weiter.

**Aktiver Nutzer**:
Eine Person mit Einträgen an mindestens drei Tagen einer Kalenderwoche. Konten zählen nicht — Nutzung zählt.

**Index / indexiert**:
Ein Verlauf, dessen Start auf 100 gesetzt ist. Nach außen gehen ausschließlich indexierte Verläufe, nie absolute Einheiten.

**Berichts-Link**:
Der teilbare, jederzeit zurückziehbare Link einer Führungskraft mit indexierten Struktur-Zahlen für die Runde nach oben. Zeigt keine Kundendaten und keine Kontaktnamen.

**Teamabend**:
Der wöchentliche Teamtermin — und der eine Bildschirm im Werkzeug, der dort gezeigt wird.

**Rückblick-Karte**:
Eine automatisch erzeugte Karte für den Teamabend mit genau einem Highlight einer Person — oder einem Befund des ganzen Teams. Was hakt, steht nie an einem Namen. Die Führungskraft wählt vor dem Abend, welche Karten gezeigt werden.

**Anfrage**:
Die Nachricht eines außenstehenden Beraters, der einen Zugang will. Kein Konto, kein Kontakt — nur Name, Erreichbarkeit und Anliegen.
