import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api/handler";
import { requireApiUser } from "@/lib/auth/guards";
import {
  deleteInterview,
  getInterviewState,
} from "@/lib/services/interview-service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const state = await getInterviewState(user.id, id);
    return NextResponse.json({ interview: state });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    await deleteInterview(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
