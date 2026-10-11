import { describe, expect, it, vi } from "vitest";

// No session: every protected route handler must reject with 401 before any
// service or database work happens.
vi.mock("@/lib/auth/auth", () => ({
  auth: async () => null,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  GET as listInterviews,
  POST as createInterview,
} from "@/app/api/interviews/route";
import {
  DELETE as deleteInterview,
  GET as getInterview,
} from "@/app/api/interviews/[id]/route";
import { POST as submitAnswer } from "@/app/api/interviews/[id]/answer/route";
import { POST as advanceInterview } from "@/app/api/interviews/[id]/next/route";
import { POST as generateQuestion } from "@/app/api/question-bank/generate/route";

const context = { params: Promise.resolve({ id: "interview-1" }) };

function jsonRequest(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function expectUnauthorized(response: Response): Promise<void> {
  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "UNAUTHORIZED",
      message: "You must be signed in.",
      retryable: false,
    },
  });
}

describe("route handler authorization", () => {
  it("GET /api/interviews requires authentication", async () => {
    await expectUnauthorized(await listInterviews());
  });

  it("POST /api/interviews requires authentication", async () => {
    await expectUnauthorized(
      await createInterview(
        jsonRequest("http://localhost/api/interviews", "POST", {}),
      ),
    );
  });

  it("GET /api/interviews/[id] requires authentication", async () => {
    await expectUnauthorized(
      await getInterview(
        new Request("http://localhost/api/interviews/interview-1"),
        context,
      ),
    );
  });

  it("DELETE /api/interviews/[id] requires authentication", async () => {
    await expectUnauthorized(
      await deleteInterview(
        new Request("http://localhost/api/interviews/interview-1", {
          method: "DELETE",
        }),
        context,
      ),
    );
  });

  it("POST /api/interviews/[id]/answer requires authentication", async () => {
    await expectUnauthorized(
      await submitAnswer(
        jsonRequest(
          "http://localhost/api/interviews/interview-1/answer",
          "POST",
          { questionId: "q1", answer: "hello" },
        ),
        context,
      ),
    );
  });

  it("POST /api/interviews/[id]/next requires authentication", async () => {
    await expectUnauthorized(
      await advanceInterview(
        new Request("http://localhost/api/interviews/interview-1/next", {
          method: "POST",
        }),
        context,
      ),
    );
  });

  it("POST /api/question-bank/generate requires authentication", async () => {
    await expectUnauthorized(
      await generateQuestion(
        jsonRequest("http://localhost/api/question-bank/generate", "POST", {
          category: "DSA",
          difficulty: "MEDIUM",
        }),
      ),
    );
  });
});
