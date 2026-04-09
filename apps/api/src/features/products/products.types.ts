import type { Product } from "@lucro-caseiro/contracts";

export interface IProductsRepo {
  create(userId: string, data: CreateProductData): Promise<Product>;
  findById(userId: string, id: string): Promise<Product | null>;
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
}

export interface CreateProductData {
  name: string;
  description?: string;
  category: string;
  photoUrl?: string;
  salePrice: number;
  recipeId?: string;
  stockQuantity?: number;
  stockAlertThreshold?: number;
}

export interface FindAllOpts {
  page: number;
  limit: number;
  category?: string;
  search?: string;
  activeOnly?: boolean;
}
