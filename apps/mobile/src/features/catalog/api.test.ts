import { afterEach, describe, expect, it, vi } from "vitest";

import { publicCatalogProductUrl } from "./api";

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
