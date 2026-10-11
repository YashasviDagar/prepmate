import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * HTTP-layer authorization tests against a real database.
 *
 * The session is injected by mocking the Auth.js module; everything else
 * (route handler → guards → service → Prisma) runs for real.
 *
 * Skipped unless TEST_DATABASE_URL is set.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DATABASE_URL ? describe : describe.skip;

const { mockState } = vi.hoisted(() => ({
  mockState: { session: null as unknown },
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: async () => mockState.session,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

type PrismaModule = typeof import("@/lib/db/prisma");
type ServiceModule = typeof import("@/lib/services/interview-service");
type RouteModule = typeof import("@/app/api/interviews/[id]/route");

const EMAIL_A = "http-a@test.dev";
const EMAIL_B = "http-b@test.dev";

describeDb("HTTP authorization (database integration)", () => {
  let prisma: PrismaModule["prisma"];
  let service: ServiceModule;
  let route: RouteModule;
  let userAId: string;
  let userBId: string;
  let interviewId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.AI_PROVIDER = "mock";

    ({ prisma } = await import("@/lib/db/prisma"));
    service = await import("@/lib/services/interview-service");
    route = await import("@/app/api/interviews/[id]/route");

    await prisma.user.deleteMany({
      where: { email: { in: [EMAIL_A, EMAIL_B] } },
    });

    const a = await prisma.user.create({
      data: { email: EMAIL_A, name: "User A", experienceLevel: "INTERMEDIATE" },
    });
    const b = await prisma.user.create({
      data: { email: EMAIL_B, name: "User B", experienceLevel: "INTERMEDIATE" },
    });

    userAId = a.id;
    userBId = b.id;

    const created = await service.createInterview(userAId, {
      role: "FRONTEND_DEVELOPER",
      type: "TECHNICAL",
      mode: "PRACTICE",
      difficulty: "MEDIUM",
      questionCount: 3,
      topics: ["React"],
    });
    interviewId = created.id;
  });

  afterAll(async () => {
    await prisma.interview.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.skillPerformance.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await prisma.$disconnect();
  });

  function requestForOwner(): Request {
    return new Request(`http://localhost/api/interviews/${interviewId}`);
  }

  function context() {
    return { params: Promise.resolve({ id: interviewId }) };
  }

  it("returns 401 when unauthenticated", async () => {
    mockState.session = null;

    const response = await route.GET(requestForOwner(), context());

    expect(response.status).toBe(401);
  });

  it("returns 404 when user B requests user A's interview", async () => {
    mockState.session = { user: { id: userBId, email: EMAIL_B } };

    const response = await route.GET(requestForOwner(), context());

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 200 for the owning user", async () => {
    mockState.session = { user: { id: userAId, email: EMAIL_A } };

    const response = await route.GET(requestForOwner(), context());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.interview.id).toBe(interviewId);
  });

  it("prevents user B from deleting user A's interview", async () => {
    mockState.session = { user: { id: userBId, email: EMAIL_B } };

    const response = await route.DELETE(
      new Request(`http://localhost/api/interviews/${interviewId}`, {
        method: "DELETE",
      }),
      context(),
    );

    expect(response.status).toBe(404);

    // The interview still exists for its owner.
    const stillThere = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { id: true },
    });
    expect(stillThere?.id).toBe(interviewId);
  });
});
