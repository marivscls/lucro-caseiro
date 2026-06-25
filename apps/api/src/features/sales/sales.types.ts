import type { Sale, SaleStatus } from "@lucro-caseiro/contracts";

export interface SaleItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleData {
  clientId?: string;
  paymentMethod: string;
  items: SaleItemData[];
  notes?: string;
  soldAt?: string;
}

export interface UpdateSaleData {
  clientId?: string;
  paymentMethod?: string;
  items?: SaleItemData[];
  notes?: string;
}

export interface FindAllSalesOpts {
  page: number;
  limit: number;
  status?: SaleStatus;
  clientId?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DaySummary {
  totalSales: number;
  totalAmount: number;
  averageTicket: number;
}

export interface RecipeConsumptionLine {
  materialId: string;
  quantity: number;
}

/** Fonte das linhas de insumo de uma receita (injetada da feature recipes). */
export interface IRecipeConsumptionProvider {
  getRecipeLines(userId: string, recipeId: string): Promise<RecipeConsumptionLine[]>;
}

/** Ajuste de estoque de insumo (injetado da feature materials). delta negativo = consumo. */
export interface IMaterialStockAdjuster {
  adjustStock(userId: string, materialId: string, delta: number): Promise<void>;
}

/** Porta para o caixa (injetada da feature finance): venda paga → entrada. */
export interface ISaleFinancePoster {
  postSaleIncome(
    userId: string,
    saleId: string,
    amount: number,
    description: string,
    date: string,
  ): Promise<void>;
  removeSaleIncome(userId: string, saleId: string): Promise<void>;
}

export interface ISalesRepo {
  create(
    userId: string,
    data: CreateSaleData,
    total: number,
    status: SaleStatus,
  ): Promise<Sale>;
  findById(userId: string, id: string): Promise<Sale | null>;
  findAll(
    userId: string,
    opts: FindAllSalesOpts,
  ): Promise<{ items: Sale[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: UpdateSaleData,
    total: number,
  ): Promise<Sale | null>;
  updateStatus(userId: string, id: string, status: SaleStatus): Promise<Sale | null>;
  countByUserInMonth(userId: string, year: number, month: number): Promise<number>;
  getDaySummary(userId: string, date: string): Promise<DaySummary>;
}
