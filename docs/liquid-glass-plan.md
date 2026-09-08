# Liquid-Glass-Plan (Ergo CRM)

Stand: 27.08.2026

Anlass: genehmigtes Redesign auf die iOS-26-Anmutung „Liquid Glass". Dieses Dokument
haelt fest, **was** entschieden ist, nicht, wie es gebaut wurde — das steht im Diff.
Alle Design-Entscheidungen unten sind verbindlich, nicht zur Diskussion in dieser
Welle.

Welle 1 (dieser Branch, `redesign/liquid-glass`) legt das Fundament: Tokens,
Glas-System, Kopfzeile, gemeinsame Bausteine (`components/ui.ts` und die kleinen,
ueberall verwendeten Komponenten). Reines Re-Skin — keine Funktions-, Routen-, Text-
oder Strukturaenderung. Kein einzelner Bildschirm ist in Welle 1 fertig umgestellt:
jede Seite erbt die neuen Farb- und Schatten-Tokens automatisch (dieselbe Mechanik,
die schon den Dunkelmodus traegt), sieht aber erst nach ihrer eigenen Welle
vollstaendig nach Liquid Glass aus — Radien, Pillenform und Glas-Chrome muessen dort
noch ankommen.

---

## 1. Zielbild

iOS-26-Anmutung: weicher Tapeten-Canvas mit blauen Lichtflecken hinter allem,
halbtransparente Milchglas-Karten **ohne** `backdrop-filter`, echtes Glas (mit
`backdrop-filter`) **nur** auf schwebendem Chrome — Kopfzeile, Modal, Undo-Leiste.
iOS-Blau als einziger Akzent (loest Navy-als-Marke und Gold-als-Auszeichnung ab,
soweit sie Bedienelemente waren). Haarlinien statt harter Kanten, Pillen-Buttons,
Large-Title-Typografie. Hell und Dunkel sind gleichwertig — „das System entscheidet",
keine Ansicht ist die Standardansicht.

## 2. Token-Spec (`app/globals.css`)

Die bestehende Struktur (`@theme` fuer Farbrampen, ein separates `:root` fuer
Laufzeit-Werte wie Schatten, `.dark` kippt die Rampen um, `.buehne` kippt dauerhaft
dunkle Flaechen zurueck) bleibt unangetastet — nur Werte aendern sich, plus neue
Tokens kommen dazu.

- **Navy-Rampe → iOS-Blau-Rampe.** Dieselben elf Stufen (50–950), neue Werte:
  Akzent ist `#007aff` (hell) / `#0a84ff` (dunkel).
- **Flaechen.** `canvas` bekommt einen kuehlen Blauton (`#eef2f8` hell / `#0a101c`
  dunkel). `surface` (Karten, Felder, Chips) wird **Milchglas ohne Weichzeichner** —
  eine halbtransparente `rgba()`-Flaeche, kein `backdrop-filter`. `sunken`, `line`,
  `line-strong` folgen demselben Prinzip: leicht transparente Schwarz-/Weiss-Toene
  statt deckender Hex-Werte.
- **iOS-Pivots.** `red-500`, `amber-400`, `amber-500`, `emerald-500` kippen auf die
  iOS-Systemfarben (Anrufen-Gruen, Loeschen-Rot etc.). Alle anderen Stufen derselben
  Rampen bleiben Tailwind-Standard; die festen `fest-erfolg/-gefahr/-warnung`-Tokens
  und die Gold-Rampe bleiben komplett unveraendert.
- **Schatten.** Neu berechnet, kuehler und weicher (`schatten-karte/-hoch/-pop`,
  nur die hellen Werte — die dunklen bleiben wie sie waren).
- **Font-Stacks.** `-apple-system`/`BlinkMacSystemFont` vor Inter, `ui-monospace`/
  „SF Mono" vor Geist Mono — auf Apple-Geraeten greift das native Systemfont, sonst
  die bisherigen next/font-Fonts.

## 3. Glas-Rezept

Zwei getrennte Mechanismen, bewusst nicht verwechselt:

| Klasse | Wo erlaubt | Wie |
|---|---|---|
| `surface` (Token) | Karten, Chips, Felder, Flaechen — ueberall | Milchglas **ohne** Weichzeichner, nur Transparenz |
| `glas` / `glas-stark` / `glas-dunkel` (Utilities) | **nur** schwebendes Chrome: Kopfzeile, Modal, Undo-Leiste | echtes Glas: `backdrop-filter: blur() saturate()` |

