import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { CreateInterviewInput } from "@/lib/validation/interview";

/**
 * Database integration tests.
 *
 * These run against a real PostgreSQL database and are skipped unless
 * TEST_DATABASE_URL is set. Point it at a disposable test database:
 *
 *   TEST_DATABASE_URL="postgresql://..." pnpm test
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DATABASE_URL ? describe : describe.skip;

type PrismaModule = typeof import("@/lib/db/prisma");
type ServiceModule = typeof import("@/lib/services/interview-service");

const baseConfig: CreateInterviewInput = {
  role: "FRONTEND_DEVELOPER",
  type: "TECHNICAL",
  mode: "PRACTICE",
  difficulty: "MEDIUM",
  questionCount: 3,
  topics: ["React", "JavaScript"],
};

describeDb("interview service (database integration)", () => {
  let prisma: PrismaModule["prisma"];
  let service: ServiceModule;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.AI_PROVIDER = "mock";

    ({ prisma } = await import("@/lib/db/prisma"));
    service = await import("@/lib/services/interview-service");

    await prisma.interview.deleteMany({});
    await prisma.skillPerformance.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ["a@test.dev", "b@test.dev"] } },
    });

    const a = await prisma.user.create({
      data: {
        email: "a@test.dev",
        name: "Candidate A",
        experienceLevel: "INTERMEDIATE",
      },
    });
    const b = await prisma.user.create({
      data: {
        email: "b@test.dev",
        name: "Candidate B",
        experienceLevel: "INTERMEDIATE",
      },
    });

    userAId = a.id;
    userBId = b.id;
  });

  afterAll(async () => {
    await prisma.interview.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.skillPerformance.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
    await prisma.$disconnect();
  });

  it("creates an interview and generates the first question", async () => {
    const { id } = await service.createInterview(userAId, {
      ...baseConfig,
      questionCount: 3,
    });

    const state = await service.startInterview(userAId, id);

    expect(state.status).toBe("IN_PROGRESS");
    expect(state.questions).toHaveLength(1);
    expect(state.progress.currentQuestion).not.toBeNull();
    expect(state.progress.totalPrimary).toBe(3);
  });

  it("completes an interview after answering all questions", async () => {
    const { id } = await service.createInterview(userAId, baseConfig);
    let state = await service.startInterview(userAId, id);

    // Kept short so the adaptive layer does not add follow-ups.
    for (let i = 0; i < 10 && state.status !== "COMPLETED"; i++) {
      state = await service.submitAnswer(userAId, id, {
        questionId: state.progress.currentQuestion!.id,
        answer: "Closures capture scope.",
        inputMode: "text",
      });
    }

    expect(state.status).toBe("COMPLETED");
    expect(state.scores?.overall).toBeGreaterThan(0);

    const stored = await prisma.answer.findFirst({
      where: { question: { interviewId: id } },
    });
    expect(stored).not.toBeNull();
    expect(stored?.score).not.toBeNull();

    const performance = await prisma.skillPerformance.findMany({
      where: { userId: userAId },
    });
    expect(performance.length).toBeGreaterThan(0);
  });

  it("resumes an in-progress interview with progress preserved", async () => {
    const { id } = await service.createInterview(userAId, {
      ...baseConfig,
      questionCount: 3,
    });
    const started = await service.startInterview(userAId, id);
    const firstQuestion = started.progress.currentQuestion!;

    await service.submitAnswer(userAId, id, {
      questionId: firstQuestion.id,
      answer: "Closures capture scope.",
      inputMode: "text",
    });

    const resumed = await service.getInterviewState(userAId, id);

    expect(resumed.status).toBe("IN_PROGRESS");
    expect(resumed.questions.length).toBeGreaterThanOrEqual(2);
    expect(resumed.progress.currentQuestion).not.toBeNull();
    expect(resumed.questions[0]?.answer?.answer).toBe("Closures capture scope.");
  });

  it("lists interview history for the owning user", async () => {
    const history = await service.listInterviews(userAId);

    expect(history.length).toBeGreaterThan(0);
    expect(history.every((item) => typeof item.id === "string")).toBe(true);
  });

  it("prevents one user from accessing another user's interview", async () => {
    const { id } = await service.createInterview(userAId, baseConfig);

    await expect(
      service.getInterviewState(userBId, id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      service.getInterviewReport(userBId, id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      service.deleteInterview(userBId, id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    // The owner still has access.
    const state = await service.getInterviewState(userAId, id);
    expect(state.id).toBe(id);
  });

  it("rejects a mismatched question id", async () => {
    const { id } = await service.createInterview(userAId, baseConfig);
    await service.startInterview(userAId, id);

    await expect(
      service.submitAnswer(userAId, id, {
        questionId: "not-the-active-question",
        answer: "Some answer",
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
});
