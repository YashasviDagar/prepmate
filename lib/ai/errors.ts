export type AIErrorCode =
  | "AI_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "INVALID_AI_RESPONSE"
  | "AI_NOT_CONFIGURED"
  | "AI_UNKNOWN";

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly retryable: boolean;

  constructor(code: AIErrorCode, message: string, options?: { retryable?: boolean; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "AIError";
    this.code = code;
    this.retryable =
      options?.retryable ??
      (code === "AI_TIMEOUT" || code === "AI_UNAVAILABLE");
  }
}

export function toAIError(error: unknown): AIError {
  if (error instanceof AIError) return error;

  if (error instanceof Error && error.name === "AbortError") {
    return new AIError("AI_TIMEOUT", "The AI provider timed out.");
  }

  return new AIError("AI_UNKNOWN", "The AI provider failed unexpectedly.", {
    retryable: true,
    cause: error,
  });
}
