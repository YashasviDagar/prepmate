"use server";

import { createHash, randomBytes } from "node:crypto";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import type { AuthActionState } from "@/lib/auth/action-state";
import { signIn, signOut } from "@/lib/auth/auth";
import {
  createCredentialsUser,
  DuplicateEmailError,
  verifyCredentials,
} from "@/lib/auth/credentials";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

const emailSchema = z.email("Enter a valid email address").transform((value) =>
  value.trim().toLowerCase(),
);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
  redirectTo: z.string().optional(),
});

const forgotSchema = z.object({ email: emailSchema });

const resetSchema = z
  .object({
    token: z.string().min(10, "Reset token is missing or invalid"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const flattened = z.flattenError(error);
  return flattened.fieldErrors as Record<string, string[]>;
}

function safeRedirectTarget(value: unknown): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const ip = await getClientIp();
  const limit = await rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { name, email, password } = parsed.data;

  try {
    await createCredentialsUser({ name, email, password });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return {
        status: "error",
        message: "An account with this email already exists.",
        fieldErrors: { email: ["This email is already registered"] },
      };
    }
    return {
      status: "error",
      message: "We could not create your account. Please try again.",
    };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    unstable_rethrow(error);
    return {
      status: "error",
      message: "Account created. Please log in to continue.",
    };
  }

  return { status: "success" };
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const ip = await getClientIp();
  const limit = await rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { email, password } = parsed.data;

  const user = await verifyCredentials(email, password);
  if (!user) {
    return { status: "error", message: "Invalid email or password." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeRedirectTarget(parsed.data.redirectTo),
    });
  } catch (error) {
    unstable_rethrow(error);
    return { status: "error", message: "We could not sign you in. Please try again." };
  }

  return { status: "success" };
}

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const ip = await getClientIp();
  const limit = await rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return { status: "error", message: "Too many requests. Please try again later." };
  }

  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a valid email address.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  });

  // Always report success to avoid leaking which emails are registered.
  if (!user) {
    return {
      status: "success",
      message: "If an account exists for that email, a reset link has been generated.",
    };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  let emailed = false;
  try {
    emailed = await sendPasswordResetEmail(user.email, resetLink);
  } catch (error) {
    // Don't reveal delivery failures to the caller (account enumeration).
    console.error("Failed to send password reset email", error);
  }

  // Without a working email provider, surface the link outside production so
  // the flow stays usable in development.
  const exposeLink =
    !emailed &&
    (process.env.NODE_ENV !== "production" ||
      process.env.AUTH_EXPOSE_RESET_LINK === "true");

  return {
    status: "success",
    message: "If an account exists for that email, a reset link has been generated.",
    resetLink: exposeLink ? resetLink : undefined,
  };
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const ip = await getClientIp();
  const limit = await rateLimit(`reset:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expires: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expires.getTime() < Date.now()) {
    return {
      status: "error",
      message: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null },
    }),
  ]);

  return {
    status: "success",
    message: "Your password has been reset. You can now log in.",
  };
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
