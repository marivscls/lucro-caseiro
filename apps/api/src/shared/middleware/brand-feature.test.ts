import type { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import { requireBrandFeature } from "./brand-feature";
import { errorHandler } from "./error-handler";

describe("recurso indisponível", () => {
  it("devolve código estável sem expor identificadores de configuração", () => {
    let body: unknown;
    let status: number | undefined;
    const req = { header: () => "lucro-caseiro" } as unknown as Request;
    const res = {
      status: (value: number) => {
        status = value;
        return res;
      },
      json: (value: unknown) => {
        body = value;
      },
    } as unknown as Response;
    requireBrandFeature("comprasComEstoque")(req, res, (error) =>
      errorHandler(error, req, res, () => {}),
    );
    expect(status).toBe(403);
    expect(body).toMatchObject({
      error: "FEATURE_UNAVAILABLE",
      message: expect.stringMatching(/disponível/),
    });
    expect(JSON.stringify(body)).not.toContain("comprasComEstoque");
  });
});
