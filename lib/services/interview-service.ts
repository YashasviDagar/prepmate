import { getAIProvider } from "@/lib/ai";
import { AIError } from "@/lib/ai/errors";
import type {
  AnswerEvaluation,
  InterviewContext,
} from "@/lib/ai/types";
import {
  RAPID_FIRE_SECONDS_PER_QUESTION,
  revealsFeedbackImmediately,
  topicsForRole,
} from "@/lib/domain/interview";
import { prisma } from "@/lib/db/prisma";
import {
  countByTopic,
  decideNextQuestion,
  performanceSummary,
  shouldAskFollowUp,
} from "@/lib/evaluation/adaptive";
import {
  aggregateInterviewScores,
  computeTopicPerformance,
  rankSkills,
  type InterviewScores,
} from "@/lib/evaluation/scoring";
import {
  Difficulty,
  ExperienceLevel,
  InterviewMode,
  InterviewStatus,
  InterviewType,
  QuestionSource,
  QuestionType,
  Role,
} from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import { ServiceError } from "@/lib/services/errors";
import {
  createInterviewSchema,
  type CreateInterviewInput,
  type SubmitAnswerInput,
} from "@/lib/validation/interview";

export type InterviewQuestionDto = {
  id: string;
  order: number;
  question: string;
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  expectedConcepts: string[];
  isFollowUp: boolean;
  skipped: boolean;
  answer: {
    answer: string;
    inputMode: string;
    score: number | null;
    feedback: AnswerEvaluation | null;
    createdAt: string;
  } | null;
};

export type InterviewStateDto = {
  id: string;
  role: Role;
  type: InterviewType;
  mode: InterviewMode;
  difficulty: Difficulty;
  topics: string[];
  questionCount: number;
  status: InterviewStatus;
  startedAt: string;
  completedAt: string | null;
  durationSec: number | null;
  scores: InterviewScores | null;
  revealFeedback: boolean;
  secondsPerQuestion: number | null;
  progress: {
    currentPrimary: number;
    totalPrimary: number;
    answeredPrimary: number;
    totalQuestions: number;
    isFollowUp: boolean;
    currentQuestion: InterviewQuestionDto | null;
  };
  questions: InterviewQuestionDto[];
};

export type InterviewSummaryDto = {
  id: string;
  role: Role;
  type: InterviewType;
  mode: InterviewMode;
  difficulty: Difficulty;
  status: InterviewStatus;
  questionCount: number;
  topics: string[];
  score: number | null;
  durationSec: number | null;
  createdAt: string;
  completedAt: string | null;
  answeredQuestions: number;
};

type QuestionWithAnswer = Prisma.InterviewQuestionGetPayload<{
  include: { answer: true };
}>;

function toQuestionDto(question: QuestionWithAnswer): InterviewQuestionDto {
  return {
    id: question.id,
    order: question.order,
    question: question.question,
    topic: question.topic,
    difficulty: question.difficulty,
    questionType: question.questionType,
    expectedConcepts: question.expectedConcepts,
    isFollowUp: question.isFollowUp,
    skipped: question.skipped,
    answer: question.answer
      ? {
          answer: question.answer.answer,
          inputMode: question.answer.inputMode,
          score: question.answer.score,
          feedback: (question.answer.feedback as AnswerEvaluation | null) ?? null,
          createdAt: question.answer.createdAt.toISOString(),
        }
      : null,
  };
}

function buildContext(
  interview: {
    role: Role;
    type: InterviewType;
    difficulty: Difficulty;
    mode: InterviewMode;
    topics: string[];
  },
  experienceLevel: ExperienceLevel,
): InterviewContext {
  return {
    role: interview.role,
    experienceLevel,
    interviewType: interview.type,
    difficulty: interview.difficulty,
    mode: interview.mode,
    topics: interview.topics,
  };
}

async function loadUser(userId: string): Promise<{ experienceLevel: ExperienceLevel }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { experienceLevel: true },
  });
  if (!user) throw new ServiceError("NOT_FOUND", "User not found.");
  return { experienceLevel: user.experienceLevel ?? ExperienceLevel.INTERMEDIATE };
}

async function loadInterview(userId: string, interviewId: string) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { answer: true },
      },
    },
  });

  // Ownership is enforced by scoping the query to the user. Returning NOT_FOUND
  // avoids leaking whether another user's interview exists.
  if (!interview) {
    throw new ServiceError("NOT_FOUND", "Interview not found.");
  }
  return interview;
}

function currentQuestion(
  questions: QuestionWithAnswer[],
): QuestionWithAnswer | null {
  return (
    questions.find((question) => !question.answer && !question.skipped) ?? null
  );
}

