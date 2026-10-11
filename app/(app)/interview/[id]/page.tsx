import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { InterviewRunner } from "@/components/interview/interview-runner";
import { InterviewUnavailable } from "@/components/interview/interview-unavailable";
import { requireUser } from "@/lib/auth/guards";
import { InterviewStatus } from "@/lib/generated/prisma/enums";
import { ServiceError } from "@/lib/services/errors";
import {
  startInterview,
  type InterviewStateDto,
} from "@/lib/services/interview-service";

export const metadata: Metadata = { title: "Interview" };

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  let state: InterviewStateDto;
  try {
    state = await startInterview(user.id, id);
  } catch (error) {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") notFound();
    if (error instanceof ServiceError && error.code === "AI_UNAVAILABLE") {
      return <InterviewUnavailable interviewId={id} />;
    }
    throw error;
  }

  if (state.status === InterviewStatus.COMPLETED) {
    redirect(`/interview/${id}/results`);
  }

  return <InterviewRunner initialState={state} />;
}
