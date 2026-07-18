import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "../../shared/errors";
import { requireBrandFeature } from "../../shared/middleware/brand-feature";

function runGuard(brand: string | undefined): unknown {
  const guard = requireBrandFeature("catalogoCores");
  const next = vi.fn() as unknown as NextFunction;
  const req = {
    header: (name: string) => (name === "x-brand" ? brand : undefined),
  } as Request;
  guard(req, {} as Response, next);
  return (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
}

describe("requireBrandFeature", () => {
  it("allows a variation-enabled brand", () => {
    expect(runGuard("lucro-papelaria")).toBeUndefined();
  });

  it("rejects variations when the active brand disables them", () => {
    expect(runGuard("lucro-caseiro")).toBeInstanceOf(ForbiddenError);
  });
});
