import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: { session: null as unknown },
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: async () => mockAuth.session,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

import {
  UnauthorizedError,
  getCurrentUser,
  requireApiUser,
  requireUser,
} from "@/lib/auth/guards";

const session = {
  user: { id: "u1", name: "Ada", email: "ada@example.com", image: null },
};

beforeEach(() => {
  mockAuth.session = null;
});

describe("getCurrentUser", () => {
  it("returns null when there is no session", async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("returns the mapped user when a session exists", async () => {
    mockAuth.session = session;

    await expect(getCurrentUser()).resolves.toEqual({
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      image: null,
    });
  });

  it("returns null when the session has no user id", async () => {
    mockAuth.session = { user: {} };

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});

describe("requireApiUser", () => {
  it("throws UnauthorizedError when unauthenticated", async () => {
    await expect(requireApiUser()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("resolves with the user when authenticated", async () => {
    mockAuth.session = session;

    await expect(requireApiUser()).resolves.toMatchObject({ id: "u1" });
  });
});

describe("requireUser", () => {
  it("redirects to /login when unauthenticated", async () => {
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("resolves with the user when authenticated", async () => {
    mockAuth.session = session;

    await expect(requireUser()).resolves.toMatchObject({ id: "u1" });
  });
});
