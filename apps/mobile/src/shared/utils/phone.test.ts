import { describe, expect, it } from "vitest";

import { isValidBrazilPhone, maskPhoneBR } from "./phone";

describe("maskPhoneBR", () => {
  it("formats a mobile number progressively", () => {
    expect(maskPhoneBR("11")).toBe("(11");
    expect(maskPhoneBR("1199")).toBe("(11) 99");
    expect(maskPhoneBR("11987654321")).toBe("(11) 98765-4321");
  });
  it("formats a landline (10 digits) as 4+4", () => {
    expect(maskPhoneBR("1133334444")).toBe("(11) 3333-4444");
  });
  it("ignores non-digits and extra length", () => {
    expect(maskPhoneBR("(11) 98765-43219999")).toBe("(11) 98765-4321");
  });
});

describe("isValidBrazilPhone", () => {
  it("accepts national mobile/landline", () => {
    expect(isValidBrazilPhone("(11) 98765-4321")).toBe(true);
    expect(isValidBrazilPhone("11 3333-4444")).toBe(true);
  });
  it("accepts numbers already with DDI 55", () => {
    expect(isValidBrazilPhone("+55 11 98765-4321")).toBe(true);
  });
  it("rejects too short or empty", () => {
    expect(isValidBrazilPhone("999")).toBe(false);
    expect(isValidBrazilPhone("")).toBe(false);
  });
});
