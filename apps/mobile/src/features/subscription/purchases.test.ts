import type { Purchase } from "react-native-iap";
import { describe, expect, it } from "vitest";

import {
  ALL_PRODUCT_IDS,
  isSyncablePaidPurchase,
  productIdFor,
  resolvePaidProductId,
} from "./purchases";

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: "purchase-1",
    ids: [],
    productId: "lucrocaseiro_professional_monthly",
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

describe("paid purchases", () => {
  it("exposes the four store product ids", () => {
    expect(ALL_PRODUCT_IDS).toEqual([
      "lucrocaseiro_essential_monthly",
      "lucrocaseiro_essential_annual",
      "lucrocaseiro_professional_monthly",
      "lucrocaseiro_professional_annual",
    ]);
  });

  it("maps tier + period to the store product id", () => {
    expect(productIdFor("essential", "monthly")).toBe("lucrocaseiro_essential_monthly");
    expect(productIdFor("essential", "annual")).toBe("lucrocaseiro_essential_annual");
    expect(productIdFor("professional", "monthly")).toBe(
      "lucrocaseiro_professional_monthly",
    );
    expect(productIdFor("professional", "annual")).toBe(
      "lucrocaseiro_professional_annual",
    );
  });

  it("syncs essential and professional product ids directly", () => {
    expect(
      resolvePaidProductId(makePurchase({ productId: "lucrocaseiro_essential_monthly" })),
    ).toBe("lucrocaseiro_essential_monthly");
    expect(
      resolvePaidProductId(
        makePurchase({ productId: "lucrocaseiro_professional_annual" }),
      ),
    ).toBe("lucrocaseiro_professional_annual");
  });

  it("still accepts the legacy premium product ids", () => {
    expect(
      resolvePaidProductId(makePurchase({ productId: "lucrocaseiro_premium_monthly" })),
    ).toBe("lucrocaseiro_premium_monthly");
    expect(
      resolvePaidProductId(makePurchase({ productId: "lucrocaseiro_premium_annual" })),
    ).toBe("lucrocaseiro_premium_annual");
  });

  it("maps Google Play parent subscription plus base plan to a syncable product", () => {
    // Só os ids conhecidos (SKUs novos + parent legado do Premium) mapeiam via
    // planFromProductId; o parent "lucrocaseiro_premium" resolve para professional.
    const purchase = makePurchase({
      productId: "lucrocaseiro_premium",
      currentPlanId: "annual",
    } as Partial<Purchase>);

    expect(resolvePaidProductId(purchase)).toBe("lucrocaseiro_professional_annual");
    expect(isSyncablePaidPurchase(purchase)).toBe(true);
  });

  it("accepts Android numeric purchased state from restored purchases", () => {
    const purchase = makePurchase({
      purchaseState: "unknown",
      purchaseStateAndroid: 1,
    } as Partial<Purchase>);

    expect(isSyncablePaidPurchase(purchase)).toBe(true);
  });

  it("does not sync pending or suspended purchases", () => {
    expect(isSyncablePaidPurchase(makePurchase({ purchaseState: "pending" }))).toBe(
      false,
    );
    expect(
      isSyncablePaidPurchase(
        makePurchase({ isSuspendedAndroid: true } as Partial<Purchase>),
      ),
    ).toBe(false);
  });

  it("does not sync unknown product ids", () => {
    expect(
      isSyncablePaidPurchase(makePurchase({ productId: "some_other_product", ids: [] })),
    ).toBe(false);
  });
});
