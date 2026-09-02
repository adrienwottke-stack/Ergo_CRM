import Link from "next/link";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { merkeAnwesenheit } from "@/lib/anwesenheit";
import { eigene } from "@/lib/scope";
import {
  addDays,
  berlinToday,
  dayToUtcDate,
  dueState,
  hasTimeOfDay,
  startOfWeek,
  utcToBerlinLocalInput,
  type DueState,
} from "@/lib/dates";
import { NACHFUELL_SCHWELLE } from "@/lib/namelist";
import { AUSBAU_VOLL, ausbaustand, vorschlaegeFuer } from "@/lib/ausbau";
import { ladeRangliste } from "@/lib/arena";
import { liegtLabel, liegtSeit } from "@/lib/liegenbleiber";
import { herkunftAusQuelle } from "@/lib/empfehlungen";
import {
  faelligeAufgaben,
  fuehrungsSchritt,
  mannschaftsLage,
  type Mannschaftsperson,
} from "@/lib/fuehrung";
import {
  KARRIERESTUFE_MAX,
  eigenerGesamtstand,
  eigenerMonatsstand,
  formatEinheiten,
  monatsDeltaJe,
  monatsVergleich,
  produktionsmonat,
  schwelleFuer,
  stufenGriffe,
  stufenStandJe,
  strukturVerlauf,
  type Verlaufstag,
} from "@/lib/einheiten";
import { strukturAktivitaeten, type Aktivitaetstag } from "@/lib/aktivitaeten";
import { strukturKonten } from "@/lib/struktur";
import { schalter } from "@/lib/features";
import { initialenKuerzel } from "@/lib/vorfuehren";
import FuehrungsAufgabe from "@/components/FuehrungsAufgabe";
import StageBadge from "@/components/StageBadge";
import NextStepBadge from "@/components/NextStepBadge";
import QuickRowActions from "@/components/QuickRowActions";
import type { ContactLite } from "@/components/ContactActionDialog";
import ErsteWoche from "@/components/ErsteWoche";
import Meldungen from "@/components/Meldungen";
import Postfach from "@/components/Postfach";
import NummerHinterlegen from "@/components/NummerHinterlegen";
import EinheitenKarte from "@/components/EinheitenKarte";
import RanglisteZeile from "@/components/RanglisteZeile";
import AusbauVorschlag from "@/components/AusbauVorschlag";
import AusbauAufgegangen from "@/components/AusbauAufgegangen";
import TerminFrageKarte, { type TerminFrage } from "@/components/TerminFrageKarte";
import { card, chip, flaeche, kicker as kickerStil } from "@/components/ui";
import SeitenKopf from "@/components/SeitenKopf";
import VorfuehrProvider from "@/components/VorfuehrProvider";
import VorfuehrSchalter from "@/components/VorfuehrSchalter";
import GpName from "@/components/GpName";
import LageKopf, {
  type AktivitaetPuls,
  type SchwellenZeile,
  type TeamPuls,
} from "@/components/LageKopf";
import GriffKarte, { VorfuehrHinweis, type GriffPerson } from "@/components/GriffKarte";
import DirektenListe, { type DirektenZeile, type DirektenStufe } from "@/components/DirektenListe";
import LeerZustand from "@/components/LeerZustand";
import ZahlHoch from "@/components/ZahlHoch";
import { KennzahlKachel } from "@/components/Kennzahl";
import { CheckIcon, PhoneIcon, SparkIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const kurzDatum = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

// "August" ohne Jahr - fuer die Team-Puls-Delta-Zeile im Lagebild
// ("... im August"). produktionsmonat().label traegt zusaetzlich das Jahr,
// das braucht diese eine Zeile nicht.
const monatsNameFormat = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  timeZone: "UTC",
});

/**
 * Die kumulierte Kurve fuer MiniVerlauf im Lagebild: NUR der laufende
 * Produktionsmonat, Startpunkt ist der Stand bei Monatsbeginn (Sockel plus
 * alles davor), Endwert ist der Gesamtstand von heute - siehe LageKopf,
 * Zeile 2. Reine Funktion auf dem Ergebnis von strukturVerlauf(), keine
 * eigene Abfrage (Praezedenz: monatsVergleich/monatsDeltaJe in lib/einheiten.ts).
 */
function monatsKurve(sockel: number, tage: Verlaufstag[], monatStart: Date, bis: Date): number[] {
  let basis = sockel;
  for (const eintrag of tage) {
    if (dayToUtcDate(eintrag.tag).getTime() < monatStart.getTime()) basis += eintrag.hundertstel;
  }
  const werte = [basis];
  let stand = basis;
  for (const eintrag of tage) {
    const zeit = dayToUtcDate(eintrag.tag).getTime();
    if (zeit >= monatStart.getTime() && zeit <= bis.getTime()) {
      stand += eintrag.hundertstel;
      werte.push(stand);
    }
  }
  return werte;
}

// Kumulierte Anrufe-Kurve fuer MiniVerlauf im Lagebild (AP-18: zweite
// Kompakt-Kurve neben Einheiten, N5/N2 der Feedback-Runde). Dieselbe
// Fenster- und Tageslogik wie monatsKurve() oben (Kalendertag -> UTC-Datum,
// Filter auf [monatStart, bis], laufende Summe) - aber OHNE dessen
// Sockel-Aufsummierung vor monatStart: fuer Anrufe gibt es keinen
// mitgebrachten Bestand wie bei Einheiten, darum startet die Kurve immer bei
// 0 und ihr Endwert ist bewusst die MONATSSUMME, kein Gesamtstand seit je.
function aktivitaetsKurve(tage: Aktivitaetstag[], monatStart: Date, bis: Date): number[] {
  const werte = [0];
  let stand = 0;
  for (const eintrag of tage) {
    const zeit = dayToUtcDate(eintrag.tag).getTime();
    if (zeit >= monatStart.getTime() && zeit <= bis.getTime()) {
      stand += eintrag.anrufe;
      werte.push(stand);
    }
  }
  return werte;
}

// Dringlichkeit als Kante links an der Karte. Vorher hatte jede Zeile
// denselben grauen Rahmen - ob sie seit einer Woche liegt oder erst naechsten
// Freitag ansteht, sah gleich aus. Die Kante beantwortet das, bevor man liest.
const kanteJeFaelligkeit: Record<DueState, string> = {
  overdue: "border-l-4 border-l-red-500",
  today: "border-l-4 border-l-amber-400",
  week: "border-l-4 border-l-line",
  later: "border-l-4 border-l-line",
};

