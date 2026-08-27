import { describe, expect, it } from "vitest";

import { shouldRedirectToLogin } from "./session-gate";

describe("shouldRedirectToLogin", () => {
  it("não redireciona enquanto a sessão ainda está carregando", () => {
    expect(
      shouldRedirectToLogin({
        isLoading: true,
        isAuthenticated: false,
        rootSegment: "settings",
      }),
    ).toBe(false);
  });

  it("não redireciona quem já está autenticado", () => {
    expect(
      shouldRedirectToLogin({
        isLoading: false,
        isAuthenticated: true,
        rootSegment: "settings",
      }),
    ).toBe(false);
  });

  it("deixa login, cadastro, recuperação e catálogo público no lugar", () => {
    for (const rootSegment of ["", "(auth)", "auth", "reset-password", "c"]) {
      expect(
        shouldRedirectToLogin({
          isLoading: false,
          isAuthenticated: false,
          rootSegment,
        }),
      ).toBe(false);
    }
  });

  it("manda para o login ao sair de telas privadas como Configurações", () => {
    for (const rootSegment of ["settings", "tabs", "onboarding", "products"]) {
      expect(
        shouldRedirectToLogin({
          isLoading: false,
          isAuthenticated: false,
          rootSegment,
        }),
      ).toBe(true);
    }
  });
});
