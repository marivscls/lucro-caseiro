import type {
  FinanceEntry,
  FinanceSummary,
  RecurringExpense,
} from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import {
  calculateProfit,
  recurringEntryDate,
  validateFinanceEntry,
  validateRecurringExpense,
} from "./finance.domain";
import type {
  CreateFinanceEntryData,
  CreateRecurringExpenseData,
  FinanceCategory,
  FindAllOpts,
  IFinanceRepo,
} from "./finance.types";

export class FinanceUseCases {
  constructor(private repo: IFinanceRepo) {}

  async create(userId: string, data: CreateFinanceEntryData): Promise<FinanceEntry> {
    const errors = validateFinanceEntry(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<FinanceEntry> {
    const entry = await this.repo.findById(userId, id);
    if (!entry) {
      throw new NotFoundError("Lançamento não encontrado");
    }
    return entry;
  }

  async list(userId: string, opts: FindAllOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return {
      items,
      ...paginationMeta(total, opts.page, opts.limit),
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateFinanceEntryData>,
  ): Promise<FinanceEntry> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Lançamento não encontrado");
    }

    const merged: CreateFinanceEntryData = {
      type: data.type ?? existing.type,
      category: data.category ?? existing.category,
      amount: data.amount ?? existing.amount,
      description: data.description ?? existing.description,
      isFixed: data.isFixed ?? existing.isFixed,
      date: data.date ?? existing.date,
    };

    const errors = validateFinanceEntry(merged);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Lançamento não encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Lançamento não encontrado");
    }
  }

  async getMonthlySummary(
    userId: string,
    month: number,
    year: number,
  ): Promise<FinanceSummary> {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Ao abrir o mês corrente, materializa os gastos recorrentes que ainda não
    // caíram (idempotente). Só o mês corrente para não gerar em meses passados/futuros.
    const now = new Date();
    if (month === now.getMonth() + 1 && year === now.getFullYear()) {
      await this.applyDueRecurring(userId, year, month);
    }

    const summary = await this.repo.getSummary(userId, startDate, endDate);

    return {
      ...summary,
      profit: calculateProfit(summary.totalIncome, summary.totalExpenses),
      period: `${year}-${String(month).padStart(2, "0")}`,
    };
  }

  async createFromSale(
    userId: string,
    saleId: string,
    amount: number,
    description: string,
    date: string,
  ): Promise<FinanceEntry> {
    return this.repo.create(userId, {
      type: "income",
      category: "sale",
      amount,
      description,
      date,
      saleId,
    });
  }

  // Venda → caixa (entrada). Idempotente: se já existe lançamento para a venda,
  // não cria outro. Usado quando uma venda é paga (na criação ou no fiado→pago).
  async postSaleIncome(
    userId: string,
    saleId: string,
    amount: number,
    description: string,
    date: string,
  ): Promise<void> {
    const existing = await this.repo.findBySaleId(userId, saleId);
    if (existing) return;
    await this.createFromSale(userId, saleId, amount, description, date);
  }

  // Remove a entrada de uma venda (cancelamento de venda paga).
  async removeSaleIncome(userId: string, saleId: string): Promise<void> {
    await this.repo.deleteBySaleId(userId, saleId);
  }

  // Lançamento de despesa gerado quando uma compra de fornecedor é paga.
  // A `purchases` feature guarda o id retornado para idempotência.
  async createFromPurchase(
    userId: string,
    amount: number,
    description: string,
    date: string,
    category: FinanceCategory,
  ): Promise<FinanceEntry> {
    return this.repo.create(userId, {
      type: "expense",
      category,
      amount,
      description,
      date,
    });
  }

  // --- Gastos recorrentes ---

  async createRecurring(
    userId: string,
    data: CreateRecurringExpenseData,
  ): Promise<RecurringExpense> {
    const errors = validateRecurringExpense(data);
    if (errors.length > 0) throw new ValidationError(errors);
    return this.repo.createRecurring(userId, data);
  }

  async listRecurring(userId: string): Promise<RecurringExpense[]> {
    return this.repo.findAllRecurring(userId);
  }

  async updateRecurring(
    userId: string,
    id: string,
    data: Partial<CreateRecurringExpenseData> & { active?: boolean },
  ): Promise<RecurringExpense> {
    const existing = await this.repo.findRecurringById(userId, id);
    if (!existing) throw new NotFoundError("Gasto recorrente não encontrado");

    const errors = validateRecurringExpense({
      amount: data.amount ?? existing.amount,
      description: data.description ?? existing.description,
      dayOfMonth: data.dayOfMonth ?? existing.dayOfMonth,
    });
    if (errors.length > 0) throw new ValidationError(errors);

    const updated = await this.repo.updateRecurring(userId, id, data);
    if (!updated) throw new NotFoundError("Gasto recorrente não encontrado");
    return updated;
  }

  async removeRecurring(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.deleteRecurring(userId, id);
    if (!deleted) throw new NotFoundError("Gasto recorrente não encontrado");
  }

  /**
   * Materializa, no mês dado, os gastos recorrentes ativos que ainda não geraram
   * lançamento. Idempotente: cada recorrência cai no máximo uma vez por mês
   * (checado por `recurringExpenseId` no intervalo).
   */
  async applyDueRecurring(userId: string, year: number, month: number): Promise<void> {
    const active = await this.repo.findActiveRecurring(userId);
    if (active.length === 0) return;

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const generated = new Set(
      await this.repo.findGeneratedRecurringIds(userId, startDate, endDate),
    );

    for (const r of active) {
      if (generated.has(r.id)) continue;
      await this.repo.create(userId, {
        type: "expense",
        category: r.category,
        amount: r.amount,
        description: r.description,
        date: recurringEntryDate(year, month, r.dayOfMonth),
        isFixed: true,
        recurringExpenseId: r.id,
      });
    }
  }
}
