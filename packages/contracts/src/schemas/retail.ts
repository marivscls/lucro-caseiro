import { z } from "zod";

import { MAX_MONEY, MAX_QUANTITY, PaymentMethod } from "./common";

export const RetailDocumentKind = z.enum([
  "cash_session",
  "school_list",
  "inventory_count",
  "purchase_order",
  "service_order",
  "catalog_order",
  "fiscal_document",
]);
export type RetailDocumentKind = z.infer<typeof RetailDocumentKind>;

export const RetailDocumentStatus = z.enum([
  "open",
  "closed",
  "draft",
  "active",
  "sent",
  "partial",
  "received",
  "counting",
  "finalized",
  "quoted",
  "waiting_file",
  "production",
  "ready",
  "delivered",
  "new",
  "confirmed",
  "separated",
  "completed",
  "expired",
  "cancelled",
  "waiting_configuration",
  "processing",
  "authorized",
  "rejected",
  "contingency",
]);
export type RetailDocumentStatus = z.infer<typeof RetailDocumentStatus>;

export const RetailDocumentItemInputDto = z.object({
  productId: z.string().uuid().optional(),
  variationId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  variationName: z.string().max(100).optional(),
  quantity: z.number().positive().max(MAX_QUANTITY),
  unitPrice: z.number().min(0).max(MAX_MONEY).default(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type RetailDocumentItemInput = z.infer<typeof RetailDocumentItemInputDto>;

export const CreateRetailDocumentDto = z.object({
  kind: RetailDocumentKind.exclude(["cash_session", "fiscal_document"]),
  title: z.string().min(1).max(200),
  partyId: z.string().uuid().optional(),
  status: RetailDocumentStatus.optional(),
  amount: z.number().min(0).max(MAX_MONEY).optional(),
  deposit: z.number().min(0).max(MAX_MONEY).optional(),
  dueAt: z.string().datetime().optional(),
  reservedUntil: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  items: z.array(RetailDocumentItemInputDto).max(500).default([]),
});
export type CreateRetailDocument = z.infer<typeof CreateRetailDocumentDto>;

export const UpdateRetailDocumentDto = z.object({
  title: z.string().min(1).max(200).optional(),
  status: RetailDocumentStatus.optional(),
  amount: z.number().min(0).max(MAX_MONEY).optional(),
  deposit: z.number().min(0).max(MAX_MONEY).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  reservedUntil: z.string().datetime().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  items: z.array(RetailDocumentItemInputDto).max(500).optional(),
});
export type UpdateRetailDocument = z.infer<typeof UpdateRetailDocumentDto>;

export const RetailDocumentItemDto = RetailDocumentItemInputDto.extend({
  id: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  variationId: z.string().uuid().nullable(),
  variationName: z.string().nullable(),
  subtotal: z.number(),
  metadata: z.record(z.string(), z.unknown()),
});

export const RetailDocumentDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: RetailDocumentKind,
  status: RetailDocumentStatus,
  title: z.string(),
  partyId: z.string().uuid().nullable(),
  amount: z.number(),
  deposit: z.number(),
  dueAt: z.string().datetime().nullable(),
  reservedUntil: z.string().datetime().nullable(),
  payload: z.record(z.string(), z.unknown()),
  items: z.array(RetailDocumentItemDto),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type RetailDocument = z.infer<typeof RetailDocumentDto>;

export const OpenCashSessionDto = z.object({
  openingFloat: z.number().min(0).max(MAX_MONEY),
  note: z.string().max(500).optional(),
});

export const CashMovementType = z.enum(["sale", "supply", "withdrawal", "refund"]);
export const CreateCashMovementDto = z.object({
  type: CashMovementType,
  paymentMethod: PaymentMethod,
  amount: z.number().positive().max(MAX_MONEY),
  referenceId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

export const CloseCashSessionDto = z.object({
  countedCash: z.number().min(0).max(MAX_MONEY),
  note: z.string().max(500).optional(),
});

export const CashMovementDto = CreateCashMovementDto.extend({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  referenceId: z.string().uuid().nullable(),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type CashMovement = z.infer<typeof CashMovementDto>;

export const CashSessionSummaryDto = z.object({
  session: RetailDocumentDto,
  movements: z.array(CashMovementDto),
  expectedByMethod: z.record(z.string(), z.number()),
  expectedCash: z.number(),
  countedCash: z.number().nullable(),
  difference: z.number().nullable(),
});
export type CashSessionSummary = z.infer<typeof CashSessionSummaryDto>;

export const PromotionType = z.enum(["percentage", "fixed", "buy_x_pay_y"]);
export const CreateRetailPromotionDto = z.object({
  name: z.string().min(1).max(120),
  type: PromotionType,
  value: z.number().positive().max(MAX_MONEY),
  buyQuantity: z.number().int().positive().max(100).optional(),
  payQuantity: z.number().int().positive().max(100).optional(),
  productId: z.string().uuid().optional(),
  category: z.string().max(100).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  active: z.boolean().default(true),
});
export const UpdateRetailPromotionDto = CreateRetailPromotionDto.partial();
export type CreateRetailPromotion = z.infer<typeof CreateRetailPromotionDto>;

export const RetailPromotionDto = CreateRetailPromotionDto.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  category: z.string().nullable(),
  buyQuantity: z.number().nullable(),
  payQuantity: z.number().nullable(),
  createdAt: z.string().datetime(),
});
export type RetailPromotion = z.infer<typeof RetailPromotionDto>;

export const BulkPriceUpdateDto = z
  .object({
    category: z.string().min(1).max(100).optional(),
    productIds: z.array(z.string().uuid()).max(500).optional(),
    percentage: z.number().min(-99).max(1000).optional(),
    markupOnCost: z.number().min(0).max(1000).optional(),
  })
  .refine((data) => data.category || data.productIds?.length, {
    message: "Informe categoria ou produtos",
  })
  .refine((data) => data.percentage !== undefined || data.markupOnCost !== undefined, {
    message: "Informe reajuste ou markup",
  });

export const BatchLabelsDto = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(500),
  template: z.enum(["product", "shelf"]).default("product"),
});

export const BusinessAccountKind = z.enum(["school", "company", "office", "agreement"]);
export const CreateBusinessAccountDto = z.object({
  clientId: z.string().uuid(),
  kind: BusinessAccountKind,
  legalName: z.string().min(1).max(200),
  document: z.string().max(30).optional(),
  contactName: z.string().max(120).optional(),
  creditLimit: z.number().min(0).max(MAX_MONEY).default(0),
  dueDays: z.number().int().min(0).max(365).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  active: z.boolean().default(true),
});
export const UpdateBusinessAccountDto = CreateBusinessAccountDto.partial();

export const BusinessAccountDto = CreateBusinessAccountDto.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  document: z.string().nullable(),
  contactName: z.string().nullable(),
  usedCredit: z.number(),
  createdAt: z.string().datetime(),
});
export type BusinessAccount = z.infer<typeof BusinessAccountDto>;

export const CheckoutPaymentDto = z.object({
  method: PaymentMethod,
  amount: z.number().positive().max(MAX_MONEY),
});

export const RetailCheckoutDto = z.object({
  sessionId: z.string().uuid(),
  catalogOrderId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  businessAccountId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variationId: z.string().uuid().optional(),
        quantity: z.number().positive().max(MAX_QUANTITY),
      }),
    )
    .min(1),
  payments: z.array(CheckoutPaymentDto).min(1).max(5),
  manualDiscount: z.number().min(0).max(MAX_MONEY).default(0),
  notes: z.string().max(500).optional(),
  requestFiscalDocument: z.boolean().default(false),
});

export const RetailCheckoutQuoteDto = RetailCheckoutDto.pick({
  catalogOrderId: true,
  clientId: true,
  businessAccountId: true,
  items: true,
  manualDiscount: true,
});
export type RetailCheckoutQuote = z.infer<typeof RetailCheckoutQuoteDto>;

export const PublicCatalogOrderDto = z.object({
  slug: z.string().min(3).max(100),
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(8).max(20),
  fulfillment: z.enum(["pickup", "delivery"]),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variationId: z.string().uuid().optional(),
        quantity: z.number().int().positive().max(100),
      }),
    )
    .min(1)
    .max(100),
});

export const CreateFiscalDocumentDto = z.object({
  saleId: z.string().uuid(),
  type: z.enum(["nfce", "nfe"]),
  provider: z.string().max(80).optional(),
});

export const ReplenishmentSuggestionDto = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  variationId: z.string().uuid().nullable(),
  variationName: z.string().nullable(),
  available: z.number(),
  minimum: z.number(),
  suggestedQuantity: z.number(),
  lastCost: z.number().nullable(),
});
export type ReplenishmentSuggestion = z.infer<typeof ReplenishmentSuggestionDto>;
