import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import { SCHWELLEN } from "@/lib/signale";
import { NACHFUELL_SCHWELLE } from "@/lib/namelist";
import { pushEingerichtet, sendeMeldung } from "@/lib/push";
import {
  liegtFilter,
  liegtLabel,
  liegtSelect,
  tageLiegt,
} from "@/lib/liegenbleiber";
import { ABGESCHLOSSENE_STAENDE, AUDIO_AUFBEWAHRUNG_TAGE } from "@/lib/rueckmeldung";

export const dynamic = "force-dynamic";

// Der taegliche Anstoss (docs/audit-kernmodell.md, 10.4 und 10.5).
//
// Bis hierhin war alles Erinnernde eine Holschuld. Die Fruehwarn-Ampel der
// Fuehrungskraft war fachlich stark und trotzdem wirkungslos: sie musste
// aufgerufen werden. Genau die Leute, die ein Signal ausloesen, rufen nichts
// auf.
//
// Zwei Meldungen, mehr nicht:
//   1. An den Berater: was heute auf ihn wartet.
//   2. An die Fuehrungskraft: wer heute still ist oder leer laeuft.
//
// HOECHSTENS EINE Meldung je Kopf und Lauf. Wer morgens drei Benachrichtigungen
// bekommt, schaltet sie ab - und dann ist auch die wichtige weg.

