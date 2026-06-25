import { describe, expect, it } from "vitest";
import type { Packaging } from "@lucro-caseiro/contracts";

import {
  PACKAGING_TYPES,
  buildPackagingShareText,
  totalStockCost,
  typeEmoji,
  typeLabel,
} from "./domain";

function makePackaging(overrides: Partial<Packaging> = {}): Packaging {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    userId: "22222222-2222-2222-2222-222222222222",
    name: "Caixa Kraft P",
    type: "box",
    unitCost: 20,
    supplier: null,
    supplierId: null,
    photoUrl: null,
    createdAt: "2026-05-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("typeLabel", () => {
  it("mapeia valores conhecidos para rótulos em português", () => {
    expect(typeLabel("box")).toBe("Caixa");
    expect(typeLabel("bag")).toBe("Sacola");
    expect(typeLabel("pot")).toBe("Pote");
    expect(typeLabel("film")).toBe("Filme");
    expect(typeLabel("label")).toBe("Rótulo");
    expect(typeLabel("other")).toBe("Outro");
  });

  it("devolve o próprio valor quando o tipo é desconhecido", () => {
    expect(typeLabel("unknown")).toBe("unknown");
  });

  it("cobre todos os tipos definidos em PACKAGING_TYPES", () => {
    for (const t of PACKAGING_TYPES) {
      expect(typeLabel(t.value)).toBe(t.label);
    }
  });
});

describe("typeEmoji", () => {
  it("retorna um emoji por tipo conhecido", () => {
    expect(typeEmoji("box")).toBe("📦");
    expect(typeEmoji("bag")).toBe("🛍️");
    expect(typeEmoji("label")).toBe("🏷️");
  });

  it("usa caixa como fallback para tipos desconhecidos", () => {
    expect(typeEmoji("xpto")).toBe("📦");
  });
});

describe("totalStockCost", () => {
  it("soma o custo unitário de todas as embalagens", () => {
    const items = [
      makePackaging({ unitCost: 20 }),
      makePackaging({ unitCost: 1.5 }),
      makePackaging({ unitCost: 0.85 }),
    ];
    expect(totalStockCost(items)).toBeCloseTo(22.35, 2);
  });

  it("é zero quando não há embalagens", () => {
    expect(totalStockCost([])).toBe(0);
  });
});

describe("buildPackagingShareText", () => {
  it("inclui nome, tipo e custo", () => {
    const text = buildPackagingShareText(makePackaging());
    expect(text).toContain("Caixa Kraft P");
    expect(text).toContain("Caixa");
    expect(text).toContain("R$");
  });

  it("inclui o fornecedor quando presente", () => {
    const text = buildPackagingShareText(
      makePackaging({ supplier: "Embalagens Brasil" }),
    );
    expect(text).toContain("Embalagens Brasil");
  });

  it("omite a linha de fornecedor quando ausente", () => {
    const text = buildPackagingShareText(makePackaging({ supplier: null }));
    expect(text).not.toContain("Fornecedor:");
  });
});
