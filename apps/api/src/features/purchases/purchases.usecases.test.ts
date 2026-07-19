import type { FinanceEntry, Product, Purchase } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { PurchasesUseCases } from "./purchases.usecases";
import type { IProductsRepo } from "../products/products.types";
import type {
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
    items: [],
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

function purchaseFromUpdate(purchase: Purchase, data: UpdatePurchaseData): Purchase {
  return {
    ...purchase,
    ...(data.supplierId !== undefined ? { supplierId: data.supplierId } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.amount !== undefined ? { amount: data.amount } : {}),
    ...(data.category !== undefined ? { category: data.category } : {}),
    ...(data.purchasedAt !== undefined ? { purchasedAt: data.purchasedAt } : {}),
    ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
    ...(data.paymentStatus !== undefined ? { paymentStatus: data.paymentStatus } : {}),
    ...(data.paidAt !== undefined ? { paidAt: data.paidAt } : {}),
    ...(data.financeEntryId !== undefined ? { financeEntryId: data.financeEntryId } : {}),
    ...(data.items === undefined
      ? {}
      : {
          items: data.items.map((item, index) => ({
            id: `item-${index}`,
            productId: item.productId,
            productName: item.productName,
            variationId: item.variationId ?? null,
            variationName: item.variationName ?? null,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal: item.quantity * item.unitCost,
          })),
        }),
  };
}

function makeRepo(overrides: Partial<IPurchasesRepo> = {}): IPurchasesRepo {
  return {
    create: (_userId: string, data) =>
      Promise.resolve(
        makePurchase({
          supplierId: data.supplierId ?? null,
          description: data.description,
          amount: data.amount ?? 0,
          category: data.category ?? "material",
          purchasedAt: data.purchasedAt,
          dueDate: data.dueDate ?? null,
          paymentStatus: "pending",
        }),
      ),
    findById: () => Promise.resolve(makePurchase()),
    findAll: () => Promise.resolve({ items: [makePurchase()], total: 1 }),
    update: (_userId: string, _id: string, data: UpdatePurchaseData) =>
      Promise.resolve(purchaseFromUpdate(makePurchase(), data)),
    delete: () => Promise.resolve(true),
    ...overrides,
  };
}

function makeFinance(): IFinancePoster & {
  calls: number;
  updateCalls: Array<{
    userId: string;
    entryId: string;
    amount: number;
    description: string;
    date: string;
    category: string;
  }>;
} {
  const poster = {
    calls: 0,
    updateCalls: [] as Array<{
      userId: string;
      entryId: string;
      amount: number;
      description: string;
      date: string;
      category: string;
    }>,
    createFromPurchase: vi.fn(() => {
      poster.calls += 1;
      return Promise.resolve({ id: "fin-1" } as FinanceEntry);
    }),
    updateFromPurchase: vi.fn(
      (
        userId: string,
        entryId: string,
        amount: number,
        description: string,
        date: string,
        category: string,
      ) => {
        poster.updateCalls.push({
          userId,
          entryId,
          amount,
          description,
          date,
          category,
        });
        return Promise.resolve({ id: "fin-1" } as FinanceEntry);
      },
    ),
  };
  return poster;
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    userId: USER_ID,
    name: "Caderno",
    description: null,
    category: "Cadernos",
    photoUrl: null,
    extraPhotos: [],
    code: null,
    salePrice: 10,
    saleUnit: "unit",
    costPrice: 2,
    recipeId: null,
    stockQuantity: 4,
    stockAlertThreshold: 2,
    isComposite: false,
    variations: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeProductsRepo(overrides: Partial<IProductsRepo> = {}): IProductsRepo {
  return {
    create: vi.fn(),
    findById: vi.fn(() => Promise.resolve(makeProduct())),
    findDuplicateByCode: vi.fn(() => Promise.resolve(null)),
    findAll: vi.fn(() => Promise.resolve({ items: [], total: 0 })),
    update: vi.fn(() => Promise.resolve(makeProduct())),
    delete: vi.fn(() => Promise.resolve(true)),
    countByUser: vi.fn(() => Promise.resolve(1)),
    decrementStock: vi.fn(() => Promise.resolve()),
    adjustStock: vi.fn(() => Promise.resolve(true)),
    averageActivePrice: vi.fn(() => Promise.resolve(10)),
    findComponentCandidates: vi.fn(() => Promise.resolve([])),
    ...overrides,
  };
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

    it("recebe os itens no estoque e atualiza o último custo", async () => {
      const adjustStock = vi.fn(() => Promise.resolve(true));
      const update = vi.fn(() => Promise.resolve(makeProduct()));
      const products = makeProductsRepo({ adjustStock, update });
      const sut = new PurchasesUseCases(makeRepo(), makeFinance(), products);

      await sut.create(USER_ID, {
        description: "Reposição semanal",
        purchasedAt: "2026-06-25",
        items: [
          {
            productId: "11111111-1111-1111-1111-111111111111",
            quantity: 5,
            unitCost: 3.25,
          },
        ],
      });

      expect(adjustStock).toHaveBeenCalledWith(
        USER_ID,
        "11111111-1111-1111-1111-111111111111",
        5,
      );
      expect(update).toHaveBeenCalledWith(
        USER_ID,
        "11111111-1111-1111-1111-111111111111",
        { costPrice: 3.25 },
      );
    });
  });

  describe("pay", () => {
    it("posts to finance and marks paid", async () => {
      const finance = makeFinance();
      const update = vi.fn((_userId: string, id: string, data: UpdatePurchaseData) =>
        Promise.resolve(purchaseFromUpdate(makePurchase({ id }), data)),
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

  describe("update", () => {
    it("updates editable fields on a pending purchase", async () => {
      const update = vi.fn((_userId: string, _id: string, data: UpdatePurchaseData) =>
        Promise.resolve(purchaseFromUpdate(makePurchase(), data)),
      );
      const sut = new PurchasesUseCases(makeRepo({ update }), makeFinance());

      const result = await sut.update(USER_ID, "pur-1", {
        description: "Farinha integral",
        amount: 145,
        category: "other",
      });

      expect(update).toHaveBeenCalledWith(
        USER_ID,
        "pur-1",
        expect.objectContaining({
          description: "Farinha integral",
          amount: 145,
          category: "other",
        }),
      );
      expect(result.description).toBe("Farinha integral");
    });

    it("keeps the linked finance entry in sync for a paid purchase", async () => {
      const finance = makeFinance();
      const existing = makePurchase({
        paymentStatus: "paid",
        paidAt: "2026-06-27",
        financeEntryId: "fin-1",
      });
      const update = vi.fn((_userId: string, _id: string, data: UpdatePurchaseData) =>
        Promise.resolve(purchaseFromUpdate(existing, data)),
      );
      const sut = new PurchasesUseCases(
        makeRepo({ findById: () => Promise.resolve(existing), update }),
        finance,
      );

      await sut.update(USER_ID, "pur-1", {
        description: "Farinha corrigida",
        amount: 150,
        category: "packaging",
      });

      expect(finance.updateCalls).toEqual([
        {
          userId: USER_ID,
          entryId: "fin-1",
          amount: 150,
          description: "Compra: Farinha corrigida",
          date: "2026-06-27",
          category: "packaging",
        },
      ]);
    });

    it("adjusts only the stock difference when item quantity changes", async () => {
      const adjustStock = vi.fn(() => Promise.resolve(true));
      const products = makeProductsRepo({ adjustStock });
      const existing = makePurchase({
        items: [
          {
            id: "item-1",
            productId: "11111111-1111-1111-1111-111111111111",
            productName: "Caderno",
            variationId: null,
            variationName: null,
            quantity: 5,
            unitCost: 3,
            subtotal: 15,
          },
        ],
      });
      const sut = new PurchasesUseCases(
        makeRepo({
          findById: () => Promise.resolve(existing),
          update: () => Promise.resolve(existing),
        }),
        makeFinance(),
        products,
      );

      await sut.update(USER_ID, "pur-1", {
        items: [
          {
            productId: "11111111-1111-1111-1111-111111111111",
            quantity: 3,
            unitCost: 3,
          },
        ],
      });

      expect(adjustStock).toHaveBeenCalledWith(
        USER_ID,
        "11111111-1111-1111-1111-111111111111",
        -2,
        undefined,
      );
    });

    it("rejects reducing received items when that stock was already sold", async () => {
      const products = makeProductsRepo({
        adjustStock: vi.fn(() => Promise.resolve(false)),
      });
      const existing = makePurchase({
        items: [
          {
            id: "item-1",
            productId: "11111111-1111-1111-1111-111111111111",
            productName: "Caderno",
            variationId: null,
            variationName: null,
            quantity: 5,
            unitCost: 3,
            subtotal: 15,
          },
        ],
      });
      const sut = new PurchasesUseCases(
        makeRepo({ findById: () => Promise.resolve(existing) }),
        makeFinance(),
        products,
      );

      await expect(
        sut.update(USER_ID, "pur-1", {
          items: [
            {
              productId: "11111111-1111-1111-1111-111111111111",
              quantity: 3,
              unitCost: 3,
            },
          ],
        }),
      ).rejects.toThrow(ValidationError);
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
