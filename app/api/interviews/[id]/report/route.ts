import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api/handler";
import { requireApiUser } from "@/lib/auth/guards";
import { getInterviewReport } from "@/lib/services/interview-service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const report = await getInterviewReport(user.id, id);
    return NextResponse.json({ report });
  } catch (error) {
    return handleRouteError(error);
  }
}
