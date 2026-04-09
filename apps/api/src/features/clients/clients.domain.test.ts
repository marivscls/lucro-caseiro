import { describe, expect, it } from "vitest";

import {
  formatPhoneForWhatsApp,
  isUpcomingBirthday,
  validateClientData,
} from "./clients.domain";
import type { CreateClientData } from "./clients.types";

function makeClientData(overrides: Partial<CreateClientData> = {}): CreateClientData {
  return {
    name: "Maria Silva",
    phone: "11999887766",
    ...overrides,
  };
}

describe("validateClientData", () => {
  it("returns empty array for valid data", () => {
    const errors = validateClientData(makeClientData());
    expect(errors).toEqual([]);
  });

  it("rejects empty name", () => {
    const errors = validateClientData(makeClientData({ name: "   " }));
    expect(errors).toContain("Nome do cliente e obrigatorio");
  });

  it("rejects name over 200 chars", () => {
    const errors = validateClientData(makeClientData({ name: "a".repeat(201) }));
    expect(errors).toContain("Nome do cliente deve ter no maximo 200 caracteres");
  });

  it("rejects phone with less than 8 digits", () => {
    const errors = validateClientData(makeClientData({ phone: "1234567" }));
    expect(errors).toContain("Telefone deve ter entre 8 e 15 digitos");
  });

  it("rejects phone with more than 15 digits", () => {
    const errors = validateClientData(makeClientData({ phone: "1".repeat(16) }));
    expect(errors).toContain("Telefone deve ter entre 8 e 15 digitos");
  });

  it("accepts phone with formatting characters", () => {
    const errors = validateClientData(makeClientData({ phone: "(11) 99988-7766" }));
    expect(errors).toEqual([]);
  });

  it("accepts data without phone", () => {
    const errors = validateClientData(makeClientData({ phone: undefined }));
    expect(errors).toEqual([]);
  });

  it("accumulates multiple errors", () => {
    const errors = validateClientData(makeClientData({ name: "", phone: "123" }));
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("isUpcomingBirthday", () => {
  it("returns false when birthday is null", () => {
    expect(isUpcomingBirthday(null)).toBe(false);
  });

  it("returns true when birthday is today", () => {
    const today = new Date(2026, 2, 15); // March 15
    expect(isUpcomingBirthday("1990-03-15", today)).toBe(true);
  });

  it("returns true when birthday is within 7 days", () => {
    const today = new Date(2026, 2, 15); // March 15
    expect(isUpcomingBirthday("1990-03-22", today)).toBe(true);
  });

  it("returns false when birthday is more than 7 days away", () => {
    const today = new Date(2026, 2, 15); // March 15
    expect(isUpcomingBirthday("1990-03-23", today)).toBe(false);
  });

  it("returns false when birthday is in a different month", () => {
    const today = new Date(2026, 2, 15); // March 15
    expect(isUpcomingBirthday("1990-04-15", today)).toBe(false);
  });

  it("returns false when birthday already passed this month", () => {
    const today = new Date(2026, 2, 15); // March 15
    expect(isUpcomingBirthday("1990-03-10", today)).toBe(false);
  });
});

describe("formatPhoneForWhatsApp", () => {
  it("returns null when phone is null", () => {
    expect(formatPhoneForWhatsApp(null)).toBeNull();
  });

  it("returns null when phone has no digits", () => {
    expect(formatPhoneForWhatsApp("")).toBeNull();
  });

  it("adds 55 prefix to phone without country code", () => {
    expect(formatPhoneForWhatsApp("11999887766")).toBe("5511999887766");
  });

  it("keeps phone that already has 55 prefix", () => {
    expect(formatPhoneForWhatsApp("5511999887766")).toBe("5511999887766");
  });

  it("strips non-digit characters", () => {
    expect(formatPhoneForWhatsApp("(11) 99988-7766")).toBe("5511999887766");
  });
});
