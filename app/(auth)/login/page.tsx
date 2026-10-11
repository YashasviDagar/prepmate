import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Log in" };

type SearchParams = Promise<{
  redirectTo?: string | string[];
  error?: string | string[];
}>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const redirectTo =
    typeof params.redirectTo === "string" ? params.redirectTo : undefined;
  const hasError = Boolean(params.error);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Log in to continue your interview practice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {hasError ? (
          <Alert variant="destructive">
            <AlertDescription>
              We could not sign you in. Please try again.
            </AlertDescription>
          </Alert>
        ) : null}
        <LoginForm redirectTo={redirectTo} />
      </CardContent>
    </Card>
  );
}
