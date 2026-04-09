import type { Sale, SaleStatus } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import type { IProductsRepo } from "../products/products.types";
import { calculateSaleTotal, canCancelSale, validateSaleItems } from "./sales.domain";
import type {
  CreateSaleData,
  DaySummary,
  FindAllSalesOpts,
  ISalesRepo,
  UpdateSaleData,
} from "./sales.types";

export class SalesUseCases {
  constructor(
    private repo: ISalesRepo,
    private productsRepo?: IProductsRepo,
  ) {}

  async createSale(userId: string, data: CreateSaleData): Promise<Sale> {
    const errors = validateSaleItems(data.items);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const total = calculateSaleTotal(data.items);

    // Validate and decrement stock for each product
    if (this.productsRepo) {
      for (const item of data.items) {
        const product = await this.productsRepo.findById(userId, item.productId);
        if (product && product.stockQuantity !== null) {
          if (product.stockQuantity < item.quantity) {
            throw new ValidationError([`Estoque insuficiente para ${product.name}`]);
          }
        }
      }

      for (const item of data.items) {
        const product = await this.productsRepo.findById(userId, item.productId);
        if (product && product.stockQuantity !== null) {
          await this.productsRepo.decrementStock(userId, item.productId, item.quantity);
        }
      }
    }

    return this.repo.create(userId, data, total);
  }

  async getById(userId: string, id: string): Promise<Sale> {
    const sale = await this.repo.findById(userId, id);
    if (!sale) {
      throw new NotFoundError("Venda nao encontrada");
    }
    return sale;
  }

  async list(userId: string, opts: FindAllSalesOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return {
      items,
      ...paginationMeta(total, opts.page, opts.limit),
    };
  }

  async updateSale(userId: string, id: string, data: UpdateSaleData): Promise<Sale> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Venda nao encontrada");
    }

    if (existing.status === "cancelled") {
      throw new ValidationError(["Nao e possivel editar uma venda cancelada"]);
    }

    const items =
      data.items ??
      existing.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }));

    if (data.items) {
      const errors = validateSaleItems(data.items);
      if (errors.length > 0) {
        throw new ValidationError(errors);
      }
    }

    const total = calculateSaleTotal(items);

    const updated = await this.repo.update(userId, id, data, total);
    if (!updated) {
      throw new NotFoundError("Venda nao encontrada");
    }
    return updated;
  }

  async updateStatus(userId: string, id: string, status: SaleStatus): Promise<Sale> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Venda nao encontrada");
    }

    if (status === "cancelled" && !canCancelSale(existing.status)) {
      throw new ValidationError(["Venda ja esta cancelada"]);
    }

    const updated = await this.repo.updateStatus(userId, id, status);
    if (!updated) {
      throw new NotFoundError("Venda nao encontrada");
    }
    return updated;
  }

  async getDaySummary(userId: string, date: string): Promise<DaySummary> {
    return this.repo.getDaySummary(userId, date);
  }

  async countThisMonth(userId: string): Promise<number> {
    const now = new Date();
    return this.repo.countByUserInMonth(userId, now.getFullYear(), now.getMonth() + 1);
  }
}
