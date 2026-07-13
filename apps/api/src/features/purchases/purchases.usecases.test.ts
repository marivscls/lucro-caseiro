import type { FinanceEntry, Purchase } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { PurchasesUseCases } from "./purchases.usecases";
import type {
  CreatePurchaseData,
  IFinancePoster,
  IPurchasesRepo,
  UpdatePurchaseData,
} from "./purchases.types";

const USER_ID = "user-123";

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: "pur-1",
    userId: USER_ID,
    supplierId: null,
    description: "Farinha 25kg",
    amount: 120,
    category: "material",
    paymentStatus: "pending",
    purchasedAt: "2026-06-25",
    dueDate: null,
    paidAt: null,
    financeEntryId: null,
    createdAt: new Date("2026-06-25").toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IPurchasesRepo> = {}): IPurchasesRepo {
  return {
    create: (_userId: string, data: CreatePurchaseData) =>
      Promise.resolve(makePurchase({ ...data, paymentStatus: "pending" })),
    findById: () => Promise.resolve(makePurchase()),
    findAll: () => Promise.resolve({ items: [makePurchase()], total: 1 }),
    update: (_userId: string, _id: string, data: UpdatePurchaseData) =>
      Promise.resolve(makePurchase({ ...data })),
    delete: () => Promise.resolve(true),
    ...overrides,
  };
}

function makeFinance(): IFinancePoster & { calls: number } {
  const poster = {
    calls: 0,
    createFromPurchase: vi.fn(() => {
      poster.calls += 1;
      return Promise.resolve({ id: "fin-1" } as FinanceEntry);
    }),
  };
  return poster;
}

describe("PurchasesUseCases", () => {
  describe("create", () => {
    it("creates a pending purchase without touching finance", async () => {
      const finance = makeFinance();
      const sut = new PurchasesUseCases(makeRepo(), finance);
      const result = await sut.create(USER_ID, {
        description: "Farinha",
        amount: 100,
        purchasedAt: "2026-06-25",
      });
      expect(result.paymentStatus).toBe("pending");
      expect(finance.calls).toBe(0);
    });

    it("posts to finance when created already paid", async () => {
      const finance = makeFinance();
      const sut = new PurchasesUseCases(makeRepo(), finance);
      const result = await sut.create(USER_ID, {
        description: "Farinha",
        amount: 100,
        purchasedAt: "2026-06-25",
        paymentStatus: "paid",
      });
      expect(finance.calls).toBe(1);
      expect(result.paymentStatus).toBe("paid");
      expect(result.financeEntryId).toBe("fin-1");
    });

    it("throws ValidationError for invalid data", async () => {
      const sut = new PurchasesUseCases(makeRepo(), makeFinance());
      await expect(
        sut.create(USER_ID, { description: "", amount: 0, purchasedAt: "x" }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("pay", () => {
    it("posts to finance and marks paid", async () => {
      const finance = makeFinance();
      const update = vi.fn((_userId: string, id: string, data: UpdatePurchaseData) =>
        Promise.resolve(makePurchase({ id, ...data })),
      );
      const sut = new PurchasesUseCases(makeRepo({ update }), finance);
      const result = await sut.pay(USER_ID, "pur-selected", "2026-06-26");
      expect(finance.calls).toBe(1);
      expect(update).toHaveBeenCalledOnce();
      expect(update).toHaveBeenCalledWith(
        USER_ID,
        "pur-selected",
        expect.objectContaining({ paymentStatus: "paid" }),
      );
      expect(result.id).toBe("pur-selected");
      expect(result.paymentStatus).toBe("paid");
      expect(result.paidAt).toBe("2026-06-26");
      expect(result.financeEntryId).toBe("fin-1");
    });

    it("is idempotent when already paid (no double post)", async () => {
      const finance = makeFinance();
      const sut = new PurchasesUseCases(
        makeRepo({
          findById: () => Promise.resolve(makePurchase({ paymentStatus: "paid" })),
        }),
        finance,
      );
      const result = await sut.pay(USER_ID, "pur-1");
      expect(finance.calls).toBe(0);
      expect(result.paymentStatus).toBe("paid");
    });

    it("throws NotFoundError when the purchase is missing", async () => {
      const sut = new PurchasesUseCases(
        makeRepo({ findById: () => Promise.resolve(null) }),
        makeFinance(),
      );
      await expect(sut.pay(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getById / list / remove", () => {
    it("returns a purchase by id", async () => {
      const sut = new PurchasesUseCases(makeRepo(), makeFinance());
      expect((await sut.getById(USER_ID, "pur-1")).id).toBe("pur-1");
    });

    it("throws NotFoundError for a missing purchase", async () => {
      const sut = new PurchasesUseCases(
        makeRepo({ findById: () => Promise.resolve(null) }),
        makeFinance(),
      );
      await expect(sut.getById(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });

    it("lists paginated purchases", async () => {
      const sut = new PurchasesUseCases(makeRepo(), makeFinance());
      const result = await sut.list(USER_ID, { page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("removes a purchase", async () => {
      const sut = new PurchasesUseCases(makeRepo(), makeFinance());
      await expect(sut.remove(USER_ID, "pur-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when nothing was deleted", async () => {
      const sut = new PurchasesUseCases(
        makeRepo({ delete: () => Promise.resolve(false) }),
        makeFinance(),
      );
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });
});
