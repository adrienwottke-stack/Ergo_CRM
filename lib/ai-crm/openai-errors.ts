import OpenAI from "openai";
import {
  AiCrmError,
  safeAiProviderFailureMessage,
} from "@/lib/ai-crm/errors";

function providerError(code: string, status: number): AiCrmError {
  return new AiCrmError(
    code,
    safeAiProviderFailureMessage(code) ??
      "Die KI-Anfrage konnte gerade nicht abgeschlossen werden. Bitte versuche es erneut.",
    status,
  );
}

/**
 * Translate known OpenAI SDK failures into stable, non-sensitive CRM errors.
 * The original provider message is deliberately never persisted or returned.
 */
export function classifyOpenAiProviderError(
  error: unknown,
): AiCrmError | null {
  if (error instanceof AiCrmError) return error;
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return providerError("AI_PROVIDER_TIMEOUT", 503);
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return providerError("AI_PROVIDER_UNAVAILABLE", 503);
  }
  if (!(error instanceof OpenAI.APIError)) return null;

  if (error.status === 401 || error.status === 403) {
    return providerError("AI_PROVIDER_AUTH_FAILED", 503);
  }
  if (error.status === 429) {
    return providerError("AI_PROVIDER_RATE_LIMITED", 429);
  }

  const code = typeof error.code === "string" ? error.code : "";
  const param = typeof error.param === "string" ? error.param : "";
  if (
    code === "model_not_found" ||
    code === "unsupported_model" ||
    param === "model"
  ) {
    return providerError("AI_MODEL_UNAVAILABLE", 503);
  }
  if (typeof error.status === "number" && error.status >= 500) {
    return providerError("AI_PROVIDER_UNAVAILABLE", 503);
  }
  return providerError("AI_PROVIDER_REQUEST_FAILED", 502);
}
