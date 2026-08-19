import type { Supplier } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validateSupplierData } from "./suppliers.domain";
import type { CreateSupplierData, FindAllOpts, ISuppliersRepo } from "./suppliers.types";

function normalizeSupplierInput(
  data: Partial<CreateSupplierData>,
): Partial<CreateSupplierData> {
  const normalized = { ...data };
  if (data.name !== undefined) normalized.name = data.name.trim();
  if (data.phone !== undefined) normalized.phone = data.phone?.replace(/\D/g, "") || null;
  if (data.email !== undefined)
    normalized.email = data.email?.trim().toLowerCase() || null;
  if (data.address !== undefined) normalized.address = data.address?.trim() || null;
  if (data.purchaseDescription !== undefined) {
    normalized.purchaseDescription = data.purchaseDescription?.trim() || null;
  }
  if (data.notes !== undefined) normalized.notes = data.notes?.trim() || null;
  return normalized;
}

export class SuppliersUseCases {
  constructor(private repo: ISuppliersRepo) {}

  async create(userId: string, data: CreateSupplierData): Promise<Supplier> {
    const normalized = normalizeSupplierInput(data) as CreateSupplierData;
    const errors = validateSupplierData(normalized);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const duplicate = await this.repo.findDuplicate(userId, normalized);
    if (duplicate) {
      throw new ValidationError([
        "Esse fornecedor já existe ou usa um contato já cadastrado.",
      ]);
    }

    return this.repo.create(userId, normalized);
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

  async overview(userId: string, now = new Date()) {
    return this.repo.getOverview(userId, now);
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

    const normalizedPatch = normalizeSupplierInput(data);
    const merged = { ...existing, ...normalizedPatch };
    const errors = validateSupplierData({
      name: merged.name,
      phone: merged.phone ?? undefined,
      email: merged.email ?? undefined,
      address: merged.address ?? undefined,
      category: merged.category,
      hasWhatsApp: merged.hasWhatsApp,
      purchaseDescription: merged.purchaseDescription ?? undefined,
      notes: merged.notes ?? undefined,
      isPreferred: merged.isPreferred,
      avatarType: merged.avatarType,
      avatarPresetId: merged.avatarPresetId ?? undefined,
      avatarUrl: merged.avatarUrl ?? undefined,
      needsFollowUp: merged.needsFollowUp,
      restockSoon: merged.restockSoon,
      isActive: merged.isActive,
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const duplicate = await this.repo.findDuplicate(
      userId,
      {
        name: merged.name,
        phone: merged.phone ?? undefined,
        email: merged.email ?? undefined,
      },
      id,
    );
    if (duplicate) {
      throw new ValidationError([
        "Esse fornecedor já existe ou usa um contato já cadastrado.",
      ]);
    }

    const updated = await this.repo.update(userId, id, normalizedPatch);
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
