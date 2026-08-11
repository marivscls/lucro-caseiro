import { describe, expect, it } from "vitest";

import { subscriptionManagementTarget } from "./subscription-management";

describe("subscriptionManagementTarget", () => {
  it("abre a assinatura do aplicativo certo no Google Play", () => {
    const target = subscriptionManagementTarget("android");

    expect(target.providerLabel).toBe("Google Play");
    expect(target.url).toContain("play.google.com/store/account/subscriptions");
    expect(target.url).toContain("package=");
  });

  it("encaminha compras Stripe ao suporte no iOS e na web", () => {
    for (const platform of ["ios", "web"]) {
      const target = subscriptionManagementTarget(platform);

      expect(target.providerLabel).toBe("suporte do Lucro Caseiro");
      expect(target.url).toContain("mailto:contato@orionseven.com.br");
      expect(target.url).toContain("Cancelar%20assinatura");
    }
  });
});
