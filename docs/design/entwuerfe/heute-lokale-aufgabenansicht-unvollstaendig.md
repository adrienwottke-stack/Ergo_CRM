# Entwurf: lokale vollständige Aufgabenansicht auf Heute

> **Status: unvollständig und nicht integriert.** Der begonnene Produktcode
> wurde vor dem gemeinsamen Commit vollständig zurückgenommen. Dieses Dokument
> hält ausschließlich die bereits erarbeitete Architektur und die vorgesehenen
> Anschlüsse fest. Es beschreibt keinen ausgelieferten Stand.

## Anlass und belegte Grenze

Der Wechsel von `/heute` zu `/heute?alle=1#eigene-arbeit` blieb im untersuchten
Produktionslauf gelegentlich vor dem sichtbaren React-DOM-Commit stehen. Die
Routermarker belegten für den betroffenen Lauf einen erfolgreich dekodierten
Flight-Inhalt, den Eintritt in `serverPatchReducer`, dessen erfolgreiches
`handleMutable` und das abschließende Auflösen der Action Queue ohne Verwerfen.
Die fachlichen Abfragen und die erreichbaren Datensätze waren dabei vollständig.

Die vollständige Aufgabenliste soll deshalb als lokale Ansicht derselben
serverseitig geladenen Daten umgesetzt werden. Der Ansichtswechsel darf keinen
weiteren RSC-Abruf, Reload, Timer oder Retry auslösen.

## Vorgesehene Architektur

Die Server-Seite `app/(app)/heute/page.tsx` behält sämtliche vorhandenen
Abfragen, Filter, Zählregeln und Server Actions. Sie lädt weiterhin die vollen
Listen und übergibt einer einzigen, klar benannten Client-Grenze:

- offene Terminergebnisse,
- übrige heutige Aufgaben,
- Schritte dieser Woche,
- Kontakte ohne nächsten Schritt,
- den initialen SSR-Zustand aus `searchParams.alle`.

Eine Komponente `HeuteAufgabenAnsicht` hält den lokalen booleschen Zustand
`alle`. Der erste Client-Render muss exakt dem SSR-Ergebnis entsprechen. In der
Übersicht rendert sie dieselben Dreier-Vorschauen und unveränderten Zähler wie
bisher; in der Vollansicht verwendet sie die bereits übergebenen vollständigen
Arrays. Der hervorgehobene primäre Kontakt bleibt aus den nachfolgenden Aufgaben
ausgeschlossen.

Die Umschalter bleiben echte Anker mit den bestehenden Zielen:

- `/heute?alle=1#eigene-arbeit`
- `/heute?alle=1#weitere-schritte`
- `/heute`

Nur ein unveränderter primärer Linksklick im selben Fenster wird lokal
übernommen. Mittlere Maustaste, `Ctrl`, `Cmd`, `Shift`, `Alt`, `target` und
`download` bleiben dem Browser überlassen. Dadurch funktionieren neuer Tab und
Tastaturbedienung weiterhin über die direkte SSR-URL.

Beim lokalen Wechsel schreibt die Komponente mit einem normalen
`window.history.pushState` den echten URL-Zustand. Es ist kein globales Patchen
von History vorgesehen. Ein `popstate`-Listener synchronisiert Zurück und Vor.
Das Hashziel wird nach dem lokalen React-Commit in einer Wirkung mit
`scrollIntoView` angesprungen; dafür ist kein Timer vorgesehen.

## Rückwege und Navigation

Kontaktlinks werden in der Client-Grenze aus dem aktuellen Ansichtsstatus
gebildet:

```text
/contacts/<id>?zurueck=%2Fheute
/contacts/<id>?zurueck=%2Fheute%3Falle%3D1
```

Das gilt für normale Aufgabenzeilen, offene Terminergebnisse und den primären
Kontakt. Für die Hauptaktion war ein kleiner `HeuteRueckwegLink` vorgesehen:
Die Server-Seite liefert nur das Profilziel, die Client-Komponente ergänzt den
jeweils aktuellen, URL-kodierten Rückweg. Derselbe Anschluss kann für eine
primäre Partneraktion verwendet werden, ohne `PartnerBegleitung` doppelt zu
rendern oder deren Daten erneut zu laden.

Der aktive Navigationseintrag „Heute“ soll ausschließlich dann lokal auf
`/heute` zurücksetzen, wenn sich der Browser bereits auf `/heute?alle=1`
befindet. Vorgesehen war dafür ein eng begrenzter Klickanschluss in
`components/NavLinks.tsx`, der dieselbe Prüfung auf einen unveränderten
Linksklick verwendet. Alle anderen Navigationseinträge und Heute-Aufrufe von
anderen Seiten bleiben normale Next-Navigationen.

## Noch nicht umgesetzt

- Client-Grenze und lokale History-Synchronisierung
- clientseitige Darstellung der bestehenden Aufgaben- und Terminzeilen
- dynamischer Rückweg der primären Kontakt- beziehungsweise Partneraktion
- gezielter Reset über den bereits aktiven Heute-Navigationseintrag
- statische Typ- und Lintprüfung sowie Produktions- und Browserabnahme

Die vier zwischenzeitlich gesetzten `prefetch={true}`-Attribute an den
Heute-Umschaltern gehören nicht zu diesem Entwurf. Sie waren kein erfolgreicher
Fix und wurden vor dem gemeinsamen Commit entfernt.