`glas` = 18 px Blur, `glas-stark` = 24 px (staerker gesaettigt, fuer Kopfzeile und
Modal), `glas-dunkel` = 20 px auf einer fest dunklen Flaeche (Undo-Leiste — bleibt in
beiden Ansichten dunkles Glas, sonst waere die Pille im Hellmodus unlesbar).
Fallback-Kette: kein `@supports`-Treffer → satte Flaeche ohne Blur. Browser mit
`prefers-reduced-transparency: reduce` → dieselbe satte Flaeche, aktiv erzwungen.
Druckausgabe → weiss, kein Glas, kein Tapeten-Canvas.

Der Tapeten-Canvas selbst (`body::before`, drei radiale Verlaeufe in Blautoenen) ist
statisch, ohne Animation und bewusst ohne `background-attachment: fixed` (iOS-Falle:
ruckelt oder friert beim Scrollen ein).

## 4. Komponenten-Entscheidungen

- **Radius-System:** 16 px Karten (`rounded-2xl`), 12 px Felder (`rounded-xl`),
  Pille (voll gerundet) fuer Knoepfe und Badges.
- **Knoepfe:** `btnPrimary` und `btnSecondary` werden Pillen, `btnPrimary` zusaetzlich
  `font-semibold`. Fokusringe app-weit auf `outline-akzent` (loest `outline-navy-600`
  und `outline-gold-400` ab).
- **Titel:** `pageTitle` wird groesser und fetter (Large-Title-Anmutung, 34 px/700),
  `sectionTitle` etwas groesser (17 px).
- **Segmented Control:** ein einziger neuer Baustein in `components/ui.ts`
  (`segmentGruppe` + `segmentKnopf`) fuer alle Umschalter der App. In Welle 1 nur
  definiert, noch nicht verdrahtet — `Umschalter.tsx` und `WettbewerbNav.tsx` bauen
  ihre Umschalter bislang noch selbst.
- **Kopfzeile:** von dauerhaft dunkler „buehne" (Navy + Gold-Akzent, unabhaengig vom
  Farbmodus) auf `glas-stark`, die mit Hell/Dunkel mitkippt.
- **StageBadge:** Ring-Kontur faellt weg, wird randlose Tint-Kapsel — die Tonpalette
  selbst (`lib/pipeline.ts`) ist unveraendert.
- **Icons:** einheitlich `strokeWidth 1.5` (vorher 1.75; das Megafon-Icon war schon
  vorher bei 1.5 und musste nicht angefasst werden).

## 5. Wellenplan — Uebersicht

Sieben Wellen insgesamt. Welle 1 ist unten vollstaendig; Welle 2–7 rollen dasselbe
Vokabular Bildschirm fuer Bildschirm aus — genaue Reihenfolge und Zuschnitt pro Welle
werden jeweils beim Start dieser Welle festgelegt, nicht hier vorweggenommen.

| Welle | Inhalt |
|---|---|
| **1** | Fundament: Tokens, Glas-System, Kopfzeile/Navigation, Modal, Undo-Leiste, Logo, Icons, gemeinsame Bausteine (`ui.ts` + kleine Komponenten wie `Fortschritt`, `LeerZustand`, `Kennzahl`, `Ampel`, `StageBadge`, `PageSkeleton`) |
| **2–7** | Bildschirm- bzw. Bereichs-Wellen: bestehende Seiten auf die neuen `card`/`btn*`/`input*`/Radius-Tokens umstellen, `Umschalter.tsx`/`WettbewerbNav.tsx` auf `segmentGruppe`/`segmentKnopf` heben, `text-white`-Restrisiken aus Welle 1 (siehe QA-Bericht) pruefen und aufloesen, Icon-Assets (`public/icon.svg` u.a.) ggf. nachziehen |

Bewusst offen gelassen statt hier fixiert: welche Seite in welcher Welle drankommt.
Das ist eine Priorisierungsfrage, keine Design-Entscheidung, und gehoert an den
Anfang der jeweiligen Welle.

## 6. Nicht-Ziele

- Keine Funktions-, Routen-, Text- oder Strukturaenderung irgendeiner Art — reines
  Re-Skin.
- Kein Konfetti, keine Emojis, keine XP-Sprache.
- Keine neuen Navigationspunkte.
- `public/sw.js`, `middleware.ts`, Routen, Server-Actions, `prisma/`,
  `lib/features.ts`, `public/storno.html` bleiben unangetastet.
- Kein `backdrop-filter` auf Karten, Chips, Inputs oder auf Layout-Wrappern
  (AppShell-Huelle, `template.tsx`) — Containing-Block-Falle fuer `position: fixed`-
  Kindelemente. Echtes Glas bleibt strikt auf schwebendes Chrome beschraenkt.
- Kein `will-change`.
- `min-h-11`-Tippziele und `tabular-nums` bleiben ausnahmslos erhalten.
