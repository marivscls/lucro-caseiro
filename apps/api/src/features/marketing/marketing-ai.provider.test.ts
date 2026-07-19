import { describe, expect, it, vi } from "vitest";

import {
  generateMarketingAiWithFallback,
  MarketingAiQuotaError,
} from "./marketing-ai.provider";

describe("marketing AI provider fallback", () => {
  it("uses Flash-Lite when the primary model quota is exhausted", async () => {
    const generate = vi.fn((model: string) => {
      if (model === "gemini-2.5-flash") {
        return Promise.reject(quotaError());
      }
      return Promise.resolve("rascunho");
    });

    await expect(generateMarketingAiWithFallback(generate)).resolves.toEqual({
      text: "rascunho",
      model: "gemini-2.5-flash-lite",
    });
    expect(generate.mock.calls.map(([model]) => model)).toEqual([
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ]);
  });

  it("does not call the fallback when the primary model succeeds", async () => {
    const generate = vi.fn(() => Promise.resolve("rascunho"));

    await expect(generateMarketingAiWithFallback(generate)).resolves.toMatchObject({
      model: "gemini-2.5-flash",
    });
    expect(generate).toHaveBeenCalledOnce();
  });

  it("reports quota exhaustion when both models are unavailable", async () => {
    const retryError = Object.assign(new Error("Retries exhausted"), {
      lastError: quotaError(),
    });
    const generate = vi.fn(() => Promise.reject(retryError));

    await expect(generateMarketingAiWithFallback(generate)).rejects.toBeInstanceOf(
      MarketingAiQuotaError,
    );
  });
});

function quotaError() {
  return Object.assign(new Error("Quota exceeded"), {
    statusCode: 429,
    responseBody: "RESOURCE_EXHAUSTED: quota exceeded",
  });
}
