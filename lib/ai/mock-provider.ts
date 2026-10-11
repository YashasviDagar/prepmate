import {
  GENERIC_HR_QUESTIONS,
  GENERIC_TECHNICAL_QUESTIONS,
  MOCK_QUESTION_POOL,
  type MockQuestion,
} from "@/lib/ai/mock-questions";
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
import { InterviewType, QuestionType } from "@/lib/generated/prisma/enums";

const FILLERS = new Set(["um", "uh", "like", "basically", "actually", "literally"]);

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9+#]+/g) ?? [];
}

function clamp(value: number, min = 0, max = 10): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function conceptMatches(concept: string, words: Set<string>, lower: string): boolean {
  const conceptWords = tokenize(concept).filter((word) => word.length > 3);
  if (conceptWords.length === 0) return lower.includes(concept.toLowerCase());
  const hits = conceptWords.filter((word) => words.has(word)).length;
  return hits / conceptWords.length >= 0.5;
}

function pickFromPool(
  topics: string[],
  asked: Set<string>,
  offset: number,
): { topic: string; item: MockQuestion } | null {
  for (const topic of topics) {
    const pool = MOCK_QUESTION_POOL[topic];
    if (!pool || pool.length === 0) continue;
    const fresh = pool.find((item) => !asked.has(item.question.trim().toLowerCase()));
    if (fresh) return { topic, item: fresh };
    const variant = pool[offset % pool.length]!;
    return {
      topic,
      item: {
        ...variant,
        question: `${variant.question} Illustrate your answer with a concrete example.`,
      },
    };
  }
  return null;
}

function genericTopic(input: QuestionGenerationInput): string {
  if (input.context.interviewType === InterviewType.HR) return "HR";
  if (input.context.interviewType === InterviewType.BEHAVIORAL) return "Behavioral";
  return "General";
}

function genericPool(input: QuestionGenerationInput): MockQuestion[] {
  return input.context.interviewType === InterviewType.HR ||
    input.context.interviewType === InterviewType.BEHAVIORAL
    ? GENERIC_HR_QUESTIONS
    : GENERIC_TECHNICAL_QUESTIONS;
}

function selectQuestion(input: QuestionGenerationInput): {
  topic: string;
  item: MockQuestion;
} {
  const asked = new Set(
    input.previousQuestions.map((question) => question.trim().toLowerCase()),
  );

  const preferred = input.targetTopic
    ? [input.targetTopic, ...input.context.topics.filter((t) => t !== input.targetTopic)]
    : [...input.context.topics];

  const fromTopics = pickFromPool(preferred, asked, input.previousQuestions.length);
  if (fromTopics) return fromTopics;

  const fallback = genericPool(input).find(
    (item) => !asked.has(item.question.trim().toLowerCase()),
  );
  if (fallback) return { topic: genericTopic(input), item: fallback };

  const pool = genericPool(input);
  const base = pool[input.previousQuestions.length % pool.length]!;
  return {
    topic: genericTopic(input),
    item: {
      ...base,
      question: `${base.question} Use a different example than before.`,
    },
  };
}

function toGeneratedQuestion(
  input: QuestionGenerationInput,
  selection: { topic: string; item: MockQuestion },
  isFollowUp: boolean,
): GeneratedQuestion {
  return {
    question: selection.item.question,
    topic: selection.topic,
    difficulty: input.targetDifficulty,
    questionType: isFollowUp
      ? QuestionType.FOLLOW_UP
      : (selection.item.questionType ?? QuestionType.TECHNICAL),
    expectedConcepts: selection.item.expectedConcepts,
  };
}

