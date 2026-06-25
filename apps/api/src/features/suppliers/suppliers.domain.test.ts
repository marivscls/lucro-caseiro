import { describe, expect, it } from "vitest";

import { validateSupplierData } from "./suppliers.domain";
import type { CreateSupplierData } from "./suppliers.types";

function makeData(overrides: Partial<CreateSupplierData> = {}): CreateSupplierData {
  return {
    name: "Atacadão da Festa",
    ...overrides,
  };
}

describe("validateSupplierData", () => {
  it("returns no errors for valid data", () => {
    expect(validateSupplierData(makeData())).toEqual([]);
  });

  it("requires a non-empty name", () => {
    expect(validateSupplierData(makeData({ name: "   " }))).toContain(
      "Nome do fornecedor é obrigatório",
    );
  });

  it("rejects a name longer than 200 chars", () => {
    expect(validateSupplierData(makeData({ name: "a".repeat(201) }))).toContain(
      "Nome do fornecedor deve ter no máximo 200 caracteres",
    );
  });

  it("accepts a valid phone", () => {
    expect(validateSupplierData(makeData({ phone: "11999998888" }))).toEqual([]);
  });

  it("rejects a phone with too few digits", () => {
    expect(validateSupplierData(makeData({ phone: "1199" }))).toContain(
      "Telefone deve ter entre 8 e 15 dígitos",
    );
  });

  it("ignores an empty phone string", () => {
    expect(validateSupplierData(makeData({ phone: "" }))).toEqual([]);
  });

  it("accepts a valid email", () => {
    expect(validateSupplierData(makeData({ email: "contato@atacadao.com" }))).toEqual([]);
  });

  it("rejects an invalid email", () => {
    expect(validateSupplierData(makeData({ email: "contato-arroba" }))).toContain(
      "Email inválido",
    );
  });

  it("ignores an empty email string", () => {
    expect(validateSupplierData(makeData({ email: "" }))).toEqual([]);
  });
});
