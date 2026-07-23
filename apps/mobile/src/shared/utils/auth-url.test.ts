import { describe, expect, it } from "vitest";

import { withoutAuthParams } from "./auth-url";

describe("withoutAuthParams", () => {
  it("remove tokens do hash e preserva parametros seguros", () => {
    expect(
      withoutAuthParams(
        "https://app.lucrocaseiro.com.br/?origem=convite#access_token=segredo&refresh_token=renovacao&type=signup",
      ),
    ).toBe("https://app.lucrocaseiro.com.br/?origem=convite");
  });

  it("remove code e erros do callback sem apagar a rota", () => {
    expect(
      withoutAuthParams(
        "https://app.lucrocaseiro.com.br/auth/callback?code=segredo&produto=123#error_description=falhou",
      ),
    ).toBe("https://app.lucrocaseiro.com.br/auth/callback?produto=123");
  });

  it("nao altera uma URL comum do aplicativo", () => {
    const url = "https://app.lucrocaseiro.com.br/pricing?modo=simples#resultado";
    expect(withoutAuthParams(url)).toBe(url);
  });
});
