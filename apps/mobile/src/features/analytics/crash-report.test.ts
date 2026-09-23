import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  crashErrorName,
  reportAppCrash,
  resetCrashReportsForTests,
} from "./crash-report";
import { setCurrentAnalyticsScreen } from "./screen-tracking";

const mocks = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("./tracker", () => ({ trackAnalyticsAction: mocks.track }));
vi.mock("../../shared/hooks/use-auth", () => ({
  useAuth: { getState: () => ({ token: "sessao" }) },
}));

describe("crashErrorName", () => {
  it("usa só o tipo do erro, nunca a mensagem", () => {
    // Arrange
    const error = new TypeError("Cliente Maria da Silva sem telefone");

    // Act
    const result = crashErrorName(error);

    // Assert
    expect(result).toBe("TypeError");
  });

  it("normaliza nomes estranhos e valores que não são Error", () => {
    // Arrange
    const custom = new Error("x");
    custom.name = "Falha: com espaço!".repeat(5);

    // Act / Assert
    expect(crashErrorName(custom)).toMatch(/^\w{1,40}$/);
    expect(crashErrorName("texto solto")).toBe("string");
    expect(crashErrorName({ message: "segredo" })).toBe("NonErrorObject");
    expect(crashErrorName(null)).toBe("object");
  });
});

describe("reportAppCrash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCrashReportsForTests();
    setCurrentAnalyticsScreen(null);
  });

  it("envia app_crashed com o tipo do erro e a tela em foco", () => {
    // Arrange
    setCurrentAnalyticsScreen("sales");

    // Act
    reportAppCrash(new RangeError("valor R$ 10,00"));

    // Assert
    expect(mocks.track).toHaveBeenCalledWith("app_crashed", "sessao", {
      error: "RangeError",
      screen: "sales",
    });
  });

  it("limita os relatos por sessão quando a tela quebra em loop", () => {
    // Act
    for (let attempt = 0; attempt < 8; attempt++) reportAppCrash(new Error("x"));

    // Assert
    expect(mocks.track).toHaveBeenCalledTimes(5);
  });
});
