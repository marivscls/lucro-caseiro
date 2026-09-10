import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { ServiceUnavailableError } from "../errors";
import { isAllowedCorsOrigin, productionCorsOrigins } from "./cors";
import { errorHandler } from "./error-handler";
import { postgresRateLimit } from "./postgres-rate-limit";
import { securityHeaders } from "./security-headers";

function responseMock() {
  const response = {
    set: vi.fn(),
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

describe("security middleware", () => {
  it("permite o preflight do PWA local contra a API de producao", () => {
    expect(
      isAllowedCorsOrigin("http://localhost:8083", ["https://app.lucrocaseiro.com.br"]),
    ).toBe(true);
    expect(isAllowedCorsOrigin("http://127.0.0.1:8085", [])).toBe(true);
    expect(isAllowedCorsOrigin("https://malicioso.example", [])).toBe(false);
  });

  it("permite os dominios oficiais e gerados pela Railway", () => {
    expect(
      isAllowedCorsOrigin(
        "https://lucro-caseiromobile-production.up.railway.app",
        productionCorsOrigins,
      ),
    ).toBe(true);
    expect(
      isAllowedCorsOrigin(
        "https://lucro-caseiroweb-production.up.railway.app",
        productionCorsOrigins,
      ),
    ).toBe(true);
    expect(
      isAllowedCorsOrigin(
        "https://outro-app-production.up.railway.app",
        productionCorsOrigins,
      ),
    ).toBe(false);
  });

  it("envia headers defensivos nas respostas da API", () => {
    const response = responseMock();
    const next = vi.fn();
    securityHeaders({} as Request, response as unknown as Response, next);

    expect(response.set).toHaveBeenCalledWith(
      expect.objectContaining({
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      }),
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("bloqueia acima da quota e não persiste o bearer token", async () => {
    const increment = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const middleware = postgresRateLimit({
      store: { increment, cleanup: vi.fn() },
      scope: "billing",
      windowMs: 60_000,
      max: 1,
    });
    const request = {
      ip: "127.0.0.1",
      header: (name: string) =>
        name === "authorization" ? "Bearer secret-token" : undefined,
    } as Request;
    const firstResponse = responseMock();
    const secondResponse = responseMock();
    const next = vi.fn() as unknown as NextFunction;

    await middleware(request, firstResponse as unknown as Response, next);
    await middleware(request, secondResponse as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(secondResponse.status).toHaveBeenCalledWith(429);
    expect(secondResponse.setHeader).toHaveBeenCalledWith(
      "Retry-After",
      expect.any(String),
    );
    expect(JSON.stringify(increment.mock.calls)).not.toContain("secret-token");
  });

  it("falha fechado quando o armazenamento compartilhado cai", async () => {
    const middleware = postgresRateLimit({
      store: {
        increment: vi.fn().mockRejectedValue(new Error("db offline")),
        cleanup: vi.fn(),
      },
      scope: "billing",
      windowMs: 60_000,
      max: 1,
    });
    const next = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await middleware(
      { ip: "127.0.0.1", header: () => undefined } as unknown as Request,
      responseMock() as unknown as Response,
      next,
    );

    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(ServiceUnavailableError);
    consoleError.mockRestore();
  });

  it("mantém a quota pública ao alternar cabeçalhos Authorization não validados", async () => {
    const buckets = new Map<string, number>();
    const middleware = postgresRateLimit({
      store: {
        increment: ({ keyHash }) => {
          const count = (buckets.get(keyHash) ?? 0) + 1;
          buckets.set(keyHash, count);
          return Promise.resolve(count);
        },
        cleanup: vi.fn(),
      },
      scope: "public-write",
      windowMs: 60_000,
      max: 1,
    });
    const next = vi.fn();
    for (const authorization of [undefined, "Bearer forged-a", "Bearer forged-b"]) {
      const response = responseMock();
      await middleware(
        { ip: "192.0.2.1", header: () => authorization } as unknown as Request,
        response as unknown as Response,
        next,
      );
      if (authorization) expect(response.status).toHaveBeenCalledWith(429);
    }
    expect(next).toHaveBeenCalledOnce();
  });

  it("mantém a quota por usuário validado após renovação do token ou mudança de IP", async () => {
    const buckets = new Map<string, number>();
    const middleware = postgresRateLimit({
      store: {
        increment: ({ keyHash }) => {
          const count = (buckets.get(keyHash) ?? 0) + 1;
          buckets.set(keyHash, count);
          return Promise.resolve(count);
        },
        cleanup: vi.fn(),
      },
      scope: "billing",
      windowMs: 60_000,
      max: 1,
    });
    const next = vi.fn();
    const first = responseMock();
    const second = responseMock();
    const otherUser = responseMock();
    await middleware(
      {
        userId: "verified-user",
        ip: "192.0.2.1",
        header: () => "Bearer original",
      } as unknown as Request,
      first as unknown as Response,
      next,
    );
    await middleware(
      {
        userId: "verified-user",
        ip: "192.0.2.2",
        header: () => "Bearer refreshed",
      } as unknown as Request,
      second as unknown as Response,
      next,
    );
    await middleware(
      {
        userId: "another-user",
        ip: "192.0.2.1",
        header: () => "Bearer other",
      } as unknown as Request,
      otherUser as unknown as Response,
      next,
    );
    expect(second.status).toHaveBeenCalledWith(429);
    expect(otherUser.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(2);
  });

  it("traduz payload acima do teto para 413", () => {
    const response = responseMock();
    const error = Object.assign(new Error("too large"), { type: "entity.too.large" });

    errorHandler(
      error,
      {} as Request,
      response as unknown as Response,
      vi.fn() as unknown as NextFunction,
    );

    expect(response.status).toHaveBeenCalledWith(413);
  });
});
