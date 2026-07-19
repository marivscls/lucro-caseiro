import type { FinanceEntry, Purchase, PurchaseItemInput } from "@lucro-caseiro/contracts";

export type PurchaseCategory =
  | "sale"
  | "material"
  | "packaging"
  | "transport"
  | "fee"
  | "utility"
  | "other";

export interface CreatePurchaseData {
  supplierId?: string | null;
  description: string;
  amount?: number;
  items?: PurchaseItemInput[];
  category?: PurchaseCategory;
  paymentStatus?: "pending" | "paid";
  purchasedAt: string;
  dueDate?: string | null;
}

export interface CreatePurchaseRecord extends Omit<CreatePurchaseData, "items"> {
  items?: Array<
    PurchaseItemInput & {
      productName: string;
      variationName?: string | null;
    }
  >;
}

export interface UpdatePurchaseData {
  supplierId?: string | null;
  description?: string;
  amount?: number;
  items?: CreatePurchaseRecord["items"];
  category?: PurchaseCategory;
  purchasedAt?: string;
  dueDate?: string | null;
  paymentStatus?: "pending" | "paid";
  paidAt?: string | null;
  financeEntryId?: string | null;
}

export interface FindAllPurchasesOpts {
  page: number;
  limit: number;
  status?: "pending" | "paid";
}

export interface IPurchasesRepo {
  create(userId: string, data: CreatePurchaseRecord): Promise<Purchase>;
  findById(userId: string, id: string): Promise<Purchase | null>;
  findAll(
    userId: string,
    opts: FindAllPurchasesOpts,
  ): Promise<{ items: Purchase[]; total: number }>;
  update(userId: string, id: string, data: UpdatePurchaseData): Promise<Purchase | null>;
  delete(userId: string, id: string): Promise<boolean>;
}

// Porta estreita para o caixa (finance), injetada nos usecases — mantém o
// acoplamento explícito e testável sem depender da feature inteira.
export interface IFinancePoster {
  createFromPurchase(
    userId: string,
    amount: number,
    description: string,
    date: string,
    category: PurchaseCategory,
  ): Promise<FinanceEntry>;
  updateFromPurchase(
    userId: string,
    entryId: string,
    amount: number,
    description: string,
    date: string,
    category: PurchaseCategory,
  ): Promise<FinanceEntry>;
}
