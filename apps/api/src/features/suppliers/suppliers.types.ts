import type { Supplier } from "@lucro-caseiro/contracts";

export interface ISuppliersRepo {
  create(userId: string, data: CreateSupplierData): Promise<Supplier>;
  findById(userId: string, id: string): Promise<Supplier | null>;
  findDuplicate(
    userId: string,
    data: Pick<CreateSupplierData, "name" | "phone" | "email">,
    excludeId?: string,
  ): Promise<Supplier | null>;
  findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Supplier[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: Partial<CreateSupplierData>,
  ): Promise<Supplier | null>;
  delete(userId: string, id: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
}

export interface CreateSupplierData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface FindAllOpts {
  page: number;
  limit: number;
  search?: string;
}
