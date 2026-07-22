import type { Session } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { supabase } from "./supabase";
import { apiClient } from "./api-client";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("apiClient", () => {
  it("renova a sessão e repete uma vez quando o token expirou", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Sessao invalida" }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ updated: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(supabase.auth, "refreshSession").mockResolvedValue({
      data: {
        user: null,
        session: { access_token: "token-renovado" } as Session,
      },
      error: null,
    });

    await expect(apiClient("/profile", { token: "token-antigo" })).resolves.toEqual({
      updated: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer token-antigo",
    });
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer token-renovado",
    });
  });
});
