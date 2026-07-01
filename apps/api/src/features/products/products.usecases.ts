import type { Product } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validateCompositeComponents, validateProductData } from "./products.domain";
import type {
  CreateProductData,
  FindAllOpts,
  IProductsRepo,
  IRecipeCostProvider,
} from "./products.types";

export class ProductsUseCases {
  constructor(
    private repo: IProductsRepo,
    private recipeCost?: IRecipeCostProvider,
  ) {}

  /**
   * Quando o produto tem receita, o custo real vem do `costPerUnit` da receita
   * (custo dos insumos). Caso contrário, mantém o costPrice informado.
   */
  private async resolveCostPrice(
    userId: string,
    recipeId: string | undefined,
    fallback: number | undefined,
  ): Promise<number | undefined> {
    if (recipeId && this.recipeCost) {
      const cost = await this.recipeCost.getCostPerUnit(userId, recipeId);
      if (cost != null) return cost;
    }
    return fallback;
  }

  /**
   * Valida os componentes de um produto composto (kit). Garante: regras puras de
   * dominio (>=1 componente, qty > 0, sem auto-referencia) + que cada componente
   * pertence ao usuario e NAO e composto (sem aninhamento no MVP, evita recursao).
   */
  private async validateComponents(
    userId: string,
    productId: string | undefined,
    components: CreateProductData["components"],
  ): Promise<void> {
    const list = components ?? [];

    const errors = validateCompositeComponents(productId, list);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const ids = [...new Set(list.map((c) => c.componentProductId))];
    const candidates = await this.repo.findComponentCandidates(userId, ids);
    const byId = new Map(candidates.map((c) => [c.id, c]));

    const ownershipErrors: string[] = [];
    for (const id of ids) {
      const candidate = byId.get(id);
      if (!candidate) {
        ownershipErrors.push("Algum componente não foi encontrado");
        break;
      }
    }
    if (candidates.some((c) => c.isComposite)) {
      ownershipErrors.push("Um kit não pode conter outro kit como componente");
    }

    if (ownershipErrors.length > 0) {
      throw new ValidationError(ownershipErrors);
    }
  }

  async create(userId: string, data: CreateProductData): Promise<Product> {
    const errors = validateProductData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    if (data.code?.trim()) {
      const duplicate = await this.repo.findDuplicateByCode(userId, data.code);
      if (duplicate) {
        throw new ValidationError(["Esse código já está em outro produto."]);
      }
    }

    if (data.isComposite) {
      await this.validateComponents(userId, undefined, data.components);
      // Custo do kit e calculado a partir dos componentes (no repo, na leitura).
      return this.repo.create(userId, { ...data, costPrice: undefined });
    }

    const costPrice = await this.resolveCostPrice(userId, data.recipeId, data.costPrice);
    return this.repo.create(userId, { ...data, costPrice });
  }

  async getById(userId: string, id: string): Promise<Product> {
    const product = await this.repo.findById(userId, id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado");
    }
    return product;
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
    data: Partial<CreateProductData>,
  ): Promise<Product> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Produto não encontrado");
    }

    const merged = { ...existing, ...data };
    const errors = validateProductData({
      name: merged.name,
      salePrice: merged.salePrice,
      category: merged.category,
      description: merged.description ?? undefined,
      photoUrl: merged.photoUrl ?? undefined,
      recipeId: merged.recipeId ?? undefined,
      stockQuantity: merged.stockQuantity ?? undefined,
      stockAlertThreshold: merged.stockAlertThreshold ?? undefined,
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    if (data.code !== undefined && data.code.trim()) {
      const duplicate = await this.repo.findDuplicateByCode(userId, data.code, id);
      if (duplicate) {
        throw new ValidationError(["Esse código já está em outro produto."]);
      }
    }

    // Estado final de composicao apos o merge.
    const willBeComposite = data.isComposite ?? existing.isComposite;

    // Valida os componentes quando o produto sera composto e os componentes
    // foram (re)definidos, OU quando esta virando composto agora.
    if (willBeComposite && (data.components !== undefined || data.isComposite === true)) {
      await this.validateComponents(userId, id, data.components);
    }

    const dataWithCost = { ...data };

    if (willBeComposite) {
      // Custo do kit vem dos componentes (calculado no repo na leitura).
      dataWithCost.costPrice = undefined;
    } else if (data.recipeId !== undefined) {
      // Se a receita foi (re)definida, recalcula o custo real a partir dela.
      const cost = await this.resolveCostPrice(userId, data.recipeId, data.costPrice);
      if (cost !== undefined) dataWithCost.costPrice = cost;
    }

    const updated = await this.repo.update(userId, id, dataWithCost);
    if (!updated) {
      throw new NotFoundError("Produto não encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Produto não encontrado");
    }
  }

  /** Preço médio de venda dos produtos ativos (null se não houver produtos). */
  async averageActivePrice(userId: string): Promise<number | null> {
    return this.repo.averageActivePrice(userId);
  }
}
