import { describe, expect, it } from "vitest";

import {
  createInterviewSchema,
  generateQuestionBankItemSchema,
  submitAnswerSchema,
} from "@/lib/validation/interview";

const validConfig = {
  role: "FRONTEND_DEVELOPER",
  type: "TECHNICAL",
  mode: "PRACTICE",
  difficulty: "MEDIUM",
  questionCount: 5,
  topics: ["React", "JavaScript"],
};

describe("createInterviewSchema", () => {
  it("accepts a valid configuration", () => {
    const result = createInterviewSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("rejects an unknown role", () => {
    const result = createInterviewSchema.safeParse({
      ...validConfig,
      role: "ASTRONAUT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a question count below the minimum", () => {
    const result = createInterviewSchema.safeParse({
      ...validConfig,
      questionCount: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a question count above the maximum", () => {
    const result = createInterviewSchema.safeParse({
      ...validConfig,
      questionCount: 999,
    });
    expect(result.success).toBe(false);
  });

  it("requires at least one topic", () => {
    const result = createInterviewSchema.safeParse({
      ...validConfig,
      topics: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("submitAnswerSchema", () => {
  it("accepts a text answer", () => {
    const result = submitAnswerSchema.safeParse({
      questionId: "q1",
      answer: "Some answer",
      inputMode: "text",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a skip with no answer", () => {
    const result = submitAnswerSchema.safeParse({
      questionId: "q1",
      skip: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing question id", () => {
    const result = submitAnswerSchema.safeParse({ answer: "hi" });
    expect(result.success).toBe(false);
  });
});

describe("generateQuestionBankItemSchema", () => {
  it("accepts a category and difficulty", () => {
    const result = generateQuestionBankItemSchema.safeParse({
      category: "DSA",
      difficulty: "HARD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid difficulty", () => {
    const result = generateQuestionBankItemSchema.safeParse({
      category: "DSA",
      difficulty: "IMPOSSIBLE",
    });
    expect(result.success).toBe(false);
  });
});
