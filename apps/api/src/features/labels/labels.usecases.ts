import type { Label, LabelData, LabelStyle } from "@lucro-caseiro/contracts";

import { LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import {
  getAvailableTemplates,
  normalizeLabelTemplateId,
  toSimpleLabelData,
  validateLabelData,
} from "./labels.domain";
import type { LabelTemplate } from "./labels.domain";
import type { CreateLabelData, FindAllOpts, ILabelsRepo } from "./labels.types";

function hasCustomStyle(style?: LabelStyle): boolean {
  return !!style && Object.values(style).some((value) => value != null);
}

function presentLabel(label: Label): Label {
  return { ...label, data: toSimpleLabelData(label.data) };
}

export class LabelsUseCases {
  constructor(
    private repo: ILabelsRepo,
    // Estilo customizado e exclusivo do Profissional; sem wiring explicito, nega.
    private hasLabelsPremium: (userId: string) => Promise<boolean> = () =>
      Promise.resolve(false),
  ) {}

  private async assertCustomizationAllowed(
    userId: string,
    data: LabelData,
  ): Promise<void> {
    if (!hasCustomStyle(data.style) && !data.layout) return;
    if (await this.hasLabelsPremium(userId)) return;
    throw new LimitExceededError(
      "A personalização da etiqueta faz parte do plano Profissional.",
    );
  }

  async create(userId: string, data: CreateLabelData): Promise<Label> {
    const normalizedData = {
      ...data,
      templateId: normalizeLabelTemplateId(data.templateId),
      data: toSimpleLabelData(data.data),
    };
    const errors = validateLabelData(normalizedData);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    await this.assertCustomizationAllowed(userId, normalizedData.data);

    return presentLabel(await this.repo.create(userId, normalizedData));
  }

  async getById(userId: string, id: string): Promise<Label> {
    const label = await this.repo.findById(userId, id);
    if (!label) {
      throw new NotFoundError("Etiqueta não encontrada");
    }
    return presentLabel(label);
  }

  async list(userId: string, opts: FindAllOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return {
      items: items.map(presentLabel),
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
      throw new NotFoundError("Etiqueta não encontrada");
    }

    const merged = { ...existing, ...data };
    const templateId = normalizeLabelTemplateId(merged.templateId);
    const errors = validateLabelData({
      name: merged.name,
      templateId,
      data: merged.data,
      productId: merged.productId ?? undefined,
      logoUrl: merged.logoUrl ?? undefined,
      qrCodeUrl: merged.qrCodeUrl ?? undefined,
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    if (data.data) await this.assertCustomizationAllowed(userId, data.data);

    const updated = await this.repo.update(userId, id, {
      ...data,
      templateId,
      ...(data.data ? { data: toSimpleLabelData(data.data) } : {}),
    });
    if (!updated) {
      throw new NotFoundError("Etiqueta não encontrada");
    }
    return presentLabel(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Etiqueta não encontrada");
    }
  }

  getTemplates(): LabelTemplate[] {
    return getAvailableTemplates();
  }
}
