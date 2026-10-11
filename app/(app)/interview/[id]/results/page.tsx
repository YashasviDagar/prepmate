import {
  ArrowLeftIcon,
  RotateCcwIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SkillRadarChart } from "@/components/analytics/skill-radar-chart";
import { TopicBarChart } from "@/components/analytics/topic-bar-chart";
import { FeedbackPanel } from "@/components/interview/feedback-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DIFFICULTY_LABELS,
  INTERVIEW_TYPE_LABELS,
  ROLE_LABELS,
} from "@/lib/domain/interview";
import { formatDateTime, formatDuration } from "@/lib/format";
import { requireUser } from "@/lib/auth/guards";
import { ServiceError } from "@/lib/services/errors";
import { getInterviewReport } from "@/lib/services/interview-service";

export const metadata: Metadata = { title: "Interview results" };

export default async function InterviewResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  let report;
  try {
    report = await getInterviewReport(user.id, id);
  } catch (error) {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const { interview, scores, topicPerformance, strongest, weakest } = report;

  const radarData = [
    { dimension: "Technical", score: scores.technical },
    { dimension: "Communication", score: scores.communication },
    { dimension: "Problem solving", score: scores.problemSolving },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {interview.status === "COMPLETED"
              ? "Interview complete"
              : "Interview in progress"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {ROLE_LABELS[interview.role]} ·{" "}
            {INTERVIEW_TYPE_LABELS[interview.type]} ·{" "}
            {DIFFICULTY_LABELS[interview.difficulty]}
            {interview.completedAt
              ? ` · completed ${formatDateTime(interview.completedAt)}`
              : ""}
            {interview.durationSec != null
              ? ` · ${formatDuration(interview.durationSec)}`
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/history">
              <ArrowLeftIcon className="size-4" /> History
            </Link>
          </Button>
          <Button asChild>
            <Link href="/interview/new">
              <RotateCcwIcon className="size-4" /> New interview
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard label="Overall" value={scores.overall} highlight />
        <ScoreCard label="Technical knowledge" value={scores.technical} />
        <ScoreCard label="Communication" value={scores.communication} />
        <ScoreCard label="Problem solving" value={scores.problemSolving} />
      </div>

      <p className="text-muted-foreground text-xs">
        Delivery / confidence is only reported when voice answers are used, and
        only describes observable speech characteristics. It is never a
        psychological assessment.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skill profile</CardTitle>
            <CardDescription>Average across scored dimensions.</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillRadarChart data={radarData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topic performance</CardTitle>
            <CardDescription>Average score per topic (0–100).</CardDescription>
          </CardHeader>
          <CardContent>
            <TopicBarChart data={topicPerformance} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUpIcon className="text-primary size-4" /> Strong areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strongest.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Not enough scored answers yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {strongest.map((item) => (
                  <li
                    key={item.skill}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{item.skill}</span>
                    <Badge variant="secondary">{item.score.toFixed(0)}%</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDownIcon className="text-destructive size-4" /> Areas to
              improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weakest.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Not enough scored answers yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {weakest.map((item) => (
                  <li
                    key={item.skill}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{item.skill}</span>
                    <Badge variant="outline">{item.score.toFixed(0)}%</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {report.recommendation ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SparklesIcon className="size-4" /> Recommended preparation
            </CardTitle>
            <CardDescription>{report.recommendation.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-5 text-sm">
              {report.recommendation.items.map((item) => (
                <li key={item.title}>
                  <span className="font-medium">{item.title}</span>
                  <p className="text-muted-foreground">{item.detail}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Question-by-question analysis
          </CardTitle>
          <CardDescription>
            {report.questions.length} question
            {report.questions.length === 1 ? "" : "s"} in this interview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.questions.map((question, index) => (
            <details
              key={question.id}
              className="group rounded-lg border px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="text-muted-foreground shrink-0 text-xs font-medium">
                    Q{index + 1}
                  </span>
                  <span className="truncate text-sm">{question.question}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {question.isFollowUp ? (
                    <Badge variant="outline">Follow-up</Badge>
                  ) : null}
                  {question.skipped ? (
                    <Badge variant="destructive">Skipped</Badge>
                  ) : null}
                  <Badge
                    variant={
                      question.answer?.score == null
                        ? "outline"
                        : question.answer.score >= 7
                          ? "default"
                          : "secondary"
                    }
                  >
                    {question.answer?.score != null
                      ? `${(question.answer.score * 10).toFixed(0)}/100`
                      : "—"}
                  </Badge>
                </span>
              </summary>

              <div className="mt-4 space-y-4">
                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>Topic: {question.topic}</span>
                  <span>Difficulty: {DIFFICULTY_LABELS[question.difficulty]}</span>
                  <span>Expected: {question.expectedConcepts.join(", ")}</span>
                </div>

                {question.answer ? (
                  <div className="bg-muted/40 rounded-md p-3 text-sm">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">
                      Your answer
                    </p>
                    {question.answer.answer}
                  </div>
                ) : null}

                {question.answer?.feedback ? (
                  <FeedbackPanel evaluation={question.answer.feedback} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No evaluation stored for this question.
                  </p>
                )}
              </div>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/40" : undefined}>
      <CardContent className="space-y-1 py-5">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-3xl font-semibold tabular-nums">
          {value.toFixed(0)}
          <span className="text-muted-foreground text-sm font-normal">/100</span>
        </p>
      </CardContent>
    </Card>
  );
}
