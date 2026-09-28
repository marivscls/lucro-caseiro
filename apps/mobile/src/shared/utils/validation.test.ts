import { describe, expect, it } from "vitest";

import { validateEmail, validateName, validatePassword } from "./validation";

describe("validateEmail", () => {
  it("aceita um e-mail bem formado", () => {
    expect(validateEmail("maria@exemplo.com")).toEqual({ valid: true, errors: [] });
  });

  it("ignora espacos ao redor", () => {
    expect(validateEmail("  maria@exemplo.com  ").valid).toBe(true);
  });

  it("exige e-mail nao vazio", () => {
    const r = validateEmail("   ");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("E-mail é obrigatório");
  });

  it("recusa formato invalido (sem @ ou sem dominio)", () => {
    expect(validateEmail("mariaexemplo.com").valid).toBe(false);
    expect(validateEmail("maria@exemplo").valid).toBe(false);
    expect(validateEmail("@exemplo.com").valid).toBe(false);
  });
});

describe("validatePassword", () => {
  it("aceita qualquer senha com 8 caracteres ou mais", () => {
    expect(validatePassword("Senha123")).toEqual({ valid: true, errors: [] });
    expect(validatePassword("bolinhos")).toEqual({ valid: true, errors: [] });
  });

  it("exige senha nao vazia", () => {
    const r = validatePassword("");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Senha é obrigatória");
  });

  it("acumula os erros que faltam", () => {
    const r = validatePassword("abc");
    expect(r.valid).toBe(false);
    expect(r.errors).toEqual(["Mínimo 8 caracteres"]);
  });
});

describe("validateName", () => {
  it("aceita um nome valido", () => {
    expect(validateName("Maria")).toEqual({ valid: true, errors: [] });
  });

  it("exige nome nao vazio", () => {
    expect(validateName("   ").errors).toContain("Nome é obrigatório");
  });

  it("exige pelo menos 2 caracteres", () => {
    expect(validateName("M").errors).toContain("Nome deve ter pelo menos 2 caracteres");
  });
});
