import type {
  BusinessAccount,
  CashMovement,
  CreateBusinessAccountDto,
  CreateRetailDocument,
  CreateRetailPromotion,
  RetailDocument,
  RetailDocumentKind,
  RetailPromotion,
  UpdateBusinessAccountDto,
  UpdateRetailDocument,
} from "@lucro-caseiro/contracts";
import type { z } from "zod";

export type CreateBusinessAccountData = z.infer<typeof CreateBusinessAccountDto>;
export type UpdateBusinessAccountData = z.infer<typeof UpdateBusinessAccountDto>;
export type RetailDocumentCreateData = Omit<CreateRetailDocument, "kind"> & {
  kind: RetailDocumentKind;
};

export interface CreateCashMovementData {
  type: "sale" | "supply" | "withdrawal" | "refund";
  paymentMethod: "pix" | "cash" | "card" | "credit" | "transfer";
  amount: number;
  referenceId?: string;
  note?: string;
}

export interface IRetailRepo {
  createDocument(
    userId: string,
    data: RetailDocumentCreateData,
    status: RetailDocument["status"],
  ): Promise<RetailDocument>;
  findDocument(userId: string, id: string): Promise<RetailDocument | null>;
  findOpenCashSession(userId: string): Promise<RetailDocument | null>;
  listDocuments(userId: string, kind: RetailDocumentKind): Promise<RetailDocument[]>;
  updateDocument(
    userId: string,
    id: string,
    data: UpdateRetailDocument,
  ): Promise<RetailDocument | null>;
  deleteDocument(userId: string, id: string): Promise<boolean>;
  createCashMovement(
    sessionId: string,
    data: CreateCashMovementData,
  ): Promise<CashMovement>;
  listCashMovements(sessionId: string): Promise<CashMovement[]>;
  createPromotion(userId: string, data: CreateRetailPromotion): Promise<RetailPromotion>;
  listPromotions(userId: string, activeAt?: Date): Promise<RetailPromotion[]>;
  updatePromotion(
    userId: string,
    id: string,
    data: Partial<CreateRetailPromotion>,
  ): Promise<RetailPromotion | null>;
  deletePromotion(userId: string, id: string): Promise<boolean>;
  createBusinessAccount(
    userId: string,
    data: CreateBusinessAccountData,
  ): Promise<BusinessAccount>;
  listBusinessAccounts(userId: string): Promise<BusinessAccount[]>;
  updateBusinessAccount(
    userId: string,
    id: string,
    data: UpdateBusinessAccountData,
  ): Promise<BusinessAccount | null>;
  incrementUsedCredit(userId: string, id: string, delta: number): Promise<boolean>;
  reservedQuantities(
    userId: string,
    excludeDocumentId?: string,
  ): Promise<Map<string, { productId: string; variationId?: string; quantity: number }>>;
  recordPriceChange(
    userId: string,
    productId: string,
    previousPrice: number,
    newPrice: number,
    reason: string,
  ): Promise<void>;
}
