import type { SupplierCategory } from "@lucro-caseiro/contracts";

import type { SupplierIllustrationName } from "./components/supplier-illustration";

export type SupplierIllustrationPreset = {
  id: SupplierIllustrationName;
  category: SupplierCategory;
  label: string;
  illustration: SupplierIllustrationName;
  backgroundColor: string;
};

const rose = "#F5E5E8";
const lilac = "#F0ECF7";
const lime = "#F2F5CD";
const yellow = "#FFF3CE";
const warmNeutral = "#F5F3F1";

function preset(
  id: SupplierIllustrationName,
  category: SupplierCategory,
  label: string,
  backgroundColor: string,
): SupplierIllustrationPreset {
  return { id, category, label, illustration: id, backgroundColor };
}

export const SUPPLIER_ILLUSTRATIONS_BY_CATEGORY: Readonly<
  Record<SupplierCategory, readonly SupplierIllustrationPreset[]>
> = {
  supplies: [
    preset("supplies-mixing-bowl", "supplies", "Tigela com batedor", rose),
    preset("supplies-flour-bag", "supplies", "Saco de farinha", lilac),
    preset("supplies-wheat", "supplies", "Ramo de trigo", lime),
    preset("supplies-chocolate", "supplies", "Barra de chocolate", rose),
    preset("supplies-jar", "supplies", "Pote de ingrediente", yellow),
    preset("supplies-box", "supplies", "Caixa de suprimentos", lilac),
  ],
  packaging: [
    preset("packaging-cardboard-box", "packaging", "Caixa de papelão", warmNeutral),
    preset("packaging-bag", "packaging", "Sacola", rose),
    preset("packaging-tape", "packaging", "Rolo de fita", yellow),
    preset("packaging-label", "packaging", "Etiqueta", lime),
    preset("packaging-container", "packaging", "Pote ou embalagem", lilac),
    preset("packaging-set", "packaging", "Conjunto de embalagens", warmNeutral),
  ],
  food: [
    preset("food-produce-crate", "food", "Caixa de frutas e verduras", warmNeutral),
    preset("food-fruit", "food", "Fruta", rose),
    preset("food-vegetables", "food", "Vegetais", lime),
    preset("food-bottle", "food", "Garrafa", lilac),
    preset("food-dairy", "food", "Laticínio ou pote", yellow),
    preset("food-basket", "food", "Cesta de alimentos", rose),
  ],
  other: [
    preset("other-stationery", "other", "Papelaria", yellow),
    preset("other-cleaning", "other", "Materiais de limpeza", lilac),
    preset("other-tools", "other", "Ferramentas", rose),
    preset("other-documents", "other", "Etiquetas ou documentos", lime),
    preset("other-equipment", "other", "Equipamentos", warmNeutral),
    preset("other-box", "other", "Caixa genérica", lilac),
  ],
};

export const SUPPLIER_ILLUSTRATION_PRESETS = Object.values(
  SUPPLIER_ILLUSTRATIONS_BY_CATEGORY,
).flat();

const LEGACY_PRESET_IDS: Readonly<Record<string, SupplierIllustrationName>> = {
  "supplies-bowl": "supplies-mixing-bowl",
  "supplies-flour": "supplies-flour-bag",
  "packaging-box": "packaging-cardboard-box",
  "packaging-ribbon": "packaging-tape",
  "packaging-jar": "packaging-container",
  "packaging-generic": "packaging-set",
  "food-drink": "food-bottle",
  "food-generic": "food-produce-crate",
  "other-materials": "other-box",
  "other-labels": "other-documents",
  "other-generic": "other-box",
};

export function supplierPresets(category: SupplierCategory) {
  return SUPPLIER_ILLUSTRATIONS_BY_CATEGORY[category];
}

export function supplierPreset(id?: string | null) {
  if (!id) return null;
  const canonicalId = LEGACY_PRESET_IDS[id] ?? id;
  return SUPPLIER_ILLUSTRATION_PRESETS.find((item) => item.id === canonicalId) ?? null;
}

export function supplierPresetAfterCategoryChange(
  category: SupplierCategory,
  currentPresetId: string | null,
  hasUpload: boolean,
): string | null {
  if (hasUpload) return currentPresetId;
  const current = supplierPreset(currentPresetId);
  return current && current.category === category
    ? current.id
    : (supplierPresets(category)[0]?.id ?? null);
}
