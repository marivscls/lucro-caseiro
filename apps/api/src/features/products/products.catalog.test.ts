import { describe, expect, it, vi } from "vitest";

import { CosmosProductCatalog } from "./products.catalog";

describe("CosmosProductCatalog", () => {
  it("mapeia um GTIN encontrado para sugestao de cadastro", async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          description: "CADERNO UNIVERSITARIO 10 MATERIAS",
          gtin: 7891234567890,
          thumbnail: "https://example.com/caderno.jpg",
          brand: { name: "Marca" },
          gpc: { description: "Papelaria" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const catalog = new CosmosProductCatalog(
      "token",
      "lucro-caseiro/test",
      request as typeof fetch,
    );

    await expect(catalog.lookupByCode("7891234567890")).resolves.toEqual({
      code: "7891234567890",
      name: "CADERNO UNIVERSITARIO 10 MATERIAS",
      category: "Papelaria",
      photoUrl: "https://example.com/caderno.jpg",
      brand: "Marca",
      source: "cosmos",
    });
  });

  it("nao consulta catalogo externo sem credenciais ou para codigo interno", async () => {
    const request = vi.fn();
    const catalog = new CosmosProductCatalog("", "", request as typeof fetch);

    await expect(catalog.lookupByCode("LC-ABC123")).resolves.toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it("trata produto ausente como consulta sem sugestao", async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    const catalog = new CosmosProductCatalog(
      "token",
      "lucro-caseiro/test",
      request as typeof fetch,
    );

    await expect(catalog.lookupByCode("7891234567890")).resolves.toBeNull();
  });
});
