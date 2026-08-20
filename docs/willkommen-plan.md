# Willkommen-Plan (Ergo CRM)

Stand: 20.08.2026 — **Bauabschnitt 0 (Akt 0, die Installations-Schleuse) ist
gebaut.** Die Akte 1 bis 4 sind weiterhin Planung.
Ergänzt am 20.08.2026 um Akt 0 (Installation als Pflicht) und Abschnitt 7.

Ziel: Wer den Einladungslink öffnet, hat vier Minuten später **die App auf seinem
Startbildschirm und fünf Namen darin** — er ist kein Zuschauer mehr, sondern Anwender.

Der Anlass: Heute landet ein frisch eingeladener Berater nach „Zugang anlegen"
direkt auf [`/heute`](../app/(app)/heute/page.tsx) — und die Seite ist **leer**.
Erstes Erlebnis: ein grüner Haken und „Keine offenen Schritte". Dazu steht
`beginnerMode` auf `false`, er sieht also sofort zehn Navigationspunkte, von denen
neun für ihn an Tag 1 keine Bedeutung haben. Das ist die schlechteste Version des
ersten Eindrucks — und sie kostet uns genau die Leute, die wir am Launch-Tag
gewinnen wollen.

Der zweite Anlass: Der Einladungslink wird per WhatsApp verschickt und im
WhatsApp-Browser geöffnet. Aus dem heraus lässt sich auf **keinem** Handy eine App
installieren. Wer diesen Tab schließt, hat kein Symbol, keine Erinnerung und keinen
Weg zurück — er hat die App effektiv nie besessen. Deshalb steht vor allem anderen
die Schleuse aus [Akt 0](#akt-0--auf-das-handy-pflicht-60-s).

---

## 1. Grundentscheidungen

| Thema | Entscheidung | Woher |
|---|---|---|
| Form | **Geführter Chat**, danach drei Problem-Karten, dann echte Eingabe | ⚠️ Annahme |
| Absender | **Der Einladende** (steht im Invite). Ohne Einladenden: Paul Ehlert | ⚠️ Annahme |
| Video | **Keins.** Platzhalter-Rahmen bleibt nachrüstbar | ⚠️ Annahme |
| Abschluss | **Fünf Namen eintippen**, überspringbar — aber der Knopf ist klein | ⚠️ Annahme |
| Reichweite | **Alle Konten einmalig**, auch die bestehenden. Danach nie wieder automatisch | ⚠️ Annahme |
| Chat-Technik | **Regie, keine KI.** Feste Zweige, zwei Antwortknöpfe, kein API-Aufruf | ⚠️ Annahme |
| Danach | `beginnerMode = true` — drei Navigationspunkte statt zehn | ⚠️ Annahme |
| Installation | **Pflicht.** Ohne App auf dem Startbildschirm kein Formular und kein Konto | ✅ entschieden |
| Zeitpunkt | **Vor** dem Anlegen des Kontos — sonst meldet er sich in der App ein zweites Mal an | ✅ entschieden |
| Am Rechner | **Kein Weiterkommen.** QR-Code aufs Handy, sonst nichts | ✅ entschieden |
| Dauer | **~2,5 Minuten** ab Akt 1, jederzeit abbrechbar. Akt 0 kommt obendrauf und ist nicht abbrechbar | ⚠️ Annahme |

Die Annahmen stammen aus der Fragerunde, die du übersprungen hast. Keine
davon greift tief ins Fundament — sag, was du anders willst, das ist überall eine
lokale Änderung.

**Warum kein Tooltip-Rundgang über die echte Oberfläche:** teuer, bricht bei jeder
Layout-Änderung, und auf dem Handy — wo diese Leute die App öffnen — sowieso nicht
zu gebrauchen. Ein eigener Bildschirm, der nach zweieinhalb Minuten für immer
verschwindet, ist ehrlicher und billiger.

**Warum kein echtes Sprachmodell im Chat:** Der Chat soll *führen*, nicht plaudern.
Regie ist zuverlässig, kostenlos, funktioniert im Funkloch und sagt garantiert nichts
Falsches über Provisionen. Der echte Assistent bleibt sein eigenes Thema
([assistent-plan.md](assistent-plan.md)).

---

## 2. Der Ablauf in fünf Akten

### Akt 0 — Auf das Handy (Pflicht, ~60 s)

Vor dem ersten Wort des Chats steht die Frage, ob das hier überhaupt auf dem
richtigen Gerät läuft. Der Link kommt per WhatsApp und wird im WhatsApp-Browser
geöffnet — und aus dem heraus kann man auf **keinem** Handy eine App installieren.
Wer diesen Tab schließt, findet nie wieder zurück.

Deshalb ist die Installation **Bedingung, nicht Angebot**: Das Formular „Zugang
anlegen" auf [`/einladung/[code]`](../app/einladung/[code]/page.tsx) erscheint erst,
wenn die Seite vom Startbildschirm aus läuft. Vier Zweige, je nachdem wo er ankommt:

| Wo er ankommt | Was er sieht | Wie er weiterkommt |
|---|---|---|
| **WhatsApp-/Instagram-Browser** | „Das gehört auf deinen Startbildschirm." + Bild vom ⋮-Menü | *In Chrome öffnen* bzw. *In Safari öffnen*. Der Link ist zusätzlich kopierbar, weil der Menüpunkt nicht überall gleich heißt |
| **Chrome auf Android** | Ein Knopf | Ein Tipp — das Systemfenster kommt von Chrome selbst |
| **Safari auf dem iPhone** | Drei Schritte mit Pfeil auf das Teilen-Symbol unten | Teilen → *Zum Home-Bildschirm* → *Hinzufügen* |
| **Am Rechner** | QR-Code des Einladungslinks | „Scann das mit dem Handy. Da gehört es hin." An diesem Gerät geht es nicht weiter |

```
┌───────────────────────────────────┐
│               ▢                   │
│           Ergo CRM                │
│                                   │
│  Das hier ist keine Webseite.     │
│  Es gehört auf deinen Start-      │
│  bildschirm — sonst ist es        │
│  morgen weg.                      │
│                                   │
│  [ Auf dem Handy installieren ]   │
│                                   │
│  Danach geht es hier weiter.      │
└───────────────────────────────────┘
```

Nach der Installation öffnet er die App, landet **wieder in derselben Einladung** —
diesmal ohne Adressleiste — und sieht jetzt das Formular. Ab da läuft alles, was in
diesem Dokument steht, in der App.

**Warum vor dem Konto und nicht danach:** Auf dem iPhone hat eine vom Startbildschirm
gestartete App **einen eigenen Speicher**. Eine Anmeldung in Safari gilt dort nicht.
Wer erst sein Konto anlegt und dann installiert, steht beim ersten App-Start vor dem
Anmeldefenster — mit einem Passwort, das er vor zwei Minuten zum ersten Mal vergeben
hat. Steht die Schleuse davor, meldet er sich genau einmal an: in der App, in der er
ab dann arbeitet.

**Kein „Trotzdem weiter".** Es gibt im Ablauf keinen Ausweg. Wenn ein Gerät wirklich
nicht mitspielt, schaltet der Einladende diese eine Einladung frei — das steht in
[Abschnitt 7](#7-technik-der-schleuse) und ist nichts, was der Eingeladene sieht.

### Akt 1 — Der Chat (~45 s)

Ein Chat-Fenster, wie er es aus WhatsApp kennt. Nachrichten laufen **einzeln** ein,
mit Tipp-Punkten davor. Geantwortet wird über **zwei vorgegebene Knöpfe**, nie über
ein Textfeld — damit gibt es keinen Zweig, den wir nicht geschrieben haben.

```
┌───────────────────────────────────┐
│  ●  Paul Ehlert                   │
│     tippt …                       │
├───────────────────────────────────┤
│  ┌──────────────────────────────┐ │
│  │ Moin Max! 👋                 │ │
│  │ Schön, dass du da bist.      │ │
│  └──────────────────────────────┘ │
│  ┌──────────────────────────────┐ │
│  │ Bevor du loslegst — eine     │ │
│  │ ehrliche Frage.              │ │
│  └──────────────────────────────┘ │
│  ┌──────────────────────────────┐ │
│  │ Wie viele Leute stehen auf   │ │
│  │ deiner Namensliste?          │ │
│  └──────────────────────────────┘ │
│                                   │
│  [ Im Kopf so 20 ] [ Ehrlich: 0 ] │
└───────────────────────────────────┘
```

Beide Antworten führen weiter, nur mit anderem Konter:

> **„Im Kopf so 20"** → *„Im Kopf ist die Liste am Freitag noch da. Am Montag sind es zwölf."*
>
> **„Ehrlich: 0"** → *„Perfekt. Dann fangen wir genau da an — dauert zehn Minuten."*

Dann die Überleitung:

> *„Ich zeig dir kurz die drei Dinge, an denen es bei fast jedem hakt."* → **[ Los ]**

Der Sinn des Akts: **Er hat schon zweimal getippt, bevor irgendwas erklärt wurde.**
Wer mitmacht, hört zu.

### Akt 2 — Die drei Probleme (~45 s)

Drei Karten nacheinander. Jede Karte: **Problem oben, groß und unangenehm — Antwort
unten, klein und konkret.** Kein Feature-Vokabular, keine Aufzählung von Funktionen.

| # | Problem | Der Satz darunter | Antwort der App |
|---|---|---|---|
| 1 | **„Der Rückruf, den keiner macht"** | Die meisten hören nach dem ersten Nein auf. Die Termine kommen danach. | **Heute** — jeden Morgen steht da, wer heute dran ist. Nichts verfällt. |
| 2 | **„Deine Namensliste liegt in vier Chats"** | WhatsApp, Insta, Kopf, Zettel. Beim Telefonieren suchst du, statt zu reden. | **Namensliste** — 20 Namen an einem Ort, Leitfaden daneben, ein Tipp pro Ergebnis. |
| 3 | **„Sonntagabend: Wie lief die Woche?"** | Wer nicht zählt, schätzt. Und schätzt sich immer besser, als er war. | **Wettbewerb** — jeder Anruf zählt sich selbst mit. |

Die drei sind nicht zufällig gewählt: Sie zeigen **exakt auf die drei
Navigationspunkte des Einsteiger-Modus** (Namen · Heute · Wettbewerb). Die Karten
sind damit gleichzeitig die Erklärung der Leiste, die er gleich sieht — er muss die
Navigation nie separat lernen.

### Akt 3 — Die ersten Namen (~60 s)

Der eigentliche Punkt des Ganzen. Zurück in den Chat:

> *„Letzte Sache. Schreib mir fünf Namen. Die ersten, die dir einfallen — nicht die besten."*

```
┌───────────────────────────────────┐
│  Name                      [ + ]  │  ← tippen, Enter, nächster
└───────────────────────────────────┘
          ● ● ● ○ ○   3 von 5
```

Ab dem dritten Namen ein Zwischenruf: *„Weiter. Nicht nachdenken."*
Nach dem fünften:

> *„Das sind fünf mehr als vorhin. Die stehen ab jetzt in deiner Liste."*

**Technisch läuft das über die vorhandene
[`addName`](../app/(app)/namen/actions.ts)-Action** — kein zweiter Schreibpfad,
dieselbe Dublettenprüfung, derselbe Wettbewerbs-Zähler (`NUMBERS_PULLED`), dieselbe
Herkunft `source: "Namensliste"`. Liste: `RECRUITING`. Damit hat er nach dem Start
**Punkte auf der Rangliste**, bevor er zum ersten Mal telefoniert hat.

Überspringen geht (*„Mach ich gleich"*), steht aber klein unter dem Feld.

### Akt 4 — Ankunft (~10 s)

Ein Bild, zwei Knöpfe:

> **Fertig. Ab hier arbeitest du.**
> Deine fünf Namen warten in der Liste.
>
> **[ Zur Namensliste ]**   ·   *Erst mal umschauen*

Im Hintergrund passiert beim Verlassen: `onboardingDoneAt = jetzt`,
`beginnerMode = true`.

---

## 3. Datenmodell

Ein Feld für den Start:

```prisma
model User {
  // NULL = hat den Start noch nie gesehen. Einmalig gesetzt, danach nie wieder
  // automatisch. Bewusst kein Schritt-Zaehler: wer mittendrin abbricht, faengt
  // von vorn an - bei zweieinhalb Minuten ist das die richtige Antwort.
  onboardingDoneAt DateTime?
}
```

Zwei Felder für die Schleuse:

```prisma
model User {
  // Erster Start vom Startbildschirm aus. NULL = arbeitet noch im Browser-Tab.
  // Damit steht in der Mannschaft, wer die App wirklich hat.
  installedAt DateTime?
}

model Invite {
  // Notausgang fuer Geraete, auf denen die Installation wirklich nicht laeuft.
  // Setzt der Einladende, nie der Eingeladene. Siehe Abschnitt 7.6.
  browserFreigabe Boolean @default(false)
}
```

Migrationen: `prisma/migrations/20260820000000_willkommen` und
`prisma/migrations/20260821000000_installation`.

Kein zweites Feld für „Namen schon eingetippt" — das steht ohnehin in der
Kontakt-Tabelle und wäre eine zweite Wahrheit.

---

## 4. Die Weichen im Bestand

| Stelle | Änderung |
|---|---|
| [`app/einladung/[code]/actions.ts`](../app/einladung/[code]/actions.ts) | Ziel-Redirect `"/heute"` → `"/willkommen"`; beim `user.create` zusätzlich `beginnerMode: true` |
| [`app/(app)/layout.tsx`](../app/(app)/layout.tsx) | `requireUser()` → `requireOnboardedUser()` |
| [`app/(team)/layout.tsx`](../app/(team)/layout.tsx) | dito — sonst umgeht `/leaderboard` den Start |
| [`app/einladung/[code]/page.tsx`](../app/einladung/[code]/page.tsx) | Formular hinter die Schleuse; eigenes Manifest je Einladung verlinken |
| [`app/layout.tsx`](../app/layout.tsx) | Service Worker registrieren |
| [`app/manifest.ts`](../app/manifest.ts) | 512er-Icon zusätzlich als `any`, dazu `scope` und `id`; `start_url` auf `/start` |
| [`middleware.ts`](../middleware.ts) | `/start` und `/offline` ohne Sitzung erreichbar |

`requireOnboardedUser()` kommt neu in [`lib/auth.ts`](../lib/auth.ts): dasselbe wie
`requireUser()`, plus `if (user.onboardingDoneAt === null) redirect("/willkommen")`.

**Bewusst nicht in der Middleware:** die läuft auf der Edge-Runtime und hat keine
Datenbankverbindung — sie darf auch keine bekommen. Der Layout-Check kostet nichts
extra, weil beide Layouts den Benutzer ohnehin schon laden.

**Erneut aufrufbar:** `/willkommen` bleibt für angemeldete Benutzer offen. Dazu ein
dezenter Link im leeren Zustand von „Heute" („Wie das hier gedacht ist") — damit
kannst du den Ablauf am Launch-Tag jemandem vorführen, ohne ein Konto anzulegen.

---

## 5. Bausteine

| Datei | Art | Aufgabe |
|---|---|---|
| `lib/willkommen.ts` | — | **Das Drehbuch als Daten.** Alle Sätze, alle Zweige, die drei Karten |
| `app/(willkommen)/layout.tsx` | Server | Volle Fläche, Navy-Verlauf, **keine Navigation** |
| `app/(willkommen)/willkommen/page.tsx` | Server | Lädt Vorname, Einladenden, Anzahl vorhandener Namen |
| `app/(willkommen)/actions.ts` | Server | `willkommenAbschliessen()` — setzt Flag und Einsteiger-Modus |
| `components/willkommen/Willkommen.tsx` | Client | Regie: welcher Akt, Fortschritt, Überspringen |
| `components/willkommen/ChatFaden.tsx` | Client | Blasen, Tipp-Punkte, Antwortknöpfe |
| `components/willkommen/ProblemKarten.tsx` | Client | Die drei Karten |
| `components/willkommen/ErsteNamen.tsx` | Client | Feld und Fortschritt, ruft `addName` |
| `public/sw.js` | — | App-Schale zwischenspeichern. **Ohne ihn bietet Android das Installieren nicht an** |
| `lib/geraet.ts` | — | Die vier Erkennungen aus 7.2 an genau einer Stelle |
| `app/einladung/[code]/manifest.webmanifest/route.ts` | Server | Manifest mit `start_url` zurück in die Einladung |
| `app/start/route.ts` | Server | Die Weiche nach dem App-Start |
| `app/offline/page.tsx` | Server | „Kein Netz" statt Dino-Spiel |
| `components/schleuse/Schleuse.tsx` | Client | Entscheidet den Zweig, blendet das Formular frei |
| `components/schleuse/AusInAppBrowser.tsx` | Client | „In Chrome öffnen", Link kopierbar |
| `components/schleuse/AndroidInstallieren.tsx` | Client | `beforeinstallprompt` abfangen, nach 3 s Rückfall auf die Anleitung |
| `components/schleuse/IphoneAnleitung.tsx` | Client | Drei Schritte mit Pfeil auf das Teilen-Symbol |
| `components/schleuse/AmRechner.tsx` | Server | QR-Code des Einladungslinks |

**Warum das Drehbuch eine eigene Datei ist:** Du wirst diese Sätze am Launch-Tag
noch dreimal umschreiben. Das muss eine Textdatei sein, kein JSX zwischen `div`s.

---

## 6. Gestaltung

- **Eigene Route-Gruppe ohne App-Kopfzeile.** Die zehn Navigationspunkte sind genau
  das, was im ersten Moment nicht zu sehen sein soll.
- **Navy-Grund** (`--color-navy-950` nach `--color-navy-800`), Gold als einziger
  Akzent — dieselbe Sprache wie Kopfzeile und Wortmarke, nur einmal ganzflächig.
- **Ein Gedanke pro Bild.** Große Schrift, viel Luft, ein Knopf.
- **Handy zuerst.** Der Link wird per WhatsApp verschickt und auf dem Handy geöffnet.
  Antwortknöpfe unten in Daumenreichweite, mindestens 44 px hoch.
- **Bewegung** über `setTimeout` und die vorhandenen Keyframes (`rise-in`) — keine
  Bibliothek. Bei `prefers-reduced-motion` erscheinen die Nachrichten sofort statt
  getippt.
- **Avatar** als Initialen-Kreis in Navy/Gold. Ein Foto ist später ein `<img>` im
  selben Kreis.
- **Fortschrittsbalken** dünn am oberen Rand: er soll sehen, dass es endlich ist.
- **Die Schleuse spricht dieselbe Sprache** — Navy-Grund, Gold, ein Gedanke, ein Knopf.
  Sie darf sich nicht wie eine Fehlermeldung anfühlen, sondern wie der erste Schritt.
  Der Ton ist nicht „du musst", sondern „das gehört dorthin".
- **Echte Bildschirmfotos** in der iPhone-Anleitung, keine gezeichneten Symbole. Wer
  das Teilen-Symbol nicht kennt, findet es nur, wenn er es genauso sieht.

---

## 7. Technik der Schleuse

### 7.1 Was heute fehlt

[`app/manifest.ts`](../app/manifest.ts) und die `appleWebApp`-Angaben in
[`app/layout.tsx`](../app/layout.tsx) sind vollständig — wer von Hand „Zum
Startbildschirm" tippt, bekommt schon heute ein sauberes Symbol ohne Adressleiste.
Es tippt nur niemand. Vier Dinge fehlen:

1. **Kein Service Worker.** Chrome bietet das Installieren erst an, wenn einer
   registriert ist. Ohne ihn gibt es auf Android kein Systemfenster, das wir
   auslösen könnten.
2. **Kein Weg zurück nach der Installation** — dazu 7.3.
3. **Keine Erkennung**, in welchem Browser und auf welchem Gerät die Seite läuft.
4. **Das 512er-Icon** trägt in `app/manifest.ts` nur `purpose: "maskable"`. Damit
   fehlt Android ein normales großes Symbol. Beide Zwecke eintragen, dazu `scope`
   und `id`.

### 7.2 Die vier Erkennungen — in dieser Reihenfolge

Alle in `lib/geraet.ts`, alle im Browser, weil der Server keine davon beantworten kann.

| # | Prüfung | Wie | Zweig |
|---|---|---|---|
| 1 | In-App-Browser? | Kennung enthält `FBAN`/`FBAV`/`Instagram`/`Line`, oder Android-WebView (`wv`) | „In Chrome öffnen" |
| 2 | Kein Handy? | `(pointer: coarse)` **und** Bildschirmbreite | QR-Code |
| 3 | Schon installiert? | `(display-mode: standalone)`, auf iOS zusätzlich `navigator.standalone` | Formular frei |
| 4 | System | iPhone oder Android | Anleitung bzw. Knopf |

**Die Reihenfolge ist Absicht:** „Kein Handy" wird *vor* „schon installiert" geprüft.
Sonst kommt jemand durch, der die App am Rechner installiert hat — und genau das
wollen wir ja nicht.

**Ehrlich dazu:** Das läuft im Browser und ist keine Sicherheitsgrenze. Wer sie
umgehen will, kann das. Die Schleuse ist Führung, kein Schloss — und dafür reicht es.
Die Kennungen der In-App-Browser ändern sich außerdem; deshalb ist der Zweig „In
Chrome öffnen" so gebaut, dass er auch dann nicht schadet, wenn er einmal
fälschlich greift: Der Link ist kopierbar, der Weg führt immer weiter.

### 7.3 Der Rückweg — ein Manifest je Einladung

Das ist der Punkt, an dem die Sache sonst auseinanderfällt. Installiert wird auf
`/einladung/ABC123`, aber die frisch installierte App startet auf der `start_url`
aus dem Manifest — heute `/namen`. Dort gibt es keine Sitzung, die Middleware
schickt auf `/login`, und der Eingeladene steht ohne Konto vor dem Anmeldefenster.
Sackgasse. Auf dem iPhone kommt dazu, dass Safari sich je nach Version anders
entscheidet, ob es die `start_url` oder die gerade offene Adresse nimmt — darauf
kann man sich in keine Richtung verlassen.

**Lösung:** Die Einladungsseite bekommt ihr **eigenes Manifest** mit
`start_url: "/start?e=ABC123"`. Dann führen beide Wege zurück in die Einladung.

`/start` ist eine reine Weiche ([`app/start/route.ts`](../app/start/route.ts)):

| Lage | Ziel |
|---|---|
| Sitzung, Start noch offen | `/willkommen` |
| Sitzung, Start erledigt | `/namen` bzw. `/heute` |
| Keine Sitzung, `e=` zeigt auf eine offene Einladung | `/einladung/ABC123` |
| Sonst | `/login` |

Damit bleibt die `start_url` auch nach der Einlösung richtig: Die installierte App
öffnet weiter `/start?e=ABC123`, und die Weiche schickt ihn ab dann auf seine
Namensliste. `id` steht in beiden Manifesten fest auf `/`, sonst hält Chrome die
Einladungs-Variante für eine zweite App und legt ein zweites Symbol an.

> **Geprüft am 20.08.2026 — es funktioniert.** Die Frage war, ob Next neben der
> automatischen Manifest-Verknüpfung aus `app/manifest.ts` eine zweite stellt, wenn
> die Einladungsseite ihre eigene angibt. Tut es nicht: `generateMetadata` mit
> `manifest` **ersetzt** die Verknüpfung. Im ausgelieferten HTML von
> `/einladung/ABCD-2345` steht genau ein `<link rel="manifest">`, und zwar der
> einladungseigene. Plan B (Manifest aus einem Route-Handler, jede Seite verlinkt
> selbst) wird nicht gebraucht.

### 7.4 Service Worker

`public/sw.js`, von Hand, rund 40 Zeilen — passt zu vier Abhängigkeiten im Projekt.
Registriert wird er nach dem Laden aus einer kleinen Client-Komponente im
Wurzel-Layout.

- **Nur statische Dateien in den Cache**: `/_next/static`, Icons, Schriften.
- **HTML und Server-Actions niemals.** Das sind Kundendaten, und ein Beitrag aus dem
  Cache im falschen Konto wäre der schlimmste denkbare Fehler dieser App.
- Einzige HTML-Ausnahme: eine Seite `/offline` — „Kein Netz. Deine Eingaben von
  eben sind gespeichert." statt des Dino-Spiels.
- Cache-Name mit Version, alte Caches beim `activate` löschen.

Nebeneffekt für später: Push-Erinnerungen zu Wiedervorlagen gibt es auf dem iPhone
**ausschließlich** in einer installierten App. Das ist das eigentliche Argument
dafür, dass die Schleuse hart ist — nicht Bequemlichkeit, sondern die Erinnerung,
die den Rückruf auslöst.

### 7.5 QR-Code für den Rechner-Zweig

Serverseitig zu SVG gerendert, eine neue Abhängigkeit (`qrcode`). **Kein
Fremddienst**, der aus einer URL ein Bild macht — dabei würde der Einladungslink bei
einem Dritten landen, und mit ihm die Möglichkeit, das Konto anzulegen.

### 7.6 Der Notausgang

Ein hartes Tor ohne Ventil wird zum Anruf bei dir. Deshalb ein Feld an der
Einladung, kein Ausweg im Ablauf:

```prisma
model Invite {
  // Notausgang fuer Geraete, auf denen die Installation wirklich nicht laeuft.
  // Sichtbar nur in der Einladungs-Verwaltung, nie im Ablauf des Eingeladenen.
  browserFreigabe Boolean @default(false)
}
```

Der Einladende setzt den Haken, der Eingeladene lädt neu und sieht das Formular.
Standardmäßig aus — die Ausnahme kostet einen bewussten Griff und ist danach in der
Verwaltung sichtbar.

### 7.7 Messen statt hoffen

`installedAt` am Benutzer, gesetzt beim ersten Start im Standalone-Modus über eine
kleine Server-Action. Damit steht in der Mannschafts-Übersicht neben den
Frühwarn-Signalen, wer die App wirklich auf dem Handy hat — und wer sie nach der
Einladung wieder gelöscht hat, ist genauso sichtbar wie jemand, der nicht anruft.

---

## 8. Bauabschnitte

| # | Inhalt | Ergebnis danach |
|---|---|---|
| **0** ✅ | Service Worker, Manifest je Einladung, `/start`-Weiche, `lib/geraet.ts`, die vier Zweige der Schleuse, `installedAt`, Notausgang | **Niemand kommt mehr ohne App auf dem Handy zum Formular** |
| **1** | Migration `onboardingDoneAt`, `requireOnboardedUser()`, leere Route `/willkommen`, die drei Weichen | Der Start wird angesteuert, zeigt aber nur „Hallo" |
| **2** | `lib/willkommen.ts` und `ChatFaden` — Akt 1 komplett | Der Chat läuft, mit beiden Zweigen |
| **3** | `ProblemKarten` — Akt 2 | Der Mehrwert steht |
| **4** | `ErsteNamen` und `willkommenAbschliessen` — Akt 3 und 4 | Aktivierung, Einsteiger-Modus, fertig |
| **5** | Feinschliff: Bewegung, `reduced-motion`, Handy-Durchlauf, Wiederaufruf-Link | Launch-fertig |

Jeder Abschnitt ist für sich lauffähig. Bricht die Zeit weg, ist nach **3** schon ein
brauchbarer Start da — nur ohne die Aktivierung, die den Unterschied macht.

**Abschnitt 0 steht zuerst und ist nicht verhandelbar** — er liegt im Ablauf vor allem
anderen, und er ist der einzige Abschnitt, der auf echten Geräten geprüft werden muss,
bevor er als fertig gilt: ein iPhone, ein Android-Handy, beide über einen echten
WhatsApp-Link. Am Schreibtisch lässt sich das nicht nachstellen.

---

## 9. Was bewusst nicht drin ist

| Nicht gebaut | Warum |
|---|---|
| Video | Nichts, worauf der Launch wartet. Der Rahmen in Akt 2 ist in fünf Minuten nachrüstbar, sobald eins existiert |
| Echtes Sprachmodell im Chat | Regie ist zuverlässiger, kostenlos, offline — und sagt nichts Falsches über Provisionen |
| Tooltip-Rundgang über die echte App | Bricht bei jeder Layout-Änderung, auf dem Handy unbrauchbar |
| Fortschritt in der Datenbank | Bei 2,5 Minuten ist „von vorn" die richtige Antwort auf einen Abbruch |
| Eigene Kontakt-Anlage | `addName` existiert und macht alles richtig. Ein zweiter Schreibpfad wäre eine zweite Wahrheit |
| App Store / Play Store | 99 € im Jahr, Apple-Prüfung, Signaturen, Update-Zyklus bei jeder Änderung. Auf dem Startbildschirm sieht es identisch aus |
| Push-Benachrichtigungen | Eigenes Thema. Der Service Worker aus 7.4 ist die Voraussetzung, mehr nicht |
| Offline arbeiten | Nur eine ehrliche „Kein Netz"-Seite. Kundendaten aus dem Cache im falschen Konto wären der schlimmste Fehler dieser App |

---

## 10. Offene Punkte

1. **Paul Ehlert als Fallback** — bestätigen oder anderen Namen setzen. Betrifft eine
   Konstante in `lib/willkommen.ts`.
2. **Die drei Probleme** — sind das *deine* drei? Sie sind der inhaltliche Kern; wenn
   einer daneben liegt, tausch ihn, bevor gebaut wird.
3. **Fünf Namen oder zehn?** Fünf sind sicher zu schaffen, zehn wären wertvoller.
   Die Zahl steht an einer Stelle.
4. **Bestehende Konten** — du und die Testleute bekommen den Start beim nächsten
   Aufruf einmalig zu sehen. Falls das beim Launch stört: eine Zeile im Migrations-SQL
   setzt `onboardingDoneAt` für alle heute existierenden Konten auf `now()`.
5. ~~**Manifest-Verknüpfung überschreibbar?**~~ Geprüft und erledigt, siehe 7.3:
   `generateMetadata` ersetzt die Verknüpfung, es steht genau eine im HTML.
6. **Bildschirmfotos fürs iPhone** — brauche ich von dir: Teilen-Menü und der Eintrag
   „Zum Home-Bildschirm“, auf deinem eigenen Gerät aufgenommen. Bis dahin trägt eine
   gezeichnete Version des Teilen-Symbols in `components/schleuse/IphoneAnleitung.tsx`.
7. ~~**`qrcode` als neue Abhängigkeit**~~ Installiert und im Einsatz
   (`components/schleuse/QrCode.tsx`, serverseitig zu SVG gerendert). Kein
   Fremddienst, der Einladungslink verlässt den eigenen Server nicht.
8. **Die Bestandsleute haben keine Einladung mehr** — sie kommen nie durch die
   Schleuse. Vorschlag: ein Streifen oben in der App für alle mit `installedAt = NULL`,
   mit denselben Anleitungen, aber wegklickbar. Eigener kleiner Abschnitt nach 5.
