import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

export type AuthenticatedUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "DuplicateEmailError";
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Verifies email/password credentials. Returns null for unknown users,
 * OAuth-only accounts (no password hash) and incorrect passwords — callers must
 * not distinguish between these cases in user-facing messages.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!user?.passwordHash) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}

/**
 * Creates a credentials user. Throws {@link DuplicateEmailError} when the email
 * is already registered.
 */
export async function createCredentialsUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string }> {
  const email = normalizeEmail(input.email);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) throw new DuplicateEmailError();

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: { name: input.name, email, passwordHash },
    select: { id: true },
  });
}