function toStateDto(
  interview: Awaited<ReturnType<typeof loadInterview>>,
): InterviewStateDto {
  const questions = interview.questions;
  const primaries = questions.filter((question) => !question.isFollowUp);
  const answeredPrimary = primaries.filter(
    (question) => question.answer != null || question.skipped,
  ).length;
  const current = currentQuestion(questions);

  return {
    id: interview.id,
    role: interview.role,
    type: interview.type,
    mode: interview.mode,
    difficulty: interview.difficulty,
    topics: interview.topics,
    questionCount: interview.questionCount,
    status: interview.status,
    startedAt: interview.startedAt.toISOString(),
    completedAt: interview.completedAt?.toISOString() ?? null,
    durationSec: interview.durationSec,
    scores:
      interview.score != null
        ? {
            overall: interview.score,
            technical: interview.technicalScore ?? 0,
            communication: interview.communicationScore ?? 0,
            problemSolving: interview.problemSolvingScore ?? 0,
          }
        : null,
    revealFeedback: revealsFeedbackImmediately(interview.mode),
    secondsPerQuestion:
      interview.mode === InterviewMode.RAPID_FIRE
        ? RAPID_FIRE_SECONDS_PER_QUESTION
        : null,
    progress: {
      // Number of the primary question currently on screen (1-based). Follow-ups
      // keep the number of their parent question.
      currentPrimary: Math.min(
        current && !current.isFollowUp
          ? answeredPrimary + 1
          : Math.max(1, answeredPrimary),
        interview.questionCount,
      ),
      totalPrimary: interview.questionCount,
      answeredPrimary,
      totalQuestions: questions.length,
      isFollowUp: current?.isFollowUp ?? false,
      currentQuestion: current ? toQuestionDto(current) : null,
    },
    questions: questions.map(toQuestionDto),
  };
}

export async function createInterview(
  userId: string,
  input: CreateInterviewInput,
): Promise<{ id: string }> {
  const parsed = createInterviewSchema.safeParse(input);
  if (!parsed.success) {
    throw new ServiceError("VALIDATION", "Invalid interview configuration.");
  }

  const allowed = topicsForRole(parsed.data.role, parsed.data.type);
  const topics = parsed.data.topics.filter((topic) => allowed.includes(topic));
  const finalTopics = topics.length > 0 ? topics : allowed;

  const interview = await prisma.interview.create({
    data: {
      userId,
      role: parsed.data.role,
      type: parsed.data.type,
      mode: parsed.data.mode,
      difficulty: parsed.data.difficulty,
      questionCount: parsed.data.questionCount,
      topics: finalTopics,
      status: InterviewStatus.IN_PROGRESS,
    },
    select: { id: true },
  });

  return interview;
}

export async function listInterviews(userId: string): Promise<InterviewSummaryDto[]> {
  const interviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      questions: { select: { id: true, answer: { select: { id: true } } } },
    },
  });

  return interviews.map((interview) => ({
    id: interview.id,
    role: interview.role,
    type: interview.type,
    mode: interview.mode,
    difficulty: interview.difficulty,
    status: interview.status,
    questionCount: interview.questionCount,
    topics: interview.topics,
    score: interview.score,
    durationSec: interview.durationSec,
    createdAt: interview.createdAt.toISOString(),
    completedAt: interview.completedAt?.toISOString() ?? null,
    answeredQuestions: interview.questions.filter((q) => q.answer).length,
  }));
}

export async function getInterviewState(
  userId: string,
  interviewId: string,
): Promise<InterviewStateDto> {
  const interview = await loadInterview(userId, interviewId);
  return toStateDto(interview);
}

async function persistGeneratedQuestion(
  interviewId: string,
  order: number,
  generated: {
    question: string;
    topic: string;
    difficulty: Difficulty;
    questionType: QuestionType;
    expectedConcepts: string[];
  },
  options: { isFollowUp: boolean; parentQuestionId?: string },
) {
  return prisma.interviewQuestion.create({
    data: {
      interviewId,
      order,
      question: generated.question,
      topic: generated.topic,
      difficulty: generated.difficulty,
      questionType: generated.questionType,
      expectedConcepts: generated.expectedConcepts,
      isFollowUp: options.isFollowUp,
      parentQuestionId: options.parentQuestionId,
      source: QuestionSource.AI,
    },
  });
}

