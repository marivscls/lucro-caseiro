import { afterEach, describe, expect, it, vi } from "vitest";

import { GooglePlayClient } from "./google-play.client";

const request = vi.fn();

vi.mock("google-auth-library", () => ({
  GoogleAuth: vi.fn(() => ({ request })),
}));

const serviceAccount = JSON.stringify({
  client_email: "billing@example.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n",
});

describe("GooglePlayClient", () => {
  afterEach(() => {
    request.mockReset();
  });

  it("returns premium for active subscription with future expiry", async () => {
    const expiry = new Date(Date.now() + 86400000).toISOString();
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        lineItems: [{ productId: "lucrocaseiro_premium_monthly", expiryTime: expiry }],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    const result = await client.getPremiumState("user-1", {
      productId: "lucrocaseiro_premium_monthly",
      purchaseToken: "token-1",
    });

    expect(result.plan).toBe("premium");
    expect(result.expiresAt?.toISOString()).toBe(expiry);
  });

  it("keeps canceled but unexpired subscriptions premium until expiry", async () => {
    const expiry = new Date(Date.now() + 86400000).toISOString();
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_CANCELED",
        lineItems: [{ productId: "lucrocaseiro_premium_annual", expiryTime: expiry }],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    const result = await client.getPremiumState("user-1", {
      productId: "lucrocaseiro_premium_annual",
      purchaseToken: "token-1",
    });

    expect(result.plan).toBe("premium");
  });

  it("returns free for expired or mismatched subscriptions", async () => {
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_EXPIRED",
        lineItems: [
          {
            productId: "lucrocaseiro_premium_monthly",
            expiryTime: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    await expect(
      client.getPremiumState("user-1", {
        productId: "lucrocaseiro_premium_monthly",
        purchaseToken: "token-1",
      }),
    ).resolves.toEqual({ plan: "free", expiresAt: null });
  });

  it("fails when service account is missing", async () => {
    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", "");
    await expect(
      client.getPremiumState("user-1", {
        productId: "lucrocaseiro_premium_monthly",
        purchaseToken: "token-1",
      }),
    ).rejects.toThrow("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON nao configurado");
  });
});
