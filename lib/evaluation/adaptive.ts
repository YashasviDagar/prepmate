import { Difficulty } from "@/lib/generated/prisma/enums";

const ORDER: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

export type AdaptiveDecision = {
  difficulty: Difficulty;
  topic?: string;
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * AI-driven heuristic difficulty selection.
 *
 * This is a simple rule-based policy, not a scientifically validated
 * psychometric model. It is deliberately transparent so behaviour is
 * predictable and testable.
 */
export function nextDifficulty(
  current: Difficulty,
  recentScores: number[],
): Difficulty {
  if (recentScores.length === 0) return current;

  const average = mean(recentScores);
  const index = ORDER.indexOf(current);

  if (average >= 7.5) return ORDER[Math.min(ORDER.length - 1, index + 1)]!;
  if (average <= 4.5) return ORDER[Math.max(0, index - 1)]!;
  return current;
}

/**
 * Picks the topic most in need of practice: lowest average score first, then
 * least frequently asked. Unknown topics get a neutral prior score.
 */
export function chooseTopic(
  topics: string[],
  topicScores: Record<string, number>,
  askedCounts: Record<string, number>,
): string | undefined {
  if (topics.length === 0) return undefined;

  return [...topics].sort((a, b) => {
    const scoreA = topicScores[a] ?? 5;
    const scoreB = topicScores[b] ?? 5;
    if (scoreA !== scoreB) return scoreA - scoreB;

    const countA = askedCounts[a] ?? 0;
    const countB = askedCounts[b] ?? 0;
    return countA - countB;
  })[0];
}

export function countByTopic(topics: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const topic of topics) {
    counts[topic] = (counts[topic] ?? 0) + 1;
  }
  return counts;
}

export function shouldAskFollowUp(params: {
  answerLength: number;
  existingFollowUps: number;
  score: number | null;
}): boolean {
  if (params.existingFollowUps >= 1) return false;
  if (params.answerLength < 40) return false;
  // Do not pile a follow-up onto an answer that was essentially a non-answer.
  if (params.score != null && params.score < 3) return false;
  return true;
}

export function decideNextQuestion(params: {
  currentDifficulty: Difficulty;
  recentScores: number[];
  topics: string[];
  topicScores: Record<string, number>;
  askedCounts: Record<string, number>;
}): AdaptiveDecision {
  return {
    difficulty: nextDifficulty(params.currentDifficulty, params.recentScores),
    topic: chooseTopic(params.topics, params.topicScores, params.askedCounts),
  };
}

/** Human-readable summary of performance so far, fed back into question prompts. */
export function performanceSummary(scores: number[]): string | undefined {
  if (scores.length === 0) return undefined;
  const average = mean(scores);
  const level =
    average >= 7.5 ? "strong" : average >= 5 ? "developing" : "struggling";
  return `Average answer score so far: ${average.toFixed(1)}/10 (${level}).`;
}
