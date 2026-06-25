import type { Purchase } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { todayIso, validatePurchaseData } from "./purchases.domain";
import type {
  CreatePurchaseData,
  FindAllPurchasesOpts,
  IFinancePoster,
  IPurchasesRepo,
} from "./purchases.types";

export class PurchasesUseCases {
  constructor(
    private repo: IPurchasesRepo,
    private finance: IFinancePoster,
  ) {}

  async create(userId: string, data: CreatePurchaseData): Promise<Purchase> {
    const errors = validatePurchaseData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const wantsPaid = data.paymentStatus === "paid";
    // Sempre cria como pending; se já vem paga, paga em seguida (gera a saída no caixa).
    const purchase = await this.repo.create(userId, {
      ...data,
      paymentStatus: "pending",
    });

    if (wantsPaid) {
      return this.pay(userId, purchase.id, data.purchasedAt);
    }
    return purchase;
  }

  async getById(userId: string, id: string): Promise<Purchase> {
    const purchase = await this.repo.findById(userId, id);
    if (!purchase) {
      throw new NotFoundError("Compra não encontrada");
    }
    return purchase;
  }

  async list(userId: string, opts: FindAllPurchasesOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return {
      items,
      ...paginationMeta(total, opts.page, opts.limit),
    };
  }

  /**
   * Marca a compra como paga: cria o lançamento de despesa no caixa e guarda o id.
   * Idempotente — se já está paga, não lança de novo.
   */
  async pay(userId: string, id: string, paidDate?: string): Promise<Purchase> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Compra não encontrada");
    }
    if (existing.paymentStatus === "paid") {
      return existing;
    }

    const date = paidDate ?? todayIso();
    const entry = await this.finance.createFromPurchase(
      userId,
      existing.amount,
      `Compra: ${existing.description}`,
      date,
      existing.category,
    );

    const updated = await this.repo.update(userId, id, {
      paymentStatus: "paid",
      paidAt: date,
      financeEntryId: entry.id,
    });
    if (!updated) {
      throw new NotFoundError("Compra não encontrada");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Compra não encontrada");
    }
  }
}