export default async function HeutePage() {
  const user = await requireUser();

  // Die App war heute offen - das ist einen Punkt wert (lib/anwesenheit.ts).
  //
  // Hier und nicht in login(): das Sitzungs-Cookie lebt 30 Tage, eine echte
  // Anmeldung passiert ein paar Mal im Jahr. "Einloggen" heisst in Wahrheit
  // "die App aufmachen", und dort landen alle Wege - nach der Anmeldung, vom
  // Startbildschirm und jeden Morgen.
  //
  // In after(): der Rueckruf laeuft NACH der ausgelieferten Antwort. Kostet
  // den Nutzer keine Millisekunde und kann die Seite nicht mehr kippen.
  after(() => merkeAnwesenheit(user.id));

  // Wie viel diese Seite zeigt (docs/ausbau-plan.md, Abschnitt 4). Auf Ausbau 1
  // bleiben vier Bloecke stehen: Tagespensum, die Aufgabenlisten, der
  // Starterpass und eine Zeile von der Rangliste. Alles andere kommt spaeter -
  // eine Seite mit achtzehn Bloecken ist der zweite Grund, aus dem der Start
  // ueberfordert (der erste ist die Leiste).
  //
  // Der Ausbaustand steht vorweg, weil beide Zeilen darunter davon abhaengen.
  // Er kostet nichts: das Layout hat ihn fuer denselben Benutzer schon geholt,
  // und standFuer() ist auf die Id gecacht.
  const ausbau = await ausbaustand(user);
  const vollerUmfang = ausbau.stufe >= AUSBAU_VOLL || ausbau.istAdmin;

  // Beides parallel, nicht nacheinander: /heute ist die Seite, die jeder
  // morgens zuerst oeffnet, und jede zusaetzliche Runde ueber den Pooler
  // liegt voll auf ihrer Ladezeit.
  const [ranglistenBlick, ausbauVorschlaege] = await Promise.all([
    // Der eine Blick auf die Rangliste, den Ausbau 1 behaelt. Ab Ausbau 2
    // steht der ganze Wettbewerbsbereich in der Leiste und die Zeile waere
    // die dritte Anzeige derselben Zahl.
    vollerUmfang ? null : ranglistenZeile(user.id),
    // Wen die Fuehrungskraft heute freischalten koennte. Gerechnet, nicht
    // gespeichert - siehe components/AusbauVorschlag.tsx. Nur die eigenen
    // Direkten: wer tiefer im Ast haengt, wird von SEINER Fuehrungskraft
    // freigeschaltet, nicht ueber deren Kopf hinweg.
    vorschlaegeFuer(user.id),
  ]);

  // Die Aufgeh-Karte: einmal, nachdem jemand freigeschaltet wurde. Konten, die
  // die Migration hochgesetzt hat, tragen kein ausbauGesetztAm - fuer sie ging
  // nichts auf, und die Karte erscheint zu Recht nie.
  const gerade = user.ausbauGesetztAm !== null && user.ausbauGezeigtAm === null;

  const sicht = eigene(user.id);
  const today = berlinToday();
  const horizon = addDays(dayToUtcDate(today), 8);

  const [
    contacts,
    orphans,
    offeneNamen,
    meineFuehrung,
    gefuehrte,
    nachrichten,
    einheitenMonat,
    einheitenGesamt,
  ] = await Promise.all([
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: { not: null },
        nextStepAt: { lt: horizon },
      },
      orderBy: { nextStepAt: "asc" },
      // Die letzte Aktivitaet gleich mitnehmen: vor einem Anruf will man
      // wissen, was beim letzten Mal war – ohne dafuer ins Profil zu springen.
      include: {
        activities: {
          orderBy: { date: "desc" },
          take: 1,
          select: { text: true, date: true },
        },
      },
    }),
    // Ohne naechsten Schritt: faellt sonst durchs Raster. Wer die Schleife
    // durch hat, ist kein Versaeumnis.
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: null,
        outcome: { not: "VERLOREN" },
        stage: { not: "ABSCHLUSS" },
      },
      // Die aeltesten zuerst - und ab jetzt nach echtem Fortschritt sortiert,
      // nicht nach updatedAt. Eine nachgetragene Nummer hat einen Namen
      // bisher an das Ende der Liste geschoben, als waere etwas passiert.
      orderBy: { lastProgressAt: "asc" },
    }),
    // Nachschub-Stand: was noch zu arbeiten ist, nicht was je gesammelt wurde.
    prisma.contact.count({
      where: {
        ...sicht.kontakte,
        listKinds: { isEmpty: false },
        outcome: "OFFEN",
        stage: { in: ["NEU", "KONTAKTIERT"] },
      },
    }),
    // Wer ueber mir haengt - fuer die Frage nach der eigenen Nummer. Ohne
    // Fuehrungskraft gibt es niemanden, der anrufen wuerde, also wird auch
    // nicht gefragt.
    user.phone === null && user.leaderId
      ? prisma.user.findUnique({
          where: { id: user.leaderId },
          select: { name: true },
        })
      : Promise.resolve(null),
    // Fuehrungskraft ist eine Position, keine Rolle: wer Direkte hat, fuehrt.
    // Billige Zaehlung vorweg, damit die teure Mannschafts-Rechnung nur bei
    // denen laeuft, fuer die sie ueberhaupt etwas anzeigt.
    prisma.user.count({ where: { leaderId: user.id, deactivatedAt: null } }),
    // Was Kollegen und die eigene Fuehrungskraft geschrieben haben.
    //
    // Bis hierhin lagen Nachrichten ausschliesslich in der Arena. Wer aus der
    // Mannschaft heraus schrieb ("Ich komme zu deinem naechsten Termin mit"),
    // schickte sie damit an eine Stelle, die der Empfaenger vielleicht am
    // Freitag oeffnet. Eine Nachricht, die niemand liest, ist keine Handlung.
    //
    // Bewusst nach Zeitfenster und NICHT nach "ungelesen": das Ansehen setzt
    // den Haken, und eine Abfrage auf ungelesen haette den Stapel im selben
    // Wimpernschlag wieder ausgeblendet - gelesen hatte ihn dann niemand.
    prisma.nachricht.findMany({
      where: { anId: user.id, createdAt: { gte: new Date(Date.now() - 3 * 86_400_000) } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, text: true, gelesenAt: true, von: { select: { name: true } } },
    }),
    // Einheiten-Karte (AP-02): zwei billige Aggregationen fuer Monats- und
    // Gesamtstand, keine Stufenrunde (ladeEinheiten waere hier auf einer
    // force-dynamic-Seite zu teuer). Anders als der FK-Zweig unten braucht das
    // keine Bedingung - die Karte ist ein Dashboard-Baustein, der immer da
    // ist, keine Meldung, die nur manchmal etwas zu sagen hat.
    eigenerMonatsstand(user.id),
    eigenerGesamtstand(user.id, user.einheitenStart),
  ]);

  // Schwellen-Fortschritt (AP-02): misst den GESAMT-Stand, nicht den Monat -
  // und die Schwelle kommt seit AP-07 aus der Werkstatt statt aus einer
  // Konstante, deshalb hier ein await. Bewusst NICHT im Promise.all oben: die
  // Abfrage dahinter ist je Anfrage gecacht (lib/einstellungen.ts) und liest
  // eine Handvoll Zeilen - dafuer lohnt es nicht, den Block umzubauen.
  const einheitenSchwelle = await schwelleFuer(user.karrierestufe);
  const naechsteKarrierestufe =
    user.karrierestufe === null || user.karrierestufe >= KARRIERESTUFE_MAX
      ? null
      : user.karrierestufe + 1;

  // Emil oeffnet die App morgens im Auto und landet hier - nicht auf
  // /mannschaft. Bis hierhin erfuhr er von einem stillen Partner erst, wenn er
  // von sich aus nachsah. Das Lagebild darunter beantwortet das jetzt in
  // einem Kopf statt in einem Banner - siehe unten. `lage` bleibt der EINE
  // Weg dahin: kein zweiter mannschaftsLage()-Aufruf irgendwo auf der Seite.
  const [lage, aufgaben] =
    gefuehrte > 0
      ? await Promise.all([mannschaftsLage(user), faelligeAufgaben(user.id)])
      : [null, []];

  // AP-05: "wie steht die Struktur INSGESAMT", nicht nur "wer ist gerade
  // rot". Reines Zaehlen ueber die ohnehin geladene `lage`, keine zweite
  // Abfrage, keine zweite Rechnung - und die Ampel wird hier NICHT neu
  // hergeleitet, sie steht schon an person.ampel (ampelVon hat entschieden).
  // Ausgetretene zaehlen nicht mehr mit. `null` heisst "fuehrt niemanden" und
  // haelt den Nicht-FK-Zweig unveraendert.
  const bilanz = lage
    ? lage.leute.reduce(
        (acc, person) => {
          if (!person.ausgetreten) acc[person.ampel]++;
          return acc;
        },
        { grau: 0, gruen: 0, gelb: 0, rot: 0 }
      )
    : null;

  // --- Das Lagebild: die neuen Bausteine aus b60f15a zusammensetzen --------
  // Nur im FK-Zweig geladen (lage !== null) - der Nicht-FK-Zweig zahlt exakt
  // null zusaetzliche Abfragen, kein zusaetzliches Markup.
  let einheitenAn = false;
  let puls: TeamPuls | null = null;
  // Undefined statt null (D-Muster wie in LageKopf-Prop): AP-18, Anrufe der
  // Struktur - unabhaengig vom Einheiten-Schalter, siehe Bau weiter unten.
  let aktivitaet: AktivitaetPuls | undefined;
  let schwellenZeile: SchwellenZeile | null = null;
  let griffPersonen: GriffPerson[] = [];
  let griffGesamt = 0;
  let gelbAlle: Mannschaftsperson[] = [];
  let direktenZeilen: DirektenZeile[] = [];
  // Fuer die Fussnote der Direkten-Liste - unabhaengig vom Einheiten-Schalter
  // gerechnet (die Fussnote selbst zeigt sich nur mit Schalter, aber die
  // beiden Labels sollen dafuer nicht extra dupliziert werden).
  let monatLabel = "";
  let vormonatLabel = "";
  // Fuer die Gelb-Zeile unten (die einzige Stelle, die GpName direkt im JSX
  // braucht statt ueber eine fertige Props-Liste wie Griff-Karte/Direkten-Liste).
  let kuerzel = new Map<string, string>();

  if (lage) {
    // Direkte NICHT aus lage.leute/baum ableiten: die zeigen beim Admin seit
    // ADR 0004 die GANZE Instanz statt des eigenen Astes (lib/fuehrung.ts,
    // sichtbarkeit(betrachter, "ALLE")). "Direkt" ist unabhaengig davon immer
    // dieselbe absolute Frage - leaderId === user.id - und wird deshalb hier
    // eigens gestellt.
    //
    // Der EIGENE Ast mit Pfaden, ueber alle Ebenen, sich selbst
    // eingeschlossen: dieselbe Population wie strukturVerlauf() (naemlich
    // strukturKonten(), also OHNE Ausgetretene) - nur so zaehlen die
    // Ast-Deltas unten und der Gesamtstand oben zur selben Zahl zusammen
    // (die Invariante aus lib/einheiten.ts, Abschnitt "Das Lagebild").
    const [direkteKonten, astKonten, verlauf, schalterWerte, aktivitaeten] = await Promise.all([
      prisma.user.findMany({
        where: { leaderId: user.id, deactivatedAt: null },
        select: { id: true },
      }),
      strukturKonten(user.id).then((ids) =>
        prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, path: true } })
      ),
      strukturVerlauf(user.id),
      schalter("einheiten"),
      // AP-18: dieselbe Struktur-Population wie astKonten oben, aber eigens
      // von strukturAktivitaeten() ermittelt (lib/aktivitaeten.ts ist die
      // einzige Datei jenes Auftrags - kein Teilen der Ast-Liste von hier aus).
      strukturAktivitaeten(user.id),
    ]);
    // Die Einheiten-Zeilen im Lagebild (Team-Puls, Schwellen-Zeile) haengen an
    // BEIDEM: am Feature-Schalter und am Ausbau. Eine Fuehrungskraft auf
    // Ausbau 1 sieht ihre Ampeln und ihre Direkten, aber keine
    // Einheiten-Zahlen - sie kann sie auf /einheiten ja auch nicht nachsehen.
    // Hier gesetzt und nicht erst beim Rendern: so bleiben auch die teuren
    // Abfragen darunter aus.
    einheitenAn = schalterWerte.einheiten && vollerUmfang;
    const direkteIds = direkteKonten.map((konto) => konto.id);

    // Haengt am Ergebnis der beiden Abfragen oben (Astliste, direkte Ids) -
    // kann deshalb nicht im selben Promise.all stehen.
    const [deltaJe, stufenJe] = await Promise.all([
      monatsDeltaJe(
        astKonten.map((konto) => ({ id: konto.id, path: konto.path })),
        today
      ),
      stufenStandJe(direkteIds),
    ]);

    const vergleich = monatsVergleich(verlauf.tage, today);
    monatLabel = monatsNameFormat.format(produktionsmonat(today).start);
    vormonatLabel = vergleich.vormonatLabel;
    const gesamtstand =
      verlauf.sockel + verlauf.tage.reduce((summe, tag) => summe + tag.hundertstel, 0);

    if (einheitenAn) {
      puls = {
        gesamtstand,
        monatLabel,
        vormonatLabel: vergleich.vormonatLabel,
        laufend: vergleich.laufend,
        vormonat: vergleich.vormonat,
        delta: vergleich.delta,
        verlaufWerte: monatsKurve(
          verlauf.sockel,
          verlauf.tage,
          produktionsmonat(today).start,
          dayToUtcDate(today)
        ),
        traegtZahlen: gesamtstand !== 0 || verlauf.tage.length > 0,
      };
    }

    // Anrufe der Struktur im laufenden Monat (AP-18, N5/N2): unabhaengig vom
    // Einheiten-Schalter, weil eine Fuehrungskraft ohne Einheiten-Freischaltung
    // trotzdem sehen soll, wie ihre Struktur telefoniert. monatLabel steht
    // hier bereits fest (oben unbedingt gesetzt, nicht erst im
    // einheitenAn-Zweig) - "im September" statt eines eigens gerechneten
    // Zuwachses, um keine zweite Zeitspannen-Logik (Woche vs. Monat) neben
    // der ohnehin schon zwei Fenster kennenden Matrix einzufuehren.
    const aktivitaetWerte = aktivitaetsKurve(
      aktivitaeten.tage,
      produktionsmonat(today).start,
      dayToUtcDate(today)
    );
    aktivitaet = {
      summe: aktivitaetWerte[aktivitaetWerte.length - 1],
      werte: aktivitaetWerte,
      hinweis: `im ${monatLabel}`,
    };

    // Server rechnet EINMAL die Vorfuehr-Kuerzel fuer jeden Namen, der im
    // Lagebild ueberhaupt vorkommen kann - GpName bekommt dann nur noch
    // {name, kurz} und muss selbst nichts mehr wissen. lage.leute deckt
    // dabei auch jedes "ueber X" ab: wer tiefer im eigenen Ast steht, haengt
    // an einer Fuehrungskraft, die selbst ebenfalls im eigenen Ast steht.
    kuerzel = initialenKuerzel(lage.leute.map((person) => person.name));
    const kurzFuer = (name: string) => kuerzel.get(name) ?? name;

    // Direkte fuer die Direkten-Liste UND die Schwellen-Zeile: aus lage.leute
    // gefiltert (istDirekt ist eine absolute Frage, unabhaengig vom
    // Sichtbarkeits-Umfang) - nicht aus astKonten, das traegt keine
    // Signale/Ampeln. Ausgetretene Direkte gehoeren nicht mehr in die
    // Arbeitsliste von heute.
    const direktePersonen = lage.leute.filter(
      (person) => person.istDirekt && !person.ausgetreten
    );
    const namenJeDirekt = new Map(direktePersonen.map((person) => [person.id, person]));

    if (einheitenAn) {
      const griffe = stufenGriffe(stufenJe);
      if (griffe.knapp.length > 0) {
        const erster = griffe.knapp[0]!;
        const person = namenJeDirekt.get(erster.userId);
        if (person) {
          schwellenZeile = {
            art: "knapp",
            id: erster.userId,
            name: person.name,
            kurz: kurzFuer(person.name),
            stufe: erster.stufe,
            rest: erster.schwelle - erster.eigenGesamt,
            prozent: Math.round((erster.eigenGesamt / erster.schwelle) * 100),
            weitere: griffe.knapp.length - 1,
          };
        }
      } else if (griffe.erreicht.length > 0) {
        const erster = griffe.erreicht[0]!;
        const person = namenJeDirekt.get(erster.userId);
        if (person) {
          schwellenZeile = {
            art: "erreicht",
            id: erster.userId,
            name: person.name,
            kurz: kurzFuer(person.name),
            stufe: erster.stufe,
          };
        }
      } else if (griffe.fehlt.length > 0) {
        schwellenZeile = { art: "fehlt", anzahl: griffe.fehlt.length };
      }
    }

    // Griff-Karten: exakt dieselbe Auswahl wie das bisherige rote Banner
    // (lage.dringend nach ampel==="rot"), damit die Alarm-Abdeckung nicht
    // enger wird. lage.dringend schliesst Ausgetretene und Ruhende bereits
    // aus (lib/fuehrung.ts: auffaellig filtert !ausgetreten, dringend filtert
    // !betreuung?.ruht) - hier kommt keine zweite Filterung mehr dazu.
    const rotDringend = lage.dringend.filter((person) => person.ampel === "rot");
    griffGesamt = rotDringend.length;
    griffPersonen = rotDringend.slice(0, 3).map((person) => ({
      id: person.id,
      name: person.name,
      kurz: kurzFuer(person.name),
      vorname: person.vorname,
      ueber: person.ueber,
      ueberKurz: person.ueber ? kurzFuer(person.ueber) : null,
      fuehrt: person.fuehrt,
      telefon: person.telefon,
      titel: person.signale[0]?.titel ?? "Läuft.",
      schritt: fuehrungsSchritt(person),
      anlass: person.signale[0]?.schluessel,
    }));

    gelbAlle = lage.dringend.filter((person) => person.ampel === "gelb");

    // Die Direkten-Liste: Ast-EH und Karrierestufe nur mit Einheiten-Schalter,
    // Platzhalter bleiben in jedem Fall getrennt - kein Balken, kein Delta,
    // nie in einer Summe.
    direktenZeilen = direktePersonen.map((person) => {
      const delta = einheitenAn ? deltaJe.get(person.id) : undefined;
      const astMonat = delta?.astMonat ?? 0;
      const astVormonat = delta?.astVormonat ?? 0;
      const deltaWert = astMonat - astVormonat;

      const stand = einheitenAn ? stufenJe.get(person.id) : undefined;
      let stufe: DirektenStufe | null = null;
      if (einheitenAn && !person.platzhalter) {
        if (!stand || stand.stufe === null) stufe = { art: "fehlt" };
        else if (stand.schwelle === null) {
          stufe = { art: "ohneSchwelle", stufe: stand.stufe };
        } else if (stand.eigenGesamt >= stand.schwelle) {
          stufe = { art: "erreicht", stufe: stand.stufe };
        } else {
          stufe = {
            art: "fortschritt",
            stufe: stand.stufe,
            prozent: Math.round((stand.eigenGesamt / stand.schwelle) * 100),
          };
        }
      }

      return {
        id: person.id,
        name: person.name,
        kurz: kurzFuer(person.name),
        ampel: person.ampel,
        fuehrt: person.fuehrt,
        platzhalter: person.platzhalter,
        eingeladen: person.eingeladen,
        signalTitel:
          !person.platzhalter && person.ampel !== "gruen"
            ? (person.signale[0]?.titel ?? null)
            : null,
        ehText:
          einheitenAn && !person.platzhalter
            ? person.fuehrt > 0
              ? `Ast ${formatEinheiten(astMonat)}`
              : formatEinheiten(astMonat)
            : null,
        deltaText:
          einheitenAn && !person.platzhalter
            ? `${deltaWert >= 0 ? "+" : ""}${formatEinheiten(deltaWert)} vs. ${vergleich.vormonatLabel}`
            : null,
        stufe,
      };
    });
  }

  // Faellige Fuehrungsaufgaben gehoeren in dieselben Gruppen wie die
  // Kundenschritte - eine Fuehrungskraft hat EINE Liste. Was ueberfaellig ist,
  // steht oben; was heute faellig ist, bei heute.
  const aufgabenJe: Record<DueState, typeof aufgaben> = {
    overdue: aufgaben.filter((aufgabe) => aufgabe.ueberfaellig),
    today: aufgaben.filter((aufgabe) => !aufgabe.ueberfaellig),
    week: [],
    later: [],
  };

  type Row = { at: Date; due: DueState; data: (typeof contacts)[number] };

  const rows: Row[] = contacts.map((data) => ({
    at: data.nextStepAt!,
    due: dueState(data.nextStepAt!, today),
    data,
  }));

  // AP-10: ein vergangener, noch nicht bewerteter Termin bekommt eine eigene
  // Frage ganz oben (TerminFrageKarte) statt einer Zeile in den normalen
  // Faelligkeits-Gruppen. "Vergangen" ist hier der TATSAECHLICHE Zeitpunkt
  // (appointmentAt < jetzt) und nicht nur der Kalendertag wie bei dueState -
  // ein Termin von heute Vormittag waere im Tages-Raster sonst noch "Heute"
  // und liefe dort ein zweites Mal mit denselben Gehalten/Geplatzt-Knoepfen.
  // Herausgefiltert wird deshalb aus ALLEN drei Gruppen, nicht nur aus
  // "Überfällig" - eine Frage, keine doppelten Knoepfe.
  const jetztZeitpunkt = new Date();
  const terminFragenRows = rows.filter(
    (row) =>
      row.data.nextStepType === "TERMIN" &&
      row.data.appointmentAt !== null &&
      row.data.appointmentAt < jetztZeitpunkt
  );
  const terminFragenIds = new Set(terminFragenRows.map((row) => row.data.id));
  const restRows = rows.filter((row) => !terminFragenIds.has(row.data.id));

  const terminFragen: TerminFrage[] = terminFragenRows.map((row) => ({
    contact: {
      id: row.data.id,
      name: row.data.name,
      phone: row.data.phone,
      stage: row.data.stage,
      outcome: row.data.outcome,
      appointmentLocal: utcToBerlinLocalInput(row.data.appointmentAt!),
      hasStep: true,
      referralsAsked: row.data.referralsAskedAt !== null,
    },
    appointmentAt: row.data.appointmentAt!,
  }));

  const groups: { key: DueState; title: string; hint: string; rows: Row[] }[] = [
    {
      key: "overdue",
      title: "Überfällig",
      hint: "Zuerst abarbeiten",
      rows: restRows.filter((row) => row.due === "overdue"),
    },
    {
      key: "today",
      title: "Heute",
      hint: "Dein Tagespensum",
      rows: restRows.filter((row) => row.due === "today"),
    },
    {
      key: "week",
      title: "Diese Woche",
      hint: "Kommt auf dich zu",
      rows: restRows.filter((row) => row.due === "week"),
    },
  ];

  // Das Tagespensum: was JETZT dran ist, nach Art getrennt. Ueberfaellig und
  // heute zaehlen zusammen - ein Anruf von gestern ist heute ein Anruf.
  const jetzt = [...groups[0]!.rows, ...groups[1]!.rows];
  const anrufeHeute = jetzt.filter(
    (row) => row.data.nextStepType === "ANRUF"
  ).length;
  const termineHeute = jetzt.filter(
    (row) => row.data.nextStepType === "TERMIN"
  ).length;
  const sonstigeHeute = jetzt.length - anrufeHeute - termineHeute;
  const openCount = jetzt.length;
  const nachfuellen = offeneNamen < NACHFUELL_SCHWELLE;

  // Liegenbleiber ueber beide Listen: die mit Schritt (ueberfaellig und nie
  // angefasst) und die ohne. Der Balken nennt den aeltesten und zaehlt den
  // Rest - er wiederholt die Liste NICHT, die Plaketten unten tun das schon.
  const liegen = [
    ...rows.map((row) => ({ kontakt: row.data, tage: liegtSeit(row.data) })),
    ...orphans.map((kontakt) => ({ kontakt, tage: liegtSeit(kontakt) })),
  ]
    .filter((eintrag): eintrag is { kontakt: typeof eintrag.kontakt; tage: number } =>
      eintrag.tage !== null
    )
    .sort((a, b) => b.tage - a.tage);
  const aeltester = liegen[0];

  return (
    <div className="space-y-6">
      <SeitenKopf kicker={lage ? "Führung" : "Beraterbereich"} titel="Heute" />

      {/* Ganz oben und nur einmal: der einzige Ort, an dem die App ueber
          den Ausbau spricht. Vor dem Postfach, weil eine Nachricht morgen
          auch noch da ist - dieser Moment nicht. */}
      {gerade && <AusbauAufgegangen />}

      {/* Der Wecker: die Erlaubnis fuer die Morgen-Meldung ("Marco liegt seit
          6 Tagen"). Unabhaengig vom Ausbau und ganz oben - der Schalter hing
          vorher tief unten hinter vollerUmfang, und fuenf von sechs Koepfen
          hatten deshalb kein Abo, obwohl der Cron laengst laeuft und alle
          sechs die App installiert haben. Selbstblendung (nichts, wenn schon
          an oder technisch nicht moeglich) sitzt in Meldungen.tsx selbst. */}
      <Meldungen vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />

      {/* Was jemand geschrieben hat, steht vor der Arbeit - es dauert zehn
          Sekunden und ist der Grund, warum sich das Werkzeug nach Mannschaft
          anfuehlt und nicht nach Verwaltung. */}
      {nachrichten.length > 0 && (
        <Postfach
          nachrichten={nachrichten.map((nachricht) => ({
            id: nachricht.id,
            von: nachricht.von.name,
            text: nachricht.text,
            neu: nachricht.gelesenAt === null,
          }))}
          ungelesen={nachrichten.filter((n) => n.gelesenAt === null).length}
        />
      )}

      {/* Das Lagebild (Lagebild-Plan): eine Fuehrungskraft soll beim Oeffnen
          ZUERST sehen, was bei ihren Leuten los ist - erst danach das eigene
          Geschaeft. Nutzer-Entscheidung aus dem Plan, dieselbe Haltung wie
          beim frueheren "braucht dich"-Banner ("ein stiller Partner kostet
          mehr als ein liegengebliebener Anruf"), jetzt mit einem Kopf statt
          einem Banner - der Puls zieht auf die erste Griff-Karte um.
          Nicht-FK sieht ab hier exakt nichts Neues, `lage` ist dann null. */}
      {lage && (
        <VorfuehrProvider>
          <div className="flex items-center justify-between gap-3">
            <p className={kickerStil}>Lagebild</p>
            <VorfuehrSchalter />
          </div>
          <VorfuehrHinweis />

          <LageKopf
            bilanz={bilanz!}
            einheitenAn={einheitenAn}
            puls={puls}
            schwellenZeile={schwellenZeile}
            aktivitaet={aktivitaet}
          />

          {griffPersonen.length > 0 && (
            <GriffKarte personen={griffPersonen} gesamt={griffGesamt} />
          )}

          {/* Wer so weit ist, dass sich der naechste Schritt lohnt. Steht
              zwischen den Faellen, die heute einen Griff brauchen - eine
              Fuehrungskraft hat EINE Liste (docs/struktur-plan.md, 5), und
              "jemanden weiterbringen" gehoert genauso hinein wie
              "jemanden auffangen". */}
          <AusbauVorschlag vorschlaege={ausbauVorschlaege} />

          {gelbAlle.length > 0 && (
            <Link
              href="/mannschaft"
              className={`${flaeche("warnung")} block px-4 py-3 transition hover:schatten-hoch sm:px-5`}
            >
              <span className="text-sm text-amber-900">
                Bei{" "}
                {gelbAlle.length === 1 ? (
                  <GpName
                    name={gelbAlle[0]!.vorname}
                    kurz={kuerzel.get(gelbAlle[0]!.name) ?? gelbAlle[0]!.vorname}
                  />
                ) : gelbAlle.length === 2 ? (
                  <>
                    <GpName
                      name={gelbAlle[0]!.vorname}
                      kurz={kuerzel.get(gelbAlle[0]!.name) ?? gelbAlle[0]!.vorname}
                    />{" "}
                    und{" "}
                    <GpName
                      name={gelbAlle[1]!.vorname}
                      kurz={kuerzel.get(gelbAlle[1]!.name) ?? gelbAlle[1]!.vorname}
                    />
                  </>
                ) : (
                  <>
                    <GpName
                      name={gelbAlle[0]!.vorname}
                      kurz={kuerzel.get(gelbAlle[0]!.name) ?? gelbAlle[0]!.vorname}
                    />
                    ,{" "}
                    <GpName
                      name={gelbAlle[1]!.vorname}
                      kurz={kuerzel.get(gelbAlle[1]!.name) ?? gelbAlle[1]!.vorname}
                    />{" "}
                    und {gelbAlle.length - 2} weiteren
                  </>
                )}{" "}
                hakt es — zur Mannschaft
              </span>
            </Link>
          )}

          {griffPersonen.length === 0 && gelbAlle.length === 0 && (
            <div className={`${flaeche("erfolg")} px-4 py-3 sm:px-5`}>
              <p className="text-sm text-emerald-900">
                Niemand braucht dich heute — alle laufen. Deine eigene Liste ist
                unten dran.
              </p>
            </div>
          )}

          <DirektenListe
            personen={direktenZeilen}
            einheitenAn={einheitenAn}
            monatLabel={monatLabel}
            vormonatLabel={vormonatLabel}
          />
        </VorfuehrProvider>
      )}

      {/* Fuehrung zuerst, eigenes Geschaeft darunter (siehe Kommentar oben am
          Lagebild) - der Kicker macht diesen Schnitt fuer eine Fuehrungskraft
          sichtbar. Ohne eigene Leute faengt die Seite unveraendert direkt mit
          der Einheiten-Karte an. */}
      {lage && <h2 className={kickerStil}>Dein eigenes Geschäft</h2>}

      {/* AP-02: das Dashboard, das Emil wollte - Zahlen und Eintragen ganz
          oben, nicht unter Wettbewerb. Bei einer Fuehrungskraft direkt nach
          dem Lagebild, sonst direkt nach dem Postfach: der Aufmacher der
          Seite bleibt Mensch, gleich danach die eigene Zahl. */}
      {/* Erst ab Ausbau 2. Der frueher hier stehende Satz "immer da, keine
          Bedingung - ein Dashboard-Baustein ist keine Meldung" galt fuer eine
          App, die jedem alles zeigte. Einheiten haengen an der Karrierestufe,
          und die ist bei jedem Neuen NULL: die Karte zeigt ihm zwei Nullen und
          einen Balken ohne Ziel. Das ist keine Auskunft, das ist Fuellung. */}
      {vollerUmfang && (
      <EinheitenKarte
        monat={formatEinheiten(einheitenMonat)}
        monatLabel={produktionsmonat(today).label}
        gesamt={formatEinheiten(einheitenGesamt)}
        schwelle={einheitenSchwelle === null ? null : formatEinheiten(einheitenSchwelle)}
        naechsteStufe={naechsteKarrierestufe}
        karrierestufeFehlt={user.karrierestufe === null}
      />
      )}

      {/* AP-10: die proaktive Frage nach einem vergangenen Termin - noch vor
          dem Tagespensum. Sonst haette sie sich in der Liste weiter unten
          versteckt, und genau das war Emils Anlass: "du musst eintragen",
          nicht "du koenntest, wenn du scrollst". */}
      <TerminFrageKarte fragen={terminFragen} />

      {/* Fragt genau einmal und verschwindet danach fuer immer. Es gibt
          bewusst keine Kontoseite dafuer - ein Bildschirm mit einem Feld
          darauf ist ein Bildschirm zu viel. */}
      {meineFuehrung && (
        <NummerHinterlegen fuehrungskraft={meineFuehrung.name.split(" ")[0] ?? meineFuehrung.name} />
      )}

      {/* Beim Oeffnen steht da, was heute zu tun ist - als Zahl, nicht als
          Liste, aus der man erst auswaehlen muss. */}
      <div className={`${card} p-5 sm:p-6`}>
        {/* Mit terminFragen.length===0 verknuepft: sonst wuerde "alles
            abgearbeitet" direkt unter der neuen Terminfrage-Karte stehen,
            waehrend die noch eine offene Frage zeigt (AP-10-Folge). */}
        {openCount === 0 && terminFragen.length === 0 ? (
          <p className="text-base font-semibold text-ink">
            Nichts offen – alles abgearbeitet.
          </p>
        ) : (
          <>
            {/* Die Tagesleistung ist der Grund, warum jemand die Seite
                oeffnet. Sie darf gross sein und beim Ankommen kurz
                hochzaehlen - danach steht sie still. */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <ZahlHoch
                wert={anrufeHeute > 0 ? anrufeHeute : openCount}
                className="text-4xl font-bold tracking-[-0.02em] tabular-nums text-navy-700"
              />
              <span className="text-base font-semibold text-ink">
                {anrufeHeute > 0
                  ? `${anrufeHeute === 1 ? "Anruf" : "Anrufe"} heute`
                  : `${openCount === 1 ? "Schritt" : "Schritte"} heute`}
              </span>
            </div>

            {/* Vorher eine Zeile mit Mittelpunkten ("3 Termine · 2 weitere ·
                4 ueberfaellig"). Als Kacheln sieht man die Verteilung, statt
                sie zu lesen. */}
            {termineHeute + sonstigeHeute + groups[0]!.rows.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <KennzahlKachel
                  wert={termineHeute}
                  bezeichnung={termineHeute === 1 ? "Termin" : "Termine"}
                  ton={termineHeute > 0 ? "info" : "neutral"}
                />
                <KennzahlKachel
                  wert={sonstigeHeute}
                  bezeichnung="weitere Schritte"
                />
                <KennzahlKachel
                  wert={groups[0]!.rows.length}
                  bezeichnung="überfällig"
                  ton={groups[0]!.rows.length > 0 ? "gefahr" : "neutral"}
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">
                Der Reihe nach von oben.
              </p>
            )}
          </>
        )}

        {/* Liegenbleiber: der Name, der zu lange nichts gehoert hat. Steht
            ueber dem Nachfuell-Alarm, weil ein liegender Name der teurere
            Fehler ist - Nachschub holen kann man morgen, einen kalt
            gewordenen Namen nicht zurueckholen. */}
        {vollerUmfang && aeltester && (
          <div
            className={`${flaeche("gefahr")} mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
          >
            <p className="text-sm text-red-900">
              <span className="font-semibold">
                {aeltester.kontakt.name} {liegtLabel(aeltester.tage)}.
              </span>{" "}
              {liegen.length === 1
                ? "Anrufen oder von der Liste nehmen."
                : `Und ${liegen.length - 1} ${
                    liegen.length === 2 ? "weiterer" : "weitere"
                  }. Der älteste zuerst.`}
            </p>
            <Link
              href={`/contacts/${aeltester.kontakt.id}`}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-fest-gefahr px-4 text-sm font-semibold text-white transition hover:bg-fest-gefahr-stark"
            >
              <PhoneIcon className="h-4 w-4" />
              {aeltester.kontakt.name.split(" ")[0]} anrufen
            </Link>
          </div>
        )}

        {/* Derselbe Liegenbleiber auf Ausbau 1: eine Zeile statt der vollen
            Karte - kein Zaehler-Kasten, keine Liste. Der Wecker (siehe ganz
            oben auf der Seite) verspricht diesen Namen; die Seite haelt ihn.
            Link auf /namen statt /contacts/[id], weil dort auf Ausbau 1
            telefoniert wird. */}
        {!vollerUmfang && aeltester && (
          <Link
            href="/namen"
            className={`${flaeche("gefahr")} mt-4 block px-4 py-3 transition hover:schatten-hoch`}
          >
            <span className="text-sm text-red-900">
              <span className="font-semibold">{aeltester.kontakt.name}</span>{" "}
              {liegtLabel(aeltester.tage)} — zur Namensliste
            </span>
          </Link>
        )}

        {/* Nachfuell-Alarm: ohne Namen kein Anruf, egal wie voll der Tag ist. */}
        {vollerUmfang && nachfuellen && (
          <div
            className={`${flaeche("warnung")} mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
          >
            <p className="text-sm text-amber-900">
              <span className="font-semibold">
                {offeneNamen === 0
                  ? "Keine offenen Namen mehr."
                  : `Nur noch ${offeneNamen} offene Namen.`}
              </span>{" "}
              Ohne Nachschub steht die Schleife still.
            </p>
            <Link
              href="/namen/sammeln"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-fest-warnung px-4 text-sm font-semibold text-white transition hover:bg-fest-warnung-stark"
            >
              <SparkIcon className="h-4 w-4" />
              Namen sammeln
            </Link>
          </div>
        )}

        {openCount > 0 && !nachfuellen && (
          <Link
            href="/namen"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-navy-600 transition hover:text-navy-800 hover:underline"
          >
            <PhoneIcon className="h-4 w-4" />
            Lieber am Stück telefonieren? Durchlauf über die Namensliste
          </Link>
        )}
      </div>

      {/* Auf Ausbau 1 der einzige Blick nach draussen: wo stehe ich. Steht
          NACH dem Tagespensum, weil der Vergleich erst etwas wert ist, wenn
          man weiss, was man selbst heute getan hat. */}
      {ranglistenBlick && (
        <RanglisteZeile
          platz={ranglistenBlick.platz}
          koepfe={ranglistenBlick.koepfe}
          ueberMir={ranglistenBlick.ueberMir}
        />
      )}

      {/* Startwoche, Brief, Versprechen, Wiedereinstieg - meldet sich nur,
          wenn einer dieser Momente wirklich ansteht. */}
      <ErsteWoche user={user} />

      {rows.length === 0 && orphans.length === 0 && aufgaben.length === 0 ? (
        <LeerZustand
          ton="erfolg"
          symbol={<CheckIcon className="h-6 w-6" />}
          titel="Keine offenen Schritte"
          text={
            <>
              Neue Namen sammelst du in der{" "}
              <Link
                href="/namen"
                className="font-medium text-navy-600 hover:underline"
              >
                Namensliste
              </Link>
              .
            </>
          }
        >
          {/* Der Willkommens-Ablauf bleibt aufrufbar - zum Vorfuehren am
              Launch-Tag und fuer alle, die ihn weggeklickt haben. */}
          <Link
            href="/willkommen"
            className="text-xs font-medium text-ink-soft hover:text-navy-700 hover:underline"
          >
            Wie das hier gedacht ist — der Start, nochmal
          </Link>
        </LeerZustand>
      ) : (
        groups
          .filter((group) => group.rows.length + aufgabenJe[group.key].length > 0)
          .map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-ink">
                  {group.title}
                  <span className="ml-2 text-sm font-normal text-ink-soft">
                    {group.rows.length + aufgabenJe[group.key].length}
                  </span>
                </h2>
                <span className="text-xs text-ink-muted">{group.hint}</span>
              </div>

              <ul className="space-y-3">
                {/* Menschen vor Kunden: wenn heute beides ansteht, ist der
                    stille Partner das Teurere. */}
                {aufgabenJe[group.key].map((aufgabe) => (
                  <FuehrungsAufgabe key={aufgabe.id} aufgabe={aufgabe} />
                ))}
                {group.rows.map((row, i) => {
                  const contact = row.data;
                  const liegtSeitTagen = liegtSeit(contact);
                  const lite: ContactLite = {
                    id: contact.id,
                    name: contact.name,
                    phone: contact.phone,
                    stage: contact.stage,
                    outcome: contact.outcome,
                    appointmentLocal: contact.appointmentAt
                      ? utcToBerlinLocalInput(contact.appointmentAt)
                      : null,
                    hasStep: true,
                    referralsAsked: contact.referralsAskedAt !== null,
                  };
                  return (
                    <li
                      key={contact.id}
                      className={`${card} ${kanteJeFaelligkeit[row.due]} animate-rise p-4 transition duration-200 hover:schatten-hoch`}
                      // Die Zeilen laufen leicht versetzt ein. Nur die ersten
                      // acht - danach wuerde man auf die Liste warten.
                      style={
                        i < 8
                          ? ({ "--rise-delay": `${i * 40}ms` } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="text-sm font-semibold text-ink hover:text-navy-700"
                        >
                          {contact.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          {/* Die Faelligkeit sagt "ueberfaellig", aber nicht
                              seit wann. Genau darin liegt der Unterschied
                              zwischen gestern vergessen und vor drei Wochen
                              aufgegeben. */}
                          {liegtSeitTagen !== null && (
                            <span className={chip("gefahr")}>
                              {liegtLabel(liegtSeitTagen)}
                            </span>
                          )}
                          <StageBadge stage={contact.stage} outcome={contact.outcome} />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <NextStepBadge
                          type={contact.nextStepType!}
                          at={contact.nextStepAt!}
                          state={row.due}
                          withTime={hasTimeOfDay(contact.nextStepAt!)}
                        />
                        {contact.nextStepNote && (
                          <span className="text-xs text-ink-muted">
                            {contact.nextStepNote}
                          </span>
                        )}
                      </div>

                      {/* Vorgeschichte in der Zeile statt im Profil. */}
                      {(contact.activities[0] ||
                        contact.note ||
                        herkunftAusQuelle(contact.source)) && (
                        <div className="mt-2 space-y-0.5 border-l-2 border-line pl-2.5">
                          {/* Zuerst die Herkunft: der Unterschied zwischen
                              einem kalten und einem warmen Anruf steht in
                              diesem einen Satz. */}
                          {herkunftAusQuelle(contact.source) && (
                            <p className="text-xs font-semibold text-amber-800">
                              Empfehlung von {herkunftAusQuelle(contact.source)}
                            </p>
                          )}
                          {contact.activities[0] && (
                            <p className="line-clamp-2 text-xs text-ink-muted">
                              <span className="text-ink-soft">
                                Zuletzt {kurzDatum.format(contact.activities[0].date)}:
                              </span>{" "}
                              {contact.activities[0].text}
                            </p>
                          )}
                          {contact.note && (
                            <p className="line-clamp-2 text-xs text-amber-800">
                              {contact.note}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-3 border-t border-line pt-3">
                        <QuickRowActions
                          contact={lite}
                          istAnruf={contact.nextStepType === "ANRUF"}
                          istTermin={contact.nextStepType === "TERMIN"}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
      )}

      {/* "Ohne naechsten Schritt" ist eine Aufraeumliste. Sie setzt voraus,
          dass schon genug Kontakte da sind, um welche zu verlieren - am ersten
          Tag steht dort die halbe frisch eingetragene Namensliste und sieht aus
          wie ein Vorwurf. */}
      {vollerUmfang && orphans.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">
              Ohne nächsten Schritt
              <span className="ml-2 text-sm font-normal text-ink-soft">
                {orphans.length}
              </span>
            </h2>
            <span className="text-xs text-ink-muted">Fällt sonst durchs Raster</span>
          </div>
          <ul className="space-y-3">
            {orphans.slice(0, 25).map((contact) => (
              <li
                key={contact.id}
                className={`${card} border-l-4 border-l-amber-400 p-4 transition duration-200 hover:schatten-hoch`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="text-sm font-semibold text-ink hover:text-navy-700"
                  >
                    {contact.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    {liegtSeit(contact) !== null && (
                      <span className={chip("gefahr")}>
                        {liegtLabel(liegtSeit(contact)!)}
                      </span>
                    )}
                    <StageBadge stage={contact.stage} outcome={contact.outcome} />
                  </div>
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <QuickRowActions
                    contact={{
                      id: contact.id,
                      name: contact.name,
                      phone: contact.phone,
                      stage: contact.stage,
                      outcome: contact.outcome,
                      appointmentLocal: contact.appointmentAt
                        ? utcToBerlinLocalInput(contact.appointmentAt)
                        : null,
                      hasStep: false,
                      referralsAsked: contact.referralsAskedAt !== null,
                    }}
                    // Ohne Schritt, aber noch in der Akquise: dann ist der
                    // naechste Griff ohnehin das Telefon.
                    istAnruf={
                      contact.stage === "NEU" || contact.stage === "KONTAKTIERT"
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
          {orphans.length > 25 && (
            <p className="text-xs text-ink-muted">
              … und {orphans.length - 25} weitere. Die Liste rückt nach, sobald
              die ersten einen Schritt haben.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

// Platz, Kopfzahl und die zwei Namen darueber - fuer die eine Zeile auf
// Ausbau 1 (docs/ausbau-plan.md, Abschnitt 4).
//
// Dieselbe Quelle wie /leaderboard (ladeRangliste ueber die laufende Woche),
// damit die Zeile und die Seite spaeter nie zwei verschiedene Plaetze zeigen.
// Wer diese Woche nichts getan hat, steht gar nicht in der Liste: dann ist der
// Platz null und die Zeile sagt das, statt einen letzten Platz zu erfinden.
async function ranglistenZeile(userId: string) {
  const person = await prisma.person.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!person) return null;

  // ohne Serie: die kostet eine Abfrage ueber alle Eintraege der letzten 60
  // Tage und aendert an Punkten und Platz nichts. Fuer eine Zeile auf der
  // meistgeoeffneten Seite ist das der falsche Preis.
  const zeilen = await ladeRangliste(startOfWeek(berlinToday()), {
    mitSerie: false,
  });
  const index = zeilen.findIndex((zeile) => zeile.personId === person.id);

  return {
    platz: index < 0 ? null : index + 1,
    koepfe: zeilen.length,
    // Von unten nach oben: der direkt vor mir zuerst. Das ist der, den man
    // ueberholen kann - nicht der Erste.
    ueberMir:
      index <= 0
        ? []
        : zeilen
            .slice(Math.max(0, index - 2), index)
            .reverse()
            .map((zeile) => zeile.name),
  };
}
