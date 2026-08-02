import { afterEach, describe, expect, it, vi } from "vitest";

import { publicCatalogProductUrl, publicCatalogSectionUrl } from "./api";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("publicCatalogProductUrl", () => {
  it("aponta para o produto dentro do catalogo da pessoa", () => {
    vi.stubEnv("EXPO_PUBLIC_CATALOG_URL", "https://catalogo.lucrocaseiro.com.br");

    expect(publicCatalogProductUrl("doces-da-maria", "produto-123")).toBe(
      "https://catalogo.lucrocaseiro.com.br/c/doces-da-maria?produto=produto-123#produto-produto-123",
    );
  });
});

describe("publicCatalogSectionUrl", () => {
  it("gera links separados para produtos e serviços", () => {
    vi.stubEnv("EXPO_PUBLIC_CATALOG_URL", "https://catalogo.lucrocaseiro.com.br");

    expect(publicCatalogSectionUrl("atelie", "produtos")).toBe(
      "https://catalogo.lucrocaseiro.com.br/c/atelie?tipo=produtos",
    );
    expect(publicCatalogSectionUrl("atelie", "servicos")).toBe(
      "https://catalogo.lucrocaseiro.com.br/c/atelie?tipo=servicos",
    );
  });
});
