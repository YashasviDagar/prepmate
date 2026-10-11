import type { FormState } from "@/lib/forms";

export type AuthActionState = FormState & {
  /** Only populated in development when no email provider is configured. */
  resetLink?: string;
};

export const initialAuthState: AuthActionState = { status: "idle" };
