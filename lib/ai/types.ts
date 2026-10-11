import type {
  Difficulty,
  ExperienceLevel,
  InterviewMode,
  InterviewType,
  QuestionType,
  Role,
} from "@/lib/generated/prisma/enums";

export type InterviewContext = {
  role: Role;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: Difficulty;
  mode: InterviewMode;
  topics: string[];
};

export type GeneratedQuestion = {
  question: string;
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  expectedConcepts: string[];
};

export type QuestionGenerationInput = {
  context: InterviewContext;
  /** Questions already asked in this interview, to avoid repetition. */
  previousQuestions: string[];
  /** Topics already covered. */
  askedTopics: string[];
  /** Difficulty the adaptive layer wants next. */
  targetDifficulty: Difficulty;
  /** Preferred topic, if the adaptive layer selected one. */
  targetTopic?: string;
  /** Short natural-language summary of the candidate's performance so far. */
  performanceSummary?: string;
  /** When generating a follow-up. */
  parentQuestion?: string;
  candidateAnswer?: string;
};

export type AnswerEvaluation = {
  /** All scores are 0–10. */
  score: number;
  technicalScore: number;
  completenessScore: number;
  relevanceScore: number;
  clarityScore: number;
  communicationScore: number;
  well: string[];
  improve: string[];
  structure: string[];
  modelAnswer: string;
  /**
   * Delivery note for voice answers. Only describes observable speech
   * characteristics (pace, filler words). Never infers personality, emotion
   * or mental state.
   */
  deliveryNote?: string;
};

export type EvaluationInput = {
  context: InterviewContext;
  question: string;
  expectedConcepts: string[];
  answer: string;
  inputMode: "text" | "voice";
};

export type Feedback = {
  well: string[];
  improve: string[];
  structure: string[];
  modelAnswer: string;
};

export type SkillScore = { skill: string; score: number };

export type RecommendationInput = {
  role: Role;
  overallScore: number;
  weakestSkills: SkillScore[];
  strongestSkills: SkillScore[];
};

export type StudyRecommendation = {
  summary: string;
  items: { title: string; detail: string }[];
};

export interface AIProvider {
  readonly name: string;
  generateQuestion(input: QuestionGenerationInput): Promise<GeneratedQuestion>;
  generateFollowUp(input: QuestionGenerationInput): Promise<GeneratedQuestion>;
  evaluateAnswer(input: EvaluationInput): Promise<AnswerEvaluation>;
  generateFeedback(
    input: EvaluationInput & { evaluation: AnswerEvaluation },
  ): Promise<Feedback>;
  generateRecommendations(
    input: RecommendationInput,
  ): Promise<StudyRecommendation>;
}
