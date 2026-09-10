import type { Session } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { supabase } from "./supabase";
import { apiClient } from "./api-client";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("apiClient", () => {
  it.each([
    [
      403,
      {
        error: "FORBIDDEN",
        message: "Recurso comprasComEstoque desativado para esta marca.",
      },
      /disponível/,
    ],
    [500, { message: "select * from private_table failed" }, /tente novamente/i],
    [429, null, /aguarde/i],
    [401, {}, /entre novamente/i],
    [
      400,
      {
        error: "VALIDATION_ERROR",
        details: {
          name: ["Informe o nome."],
          amount: ["Expected number, received string"],
        },
      },
      /Informe o nome/,
    ],
  ])(
    "normaliza resposta %s sem expor detalhes técnicos",
    async (status, problem, message) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(JSON.stringify(problem), { status })),
      );
      await expect(apiClient("/purchases")).rejects.toMatchObject({
        status,
        message: expect.stringMatching(message),
      });
    },
  );

  it("orienta sobre conexão quando o transporte falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiClient("/purchases")).rejects.toThrow(/internet/i);
  });

  it("trata resposta de sucesso inválida sem vazar o parser", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>proxy</html>")));
    await expect(apiClient("/purchases")).rejects.toThrow(/confirmar/i);
  });

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
