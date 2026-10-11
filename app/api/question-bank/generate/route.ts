import { NextResponse } from "next/server";

import { errorResponse, handleRouteError } from "@/lib/api/handler";
import { requireApiUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { generateQuestionBankItem } from "@/lib/services/question-bank-service";
import { generateQuestionBankItemSchema } from "@/lib/validation/interview";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();

    const limit = await rateLimit(`question-bank:generate:${user.id}`, 10, 60_000);
    if (!limit.ok) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many generations. Please slow down.",
        429,
        true,
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = generateQuestionBankItemSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION", "Invalid generation request.", 400);
    }

    const item = await generateQuestionBankItem(parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
