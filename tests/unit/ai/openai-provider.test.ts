import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AIError } from "@/lib/ai/errors";
import { OpenAICompatibleProvider } from "@/lib/ai/openai-provider";
import type { InterviewContext, QuestionGenerationInput } from "@/lib/ai/types";
import {
  Difficulty,
  ExperienceLevel,
  InterviewMode,
  InterviewType,
  Role,
} from "@/lib/generated/prisma/enums";

const context: InterviewContext = {
  role: Role.BACKEND_DEVELOPER,
  experienceLevel: ExperienceLevel.INTERMEDIATE,
  interviewType: InterviewType.TECHNICAL,
  difficulty: Difficulty.MEDIUM,
  mode: InterviewMode.REALISTIC,
  topics: ["Databases"],
};

const input: QuestionGenerationInput = {
  context,
  previousQuestions: [],
  askedTopics: [],
  targetDifficulty: Difficulty.MEDIUM,
};

const validQuestion = {
  question: "Explain how a database index speeds up reads.",
  topic: "Databases",
  difficulty: "MEDIUM",
  questionType: "TECHNICAL",
  expectedConcepts: ["B-tree", "read speed", "write cost"],
};

function completion(content: string, status = 200): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

function createProvider() {
  return new OpenAICompatibleProvider({
    baseUrl: "https://example.test/v1",
    apiKey: "test-key",
    model: "test-model",
    timeoutMs: 1_000,
  });
}

describe("OpenAICompatibleProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses and validates a valid JSON completion", async () => {
    fetchMock.mockResolvedValueOnce(completion(JSON.stringify(validQuestion)));

    const result = await createProvider().generateQuestion(input);

    expect(result.question).toBe(validQuestion.question);
    expect(result.expectedConcepts).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once and throws INVALID_AI_RESPONSE on malformed JSON", async () => {
    fetchMock
      .mockResolvedValueOnce(completion("not json"))
      .mockResolvedValueOnce(completion("still not json"));

    await expect(createProvider().generateQuestion(input)).rejects.toMatchObject({
      name: "AIError",
      code: "INVALID_AI_RESPONSE",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("recovers when the first response is invalid but the retry is valid", async () => {
    fetchMock
      .mockResolvedValueOnce(completion(JSON.stringify({ nope: true })))
      .mockResolvedValueOnce(completion(JSON.stringify(validQuestion)));

    const result = await createProvider().generateQuestion(input);

    expect(result.question).toBe(validQuestion.question);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries server errors and surfaces AI_UNAVAILABLE", async () => {
    fetchMock.mockResolvedValue(completion("server error", 500));

    await expect(createProvider().generateQuestion(input)).rejects.toMatchObject({
      code: "AI_UNAVAILABLE",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry client errors", async () => {
    fetchMock.mockResolvedValue(completion("bad request", 400));

    await expect(createProvider().generateQuestion(input)).rejects.toMatchObject({
      code: "AI_UNAVAILABLE",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps aborts to AI_TIMEOUT", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    fetchMock.mockRejectedValue(abortError);

    await expect(createProvider().generateQuestion(input)).rejects.toMatchObject({
      code: "AI_TIMEOUT",
    });
  });

  it("maps network failures to a retryable AIError", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = await createProvider()
      .generateQuestion(input)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AIError);
    expect((error as AIError).retryable).toBe(true);
  });
});
