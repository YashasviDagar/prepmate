import { afterEach, describe, expect, it } from "vitest";

import { AIError } from "@/lib/ai/errors";
import { createAIProvider } from "@/lib/ai";
import { MockAIProvider } from "@/lib/ai/mock-provider";
import { OpenAICompatibleProvider } from "@/lib/ai/openai-provider";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("createAIProvider", () => {
  it("returns the mock provider by default", () => {
    delete process.env.AI_PROVIDER;
    expect(createAIProvider()).toBeInstanceOf(MockAIProvider);
  });

  it("returns the OpenAI-compatible provider when configured", () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_API_KEY = "test-key";

    expect(createAIProvider()).toBeInstanceOf(OpenAICompatibleProvider);
  });

  it("throws AI_NOT_CONFIGURED when the OpenAI key is missing", () => {
    process.env.AI_PROVIDER = "openai";
    delete process.env.AI_API_KEY;

    expect(() => createAIProvider()).toThrow(AIError);
    try {
      createAIProvider();
    } catch (error) {
      expect((error as AIError).code).toBe("AI_NOT_CONFIGURED");
    }
  });

  it("throws for an unknown provider", () => {
    process.env.AI_PROVIDER = "does-not-exist";

    expect(() => createAIProvider()).toThrow(/Unknown AI_PROVIDER/);
  });
});
