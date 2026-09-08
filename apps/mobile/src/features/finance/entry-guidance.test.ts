import { describe, expect, it } from "vitest";
import { compatibleEntryCategory } from "./entry-guidance";
describe("categorias de um novo lançamento", () => {
  it("limpa material ao trocar para entrada e venda ao trocar para despesa", () => {
    expect(compatibleEntryCategory("income", "material")).toBe("");
    expect(compatibleEntryCategory("expense", "sale")).toBe("");
  });
  it("preserva categoria compartilhada e não supõe venda numa entrada vazia", () => {
    expect(compatibleEntryCategory("income", "other")).toBe("other");
    expect(compatibleEntryCategory("expense", "other")).toBe("other");
    expect(compatibleEntryCategory("income", "")).toBe("");
  });
});
