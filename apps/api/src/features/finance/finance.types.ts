import type { FinanceEntry, FinanceSummary } from "@lucro-caseiro/contracts";

export interface IFinanceRepo {
  create(userId: string, data: CreateFinanceEntryData): Promise<FinanceEntry>;
  findById(userId: string, id: string): Promise<FinanceEntry | null>;
  findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: FinanceEntry[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: Partial<CreateFinanceEntryData>,
  ): Promise<FinanceEntry | null>;
  delete(userId: string, id: string): Promise<boolean>;
  getSummary(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Omit<FinanceSummary, "period">>;
}

export interface CreateFinanceEntryData {
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  saleId?: string;
}

export interface FindAllOpts {
  page: number;
  limit: number;
  type?: "income" | "expense";
  category?: string;
  startDate?: string;
  endDate?: string;
}
