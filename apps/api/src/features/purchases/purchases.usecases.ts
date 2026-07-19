import type { Purchase, UpdatePurchase } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { todayIso, validatePurchaseData } from "./purchases.domain";
import type { IProductsRepo } from "../products/products.types";
import type {
  CreatePurchaseData,
  CreatePurchaseRecord,
  FindAllPurchasesOpts,
  IFinancePoster,
  IPurchasesRepo,
  UpdatePurchaseData,
} from "./purchases.types";

type ResolvedPurchaseItem = NonNullable<CreatePurchaseRecord["items"]>[number];

type StockChange = ResolvedPurchaseItem & {
  delta: number;
};

export class PurchasesUseCases {
  constructor(
    private repo: IPurchasesRepo,
    private finance: IFinancePoster,
    private productsRepo?: IProductsRepo,
  ) {}

  private async resolveItems(
    userId: string,
    items: CreatePurchaseData["items"],
  ): Promise<CreatePurchaseRecord["items"]> {
    if (items === undefined) return undefined;
    if (items.length === 0) return [];
    if (!this.productsRepo) {
      throw new ValidationError(["Estoque de produtos indisponível"]);
    }

    return Promise.all(
      items.map(async (item) => {
        const product = await this.productsRepo!.findById(userId, item.productId);
        if (!product) throw new ValidationError(["Produto da compra não encontrado"]);
        const variation = product.variations?.length
          ? product.variations.find((candidate) => candidate.id === item.variationId)
          : undefined;
        if (product.variations?.length && !variation) {
          throw new ValidationError([`Escolha uma variação válida para ${product.name}`]);
        }
        return {
          ...item,
          productName: product.name,
          variationName: variation?.name ?? null,
        };
      }),
    );
  }

  private async receiveItems(
    userId: string,
    items: NonNullable<CreatePurchaseRecord["items"]>,
    updateCost = true,
  ): Promise<void> {
    if (!this.productsRepo) return;
    const received: typeof items = [];
    try {
      for (const item of items) {
        const product = await this.productsRepo.findById(userId, item.productId);
        if (!product) throw new ValidationError(["Produto da compra não encontrado"]);

        if (item.variationId) {
          const variations = product.variations ?? [];
          const index = variations.findIndex(
            (variation) => variation.id === item.variationId,
          );
          if (index < 0) {
            throw new ValidationError([`Variação de ${product.name} não encontrada`]);
          }
          const variation = variations[index]!;
          if (variation.stockQuantity === undefined) {
            const updated = await this.productsRepo.update(userId, product.id, {
              variations: variations.map((candidate, variationIndex) =>
                variationIndex === index
                  ? { ...candidate, stockQuantity: item.quantity }
                  : candidate,
              ),
              ...(updateCost ? { costPrice: item.unitCost } : {}),
            });
            if (!updated) throw new ValidationError(["Não foi possível repor o estoque"]);
          } else {
            const adjusted = await this.productsRepo.adjustStock(
              userId,
              product.id,
              item.quantity,
              item.variationId,
            );
            if (!adjusted)
              throw new ValidationError(["Não foi possível repor o estoque"]);
            if (updateCost) {
              await this.productsRepo.update(userId, product.id, {
                costPrice: item.unitCost,
              });
            }
          }
        } else if (product.stockQuantity === null) {
          const updated = await this.productsRepo.update(userId, product.id, {
            stockQuantity: item.quantity,
            ...(updateCost ? { costPrice: item.unitCost } : {}),
          });
          if (!updated) throw new ValidationError(["Não foi possível repor o estoque"]);
        } else {
          const adjusted = await this.productsRepo.adjustStock(
            userId,
            product.id,
            item.quantity,
          );
          if (!adjusted) throw new ValidationError(["Não foi possível repor o estoque"]);
          if (updateCost) {
            await this.productsRepo.update(userId, product.id, {
              costPrice: item.unitCost,
            });
          }
        }
        received.push(item);
      }
    } catch (error) {
      await this.reverseItems(userId, received, false);
      throw error;
    }
  }