/**
 * Deterministic, offline provider.
 *
 * Scoring is a documented heuristic based on concept coverage, answer length
 * and basic structure cues. It is intentionally simple and is NOT a validated
 * assessment of ability.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  generateQuestion(input: QuestionGenerationInput): Promise<GeneratedQuestion> {
    return Promise.resolve(
      toGeneratedQuestion(input, selectQuestion(input), false),
    );
  }

  generateFollowUp(input: QuestionGenerationInput): Promise<GeneratedQuestion> {
    const answerWords = tokenize(input.candidateAnswer ?? "").filter(
      (word) => word.length > 5,
    );
    const keyword = answerWords[0] ?? input.targetTopic ?? "that point";

    return Promise.resolve({
      question: `You mentioned "${keyword}". Can you go deeper and give a concrete example that shows the trade-offs?`,
      topic: input.targetTopic ?? input.context.topics[0] ?? genericTopic(input),
      difficulty: input.targetDifficulty,
      questionType: QuestionType.FOLLOW_UP,
      expectedConcepts: ["concrete example", "trade-offs", "reasoning"],
    });
  }

  evaluateAnswer(input: EvaluationInput): Promise<AnswerEvaluation> {
    return Promise.resolve(evaluateHeuristically(input));
  }

  generateFeedback(
    input: EvaluationInput & { evaluation: AnswerEvaluation },
  ): Promise<Feedback> {
    const { well, improve, structure, modelAnswer } = input.evaluation;
    return Promise.resolve({ well, improve, structure, modelAnswer });
  }

  generateRecommendations(
    input: RecommendationInput,
  ): Promise<StudyRecommendation> {
    const weakest = input.weakestSkills.slice(0, 5);

    const items = weakest.map((skill) => ({
      title: `Strengthen ${skill.skill}`,
      detail: `Review the core ${skill.skill} concepts, then complete 2–3 practice questions on this topic. Current score: ${skill.score.toFixed(0)}%.`,
    }));

    while (items.length < 4) {
      items.push({
        title: "Run another mock interview",
        detail:
          "Take a fresh mixed interview to measure progress and surface new weak spots.",
      });
    }

    const summary =
      weakest.length > 0
        ? `Your weakest area is ${weakest[0]!.skill} (${weakest[0]!.score.toFixed(0)}%). Focus your next sessions there, then retest to confirm improvement.`
        : "You have limited data so far. Complete a few more interviews so recommendations can target specific weaknesses.";

    return Promise.resolve({ summary, items });
  }
}

function evaluateHeuristically(input: EvaluationInput): AnswerEvaluation {
  const answer = input.answer.trim();
  const words = tokenize(answer);
  const wordCount = words.length;
  const wordSet = new Set(words);
  const lower = answer.toLowerCase();

  const concepts = input.expectedConcepts;
  const matched: string[] = [];
  const missing: string[] = [];

  for (const concept of concepts) {
    if (conceptMatches(concept, wordSet, lower)) matched.push(concept);
    else missing.push(concept);
  }

  const coverage = concepts.length > 0 ? matched.length / concepts.length : 0.5;
  const lengthScore = clamp(wordCount / 120, 0, 1);

  const sentences = answer
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : wordCount;
  const clarityBase =
    avgSentenceLength === 0
      ? 0
      : avgSentenceLength <= 28
        ? 1
        : Math.max(0.3, 28 / avgSentenceLength);
  const hasStructure =
    /\b(first|second|then|because|however|for example|for instance|finally|therefore)\b/i.test(
      answer,
    );
  const structureScore = clamp(
    (hasStructure ? 1 : 0.5) + (sentences.length >= 3 ? 0.5 : 0),
    0,
    1,
  );

  const tooShort = wordCount < 8;
  const iDontKnow = /\b(i (don't|do not) know|no idea|not sure)\b/i.test(lower);

  if (tooShort || iDontKnow) {
    return {
      score: 1.5,
      technicalScore: 1,
      completenessScore: 1,
      relevanceScore: 2,
      clarityScore: 2,
      communicationScore: 2,
      well: ["You attempted the question."],
      improve: [
        "Give a direct answer even if you are unsure — start with what you do know.",
        "Structure the answer: definition, reasoning, example.",
        concepts[0] ? `Try to cover at least ${concepts[0]}.` : "Add concrete detail.",
      ],
      structure: [
        "Restate the question in your own words.",
        "Give your best partial answer.",
        "Explain your reasoning.",
        "Note what you would verify.",
      ],
      modelAnswer: concepts.length
        ? `A strong answer would cover: ${concepts.join(", ")}.`
        : "A strong answer would define the concept, explain it with an example, and note trade-offs.",
      ...(input.inputMode === "voice"
        ? { deliveryNote: `Only ${wordCount} words were captured. Try to speak a little longer.` }
        : {}),
    };
  }

  const technicalScore = round1(
    clamp(1.5 + coverage * 7.5 + (wordCount >= 40 ? 1 : 0)),
  );
  const completenessScore = round1(clamp(1 + coverage * 6 + lengthScore * 3));
  const relevanceScore = round1(
    clamp(
      2 +
        coverage * 7 +
        (input.question
          .toLowerCase()
          .split(/\s+/)
          .some((word) => word.length > 5 && lower.includes(word))
          ? 1
          : 0),
    ),
  );
  const clarityScore = round1(
    clamp(3 + clarityBase * 4 + (wordCount >= 25 ? 2 : 0)),
  );
  const communicationScore = round1(
    clamp(
      2 +
        structureScore * 4 +
        clarityBase * 3 +
        (wordCount >= 30 ? 1 : 0),
    ),
  );

  const score = round1(
    clamp(
      technicalScore * 0.35 +
        completenessScore * 0.2 +
        relevanceScore * 0.15 +
        clarityScore * 0.15 +
        communicationScore * 0.15,
    ),
  );

  const well: string[] = matched.map((concept) => `Covered ${concept}.`);
  if (wordCount >= 60) well.push("Gave a reasonably detailed explanation.");
  if (structureScore >= 0.9) well.push("Used clear, well-structured sentences.");
  if (well.length === 0) well.push("Addressed the question directly.");

  const improve: string[] = missing
    .slice(0, 4)
    .map((concept) => `Explain ${concept} more explicitly.`);
  if (wordCount < 60)
    improve.push("Expand the answer with more detail and a concrete example.");
  if (!hasStructure)
    improve.push("Signpost your reasoning with words like “first”, “because” and “for example”.");
  if (improve.length === 0)
    improve.push("Tighten the answer so the key point appears first.");

  const deliveryNote =
    input.inputMode === "voice"
      ? (() => {
          const fillerCount = words.filter((word) => FILLERS.has(word)).length;
          return `Approx. ${wordCount} words. Filler words detected: ${fillerCount}. Aim for a steady pace and fewer fillers.`;
        })()
      : undefined;

  return {
    score,
    technicalScore,
    completenessScore,
    relevanceScore,
    clarityScore,
    communicationScore,
    well: well.slice(0, 5),
    improve: improve.slice(0, 5),
    structure: [
      "Define the concept in one sentence.",
      "Explain when and why it is used.",
      "Give a concrete example.",
      "Mention trade-offs or alternatives.",
    ],
    modelAnswer: concepts.length
      ? `A strong answer should cover: ${concepts.join(", ")}.`
      : "A strong answer should define the concept, explain its purpose, give an example and note trade-offs.",
    ...(deliveryNote ? { deliveryNote } : {}),
  };
}
