import { NextResponse } from "next/server";

import { AIError } from "@/lib/ai/errors";
import { UnauthorizedError } from "@/lib/auth/guards";
import { ServiceError } from "@/lib/services/errors";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

export function errorResponse(
  code: string,
  message: string,
  status: number,
  retryable = false,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, retryable } },
    { status },
  );
}

const SERVICE_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  VALIDATION: 400,
  INVALID_STATE: 409,
  RATE_LIMITED: 429,
  AI_UNAVAILABLE: 503,
};

export function handleRouteError(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof UnauthorizedError) {
    return errorResponse("UNAUTHORIZED", "You must be signed in.", 401);
  }

  if (error instanceof ServiceError) {
    return errorResponse(
      error.code,
      error.message,
      SERVICE_STATUS[error.code] ?? 500,
      error.retryable,
    );
  }

  if (error instanceof AIError) {
    return errorResponse(
      error.code,
      "The AI interviewer is temporarily unavailable. Your progress is saved.",
      error.code === "AI_TIMEOUT" ? 504 : 503,
      error.retryable,
    );
  }

  console.error("[api] unhandled error", error);
  return errorResponse("INTERNAL", "Something went wrong.", 500, true);
}
