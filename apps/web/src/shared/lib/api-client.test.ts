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
  it.each([null, { message: "Internal Server Error" }])(
    "trata respostas inválidas de erro",
    async (problem) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(JSON.stringify(problem), { status: 500 })),
      );
      await expect(apiClient("/campaigns")).rejects.toThrow(/tente novamente/i);
    },
  );

  it("não transforma falha ao gravar cache em falha da operação", async () => {
    vi.stubGlobal("window", {
      localStorage: {
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"items":[]}')));
    await expect(apiClient("/campaigns")).resolves.toEqual({ items: [] });
  });

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
