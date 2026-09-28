import { describe, expect, it } from "vitest";

import {
  chargePix,
  hasPixKey,
  maskedPixKey,
  pixKeyError,
  pixReceiverName,
} from "./domain";

const settings = {
  pixKeyType: "email" as const,
  pixKey: "ana@email.com",
  pixCity: "Recife",
};

describe("pix domain", () => {
  it("usa o nome do negócio e cai para o nome da pessoa", () => {
    expect(pixReceiverName({ businessName: "Ateliê da Ana", name: "Ana" })).toBe(
      "Ateliê da Ana",
    );
    expect(pixReceiverName({ businessName: " ", name: "Ana" })).toBe("Ana");
  });

  it("gera o Pix com o valor e o CRC no fim", () => {
    const code = chargePix(settings, { name: "Ana" }, 42.5);
    expect(code).toContain("540542.50");
    expect(code).toMatch(/6304[0-9A-F]{4}$/);
  });

  it("não gera Pix sem chave ou sem valor", () => {
    expect(chargePix(null, { name: "Ana" }, 10)).toBeNull();
    expect(chargePix(settings, { name: "Ana" }, 0)).toBeNull();
    expect(hasPixKey({ pixKeyType: null, pixKey: null, pixCity: null })).toBe(false);
  });

  it("explica a chave inválida", () => {
    expect(pixKeyError("cpf_cnpj", "111.111.111-11")).toContain("CPF");
    expect(pixKeyError("email", "ana@email.com")).toBeNull();
    expect(pixKeyError("phone", "")).toBe("Digite a sua chave Pix.");
  });

  it("mascara CPF e celular", () => {
    expect(
      maskedPixKey({ pixKeyType: "cpf_cnpj", pixKey: "52998224725", pixCity: null }),
    ).toBe("•••.982.247-••");
    expect(
      maskedPixKey({ pixKeyType: "phone", pixKey: "+5511987654321", pixCity: null }),
    ).toBe("+5511 •••••-4321");
  });
});
