import { describe, expect, it, vi, type Mock } from "vitest";

const { mockState } = vi.hoisted(() => ({
  mockState: {
    ip: "10.0.0.1",
    verifyPassword: true,
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": mockState.ip }),
}));

vi.mock("@/lib/auth/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: async () => null,
  handlers: {},
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: async () => "hashed-password",
  verifyPassword: async () => mockState.verifyPassword,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async () => []),
  },
}));

import { initialAuthState } from "@/lib/auth/action-state";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  signOutAction,
} from "@/lib/auth/actions";
import { signIn, signOut } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

type MockedDb = {
  user: { findUnique: Mock; create: Mock; update: Mock };
  passwordResetToken: {
    create: Mock;
    findUnique: Mock;
    update: Mock;
    deleteMany: Mock;
  };
  $transaction: Mock;
};

const db = prisma as unknown as MockedDb;
const mockedSignIn = vi.mocked(signIn);
const mockedSignOut = vi.mocked(signOut);

let ipCounter = 0;

/** Unique client IP per test so the in-memory rate limiter never cross-talks. */
function freshIp(): string {
  ipCounter += 1;
  mockState.ip = `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
  return mockState.ip;
}

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const validRegistration = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "Password1",
  confirmPassword: "Password1",
};

describe("registerAction", () => {
  it("rejects invalid input before touching the database", async () => {
    freshIp();

    const state = await registerAction(
      initialAuthState,
      formData({
        name: "A",
        email: "not-an-email",
        password: "short",
        confirmPassword: "different",
      }),
    );

    expect(state.status).toBe("error");
    expect(state.fieldErrors).toBeDefined();
    expect(db.user.create).not.toHaveBeenCalled();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email", async () => {
    freshIp();
    db.user.findUnique.mockResolvedValue({ id: "existing" });

    const state = await registerAction(
      initialAuthState,
      formData(validRegistration),
    );

    expect(state.status).toBe("error");
    expect(state.fieldErrors?.email?.length).toBeGreaterThan(0);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("creates the account and signs the user in", async () => {
    freshIp();
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: "u1" });

    const state = await registerAction(
      initialAuthState,
      formData({ ...validRegistration, email: "Ada@Example.com" }),
    );

    expect(state.status).toBe("success");
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed-password",
      },
      select: { id: true },
    });
    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      email: "ada@example.com",
      password: "Password1",
      redirectTo: "/dashboard",
    });
  });

  it("rate limits repeated registration attempts", async () => {
    freshIp();
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: "u1" });

    const payload = formData(validRegistration);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await registerAction(initialAuthState, payload);
    }

    const state = await registerAction(initialAuthState, payload);

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/too many/i);
  });
});

describe("loginAction", () => {
  it("returns validation errors for malformed input", async () => {
    freshIp();

    const state = await loginAction(
      initialAuthState,
      formData({ email: "nope", password: "" }),
    );

    expect(state.status).toBe("error");
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an unknown email without revealing it", async () => {
    freshIp();
    db.user.findUnique.mockResolvedValue(null);

    const state = await loginAction(
      initialAuthState,
      formData({ email: "ghost@example.com", password: "Password1" }),
    );

    expect(state.message).toBe("Invalid email or password.");
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("rejects an account with no password hash (OAuth-only)", async () => {
    freshIp();
    db.user.findUnique.mockResolvedValue({ id: "u1", passwordHash: null });

    const state = await loginAction(
      initialAuthState,
      formData({ email: "oauth@example.com", password: "Password1" }),
    );

    expect(state.message).toBe("Invalid email or password.");
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password", async () => {
    freshIp();
    mockState.verifyPassword = false;
    db.user.findUnique.mockResolvedValue({ id: "u1", passwordHash: "hash" });

    const state = await loginAction(
      initialAuthState,
      formData({ email: "user@example.com", password: "Password1" }),
    );

    expect(state.message).toBe("Invalid email or password.");
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("signs in with valid credentials", async () => {
    freshIp();
    mockState.verifyPassword = true;
    db.user.findUnique.mockResolvedValue({ id: "u1", passwordHash: "hash" });

    const state = await loginAction(
      initialAuthState,
      formData({ email: "User@Example.com", password: "Password1" }),
    );

    expect(state.status).toBe("success");
    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "Password1",
      redirectTo: "/dashboard",
    });
  });

  it("does not redirect to a protocol-relative URL", async () => {
    freshIp();
    mockState.verifyPassword = true;
    db.user.findUnique.mockResolvedValue({ id: "u1", passwordHash: "hash" });

    await loginAction(
      initialAuthState,
      formData({
        email: "user@example.com",
        password: "Password1",
        redirectTo: "//evil.example.com",
      }),
    );

    expect(mockedSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/dashboard" }),
    );
  });

  it("honours a safe local redirect target", async () => {
    freshIp();
    mockState.verifyPassword = true;
    db.user.findUnique.mockResolvedValue({ id: "u1", passwordHash: "hash" });

    await loginAction(
      initialAuthState,
      formData({
        email: "user@example.com",
        password: "Password1",
        redirectTo: "/history",
      }),
    );

    expect(mockedSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/history" }),
    );
  });
});

describe("forgotPasswordAction", () => {
  it("does not reveal whether an account exists", async () => {
    freshIp();
    db.user.findUnique.mockResolvedValue(null);

    const state = await forgotPasswordAction(
      initialAuthState,
      formData({ email: "ghost@example.com" }),
    );

    expect(state.status).toBe("success");
    expect(db.passwordResetToken.create).not.toHaveBeenCalled();
    expect(state.resetLink).toBeUndefined();
  });

  it("issues a reset link for a known account outside production", async () => {
    freshIp();
    db.user.findUnique.mockResolvedValue({ id: "u1" });

    const state = await forgotPasswordAction(
      initialAuthState,
      formData({ email: "user@example.com" }),
    );

    expect(state.status).toBe("success");
    expect(db.passwordResetToken.create).toHaveBeenCalledTimes(1);
    expect(state.resetLink).toContain("/reset-password?token=");
  });
});

describe("resetPasswordAction", () => {
  const token = "a".repeat(40);
  const base = { token, password: "Password1", confirmPassword: "Password1" };

  it("rejects mismatched passwords", async () => {
    freshIp();

    const state = await resetPasswordAction(
      initialAuthState,
      formData({ ...base, confirmPassword: "Different1" }),
    );

    expect(state.status).toBe("error");
    expect(state.fieldErrors?.confirmPassword?.length).toBeGreaterThan(0);
    expect(db.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an unknown token", async () => {
    freshIp();
    db.passwordResetToken.findUnique.mockResolvedValue(null);

    const state = await resetPasswordAction(
      initialAuthState,
      formData(base),
    );

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/invalid or has expired/i);
  });

  it("rejects an expired token", async () => {
    freshIp();
    db.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      expires: new Date(Date.now() - 60_000),
      usedAt: null,
    });

    const state = await resetPasswordAction(
      initialAuthState,
      formData(base),
    );

    expect(state.status).toBe("error");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an already used token", async () => {
    freshIp();
    db.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      expires: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    });

    const state = await resetPasswordAction(
      initialAuthState,
      formData(base),
    );

    expect(state.status).toBe("error");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("resets the password for a valid token", async () => {
    freshIp();
    db.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      expires: new Date(Date.now() + 60_000),
      usedAt: null,
    });

    const state = await resetPasswordAction(
      initialAuthState,
      formData(base),
    );

    expect(state.status).toBe("success");
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe("signOutAction", () => {
  it("signs the user out and redirects home", async () => {
    await signOutAction();

    expect(mockedSignOut).toHaveBeenCalledWith({ redirectTo: "/" });
  });
});
