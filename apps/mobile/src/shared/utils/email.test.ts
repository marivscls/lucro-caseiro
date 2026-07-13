import { describe, expect, it } from "vitest";

import { isValidEmail, suggestEmailFix } from "./email";

describe("isValidEmail", () => {
  it("aceita um e-mail bem formado", () => {
    expect(isValidEmail("maria@exemplo.com")).toBe(true);
  });

  it("rejeita sem @ ou sem dominio", () => {
    expect(isValidEmail("mariaexemplo.com")).toBe(false);
    expect(isValidEmail("maria@")).toBe(false);
    expect(isValidEmail("maria@exemplo")).toBe(false);
  });

  it("rejeita com espacos", () => {
    expect(isValidEmail("maria @exemplo.com")).toBe(false);
  });
});

describe("suggestEmailFix", () => {
  it("corrige o typo classico gmail.comm", () => {
    expect(suggestEmailFix("maria@gmail.comm")).toBe("maria@gmail.com");
  });

  it("corrige troca de caractere no dominio", () => {
    expect(suggestEmailFix("joao@gmail.con")).toBe("joao@gmail.com");
    expect(suggestEmailFix("joao@gmial.com")).toBe("joao@gmail.com");
    expect(suggestEmailFix("joao@hotmial.com")).toBe("joao@hotmail.com");
  });

  it("nao sugere nada quando o dominio ja e conhecido", () => {
    expect(suggestEmailFix("maria@gmail.com")).toBeNull();
    expect(suggestEmailFix("maria@yahoo.com.br")).toBeNull();
  });

  it("nao mexe em dominio proprio (longe dos provedores comuns)", () => {
    expect(suggestEmailFix("contato@docesdamaria.com.br")).toBeNull();
    expect(suggestEmailFix("maria@empresa.io")).toBeNull();
  });

  it("preserva a parte local (antes do @) como digitada", () => {
    expect(suggestEmailFix("Maria.Silva@gmail.comm")).toBe("Maria.Silva@gmail.com");
  });

  it("ignora entrada sem @ ou vazia", () => {
    expect(suggestEmailFix("")).toBeNull();
    expect(suggestEmailFix("mariagmail.com")).toBeNull();
  });
});
