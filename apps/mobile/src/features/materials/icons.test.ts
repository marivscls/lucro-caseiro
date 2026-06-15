import { describe, expect, it } from "vitest";

import { MATERIAL_ICONS } from "./icons";

describe("MATERIAL_ICONS", () => {
  it("não tem emojis duplicados", () => {
    const unique = new Set(MATERIAL_ICONS);
    expect(unique.size).toBe(MATERIAL_ICONS.length);
  });

  it("tem uma quantidade razoável de opções", () => {
    expect(MATERIAL_ICONS.length).toBeGreaterThanOrEqual(24);
  });

  it("contém apenas strings não-vazias", () => {
    for (const icon of MATERIAL_ICONS) {
      expect(typeof icon).toBe("string");
      expect(icon.trim().length).toBeGreaterThan(0);
    }
  });
});
