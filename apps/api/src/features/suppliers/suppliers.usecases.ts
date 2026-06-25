import type { Supplier } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validateSupplierData } from "./suppliers.domain";
import type { CreateSupplierData, FindAllOpts, ISuppliersRepo } from "./suppliers.types";

export class SuppliersUseCases {
  constructor(private repo: ISuppliersRepo) {}

  async create(userId: string, data: CreateSupplierData): Promise<Supplier> {
    const errors = validateSupplierData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Supplier> {
    const supplier = await this.repo.findById(userId, id);
    if (!supplier) {
      throw new NotFoundError("Fornecedor não encontrado");
    }
    return supplier;
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
    data: Partial<CreateSupplierData>,
  ): Promise<Supplier> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Fornecedor não encontrado");
    }

    const merged = { ...existing, ...data };
    const errors = validateSupplierData({
      name: merged.name,
      phone: merged.phone ?? undefined,
      email: merged.email ?? undefined,
      address: merged.address ?? undefined,
      notes: merged.notes ?? undefined,
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Fornecedor não encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Fornecedor não encontrado");
    }
  }
}
