import type { Label, LabelStyle } from "@lucro-caseiro/contracts";

import { LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { getAvailableTemplates, validateLabelData } from "./labels.domain";
import type { LabelTemplate } from "./labels.domain";
import type { CreateLabelData, FindAllOpts, ILabelsRepo } from "./labels.types";

function hasCustomStyle(style?: LabelStyle): boolean {
  return !!style && Object.values(style).some((value) => value != null);
}

export class LabelsUseCases {
  constructor(
    private repo: ILabelsRepo,
    // Estilo customizado e exclusivo do Premium; sem wiring explicito, nega.
    private isPremiumUser: (userId: string) => Promise<boolean> = () =>
      Promise.resolve(false),
  ) {}

  private async assertStyleAllowed(userId: string, style?: LabelStyle): Promise<void> {
    if (!hasCustomStyle(style)) return;
    if (await this.isPremiumUser(userId)) return;
    throw new LimitExceededError(
      "A personalização do rótulo é exclusiva do plano Premium.",
    );
  }

  async create(userId: string, data: CreateLabelData): Promise<Label> {
    const errors = validateLabelData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    await this.assertStyleAllowed(userId, data.data.style);

    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Label> {
    const label = await this.repo.findById(userId, id);
    if (!label) {
      throw new NotFoundError("Rótulo não encontrado");
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
      throw new NotFoundError("Rótulo não encontrado");
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
    await this.assertStyleAllowed(userId, data.data?.style);

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Rótulo não encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Rótulo não encontrado");
    }
  }

  getTemplates(): LabelTemplate[] {
    return getAvailableTemplates();
  }
}
