import { describe, expect, it } from "vitest";

import { isValidSlug, renderCatalogHtml, slugify } from "./catalog.domain";

describe("slugify", () => {
  it("converte nome do negocio em slug com acentos removidos", () => {
    expect(slugify("Doces da Má")).toBe("doces-da-ma");
  });

  it("remove caracteres especiais e espacos duplicados", () => {
    expect(slugify("  Bolos & Cia!  ")).toBe("bolos-cia");
  });

  it("cai no fallback quando o nome nao gera slug valido", () => {
    expect(slugify("!!!")).toBe("meu-catalogo");
  });

  it("limita o tamanho a 40 caracteres", () => {
    expect(slugify("a".repeat(60)).length).toBeLessThanOrEqual(40);
  });
});

describe("isValidSlug", () => {
  it("aceita minusculas, numeros e hifens", () => {
    expect(isValidSlug("doces-da-maria-2")).toBe(true);
  });

  it("rejeita maiusculas, espacos e hifens nas pontas", () => {
    expect(isValidSlug("Doces")).toBe(false);
    expect(isValidSlug("doces da maria")).toBe(false);
    expect(isValidSlug("-doces")).toBe(false);
    expect(isValidSlug("doces-")).toBe(false);
  });

  it("exige pelo menos 1 caractere e no maximo 40", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("a".repeat(41))).toBe(false);
  });
});

describe("renderCatalogHtml", () => {
  const product = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Bolo de Pote",
    description: "Chocolate com morango",
    photoUrl: null,
    salePrice: 12.5,
    saleUnit: "unit",
  };

  it("renderiza nome do negocio, produto e preco formatado", () => {
    const html = renderCatalogHtml({
      businessName: "Doces da Maria",
      whatsapp: "11999998888",
      products: [product],
    });
    expect(html).toContain("Doces da Maria");
    expect(html).toContain("Bolo de Pote");
    expect(html).toContain("R$ 12,50");
    expect(html).toContain("https://wa.me/5511999998888");
  });

  it("mostra sufixo /kg para produtos por peso", () => {
    const html = renderCatalogHtml({
      businessName: "Doces",
      whatsapp: null,
      products: [{ ...product, saleUnit: "kg", salePrice: 45 }],
    });
    expect(html).toContain("R$ 45,00");
    expect(html).toContain(">/kg</span>");
  });

  it("escapa HTML em campos do usuario", () => {
    const html = renderCatalogHtml({
      businessName: "<script>alert(1)</script>",
      whatsapp: null,
      products: [],
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("sem whatsapp, nao renderiza botao de pedido", () => {
    const html = renderCatalogHtml({
      businessName: "Doces",
      whatsapp: null,
      products: [product],
    });
    expect(html).not.toContain("wa.me");
  });

  it("sem produtos, mostra estado vazio", () => {
    const html = renderCatalogHtml({
      businessName: "Doces",
      whatsapp: null,
      products: [],
    });
    expect(html).toContain("Nenhum produto disponível no momento.");
  });
});
