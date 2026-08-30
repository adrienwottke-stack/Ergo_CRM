// Probe der reinen Rechenkerne: Stufen, Meilensteine und der Ausbau.
//
// Das Projekt hat keinen Test-Laeufer. "Pruefbar" heisst hier: die Funktionen
// sind so gebaut, dass ein Skript sie mit Beispieldaten durchspielen kann -
// ohne Datenbank, ohne Anmeldung, ohne Browser. Genau dafuer sind sie rein.
//
//   node scripts/logik-probe.mjs
//
// lib/titel.ts fehlt hier bewusst: die Datei importiert ueber den @/-Alias,
// den node ausserhalb von Next nicht aufloest. Der reine Kern titelStaende()
// waere pruefbar, die Datei als ganze nicht - das aufzubrechen waere ein
// eigener Umbau und ist es fuer drei Titel nicht wert.
//
// Schreibt nichts und darf jederzeit erneut laufen.

import { stufeVon } from "../lib/stufen.ts";
import { offeneMeilensteine, meilensteinZuSchluessel } from "../lib/meilensteine.ts";
import { bereichVon, darfSehen, sperreFuer, titelVon } from "../lib/ausbauSicht.ts";

let fehler = 0;

function pruefe(name, ist, soll) {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (ok) {
    console.log(`  ok     ${name} -> ${JSON.stringify(ist)}`);
  } else {
    fehler += 1;
    console.log(`  FEHLER ${name}: ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
  }
}

console.log("Stufen");
pruefe("0 Punkte", stufeVon(0).stufe.name, "Anwärter");
pruefe("0 bis zur naechsten", stufeVon(0).bisNaechste, 25);
pruefe("24 - knapp drunter", stufeVon(24).stufe.name, "Anwärter");
pruefe("25 - genau die Schwelle", stufeVon(25).stufe.name, "Anrufer");
pruefe("45 - bester Kopf am 25.08.", stufeVon(45).stufe.name, "Anrufer");
pruefe("45 bis Terminjaeger", stufeVon(45).bisNaechste, 15);
pruefe("hoechste Stufe", stufeVon(9999).stufe.name, "Veteran");
pruefe("hoechste hat keine naechste", stufeVon(9999).naechste, null);
pruefe("negativ faellt auf null", stufeVon(-5).stufe.name, "Anwärter");

console.log("\nMeilensteine");
const heute = new Map([
  ["NUMBERS_PULLED", 27],
  ["CALL", 3],
]);
pruefe(
  "27 Nummern - nur die hoechste Schwelle",
  offeneMeilensteine(heute, new Set()).map((m) => m.schluessel),
  ["nummern25"]
);
pruefe("Text der Meldung", offeneMeilensteine(heute, new Set())[0].text, "25 Nummern gezogen");
pruefe("schon gemeldet verschwindet", offeneMeilensteine(heute, new Set(["nummern25"])).length, 0);
pruefe(
  "unter der Schwelle - nichts",
  offeneMeilensteine(new Map([["NUMBERS_PULLED", 9]]), new Set()).length,
  0
);

// Das ist der Riegel: der Schluessel kommt aus einem versteckten Formularfeld
// und ist damit Nutzereingabe. Wer "nummern50" faelscht, darf nichts melden.
pruefe("gefaelschte Schwelle wird abgewiesen", meilensteinZuSchluessel("nummern50", heute), null);
pruefe("erfundener Schluessel wird abgewiesen", meilensteinZuSchluessel("quatsch99", heute), null);
pruefe("echter Schluessel geht durch", meilensteinZuSchluessel("nummern25", heute)?.wert, 25);


// --- Ausbau (docs/ausbau-plan.md) -------------------------------------------
//
// Die zwei Achsen: stufe (1 -> 2, von der Fuehrungskraft gesetzt) und fuehrt
// (haengt jemand unter mir). Sie kreuzen sich frei - genau das ist hier die
// interessante Stelle.

console.log("");
console.log("Ausbau");

const anfang = { stufe: 1, fuehrt: false, istAdmin: false };
const fkAmAnfang = { stufe: 1, fuehrt: true, istAdmin: false };
const voll = { stufe: 2, fuehrt: false, istAdmin: false };
const admin = { stufe: 1, fuehrt: false, istAdmin: true };

pruefe("unbekannte Adresse gilt als Anfang", bereichVon("/namen/sammeln"), "anfang");
pruefe("Unterseite erbt den Bereich", bereichVon("/mannschaft/abc123"), "fuehrung");
// Der Praefix darf nicht auf einen laengeren Namen passen.
pruefe("/teamabend ist nicht /team", bereichVon("/teamabend"), "fuehrung");
pruefe("/team bleibt Admin", bereichVon("/team"), "admin");

pruefe("Anfang sieht die Namensliste", darfSehen("/namen", anfang), true);
pruefe("Anfang sieht den Kalender", darfSehen("/kalender", anfang), true);
pruefe("Anfang sieht Einladen", darfSehen("/einladen", anfang), true);
pruefe("Anfang sieht den Trichter nicht", darfSehen("/trichter", anfang), false);
pruefe("Anfang sieht die Mannschaft nicht", darfSehen("/mannschaft", anfang), false);

// Der Kern des Modells: die Achsen sind unabhaengig.
pruefe("FK auf Stufe 1 sieht die Mannschaft", darfSehen("/mannschaft", fkAmAnfang), true);
pruefe("FK auf Stufe 1 sieht den Trichter NICHT", darfSehen("/trichter", fkAmAnfang), false);
pruefe("Stufe 2 ohne Leute sieht den Trichter", darfSehen("/trichter", voll), true);
pruefe("Stufe 2 ohne Leute sieht die Mannschaft NICHT", darfSehen("/mannschaft", voll), false);

// Der Admin ist der Notausgang der Mechanik und darf nirgends anstossen.
pruefe("Admin sieht die Werkstatt", darfSehen("/werkstatt", admin), true);
pruefe("Admin sieht alles trotz Stufe 1", darfSehen("/trichter", admin), true);
pruefe("Nicht-Admin sieht die Werkstatt nicht", darfSehen("/werkstatt", voll), false);

// sperreFuer ist bewusst NICHT !darfSehen: Admin-Bereiche laufen weiter ueber
// requireAdmin() in der Seite, nicht ueber den Ausbau-Waechter im Layout.
pruefe("Waechter sperrt den Trichter", sperreFuer("/trichter", anfang), "voll");
pruefe("Waechter sperrt die Mannschaft", sperreFuer("/mannschaft", anfang), "fuehrung");
pruefe("Waechter laesst /team durch", sperreFuer("/team", anfang), null);
pruefe("Waechter laesst den Anfang durch", sperreFuer("/namen", anfang), null);
pruefe("Waechter laesst den Admin durch", sperreFuer("/trichter", admin), null);

pruefe("Titel fuer die Sperrseite", titelVon("/trichter"), "Der Trichter");
pruefe("Titel faellt zurueck", titelVon("/irgendwas"), "Die Seite");
console.log(fehler === 0 ? "\nAlles sauber." : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
