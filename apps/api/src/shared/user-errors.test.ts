import { describe, expect, it } from "vitest";

import {
  apiErrorMessage,
  USER_ERROR_MESSAGES,
  userErrorMessage,
} from "@lucro-caseiro/contracts";

describe("public error messages", () => {
  it("rejects oversized messages before classifying library error text", () => {
    const fallback = "Tente novamente depois.";
    const oversized = `${"Recurso ".repeat(4_000)}desativado para esta marca`;
    expect(userErrorMessage(oversized, fallback)).toBe(fallback);
    expect(userErrorMessage(new Error(oversized), fallback)).toBe(fallback);
    expect(apiErrorMessage(400, { message: oversized })).toBe(
      USER_ERROR_MESSAGES.validation,
    );
  });

  it("keeps the existing size boundary for public messages", () => {
    expect(userErrorMessage("a".repeat(600))).toBe("a".repeat(600));
    expect(userErrorMessage("a".repeat(601))).toBe(USER_ERROR_MESSAGES.default);
  });

  it("preserves normal unavailable, network, timeout and validation messages", () => {
    expect(userErrorMessage("Recurso compras desativado para esta marca")).toBe(
      USER_ERROR_MESSAGES.unavailable,
    );
    expect(userErrorMessage(new Error("Failed to fetch"))).toBe(
      USER_ERROR_MESSAGES.network,
    );
    expect(userErrorMessage(new Error("operation was aborted"))).toBe(
      USER_ERROR_MESSAGES.timeout,
    );
    expect(userErrorMessage("Informe o nome do produto.")).toBe(
      "Informe o nome do produto.",
    );
  });
});
