// Kurznachrichten zwischen Partnern (docs/audit-kernmodell.md, 10.6).
//
// Bewusst kein Chat: eine Nachricht ist eine Reaktion auf etwas, das gerade in
// der Rangliste passiert ist. Wer sich unterhalten will, hat WhatsApp.
//
// Liegt in lib/ und nicht neben der Server-Action: "use server"-Module duerfen
// ausschliesslich async Funktionen exportieren - eine Konstante daneben bricht
// den Produktionsbau, und nur den (tsc und eslint sehen die Regel nicht).

export const NACHRICHT_MAX_ZEICHEN = 200;

// Was ohne Tippen geht. Vier Reaktionen decken ab, was in diesem Moment
// ueberhaupt gesagt wird - alles andere laesst sich tippen.
export const SCHNELLTEXTE = [
  "Respekt!",
  "Stark gemacht.",
  "Das hol ich mir zurück.",
  "Kopf hoch — morgen wieder.",
];
