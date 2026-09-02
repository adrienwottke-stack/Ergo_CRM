# 0006 — Der sichtbare Name wandert, die technischen Schlüssel sind eingefroren

Stand: 01.09.2026 · Status: angenommen

## Kontext

Die App hieß „Ergo CRM", seit Runde 1 (AP-14, 29.08.2026) „Cockpit", und heißt ab Runde 2 „Tracker" — Emils Ansage, und es wird nicht die letzte Umbenennung sein. Der Name steht in Logo, Metadaten, Manifest und Texten. Er steckt aber auch in technischen Schlüsseln, die nie ein Nutzer sieht: dem Installations-Cookie `__ergoInstall`, dem Cache-Namen des Service Workers, dem `sessionStorage`-Schlüssel `cockpit-vorfuehren`, den UIDs der Kalendereinträge im ICS-Feed, dem `id`/`start_url` des Web-Manifests.

## Entscheidung

Umbenannt werden **ausschließlich nutzersichtbare Zeichenketten**. Alle technischen Schlüssel bleiben byte-identisch — auch wenn sie damit einen Namen tragen, den die App nicht mehr führt. Kommentare dürfen den alten Namen behalten.

## Warum

Jeder dieser Schlüssel ist ein Vertrag mit etwas, das außerhalb des Deploys lebt:

- **Cookie / Session-Schlüssel:** umbenennen loggt jeden Nutzer aus — und die Zielgruppe hat nach Runde 1 gerade erst gelernt, sich einzuloggen.
- **Manifest-`id` / Cache-Name:** umbenennen spaltet installierte PWAs: die alte Installation bleibt am Homescreen, eine zweite kommt dazu, beide mit eigenem Zustand.
- **Kalender-UIDs:** umbenennen erzeugt in jedem abonnierenden Kalender jeden Termin ein zweites Mal — und beim Rückweg über TimeTree ein Echo.

Die Alternative — einmal sauber durchbenennen und die Nebenwirkungen in Kauf nehmen — wurde in Runde 1 (D8) verworfen und gilt jetzt umso mehr: Der Name wechselt schneller als die Nutzer ihre Installationen erneuern.

## Folgen

- Ein künftiger Leser findet `ergo` und `cockpit` in Schlüsseln einer App namens Tracker. Das ist Absicht, kein Versäumnis.
- Installierte PWAs zeigen nach dem Deploy weiter den alten Namen, bis der Nutzer neu installiert. Das Manifest-`name` ändert sich, die `id` nicht.
- Wer einen Schlüssel dennoch umbenennen will, plant die Migration des Zustands mit (Cookie-Übernahme, Cache-Umzug, UID-Mapping) — nicht als Teil einer Umbenennung.
