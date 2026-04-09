import type { Packaging } from "@lucro-caseiro/contracts";

export interface IPackagingRepo {
  create(userId: string, data: CreatePackagingData): Promise<Packaging>;
  findById(userId: string, id: string): Promise<Packaging | null>;
  findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Packaging[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: Partial<CreatePackagingData>,
  ): Promise<Packaging | null>;
  delete(userId: string, id: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
  linkToProduct(packagingId: string, productId: string): Promise<void>;
  unlinkFromProduct(packagingId: string, productId: string): Promise<boolean>;
}

export interface CreatePackagingData {
  name: string;
  type: "box" | "bag" | "pot" | "film" | "label" | "other";
  unitCost: number;
  supplier?: string;
  photoUrl?: string;
}

export interface FindAllOpts {
  page: number;
  limit: number;
  search?: string;
}
