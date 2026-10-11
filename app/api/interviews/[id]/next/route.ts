import { NextResponse } from "next/server";

import { errorResponse, handleRouteError } from "@/lib/api/handler";
import { requireApiUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { advanceInterview } from "@/lib/services/interview-service";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const user = await requireApiUser();

    const limit = await rateLimit(`interview:next:${user.id}`, 40, 60_000);
    if (!limit.ok) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many requests. Please slow down.",
        429,
        true,
      );
    }

    const { id } = await context.params;
    const state = await advanceInterview(user.id, id);
    return NextResponse.json({ interview: state });
  } catch (error) {
    return handleRouteError(error);
  }
}
