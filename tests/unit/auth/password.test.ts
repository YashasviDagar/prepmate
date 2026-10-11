import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("produces a hash that verifies against the original password", async () => {
    const hash = await hashPassword("CorrectHorse1");

    expect(hash).not.toBe("CorrectHorse1");
    expect(await verifyPassword("CorrectHorse1", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("CorrectHorse1");

    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("salts hashes so identical passwords differ", async () => {
    const [first, second] = await Promise.all([
      hashPassword("SamePassword1"),
      hashPassword("SamePassword1"),
    ]);

    expect(first).not.toBe(second);
  });
});