async function generateNextPrimary(
  interview: Awaited<ReturnType<typeof loadInterview>>,
  experienceLevel: ExperienceLevel,
) {
  const provider = getAIProvider();
  const context = buildContext(interview, experienceLevel);

  const answered = interview.questions.filter((q) => q.answer?.score != null);
  const recentScores = answered.slice(-3).map((q) => q.answer!.score!);
  const topicScores = computeTopicPerformance(
    interview.questions
      .filter((q) => q.answer)
      .map((q) => ({
        topic: q.topic,
        score: q.answer!.score,
        technicalScore: q.answer!.technicalScore,
        completenessScore: q.answer!.completenessScore,
        relevanceScore: q.answer!.relevanceScore,
        clarityScore: q.answer!.clarityScore,
        communicationScore: q.answer!.communicationScore,
      })),
  );
  const askedCounts = countByTopic(
    interview.questions.filter((q) => !q.isFollowUp).map((q) => q.topic),
  );

  const decision = decideNextQuestion({
    currentDifficulty: interview.difficulty,
    recentScores,
    topics: interview.topics,
    topicScores,
    askedCounts,
  });

  const generated = await provider.generateQuestion({
    context,
    previousQuestions: interview.questions.map((q) => q.question),
    askedTopics: interview.questions.filter((q) => !q.isFollowUp).map((q) => q.topic),
    targetDifficulty: decision.difficulty,
    targetTopic: decision.topic,
    performanceSummary: performanceSummary(recentScores),
  });

  const order = interview.questions.length + 1;
  return persistGeneratedQuestion(interview.id, order, generated, {
    isFollowUp: false,
  });
}

async function generateFollowUp(
  interview: Awaited<ReturnType<typeof loadInterview>>,
  experienceLevel: ExperienceLevel,
  parent: QuestionWithAnswer,
  candidateAnswer: string,
) {
  const provider = getAIProvider();
  const context = buildContext(interview, experienceLevel);

  const generated = await provider.generateFollowUp({
    context,
    previousQuestions: interview.questions.map((q) => q.question),
    askedTopics: interview.questions.map((q) => q.topic),
    targetDifficulty: parent.difficulty,
    targetTopic: parent.topic,
    parentQuestion: parent.question,
    candidateAnswer,
  });

  const order = interview.questions.length + 1;
  return persistGeneratedQuestion(interview.id, order, generated, {
    isFollowUp: true,
    parentQuestionId: parent.id,
  });
}

/**
 * Ensures the first question exists. Generation failures propagate so the page
 * can render a recoverable "AI unavailable" state without losing progress.
 */
export async function startInterview(
  userId: string,
  interviewId: string,
): Promise<InterviewStateDto> {
  const interview = await loadInterview(userId, interviewId);

  if (interview.status === InterviewStatus.COMPLETED) {
    return toStateDto(interview);
  }

  if (interview.questions.length === 0) {
    const { experienceLevel } = await loadUser(userId);
    try {
      await generateNextPrimary(interview, experienceLevel);
    } catch (error) {
      throw toServiceError(error);
    }
    return toStateDto(await loadInterview(userId, interviewId));
  }

  return toStateDto(interview);
}

/**
 * Advances an interview waiting for its next question. Idempotent: a no-op when
 * a question is already pending.
 */
export async function advanceInterview(
  userId: string,
  interviewId: string,
): Promise<InterviewStateDto> {
  const interview = await loadInterview(userId, interviewId);
  if (interview.status === InterviewStatus.COMPLETED) {
    return toStateDto(interview);
  }

  const { experienceLevel } = await loadUser(userId);
  return finalizeProgress(userId, interviewId, experienceLevel);
}

async function finalizeProgress(
  userId: string,
  interviewId: string,
  experienceLevel: ExperienceLevel,
): Promise<InterviewStateDto> {
  let interview = await loadInterview(userId, interviewId);

  if (currentQuestion(interview.questions)) {
    return toStateDto(interview);
  }

  const primaries = interview.questions.filter((q) => !q.isFollowUp);

  if (primaries.length < interview.questionCount) {
    try {
      await generateNextPrimary(interview, experienceLevel);
    } catch {
      // Leave currentQuestion null so the client can retry via /next.
    }
    interview = await loadInterview(userId, interviewId);
    return toStateDto(interview);
  }

  await completeInterview(userId, interviewId);
  return getInterviewState(userId, interviewId);
}

