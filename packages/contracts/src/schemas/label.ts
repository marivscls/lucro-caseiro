import { z } from "zod";

export const LabelDataDto = z.object({
  productName: z.string(),
  ingredients: z.string().optional(),
  manufacturingDate: z.string().date().optional(),
  expirationDate: z.string().date().optional(),
  producerName: z.string().optional(),
  producerPhone: z.string().optional(),
  producerAddress: z.string().optional(),
});

export type LabelData = z.infer<typeof LabelDataDto>;

export const CreateLabelDto = z.object({
  productId: z.string().uuid().optional(),
  templateId: z.string().min(1),
  name: z.string().min(1).max(200),
  data: LabelDataDto,
  logoUrl: z.string().url().optional(),
  qrCodeUrl: z.string().url().optional(),
});

export type CreateLabel = z.infer<typeof CreateLabelDto>;

export const UpdateLabelDto = CreateLabelDto.partial();
export type UpdateLabel = z.infer<typeof UpdateLabelDto>;

export const LabelDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  templateId: z.string(),
  name: z.string(),
  data: LabelDataDto,
  logoUrl: z.string().nullable(),
  qrCodeUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type Label = z.infer<typeof LabelDto>;
