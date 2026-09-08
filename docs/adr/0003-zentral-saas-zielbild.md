# Zielbild Zentral-SaaS: eine Plattform mit Mandanten — Umbau erst bei der ersten zahlenden Zusage

Das Cockpit soll fremden Strukturen als zentraler Dienst unter Adriens Regie offenstehen (echte Mandantentrennung, Preis je Kopf/Monat) — nicht als Franchise-Kopien je Struktur. Gebaut wird die Mandantentrennung aber erst, wenn die erste fremde Struktur zahlend zusagt.

## Kontext

Die Multiplikations-Runde (29.08.2026) hat ergeben: Innerhalb der eigenen Struktur ist das Cockpit längst multiplizierbar (Einladungslink, Willkommen, PWA). Eine fremde Struktur kann aber nicht in die bestehende Instanz — seit ADR 0001 sieht jede Person die gesamte Instanz-Struktur samt Kennzahlen, es gibt eine gemeinsame Rangliste, einen gemeinsamen Feed und `Person.name` ist global eindeutig. Der Weg für Fremde wäre heute eine eigene Kopie (eigenes Vercel + Supabase nach README, ~ein halber Tag).

Zur Wahl standen: (a) Franchise-Kopien — jede fremde Struktur betreibt ihr eigenes Deployment, kein fremdes Kundendatum bei Adrien; (b) Zentral-SaaS — eine Plattform, Mandantentrennung, Adrien ist Betreiber und Auftragsverarbeiter; (c) nichts festlegen. Es gibt bereits echten Inbound (Emil wurde gefragt, ob jemand anderes das Cockpit bekommen kann).

## Entscheidung

Adrien entscheidet (29.08.2026): **Zentral-SaaS**, kostenpflichtig ab Start (Modell je Kopf/Monat, Höhe offen). Der Mandanten-Umbau — `mandantId` durchs Schema und die vier instanzweiten Stellen (`app/(team)/leaderboard/page.tsx` findMany ohne Filter, `lib/feed.ts` ladeFeed, `lib/scope.ts` Umfang ALLE, `Person.name @unique`) — startet **erst bei der ersten zahlenden Zusage** einer fremden Struktur. Bis dahin gilt: eine Instanz ist eine Familie mit einer gemeinsamen Rangliste, einem gemeinsamen Feed und einer gemeinsamen Kernstufen-Runde.

*Nachtrag (29.08.2026, später am Tag):* ADR-0004 hat die Struktur-SICHT inzwischen enger gezogen (nur der Admin sieht die Gesamtstruktur, jede FK nur den eigenen Ast). Das ändert nichts an dieser Entscheidung: Rangliste, Feed, Puls und die Kernstufen-Runde bleiben instanzweit, `Person.name` bleibt global eindeutig — eine fremde Struktur in derselben Instanz bleibt darum bis zum Mandanten-Umbau ausgeschlossen.

## Konsequenzen

- Jeder neue Baustein muss den späteren Umbau billig halten: Abfragen nehmen explizite id-Listen statt eines impliziten „alle"; neue instanzweite Abfragen entstehen nur in `lib/` und tragen einen Kommentar, damit die spätere mandantId-Suche sie findet; neue Tabellen ohne zwingende Kanten (Beispiel `Anfrage`) bleiben beziehungslos.
- Adrien wird mit dem ersten fremden Mandanten formell Auftragsverarbeiter fremder Kundendaten: der AVV (Gate in `lib/avv.ts`) muss vorher echt sein, ein Datenexport existieren, und Preis heißt Rechnung — die Gewerbe-/Steuerfrage ist vor der ersten Zusage zu klären, nicht danach.
- Interessenten vor dem Umbau bekommen keinen Zugang zur bestehenden Instanz (Rangliste, Feed, Puls und Kernstufen-Runde sind instanzweit — fremde Berater stünden mitten in Team Dresdens Zahlen); sie warten, oder es gibt im Einzelfall bewusst eine Übergangs-Kopie — dann als dokumentierte Ausnahme.
- Die Einheiten-Sichtbarkeitsregeln (Kernstufen-Runde quer durch Äste) sind ab dem Umbau je Mandant zu denken; bis dahin bleibt `lib/scope.ts` unangetastet.
