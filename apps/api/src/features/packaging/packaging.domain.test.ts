import { describe, expect, it } from "vitest";

import { validatePackagingData } from "./packaging.domain";
import type { CreatePackagingData } from "./packaging.types";

function makePackagingData(
  overrides: Partial<CreatePackagingData> = {},
): CreatePackagingData {
  return {
    name: "Caixa Kraft",
    type: "box",
    unitCost: 1.5,
    ...overrides,
  };
}

describe("validatePackagingData", () => {
  it("returns empty array for valid data", () => {
    const errors = validatePackagingData(makePackagingData());
    expect(errors).toEqual([]);
  });

  it("rejects empty name", () => {
    const errors = validatePackagingData(makePackagingData({ name: "   " }));
    expect(errors).toContain("Nome da embalagem e obrigatorio");
  });

  it("rejects name over 200 chars", () => {
    const errors = validatePackagingData(makePackagingData({ name: "a".repeat(201) }));
    expect(errors).toContain("Nome da embalagem deve ter no maximo 200 caracteres");
  });

  it("rejects zero unit cost", () => {
    const errors = validatePackagingData(makePackagingData({ unitCost: 0 }));
    expect(errors).toContain("Custo unitario deve ser maior que zero");
  });

  it("rejects negative unit cost", () => {
    const errors = validatePackagingData(makePackagingData({ unitCost: -2 }));
    expect(errors).toContain("Custo unitario deve ser maior que zero");
  });

  it("accumulates multiple errors", () => {
    const errors = validatePackagingData(makePackagingData({ name: "", unitCost: -1 }));
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
