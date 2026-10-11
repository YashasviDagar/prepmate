"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import type { FormState } from "@/lib/forms";
import {
  ExperienceLevel,
  InterviewType,
  Role,
} from "@/lib/generated/prisma/enums";

const optionalEnum = <T extends Record<string, string>>(values: T) =>
  z
    .string()
    .optional()
    .transform((value) => (value && value in values ? (value as keyof T) : undefined));

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  targetRole: optionalEnum(Role),
  experienceLevel: optionalEnum(ExperienceLevel),
  preferredInterviewType: optionalEnum(InterviewType),
  skills: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 30),
    ),
});

export async function updateProfileAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireApiUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    targetRole: formData.get("targetRole") ?? undefined,
    experienceLevel: formData.get("experienceLevel") ?? undefined,
    preferredInterviewType: formData.get("preferredInterviewType") ?? undefined,
    skills: formData.get("skills") ?? undefined,
  });

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    };
  }

  const { name, targetRole, experienceLevel, preferredInterviewType, skills } =
    parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      targetRole: targetRole ?? null,
      experienceLevel: experienceLevel ?? null,
      preferredInterviewType: preferredInterviewType ?? null,
      skills,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { status: "success", message: "Profile updated." };
}