  private async reverseItems(
    userId: string,
    items: ReadonlyArray<{
      productId: string;
      variationId?: string | null;
      quantity: number;
    }>,
    rejectInsufficient = true,
    insufficientMessage = "Não é possível excluir a compra porque parte do estoque já foi vendida",
  ): Promise<void> {
    if (!this.productsRepo) return;
    const reversed: (typeof items)[number][] = [];
    for (const item of items) {
      const adjusted = await this.productsRepo.adjustStock(
        userId,
        item.productId,
        -item.quantity,
        item.variationId ?? undefined,
      );
      if (!adjusted) {
        for (const rollback of reversed) {
          await this.productsRepo.adjustStock(
            userId,
            rollback.productId,
            rollback.quantity,
            rollback.variationId ?? undefined,
          );
        }
        if (rejectInsufficient) {
          throw new ValidationError([insufficientMessage]);
        }
        return;
      }
      reversed.push(item);
    }
  }

  private stockChanges(
    existing: ReadonlyArray<ResolvedPurchaseItem>,
    next: ReadonlyArray<ResolvedPurchaseItem>,
  ): StockChange[] {
    const changes = new Map<string, StockChange>();
    const add = (item: ResolvedPurchaseItem, delta: number) => {
      const key = `${item.productId}:${item.variationId ?? ""}`;
      const current = changes.get(key);
      changes.set(key, {
        ...item,
        delta: (current?.delta ?? 0) + delta,
      });
    };
    existing.forEach((item) => add(item, -item.quantity));
    next.forEach((item) => add(item, item.quantity));
    return [...changes.values()].filter((item) => item.delta !== 0);
  }

  private async restoreItems(
    userId: string,
    items: ReadonlyArray<ResolvedPurchaseItem>,
  ): Promise<void> {
    if (!this.productsRepo) return;
    for (const item of items) {
      await this.productsRepo.adjustStock(
        userId,
        item.productId,
        item.quantity,
        item.variationId ?? undefined,
      );
    }
  }

  private async applyStockChanges(
    userId: string,
    existing: ReadonlyArray<ResolvedPurchaseItem>,
    next: ReadonlyArray<ResolvedPurchaseItem>,
  ): Promise<{ decreases: ResolvedPurchaseItem[]; increases: ResolvedPurchaseItem[] }> {
    const changes = this.stockChanges(existing, next);
    const decreases = changes
      .filter((item) => item.delta < 0)
      .map((item) => ({ ...item, quantity: -item.delta }));
    const increases = changes
      .filter((item) => item.delta > 0)
      .map((item) => ({ ...item, quantity: item.delta }));

    await this.reverseItems(
      userId,
      decreases,
      true,
      "Não é possível reduzir os itens porque parte desse estoque já foi vendida",
    );
    try {
      await this.receiveItems(userId, increases, false);
    } catch (error) {
      await this.restoreItems(userId, decreases);
      throw error;
    }
    return { decreases, increases };
  }

  private async rollbackStockChanges(
    userId: string,
    changes: { decreases: ResolvedPurchaseItem[]; increases: ResolvedPurchaseItem[] },
  ): Promise<void> {
    await this.reverseItems(userId, changes.increases, false);
    await this.restoreItems(userId, changes.decreases);
  }

