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
  /** Lançamento de entrada vinculado a uma venda (idempotência de venda→caixa). */
  findBySaleId(userId: string, saleId: string): Promise<FinanceEntry | null>;
  deleteBySaleId(userId: string, saleId: string): Promise<boolean>;
  getSummary(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Omit<FinanceSummary, "period">>;
}

export type FinanceCategory =
  | "sale"
  | "material"
  | "packaging"
  | "transport"
  | "fee"
  | "utility"
  | "other";

export interface CreateFinanceEntryData {
  type: "income" | "expense";
  category: FinanceCategory;
  amount: number;
  description: string;
  date: string;
  /** Apenas para despesas: fixo (recorrente) x variavel. Default false. */
  isFixed?: boolean;
  saleId?: string;
}

export interface FindAllOpts {
  page: number;
  limit: number;
  type?: "income" | "expense";
  category?: FinanceCategory;
  isFixed?: boolean;
  startDate?: string;
  endDate?: string;
}
