/**
 * Custo de um insumo na unidade usada pela linha da ficha de custo.
 * Compartilhado entre a API (custo salvo) e o app (prévia na tela), para os dois
 * chegarem ao mesmo valor.
 */
export interface MaterialUnitCostInfo {
  /** Unidade em que o insumo é comprado e contado (ex.: kg, un, lata). */
  unit: string;
  /** Custo de 1 unidade do insumo, em reais. */
  costPerUnit: number;
  /** Quanto vem em 1 unidade (ex.: 1 lata = 350). Opcional. */
  contentPerUnit: number | null;
  /** Unidade do conteúdo (ex.: ml). Opcional. */
  contentUnit: string | null;
}

/** Peso e volume: quanto cada unidade vale na menor unidade da família. */
const STANDARD_UNITS: Record<string, { family: "mass" | "volume"; size: number }> = {
  kg: { family: "mass", size: 1000 },
  g: { family: "mass", size: 1 },
  l: { family: "volume", size: 1000 },
  ml: { family: "volume", size: 1 },
};

function normalizeUnit(unit: string | null | undefined): string {
  return (unit ?? "").trim().toLowerCase();
}

/**
 * Quantas `toUnit` cabem em 1 `fromUnit` (kg→g = 1000, g→kg = 0,001, L→ml = 1000).
 * Retorna `null` quando as unidades não são de peso/volume da mesma família.
 */
export function standardUnitFactor(fromUnit: string, toUnit: string): number | null {
  const from = STANDARD_UNITS[normalizeUnit(fromUnit)];
  const to = STANDARD_UNITS[normalizeUnit(toUnit)];
  if (!from || !to || from.family !== to.family) return null;
  return from.size / to.size;
}

/**
 * Custo de 1 `lineUnit` do insumo. Ordem:
 * 1. linha na unidade do insumo: `costPerUnit`;
 * 2. linha na unidade de conteúdo declarada (1 lata = 350 ml): `costPerUnit / contentPerUnit`;
 * 3. peso/volume da mesma família do insumo (kg↔g, L↔ml): conversão direta;
 * 4. peso/volume da mesma família do conteúdo (1 lata = 395 g, linha em kg);
 * 5. sem conversão conhecida: `costPerUnit`.
 */
export function materialCostPerLineUnit(
  material: MaterialUnitCostInfo,
  lineUnit: string,
): number {
  const { costPerUnit, contentPerUnit, contentUnit } = material;
  const line = normalizeUnit(lineUnit);
  if (line === normalizeUnit(material.unit)) return costPerUnit;

  const hasContent =
    contentPerUnit != null && contentPerUnit > 0 && normalizeUnit(contentUnit) !== "";
  if (hasContent && line === normalizeUnit(contentUnit)) {
    return costPerUnit / contentPerUnit;
  }

  const direct = standardUnitFactor(material.unit, lineUnit);
  if (direct != null) return costPerUnit / direct;

  if (hasContent) {
    const viaContent = standardUnitFactor(contentUnit as string, lineUnit);
    if (viaContent != null) return costPerUnit / (contentPerUnit * viaContent);
  }

  return costPerUnit;
}

/**
 * Unidades que a linha da ficha de custo pode usar para um insumo: a do próprio
 * insumo, a de conteúdo (se declarada) e a irmã de peso/volume (kg↔g, L↔ml).
 */
export function materialLineUnitOptions(
  material: Pick<MaterialUnitCostInfo, "unit" | "contentUnit">,
): string[] {
  const options: string[] = [];
  const seen = new Set<string>();
  const add = (unit: string | null | undefined) => {
    const trimmed = (unit ?? "").trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) return;
    seen.add(key);
    options.push(trimmed);
  };
  const sibling = (unit: string | null | undefined): string | null => {
    switch (normalizeUnit(unit)) {
      case "kg":
        return "g";
      case "g":
        return "kg";
      case "l":
        return "ml";
      case "ml":
        return "L";
      default:
        return null;
    }
  };

  add(material.unit);
  add(material.contentUnit);
  add(sibling(material.unit));
  add(sibling(material.contentUnit));
  return options;
}
