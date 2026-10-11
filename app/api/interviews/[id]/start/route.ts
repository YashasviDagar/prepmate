import { NextResponse } from "next/server";

import { errorResponse, handleRouteError } from "@/lib/api/handler";
import { requireApiUser } from "@/lib/auth/guards";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { startInterview } from "@/lib/services/interview-service";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const ip = await getClientIp();

    const limit = rateLimit(`interview:start:${user.id}:${ip}`, 20, 60_000);
    if (!limit.ok) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many requests. Please slow down.",
        429,
        true,
      );
    }

    const { id } = await context.params;
    const state = await startInterview(user.id, id);
    return NextResponse.json({ interview: state });
  } catch (error) {
    return handleRouteError(error);
  }
}
