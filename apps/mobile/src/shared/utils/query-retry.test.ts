import { describe, expect, it } from "vitest";

import { ApiError } from "./api-client";
import { shouldRetryQuery } from "./query-retry";

describe("shouldRetryQuery", () => {
  it.each([
    ["sem conexão", new ApiError("x", 0, "NETWORK_ERROR")],
    ["tempo esgotado", new ApiError("x", 0, "TIMEOUT")],
    ["erro 503", new ApiError("x", 503)],
  ])("repete leitura em %s", (_label, error) => {
    expect(shouldRetryQuery(0, error)).toBe(true);
  });

  it.each([
    ["erro 400", new ApiError("x", 400, "VALIDATION_ERROR")],
    ["limite do plano", new ApiError("x", 403, "LIMIT_EXCEEDED")],
    ["erro desconhecido", new Error("x")],
  ])("não repete leitura em %s", (_label, error) => {
    expect(shouldRetryQuery(0, error)).toBe(false);
  });

  it("para depois de duas tentativas", () => {
    const error = new ApiError("x", 500);
    expect(shouldRetryQuery(1, error)).toBe(true);
    expect(shouldRetryQuery(2, error)).toBe(false);
  });
});
