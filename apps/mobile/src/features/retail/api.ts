import type {
  BusinessAccount,
  CashSessionSummary,
  CreateRetailDocument,
  CreateRetailPromotion,
  ReplenishmentSuggestion,
  RetailDocument,
  RetailDocumentKind,
  RetailPromotion,
  UpdateRetailDocument,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/retail";

export interface RetailCheckoutInput {
  sessionId: string;
  catalogOrderId?: string;
  items: Array<{ productId: string; variationId?: string; quantity: number }>;
  payments: Array<{
    method: "pix" | "cash" | "card" | "credit" | "transfer";
    amount: number;
  }>;
  manualDiscount?: number;
  clientId?: string;
  businessAccountId?: string;
  requestFiscalDocument?: boolean;
}

export type RetailCheckoutQuoteInput = Omit<
  RetailCheckoutInput,
  "sessionId" | "payments" | "requestFiscalDocument"
>;

export function fetchRetailDocuments(token: string, kind: RetailDocumentKind) {
  return apiClient<RetailDocument[]>(`${BASE}/documents?kind=${kind}`, { token });
}

export function createRetailDocument(token: string, data: CreateRetailDocument) {
  return apiClient<RetailDocument>(`${BASE}/documents`, {
    method: "POST",
    token,
    body: data,
  });
}

export function updateRetailDocument(
  token: string,
  id: string,
  data: UpdateRetailDocument,
) {
  return apiClient<RetailDocument>(`${BASE}/documents/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function fetchCashSession(token: string) {
  return apiClient<CashSessionSummary | null>(`${BASE}/cash/current`, { token });
}

export function openCashSession(token: string, openingFloat: number) {
  return apiClient<CashSessionSummary>(`${BASE}/cash/open`, {
    method: "POST",
    token,
    body: { openingFloat },
  });
}

export function closeCashSession(token: string, countedCash: number) {
  return apiClient<CashSessionSummary>(`${BASE}/cash/close`, {
    method: "POST",
    token,
    body: { countedCash },
  });
}

export function createCashMovement(
  token: string,
  data: {
    type: "supply" | "withdrawal";
    paymentMethod: "cash";
    amount: number;
    note?: string;
  },
) {
  return apiClient<CashSessionSummary>(`${BASE}/cash/movements`, {
    method: "POST",
    token,
    body: data,
  });
}

export function retailCheckout(token: string, data: RetailCheckoutInput) {
  return apiClient<{ sale: { id: string; total: number }; discount: number }>(
    `${BASE}/checkout`,
    {
      method: "POST",
      token,
      body: data,
    },
  );
}

export function quoteRetailCheckout(token: string, data: RetailCheckoutQuoteInput) {
  return apiClient<{ total: number; discount: number; originalTotal: number }>(
    `${BASE}/checkout/quote`,
    { method: "POST", token, body: data },
  );
}

export function fetchReplenishment(token: string) {
  return apiClient<ReplenishmentSuggestion[]>(`${BASE}/replenishment`, { token });
}

export function createPurchaseOrderFromReplenishment(token: string, supplierId?: string) {
  return apiClient<RetailDocument>(`${BASE}/purchase-orders/from-replenishment`, {
    method: "POST",
    token,
    body: supplierId ? { supplierId } : {},
  });
}

export function finalizeInventory(token: string, id: string) {
  return apiClient<RetailDocument>(`${BASE}/inventory/${id}/finalize`, {
    method: "POST",
    token,
  });
}

export function fetchPromotions(token: string) {
  return apiClient<RetailPromotion[]>(`${BASE}/promotions`, { token });
}

export function createPromotion(token: string, data: CreateRetailPromotion) {
  return apiClient<RetailPromotion>(`${BASE}/promotions`, {
    method: "POST",
    token,
    body: data,
  });
}

export function bulkUpdatePrices(
  token: string,
  data: {
    category?: string;
    productIds?: string[];
    percentage?: number;
    markupOnCost?: number;
  },
) {
  return apiClient<{ updated: number }>(`${BASE}/prices/bulk`, {
    method: "POST",
    token,
    body: data,
  });
}

export function fetchBatchLabels(
  token: string,
  data: { productIds: string[]; template: "product" | "shelf" },
) {
  return apiClient<{ html: string }>(`${BASE}/labels/batch`, {
    method: "POST",
    token,
    body: data,
  });
}

export function fetchBusinessAccounts(token: string) {
  return apiClient<BusinessAccount[]>(`${BASE}/business-accounts`, { token });
}

export function createBusinessAccount(
  token: string,
  data: {
    clientId: string;
    kind: "school" | "company" | "office" | "agreement";
    legalName: string;
    creditLimit?: number;
    dueDays?: number;
    discountPercent?: number;
  },
) {
  return apiClient<BusinessAccount>(`${BASE}/business-accounts`, {
    method: "POST",
    token,
    body: data,
  });
}