export async function submitAnswer(
  userId: string,
  interviewId: string,
  input: SubmitAnswerInput,
): Promise<InterviewStateDto> {
  const interview = await loadInterview(userId, interviewId);

  if (interview.status === InterviewStatus.COMPLETED) {
    throw new ServiceError("INVALID_STATE", "This interview is already complete.");
  }

  const current = currentQuestion(interview.questions);
  if (!current) {
    throw new ServiceError("INVALID_STATE", "There is no question awaiting an answer.");
  }
  if (current.id !== input.questionId) {
    throw new ServiceError(
      "INVALID_STATE",
      "That question is no longer the active question. Reload the interview.",
    );
  }

  const { experienceLevel } = await loadUser(userId);
  const provider = getAIProvider();

  if (input.skip) {
    await prisma.interviewQuestion.update({
      where: { id: current.id },
      data: { skipped: true },
    });
    return finalizeProgress(userId, interviewId, experienceLevel);
  }

  const answerText = (input.answer ?? "").trim();
  if (answerText.length < 1) {
    throw new ServiceError("VALIDATION", "Write an answer before submitting.");
  }

  const context = buildContext(interview, experienceLevel);
  let evaluation: AnswerEvaluation | null = null;

  // Evaluation happens before the answer is stored, so a failure leaves nothing
  // persisted and the candidate can simply resubmit.
  if (revealsFeedbackImmediately(interview.mode)) {
    try {
      evaluation = await provider.evaluateAnswer({
        context,
        question: current.question,
        expectedConcepts: current.expectedConcepts,
        answer: answerText,
        inputMode: input.inputMode ?? "text",
      });
    } catch (error) {
      throw toServiceError(error);
    }
  }

  await prisma.answer.create({
    data: {
      questionId: current.id,
      answer: answerText,
      inputMode: input.inputMode ?? "text",
      score: evaluation?.score ?? null,
      technicalScore: evaluation?.technicalScore ?? null,
      completenessScore: evaluation?.completenessScore ?? null,
      relevanceScore: evaluation?.relevanceScore ?? null,
      clarityScore: evaluation?.clarityScore ?? null,
      communicationScore: evaluation?.communicationScore ?? null,
      feedback: evaluation ?? undefined,
    },
  });

  const isPrimary = !current.isFollowUp;

  if (
    isPrimary &&
    shouldAskFollowUp({
      answerLength: answerText.length,
      existingFollowUps: interview.questions.filter(
        (q) => q.parentQuestionId === current.id,
      ).length,
      score: evaluation?.score ?? null,
    })
  ) {
    try {
      await generateFollowUp(interview, experienceLevel, current, answerText);
    } catch {
      // The answer is saved; the follow-up can be retried via /next.
    }
  }

  return finalizeProgress(userId, interviewId, experienceLevel);
}

export async function completeInterview(
  userId: string,
  interviewId: string,
): Promise<void> {
  const interview = await loadInterview(userId, interviewId);

  if (interview.status === InterviewStatus.COMPLETED) return;

  const { experienceLevel } = await loadUser(userId);
  const provider = getAIProvider();
  const context = buildContext(interview, experienceLevel);

  // Realistic mode defers evaluation until now.
  for (const question of interview.questions) {
    if (!question.answer || question.answer.score != null || question.skipped) {
      continue;
    }

    try {
      const evaluation = await provider.evaluateAnswer({
        context,
        question: question.question,
        expectedConcepts: question.expectedConcepts,
        answer: question.answer.answer,
        inputMode:
          question.answer.inputMode === "voice" ? "voice" : "text",
      });

      await prisma.answer.update({
        where: { id: question.answer.id },
        data: {
          score: evaluation.score,
          technicalScore: evaluation.technicalScore,
          completenessScore: evaluation.completenessScore,
          relevanceScore: evaluation.relevanceScore,
          clarityScore: evaluation.clarityScore,
          communicationScore: evaluation.communicationScore,
          feedback: evaluation,
        },
      });
    } catch (error) {
      throw toServiceError(error);
    }
  }

  const refreshed = await loadInterview(userId, interviewId);
  const scoredAnswers = refreshed.questions
    .filter((question) => question.answer != null)
    .map((question) => ({
      topic: question.topic,
      score: question.answer!.score,
      technicalScore: question.answer!.technicalScore,
      completenessScore: question.answer!.completenessScore,
      relevanceScore: question.answer!.relevanceScore,
      clarityScore: question.answer!.clarityScore,
      communicationScore: question.answer!.communicationScore,
    }));

  const scores = aggregateInterviewScores(scoredAnswers);
  const topicPerformance = computeTopicPerformance(scoredAnswers);
  const durationSec = Math.max(
    0,
    Math.round((Date.now() - refreshed.startedAt.getTime()) / 1000),
  );

  await prisma.$transaction(async (tx) => {
    await tx.interview.update({
      where: { id: interviewId },
      data: {
        status: InterviewStatus.COMPLETED,
        completedAt: new Date(),
        durationSec,
        score: scores.overall,
        technicalScore: scores.technical,
        communicationScore: scores.communication,
        problemSolvingScore: scores.problemSolving,
      },
    });

    for (const [skill, score] of Object.entries(topicPerformance)) {
      const existing = await tx.skillPerformance.findUnique({
        where: { userId_skill: { userId, skill } },
        select: { id: true, score: true, attempts: true },
      });

      if (existing) {
        const blended = Math.round(
          ((existing.score * existing.attempts + score) /
            (existing.attempts + 1)) *
            10,
        ) / 10;
        await tx.skillPerformance.update({
          where: { id: existing.id },
          data: { score: blended, attempts: existing.attempts + 1 },
        });
      } else {
        await tx.skillPerformance.create({
          data: { userId, skill, score, attempts: 1 },
        });
      }
    }
  });

  // Recommendations are best-effort: never fail completion because of them.
  try {
    const allPerformance = await prisma.skillPerformance.findMany({
      where: { userId },
      orderBy: { score: "asc" },
      select: { skill: true, score: true },
    });
    const { strongest, weakest } = rankSkills(
      Object.fromEntries(allPerformance.map((row) => [row.skill, row.score])),
    );

    const recommendation = await provider.generateRecommendations({
      role: refreshed.role,
      overallScore: scores.overall,
      weakestSkills: weakest.slice(0, 5),
      strongestSkills: strongest.slice(0, 3),
    });

    await prisma.recommendation.upsert({
      where: { interviewId },
      update: {
        summary: recommendation.summary,
        items: recommendation.items,
      },
      create: {
        userId,
        interviewId,
        summary: recommendation.summary,
        items: recommendation.items,
      },
    });
  } catch {
    // Ignore recommendation failures.
  }
}

