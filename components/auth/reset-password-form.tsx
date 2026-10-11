"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/shared/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialAuthState } from "@/lib/auth/action-state";
import { resetPasswordAction } from "@/lib/auth/actions";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [state, formAction] = useActionState(
    resetPasswordAction,
    initialAuthState,
  );

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Missing reset token</AlertTitle>
        <AlertDescription>
          This reset link is incomplete.{" "}
          <Link href="/forgot-password" className="font-medium underline">
            Request a new one
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "success") {
    return (
      <Alert>
        <AlertTitle>Password updated</AlertTitle>
        <AlertDescription>
          {state.message}{" "}
          <Link href="/login" className="font-medium underline">
            Go to login
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
        />
        {state.fieldErrors?.password?.map((message) => (
          <p key={message} className="text-destructive text-xs">
            {message}
          </p>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          required
        />
        {state.fieldErrors?.confirmPassword?.map((message) => (
          <p key={message} className="text-destructive text-xs">
            {message}
          </p>
        ))}
      </div>

      <SubmitButton className="w-full" pendingLabel="Updating…">
        Reset password
      </SubmitButton>
    </form>
  );
}
