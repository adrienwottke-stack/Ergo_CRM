/** One delivery style for the native greeting and the ongoing Live voice. */
export const JARVIS_SPEECH_STYLE = "Sprich klares Deutsch mit ruhiger, tiefer, männlich wirkender Stimme. Klinge wie ein souveräner technischer Assistent: präzise artikuliert, gleichmäßiges moderates Tempo, kurze natürliche Pausen und zurückhaltende, dezent synthetische Betonung. Bleibe gut verständlich. Kein Flüstern, kein Hauchen, keine dramatischen Tonhöhensprünge und keine künstlichen Funk-, Knister- oder Störgeräusche.";

// Leave headroom and keep the greeting at the same playback level as Live speech.
export const JARVIS_VOICE_VOLUME = 0.8;

/** Obvious social replies stay with Live; never swallow a CRM question after a greeting. */
export function isLiveSmallTalk(text: string): boolean {
  return /^(?:(?:hallo|hey|hi|guten morgen|guten tag|guten abend)(?:[, ]+jarvis)?|jarvis|danke(?: schön| dir)?|wie geht(?: es)?(?: dir)?)[.!?,\s]*$/i.test(text.trim());
}