  private purchaseItems(purchase: Purchase): ResolvedPurchaseItem[] {
    return purchase.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      variationId: item.variationId ?? undefined,
      variationName: item.variationName,
      quantity: item.quantity,
      unitCost: item.unitCost,
    }));
  }

  async create(userId: string, data: CreatePurchaseData): Promise<Purchase> {
    const errors = validatePurchaseData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const resolvedItems = await this.resolveItems(userId, data.items);
    const amount = resolvedItems?.length
      ? resolvedItems.reduce((total, item) => total + item.quantity * item.unitCost, 0)
      : data.amount;
    const wantsPaid = data.paymentStatus === "paid";
    // Sempre cria como pending; se já vem paga, paga em seguida (gera a saída no caixa).
    const purchase = await this.repo.create(userId, {
      ...data,
      amount,
      items: resolvedItems,
      paymentStatus: "pending",
    });

    if (resolvedItems?.length) {
      try {
        await this.receiveItems(userId, resolvedItems);
      } catch (error) {
        await this.repo.delete(userId, purchase.id);
        throw error;
      }
    }

    if (wantsPaid) {
      return this.pay(userId, purchase.id, data.purchasedAt);
    }
    return purchase;
  }

  async getById(userId: string, id: string): Promise<Purchase> {
    const purchase = await this.repo.findById(userId, id);
    if (!purchase) {
      throw new NotFoundError("Compra não encontrada");
    }
    return purchase;
  }

  async list(userId: string, opts: FindAllPurchasesOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return {
      items,
      ...paginationMeta(total, opts.page, opts.limit),
    };
  }

  async update(userId: string, id: string, data: UpdatePurchase): Promise<Purchase> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) throw new NotFoundError("Compra não encontrada");
    if (existing.paymentStatus === "paid" && !existing.financeEntryId) {
      throw new ValidationError([
        "Esta compra paga não possui um lançamento financeiro vinculado",
      ]);
    }

    const existingItems = this.purchaseItems(existing);
    const resolvedItems = await this.resolveItems(userId, data.items);
    const nextItems = resolvedItems ?? existingItems;
    let amount: number | undefined;
    if (nextItems.length > 0) {
      amount = nextItems.reduce(
        (total, item) => total + item.quantity * item.unitCost,
        0,
      );
    } else if (existingItems.length > 0) {
      amount = data.amount;
    } else {
      amount = data.amount ?? existing.amount;
    }
    const merged: CreatePurchaseData = {
      supplierId: data.supplierId === undefined ? existing.supplierId : data.supplierId,
      description: data.description ?? existing.description,
      amount,
      items: nextItems.map((item) => ({
        productId: item.productId,
        ...(item.variationId ? { variationId: item.variationId } : {}),
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      category: data.category ?? existing.category,
      purchasedAt: data.purchasedAt ?? existing.purchasedAt,
      dueDate: data.dueDate === undefined ? existing.dueDate : data.dueDate,
    };
    const errors = validatePurchaseData(merged);
    if (errors.length > 0) throw new ValidationError(errors);

    const stockChanges = await this.applyStockChanges(userId, existingItems, nextItems);
    const updateData: UpdatePurchaseData = {
      supplierId: data.supplierId,
      description: data.description,
      amount: amount!,
      category: data.category,
      purchasedAt: data.purchasedAt,
      dueDate: data.dueDate,
      ...(data.items === undefined ? {} : { items: nextItems }),
    };
    let updated: Purchase | null = null;
    try {
      updated = await this.repo.update(userId, id, updateData);
      if (!updated) throw new NotFoundError("Compra não encontrada");

      if (existing.paymentStatus === "paid") {
        await this.finance.updateFromPurchase(
          userId,
          existing.financeEntryId!,
          updated.amount,
          `Compra: ${updated.description}`,
          existing.paidAt ?? existing.purchasedAt,
          updated.category,
        );
      }
      return updated;
    } catch (error) {
      if (updated) {
        await this.repo.update(userId, id, {
          supplierId: existing.supplierId,
          description: existing.description,
          amount: existing.amount,
          items: existingItems,
          category: existing.category,
          purchasedAt: existing.purchasedAt,
          dueDate: existing.dueDate,
        });
      }
      await this.rollbackStockChanges(userId, stockChanges);
      throw error;
    }
  }

  /**
   * Marca a compra como paga: cria o lançamento de despesa no caixa e guarda o id.
   * Idempotente — se já está paga, não lança de novo.
   */
  async pay(userId: string, id: string, paidDate?: string): Promise<Purchase> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Compra não encontrada");
    }
    if (existing.paymentStatus === "paid") {
      return existing;
    }

    const date = paidDate ?? todayIso();
    const entry = await this.finance.createFromPurchase(
      userId,
      existing.amount,
      `Compra: ${existing.description}`,
      date,
      existing.category,
    );

    const updated = await this.repo.update(userId, id, {
      paymentStatus: "paid",
      paidAt: date,
      financeEntryId: entry.id,
    });
    if (!updated) {
      throw new NotFoundError("Compra não encontrada");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) throw new NotFoundError("Compra não encontrada");
    if (existing.items.length) {
      await this.reverseItems(userId, existing.items);
    }
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Compra não encontrada");
    }
  }
}
