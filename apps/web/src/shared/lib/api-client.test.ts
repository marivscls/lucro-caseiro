import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./api-client";

vi.mock("./supabase", () => ({
  getSupabase: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
  }),
}));

describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("cancels a request that exceeds its timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        const signal = init?.signal;
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener(
            "abort",
            () =>
              reject(
                signal.reason instanceof Error
                  ? signal.reason
                  : new Error("Request aborted"),
              ),
            { once: true },
          );
        });
      }),
    );

    await expect(apiClient("/slow", { timeoutMs: 5 })).rejects.toThrow(
      "A operação demorou mais que o esperado. Tente novamente.",
    );
  });
});
