import type { Material } from "@lucro-caseiro/contracts";

export interface CreateMaterialData {
  name: string;
  unit: string;
  stockQuantity?: number;
  stockAlertThreshold?: number;
  costPerUnit?: number;
  contentPerUnit?: number | null;
  contentUnit?: string | null;
  notes?: string;
  icon?: string | null;
  supplierId?: string | null;
}

export type UpdateMaterialData = Partial<CreateMaterialData>;

export interface FindAllMaterialsOpts {
  page: number;
  limit: number;
  search?: string;
}

export interface IMaterialsRepo {
  create(userId: string, data: CreateMaterialData): Promise<Material>;
  findById(userId: string, id: string): Promise<Material | null>;
  findDuplicateByNameUnit(
    userId: string,
    name: string,
    unit: string,
    excludeId?: string,
  ): Promise<Material | null>;
  findAll(
    userId: string,
    opts: FindAllMaterialsOpts,
  ): Promise<{ items: Material[]; total: number }>;
  findLowStock(userId: string): Promise<Material[]>;
  update(userId: string, id: string, data: UpdateMaterialData): Promise<Material | null>;
  adjustStock(userId: string, id: string, delta: number): Promise<Material | null>;
  delete(userId: string, id: string): Promise<boolean>;
}
