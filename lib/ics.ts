// Termine als Kalenderdatei (RFC 5545).
//
// Warum ICS und keine Google-/Outlook-Anbindung: Das Kernmodell verlangt
// "Kalender im Tool" und Erinnerungen. Eine echte Anbindung waere ein
// OAuth-Projekt je Anbieter, mit Tokens, Ablauf und Nachpflege - und der
// Partner haette am Ende genau das, was eine ICS-Datei auch liefert: den
// Termin in dem Kalender, den er ohnehin auf dem Handy hat, samt dessen
// Erinnerung.
//
// Der VALARM ist deshalb kein Beiwerk, sondern der eigentliche Zweck: die
// Erinnerung kommt vom Telefon, nicht von uns. Ein Werkzeug ohne
// Push-Infrastruktur soll nicht so tun, als koennte es wecken.

const ZEILENENDE = "\r\n";

/** UTC-Zeitstempel im ICS-Format: 20260824T173000Z */
function icsZeit(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

// Zeilenumbrueche, Kommas und Semikolons haben in ICS Bedeutung.
function maskiere(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Zeilen ueber 75 Oktetts muessen gefaltet werden. Streng genommen zaehlen
// Oktetts, nicht Zeichen - bei Umlauten wird hier also frueher umgebrochen als
// noetig. Das ist erlaubt und spart eine Byte-Zaehlung.
function falte(zeile: string): string {
  if (zeile.length <= 73) return zeile;
  const teile: string[] = [zeile.slice(0, 73)];
  let rest = zeile.slice(73);
  while (rest.length > 72) {
    teile.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  if (rest.length > 0) teile.push(` ${rest}`);
  return teile.join(ZEILENENDE);
}

export type IcsTermin = {
  id: string;
  name: string;
  at: Date;
  /** Minuten. Ohne Angabe eine Stunde - so lange dauert ein Beratungstermin. */
  dauerMinuten?: number;
  notiz?: string | null;
  telefon?: string | null;
  /** Minuten vor dem Termin. 0 schaltet die Erinnerung ab. */
  erinnerungMinuten?: number;
};

export function icsDatei(termine: IcsTermin[], jetzt = new Date()): string {
  const zeilen: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ergo CRM//Termine//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const termin of termine) {
    const ende = new Date(
      termin.at.getTime() + (termin.dauerMinuten ?? 60) * 60_000
    );
    const erinnerung = termin.erinnerungMinuten ?? 60;
    const beschreibung = [
      termin.telefon ? `Telefon: ${termin.telefon}` : null,
      termin.notiz,
    ]
      .filter(Boolean)
      .join("\n");

    zeilen.push(
      "BEGIN:VEVENT",
      `UID:${termin.id}@ergo-crm`,
      `DTSTAMP:${icsZeit(jetzt)}`,
      `DTSTART:${icsZeit(termin.at)}`,
      `DTEND:${icsZeit(ende)}`,
      falte(`SUMMARY:${maskiere(`Termin mit ${termin.name}`)}`),
      ...(beschreibung ? [falte(`DESCRIPTION:${maskiere(beschreibung)}`)] : [])
    );

    if (erinnerung > 0) {
      zeilen.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        falte(`DESCRIPTION:${maskiere(`Termin mit ${termin.name}`)}`),
        `TRIGGER:-PT${erinnerung}M`,
        "END:VALARM"
      );
    }

    zeilen.push("END:VEVENT");
  }

  zeilen.push("END:VCALENDAR");
  return zeilen.join(ZEILENENDE) + ZEILENENDE;
}
