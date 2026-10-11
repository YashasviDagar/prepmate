import { BarChart3Icon, ClockIcon, ListChecksIcon, TargetIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ScoreLineChart } from "@/components/analytics/score-line-chart";
import { SkillRadarChart } from "@/components/analytics/skill-radar-chart";
import { TopicBarChart } from "@/components/analytics/topic-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import {
  DIFFICULTY_LABELS,
  INTERVIEW_TYPE_LABELS,
  ROLE_LABELS,
} from "@/lib/domain/interview";
import { formatRelativeTime } from "@/lib/format";
import { getAnalyticsData } from "@/lib/services/analytics-service";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getAnalyticsData(user.id);

  if (data.totals.interviews === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <EmptyState
          icon={BarChart3Icon}
          title="No analytics yet"
          description="Complete at least one interview and your performance trends will appear here."
          actionLabel="Create interview"
          actionHref="/interview/new"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Trends across all of your completed interviews.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={TargetIcon}
          label="Overall average"
          value={data.averages.overall?.toFixed(1) ?? "—"}
        />
        <MetricCard
          icon={BarChart3Icon}
          label="Technical"
          value={data.averages.technical?.toFixed(1) ?? "—"}
        />
        <MetricCard
          icon={ListChecksIcon}
          label="Problem solving"
          value={data.averages.problemSolving?.toFixed(1) ?? "—"}
        />
        <MetricCard
          icon={ClockIcon}
          label="Practice time"
          value={`${data.totals.practiceMinutes}m`}
          hint={`${data.totals.answers} answers across ${data.totals.interviews} interviews`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score progression</CardTitle>
            <CardDescription>Overall score per interview.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreLineChart data={data.progression} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skill balance</CardTitle>
            <CardDescription>Average across scored dimensions.</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillRadarChart data={data.radar} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Topic performance</CardTitle>
          <CardDescription>
            Lowest-performing topics are shown first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicBarChart data={data.topicPerformance} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Recent interviews</CardTitle>
            <CardDescription>Your last five completed sessions.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/history">View history</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentInterviews.map((interview) => (
            <Link
              key={interview.id}
              href={`/interview/${interview.id}/results`}
              className="hover:bg-muted/60 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">
                  {ROLE_LABELS[interview.role]}
                </p>
                <p className="text-muted-foreground text-xs">
                  {INTERVIEW_TYPE_LABELS[interview.type]} ·{" "}
                  {DIFFICULTY_LABELS[interview.difficulty]} ·{" "}
                  {formatRelativeTime(interview.createdAt)}
                </p>
              </div>
              <Badge>{interview.score?.toFixed(0) ?? "—"}/100</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-xs">
        Scores are produced by an AI heuristic and are not a validated
        psychometric assessment.
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof TargetIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 py-5">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Icon className="size-3.5" />
          {label}
        </div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
