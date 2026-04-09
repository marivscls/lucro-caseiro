import type { Label, LabelData } from "@lucro-caseiro/contracts";

export interface ILabelsRepo {
  create(userId: string, data: CreateLabelData): Promise<Label>;
  findById(userId: string, id: string): Promise<Label | null>;
  findAll(userId: string, opts: FindAllOpts): Promise<{ items: Label[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: Partial<CreateLabelData>,
  ): Promise<Label | null>;
  delete(userId: string, id: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
}

export interface CreateLabelData {
  productId?: string;
  templateId: string;
  name: string;
  data: LabelData;
  logoUrl?: string;
  qrCodeUrl?: string;
}

export interface FindAllOpts {
  page: number;
  limit: number;
  productId?: string;
}
