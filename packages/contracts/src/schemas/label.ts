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

export const DEFAULT_LABEL_LAYOUT = {
  widthMm: 90,
  heightMm: 60,
  copiesPerSheet: 8,
} as const;

export const LABEL_LAYOUT_LIMITS = {
  minWidthMm: 40,
  maxWidthMm: 190,
  minHeightMm: 25,
  maxHeightMm: 277,
  sheetWidthMm: 190,
  sheetHeightMm: 277,
  gapMm: 4,
} as const;

export function calculateLabelSheetCapacity(widthMm: number, heightMm: number): number {
  const columns = Math.floor(
    (LABEL_LAYOUT_LIMITS.sheetWidthMm + LABEL_LAYOUT_LIMITS.gapMm) /
      (widthMm + LABEL_LAYOUT_LIMITS.gapMm),
  );
  const rows = Math.floor(
    (LABEL_LAYOUT_LIMITS.sheetHeightMm + LABEL_LAYOUT_LIMITS.gapMm) /
      (heightMm + LABEL_LAYOUT_LIMITS.gapMm),
  );
  return Math.max(1, columns * rows);
}

export const LabelLayoutDto = z
  .object({
    widthMm: z
      .number()
      .min(LABEL_LAYOUT_LIMITS.minWidthMm)
      .max(LABEL_LAYOUT_LIMITS.maxWidthMm),
    heightMm: z
      .number()
      .min(LABEL_LAYOUT_LIMITS.minHeightMm)
      .max(LABEL_LAYOUT_LIMITS.maxHeightMm),
    copiesPerSheet: z.number().int().min(1),
  })
  .superRefine((layout, context) => {
    const capacity = calculateLabelSheetCapacity(layout.widthMm, layout.heightMm);
    if (layout.copiesPerSheet > capacity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["copiesPerSheet"],
        message: `Cabem no máximo ${capacity} etiquetas desse tamanho em uma folha A4`,
      });
    }
  });

export type LabelLayout = z.infer<typeof LabelLayoutDto>;

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
  layout: LabelLayoutDto.optional(),
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
