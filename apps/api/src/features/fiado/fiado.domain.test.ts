import {
  buildPixPayload,
  normalizePixKey,
  pixCrc16,
  pixForCharge,
} from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  isFiadoToken,
  newFiadoToken,
  preparePixSettings,
  statementTotals,
} from "./fiado.domain";

describe("Pix copia e cola", () => {
  it("calcula o CRC do exemplo oficial do Banco Central", () => {
    const payload =
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304";
    expect(pixCrc16(payload)).toBe("1D3D");
  });

  it("monta o código do exemplo oficial sem valor", () => {
    expect(
      buildPixPayload({
        key: "123e4567-e12b-12d1-a456-426655440000",
        receiverName: "Fulano de Tal",
        city: "BRASILIA",
      }),
    ).toBe(
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D",
    );
  });

  it("embute o valor com duas casas e tira acentos do nome e da cidade", () => {
    const code = buildPixPayload({
      key: "+5511987654321",
      receiverName: "Doces da Célia Conceição Ltda",
      city: "São José dos Campos",
      amount: 75,
      txid: "FIADO",
    });
    expect(code).toContain("540575.00");
    expect(code).toContain("5924Doces da Celia Conceicao6015");
    expect(code).toContain("6015Sao Jose dos Ca");
    expect(code).toContain("62090505FIADO");
    expect(code.slice(-4)).toBe(pixCrc16(code.slice(0, -4)));
  });

  it("normaliza cada tipo de chave e recusa as inválidas", () => {
    expect(normalizePixKey("cpf_cnpj", "529.982.247-25")).toBe("52998224725");
    expect(normalizePixKey("cpf_cnpj", "111.111.111-11")).toBeNull();
    expect(normalizePixKey("cpf_cnpj", "11.222.333/0001-81")).toBe("11222333000181");
    expect(normalizePixKey("phone", "(11) 98765-4321")).toBe("+5511987654321");
    expect(normalizePixKey("phone", "+55 11 98765-4321")).toBe("+5511987654321");
    expect(normalizePixKey("phone", "123")).toBeNull();
    expect(normalizePixKey("email", " Celia@Doces.com ")).toBe("celia@doces.com");
    expect(normalizePixKey("email", "celia")).toBeNull();
    expect(normalizePixKey("random", "123E4567-E12B-12D1-A456-426655440000")).toBe(
      "123e4567-e12b-12d1-a456-426655440000",
    );
  });

  it("só gera Pix de cobrança quando a chave está cadastrada e válida", () => {
    expect(pixForCharge(null, "Célia", 10)).toBeNull();
    expect(
      pixForCharge({ pixKeyType: "email", pixKey: "x", pixCity: null }, "Célia", 10),
    ).toBeNull();
    expect(
      pixForCharge(
        { pixKeyType: "email", pixKey: "celia@doces.com", pixCity: null },
        "Célia",
        10,
      ),
    ).toContain("br.gov.bcb.pix0115celia@doces.com");
  });
});

describe("preparePixSettings", () => {
  it("apaga o Pix quando a chave vem vazia", () => {
    expect(preparePixSettings({ pixKeyType: "email", pixKey: "  " })).toEqual({
      ok: true,
      value: { pixKeyType: null, pixKey: null, pixCity: null },
    });
  });

  it("explica o erro em português quando a chave não confere", () => {
    const result = preparePixSettings({ pixKeyType: "phone", pixKey: "999" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("DDD");
  });

  it("grava a chave normalizada e a cidade", () => {
    expect(
      preparePixSettings({
        pixKeyType: "cpf_cnpj",
        pixKey: "529.982.247-25",
        pixCity: " Recife ",
      }),
    ).toEqual({
      ok: true,
      value: { pixKeyType: "cpf_cnpj", pixKey: "52998224725", pixCity: "Recife" },
    });
  });
});

describe("statementTotals", () => {
  it("soma só o que falta pagar de cada compra", () => {
    expect(
      statementTotals([
        { total: 45, paidAmount: 0 },
        { total: 30, paidAmount: 10 },
        { total: 20, paidAmount: 25 },
      ]),
    ).toEqual({ open: [45, 20, 0], total: 65 });
  });
});

describe("token do extrato", () => {
  it("gera tokens de 16 caracteres seguros para URL", () => {
    const token = newFiadoToken();
    expect(isFiadoToken(token)).toBe(true);
    expect(newFiadoToken()).not.toBe(token);
    expect(isFiadoToken("../../etc")).toBe(false);
  });
});
