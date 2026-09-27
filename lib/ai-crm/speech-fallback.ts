import type OpenAI from "openai";
import { aiCrmConfig, type AiCrmConfig } from "@/lib/ai-crm/config";
import { openAiClient } from "@/lib/ai-crm/openai";

/** A confirmed answer can still be heard when the Live sideband is unavailable.
 * The audio is returned to the current browser response and is never stored. */
export async function renderSpeechFallback(
  content: string,
  config: AiCrmConfig = aiCrmConfig(),
  client: Pick<OpenAI, "audio"> = openAiClient(),
): Promise<ArrayBuffer> {
  if (!content.trim() || content.length > 4096) throw new Error("Sprachtext außerhalb des TTS-Limits.");
  const response = await client.audio.speech.create({
    model: config.liveSpeechModel,
    // The Live-only voices are not necessarily available to the TTS model.
    voice: "cedar",
    input: content,
    instructions: "Sprich den vorgegebenen deutschen Text vollständig und ohne zusätzliche Wörter. Natürlich, klar und mit lebendiger, zum Inhalt passender Betonung.",
    response_format: "mp3",
  }, { maxRetries: 0, timeout: Math.min(config.providerTimeoutMs, 15_000) });
  return response.arrayBuffer();
}
