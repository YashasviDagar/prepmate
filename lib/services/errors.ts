export type ServiceErrorCode =
  | "NOT_FOUND"
  | "VALIDATION"
  | "INVALID_STATE"
  | "AI_UNAVAILABLE"
  | "RATE_LIMITED";

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly retryable: boolean;

  constructor(code: ServiceErrorCode, message: string, retryable = false) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.retryable = retryable;
  }
}
