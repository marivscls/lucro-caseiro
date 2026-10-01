import type {
  ExpenseCategory,
  LabelData,
  SupplierCategory,
} from "@lucro-caseiro/contracts";

interface CreateDraftMap {
  materials: {
    name: string;
    unit: string;
    stock: string;
    alertThreshold: string;
    cost: string;
    contentPerUnit: string;
    contentUnit: string;
    notes: string;
    icon: string | null;
    supplierId: string | null;
  };
  packaging: {
    name: string;
    type: "box" | "bag" | "pot" | "film" | "label" | "other";
    unitCost: string;
    supplierId: string | null;
  };
  suppliers: {
    name: string;
    category: SupplierCategory;
    phone: string;
    hasWhatsApp: boolean;
    email: string;
    address: string;
    purchaseDescription: string;
    isPreferred: boolean;
    avatarPresetId: string | null;
  };
  recipes: {
    name: string;
    category: string;
    instructions: string;
    yieldQuantity: string;
    yieldUnit: string;
    step: number;
    lines: { materialId: string; quantity: string; unit: string }[];
  };
  quotes: {
    title: string;
    clientId: string | null;
    clientName: string;
    validUntil: string;
    notes: string;
    discountType: "fixed" | "percentage" | null;
    discountValue: string;
    formStep: number;
    items: {
      productId?: string;
      description: string;
      quantity: string;
      unitPrice: string;
      estimatedUnitCost: string;
    }[];
  };
  labels: {
    name: string;
    templateId: string;
    labelData: LabelData;
    selectedProductId: string | null;
    includeQr: boolean;
    formStep: number;
  };
  recurring: {
    description: string;
    amount: string;
    category: ExpenseCategory;
    day: string;
  };
}
export type CreateDraftFeature = keyof CreateDraftMap;
export type CreateDraftData<K extends CreateDraftFeature> = CreateDraftMap[K];
type Parsed = { ok: boolean; value?: unknown };
type Field = (value: unknown) => Parsed;
const text: Field = (value) => ({
  ok: typeof value === "string" && value.length <= 2000,
  value,
});
const flag: Field = (value) => ({ ok: typeof value === "boolean", value });
const reference: Field = (value) => (value === null ? { ok: true, value } : text(value));
const finite: Field = (value) => ({
  ok: typeof value === "number" && Number.isFinite(value),
  value,
});
const step: Field = (value) => ({
  ok: typeof value === "number" && [1, 2, 3].includes(value),
  value,
});
const choice =
  (...values: unknown[]): Field =>
  (value) => ({ ok: values.includes(value), value });
const optional =
  (field: Field): Field =>
  (value) =>
    value === undefined ? { ok: true } : field(value);
function object(fields: Record<string, Field>): Field {
  return (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false };
    const clean: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(fields)) {
      const parsed = field((value as Record<string, unknown>)[key]);
      if (!parsed.ok) return { ok: false };
      if (parsed.value !== undefined) clean[key] = parsed.value;
    }
    return { ok: true, value: clean };
  };
}
const array =
  (field: Field): Field =>
  (value) => {
    if (!Array.isArray(value) || value.length > 50) return { ok: false };
    const entries = value.map(field);
    return {
      ok: entries.every((entry) => entry.ok),
      value: entries.map((entry) => entry.value),
    };
  };
const labelData = object({
  productName: text,
  note: optional(text),
  manufacturingDate: optional(text),
  expirationDate: optional(text),
  producerName: optional(text),
  producerPhone: optional(text),
  style: optional(
    object({
      accentColor: optional(text),
      bgColor: optional(text),
      font: optional(choice("serif", "sans")),
      borderStyle: optional(choice("solid", "dashed", "double", "none")),
      corner: optional(choice("rounded", "square")),
    }),
  ),
  layout: optional(object({ widthMm: finite, heightMm: finite, copiesPerSheet: finite })),
});
/** Shape checks allow incomplete edits; whitelists exclude files, credentials and API data. */
const schemas: Record<CreateDraftFeature, Field> = {
  materials: object({
    name: text,
    unit: text,
    stock: text,
    alertThreshold: text,
    cost: text,
    contentPerUnit: text,
    contentUnit: text,
    notes: text,
    icon: reference,
    supplierId: reference,
  }),
  packaging: object({
    name: text,
    type: choice("box", "bag", "pot", "film", "label", "other"),
    unitCost: text,
    supplierId: reference,
  }),
  suppliers: object({
    name: text,
    category: choice("supplies", "packaging", "food", "other"),
    phone: text,
    hasWhatsApp: flag,
    email: text,
    address: text,
    purchaseDescription: text,
    isPreferred: flag,
    avatarPresetId: reference,
  }),
  recipes: object({
    name: text,
    category: text,
    instructions: text,
    yieldQuantity: text,
    yieldUnit: text,
    step,
    lines: array(object({ materialId: text, quantity: text, unit: text })),
  }),
  quotes: object({
    title: text,
    clientId: reference,
    clientName: text,
    validUntil: text,
    notes: text,
    discountType: choice("fixed", "percentage", null),
    discountValue: text,
    formStep: step,
    items: array(
      object({
        productId: optional(text),
        description: text,
        quantity: text,
        unitPrice: text,
        estimatedUnitCost: text,
      }),
    ),
  }),
  labels: object({
    name: text,
    templateId: text,
    labelData,
    selectedProductId: reference,
    includeQr: flag,
    formStep: step,
  }),
  recurring: object({
    description: text,
    amount: text,
    category: choice("material", "packaging", "transport", "fee", "utility", "other"),
    day: text,
  }),
};
export const CREATE_DRAFT_FEATURES = Object.keys(schemas) as CreateDraftFeature[];
export function parseCreateDraft<K extends CreateDraftFeature>(
  feature: K,
  value: unknown,
): CreateDraftData<K> | null {
  const result = schemas[feature](value);
  return result.ok ? (result.value as CreateDraftData<K>) : null;
}
