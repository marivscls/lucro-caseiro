import type {
  Product,
  ProductComponentInput,
  ProductVariationInput,
  SaleUnit,
} from "@lucro-caseiro/contracts";

/** Dados minimos de um candidato a componente (para validar pertencimento/tipo). */
export interface ComponentCandidate {
  id: string;
  isComposite: boolean;
}

export interface IProductsRepo {
  create(userId: string, data: CreateProductData): Promise<Product>;
  findById(userId: string, id: string): Promise<Product | null>;
  findDuplicateByCode(
    userId: string,
    code: string,
    excludeId?: string,
  ): Promise<Product | null>;
  findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Product[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: Partial<CreateProductData>,
  ): Promise<Product | null>;
  delete(userId: string, id: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
  decrementStock(userId: string, productId: string, quantity: number): Promise<void>;
  adjustStock(
    userId: string,
    productId: string,
    delta: number,
    variationId?: string,
  ): Promise<boolean>;
  averageActivePrice(userId: string): Promise<number | null>;
  /**
   * Busca, dentre os produtos do usuario, os que estao na lista de ids.
   * Usado para validar que os componentes pertencem ao usuario e nao sao compostos.
   */
  findComponentCandidates(userId: string, ids: string[]): Promise<ComponentCandidate[]>;
}

/** Fonte do custo real de uma receita (injetada da feature recipes, sem importar internals). */
export interface IRecipeCostProvider {
  getCostPerUnit(userId: string, recipeId: string): Promise<number | null>;
}

export interface CreateProductData {
  name: string;
  description?: string;
  category: string;
  photoUrl?: string;
  extraPhotos?: string[];
  code?: string;
  salePrice: number;
  saleUnit?: SaleUnit;
  costPrice?: number;
  recipeId?: string;
  stockQuantity?: number;
  stockAlertThreshold?: number;
  isComposite?: boolean;
  components?: ProductComponentInput[];
  variations?: ProductVariationInput[];
}

export interface FindAllOpts {
  page: number;
  limit: number;
  category?: string;
  search?: string;
  isComposite?: boolean;
  activeOnly?: boolean;
}
