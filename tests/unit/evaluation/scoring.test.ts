import { describe, expect, it } from "vitest";

import {
  aggregateInterviewScores,
  computeTopicPerformance,
  consistencyLabel,
  rankSkills,
  type AnswerScoreInput,
} from "@/lib/evaluation/scoring";

function answer(overrides: Partial<AnswerScoreInput> = {}): AnswerScoreInput {
  return {
    topic: "React",
    score: 8,
    technicalScore: 8,
    completenessScore: 7,
    relevanceScore: 9,
    clarityScore: 8,
    communicationScore: 8,
    ...overrides,
  };
}

describe("aggregateInterviewScores", () => {
  it("scales per-answer scores to 0–100", () => {
    const result = aggregateInterviewScores([answer(), answer()]);

    expect(result.overall).toBe(80);
    expect(result.technical).toBe(80);
    expect(result.communication).toBe(80);
    expect(result.problemSolving).toBe(80);
  });

  it("ignores unscored answers", () => {
    const result = aggregateInterviewScores([
      answer({ score: 6 }),
      answer({ score: null, technicalScore: null, communicationScore: null, relevanceScore: null, completenessScore: null }),
    ]);

    expect(result.overall).toBe(60);
  });

  it("returns zeroes when nothing is scored", () => {
    const result = aggregateInterviewScores([
      answer({ score: null, technicalScore: null, communicationScore: null, relevanceScore: null, completenessScore: null }),
    ]);

    expect(result).toEqual({
      overall: 0,
      technical: 0,
      communication: 0,
      problemSolving: 0,
    });
  });
});

describe("computeTopicPerformance", () => {
  it("averages scores per topic on a 0–100 scale", () => {
    const performance = computeTopicPerformance([
      answer({ topic: "React", score: 8 }),
      answer({ topic: "React", score: 6 }),
      answer({ topic: "Databases", score: 5 }),
    ]);

    expect(performance.React).toBe(70);
    expect(performance.Databases).toBe(50);
  });
});

describe("rankSkills", () => {
  it("ranks strongest and weakest", () => {
    const { strongest, weakest } = rankSkills({
      React: 82,
      Databases: 55,
      DSA: 70,
    });

    expect(strongest[0]!.skill).toBe("React");
    expect(weakest[0]!.skill).toBe("Databases");
  });
});

describe("consistencyLabel", () => {
  it("reports insufficient data for a single score", () => {
    expect(consistencyLabel([7])).toBe("Not enough data");
  });

  it("labels tight score ranges as consistent", () => {
    expect(consistencyLabel([7, 7.2, 6.8])).toBe("Consistent");
  });

  it("labels wide score ranges as variable", () => {
    expect(consistencyLabel([2, 9, 3])).toBe("Variable");
  });
});
