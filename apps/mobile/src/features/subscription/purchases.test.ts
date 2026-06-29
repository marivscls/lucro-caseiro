import type { Purchase } from "react-native-iap";
import { describe, expect, it } from "vitest";

import { isSyncablePremiumPurchase, resolvePremiumProductId } from "./purchases";

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: "purchase-1",
    ids: [],
    productId: "lucrocaseiro_premium_monthly",
    transactionDate: Date.now(),
    transactionId: "transaction-1",
    purchaseToken: "token",
    purchaseState: "purchased",
    isAutoRenewing: true,
    quantity: 1,
    platform: "android",
    store: "google",
    ...overrides,
  } as unknown as Purchase;
}

describe("premium purchases", () => {
  it("syncs monthly and annual product ids directly", () => {
    expect(resolvePremiumProductId(makePurchase())).toBe("lucrocaseiro_premium_monthly");
    expect(
      resolvePremiumProductId(makePurchase({ productId: "lucrocaseiro_premium_annual" })),
    ).toBe("lucrocaseiro_premium_annual");
  });

  it("maps Google Play parent subscription plus base plan to a syncable product", () => {
    const purchase = makePurchase({
      productId: "lucrocaseiro_premium",
      currentPlanId: "annual",
    });

    expect(resolvePremiumProductId(purchase)).toBe("lucrocaseiro_premium_annual");
    expect(isSyncablePremiumPurchase(purchase)).toBe(true);
  });

  it("accepts Android numeric purchased state from restored purchases", () => {
    const purchase = makePurchase({
      purchaseState: "unknown",
      purchaseStateAndroid: 1,
    } as Partial<Purchase>);

    expect(isSyncablePremiumPurchase(purchase)).toBe(true);
  });

  it("does not sync pending or suspended purchases", () => {
    expect(isSyncablePremiumPurchase(makePurchase({ purchaseState: "pending" }))).toBe(
      false,
    );
    expect(
      isSyncablePremiumPurchase(
        makePurchase({ isSuspendedAndroid: true } as Partial<Purchase>),
      ),
    ).toBe(false);
  });
});
