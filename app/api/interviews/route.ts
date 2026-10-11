import { NextResponse } from "next/server";

import { errorResponse, handleRouteError } from "@/lib/api/handler";
import { requireApiUser } from "@/lib/auth/guards";
import {
  createInterview,
  listInterviews,
} from "@/lib/services/interview-service";
import { createInterviewSchema } from "@/lib/validation/interview";

export async function GET() {
  try {
    const user = await requireApiUser();
    const interviews = await listInterviews(user.id);
    return NextResponse.json({ interviews });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body: unknown = await request.json().catch(() => null);

    const parsed = createInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION",
        "Invalid interview configuration.",
        400,
      );
    }

    const interview = await createInterview(user.id, parsed.data);
    return NextResponse.json({ interview }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
