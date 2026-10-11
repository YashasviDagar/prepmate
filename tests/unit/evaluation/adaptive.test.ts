import { describe, expect, it } from "vitest";

import {
  chooseTopic,
  countByTopic,
  decideNextQuestion,
  nextDifficulty,
  performanceSummary,
  shouldAskFollowUp,
} from "@/lib/evaluation/adaptive";
import { Difficulty } from "@/lib/generated/prisma/enums";

describe("nextDifficulty", () => {
  it("keeps the current difficulty with no data", () => {
    expect(nextDifficulty(Difficulty.MEDIUM, [])).toBe(Difficulty.MEDIUM);
  });

  it("steps up when the candidate performs well", () => {
    expect(nextDifficulty(Difficulty.EASY, [8, 8.5])).toBe(Difficulty.MEDIUM);
    expect(nextDifficulty(Difficulty.MEDIUM, [9, 8])).toBe(Difficulty.HARD);
  });

  it("caps at HARD", () => {
    expect(nextDifficulty(Difficulty.HARD, [10, 10])).toBe(Difficulty.HARD);
  });

  it("steps down when the candidate struggles", () => {
    expect(nextDifficulty(Difficulty.HARD, [3, 4])).toBe(Difficulty.MEDIUM);
    expect(nextDifficulty(Difficulty.MEDIUM, [2])).toBe(Difficulty.EASY);
  });

  it("caps at EASY", () => {
    expect(nextDifficulty(Difficulty.EASY, [1, 2])).toBe(Difficulty.EASY);
  });

  it("stays put for mid-range performance", () => {
    expect(nextDifficulty(Difficulty.MEDIUM, [6, 6.5])).toBe(Difficulty.MEDIUM);
  });
});

describe("chooseTopic", () => {
  it("prefers the lowest-scoring topic", () => {
    const topic = chooseTopic(
      ["React", "Databases", "DSA"],
      { React: 82, Databases: 55, DSA: 70 },
      {},
    );
    expect(topic).toBe("Databases");
  });

  it("breaks ties by least asked", () => {
    const topic = chooseTopic(
      ["React", "Databases"],
      { React: 60, Databases: 60 },
      { React: 3, Databases: 0 },
    );
    expect(topic).toBe("Databases");
  });

  it("returns undefined when there are no topics", () => {
    expect(chooseTopic([], {}, {})).toBeUndefined();
  });
});

describe("countByTopic", () => {
  it("counts occurrences", () => {
    expect(countByTopic(["React", "React", "DSA"])).toEqual({
      React: 2,
      DSA: 1,
    });
  });
});

describe("shouldAskFollowUp", () => {
  it("asks when the answer is substantive", () => {
    expect(
      shouldAskFollowUp({ answerLength: 120, existingFollowUps: 0, score: 7 }),
    ).toBe(true);
  });

  it("does not ask twice for the same question", () => {
    expect(
      shouldAskFollowUp({ answerLength: 120, existingFollowUps: 1, score: 7 }),
    ).toBe(false);
  });

  it("does not ask after a very short answer", () => {
    expect(
      shouldAskFollowUp({ answerLength: 10, existingFollowUps: 0, score: 7 }),
    ).toBe(false);
  });

  it("does not ask after a failed answer", () => {
    expect(
      shouldAskFollowUp({ answerLength: 120, existingFollowUps: 0, score: 2 }),
    ).toBe(false);
  });
});

describe("decideNextQuestion", () => {
  it("combines difficulty and topic selection", () => {
    const decision = decideNextQuestion({
      currentDifficulty: Difficulty.EASY,
      recentScores: [8, 9],
      topics: ["React", "Databases"],
      topicScores: { React: 80, Databases: 40 },
      askedCounts: {},
    });

    expect(decision.difficulty).toBe(Difficulty.MEDIUM);
    expect(decision.topic).toBe("Databases");
  });
});

describe("performanceSummary", () => {
  it("returns undefined with no scores", () => {
    expect(performanceSummary([])).toBeUndefined();
  });

  it("describes strong performance", () => {
    expect(performanceSummary([8, 9])).toContain("strong");
  });
});
