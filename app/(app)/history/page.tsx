import { HistoryIcon } from "lucide-react";
import type { Metadata } from "next";

import { InterviewHistoryTable } from "@/components/history/interview-history-table";
import { EmptyState } from "@/components/shared/empty-state";
import { requireUser } from "@/lib/auth/guards";
import { listInterviews } from "@/lib/services/interview-service";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const user = await requireUser();
  const interviews = await listInterviews(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Interview history
        </h1>
        <p className="text-muted-foreground text-sm">
          Every mock interview you have taken, newest first.
        </p>
      </div>

      {interviews.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No interviews yet"
          description="Your completed and in-progress interviews will be listed here."
          actionLabel="Create interview"
          actionHref="/interview/new"
        />
      ) : (
        <InterviewHistoryTable interviews={interviews} />
      )}
    </div>
  );
}
