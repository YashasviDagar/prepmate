import { getAIProvider } from "@/lib/ai";
import { AIError } from "@/lib/ai/errors";
import { prisma } from "@/lib/db/prisma";
import {
  Difficulty,
  QuestionSource,
  QuestionType,
} from "@/lib/generated/prisma/enums";
import { ServiceError } from "@/lib/services/errors";
import type { GenerateQuestionBankItemInput } from "@/lib/validation/interview";

export type QuestionBankFilters = {
  category?: string;
  difficulty?: Difficulty;
  search?: string;
  limit?: number;
};

export type QuestionBankItemDto = {
  id: string;
  category: string;
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  question: string;
  expectedConcepts: string[];
  idealAnswerPoints: string[];
  validated: boolean;
  createdAt: string;
};

export async function listQuestionBank(
  filters: QuestionBankFilters = {},
): Promise<QuestionBankItemDto[]> {
  const items = await prisma.questionBankItem.findMany({
    where: {
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      ...(filters.search
        ? {
            OR: [
              { question: { contains: filters.search, mode: "insensitive" } },
              { topic: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: "asc" }, { difficulty: "asc" }],
    take: filters.limit ?? 200,
  });

  return items.map((item) => ({
    id: item.id,
    category: item.category,
    topic: item.topic,
    difficulty: item.difficulty,
    questionType: item.questionType,
    question: item.question,
    expectedConcepts: item.expectedConcepts,
    idealAnswerPoints: item.idealAnswerPoints,
    validated: item.validated,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function listQuestionBankCategories(): Promise<string[]> {
  const rows = await prisma.questionBankItem.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category);
}

export type { GenerateQuestionBankItemInput } from "@/lib/validation/interview";

/**
 * Generates a question with the AI provider and stores it in the bank.
 *
 * Generated questions are stored as `validated: false` so a human can review
 * them before they are treated as trusted content.
 */
export async function generateQuestionBankItem(
  input: GenerateQuestionBankItemInput,
): Promise<QuestionBankItemDto> {
  const provider = getAIProvider();

  try {
    const generated = await provider.generateQuestion({
      context: {
        role: "SOFTWARE_ENGINEER",
        experienceLevel: "INTERMEDIATE",
        interviewType: "TECHNICAL",
        difficulty: input.difficulty,
        mode: "PRACTICE",
        topics: [input.category],
      },
      previousQuestions: [],
      askedTopics: [],
      targetDifficulty: input.difficulty,
      targetTopic: input.category,
    });

    const item = await prisma.questionBankItem.upsert({
      where: { question: generated.question },
      update: {},
      create: {
        category: input.category,
        topic: generated.topic,
        difficulty: generated.difficulty,
        questionType: generated.questionType,
        question: generated.question,
        expectedConcepts: generated.expectedConcepts,
        idealAnswerPoints: generated.expectedConcepts.map(
          (concept) => `Mentions ${concept}.`,
        ),
        source: QuestionSource.AI,
        validated: false,
      },
    });

    return {
      id: item.id,
      category: item.category,
      topic: item.topic,
      difficulty: item.difficulty,
      questionType: item.questionType,
      question: item.question,
      expectedConcepts: item.expectedConcepts,
      idealAnswerPoints: item.idealAnswerPoints,
      validated: item.validated,
      createdAt: item.createdAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof AIError) {
      throw new ServiceError(
        "AI_UNAVAILABLE",
        "The AI provider is temporarily unavailable.",
        error.retryable,
      );
    }
    throw error;
  }
}
