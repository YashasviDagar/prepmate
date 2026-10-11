import {
  ArrowRightIcon,
  BarChart3Icon,
  ClockIcon,
  GaugeIcon,
  MessageSquareIcon,
  SparklesIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ScoreLineChart } from "@/components/analytics/score-line-chart";
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
import { getDashboardData } from "@/lib/services/analytics-service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  const hasInterviews = data.interviewsCompleted > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm">
            Track your progress and start a new mock interview.
          </p>
        </div>
        <Button asChild>
          <Link href="/interview/new">
            <SparklesIcon className="size-4" />
            Start interview
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TargetIcon}
          label="Interviews completed"
          value={data.interviewsCompleted.toString()}
          hint={
            data.interviewsInProgress > 0
              ? `${data.interviewsInProgress} in progress`
              : undefined
          }
        />
        <StatCard
          icon={GaugeIcon}
          label="Average score"
          value={data.averageScore != null ? data.averageScore.toFixed(1) : "—"}
        />
        <StatCard
          icon={BarChart3Icon}
          label="Average technical"
          value={
            data.averageTechnical != null
              ? data.averageTechnical.toFixed(1)
              : "—"
          }
        />
        <StatCard
          icon={MessageSquareIcon}
          label="Average communication"
          value={
            data.averageCommunication != null
              ? data.averageCommunication.toFixed(1)
              : "—"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Score progression</CardTitle>
            <CardDescription>
              Overall score across completed interviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreLineChart data={data.progression} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUpIcon className="text-primary size-4" /> Strongest
                skill
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.strongestSkill ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{data.strongestSkill.skill}</span>
                  <Badge variant="secondary">
                    {data.strongestSkill.score.toFixed(0)}%
                  </Badge>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Complete an interview to reveal this.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDownIcon className="text-destructive size-4" /> Weakest
                skill
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.weakestSkill ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{data.weakestSkill.skill}</span>
                  <Badge variant="outline">
                    {data.weakestSkill.score.toFixed(0)}%
                  </Badge>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Complete an interview to reveal this.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Recent interview</CardTitle>
            <CardDescription>Your latest session.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/history">
              View all <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentInterview ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {ROLE_LABELS[data.recentInterview.role]}
                </p>
                <p className="text-muted-foreground text-xs">
                  {INTERVIEW_TYPE_LABELS[data.recentInterview.type]} ·{" "}
                  {DIFFICULTY_LABELS[data.recentInterview.difficulty]} ·{" "}
                  {data.recentInterview.answeredQuestions} questions
                </p>
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <ClockIcon className="size-3" />
                  {formatRelativeTime(data.recentInterview.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {data.recentInterview.score != null ? (
                  <Badge>{data.recentInterview.score.toFixed(0)}/100</Badge>
                ) : (
                  <Badge variant="secondary">In progress</Badge>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={
                      data.recentInterview.status === "COMPLETED"
                        ? `/interview/${data.recentInterview.id}/results`
                        : `/interview/${data.recentInterview.id}`
                    }
                  >
                    {data.recentInterview.status === "COMPLETED"
                      ? "View results"
                      : "Resume"}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={SparklesIcon}
              title="No interviews yet"
              description="Create your first mock interview to start building your analytics."
              actionLabel="Create interview"
              actionHref="/interview/new"
            />
          )}
        </CardContent>
      </Card>

      {hasInterviews && data.topicPerformance.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topic snapshot</CardTitle>
            <CardDescription>
              Rolling average per topic across all interviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.topicPerformance.slice(0, 9).map((topic) => (
              <div
                key={topic.skill}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="truncate">{topic.skill}</span>
                <span className="text-muted-foreground tabular-nums">
                  {topic.score.toFixed(0)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-muted-foreground text-center text-xs">
        Scores come from an AI heuristic and are not a validated assessment of
        ability or employability.
      </p>
    </div>
  );
}

function StatCard({
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
        {hint ? (
          <p className="text-muted-foreground text-xs">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
