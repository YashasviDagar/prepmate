import { prisma } from "@/lib/db/prisma";
import {
  InterviewStatus,
  type InterviewType,
  type Role,
} from "@/lib/generated/prisma/enums";
import type { InterviewSummaryDto } from "@/lib/services/interview-service";

export type ProgressionPoint = {
  label: string;
  score: number;
  technical: number;
  communication: number;
};

export type DashboardData = {
  interviewsCompleted: number;
  interviewsInProgress: number;
  averageScore: number | null;
  averageTechnical: number | null;
  averageCommunication: number | null;
  averageProblemSolving: number | null;
  strongestSkill: { skill: string; score: number } | null;
  weakestSkill: { skill: string; score: number } | null;
  recentInterview: InterviewSummaryDto | null;
  progression: ProgressionPoint[];
  topicPerformance: { skill: string; score: number }[];
};

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

async function loadCompletedInterviews(userId: string) {
  return prisma.interview.findMany({
    where: { userId, status: InterviewStatus.COMPLETED },
    orderBy: { completedAt: "asc" },
    select: {
      id: true,
      role: true,
      type: true,
      mode: true,
      difficulty: true,
      questionCount: true,
      topics: true,
      score: true,
      technicalScore: true,
      communicationScore: true,
      problemSolvingScore: true,
      durationSec: true,
      createdAt: true,
      completedAt: true,
      _count: { select: { questions: true } },
    },
  });
}

function toSummary(
  interview: Awaited<ReturnType<typeof loadCompletedInterviews>>[number],
): InterviewSummaryDto {
  return {
    id: interview.id,
    role: interview.role as Role,
    type: interview.type as InterviewType,
    mode: interview.mode,
    difficulty: interview.difficulty,
    status: InterviewStatus.COMPLETED,
    questionCount: interview.questionCount,
    topics: interview.topics,
    score: interview.score,
    durationSec: interview.durationSec,
    createdAt: interview.createdAt.toISOString(),
    completedAt: interview.completedAt?.toISOString() ?? null,
    answeredQuestions: interview._count.questions,
  };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [completed, inProgressCount, skillRows, latest] = await Promise.all([
    loadCompletedInterviews(userId),
    prisma.interview.count({
      where: { userId, status: InterviewStatus.IN_PROGRESS },
    }),
    prisma.skillPerformance.findMany({
      where: { userId },
      orderBy: { score: "desc" },
      select: { skill: true, score: true },
    }),
    prisma.interview.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        questions: { select: { id: true, answer: { select: { id: true } } } },
      },
    }),
  ]);

  const progression: ProgressionPoint[] = completed.map((interview, index) => ({
    label: `#${index + 1}`,
    score: interview.score ?? 0,
    technical: interview.technicalScore ?? 0,
    communication: interview.communicationScore ?? 0,
  }));

  const topicPerformance = skillRows.map((row) => ({
    skill: row.skill,
    score: row.score,
  }));

  const recentInterview: InterviewSummaryDto | null = latest
    ? {
        id: latest.id,
        role: latest.role,
        type: latest.type,
        mode: latest.mode,
        difficulty: latest.difficulty,
        status: latest.status,
        questionCount: latest.questionCount,
        topics: latest.topics,
        score: latest.score,
        durationSec: latest.durationSec,
        createdAt: latest.createdAt.toISOString(),
        completedAt: latest.completedAt?.toISOString() ?? null,
        answeredQuestions: latest.questions.filter((q) => q.answer).length,
      }
    : null;

  return {
    interviewsCompleted: completed.length,
    interviewsInProgress: inProgressCount,
    averageScore: mean(completed.map((i) => i.score).filter((v): v is number => v != null)),
    averageTechnical: mean(
      completed.map((i) => i.technicalScore).filter((v): v is number => v != null),
    ),
    averageCommunication: mean(
      completed
        .map((i) => i.communicationScore)
        .filter((v): v is number => v != null),
    ),
    averageProblemSolving: mean(
      completed
        .map((i) => i.problemSolvingScore)
        .filter((v): v is number => v != null),
    ),
    strongestSkill: skillRows[0] ?? null,
    weakestSkill: skillRows.length > 0 ? skillRows[skillRows.length - 1]! : null,
    recentInterview,
    progression,
    topicPerformance,
  };
}

export type AnalyticsData = {
  totals: {
    interviews: number;
    questions: number;
    answers: number;
    practiceMinutes: number;
  };
  averages: {
    overall: number | null;
    technical: number | null;
    communication: number | null;
    problemSolving: number | null;
  };
  progression: ProgressionPoint[];
  topicPerformance: { skill: string; score: number }[];
  radar: { dimension: string; score: number }[];
  recentInterviews: InterviewSummaryDto[];
};

export async function getAnalyticsData(userId: string): Promise<AnalyticsData> {
  const completed = await loadCompletedInterviews(userId);

  const [questionCount, answerCount, skillRows] = await Promise.all([
    prisma.interviewQuestion.count({ where: { interview: { userId } } }),
    prisma.answer.count({ where: { question: { interview: { userId } } } }),
    prisma.skillPerformance.findMany({
      where: { userId },
      orderBy: { score: "asc" },
      select: { skill: true, score: true },
    }),
  ]);

  const totalSeconds = completed.reduce(
    (total, interview) => total + (interview.durationSec ?? 0),
    0,
  );

  const averages = {
    overall: mean(completed.map((i) => i.score).filter((v): v is number => v != null)),
    technical: mean(
      completed.map((i) => i.technicalScore).filter((v): v is number => v != null),
    ),
    communication: mean(
      completed
        .map((i) => i.communicationScore)
        .filter((v): v is number => v != null),
    ),
    problemSolving: mean(
      completed
        .map((i) => i.problemSolvingScore)
        .filter((v): v is number => v != null),
    ),
  };

  const progression: ProgressionPoint[] = completed.map((interview, index) => ({
    label: `#${index + 1}`,
    score: interview.score ?? 0,
    technical: interview.technicalScore ?? 0,
    communication: interview.communicationScore ?? 0,
  }));

  return {
    totals: {
      interviews: completed.length,
      questions: questionCount,
      answers: answerCount,
      practiceMinutes: Math.round(totalSeconds / 60),
    },
    averages,
    progression,
    topicPerformance: skillRows.map((row) => ({
      skill: row.skill,
      score: row.score,
    })),
    radar: [
      { dimension: "Technical", score: averages.technical ?? 0 },
      { dimension: "Communication", score: averages.communication ?? 0 },
      { dimension: "Problem solving", score: averages.problemSolving ?? 0 },
      { dimension: "Overall", score: averages.overall ?? 0 },
    ],
    recentInterviews: completed.slice(-5).reverse().map(toSummary),
  };
}
