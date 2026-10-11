import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      targetRole: true,
      experienceLevel: true,
      preferredInterviewType: true,
      skills: true,
    },
  });

  if (!user) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          We only store what is needed to personalise your practice.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>
            Signed in as {user.email}. Target role and skills shape question
            generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            values={{
              name: user.name ?? "",
              targetRole: user.targetRole,
              experienceLevel: user.experienceLevel,
              preferredInterviewType: user.preferredInterviewType,
              skills: user.skills,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
