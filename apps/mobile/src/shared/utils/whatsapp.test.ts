import { describe, expect, it } from "vitest";

import { normalizePhone } from "./whatsapp";

describe("normalizePhone", () => {
  it("adds DDI 55 to a national mobile (11 digits)", () => {
    expect(normalizePhone("(11) 98765-4321")).toBe("5511987654321");
  });

  it("adds DDI 55 to a national landline (10 digits)", () => {
    expect(normalizePhone("11 3333-4444")).toBe("551133334444");
  });

  it("keeps the number when it already has the DDI (13 digits)", () => {
    expect(normalizePhone("+55 11 98765-4321")).toBe("5511987654321");
  });

  it("handles DDD 55 (Santa Maria/RS) without dropping the DDI", () => {
    // (55) 99999-9999 → nacional de 11 dígitos → ganha o DDI 55 na frente
    expect(normalizePhone("(55) 99999-9999")).toBe("5555999999999");
  });
});
