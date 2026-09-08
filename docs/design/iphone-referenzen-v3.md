# iPhone-Referenzen und Anordnungsentwürfe v3

Stand: 8. September 2026. Recherche- und Entscheidungsnotiz für die Designplanung; keine App-Implementierung.

## Ausgangspunkt

Der Nutzer bevorzugt vorläufig **Variante B mit sattem Navy**. Die endgültige Auswahl bleibt offen. Die verbesserte Auffindbarkeit soll erhalten bleiben; Anordnung und Bedienmuster sollen stärker an gute iPhone-Apps anschließen. Ob diese Muster den Beratern vertrauter erscheinen und Orientierung erleichtern, ist eine zu prüfende Hypothese.

## Apple: Quelleninhalt und Übertragung

1. **Wenige Einstiege über einfachen Listen.** Quelle: Die offizielle Bildbeschreibung zu „Erinnerungen“ zeigt ein Raster intelligenter Listen mit Zählern; darunter folgen eigene Listen als Zeilen. Ableitung: Auf „Heute“ wenige Einstiege wie „Anrufe · 5“ und „Termine · 2“, anschließend konkrete Aufgaben. Kein Raster sämtlicher CRM-Funktionen. [Apple: Listen organisieren](https://support.apple.com/de-de/guide/iphone/iph2c6cf708e/ios)

2. **Person auswählen, dann handeln.** Quelle: Das aktuelle Kontakte-Handbuch beschreibt ein Suchfeld unten in der Kontaktliste, das auch Telefonnummern und Adressen durchsucht. Kommunikationsaktionen stehen im geöffneten Kontakt unter dem Namen. Ableitung: Klare Namenszeilen und eine gut erreichbare Suche; im Detail zuerst Name und Anlass, danach „Anrufen“, „Termin“ und „Notiz“. Die Suchposition ist zusammen mit der CRM-Navigation zu prüfen. [Apple: Kontakte hinzufügen und verwenden](https://support.apple.com/de-de/guide/iphone/iph3e0ca2db/ios)

3. **Agenda als Hauptansicht.** Quelle: Kalender bietet Listen einzelner Tage und eine vollständige Liste bevorstehender Ereignisse. Die offizielle Abbildung ist als Monatsansicht mit Ereignissen und Erinnerungen beschrieben. Ableitung: Mobil eine zeitlich geordnete Agenda mit Uhrzeit, Name und Anlass; der Monat bleibt über einen eindeutigen Ansichtswechsel erreichbar. [Apple: Kalenderdarstellungen](https://support.apple.com/de-de/guide/iphone/iphfd1054569/ios)

4. **Stabile Hauptnavigation.** Quelle: Apple empfiehlt Tabs für Bereiche, kurze Beschriftungen, sichtbare Ziele ohne Überlauf und erhaltenen Navigationszustand. Ableitung: Fünf feste Tabs; „Hinzufügen“ bleibt eine Aktion im jeweiligen Bereich. Die Navigationslogik lässt sich mit deckenden Navy-Flächen umsetzen. [Apple: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)

Für Apple wurden Seitentexte und offizielle Bildbeschreibungen geprüft; die Bilddateien waren nicht zuverlässig visuell zugänglich.

## Visuell geprüfte öffentliche App-Store-Referenzen

Die folgenden Beobachtungen stammen aus den für diese Planungsrunde visuell geprüften Store-Abbildungen, nicht aus angemeldeten oder privaten App-Versionen:

- [Trade Republic](https://apps.apple.com/de/app/trade-republic-broker-bank/id1410703839): Zinsübersicht mit ausgerichteten Spalten und Transaktionszeilen; Karteneinstellungen als Icon-Text-Zeilen; Wertpapierdetailseite mit großer Zahl und zwei unteren Aktionen. Übertragbar sind Ausrichtung, klare Zeilen und die Gewichtung weniger Aktionen.
- [Revolut](https://apps.apple.com/de/app/apple-store/id932493382): Große hervorgehobene Werte, Reihen runder beschrifteter Aktionen, darunter gruppierte Detailbereiche. Übertragbar ist diese Hierarchie. Fotografie und Farbverläufe werden für das CRM nicht übernommen.

## Drei geplante Anordnungsentwürfe

1. **Kennzahl und Aktionen:** Ein klarer Tageswert, wenige große beschriftete Aktionen, darunter Termine und Aufgaben.
2. **iPhone-Listen:** Wenige Einstiege mit Zählern, anschließend großzügige, ruhig gruppierte Zeilen.
3. **Tagesagenda:** Zeitliche Reihenfolge führt; Termine und fällige Rückrufe erhalten klar unterscheidbare Einträge.

Alle verwenden dieselbe vorhandene Navy-Palette und dieselben fünf Tabs: Heute, Kontakte, Kalender, Zahlen, Team. Unterseiten bieten einen eindeutigen Rückweg; keine Glasoptik. Gestaltung darf wichtige Handlungen nicht ausschließlich hinter Gesten verstecken.

Die Generierungsbilder vergleichen Anordnung und visuellen Eindruck. Sie belegen weder ausreichende Touch-Flächen noch WCAG-AA-Kontrast. Bedienbarkeit, Rückwege, große Systemschrift und messbare Kontraste müssen später am tatsächlichen Prototyp geprüft werden. Nutzervertrautheit wurde bisher nicht getestet.
