import { NextResponse } from "next/server";

import { errorResponse, handleRouteError } from "@/lib/api/handler";
import { requireApiUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { submitAnswer } from "@/lib/services/interview-service";
import { submitAnswerSchema } from "@/lib/validation/interview";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireApiUser();

    const limit = rateLimit(`interview:answer:${user.id}`, 40, 60_000);
    if (!limit.ok) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many submissions. Please slow down.",
        429,
        true,
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = submitAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION", "Invalid answer payload.", 400);
    }

    const { id } = await context.params;
    const state = await submitAnswer(user.id, id, parsed.data);
    return NextResponse.json({ interview: state });
  } catch (error) {
    return handleRouteError(error);
  }
}
