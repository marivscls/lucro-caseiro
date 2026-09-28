import { beforeEach, describe, expect, it, vi } from "vitest";

import { setCurrentAnalyticsScreen } from "../../features/analytics/screen-tracking";
import { usePaywall } from "./use-paywall";

const mocks = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("../../features/analytics/tracker", () => ({
  trackAnalyticsAction: mocks.track,
}));
vi.mock("./use-auth", () => ({
  useAuth: { getState: () => ({ token: "sessao" }) },
}));

describe("usePaywall — contexto do recurso pago", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCurrentAnalyticsScreen(null);
    usePaywall.getState().hide();
  });

  it("registra recurso, gatilho, tela e plano recomendado", () => {
    // Arrange
    setCurrentAnalyticsScreen("quotes");

    // Act
    usePaywall.getState().show("export", "professional");

    // Assert
    expect(mocks.track).toHaveBeenCalledWith("paid_feature_requested", "sessao", {
      feature: "export",
      trigger: "feature",
      screen: "quotes",
      plan: "professional",
    });
    expect(usePaywall.getState()).toMatchObject({ visible: true, resource: "export" });
  });

  it("omite tela e plano desconhecidos e marca o gatilho de limite", () => {
    // Act
    usePaywall.getState().show("clients", undefined, "limit");

    // Assert
    expect(mocks.track).toHaveBeenCalledWith("paid_feature_requested", "sessao", {
      feature: "clients",
      trigger: "limit",
    });
  });
});
