import { z } from "zod";

// Informacao nutricional simplificada (valores como string livre, ex: "12 g").
// Layout informativo — nao e o template certificado ANVISA RDC 429/2020.
export const NutritionFactsDto = z.object({
  servingSize: z.string().optional(), // porcao, ex: "30 g (1 unidade)"
  calories: z.string().optional(), // valor energetico (kcal)
  carbs: z.string().optional(), // carboidratos
  sugars: z.string().optional(), // acucares totais
  protein: z.string().optional(), // proteinas
  totalFat: z.string().optional(), // gorduras totais
  satFat: z.string().optional(), // gorduras saturadas
  fiber: z.string().optional(), // fibra alimentar
  sodium: z.string().optional(), // sodio
});

export type NutritionFacts = z.infer<typeof NutritionFactsDto>;

// Estilo customizado do rotulo (personalizacao Premium; gate no backend).
// Quando ausente, o template escolhido define o visual.
export const LabelStyleDto = z.object({
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  bgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  font: z.enum(["serif", "sans"]).optional(),
  borderStyle: z.enum(["solid", "dashed", "double", "none"]).optional(),
  corner: z.enum(["rounded", "square"]).optional(),
});

export type LabelStyle = z.infer<typeof LabelStyleDto>;

export const LabelDataDto = z.object({
  productName: z.string(),
  ingredients: z.string().optional(),
  manufacturingDate: z.string().date().optional(),
  expirationDate: z.string().date().optional(),
  producerName: z.string().optional(),
  producerPhone: z.string().optional(),
  producerAddress: z.string().optional(),
  nutrition: NutritionFactsDto.optional(),
  style: LabelStyleDto.optional(),
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

export const UpdateLabelDto = CreateLabelDto.partial().extend({
  // Nullable no update para permitir remover o logo/QR de um rotulo ja salvo.
  logoUrl: z.string().url().nullable().optional(),
  qrCodeUrl: z.string().url().nullable().optional(),
});
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
