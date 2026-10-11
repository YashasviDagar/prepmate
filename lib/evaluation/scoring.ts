export type AnswerScoreInput = {
  topic: string;
  score: number | null;
  technicalScore: number | null;
  completenessScore: number | null;
  relevanceScore: number | null;
  clarityScore: number | null;
  communicationScore: number | null;
};

export type InterviewScores = {
  overall: number;
  technical: number;
  communication: number;
  problemSolving: number;
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function collect(
  answers: AnswerScoreInput[],
  pick: (answer: AnswerScoreInput) => number | null,
): number[] {
  return answers
    .map(pick)
    .filter((value): value is number => value != null);
}

/**
 * Aggregates per-answer scores (each 0–10) into interview-level scores (0–100).
 * Skipped/unscored answers are ignored.
 */
export function aggregateInterviewScores(
  answers: AnswerScoreInput[],
): InterviewScores {
  const overall = collect(answers, (answer) => answer.score);
  const technical = collect(answers, (answer) => answer.technicalScore);
  const communication = collect(answers, (answer) => answer.communicationScore);
  const relevance = collect(answers, (answer) => answer.relevanceScore);

  const problemSolvingSamples = answers
    .map((answer) => {
      if (answer.relevanceScore == null || answer.completenessScore == null) {
        return null;
      }
      return (answer.relevanceScore + answer.completenessScore) / 2;
    })
    .filter((value): value is number => value != null);

  return {
    overall: round1(mean(overall) * 10),
    technical: round1(mean(technical) * 10),
    communication: round1(mean(communication) * 10),
    problemSolving: round1(
      mean(problemSolvingSamples.length ? problemSolvingSamples : relevance) * 10,
    ),
  };
}

/** Average score (0–100) per topic, ignoring unscored answers. */
export function computeTopicPerformance(
  answers: AnswerScoreInput[],
): Record<string, number> {
  const buckets = new Map<string, number[]>();

  for (const answer of answers) {
    if (answer.score == null) continue;
    const bucket = buckets.get(answer.topic) ?? [];
    bucket.push(answer.score);
    buckets.set(answer.topic, bucket);
  }

  const result: Record<string, number> = {};
  for (const [topic, scores] of buckets) {
    result[topic] = round1(mean(scores) * 10);
  }
  return result;
}

export function rankSkills(performance: Record<string, number>): {
  strongest: { skill: string; score: number }[];
  weakest: { skill: string; score: number }[];
} {
  const entries = Object.entries(performance).map(([skill, score]) => ({
    skill,
    score,
  }));

  const strongest = [...entries].sort((a, b) => b.score - a.score);
  const weakest = [...entries].sort((a, b) => a.score - b.score);

  return { strongest, weakest };
}

/** Simple, bounded confidence label derived from score consistency. */
export function consistencyLabel(scores: number[]): string {
  if (scores.length < 2) return "Not enough data";
  const average = mean(scores);
  const variance = mean(scores.map((score) => (score - average) ** 2));
  const deviation = Math.sqrt(variance);
  if (deviation <= 1) return "Consistent";
  if (deviation <= 2) return "Mixed";
  return "Variable";
}
