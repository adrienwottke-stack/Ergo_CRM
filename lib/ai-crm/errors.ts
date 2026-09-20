export class AiCrmError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status = 400,
  ) {
    super(message);
    this.name = "AiCrmError";
    this.code = code;
    this.status = status;
  }
}

export function safeAiMessage(error: unknown): string {
  if (error instanceof AiCrmError) return error.message;
  return "Das konnte gerade nicht gespeichert werden. Bitte versuche es erneut.";
}
