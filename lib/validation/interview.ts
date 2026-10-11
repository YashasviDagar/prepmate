import { z } from "zod";

import {
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
} from "@/lib/domain/interview";
import {
  Difficulty,
  InterviewMode,
  InterviewType,
  Role,
} from "@/lib/generated/prisma/enums";

export const createInterviewSchema = z.object({
  role: z.enum(Role),
  type: z.enum(InterviewType),
  mode: z.enum(InterviewMode),
  difficulty: z.enum(Difficulty),
  questionCount: z
    .number()
    .int()
    .min(MIN_QUESTION_COUNT)
    .max(MAX_QUESTION_COUNT),
  topics: z.array(z.string().trim().min(1).max(60)).min(1).max(12),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().max(8000).optional(),
  inputMode: z.enum(["text", "voice"]).optional(),
  skip: z.boolean().optional(),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

export const generateQuestionBankItemSchema = z.object({
  category: z.string().trim().min(1).max(60),
  difficulty: z.enum(Difficulty),
});

export type GenerateQuestionBankItemInput = z.infer<
  typeof generateQuestionBankItemSchema
>;