export async function deleteInterview(
  userId: string,
  interviewId: string,
): Promise<void> {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: { id: true },
  });
  if (!interview) throw new ServiceError("NOT_FOUND", "Interview not found.");

  await prisma.interview.delete({ where: { id: interviewId } });
}

export type InterviewReportDto = {
  interview: InterviewSummaryDto;
  scores: InterviewScores;
  topicPerformance: { skill: string; score: number }[];
  strongest: { skill: string; score: number }[];
  weakest: { skill: string; score: number }[];
  recommendation: { summary: string; items: { title: string; detail: string }[] } | null;
  questions: InterviewQuestionDto[];
};

export async function getInterviewReport(
  userId: string,
  interviewId: string,
): Promise<InterviewReportDto> {
  const interview = await loadInterview(userId, interviewId);

  const scored = interview.questions
    .filter((question) => question.answer)
    .map((question) => ({
      topic: question.topic,
      score: question.answer!.score,
      technicalScore: question.answer!.technicalScore,
      completenessScore: question.answer!.completenessScore,
      relevanceScore: question.answer!.relevanceScore,
      clarityScore: question.answer!.clarityScore,
      communicationScore: question.answer!.communicationScore,
    }));

  const scores = aggregateInterviewScores(scored);
  const topicPerformance = computeTopicPerformance(scored);
  const { strongest, weakest } = rankSkills(topicPerformance);

  const recommendation = await prisma.recommendation.findUnique({
    where: { interviewId },
    select: { summary: true, items: true },
  });

  return {
    interview: {
      id: interview.id,
      role: interview.role,
      type: interview.type,
      mode: interview.mode,
      difficulty: interview.difficulty,
      status: interview.status,
      questionCount: interview.questionCount,
      topics: interview.topics,
      score: interview.score,
      durationSec: interview.durationSec,
      createdAt: interview.createdAt.toISOString(),
      completedAt: interview.completedAt?.toISOString() ?? null,
      answeredQuestions: interview.questions.filter((q) => q.answer).length,
    },
    scores,
    topicPerformance: Object.entries(topicPerformance).map(([skill, score]) => ({
      skill,
      score,
    })),
    strongest: strongest.slice(0, 5),
    weakest: weakest.slice(0, 5),
    recommendation: recommendation
      ? {
          summary: recommendation.summary,
          items: recommendation.items as { title: string; detail: string }[],
        }
      : null,
    questions: interview.questions.map(toQuestionDto),
  };
}

function toServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;
  if (error instanceof AIError) {
    return new ServiceError(
      "AI_UNAVAILABLE",
      "The AI interviewer is temporarily unavailable.",
      error.retryable,
    );
  }
  return new ServiceError("AI_UNAVAILABLE", "Something went wrong.", true);
}
