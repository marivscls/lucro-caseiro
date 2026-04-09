import type { Label } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { getAvailableTemplates, validateLabelData } from "./labels.domain";
import type { LabelTemplate } from "./labels.domain";
import type { CreateLabelData, FindAllOpts, ILabelsRepo } from "./labels.types";

export class LabelsUseCases {
  constructor(private repo: ILabelsRepo) {}

  async create(userId: string, data: CreateLabelData): Promise<Label> {
    const errors = validateLabelData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Label> {
    const label = await this.repo.findById(userId, id);
    if (!label) {
      throw new NotFoundError("Rotulo nao encontrado");
    }
    return label;
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
    data: Partial<CreateLabelData>,
  ): Promise<Label> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Rotulo nao encontrado");
    }

    const merged = { ...existing, ...data };
    const errors = validateLabelData({
      name: merged.name,
      templateId: merged.templateId,
      data: merged.data,
      productId: merged.productId ?? undefined,
      logoUrl: merged.logoUrl ?? undefined,
      qrCodeUrl: merged.qrCodeUrl ?? undefined,
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Rotulo nao encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Rotulo nao encontrado");
    }
  }

  getTemplates(): LabelTemplate[] {
    return getAvailableTemplates();
  }
}
