import type { Packaging } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validatePackagingData } from "./packaging.domain";
import type { CreatePackagingData, FindAllOpts, IPackagingRepo } from "./packaging.types";

export class PackagingUseCases {
  constructor(private repo: IPackagingRepo) {}

  async create(userId: string, data: CreatePackagingData): Promise<Packaging> {
    const errors = validatePackagingData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Packaging> {
    const item = await this.repo.findById(userId, id);
    if (!item) {
      throw new NotFoundError("Embalagem nao encontrada");
    }
    return item;
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
    data: Partial<CreatePackagingData>,
  ): Promise<Packaging> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Embalagem nao encontrada");
    }

    const merged = { ...existing, ...data };
    const errors = validatePackagingData({
      name: merged.name,
      type: merged.type,
      unitCost: merged.unitCost,
      supplier: merged.supplier ?? undefined,
      photoUrl: merged.photoUrl ?? undefined,
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Embalagem nao encontrada");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Embalagem nao encontrada");
    }
  }

  async linkToProduct(
    userId: string,
    packagingId: string,
    productId: string,
  ): Promise<void> {
    const item = await this.repo.findById(userId, packagingId);
    if (!item) {
      throw new NotFoundError("Embalagem nao encontrada");
    }

    await this.repo.linkToProduct(packagingId, productId);
  }

  async unlinkFromProduct(
    userId: string,
    packagingId: string,
    productId: string,
  ): Promise<void> {
    const item = await this.repo.findById(userId, packagingId);
    if (!item) {
      throw new NotFoundError("Embalagem nao encontrada");
    }

    const unlinked = await this.repo.unlinkFromProduct(packagingId, productId);
    if (!unlinked) {
      throw new NotFoundError("Vinculo nao encontrado");
    }
  }
}
