# Zinsrechner im Cockpit

Stand: 14. September 2026. Native Integration der bisherigen Netlify-App unter
`/zinsrechner`, für alle angemeldeten Nutzer. Einstieg auf Heute nach der
Hauptaktion, auf der Kontaktseite und über die Suche (z. B. Zinseszins,
Sparplan, Rendite). Die fünf Hauptbereiche bleiben bestehen.

## Kundengespräch

- Startkapital, monatliche Sparrate, Laufzeit und Renditeannahme direkt eingeben
  oder per Regler verändern; einschließlich null und negativer Rendite.
- Diagramm mit Einzahlungen, Modellkapital, Tagesgeldvergleich und optionalem
  späteren Start. Jahreswerte per Zeiger oder Tastatur abrufbar.
- Wunschziele und eigene Zielbeträge mit erstem erreichten Jahresstand.
- Auf kleinen Bildschirmen bleibt das Ergebnis beim Einstellen sichtbar.
- Vorführmodus über die gesamte Ansicht mit ausgeblendeter Navigation und
  privater Szenarienliste, Fokusbegrenzung und Escape zum Beenden.
- PNG mit Kundenname, Annahmen, Ergebnissen, Vergleich und Beraterkontaktdaten
  aus dem Profil. Lokale Erzeugung ohne externen Bilddienst.

## Berechnung und Quellen

Effektiver Jahreszins wird in einen monatlichen Zins umgerechnet;
Einzahlungen erfolgen zu Monatsbeginn wie im Original. Beträge werden erst
für die Anzeige gerundet. Ein späterer Start verschiebt Startkapital und
Sparraten bei gleichem Endzeitpunkt. Die UI nennt auch die dadurch fehlenden
Einzahlungen. Wunschziele beziehen sich auf jährliche Stützpunkte.

Renditevoreinstellungen sind ausdrücklich Beispielannahmen. Die Darstellung
benennt Kosten, Steuern, Inflation und Verlustrisiken. Die monatliche Entnahme
ist ein vereinfachtes Rechenbeispiel, keine garantierte Rente.

Historie: MSCI World Net Returns, USD, vollständige Kalenderjahre 2012–2025;
gegen das MSCI-Factsheet vom 31. August 2026 geprüft. Die ältere Reihe aus dem
Original wurde nicht ungeprüft übernommen. Quelle:
https://www.msci.com/documents/10199/255599/msci-world-index-usd-net.pdf

## Speicherung

Migration `20260914130000_zinsrechner` erstellt `ZinsSzenario` und den aktiven
Feature-Schalter `zinsrechner`. Jeder Stand gehört einem Nutzer und optional
einem seiner Kontakte. Gespeicherte Berechnungen sind privat, einschließlich
gegenüber Teamleitern. Eine Kontaktübertragung überträgt private Berechnungen
nicht; der bisherige Eigentümer verliert den Zugriff. Löschung des Nutzers
oder Kontakts entfernt zugehörige Berechnungen per Cascade.

Die JSON-API prüft Anmeldung, AVV, Feature-Schalter, Origin, Eingabegrenzen und
Besitzrechte. Versionsprüfung verhindert Überschreiben durch veraltete Geräte;
identische Wiederholungen nach einem verlorenen Netzwerkresultat sind
idempotent. Antworten sind nicht cachebar. Speichern ist ausdrücklich; ein
Fehler erhält den Entwurf auf der geöffneten Seite.

## Prüfung und lokale Vorschau

`npm run test:zinsrechner`: 20 Tests bestanden (Mathematik, Grenzfälle,
Suche, reale Migrationen in PGlite, Zugriffsschutz, Konflikte, API).
Gezieltes ESLint ohne Befund. Produktionsbuild einschließlich Typprüfung
bestanden mit:

```powershell
node --import ./scripts/alias-hook.mjs scripts/zinsrechner-build-check.mjs
```

Der Build verwendet eine eigene In-Memory-Datenbank, `.cache/zinsrechner-next`
und eine separate TypeScript-Konfiguration. Keine reale Datenbank wird
migriert. Das bestehende `npm run build` ist hierfür ungeeignet, da es
`prisma migrate deploy` ausführt.

Browserprüfung in isolierter Testinstanz: Heute-Einstieg, Werte ändern,
Wunschziel und späterer Start, Kontakt zuordnen, speichern, nach Neuladen
wieder öffnen, direkter Kontaktplan, PNG (1080 × 1490 im Beispiel),
Vorführmodus und Escape. Breiten 320, 390, 820 und 1280 px; kein horizontaler
Überlauf an den geprüften kleinen Breiten. Mobile Ergebnisleiste sitzt unter
der App-Kopfzeile; der Vorführmodus wird außerhalb der Seitenanimation
gerendert. Kein physischer iPhone-/Safari-Test.

Zusätzlich mit dem gebauten Produktionsstand (`next start`) geprüft:
Anmeldung, Heute-Einstieg, Sparrate ändern, speichern, vollständiges Neuladen
und gespeicherten Stand wieder öffnen. Der sichtbare Speicherablauf und die
Wiederherstellung funktionieren auch dort (450 Euro monatlich, 30 Jahre,
5.000 Euro Start, 7 Prozent: 567.290 Euro angezeigtes Modell-Endkapital).

```powershell
npm run preview:zinsrechner
```

Die Vorschau verwendet ausschließlich künstliche Konten und Kontakte.
Standardadresse: `http://localhost:3123/login`.
Testkonto: `rechner-berater@example.test`, Passwort: `Rechner-Test-2026!`.
Ein Neustart leert die Testdaten. Produktionsvorschau nach obigem Build:

```powershell
$env:CRM_TEST_PRODUCTION = '1'
$env:CRM_TEST_DIST_DIR = '.cache/zinsrechner-next'
$env:CRM_TEST_TSCONFIG = '.cache/zinsrechner/tsconfig.json'
$env:ZINSRECHNER_TEST_PORT = '3124'
npm run preview:zinsrechner
```

## Übergabestatus

Lokale Implementierung; kein Commit, Push oder öffentliches Deployment.
Die neue Migration wurde nur in Testdatenbanken angewandt. Die echte
Veröffentlichung muss Code und Migration gemeinsam ausrollen.
Parallel vorhandene Änderungen anderer Aufgaben wurden erhalten. In der
parallel entstandenen Mini-Emil-Migration wurde lediglich die falsche
Feature-Spalte `name` auf das vorhandene `titel` korrigiert, damit die
Migrationen gemeinsam ausführbar sind.
