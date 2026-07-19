import type { Product, RetailDocument, RetailPromotion } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import type { IClientsRepo } from "../clients/clients.types";
import type { IProductsRepo } from "../products/products.types";
import type { SalesUseCases } from "../sales/sales.usecases";
import type { IRetailRepo } from "./retail.types";
import { RetailUseCases } from "./retail.usecases";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const PRODUCT_ID = "22222222-2222-2222-2222-222222222222";
const VARIATION_ID = "33333333-3333-3333-3333-333333333333";
const DOCUMENT_ID = "44444444-4444-4444-4444-444444444444";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: PRODUCT_ID,
    userId: USER_ID,
    name: "Caderno",
    description: null,
    category: "Cadernos",
    photoUrl: null,
    extraPhotos: [],
    code: "CAD-1",
    salePrice: 10,
    saleUnit: "unit",
    costPrice: 5,
    recipeId: null,
    stockQuantity: 10,
    stockAlertThreshold: 2,
    isComposite: false,
    variations: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeDocument(overrides: Partial<RetailDocument> = {}): RetailDocument {
  return {
    id: DOCUMENT_ID,
    userId: USER_ID,
    kind: "catalog_order",
    status: "ready",
    title: "Pedido de Maria",
    partyId: null,
    amount: 10,
    deposit: 0,
    dueAt: null,
    reservedUntil: new Date(Date.now() + 60_000).toISOString(),
    payload: {},
    items: [
      {
        id: "55555555-5555-5555-5555-555555555555",
        productId: PRODUCT_ID,
        variationId: null,
        name: "Caderno",
        variationName: null,
        quantity: 1,
        unitPrice: 10,
        subtotal: 10,
        metadata: {},
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makePromotion(): RetailPromotion {
  return {
    id: "66666666-6666-6666-6666-666666666666",
    userId: USER_ID,
    name: "Volta às aulas",
    type: "percentage",
    value: 10,
    buyQuantity: null,
    payQuantity: null,
    productId: PRODUCT_ID,
    category: null,
    startsAt: new Date(0).toISOString(),
    endsAt: new Date(8_640_000_000_000_000).toISOString(),
    active: true,
    createdAt: new Date().toISOString(),
  };
}

function makeSut(options?: {
  document?: RetailDocument;
  product?: Product;
  promotions?: RetailPromotion[];
}) {
  const reservedQuantities = vi.fn().mockResolvedValue(new Map());
  const createDocument = vi.fn();
  const updateDocument = vi.fn();
  const repo = {
    findDocument: vi.fn().mockResolvedValue(options?.document ?? null),
    listPromotions: vi.fn().mockResolvedValue(options?.promotions ?? []),
    reservedQuantities,
    listBusinessAccounts: vi.fn().mockResolvedValue([]),
    createDocument,
    updateDocument,
  } as unknown as IRetailRepo;
  const adjustStock = vi.fn().mockResolvedValue(true);
  const productsRepo = {
    findById: vi.fn().mockResolvedValue(options?.product ?? makeProduct()),
    adjustStock,
  } as unknown as IProductsRepo;
  const getSaleById = vi.fn();
  const salesUseCases = {
    getById: getSaleById,
  } as unknown as SalesUseCases;
  const clientsRepo = {} as IClientsRepo;
  return {
    sut: new RetailUseCases(repo, productsRepo, salesUseCases, clientsRepo),
    repo,
    productsRepo,
    salesUseCases,
    mocks: {
      adjustStock,
      createDocument,
      getSaleById,
      reservedQuantities,
      updateDocument,
    },
  };
}

describe("RetailUseCases", () => {
  it("quotes the authoritative promotional total", async () => {
    const { sut } = makeSut({ promotions: [makePromotion()] });
    const quote = await sut.quoteCheckout(USER_ID, {
      items: [{ productId: PRODUCT_ID, quantity: 2 }],
      manualDiscount: 0,
    });
    expect(quote).toEqual({ total: 18, originalTotal: 20, discount: 2 });
  });

  it("excludes the linked ready reservation from available stock", async () => {
    const document = makeDocument();
    const { sut, mocks } = makeSut({ document });
    await sut.quoteCheckout(USER_ID, {
      catalogOrderId: DOCUMENT_ID,
      items: [{ productId: PRODUCT_ID, quantity: 1 }],
      manualDiscount: 0,
    });
    expect(mocks.reservedQuantities).toHaveBeenCalledWith(USER_ID, DOCUMENT_ID);
  });

  it("rejects receiving a catalog order before it is ready", async () => {
    const { sut } = makeSut({ document: makeDocument({ status: "confirmed" }) });
    await expect(
      sut.quoteCheckout(USER_ID, {
        catalogOrderId: DOCUMENT_ID,
        items: [{ productId: PRODUCT_ID, quantity: 1 }],
        manualDiscount: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("adjusts the counted variation and finalizes inventory", async () => {
    const product = makeProduct({
      stockQuantity: null,
      variations: [{ id: VARIATION_ID, name: "Azul", stockQuantity: 3 }],
    });
    const document = makeDocument({
      kind: "inventory_count",
      status: "counting",
      items: [
        {
          ...makeDocument().items[0]!,
          variationId: VARIATION_ID,
          variationName: "Azul",
          metadata: { counted: 5, reason: "Contagem física" },
        },
      ],
    });
    const finalized = makeDocument({ ...document, status: "finalized" });
    const { sut, mocks } = makeSut({ document, product });
    mocks.updateDocument.mockResolvedValue(finalized);
    await expect(sut.finalizeInventory(USER_ID, DOCUMENT_ID)).resolves.toBe(finalized);
    expect(mocks.adjustStock).toHaveBeenCalledWith(USER_ID, PRODUCT_ID, 2, VARIATION_ID);
  });

  it("checks sale ownership before creating a fiscal document", async () => {
    const { sut, mocks } = makeSut();
    mocks.getSaleById.mockRejectedValue(new NotFoundError("Venda não encontrada"));
    await expect(
      sut.createFiscalDocument(USER_ID, DOCUMENT_ID, "nfce"),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mocks.createDocument).not.toHaveBeenCalled();
  });
});
