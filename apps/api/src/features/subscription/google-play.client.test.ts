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

  it("returns professional for active legacy premium subscription with future expiry", async () => {
    const expiry = new Date(Date.now() + 86400000).toISOString();
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        lineItems: [{ productId: "lucrocaseiro_premium_monthly", expiryTime: expiry }],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    const result = await client.getPlanState("user-1", {
      productId: "lucrocaseiro_premium_monthly",
      purchaseToken: "token-1",
    });

    expect(result.plan).toBe("professional");
    expect(result.expiresAt?.toISOString()).toBe(expiry);
  });

  it("returns essential for an active essential subscription", async () => {
    const expiry = new Date(Date.now() + 86400000).toISOString();
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        lineItems: [{ productId: "lucrocaseiro_essential_monthly", expiryTime: expiry }],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    const result = await client.getPlanState("user-1", {
      productId: "lucrocaseiro_essential_monthly",
      purchaseToken: "token-1",
    });

    expect(result.plan).toBe("essential");
    expect(result.expiresAt?.toISOString()).toBe(expiry);
  });

  it("returns professional for an active professional subscription", async () => {
    const expiry = new Date(Date.now() + 86400000).toISOString();
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        lineItems: [
          { productId: "lucrocaseiro_professional_annual", expiryTime: expiry },
        ],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    const result = await client.getPlanState("user-1", {
      productId: "lucrocaseiro_professional_annual",
      purchaseToken: "token-1",
    });

    expect(result.plan).toBe("professional");
  });

  it("keeps canceled but unexpired subscriptions active until expiry", async () => {
    const expiry = new Date(Date.now() + 86400000).toISOString();
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_CANCELED",
        lineItems: [
          { productId: "lucrocaseiro_professional_annual", expiryTime: expiry },
        ],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    const result = await client.getPlanState("user-1", {
      productId: "lucrocaseiro_professional_annual",
      purchaseToken: "token-1",
    });

    expect(result.plan).toBe("professional");
  });

  it("accepts Google Play parent subscription id with base plan details", async () => {
    const expiry = new Date(Date.now() + 86400000).toISOString();
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        lineItems: [
          {
            productId: "lucrocaseiro_premium",
            expiryTime: expiry,
            offerDetails: { basePlanId: "monthly" },
          },
        ],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    const result = await client.getPlanState("user-1", {
      productId: "lucrocaseiro_premium_monthly",
      purchaseToken: "token-1",
    });

    expect(result.plan).toBe("professional");
  });

  it("returns free for expired or mismatched subscriptions", async () => {
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_EXPIRED",
        lineItems: [
          {
            productId: "lucrocaseiro_professional_monthly",
            expiryTime: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    await expect(
      client.getPlanState("user-1", {
        productId: "lucrocaseiro_professional_monthly",
        purchaseToken: "token-1",
      }),
    ).resolves.toEqual({ plan: "free", expiresAt: null });
  });

  it("returns free for active non-paid subscription ids", async () => {
    request.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        lineItems: [
          {
            productId: "other_subscription",
            expiryTime: new Date(Date.now() + 86400000).toISOString(),
          },
        ],
      },
    });

    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", serviceAccount);
    await expect(
      client.getPlanState("user-1", {
        productId: "lucrocaseiro_professional_monthly",
        purchaseToken: "token-1",
      }),
    ).resolves.toEqual({ plan: "free", expiresAt: null });
  });

  it("fails when service account is missing", async () => {
    const client = new GooglePlayClient("br.com.orionseven.lucrocaseiro", "");
    await expect(
      client.getPlanState("user-1", {
        productId: "lucrocaseiro_professional_monthly",
        purchaseToken: "token-1",
      }),
    ).rejects.toThrow("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON não configurado");
  });
});
