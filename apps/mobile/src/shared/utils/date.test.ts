import { describe, expect, it } from "vitest";

import { addDaysToBR, brToIso, isoToBR, maskDateBR } from "./date";

describe("isoToBR", () => {
  it("converts ISO to DD/MM/AAAA", () => {
    expect(isoToBR("2026-06-06")).toBe("06/06/2026");
  });
  it("leaves non-ISO values untouched and empty as ''", () => {
    expect(isoToBR("30/05/2026")).toBe("30/05/2026");
    expect(isoToBR()).toBe("");
    expect(isoToBR(null)).toBe("");
  });
});

describe("brToIso", () => {
  it("converts DD/MM/AAAA to ISO, padding parts", () => {
    expect(brToIso("6/6/2026")).toBe("2026-06-06");
    expect(brToIso("30/05/2026")).toBe("2026-05-30");
  });
  it("returns undefined for empty", () => {
    expect(brToIso("  ")).toBeUndefined();
  });
  it("returns undefined for incomplete or invalid dates", () => {
    expect(brToIso("30/05")).toBeUndefined(); // sem ano
    expect(brToIso("30/05/26")).toBeUndefined(); // ano com 2 dígitos
    expect(brToIso("31/02/2026")).toBeUndefined(); // dia inválido p/ o mês
    expect(brToIso("00/13/2026")).toBeUndefined(); // fora de faixa
  });
});

describe("maskDateBR", () => {
  it("formats digits progressively as DD/MM/AAAA", () => {
    expect(maskDateBR("3")).toBe("3");
    expect(maskDateBR("30")).toBe("30");
    expect(maskDateBR("305")).toBe("30/5");
    expect(maskDateBR("3005")).toBe("30/05");
    expect(maskDateBR("30052026")).toBe("30/05/2026");
  });
  it("ignores extra digits and non-digits", () => {
    expect(maskDateBR("30/05/2026999")).toBe("30/05/2026");
  });
});

describe("addDaysToBR", () => {
  it("adds days across month boundaries", () => {
    expect(addDaysToBR("30/05/2026", 7)).toBe("06/06/2026");
    expect(addDaysToBR("01/01/2026", 0)).toBe("01/01/2026");
  });
  it("returns undefined for incomplete dates", () => {
    expect(addDaysToBR("30/05", 7)).toBeUndefined();
    expect(addDaysToBR("", 7)).toBeUndefined();
  });
});
