import { AIError } from "@/lib/ai/errors";
import { MockAIProvider } from "@/lib/ai/mock-provider";
import { OpenAICompatibleProvider } from "@/lib/ai/openai-provider";
import type { AIProvider } from "@/lib/ai/types";

let cached: AIProvider | null = null;

export function createAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (provider === "mock") {
    return new MockAIProvider();
  }

  if (provider === "openai" || provider === "openai-compatible") {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new AIError(
        "AI_NOT_CONFIGURED",
        "AI_PROVIDER is set to openai but AI_API_KEY is missing.",
      );
    }

    return new OpenAICompatibleProvider({
      baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
      apiKey,
      model: process.env.AI_MODEL ?? "gpt-4o-mini",
      timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 30_000),
    });
  }

  throw new AIError(
    "AI_NOT_CONFIGURED",
    `Unknown AI_PROVIDER "${provider}". Use "mock" or "openai".`,
  );
}

/** Returns the configured provider, memoised for the process lifetime. */
export function getAIProvider(): AIProvider {
  cached ??= createAIProvider();
  return cached;
}

/** Test hook — clears the memoised provider. */
export function resetAIProvider(): void {
  cached = null;
}

export type { AIProvider } from "@/lib/ai/types";
