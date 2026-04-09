import type { Product, Sale } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import type { IProductsRepo } from "../products/products.types";
import { SalesUseCases } from "./sales.usecases";
import type { CreateSaleData, ISalesRepo, UpdateSaleData } from "./sales.types";

const USER_ID = "user-123";

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "sale-1",
    userId: USER_ID,
    clientId: null,
    clientName: null,
    status: "paid",
    paymentMethod: "pix",
    total: 30,
    notes: null,
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        productName: "Brigadeiro",
        quantity: 3,
        unitPrice: 10,
        subtotal: 30,
      },
    ],
    soldAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<ISalesRepo> = {}): ISalesRepo {
  return {
    create: (_userId: string, data: CreateSaleData, total: number) =>
      Promise.resolve(
        makeSale({ total, paymentMethod: data.paymentMethod as Sale["paymentMethod"] }),
      ),
    findById: () => Promise.resolve(makeSale()),
    findAll: () => Promise.resolve({ items: [makeSale()], total: 1 }),
    update: (_userId: string, _id: string, _data: UpdateSaleData, total: number) =>
      Promise.resolve(makeSale({ total })),
    updateStatus: (_userId: string, _id: string, status: Sale["status"]) =>
      Promise.resolve(makeSale({ status })),
    countByUserInMonth: () => Promise.resolve(5),
    getDaySummary: () =>
      Promise.resolve({ totalSales: 3, totalAmount: 90, averageTicket: 30 }),
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    userId: USER_ID,
    name: "Brigadeiro",
    description: null,
    category: "Doces",
    photoUrl: null,
    salePrice: 10,
    costPrice: null,
    recipeId: null,
    stockQuantity: 50,
    stockAlertThreshold: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeProductsRepo(overrides: Partial<IProductsRepo> = {}): IProductsRepo {
  return {
    create: vi.fn(),
    findById: vi.fn(() => Promise.resolve(makeProduct())),
    findAll: vi.fn(() => Promise.resolve({ items: [], total: 0 })),
    update: vi.fn(() => Promise.resolve(makeProduct())),
    delete: vi.fn(() => Promise.resolve(true)),
    countByUser: vi.fn(() => Promise.resolve(1)),
    decrementStock: vi.fn(() => Promise.resolve(undefined)),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<ISalesRepo> = {}, productsRepo?: IProductsRepo) {
  const repo = makeRepo(repoOverrides);
  const sut = new SalesUseCases(repo, productsRepo);
  return { sut, repo };
}

describe("SalesUseCases", () => {
  describe("createSale", () => {
    it("creates a sale with valid items and auto-calculates total", async () => {
      const { sut } = makeSut();
      const result = await sut.createSale(USER_ID, {
        paymentMethod: "pix",
        items: [{ productId: "prod-1", quantity: 3, unitPrice: 10 }],
      });

      expect(result.total).toBe(30);
    });

    it("throws ValidationError for empty items", async () => {
      const { sut } = makeSut();
      await expect(
        sut.createSale(USER_ID, {
          paymentMethod: "pix",
          items: [],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError for invalid item quantity", async () => {
      const { sut } = makeSut();
      await expect(
        sut.createSale(USER_ID, {
          paymentMethod: "pix",
          items: [{ productId: "prod-1", quantity: 0, unitPrice: 10 }],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError for invalid item price", async () => {
      const { sut } = makeSut();
      await expect(
        sut.createSale(USER_ID, {
          paymentMethod: "pix",
          items: [{ productId: "prod-1", quantity: 1, unitPrice: -5 }],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("decrements stock for products with stockQuantity on sale creation", async () => {
      const productsRepo = makeProductsRepo();
      const { sut } = makeSut({}, productsRepo);

      await sut.createSale(USER_ID, {
        paymentMethod: "pix",
        items: [{ productId: "prod-1", quantity: 3, unitPrice: 10 }],
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(productsRepo.decrementStock).toHaveBeenCalledWith(USER_ID, "prod-1", 3);
    });

    it("does not decrement stock when product has null stockQuantity", async () => {
      const productsRepo = makeProductsRepo({
        findById: vi.fn(() => Promise.resolve(makeProduct({ stockQuantity: null }))),
      });
      const { sut } = makeSut({}, productsRepo);

      await sut.createSale(USER_ID, {
        paymentMethod: "pix",
        items: [{ productId: "prod-1", quantity: 3, unitPrice: 10 }],
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(productsRepo.decrementStock).not.toHaveBeenCalled();
    });

    it("throws ValidationError when stock is insufficient", async () => {
      const productsRepo = makeProductsRepo({
        findById: vi.fn(() => Promise.resolve(makeProduct({ stockQuantity: 2 }))),
      });
      const { sut } = makeSut({}, productsRepo);

      await expect(
        sut.createSale(USER_ID, {
          paymentMethod: "pix",
          items: [{ productId: "prod-1", quantity: 5, unitPrice: 10 }],
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        sut.createSale(USER_ID, {
          paymentMethod: "pix",
          items: [{ productId: "prod-1", quantity: 5, unitPrice: 10 }],
        }),
      ).rejects.toThrow("Estoque insuficiente para Brigadeiro");
    });
  });

  describe("getById", () => {
    it("returns sale when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "sale-1");
      expect(result.id).toBe("sale-1");
    });

    it("throws NotFoundError when not found", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.getById(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("returns paginated results", async () => {
      const { sut } = makeSut();
      const result = await sut.list(USER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("updateStatus", () => {
    it("updates status of an existing sale", async () => {
      const { sut } = makeSut();
      const result = await sut.updateStatus(USER_ID, "sale-1", "cancelled");
      expect(result.status).toBe("cancelled");
    });

    it("throws NotFoundError when sale does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.updateStatus(USER_ID, "nope", "cancelled")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError when cancelling an already cancelled sale", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(makeSale({ status: "cancelled" })),
      });
      await expect(sut.updateStatus(USER_ID, "sale-1", "cancelled")).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("updateSale", () => {
    it("updates a sale with new items and recalculates total", async () => {
      const { sut } = makeSut();
      const result = await sut.updateSale(USER_ID, "sale-1", {
        items: [{ productId: "prod-1", quantity: 5, unitPrice: 10 }],
      });

      expect(result.total).toBe(50);
    });

    it("throws ValidationError when sale is cancelled", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(makeSale({ status: "cancelled" })),
      });
      await expect(
        sut.updateSale(USER_ID, "sale-1", { notes: "updated" }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when sale does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.updateSale(USER_ID, "nope", { notes: "updated" })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getDaySummary", () => {
    it("returns day summary from repo", async () => {
      const { sut } = makeSut();
      const result = await sut.getDaySummary(USER_ID, "2026-03-26");
      expect(result).toEqual({
        totalSales: 3,
        totalAmount: 90,
        averageTicket: 30,
      });
    });
  });

  describe("countThisMonth", () => {
    it("returns count from repo", async () => {
      const { sut } = makeSut();
      const result = await sut.countThisMonth(USER_ID);
      expect(result).toBe(5);
    });
  });
});
