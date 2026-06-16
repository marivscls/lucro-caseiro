import { describe, expect, it } from "vitest";

import {
  getPasswordStrength,
  validateEmail,
  validateName,
  validatePassword,
} from "./validation";

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
  it("aceita senha forte com todos os requisitos", () => {
    expect(validatePassword("Senha123")).toEqual({ valid: true, errors: [] });
  });

  it("exige senha nao vazia", () => {
    const r = validatePassword("");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Senha é obrigatória");
  });

  it("acumula os erros que faltam", () => {
    const r = validatePassword("abc");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Mínimo 8 caracteres");
    expect(r.errors).toContain("Pelo menos 1 letra maiuscula");
    expect(r.errors).toContain("Pelo menos 1 número");
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

describe("getPasswordStrength", () => {
  it("classifica como fraca quando curta", () => {
    expect(getPasswordStrength("abc")).toBe("weak");
    expect(getPasswordStrength("")).toBe("weak");
  });

  it("classifica como media com requisitos parciais", () => {
    expect(getPasswordStrength("Senha123")).toBe("medium");
  });

  it("classifica como forte com tamanho e variedade", () => {
    expect(getPasswordStrength("SenhaForte123!")).toBe("strong");
  });
});
