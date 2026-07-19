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

  private async collectStockChanges(
    userId: string,
    items: SaleItemData[],
    multiplier: 1 | -1,
  ): Promise<Array<{ productId: string; variationId?: string; delta: number }>> {
    if (!this.productsRepo) return [];
    const changes = new Map<
      string,
      { productId: string; variationId?: string; delta: number }
    >();

    for (const item of items) {
      const product = await this.productsRepo.findById(userId, item.productId);
      if (!product) {
        if (multiplier < 0) {
          throw new ValidationError(["Produto da venda não foi encontrado"]);
        }
        continue;
      }
      if (product.saleUnit === "kg") continue;

      let variationId: string | undefined;
      if (product.variations?.length) {
        const variation = product.variations.find(
          (candidate) => candidate.id === item.variationId,
        );
        if (!variation) {
          if (multiplier < 0) {
            throw new ValidationError([
              `Escolha uma variação válida para ${product.name}`,
            ]);
          }
          // Venda histórica sem variação: não há como adivinhar onde devolver.
          continue;
        }
        item.variationName = variation.name;
        if (variation.stockQuantity === undefined) continue;
        variationId = variation.id;
      } else if (product.stockQuantity === null) {
        continue;
      }

      const key = `${item.productId}:${variationId ?? "produto"}`;
      const current = changes.get(key);
      const delta = item.quantity * multiplier;
      changes.set(key, {
        productId: item.productId,
        ...(variationId ? { variationId } : {}),
        delta: (current?.delta ?? 0) + delta,
      });
    }

    return [...changes.values()].filter((change) => change.delta !== 0);
  }

  private mergeStockChanges(
    ...groups: Array<Array<{ productId: string; variationId?: string; delta: number }>>
  ): Array<{ productId: string; variationId?: string; delta: number }> {
    const merged = new Map<
      string,
      { productId: string; variationId?: string; delta: number }
    >();
    for (const group of groups) {
      for (const change of group) {
        const key = `${change.productId}:${change.variationId ?? "produto"}`;
        const current = merged.get(key);
        merged.set(key, {
          ...change,
          delta: (current?.delta ?? 0) + change.delta,
        });
      }
    }
    return [...merged.values()].filter((change) => change.delta !== 0);
  }

  private async validateStockChanges(
    userId: string,
    changes: Array<{ productId: string; variationId?: string; delta: number }>,
  ): Promise<void> {
    if (!this.productsRepo) return;
    for (const change of changes) {
      if (change.delta >= 0) continue;
      const product = await this.productsRepo.findById(userId, change.productId);
      if (!product) throw new ValidationError(["Produto da venda não foi encontrado"]);
      const available = change.variationId
        ? product.variations?.find((variation) => variation.id === change.variationId)
            ?.stockQuantity
        : product.stockQuantity;
      if (available !== undefined && available !== null && available + change.delta < 0) {
        const variation = change.variationId
          ? product.variations?.find((item) => item.id === change.variationId)?.name
          : undefined;
        const variationLabel = variation ? ` — ${variation}` : "";
        throw new ValidationError([
          `Estoque insuficiente para ${product.name}${variationLabel}`,
        ]);
      }
    }
  }

  private async applyStockChanges(
    userId: string,
    changes: Array<{ productId: string; variationId?: string; delta: number }>,
  ): Promise<void> {
    if (!this.productsRepo) return;
    for (const change of changes) {
      const adjusted = await this.productsRepo.adjustStock(
        userId,
        change.productId,
        change.delta,
        change.variationId,
      );
      if (!adjusted) {
        throw new ValidationError(["Não foi possível atualizar o estoque da venda"]);
      }
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

    const stockChanges = await this.collectStockChanges(userId, data.items, -1);
    await this.validateStockChanges(userId, stockChanges);
    await this.applyStockChanges(userId, stockChanges);

    // "credit" (fiado) nasce pendente -> aparece no Fiado; demais formas, pagas.
    const status = initialSaleStatus(data.paymentMethod);
    let sale: Sale;
    try {
      sale = await this.repo.create(userId, data, total, status);
    } catch (error) {
      await this.applyStockChanges(
        userId,
        stockChanges.map((change) => ({ ...change, delta: -change.delta })),
      );
      throw error;
    }
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
        ...(i.variationId ? { variationId: i.variationId } : {}),
        ...(i.variationName ? { variationName: i.variationName } : {}),
      }));

    if (data.items) {
      const errors = validateSaleItems(data.items);
      if (errors.length > 0) {
        throw new ValidationError(errors);
      }
    }

    const total = calculateSaleTotal(items);

    const stockChanges = data.items
      ? this.mergeStockChanges(
          await this.collectStockChanges(
            userId,
            existing.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              ...(item.variationId ? { variationId: item.variationId } : {}),
              ...(item.variationName ? { variationName: item.variationName } : {}),
            })),
            1,
          ),
          await this.collectStockChanges(userId, data.items, -1),
        )
      : [];
    await this.validateStockChanges(userId, stockChanges);
    await this.applyStockChanges(userId, stockChanges);

    let updated: Sale | null;
    try {
      updated = await this.repo.update(userId, id, data, total);
    } catch (error) {
      await this.applyStockChanges(
        userId,
        stockChanges.map((change) => ({ ...change, delta: -change.delta })),
      );
      throw error;
    }
    if (!updated) {
      await this.applyStockChanges(
        userId,
        stockChanges.map((change) => ({ ...change, delta: -change.delta })),
      );
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

    const restoreChanges =
      status === "cancelled"
        ? await this.collectStockChanges(
            userId,
            existing.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              ...(item.variationId ? { variationId: item.variationId } : {}),
              ...(item.variationName ? { variationName: item.variationName } : {}),
            })),
            1,
          )
        : [];
    await this.applyStockChanges(userId, restoreChanges);

    let updated: Sale | null;
    try {
      updated = await this.repo.updateStatus(userId, id, status);
    } catch (error) {
      await this.applyStockChanges(
        userId,
        restoreChanges.map((change) => ({ ...change, delta: -change.delta })),
      );
      throw error;
    }
    if (!updated) {
      await this.applyStockChanges(
        userId,
        restoreChanges.map((change) => ({ ...change, delta: -change.delta })),
      );
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
