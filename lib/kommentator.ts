// Der Kommentator (docs/wettbewerb-plan.md, Abschnitt 6).
//
// Feste Bausteine, regelbasiert ausgewaehlt. Kein Modell zur Laufzeit: Kosten,
// Wartezeit - und ein Witz ueber einen echten Kollegen ist genau einmal daneben
// zu viel.
//
// DIE REGEL, die ueber allem steht: Der Kommentator nennt nie jemanden, der
// nichts getan hat. Er berichtet Ereignisse, niemals Abwesenheit. Wer heute
// noch nicht dran war, erfaehrt das auf seiner eigenen Seite - und sonst
// niemand. Das ist die Grenze zwischen witzig und Pranger.

export type Lage = {
  /** Namen und Punkte, absteigend sortiert. Leer = noch nichts geloggt. */
  spitze: { name: string; punkte: number }[];
  /** Wie viele Koepfe heute schon geloggt haben. */
  heuteAktiv: number;
  /** Wie viele Koepfe es ueberhaupt gibt. */
  koepfe: number;
  /** Stunden bis zum Abpfiff, gerundet. Negativ = Spieltag vorbei. */
  stundenBisAbpfiff: number;
  /** Laengste laufende Serie im Netzwerk. */
  serie: { name: string; tage: number } | null;
  /** Ein Abschluss heute? */
  abschlussHeute: { name: string } | null;
};

// "1 Punkt", "2 Punkte" - der Kommentator ist das Gesicht der Arena, ein
// falscher Plural faellt dort mehr auf als irgendwo sonst.
export function punkteText(n: number): string {
  return `${n} ${n === 1 ? "Punkt" : "Punkte"}`;
}

export function kommentar(lage: Lage): string {
  const [erster, , dritter] = lage.spitze;

  // Ein Abschluss schlaegt alles andere - das ist der seltenste Moment.
  if (lage.abschlussHeute) {
    return `${lage.abschlussHeute.name} hat abgeschlossen. Die Woche ist damit gelaufen — im guten Sinn.`;
  }

  // Noch gar nichts: die Woche ist offen, und das ist eine gute Nachricht.
  if (!erster) {
    if (lage.stundenBisAbpfiff <= 0) return "Spieltag vorbei. Montag geht es von vorn los.";
    return "Noch keine Zahl auf dem Board. Wer jetzt anfängt, führt.";
  }

  // Endspurt schlaegt den Zwischenstand.
  if (lage.stundenBisAbpfiff > 0 && lage.stundenBisAbpfiff <= 4) {
    return `Abpfiff in ${lage.stundenBisAbpfiff} ${lage.stundenBisAbpfiff === 1 ? "Stunde" : "Stunden"}. Wer noch was vorhat, hat noch was vor.`;
  }

  if (lage.stundenBisAbpfiff <= 0) {
    return `Spieltag vorbei. ${erster.name} gewinnt mit ${punkteText(erster.punkte)}.`;
  }

  // Enges Rennen an der Spitze.
  if (dritter && erster.punkte - dritter.punkte <= 10) {
    const abstand = erster.punkte - dritter.punkte;
    return `Zwischen Platz 1 und Platz 3 liegen ${abstand} ${abstand === 1 ? "Punkt" : "Punkte"}. Das entscheidet ein einziger Nachmittag.`;
  }

  // Eine lange Serie ist die ehrlichste Leistung im ganzen Board.
  if (lage.serie && lage.serie.tage >= 5) {
    return `${lage.serie.name} loggt den ${lage.serie.tage}. Tag in Folge. Irgendwann ist das keine Serie mehr, sondern ein Charakterzug.`;
  }

  // Ruhiger Tag: ueber die Zahl reden, nie ueber die Fehlenden.
  if (lage.koepfe >= 3 && lage.heuteAktiv > 0 && lage.heuteAktiv * 2 < lage.koepfe) {
    return `Ruhiger Tag im Netzwerk: ${lage.heuteAktiv} von ${lage.koepfe} waren schon dran.`;
  }

  if (lage.heuteAktiv === 0) {
    return `${erster.name} führt mit ${punkteText(erster.punkte)}. Heute hat das Board noch keiner angefasst.`;
  }

  return `${erster.name} führt mit ${punkteText(erster.punkte)}. ${lage.heuteAktiv} von ${lage.koepfe} waren heute schon dran.`;
}

// Zeile fuer die eigene Lage - hier und NUR hier darf Abwesenheit vorkommen.
export function eigenerHinweis(opts: {
  heuteGeloggt: boolean;
  punkte: number;
  bestmarke: number | null;
  platz: number | null;
  ueberholtVon: string | null;
}): string | null {
  if (opts.ueberholtVon) {
    return `${opts.ueberholtVon} ist an dir vorbeigezogen.`;
  }
  if (!opts.heuteGeloggt) {
    return "Du warst heute noch nicht dran.";
  }
  if (opts.bestmarke !== null && opts.punkte > 0 && opts.punkte >= opts.bestmarke) {
    return `${punkteText(opts.punkte)} — das ist deine beste Woche.`;
  }
  if (opts.bestmarke !== null && opts.bestmarke > opts.punkte) {
    const fehlen = opts.bestmarke - opts.punkte;
    return `${punkteText(opts.punkte)} diese Woche. Deine beste Woche stand bei ${opts.bestmarke} — fehlen ${fehlen}.`;
  }
  return null;
}

// Der Abstand zum Vordermann, umgerechnet in Handlungen. Punkte sind abstrakt,
// sieben Anrufe sind ein Nachmittag.
export function abstandInHandlungen(punkte: number): string {
  if (punkte <= 0) return "";
  if (punkte % 10 === 0) {
    const n = punkte / 10;
    return n === 1 ? "Das ist ein Abschluss." : `Das sind ${n} Abschlüsse.`;
  }
  if (punkte % 5 === 0) {
    const n = punkte / 5;
    return n === 1 ? "Das ist ein gehaltener Termin." : `Das sind ${n} gehaltene Termine.`;
  }
  if (punkte % 3 === 0) {
    const n = punkte / 3;
    return n === 1 ? "Das ist ein vereinbarter Termin." : `Das sind ${n} vereinbarte Termine.`;
  }
  return punkte === 1 ? "Das ist ein Anruf." : `Das sind ${punkte} Anrufe.`;
}
