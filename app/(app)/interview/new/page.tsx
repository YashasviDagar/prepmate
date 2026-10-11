import type { Metadata } from "next";

import {
  InterviewConfigForm,
  type InterviewConfigDefaults,
} from "@/components/interview/interview-config-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import {
  ExperienceLevel,
  InterviewType,
  Role,
} from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "New interview" };

export default async function NewInterviewPage() {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      targetRole: true,
      experienceLevel: true,
      preferredInterviewType: true,
    },
  });

  const defaults: InterviewConfigDefaults = {
    role: user?.targetRole ?? Role.FRONTEND_DEVELOPER,
    experienceLevel: user?.experienceLevel ?? ExperienceLevel.INTERMEDIATE,
    interviewType: user?.preferredInterviewType ?? InterviewType.TECHNICAL,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create a mock interview
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure the role, difficulty and topics. The AI adapts as you go.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview configuration</CardTitle>
          <CardDescription>
            Defaults come from your profile — change anything for this session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InterviewConfigForm defaults={defaults} />
        </CardContent>
      </Card>
    </div>
  );
}
