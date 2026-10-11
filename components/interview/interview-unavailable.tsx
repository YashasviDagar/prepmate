"use client";

import { RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function InterviewUnavailable({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Alert variant="destructive">
        <AlertTitle>The AI interviewer is temporarily unavailable</AlertTitle>
        <AlertDescription>
          Your interview state has been saved. You can retry now or come back
          later — your progress will not be lost.
        </AlertDescription>
      </Alert>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            router.refresh();
          }}
        >
          <RefreshCwIcon className="size-4" />
          {retrying ? "Retrying…" : "Retry"}
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/interview/${interviewId}`}>Resume later</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
