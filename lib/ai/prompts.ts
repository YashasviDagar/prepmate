import {
  DIFFICULTY_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_TYPE_LABELS,
  QUESTION_TYPE_LABELS,
  ROLE_LABELS,
} from "@/lib/domain/interview";
import { QuestionType } from "@/lib/generated/prisma/enums";
import type {
  EvaluationInput,
  QuestionGenerationInput,
  RecommendationInput,
} from "@/lib/ai/types";

export type ChatMessage = { role: "system" | "user"; content: string };

const SYSTEM_PREAMBLE = `You are InterviewPrep, an experienced technical and HR interviewer.
You produce fair, specific and actionable interview material.
You never claim to measure personality, mental health, confidence as a psychological trait, or employability.
You always respond with a single valid JSON object and nothing else — no markdown fences, no commentary.`;

function contextBlock(input: QuestionGenerationInput): string {
  const { context } = input;
  return [
    `Role: ${ROLE_LABELS[context.role]}`,
    `Experience level: ${EXPERIENCE_LEVEL_LABELS[context.experienceLevel]}`,
    `Interview type: ${INTERVIEW_TYPE_LABELS[context.interviewType]}`,
    `Mode: ${INTERVIEW_MODE_LABELS[context.mode]}`,
    `Base difficulty: ${DIFFICULTY_LABELS[context.difficulty]}`,
    `Allowed topics: ${context.topics.join(", ")}`,
    `Target difficulty for this question: ${DIFFICULTY_LABELS[input.targetDifficulty]}`,
    input.targetTopic ? `Preferred topic: ${input.targetTopic}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildQuestionPrompt(input: QuestionGenerationInput): ChatMessage[] {
  const previous = input.previousQuestions.length
    ? input.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
    : "None yet.";

  return [
    { role: "system", content: SYSTEM_PREAMBLE },
    {
      role: "user",
      content: `Generate ONE interview question.

${contextBlock(input)}

Questions already asked (do not repeat or closely paraphrase):
${previous}

${input.performanceSummary ? `Candidate performance so far: ${input.performanceSummary}` : ""}

Rules:
- Stay within the allowed topics.
- Match the target difficulty.
- Write a single clear question a real interviewer would ask.
- expectedConcepts must list 3–6 concrete concepts a strong answer should mention.

Respond with JSON exactly in this shape:
{
  "question": string,
  "topic": string,
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "questionType": ${Object.keys(QuestionType)
    .map((key) => `"${key}"`)
    .join(" | ")},
  "expectedConcepts": string[]
}`,
    },
  ];
}

export function buildFollowUpPrompt(input: QuestionGenerationInput): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PREAMBLE },
    {
      role: "user",
      content: `Generate ONE short follow-up question that digs into the candidate's previous answer.

${contextBlock(input)}

Original question: ${input.parentQuestion ?? "(unknown)"}
Candidate answer: ${input.candidateAnswer ?? "(no answer provided)"}

Rules:
- The follow-up must reference something specific in the candidate's answer.
- Keep it to one or two sentences.
- Use questionType "FOLLOW_UP".

Respond with JSON exactly in this shape:
{
  "question": string,
  "topic": string,
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "questionType": "FOLLOW_UP",
  "expectedConcepts": string[]
}`,
    },
  ];
}

export function buildEvaluationPrompt(input: EvaluationInput): ChatMessage[] {
  const { context } = input;
  return [
    { role: "system", content: SYSTEM_PREAMBLE },
    {
      role: "user",
      content: `Evaluate the candidate's answer.

Context:
Role: ${ROLE_LABELS[context.role]}
Interview type: ${INTERVIEW_TYPE_LABELS[context.interviewType]}
Difficulty: ${DIFFICULTY_LABELS[context.difficulty]}

Question: ${input.question}
Expected concepts: ${input.expectedConcepts.join(", ") || "(none provided)"}
Answer mode: ${input.inputMode}

Candidate answer:
"""
${input.answer}
"""

Score each dimension from 0 to 10 (decimals allowed):
- technicalScore: correctness of the concepts.
- completenessScore: coverage of important points.
- relevanceScore: does it directly address the question.
- clarityScore: is the explanation understandable.
- communicationScore: structure and concision.
- score: overall.

Feedback rules:
- "well" must list specific things the answer did correctly (3–5 items).
- "improve" must be specific and actionable (3–5 items), never generic praise.
- "structure" must outline how to structure a better answer (3–5 steps).
- "modelAnswer" is a concise model answer (3–6 sentences).
${
  input.inputMode === "voice"
    ? '- "deliveryNote" may comment ONLY on observable delivery: pace, filler words, length. Never infer emotion, confidence as a trait, personality or mental state.'
    : "- Omit deliveryNote."
}

Respond with JSON exactly in this shape:
{
  "score": number,
  "technicalScore": number,
  "completenessScore": number,
  "relevanceScore": number,
  "clarityScore": number,
  "communicationScore": number,
  "well": string[],
  "improve": string[],
  "structure": string[],
  "modelAnswer": string,
  "deliveryNote": string | undefined
}`,
    },
  ];
}

export function buildFeedbackPrompt(
  input: EvaluationInput & { evaluation: { score: number } },
): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PREAMBLE },
    {
      role: "user",
      content: `Write actionable feedback for this answer.

Question: ${input.question}
Expected concepts: ${input.expectedConcepts.join(", ") || "(none provided)"}
Answer:
"""
${input.answer}
"""
Overall score: ${input.evaluation.score}/10

Respond with JSON exactly in this shape:
{
  "well": string[],
  "improve": string[],
  "structure": string[],
  "modelAnswer": string
}`,
    },
  ];
}

export function buildRecommendationPrompt(
  input: RecommendationInput,
): ChatMessage[] {
  const weakest = input.weakestSkills
    .map((s) => `${s.skill} (${s.score.toFixed(1)}%)`)
    .join(", ");
  const strongest = input.strongestSkills
    .map((s) => `${s.skill} (${s.score.toFixed(1)}%)`)
    .join(", ");

  return [
    { role: "system", content: SYSTEM_PREAMBLE },
    {
      role: "user",
      content: `Create a personalised study plan.

Target role: ${ROLE_LABELS[input.role]}
Recent overall score: ${input.overallScore.toFixed(1)}/100
Strongest areas: ${strongest || "(none yet)"}
Weakest areas: ${weakest || "(none yet)"}

Rules:
- Focus on the weakest areas first.
- Give 4–6 concrete, ordered preparation steps.
- Do not promise job outcomes or measure personality/employability.

Respond with JSON exactly in this shape:
{
  "summary": string,
  "items": [{ "title": string, "detail": string }]
}`,
    },
  ];
}

export const QUESTION_TYPE_LIST = Object.keys(QuestionType);
export { QUESTION_TYPE_LABELS };
