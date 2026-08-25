// --- Der Volltext -------------------------------------------------------------
// PLATZHALTER. Hier gehoert der Vertragstext hinein, den Ergo bzw. Ihr
// Datenschutzbeauftragter freigibt - und er muss Wort fuer Wort dem PDF unter
// public/avv/avv-<fassung>.pdf entsprechen. Zwei Fassungen desselben Vertrags,
// eine gelesen und eine zugeschickt, sind der Fehler, den dieses Gate gerade
// verhindern soll.
//
// Beim Aendern des Textes IMMER AVV_VERSION in lib/avv.ts mit erhoehen. Sonst
// liest der naechste Nutzer einen neuen Vertrag, waehrend in der Datenbank
// steht, er habe dem alten zugestimmt.
export const AVV_ABSCHNITTE: { titel: string; absaetze: string[] }[] = [
  {
    titel: "§ 1 Gegenstand und Dauer des Auftrags",
    absaetze: ["[Vertragstext einsetzen]"],
  },
  {
    titel: "§ 2 Art, Umfang und Zweck der Verarbeitung",
    absaetze: ["[Vertragstext einsetzen]"],
  },
  {
    titel: "§ 3 Kategorien betroffener Personen und Datenarten",
    absaetze: ["[Vertragstext einsetzen]"],
  },
  {
    titel: "§ 4 Pflichten des Auftragsverarbeiters",
    absaetze: ["[Vertragstext einsetzen]"],
  },
  {
    titel: "§ 5 Technische und organisatorische Massnahmen (Art. 32 DSGVO)",
    absaetze: ["[Vertragstext einsetzen]"],
  },
  {
    titel: "§ 6 Unterauftragsverhaeltnisse",
    absaetze: ["[Vertragstext einsetzen]"],
  },
  {
    titel: "§ 7 Rechte der betroffenen Personen",
    absaetze: ["[Vertragstext einsetzen]"],
  },
  {
    titel: "§ 8 Loeschung und Rueckgabe der Daten",
    absaetze: ["[Vertragstext einsetzen]"],
  },
];
