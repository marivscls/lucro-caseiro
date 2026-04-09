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

export interface ISalesRepo {
  create(userId: string, data: CreateSaleData, total: number): Promise<Sale>;
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
