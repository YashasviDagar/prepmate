import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Credentials integration tests (registration + login logic against a real
 * database and real bcrypt hashing).
 *
 * Skipped unless TEST_DATABASE_URL is set.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DATABASE_URL ? describe : describe.skip;

type PrismaModule = typeof import("@/lib/db/prisma");
type CredentialsModule = typeof import("@/lib/auth/credentials");

const EMAIL = "credentials@test.dev";
const OAUTH_EMAIL = "oauth-only@test.dev";

describeDb("credentials (database integration)", () => {
  let prisma: PrismaModule["prisma"];
  let credentials: CredentialsModule;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ({ prisma } = await import("@/lib/db/prisma"));
    credentials = await import("@/lib/auth/credentials");

    await prisma.user.deleteMany({ where: { email: { in: [EMAIL, OAUTH_EMAIL] } } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [EMAIL, OAUTH_EMAIL] } } });
    await prisma.$disconnect();
  });

  it("registers a user and verifies the correct password", async () => {
    const created = await credentials.createCredentialsUser({
      name: "Credentials Tester",
      email: EMAIL,
      password: "Password1",
    });

    expect(created.id).toBeTruthy();

    const user = await credentials.verifyCredentials(EMAIL, "Password1");
    expect(user?.id).toBe(created.id);
    expect(user?.email).toBe(EMAIL);
  });

  it("normalises email case on registration and login", async () => {
    const user = await credentials.verifyCredentials(
      "CREDENTIALS@TEST.DEV",
      "Password1",
    );
    expect(user).not.toBeNull();
  });

  it("rejects an incorrect password", async () => {
    await expect(
      credentials.verifyCredentials(EMAIL, "WrongPassword1"),
    ).resolves.toBeNull();
  });

  it("rejects an unknown email", async () => {
    await expect(
      credentials.verifyCredentials("nobody@test.dev", "Password1"),
    ).resolves.toBeNull();
  });

  it("rejects a duplicate registration", async () => {
    await expect(
      credentials.createCredentialsUser({
        name: "Duplicate",
        email: EMAIL,
        password: "Password1",
      }),
    ).rejects.toBeInstanceOf(credentials.DuplicateEmailError);
  });

  it("rejects an OAuth-only account that has no password hash", async () => {
    await prisma.user.create({
      data: { email: OAUTH_EMAIL, name: "OAuth Only" },
    });

    await expect(
      credentials.verifyCredentials(OAUTH_EMAIL, "Password1"),
    ).resolves.toBeNull();
  });
});
