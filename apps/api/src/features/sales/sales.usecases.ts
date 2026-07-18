import type { Sale, SaleStatus } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import type { IProductsRepo } from "../products/products.types";
import {
  calculateSaleTotal,
  canCancelSale,
  initialSaleStatus,
  validateSaleItems,
} from "./sales.domain";
import type {
  CreateSaleData,
  DaySummary,
  FindAllSalesOpts,
  IMaterialStockAdjuster,
  IRecipeConsumptionProvider,
  ISaleFinancePoster,
  ISalesRepo,
  SaleItemData,
  UpdateSaleData,
} from "./sales.types";

export class SalesUseCases {
  constructor(
    private repo: ISalesRepo,
    private productsRepo?: IProductsRepo,
    private recipeConsumption?: IRecipeConsumptionProvider,
    private materialStock?: IMaterialStockAdjuster,
    private financePoster?: ISaleFinancePoster,
  ) {}

  private saleDescription(sale: Sale): string {
    return sale.clientName ? `Venda — ${sale.clientName}` : "Venda";
  }

  /** Entrada no caixa para uma venda paga. Best-effort: nunca bloqueia a venda. */
  private async postIncome(userId: string, sale: Sale): Promise<void> {
    if (!this.financePoster) return;
    try {
      await this.financePoster.postSaleIncome(
        userId,
        sale.id,
        Number(sale.total),
        this.saleDescription(sale),
        sale.soldAt.slice(0, 10),
      );
    } catch {
      // O lançamento no caixa nunca deve derrubar o registro/atualização da venda.
    }
  }

  private async removeIncome(userId: string, saleId: string): Promise<void> {
    if (!this.financePoster) return;
    try {
      await this.financePoster.removeSaleIncome(userId, saleId);
    } catch {
      // best-effort
    }
  }

  /**
   * Baixa automática dos insumos da receita de cada produto vendido
   * (quantidade da receita × quantidade vendida). Best-effort: nunca bloqueia a venda.
   */
  private async consumeMaterials(userId: string, items: SaleItemData[]): Promise<void> {
    if (!this.productsRepo || !this.recipeConsumption || !this.materialStock) return;

    for (const item of items) {
      try {
        const product = await this.productsRepo.findById(userId, item.productId);
        if (!product?.recipeId) continue;

        const lines = await this.recipeConsumption.getRecipeLines(
          userId,
          product.recipeId,
        );
        for (const line of lines) {
          const delta = -(line.quantity * item.quantity);
          if (delta !== 0) {
            await this.materialStock.adjustStock(userId, line.materialId, delta);
          }
        }
      } catch {
        // Best-effort: a baixa de insumos nunca deve derrubar o registro da venda.
      }
    }
  }

  async createSale(userId: string, data: CreateSaleData): Promise<Sale> {
    const errors = validateSaleItems(data.items);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const total = calculateSaleTotal(data.items);

    // Validate and decrement stock for each product.
    // Estoque por unidades inteiras nao se aplica a produtos vendidos por peso
    // (saleUnit === "kg"): nesses casos pulamos validacao/baixa de estoque.
    if (this.productsRepo) {
      for (const item of data.items) {
        const product = await this.productsRepo.findById(userId, item.productId);
        if (product?.variations?.length) {
          const variation = product.variations.find(
            (candidate) => candidate.id === item.variationId,
          );
          if (!variation) {
            throw new ValidationError([
              `Escolha uma variacao valida para ${product.name}`,
            ]);
          }
          item.variationName = variation.name;
        }
        if (product && product.saleUnit !== "kg" && product.stockQuantity !== null) {
          if (product.stockQuantity < item.quantity) {
            throw new ValidationError([`Estoque insuficiente para ${product.name}`]);
          }
        }
      }

      for (const item of data.items) {
        const product = await this.productsRepo.findById(userId, item.productId);
        if (product && product.saleUnit !== "kg" && product.stockQuantity !== null) {
          await this.productsRepo.decrementStock(userId, item.productId, item.quantity);
        }
      }
    }

    // "credit" (fiado) nasce pendente -> aparece no Fiado; demais formas, pagas.
    const status = initialSaleStatus(data.paymentMethod);
    const sale = await this.repo.create(userId, data, total, status);
    await this.consumeMaterials(userId, data.items);
    // Venda paga já entra no caixa; fiado (pending) só quando for paga.
    if (sale.status === "paid") {
      await this.postIncome(userId, sale);
    }
    return sale;
  }

  async getById(userId: string, id: string): Promise<Sale> {
    const sale = await this.repo.findById(userId, id);
    if (!sale) {
      throw new NotFoundError("Venda não encontrada");
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
      throw new NotFoundError("Venda não encontrada");
    }

    if (existing.status === "cancelled") {
      throw new ValidationError(["Não e possível editar uma venda cancelada"]);
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
      throw new NotFoundError("Venda não encontrada");
    }

    // Se a venda está paga, re-sincroniza a entrada no caixa (total/cliente podem ter mudado).
    if (updated.status === "paid") {
      await this.removeIncome(userId, updated.id);
      await this.postIncome(userId, updated);
    }

    return updated;
  }

  async updateStatus(userId: string, id: string, status: SaleStatus): Promise<Sale> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Venda não encontrada");
    }

    if (status === "cancelled" && !canCancelSale(existing.status)) {
      throw new ValidationError(["Venda já esta cancelada"]);
    }

    const updated = await this.repo.updateStatus(userId, id, status);
    if (!updated) {
      throw new NotFoundError("Venda não encontrada");
    }

    // Fiado pago agora entra no caixa; venda paga que é cancelada sai do caixa.
    if (status === "paid" && existing.status !== "paid") {
      await this.postIncome(userId, updated);
    } else if (status === "cancelled" && existing.status === "paid") {
      await this.removeIncome(userId, updated.id);
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
