import { describe, expect, it } from "vitest";

import {
  categoryLabel,
  entryCountLabel,
  entryDisplayDescription,
  formatEntryDate,
} from "./entry-display";

describe("textos dos lançamentos", () => {
  it("conta lançamentos sem escrever zero", () => {
    expect(entryCountLabel(0)).toBe("Nenhum lançamento");
    expect(entryCountLabel(1)).toBe("1 lançamento");
    expect(entryCountLabel(80)).toBe("80 lançamentos");
  });

  it("usa o nome do insumo e da embalagem do negócio", () => {
    expect(categoryLabel("material", "insumo", "caixa")).toBe("Insumo");
    expect(categoryLabel("packaging", "insumo", "caixa")).toBe("Caixa");
    expect(categoryLabel("sale")).toBe("Venda");
    expect(categoryLabel("desconhecida")).toBe("desconhecida");
  });

  it("tira prefixos técnicos e cai no tipo quando a descrição fica vazia", () => {
    expect(
      entryDisplayDescription({ description: "Compra: Farinha", date: "" }, false),
    ).toBe("Farinha");
    expect(
      entryDisplayDescription({ description: "[auto] Aluguel", date: "" }, false),
    ).toBe("Aluguel");
    expect(entryDisplayDescription({ description: "  ", date: "" }, true)).toBe(
      "Entrada",
    );
  });

  it("formata a data como dia/mês", () => {
    expect(formatEntryDate("2026-09-05T12:00:00")).toBe("05/09");
    expect(formatEntryDate("sem data")).toBe("sem data");
  });
});
