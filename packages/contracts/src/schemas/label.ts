import { z } from "zod";

export const NutritionValueDto = z.object({
  per100: z.string().optional(),
  perServing: z.string().optional(),
  dailyValue: z.string().optional(),
});

export type NutritionValue = z.infer<typeof NutritionValueDto>;

export const NutritionNutrientsDto = z.object({
  energy: NutritionValueDto.optional(),
  carbs: NutritionValueDto.optional(),
  totalSugars: NutritionValueDto.optional(),
  addedSugars: NutritionValueDto.optional(),
  protein: NutritionValueDto.optional(),
  totalFat: NutritionValueDto.optional(),
  saturatedFat: NutritionValueDto.optional(),
  transFat: NutritionValueDto.optional(),
  fiber: NutritionValueDto.optional(),
  sodium: NutritionValueDto.optional(),
});

export type NutritionNutrients = z.infer<typeof NutritionNutrientsDto>;

// Estrutura da tabela da RDC 429/2020 e da IN 75/2020. Os campos legados no
// final mantem rotulos salvos antes da adocao do modelo oficial legiveis.
export const NutritionFactsDto = z.object({
  servingsPerPackage: z.string().optional(),
  servingSize: z.string().optional(),
  householdMeasure: z.string().optional(),
  referenceAmount: z.string().optional(),
  nutrients: NutritionNutrientsDto.optional(),
  calories: z.string().optional(),
  carbs: z.string().optional(),
  sugars: z.string().optional(),
  protein: z.string().optional(),
  totalFat: z.string().optional(),
  satFat: z.string().optional(),
  fiber: z.string().optional(),
  sodium: z.string().optional(),
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
  note: z.string().optional(),
  ingredients: z.string().optional(),
  manufacturingDate: z.string().date().optional(),
  expirationDate: z.string().date().optional(),
  producerName: z.string().optional(),
  producerPhone: z.string().optional(),
  producerAddress: z.string().optional(),
  netContent: z.string().optional(),
  lotCode: z.string().optional(),
  allergenWarning: z.string().optional(),
  lactoseWarning: z.string().optional(),
  glutenWarning: z.string().optional(),
  additiveWarning: z.string().optional(),
  conservationInstructions: z.string().optional(),
  preparationInstructions: z.string().optional(),
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
