import { describe, expect, it } from "vitest";

import { getPasswordUpdateError, getRecoveryLinkError } from "./password-recovery";

describe("callback de recuperação", () => {
  it("explica quando o link expirou", () => {
    expect(
      getRecoveryLinkError(
        "lucrocaseiro://auth/callback?error=access_denied&error_code=otp_expired",
      ),
    ).toContain("expirou");
  });

  it("não acusa erro em callback válido", () => {
    expect(
      getRecoveryLinkError("lucrocaseiro://auth/callback?code=abc&type=recovery"),
    ).toBeNull();
  });
});

describe("erros ao redefinir senha", () => {
  it("traduz senha repetida", () => {
    expect(
      getPasswordUpdateError({ code: "same_password", message: "Same password" }).message,
    ).toBe("A nova senha precisa ser diferente da senha anterior.");
  });

  it("traduz senha fraca", () => {
    expect(
      getPasswordUpdateError({ code: "weak_password", message: "Weak password" }).message,
    ).toContain("letra maiúscula");
  });

  it("não mostra mensagem técnica desconhecida", () => {
    expect(
      getPasswordUpdateError({ message: "Internal auth service failure" }).message,
    ).toBe("Não foi possível alterar a senha. Tente novamente ou peça um novo link.");
  });
});
