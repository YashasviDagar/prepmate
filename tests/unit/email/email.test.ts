import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";

describe("email", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("is a no-op when not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(isEmailConfigured()).toBe(false);
    await expect(sendPasswordResetEmail("a@b.co", "http://x")).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts the reset link to the provider when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "InterviewPrep <no-reply@example.com>");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await expect(
      sendPasswordResetEmail("a@b.co", "http://x/reset-password?token=t"),
    ).resolves.toBe(true);

    const [, init] = fetchSpy.mock.calls[0]!;
    const body = JSON.parse(String(init!.body));
    expect(body.to).toBe("a@b.co");
    expect(body.text).toContain("http://x/reset-password?token=t");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
  });

  it("throws when the provider rejects the request", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "x@example.com");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("no", { status: 422 }));
    await expect(sendPasswordResetEmail("a@b.co", "http://x")).rejects.toThrow(/422/);
  });
});
