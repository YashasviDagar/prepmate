import { describe, expect, it } from "vitest";

import { MockAIProvider } from "@/lib/ai/mock-provider";
import type { InterviewContext, QuestionGenerationInput } from "@/lib/ai/types";
import {
  Difficulty,
  ExperienceLevel,
  InterviewMode,
  InterviewType,
  QuestionType,
  Role,
} from "@/lib/generated/prisma/enums";

const context: InterviewContext = {
  role: Role.FRONTEND_DEVELOPER,
  experienceLevel: ExperienceLevel.INTERMEDIATE,
  interviewType: InterviewType.TECHNICAL,
  difficulty: Difficulty.MEDIUM,
  mode: InterviewMode.PRACTICE,
  topics: ["React", "JavaScript"],
};

function questionInput(
  overrides: Partial<QuestionGenerationInput> = {},
): QuestionGenerationInput {
  return {
    context,
    previousQuestions: [],
    askedTopics: [],
    targetDifficulty: Difficulty.MEDIUM,
    ...overrides,
  };
}

const provider = new MockAIProvider();

describe("MockAIProvider.generateQuestion", () => {
  it("returns a well-formed question within the allowed topics", async () => {
    const result = await provider.generateQuestion(questionInput());

    expect(result.question.length).toBeGreaterThan(10);
    expect(context.topics).toContain(result.topic);
    expect(result.expectedConcepts.length).toBeGreaterThan(0);
    expect(result.difficulty).toBe(Difficulty.MEDIUM);
  });

  it("honours the requested topic and difficulty", async () => {
    const result = await provider.generateQuestion(
      questionInput({ targetTopic: "JavaScript", targetDifficulty: Difficulty.HARD }),
    );

    expect(result.topic).toBe("JavaScript");
    expect(result.difficulty).toBe(Difficulty.HARD);
  });

  it("does not repeat a previously asked question", async () => {
    const first = await provider.generateQuestion(questionInput());
    const second = await provider.generateQuestion(
      questionInput({ previousQuestions: [first.question] }),
    );

    expect(second.question).not.toBe(first.question);
  });

  it("falls back to generic questions when topics are exhausted", async () => {
    const result = await provider.generateQuestion(
      questionInput({ context: { ...context, topics: [] } }),
    );

    expect(result.question.length).toBeGreaterThan(10);
  });
});

describe("MockAIProvider.generateFollowUp", () => {
  it("produces a FOLLOW_UP question referencing the candidate answer", async () => {
    const result = await provider.generateFollowUp(
      questionInput({
        parentQuestion: "What is a closure?",
        candidateAnswer:
          "Closures capture lexical scope and are useful for memoisation.",
      }),
    );

    expect(result.questionType).toBe(QuestionType.FOLLOW_UP);
    expect(result.question.toLowerCase()).toContain("closures");
  });
});

describe("MockAIProvider.evaluateAnswer", () => {
  const baseInput = {
    context,
    question: "Explain closures in JavaScript.",
    expectedConcepts: ["lexical scope", "encapsulation", "state retention"],
    inputMode: "text" as const,
  };

  it("scores a strong answer above a non-answer", async () => {
    const strong = await provider.evaluateAnswer({
      ...baseInput,
      answer:
        "A closure is a function that captures its lexical scope. First, it retains access to variables after the outer function returns, which enables encapsulation and state retention. For example, a counter function keeps its count private. However, holding references can increase memory usage.",
    });
    const weak = await provider.evaluateAnswer({
      ...baseInput,
      answer: "I don't know",
    });

    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("keeps every score within 0–10 and returns actionable feedback", async () => {
    const result = await provider.evaluateAnswer({
      ...baseInput,
      answer:
        "A closure captures the lexical scope of its parent function. It is useful for encapsulation and retaining state.",
    });

    for (const score of [
      result.score,
      result.technicalScore,
      result.completenessScore,
      result.relevanceScore,
      result.clarityScore,
      result.communicationScore,
    ]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    }

    expect(result.well.length).toBeGreaterThan(0);
    expect(result.improve.length).toBeGreaterThan(0);
    expect(result.structure.length).toBeGreaterThan(0);
    expect(result.modelAnswer.length).toBeGreaterThan(0);
  });

  it("adds a delivery note for voice answers only", async () => {
    const text = await provider.evaluateAnswer({
      ...baseInput,
      answer: "A closure captures lexical scope.",
    });
    const voice = await provider.evaluateAnswer({
      ...baseInput,
      inputMode: "voice",
      answer: "Um, a closure captures lexical scope, like, and retains state.",
    });

    expect(text.deliveryNote).toBeUndefined();
    expect(voice.deliveryNote).toBeTruthy();
  });
});

describe("MockAIProvider.generateRecommendations", () => {
  it("returns at least three ordered preparation steps", async () => {
    const result = await provider.generateRecommendations({
      role: Role.FRONTEND_DEVELOPER,
      overallScore: 62,
      weakestSkills: [
        { skill: "System Design", score: 45 },
        { skill: "Databases", score: 58 },
      ],
      strongestSkills: [{ skill: "React", score: 88 }],
    });

    expect(result.items.length).toBeGreaterThanOrEqual(3);
    expect(result.summary).toContain("System Design");
  });
});
