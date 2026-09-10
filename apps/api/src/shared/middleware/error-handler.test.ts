import type { Request, Response } from "express";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { errorHandler } from "./error-handler";

function handle(error: Error) {
  let status: number | undefined;
  let body: unknown;
  const res = {
    status(value: number) {
      status = value;
      return res;
    },
    json(value: unknown) {
      body = value;
    },
  } as unknown as Response;
  errorHandler(error, {} as Request, res, () => {});
  return { status, body };
}

describe("respostas públicas de erro", () => {
  it("trata corpo inválido como validação, sem erro interno", () => {
    const result = handle(
      Object.assign(new SyntaxError("Unexpected token"), { type: "entity.parse.failed" }),
    );
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ error: "VALIDATION_ERROR" });
    expect(JSON.stringify(result.body)).not.toContain("Unexpected token");
  });

  it("preserva validação humana e traduz mensagens do validador", () => {
    const result = z
      .object({ name: z.string().min(1, "Informe o nome."), amount: z.number() })
      .safeParse({ name: "", amount: "abc" });
    if (result.success) throw new Error("A entrada deve ser inválida");
    const response = handle(result.error);
    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toContain("Informe o nome.");
    expect(JSON.stringify(response.body)).not.toContain("Expected number");
  });

  it("inclui validação do formulário inteiro", () => {
    const result = z
      .object({})
      .refine(() => false, "Adicione pelo menos um item.")
      .safeParse({});
    if (result.success) throw new Error("A entrada deve ser inválida");
    expect(JSON.stringify(handle(result.error).body)).toContain(
      "Adicione pelo menos um item.",
    );
  });
});
