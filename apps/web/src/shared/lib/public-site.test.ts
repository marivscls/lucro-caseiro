import { describe, expect, it } from "vitest";

import { isPublicSitePage } from "./public-site";

describe("isPublicSitePage", () => {
  it("reconhece a home pública e as páginas da landing", () => {
    expect(isPublicSitePage("lucrocaseiro.com.br", "/")).toBe(true);
    expect(isPublicSitePage("localhost", "/landing/guias/x")).toBe(true);
  });

  it("mantém a Central de Marketing fora do site público", () => {
    expect(isPublicSitePage("central.example.com", "/")).toBe(false);
    expect(isPublicSitePage("lucrocaseiro.com.br", "/login")).toBe(false);
  });
});
