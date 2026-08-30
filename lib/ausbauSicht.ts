// Der reine Teil des Ausbaus: was wo sichtbar ist (docs/ausbau-plan.md).
//
// Steht getrennt von lib/ausbau.ts, weil der Wegweiser im Schnellzugriff eine
// CLIENT-Komponente ist und diese Regeln braucht. Zoege er lib/ausbau.ts
// herein, kaeme Prisma mit ins Browser-Buendel. Dasselbe Muster wie
// lib/einheitenAnzeige.ts neben lib/einheiten.ts.
//
// Hier steht keine Datenbank und kein React. Nur Regeln, die sich testen
// lassen, ohne irgendetwas zu starten.

export const AUSBAU_ANFANG = 1;
export const AUSBAU_VOLL = 2;

/**
 * Was eine Seite oder ein Baustein wissen muss.
 *
 * DAS MODELL SIND ZWEI ACHSEN, NICHT EINE LEITER:
 *
 *   stufe   1 -> 2    Die Fuehrungskraft setzt sie. Gespeichert. Nur aufwaerts.
 *   fuehrt  ja/nein   Haengt ein einloggbares Konto unter mir? Nie gespeichert.
 *
 * Sie kreuzen sich frei: eine Fuehrungskraft auf Stufe 1 sieht die Mannschaft,
 * aber keinen Trichter. Das ist gewollt - wer fuehrt, muss fuehren koennen, und
 * das hat mit dem eigenen Ausbaustand nichts zu tun.
 */
export type Ausbaustand = {
  stufe: number;
  fuehrt: boolean;
  istAdmin: boolean;
};

export type Bereich = "anfang" | "voll" | "fuehrung" | "admin";

/**
 * Die Adressen je Bereich.
 *
 * Alles, was hier NICHT steht, gilt als "anfang" - dieselbe Regel wie bei den
 * Feature-Schaltern (fehlt die Zeile, ist der Baustein an). Eine vergessene
 * Adresse darf niemals versehentlich eine Seite verstecken; sie darf hoechstens
 * eine zu frueh zeigen, und das faellt beim Hinsehen auf.
 */
const BEREICHE: ReadonlyArray<
  readonly [praefix: string, bereich: Bereich, titel: string]
> = [
  // Admin zuerst: /team und /werkstatt haengen ohnehin an requireAdmin(). Hier
  // stehen sie nur, damit der Wegweiser sie nicht doppelt pruefen muss.
  ["/werkstatt", "admin", "Die Werkstatt"],
  ["/team", "admin", "Die Struktur-Verwaltung"],

  // Fuehrung - die zweite Achse.
  ["/mannschaft", "fuehrung", "Die Mannschaft"],
  ["/teamabend", "fuehrung", "Der Teamabend"],

  // Voller Umfang: auswerten, vergleichen, die Betriebswaehrung.
  ["/trichter", "voll", "Der Trichter"],
  ["/arena", "voll", "Der Wettbewerb"],
  ["/leaderboard", "voll", "Die Rangliste"],
  ["/log", "voll", "Deine Aktivitäten"],
  ["/spiel", "voll", "Das Spiel"],
  ["/einheiten", "voll", "Die Einheiten"],
];

/** Zu welchem Bereich eine Adresse gehoert. Unbekannt heisst "anfang". */
export function bereichVon(pfad: string): Bereich {
  return eintragVon(pfad)?.[1] ?? "anfang";
}

/** Wie der Bereich heisst, in der Sprache des Nutzers. */
export function titelVon(pfad: string): string {
  return eintragVon(pfad)?.[2] ?? "Die Seite";
}

function eintragVon(pfad: string) {
  return BEREICHE.find(
    ([praefix]) => pfad === praefix || pfad.startsWith(praefix + "/"),
  );
}

/**
 * Darf diese Person diese Adresse sehen?
 *
 * VERSTECKEN IST AUFRAEUMEN, KEINE SICHERHEIT. Diese Funktion entscheidet, was
 * in der Leiste steht und was eine Seite zeigt. Sie ist KEINE Zugriffsgrenze -
 * die liegt weiter in lib/scope.ts und an den Rollen.
 *
 * Der Admin sieht alles: er ist der Notausgang der ganzen Mechanik (er schaltet
 * in der Werkstatt sammelweise frei), und ein Admin, der auf halber Strecke
 * gegen eine Sperre laeuft, kann genau das nicht mehr.
 */
export function darfSehen(pfad: string, stand: Ausbaustand): boolean {
  if (stand.istAdmin) return true;
  switch (bereichVon(pfad)) {
    case "anfang":
      return true;
    case "voll":
      return stand.stufe >= AUSBAU_VOLL;
    case "fuehrung":
      return stand.fuehrt;
    case "admin":
      return false;
  }
}

/**
 * Der Satz, der auf der Sperrseite steht.
 *
 * Je Bereich einer, und er sagt WER oeffnet - nicht "keine Berechtigung". Der
 * Nutzer hat nichts falsch gemacht, er ist nur noch nicht dran.
 */
export function sperrgrund(bereich: Bereich): string {
  switch (bereich) {
    case "voll":
      return "Das geht auf, sobald deine Führungskraft es öffnet.";
    case "fuehrung":
      return "Das geht auf, sobald der erste Geschäftspartner unter dir hängt.";
    case "admin":
      return "Das ist dem Admin vorbehalten.";
    case "anfang":
      return "";
  }
}

/**
 * Was der Waechter im Layout prueft. null heisst: durchlassen.
 *
 * Bewusst NICHT dasselbe wie !darfSehen(). Die Admin-Bereiche laufen weiter
 * ueber requireAdmin() in der Seite selbst - das ist eine Zugriffsgrenze und
 * gehoert dorthin, wo sie schon immer stand. Dieser Waechter raeumt nur auf.
 */
export function sperreFuer(pfad: string, stand: Ausbaustand): Bereich | null {
  if (stand.istAdmin) return null;
  const bereich = bereichVon(pfad);
  if (bereich === "voll" && stand.stufe < AUSBAU_VOLL) return bereich;
  if (bereich === "fuehrung" && !stand.fuehrt) return bereich;
  return null;
}
