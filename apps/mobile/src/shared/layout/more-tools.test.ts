import { describe, expect, it } from "vitest";

import { FEATURED_MANAGEMENT_ITEMS, MORE_MANAGEMENT_ITEMS } from "./more-tools";

function routesOf(items: ReadonlyArray<{ route: string }>): string[] {
  return items.map((item) => item.route);
}

describe("more-tools", () => {
  it("mostra Precificação e Catálogo no grid visível de Gestão", () => {
    expect(routesOf(FEATURED_MANAGEMENT_ITEMS)).toEqual([
      "/pricing",
      "/catalog",
      "/recurring-expenses",
      "/products",
      "/packaging",
    ]);
  });

  it("nao destaca Embalagens com selo promocional", () => {
    const packaging = FEATURED_MANAGEMENT_ITEMS.find(
      (item) => item.route === "/packaging",
    );
    expect(packaging).not.toHaveProperty("badge");
  });

  it("mantém Insights e Orçamentos no Ver tudo, sem apagar as telas", () => {
    const extra = routesOf(MORE_MANAGEMENT_ITEMS);
    expect(extra).toContain("/insights");
    expect(extra).toContain("/quotes");
    expect(extra).not.toContain("/pricing");
    expect(extra).not.toContain("/catalog");
  });
});