const TAG_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  // Vercel schickt den Cron mit diesem Kopf; von aussen ist der Endpunkt
  // damit nicht ausloesbar. Ohne gesetztes Geheimnis laeuft er gar nicht.
  const geheim = process.env.CRON_SECRET;
  const mitgebracht =
    request.headers.get("authorization") ??
    `Bearer ${request.nextUrl.searchParams.get("token") ?? ""}`;
  if (!geheim || mitgebracht !== `Bearer ${geheim}`) {
    return new NextResponse("Nicht erlaubt.", { status: 401 });
  }

  // --- Aufraeumen ----------------------------------------------------------
  // Steht VOR der VAPID-Pruefung mit Absicht: ohne Push-Schluessel bricht der
  // Lauf gleich ab, und die Aufnahmen laegen dann fuer immer da. Loeschen ist
  // eine Pflicht, Melden nur eine Funktion.
  //
  // Nur die Toene verschwinden. Text, Stand und Notiz bleiben stehen - die
  // kosten nichts und sind das Gedaechtnis, warum etwas so entschieden wurde.
  const aufbewahrung = new Date(
    Date.now() - AUDIO_AUFBEWAHRUNG_TAGE * TAG_MS
  );
  let aufnahmenGeloescht = 0;
  try {
    const weg = await prisma.rueckmeldungAudio.deleteMany({
      where: {
        rueckmeldung: {
          stand: { in: [...ABGESCHLOSSENE_STAENDE] },
          erledigtAt: { lt: aufbewahrung },
        },
      },
    });
    aufnahmenGeloescht = weg.count;
  } catch {
    // Das Aufraeumen darf den Anstoss nicht kippen. Faellt es einmal aus,
    // holt es der Lauf am naechsten Werktag nach.
  }

  if (!pushEingerichtet()) {
    return NextResponse.json({
      uebersprungen: "keine VAPID-Schluessel",
      aufnahmenGeloescht,
    });
  }

  const heute = berlinToday();
  const heuteStart = dayToUtcDate(heute);
  const stilleGrenze = new Date(Date.now() - SCHWELLEN.stilleTage * TAG_MS);

  const [konten, faellig, offeneNamen, aktivHeute, termineHeute, liegende] =
    await Promise.all([
    prisma.user.findMany({
      // Platzhalter fallen hier gar nicht erst herein: sie haben kein
      // Push-Abo, koennen also nichts empfangen, und sie sollen auch nicht
      // als Anlass fuer eine Meldung an IHRE Fuehrungskraft taugen. Wer nie
      // eingeladen wurde, ist nicht still - er ist noch nicht gefragt worden.
      where: { deactivatedAt: null, passwordHash: { not: null } },
      // path und onboardingDoneAt fuer die Fuehrungs-Meldung: sie geht ueber
      // die ganze Struktur, nicht nur ueber die Direkten.
      select: {
        id: true,
        name: true,
        leaderId: true,
        path: true,
        startedAt: true,
        onboardingDoneAt: true,
      },
    }),
    // Offen und faellig: ueberfaellig plus heute.
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: {
        outcome: "OFFEN",
        nextStepType: { not: null },
        nextStepAt: { lt: new Date(heuteStart.getTime() + TAG_MS) },
      },
      _count: { _all: true },
    }),
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: {
        listKinds: { isEmpty: false },
        outcome: "OFFEN",
        stage: { in: ["NEU", "KONTAKTIERT"] },
      },
      _count: { _all: true },
    }),
    // Wer sich seit der Stille-Grenze ueberhaupt geruehrt hat.
    prisma.dailyLog.groupBy({
      by: ["personId"],
      where: { date: { gte: dayToUtcDate(berlinToday()) } },
      _count: { _all: true },
    }),
    // Die Termine des Tages. Der Kalender kann eine Erinnerung ans Telefon
    // uebergeben (ICS mit VALARM) - aber nur, wenn der Partner den Termin auch
    // uebernommen hat. Wer das nie tut, hatte bisher gar keine. Deshalb nennt
    // die Morgenmeldung den naechsten Termin beim Namen.
    prisma.contact.findMany({
      where: {
        outcome: { not: "VERLOREN" },
        appointmentAt: {
          gte: heuteStart,
          lt: new Date(heuteStart.getTime() + TAG_MS),
        },
      },
      orderBy: { appointmentAt: "asc" },
      select: { ownerId: true, name: true, appointmentAt: true },
    }),
    // Die liegen gebliebenen Namen. Bis hierhin war das der blinde Fleck des
    // ganzen Laufs: ein selbst gezogener Name bekommt keine Frist, zaehlte
    // also nicht in `faellig` - und eine VOLLE Namensliste liess die Meldung
    // unten sogar ganz ausfallen. Zwanzig unberuehrte Namen galten als
    // "alles gut".
    prisma.contact.findMany({
      where: liegtFilter(),
      select: { ...liegtSelect, ownerId: true },
    }),
  ]);

  const personen = await prisma.person.findMany({
    where: { userId: { not: null } },
    select: { id: true, userId: true },
  });
  const userVonPerson = new Map(
    personen.filter((p) => p.userId).map((p) => [p.id, p.userId!])
  );
  const heuteAktiv = new Set(
    aktivHeute
      .map((zeile) => userVonPerson.get(zeile.personId))
      .filter((id): id is string => Boolean(id))
  );

  const faelligJe = new Map(
    faellig.map((zeile) => [zeile.ownerId ?? "", zeile._count._all ?? 0])
  );
  const namenJe = new Map(
    offeneNamen.map((zeile) => [zeile.ownerId ?? "", zeile._count._all ?? 0])
  );

  // Letzte Aktivitaet je Konto, fuer die Stille-Erkennung.
  const letzte = await prisma.dailyLog.groupBy({
    by: ["personId"],
    _max: { date: true },
  });
  const letzteJe = new Map<string, Date>();
  for (const zeile of letzte) {
    const userId = userVonPerson.get(zeile.personId);
    if (userId && zeile._max.date) letzteJe.set(userId, zeile._max.date);
  }

  // Termine des Tages je Konto, der frueheste zuerst (die Abfrage ist bereits
  // nach Uhrzeit sortiert).
  const termineJe = new Map<string, { name: string; at: Date }[]>();
  for (const termin of termineHeute) {
    if (!termin.ownerId || !termin.appointmentAt) continue;
    const liste = termineJe.get(termin.ownerId) ?? [];
    liste.push({ name: termin.name, at: termin.appointmentAt });
    termineJe.set(termin.ownerId, liste);
  }

  // Liegenbleiber je Konto, der aelteste zuerst. Sortiert wird ueber den
  // Anker und nicht ueber lastProgressAt allein - sonst stuende ein Kontakt
  // mit alter Wiedervorlage vor einem, der laenger wirklich nichts gehoert hat.
  const liegtJe = new Map<string, { name: string; tage: number }[]>();
  for (const kontakt of liegende) {
    if (!kontakt.ownerId) continue;
    const liste = liegtJe.get(kontakt.ownerId) ?? [];
    liste.push({ name: kontakt.name, tage: tageLiegt(kontakt) });
    liegtJe.set(kontakt.ownerId, liste);
  }
  for (const liste of liegtJe.values()) liste.sort((a, b) => b.tage - a.tage);

  const uhrzeit = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });

  // --- 1. An den Berater: was heute wartet ---------------------------------
  const anBerater: string[] = [];
  let anLiegen = 0;
  for (const konto of konten) {
    const termine = termineJe.get(konto.id) ?? [];
    const anzahl = faelligJe.get(konto.id) ?? 0;
    const namen = namenJe.get(konto.id) ?? 0;
    const liegen = liegtJe.get(konto.id) ?? [];

    // Ein Termin ist eine feste Verabredung mit einem Menschen. Die Erinnerung
    // geht deshalb auch an den, der heute schon fleissig war - anders als das
    // Tagespensum, das sich mit der Arbeit selbst erledigt.
    //
    // Ein Liegenbleiber piekst genauso durch wie ein Termin: er ist der
    // Grund, aus dem dieser Lauf ueberhaupt etwas taugt. Ohne die zweite
    // Bedingung schwiege der Cron ausgerechnet bei voller Namensliste.
    if (termine.length === 0 && liegen.length === 0) {
      if (heuteAktiv.has(konto.id)) continue;
      if (anzahl === 0 && namen >= NACHFUELL_SCHWELLE) continue;
    }

    anBerater.push(konto.id);

    let meldung;
    if (termine.length > 0) {
      const erster = termine[0]!;
      const weitere = termine.length - 1;
      meldung = {
        titel:
          termine.length === 1
            ? "Heute ein Termin"
            : `Heute ${termine.length} Termine`,
        text: `${uhrzeit.format(erster.at)} Uhr mit ${erster.name}${
          weitere > 0 ? `, danach ${weitere} ${weitere === 1 ? "weiterer" : "weitere"}` : ""
        }.`,
        url: "/kalender",
        kennung: "tagespensum",
      };
    } else if (liegen.length > 0) {
      // Ein Name schlaegt eine Zahl. "3 Schritte heute" liest sich an Tag 1
      // wie an Tag 21; "Marco liegt seit 6 Tagen" nicht.
      const aeltester = liegen[0]!;
      const weitere = liegen.length - 1;
      meldung = {
        titel:
          weitere === 0
            ? `${aeltester.name} ${liegtLabel(aeltester.tage)}`
            : `${aeltester.name} und ${weitere} weitere liegen`,
        text:
          weitere === 0
            ? "Seit dem letzten Schritt nichts passiert. Anrufen oder von der Liste nehmen."
            : `Der älteste ${liegtLabel(aeltester.tage)}. Der Reihe nach von oben.`,
        url: "/heute",
        kennung: "tagespensum",
      };
      anLiegen += 1;
    } else if (anzahl > 0) {
      meldung = {
        titel: `${anzahl} ${anzahl === 1 ? "Schritt" : "Schritte"} heute`,
        text: "Überfällig und heute fällig. Der Reihe nach von oben.",
        url: "/heute",
        kennung: "tagespensum",
      };
    } else {
      meldung = {
        titel: "Deine Liste läuft leer",
        text: `Nur noch ${namen} offene Namen. Zehn Fragen, und du hast wieder welche.`,
        url: "/namen/sammeln",
        kennung: "tagespensum",
      };
    }
    await sendeMeldung([konto.id], meldung);
  }

  // --- 2. An die Fuehrungskraft: wer sie heute braucht ----------------------
  //
  // Ueber die GANZE Struktur, nicht nur ueber die Direkten. Vorher endete die
  // Meldung nach einer Ebene: Timo erfuhr von Jonathan, aber nie von Nick -
  // obwohl ein stiller Enkel genau das ist, was eine Fuehrungskraft von ihrer
  // eigenen Fuehrungskraft erwartet, dass sie es merkt.
  //
  // Der Unterschied steht im Text, nicht in der Auswahl: einen Direkten ruft
  // man an, bei einem Enkel spricht man mit dem Dazwischen. Wer an seiner
  // eigenen Fuehrungskraft vorbei durchgreift, macht aus einer Frühwarnung
  // einen Konflikt.
  const nameVon = new Map(konten.map((konto) => [konto.id, konto.name]));
  const kontoVon = new Map(konten.map((konto) => [konto.id, konto]));
  const ankunftGrenze = new Date(Date.now() - SCHWELLEN.ankunftFristTage * TAG_MS);

  const auffaellig = (konto: (typeof konten)[number]): string | null => {
    // Wer den Start nie beendet hat, ist der haeufigste stille Abgang - und
    // faellt in keiner Zahlenspalte auf, weil er nie eine erzeugt hat.
    if (!konto.onboardingDoneAt) {
      return konto.startedAt && konto.startedAt < ankunftGrenze
        ? "hat den Start nie beendet"
        : null;
    }
    const zuletzt = letzteJe.get(konto.id);
    if (!zuletzt || zuletzt < stilleGrenze) return "ist still";
    if ((namenJe.get(konto.id) ?? 0) < NACHFUELL_SCHWELLE) return "hat keine Namen mehr";
    return null;
  };

  // Wer fuehrt jemanden? Genau die bekommen eine Meldung.
  // Worum sich eine Fuehrungskraft schon kuemmert, wird nicht gemeldet.
  //
  // Ohne das bekaeme Emil jeden Morgen dieselbe Meldung ueber denselben
  // Menschen, obwohl er gestern angerufen und sich eine Frist gesetzt hat -
  // und schaltet die Meldungen ab. Dann ist auch die wichtige weg.
  const ruhend = await prisma.leadershipTask.findMany({
    where: { doneAt: null, dueAt: { gt: new Date() } },
    select: { leaderId: true, memberId: true },
  });
  const ruhtFuer = new Set(ruhend.map((eintrag) => `${eintrag.leaderId}:${eintrag.memberId}`));

  const fuehrende = new Set(
    konten.map((konto) => konto.leaderId).filter((id): id is string => Boolean(id))
  );
  let anFuehrung = 0;

  for (const leaderId of fuehrende) {
    const leader = kontoVon.get(leaderId);
    if (!leader) continue;

    const treffer = konten
      .filter(
        (konto) =>
          konto.id !== leaderId &&
          konto.path.startsWith(leader.path) &&
          !ruhtFuer.has(`${leaderId}:${konto.id}`)
      )
      .map((konto) => ({ konto, grund: auffaellig(konto) }))
      .filter((eintrag) => eintrag.grund !== null);
    if (treffer.length === 0) continue;

    // Direkte zuerst: dort handelt die Fuehrungskraft selbst.
    const direkte = treffer.filter((eintrag) => eintrag.konto.leaderId === leaderId);
    const tiefer = treffer.filter((eintrag) => eintrag.konto.leaderId !== leaderId);
    const zuerst = (direkte[0] ?? tiefer[0])!;
    const weitere = treffer.length - 1;

    const titel =
      weitere > 0
        ? `${zuerst.konto.name} und ${weitere} weitere brauchen dich`
        : `${zuerst.konto.name} ${zuerst.grund}`;
    // Der Schritt gehoert in die Meldung, nicht nur die Zahl: sonst ist es
    // eine Sorge ohne Griff.
    const text =
      direkte.length > 0
        ? "Anrufen — nicht nach Zahlen fragen, sondern wie es läuft."
        : `Hängt unter ${nameVon.get(zuerst.konto.leaderId ?? "") ?? "jemandem"}. Mit ${
            nameVon.get(zuerst.konto.leaderId ?? "")?.split(" ")[0] ?? "ihm"
          } besprechen, nicht daran vorbei.`;

    await sendeMeldung([leaderId], {
      titel,
      text,
      url: "/mannschaft",
      kennung: "fruehwarnung",
    });
    anFuehrung += 1;
  }

  return NextResponse.json({
    berater: anBerater.length,
    liegenbleiber: anLiegen,
    fuehrung: anFuehrung,
    aufnahmenGeloescht,
  });
}
