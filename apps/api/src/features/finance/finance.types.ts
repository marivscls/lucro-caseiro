import type {
  FinanceEntry,
  FinanceSummary,
  RecurringExpense,
} from "@lucro-caseiro/contracts";

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

  // --- Gastos recorrentes ---
  createRecurring(
    userId: string,
    data: CreateRecurringExpenseData,
  ): Promise<RecurringExpense>;
  findAllRecurring(userId: string): Promise<RecurringExpense[]>;
  findRecurringById(userId: string, id: string): Promise<RecurringExpense | null>;
  updateRecurring(
    userId: string,
    id: string,
    data: Partial<CreateRecurringExpenseData> & { active?: boolean },
  ): Promise<RecurringExpense | null>;
  deleteRecurring(userId: string, id: string): Promise<boolean>;
  /** Recorrências ativas do usuário (para gerar os lançamentos do mês). */
  findActiveRecurring(userId: string): Promise<RecurringExpense[]>;
  /** Ids de recorrências que já geraram lançamento no intervalo (idempotência). */
  findGeneratedRecurringIds(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<string[]>;
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
  /** Quando o lançamento foi gerado por um gasto recorrente. */
  recurringExpenseId?: string;
}

export interface CreateRecurringExpenseData {
  category: FinanceCategory;
  amount: number;
  description: string;
  dayOfMonth: number;
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
