import type { z } from "zod";

import { AIError, toAIError } from "@/lib/ai/errors";
import {
  buildEvaluationPrompt,
  buildFeedbackPrompt,
  buildFollowUpPrompt,
  buildQuestionPrompt,
  buildRecommendationPrompt,
  type ChatMessage,
} from "@/lib/ai/prompts";
import {
  answerEvaluationSchema,
  feedbackSchema,
  generatedQuestionSchema,
  recommendationSchema,
} from "@/lib/ai/schemas";
import type {
  AIProvider,
  AnswerEvaluation,
  EvaluationInput,
  Feedback,
  GeneratedQuestion,
  QuestionGenerationInput,
  RecommendationInput,
  StudyRecommendation,
} from "@/lib/ai/types";

export type OpenAICompatibleConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
};

/**
 * Provider for any OpenAI-compatible `/chat/completions` endpoint
 * (OpenAI, OpenRouter, Groq, Together, a local gateway, …).
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";

  constructor(private readonly config: OpenAICompatibleConfig) {}

  private async complete<T>(
    messages: ChatMessage[],
    schema: z.ZodType<T>,
  ): Promise<T> {
    const run = async (): Promise<T> => {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs,
      );

      try {
        const response = await fetch(
          `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
              model: this.config.model,
              messages,
              temperature: 0.6,
              response_format: { type: "json_object" },
            }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          throw new AIError(
            "AI_UNAVAILABLE",
            `AI provider returned HTTP ${response.status}. ${detail.slice(0, 200)}`,
            { retryable: response.status >= 500 || response.status === 429 },
          );
        }

        const payload: unknown = await response.json();
        const content = (
          payload as {
            choices?: { message?: { content?: unknown } }[];
          }
        )?.choices?.[0]?.message?.content;

        if (typeof content !== "string") {
          throw new AIError(
            "INVALID_AI_RESPONSE",
            "AI provider returned an empty completion.",
          );
        }

        let json: unknown;
        try {
          json = JSON.parse(content);
        } catch (cause) {
          throw new AIError(
            "INVALID_AI_RESPONSE",
            "AI provider returned malformed JSON.",
            { cause },
          );
        }

        const parsed = schema.safeParse(json);
        if (!parsed.success) {
          throw new AIError(
            "INVALID_AI_RESPONSE",
            "AI provider returned JSON that failed validation.",
            { cause: parsed.error },
          );
        }

        return parsed.data;
      } finally {
        clearTimeout(timeout);
      }
    };

    try {
      return await run();
    } catch (error) {
      const aiError = toAIError(error);
      // Retry once for transient failures and malformed responses.
      // Client errors (e.g. 400/401) and config errors are not retried.
      const shouldRetry =
        aiError.retryable || aiError.code === "INVALID_AI_RESPONSE";
      if (!shouldRetry) throw aiError;

      try {
        return await run();
      } catch (retryError) {
        throw toAIError(retryError);
      }
    }
  }

  generateQuestion(input: QuestionGenerationInput): Promise<GeneratedQuestion> {
    return this.complete(buildQuestionPrompt(input), generatedQuestionSchema);
  }

  generateFollowUp(input: QuestionGenerationInput): Promise<GeneratedQuestion> {
    return this.complete(buildFollowUpPrompt(input), generatedQuestionSchema);
  }

  evaluateAnswer(input: EvaluationInput): Promise<AnswerEvaluation> {
    return this.complete(buildEvaluationPrompt(input), answerEvaluationSchema);
  }

  generateFeedback(
    input: EvaluationInput & { evaluation: AnswerEvaluation },
  ): Promise<Feedback> {
    return this.complete(buildFeedbackPrompt(input), feedbackSchema);
  }

  generateRecommendations(
    input: RecommendationInput,
  ): Promise<StudyRecommendation> {
    return this.complete(buildRecommendationPrompt(input), recommendationSchema);
  }
}
