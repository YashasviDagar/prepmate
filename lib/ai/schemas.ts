import { z } from "zod";

import {
  Difficulty,
  QuestionType,
} from "@/lib/generated/prisma/enums";

const scoreSchema = z.number().min(0).max(10);

const stringList = (max: number) =>
  z.array(z.string().trim().min(1).max(400)).min(1).max(max);

export const generatedQuestionSchema = z.object({
  question: z.string().trim().min(10).max(600),
  topic: z.string().trim().min(1).max(60),
  difficulty: z.enum(Difficulty),
  questionType: z.enum(QuestionType),
  expectedConcepts: z
    .array(z.string().trim().min(1).max(120))
    .min(1)
    .max(10),
});

export const answerEvaluationSchema = z.object({
  score: scoreSchema,
  technicalScore: scoreSchema,
  completenessScore: scoreSchema,
  relevanceScore: scoreSchema,
  clarityScore: scoreSchema,
  communicationScore: scoreSchema,
  well: stringList(6),
  improve: stringList(6),
  structure: stringList(6),
  modelAnswer: z.string().trim().min(20).max(2000),
  deliveryNote: z.string().trim().max(400).optional(),
});

export const feedbackSchema = z.object({
  well: stringList(6),
  improve: stringList(6),
  structure: stringList(6),
  modelAnswer: z.string().trim().min(20).max(2000),
});

export const recommendationSchema = z.object({
  summary: z.string().trim().min(10).max(600),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(3).max(120),
        detail: z.string().trim().min(5).max(400),
      }),
    )
    .min(3)
    .max(8),
});

export type GeneratedQuestionOutput = z.infer<typeof generatedQuestionSchema>;
export type AnswerEvaluationOutput = z.infer<typeof answerEvaluationSchema>;
export type FeedbackOutput = z.infer<typeof feedbackSchema>;
export type RecommendationOutput = z.infer<typeof recommendationSchema>;
