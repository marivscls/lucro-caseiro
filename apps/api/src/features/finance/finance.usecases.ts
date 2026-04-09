import type { FinanceEntry, FinanceSummary } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { calculateProfit, validateFinanceEntry } from "./finance.domain";
import type { CreateFinanceEntryData, FindAllOpts, IFinanceRepo } from "./finance.types";

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
      throw new NotFoundError("Lancamento nao encontrado");
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
      throw new NotFoundError("Lancamento nao encontrado");
    }

    const merged: CreateFinanceEntryData = {
      type: data.type ?? existing.type,
      category: data.category ?? existing.category,
      amount: data.amount ?? existing.amount,
      description: data.description ?? existing.description,
      date: data.date ?? existing.date,
    };

    const errors = validateFinanceEntry(merged);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Lancamento nao encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Lancamento nao encontrado");
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
}
