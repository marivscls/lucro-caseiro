import type { NutritionFacts } from "@lucro-caseiro/contracts";

/** Campos da informação nutricional, na ordem em que aparecem (form, preview e PDF). */
export const NUTRITION_FIELDS: {
  key: keyof NutritionFacts;
  label: string;
  placeholder: string;
}[] = [
  { key: "servingSize", label: "Porção", placeholder: "Ex: 30 g (1 unidade)" },
  { key: "calories", label: "Valor energético", placeholder: "Ex: 120 kcal" },
  { key: "carbs", label: "Carboidratos", placeholder: "Ex: 15 g" },
  { key: "sugars", label: "Açúcares totais", placeholder: "Ex: 12 g" },
  { key: "protein", label: "Proteínas", placeholder: "Ex: 2 g" },
  { key: "totalFat", label: "Gorduras totais", placeholder: "Ex: 6 g" },
  { key: "satFat", label: "Gorduras saturadas", placeholder: "Ex: 3 g" },
  { key: "fiber", label: "Fibra alimentar", placeholder: "Ex: 1 g" },
  { key: "sodium", label: "Sódio", placeholder: "Ex: 45 mg" },
];

/** True se houver pelo menos um valor nutricional preenchido. */
export function hasNutrition(nutrition?: NutritionFacts | null): boolean {
  if (!nutrition) return false;
  return NUTRITION_FIELDS.some((field) => nutrition[field.key]?.trim());
}

/** Remove o objeto se vazio (não envia nutrition em branco). */
export function cleanNutrition(
  nutrition?: NutritionFacts | null,
): NutritionFacts | undefined {
  return hasNutrition(nutrition) ? (nutrition ?? undefined) : undefined;
}
