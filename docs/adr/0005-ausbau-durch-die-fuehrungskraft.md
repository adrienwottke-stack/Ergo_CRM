# Die Führungskraft schaltet frei, und jedes Konto fängt beim Anfang an

Status: entschieden 30.08.2026. Das Cockpit öffnet sich stufenweise. Wie viel eine Person sieht, entscheidet nicht die App und nicht sie selbst, sondern ihre Führungskraft. Bei der Umstellung fällt **jedes bestehende Konto** auf den Anfang zurück — nicht nur die neuen.

## Kontext

Rückmeldung von mehreren Nutzern: der Start in die App überfordert. Nachgefasst zerfiel das in drei Teile, alle drei bestätigt: zu viele Reiter (sieben ab der ersten Sekunde), zu volle Seiten (`/heute` rendert 18 Blöcke) und zu viele Begriffe (Trichter, Engpass, Lagebild, Arena, Griff, Ast, Puls, Einheiten, Karrierestufe, Stufe — alle gleichzeitig da).

Der naheliegende Weg wäre gewesen, die Freischaltung an die **Einheiten** zu hängen: das ist die Zahl, in der der Betrieb rechnet, und die Karrierestufe hängt schon daran. Der Weg ist verbaut. `User.karrierestufe` ist bei jedem neuen Konto NULL, und `docs/einheiten-plan.md` §6 verbietet die Vorbelegung auf 1 ausdrücklich („eine falsche Stufe würde jemanden in die falsche Runde stellen"). Einheiten sind ausserdem selbst gemeldete Zahlen, und oberhalb von 500 (Karrierestufe 2) ist keine einzige weitere Schwelle definiert. Wer nie Einheiten einträgt, bliebe für immer am Anfang — ausgerechnet der Neue, um den es geht.

Geprüft und verworfen wurden ausserdem:

- **Automatik aus gemessener Tätigkeit.** Die App hat die Zahlen (`DailyLog`) und könnte selbst öffnen. Aber im Strukturvertrieb ist der nächste Schritt eine Ausbildungsentscheidung, keine Zählergrenze — und eine App, die jemanden ungefragt in die Auswertung schiebt, nimmt der Führungskraft genau das Gespräch weg, das dort hingehört.
- **Selbstauswahl beim ersten Start** („Ich fange an / ich arbeite eigenständig / ich führe"). Blockiert nie und rät nie falsch — ist aber kein Fortschritt, sondern eine Einstellung, und hätte damit keinen der drei Momente erzeugt, für die die Sache gebaut wird.

## Entscheidung

**Zwei Achsen, keine Leiter.**

| Achse | Werte | Woher |
|---|---|---|
| Ausbau | 1 (Anfang) → 2 (voller Umfang) | Die Führungskraft setzt ihn. Gespeichert. Nur aufwärts. |
| Führung | offen / zu | Abgeleitet: hängt ein einloggbares Konto unter mir? Nie gespeichert. |

Sie kreuzen sich frei. Eine Führungskraft auf Ausbau 1 sieht die Mannschaft, aber keinen Trichter — wer führt, muss führen können, und das hat mit dem eigenen Ausbaustand nichts zu tun. Das ist keine Ausnahme, sondern dasselbe, was `CONTEXT.md` seit jeher sagt: Führungskraft ist keine Rolle, sondern eine Position.

**Freischalten darf** das nächste einloggbare Konto oberhalb im `User.path`. Platzhalter werden übersprungen — ein Konto ohne Passwort kann sich nie anmelden und damit nie jemanden freischalten; über `Invite.fuerId` entsteht genau dieser Fall regelmässig. Wer niemanden über sich hat, braucht keine Freischaltung.

**Die App schlägt vor, sie tut es nicht.** Erreicht jemand die Schwellen (Voreinstellung: 20 Anrufe und 3 gehaltene Termine, über die gesamte Zeit), erscheint bei seiner Führungskraft auf `/heute` eine Zeile mit dem Grund und einem Knopf. Der Vorschlag wird **gerechnet, nicht gespeichert**: `app/(app)/mannschaft/actions.ts` hält fest, dass eine `LeadershipTask` ausschliesslich durch einen Tipp der Führungskraft entsteht, und `docs/audit-kernmodell.md` §9 nennt automatisch erzeugte Aufgaben ausdrücklich „bewusst nicht gebaut". Diese Regel bleibt unangetastet.

**Bei der Umstellung fällt jedes Konto auf Ausbau 1.** Drei Ausnahmen: der Admin (sonst sperrt die Migration den Notausgang aus), wer keine einloggbare Führungskraft über sich hat (er wartete sonst auf jemanden, den es nicht gibt) und Platzhalter (sie bleiben auf 1, weil die Freischaltung entschieden werden soll, wenn ein Mensch daraus wird — nicht von einer Migration von heute).

## Konsequenzen

- **Ein Feld wird gespeichert, wo das Haus sonst rechnet.** `lib/stufen.ts` beginnt mit „Eine Stufe wird NICHT gespeichert", und `User.careerLevel` flog beim Kernmodell-Rückbau als totes Feld raus. `User.ausbau` ist trotzdem eine Spalte: dort rechnet eine Formel, hier entscheidet ein Mensch. Anders als `careerLevel` wird das Feld auf jeder Seite gelesen.
- **Die Führungs-Achse bleibt ungespeichert.** Ein `fuehrt`-Flag müsste bei jedem Umhängen fortgeschrieben werden und stünde ab dem ersten verpassten Fall dauerhaft falsch da — dieselbe Begründung, mit der `docs/einheiten-plan.md` §10 die Team-Summe nicht speichert.
- **Verstecken ist Aufräumen, keine Sicherheit.** `darfSehen()` entscheidet, was in der Leiste steht und was eine Seite zeigt. Die Zugriffsgrenzen bleiben, wo sie waren: `lib/scope.ts` und `requireAdmin()`. Wer eine gesperrte Adresse tippt, bekommt eine Auskunft, keinen Fehler.
- **Zwei dokumentierte Entscheidungen bleiben stehen, eine kippt.** „Einladen kann jeder: Werben ist der Kern des Berufs, nicht die Kuer" gilt weiter — Einladen liegt auf Ausbau 1. Auch der alte Einwand gegen ein Verstecken der Mannschaft („dann blieb der Weg genau dem verborgen, der ihn zuerst braucht") ist eingelöst, aber anders als damals: nicht dadurch, dass die Seite bei jedem steht, sondern dadurch, dass der erste Geschäftspartner über `/einladen` entsteht und die Seite in derselben Sekunde aufgeht.
- **Ein aktiver Bestandsnutzer verliert über Nacht Reiter.** Das ist die riskanteste Stelle dieser Entscheidung und wurde bewusst so gewählt: die Mechanik muss sich am Bestand beweisen, sonst beweist sie sich nirgends. Der Preis wird über die Sammelliste in der Werkstatt abgefedert, nicht wegdiskutiert.
- **Die Schwellen sind noch nicht kalibriert.** `scripts/ausbau-probe.mjs` zeigt am 30.08.2026 gegen die echte Datenbank **null** Treffer bei 20/3 — höchster Kopf 23 Anrufe und 1 gehaltener Termin. Am ersten Tag schlägt die App also niemandem etwas vor, und jede Freischaltung ist Handarbeit. Die Zahl beschreibt, wann jemand so weit ist, nicht wo der heutige Bestand zufällig steht; sie liegt als `Einstellung`-Zeile in der Werkstatt und ist eine Korrektur weit entfernt. Dieselbe Falle wie bei `lib/stufen.ts`, dort andersherum entschieden (heruntergesetzt, damit sich die Kachel überhaupt öffnet) — hier ist die Gegenprobe `node scripts/ausbau-probe.mjs 3 1`.
