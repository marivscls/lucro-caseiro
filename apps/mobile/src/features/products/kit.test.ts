import { describe, expect, it } from "vitest";

import {
  chipLabel,
  draftsToComponents,
  kitTotalCost,
  validateProductDraft,
  type ComponentDraft,
  type ProductDraftInput,
} from "./kit";

describe("draftsToComponents", () => {
  it("converte rascunhos validos em payload do contrato", () => {
    const drafts: ComponentDraft[] = [
      { componentProductId: "a", quantity: "2" },
      { componentProductId: "b", quantity: "1,5" },
    ];
    expect(draftsToComponents(drafts)).toEqual([
      { componentProductId: "a", quantity: 2 },
      { componentProductId: "b", quantity: 1.5 },
    ]);
  });

  it("descarta quantidade invalida, zero ou negativa", () => {
    const drafts: ComponentDraft[] = [
      { componentProductId: "a", quantity: "0" },
      { componentProductId: "b", quantity: "-3" },
      { componentProductId: "c", quantity: "abc" },
      { componentProductId: "d", quantity: "" },
      { componentProductId: "e", quantity: "1" },
    ];
    expect(draftsToComponents(drafts)).toEqual([
      { componentProductId: "e", quantity: 1 },
    ]);
  });
});

describe("kitTotalCost", () => {
  const cost: Record<string, number | null> = { a: 2, b: 1.5, semCusto: null };
  const costOf = (id: string) => cost[id];

  it("soma custo x quantidade dos componentes", () => {
    const drafts: ComponentDraft[] = [
      { componentProductId: "a", quantity: "3" }, // 6
      { componentProductId: "b", quantity: "2" }, // 3
    ];
    expect(kitTotalCost(drafts, costOf)).toBe(9);
  });

  it("trata custo null/desconhecido como 0 (espelha o backend)", () => {
    const drafts: ComponentDraft[] = [
      { componentProductId: "semCusto", quantity: "5" },
      { componentProductId: "desconhecido", quantity: "2" },
      { componentProductId: "a", quantity: "1" }, // 2
    ];
    expect(kitTotalCost(drafts, costOf)).toBe(2);
  });

  it("ignora quantidade invalida e retorna 0 para kit vazio", () => {
    expect(kitTotalCost([], costOf)).toBe(0);
    expect(kitTotalCost([{ componentProductId: "a", quantity: "x" }], costOf)).toBe(0);
  });

  it("aceita quantidade com virgula decimal", () => {
    expect(kitTotalCost([{ componentProductId: "a", quantity: "2,5" }], costOf)).toBe(5);
  });
});

describe("chipLabel", () => {
  it("mostra prefixo Nx quando a quantidade e maior que 1", () => {
    expect(chipLabel("Brigadeiro", "3")).toBe("3x Brigadeiro");
  });

  it("mostra so o nome quando a quantidade e 1 ou invalida", () => {
    expect(chipLabel("Brigadeiro", "1")).toBe("Brigadeiro");
    expect(chipLabel("Brigadeiro", "abc")).toBe("Brigadeiro");
  });
});

describe("validateProductDraft", () => {
  function makeInput(overrides: Partial<ProductDraftInput> = {}): ProductDraftInput {
    return {
      name: "Brigadeiro",
      category: "Doces",
      price: 3.5,
      isComposite: false,
      components: [],
      ...overrides,
    };
  }

  it("retorna null quando o produto simples esta valido", () => {
    expect(validateProductDraft(makeInput())).toBeNull();
  });

  it("exige nome", () => {
    expect(validateProductDraft(makeInput({ name: "   " }))).toBe(
      "Coloque o nome do produto",
    );
  });

  it("exige categoria", () => {
    expect(validateProductDraft(makeInput({ category: "" }))).toBe(
      "Escolha uma categoria",
    );
  });

  it("exige preco maior que zero", () => {
    expect(validateProductDraft(makeInput({ price: 0 }))).toBe(
      "O preço precisa ser maior que zero",
    );
    expect(validateProductDraft(makeInput({ price: NaN }))).toBe(
      "O preço precisa ser maior que zero",
    );
  });

  it("exige ao menos um componente valido quando kit", () => {
    expect(
      validateProductDraft(
        makeInput({
          isComposite: true,
          components: [{ componentProductId: "a", quantity: "0" }],
        }),
      ),
    ).toBe("Escolha pelo menos um produto para montar o kit");
  });

  it("aceita kit com componente valido", () => {
    expect(
      validateProductDraft(
        makeInput({
          isComposite: true,
          components: [{ componentProductId: "a", quantity: "2" }],
        }),
      ),
    ).toBeNull();
  });
});
