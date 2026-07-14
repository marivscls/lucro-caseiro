import { describe, expect, it } from "vitest";

import { activeDurationMs, analyticsScreenForPath } from "./screen-tracking";

describe("analyticsScreenForPath", () => {
  it.each([
    ["/login", "login"],
    ["/register", "register"],
    ["/auth/callback", "auth_callback"],
    ["/reset-password", "reset_password"],
    ["/onboarding", "onboarding"],
    ["/tabs/index", "home"],
    ["/tabs/sales", "sales"],
    ["/tabs/new-sale", "new_sale"],
    ["/tabs/agenda", "agenda"],
    ["/tabs/clients", "clients"],
    ["/tabs/more", "more"],
    ["/admin-metrics", "admin_metrics"],
    ["/catalog", "catalog"],
    ["/fiado", "fiado"],
    ["/finance", "finance"],
    ["/insights", "insights"],
    ["/labels", "labels"],
    ["/materials", "materials"],
    ["/packaging", "packaging"],
    ["/plans", "plans"],
    ["/pricing", "pricing"],
    ["/products", "products"],
    ["/purchases", "purchases"],
    ["/quotes", "quotes"],
    ["/recipes", "recipes"],
    ["/recurring-expenses", "recurring_expenses"],
    ["/settings", "settings"],
    ["/suppliers", "suppliers"],
    ["/support", "support"],
  ])("traduz %s para o nome canônico %s", (path, screen) => {
    expect(analyticsScreenForPath(path)).toBe(screen);
  });

  it("não envia caminhos livres ao backend", () => {
    expect(analyticsScreenForPath("/products/qualquer-id")).toBe("products");
    expect(analyticsScreenForPath("/rota-nao-permitida")).toBeNull();
  });
});

describe("activeDurationMs", () => {
  it("ignora visitas acidentais e limita sessoes anomalas", () => {
    expect(activeDurationMs(1_000, 1_100)).toBeNull();
    expect(activeDurationMs(1_000, 2_000)).toBe(1_000);
    expect(activeDurationMs(0, 24 * 60 * 60 * 1000)).toBe(6 * 60 * 60 * 1000);
  });
});
