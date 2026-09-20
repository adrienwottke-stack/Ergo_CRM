export type AiCrmConfig = {
  globallyEnabled: boolean;
  model: string;
  transcriptionModel: string;
  productPriceCents: number;
  currency: "eur";
  monthlyRequestLimit: number;
  monthlyAudioSecondsLimit: number;
  monthlyToolCallLimit: number;
  maxToolRounds: number;
  maxAudioBytes: number;
  maxAudioSeconds: number;
  conversationRetentionDays: number;
  conversationMaxMessages: number;
  providerTimeoutMs: number;
  providerMaxRetries: number;
  stripeTimeoutMs: number;
  stripeMaxRetries: number;
  costCurrency: string;
  inputMicrosPerMillionTokens: number;
  outputMicrosPerMillionTokens: number;
  audioMicrosPerMinute: number;
  liveProvider: "disabled" | "mock" | "realtime";
  liveModel: string;
  liveMaxSessionSeconds: number;
  liveReconnectLimit: number;
  liveRealtimeApproved: boolean;
  liveSidebandUrl: string | null;
};

function integer(name: string, fallback: number, minimum = 0): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${name} muss eine ganze Zahl ab ${minimum} sein.`);
  }
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  if (raw === "1" || raw.toLowerCase() === "true") return true;
  if (raw === "0" || raw.toLowerCase() === "false") return false;
  throw new Error(`${name} muss true/false oder 1/0 sein.`);
}

function liveProvider(): AiCrmConfig["liveProvider"] {
  const fallback = process.env.NODE_ENV === "production" ? "disabled" : "mock";
  const raw = (process.env.AI_LIVE_PROVIDER?.trim().toLowerCase() || fallback) as
    | "disabled"
    | "mock"
    | "realtime";
  if (!["disabled", "mock", "realtime"].includes(raw)) {
    throw new Error("AI_LIVE_PROVIDER muss disabled, mock oder realtime sein.");
  }
  // A production deployment must be an explicit integration, never a demo
  // accidentally exposed because NODE_ENV differs between local and Vercel.
  if (raw === "mock" && process.env.NODE_ENV === "production") return "disabled";
  return raw;
}

/**
 * Eine zentrale Quelle fuer Produktpreis, Modelle und Kostenbremsen.
 * Providerpreise koennen sich aendern; deshalb lassen sie sich ohne Deploy
 * ueber ENV anpassen und werden nie fuer rechtliche Preiszusagen verwendet.
 */
export function aiCrmConfig(): AiCrmConfig {
  return {
    globallyEnabled: bool("AI_CRM_ENABLED", false),
    model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
    transcriptionModel:
      process.env.AI_TRANSCRIPTION_MODEL?.trim() || "gpt-4o-mini-transcribe",
    productPriceCents: integer("AI_CRM_PRICE_CENTS", 1500, 1),
    currency: "eur",
    monthlyRequestLimit: integer("AI_MAX_MONTHLY_REQUESTS", 300, 1),
    monthlyAudioSecondsLimit: integer(
      "AI_MAX_MONTHLY_AUDIO_SECONDS",
      3600,
      1,
    ),
    monthlyToolCallLimit: integer("AI_MAX_MONTHLY_TOOL_CALLS", 1500, 1),
    maxToolRounds: integer("AI_MAX_TOOL_ROUNDS", 6, 1),
    maxAudioBytes: integer("AI_MAX_AUDIO_BYTES", 5 * 1024 * 1024, 1024),
    maxAudioSeconds: integer("AI_MAX_AUDIO_SECONDS", 60, 1),
    conversationRetentionDays: integer(
      "AI_CONVERSATION_RETENTION_DAYS",
      7,
      1,
    ),
    conversationMaxMessages: integer("AI_CONVERSATION_MAX_MESSAGES", 20, 2),
    providerTimeoutMs: integer("AI_PROVIDER_TIMEOUT_MS", 45_000, 1_000),
    providerMaxRetries: integer("AI_PROVIDER_MAX_RETRIES", 1),
    stripeTimeoutMs: integer("STRIPE_PROVIDER_TIMEOUT_MS", 20_000, 1_000),
    stripeMaxRetries: integer("STRIPE_PROVIDER_MAX_RETRIES", 1),
    costCurrency: process.env.AI_COST_CURRENCY?.trim().toUpperCase() || "USD",
    inputMicrosPerMillionTokens: integer(
      "AI_COST_INPUT_MICROS_PER_MILLION_TOKENS",
      0,
    ),
    outputMicrosPerMillionTokens: integer(
      "AI_COST_OUTPUT_MICROS_PER_MILLION_TOKENS",
      0,
    ),
    audioMicrosPerMinute: integer("AI_COST_AUDIO_MICROS_PER_MINUTE", 0),
    liveProvider: liveProvider(),
    // Current official WebRTC examples use the maintained Realtime model.
    // This value is server-only preparation; the mock never sends it to a
    // provider and the browser cannot override it.
    liveModel: process.env.AI_LIVE_MODEL?.trim() || "gpt-realtime-2.1",
    liveMaxSessionSeconds: integer("AI_LIVE_MAX_SESSION_SECONDS", 600, 30),
    liveReconnectLimit: integer("AI_LIVE_RECONNECT_LIMIT", 1),
    liveRealtimeApproved: bool("AI_LIVE_REALTIME_APPROVED", false),
    liveSidebandUrl: process.env.AI_LIVE_SIDEBAND_URL?.trim() || null,
  };
}

export function formatAiPrice(config = aiCrmConfig()): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: 0,
  }).format(config.productPriceCents / 100);
}

export function estimateTextCostMicros(
  inputTokens: number,
  outputTokens: number,
  config = aiCrmConfig(),
): number {
  return Math.round(
    (Math.max(0, inputTokens) * config.inputMicrosPerMillionTokens +
      Math.max(0, outputTokens) * config.outputMicrosPerMillionTokens) /
      1_000_000,
  );
}

export function estimateAudioCostMicros(
  audioSeconds: number,
  config = aiCrmConfig(),
): number {
  return Math.round(
    (Math.max(0, audioSeconds) / 60) * config.audioMicrosPerMinute,
  );
}
